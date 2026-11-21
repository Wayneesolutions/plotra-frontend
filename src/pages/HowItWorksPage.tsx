import { SiteNav } from "@/components/plotra/site-nav";
import { SiteFooter } from "@/components/plotra/site-footer";
import { HowItWorksSection } from "@/components/plotra/sections/how-it-works-section";
import { PageSeo } from "@/components/Seo";
import { CtaBox } from "@/components/plotra/content-blocks";
import { HOW_IT_WORKS_STEPS } from "@/seo/pages.js";

export default function HowItWorksPage() {
  return (
    <main className="overflow-x-clip">
      <PageSeo path="/how-it-works" />
      <SiteNav />
      <div className="pt-24 sm:pt-28">
        <HowItWorksSection asPage />
      </div>
      <section className="bg-background px-5 py-16 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="font-display text-2xl font-bold text-ink sm:text-3xl">The 5 steps, in short</h2>
          <ol className="mt-5 list-decimal space-y-3 pl-6 text-base leading-relaxed text-foreground/80">
            {HOW_IT_WORKS_STEPS.map((s) => (
              <li key={s.name}>
                <strong className="text-ink">{s.name}:</strong> {s.text}
              </li>
            ))}
          </ol>
          <CtaBox title="Try it with your next listing" text="Request access and send your first property on WhatsApp the same day." />
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
