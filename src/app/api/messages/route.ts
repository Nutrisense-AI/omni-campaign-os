import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { draftReply } from "@/lib/ai/claude";

export const runtime = "nodejs";

export async function GET() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ messages: data });
}

// Generate an AI draft reply for a message, or mark it replied.
export async function POST(req: Request) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, action } = await req.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const admin = createSupabaseAdminClient();
  const { data: message } = await admin
    .from("messages")
    .select("*")
    .eq("id", id)
    .single();
  if (!message || message.user_id !== user.id)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (action === "draft") {
    const draft = await draftReply(
      message.sender_name || "Customer",
      message.message_text || ""
    );
    await admin.from("messages").update({ ai_draft_reply: draft }).eq("id", id);
    return NextResponse.json({ ai_draft_reply: draft });
  }

  if (action === "mark_replied") {
    await admin.from("messages").update({ status: "replied" }).eq("id", id);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
