import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { SiteNav } from "@/components/plotra/site-nav";
import { SiteFooter } from "@/components/plotra/site-footer";
import { Seo } from "@/components/Seo";
import { BlogApiError, fetchBlogPost, type BlogPost } from "@/lib/blog-api";
import { formatBlogDate, htmlToText } from "@/lib/blog-content";
import { SITE_URL } from "@/seo/pages.js";
import { getPrerenderData } from "@/lib/prerender-data";
import { fetchBlogPosts, type BlogPostSummary } from "@/lib/blog-api";

export default function BlogPostPage() {
  const { slug = "" } = useParams();
  // The backend server-renders /blog/:slug and passes the post along, so the
  // first render already has it (no "Loading…" flash, same text as the HTML).
  const preloaded = getPrerenderData().blogPost;
  const initialPost = preloaded && preloaded.slug === slug ? preloaded : null;
  const [post, setPost] = useState<BlogPost | null>(initialPost);
  const [state, setState] = useState<"loading" | "ready" | "missing" | "error">(initialPost ? "ready" : "loading");
  const [attempt, setAttempt] = useState(0);
  const [related, setRelated] = useState<BlogPostSummary[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetchBlogPosts({ limit: 8 })
      .then((res) => !cancelled && setRelated(res.posts.filter((p) => p.slug !== slug).slice(0, 3)))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [slug]);

  useEffect(() => {
    if (initialPost && attempt === 0 && post?.slug === slug) return;
    let cancelled = false;
    setState("loading");
    setPost(null);
    fetchBlogPost(slug)
      .then((res) => {
        if (cancelled) return;
        setPost(res);
        setState("ready");
      })
      .catch((err) => {
        if (cancelled) return;
        setState(err instanceof BlogApiError && err.status === 404 ? "missing" : "error");
      });
    return () => {
      cancelled = true;
    };
  }, [slug, attempt]);

  const path = `/blog/${slug}`;

  if (state !== "ready" || !post) {
    return (
      <main className="overflow-x-clip">
        {state === "missing" ? (
          <Seo title="Post not found | Plotraa" description="This blog post does not exist." path={path} noindex />
        ) : null}
        <SiteNav />
        <section className="grid min-h-[70svh] place-items-center bg-background px-5 pt-32 text-center">
          {state === "loading" ? (
            <p className="text-sm text-muted-foreground">Loading post…</p>
          ) : state === "missing" ? (
            <div>
              <h1 className="font-display text-3xl font-bold text-ink">This post does not exist</h1>
              <p className="mt-3 text-sm text-muted-foreground">It may have been moved or removed.</p>
              <Link to="/blog" className="mt-5 inline-block text-sm font-semibold text-primary">
                Go to the blog
              </Link>
            </div>
          ) : (
            <div>
              <p className="text-sm text-muted-foreground">This post could not be loaded.</p>
              <button type="button" onClick={() => setAttempt((n) => n + 1)} className="mt-3 text-sm font-semibold text-primary">
                Try again
              </button>
            </div>
          )}
        </section>
        <SiteFooter />
      </main>
    );
  }

  const seoTitle = post.meta_title || `${post.title} | Plotraa`;
  const seoDescription = post.meta_description || htmlToText(post.description).slice(0, 160);

  return (
    <main className="overflow-x-clip">
      <Seo
        title={seoTitle}
        description={seoDescription}
        path={path}
        image={post.image_url || undefined}
        jsonLd={[
          {
            "@type": "BlogPosting",
            headline: post.title,
            description: seoDescription,
            ...(post.image_url ? { image: post.image_url } : {}),
            datePublished: post.created_at,
            dateModified: post.updated_at,
            author: { "@type": "Organization", name: "Plotraa", url: `${SITE_URL}/` },
            inLanguage: "en-IN",
            url: `${SITE_URL}${path}`,
            keywords: post.tags.join(", "),
            mainEntityOfPage: `${SITE_URL}${path}`,
            publisher: { "@id": `${SITE_URL}/#organization` },
          },
          {
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
              { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE_URL}/blog` },
              { "@type": "ListItem", position: 3, name: post.title, item: `${SITE_URL}${path}` },
            ],
          },
        ]}
      />
      <SiteNav />

      <article className="bg-background px-5 pb-20 pt-32 sm:px-8 sm:pt-40">
        <div className="mx-auto max-w-3xl">
          <Link to="/blog" className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-deep hover:text-primary">
            <ArrowLeft className="size-4" /> All posts
          </Link>

          <h1 className="mt-6 text-balance font-display text-4xl font-bold leading-[1.08] tracking-tight text-ink sm:text-5xl">
            {post.title}
          </h1>
          <p className="mt-4 text-sm text-muted-foreground">
            By Plotraa Team · Published <time dateTime={post.created_at}>{formatBlogDate(post.created_at)}</time>
            {post.updated_at && formatBlogDate(post.updated_at) !== formatBlogDate(post.created_at) ? (
              <>
                {" "}· Updated <time dateTime={post.updated_at}>{formatBlogDate(post.updated_at)}</time>
              </>
            ) : null}
          </p>
        </div>

        {post.image_url ? (
          <div className="mx-auto mt-10 max-w-5xl">
            <img src={post.image_url} alt="" className="aspect-[16/9] w-full rounded-3xl object-cover" />
          </div>
        ) : null}

        <div className="mx-auto mt-10 max-w-3xl">
          {/* Sanitized to a fixed tag allowlist by the API on save. */}
          <div className="blog-prose" dangerouslySetInnerHTML={{ __html: post.description }} />

          {post.tags.length > 0 ? (
            <ul className="mt-12 flex flex-wrap gap-2 border-t border-border pt-6" aria-label="Tags">
              {post.tags.map((tag) => (
                <li key={tag}>
                  <Link
                    to={`/blog?tag=${encodeURIComponent(tag)}`}
                    className="inline-block rounded-full bg-lavender px-3.5 py-1.5 text-xs font-medium text-indigo-deep hover:bg-ink hover:text-ink-foreground"
                  >
                    {tag}
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}

          <aside className="mt-14 rounded-3xl bg-lavender p-7" aria-labelledby="related-guides">
            <h2 id="related-guides" className="font-display text-xl font-bold text-ink">Related guides</h2>
            <ul className="mt-4 space-y-2 text-sm">
              {related.map((r) => (
                <li key={r.id}>
                  <Link to={`/blog/${r.slug}`} className="font-semibold text-indigo-deep hover:text-primary">
                    {r.title}
                  </Link>
                </li>
              ))}
              <li>
                <Link to="/pricing" className="font-semibold text-indigo-deep hover:text-primary">
                  Plotraa pricing for property dealers
                </Link>
              </li>
            </ul>
          </aside>
        </div>
      </article>

      <SiteFooter />
    </main>
  );
}
