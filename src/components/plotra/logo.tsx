import plotraIcon from "@/assets/plotra-icon.png";
import { cn } from "@/lib/utils";

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
        alt=""
        aria-hidden
        className="h-10 w-auto shrink-0 object-contain sm:h-11"
      />
      Plotra
    </span>
  );
}
