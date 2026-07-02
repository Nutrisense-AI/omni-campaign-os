import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Wand2, Sparkles, Users, Inbox, ArrowRight } from "lucide-react";

export default async function OverviewPage() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ count: campaignCount }, { count: leadCount }, { count: msgCount }, { data: recent }] =
    await Promise.all([
      supabase.from("campaigns").select("id", { count: "exact", head: true }),
      supabase.from("leads").select("id", { count: "exact", head: true }),
      supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending"),
      supabase
        .from("campaigns")
        .select("id, prompt, status, created_at, image_url")
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

  const stats = [
    { label: "Campaigns", value: campaignCount ?? 0, icon: Sparkles, href: "/dashboard/campaigns" },
    { label: "Leads", value: leadCount ?? 0, icon: Users, href: "/dashboard/crm" },
    { label: "Unread messages", value: msgCount ?? 0, icon: Inbox, href: "/dashboard/inbox" },
  ];

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Welcome back 👋</h1>
          <p className="mt-1 text-sm text-muted">{user?.email}</p>
        </div>
        <Link
          href="/dashboard/create"
          className="inline-flex items-center gap-2 rounded-xl bg-[linear-gradient(90deg,var(--brand),var(--brand-2))] px-4 py-2.5 text-sm font-semibold text-white"
        >
          <Wand2 className="h-4 w-4" /> New campaign
        </Link>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="rounded-2xl border border-borderc bg-card p-5 transition hover:border-brand">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted">{s.label}</span>
              <s.icon className="h-4 w-4 text-accent" />
            </div>
            <div className="mt-3 text-3xl font-extrabold">{s.value}</div>
          </Link>
        ))}
      </div>

      <div className="mt-10">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent campaigns</h2>
          <Link href="/dashboard/campaigns" className="flex items-center gap-1 text-sm text-accent">
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        {recent && recent.length > 0 ? (
          <div className="space-y-2">
            {recent.map((c) => (
              <Link
                key={c.id}
                href={`/dashboard/campaigns/${c.id}`}
                className="flex items-center gap-4 rounded-xl border border-borderc bg-card p-3 transition hover:border-brand"
              >
                {c.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.image_url} alt="" className="h-12 w-12 rounded-lg object-cover" />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-elev">
                    <Sparkles className="h-5 w-5 text-muted" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{c.prompt}</p>
                  <p className="text-xs capitalize text-muted">{c.status}</p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-borderc p-10 text-center">
            <Wand2 className="mx-auto mb-3 h-8 w-8 text-muted" />
            <p className="text-muted">No campaigns yet. Create your first one!</p>
            <Link href="/dashboard/create" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[linear-gradient(90deg,var(--brand),var(--brand-2))] px-4 py-2 text-sm font-semibold text-white">
              <Wand2 className="h-4 w-4" /> Create campaign
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
