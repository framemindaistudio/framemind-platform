"use client";

import { useCallback, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ChevronRight, FolderTree, Plus } from "lucide-react";
import { useHq } from "@/components/hq/data";
import { PageHeader, Loading, EmptyState } from "@/components/hq/ui";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Overlay";
import { can, LEADERSHIP, OPS_MEDIA } from "@/lib/hq/roles";
import { DocPane } from "./DocPane";
import { DocTree } from "./DocTree";
import { FolderView } from "./FolderView";
import { NewDocModal } from "./NewDocModal";
import { useOpsTree } from "./hooks";
import { ancestorsOf, basename, cleanLibraryPath, dirname, docHref, OPS_ROOT, titleForPath } from "./lib";

const plainClick = (e: React.MouseEvent) => e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;

/** /hq/docs — the Operations Library. URL state: ?path=OPERATIONS/… */
export function DocsApp() {
  const { user, store } = useHq();
  const params = useSearchParams();
  const path = cleanLibraryPath(params.get("path"));
  const { root, index, loading, error, reload } = useOpsTree();

  const canWrite = store.writable && can(user, OPS_MEDIA);
  const canDelete = store.writable && can(user, LEADERSHIP);
  const writeNote = store.viewOnly ? "Your account can read and print the library, but not edit it." : !store.writable ? "HQ is in read-only mode, so editing is switched off." : !can(user, OPS_MEDIA) ? "Your role can read the library but not edit it." : undefined;

  const [query, setQuery] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [newOpen, setNewOpen] = useState(false);
  const [newKey, setNewKey] = useState(0);
  const [autoEditPath, setAutoEditPath] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set([OPS_ROOT, ...ancestorsOf(path)]));
  const [syncedPath, setSyncedPath] = useState(path);
  if (syncedPath !== path) {
    // keep the tree open down to whatever is selected (also after browser back/forward)
    setSyncedPath(path);
    setExpanded((prev) => new Set([...prev, ...ancestorsOf(path), path]));
  }

  const dirtyRef = useRef(false);
  const onDirtyChange = useCallback((d: boolean) => {
    dirtyRef.current = d;
  }, []);

  const go = useCallback(
    (target: string, opts?: { edit?: boolean }) => {
      if (target === path && !opts?.edit) return;
      if (dirtyRef.current && !window.confirm("You have unsaved changes in this document. Leave without saving?")) return;
      dirtyRef.current = false;
      setAutoEditPath(opts?.edit ? target : null);
      setMobileOpen(false);
      window.history.pushState(null, "", docHref(target));
      window.scrollTo({ top: 0 });
    },
    [path],
  );

  const toggle = useCallback((p: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(p)) next.delete(p);
      else next.add(p);
      return next;
    });
  }, []);

  const node = index?.get(path);
  const looksLikeFile = path !== OPS_ROOT && /\.[a-z0-9]+$/i.test(basename(path));
  const folderPath = node?.type === "dir" ? node.path : path === OPS_ROOT ? OPS_ROOT : looksLikeFile ? dirname(path) : OPS_ROOT;

  const openNew = () => {
    setNewKey((k) => k + 1);
    setNewOpen(true);
  };

  const crumbs = path.split("/").map((_, i, a) => a.slice(0, i + 1).join("/"));

  const tree = root && (
    <DocTree
      root={root}
      selectedPath={path}
      expanded={expanded}
      onToggle={toggle}
      onSelect={(p) => {
        if (index?.get(p)?.type === "dir") setExpanded((prev) => new Set(prev).add(p));
        go(p);
      }}
      query={query}
      onQuery={setQuery}
    />
  );

  return (
    <div>
      <PageHeader
        title="Operations Library"
        eyebrow="Company knowledge base"
        icon="FolderOpen"
        description="Every SOP, manual, curriculum and policy in one versioned place. Edit here instead of sharing PDFs on WhatsApp — each save keeps the previous version."
        actions={
          <>
            <Button variant="secondary" size="sm" className="lg:hidden" onClick={() => setMobileOpen(true)}>
              <FolderTree className="size-4" /> Browse folders
            </Button>
            {canWrite && root && (
              <Button size="sm" onClick={openNew}>
                <Plus className="size-4" /> New document
              </Button>
            )}
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[18rem_minmax(0,1fr)] xl:grid-cols-[19rem_minmax(0,1fr)]">
        <aside className="hidden lg:block" aria-label="Library navigation">
          <div className="sticky top-[76px] flex max-h-[calc(100dvh-100px)] flex-col rounded-[var(--radius-md)] border border-graphite/12 bg-paper-50 p-3">{loading ? <Loading label="Loading folders…" className="py-10" /> : tree}</div>
        </aside>

        <section className="min-w-0" aria-label="Document">
          <nav aria-label="Breadcrumb" className="mb-5">
            <ol className="flex flex-wrap items-center gap-1 text-[13px] text-charcoal">
              {crumbs.map((p, i) => {
                const last = i === crumbs.length - 1;
                const label = titleForPath(p);
                return (
                  <li key={p} className="flex items-center gap-1">
                    {i > 0 && <ChevronRight className="size-3.5 text-blueprint" aria-hidden />}
                    {last ? (
                      <span aria-current="page" className="font-semibold text-graphite">
                        {label}
                      </span>
                    ) : (
                      <a
                        href={docHref(p)}
                        onClick={(e) => {
                          if (!plainClick(e)) return;
                          e.preventDefault();
                          go(p);
                        }}
                        className="rounded px-1 py-0.5 hover:bg-graphite/[0.06] hover:text-graphite"
                      >
                        {label}
                      </a>
                    )}
                  </li>
                );
              })}
            </ol>
          </nav>

          {loading ? (
            <Loading label="Opening the library…" />
          ) : error ? (
            <EmptyState icon="FolderOpen" title="Couldn’t load the library" description={error} action={<Button size="sm" onClick={reload}>Try again</Button>} />
          ) : !root ? null : node?.type === "dir" || path === OPS_ROOT ? (
            <FolderView key={path} node={node ?? root} onOpen={go} canWrite={canWrite} onNew={openNew} />
          ) : looksLikeFile ? (
            <DocPane
              key={path}
              path={path}
              size={node?.size}
              canWrite={canWrite}
              canDelete={canDelete}
              writeNote={writeNote}
              startInEdit={autoEditPath === path}
              onNavigate={go}
              onTreeChanged={reload}
              onDirtyChange={onDirtyChange}
              onDeleted={(parent) => go(parent)}
            />
          ) : (
            <EmptyState
              icon="FolderOpen"
              title="That folder doesn’t exist"
              description="It may have been renamed or removed."
              action={
                <Button size="sm" onClick={() => go(OPS_ROOT)}>
                  Back to all of Operations
                </Button>
              }
            />
          )}
        </section>
      </div>

      <Drawer open={mobileOpen} onClose={() => setMobileOpen(false)} title="Browse folders" subtitle="Operations library" width="max-w-sm">
        {loading ? <Loading label="Loading folders…" className="py-10" /> : tree}
      </Drawer>

      {root && index && (
        <NewDocModal
          key={newKey}
          open={newOpen}
          onClose={() => setNewOpen(false)}
          root={root}
          index={index}
          defaultFolder={folderPath}
          ownerDefault={user.name}
          onCreated={(p) => {
            setNewOpen(false);
            reload();
            go(p, { edit: true });
          }}
        />
      )}
    </div>
  );
}
