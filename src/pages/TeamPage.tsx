import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteNav } from "@/components/plotra/site-nav";
import { SiteFooter } from "@/components/plotra/site-footer";
import { Reveal } from "@/lib/motion";

const TEAM = [
  { initials: "PK", name: "Pankaj Kumar", role: "Founder & Director" },
  { initials: "PN", name: "Pavnoor Kaur", role: "Co-founder" },
  { initials: "PM", name: "Piyush Mehndiratta", role: "Marketing Head" },
  { initials: "SM", name: "Surbhi Mehndiratta", role: "Graphic Designer" },
  { initials: "BK", name: "Baljeet Kaur", role: "Graphic Designer" },
  { initials: "AS", name: "Arpan Saini", role: "Software Developer" },
  { initials: "SK", name: "Sant Kaur", role: "Senior Software Developer" },
  { initials: "MK", name: "Mandeep Kaur", role: "Senior Web Developer" },
];

export default function TeamPage() {
  return (
    <main className="overflow-x-clip">
      <SiteNav />

      <section className="bg-lavender px-5 pb-14 pt-32 sm:px-8 sm:pt-40">
        <div className="mx-auto max-w-7xl">
          <Reveal>
            <p className="label-eyebrow text-primary">The people behind Plotra</p>
            <h1 className="text-balance-tight mt-4 max-w-2xl font-display text-4xl font-bold text-ink sm:text-6xl">
              Meet the team.
            </h1>
            <p className="mt-5 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              Plotra is built by Wayne E Solutions — a small team based in Ludhiana, Punjab,
              building the WhatsApp-native CRM Punjab's property dealers actually use.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="bg-background px-5 py-16 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {TEAM.map((m, i) => (
              <Reveal key={m.name} delay={i * 60}>
                <div className="lift rounded-3xl border border-border bg-card p-8 text-center">
                  <div className="mx-auto grid size-20 place-items-center rounded-full bg-gradient-to-br from-primary to-accent font-display text-2xl font-semibold text-primary-foreground">
                    {m.initials}
                  </div>
                  <div className="mt-5 font-display text-xl font-bold text-ink">{m.name}</div>
                  <div className="mt-1 text-sm leading-relaxed text-muted-foreground">{m.role}</div>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={480}>
            <div className="mt-14 rounded-[2rem] bg-gradient-to-br from-primary to-accent p-10 text-center text-primary-foreground sm:p-14">
              <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
                Want to talk to us directly?
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-primary-foreground/85">
                We're happy to walk you through Plotra, plan by plan.
              </p>
              <Button asChild variant="ink" size="lg" className="mt-7">
                <Link to="/pricing">
                  See pricing <ArrowRight />
                </Link>
              </Button>
            </div>
          </Reveal>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
