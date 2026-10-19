"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Download, Loader2, Plus, Search, Trash2 } from "lucide-react";
import { getCollection, type BaseRecord, type CollectionDef, type FieldDef } from "@/lib/hq/collections";
import { can } from "@/lib/hq/roles";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Overlay";
import { Select } from "@/components/ui/form";
import { cn, formatDateTime } from "@/lib/utils";
import { useCollection, useHq, useLookup } from "./data";
import { FieldValue, RecordForm, refLabel } from "./fields";
import { EmptyState, Loading } from "./ui";

export interface ExtraColumn<T> {
  key: string;
  label: string;
  render: (r: T) => React.ReactNode;
  sortValue?: (r: T) => string | number;
  className?: string;
}

export interface CollectionManagerProps<T extends BaseRecord> {
  name: string;
  /** keys to show as columns (defaults to fields with table: true) */
  columns?: string[];
  extraColumns?: ExtraColumn<T>[];
  /** pre-filter records (e.g. only this project's deliverables) */
  filter?: (r: T) => boolean;
  /** defaults for "New" */
  defaults?: Record<string, unknown>;
  /** override row click (e.g. navigate to a detail page) */
  onOpen?: (r: T) => void;
  /** transform before saving (compute totals, assign numbers…) */
  beforeSave?: (r: Record<string, unknown>) => Record<string, unknown> | Promise<Record<string, unknown>>;
  /** extra content inside the edit drawer, below the form */
  drawerExtra?: (r: Record<string, unknown>) => React.ReactNode;
  /** extra buttons in the drawer footer */
  drawerActions?: (r: Record<string, unknown>) => React.ReactNode;
  rowActions?: (r: T) => React.ReactNode;
  toolbar?: React.ReactNode;
  newLabel?: string;
  hideNew?: boolean;
  emptyText?: string;
  pageSize?: number;
  className?: string;
  /** controlled: open this record id in the drawer */
  openId?: string | null;
  onOpenChange?: (id: string | null) => void;
}

