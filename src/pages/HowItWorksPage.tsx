import { SiteNav } from "@/components/plotra/site-nav";
import { SiteFooter } from "@/components/plotra/site-footer";
import { HowItWorksSection } from "@/components/plotra/sections/how-it-works-section";
import { PageSeo } from "@/components/Seo";

export default function HowItWorksPage() {
  return (
    <main className="overflow-x-clip">
      <PageSeo path="/how-it-works" />
      <SiteNav />
      <div className="pt-24 sm:pt-28">
        <HowItWorksSection asPage />
      </div>
      <SiteFooter />
    </main>
  );
}
