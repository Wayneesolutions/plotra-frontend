import { SiteNav } from "@/components/plotra/site-nav";
import { SiteFooter } from "@/components/plotra/site-footer";
import { PricingSection } from "@/components/plotra/sections/pricing-section";
import { PageSeo } from "@/components/Seo";

export default function PricingPage() {
  return (
    <main className="overflow-x-clip">
      <PageSeo path="/pricing" />
      <SiteNav />
      <div className="pt-24 sm:pt-28">
        <PricingSection asPage />
      </div>
      <SiteFooter />
    </main>
  );
}
