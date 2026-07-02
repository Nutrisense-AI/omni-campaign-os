import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Sparkles, Wand2, Clock, CheckCircle2, XCircle, Loader2 } from "lucide-react";

function StatusPill({ status }: { status: string }) {
  type IconType = React.ComponentType<{ className?: string }>;
  const map: Record<string, { icon: IconType; cls: string; label: string }> = {
    complete: { icon: CheckCircle2, cls: "text-emerald-400", label: "Complete" },
    processing: { icon: Loader2, cls: "text-accent animate-spin", label: "Processing" },
    pending: { icon: Clock, cls: "text-yellow-400", label: "Pending" },
    failed: { icon: XCircle, cls: "text-red-400", label: "Failed" },
  };
  const m = map[status] || map.pending;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted">
      <m.icon className={`h-3.5 w-3.5 ${m.cls}`} /> {m.label}
    </span>
  );
}

export default async function CampaignsPage() {
  const supabase = createSupabaseServerClient();
  const { data: campaigns } = await supabase
    .from("campaigns")
    .select("id, prompt, status, image_url, created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Campaigns</h1>
        <Link href="/dashboard/create" className="inline-flex items-center gap-2 rounded-xl bg-[linear-gradient(90deg,var(--brand),var(--brand-2))] px-4 py-2.5 text-sm font-semibold text-white">
          <Wand2 className="h-4 w-4" /> New campaign
        </Link>
      </div>

      {campaigns && campaigns.length > 0 ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {campaigns.map((c) => (
            <Link key={c.id} href={`/dashboard/campaigns/${c.id}`} className="group overflow-hidden rounded-2xl border border-borderc bg-card transition hover:border-brand">
              <div className="aspect-video w-full overflow-hidden bg-elev">
                {c.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.image_url} alt="" className="h-full w-full object-cover transition group-hover:scale-105" />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Sparkles className="h-8 w-8 text-muted" />
                  </div>
                )}
              </div>
              <div className="p-4">
                <p className="line-clamp-2 text-sm font-medium">{c.prompt}</p>
                <div className="mt-2">
                  <StatusPill status={c.status} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="mt-8 rounded-2xl border border-dashed border-borderc p-12 text-center">
          <Wand2 className="mx-auto mb-3 h-8 w-8 text-muted" />
          <p className="text-muted">No campaigns yet.</p>
          <Link href="/dashboard/create" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[linear-gradient(90deg,var(--brand),var(--brand-2))] px-4 py-2 text-sm font-semibold text-white">
            <Wand2 className="h-4 w-4" /> Create your first campaign
          </Link>
        </div>
      )}
    </div>
  );
}
