import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const resend = new Resend(process.env.RESEND_API_KEY!);
const FROM = process.env.RESEND_FROM || "OmniCampaign <onboarding@resend.dev>";

export async function POST(req: Request) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { subject, html } = await req.json();
  if (!subject || !html)
    return NextResponse.json({ error: "Missing subject/html" }, { status: 400 });

  const { data: subs } = await supabase.from("subscribers").select("email");
  const recipients = (subs || []).map((s) => s.email).filter(Boolean);
  if (recipients.length === 0)
    return NextResponse.json({ error: "No subscribers yet." }, { status: 400 });

  // Send individually to preserve privacy (no shared To:).
  let sent = 0;
  const errors: string[] = [];
  for (const to of recipients) {
    try {
      await resend.emails.send({ from: FROM, to, subject, html });
      sent++;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      errors.push(`${to}: ${msg.slice(0, 120)}`);
    }
  }

  return NextResponse.json({ sent, total: recipients.length, errors });
}
