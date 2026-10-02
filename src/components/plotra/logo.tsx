import plotraIcon from "@/assets/plotra-icon.png";
import lockupDark from "@/assets/plotraa-logo-full.png";
import lockupLight from "@/assets/plotraa-logo-full-light.png";
import { cn } from "@/lib/utils";

/**
 * Compact logo for bars and sidebars: the mark with "Plotraa" set beside it.
 * The full lockup (below) is stacked, so at nav height its wordmark and
 * tagline would be too small to read.
 */
export function PlotraLogo({
  className,
  tone = "ink",
}: {
  className?: string;
  tone?: "ink" | "light";
}) {
  return (
    <span
      className={cn(
        "font-display inline-flex items-center gap-2.5 text-xl font-bold tracking-tight sm:text-2xl",
        tone === "light" ? "text-ink-foreground" : "text-ink",
        className,
      )}
    >
      <img
        src={plotraIcon}
        alt="Plotraa logo"
        className="h-10 w-auto shrink-0 object-contain sm:h-11"
      />
      Plotraa
    </span>
  );
}

/**
 * Full logo: mark + PLOTRAA wordmark + "Ek Text. Ek Listing." tagline.
 * Use where there is room for it (footer, sign-in cards).
 * tone="light" is the version for dark backgrounds — same artwork with the
 * tagline and ™ in white instead of dark brown.
 */
export function PlotraLockup({
  className,
  tone = "ink",
}: {
  className?: string;
  tone?: "ink" | "light";
}) {
  return (
    <img
      src={tone === "light" ? lockupLight : lockupDark}
      alt="Plotraa — Ek Text. Ek Listing."
      width={440}
      height={489}
      className={cn("h-28 w-auto object-contain", className)}
    />
  );
}
