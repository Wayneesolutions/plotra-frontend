import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/lib/motion";
import {
  fetchPublicPlans,
  groupPlansByCategory,
  planLimitLine,
  type PublicPlan,
} from "@/lib/plans-api";
import { getPrerenderData } from "@/lib/prerender-data";
import { pricingFacts, inr } from "@/content/pricing-facts.js";
import { FaqList, LastUpdated } from "@/components/plotra/content-blocks";
import { PHONE_DISPLAY } from "@/seo/site-info.js";

/**
 * Plans come from the backend (admin panel → Plans). Only plans that are
 * switched ON there are returned, so that toggle is what controls what this
 * section shows. Plans are grouped by category (Basic / Basic with Leads).
 *
 * `asPage` is used on /pricing: the heading becomes the page H1 with the
 * "Straightforward plans" line under it, category names become H2 and each
 * plan name an H3. On the home page the section keeps H2 / H3 / H4.
 */
export function PricingSection({ asPage = false }: { asPage?: boolean }) {
  // Start from the plans baked in at build time (prerender), so the server
  // HTML already contains every price, then refresh from the live API.
  const initial = getPrerenderData().plans;
  const [plans, setPlans] = useState<PublicPlan[]>(initial ?? []);
  const [state, setState] = useState<"loading" | "ready" | "error">(initial?.length ? "ready" : "loading");

  useEffect(() => {
    let cancelled = false;
    fetchPublicPlans()
      .then((res) => {
        if (cancelled) return;
        setPlans(res);
        setState("ready");
      })
      .catch(() => !cancelled && setState("error"));
    return () => {
      cancelled = true;
    };
  }, []);

  const groups = groupPlansByCategory(plans);
  const CategoryHeading = asPage ? "h2" : "h3";
  const PlanHeading = asPage ? "h3" : "h4";

  return (
    <section id="pricing" className="bg-background px-5 py-24 sm:px-8 sm:py-32">
      <div className="mx-auto max-w-6xl">
        <Reveal className="text-center">
          <p className="label-eyebrow text-primary">Pricing</p>
          {asPage ? (
            <>
              <h1 className="text-balance-tight mt-4 font-display text-4xl font-bold text-ink sm:text-5xl">
                Plotraa pricing for property dealers
              </h1>
              <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                {pricingAnswer(plans)}
              </p>
            </>
          ) : (
            <h2 className="text-balance-tight mt-4 font-display text-4xl font-bold text-ink sm:text-5xl">
              Straightforward plans. No lock-in.
            </h2>
          )}
        </Reveal>

        {state === "loading" ? (
          <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-80 animate-pulse rounded-[1.75rem] border border-border bg-card"
              />
            ))}
          </div>
        ) : null}

        {state !== "loading" && groups.length === 0 ? (
          <div className="mx-auto mt-14 max-w-xl rounded-[1.75rem] border border-border bg-card p-8 text-center">
            <p className="text-base leading-relaxed text-muted-foreground">
              {state === "error"
                ? "We couldn't load the plans right now. Request access and we'll share current pricing with you."
                : "Plans are being updated. Request access and we'll share current pricing with you."}
            </p>
            <Button asChild variant="hero" size="lg" className="mt-6">
              <Link to="/request-access">
                Request Access <ArrowRight />
              </Link>
            </Button>
          </div>
        ) : null}

        {groups.map((group, gi) => (
          <div key={group.key} className={gi === 0 ? "mt-14" : "mt-20"}>
            {group.label ? (
              <Reveal className="mb-10 text-center sm:text-left">
                <CategoryHeading className="font-display text-2xl font-bold text-ink sm:text-3xl">
                  {group.label}
                </CategoryHeading>
              </Reveal>
            ) : null}

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {group.plans.map((plan, i) => {
                const limit = planLimitLine(plan);
                return (
                  <Reveal key={plan.key} delay={i * 110}>
                    <div className="group lift relative flex h-full flex-col rounded-[1.75rem] border border-border bg-card p-7 hover:border-primary/30">
                      {/* Inside the card, not overhanging it: Reveal's clip-path
                          cuts off anything that overflows the card box. */}
                      {plan.discount_percent ? (
                        <span className="mb-4 self-start rounded-full bg-primary px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-primary-foreground">
                          {plan.discount_percent}% off
                        </span>
                      ) : null}
                      <PlanHeading className="font-display text-2xl font-bold text-ink">
                        {asPage ? `${plan.label} plan` : plan.label}
                      </PlanHeading>
                      <p className="mt-4 font-display text-4xl font-bold text-ink">
                        ₹{plan.price_inr.toLocaleString("en-IN")}
                        <span className="ml-1 text-sm font-medium text-muted-foreground">
                          per month
                        </span>
                      </p>
                      {limit ? (
                        <p className="mt-2 pl-0.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                          {limit}
                        </p>
                      ) : null}
                      <ul className="mt-7 space-y-3">
                        {plan.features.map((f) => (
                          <li
                            key={f}
                            className="flex items-start gap-2.5 text-sm text-foreground opacity-80 transition-opacity duration-500 group-hover:opacity-100"
                          >
                            <Check className="mt-0.5 size-4 shrink-0 text-accent" />
                            {f}
                          </li>
                        ))}
                      </ul>
                      <div className="mt-auto pt-8">
                        <Button asChild variant="outline" size="lg" className="w-full">
                          <Link to="/request-access">
                            Request Access <ArrowRight />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </div>
        ))}

        {asPage && plans.length ? <ComparisonTable plans={plans} /> : null}
        {asPage ? <PricingQuestions /> : null}
        {asPage ? (
          <div className="mt-10 text-center">
            <LastUpdated prefix="Prices in INR, per month." />
          </div>
        ) : null}
      </div>
    </section>
  );
}

/** Plain-text answer under the /pricing H1 — computed from the plan data so
 *  it always matches the cards. */
function pricingAnswer(plans: PublicPlan[]) {
  const f = pricingFacts(plans);
  let text = `Plotraa has monthly plans for single dealers and dealer teams. Basic starts at ${inr(f.basicFrom)} a month for 1 user.`;
  if (f.leadsFrom) {
    text += ` Plans with buyer leads start at ${inr(f.leadsFrom)} a month`;
    text += f.leadsIncluded ? ` and include ${f.leadsIncluded} leads.` : ".";
  }
  return `${text} There is no lock-in.`;
}

const ROWS: { label: string; value: (p: PublicPlan) => string }[] = [
  { label: "Price per month", value: (p) => inr(p.price_inr) },
  { label: "Users", value: (p) => (p.max_users ? String(p.max_users) : findFeature(p, /users? included|^\d+ users?$/i) ?? "—") },
  { label: "WhatsApp numbers", value: (p) => findFeature(p, /whatsapp numbers?$/i)?.replace(/whatsapp numbers?/i, "").trim() || "—" },
  { label: "Listings per month", value: (p) => findFeature(p, /listings\/month/i)?.replace(/listings\/month/i, "").trim() || "—" },
  { label: "Full dashboard", value: (p) => (findFeature(p, /full dashboard/i) ? "Yes" : "—") },
  { label: "Lead inbox", value: (p) => (findFeature(p, /lead inbox/i) ? "Yes" : "—") },
  { label: "Buyer leads per month", value: (p) => (p.included_leads ? String(p.included_leads) : "—") },
];

function findFeature(plan: PublicPlan, re: RegExp) {
  return plan.features.find((f) => re.test(f)) ?? null;
}

function ComparisonTable({ plans }: { plans: PublicPlan[] }) {
  const ordered = groupPlansByCategory(plans).flatMap((g) => g.plans);
  return (
    <div className="mt-20">
      <h2 className="text-center font-display text-2xl font-bold text-ink sm:text-3xl">Compare Plotraa plans</h2>
      <div className="mt-8 overflow-x-auto rounded-2xl border border-border">
        <table className="w-full min-w-[48rem] text-left text-sm">
          <thead className="bg-lavender text-ink">
            <tr>
              <th scope="col" className="px-4 py-3 font-semibold">Feature</th>
              {ordered.map((p) => (
                <th key={p.key} scope="col" className="px-4 py-3 font-semibold">
                  {p.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {ROWS.map((row) => (
              <tr key={row.label}>
                <th scope="row" className="px-4 py-3 font-semibold text-ink">
                  {row.label}
                </th>
                {ordered.map((p) => (
                  <td key={p.key} className="px-4 py-3 text-foreground/80">
                    {row.value(p)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PricingQuestions() {
  const items = [
    { id: "contract", q: "Is there a contract?", a: "No. Plans are monthly with no lock-in." },
    {
      id: "how-to-start",
      q: "How do I start?",
      a: `Request access at plotraa.com/request-access or WhatsApp ${PHONE_DISPLAY}.`,
    },
  ];
  return (
    <div className="mx-auto mt-20 max-w-4xl">
      <h2 className="mb-6 text-center font-display text-2xl font-bold text-ink sm:text-3xl">Pricing questions</h2>
      <FaqList items={items} />
    </div>
  );
}
