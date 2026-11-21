// Data that was fetched at build time (plans, blog list) and baked into the
// prerendered HTML as window.__PLOTRAA_DATA__. Pages use it as their initial
// state so the server HTML and the first client render match (hydration),
// and crawlers that don't run JavaScript still see prices and post titles.
// During the build the prerender script sets globalThis.__PLOTRAA_DATA__
// before rendering each page.
import type { PublicPlan } from "@/lib/plans-api";
import type { BlogListResponse, BlogPost } from "@/lib/blog-api";

export type PrerenderData = {
  plans?: PublicPlan[];
  blogList?: BlogListResponse;
  /** Set by the backend when it server-renders /blog/:slug. */
  blogPost?: BlogPost;
};

export function getPrerenderData(): PrerenderData {
  const g = globalThis as unknown as { __PLOTRAA_DATA__?: PrerenderData };
  return g.__PLOTRAA_DATA__ ?? {};
}
