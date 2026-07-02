import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Retry a promise-returning fn once (2 total attempts) per the reliability spec.
 * Throws the last error if both attempts fail.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  label = "operation"
): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    console.warn(`[retry] ${label} failed once, retrying...`, err);
    // brief backoff
    await new Promise((r) => setTimeout(r, 1200));
    return await fn();
  }
}

export const TIER_CONFIG = {
  free: { credits: 2, label: "Free" },
  starter: { credits: 15, label: "Starter", price: 5900 },
  pro: { credits: 50, label: "Pro", price: 19900 },
  agency: { credits: 200, label: "Agency", price: 49900 },
} as const;

export type Tier = keyof typeof TIER_CONFIG;

/** Map a Stripe Price ID (from env) to our internal tier. */
export function priceIdToTier(priceId: string): Tier | null {
  if (priceId === process.env.STRIPE_PRICE_STARTER) return "starter";
  if (priceId === process.env.STRIPE_PRICE_PRO) return "pro";
  if (priceId === process.env.STRIPE_PRICE_AGENCY) return "agency";
  return null;
}

export function formatCurrencyAUD(cents: number) {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    minimumFractionDigits: 0,
  }).format(cents / 100);
}
