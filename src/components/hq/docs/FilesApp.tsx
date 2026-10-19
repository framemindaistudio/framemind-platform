"use client";

import { useMemo, useRef, useState } from "react";
import { Check, CloudUpload, Copy, Download, Eye, Loader2, Search, Trash2, TriangleAlert, X } from "lucide-react";
import { api, useHq } from "@/components/hq/data";
import { PageHeader, Loading, EmptyState, Panel, StatCard } from "@/components/hq/ui";
import { Button, buttonClass } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/form";
import { Modal } from "@/components/ui/Overlay";
import { can, OPS, OPS_MEDIA } from "@/lib/hq/roles";
import { cn, formatDate, uid } from "@/lib/utils";
import { ConfirmDialog } from "./ConfirmDialog";
import { KindIcon } from "./DocTree";
import { copyText, useRemote } from "./hooks";
import { encodePathParam, formatBytes, rawHref, sanitiseVaultFolder, toVaultItem, VAULT_FOLDERS, VAULT_MAX_BYTES, type VaultItem } from "./lib";

interface Upload {
  id: string;
  name: string;
  size: number;
  folder: string;
  status: "queued" | "uploading" | "saving" | "done" | "error";
  progress: number;
  error?: string;
}

const CUSTOM = "__custom";
const prettyFolder = (f: string) => f.split("/").map((s) => s.replace(/[-_]+/g, " ").replace(/^./, (c) => c.toUpperCase())).join(" / ");

function postFile(file: File, folder: string, onProgress: (p: number) => void): Promise<{ ok: boolean; error?: string }> {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/hq/files");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(e.loaded / e.total);
    };
    xhr.onload = () => {
      let data: Record<string, unknown> = {};
      try {
        data = JSON.parse(xhr.responseText) as Record<string, unknown>;
      } catch {
        /* non-JSON error page */
      }
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- full navigation on purpose: a signed-out session reloads through the server login redirect
      if (xhr.status === 401) window.location.href = `/hq/login?next=${encodeURIComponent(window.location.pathname)}`;
      const ok = xhr.status >= 200 && xhr.status < 300;
      resolve({ ok, error: ok ? undefined : String(data.error || (xhr.status === 413 ? "File is too large for the server (4 MB limit)." : `Upload failed (${xhr.status})`)) });
    };
    xhr.onerror = () => resolve({ ok: false, error: "Network error — check your connection and try again." });
    const fd = new FormData();
    fd.append("file", file);
    fd.append("folder", folder);
    xhr.send(fd);
  });
}

