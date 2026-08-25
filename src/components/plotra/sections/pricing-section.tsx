import { Link } from "react-router-dom";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/lib/motion";
import { plans } from "@/lib/plotra-data";
import { cn } from "@/lib/utils";

export function PricingSection() {
  return (
    <section id="pricing" className="bg-background px-5 py-24 sm:px-8 sm:py-32">
      <div className="mx-auto max-w-6xl">
        <Reveal className="text-center">
          <p className="label-eyebrow text-primary">Pricing</p>
          <h2 className="text-balance-tight mt-4 font-display text-4xl font-bold text-ink sm:text-5xl">
            Straightforward plans. No lock-in.
          </h2>
        </Reveal>

        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {plans.map((plan, i) => (
            <Reveal key={plan.name} delay={i * 110}>
              <div
                className={cn(
                  "group lift relative flex h-full flex-col rounded-[1.75rem] border bg-card p-7",
                  plan.recommended
                    ? "border-primary/40 shadow-[var(--shadow-glow)]"
                    : "border-border hover:border-primary/30",
                )}
              >
                {plan.recommended ? (
                  <span className="absolute -top-3 left-7 rounded-full bg-primary py-1 pl-3.5 pr-3 text-[10px] font-bold uppercase tracking-widest text-primary-foreground">
                    Recommended
                  </span>
                ) : null}
                <h3 className="font-display text-2xl font-bold text-ink">{plan.name}</h3>
                <p className="mt-4 font-display text-4xl font-bold text-ink">
                  {plan.price}
                  <span className="ml-1 text-sm font-medium text-muted-foreground">
                    {plan.period}
                  </span>
                </p>
                <p className="mt-2 pl-0.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  {plan.limit}
                </p>
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
                <Button
                  asChild
                  variant={plan.recommended ? "hero" : "outline"}
                  size="lg"
                  className="mt-8 w-full"
                >
                  <Link to="/request-access">
                    Request Access <ArrowRight />
                  </Link>
                </Button>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
