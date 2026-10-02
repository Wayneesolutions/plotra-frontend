// Client-side helpers for blog content. The server applies the same rules
// again on save (plotra-backend/src/utils/blogContent.js) — these exist so
// the editor shows what will actually be stored, not as the security layer.

const ALLOWED_TAGS = new Set([
  "P", "BR", "H2", "H3", "H4", "STRONG", "B", "EM", "I", "U", "UL", "OL", "LI", "A", "BLOCKQUOTE",
]);
const DROPPED_WITH_CONTENT = new Set([
  "SCRIPT", "STYLE", "IFRAME", "OBJECT", "EMBED", "NOSCRIPT", "TEMPLATE", "SVG", "MATH", "HEAD", "TITLE", "META", "LINK",
]);
const SAFE_HREF = /^(https?:\/\/|mailto:|tel:|\/(?!\/)|#)/i;

function cleanNode(node: Node, out: Node, doc: Document) {
  node.childNodes.forEach((child) => {
    if (child.nodeType === Node.TEXT_NODE) {
      out.appendChild(doc.createTextNode(child.textContent ?? ""));
      return;
    }
    if (child.nodeType !== Node.ELEMENT_NODE) return;

    const el = child as HTMLElement;
    let tag = el.tagName.toUpperCase();
    if (DROPPED_WITH_CONTENT.has(tag)) return;
    if (tag === "DIV") tag = "P";
    if (tag === "H1") tag = "H2";

    if (!ALLOWED_TAGS.has(tag)) {
      cleanNode(el, out, doc); // unwrap: keep the text, drop the tag
      return;
    }

    const clean = doc.createElement(tag.toLowerCase());
    if (tag === "A") {
      const href = (el.getAttribute("href") ?? "").trim();
      if (href && SAFE_HREF.test(href)) {
        clean.setAttribute("href", href);
        if (/^https?:\/\//i.test(href)) {
          clean.setAttribute("target", "_blank");
          clean.setAttribute("rel", "noopener noreferrer");
        }
      }
    }
    cleanNode(el, clean, doc);
    out.appendChild(clean);
  });
}

/** Reduce pasted HTML (Google Docs, Word, another site) to the blog's tags. */
export function cleanBlogHtml(html: string): string {
  const parsed = new DOMParser().parseFromString(html, "text/html");
  const out = document.createElement("div");
  cleanNode(parsed.body, out, document);
  return out.innerHTML;
}

const BLOCK_TAGS = new Set(["P", "H2", "H3", "H4", "UL", "OL", "BLOCKQUOTE"]);

/**
 * What the editor's HTML is turned into right before saving: allowlisted
 * tags only, loose text wrapped in paragraphs, empty paragraphs removed.
 * (contentEditable leaves all three behind — e.g. a list nested inside a
 * <p>, which browsers re-parse into stray empty paragraphs.)
 */
export function normalizeBlogHtml(html: string): string {
  const root = document.createElement("div");
  root.innerHTML = cleanBlogHtml(html);

  // Wrap runs of top-level text / inline nodes in <p>.
  let run: HTMLParagraphElement | null = null;
  Array.from(root.childNodes).forEach((node) => {
    const isBlock = node.nodeType === Node.ELEMENT_NODE && BLOCK_TAGS.has((node as Element).tagName);
    if (isBlock) {
      run = null;
      return;
    }
    if (!run) {
      run = document.createElement("p");
      root.insertBefore(run, node);
    }
    run.appendChild(node);
  });

  root.querySelectorAll("p, h2, h3, h4, li, blockquote").forEach((el) => {
    if (!(el.textContent ?? "").replace(/\u00a0/g, " ").trim()) el.remove();
  });
  root.querySelectorAll("ul, ol").forEach((el) => {
    if (!el.querySelector("li")) el.remove();
  });

  return root.innerHTML.trim();
}

export function htmlToText(html: string): string {
  const parsed = new DOMParser().parseFromString(html, "text/html");
  return (parsed.body.textContent ?? "").replace(/\s+/g, " ").trim();
}

/** "10 Tips: Buying a Plot in Ludhiana!" -> "10-tips-buying-a-plot-in-ludhiana" */
export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/['’`]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120)
    .replace(/-+$/g, "");
}

export function formatBlogDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}
