import { SiteNav } from "@/components/plotra/site-nav";
import { SiteFooter } from "@/components/plotra/site-footer";
import { HowItWorksSection } from "@/components/plotra/sections/how-it-works-section";

export default function HowItWorksPage() {
  return (
    <main className="overflow-x-clip">
      <SiteNav />
      <div className="pt-24 sm:pt-28">
        <HowItWorksSection />
      </div>
      <SiteFooter />
    </main>
  );
}
