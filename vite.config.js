import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { SEO_PAGES, renderHeadHtml } from './src/seo/pages.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// SEO prerender of <head>: after the build, write dist/<route>/index.html for
// every marketing page with its own title, description, canonical, OG and
// JSON-LD baked in. The React app still boots from the same bundle; this only
// changes what crawlers that don't execute JS see. dist/index.html (served
// for "/" and as the SPA fallback) gets the home tags without a canonical,
// because the same file is also returned for /p/:slug, /dashboard, etc.
function seoPrerender() {
  const MARKER = /<title>[\s\S]*?<\/title>/;
  return {
    name: 'plotraa-seo-prerender',
    apply: 'build',
    closeBundle() {
      const dist = path.resolve(__dirname, 'dist');
      const indexPath = path.join(dist, 'index.html');
      if (!fs.existsSync(indexPath)) return;
      const template = fs.readFileSync(indexPath, 'utf8');
      if (!MARKER.test(template)) throw new Error('seoPrerender: <title> not found in dist/index.html');

      for (const [route, page] of Object.entries(SEO_PAGES)) {
        if (route === '/') continue;
        const html = template.replace(MARKER, renderHeadHtml(page, route));
        const dir = path.join(dist, route.replace(/^\//, ''));
        fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(path.join(dir, 'index.html'), html);
      }
      fs.writeFileSync(indexPath, template.replace(MARKER, renderHeadHtml(SEO_PAGES['/'], '/', { canonical: false })));
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), seoPrerender()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
      // /p/:slug share links: forward to backend ONLY for known crawler
      // user-agents so they receive OG meta tags. Regular browsers are sent
      // straight to index.html so React Router handles the route as normal.
      '/p': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
        bypass(req) {
          const crawlers = [
            'facebookexternalhit', 'WhatsApp', 'Twitterbot', 'Slackbot',
            'LinkedInBot', 'TelegramBot', 'Googlebot', 'bingbot',
          ];
          const ua = req.headers['user-agent'] || '';
          if (!crawlers.some((bot) => ua.includes(bot))) {
            return '/index.html'; // Vite serves index.html; React Router takes over
          }
          return null; // proxy to Express backend for OG HTML
        },
      },
    },
  },
});
