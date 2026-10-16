import { useState } from "react";
import { Link } from "react-router-dom";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteNav } from "@/components/plotra/site-nav";
import { SiteFooter } from "@/components/plotra/site-footer";
import { PageSeo } from "@/components/Seo";
import { ApiError, submitSellProperty } from "@/lib/plotra-api";

const PROPERTY_TYPES = ["Plot", "House / Villa", "Apartment / Flat", "Commercial", "Agricultural land", "Other"];

const fieldClass =
  "mt-2 w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground outline-none transition-all duration-500 focus:border-primary focus:shadow-[var(--shadow-glow)]";

export default function SellPropertyPage() {
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const get = (k: string) => String(f.get(k) || "").trim();
    setSubmitting(true);
    setError("");
    try {
      await submitSellProperty({
        name: get("name"),
        phone: get("phone"),
        email: get("email"),
        propertyType: get("propertyType"),
        city: get("city"),
        locality: get("locality"),
        expectedPrice: get("expectedPrice"),
        sizeText: get("sizeText"),
        description: get("description"),
      });
      setSent(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <PageSeo path="/sell-property" />
      <SiteNav />
      <main className="flex min-h-[100svh] justify-center bg-background px-5 pb-16 pt-28 sm:px-10 sm:pt-32">
        <div className="w-full max-w-xl">
          {sent ? (
            <div className="text-center">
              <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Check className="size-7" />
              </span>
              <h1 className="mt-6 font-display text-3xl font-bold text-ink">We got your details</h1>
              <p className="mt-3 text-sm text-muted-foreground">
                Our team will review your property and connect you with a trusted dealer shortly.
              </p>
              <Button asChild variant="ink" size="lg" className="mt-8">
                <Link to="/">Back to home</Link>
              </Button>
            </div>
          ) : (
            <>
              <p className="label-eyebrow text-accent">Sell your property</p>
              <h1 className="mt-3 font-display text-4xl font-bold text-ink">Want to sell? Tell us about it.</h1>
              <p className="mt-3 text-sm text-muted-foreground">
                Share a few details and we will match you with a verified dealer who will reach out to you.
              </p>

              <form onSubmit={onSubmit} className="mt-8 space-y-4">
                {error ? (
                  <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    {error}
                  </div>
                ) : null}
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="label-eyebrow text-muted-foreground">Your name *</span>
                    <input name="name" required maxLength={255} className={fieldClass} />
                  </label>
                  <label className="block">
                    <span className="label-eyebrow text-muted-foreground">Phone *</span>
                    <input name="phone" type="tel" required placeholder="+91 98765 43210" className={fieldClass} />
                  </label>
                </div>
                <label className="block">
                  <span className="label-eyebrow text-muted-foreground">Email (optional)</span>
                  <input name="email" type="email" className={fieldClass} />
                </label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="label-eyebrow text-muted-foreground">Property type</span>
                    <select name="propertyType" defaultValue="" className={fieldClass}>
                      <option value="">Select…</option>
                      {PROPERTY_TYPES.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="label-eyebrow text-muted-foreground">Size (optional)</span>
                    <input name="sizeText" placeholder="e.g. 200 sq yd" maxLength={100} className={fieldClass} />
                  </label>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="label-eyebrow text-muted-foreground">City</span>
                    <input name="city" maxLength={100} className={fieldClass} />
                  </label>
                  <label className="block">
                    <span className="label-eyebrow text-muted-foreground">Locality / area</span>
                    <input name="locality" maxLength={255} className={fieldClass} />
                  </label>
                </div>
                <label className="block">
                  <span className="label-eyebrow text-muted-foreground">Expected price (optional)</span>
                  <input name="expectedPrice" placeholder="e.g. ₹85 lakh" maxLength={100} className={fieldClass} />
                </label>
                <label className="block">
                  <span className="label-eyebrow text-muted-foreground">Anything else (optional)</span>
                  <textarea name="description" rows={3} maxLength={2000} className={fieldClass} />
                </label>
                <Button type="submit" variant="hero" size="lg" className="w-full" disabled={submitting}>
                  {submitting ? "Submitting…" : "Submit property"}
                </Button>
              </form>
            </>
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
