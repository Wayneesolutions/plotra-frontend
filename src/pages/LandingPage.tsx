import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  MessageCircle,
  Sparkles,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteNav } from "@/components/plotra/site-nav";
import { SiteFooter } from "@/components/plotra/site-footer";
import { PhoneMockup } from "@/components/plotra/phone-mockup";
import { FloatingMedia, MetaPill, PopImage } from "@/components/plotra/media";
import { HowItWorksSection } from "@/components/plotra/sections/how-it-works-section";
import { ShowcaseSection } from "@/components/plotra/sections/showcase-section";
import { ListingsSection } from "@/components/plotra/sections/listings-section";
import { PricingSection } from "@/components/plotra/sections/pricing-section";
import { Reveal, useCountUp, useMagnetic, useParallax } from "@/lib/motion";
import { listings, media } from "@/lib/plotra-data";
import { cn } from "@/lib/utils";
import { PageSeo } from "@/components/Seo";
import { FaqList } from "@/components/plotra/content-blocks";
import { faqItems, HOME_FAQ_IDS } from "@/content/faq.js";
import { getPrerenderData } from "@/lib/prerender-data";

export default function LandingPage() {
  return (
    <main className="overflow-x-clip">
      <PageSeo path="/" />
      <SiteNav />
      <Hero />
      <Bridge />
      <HowItWorksSection />
      <WhoUsesPlotraa />
      <ShowcaseSection />
      <ListingsSection />
      <SatelliteStory />
      <Trust />
      <PricingSection />
      <HomeFaq />
      <FinalCta />
      <SiteFooter />
    </main>
  );
}

function Hero() {
  const ctaRef = useMagnetic<HTMLAnchorElement>(0.22);

  return (
    <section className="relative min-h-[100svh] w-full overflow-hidden bg-ink">
      <img
        src={media.heroAerial}
        alt="Plotraa turns a WhatsApp message into a property listing"
        width={1920}
        height={1080}
        className="absolute inset-0 size-full scale-110 object-cover kenburns"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-ink/75 via-ink/35 to-ink/85" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_20%,transparent,oklch(0.219_0.032_264.2/0.55))]" />

      <div className="relative mx-auto grid min-h-[100svh] max-w-7xl items-center gap-12 px-5 pb-28 pt-32 sm:px-8 lg:grid-cols-[1.15fr_0.85fr] lg:pt-36">
        <div className="relative">
          <Reveal>
            <MetaPill className="text-accent">
              <span className="size-1.5 rounded-full bg-accent pulse-soft" /> WhatsApp-native
              real estate CRM for property dealers
            </MetaPill>
          </Reveal>

          <h1 className="text-balance-tight mt-7 font-display text-[13vw] font-bold text-ink-foreground sm:text-6xl lg:text-[5.2rem]">
            <span className="mb-3 block font-sans text-base font-semibold uppercase tracking-[0.2em] text-accent sm:text-lg">
              Plotraa:
            </span>
            {["List a property", "by simply sending", "a WhatsApp message."].map((line, i) => (
              <Reveal key={line} delay={i * 140} className="block">
                <span className={cn(i === 2 && "text-primary")}>{line}</span>
              </Reveal>
            ))}
          </h1>

          <Reveal delay={420}>
            <p className="mt-6 max-w-lg text-base leading-relaxed text-ink-foreground/75 sm:text-lg">
              Plotraa is a WhatsApp real estate CRM for property dealers and agents in Punjab and
              Chandigarh. You send plot size, location, price and photos as a normal WhatsApp
              message, and Plotraa turns it into a listing page you can share with buyers. Every
              enquiry lands in one dashboard, so no lead is lost in chats.
            </p>
          </Reveal>

          <Reveal delay={560}>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <Link ref={ctaRef} to="/request-access" className="inline-block">
                <Button variant="hero" size="xl" asChild>
                  <span>
                    Request Access <ArrowRight />
                  </span>
                </Button>
              </Link>
              <a
                href="#how-it-works"
                className="group inline-flex items-center gap-2 text-sm font-semibold text-ink-foreground/80 transition-colors hover:text-ink-foreground"
              >
                See how Plotraa works
                <span className="transition-transform duration-500 group-hover:translate-y-1">
                  ↓
                </span>
              </a>
            </div>
          </Reveal>

        </div>

        <div className="relative mt-4 lg:mt-0">
          <PhoneMockup />
          <MetaPill className="float-slower absolute -left-2 top-6 text-accent sm:left-2">
            <Sparkles className="size-3.5" /> AI Listing Created ✓
          </MetaPill>
          <MetaPill className="float-slow absolute -right-1 bottom-24 sm:right-4">
            <MessageCircle className="size-3.5 text-accent" /> New buyer message
          </MetaPill>
        </div>
      </div>

    
    </section>
  );
}

