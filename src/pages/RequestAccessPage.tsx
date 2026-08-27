import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PlotraLogo } from "@/components/plotra/logo";
import { SiteNav } from "@/components/plotra/site-nav";
import { SiteFooter } from "@/components/plotra/site-footer";
import { media } from "@/lib/plotra-data";
import { Reveal, useParallax } from "@/lib/motion";
import { ApiError, submitAccessRequest } from "@/lib/plotra-api";

export default function RequestAccessPage() {
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const bgRef = useParallax<HTMLImageElement>(0.1);

  return (
    <>
    <SiteNav />
    <main className="grid min-h-[100svh] overflow-x-clip lg:grid-cols-2">
      <div className="relative hidden overflow-hidden lg:block">
        <img
          ref={bgRef}
          src={media.plotAerial}
          alt="Aerial view of plots along a Punjab highway"
          className="absolute inset-0 size-full scale-125 object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/50 to-transparent" />
        <div className="absolute bottom-10 left-10 max-w-sm">
          <p className="label-eyebrow text-accent">Onboarding</p>
          <p className="mt-3 font-display text-3xl font-bold leading-tight text-ink-foreground">
            We onboard dealers city by city, with a real setup call.
          </p>
        </div>
      </div>

      <div className="flex items-start justify-center bg-background px-5 pb-16 pt-28 sm:px-10 sm:pt-32">
        <Reveal className="w-full max-w-md">
          <Link to="/">
            <PlotraLogo />
          </Link>

          {sent ? (
            <div className="mt-10">
              <span className="grid size-12 place-items-center rounded-full bg-accent/20 text-accent">
                <Check className="size-6" />
              </span>
              <h1 className="mt-6 font-display text-3xl font-bold text-ink">Request submitted</h1>
              <p className="mt-3 text-sm text-muted-foreground">
                Your request has been submitted. Our team reviews new dealer accounts within one
                working day and will contact you on the number you shared.
              </p>
              <Button asChild variant="ink" size="lg" className="mt-8">
                <Link to="/">Back to home</Link>
              </Button>
            </div>
          ) : (
            <>
              <h1 className="mt-8 font-display text-4xl font-bold text-ink">Request access</h1>
              <p className="mt-3 text-sm text-muted-foreground">
                Accounts are invite and admin-approval only.
              </p>
              <form
                className="mt-8 space-y-4"
                onSubmit={async (e) => {
                  e.preventDefault();
                  const form = new FormData(e.currentTarget);
                  setSubmitting(true);
                  setError("");
                  try {
                    await submitAccessRequest({
                      businessName: String(form.get("businessName") ?? ""),
                      contactName: String(form.get("contactName") ?? ""),
                      email: String(form.get("email") ?? ""),
                      phone: String(form.get("phone") ?? ""),
                      message: String(form.get("message") ?? "") || undefined,
                    });
                    setSent(true);
                  } catch (err) {
                    const message =
                      err instanceof ApiError
                        ? err.message
                        : "Could not submit your request. Try again.";
                    setError(message);
                  } finally {
                    setSubmitting(false);
                  }
                }}
              >
                <Field
                  name="businessName"
                  label="Business name"
                  required
                  placeholder="Sandhu Property Consultants"
                />
                <Field
                  name="contactName"
                  label="Contact name"
                  required
                  placeholder="Jaskaran Sandhu"
                />
                <Field
                  name="email"
                  label="Email"
                  type="email"
                  required
                  placeholder="you@business.in"
                />
                <Field
                  name="phone"
                  label="Phone"
                  type="tel"
                  required
                  placeholder="+91 98140 00000"
                />
                <label className="block">
                  <span className="label-eyebrow text-muted-foreground">Message (optional)</span>
                  <textarea
                    name="message"
                    rows={3}
                    placeholder="Cities you work in, roughly how many listings you handle…"
                    className="mt-2 w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground outline-none transition-all duration-500 focus:border-primary focus:shadow-[var(--shadow-glow)]"
                  />
                </label>
                {error ? <p className="text-xs font-medium text-destructive">{error}</p> : null}
                <Button
                  type="submit"
                  variant="hero"
                  size="lg"
                  className="w-full"
                  disabled={submitting}
                >
                  {submitting ? "Submitting…" : "Submit Request"} <ArrowRight />
                </Button>
              </form>
            </>
          )}
        </Reveal>
      </div>
    </main>
    <SiteFooter />
    </>
  );
}

function Field({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="label-eyebrow text-muted-foreground">{label}</span>
      <input
        {...props}
        className="mt-2 w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground outline-none transition-all duration-500 focus:border-primary focus:shadow-[var(--shadow-glow)]"
      />
    </label>
  );
}
