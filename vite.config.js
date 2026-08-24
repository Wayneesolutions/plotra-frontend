import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// NOTE: proxy target corrected to port 3001 — that's what src/server.js
// actually listens on (PORT env var, defaulting to 3001 since Phase 0).
// The version Gemini generated assumed port 5000, which doesn't match
// this project and would have made every /api call fail with a connection
// refused error.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false
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
      }
    }
  }
});
