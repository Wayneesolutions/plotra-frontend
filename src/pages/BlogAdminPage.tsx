import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ExternalLink, ImagePlus, LogOut, Plus, Search, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PlotraLogo } from "@/components/plotra/logo";
import { Seo } from "@/components/Seo";
import { RichTextEditor } from "@/components/blog/RichTextEditor";
import {
  BlogApiError,
  adminCreatePost,
  adminDeletePost,
  adminGetPost,
  adminListPosts,
  adminUpdatePost,
  adminUploadImage,
  blogAdminLogin,
  blogAdminMe,
  clearBlogAdminToken,
  getBlogAdminToken,
  type BlogPost,
  type BlogPostInput,
  type BlogPostSummary,
} from "@/lib/blog-api";
import { formatBlogDate, htmlToText, normalizeBlogHtml, slugify } from "@/lib/blog-content";
import { cn } from "@/lib/utils";

/**
 * Standalone blog admin (/blog-admin).
 *
 * Deliberately not connected to the dealer dashboard or the super-admin
 * panel: its own login, its own token (src/lib/blog-api.ts), its own layout.
 * The form has exactly seven fields — meta title, meta description, slug,
 * tags, title, description, image.
 */

const META_TITLE_GUIDE = 60;
const META_DESCRIPTION_GUIDE = 160;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const NEW = "new";

const EMPTY_FORM: BlogPostInput = {
  title: "",
  description: "",
  slug: "",
  tags: [],
  meta_title: "",
  meta_description: "",
  image_url: "",
};

const toForm = (post: BlogPost): BlogPostInput => ({
  title: post.title,
  description: post.description,
  slug: post.slug,
  tags: post.tags ?? [],
  meta_title: post.meta_title ?? "",
  meta_description: post.meta_description ?? "",
  image_url: post.image_url ?? "",
});

const inputClass =
  "w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-ink/35 focus:border-primary";

type Notice = { kind: "ok" | "error"; text: string } | null;

/* --------------------------------- pieces -------------------------------- */

function Field({
  label,
  htmlFor,
  id,
  hint,
  counter,
  children,
}: {
  label: string;
  htmlFor?: string;
  id?: string;
  hint?: ReactNode;
  counter?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <label id={id} htmlFor={htmlFor} className="text-sm font-semibold text-ink">
          {label}
        </label>
        {counter}
      </div>
      {children}
      {hint ? <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function Counter({ length, guide }: { length: number; guide: number }) {
  return (
    <span className={cn("text-xs tabular-nums", length > guide ? "font-semibold text-primary" : "text-muted-foreground")}>
      {length}/{guide}
    </span>
  );
}

function TagInput({ id, tags, onChange }: { id: string; tags: string[]; onChange: (tags: string[]) => void }) {
  const [draft, setDraft] = useState("");

  const commit = (raw: string) => {
    const incoming = raw
      .split(",")
      .map((t) => t.replace(/\s+/g, " ").trim())
      .filter(Boolean);
    if (!incoming.length) return;
    const next = [...tags];
    incoming.forEach((tag) => {
      if (!next.some((t) => t.toLowerCase() === tag.toLowerCase())) next.push(tag.slice(0, 40));
    });
    onChange(next.slice(0, 15));
    setDraft("");
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-border bg-card px-2.5 py-2 focus-within:border-primary">
      {tags.map((tag) => (
        <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-lavender py-1 pl-3 pr-1.5 text-xs font-medium text-indigo-deep">
          {tag}
          <button
            type="button"
            aria-label={`Remove tag ${tag}`}
            onClick={() => onChange(tags.filter((t) => t !== tag))}
            className="grid size-4 place-items-center rounded-full hover:bg-indigo-deep/15"
          >
            <X className="size-3" />
          </button>
        </span>
      ))}
      <input
        id={id}
        value={draft}
        onChange={(e) => (e.target.value.includes(",") ? commit(e.target.value) : setDraft(e.target.value))}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit(draft);
          } else if (e.key === "Backspace" && !draft && tags.length) {
            onChange(tags.slice(0, -1));
          }
        }}
        onBlur={() => commit(draft)}
        placeholder={tags.length ? "" : "Buying guide, Ludhiana, Plots"}
        className="min-w-[8rem] flex-1 bg-transparent px-1 py-1 text-sm text-ink outline-none placeholder:text-ink/35"
      />
    </div>
  );
}