function Bridge() {
  const items = [
    "AI extraction in Punjabi, Hindi & English",
    "Satellite plot boundary",
    "Live shareable listing link",
    "Lead scoring built in",
    "No app for your buyers",
  ];
  return (
    <section className=" rounded-t-[2.5rem] bg-lavender py-6">
      <div
        className="flex overflow-hidden"
        style={{
          maskImage: "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
          WebkitMaskImage:
            "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
        }}
      >
        <div className="marquee-x flex shrink-0 items-center gap-10 whitespace-nowrap pr-10">
          {[...items, ...items].map((item, i) => (
            <span
              key={i}
              className="flex items-center gap-3 text-sm font-medium text-indigo-deep/80"
            >
              <Zap className="size-3.5 text-primary" /> {item}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function WhoUsesPlotraa() {
  const who = [
    "Property dealers who post in many WhatsApp groups and lose track of listings.",
    "Dealer offices with 2–5 agents who need to see who listed what.",
    "Colony and plot sellers in Ludhiana, Mohali, Kharar, Jalandhar and Patiala who want one clean link per property.",
  ];
  const linkCls = "font-semibold text-primary underline-offset-4 hover:underline";
  return (
    <section className="bg-background px-5 py-20 sm:px-8 sm:py-24">
      <div className="mx-auto max-w-5xl">
        <Reveal>
          <p className="label-eyebrow text-primary">Built for dealers</p>
          <h2 className="text-balance-tight mt-4 font-display text-4xl font-bold text-ink sm:text-5xl">
            Who uses Plotraa
          </h2>
        </Reveal>
        <ul className="mt-8 grid gap-5 md:grid-cols-3">
          {who.map((w) => (
            <li key={w} className="rounded-3xl border border-border bg-card p-6 text-sm leading-relaxed text-foreground">
              <Check className="mb-3 size-5 text-accent" />
              {w}
            </li>
          ))}
        </ul>
        <p className="mt-8 max-w-3xl text-base leading-relaxed text-muted-foreground">
          Comparing tools? Read our guide to the{" "}
          <Link to="/blog/best-crm-for-property-dealers-india" className={linkCls}>
            best CRM for property dealers in India
          </Link>
          . Plotraa is built in{" "}
          <Link to="/property-dealer-software-ludhiana" className={linkCls}>
            Ludhiana
          </Link>{" "}
          and works with dealers in{" "}
          <Link to="/property-dealer-software-mohali-kharar" className={linkCls}>
            Mohali &amp; Kharar
          </Link>
          .
        </p>
      </div>
    </section>
  );
}

function HomeFaq() {
  const items = faqItems(getPrerenderData().plans).filter((it) => HOME_FAQ_IDS.includes(it.id));
  return (
    <section className="bg-lavender px-5 py-20 sm:px-8 sm:py-24">
      <div className="mx-auto max-w-4xl">
        <h2 className="text-balance-tight font-display text-4xl font-bold text-ink sm:text-5xl">Plotraa FAQ</h2>
        <div className="mt-8">
          <FaqList items={items} />
        </div>
        <Link to="/faq" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary">
          See all questions <ArrowRight className="size-4" />
        </Link>
      </div>
    </section>
  );
}

function SatelliteStory() {
  return (
    <section className="relative overflow-hidden bg-lavender px-5 py-24 sm:px-8 sm:py-32">
      <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-2">
        <div className="relative">
          <PopImage
            src={media.satellitePlot}
            alt="Plotraa listing with plot location on satellite map"
            ratio="aspect-square"
            parallax={0.06}
            className="shadow-[var(--shadow-float)]"
            overlay={
              <>
                <svg
                  viewBox="0 0 100 100"
                  className="pointer-events-none absolute inset-0 size-full"
                  aria-hidden
                >
                  <polygon
                    points="30,32 70,34 69,70 31,72"
                    fill="oklch(0.7 0.184 33.5 / 0.12)"
                    stroke="oklch(0.7 0.184 33.5)"
                    strokeWidth="0.7"
                    strokeDasharray="160"
                    className="[stroke-dashoffset:0]"
                  />
                  {[
                    [30, 32],
                    [70, 34],
                    [69, 70],
                    [31, 72],
                  ].map(([x, y]) => (
                    <circle
                      key={`${x}-${y}`}
                      cx={x}
                      cy={y}
                      r="1.1"
                      fill="oklch(0.78 0.128 178.5)"
                    />
                  ))}
                </svg>
                <MetaPill className="absolute left-4 top-4 text-accent">
                  <Check className="size-3.5" /> Boundary verified
                </MetaPill>
              </>
            }
          />
          <FloatingMedia
            src={media.houseExterior}
            alt="House for sale listed on Plotraa by a property dealer via WhatsApp"
            caption="Ludhiana · 2,000 sq.ft"
            price="₹1.25 Cr"
            className="absolute -bottom-10 -right-4 w-44 sm:w-60"
            rotate="2deg"
          />
        </div>

        <Reveal>
          <p className="label-eyebrow text-primary">Satellite to street</p>
          <h2 className="text-balance-tight mt-4 font-display text-4xl font-bold text-ink sm:text-5xl">
            Satellite plot boundary on every property listing
          </h2>
          <p className="mt-5 max-w-md text-base leading-relaxed text-muted-foreground">
            Every Plotraa listing pairs satellite imagery with a traced plot boundary and real
            photography — so a buyer three cities away understands the parcel before they call.
          </p>
          <ul className="mt-8 space-y-3">
            {[
              "Trace the exact polygon on the satellite map",
              "Coral for active boundary, mint once verified",
              "Street view, aerial and walkthrough in one page",
              "WhatsApp link preview with a strong hero image",
            ].map((f) => (
              <li key={f} className="flex items-start gap-3 text-sm text-foreground">
                <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-accent/20 text-accent">
                  <Check className="size-3" />
                </span>
                {f}
              </li>
            ))}
          </ul>
          <Button asChild variant="ink" size="lg" className="mt-9">
            <Link to={`/showcase/${listings[0]!.id}`}>
              See a live listing <ArrowUpRight />
            </Link>
          </Button>
        </Reveal>
      </div>
    </section>
  );
}

const stats = [
  { value: 2500, suffix: "+", label: "Properties Listed" },
  { value: 450, suffix: "+", label: "Dealers" },
  { value: 12, suffix: "K+", label: "Buyer Conversations" },
  { value: 8000, suffix: "+", label: "Links Shared" },
];

function Trust() {
  const parallaxRef = useParallax<HTMLImageElement>(0.08);

  return (
    <section className="surface-ink overflow-hidden px-5 py-24 sm:px-8 sm:py-32">
      <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[1fr_1fr]">
        <div>
          <Reveal>
            <p className="label-eyebrow text-accent">Trusted across Punjab</p>
            <h2 className="text-balance-tight mt-4 max-w-lg font-display text-4xl font-bold text-ink-foreground sm:text-5xl">
              Numbers from real dealer activity
            </h2>
          </Reveal>
          <div className="mt-12 grid grid-cols-2 gap-x-8 gap-y-10">
            {stats.map((s, i) => (
              <Stat key={s.label} {...s} delay={i * 100} />
            ))}
          </div>
        </div>

        <Reveal
          variant="pop"
          className="media-zoom relative aspect-[4/3] overflow-hidden rounded-[2rem]"
        >
          <img
            ref={parallaxRef}
            src={media.nightNeighborhood}
            alt="Aerial night view of a residential neighbourhood with property listings"
            loading="lazy"
            className="size-full scale-110 object-cover"
          />
          <span className="veil absolute inset-0 opacity-70" />
          <MetaPill className="absolute bottom-5 left-5 text-accent">
            <span className="size-1.5 rounded-full bg-accent pulse-soft" /> 41 listings live tonight
          </MetaPill>
        </Reveal>
      </div>
    </section>
  );
}

function Stat({
  value,
  suffix,
  label,
  delay,
}: {
  value: number;
  suffix: string;
  label: string;
  delay: number;
}) {
  const { ref, display } = useCountUp(value);
  return (
    <Reveal delay={delay}>
      <p className="font-display text-5xl font-bold tracking-tight text-ink-foreground sm:text-6xl">
        <span ref={ref}>{display.toLocaleString("en-IN")}</span>
        <span className="text-primary">{suffix}</span>
      </p>
      <p className="mt-2 text-sm text-ink-foreground/60">{label}</p>
    </Reveal>
  );
}

function FinalCta() {
  return (
    <section className="relative isolate overflow-hidden">
      <div className="media-zoom relative min-h-[70vh]">
        <img
          src={media.nightNeighborhood}
          alt="Aerial night view of a residential neighbourhood with property listings"
          loading="lazy"
          className="absolute inset-0 size-full scale-105 object-cover kenburns"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/70 to-ink/25" />
        {[
          { top: "28%", left: "18%" },
          { top: "44%", left: "62%" },
          { top: "60%", left: "38%" },
        ].map((pos, i) => (
          <span
            key={i}
            className="absolute size-2 rounded-full bg-accent pulse-soft"
            style={{ ...pos, animationDelay: `${i * 700}ms` }}
          />
        ))}

        <div className="relative mx-auto flex min-h-[70vh] max-w-4xl flex-col items-center justify-center px-5 py-24 text-center sm:px-8">
          <Reveal>
            <h2 className="text-balance-tight font-display text-4xl font-bold text-ink-foreground sm:text-6xl">
              Turn WhatsApp messages into professional property listings
            </h2>
          </Reveal>
          <Reveal delay={160}>
            <p className="mt-6 max-w-xl text-base text-ink-foreground/70">
              Plotraa is invite-only while we onboard dealers city by city. Tell us about your
              business and we'll set you up.
            </p>
          </Reveal>
          <Reveal delay={280}>
            <Button asChild variant="hero" size="xl" className="mt-9">
              <Link to="/request-access">
                Request Access <ArrowRight />
              </Link>
            </Button>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
