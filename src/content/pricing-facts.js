// Price facts quoted in copy (pricing answer paragraph, FAQ, schema offers).
// Computed from the live plans API data when it is available (build-time
// prerender data), so the text always matches the plan cards. The fallback
// values are only used if the plans could not be loaded.

const FALLBACK = { basicFrom: 4999, leadsFrom: 7999, leadsIncluded: 30, highPrice: 22999, planCount: 6 };

export function pricingFacts(plans) {
  if (!Array.isArray(plans) || plans.length === 0) return { ...FALLBACK, live: false };
  const prices = plans.map((p) => Number(p.price_inr) || 0).filter((n) => n > 0);
  const basic = plans.filter((p) => p.category === 'basic');
  const leads = plans
    .filter((p) => p.category === 'basic_with_leads' || p.included_leads)
    .sort((a, b) => a.price_inr - b.price_inr);
  const minOf = (list) => (list.length ? Math.min(...list.map((p) => p.price_inr)) : null);
  return {
    basicFrom: minOf(basic) ?? Math.min(...prices),
    leadsFrom: leads[0]?.price_inr ?? null,
    leadsIncluded: leads[0]?.included_leads ?? null,
    highPrice: Math.max(...prices),
    planCount: plans.length,
    live: true,
  };
}

export const inr = (n) => `₹${Number(n).toLocaleString('en-IN')}`;
