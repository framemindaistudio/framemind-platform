"use client";

import { useState } from "react";
import { Check, Download, History, Link2, Pencil, Printer, Trash2 } from "lucide-react";
import { api } from "@/components/hq/data";
import { Loading, EmptyState } from "@/components/hq/ui";
import { CornerMarks } from "@/components/brand/Blueprint";
import { Button, buttonClass } from "@/components/ui/Button";
import { formatDateTime } from "@/lib/utils";
import { ConfirmDialog } from "./ConfirmDialog";
import { BinaryPreview, DocContent } from "./DocBody";
import { DocEditor } from "./DocEditor";
import { KindIcon } from "./DocTree";
import { HistoryDrawer } from "./HistoryDrawer";
import { copyText, sendJson, useRemote, type CommitInfo } from "./hooks";
import { basename, countWords, dirname, encodePathParam, extOf, fileKind, firstH1, formatBytes, friendlyName, isTextKind, printDocHref, rawHref } from "./lib";

interface DocData {
  content: string;
  sha?: string;
  size: number;
}

/** One opened file: viewer, editor, history, print/download/copy-link/delete. Keyed by path by its parent. */
export function DocPane({
  path,
  canWrite,
  canDelete,
  writeNote,
  startInEdit,
  size: nodeSize,
  onNavigate,
  onTreeChanged,
  onDirtyChange,
  onDeleted,
}: {
  path: string;
  canWrite: boolean;
  canDelete: boolean;
  writeNote?: string;
  startInEdit: boolean;
  size?: number;
  onNavigate: (path: string) => void;
  onTreeChanged: () => void;
  onDirtyChange: (dirty: boolean) => void;
  onDeleted: (parent: string) => void;
}) {
  const name = basename(path);
  const kind = fileKind(name);
  const isText = isTextKind(kind);

  const doc = useRemote<DocData>(isText ? `doc:${path}` : null, () => api(`/api/hq/docs?path=${encodeURIComponent(path)}`));
  const hist = useRemote<{ commits: CommitInfo[]; mode: string }>(isText ? `h1:${path}` : null, () => api(`/api/hq/history?path=${encodeURIComponent(path)}&limit=1`));

  const [override, setOverride] = useState<DocData | null>(null);
  const [editing, setEditing] = useState(startInEdit && canWrite);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyKey, setHistoryKey] = useState(0);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const current = override ?? doc.data;
  const heading = kind === "markdown" && current ? firstH1(current.content) : null;
  const title = heading ?? friendlyName(name, true);
  const words = current && kind === "markdown" ? countWords(current.content) : 0;
  const last = hist.data?.commits[0];

  const saved = (v: { content: string; sha?: string }) => {
    setOverride({ content: v.content, sha: v.sha, size: new Blob([v.content]).size });
    onTreeChanged();
    hist.reload();
  };

  const copyLink = async () => {
    const ok = await copyText(`${window.location.origin}/hq/docs?path=${encodePathParam(path)}`);
    setCopied(ok);
    setTimeout(() => setCopied(false), 2000);
  };

  const remove = async () => {
    setDeleting(true);
    setDeleteError(null);
    const res = await sendJson(`/api/hq/docs?path=${encodeURIComponent(path)}`, "DELETE");
    setDeleting(false);
    if (!res.ok) {
      setDeleteError(res.error ?? "Could not delete this document");
      return;
    }
    setConfirmDelete(false);
    onTreeChanged();
    onDeleted(dirname(path));
  };

  const loadingDoc = isText && doc.loading && !override;

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <span className="grid size-9 shrink-0 place-items-center rounded-[var(--radius-sm)] border border-graphite/15 bg-paper-50">
              <KindIcon kind={kind} className="size-4 text-charcoal" />
            </span>
            <h2 className="text-xl font-bold leading-tight tracking-tight sm:text-2xl">{title}</h2>
          </div>
          <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-blueprint">
            <span className="break-all font-mono">{name}</span>
            <span className="tabular">{formatBytes(current?.size ?? nodeSize)}</span>
            {words > 0 && (
              <span className="tabular">
                {words.toLocaleString("en-IN")} words · {Math.max(1, Math.round(words / 200))} min read
              </span>
            )}
            {isText && last && (
              <span>
                Last change by {last.author}, {formatDateTime(last.date)}
              </span>
            )}
            {isText && hist.data && hist.data.commits.length === 0 && hist.data.mode === "local" && <span>Local file (version history starts once HQ is connected to GitHub)</span>}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isText && !editing && (
            <Button size="sm" onClick={() => setEditing(true)} disabled={!canWrite || loadingDoc || !!doc.error}>
              <Pencil className="size-4" /> Edit
            </Button>
          )}
          {isText && (
            <Button
              size="sm"
              variant="secondary"
              disabled={editing}
              onClick={() => {
                setHistoryKey((k) => k + 1);
                setHistoryOpen(true);
              }}
            >
              <History className="size-4" /> History
            </Button>
          )}
          {kind === "markdown" && (
            <Button size="sm" variant="secondary" href={printDocHref(path)} external>
              <Printer className="size-4" /> Print / PDF
            </Button>
          )}
          <a href={rawHref(path, true)} download className={buttonClass("secondary", "sm")}>
            <Download className="size-4" aria-hidden /> {extOf(name) === "md" ? "Download .md" : "Download"}
          </a>
          <Button size="sm" variant="secondary" onClick={copyLink}>
            {copied ? <Check className="size-4" /> : <Link2 className="size-4" />} {copied ? "Link copied" : "Copy link"}
          </Button>
          {canDelete && (
            <Button
              size="sm"
              variant="ghost"
              className="text-bad hover:bg-bad/10"
              onClick={() => {
                setDeleteError(null);
                setConfirmDelete(true);
              }}
            >
              <Trash2 className="size-4" /> Delete
            </Button>
          )}
        </div>
      </header>

      {isText && !canWrite && writeNote && <p className="rounded-[var(--radius-sm)] border border-graphite/15 bg-paper-100/70 px-3 py-2 text-xs text-charcoal">{writeNote}</p>}

      {loadingDoc ? (
        <Loading label="Opening document…" />
      ) : isText && doc.error && !override ? (
        <EmptyState icon="FolderOpen" title="Couldn’t open this document" description={doc.error === "Not found" ? "It may have been moved, renamed or deleted." : doc.error} />
      ) : isText && current ? (
        editing ? (
          <DocEditor
            path={path}
            name={name}
            kind={kind}
            initial={{ content: current.content, sha: current.sha }}
            onSaved={saved}
            onClose={() => setEditing(false)}
            onDirtyChange={onDirtyChange}
            onReloadLatest={() => {
              setOverride(null);
              setEditing(false);
              doc.reload();
            }}
          />
        ) : (
          <div className="relative rounded-[var(--radius-md)] border border-graphite/12 bg-paper-50 p-5 sm:p-8">
            <CornerMarks />
            <DocContent kind={kind} content={current.content} path={path} onNavigate={onNavigate} />
          </div>
        )
      ) : !isText ? (
        <BinaryPreview path={path} name={name} kind={kind} size={nodeSize} />
      ) : null}

      {isText && (
        <HistoryDrawer
          key={historyKey}
          open={historyOpen}
          onClose={() => setHistoryOpen(false)}
          path={path}
          name={name}
          kind={kind}
          currentSha={current?.sha}
          canWrite={canWrite}
          onRestored={saved}
        />
      )}

      <ConfirmDialog open={confirmDelete} title="Delete this document?" confirmLabel="Delete document" danger busy={deleting} error={deleteError} onConfirm={remove} onClose={() => setConfirmDelete(false)}>
        <p>
          <span className="font-mono font-medium text-graphite">{name}</span> will be removed from the library.
        </p>
        <p>With GitHub storage the earlier versions remain in the repository history, so a founder can still recover it.</p>
      </ConfirmDialog>
    </div>
  );
}
