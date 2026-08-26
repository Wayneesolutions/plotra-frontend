import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { PlotraLogo } from "@/components/plotra/logo";
import { SiteNav } from "@/components/plotra/site-nav";
import { SiteFooter } from "@/components/plotra/site-footer";
import { media } from "@/lib/plotra-data";
import { Reveal } from "@/lib/motion";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <>
      <SiteNav />
      <main className="relative grid min-h-[100svh] place-items-center overflow-hidden px-5 py-24">
        <img
          src={media.heroAerial}
          alt=""
          aria-hidden
          className="absolute inset-0 size-full scale-110 object-cover blur-[6px] kenburns"
        />
        <div className="absolute inset-0 bg-ink/80" />

        <Reveal className="relative w-full max-w-md">
          <div className="glass rounded-[1.75rem] p-8">
            <Link to="/" className="inline-block">
              <PlotraLogo tone="light" />
            </Link>
            <h1 className="mt-7 font-display text-3xl font-bold text-ink-foreground">{title}</h1>
            <p className="mt-2 text-sm text-ink-foreground/65">{subtitle}</p>
            <div className="mt-8">{children}</div>
            {footer ? <div className="mt-6 text-sm text-ink-foreground/60">{footer}</div> : null}
          </div>
        </Reveal>
      </main>
      <SiteFooter />
    </>
  );
}

export function AuthField({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="label-eyebrow text-ink-foreground/55">{label}</span>
      <input
        {...props}
        className="mt-2 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-ink-foreground outline-none transition-all duration-500 placeholder:text-ink-foreground/35 focus:border-primary focus:shadow-[var(--shadow-glow)] hover:bg-white/10 [&:-webkit-autofill]:[-webkit-text-fill-color:white] [&:-webkit-autofill]:[box-shadow:0_0_0px_1000px_rgba(0,0,0,0.3)_inset] [&:-webkit-autofill]:border-white/15"
      />
    </label>
  );
}
