import { Link } from "react-router-dom";
import { SiteNav } from "@/components/plotra/site-nav";
import { SiteFooter } from "@/components/plotra/site-footer";
import { PageSeo } from "@/components/Seo";
import { CtaBox, LastUpdated, PageHeader } from "@/components/plotra/content-blocks";
import { CITIES_SERVED, COMPANY, EMAIL, PHONE_DISPLAY, WHATSAPP_URL, ADDRESS_LINE } from "@/seo/site-info.js";

export default function AboutPage() {
  const facts: [string, React.ReactNode][] = [
    ["Product name", "Plotraa"],
    ["Maker", COMPANY],
    ["Based in", ADDRESS_LINE],
    ["Serves", CITIES_SERVED.join(", ")],
    [
      "Contact",
      <>
        WhatsApp{" "}
        <a href={WHATSAPP_URL} className="text-primary hover:underline">
          {PHONE_DISPLAY}
        </a>
        ,{" "}
        <a href={`mailto:${EMAIL}`} className="text-primary hover:underline">
          {EMAIL}
        </a>
      </>,
    ],
  ];

  return (
    <main className="overflow-x-clip">
      <PageSeo path="/about" />
      <SiteNav />
      <PageHeader
        eyebrow="About"
        h1="About Plotraa"
        intro={`Plotraa is WhatsApp-first real estate software for property dealers in India. It was built in Ludhiana, Punjab by ${COMPANY}, a software and digital marketing company in Model Town, Ludhiana.`}
      />
      <section className="bg-background px-5 py-16 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-4xl space-y-12">
          <div>
            <h2 className="font-display text-2xl font-bold text-ink sm:text-3xl">Why we built Plotraa</h2>
            <p className="mt-4 text-base leading-relaxed text-foreground/80">
              Property dealers in Punjab already run their business on WhatsApp. They post the same plot in many
              groups, lose track of which listing is current, and miss buyer messages. Plotraa keeps that habit and
              fixes the mess: one WhatsApp message becomes one clean listing with one link, and every enquiry is saved.
            </p>
            <p className="mt-4 text-base leading-relaxed text-foreground/80">
              See <Link to="/how-it-works" className="font-semibold text-primary hover:underline">how Plotraa works</Link>,
              meet <Link to="/team" className="font-semibold text-primary hover:underline">the team</Link>, or read the{" "}
              <Link to="/faq" className="font-semibold text-primary hover:underline">FAQ</Link>.
            </p>
          </div>

          <div>
            <h2 className="font-display text-2xl font-bold text-ink sm:text-3xl">Plotraa at a glance</h2>
            <dl className="mt-5 divide-y divide-border rounded-2xl border border-border">
              {facts.map(([k, v]) => (
                <div key={k} className="grid gap-1 px-5 py-4 sm:grid-cols-[12rem_1fr]">
                  <dt className="text-sm font-semibold text-ink">{k}</dt>
                  <dd className="text-sm text-foreground/80">{v}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div>
            <h2 className="font-display text-2xl font-bold text-ink sm:text-3xl">Not to be confused with “Plotra”</h2>
            <p className="mt-4 text-base leading-relaxed text-foreground/80">
              “Plotra” is an unrelated comics app. Our name is spelled Plotraa, with two a’s, and we make real estate
              software for property dealers.
            </p>
          </div>

          <CtaBox title="Talk to the Plotraa team" text={`WhatsApp ${PHONE_DISPLAY} or request access.`} />
          <LastUpdated />
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