function ImageField({
  url,
  onChange,
  onError,
  onSessionExpired,
}: {
  url: string;
  onChange: (url: string) => void;
  onError: (message: string) => void;
  onSessionExpired: () => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);

  const upload = async (file: File | undefined) => {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      onError("Use a JPEG, PNG or WebP image.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      onError("Image must be 5 MB or smaller.");
      return;
    }
    setUploading(true);
    try {
      onChange(await adminUploadImage(file));
    } catch (err) {
      if (err instanceof BlogApiError && err.status === 401) onSessionExpired();
      else onError(err instanceof BlogApiError ? err.message : "Image upload failed. Try again.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div>
      <input
        ref={inputRef}
        id="blog-image"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={(e) => upload(e.target.files?.[0])}
      />
      {url ? (
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <img src={url} alt="" className="aspect-[16/9] w-full object-cover" />
          <div className="flex items-center justify-between gap-3 px-3 py-2">
            <button
              type="button"
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
              className="text-xs font-semibold text-ink hover:text-primary disabled:opacity-50"
            >
              {uploading ? "Uploading…" : "Replace image"}
            </button>
            <button type="button" onClick={() => onChange("")} className="text-xs font-semibold text-muted-foreground hover:text-destructive">
              Remove image
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            upload(e.dataTransfer.files?.[0]);
          }}
          className={cn(
            "grid aspect-[16/9] w-full place-items-center rounded-2xl border border-dashed bg-card px-4 text-center transition-colors",
            dragging ? "border-primary bg-primary/5" : "border-ink/25 hover:border-primary",
          )}
        >
          <span>
            <ImagePlus className="mx-auto size-6 text-ink/50" />
            <span className="mt-2 block text-sm font-semibold text-ink">
              {uploading ? "Uploading…" : "Upload image"}
            </span>
            <span className="mt-1 block text-xs text-muted-foreground">JPEG, PNG or WebP, up to 5 MB. 1200 × 675 works best.</span>
          </span>
        </button>
      )}
    </div>
  );
}

const clip = (text: string, max: number) => (text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text);

/** Live preview of the Google result built from meta title, meta description and slug. */
function SearchPreview({ form }: { form: BlogPostInput }) {
  const title = form.meta_title.trim() || form.title.trim() || "Post title";
  const description =
    form.meta_description.trim() || htmlToText(form.description) || "The meta description shows here. Without one, Google picks text from the post.";
  return (
    <div className="rounded-2xl border border-border bg-white p-4">
      <p className="text-xs font-medium text-muted-foreground">Preview on Google</p>
      <div className="mt-3 flex items-center gap-2.5">
        <span className="grid size-7 shrink-0 place-items-center rounded-full bg-ink text-[11px] font-bold text-ink-foreground">P</span>
        <span className="min-w-0">
          <span className="block text-sm leading-tight text-[#202124]">Plotraa</span>
          <span className="block truncate text-xs leading-tight text-[#4d5156]">
            plotraa.com › blog › {form.slug || "post-slug"}
          </span>
        </span>
      </div>
      <p className="mt-2 text-lg leading-snug text-[#1a0dab]">{clip(title, META_TITLE_GUIDE)}</p>
      <p className="mt-1 text-sm leading-relaxed text-[#4d5156]">{clip(description, META_DESCRIPTION_GUIDE)}</p>
    </div>
  );
}

/* ---------------------------------- login -------------------------------- */

