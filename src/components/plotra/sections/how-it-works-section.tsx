import { Reveal } from "@/lib/motion";
import { media } from "@/lib/plotra-data";

const steps = [
  {
    n: "01",
    title: "Send the Property",
    pageTitle: "1. Send the property on WhatsApp",
    body: "Text plot size, location and price to your Plotraa WhatsApp number — the way you already message your buyers.",
    src: media.streetView,
    alt: "Dealer sending plot size, location and price to Plotraa on WhatsApp",
  },
  {
    n: "02",
    title: "Plotraa Understands It",
    pageTitle: "2. Plotraa's AI understands it",
    body: "AI extracts location, price, plot size and property type, then pulls satellite imagery for the parcel.",
    src: media.satellitePlot,
    alt: "Plotraa AI pulling satellite imagery for a plot from the dealer's message",
  },
  {
    n: "03",
    title: "Listing Goes Live",
    pageTitle: "3. Your property listing goes live",
    body: "A professional property page is generated with photos, boundary, nearby landmarks and your business name.",
    src: media.houseExterior,
    alt: "Live Plotraa property listing page with photos and landmarks",
  },
  {
    n: "04",
    title: "Share With Buyers",
    pageTitle: "4. Share with buyers and track leads",
    body: "Forward one link. Every open, enquiry and callback request lands in your Plotraa lead inbox.",
    src: media.plotAerial,
    alt: "Plotraa listing link shared with buyers, with enquiries in the lead inbox",
  },
];

/**
 * `asPage` is used on /how-it-works: the section heading becomes the page H1
 * (with an intro paragraph) and each step title becomes an H2. On the home
 * page the section keeps an H2 heading with H3 step titles.
 */
export function HowItWorksSection({ asPage = false }: { asPage?: boolean }) {
  const Heading = asPage ? "h1" : "h2";
  const StepHeading = asPage ? "h2" : "h3";

  return (
    <section id="how-it-works" className="bg-lavender px-5 py-24 sm:px-8 sm:py-32">
      <div className="mx-auto max-w-7xl">
        <Reveal>
          <p className="label-eyebrow text-primary">How it works</p>
          <Heading className="text-balance-tight mt-4 max-w-2xl font-display text-4xl font-bold text-ink sm:text-6xl">
            {asPage
              ? "How Plotraa works: one WhatsApp message in, a live listing out"
              : "One message in. A live listing out."}
          </Heading>
          {asPage ? (
            <p className="mt-5 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              Property dealers create listings on Plotraa without forms or apps. Four steps, all on
              WhatsApp.
            </p>
          ) : null}
        </Reveal>

        <div className="mt-16 grid gap-8 lg:grid-cols-4">
          {steps.map((step, i) => (
            <Reveal key={step.n} delay={i * 120} className="relative">
              {i < steps.length - 1 ? (
                <span className="absolute -right-4 top-[28%] hidden h-px w-8 bg-gradient-to-r from-primary to-accent lg:block" />
              ) : null}
              <div className="group">
                <div className="media-zoom relative aspect-[9/16] overflow-hidden rounded-3xl shadow-[var(--shadow-lift)] lg:aspect-[3/4]">
                  <img
                    src={step.src}
                    alt={step.alt}
                    loading="lazy"
                    className="size-full object-cover"
                  />
                  <span className="veil absolute inset-0" />
                  <span className="font-display absolute left-4 top-4 text-3xl font-bold text-ink-foreground/85">
                    {step.n}
                  </span>
                  <span className="absolute bottom-4 left-4 inline-flex items-center gap-2 rounded-full bg-accent/90 py-1 pl-3.5 pr-3 text-[10px] font-bold uppercase tracking-widest text-accent-foreground">
                    Step live
                  </span>
                </div>
                <StepHeading className="mt-5 font-display text-xl font-bold text-ink">
                  {asPage ? step.pageTitle : step.title}
                </StepHeading>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
