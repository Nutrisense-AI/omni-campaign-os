"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui";
import { Sparkles } from "lucide-react";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createSupabaseBrowserClient();
  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const urlMode = searchParams.get("mode");
    if (urlMode === "signin" || urlMode === "signup") {
      setMode(urlMode);
    }
  }, [searchParams]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    setMsg(null);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (error) throw error;

        // Get the session
        const { data: sessionData } = await supabase.auth.getSession();
        const session = sessionData?.session;

        if (session) {
          // Claim guest campaign if it exists
          const guestCampaignStr = sessionStorage.getItem("guestCampaign");
          if (guestCampaignStr) {
            try {
              const guestCampaign = JSON.parse(guestCampaignStr);
              // Update the campaign to attach to this user
              await fetch("/api/claim-guest-campaign", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ campaignId: guestCampaign.id }),
              });
              sessionStorage.removeItem("guestCampaign");
            } catch (e) {
              console.error("Failed to claim guest campaign:", e);
            }
          }
          router.push("/dashboard");
          router.refresh();
        } else {
          setMsg("Check your email to confirm your account, then sign in.");
          setMode("signin");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        router.push("/dashboard");
        router.refresh();
      }
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : "Something went wrong";
      setErr(errMsg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-5">
      <div className="pointer-events-none absolute -top-32 left-1/2 h-96 w-[42rem] -translate-x-1/2 rounded-full bg-brand/20 blur-[140px]" />
      <div className="relative w-full max-w-md rounded-2xl border border-borderc bg-card p-8">
        <div className="mb-6 flex items-center gap-2 text-lg font-bold">
          <Sparkles className="h-5 w-5 text-accent" />
          <span>Omni<span className="gradient-text">Campaign</span></span>
        </div>
        <h1 className="text-2xl font-bold">
          {mode === "signup" ? "Create your account" : "Welcome back"}
        </h1>
        <p className="mt-1 text-sm text-muted">
          {mode === "signup"
            ? "Start with 2 free campaign credits."
            : "Log in to your command center."}
        </p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-sm text-muted">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-borderc bg-elev px-3 py-2.5 text-sm outline-none focus:border-brand"
              placeholder="you@business.com"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-muted">Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-borderc bg-elev px-3 py-2.5 text-sm outline-none focus:border-brand"
              placeholder="••••••••"
            />
          </div>
          {err && <p className="text-sm text-red-400">{err}</p>}
          {msg && <p className="text-sm text-accent">{msg}</p>}
          <Button type="submit" loading={loading} className="w-full">
            {mode === "signup" ? "Create account" : "Sign in"}
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-muted">
          {mode === "signup" ? "Already have an account?" : "New here?"}{" "}
          <button
            onClick={() => {
              setMode(mode === "signup" ? "signin" : "signup");
              setErr(null);
              setMsg(null);
            }}
            className="font-semibold text-accent"
          >
            {mode === "signup" ? "Sign in" : "Create one"}
          </button>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}