function LoginView({ notice, onSignedIn }: { notice: string; onSignedIn: (email: string) => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  return (
    <main className="grid min-h-[100svh] place-items-center bg-ink px-5 py-16">
      <div className="w-full max-w-sm">
        <PlotraLogo tone="light" />
        <h1 className="mt-8 font-display text-3xl font-bold text-ink-foreground">Blog admin</h1>
        <p className="mt-2 text-sm text-ink-foreground/65">
          Sign in to publish and edit posts on plotraa.com/blog. This login is separate from the dealer dashboard.
        </p>

        <form
          className="mt-8 space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            const data = new FormData(e.currentTarget);
            setError("");
            setLoading(true);
            try {
              onSignedIn(await blogAdminLogin(String(data.get("email") ?? ""), String(data.get("password") ?? "")));
            } catch (err) {
              setError(err instanceof BlogApiError ? err.message : "Could not sign in. Try again.");
            } finally {
              setLoading(false);
            }
          }}
        >
          <label className="block">
            <span className="text-sm font-medium text-ink-foreground/80">Email</span>
            <input name="email" type="email" required autoComplete="username" className={cn(inputClass, "mt-1.5 bg-white")} />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-ink-foreground/80">Password</span>
            <input name="password" type="password" required autoComplete="current-password" className={cn(inputClass, "mt-1.5 bg-white")} />
          </label>
          {error || notice ? (
            <p role="alert" className="text-sm font-medium text-coral">
              {error || notice}
            </p>
          ) : null}
          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </div>
    </main>
  );
}

/* ---------------------------------- panel -------------------------------- */

