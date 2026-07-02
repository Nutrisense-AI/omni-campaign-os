import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

// CORS: published landing pages may be hosted anywhere.
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { headers: CORS });
}

/**
 * Public endpoint used by generated landing pages + chat widget.
 * type=lead    -> inserts into leads
 * type=message -> inserts into messages (unified inbox, platform=website)
 * Requires ownerId (the user_id who owns the campaign/site).
 */
export async function POST(req: Request) {
  const admin = createSupabaseAdminClient();
  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Bad JSON" }, { status: 400, headers: CORS });
  }

  const { type, ownerId } = body;
  if (!ownerId)
    return NextResponse.json({ error: "Missing ownerId" }, { status: 400, headers: CORS });

  if (type === "lead") {
    await admin.from("leads").insert({
      user_id: ownerId,
      name: body.name ?? null,
      email: body.email ?? null,
      phone: body.phone ?? null,
      status: "new",
    });
    // Also add to subscribers list if an email was provided.
    if (body.email) {
      await admin
        .from("subscribers")
        .insert({ user_id: ownerId, email: body.email });
    }
    return NextResponse.json({ ok: true }, { headers: CORS });
  }

  if (type === "message") {
    await admin.from("messages").insert({
      user_id: ownerId,
      platform: "website",
      sender_name: body.name ?? "Website Visitor",
      message_text: body.message ?? "",
      status: "pending",
    });
    return NextResponse.json({ ok: true }, { headers: CORS });
  }

  return NextResponse.json({ error: "Unknown type" }, { status: 400, headers: CORS });
}
