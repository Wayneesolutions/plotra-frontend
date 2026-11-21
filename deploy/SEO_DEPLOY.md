# Plotraa SEO / AI-search fix — deploy steps (Nov 2026)

Frontend PR + backend PR together fix items 1–7 and most of 9–10 of the
"On-Page SEO & AI-Search Fix Guide". Deploy both, then run the checks below.

## 1. Backend (plotra-backend)

1. Pull + `npm ci`.
2. Add to `.env` (see `.env.example`):
   ```
   FRONTEND_DIST_DIR=/var/www/plotraa/dist   # wherever nginx serves the frontend from
   PUBLIC_SITE_URL=https://plotraa.com
   INDEXNOW_KEY=<key from Bing Webmaster Tools → IndexNow>
   ```
3. `pm2 restart api`

## 2. Frontend (plotra-frontend)

1. Pull + `npm ci` + `npm run build`.
   The build now: builds the app → server-renders every public page →
   writes `dist/<page>/index.html`, `dist/app.html`, `dist/404.html`,
   `dist/seo-routes.json`. It reads live plans + blog posts from
   `PRERENDER_API_URL` (default `https://plotraa.com`) so prices in the HTML
   match the admin Plans tab. **Rebuild after changing plans in admin.**
2. Copy `dist/` to the nginx root as before.

## 3. nginx

Replace the SPA fallback with `deploy/nginx-plotraa.conf` (adjust `root` and
the API port), then `sudo nginx -t && sudo systemctl reload nginx`.
Key change: unknown URLs now return **404**, app routes get `app.html`,
`/blog*` + `/sitemap.xml` + `/indexnow-*` go to the API.

## 4. After deploy

- Google Search Console + Bing Webmaster Tools: resubmit `https://plotraa.com/sitemap.xml`.
- `cd plotra-backend && node scripts/indexnow-submit.js` (submits every sitemap URL once).
- New/edited blog posts ping IndexNow automatically.

## 5. QA checklist (send proof to Pankaj)

```bash
curl -s https://plotraa.com/ | grep -o "<h1[^>]*>.\{0,120\}"            # H1 with "Plotraa"
curl -s https://plotraa.com/pricing | grep -c "₹"                       # > 0
curl -s https://plotraa.com/blog/best-crm-for-property-dealers-india | grep "<title>"   # post's own title
curl -sI https://plotraa.com/abc-xyz | head -1                          # 404
curl -s https://plotraa.com/sitemap.xml | grep -c "/blog/"              # every post, no {slug}
for ua in OAI-SearchBot Claude-SearchBot PerplexityBot bingbot; do curl -s -o /dev/null -w "$ua %{http_code}\n" -A "$ua" https://plotraa.com/; done   # all 200
curl -s https://plotraa.com/robots.txt | head -3
curl -s https://plotraa.com/llms.txt | head -3
```

Then validate `/`, `/faq`, `/how-it-works` and one blog post at
https://validator.schema.org and Google's Rich Results Test.
