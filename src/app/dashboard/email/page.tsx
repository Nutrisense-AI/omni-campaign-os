"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui";
import { Mail, Users, Send, Loader2, Plus } from "lucide-react";

type Subscriber = { id: string; email: string; created_at: string };

export default function EmailPage() {
  const [subs, setSubs] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [newEmail, setNewEmail] = useState("");

  async function load() {
    const res = await fetch("/api/subscribers");
    const json = await res.json();
    setSubs(json.subscribers || []);
    setLoading(false);
  }
  useEffect(() => {
    load();
  }, []);

  async function addSub() {
    if (!newEmail) return;
    const res = await fetch("/api/subscribers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: newEmail }),
    });
    const json = await res.json();
    if (json.subscriber) setSubs((p) => [json.subscriber, ...p]);
    setNewEmail("");
  }

  async function broadcast() {
    if (!subject || !body) return;
    setSending(true);
    setResult(null);
    const html = `<div style="font-family:system-ui,sans-serif;line-height:1.6;color:#111"><p>${body.replace(/\n/g, "<br/>")}</p></div>`;
    const res = await fetch("/api/email/broadcast", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, html }),
    });
    const json = await res.json();
    if (res.ok) {
      setResult(`Sent to ${json.sent} of ${json.total} subscribers.`);
      setSubject("");
      setBody("");
    } else {
      setResult(json.error || "Failed to send");
    }
    setSending(false);
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <h1 className="flex items-center gap-2 text-2xl font-bold">
        <Mail className="h-6 w-6" /> Email Marketing
      </h1>
      <p className="mt-1 text-sm text-muted">Broadcast to everyone who opted in through your landing pages.</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="rounded-2xl border border-borderc bg-card p-5">
          <h2 className="mb-3 text-sm font-semibold">Compose broadcast</h2>
          <input
            placeholder="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="mb-3 w-full rounded-xl border border-borderc bg-elev px-3 py-2.5 text-sm outline-none focus:border-brand"
          />
          <textarea
            placeholder="Write your email..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={9}
            className="w-full resize-none rounded-xl border border-borderc bg-elev px-3 py-2.5 text-sm outline-none focus:border-brand"
          />
          <div className="mt-3 flex items-center gap-3">
            <Button onClick={broadcast} loading={sending} disabled={!subject || !body || subs.length === 0}>
              <Send className="h-4 w-4" /> Send to {subs.length} subscribers
            </Button>
            {result && <span className="text-sm text-accent">{result}</span>}
          </div>
        </div>

        <div className="rounded-2xl border border-borderc bg-card p-5">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <Users className="h-4 w-4" /> Subscribers ({subs.length})
          </h2>
          <div className="mb-3 flex gap-2">
            <input
              placeholder="add@email.com"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="w-full rounded-xl border border-borderc bg-elev px-3 py-2 text-sm outline-none focus:border-brand"
            />
            <Button variant="outline" onClick={addSub}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted" />
          ) : (
            <div className="max-h-80 space-y-1.5 overflow-y-auto">
              {subs.map((s) => (
                <div key={s.id} className="truncate rounded-lg border border-borderc bg-elev px-3 py-2 text-xs text-muted">
                  {s.email}
                </div>
              ))}
              {subs.length === 0 && <p className="text-xs text-muted">No subscribers yet.</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
