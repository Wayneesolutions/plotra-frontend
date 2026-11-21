// Build-time prerender (runs after `vite build` + the SSR build, see
// package.json "build"). For every public marketing page it writes
// dist/<route>/index.html containing:
//   - the page's own <title>, meta description, canonical, OG tags, JSON-LD
//   - the FULL rendered page body (H1, text, prices, FAQ) inside #root
//   - window.__PLOTRAA_DATA__ (plans + blog list) so React hydrates the same
// so crawlers that don't run JavaScript (ChatGPT, Claude, Perplexity, Bing,
// WhatsApp…) read the real page.
//
// Also writes:
//   dist/app.html            empty SPA shell for app routes (dashboard, /p/…)
//   dist/404.html            prerendered "Page not found" (served with 404)
//   dist/seo-routes.json     list of public pages, read by the backend sitemap
//
// Data source: PRERENDER_API_URL (default https://plotraa.com). If the API
// can't be reached the build still succeeds; pages fall back to static copy.

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const ssrDir = path.join(root, 'dist-ssr');
const API = (process.env.PRERENDER_API_URL || 'https://plotraa.com').replace(/\/$/, '');

const TITLE_RE = /<title>[\s\S]*?<\/title>/;
const ROOT_RE = /<div id="root"><\/div>/;

async function getJson(url) {
  try {
    const res = await fetch(url, { headers: { accept: 'application/json' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn(`[prerender] could not load ${url}: ${err.message}`);
    return null;
  }
}

const serialize = (data) => JSON.stringify(data).replace(/</g, '\\u003c');

async function main() {
  const template = await fs.readFile(path.join(dist, 'index.html'), 'utf8');
  if (!TITLE_RE.test(template) || !ROOT_RE.test(template)) {
    throw new Error('prerender: <title> or <div id="root"></div> not found in dist/index.html');
  }

  // Untouched shell for app routes (dashboard, /p/:slug, /login …).
  await fs.writeFile(path.join(dist, 'app.html'), template);

  const entry = path.join(ssrDir, 'entry-server.js');
  const { render, SEO_PAGES, NOT_FOUND_PAGE, renderHeadHtml } = await import(pathToFileURL(entry).href);

  const plansRes = await getJson(`${API}/api/v1/public/billing/plans`);
  const blogRes = await getJson(`${API}/api/v1/public/blog?page=1&limit=12`);
  const data = {};
  if (Array.isArray(plansRes?.plans)) data.plans = plansRes.plans;
  if (Array.isArray(blogRes?.posts)) {
    data.blogList = { posts: blogRes.posts, tags: blogRes.tags ?? [], pagination: blogRes.pagination };
  }
  globalThis.__PLOTRAA_DATA__ = data;

  const page = (head, body) =>
    template
      .replace(TITLE_RE, head)
      .replace(
        ROOT_RE,
        `<div id="root" data-ssr="1">${body}</div>\n    <script>window.__PLOTRAA_DATA__=${serialize(data)}</script>`,
      );

  const routes = Object.keys(SEO_PAGES);
  for (const route of routes) {
    const body = await render(route);
    if (!/<h1[\s>]/.test(body)) throw new Error(`prerender: ${route} rendered without an <h1>`);
    const html = page(renderHeadHtml(SEO_PAGES[route], route, { data }), body);
    const dir = route === '/' ? dist : path.join(dist, route.replace(/^\//, ''));
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, 'index.html'), html);
    console.log(`[prerender] ${route}`);
  }

  const notFoundBody = await render('/__plotraa_not_found__');
  await fs.writeFile(
    path.join(dist, '404.html'),
    page(renderHeadHtml(NOT_FOUND_PAGE, '/404', { canonical: false, data }), notFoundBody),
  );
  console.log('[prerender] 404.html');

  // Public, indexable pages for the backend's dynamic sitemap.xml
  // (/request-access is a form and stays out of the sitemap).
  const sitemapRoutes = routes.filter((r) => r !== '/request-access');
  await fs.writeFile(path.join(dist, 'seo-routes.json'), JSON.stringify({ routes: sitemapRoutes }, null, 2));

  await fs.rm(ssrDir, { recursive: true, force: true });
  console.log(`[prerender] done: ${routes.length} pages (plans: ${data.plans ? 'live' : 'fallback'}, blog: ${data.blogList ? 'live' : 'none'})`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
