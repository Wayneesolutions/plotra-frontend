import logoHorizontal from "@/assets/plotraa-logo-horizontal.png";
import lockupDark from "@/assets/plotraa-logo-full.png";
import lockupLight from "@/assets/plotraa-logo-full-light.png";
import { cn } from "@/lib/utils";

/**
 * Logo for bars and headers: the mark with the PLOTRAA wordmark beside it,
 * both taken from the brand artwork (plotraa-logo-horizontal.png). The
 * stacked lockup below also carries the tagline, which is unreadable at
 * nav height. The artwork is orange on transparent, so the same file works
 * on light and dark bars — `tone` is kept only so existing callers compile.
 */
export function PlotraLogo({
  className,
}: {
  className?: string;
  tone?: "ink" | "light";
}) {
  return (
    <img
      src={logoHorizontal}
      alt="Plotraa"
      width={673}
      height={176}
      className={cn("h-7 w-auto shrink-0 object-contain sm:h-11", className)}
    />
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
