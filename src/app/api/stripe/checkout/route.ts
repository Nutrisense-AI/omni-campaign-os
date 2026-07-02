import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { stripe, PRICE_IDS } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { tier } = await req.json();
  const priceId = PRICE_IDS[tier as keyof typeof PRICE_IDS];
  if (!priceId)
    return NextResponse.json({ error: "Invalid tier" }, { status: 400 });

  const admin = createSupabaseAdminClient();
  const { data: profile } = await admin
    .from("users")
    .select("stripe_customer_id, email")
    .eq("id", user.id)
    .single();

  // Ensure a Stripe customer exists
  let customerId = profile?.stripe_customer_id;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email || profile?.email || undefined,
      metadata: { supabase_user_id: user.id },
    });
    customerId = customer.id;
    await admin
      .from("users")
      .update({ stripe_customer_id: customerId })
      .eq("id", user.id);
  }

  const origin =
    req.headers.get("origin") ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "http://localhost:3000";

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/dashboard?checkout=success`,
    cancel_url: `${origin}/dashboard/billing?checkout=cancelled`,
    metadata: { supabase_user_id: user.id, tier },
    subscription_data: {
      metadata: { supabase_user_id: user.id, tier },
    },
  });

  return NextResponse.json({ url: session.url });
}
