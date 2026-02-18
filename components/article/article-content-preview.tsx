"use client";

import { useState } from "react";
import DOMPurify from "isomorphic-dompurify";
import { Eye, Code } from "lucide-react";
import { useSession } from "next-auth/react";

interface ArticleContentPreviewProps {
  content: string;
  className?: string;
}

/**
 * Toggleable article content viewer:
 *  - "Rendered" (default) — displays sanitised HTML via prose classes
 *  - "Source"             — shows raw HTML source for debugging / editing
 */
export default function ArticleContentPreview({
  content,
  className = "",
}: ArticleContentPreviewProps) {
  const [showSource, setShowSource] = useState(false);
  const { data: session } = useSession();

  const safeHTML = DOMPurify.sanitize(
    content || "<p>No content available.</p>",
  );

  const canViewSource = (session?.user?.privilegeLevel ?? 0) >= 3;

  return (
    <div className={className}>
      {/* Toggle button — top-right corner */}
      {canViewSource && (
        <div className="flex justify-end mb-4">
          <button
            type="button"
            onClick={() => setShowSource((s) => !s)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-white/10 text-white/60 hover:text-white hover:border-white/30 transition-colors"
          >
            {showSource ? (
              <>
                <Eye className="w-3.5 h-3.5" /> Rendered
              </>
            ) : (
              <>
                <Code className="w-3.5 h-3.5" /> Source
              </>
            )}
          </button>
        </div>
      )}

      {showSource ? (
        <pre className="whitespace-pre-wrap wrap-break-word text-xs sm:text-sm font-mono text-secondary bg-white/5 rounded-xl p-4 border border-white/10 overflow-x-auto">
          {safeHTML}
        </pre>
      ) : (
        <div
          className="prose prose-invert prose-sm sm:prose-lg max-w-none
            prose-headings:text-white prose-p:text-secondary prose-strong:text-white
            prose-a:text-accent prose-a:no-underline hover:prose-a:underline
            prose-li:text-secondary prose-blockquote:border-accent prose-blockquote:bg-white/5 prose-blockquote:p-4 prose-blockquote:rounded-r-lg
            prose-img:rounded-xl prose-img:mx-auto prose-figcaption:text-center prose-figcaption:text-secondary/70 prose-figcaption:text-sm
            prose-mark:bg-accent/30 prose-mark:text-white prose-mark:px-1 prose-mark:rounded
            prose-hr:border-white/20"
          dangerouslySetInnerHTML={{ __html: safeHTML }}
        />
      )}
    </div>
  );
}
