"use client";
import { useState } from "react";
import { Button, Badge } from "@/components/ui";
import {
  Instagram,
  Facebook,
  Video,
  Globe,
  Sparkles,
  Copy,
  Download,
  Send,
  Check,
  ExternalLink,
  Loader2,
  Calendar,
  Inbox,
} from "lucide-react";

type Scene = { scene_text: string; visual_prompt: string; on_screen_text: string };
type OutputData = {
  instagram_caption: string;
  facebook_ad_copy: string;
  tiktok_script: Scene[];
  image_prompt: string;
  landing_page_html: string;
};

type Campaign = {
  id: string;
  prompt: string;
  status: string;
  image_url: string | null;
  video_url: string | null;
  landing_page_html: string | null;
  output_data: OutputData | null;
};

const TABS = [
  { key: "instagram", label: "Instagram", icon: Instagram },
  { key: "facebook", label: "Facebook Ad", icon: Facebook },
  { key: "video", label: "TikTok Video", icon: Video },
  { key: "landing", label: "Landing Page", icon: Globe },
];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      variant="outline"
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
    >
      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      {copied ? "Copied" : "Copy"}
    </Button>
  );
}

export function Workspace({ campaign: initial }: { campaign: Campaign }) {
  const [campaign, setCampaign] = useState(initial);
  const [tab, setTab] = useState("instagram");
  const [instruction, setInstruction] = useState("");
  const [copiloting, setCopiloting] = useState(false);
  const [copilotMsg, setCopilotMsg] = useState<string | null>(null);
  const [scheduling, setScheduling] = useState(false);
  const [scheduleMsg, setScheduleMsg] = useState<string | null>(null);

  const data = campaign.output_data;
  const publicUrl =
    typeof window !== "undefined" ? `${window.location.origin}/p/${campaign.id}` : "";

  async function runCopilot() {
    if (!instruction.trim()) return;
    setCopiloting(true);
    setCopilotMsg(null);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId: campaign.id, instruction }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setCampaign({ ...campaign, output_data: json.output_data, landing_page_html: json.output_data.landing_page_html });
      setInstruction("");
      setCopilotMsg("Updated! Your changes are live across all assets.");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Something went wrong";
      setCopilotMsg(msg);
    } finally {
      setCopiloting(false);
    }
  }

  async function downloadImage() {
    if (!campaign.image_url) return;
    const res = await fetch(campaign.image_url);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "omnicampaign-image.png";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function schedule(platform: string) {
    setScheduling(true);
    setScheduleMsg(null);
    try {
      const when = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
      const res = await fetch("/api/scheduled-posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId: campaign.id, platform, scheduledTime: when }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setScheduleMsg(`Scheduled for ${platform} in 24 hours.`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setScheduleMsg(msg);
    } finally {
      setScheduling(false);
    }
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-12 text-center text-muted">
        This campaign has no generated content yet.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="mb-6">
        <Badge className="mb-2">Campaign</Badge>
        <h1 className="text-2xl font-bold">{campaign.prompt}</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Left: assets */}
        <div>
          <div className="mb-4 flex flex-wrap gap-2">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition ${
                  tab === t.key
                    ? "bg-[linear-gradient(90deg,var(--brand),var(--brand-2))] text-white"
                    : "border border-borderc text-muted hover:text-text"
                }`}
              >
                <t.icon className="h-4 w-4" /> {t.label}
              </button>
            ))}
          </div>

          <div className="rounded-2xl border border-borderc bg-card p-5">
            {tab === "instagram" && (
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="overflow-hidden rounded-xl bg-elev">
                  {campaign.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={campaign.image_url} alt="" className="aspect-square w-full object-cover" />
                  ) : (
                    <div className="flex aspect-square items-center justify-center">
                      <Sparkles className="h-8 w-8 text-muted" />
                    </div>
                  )}
                </div>
                <div className="flex flex-col">
                  <p className="whitespace-pre-wrap text-sm">{data.instagram_caption}</p>
                  <div className="mt-4 flex gap-2">
                    <CopyButton text={data.instagram_caption} />
                    <Button variant="outline" onClick={downloadImage}>
                      <Download className="h-4 w-4" /> Image
                    </Button>
                  </div>
                  <div className="mt-3">
                    <Button variant="ghost" onClick={() => schedule("instagram")} loading={scheduling}>
                      <Calendar className="h-4 w-4" /> Schedule post
                    </Button>
                  </div>
                  {scheduleMsg && <p className="mt-2 text-xs text-accent">{scheduleMsg}</p>}
                  <p className="mt-3 text-xs text-muted">
                    Auto-posting to Meta is coming soon. For now, download the image + copy the
                    caption to post manually.
                  </p>
                </div>
              </div>
            )}

            {tab === "facebook" && (
              <div>
                <p className="whitespace-pre-wrap text-sm">{data.facebook_ad_copy}</p>
                <div className="mt-4">
                  <CopyButton text={data.facebook_ad_copy} />
                </div>
              </div>
            )}

            {tab === "video" && (
              <div className="grid gap-5 sm:grid-cols-[260px_1fr]">
                <div className="overflow-hidden rounded-xl bg-black">
                  {campaign.video_url ? (
                    <video src={campaign.video_url} controls className="aspect-[9/16] w-full" />
                  ) : (
                    <div className="flex aspect-[9/16] items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-muted" />
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="mb-2 text-sm font-semibold">Script</h3>
                  <ol className="space-y-3">
                    {data.tiktok_script.map((s, i) => (
                      <li key={i} className="rounded-xl border border-borderc bg-elev p-3">
                        <div className="mb-1 text-xs font-semibold text-accent">Scene {i + 1} · {s.on_screen_text}</div>
                        <p className="text-sm text-muted">{s.scene_text}</p>
                      </li>
                    ))}
                  </ol>
                  {campaign.video_url && (
                    <a href={campaign.video_url} download className="mt-4 inline-flex items-center gap-2 rounded-xl border border-borderc px-4 py-2 text-sm hover:bg-white/5">
                      <Download className="h-4 w-4" /> Download video
                    </a>
                  )}
                </div>
              </div>
            )}

            {tab === "landing" && (
              <div>
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-sm text-muted">
                    <Globe className="h-4 w-4" /> Live landing page
                  </div>
                  <div className="flex gap-2">
                    <CopyButton text={publicUrl} />
                    <a href={publicUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-borderc px-4 py-2 text-sm hover:bg-white/5">
                      <ExternalLink className="h-4 w-4" /> Open
                    </a>
                  </div>
                </div>
                <div className="overflow-hidden rounded-xl border border-borderc bg-white">
                  <iframe
                    title="Landing page preview"
                    srcDoc={campaign.landing_page_html || ""}
                    className="h-[520px] w-full"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: AI Co-pilot */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-borderc bg-card p-5">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <Sparkles className="h-4 w-4 text-accent" /> AI Co-pilot
            </h3>
            <p className="mt-1 text-xs text-muted">
              Ask for changes in plain English — e.g. &quot;make the tone more playful&quot; or
              &quot;change the offer to 20% off&quot;. It updates every asset.
            </p>
            <textarea
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              rows={3}
              placeholder="Make the caption punchier and add urgency..."
              className="mt-3 w-full resize-none rounded-xl border border-borderc bg-elev px-3 py-2 text-sm outline-none focus:border-brand"
            />
            <Button className="mt-3 w-full" onClick={runCopilot} loading={copiloting}>
              <Send className="h-4 w-4" /> Apply changes
            </Button>
            {copilotMsg && <p className="mt-2 text-xs text-accent">{copilotMsg}</p>}
          </div>

          <div className="rounded-2xl border border-borderc bg-card p-5">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <Inbox className="h-4 w-4 text-muted" /> Social Inbox
            </h3>
            <div className="mt-2 flex items-center gap-2">
              <Badge className="border-accent/40 text-accent">Coming soon</Badge>
            </div>
            <p className="mt-2 text-xs text-muted">
              Direct Instagram &amp; Facebook message management will arrive in a future update.
              Website leads already flow into your CRM and Inbox.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
