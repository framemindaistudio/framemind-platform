"use client";

import { useState } from "react";
import { ExternalLink, GitCommitHorizontal, History, RotateCcw } from "lucide-react";
import { api } from "@/components/hq/data";
import { Markdown } from "@/components/hq/Markdown";
import { Drawer } from "@/components/ui/Overlay";
import { Button } from "@/components/ui/Button";
import { Loading, EmptyState } from "@/components/hq/ui";
import { cn, formatDateTime } from "@/lib/utils";
import { CsvTable } from "./CsvTable";
import { sendJson, useRemote, type CommitInfo } from "./hooks";
import type { FileKind } from "./lib";

/**
 * Version history for one document: list of commits, preview of an older version,
 * and "Restore this version" (saved as a new commit — nothing is ever rewritten).
 * Mount with a fresh `key` each time it opens so its state resets.
 */
export function HistoryDrawer({
  open,
  onClose,
  path,
  name,
  kind,
  currentSha,
  canWrite,
  onRestored,
}: {
  open: boolean;
  onClose: () => void;
  path: string;
  name: string;
  kind: FileKind;
  currentSha?: string;
  canWrite: boolean;
  onRestored: (v: { content: string; sha?: string }) => void;
}) {
  const [selected, setSelected] = useState<CommitInfo | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const list = useRemote<{ commits: CommitInfo[]; mode: string }>(open ? `history:${path}` : null, () => api(`/api/hq/history?path=${encodeURIComponent(path)}&limit=50`));
  const version = useRemote<{ content: string | null }>(open && selected ? `version:${path}@${selected.sha}` : null, () => api(`/api/hq/history?path=${encodeURIComponent(path)}&ref=${encodeURIComponent(selected?.sha ?? "")}`));

  const commits = list.data?.commits ?? [];
  const content = version.data?.content ?? null;

  const restore = async () => {
    if (!selected || content === null) return;
    setRestoring(true);
    setError(null);
    const res = await sendJson("/api/hq/docs", "PUT", {
      path,
      content,
      sha: currentSha,
      message: `Restore ${name} to version ${selected.sha.slice(0, 7)} (${new Date(selected.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })})`,
    });
    setRestoring(false);
    if (res.ok) {
      onRestored({ content, sha: typeof res.data.sha === "string" ? res.data.sha : undefined });
      onClose();
    } else if (res.status === 409) {
      setError("This document was changed by someone else after you opened it. Close this panel, reload the document, then restore again.");
    } else setError(res.error ?? "Could not restore this version");
  };

  const mode = list.data?.mode;
  return (
    <Drawer
      open={open}
      onClose={onClose}
      width="max-w-4xl"
      title={
        <span className="flex items-center gap-2">
          <History className="size-5" aria-hidden /> Version history
        </span>
      }
      subtitle={name}
      footer={
        selected ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-charcoal">
              Viewing version <span className="font-mono">{selected.sha.slice(0, 7)}</span> from {formatDateTime(selected.date)}. Restoring adds a new version — the current text stays in the history.
            </p>
            <Button size="sm" onClick={restore} disabled={!canWrite || restoring || content === null}>
              <RotateCcw className="size-4" /> {restoring ? "Restoring…" : "Restore this version"}
            </Button>
          </div>
        ) : undefined
      }
    >
      {list.loading && !list.data ? (
        <Loading label="Loading history…" />
      ) : list.error ? (
        <p role="alert" className="rounded-[var(--radius-sm)] border border-bad/30 bg-bad/10 px-3 py-2 text-sm text-bad">
          {list.error}
        </p>
      ) : commits.length === 0 ? (
        <EmptyState
          icon="History"
          title="No version history yet"
          description={
            mode === "github"
              ? "This document has no commits yet."
              : mode === "local"
                ? "HQ is running on local files, so edits are saved to disk without a history. In production every save becomes a commit in the private GitHub repository."
                : "HQ is in read-only mode. Once GITHUB_TOKEN and GITHUB_REPO are configured, every save is recorded here."
          }
        />
      ) : (
        <div className="grid gap-6 md:grid-cols-[17rem_minmax(0,1fr)]">
          <ol className="space-y-2" aria-label="Versions">
            {commits.map((c, i) => {
              const active = selected?.sha === c.sha;
              return (
                <li key={c.sha}>
                  <button
                    type="button"
                    onClick={() => setSelected(c)}
                    aria-pressed={active}
                    className={cn("w-full rounded-[var(--radius-md)] border p-3 text-left transition-colors", active ? "border-graphite bg-graphite text-paper" : "border-graphite/15 bg-paper-50 hover:border-graphite/40")}
                  >
                    <span className="flex items-center gap-2 text-[11px]">
                      <GitCommitHorizontal className="size-3.5" aria-hidden />
                      <span className="font-mono">{c.sha.slice(0, 7)}</span>
                      {i === 0 && <span className={cn("rounded-full px-1.5 py-px text-[10px] font-semibold uppercase tracking-wider", active ? "bg-paper/20" : "bg-graphite/10")}>Latest</span>}
                    </span>
                    <span className="mt-1.5 line-clamp-2 block text-[13px] font-medium leading-snug">{c.message.split("\n")[0]}</span>
                    <span className={cn("mt-1 block text-[11px]", active ? "text-paper/70" : "text-blueprint")}>
                      {c.author} · {formatDateTime(c.date)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
          <div className="min-w-0">
            {!selected ? (
              <div className="grid h-full min-h-48 place-items-center rounded-[var(--radius-md)] border border-dashed border-graphite/25 p-6 text-center text-sm text-blueprint">Select a version to preview how the document looked then.</div>
            ) : version.loading && !version.data ? (
              <Loading label="Loading version…" />
            ) : version.error ? (
              <p role="alert" className="text-sm text-bad">
                {version.error}
              </p>
            ) : content === null ? (
              <p className="text-sm text-blueprint">This version could not be found.</p>
            ) : (
              <div>
                {selected.url && (
                  <a href={selected.url} target="_blank" rel="noopener noreferrer" className="mb-3 inline-flex items-center gap-1.5 text-xs font-medium text-charcoal underline underline-offset-4 hover:text-graphite">
                    Open commit on GitHub <ExternalLink className="size-3" aria-hidden />
                  </a>
                )}
                <div className="rounded-[var(--radius-md)] border border-graphite/15 bg-white p-5">{kind === "markdown" ? <Markdown content={content} /> : kind === "csv" ? <CsvTable text={content} /> : <pre className="whitespace-pre-wrap break-words font-mono text-[13px]">{content}</pre>}</div>
              </div>
            )}
            {error && (
              <p role="alert" className="mt-3 rounded-[var(--radius-sm)] border border-bad/30 bg-bad/10 px-3 py-2 text-sm text-bad">
                {error}
              </p>
            )}
          </div>
        </div>
      )}
    </Drawer>
  );
}
