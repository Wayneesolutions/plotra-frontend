import { SiteNav } from "@/components/plotra/site-nav";
import { SiteFooter } from "@/components/plotra/site-footer";
import { PageSeo } from "@/components/Seo";
import { CtaBox, FaqList, LastUpdated, PageHeader } from "@/components/plotra/content-blocks";
import { faqItems } from "@/content/faq.js";
import { getPrerenderData } from "@/lib/prerender-data";
import { PHONE_DISPLAY } from "@/seo/site-info.js";

export default function FaqPage() {
  const items = faqItems(getPrerenderData().plans);
  return (
    <main className="overflow-x-clip">
      <PageSeo path="/faq" />
      <SiteNav />
      <PageHeader
        eyebrow="FAQ"
        h1="Plotraa: frequently asked questions"
        intro="Short, straight answers about how Plotraa works, what it costs, who it is for and how to get started."
      />
      <section className="bg-background px-5 py-16 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-4xl">
          <FaqList items={items} headingLevel="h2" />
          <CtaBox title="Still have a question?" text={`WhatsApp ${PHONE_DISPLAY} or request access and we'll call you.`} />
          <div className="mt-8">
            <LastUpdated />
          </div>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
