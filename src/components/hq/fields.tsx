"use client";

import { useMemo, useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import type { BaseRecord, CollectionDef, FieldDef, LineItem } from "@/lib/hq/collections";
import { getCollection, lineItemsTotal } from "@/lib/hq/collections";
import { Input, Select, Textarea, Label } from "@/components/ui/form";
import { Badge, statusTone } from "@/components/ui/Badge";
import { cn, formatDate, formatINR, formatNumber } from "@/lib/utils";
import { useCollection } from "./data";

/* ─────────────────────────── display ─────────────────────────── */

export function refLabel(record: BaseRecord | undefined, refName?: string) {
  if (!record) return "";
  const def = refName ? getCollection(refName) : undefined;
  const key = def?.titleField ?? "name";
  return String(record[key] ?? record.name ?? record.title ?? record.id);
}

/** Render a field value for tables / detail views. */
export function FieldValue({ field, value, lookup }: { field: FieldDef; value: unknown; lookup?: Map<string, BaseRecord> }) {
  if (value === undefined || value === null || value === "" || (Array.isArray(value) && !value.length)) return <span className="text-blueprint/60">—</span>;
  switch (field.type) {
    case "currency":
      return <span className="tabular">{formatINR(Number(value))}</span>;
    case "number":
      return <span className="tabular">{formatNumber(Number(value))}</span>;
    case "percent":
      return <span className="tabular">{Number(value)}%</span>;
    case "date":
      return <span className="tabular whitespace-nowrap">{formatDate(String(value))}</span>;
    case "month": {
      const [y, m] = String(value).split("-");
      return <span className="tabular">{new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}</span>;
    }
    case "boolean":
      return value ? <Badge tone="ok">Yes</Badge> : <span className="text-blueprint">No</span>;
    case "select": {
      const opt = field.options?.find((o) => o.value === value);
      const isStatus = ["status", "stage", "priority"].includes(field.key);
      return isStatus ? <Badge tone={statusTone(value)}>{opt?.label ?? String(value)}</Badge> : <span>{opt?.label ?? String(value)}</span>;
    }
    case "multiselect":
      return (
        <span className="flex flex-wrap gap-1">
          {(value as string[]).map((v) => (
            <Badge key={v} tone="outline">
              {field.options?.find((o) => o.value === v)?.label ?? v}
            </Badge>
          ))}
        </span>
      );
    case "tags":
      return <span className="text-charcoal">{(value as string[]).join(", ")}</span>;
    case "ref":
      return <span>{refLabel(lookup?.get(String(value)), field.ref) || <span className="text-blueprint/60">—</span>}</span>;
    case "url":
      return (
        <a href={String(value)} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2" onClick={(e) => e.stopPropagation()}>
          Open
        </a>
      );
    case "lineItems":
      return <span className="tabular">{(value as LineItem[]).length} items · {formatINR(lineItemsTotal(value))}</span>;
    default:
      return <span className="line-clamp-2">{String(value)}</span>;
  }
}

/* ─────────────────────────── inputs ─────────────────────────── */

function RefSelect({ field, value, onChange, disabled }: { field: FieldDef; value: unknown; onChange: (v: unknown) => void; disabled?: boolean }) {
  const { records } = useCollection(field.ref!);
  const sorted = useMemo(() => [...records].sort((a, b) => refLabel(a, field.ref).localeCompare(refLabel(b, field.ref))), [records, field.ref]);
  return (
    <Select value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} disabled={disabled}>
      <option value="">— Select —</option>
      {sorted.map((r) => (
        <option key={r.id} value={r.id}>
          {refLabel(r, field.ref)}
        </option>
      ))}
    </Select>
  );
}

function TagsInput({ value, onChange, disabled, placeholder }: { value: unknown; onChange: (v: string[]) => void; disabled?: boolean; placeholder?: string }) {
  const tags = Array.isArray(value) ? (value as string[]) : [];
  const [draft, setDraft] = useState("");
  const commit = () => {
    const parts = draft
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (parts.length) onChange([...tags, ...parts.filter((p) => !tags.includes(p))]);
    setDraft("");
  };
  return (
    <div className="flex min-h-10 flex-wrap items-center gap-1.5 rounded-[var(--radius-sm)] border border-graphite/20 bg-paper-50 px-2 py-1.5 focus-within:border-graphite">
      {tags.map((t) => (
        <span key={t} className="inline-flex items-center gap-1 rounded-full bg-graphite/10 px-2 py-0.5 text-xs">
          {t}
          {!disabled && (
            <button type="button" onClick={() => onChange(tags.filter((x) => x !== t))} aria-label={`Remove ${t}`}>
              <X className="size-3" />
            </button>
          )}
        </span>
      ))}
      <input
        value={draft}
        disabled={disabled}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            commit();
          } else if (e.key === "Backspace" && !draft && tags.length) onChange(tags.slice(0, -1));
        }}
        onBlur={commit}
        placeholder={tags.length ? "" : placeholder || "Type and press Enter"}
        className="min-w-[8rem] flex-1 bg-transparent px-1 text-sm outline-none"
      />
    </div>
  );
}

