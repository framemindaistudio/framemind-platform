"use client";

import { useEffect, useState } from "react";
import { Wordmark } from "@/components/hq/printables/PrintBits";
import { api } from "@/components/hq/data";
import { Markdown } from "@/components/hq/Markdown";
import { EmptyState, Loading } from "@/components/hq/ui";
import { A4Page, PrintShell } from "@/components/print/PrintShell";
import { useRemote } from "./hooks";
import {
  basename,
  buildTree,
  docDate,
  docHref,
  firstH1,
  fileKind,
  friendlyName,
  indexTree,
  parseDocHeader,
  stripFirstH1,
  titleForPath,
  OPS_ROOT,
  type TreeEntry,
  type TreeNode,
} from "./lib";

interface PrintDoc {
  path: string;
  title: string;
  body: string;
  version?: string;
  updated?: string;
  error?: string;
}

interface Loaded {
  docs: PrintDoc[];
  printedOn: string;
}

/** README first, then the folder's own files, then each sub-folder in order. */
function packOrder(node: TreeNode): TreeNode[] {
  const files = node.children.filter((c) => c.type === "file");
  const dirs = node.children.filter((c) => c.type === "dir");
  return [...files, ...dirs.flatMap(packOrder)];
}

async function pool<T, R>(items: T[], size: number, fn: (item: T, i: number) => Promise<R>): Promise<R[]> {
  const out = new Array<R>(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(size, items.length) }, async () => {
      while (next < items.length) {
        const i = next++;
        out[i] = await fn(items[i], i);
      }
    }),
  );
  return out;
}

async function loadAll(paths: string[], folders: string[], onProgress: (done: number, total: number) => void): Promise<Loaded> {
  const list: string[] = [...paths];
  if (folders.length) {
    const j = await api<{ entries: TreeEntry[] }>(`/api/hq/docs?tree=${OPS_ROOT}`);
    const index = indexTree(buildTree(j.entries));
    for (const f of folders) {
      const node = index.get(f);
      if (node?.type === "dir") list.push(...packOrder(node).filter((n) => fileKind(n.name) === "markdown").map((n) => n.path));
    }
  }
  const unique = [...new Set(list)];
  onProgress(0, unique.length);
  let done = 0;
  const docs = await pool(unique, 4, async (path): Promise<PrintDoc> => {
    try {
      const f = await api<{ content: string }>(`/api/hq/docs?path=${encodeURIComponent(path)}`);
      const head = parseDocHeader(f.content);
      let updated = head.updated;
      if (!updated && unique.length === 1) {
        try {
          const h = await api<{ commits: { date: string }[] }>(`/api/hq/history?path=${encodeURIComponent(path)}&limit=1`);
          if (h.commits[0]) updated = docDate(new Date(h.commits[0].date));
        } catch {
          /* history is optional */
        }
      }
      return { path, title: firstH1(f.content) ?? friendlyName(basename(path), true), body: stripFirstH1(f.content), version: head.version, updated };
    } catch (e) {
      return { path, title: friendlyName(basename(path), true), body: "", error: e instanceof Error ? e.message : "Could not load this document" };
    } finally {
      onProgress(++done, unique.length);
    }
  });
  return { docs, printedOn: docDate() };
}

const PAGE_CSS = `
@page {
  size: A4;
  margin: 16mm 15mm 18mm;
  @bottom-left { content: "FrameMind · Confidential"; font-family: 'DM Sans', sans-serif; font-size: 7pt; letter-spacing: 0.18em; text-transform: uppercase; color: #7a7a7a; }
  @bottom-right { content: "Page " counter(page); font-family: "JetBrains Mono", monospace; font-size: 7pt; color: #7a7a7a; }
}`;

