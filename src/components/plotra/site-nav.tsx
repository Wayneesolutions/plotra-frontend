import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PlotraLogo } from "@/components/plotra/logo";
import { cn } from "@/lib/utils";

const links = [
  { label: "How it works", to: "/how-it-works" },
  { label: "Team", to: "/team" },
  { label: "Pricing", to: "/pricing" },
];

export function SiteNav() {
  const { pathname } = useLocation();
  const isHome = pathname === "/";
  const [scrolledPast, setScrolledPast] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolledPast(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrolled = isHome ? scrolledPast : true;

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-6 sm:pt-5">
      <nav
        className={cn(
          "mx-auto flex max-w-7xl items-center justify-between rounded-full px-4 py-2.5 transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] sm:px-5",
          scrolled ? "glass-light" : "glass",
        )}
      >
        <Link to="/" className="shrink-0">
          <PlotraLogo tone={scrolled ? "ink" : "light"} />
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={cn(
                "rounded-full px-3.5 py-2 text-sm font-medium transition-colors duration-300",
                scrolled
                  ? "text-muted-foreground hover:text-ink"
                  : "text-ink-foreground/75 hover:text-ink-foreground",
              )}
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className={cn(
              "hidden sm:inline-flex",
              scrolled
                ? "text-ink"
                : "text-ink-foreground hover:bg-white/15 hover:text-ink-foreground",
            )}
          >
            <Link to="/login">Sign in</Link>
          </Button>
          <Button asChild variant="hero" size="sm">
            <Link to="/request-access">Request Access</Link>
          </Button>
          <button
            type="button"
            aria-label="Menu"
            onClick={() => setOpen((v) => !v)}
            className={cn(
              "ml-1 rounded-full p-2 md:hidden",
              scrolled ? "text-ink" : "text-ink-foreground",
            )}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </nav>

      {open ? (
        <div className="glass-light mx-auto mt-2 max-w-7xl rounded-3xl p-3 md:hidden">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setOpen(false)}
              className="block rounded-2xl px-4 py-3 text-sm font-medium text-ink"
            >
              {l.label}
            </Link>
          ))}
          <Link
            to="/login"
            onClick={() => setOpen(false)}
            className="block rounded-2xl px-4 py-3 text-sm font-medium text-ink"
          >
            Sign in
          </Link>
        </div>
      ) : null}
    </header>
  );
}
