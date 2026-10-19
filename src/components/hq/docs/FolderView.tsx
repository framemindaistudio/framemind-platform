"use client";

import { ChevronRight, Folder, FolderOpen, Pencil, Plus, Printer } from "lucide-react";
import { Markdown } from "@/components/hq/Markdown";
import { Loading, EmptyState } from "@/components/hq/ui";
import { CornerMarks } from "@/components/brand/Blueprint";
import { Button } from "@/components/ui/Button";
import { api } from "@/components/hq/data";
import { cn } from "@/lib/utils";
import { KindIcon } from "./DocTree";
import { useRemote } from "./hooks";
import { extOf, fileKind, formatBytes, nodeTitle, OPS_ROOT, printPackHref, resolveDocLink, type TreeNode } from "./lib";

function Card({ node, onOpen }: { node: TreeNode; onOpen: (path: string) => void }) {
  const dir = node.type === "dir";
  return (
    <button
      type="button"
      onClick={() => onOpen(node.path)}
      className="group relative flex h-full w-full flex-col rounded-[var(--radius-md)] border border-graphite/15 bg-paper-50 p-4 text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-graphite/40 hover:shadow-[var(--shadow-paper)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-graphite"
    >
      <span className="flex items-start justify-between gap-3">
        <span className={cn("grid size-9 place-items-center rounded-[var(--radius-sm)] border border-graphite/15", dir ? "bg-graphite text-paper" : "bg-paper")}>
          {dir ? <Folder className="size-4" aria-hidden /> : <KindIcon kind={fileKind(node.name)} className="size-4 text-charcoal" />}
        </span>
        <ChevronRight className="size-4 text-blueprint transition-transform group-hover:translate-x-0.5" aria-hidden />
      </span>
      <span className="mt-3 text-sm font-semibold leading-snug">{nodeTitle(node)}</span>
      <span className="mt-auto pt-3 text-[11px] text-blueprint">
        {dir ? (
          <span className="tabular font-mono">
            {node.fileCount} {node.fileCount === 1 ? "document" : "documents"}
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <span className="rounded bg-graphite/[0.07] px-1.5 py-px font-mono uppercase">{extOf(node.name) || "file"}</span>
            <span className="tabular font-mono">{formatBytes(node.size)}</span>
          </span>
        )}
      </span>
    </button>
  );
}

/** Folder landing view: README on top, then cards for sub-folders and files. */
export function FolderView({
  node,
  onOpen,
  canWrite,
  onNew,
}: {
  node: TreeNode;
  onOpen: (path: string) => void;
  canWrite: boolean;
  onNew: () => void;
}) {
  const readme = node.children.find((c) => c.type === "file" && /^readme\.(md|markdown)$/i.test(c.name));
  const items = node.children.filter((c) => c !== readme);
  const dirs = items.filter((c) => c.type === "dir");
  const files = items.filter((c) => c.type === "file");
  const isRoot = node.path === OPS_ROOT;
  const mdCount = node.children.filter((c) => c.type === "file" && fileKind(c.name) === "markdown").length;

  const readmeDoc = useRemote<{ content: string }>(readme ? `readme:${readme.path}` : null, () => api(`/api/hq/docs?path=${encodeURIComponent(readme?.path ?? "")}`));

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-[var(--radius-md)] bg-graphite text-paper">
            <FolderOpen className="size-5" aria-hidden />
          </span>
          <div>
            <h2 className="text-xl font-bold tracking-tight">{isRoot ? "Operations Library" : nodeTitle(node)}</h2>
            <p className="tabular text-xs text-blueprint">
              {node.fileCount} {node.fileCount === 1 ? "document" : "documents"}
              {dirs.length > 0 && ` · ${dirs.length} ${dirs.length === 1 ? "folder" : "folders"}`}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {mdCount > 0 && !isRoot && (
            <Button href={printPackHref([node.path], `${nodeTitle(node)} — document pack`, `/hq/docs?path=${node.path}`)} external variant="secondary" size="sm">
              <Printer className="size-4" /> Print folder as PDF
            </Button>
          )}
          {canWrite && (
            <Button size="sm" onClick={onNew}>
              <Plus className="size-4" /> New document here
            </Button>
          )}
        </div>
      </div>

      {readme && (
        <section aria-label="Folder overview" className="relative rounded-[var(--radius-md)] border border-graphite/12 bg-paper-50 p-5 sm:p-7">
          <CornerMarks />
          {readmeDoc.loading && !readmeDoc.data ? (
            <Loading label="Loading overview…" className="py-6" />
          ) : readmeDoc.data ? (
            <>
              <Markdown
                content={readmeDoc.data.content}
                onLink={(href) => {
                  const link = resolveDocLink(readme.path, href);
                  if (link?.type !== "doc") return false;
                  onOpen(link.path);
                  return true;
                }}
              />
              <div className="mt-4 flex justify-end">
                <Button size="sm" variant="ghost" onClick={() => onOpen(readme.path)}>
                  <Pencil className="size-3.5" /> Open overview document
                </Button>
              </div>
            </>
          ) : (
            <p className="text-sm text-bad">{readmeDoc.error ?? "Could not load the overview."}</p>
          )}
        </section>
      )}

      {dirs.length > 0 && (
        <section aria-label="Folders">
          <h3 className="annot mb-3 text-blueprint">Folders</h3>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {dirs.map((d) => (
              <Card key={d.path} node={d} onOpen={onOpen} />
            ))}
          </div>
        </section>
      )}

      {files.length > 0 && (
        <section aria-label="Documents">
          <h3 className="annot mb-3 text-blueprint">Documents</h3>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {files.map((f) => (
              <Card key={f.path} node={f} onOpen={onOpen} />
            ))}
          </div>
        </section>
      )}

      {!readme && dirs.length === 0 && files.length === 0 && (
        <EmptyState
          icon="FolderOpen"
          title="This folder is empty"
          description={canWrite ? "Create the first document here — it is saved to the shared, versioned library." : "Nothing has been added to this folder yet."}
          action={
            canWrite ? (
              <Button size="sm" onClick={onNew}>
                <Plus className="size-4" /> New document
              </Button>
            ) : undefined
          }
        />
      )}
    </div>
  );
}