function toCsv(def: CollectionDef, rows: BaseRecord[], lookups: Record<string, Map<string, BaseRecord>>) {
  const fields = def.fields;
  const esc = (v: unknown) => {
    const s = v === undefined || v === null ? "" : Array.isArray(v) ? v.map((x) => (typeof x === "object" ? JSON.stringify(x) : x)).join("; ") : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const header = ["id", ...fields.map((f) => f.label), "Created", "Updated"].map(esc).join(",");
  const lines = rows.map((r) =>
    [
      r.id,
      ...fields.map((f) => (f.type === "ref" ? refLabel(lookups[f.ref!]?.get(String(r[f.key])), f.ref) || r[f.key] : r[f.key])),
      r.createdAt,
      r.updatedAt,
    ]
      .map(esc)
      .join(","),
  );
  return [header, ...lines].join("\n");
}

export function downloadText(filename: string, text: string, type = "text/csv;charset=utf-8") {
  const blob = new Blob(["﻿" + text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Loads lookups for every ref field of a collection. */
function useRefLookups(def: CollectionDef) {
  const refs = [...new Set(def.fields.filter((f) => f.type === "ref" && f.ref).map((f) => f.ref!))];
  // fixed hook order: at most 4 distinct refs per collection in the registry
  const a = useLookup(refs[0] ?? "__none");
  const b = useLookup(refs[1] ?? "__none");
  const c = useLookup(refs[2] ?? "__none");
  const d = useLookup(refs[3] ?? "__none");
  const refsKey = refs.join();
  return useMemo(() => {
    const names = refsKey ? refsKey.split(",") : [];
    const m: Record<string, Map<string, BaseRecord>> = {};
    [a, b, c, d].forEach((map, i) => {
      if (names[i]) m[names[i]] = map;
    });
    return m;
  }, [a, b, c, d, refsKey]);
}

export function CollectionManager<T extends BaseRecord = BaseRecord>(props: CollectionManagerProps<T>) {
  const def = getCollection(props.name);
  if (!def) return <p className="text-bad">Unknown collection: {props.name}</p>;
  return <Inner def={def} {...props} />;
}

function Inner<T extends BaseRecord>({
  def,
  name,
  columns,
  extraColumns = [],
  filter,
  defaults,
  onOpen,
  beforeSave,
  drawerExtra,
  drawerActions,
  rowActions,
  toolbar,
  newLabel,
  hideNew,
  emptyText,
  pageSize = 60,
  className,
  openId,
  onOpenChange,
}: CollectionManagerProps<T> & { def: CollectionDef }) {
  const { user, store } = useHq();
  const { records, loading, error, save, remove } = useCollection<T>(name);
  const lookups = useRefLookups(def);
  const canWrite = can(user, def.write) && store.writable;

  const [q, setQ] = useState("");
  const statusField = def.fields.find((f) => f.type === "select" && ["status", "stage"].includes(f.key)) ?? def.fields.find((f) => f.type === "select" && f.table);
  const [statusFilter, setStatusFilter] = useState("");
  const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" }>({ key: def.sortField ?? "updatedAt", dir: def.sortDir ?? "desc" });
  const [limit, setLimit] = useState(pageSize);

  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  // controlled open
  useEffect(() => {
    if (openId === undefined) return;
    if (openId === null) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEditing(null);
      return;
    }
    const r = records.find((x) => x.id === openId);
    if (r) setEditing({ ...r });
  }, [openId, records]);

  const cols: FieldDef[] = useMemo(() => {
    const keys = columns ?? def.fields.filter((f) => f.table).map((f) => f.key);
    return keys.map((k) => def.fields.find((f) => f.key === k)).filter(Boolean) as FieldDef[];
  }, [columns, def]);

  const rows = useMemo(() => {
    let list = filter ? records.filter(filter) : records;
    if (statusFilter && statusField) list = list.filter((r) => String(r[statusField.key] ?? "") === statusFilter);
    const s = q.trim().toLowerCase();
    if (s) {
      list = list.filter((r) =>
        def.fields.some((f) => {
          const v = r[f.key];
          if (v === undefined || v === null) return false;
          if (f.type === "ref") return refLabel(lookups[f.ref!]?.get(String(v)), f.ref).toLowerCase().includes(s);
          return (Array.isArray(v) ? v.join(" ") : String(v)).toLowerCase().includes(s);
        }),
      );
    }
    const extra = extraColumns.find((c) => c.key === sort.key);
    const val = (r: T): string | number => {
      if (extra?.sortValue) return extra.sortValue(r);
      const v = r[sort.key];
      const f = def.fields.find((x) => x.key === sort.key);
      if (f?.type === "ref") return refLabel(lookups[f.ref!]?.get(String(v)), f.ref).toLowerCase();
      if (typeof v === "number") return v;
      return String(v ?? "").toLowerCase();
    };
    return [...list].sort((a, b) => {
      const av = val(a);
      const bv = val(b);
      const cmp = typeof av === "number" && typeof bv === "number" ? av - bv : String(av).localeCompare(String(bv), undefined, { numeric: true });
      return sort.dir === "asc" ? cmp : -cmp;
    });
  }, [records, filter, statusFilter, statusField, q, sort, def, lookups, extraColumns]);

  const statusCounts = useMemo(() => {
    const base = filter ? records.filter(filter) : records;
    const m: Record<string, number> = {};
    if (statusField) for (const r of base) m[String(r[statusField.key] ?? "")] = (m[String(r[statusField.key] ?? "")] || 0) + 1;
    return m;
  }, [records, filter, statusField]);

  function open(r?: T) {
    if (r && onOpen) return onOpen(r);
    setFormError("");
    setEditing(r ? { ...r } : { ...Object.fromEntries(def.fields.filter((f) => f.default !== undefined).map((f) => [f.key, f.default])), ...defaults });
    if (r) onOpenChange?.(r.id);
  }
  function close() {
    setEditing(null);
    onOpenChange?.(null);
  }

  async function onSave() {
    if (!editing) return;
    setSaving(true);
    setFormError("");
    try {
      const payload = beforeSave ? await beforeSave(editing) : editing;
      await save(payload as Partial<T> & Record<string, unknown>);
      close();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Could not save");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    if (!editing?.id) return;
    if (!window.confirm(`Delete this ${def.singular.toLowerCase()}? This is recorded in the history and can be restored from GitHub.`)) return;
    setSaving(true);
    try {
      await remove(String(editing.id));
      close();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Could not delete");
    } finally {
      setSaving(false);
    }
  }

  const toggleSort = (key: string) => setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }));

  return (
    <div className={className}>
      {/* toolbar */}
      <div className="no-print mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1 lg:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-blueprint" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={`Search ${def.label.toLowerCase()}…`}
            className="h-10 w-full rounded-[var(--radius-sm)] border border-graphite/15 bg-paper-50 pl-9 pr-3 text-sm outline-none focus:border-graphite"
          />
        </div>
        {statusField && (
          <div className="w-full lg:w-52">
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label={`Filter by ${statusField.label}`}>
              <option value="">{`All ${statusField.label.toLowerCase()}${/s$/i.test(statusField.label) ? "es" : "s"} (${filter ? records.filter(filter).length : records.length})`}</option>
              {statusField.options?.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label} ({statusCounts[o.value] || 0})
                </option>
              ))}
            </Select>
          </div>
        )}
        <div className="flex flex-wrap items-center gap-2 lg:ml-auto">
          {toolbar}
          <Button variant="secondary" size="sm" className="h-10" onClick={() => downloadText(`framemind-${name}-${new Date().toISOString().slice(0, 10)}.csv`, toCsv(def, rows, lookups))}>
            <Download className="size-4" /> CSV
          </Button>
          {!hideNew && canWrite && (
            <Button size="sm" className="h-10" onClick={() => open()}>
              <Plus className="size-4" /> {newLabel ?? `New ${def.singular.toLowerCase()}`}
            </Button>
          )}
        </div>
      </div>

      {error && <p className="mb-3 rounded border border-bad/30 bg-bad/10 px-3 py-2 text-sm text-bad">{error}</p>}

      {loading ? (
        <Loading />
      ) : !rows.length ? (
        <EmptyState
          icon={def.icon}
          title={q || statusFilter ? "Nothing matches" : `No ${def.label.toLowerCase()} yet`}
          description={q || statusFilter ? "Try a different search or filter." : emptyText ?? def.description}
          action={!hideNew && canWrite && !q && !statusFilter ? <Button size="sm" onClick={() => open()}><Plus className="size-4" /> {newLabel ?? `Add ${def.singular.toLowerCase()}`}</Button> : undefined}
        />
      ) : (
        <div className="overflow-hidden rounded-[var(--radius-md)] border border-graphite/12 bg-paper-50">
          <div className="hq-scroll overflow-x-auto" data-lenis-prevent>
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-graphite/12 bg-graphite/[0.035] text-left">
                  {cols.map((c) => (
                    <th key={c.key} className="px-4 py-2.5">
                      <button onClick={() => toggleSort(c.key)} className="annot inline-flex items-center gap-1 text-[10px] text-blueprint hover:text-graphite">
                        {c.label}
                        {sort.key === c.key && (sort.dir === "asc" ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />)}
                      </button>
                    </th>
                  ))}
                  {extraColumns.map((c) => (
                    <th key={c.key} className={cn("px-4 py-2.5", c.className)}>
                      <button onClick={() => toggleSort(c.key)} className="annot inline-flex items-center gap-1 text-[10px] text-blueprint hover:text-graphite">
                        {c.label}
                        {sort.key === c.key && (sort.dir === "asc" ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />)}
                      </button>
                    </th>
                  ))}
                  {rowActions && <th className="px-4 py-2.5" />}
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, limit).map((r) => (
                  <tr key={r.id} onClick={() => open(r)} className="cursor-pointer border-b border-graphite/[0.07] transition-colors last:border-0 hover:bg-graphite/[0.035]">
                    {cols.map((c, i) => (
                      <td key={c.key} className={cn("px-4 py-3 align-middle", i === 0 && "font-medium text-graphite")}>
                        <FieldValue field={c} value={r[c.key]} lookup={c.ref ? lookups[c.ref] : undefined} />
                      </td>
                    ))}
                    {extraColumns.map((c) => (
                      <td key={c.key} className={cn("px-4 py-3 align-middle", c.className)}>
                        {c.render(r)}
                      </td>
                    ))}
                    {rowActions && (
                      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        {rowActions(r)}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t border-graphite/10 px-4 py-2.5 text-xs text-blueprint">
            <span>
              {Math.min(limit, rows.length)} of {rows.length}
            </span>
            {rows.length > limit && (
              <button onClick={() => setLimit((l) => l + pageSize)} className="font-semibold text-graphite hover:underline">
                Show more
              </button>
            )}
          </div>
        </div>
      )}

      <Drawer
        open={!!editing}
        onClose={close}
        title={editing?.id ? `${def.singular}: ${String(editing[def.titleField] ?? "")}` : `New ${def.singular.toLowerCase()}`}
        subtitle={editing?.updatedAt ? `Last updated ${formatDateTime(String(editing.updatedAt))} by ${String(editing.updatedBy ?? "—")}` : def.description}
        footer={
          <div className="flex flex-wrap items-center gap-2">
            {canWrite && editing?.id ? (
              <button onClick={onDelete} disabled={saving} className="inline-flex items-center gap-1.5 rounded px-2 py-1.5 text-xs font-semibold text-bad hover:bg-bad/10">
                <Trash2 className="size-3.5" /> Delete
              </button>
            ) : null}
            {editing && drawerActions?.(editing)}
            <div className="ml-auto flex gap-2">
              <Button variant="ghost" size="sm" onClick={close}>
                {canWrite ? "Cancel" : "Close"}
              </Button>
              {canWrite && (
                <Button size="sm" onClick={onSave} disabled={saving}>
                  {saving && <Loader2 className="size-4 animate-spin" />} Save
                </Button>
              )}
            </div>
          </div>
        }
      >
        {editing && (
          <>
            {!canWrite && <p className="mb-4 rounded border border-graphite/15 bg-graphite/5 px-3 py-2 text-xs text-charcoal">{store.writable || store.viewOnly ? "You have view-only access to this module." : "HQ is in read-only mode."}</p>}
            <RecordForm def={def} value={editing} onChange={setEditing} disabled={!canWrite} />
            {drawerExtra?.(editing)}
            {formError && <p className="mt-4 rounded border border-bad/30 bg-bad/10 px-3 py-2 text-sm text-bad">{formError}</p>}
          </>
        )}
      </Drawer>
    </div>
  );
}
