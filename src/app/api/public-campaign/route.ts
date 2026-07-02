import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

// Returns the landing_page_html + owner id for a public campaign id.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from("campaigns")
    .select("id, user_id, landing_page_html, status")
    .eq("id", id)
    .single();

  if (!data || data.status !== "complete") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({
    ownerId: data.user_id,
    html: data.landing_page_html,
  });
}
