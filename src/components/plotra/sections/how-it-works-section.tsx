import { Reveal } from "@/lib/motion";
import { media } from "@/lib/plotra-data";

const steps = [
  {
    n: "01",
    title: "Send the Property",
    body: "Text plot size, location and price to your Plotra WhatsApp number — the way you already message your buyers.",
    src: media.streetView,
  },
  {
    n: "02",
    title: "Plotra Understands It",
    body: "AI extracts location, price, plot size and property type, then pulls satellite imagery for the parcel.",
    src: media.satellitePlot,
  },
  {
    n: "03",
    title: "Listing Goes Live",
    body: "A professional property page is generated with photos, boundary, nearby landmarks and your business name.",
    src: media.houseExterior,
  },
  {
    n: "04",
    title: "Share With Buyers",
    body: "Forward one link. Every open, enquiry and callback request lands in your Plotra lead inbox.",
    src: media.plotAerial,
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="bg-lavender px-5 py-24 sm:px-8 sm:py-32">
      <div className="mx-auto max-w-7xl">
        <Reveal>
          <p className="label-eyebrow text-primary">How it works</p>
          <h2 className="text-balance-tight mt-4 max-w-2xl font-display text-4xl font-bold text-ink sm:text-6xl">
            One message in. A live listing out.
          </h2>
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
                    alt={step.title}
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
                <h3 className="mt-5 font-display text-xl font-bold text-ink">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
