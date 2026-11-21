import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import './styles.css';

const container = document.getElementById('root');
const app = (
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Marketing pages are prerendered at build time (scripts/prerender.mjs) and
// marked data-ssr="1" — hydrate those so React reuses the server HTML.
// Everything else (dashboard, /p/:slug, server-rendered blog HTML from the
// backend) starts fresh: createRoot replaces whatever is in #root.
if (container.dataset.ssr === '1') {
  ReactDOM.hydrateRoot(container, app);
} else {
  ReactDOM.createRoot(container).render(app);
}
