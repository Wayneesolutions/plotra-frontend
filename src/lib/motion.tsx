import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ElementType,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

export function useInView<T extends HTMLElement>(threshold = 0.2) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }

    let settled = false;
    const reveal = () => {
      if (settled) return;
      settled = true;
      setInView(true);
      io.disconnect();
      window.removeEventListener("scroll", manualCheck);
      window.removeEventListener("resize", manualCheck);
    };

    // Some in-app/webview browsers (e.g. embedded WhatsApp or Instagram
    // browsers) fire IntersectionObserver unreliably — especially when the
    // page loads already scrolled (an anchor link) or the viewport resizes
    // as the browser chrome shows/hides. That can leave scroll-reveal text
    // stuck permanently invisible. This manual rect check is a redundant
    // safety net alongside the observer, so content is never hidden from
    // the reader once it's actually on screen.
    const manualCheck = () => {
      const rect = el.getBoundingClientRect();
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
      if (rect.top < viewportHeight * 0.92 && rect.bottom > 0) reveal();
    };

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) reveal();
        }
      },
      { threshold, rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    manualCheck();
    window.addEventListener("scroll", manualCheck, { passive: true });
    window.addEventListener("resize", manualCheck);

    return () => {
      io.disconnect();
      window.removeEventListener("scroll", manualCheck);
      window.removeEventListener("resize", manualCheck);
    };
  }, [threshold]);

  return { ref, inView };
}

type RevealProps = {
  children: ReactNode;
  className?: string;
  as?: ElementType;
  variant?: "up" | "pop";
  delay?: number;
  style?: CSSProperties;
};

export function Reveal({
  children,
  className,
  as: Tag = "div",
  variant = "up",
  delay = 0,
  style,
}: RevealProps) {
  const { ref, inView } = useInView<HTMLDivElement>(0.15);
  return (
    <Tag
      ref={ref}
      data-reveal={variant}
      className={cn(inView && "is-visible", className)}
      style={{ transitionDelay: `${delay}ms`, ...style }}
    >
      {children}
    </Tag>
  );
}

export function useParallax<T extends HTMLElement>(strength = 0.12) {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = el.getBoundingClientRect();
      const offset = (rect.top + rect.height / 2 - window.innerHeight / 2) * -strength;
      el.style.transform = `translate3d(0, ${offset.toFixed(2)}px, 0)`;
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [strength]);

  return ref;
}

export function useCountUp(value: number, duration = 1800) {
  const { ref, inView } = useInView<HTMLSpanElement>(0.4);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(value * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, value, duration]);

  return { ref, display };
}

export function useMagnetic<T extends HTMLElement>(strength = 0.25) {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - (rect.left + rect.width / 2)) * strength;
      const y = (e.clientY - (rect.top + rect.height / 2)) * strength;
      el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    };
    const reset = () => {
      el.style.transform = "translate3d(0,0,0)";
    };
    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", reset);
    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", reset);
    };
  }, [strength]);

  return ref;
}
