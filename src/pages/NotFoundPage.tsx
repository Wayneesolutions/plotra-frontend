import { Link } from "react-router-dom";
import { SiteNav } from "@/components/plotra/site-nav";
import { SiteFooter } from "@/components/plotra/site-footer";
import { Seo } from "@/components/Seo";

/** Shown for unknown URLs. The web server sends HTTP 404 with the
 *  prerendered copy of this page (dist/404.html). */
export default function NotFoundPage() {
  return (
    <main className="overflow-x-clip">
      <Seo title="Page not found | Plotraa" description="This page does not exist on plotraa.com." path="/404" noindex />
      <SiteNav />
      <section className="grid min-h-[70svh] place-items-center bg-background px-5 pt-32 text-center">
        <div>
          <p className="label-eyebrow text-primary">404</p>
          <h1 className="mt-3 font-display text-4xl font-bold text-ink">Page not found</h1>
          <p className="mt-3 text-sm text-muted-foreground">This page doesn’t exist or has moved.</p>
          <nav className="mt-6 flex flex-wrap justify-center gap-5 text-sm font-semibold text-primary" aria-label="Helpful links">
            <Link to="/">Home</Link>
            <Link to="/pricing">Pricing</Link>
            <Link to="/blog">Blog</Link>
            <Link to="/faq">FAQ</Link>
          </nav>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