/** /hq/files — File Vault: small receipts, signed forms, photos and PDFs committed to the repo. */
export function FilesApp() {
  const { user, store } = useHq();
  const canUpload = store.writable && can(user, OPS_MEDIA);
  const canDelete = store.writable && can(user, OPS);

  const list = useRemote<VaultItem[]>("vault", async () => {
    const j = await api<{ entries: { path: string; name: string; size?: number }[] }>(`/api/hq/files?dir=vault`);
    return j.entries.filter((e) => !e.name.startsWith(".") && e.path !== "vault/README.md").map(toVaultItem);
  });
  const items = useMemo(() => list.data ?? [], [list.data]);

  const [folderSel, setFolderSel] = useState<string>("receipts");
  const [custom, setCustom] = useState("");
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [dragging, setDragging] = useState(false);
  const [query, setQuery] = useState("");
  const [folderFilter, setFolderFilter] = useState("all");
  const [preview, setPreview] = useState<VaultItem | null>(null);
  const [toDelete, setToDelete] = useState<VaultItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const chain = useRef<Promise<void>>(Promise.resolve());

  const targetFolder = folderSel === CUSTOM ? sanitiseVaultFolder(custom || "general") : folderSel;
  const knownFolders = useMemo(() => {
    const set = new Set<string>(items.map((i) => i.folder));
    return [...set].filter((f) => !(VAULT_FOLDERS as readonly string[]).includes(f)).sort();
  }, [items]);

  const patch = (id: string, p: Partial<Upload>) => setUploads((prev) => prev.map((u) => (u.id === id ? { ...u, ...p } : u)));

  const addFiles = (files: File[]) => {
    if (!files.length || !canUpload) return;
    const folder = targetFolder;
    const entries = files.map((f) => {
      const tooBig = f.size > VAULT_MAX_BYTES;
      const up: Upload = {
        id: uid("up"),
        name: f.name,
        size: f.size,
        folder,
        status: tooBig ? "error" : "queued",
        progress: 0,
        error: tooBig ? `${formatBytes(f.size)} is over the 4 MB limit. Upload it to Google Drive and save the link instead.` : undefined,
      };
      return { file: f, up };
    });
    setUploads((prev) => [...entries.map((e) => e.up), ...prev]);
    const ok = entries.filter((e) => e.up.status === "queued");
    chain.current = chain.current.then(async () => {
      for (const { file, up } of ok) {
        patch(up.id, { status: "uploading" });
        const res = await postFile(file, up.folder, (p) => patch(up.id, { progress: p, status: p >= 1 ? "saving" : "uploading" }));
        patch(up.id, res.ok ? { status: "done", progress: 1 } : { status: "error", error: res.error });
        if (res.ok) list.reload();
      }
    });
  };

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    addFiles(Array.from(e.target.files ?? []));
    e.target.value = "";
  };

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = items.filter((i) => (folderFilter === "all" || i.folder === folderFilter) && (!q || `${i.name} ${i.folder}`.toLowerCase().includes(q)));
    const map = new Map<string, VaultItem[]>();
    for (const i of filtered) map.set(i.folder, [...(map.get(i.folder) ?? []), i]);
    const order = (f: string) => {
      const i = (VAULT_FOLDERS as readonly string[]).indexOf(f);
      return i < 0 ? 100 : i;
    };
    return [...map.entries()]
      .sort(([a], [b]) => order(a) - order(b) || a.localeCompare(b))
      .map(([folder, files]) => ({ folder, files: files.sort((a, b) => (b.date ?? "").localeCompare(a.date ?? "") || a.name.localeCompare(b.name)) }));
  }, [items, query, folderFilter]);

  const totalSize = items.reduce((s, i) => s + (i.size ?? 0), 0);
  const folderCount = new Set(items.map((i) => i.folder)).size;

  const copyPath = async (path: string) => {
    if (await copyText(path)) {
      setCopied(path);
      setTimeout(() => setCopied((c) => (c === path ? null : c)), 1800);
    }
  };

  const doDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/hq/files?path=${encodeURIComponent(toDelete.path)}`, { method: "DELETE" });
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- full navigation on purpose: a signed-out session reloads through the server login redirect
      if (res.status === 401) window.location.href = `/hq/login?next=${encodeURIComponent(window.location.pathname)}`;
      if (!res.ok) throw new Error(j.error || `Delete failed (${res.status})`);
      setToDelete(null);
      list.reload();
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : "Could not delete this file");
    } finally {
      setDeleting(false);
    }
  };

  const active = uploads.some((u) => u.status === "uploading" || u.status === "saving" || u.status === "queued");

  return (
    <div>
      <PageHeader
        title="File Vault"
        eyebrow="Documents & scans"
        icon="Archive"
        description="Receipts, signed agreements, releases, client letters and photos — stored safely with the rest of HQ instead of living in WhatsApp chats."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Files" value={list.loading && !list.data ? "…" : items.length} sub="in the vault" />
        <StatCard label="Folders" value={list.loading && !list.data ? "…" : folderCount} sub="receipts, forms, photos…" />
        <StatCard label="Space used" value={list.loading && !list.data ? "…" : formatBytes(totalSize)} sub="4 MB max per file" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
        <div className="space-y-6">
          <Panel title="Upload files" subtitle="Up to 4 MB each · any file type">
            <div className="space-y-4">
              <Field label="Save into folder" htmlFor="vault-folder">
                <Select id="vault-folder" value={folderSel} onChange={(e) => setFolderSel(e.target.value)} disabled={!canUpload}>
                  {VAULT_FOLDERS.map((f) => (
                    <option key={f} value={f}>
                      {prettyFolder(f)}
                    </option>
                  ))}
                  {knownFolders.map((f) => (
                    <option key={f} value={f}>
                      {prettyFolder(f)}
                    </option>
                  ))}
                  <option value={CUSTOM}>Custom folder…</option>
                </Select>
              </Field>
              {folderSel === CUSTOM && (
                <Field label="Custom folder name" htmlFor="vault-custom" help={`Saved as vault/${targetFolder}/ — letters, numbers, dashes and “/” for sub-folders.`}>
                  <Input id="vault-custom" value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="e.g. client-letters/2026" maxLength={60} />
                </Field>
              )}

              <div
                onDragOver={(e) => {
                  if (!canUpload) return;
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragging(false);
                  addFiles(Array.from(e.dataTransfer.files));
                }}
                onClick={() => canUpload && inputRef.current?.click()}
                onKeyDown={(e) => {
                  if (canUpload && (e.key === "Enter" || e.key === " ")) {
                    e.preventDefault();
                    inputRef.current?.click();
                  }
                }}
                role="button"
                tabIndex={canUpload ? 0 : -1}
                aria-disabled={!canUpload}
                aria-label="Drop files here or press Enter to choose files"
                className={cn(
                  "relative flex cursor-pointer flex-col items-center rounded-[var(--radius-md)] border-2 border-dashed px-4 py-9 text-center transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-graphite",
                  dragging ? "border-graphite bg-graphite/[0.06]" : "border-graphite/30 bg-paper-100/50 hover:border-graphite/60",
                  !canUpload && "cursor-not-allowed opacity-60",
                )}
              >
                <div className="bp-grid-fine pointer-events-none absolute inset-0 opacity-50" />
                <CloudUpload className="relative size-8 text-charcoal" aria-hidden />
                <p className="relative mt-3 text-sm font-semibold">{dragging ? "Release to upload" : "Drag & drop files here"}</p>
                <p className="relative mt-1 text-xs text-blueprint">or</p>
                <span className={cn("relative mt-2", buttonClass("secondary", "sm"))}>Choose files</span>
                <p className="relative mt-3 text-[11px] text-blueprint">
                  Maximum <strong className="font-semibold text-charcoal">4 MB</strong> per file
                </p>
                <input ref={inputRef} type="file" multiple className="sr-only" tabIndex={-1} onChange={onPick} disabled={!canUpload} aria-label="Choose files to upload" onClick={(e) => e.stopPropagation()} />
              </div>
              {!canUpload && <p className="text-xs text-charcoal">{!store.writable && !store.viewOnly ? "HQ is in read-only mode, so uploads are switched off." : "Your account can browse the vault but not upload."}</p>}

              {uploads.length > 0 && (
                <ul className="space-y-2" aria-live="polite" aria-label="Uploads">
                  {uploads.slice(0, 8).map((u) => (
                    <li key={u.id} className="rounded-[var(--radius-sm)] border border-graphite/15 bg-paper-50 p-2.5 text-xs">
                      <div className="flex items-center gap-2">
                        {u.status === "done" ? <Check className="size-4 shrink-0 text-ok" aria-hidden /> : u.status === "error" ? <TriangleAlert className="size-4 shrink-0 text-bad" aria-hidden /> : <Loader2 className={cn("size-4 shrink-0 text-charcoal", u.status !== "queued" && "animate-spin")} aria-hidden />}
                        <span className="min-w-0 flex-1 truncate font-medium">{u.name}</span>
                        <span className="tabular shrink-0 font-mono text-blueprint">{formatBytes(u.size)}</span>
                        {(u.status === "done" || u.status === "error") && (
                          <button type="button" onClick={() => setUploads((p) => p.filter((x) => x.id !== u.id))} aria-label={`Dismiss ${u.name}`} className="grid size-5 place-items-center rounded-full hover:bg-graphite/10">
                            <X className="size-3" aria-hidden />
                          </button>
                        )}
                      </div>
                      {(u.status === "uploading" || u.status === "saving") && (
                        <div className="mt-2">
                          <div className="h-1.5 overflow-hidden rounded-full bg-graphite/10" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(u.progress * 100)} aria-label={`Uploading ${u.name}`}>
                            <div className="h-full rounded-full bg-graphite transition-[width] duration-200" style={{ width: `${Math.round(u.progress * 100)}%` }} />
                          </div>
                          <p className="mt-1 text-[11px] text-blueprint">{u.status === "saving" ? "Saving to the repository…" : `Uploading to ${u.folder}… ${Math.round(u.progress * 100)}%`}</p>
                        </div>
                      )}
                      {u.status === "queued" && <p className="mt-1 text-[11px] text-blueprint">Waiting…</p>}
                      {u.status === "done" && <p className="mt-1 text-[11px] text-ok">Saved to vault/{u.folder}</p>}
                      {u.status === "error" && <p className="mt-1 text-[11px] text-bad">{u.error}</p>}
                    </li>
                  ))}
                </ul>
              )}
              {active && <p className="text-[11px] text-blueprint">Keep this tab open until uploads finish.</p>}
            </div>
          </Panel>

          <Panel title="What goes where" bodyClassName="space-y-4 text-sm">
            <div>
              <p className="annot mb-1.5 text-blueprint">Keep in the vault</p>
              <ul className="space-y-1 text-charcoal">
                {["Receipts & bills (scanned or photographed)", "Signed agreements & releases", "Letters from and to clients", "Small photos & certificate scans", "Anything under 4 MB that the team may need later"].map((t) => (
                  <li key={t} className="flex gap-2">
                    <span className="mt-2 size-1.5 shrink-0 bg-graphite" aria-hidden />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
            <div className="border-t border-dashed border-graphite/20 pt-4">
              <p className="annot mb-1.5 text-blueprint">Use Google Drive / YouTube instead</p>
              <p className="text-charcoal">Raw footage, drone clips, finished reels and any file over 4 MB. Upload there, then paste the share link into the project, shoot or deliverable record so nothing gets lost.</p>
            </div>
          </Panel>
        </div>

        <div className="min-w-0">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <label className="relative block min-w-0 flex-1 basis-56">
              <span className="sr-only">Search files</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-blueprint" aria-hidden />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by file name…"
                className="h-10 w-full rounded-[var(--radius-sm)] border border-graphite/20 bg-paper-50 pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-blueprint/70 focus:border-graphite focus:bg-white focus:ring-2 focus:ring-graphite/10"
              />
            </label>
            <div className="w-full sm:w-56">
              <label htmlFor="vault-filter" className="sr-only">
                Filter by folder
              </label>
              <Select id="vault-filter" value={folderFilter} onChange={(e) => setFolderFilter(e.target.value)}>
                <option value="all">All folders</option>
                {[...new Set([...(VAULT_FOLDERS as readonly string[]), ...items.map((i) => i.folder)])].map((f) => (
                  <option key={f} value={f}>
                    {prettyFolder(f)}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          {list.loading && !list.data ? (
            <Loading label="Opening the vault…" />
          ) : list.error ? (
            <EmptyState icon="Archive" title="Couldn’t load the vault" description={list.error} action={<Button size="sm" onClick={list.reload}>Try again</Button>} />
          ) : items.length === 0 ? (
            <EmptyState icon="Archive" title="The vault is empty" description="Upload your first receipt, signed form or photo on the left. Everything is saved with the rest of the company data and can be downloaded any time." />
          ) : groups.length === 0 ? (
            <EmptyState icon="Archive" title="No files match" description="Try another search or choose “All folders”." />
          ) : (
            <div className="space-y-5">
              {groups.map(({ folder, files }) => (
                <Panel key={folder} title={prettyFolder(folder)} subtitle={`vault/${folder} · ${files.length} ${files.length === 1 ? "file" : "files"}`} bodyClassName="p-0">
                  <ul className="divide-y divide-graphite/10">
                    {files.map((f) => {
                      const previewable = f.kind === "image" || f.kind === "pdf";
                      return (
                        <li key={f.path} className="flex flex-wrap items-center gap-x-3 gap-y-2 px-5 py-3">
                          <span className="grid size-8 shrink-0 place-items-center rounded-[var(--radius-sm)] border border-graphite/15 bg-paper">
                            <KindIcon kind={f.kind} className="size-4 text-charcoal" />
                          </span>
                          <div className="min-w-0 flex-1 basis-44">
                            <p className="truncate text-sm font-semibold" title={f.name}>
                              {f.name}
                            </p>
                            <p className="tabular text-[11px] text-blueprint">
                              {f.date ? formatDate(f.date) : "—"} · {formatBytes(f.size)}
                            </p>
                          </div>
                          <div className="flex items-center gap-0.5">
                            {previewable && (
                              <button type="button" onClick={() => setPreview(f)} className="grid size-8 place-items-center rounded text-charcoal hover:bg-graphite/10" aria-label={`Preview ${f.name}`} title="Preview">
                                <Eye className="size-4" aria-hidden />
                              </button>
                            )}
                            <a href={rawHref(f.path, true)} download className="grid size-8 place-items-center rounded text-charcoal hover:bg-graphite/10" aria-label={`Download ${f.name}`} title="Download">
                              <Download className="size-4" aria-hidden />
                            </a>
                            <button type="button" onClick={() => copyPath(f.path)} className="grid size-8 place-items-center rounded text-charcoal hover:bg-graphite/10" aria-label={`Copy path of ${f.name}`} title={copied === f.path ? "Copied" : "Copy path"}>
                              {copied === f.path ? <Check className="size-4 text-ok" aria-hidden /> : <Copy className="size-4" aria-hidden />}
                            </button>
                            {canDelete && (
                              <button
                                type="button"
                                onClick={() => {
                                  setDeleteError(null);
                                  setToDelete(f);
                                }}
                                className="grid size-8 place-items-center rounded text-bad hover:bg-bad/10"
                                aria-label={`Delete ${f.name}`}
                                title="Delete"
                              >
                                <Trash2 className="size-4" aria-hidden />
                              </button>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </Panel>
              ))}
            </div>
          )}
        </div>
      </div>

      <Modal
        open={!!preview}
        onClose={() => setPreview(null)}
        title={preview?.name ?? "Preview"}
        size="max-w-4xl"
        footer={
          preview && (
            <a href={rawHref(preview.path, true)} download className={buttonClass("secondary", "sm")}>
              <Download className="size-4" aria-hidden /> Download
            </a>
          )
        }
      >
        {preview &&
          (preview.kind === "image" ? (
            <div className="grid place-items-center">
              {/* Authenticated API route — next/image optimisation does not apply. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/api/hq/docs/raw?path=${encodePathParam(preview.path)}`} alt={preview.name} className="max-h-[70vh] w-auto max-w-full object-contain" />
            </div>
          ) : (
            <iframe title={preview.name} src={`/api/hq/docs/raw?path=${encodePathParam(preview.path)}`} className="h-[70vh] w-full rounded-[var(--radius-sm)] border border-graphite/15 bg-white" />
          ))}
      </Modal>

      <ConfirmDialog open={!!toDelete} title="Delete this file?" confirmLabel="Delete file" danger busy={deleting} error={deleteError} onConfirm={doDelete} onClose={() => setToDelete(null)}>
        <p>
          <span className="break-all font-medium text-graphite">{toDelete?.name}</span> will be removed from <span className="font-mono">vault/{toDelete?.folder}</span>.
        </p>
        <p>With GitHub storage the file stays in the repository history, so a founder can still recover it.</p>
      </ConfirmDialog>
    </div>
  );
}
