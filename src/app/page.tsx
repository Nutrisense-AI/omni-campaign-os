import Link from "next/link";
import {
  Sparkles,
  Wand2,
  Image as ImageIcon,
  Video,
  Globe,
  Users,
  Mail,
  ArrowRight,
  Check,
} from "lucide-react";
import { formatCurrencyAUD } from "@/lib/utils";

const FEATURES = [
  { icon: Wand2, title: "AI Campaign Copy", desc: "Instagram captions, Facebook ads, and a full TikTok script from one prompt." },
  { icon: ImageIcon, title: "Stunning Visuals", desc: "On-brand hero images generated automatically with gpt-image-1." },
  { icon: Video, title: "Voiced Video", desc: "A 15-second vertical video with AI voiceover, captions, and motion." },
  { icon: Globe, title: "Live Landing Page", desc: "A responsive, conversion-ready page with a built-in lead form." },
  { icon: Users, title: "CRM Kanban", desc: "Every lead lands on a drag-and-drop board: New, Contacted, Won, Lost." },
  { icon: Mail, title: "Email Marketing", desc: "Broadcast to your subscriber list in a click, powered by Resend." },
];

const PLANS = [
  { tier: "starter", name: "Starter", price: 5900, credits: 15, features: ["15 campaigns / mo", "All AI generators", "CRM + Inbox", "Email broadcasts"] },
  { tier: "pro", name: "Pro", price: 19900, credits: 50, popular: true, features: ["50 campaigns / mo", "Everything in Starter", "Priority rendering", "Landing page hosting"] },
  { tier: "agency", name: "Agency", price: 49900, credits: 200, features: ["200 campaigns / mo", "Everything in Pro", "Highest priority", "Best for teams"] },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-bg text-text">
      <header className="sticky top-0 z-30 glass">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-2 text-lg font-bold">
            <Sparkles className="h-5 w-5 text-accent" />
            <span>Omni<span className="gradient-text">Campaign</span></span>
          </div>
          <nav className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-muted hover:text-text">Log in</Link>
            <Link href="/login" className="rounded-xl bg-[linear-gradient(90deg,var(--brand),var(--brand-2))] px-4 py-2 text-sm font-semibold text-white">
              Start free
            </Link>
          </nav>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -top-32 left-1/2 h-96 w-[42rem] -translate-x-1/2 rounded-full bg-brand/30 blur-[140px]" />
        <div className="mx-auto max-w-4xl px-5 pt-24 pb-16 text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-borderc bg-white/5 px-4 py-1.5 text-xs text-muted">
            <Sparkles className="h-3.5 w-3.5 text-accent" /> Your entire marketing team, in one prompt
          </div>
          <h1 className="text-balance text-5xl font-extrabold leading-tight sm:text-6xl">
            Describe your business.{" "}
            <span className="gradient-text">Get a full campaign</span> in minutes.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted">
            OmniCampaign turns a single sentence into ad copy, a scroll-stopping
            image, a voiced vertical video, and a live landing page — then
            captures every lead into your CRM and inbox.
          </p>
          <div className="mt-9 flex items-center justify-center gap-3">
            <Link href="/login" className="inline-flex items-center gap-2 rounded-xl bg-[linear-gradient(90deg,var(--brand),var(--brand-2))] px-6 py-3.5 font-semibold text-white">
              Generate your first campaign <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <p className="mt-3 text-xs text-muted">2 free campaigns · No credit card required</p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="text-center text-3xl font-bold">One prompt. Everything you need to launch.</h2>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-2xl border border-borderc bg-card p-6">
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[linear-gradient(135deg,var(--brand),var(--brand-2))]">
                <f.icon className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="text-center text-3xl font-bold">Simple, credit-based pricing</h2>
        <p className="mt-3 text-center text-muted">One credit = one full multi-asset campaign. Prices in AUD.</p>
        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {PLANS.map((p) => (
            <div key={p.tier} className={`relative rounded-2xl border p-7 ${p.popular ? "border-brand bg-card" : "border-borderc bg-card"}`}>
              {p.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[linear-gradient(90deg,var(--brand),var(--brand-2))] px-3 py-1 text-xs font-semibold text-white">
                  Most popular
                </span>
              )}
              <h3 className="text-xl font-bold">{p.name}</h3>
              <div className="mt-3 flex items-end gap-1">
                <span className="text-4xl font-extrabold">{formatCurrencyAUD(p.price)}</span>
                <span className="pb-1 text-muted">/mo</span>
              </div>
              <p className="mt-1 text-sm text-accent">{p.credits} campaign credits / month</p>
              <ul className="mt-5 space-y-2.5">
                {p.features.map((feat) => (
                  <li key={feat} className="flex items-center gap-2 text-sm text-muted">
                    <Check className="h-4 w-4 text-accent" /> {feat}
                  </li>
                ))}
              </ul>
              <Link href="/login" className="mt-6 block rounded-xl bg-[linear-gradient(90deg,var(--brand),var(--brand-2))] py-3 text-center text-sm font-semibold text-white">
                Get {p.name}
              </Link>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-borderc py-10 text-center text-sm text-muted">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 px-5">
          <div className="flex items-center gap-2 font-semibold text-text">
            <Sparkles className="h-4 w-4 text-accent" /> OmniCampaign
          </div>
          <p>© {new Date().getFullYear()} OmniCampaign. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
