"use client";
import { useState } from "react";
import { Button } from "@/components/ui";
import { Check, Zap, CreditCard } from "lucide-react";

const PLANS = [
  { tier: "starter", name: "Starter", price: "A$59", credits: 15, features: ["15 campaigns / mo", "All AI generators", "CRM + Inbox", "Email broadcasts"] },
  { tier: "pro", name: "Pro", price: "A$199", credits: 50, popular: true, features: ["50 campaigns / mo", "Everything in Starter", "Priority rendering", "Landing page hosting"] },
  { tier: "agency", name: "Agency", price: "A$499", credits: 200, features: ["200 campaigns / mo", "Everything in Pro", "Highest priority", "Best for teams"] },
];

export default function BillingPage() {
  const [loading, setLoading] = useState<string | null>(null);

  async function subscribe(tier: string) {
    setLoading(tier);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier }),
      });
      const json = await res.json();
      if (json.url) window.location.href = json.url;
      else alert(json.error || "Could not start checkout");
    } finally {
      setLoading(null);
    }
  }

  async function manage() {
    setLoading("portal");
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const json = await res.json();
      if (json.url) window.location.href = json.url;
      else alert(json.error || "No billing account yet");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <CreditCard className="h-6 w-6" /> Billing &amp; Plans
          </h1>
          <p className="mt-1 text-sm text-muted">Choose a plan. One credit = one full campaign. Prices in AUD.</p>
        </div>
        <Button variant="outline" onClick={manage} loading={loading === "portal"}>
          Manage subscription
        </Button>
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-3">
        {PLANS.map((p) => (
          <div key={p.tier} className={`relative rounded-2xl border p-7 ${p.popular ? "border-brand bg-card" : "border-borderc bg-card"}`}>
            {p.popular && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[linear-gradient(90deg,var(--brand),var(--brand-2))] px-3 py-1 text-xs font-semibold text-white">
                Most popular
              </span>
            )}
            <h3 className="text-xl font-bold">{p.name}</h3>
            <div className="mt-3 flex items-end gap-1">
              <span className="text-4xl font-extrabold">{p.price}</span>
              <span className="pb-1 text-muted">/mo</span>
            </div>
            <p className="mt-1 flex items-center gap-1 text-sm text-accent">
              <Zap className="h-3.5 w-3.5" /> {p.credits} credits / month
            </p>
            <ul className="mt-5 space-y-2.5">
              {p.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-muted">
                  <Check className="h-4 w-4 text-accent" /> {f}
                </li>
              ))}
            </ul>
            <Button className="mt-6 w-full" onClick={() => subscribe(p.tier)} loading={loading === p.tier}>
              Subscribe to {p.name}
            </Button>
          </div>
        ))}
      </div>
      <p className="mt-6 text-center text-xs text-muted">
        Secure checkout by Stripe. You&apos;ll be redirected to Stripe&apos;s payment page. Test mode is active.
      </p>
    </div>
  );
}
