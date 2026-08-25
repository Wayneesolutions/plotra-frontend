import { useEffect, useState } from "react";
import { Check, Link2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import satellite from "@/assets/satellite-plot.jpg";

type Step =
  | { kind: "out"; text: string }
  | { kind: "typing" }
  | { kind: "ai" }
  | { kind: "card" }
  | { kind: "link" }
  | { kind: "shared" };

const script: Step[] = [
  { kind: "out", text: "2000 sq ft residential plot, Pakhowal Road Ludhiana, 1.25 cr, corner, clear title" },
  { kind: "typing" },
  { kind: "ai" },
  { kind: "card" },
  { kind: "link" },
  { kind: "shared" },
];

export function PhoneMockup({ className }: { className?: string }) {
  const [visible, setVisible] = useState(0);

  useEffect(() => {
    const timings = [900, 1200, 1600, 1400, 1300, 2600];
    const t = setTimeout(
      () => setVisible((v) => (v >= script.length ? 0 : v + 1)),
      timings[Math.min(visible, timings.length - 1)],
    );
    return () => clearTimeout(t);
  }, [visible]);

  const shown = script.slice(0, visible);

  return (
    <div className={cn("float-slow relative", className)}>
      <div
        className="glass relative mx-auto w-[286px] rounded-[2.6rem] p-2.5 sm:w-[318px]"
        style={{ transform: "perspective(1400px) rotateY(-9deg) rotateX(3deg)" }}
      >
        <div className="overflow-hidden rounded-[2.1rem] bg-[#ECE5DD]">
          {/* WhatsApp header */}
          <div className="flex items-center gap-3 bg-ink px-4 py-3">
            <span className="grid size-8 place-items-center rounded-full bg-accent text-[11px] font-bold text-accent-foreground">
              PL
            </span>
            <div className="leading-tight">
              <p className="text-xs font-semibold text-ink-foreground">Plotra Listing Bot</p>
              <p className="text-[10px] text-accent">online</p>
            </div>
          </div>

          <div className="flex h-[404px] flex-col gap-2 overflow-hidden px-3 py-4">
            {shown.map((step, i) => (
              <Bubble key={i} step={step} />
            ))}
          </div>
        </div>

        {/* glass reflection */}
        <div className="pointer-events-none absolute inset-0 rounded-[2.6rem] bg-gradient-to-tr from-transparent via-white/10 to-white/25" />
      </div>
    </div>
  );
}

function Bubble({ step }: { step: Step }) {
  const base =
    "max-w-[86%] rounded-2xl px-3 py-2 text-[11px] leading-snug shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-700";

  if (step.kind === "out") {
    return (
      <div className={cn(base, "self-end bg-[#D9FDD3] text-[#111827]")}>
        {step.text}
        <span className="mt-1 block text-right text-[9px] text-[#111827]/45">10:31 ✓✓</span>
      </div>
    );
  }
  if (step.kind === "typing") {
    return (
      <div className={cn(base, "flex items-center gap-1 self-start bg-white")}>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="size-1.5 rounded-full bg-muted-foreground/60 pulse-soft"
            style={{ animationDelay: `${i * 220}ms` }}
          />
        ))}
      </div>
    );
  }
  if (step.kind === "ai") {
    return (
      <div className={cn(base, "self-start bg-white text-[#252525]")}>
        <span className="mb-1 flex items-center gap-1.5 font-semibold text-indigo-deep">
          <Sparkles className="size-3 text-primary" /> Reading your message…
        </span>
        <ul className="space-y-0.5 text-[10px] text-muted-foreground">
          <li>Location · Pakhowal Road, Ludhiana</li>
          <li>Price · ₹1.25 Cr</li>
          <li>Plot size · 2,000 sq.ft</li>
          <li>Type · Residential Plot</li>
        </ul>
      </div>
    );
  }
  if (step.kind === "card") {
    return (
      <div className={cn(base, "self-start overflow-hidden bg-white p-0")}>
        <img
          src={satellite}
          alt="Satellite view of the plot"
          loading="lazy"
          className="h-24 w-full object-cover"
        />
        <div className="p-2.5">
          <p className="text-[11px] font-semibold text-[#111827]">Residential Plot · 2,000 sq.ft</p>
          <p className="text-[11px] font-bold text-primary">₹1.25 Cr</p>
          <p className="text-[10px] text-muted-foreground">Ludhiana, Punjab</p>
        </div>
      </div>
    );
  }
  if (step.kind === "link") {
    return (
      <div className={cn(base, "flex items-center gap-1.5 self-start bg-white text-[10px] text-indigo-deep")}>
        <Link2 className="size-3" /> plotra.in/p/ludhiana-plot-2000
      </div>
    );
  }
  return (
    <div className={cn(base, "flex items-center gap-1.5 self-end bg-[#D9FDD3] text-[10px] text-[#111827]")}>
      <Check className="size-3 text-[#0f8f6f]" /> Shared with 6 buyers
    </div>
  );
}
