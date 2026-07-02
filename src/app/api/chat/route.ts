import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { tweakCampaignJSON, type CampaignJSON } from "@/lib/ai/claude";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(req: Request) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { campaignId, instruction } = await req.json();
  if (!campaignId || !instruction) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  const { data: campaign } = await admin
    .from("campaigns")
    .select("output_data, user_id")
    .eq("id", campaignId)
    .single();

  if (!campaign || campaign.user_id !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const updated = await tweakCampaignJSON(
      campaign.output_data as CampaignJSON,
      instruction
    );
    await admin
      .from("campaigns")
      .update({
        output_data: updated,
        landing_page_html: updated.landing_page_html,
      })
      .eq("id", campaignId);
    return NextResponse.json({ output_data: updated });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { error: "Co-pilot failed: " + msg.slice(0, 200) },
      { status: 500 }
    );
  }
}
