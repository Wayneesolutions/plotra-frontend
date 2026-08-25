import { useRef, useState } from "react";
import { Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { media } from "@/lib/plotra-data";
import { Reveal } from "@/lib/motion";

const reels = [
  { category: "Listing", caption: "Listing goes live in 40 seconds", src: media.satellitePlot },
  { category: "WhatsApp", caption: "Dealer texts, Plotra replies", src: media.houseExterior },
  { category: "AI", caption: "AI answers a buyer in Punjabi", src: media.streetView },
  {
    category: "Walkthrough",
    caption: "Kothi walkthrough, Sector 91",
    src: media.nightNeighborhood,
  },
  { category: "Satellite", caption: "Plot boundary traced on satellite", src: media.plotAerial },
  { category: "Dashboard", caption: "Dealer dashboard, one morning", src: media.heroAerial },
  { category: "Leads", caption: "Lead notification hits the phone", src: media.streetView },
  { category: "Sharing", caption: "One link, forwarded 40 times", src: media.houseExterior },
];

export function ReelStrip() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const drag = useRef<{ x: number; left: number } | null>(null);
  const [progress, setProgress] = useState(0);

  const onScroll = () => {
    const el = trackRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setProgress(max > 0 ? el.scrollLeft / max : 0);
  };

  return (
    <div className="relative">
      <div
        ref={trackRef}
        onScroll={onScroll}
        onWheel={(e) => {
          const el = trackRef.current;
          if (!el) return;
          if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) el.scrollLeft += e.deltaY;
        }}
        onPointerDown={(e) => {
          drag.current = { x: e.clientX, left: trackRef.current?.scrollLeft ?? 0 };
        }}
        onPointerMove={(e) => {
          if (!drag.current || !trackRef.current) return;
          trackRef.current.scrollLeft = drag.current.left - (e.clientX - drag.current.x);
        }}
        onPointerUp={() => (drag.current = null)}
        onPointerLeave={() => (drag.current = null)}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-6 [scrollbar-width:none] sm:px-8 [&::-webkit-scrollbar]:hidden"
      >
        {reels.map((reel, i) => (
          <Reveal
            key={reel.caption}
            variant="pop"
            delay={i * 60}
            className={cn(
              "group relative aspect-[9/16] w-[62vw] shrink-0 snap-center overflow-hidden rounded-3xl shadow-[var(--shadow-lift)] transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] sm:w-[248px]",
              active === i ? "sm:scale-[1.04]" : "sm:scale-100 sm:opacity-90",
            )}
            style={{ cursor: "grab" }}
          >
            <button
              type="button"
              onMouseEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              className="media-zoom block size-full text-left"
            >
              <img
                src={reel.src}
                alt={reel.caption}
                loading="lazy"
                className="size-full object-cover"
                draggable={false}
              />
              <span className="veil pointer-events-none absolute inset-0" />
              <span className="glass absolute left-3 top-3 rounded-full py-1 pl-3 pr-2.5 text-[10px] font-semibold uppercase tracking-widest text-accent">
                {reel.category}
              </span>
              <span className="glass absolute right-3 top-3 grid size-9 place-items-center rounded-full text-ink-foreground transition-transform duration-500 group-hover:scale-110">
                <Play className="size-3.5 fill-current" />
              </span>
              <span className="absolute inset-x-4 bottom-4 block text-sm font-semibold leading-snug text-ink-foreground">
                {reel.caption}
              </span>
            </button>
          </Reveal>
        ))}
      </div>

      <div className="mx-auto h-0.5 w-40 overflow-hidden rounded-full bg-border">
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-300"
          style={{ width: `${Math.max(12, progress * 100)}%` }}
        />
      </div>
    </div>
  );
}
