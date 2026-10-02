// Blog API client — public blog pages + the standalone blog admin panel.
//
// The blog admin is NOT connected to the dealer dashboard: it has its own
// login and its own token, kept under its own localStorage key. Nothing here
// reads or writes pve_token / pve_user (see src/api/apiClient.js).
const API_BASE =
  (import.meta.env["VITE_API_BASE_URL"] as string | undefined)?.replace(/\/$/, "") ?? "";

const TOKEN_KEY = "plotraa_blog_admin_token";

export type BlogPostSummary = {
  id: string;
  slug: string;
  title: string;
  meta_title: string | null;
  meta_description: string | null;
  tags: string[];
  image_url: string | null;
  created_at: string;
  updated_at: string;
};

export type BlogPost = BlogPostSummary & {
  /** Post body — sanitized HTML. */
  description: string;
};

/** Exactly the fields on the blog admin form. */
export type BlogPostInput = {
  meta_title: string;
  meta_description: string;
  slug: string;
  tags: string[];
  title: string;
  description: string;
  image_url: string;
};

export class BlogApiError extends Error {
  status: number;
  code: string;
  constructor(message: string, status: number, code = "") {
    super(message);
    this.status = status;
    this.code = code;
    this.name = "BlogApiError";
  }
}

export function getBlogAdminToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function setBlogAdminToken(token: string) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // Storage blocked — the session then lasts until the tab is reloaded.
  }
}

export function clearBlogAdminToken() {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // nothing to clear
  }
}

async function request<T>(
  path: string,
  { method = "GET", json, form, admin = false }: { method?: string; json?: unknown; form?: FormData; admin?: boolean } = {},
): Promise<T> {
  const headers: Record<string, string> = {};
  if (json !== undefined) headers["Content-Type"] = "application/json";
  if (admin) {
    const token = getBlogAdminToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: form ?? (json !== undefined ? JSON.stringify(json) : undefined),
    });
  } catch {
    throw new BlogApiError("Could not reach Plotraa. Check your connection and try again.", 0);
  }

  let body: any = null;
  try {
    body = await res.json();
  } catch {
    // non-JSON response (proxy error page etc.)
  }

  if (!res.ok) {
    const err = body?.error;
    const message =
      typeof err === "string" ? err : typeof err?.message === "string" ? err.message : "Something went wrong. Try again.";
    if (admin && res.status === 401) clearBlogAdminToken();
    throw new BlogApiError(message, res.status, typeof err?.code === "string" ? err.code : "");
  }

  return body as T;
}

/* --------------------------------- public -------------------------------- */

export type BlogListResponse = {
  posts: BlogPostSummary[];
  tags: string[];
  pagination: { page: number; limit: number; total: number; pages: number };
};

export function fetchBlogPosts({ tag = "", page = 1, limit = 12 } = {}) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (tag) params.set("tag", tag);
  return request<BlogListResponse>(`/api/v1/public/blog?${params}`);
}

export async function fetchBlogPost(slug: string) {
  const { post } = await request<{ post: BlogPost }>(`/api/v1/public/blog/${encodeURIComponent(slug)}`);
  return post;
}

/* ---------------------------------- admin -------------------------------- */

export async function blogAdminLogin(email: string, password: string) {
  const { token, email: signedInAs } = await request<{ token: string; email: string }>("/api/v1/blog-admin/login", {
    method: "POST",
    json: { email, password },
  });
  setBlogAdminToken(token);
  return signedInAs;
}

export async function blogAdminMe() {
  const { email } = await request<{ email: string }>("/api/v1/blog-admin/me", { admin: true });
  return email;
}

export async function adminListPosts() {
  const { posts } = await request<{ posts: BlogPostSummary[] }>("/api/v1/blog-admin/posts", { admin: true });
  return posts;
}

export async function adminGetPost(id: string) {
  const { post } = await request<{ post: BlogPost }>(`/api/v1/blog-admin/posts/${id}`, { admin: true });
  return post;
}

export async function adminCreatePost(input: BlogPostInput) {
  const { post } = await request<{ post: BlogPost }>("/api/v1/blog-admin/posts", {
    method: "POST",
    json: input,
    admin: true,
  });
  return post;
}

export async function adminUpdatePost(id: string, input: BlogPostInput) {
  const { post } = await request<{ post: BlogPost }>(`/api/v1/blog-admin/posts/${id}`, {
    method: "PUT",
    json: input,
    admin: true,
  });
  return post;
}

export function adminDeletePost(id: string) {
  return request<{ success: true }>(`/api/v1/blog-admin/posts/${id}`, { method: "DELETE", admin: true });
}

export async function adminUploadImage(file: File) {
  const form = new FormData();
  form.append("image", file);
  const { url } = await request<{ url: string }>("/api/v1/blog-admin/upload-image", {
    method: "POST",
    form,
    admin: true,
  });
  return url;
}
