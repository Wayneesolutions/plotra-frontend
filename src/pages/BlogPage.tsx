import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { SiteNav } from "@/components/plotra/site-nav";
import { SiteFooter } from "@/components/plotra/site-footer";
import { PageSeo } from "@/components/Seo";
import { fetchBlogPosts, type BlogListResponse } from "@/lib/blog-api";
import { formatBlogDate } from "@/lib/blog-content";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 12;

export default function BlogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tag = searchParams.get("tag") ?? "";
  const page = Math.max(1, Number(searchParams.get("page")) || 1);

  const [data, setData] = useState<BlogListResponse | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState("loading");
    fetchBlogPosts({ tag, page, limit: PAGE_SIZE })
      .then((res) => {
        if (cancelled) return;
        setData(res);
        setState("ready");
      })
      .catch(() => !cancelled && setState("error"));
    return () => {
      cancelled = true;
    };
  }, [tag, page, attempt]);

  const go = (next: { tag?: string; page?: number }) => {
    const params = new URLSearchParams();
    const nextTag = next.tag ?? tag;
    const nextPage = next.page ?? 1;
    if (nextTag) params.set("tag", nextTag);
    if (nextPage > 1) params.set("page", String(nextPage));
    setSearchParams(params);
  };

  const posts = data?.posts ?? [];
  const tags = data?.tags ?? [];
  const pages = data?.pagination.pages ?? 1;

  return (
    <main className="overflow-x-clip">
      <PageSeo path="/blog" />
      <SiteNav />

      <section className="bg-lavender px-5 pb-14 pt-32 sm:px-8 sm:pt-40">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-balance-tight max-w-3xl font-display text-4xl font-bold text-ink sm:text-6xl">
            Plotraa blog
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground">
            Guides for property dealers and buyers: listing, pricing, paperwork and getting more from WhatsApp.
          </p>
        </div>
      </section>

      <section className="bg-background px-5 py-12 sm:px-8 sm:py-16">
        <div className="mx-auto max-w-7xl">
          {tags.length > 0 ? (
            <div className="mb-10 flex flex-wrap gap-2" role="group" aria-label="Filter posts by tag">
              {["", ...tags].map((t) => (
                <button
                  key={t || "all"}
                  type="button"
                  aria-pressed={t.toLowerCase() === tag.toLowerCase()}
                  onClick={() => go({ tag: t, page: 1 })}
                  className={cn(
                    "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                    t.toLowerCase() === tag.toLowerCase()
                      ? "bg-ink text-ink-foreground"
                      : "bg-muted text-muted-foreground hover:bg-lavender hover:text-ink",
                  )}
                >
                  {t || "All posts"}
                </button>
              ))}
            </div>
          ) : null}

          {state === "loading" && !data ? (
            <p className="py-16 text-center text-sm text-muted-foreground">Loading posts…</p>
          ) : state === "error" ? (
            <div className="py-16 text-center">
              <p className="text-sm text-muted-foreground">The blog could not be loaded.</p>
              <button type="button" onClick={() => setAttempt((n) => n + 1)} className="mt-3 text-sm font-semibold text-primary">
                Try again
              </button>
            </div>
          ) : posts.length === 0 ? (
            <div className="py-16 text-center">
              <p className="font-display text-xl font-bold text-ink">
                {tag ? `No posts tagged "${tag}"` : "No posts yet"}
              </p>
              {tag ? (
                <button type="button" onClick={() => go({ tag: "", page: 1 })} className="mt-3 text-sm font-semibold text-primary">
                  Show all posts
                </button>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">New guides are on the way.</p>
              )}
            </div>
          ) : (
            <ul className={cn("grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3", state === "loading" && "opacity-60")}>
              {posts.map((post) => (
                <li key={post.id}>
                  <article>
                    <Link to={`/blog/${post.slug}`} className="group block">
                      <div className="aspect-[16/9] overflow-hidden rounded-2xl bg-lavender">
                        {post.image_url ? (
                          <img
                            src={post.image_url}
                            alt=""
                            loading="lazy"
                            className="size-full object-cover transition-transform duration-700 ease-[var(--ease-cinema)] group-hover:scale-[1.03]"
                          />
                        ) : null}
                      </div>
                      <p className="mt-4 text-xs text-muted-foreground">
                        <time dateTime={post.created_at}>{formatBlogDate(post.created_at)}</time>
                      </p>
                      <h2 className="mt-1.5 font-display text-xl font-bold leading-snug text-ink transition-colors group-hover:text-primary">
                        {post.title}
                      </h2>
                      {post.meta_description ? (
                        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                          {post.meta_description}
                        </p>
                      ) : null}
                    </Link>
                  </article>
                </li>
              ))}
            </ul>
          )}

          {pages > 1 ? (
            <nav className="mt-14 flex items-center justify-center gap-4 text-sm" aria-label="Blog pages">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => go({ page: page - 1 })}
                className="rounded-full border border-border px-4 py-2 font-semibold text-ink disabled:opacity-40"
              >
                Newer posts
              </button>
              <span className="text-muted-foreground">
                Page {page} of {pages}
              </span>
              <button
                type="button"
                disabled={page >= pages}
                onClick={() => go({ page: page + 1 })}
                className="rounded-full border border-border px-4 py-2 font-semibold text-ink disabled:opacity-40"
              >
                Older posts
              </button>
            </nav>
          ) : null}
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
