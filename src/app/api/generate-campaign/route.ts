import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { runCampaignPipeline } from "@/lib/pipeline";

export const runtime = "nodejs";
export const maxDuration = 300; // allow long-running generation where the plan permits

export async function POST(req: Request) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { prompt } = await req.json().catch(() => ({ prompt: "" }));
  if (!prompt || typeof prompt !== "string" || prompt.trim().length < 3) {
    return NextResponse.json({ error: "Please provide a prompt." }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();

  // Check credit balance
  const { data: profile } = await admin
    .from("users")
    .select("credit_balance")
    .eq("id", user.id)
    .single();
  if (!profile || (profile.credit_balance ?? 0) <= 0) {
    return NextResponse.json(
      { error: "You are out of credits. Please upgrade your plan." },
      { status: 402 }
    );
  }

  // Insert pending campaign
  const { data: campaign, error } = await admin
    .from("campaigns")
    .insert({ user_id: user.id, prompt: prompt.trim(), status: "pending" })
    .select("id")
    .single();
  if (error || !campaign) {
    return NextResponse.json({ error: "Could not create campaign." }, { status: 500 });
  }

  // Kick off pipeline WITHOUT blocking the response (async, frontend polls).
  // We intentionally do not await; on serverless this runs within the function
  // lifetime (maxDuration). The frontend polls the campaigns row every 3s.
  runCampaignPipeline(campaign.id, user.id, prompt.trim()).catch((e) =>
    console.error("pipeline crash", e)
  );

  return NextResponse.json({ id: campaign.id, status: "pending" });
}
