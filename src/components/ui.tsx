"use client";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export function Button({
  children,
  className,
  variant = "primary",
  loading,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "outline" | "danger";
  loading?: boolean;
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed";
  const variants: Record<string, string> = {
    primary:
      "text-white shadow-lg shadow-indigo-900/30 hover:opacity-90 bg-[linear-gradient(90deg,var(--brand),var(--brand-2))]",
    ghost: "text-muted hover:text-text hover:bg-white/5",
    outline: "border border-borderc text-text hover:bg-white/5",
    danger: "bg-red-500/90 text-white hover:bg-red-500",
  };
  return (
    <button className={cn(base, variants[variant], className)} disabled={loading || props.disabled} {...props}>
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}

export function Card({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-borderc bg-card p-5",
        className
      )}
    >
      {children}
    </div>
  );
}

export function Badge({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-borderc bg-white/5 px-2.5 py-0.5 text-xs font-medium text-muted",
        className
      )}
    >
      {children}
    </span>
  );
}
