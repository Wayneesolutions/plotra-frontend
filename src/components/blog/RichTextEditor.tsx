import { useEffect, useRef, useState, type ReactNode } from "react";
import { Bold, Heading2, Heading3, Italic, Link2, List, ListOrdered, Pilcrow, Quote, Unlink } from "lucide-react";
import { cleanBlogHtml } from "@/lib/blog-content";
import { cn } from "@/lib/utils";

type Props = {
  /** Change this to load different content (e.g. the post id). */
  docKey: string;
  /** HTML loaded whenever docKey changes. */
  initialHtml: string;
  onChange: (html: string) => void;
  labelledBy: string;
};

function ToolButton({
  label,
  onRun,
  children,
}: {
  label: string;
  onRun: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      // mousedown, not click: keeps the text selection inside the editor
      onMouseDown={(e) => {
        e.preventDefault();
        onRun();
      }}
      className="grid size-9 place-items-center rounded-lg text-ink/70 transition-colors hover:bg-lavender hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&_svg]:size-4"
    >
      {children}
    </button>
  );
}

/**
 * Small rich-text editor for the blog post body. Produces only the tags the
 * blog renders: headings, paragraphs, bold/italic, lists, quotes and links.
 */
export function RichTextEditor({ docKey, initialHtml, onChange, labelledBy }: Props) {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const savedRange = useRef<Range | null>(null);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");

  useEffect(() => {
    if (editorRef.current) editorRef.current.innerHTML = initialHtml;
    setLinkOpen(false);
    // initialHtml is intentionally only read when the document changes —
    // re-applying it on every keystroke would reset the caret.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docKey]);

  useEffect(() => {
    try {
      document.execCommand("defaultParagraphSeparator", false, "p");
    } catch {
      // older browsers: <div> lines are converted to <p> on save
    }
  }, []);

  const emit = () => {
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  };

  const run = (command: string, value?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    emit();
  };

  const block = (tag: string) => run("formatBlock", `<${tag}>`);

  const openLink = () => {
    const selection = window.getSelection();
    const editor = editorRef.current;
    if (!selection || selection.rangeCount === 0 || !editor || !editor.contains(selection.anchorNode)) {
      savedRange.current = null;
    } else {
      savedRange.current = selection.getRangeAt(0).cloneRange();
    }
    setLinkUrl("");
    setLinkOpen(true);
  };

  const applyLink = () => {
    let url = linkUrl.trim();
    setLinkOpen(false);
    if (!url) return;
    if (!/^(https?:\/\/|mailto:|tel:|\/|#)/i.test(url)) url = `https://${url}`;

    const editor = editorRef.current;
    if (!editor) return;
    editor.focus();
    const selection = window.getSelection();
    if (savedRange.current && selection) {
      selection.removeAllRanges();
      selection.addRange(savedRange.current);
    }
    if (selection && !selection.isCollapsed) {
      document.execCommand("createLink", false, url);
    } else {
      // nothing selected: insert the address itself as the link text
      const a = document.createElement("a");
      a.href = url;
      a.textContent = url;
      document.execCommand("insertHTML", false, a.outerHTML);
    }
    emit();
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card focus-within:border-primary">
      <div className="flex flex-wrap items-center gap-0.5 border-b border-border bg-muted/60 px-2 py-1.5">
        <ToolButton label="Heading" onRun={() => block("h2")}><Heading2 /></ToolButton>
        <ToolButton label="Subheading" onRun={() => block("h3")}><Heading3 /></ToolButton>
        <ToolButton label="Normal text" onRun={() => block("p")}><Pilcrow /></ToolButton>
        <span className="mx-1 h-5 w-px bg-border" aria-hidden />
        <ToolButton label="Bold" onRun={() => run("bold")}><Bold /></ToolButton>
        <ToolButton label="Italic" onRun={() => run("italic")}><Italic /></ToolButton>
        <span className="mx-1 h-5 w-px bg-border" aria-hidden />
        <ToolButton label="Bulleted list" onRun={() => run("insertUnorderedList")}><List /></ToolButton>
        <ToolButton label="Numbered list" onRun={() => run("insertOrderedList")}><ListOrdered /></ToolButton>
        <ToolButton label="Quote" onRun={() => block("blockquote")}><Quote /></ToolButton>
        <span className="mx-1 h-5 w-px bg-border" aria-hidden />
        <ToolButton label="Add link" onRun={openLink}><Link2 /></ToolButton>
        <ToolButton label="Remove link" onRun={() => run("unlink")}><Unlink /></ToolButton>
      </div>

      {linkOpen ? (
        <div className="flex flex-wrap items-center gap-2 border-b border-border bg-lavender/60 px-3 py-2">
          <input
            autoFocus
            type="url"
            inputMode="url"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                applyLink();
              }
              if (e.key === "Escape") setLinkOpen(false);
            }}
            placeholder="https://plotraa.com/pricing"
            aria-label="Link address"
            className="min-w-0 flex-1 rounded-lg border border-border bg-white px-3 py-1.5 text-sm text-ink outline-none focus:border-primary"
          />
          <button
            type="button"
            onClick={applyLink}
            className="rounded-lg bg-ink px-3 py-1.5 text-xs font-semibold text-ink-foreground"
          >
            Add link
          </button>
          <button
            type="button"
            onClick={() => setLinkOpen(false)}
            className="rounded-lg px-2 py-1.5 text-xs font-semibold text-muted-foreground hover:text-ink"
          >
            Cancel
          </button>
        </div>
      ) : null}

      <div
        ref={editorRef}
        role="textbox"
        aria-multiline="true"
        aria-labelledby={labelledBy}
        contentEditable
        suppressContentEditableWarning
        data-placeholder="Write the post here. Use the Heading button for section titles."
        onInput={emit}
        onBlur={emit}
        onPaste={(e) => {
          e.preventDefault();
          const html = e.clipboardData.getData("text/html");
          if (html) {
            document.execCommand("insertHTML", false, cleanBlogHtml(html));
          } else {
            document.execCommand("insertText", false, e.clipboardData.getData("text/plain"));
          }
          emit();
        }}
        className={cn("blog-prose blog-editor min-h-[22rem] px-5 py-4 outline-none")}
      />
    </div>
  );
}
