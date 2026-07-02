"use client";
import { useEffect, useState } from "react";
import { Button, Badge } from "@/components/ui";
import { Inbox, Sparkles, Check, Globe, Instagram, Facebook, Loader2 } from "lucide-react";

type Message = {
  id: string;
  platform: string;
  sender_name: string | null;
  message_text: string | null;
  ai_draft_reply: string | null;
  status: string;
  created_at: string;
};

export default function InboxPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/messages");
    const json = await res.json();
    setMessages(json.messages || []);
    setLoading(false);
  }
  useEffect(() => {
    load();
  }, []);

  async function draft(id: string) {
    setBusyId(id);
    const res = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action: "draft" }),
    });
    const json = await res.json();
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, ai_draft_reply: json.ai_draft_reply } : m)));
    setBusyId(null);
  }

  async function markReplied(id: string) {
    await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action: "mark_replied" }),
    });
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, status: "replied" } : m)));
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Inbox className="h-6 w-6" /> Unified Inbox
          </h1>
          <p className="mt-1 text-sm text-muted">Website enquiries land here. Social DMs coming soon.</p>
        </div>
        <div className="flex gap-2">
          <Badge className="border-accent/40 text-accent">
            <Instagram className="mr-1 h-3 w-3" /> Coming soon
          </Badge>
          <Badge className="border-accent/40 text-accent">
            <Facebook className="mr-1 h-3 w-3" /> Coming soon
          </Badge>
        </div>
      </div>

      {loading ? (
        <div className="mt-16 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted" />
        </div>
      ) : messages.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-borderc p-12 text-center text-muted">
          <Globe className="mx-auto mb-3 h-8 w-8" />
          No messages yet. When visitors use the chat widget on your landing pages, their messages appear here.
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {messages.map((m) => (
            <div key={m.id} className="rounded-2xl border border-borderc bg-card p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-accent" />
                  <span className="text-sm font-semibold">{m.sender_name || "Website Visitor"}</span>
                  <Badge>{m.platform}</Badge>
                </div>
                {m.status === "replied" ? (
                  <Badge className="border-emerald-500/40 text-emerald-400">Replied</Badge>
                ) : (
                  <Badge className="border-yellow-500/40 text-yellow-400">Pending</Badge>
                )}
              </div>
              <p className="mt-3 text-sm">{m.message_text}</p>

              {m.ai_draft_reply && (
                <div className="mt-3 rounded-xl border border-borderc bg-elev p-3">
                  <div className="mb-1 flex items-center gap-1 text-xs font-semibold text-accent">
                    <Sparkles className="h-3 w-3" /> AI draft reply
                  </div>
                  <p className="whitespace-pre-wrap text-sm text-muted">{m.ai_draft_reply}</p>
                </div>
              )}

              <div className="mt-4 flex gap-2">
                <Button variant="outline" onClick={() => draft(m.id)} loading={busyId === m.id}>
                  <Sparkles className="h-4 w-4" /> {m.ai_draft_reply ? "Regenerate" : "AI draft reply"}
                </Button>
                {m.status !== "replied" && (
                  <Button variant="ghost" onClick={() => markReplied(m.id)}>
                    <Check className="h-4 w-4" /> Mark replied
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
