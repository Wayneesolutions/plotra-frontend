// Public plans API — the pricing page and home-page pricing section render
// whatever GET /api/v1/public/billing/plans returns. That endpoint only
// returns ACTIVE plans, so switching a plan on/off in the admin Plans tab is
// what shows/hides it on the website. There is deliberately no hardcoded
// plan list in the frontend any more.
const API_BASE =
  (import.meta.env["VITE_API_BASE_URL"] as string | undefined)?.replace(/\/$/, "") ?? "";

export type PlanCategory = "basic" | "basic_with_leads";

export type PublicPlan = {
  key: string;
  label: string;
  price_inr: number;
  listing_limit: number | null;
  features: string[];
  category: PlanCategory | null;
  discount_percent: number | null;
  max_users: number | null;
  included_leads: number | null;
};

/** Display order + headings for the plan categories. */
export const PLAN_CATEGORIES: { key: PlanCategory; label: string }[] = [
  { key: "basic", label: "Basic" },
  { key: "basic_with_leads", label: "Basic with Leads" },
];

export async function fetchPublicPlans(): Promise<PublicPlan[]> {
  const res = await fetch(`${API_BASE}/api/v1/public/billing/plans`);
  if (!res.ok) throw new Error(`Failed to load plans (${res.status})`);
  const body = await res.json();
  const plans = Array.isArray(body?.plans) ? body.plans : [];
  return plans.map((p: Record<string, unknown>) => ({
    key: String(p.key),
    label: String(p.label ?? p.key),
    price_inr: Number(p.price_inr) || 0,
    listing_limit: (p.listing_limit as number | null) ?? null,
    features: Array.isArray(p.features) ? (p.features as string[]) : [],
    category: (p.category as PlanCategory | null) ?? null,
    discount_percent: (p.discount_percent as number | null) ?? null,
    max_users: (p.max_users as number | null) ?? null,
    included_leads: (p.included_leads as number | null) ?? null,
  }));
}

/**
 * Groups plans under the known categories (in display order). Plans with no
 * / an unknown category land in a trailing untitled group so nothing an
 * admin activates is ever silently dropped from the page.
 */
export function groupPlansByCategory(plans: PublicPlan[]) {
  const groups: { key: string; label: string | null; plans: PublicPlan[] }[] = [];
  for (const cat of PLAN_CATEGORIES) {
    const inCat = plans.filter((p) => p.category === cat.key);
    if (inCat.length) groups.push({ key: cat.key, label: cat.label, plans: inCat });
  }
  const known = new Set<string>(PLAN_CATEGORIES.map((c) => c.key));
  const rest = plans.filter((p) => !p.category || !known.has(p.category));
  if (rest.length) groups.push({ key: "other", label: groups.length ? "Other plans" : null, plans: rest });
  return groups;
}

/** "4 users · 50 leads" style line under the price; empty if neither is set. */
export function planLimitLine(plan: PublicPlan): string {
  const parts: string[] = [];
  if (plan.max_users) parts.push(`${plan.max_users} ${plan.max_users === 1 ? "user" : "users"}`);
  if (plan.included_leads) parts.push(`${plan.included_leads} leads`);
  return parts.join(" · ");
}