export function PrintDocs({ paths, folders, title, back }: { paths: string[]; folders: string[]; title?: string; back?: string }) {
  const key = JSON.stringify([paths, folders]);
  const idle = paths.length === 0 && folders.length === 0;
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const result = useRemote<Loaded>(idle ? null : key, () => loadAll(paths, folders, (done, total) => setProgress({ done, total })));

  const docs = result.data?.docs ?? [];
  const isPack = folders.length > 0 || docs.length > 1;
  const packTitle = title ?? (folders.length === 1 && paths.length === 0 ? `${titleForPath(folders[0])} — document pack` : "FrameMind document pack");
  const heading = isPack ? packTitle : docs[0]?.title ?? "Document";

  const backHref = back ?? (paths.length === 1 && folders.length === 0 ? docHref(paths[0]) : folders[0]?.startsWith(`${OPS_ROOT}/02_CURRICULUM`) || folders[0]?.startsWith(`${OPS_ROOT}/05_STUDENT_MATERIAL`) || folders[0]?.startsWith(`${OPS_ROOT}/04_TRAINER_MANUAL`) ? "/hq/curriculum" : folders[0] ? docHref(folders[0]) : "/hq/docs");

  useEffect(() => {
    if (result.data) document.title = `${heading} — FrameMind`;
  }, [result.data, heading]);

  return (
    <PrintShell
      title={result.data ? `${heading} · ${docs.length} ${docs.length === 1 ? "document" : "documents"}` : "Preparing print view…"}
      back={backHref}
      toolbar={result.loading && progress.total > 0 ? <span className="tabular text-xs text-blueprint">Preparing {progress.done} of {progress.total}…</span> : undefined}
    >
      <style>{PAGE_CSS}</style>

      {idle ? (
        <div className="w-full max-w-lg">
          <EmptyState icon="FolderOpen" title="Nothing to print yet" description="Open a document in the Operations Library and choose Print / PDF, or pick a curriculum pack." />
        </div>
      ) : result.error ? (
        <div className="w-full max-w-lg">
          <EmptyState icon="FolderOpen" title="Couldn’t prepare the print view" description={result.error} />
        </div>
      ) : result.loading && !result.data ? (
        <Loading label={progress.total ? `Loading ${progress.done} of ${progress.total} documents…` : "Loading documents…"} />
      ) : docs.length === 0 ? (
        <div className="w-full max-w-lg">
          <EmptyState icon="FolderOpen" title="No documents found" description="There are no Markdown documents in that folder yet. Add some in the Operations Library and try again." />
        </div>
      ) : (
        <>
          {isPack && (
            <A4Page flow padded={false} className="print:min-h-0 print:w-full print:overflow-visible">
              <div className="px-[16mm] py-[20mm] print:p-0 print:pt-[20mm]">
                <Wordmark mm={46} />
                <div className="mt-14 border-l-4 border-graphite pl-5">
                  <p className="annot text-blueprint">Document pack · FrameMind Confidential</p>
                  <h1 className="mt-2 text-[34px] font-bold leading-[1.1] tracking-[-0.03em]">{packTitle}</h1>
                  <p className="tabular mt-3 text-sm text-charcoal">
                    {docs.length} {docs.length === 1 ? "document" : "documents"} · generated {result.data?.printedOn}
                  </p>
                </div>
                <h2 className="annot mt-12 border-b border-graphite/30 pb-2 text-charcoal">Contents</h2>
                <ol className="mt-3 space-y-1.5 text-[13px]">
                  {docs.map((d, i) => (
                    <li key={d.path} className="flex gap-3">
                      <span className="tabular w-6 shrink-0 font-mono text-blueprint">{String(i + 1).padStart(2, "0")}</span>
                      <span>{d.title}</span>
                    </li>
                  ))}
                </ol>
                <p className="mt-14 max-w-md text-[11px] leading-relaxed text-blueprint">Internal FrameMind material for the team. Do not share outside the company without approval. Always use the latest version from HQ — printed copies may be out of date.</p>
              </div>
            </A4Page>
          )}
          {docs.map((d) => (
            <A4Page flow key={d.path} padded={false} className="print:min-h-0 print:w-full print:overflow-visible">
              <div className="px-[16mm] py-[14mm] print:p-0">
                <header className="mb-6 border-b-2 border-graphite pb-3">
                  <div className="flex items-center justify-between gap-4">
                    <Wordmark mm={22} />
                    <div className="text-right text-[9px] font-semibold uppercase leading-relaxed tracking-[0.18em] text-blueprint">
                      <p>FrameMind Confidential</p>
                      <p>
                        {d.updated ? `Version from ${d.updated}` : `Printed ${result.data?.printedOn}`}
                        {d.version ? ` · v${d.version.replace(/^v/i, "")}` : ""}
                      </p>
                    </div>
                  </div>
                  <h1 className="mt-3 text-[22px] font-bold leading-tight tracking-[-0.02em]">{d.title}</h1>
                </header>
                {d.error ? <p className="text-sm text-bad">Could not load {d.path}: {d.error}</p> : <Markdown content={d.body} />}
              </div>
            </A4Page>
          ))}
        </>
      )}
    </PrintShell>
  );
}
