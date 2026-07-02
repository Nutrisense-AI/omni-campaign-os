import { NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { priceIdToTier, TIER_CONFIG } from "@/lib/utils";

export const runtime = "nodejs";

// Stripe needs the raw body to verify the signature.
async function readRawBody(req: Request): Promise<string> {
  return await req.text();
}

async function grantCreditsForTier(customerId: string, tier: string) {
  const admin = createSupabaseAdminClient();
  const cfg = TIER_CONFIG[tier as keyof typeof TIER_CONFIG];
  if (!cfg) return;

  const { data: profile } = await admin
    .from("users")
    .select("id, credit_balance")
    .eq("stripe_customer_id", customerId)
    .single();
  if (!profile) return;

  // Add the tier's credit allotment to the current balance (top-up model).
  const newBalance = (profile.credit_balance ?? 0) + cfg.credits;
  await admin
    .from("users")
    .update({ credit_balance: newBalance, subscription_tier: tier })
    .eq("id", profile.id);
}

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const raw = await readRawBody(req);

  let event: Stripe.Event;
  try {
    if (!sig || !secret) throw new Error("Missing signature/secret");
    event = stripe.webhooks.constructEvent(raw, sig, secret);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Webhook signature verification failed:", msg);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const tier = (session.metadata?.tier as string) || "";
        const customerId = session.customer as string;
        if (customerId && tier) await grantCreditsForTier(customerId, tier);
        break;
      }
      // Recurring renewals: top up credits again each billing period.
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        // Skip the very first invoice (already handled by checkout.session.completed)
        if (invoice.billing_reason === "subscription_cycle") {
          const customerId = invoice.customer as string;
          const line = invoice.lines?.data?.[0];
          type LineItem = { price?: { id: string } };
          const priceId = (line as LineItem | undefined)?.price?.id;
          const tier = priceId ? priceIdToTier(priceId) : null;
          if (customerId && tier) await grantCreditsForTier(customerId, tier);
        }
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;
        await admin
          .from("users")
          .update({ subscription_tier: "free" })
          .eq("stripe_customer_id", customerId);
        break;
      }
      default:
        break;
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Webhook handler error:", msg);
    return NextResponse.json({ error: "Handler error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
