import { Link } from "react-router-dom";
import { ArrowUpRight, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { PopImage, MetaPill } from "@/components/plotra/media";
import type { Listing } from "@/lib/plotra-data";

export function PropertyCard({
  listing,
  className,
  ratio = "aspect-[4/3]",
}: {
  listing: Listing;
  className?: string;
  ratio?: string;
}) {
  return (
    <Link
      to={`/p/${listing.id}`}
      className={cn("group/card block", className)}
    >
      <PopImage
        src={listing.image}
        alt={listing.title}
        ratio={ratio}
        className="lift"
        overlay={
          <>
            <div className="veil pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-700 group-hover/card:opacity-100" />
            <div className="absolute left-4 top-4">
              <MetaPill className="text-accent">{listing.type}</MetaPill>
            </div>
            <div className="absolute inset-x-4 bottom-4">
              <div className="translate-y-2 transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/card:translate-y-0">
                <p className="font-display text-2xl font-bold text-ink-foreground drop-shadow-sm">
                  {listing.price}
                </p>
                <p className="mt-0.5 flex items-center gap-1.5 text-xs font-medium text-ink-foreground/85">
                  <MapPin className="size-3.5 text-primary transition-transform duration-500 group-hover/card:-translate-y-0.5" />
                  {listing.city} · {listing.area}
                </p>
              </div>
              <span className="mt-3 flex translate-y-3 items-center gap-1.5 text-xs font-semibold text-ink-foreground opacity-0 transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/card:translate-y-0 group-hover/card:opacity-100">
                View on Plotra <ArrowUpRight className="size-3.5" />
              </span>
            </div>
          </>
        }
      />
      <p className="mt-3 text-sm font-semibold text-foreground">{listing.title}</p>
    </Link>
  );
}
