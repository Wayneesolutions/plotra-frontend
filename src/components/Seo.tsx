import { useEffect } from "react";
import { OG_IMAGE, SEO_PAGES, SITE_URL } from "@/seo/pages.js";

const DEFAULT_TITLE = "Plotraa — WhatsApp-native real estate CRM";

type SeoProps = {
  title: string;
  description: string;
  /** Path starting with "/" — used for canonical + og:url. */
  path: string;
  jsonLd?: object[];
  image?: string;
  noindex?: boolean;
};

/**
 * Keeps <head> in sync during client-side navigation. Static pages also get
 * the same tags baked into their HTML at build time (see vite.config.js), so
 * on first load this just re-applies identical tags.
 */
export function Seo({ title, description, path, jsonLd, image = OG_IMAGE, noindex = false }: SeoProps) {
  const jsonKey = jsonLd ? JSON.stringify(jsonLd) : "";

  useEffect(() => {
    const head = document.head;
    head.querySelectorAll("[data-seo]").forEach((el) => el.remove());

    const url = `${SITE_URL}${path}`;
    document.title = title;

    const add = (tag: string, attrs: Record<string, string>) => {
      const el = document.createElement(tag);
      el.setAttribute("data-seo", "");
      Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
      head.appendChild(el);
      return el;
    };

    add("meta", { name: "description", content: description });
    add("link", { rel: "canonical", href: url });
    add("meta", { name: "robots", content: noindex ? "noindex, follow" : "index, follow" });
    add("meta", { property: "og:type", content: "website" });
    add("meta", { property: "og:site_name", content: "Plotraa" });
    add("meta", { property: "og:title", content: title });
    add("meta", { property: "og:description", content: description });
    add("meta", { property: "og:url", content: url });
    add("meta", { property: "og:image", content: image });
    add("meta", { name: "twitter:card", content: "summary_large_image" });

    if (jsonLd?.length) {
      const script = add("script", { type: "application/ld+json" });
      script.textContent = JSON.stringify({ "@context": "https://schema.org", "@graph": jsonLd });
    }

    return () => {
      head.querySelectorAll("[data-seo]").forEach((el) => el.remove());
      document.title = DEFAULT_TITLE;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, description, path, image, noindex, jsonKey]);

  return null;
}

/** Convenience wrapper for the fixed marketing pages defined in seo/pages.js. */
export function PageSeo({ path }: { path: keyof typeof SEO_PAGES }) {
  const page = SEO_PAGES[path];
  return <Seo title={page.title} description={page.description} path={path} jsonLd={page.jsonLd} />;
}
