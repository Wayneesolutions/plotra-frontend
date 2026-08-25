import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react(), tailwindcss()],
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
