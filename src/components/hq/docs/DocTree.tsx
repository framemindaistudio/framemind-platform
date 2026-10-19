"use client";

import { useMemo } from "react";
import { ChevronRight, File, FileImage, FileSpreadsheet, FileText, Folder, FolderOpen, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { fileKind, filterTree, nodeTitle, OPS_ROOT, type FileKind, type TreeNode } from "./lib";

export function KindIcon({ kind, className }: { kind: FileKind; className?: string }) {
  const I = kind === "markdown" || kind === "text" || kind === "json" ? FileText : kind === "csv" ? FileSpreadsheet : kind === "image" ? FileImage : File;
  return <I className={className} aria-hidden />;
}

interface Ctx {
  selectedPath: string;
  expanded: Set<string>;
  filtering: boolean;
  onToggle: (path: string) => void;
  onSelect: (path: string) => void;
}

function Row({ node, depth, ctx }: { node: TreeNode; depth: number; ctx: Ctx }) {
  const isDir = node.type === "dir";
  const open = isDir && (ctx.filtering || ctx.expanded.has(node.path));
  const selected = ctx.selectedPath === node.path;
  return (
    <li>
      <div className={cn("flex items-center rounded-[var(--radius-sm)] transition-colors", selected ? "bg-graphite text-paper" : "hover:bg-graphite/[0.06]")} style={{ paddingLeft: depth * 12 }}>
        {isDir ? (
          <button
            type="button"
            onClick={() => ctx.onToggle(node.path)}
            aria-label={`${open ? "Collapse" : "Expand"} ${nodeTitle(node)}`}
            aria-expanded={open}
            className={cn("grid size-7 shrink-0 place-items-center rounded", selected ? "text-paper/80 hover:text-paper" : "text-blueprint hover:text-graphite")}
          >
            <ChevronRight className={cn("size-3.5 transition-transform duration-200", open && "rotate-90")} aria-hidden />
          </button>
        ) : (
          <span className="size-7 shrink-0" aria-hidden />
        )}
        <button type="button" onClick={() => ctx.onSelect(node.path)} aria-current={selected ? "page" : undefined} title={node.name} className="flex min-w-0 flex-1 items-center gap-2 py-1.5 pr-2 text-left text-[13px]">
          {isDir ? open ? <FolderOpen className="size-4 shrink-0" aria-hidden /> : <Folder className="size-4 shrink-0" aria-hidden /> : <KindIcon kind={fileKind(node.name)} className="size-4 shrink-0" />}
          <span className={cn("truncate", isDir && "font-medium")}>{nodeTitle(node)}</span>
          {isDir && <span className={cn("tabular ml-auto shrink-0 font-mono text-[10px]", selected ? "text-paper/70" : "text-blueprint")}>{node.fileCount}</span>}
        </button>
      </div>
      {isDir && open && node.children.length > 0 && (
        <ul>
          {node.children.map((c) => (
            <Row key={c.path} node={c} depth={depth + 1} ctx={ctx} />
          ))}
        </ul>
      )}
    </li>
  );
}

/** Collapsible folder tree with filename/title filter. */
export function DocTree({
  root,
  selectedPath,
  expanded,
  onToggle,
  onSelect,
  query,
  onQuery,
}: {
  root: TreeNode;
  selectedPath: string;
  expanded: Set<string>;
  onToggle: (path: string) => void;
  onSelect: (path: string) => void;
  query: string;
  onQuery: (q: string) => void;
}) {
  const filtered = useMemo(() => filterTree(root, query), [root, query]);
  const filtering = query.trim().length > 0;
  const ctx: Ctx = { selectedPath, expanded, filtering, onToggle, onSelect };

  return (
    <div className="flex min-h-0 flex-col">
      <label className="relative mb-3 block">
        <span className="sr-only">Filter documents by name</span>
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-blueprint" aria-hidden />
        <input
          type="search"
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder="Filter documents…"
          className="h-9 w-full rounded-[var(--radius-sm)] border border-graphite/20 bg-paper-50 pl-9 pr-8 text-sm outline-none transition-colors placeholder:text-blueprint/70 focus:border-graphite focus:bg-white focus:ring-2 focus:ring-graphite/10"
        />
        {filtering && (
          <button type="button" onClick={() => onQuery("")} aria-label="Clear filter" className="absolute right-1.5 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded-full text-charcoal hover:bg-graphite/10">
            <X className="size-3.5" aria-hidden />
          </button>
        )}
      </label>
      <nav aria-label="Operations library folders" className="hq-scroll -mx-1 min-h-0 flex-1 overflow-y-auto px-1" data-lenis-prevent>
        <ul>
          <li>
            <button
              type="button"
              onClick={() => onSelect(OPS_ROOT)}
              aria-current={selectedPath === OPS_ROOT ? "page" : undefined}
              className={cn("mb-1 flex w-full items-center gap-2 rounded-[var(--radius-sm)] px-2 py-1.5 text-left text-[13px] font-semibold transition-colors", selectedPath === OPS_ROOT ? "bg-graphite text-paper" : "hover:bg-graphite/[0.06]")}
            >
              <FolderOpen className="size-4 shrink-0" aria-hidden />
              <span className="truncate">All of Operations</span>
              <span className={cn("tabular ml-auto font-mono text-[10px]", selectedPath === OPS_ROOT ? "text-paper/70" : "text-blueprint")}>{root.fileCount}</span>
            </button>
          </li>
          {filtered?.children.map((c) => (
            <Row key={c.path} node={c} depth={0} ctx={ctx} />
          ))}
        </ul>
        {filtering && !filtered && <p className="px-2 py-6 text-center text-sm text-blueprint">Nothing matches “{query}”.</p>}
      </nav>
    </div>
  );
}
