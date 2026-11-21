import { Link } from "react-router-dom";
import { ArrowRight, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WHATSAPP_URL, CONTENT_UPDATED_ISO, CONTENT_UPDATED_LABEL } from "@/seo/site-info.js";

export type RichPart = string | { text: string; to: string };
export type Rich = string | RichPart[];

/** Text with optional internal links: "a" or ["see ", {text, to}, "."] */
export function RichText({ value }: { value: Rich }) {
  if (typeof value === "string") return <>{value}</>;
  return (
    <>
      {value.map((part, i) =>
        typeof part === "string" ? (
          <span key={i}>{part}</span>
        ) : (
          <Link key={i} to={part.to} className="font-semibold text-primary underline-offset-4 hover:underline">
            {part.text}
          </Link>
        ),
      )}
    </>
  );
}

export type FaqItem = { id: string; q: string; a: string };

/** FAQ questions as plain, always-visible text (no accordions — bots and
 *  AI tools must be able to read every answer in the HTML). */
export function FaqList({ items, headingLevel = "h3" }: { items: FaqItem[]; headingLevel?: "h2" | "h3" }) {
  const Q = headingLevel;
  return (
    <dl className="divide-y divide-border rounded-[1.75rem] border border-border bg-card">
      {items.map((it) => (
        <div key={it.id} id={it.id} className="p-6 sm:p-8">
          <dt>
            <Q className="font-display text-lg font-bold text-ink sm:text-xl">{it.q}</Q>
          </dt>
          <dd className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">{it.a}</dd>
        </div>
      ))}
    </dl>
  );
}

export function LastUpdated({ prefix }: { prefix?: string }) {
  return (
    <p className="text-xs text-muted-foreground">
      {prefix ? `${prefix} ` : ""}Last updated: <time dateTime={CONTENT_UPDATED_ISO}>{CONTENT_UPDATED_LABEL}</time>
    </p>
  );
}

export function CtaBox({ title, text }: { title: string; text: string }) {
  return (
    <div className="mt-16 rounded-[2rem] bg-gradient-to-br from-primary to-accent p-10 text-center text-primary-foreground sm:p-14">
      <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">{title}</h2>
      <p className="mx-auto mt-3 max-w-xl text-primary-foreground/85">{text}</p>
      <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
        <Button asChild variant="ink" size="lg">
          <Link to="/request-access">
            Request Access <ArrowRight />
          </Link>
        </Button>
        <Button asChild variant="outline" size="lg" className="bg-white/90 text-ink hover:bg-white">
          <a href={WHATSAPP_URL} target="_blank" rel="noreferrer">
            <MessageCircle /> WhatsApp us
          </a>
        </Button>
      </div>
    </div>
  );
}

/** Lavender page header used by the text-first SEO pages. */
export function PageHeader({ eyebrow, h1, intro }: { eyebrow?: string; h1: string; intro?: string }) {
  return (
    <section className="bg-lavender px-5 pb-14 pt-32 sm:px-8 sm:pt-40">
      <div className="mx-auto max-w-4xl">
        {eyebrow ? <p className="label-eyebrow text-primary">{eyebrow}</p> : null}
        <h1 className="text-balance-tight mt-4 font-display text-4xl font-bold text-ink sm:text-6xl">{h1}</h1>
        {intro ? (
          <p className="mt-6 max-w-3xl text-base leading-relaxed text-foreground/80 sm:text-lg">{intro}</p>
        ) : null}
      </div>
    </section>
  );
}
