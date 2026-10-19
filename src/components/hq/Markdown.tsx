"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

/**
 * Renders OPERATIONS markdown with FrameMind document styling (.doc-prose in globals.css).
 * `onLink` may take over a link (return true) — the library uses it to open document-to-document links in place.
 */
export function Markdown({ content, className, onLink }: { content: string; className?: string; onLink?: (href: string) => boolean }) {
  return (
    <div className={cn("doc-prose", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children }) => {
            const internal = href?.startsWith("/") || href?.startsWith("#");
            return (
              <a
                href={href}
                target={internal ? undefined : "_blank"}
                rel={internal ? undefined : "noopener noreferrer"}
                onClick={(e) => {
                  if (href && onLink?.(href)) e.preventDefault();
                }}
              >
                {children}
              </a>
            );
          },
          table: ({ children }) => (
            <div className="hq-scroll overflow-x-auto">
              <table>{children}</table>
            </div>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
