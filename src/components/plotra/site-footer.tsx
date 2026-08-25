import { Link } from "react-router-dom";
import { PlotraLogo } from "@/components/plotra/logo";

const columns = [
  {
    title: "Product",
    links: [
      { label: "How it works", href: "/how-it-works" },
      { label: "Showcase reel", href: "/#showcase" },
      { label: "Featured listings", href: "/#listings" },
      { label: "Pricing", href: "/pricing" },
      { label: "Dealer dashboard", href: "/dashboard" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Team", href: "/team" },
      { label: "Request access", href: "/request-access" },
      { label: "Sign in", href: "/login" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Terms & Conditions", href: "/legal?section=terms-conditions" },
      { label: "Privacy Policy", href: "/legal?section=privacy-policy" },
      { label: "Refund Policy", href: "/legal?section=refund-cancellation-policy" },
      { label: "All legal pages", href: "/legal" },
    ],
  },
  {
    title: "Contact",
    links: [
      { label: "hello@plotra.in", href: "mailto:hello@plotra.in" },
      { label: "+91 83600 98455", href: "tel:+918360098455" },
      { label: "Ludhiana, Punjab", href: "/#listings" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="bg-ink text-ink-foreground">
      <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
        <div className="grid gap-12 md:grid-cols-[1.2fr_repeat(4,1fr)]">
          <div>
            <PlotraLogo tone="light" />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink-foreground/60">
              The WhatsApp-native real estate CRM built for Punjab property dealers.
            </p>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <p className="label-eyebrow text-accent">{col.title}</p>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <a
                      href={l.href}
                      className="text-sm text-ink-foreground/65 transition-colors duration-300 hover:text-ink-foreground"
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-white/10 pt-6 text-xs text-ink-foreground/50 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Plotra Technologies. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link
              to="/legal?section=privacy-policy"
              className="transition-colors hover:text-primary"
            >
              Privacy
            </Link>
            <Link
              to="/legal?section=terms-conditions"
              className="transition-colors hover:text-primary"
            >
              Terms
            </Link>
            <span className="inline-flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-accent pulse-soft" />
              All systems live
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
