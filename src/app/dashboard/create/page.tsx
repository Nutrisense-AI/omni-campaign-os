"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui";
import { Wand2, Loader2, Sparkles } from "lucide-react";

const EXAMPLES = [
  "A cozy artisan coffee shop opening this Friday in Melbourne",
  "A premium dog-walking service for busy professionals",
  "An online course that teaches beginners to invest",
  "A boutique yoga studio's new sunrise membership",
];

export default function CreatePage() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const [prompt, setPrompt] = useState("");
  const [starting, setStarting] = useState(false);
  const [campaignId, setCampaignId] = useState<string | null>(null);
  const [step, setStep] = useState("Starting...");
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  async function start() {
    setError(null);
    setStarting(true);
    try {
      const res = await fetch("/api/generate-campaign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to start");
      setCampaignId(json.id);
      poll(json.id);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      setStarting(false);
    }
  }

  function poll(id: string) {
    pollRef.current = setInterval(async () => {
      const { data } = await supabase
        .from("campaigns")
        .select("status, status_step, error_message")
        .eq("id", id)
        .single();
      if (!data) return;
      const typedData = data as { status: string; status_step: string | null; error_message: string | null };
      if (typedData.status_step) setStep(typedData.status_step);
      if (typedData.status === "complete") {
        if (pollRef.current) clearInterval(pollRef.current);
        router.push(`/dashboard/campaigns/${id}`);
        router.refresh();
      } else if (typedData.status === "failed") {
        if (pollRef.current) clearInterval(pollRef.current);
        setError(typedData.error_message || "Generation failed. Your credit was not used.");
        setStarting(false);
        setCampaignId(null);
      }
    }, 3000);
  }

  if (starting || campaignId) {
    return (
      <div className="mx-auto flex min-h-[80vh] max-w-lg flex-col items-center justify-center px-6 text-center">
        <div className="relative mb-6">
          <div className="absolute inset-0 animate-ping rounded-full bg-brand/30" />
          <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--brand),var(--brand-2))]">
            <Sparkles className="h-9 w-9 text-white" />
          </div>
        </div>
        <h2 className="text-xl font-bold">Building your campaign</h2>
        {error ? (
          <p className="mt-4 text-sm text-red-400">{error}</p>
        ) : (
          <p className="mt-3 flex items-center gap-2 text-muted">
            <Loader2 className="h-4 w-4 animate-spin" /> {step}
          </p>
        )}
        <p className="mt-6 max-w-sm text-xs text-muted">
          This can take 1–2 minutes: writing copy, designing images, recording
          voiceovers, and rendering your video. You can keep this tab open.
        </p>
        {error && (
          <Button className="mt-6" onClick={() => { setError(null); setStarting(false); }}>
            Try again
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <div className="mb-8 text-center">
        <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,var(--brand),var(--brand-2))]">
          <Wand2 className="h-7 w-7 text-white" />
        </div>
        <h1 className="text-3xl font-bold">What are we promoting today?</h1>
        <p className="mt-2 text-muted">
          Describe your business, product, or offer in one sentence. We&apos;ll
          build the entire campaign.
        </p>
      </div>

      <div className="rounded-2xl border border-borderc bg-card p-5">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={4}
          placeholder="e.g. A cozy artisan coffee shop opening this Friday in Melbourne..."
          className="w-full resize-none rounded-xl border border-borderc bg-elev px-4 py-3 text-sm outline-none focus:border-brand"
        />
        <div className="mt-4 flex justify-end">
          <Button onClick={start} disabled={prompt.trim().length < 3}>
            <Wand2 className="h-4 w-4" /> Generate campaign
          </Button>
        </div>
      </div>

      <div className="mt-6">
        <p className="mb-2 text-xs uppercase tracking-wide text-muted">Need inspiration?</p>
        <div className="flex flex-wrap gap-2">
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              onClick={() => setPrompt(ex)}
              className="rounded-full border border-borderc bg-white/5 px-3 py-1.5 text-xs text-muted transition hover:border-brand hover:text-text"
            >
              {ex}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