function Panel({ email, onSignOut, onSessionExpired }: { email: string; onSignOut: () => void; onSessionExpired: () => void }) {
  const [posts, setPosts] = useState<BlogPostSummary[]>([]);
  const [listState, setListState] = useState<"loading" | "ready" | "error">("loading");
  const [query, setQuery] = useState("");

  const [selectedId, setSelectedId] = useState<string>(NEW);
  const [form, setForm] = useState<BlogPostInput>(EMPTY_FORM);
  const [baseline, setBaseline] = useState<BlogPostInput>(EMPTY_FORM);
  const [docKey, setDocKey] = useState("new:0");
  const [slugTouched, setSlugTouched] = useState(false);
  const [loadingPost, setLoadingPost] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);

  const isNew = selectedId === NEW;
  const dirty = useMemo(() => JSON.stringify(form) !== JSON.stringify(baseline), [form, baseline]);

  const fail = useCallback(
    (err: unknown, fallback: string) => {
      if (err instanceof BlogApiError && err.status === 401) {
        onSessionExpired();
        return;
      }
      setNotice({ kind: "error", text: err instanceof BlogApiError ? err.message : fallback });
    },
    [onSessionExpired],
  );

  const loadList = useCallback(async () => {
    setListState("loading");
    try {
      setPosts(await adminListPosts());
      setListState("ready");
    } catch (err) {
      if (err instanceof BlogApiError && err.status === 401) onSessionExpired();
      else setListState("error");
    }
  }, [onSessionExpired]);

  useEffect(() => {
    loadList();
  }, [loadList]);

  // Warn before closing the tab with unsaved changes.
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  // A success message describes the saved state, an error describes the
  // form as it was — drop each as soon as it stops being true.
  useEffect(() => {
    if (dirty) setNotice((n) => (n?.kind === "ok" ? null : n));
  }, [dirty]);
  useEffect(() => {
    setNotice((n) => (n?.kind === "error" ? null : n));
  }, [form]);

  const set = <K extends keyof BlogPostInput>(key: K, value: BlogPostInput[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const leaveOk = () => !dirty || window.confirm("This post has unsaved changes. Leave without saving?");

  const startNew = () => {
    if (!leaveOk()) return;
    setSelectedId(NEW);
    setForm(EMPTY_FORM);
    setBaseline(EMPTY_FORM);
    setDocKey(`new:${Date.now()}`);
    setSlugTouched(false);
    setConfirmDelete(false);
    setNotice(null);
  };

  const openPost = async (id: string) => {
    if (id === selectedId || !leaveOk()) return;
    setLoadingPost(true);
    setNotice(null);
    setConfirmDelete(false);
    try {
      const post = await adminGetPost(id);
      const next = toForm(post);
      setSelectedId(post.id);
      setForm(next);
      setBaseline(next);
      setDocKey(`${post.id}:${post.updated_at}`);
      setSlugTouched(true);
    } catch (err) {
      fail(err, "Could not open the post. Try again.");
    } finally {
      setLoadingPost(false);
    }
  };

  const save = async () => {
    if (!form.title.trim()) return setNotice({ kind: "error", text: "Add a title before publishing." });
    if (!htmlToText(form.description)) return setNotice({ kind: "error", text: "Add a description before publishing." });
    if (!form.slug) return setNotice({ kind: "error", text: "Add a slug — lowercase letters, numbers and hyphens." });

    setSaving(true);
    setNotice(null);
    try {
      const payload = { ...form, description: normalizeBlogHtml(form.description) };
      const post = isNew ? await adminCreatePost(payload) : await adminUpdatePost(selectedId, payload);
      const next = toForm(post);
      setSelectedId(post.id);
      setForm(next);
      setBaseline(next);
      setDocKey(`${post.id}:${post.updated_at}`);
      setSlugTouched(true);
      setPosts((prev) => {
        const { description: _body, ...summary } = post;
        return isNew ? [summary, ...prev] : prev.map((p) => (p.id === post.id ? summary : p));
      });
      setNotice({ kind: "ok", text: isNew ? "Post published." : "Changes saved." });
    } catch (err) {
      fail(err, "Could not save the post. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (isNew) return;
    setSaving(true);
    try {
      await adminDeletePost(selectedId);
      setPosts((prev) => prev.filter((p) => p.id !== selectedId));
      setSelectedId(NEW);
      setForm(EMPTY_FORM);
      setBaseline(EMPTY_FORM);
      setDocKey(`new:${Date.now()}`);
      setSlugTouched(false);
      setNotice({ kind: "ok", text: "Post deleted." });
    } catch (err) {
      fail(err, "Could not delete the post. Try again.");
    } finally {
      setSaving(false);
      setConfirmDelete(false);
    }
  };

  const visiblePosts = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return posts;
    return posts.filter(
      (p) => p.title.toLowerCase().includes(q) || p.slug.includes(q) || p.tags.some((t) => t.toLowerCase().includes(q)),
    );
  }, [posts, query]);

  return (
    <div className="min-h-[100svh] bg-background">
      <header className="bg-ink text-ink-foreground">
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-4">
            <PlotraLogo tone="light" />
            <span className="border-l border-white/20 pl-4 text-sm font-semibold">Blog admin</span>
          </div>
          <div className="flex items-center gap-1 text-sm">
            <span className="mr-2 hidden text-ink-foreground/55 sm:inline">{email}</span>
            <Link to="/blog" target="_blank" className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-ink-foreground/80 hover:bg-white/10 hover:text-ink-foreground">
              <ExternalLink className="size-4" /> View blog
            </Link>
            <button type="button" onClick={onSignOut} className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-ink-foreground/80 hover:bg-white/10 hover:text-ink-foreground">
              <LogOut className="size-4" /> Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1500px] gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[300px_minmax(0,1fr)]">
        {/* ------------------------------ post list ----------------------------- */}
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <Button type="button" variant="ink" className="w-full" onClick={startNew}>
            <Plus /> New post
          </Button>

          <label className="relative mt-4 block">
            <span className="sr-only">Search posts</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink/40" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search posts"
              className={cn(inputClass, "pl-9")}
            />
          </label>

          <div className="mt-3 max-h-64 overflow-y-auto lg:max-h-[calc(100svh-13rem)]">
            {listState === "loading" ? (
              <p className="px-1 py-3 text-sm text-muted-foreground">Loading posts…</p>
            ) : listState === "error" ? (
              <p className="px-1 py-3 text-sm text-muted-foreground">
                Could not load posts.{" "}
                <button type="button" onClick={loadList} className="font-semibold text-primary">
                  Try again
                </button>
              </p>
            ) : visiblePosts.length === 0 ? (
              <p className="px-1 py-3 text-sm text-muted-foreground">
                {posts.length === 0 ? "No posts yet. Write the first one in the form." : "No posts match that search."}
              </p>
            ) : (
              <ul className="space-y-1">
                {visiblePosts.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => openPost(p.id)}
                      aria-current={p.id === selectedId}
                      className={cn(
                        "block w-full rounded-xl px-3 py-2.5 text-left transition-colors",
                        p.id === selectedId ? "bg-lavender" : "hover:bg-muted",
                      )}
                    >
                      <span className="line-clamp-2 text-sm font-semibold leading-snug text-ink">{p.title}</span>
                      <span className="mt-1 block truncate text-xs text-muted-foreground">
                        {formatBlogDate(p.created_at)} — /{p.slug}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>

        {/* -------------------------------- editor ------------------------------ */}
        <section aria-busy={loadingPost} className={cn("min-w-0", loadingPost && "pointer-events-none opacity-50")}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="font-display text-2xl font-bold text-ink">{isNew ? "New post" : "Edit post"}</h1>
            {!isNew ? (
              <a
                href={`/blog/${baseline.slug}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-deep hover:text-primary"
              >
                <ExternalLink className="size-4" /> View post
              </a>
            ) : null}
          </div>

          <div className="mt-5 grid gap-8 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="min-w-0 space-y-6">
              <Field label="Title" htmlFor="blog-title">
                <input
                  id="blog-title"
                  value={form.title}
                  maxLength={200}
                  onChange={(e) => {
                    const title = e.target.value;
                    setForm((prev) => ({ ...prev, title, slug: slugTouched ? prev.slug : slugify(title) }));
                  }}
                  placeholder="How to check a plot's registry before you buy"
                  className={cn(inputClass, "font-display text-xl font-bold")}
                />
              </Field>

              <Field label="Description" id="blog-description-label" hint="This is the full post readers see on the blog.">
                <RichTextEditor
                  docKey={docKey}
                  initialHtml={form.description}
                  onChange={(html) => set("description", html)}
                  labelledBy="blog-description-label"
                />
              </Field>

              <Field label="Tags" htmlFor="blog-tags" hint="Press Enter or comma after each tag. Readers can filter the blog by tag.">
                <TagInput id="blog-tags" tags={form.tags} onChange={(tags) => set("tags", tags)} />
              </Field>
            </div>

            <div className="space-y-6">
              <Field label="Image" htmlFor="blog-image" hint="Shown at the top of the post, on the blog list, and when the link is shared.">
                <ImageField
                  url={form.image_url}
                  onChange={(url) => set("image_url", url)}
                  onError={(text) => setNotice({ kind: "error", text })}
                  onSessionExpired={onSessionExpired}
                />
              </Field>

              <Field label="Meta title" htmlFor="blog-meta-title" counter={<Counter length={form.meta_title.length} guide={META_TITLE_GUIDE} />}>
                <input
                  id="blog-meta-title"
                  value={form.meta_title}
                  maxLength={255}
                  onChange={(e) => set("meta_title", e.target.value)}
                  placeholder={form.title || "Title shown on Google"}
                  className={inputClass}
                />
              </Field>

              <Field
                label="Meta description"
                htmlFor="blog-meta-description"
                counter={<Counter length={form.meta_description.length} guide={META_DESCRIPTION_GUIDE} />}
              >
                <textarea
                  id="blog-meta-description"
                  rows={3}
                  value={form.meta_description}
                  maxLength={500}
                  onChange={(e) => set("meta_description", e.target.value)}
                  placeholder="One or two sentences that make someone click from the search results."
                  className={cn(inputClass, "resize-y leading-relaxed")}
                />
              </Field>

              <Field
                label="Slug"
                htmlFor="blog-slug"
                hint={
                  !isNew && form.slug !== baseline.slug
                    ? "Changing the slug changes the post's link. The old link will stop working."
                    : "Lowercase letters, numbers and hyphens."
                }
              >
                <div className="flex items-stretch overflow-hidden rounded-xl border border-border bg-card focus-within:border-primary">
                  <span className="flex items-center border-r border-border bg-muted px-3 text-xs text-muted-foreground">
                    plotraa.com/blog/
                  </span>
                  <input
                    id="blog-slug"
                    value={form.slug}
                    maxLength={120}
                    onChange={(e) => {
                      setSlugTouched(true);
                      set("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/-{2,}/g, "-").replace(/^-/, ""));
                    }}
                    onBlur={() => set("slug", form.slug.replace(/-+$/, ""))}
                    placeholder="post-slug"
                    className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm text-ink outline-none placeholder:text-ink/35"
                  />
                </div>
              </Field>

              <SearchPreview form={form} />
            </div>
          </div>

          {/* ------------------------------- actions ------------------------------ */}
          <div className="sticky bottom-0 -mx-4 mt-8 flex flex-wrap items-center gap-3 border-t border-border bg-background/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
            <Button type="button" onClick={save} disabled={saving || (!isNew && !dirty)}>
              {saving ? "Saving…" : isNew ? "Publish post" : "Save changes"}
            </Button>

            {notice ? (
              <p
                role={notice.kind === "error" ? "alert" : "status"}
                className={cn("text-sm font-medium", notice.kind === "error" ? "text-destructive" : "text-ink")}
              >
                {notice.text}
              </p>
            ) : dirty ? (
              <p className="text-sm text-muted-foreground">Unsaved changes</p>
            ) : null}

            {!isNew ? (
              <div className="ml-auto flex items-center gap-2">
                {confirmDelete ? (
                  <>
                    <span className="text-sm text-muted-foreground">Delete this post from the blog?</span>
                    <Button type="button" variant="destructive" size="sm" onClick={remove} disabled={saving}>
                      Delete post
                    </Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>
                      Keep post
                    </Button>
                  </>
                ) : (
                  <Button type="button" variant="ghost" size="sm" onClick={() => setConfirmDelete(true)} className="text-muted-foreground hover:text-destructive">
                    <Trash2 /> Delete post
                  </Button>
                )}
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}

/* ---------------------------------- page --------------------------------- */

export default function BlogAdminPage() {
  const [auth, setAuth] = useState<{ state: "checking" | "out" | "in"; email: string; notice: string }>({
    state: getBlogAdminToken() ? "checking" : "out",
    email: "",
    notice: "",
  });

  useEffect(() => {
    if (auth.state !== "checking") return;
    let cancelled = false;
    blogAdminMe()
      .then((email) => !cancelled && setAuth({ state: "in", email, notice: "" }))
      .catch((err) => {
        if (cancelled) return;
        const expired = err instanceof BlogApiError && err.status === 401;
        setAuth({
          state: "out",
          email: "",
          notice: expired ? "Your session expired. Sign in again." : "Could not reach Plotraa. Check your connection and sign in again.",
        });
      });
    return () => {
      cancelled = true;
    };
  }, [auth.state]);

  const seo = <Seo title="Blog admin | Plotraa" description="Plotraa blog admin." path="/blog-admin" noindex />;

  if (auth.state === "checking") {
    return (
      <main className="grid min-h-[100svh] place-items-center bg-ink text-sm text-ink-foreground/70">
        {seo}
        Checking your session…
      </main>
    );
  }

  if (auth.state === "out") {
    return (
      <>
        {seo}
        <LoginView notice={auth.notice} onSignedIn={(email) => setAuth({ state: "in", email, notice: "" })} />
      </>
    );
  }

  return (
    <>
      {seo}
      <Panel
        email={auth.email}
        onSignOut={() => {
          clearBlogAdminToken();
          setAuth({ state: "out", email: "", notice: "" });
        }}
        onSessionExpired={() => {
          clearBlogAdminToken();
          setAuth({ state: "out", email: "", notice: "Your session expired. Sign in again." });
        }}
      />
    </>
  );
}
