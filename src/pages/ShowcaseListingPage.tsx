import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowUpRight, MapPin, MessageCircle, Ruler, Tag } from "lucide-react";
import { SiteNav } from "@/components/plotra/site-nav";
import { SiteFooter } from "@/components/plotra/site-footer";
import { PopImage, MetaPill } from "@/components/plotra/media";
import { Reveal } from "@/lib/motion";
import { listings } from "@/lib/plotra-data";

export default function ShowcaseListingPage() {
  const { id } = useParams();
  const listing = listings.find((item) => item.id === id);

  if (!listing) {
    return <Navigate to="/#listings" replace />;
  }

  const related = listings.filter((item) => item.id !== listing.id).slice(0, 3);

  return (
    <main className="overflow-x-clip">
      <SiteNav />

      <section className="bg-lavender px-5 pb-16 pt-32 sm:px-8 sm:pt-40">
        <div className="mx-auto max-w-7xl">
          <Reveal>
            <p className="label-eyebrow text-primary">Sample Plotraa listing</p>
            <h1 className="text-balance-tight mt-4 max-w-2xl font-display text-4xl font-bold text-ink sm:text-6xl">
              {listing.title}
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              This is a sample page shown for demonstration only — it's here to show dealers what a
              buyer sees. Real Plotraa listings are created by a dealer in under a minute over
              WhatsApp and go live at their own shareable link.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="bg-background px-5 py-16 sm:px-8 sm:py-20">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.3fr_1fr]">
          <Reveal>
            <PopImage
              src={listing.image}
              alt={listing.title}
              ratio="aspect-[4/3]"
              className="shadow-[var(--shadow-lift)]"
              priority
              overlay={
                <div className="absolute left-4 top-4">
                  <MetaPill className="text-accent">{listing.type}</MetaPill>
                </div>
              }
            />
            <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
              {listing.description}
            </p>
          </Reveal>

          <Reveal delay={80} className="flex flex-col gap-6">
            <div className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-lift)]">
              <p className="font-display text-3xl font-bold text-ink">{listing.price}</p>
              <p className="mt-2 flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                <MapPin className="size-4 text-primary" />
                {listing.city}
              </p>
              <div className="mt-5 grid grid-cols-2 gap-4 border-t border-border pt-5 text-sm">
                <div>
                  <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <Ruler className="size-3.5" /> Area
                  </p>
                  <p className="mt-1 font-semibold text-ink">{listing.area}</p>
                </div>
                <div>
                  <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <Tag className="size-3.5" /> Type
                  </p>
                  <p className="mt-1 font-semibold text-ink">{listing.type}</p>
                </div>
              </div>
              <p className="mt-5 border-t border-border pt-5 text-xs text-muted-foreground">
                Listed by {listing.dealer} on Plotraa
              </p>
              <a
                href="https://wa.me/918360098455?text=Hi%2C%20I%27d%20like%20to%20know%20more%20about%20Plotraa"
                target="_blank"
                rel="noreferrer"
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-transform duration-300 hover:scale-[1.02]"
              >
                <MessageCircle className="size-4" />
                Ask about listings like this on WhatsApp
              </a>
            </div>

            <div className="rounded-3xl border border-border bg-card p-6">
              <p className="text-sm font-semibold text-ink">How this went live</p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                The dealer texted the plot size, location and price to their Plotraa WhatsApp
                number. Plotraa pulled satellite imagery, traced the boundary and published this
                page automatically — no forms, no app to install.
              </p>
              <Link
                to="/how-it-works"
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary"
              >
                See how Plotraa works <ArrowUpRight className="size-3.5" />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {related.length > 0 && (
        <section className="bg-lavender px-5 py-16 sm:px-8 sm:py-20">
          <div className="mx-auto max-w-7xl">
            <Reveal>
              <p className="label-eyebrow text-primary">More sample listings</p>
            </Reveal>
            <div className="mt-8 grid gap-6 sm:grid-cols-3">
              {related.map((item) => (
                <Link key={item.id} to={`/showcase/${item.id}`} className="group/card block">
                  <PopImage
                    src={item.image}
                    alt={item.title}
                    ratio="aspect-[4/3]"
                    overlay={
                      <div className="absolute inset-x-4 bottom-4">
                        <p className="font-display text-lg font-bold text-ink-foreground drop-shadow-sm">
                          {item.price}
                        </p>
                      </div>
                    }
                  />
                  <p className="mt-3 text-sm font-semibold text-foreground">{item.title}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <SiteFooter />
    </main>
  );
}
