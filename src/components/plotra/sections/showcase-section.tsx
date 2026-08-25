import { ReelStrip } from "@/components/plotra/reel-strip";
import { Reveal } from "@/lib/motion";

export function ShowcaseSection() {
  return (
    <section id="showcase" className="surface-ink overflow-hidden py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <Reveal className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="label-eyebrow text-accent">Showcase reel</p>
            <h2 className="text-balance-tight mt-4 max-w-xl font-display text-4xl font-bold text-ink-foreground sm:text-6xl">
              Everything a dealer does in a day, in nine-by-sixteen.
            </h2>
          </div>
          <p className="max-w-xs text-sm text-ink-foreground/60">
            Drag sideways. Each reel is a real moment from a Plotra dealer's week.
          </p>
        </Reveal>
      </div>
      <div className="mt-14">
        <ReelStrip />
      </div>
    </section>
  );
}