export function LineItemsEditor({ value, onChange, disabled, showSac }: { value: unknown; onChange: (v: LineItem[]) => void; disabled?: boolean; showSac?: boolean }) {
  const items: LineItem[] = Array.isArray(value) ? (value as LineItem[]) : [];
  const set = (i: number, patch: Partial<LineItem>) => onChange(items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  return (
    <div className="overflow-hidden rounded-[var(--radius-sm)] border border-graphite/15">
      <table className="w-full text-sm">
        <thead className="bg-graphite/[0.04] text-left">
          <tr className="annot text-[10px] text-blueprint">
            <th className="px-2 py-2 font-medium">Description</th>
            {showSac && <th className="w-24 px-2 py-2 font-medium">SAC/HSN</th>}
            <th className="w-20 px-2 py-2 font-medium">Qty</th>
            <th className="w-28 px-2 py-2 font-medium">Rate ₹</th>
            <th className="w-28 px-2 py-2 text-right font-medium">Amount</th>
            <th className="w-8" />
          </tr>
        </thead>
        <tbody>
          {items.map((it, i) => (
            <tr key={i} className="border-t border-graphite/10">
              <td className="p-1">
                <input className="h-9 w-full rounded bg-transparent px-2 outline-none focus:bg-white" value={it.description} disabled={disabled} onChange={(e) => set(i, { description: e.target.value })} placeholder="Item / service" />
              </td>
              {showSac && (
                <td className="p-1">
                  <input className="h-9 w-full rounded bg-transparent px-2 outline-none focus:bg-white" value={it.sac ?? ""} disabled={disabled} onChange={(e) => set(i, { sac: e.target.value })} />
                </td>
              )}
              <td className="p-1">
                <input type="number" className="tabular h-9 w-full rounded bg-transparent px-2 outline-none focus:bg-white" value={it.qty} disabled={disabled} onChange={(e) => set(i, { qty: Number(e.target.value) })} />
              </td>
              <td className="p-1">
                <input type="number" className="tabular h-9 w-full rounded bg-transparent px-2 outline-none focus:bg-white" value={it.rate} disabled={disabled} onChange={(e) => set(i, { rate: Number(e.target.value) })} />
              </td>
              <td className="tabular px-2 text-right">{formatINR((Number(it.qty) || 0) * (Number(it.rate) || 0))}</td>
              <td className="p-1 text-center">
                {!disabled && (
                  <button type="button" onClick={() => onChange(items.filter((_, idx) => idx !== i))} className="rounded p-1 text-blueprint hover:bg-bad/10 hover:text-bad" aria-label="Remove line">
                    <Trash2 className="size-3.5" />
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t border-graphite/15 bg-graphite/[0.03]">
            <td colSpan={showSac ? 3 : 2} className="px-2 py-2">
              {!disabled && (
                <button type="button" onClick={() => onChange([...items, { description: "", qty: 1, rate: 0 }])} className="inline-flex items-center gap-1 text-xs font-semibold text-graphite hover:underline">
                  <Plus className="size-3.5" /> Add line
                </button>
              )}
            </td>
            <td className="annot px-2 text-right text-[10px] text-blueprint">Subtotal</td>
            <td className="tabular px-2 py-2 text-right font-semibold">{formatINR(lineItemsTotal(items))}</td>
            <td />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

export function FieldInput({ field, value, onChange, disabled }: { field: FieldDef; value: unknown; onChange: (v: unknown) => void; disabled?: boolean }) {
  const v = value ?? "";
  switch (field.type) {
    case "textarea":
      return <Textarea value={String(v)} onChange={(e) => onChange(e.target.value)} disabled={disabled} placeholder={field.placeholder} rows={3} />;
    case "number":
    case "currency":
    case "percent":
      return (
        <div className="relative">
          {field.type === "currency" && <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-blueprint">₹</span>}
          <Input
            type="number"
            inputMode="decimal"
            step="any"
            value={v === null ? "" : String(v)}
            onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
            disabled={disabled}
            placeholder={field.placeholder}
            className={cn("tabular", field.type === "currency" && "pl-7", field.type === "percent" && "pr-8")}
          />
          {field.type === "percent" && <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-blueprint">%</span>}
        </div>
      );
    case "date":
    case "month":
    case "time":
      return <Input type={field.type} value={String(v)} onChange={(e) => onChange(e.target.value)} disabled={disabled} />;
    case "email":
    case "phone":
    case "url":
      return <Input type={field.type === "phone" ? "tel" : field.type} value={String(v)} onChange={(e) => onChange(e.target.value)} disabled={disabled} placeholder={field.placeholder} />;
    case "select":
      return (
        <Select value={String(v)} onChange={(e) => onChange(e.target.value)} disabled={disabled}>
          <option value="">— Select —</option>
          {field.options?.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
      );
    case "multiselect": {
      const arr = Array.isArray(value) ? (value as string[]) : [];
      return (
        <div className="flex flex-wrap gap-1.5">
          {field.options?.map((o) => {
            const on = arr.includes(o.value);
            return (
              <button
                type="button"
                key={o.value}
                disabled={disabled}
                onClick={() => onChange(on ? arr.filter((x) => x !== o.value) : [...arr, o.value])}
                className={cn("rounded-full border px-3 py-1 text-xs font-medium transition-colors", on ? "border-graphite bg-graphite text-paper" : "border-graphite/20 hover:border-graphite/50")}
              >
                {o.label}
              </button>
            );
          })}
        </div>
      );
    }
    case "boolean":
      return (
        <button
          type="button"
          role="switch"
          aria-checked={!!value}
          disabled={disabled}
          onClick={() => onChange(!value)}
          className={cn("relative inline-flex h-6 w-11 items-center rounded-full transition-colors", value ? "bg-graphite" : "bg-graphite/20")}
        >
          <span className={cn("inline-block size-5 rounded-full bg-paper shadow transition-transform", value ? "translate-x-[22px]" : "translate-x-0.5")} />
        </button>
      );
    case "ref":
      return <RefSelect field={field} value={value} onChange={onChange} disabled={disabled} />;
    case "tags":
      return <TagsInput value={value} onChange={onChange} disabled={disabled} placeholder={field.placeholder} />;
    case "lineItems":
      return <LineItemsEditor value={value} onChange={onChange} disabled={disabled} />;
    default:
      // with suggestions: pick a common value or type your own
      if (field.suggestions?.length) {
        const listId = `sugg-${field.key}`;
        return (
          <>
            <Input value={String(v)} onChange={(e) => onChange(e.target.value)} disabled={disabled} placeholder={field.placeholder} list={listId} autoComplete="off" />
            <datalist id={listId}>
              {field.suggestions.map((o) => (
                <option key={o} value={o} />
              ))}
            </datalist>
          </>
        );
      }
      return <Input value={String(v)} onChange={(e) => onChange(e.target.value)} disabled={disabled} placeholder={field.placeholder} />;
  }
}

const widthCls = { full: "sm:col-span-6", half: "sm:col-span-3", third: "sm:col-span-2" } as const;

/** Schema-driven form. Controlled: pass the record and receive patches. */
export function RecordForm({ def, value, onChange, disabled, only, exclude }: { def: CollectionDef; value: Record<string, unknown>; onChange: (next: Record<string, unknown>) => void; disabled?: boolean; only?: string[]; exclude?: string[] }) {
  const fields = def.fields.filter((f) => !f.hidden && (!only || only.includes(f.key)) && !exclude?.includes(f.key));
  return (
    <div className="grid gap-x-4 gap-y-5 sm:grid-cols-6">
      {fields.map((f) => (
        <div key={f.key} className={cn("col-span-1", widthCls[f.width ?? "half"])}>
          <Label>
            {f.label}
            {f.required && <span className="ml-0.5 text-bad">*</span>}
          </Label>
          <FieldInput field={f} value={value[f.key]} onChange={(v) => onChange({ ...value, [f.key]: v })} disabled={disabled} />
          {f.help && <p className="mt-1 text-[11px] text-blueprint">{f.help}</p>}
        </div>
      ))}
    </div>
  );
}
