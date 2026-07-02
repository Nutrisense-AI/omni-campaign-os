"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import {
  Sparkles,
  LayoutGrid,
  Wand2,
  Users,
  Inbox,
  Mail,
  CreditCard,
  LogOut,
  Zap,
} from "lucide-react";

const NAV = [
  { href: "/dashboard", label: "Overview", icon: LayoutGrid },
  { href: "/dashboard/create", label: "Create Campaign", icon: Wand2 },
  { href: "/dashboard/campaigns", label: "Campaigns", icon: Sparkles },
  { href: "/dashboard/crm", label: "CRM", icon: Users },
  { href: "/dashboard/inbox", label: "Inbox", icon: Inbox },
  { href: "/dashboard/email", label: "Email", icon: Mail },
  { href: "/dashboard/billing", label: "Billing", icon: CreditCard },
];

export function Sidebar({
  email,
  credits,
  tier,
}: {
  email: string;
  credits: number;
  tier: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col border-r border-borderc bg-elev p-4">
      <Link href="/dashboard" className="mb-6 flex items-center gap-2 px-2 text-lg font-bold">
        <Sparkles className="h-5 w-5 text-accent" />
        <span>Omni<span className="gradient-text">Campaign</span></span>
      </Link>

      <div className="mb-4 rounded-xl border border-borderc bg-card p-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted">Credits</span>
          <span className="flex items-center gap-1 text-sm font-bold text-accent">
            <Zap className="h-3.5 w-3.5" /> {credits}
          </span>
        </div>
        <div className="mt-1 text-xs capitalize text-muted">{tier} plan</div>
      </div>

      <nav className="flex-1 space-y-1">
        {NAV.map((item) => {
          const active =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                active
                  ? "bg-[linear-gradient(90deg,rgba(99,102,241,0.25),rgba(168,85,247,0.15))] text-text"
                  : "text-muted hover:bg-white/5 hover:text-text"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-4 border-t border-borderc pt-4">
        <div className="mb-2 truncate px-2 text-xs text-muted">{email}</div>
        <button
          onClick={signOut}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted transition hover:bg-white/5 hover:text-text"
        >
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </div>
    </aside>
  );
}
