import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

/**
 * Vercel Cron target. Processes scheduled_posts whose time has arrived.
 * Since live Meta publishing is out of scope for V1, "posting" simply marks
 * the record as posted (the asset is ready for the user to download/post
 * manually). This keeps the scheduling data model and cron wiring in place
 * for a future live-publishing upgrade.
 */
export async function GET(req: Request) {
  // Protect with a secret so only Vercel Cron (or the owner) can trigger it.
  const auth = req.headers.get("authorization");
  if (
    process.env.CRON_SECRET &&
    auth !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createSupabaseAdminClient();
  const now = new Date().toISOString();
  const { data: due } = await admin
    .from("scheduled_posts")
    .select("id")
    .eq("status", "scheduled")
    .lte("scheduled_time", now);

  const ids = (due || []).map((d) => d.id);
  if (ids.length > 0) {
    await admin
      .from("scheduled_posts")
      .update({ status: "posted" })
      .in("id", ids);
  }

  return NextResponse.json({ processed: ids.length });
}
