// Build-time server renderer used by scripts/prerender.mjs. Renders one route
// of the real app to an HTML string (waiting for lazy pages to load), so the
// static HTML crawlers receive contains the page's actual H1, text and prices.
import { StrictMode } from "react";
import { renderToPipeableStream } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import { Writable } from "node:stream";
import { AppRoutes } from "./App.jsx";

export { SEO_PAGES, NOT_FOUND_PAGE, renderHeadHtml } from "./seo/pages.js";

export function render(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    let html = "";
    const sink = new Writable({
      write(chunk, _enc, cb) {
        html += chunk.toString();
        cb();
      },
      final(cb) {
        resolve(html);
        cb();
      },
    });

    const { pipe } = renderToPipeableStream(
      <StrictMode>
        <StaticRouter location={url}>
          <AppRoutes />
        </StaticRouter>
      </StrictMode>,
      {
        onAllReady() {
          pipe(sink);
        },
        onShellError: reject,
        onError(err) {
          reject(err);
        },
      },
    );
  });
}
