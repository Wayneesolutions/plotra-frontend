import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Reveal, useParallax } from "@/lib/motion";

/**
 * Property image with the "pop" reveal: starts ~95% scale, blurred, masked,
 * then sharpens into place. Optional slow parallax and hover cine-zoom.
 */
export function PopImage({
  src,
  alt,
  className,
  imgClassName,
  parallax = 0,
  ratio = "aspect-[4/3]",
  overlay,
  priority = false,
  width,
  height,
}: {
  src: string;
  alt: string;
  className?: string;
  imgClassName?: string;
  parallax?: number;
  ratio?: string;
  overlay?: ReactNode;
  priority?: boolean;
  width?: number;
  height?: number;
}) {
  const parallaxRef = useParallax<HTMLImageElement>(parallax);

  return (
    <Reveal
      variant="pop"
      className={cn("media-zoom group relative overflow-hidden rounded-3xl", ratio, className)}
    >
      <img
        ref={parallax ? parallaxRef : undefined}
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? "eager" : "lazy"}
        className={cn("size-full scale-[1.06] object-cover", imgClassName)}
      />
      {overlay}
    </Reveal>
  );
}

/** Small glass metadata pill used over property media. */
export function MetaPill({
  children,
  className,
  tone = "dark",
}: {
  children: ReactNode;
  className?: string;
  tone?: "dark" | "light";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold",
        tone === "dark" ? "glass text-ink-foreground" : "glass-light text-ink",
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Floating editorial media card: rounded, slightly rotated, gently floating. */
export function FloatingMedia({
  src,
  alt,
  caption,
  price,
  className,
  rotate = "-1.4deg",
}: {
  src: string;
  alt: string;
  caption: string;
  price: string;
  className?: string;
  rotate?: string;
}) {
  return (
    <div className={cn("float-slower", className)} style={{ rotate }}>
      <PopImage
        src={src}
        alt={alt}
        ratio="aspect-[5/4]"
        className="shadow-[var(--shadow-float)]"
        overlay={
          <>
            <div className="veil pointer-events-none absolute inset-0 opacity-80" />
            <div className="absolute inset-x-4 bottom-4 flex flex-wrap items-center justify-between gap-2">
              <MetaPill>{caption}</MetaPill>
              <MetaPill className="text-accent">{price}</MetaPill>
            </div>
          </>
        }
      />
    </div>
  );
}
