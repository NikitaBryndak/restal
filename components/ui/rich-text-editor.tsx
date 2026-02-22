"use client";

import { useRef, useState, useCallback } from "react";
import DOMPurify from "isomorphic-dompurify";
import {
  Bold,
  Italic,
  Underline,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Link,
  Image,
  Minus,
  Eye,
  Code,
  AlignLeft,
  Pilcrow,
  Highlighter,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type ToolbarAction = {
  icon: React.ReactNode;
  label: string;
  action: () => void;
  separator?: false;
};
type ToolbarSeparator = { separator: true };
type ToolbarItem = ToolbarAction | ToolbarSeparator;

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function RichTextEditor({
  value,
  onChange,
  placeholder = "Start writing your article…",
  className = "",
  minHeight = "350px",
}: RichTextEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showPreview, setShowPreview] = useState(false);

  /* ---------- helpers ---------- */

  /** Wrap the current selection (or insert at cursor) with an HTML tag pair. */
  const wrapSelection = useCallback(
    (before: string, after: string) => {
      const ta = textareaRef.current;
      if (!ta) return;

      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const selected = ta.value.substring(start, end);

      const replacement = `${before}${selected || "text"}${after}`;
      const next =
        ta.value.substring(0, start) + replacement + ta.value.substring(end);

      onChange(next);

      // restore focus & selection inside the tag
      requestAnimationFrame(() => {
        ta.focus();
        const cursorStart = start + before.length;
        const cursorEnd = cursorStart + (selected || "text").length;
        ta.setSelectionRange(cursorStart, cursorEnd);
      });
    },
    [onChange],
  );

  /** Insert a block-level element (heading, list, blockquote, hr…). */
  const insertBlock = useCallback(
    (block: string) => {
      const ta = textareaRef.current;
      if (!ta) return;

      const start = ta.selectionStart;

      // Add newlines for separation if not at the very beginning
      const prefix = start > 0 && ta.value[start - 1] !== "\n" ? "\n\n" : "";
      const next =
        ta.value.substring(0, start) +
        prefix +
        block +
        "\n" +
        ta.value.substring(start);

      onChange(next);

      requestAnimationFrame(() => {
        ta.focus();
        const cursor = start + prefix.length + block.length + 1;
        ta.setSelectionRange(cursor, cursor);
      });
    },
    [onChange],
  );

  /** Prompt-based insertion (links, images). */
  const insertLink = useCallback(() => {
    const url = prompt("Enter the URL:");
    if (!url) return;

    const ta = textareaRef.current;
    if (!ta) return;
    wrapSelection(`<a href="${url}" target="_blank" rel="noopener noreferrer">`, "</a>");
  }, [wrapSelection]);

  const insertImage = useCallback(() => {
    const url = prompt("Enter the image URL:");
    if (!url) return;
    const alt = prompt("Enter alt text (for accessibility):") || "image";
    insertBlock(
      `<figure>\n  <img src="${url}" alt="${alt}" class="article-image" />\n  <figcaption>${alt}</figcaption>\n</figure>`,
    );
  }, [insertBlock]);

  /* ---------- toolbar config ---------- */

  const toolbar: ToolbarItem[] = [
    {
      icon: <Bold className="w-4 h-4" />,
      label: "Bold",
      action: () => wrapSelection("<strong>", "</strong>"),
    },
    {
      icon: <Italic className="w-4 h-4" />,
      label: "Italic",
      action: () => wrapSelection("<em>", "</em>"),
    },
    {
      icon: <Underline className="w-4 h-4" />,
      label: "Underline",
      action: () => wrapSelection("<u>", "</u>"),
    },
    {
      icon: <Highlighter className="w-4 h-4" />,
      label: "Highlight",
      action: () => wrapSelection('<mark>', "</mark>"),
    },
    { separator: true },
    {
      icon: <Heading2 className="w-4 h-4" />,
      label: "Heading 2",
      action: () => wrapSelection("<h2>", "</h2>"),
    },
    {
      icon: <Heading3 className="w-4 h-4" />,
      label: "Heading 3",
      action: () => wrapSelection("<h3>", "</h3>"),
    },
    {
      icon: <Pilcrow className="w-4 h-4" />,
      label: "Paragraph",
      action: () => wrapSelection("<p>", "</p>"),
    },
    { separator: true },
    {
      icon: <List className="w-4 h-4" />,
      label: "Bullet list",
      action: () =>
        insertBlock(
          "<ul>\n  <li>Item 1</li>\n  <li>Item 2</li>\n  <li>Item 3</li>\n</ul>",
        ),
    },
    {
      icon: <ListOrdered className="w-4 h-4" />,
      label: "Numbered list",
      action: () =>
        insertBlock(
          "<ol>\n  <li>Item 1</li>\n  <li>Item 2</li>\n  <li>Item 3</li>\n</ol>",
        ),
    },
    {
      icon: <Quote className="w-4 h-4" />,
      label: "Blockquote",
      action: () => wrapSelection("<blockquote>", "</blockquote>"),
    },
    { separator: true },
    {
      icon: <Link className="w-4 h-4" />,
      label: "Insert link",
      action: insertLink,
    },
    {
      icon: <Image className="w-4 h-4" />,
      label: "Insert image",
      action: insertImage,
    },
    {
      icon: <Minus className="w-4 h-4" />,
      label: "Horizontal rule",
      action: () => insertBlock("<hr />"),
    },
    { separator: true },
    {
      icon: <Code className="w-4 h-4" />,
      label: "Inline code",
      action: () => wrapSelection("<code>", "</code>"),
    },
  ];

  /* ---------- keyboard shortcuts ---------- */

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (!e.ctrlKey && !e.metaKey) return;

      const key = e.key.toLowerCase();
      if (key === "b") {
        e.preventDefault();
        wrapSelection("<strong>", "</strong>");
      } else if (key === "i") {
        e.preventDefault();
        wrapSelection("<em>", "</em>");
      } else if (key === "u") {
        e.preventDefault();
        wrapSelection("<u>", "</u>");
      } else if (key === "k") {
        e.preventDefault();
        insertLink();
      }
    },
    [wrapSelection, insertLink],
  );

  /* ---------- auto-format plain text → HTML paragraphs ---------- */

  const autoFormat = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;

    let text = ta.value;

    // Don't auto-format if already has HTML tags
    if (/<[a-z][\s\S]*>/i.test(text)) {
      alert(
        "Content already contains HTML tags. Auto-format works best with plain text.\n\nTo re-format, remove existing tags first.",
      );
      return;
    }

    // Split into paragraphs by double newlines
    const paragraphs = text
      .split(/\n{2,}/)
      .map((p) => p.trim())
      .filter(Boolean);

    const formatted = paragraphs
      .map((para) => {
        // Detect if line looks like a heading (short, no period at end)
        if (para.length < 80 && !para.endsWith(".") && !para.endsWith(",")) {
          // First paragraph → h2, subsequent short lines → h3
          return `<h2>${para}</h2>`;
        }
        // Detect list-like lines (starting with - or *)
        const lines = para.split("\n");
        if (lines.every((l) => /^[\s]*[-*•]\s/.test(l))) {
          const items = lines
            .map((l) => `  <li>${l.replace(/^[\s]*[-*•]\s*/, "")}</li>`)
            .join("\n");
          return `<ul>\n${items}\n</ul>`;
        }
        // Detect numbered list lines
        if (lines.every((l) => /^[\s]*\d+[.)]\s/.test(l))) {
          const items = lines
            .map((l) => `  <li>${l.replace(/^[\s]*\d+[.)]\s*/, "")}</li>`)
            .join("\n");
          return `<ol>\n${items}\n</ol>`;
        }
        return `<p>${para.replace(/\n/g, "<br />")}</p>`;
      })
      .join("\n\n");

    onChange(formatted);

    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(formatted.length, formatted.length);
    });
  }, [onChange]);

  /* ---------- render ---------- */

  return (
    <div
      className={`rounded-xl border border-border/60 bg-background overflow-hidden transition focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 ${className}`}
    >
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-border/40 bg-white/5">
        {toolbar.map((item, idx) =>
          "separator" in item && item.separator ? (
            <div
              key={`sep-${idx}`}
              className="w-px h-5 bg-border/40 mx-1"
            />
          ) : (
            <button
              key={(item as ToolbarAction).label}
              type="button"
              title={(item as ToolbarAction).label}
              onClick={(item as ToolbarAction).action}
              className="p-1.5 rounded-md text-foreground/60 hover:text-foreground hover:bg-white/10 transition-colors"
            >
              {(item as ToolbarAction).icon}
            </button>
          ),
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Auto-format button */}
        <button
          type="button"
          title="Auto-format plain text to HTML"
          onClick={autoFormat}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-foreground/50 hover:text-foreground hover:bg-white/10 transition-colors"
        >
          <AlignLeft className="w-3.5 h-3.5" />
          Auto-format
        </button>

        {/* Preview toggle */}
        <button
          type="button"
          title={showPreview ? "Edit mode" : "Preview HTML"}
          onClick={() => setShowPreview((p) => !p)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
            showPreview
              ? "bg-accent text-white"
              : "text-foreground/50 hover:text-foreground hover:bg-white/10"
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          {showPreview ? "Edit" : "Preview"}
        </button>
      </div>

      {/* Editor / Preview area */}
      {showPreview ? (
        <div
          className="p-4 sm:p-6 overflow-auto prose prose-invert prose-sm sm:prose-base max-w-none
            prose-headings:text-white prose-p:text-secondary prose-strong:text-white
            prose-a:text-accent prose-a:no-underline hover:prose-a:underline
            prose-li:text-secondary prose-blockquote:border-accent prose-blockquote:bg-white/5 prose-blockquote:p-4 prose-blockquote:rounded-r-lg
            prose-img:rounded-xl prose-img:mx-auto prose-figcaption:text-center prose-figcaption:text-secondary/70 prose-figcaption:text-sm
            prose-mark:bg-accent/30 prose-mark:text-white prose-mark:px-1 prose-mark:rounded
            prose-hr:border-white/20"
          style={{ minHeight }}
          dangerouslySetInnerHTML={{
            __html: DOMPurify.sanitize(
              value || '<p class="text-secondary/50 italic">Nothing to preview yet…</p>',
            ),
          }}
        />
      ) : (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full px-4 py-3 text-sm text-foreground bg-transparent outline-none resize-y font-mono leading-relaxed"
          style={{ minHeight }}
        />
      )}

      {/* Status bar */}
      <div className="flex items-center justify-between px-3 py-1.5 border-t border-border/40 bg-white/2 text-xs text-foreground/40">
        <span>
          {value.length.toLocaleString()} chars •{" "}
          {value.split(/\s+/).filter(Boolean).length.toLocaleString()} words
        </span>
        <span className="hidden sm:inline">
          Ctrl+B bold · Ctrl+I italic · Ctrl+U underline · Ctrl+K link
        </span>
      </div>
    </div>
  );
}
