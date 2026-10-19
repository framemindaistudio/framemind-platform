"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Download } from "lucide-react";
import { Markdown } from "@/components/hq/Markdown";
import { buttonClass } from "@/components/ui/Button";
import { CornerMarks } from "@/components/brand/Blueprint";
import { cn } from "@/lib/utils";
import { CsvTable } from "./CsvTable";
import { KindIcon } from "./DocTree";
import { extractToc, formatBytes, rawHref, resolveDocLink, slugifyHeading, type FileKind, type TocItem } from "./lib";
import { scrollToId } from "./hooks";

function TocList({ items, active, onPick, className }: { items: TocItem[]; active?: string; onPick: (id: string) => void; className?: string }) {
  return (
    <ul className={cn("space-y-0.5", className)}>
      {items.map((t) => (
        <li key={t.id}>
          <a
            href={`#${t.id}`}
            onClick={(e) => {
              e.preventDefault();
              onPick(t.id);
            }}
            aria-current={active === t.id ? "location" : undefined}
            className={cn(
              "block rounded-[var(--radius-sm)] border-l-2 py-1 pr-2 text-[13px] leading-snug transition-colors",
              t.level === 3 ? "pl-5" : "pl-3",
              active === t.id ? "border-graphite bg-graphite/[0.06] font-semibold text-graphite" : "border-transparent text-charcoal hover:border-graphite/30 hover:text-graphite",
            )}
          >
            {t.text}
          </a>
        </li>
      ))}
    </ul>
  );
}

/** Markdown document with a sticky table of contents and in-library link handling. */
export function MarkdownBody({ content, path, onNavigate }: { content: string; path: string; onNavigate: (path: string) => void }) {
  const ref = useRef<HTMLElement>(null);
  const toc = useMemo(() => extractToc(content), [content]);
  const [active, setActive] = useState("");
  const hashHandled = useRef(false);

  // Give rendered headings stable ids (same order as the parsed table of contents).
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const hs = Array.from(root.querySelectorAll<HTMLElement>("h2, h3"));
    const used = new Map<string, number>();
    hs.forEach((h, i) => {
      if (hs.length === toc.length) {
        h.id = toc[i].id;
        return;
      }
      const base = slugifyHeading(h.textContent ?? "") || "section";
      const n = used.get(base) ?? 0;
      used.set(base, n + 1);
      h.id = n ? `${base}-${n}` : base;
    });
    if (!hashHandled.current && window.location.hash.length > 1) {
      hashHandled.current = true;
      const id = decodeURIComponent(window.location.hash.slice(1));
      requestAnimationFrame(() => scrollToId(id));
    }
  }, [toc, content]);

  // Highlight the heading currently being read.
  useEffect(() => {
    const root = ref.current;
    if (!root || !toc.length || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        const first = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (first?.target.id) setActive(first.target.id);
      },
      { rootMargin: "-72px 0px -70% 0px" },
    );
    root.querySelectorAll<HTMLElement>("h2, h3").forEach((h) => io.observe(h));
    return () => io.disconnect();
  }, [toc, content]);

  // Relative links between documents open inside the library instead of a new tab.
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element).closest("a");
      const href = a?.getAttribute("href");
      if (!a || !href) return;
      const r = resolveDocLink(path, href);
      if (!r) return;
      e.preventDefault();
      if (r.type === "hash") scrollToId(r.id);
      else onNavigate(r.path);
    };
    root.addEventListener("click", onClick);
    return () => root.removeEventListener("click", onClick);
  }, [path, onNavigate]);

  const showToc = toc.length > 1;
  return (
    <div className={cn("grid gap-8", showToc && "xl:grid-cols-[minmax(0,1fr)_14.5rem]")}>
      <div className="min-w-0">
        {showToc && (
          <details className="mb-6 rounded-[var(--radius-sm)] border border-graphite/15 bg-paper-100/60 xl:hidden">
            <summary className="cursor-pointer select-none px-4 py-2.5 text-sm font-semibold">On this page</summary>
            <TocList items={toc} active={active} onPick={scrollToId} className="px-2 pb-3" />
          </details>
        )}
        <article ref={ref} className="max-w-[920px] [&_h2]:scroll-mt-[88px] [&_h3]:scroll-mt-[88px]">
          <Markdown content={content} />
        </article>
      </div>
      {showToc && (
        <aside className="hidden xl:block" aria-label="Table of contents">
          <div className="hq-scroll sticky top-[84px] max-h-[calc(100dvh-110px)] overflow-y-auto border-l border-graphite/10 pl-4" data-lenis-prevent>
            <p className="annot mb-2 text-blueprint">On this page</p>
            <TocList items={toc} active={active} onPick={scrollToId} />
          </div>
        </aside>
      )}
    </div>
  );
}

function Pre({ text }: { text: string }) {
  return (
    <pre className="hq-scroll max-h-[75vh] overflow-auto whitespace-pre-wrap break-words rounded-[var(--radius-sm)] border border-graphite/15 bg-white p-4 font-mono text-[13px] leading-relaxed text-graphite" data-lenis-prevent>
      {text}
    </pre>
  );
}

export function DocContent({ kind, content, path, onNavigate }: { kind: FileKind; content: string; path: string; onNavigate: (path: string) => void }) {
  const pretty = useMemo(() => {
    if (kind !== "json") return content;
    try {
      return JSON.stringify(JSON.parse(content), null, 2);
    } catch {
      return content;
    }
  }, [kind, content]);
  if (kind === "markdown") return <MarkdownBody content={content} path={path} onNavigate={onNavigate} />;
  if (kind === "csv") return <CsvTable text={content} />;
  return <Pre text={pretty} />;
}

/** Inline preview for images / PDFs, download card for everything else. */
export function BinaryPreview({ path, name, kind, size }: { path: string; name: string; kind: FileKind; size?: number }) {
  if (kind === "image") {
    return (
      <div className="bp-grid-fine relative grid place-items-center rounded-[var(--radius-md)] border border-graphite/15 bg-white p-4">
        <CornerMarks />
        {/* Authenticated API route — next/image optimisation does not apply. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={rawHref(path)} alt={name} className="max-h-[75vh] w-auto max-w-full object-contain" />
      </div>
    );
  }
  if (kind === "pdf") {
    return <iframe title={name} src={rawHref(path)} className="h-[78vh] w-full rounded-[var(--radius-sm)] border border-graphite/15 bg-white" />;
  }
  return (
    <div className="relative mx-auto flex max-w-md flex-col items-center rounded-[var(--radius-md)] border border-dashed border-graphite/25 bg-paper-100/50 px-6 py-12 text-center">
      <CornerMarks />
      <span className="grid size-14 place-items-center rounded-full border border-graphite/20 bg-paper">
        <KindIcon kind={kind} className="size-6 text-charcoal" />
      </span>
      <p className="mt-4 break-all font-mono text-sm font-medium">{name}</p>
      <p className="mt-1 text-xs text-blueprint">{formatBytes(size)} · No inline preview for this file type</p>
      <a href={rawHref(path, true)} download className={buttonClass("primary", "sm", "mt-5")}>
        <Download className="size-4" aria-hidden /> Download
      </a>
    </div>
  );
}
