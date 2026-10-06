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
  const [plans, setPlans] = useState<PublicPlan[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");

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
              <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                Straightforward monthly plans for property dealers and teams. No lock-in.
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
      </div>
    </section>
  );
}
