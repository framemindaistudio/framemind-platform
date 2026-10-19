"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { Check, FileText, Loader2, Paperclip, Upload, X } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { ConfirmButton } from "@/components/ui/Overlay";
import { OPS, can } from "@/lib/hq/roles";
import { formatINR } from "@/lib/utils";
import { CollectionManager, type ExtraColumn } from "@/components/hq/CollectionManager";
import { useCollection, useHq } from "@/components/hq/data";
import { Panel } from "@/components/hq/ui";
import { fmtDate, inPeriod, isImagePath, monthPeriod, fyPeriod, fyStartYear, receiptUrl, round2, summarize, str, num, ym, type Ledger, type Rec } from "./finance";

const MAX_RECEIPT = 4 * 1024 * 1024;
const COMPANY_PAYERS = new Set(["", "company account", "cash box"]);
const truthy = (v: unknown) => v === true || v === "true";
const fileName = (p: string) => p.split("/").pop() || p;

/* ─────────────────────────── receipt field (inside the drawer) ─────────────────────────── */

function ReceiptField({ r, file, onFile }: { r: Record<string, unknown>; file: File | null; onFile: (f: File | null) => void }) {
  const id = useId();
  const [err, setErr] = useState("");
  const current = str(r.receipt).trim();
  const url = receiptUrl(current);

  // a file picked but never saved must not leak into the next record
  useEffect(() => () => onFile(null), [onFile]);

  function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    e.target.value = "";
    setErr("");
    if (!f) return;
    if (f.size > MAX_RECEIPT) return setErr("That file is larger than 4 MB. Upload it to Google Drive and paste the link into the receipt field instead.");
    if (!/^(image\/|application\/pdf)/.test(f.type)) return setErr("Attach a photo (JPG, PNG, WebP) or a PDF.");
    onFile(f);
  }

  return (
    <section aria-labelledby={`${id}-h`} className="mt-6 rounded-[var(--radius-md)] border border-graphite/15 bg-paper-50 p-5">
      <h3 id={`${id}-h`} className="flex items-center gap-2 text-sm font-semibold">
        <Paperclip className="size-4" aria-hidden /> Receipt / bill
      </h3>
      <p className="mt-1 text-xs text-charcoal">Attach a photo or PDF of the bill (max 4 MB). It is filed under receipts/{str(r.date).slice(0, 7) || "YYYY-MM"} in the Files vault when you save the expense.</p>

      {current && !file && (
        <p className="mt-3 flex flex-wrap items-center gap-2 text-sm">
          <FileText className="size-4 text-blueprint" aria-hidden />
          <a href={url} target="_blank" rel="noopener noreferrer" className="font-medium text-graphite underline underline-offset-2">
            {/^https?:/i.test(current) ? "Open linked receipt" : fileName(current)}
          </a>
          {!/^https?:/i.test(current) && isImagePath(current) && <Badge tone="neutral">image</Badge>}
        </p>
      )}
      {file && (
        <p className="mt-3 flex flex-wrap items-center gap-2 rounded bg-graphite/[0.05] px-3 py-2 text-sm">
          <Upload className="size-4 text-blueprint" aria-hidden />
          <span className="min-w-0 flex-1 truncate font-medium">{file.name}</span>
          <span className="tabular text-xs text-blueprint">{(file.size / 1024).toFixed(0)} KB · uploads on Save</span>
          <button type="button" onClick={() => onFile(null)} className="rounded p-1 text-blueprint hover:bg-graphite/10 hover:text-graphite" aria-label="Remove the selected file">
            <X className="size-3.5" />
          </button>
        </p>
      )}

      <div className="mt-3">
        <label htmlFor={id} className="inline-flex h-8 cursor-pointer items-center gap-2 rounded-[var(--radius-sm)] border border-graphite px-3 text-xs font-semibold transition-colors hover:bg-graphite hover:text-paper has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-graphite">
          <Upload className="size-3.5" /> {current || file ? "Replace file" : "Choose file"}
          <input id={id} type="file" accept="image/*,application/pdf" onChange={pick} className="sr-only" />
        </label>
      </div>
      {err && (
        <p role="alert" className="mt-3 rounded border border-bad/30 bg-bad/10 px-3 py-2 text-xs text-bad">
          {err}
        </p>
      )}
    </section>
  );
}

/* ─────────────────────────── reimbursements ─────────────────────────── */

function Reimbursements({ today, canWrite }: { today: string; canWrite: boolean }) {
  const { records, save, saveMany } = useCollection<Rec>("expenses");
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState("");

  const groups = useMemo(() => {
    const m = new Map<string, Rec[]>();
    for (const r of records) {
      if (!truthy(r.reimbursable) || truthy(r.reimbursed)) continue;
      const who = str(r.paidBy).trim();
      if (COMPANY_PAYERS.has(who.toLowerCase())) continue; // paid from the company's own money — nothing to repay
      m.set(who, [...(m.get(who) ?? []), r]);
    }
    return [...m]
      .map(([who, items]) => ({ who, items: items.sort((a, b) => str(a.date).localeCompare(str(b.date))), total: round2(items.reduce((s, r) => s + num(r.amount), 0)) }))
      .sort((a, b) => b.total - a.total);
  }, [records]);

  const run = useCallback(async (key: string, fn: () => Promise<unknown>) => {
    setBusy(key);
    setErr("");
    try {
      await fn();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not update");
    } finally {
      setBusy(null);
    }
  }, []);

  if (!groups.length) return null;
  const grand = round2(groups.reduce((s, g) => s + g.total, 0));

  return (
    <Panel title="Owed to the team" subtitle={`${formatINR(grand)} to reimburse — expenses paid personally and marked “needs reimbursement”`} className="mb-6">
      <ul className="grid gap-4 xl:grid-cols-2">
        {groups.map((g) => (
          <li key={g.who || "unspecified"} className="rounded-[var(--radius-sm)] border border-graphite/15 bg-paper">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-graphite/10 px-4 py-3">
              <div className="min-w-[9rem] flex-1">
                <p className="truncate text-sm font-semibold">{g.who || "Paid by — not set"}</p>
                <p className="text-xs text-blueprint">
                  {g.items.length} expense{g.items.length === 1 ? "" : "s"}
                </p>
              </div>
              <p className="tabular text-lg font-bold">{formatINR(g.total)}</p>
              {canWrite && (
                <ConfirmButton
                  onConfirm={() => run(`all:${g.who}`, () => saveMany(g.items.map((r) => ({ ...r, reimbursed: true, reimbursedOn: today }))))}
                  message={`Mark all ${g.items.length} expenses (${formatINR(g.total)}) as reimbursed to ${g.who || "this person"}?`}
                  className="inline-flex h-8 items-center gap-1.5 rounded-[var(--radius-sm)] bg-graphite px-3 text-xs font-semibold text-paper hover:bg-ink disabled:opacity-50"
                >
                  {busy === `all:${g.who}` ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />} Mark all reimbursed
                </ConfirmButton>
              )}
            </div>
            <ul className="divide-y divide-graphite/[0.07]">
              {g.items.map((r) => (
                <li key={r.id} className="flex items-center gap-3 px-4 py-2 text-sm">
                  <span className="tabular w-[5.5rem] shrink-0 text-xs text-charcoal">{fmtDate(r.date)}</span>
                  <span className="min-w-0 flex-1 truncate" title={str(r.description)}>
                    {str(r.description)}
                  </span>
                  <span className="tabular font-medium">{formatINR(num(r.amount))}</span>
                  {canWrite && (
                    <button
                      type="button"
                      disabled={busy !== null}
                      onClick={() => run(r.id, () => save({ ...r, reimbursed: true, reimbursedOn: today }))}
                      className="rounded border border-graphite/20 px-2 py-1 text-[11px] font-semibold hover:bg-graphite hover:text-paper disabled:opacity-50"
                      aria-label={`Mark ${str(r.description)} as reimbursed`}
                    >
                      {busy === r.id ? "…" : "Reimbursed"}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
      {err && (
        <p role="alert" className="mt-3 rounded border border-bad/30 bg-bad/10 px-3 py-2 text-sm text-bad">
          {err}
        </p>
      )}
    </Panel>
  );
}

/* ─────────────────────────── tab ─────────────────────────── */

export function ExpensesTab({ ledger, today }: { ledger: Ledger; today: string }) {
  const { user, store } = useHq();
  const canWrite = can(user, OPS) && store.writable;

  const month = useMemo(() => summarize(ledger, monthPeriod(ym(today))), [ledger, today]);
  const fy = useMemo(() => summarize(ledger, fyPeriod(fyStartYear(today))), [ledger, today]);
  const fyGst = useMemo(() => round2(ledger.expenses.filter((e) => inPeriod(e.date, fyPeriod(fyStartYear(today)))).reduce((s, e) => s + e.gst, 0)), [ledger, today]);

  // pending receipt: kept in refs so beforeSave always sees the latest file
  const fileRef = useRef<File | null>(null);
  const uploaded = useRef<{ file: File; path: string } | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const pick = useCallback((f: File | null) => {
    fileRef.current = f;
    setFile(f);
  }, []);

  const beforeSave = useCallback(
    async (r: Record<string, unknown>) => {
      const out: Record<string, unknown> = { ...r };
      const f = fileRef.current;
      if (f) {
        let path = uploaded.current?.file === f ? uploaded.current.path : "";
        if (!path) {
          const fd = new FormData();
          fd.append("file", f);
          fd.append("folder", `receipts/${str(out.date).slice(0, 7) || today.slice(0, 7)}`);
          const res = await fetch("/api/hq/files", { method: "POST", body: fd });
          const json = (await res.json().catch(() => ({}))) as { path?: string; error?: string };
          if (res.status === 401) {
            // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- same as the shared api() helper
            window.location.href = `/hq/login?next=${encodeURIComponent(window.location.pathname)}`;
            throw new Error("Session expired");
          }
          if (!res.ok || !json.path) throw new Error(json.error || `Receipt upload failed (${res.status})`);
          path = json.path;
          uploaded.current = { file: f, path };
        }
        out.receipt = path;
      }
      if (!truthy(out.reimbursable)) delete out.reimbursedOn;
      return out;
    },
    [today],
  );

  const columns = useMemo(() => ["date", "category", "description", "amount", "paidBy"], []);
  const extraColumns = useMemo<ExtraColumn<Rec>[]>(
    () => [
      {
        key: "reimb",
        label: "Reimbursement",
        sortValue: (r) => (truthy(r.reimbursable) ? (truthy(r.reimbursed) ? 1 : 0) : 2),
        render: (r) => (!truthy(r.reimbursable) ? <span className="text-blueprint/50">—</span> : truthy(r.reimbursed) ? <Badge tone="ok">Reimbursed</Badge> : <Badge tone="warn">Owed</Badge>),
      },
      {
        key: "bill",
        label: "Bill",
        sortValue: (r) => (str(r.receipt) ? 1 : 0),
        render: (r) => {
          const p = str(r.receipt).trim();
          return p ? (
            <a
              href={receiptUrl(p)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex size-8 items-center justify-center rounded text-graphite hover:bg-graphite/10"
              aria-label={`Open receipt for ${str(r.description)}`}
              title={fileName(p)}
            >
              <Paperclip className="size-4" />
            </a>
          ) : (
            <span className="text-xs text-blueprint/70">none</span>
          );
        },
      },
    ],
    [],
  );

  const defaults = useMemo(() => ({ date: today, paidBy: "Company account" }), [today]);

  return (
    <div>
      <dl className="mb-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Stat label="This month" value={formatINR(month.expenses)} sub={month.byCategory[0] ? `Largest: ${month.byCategory[0].label}` : "Nothing logged yet"} />
        <Stat label="Financial year to date" value={formatINR(fy.expenses)} sub={fy.byCategory[0] ? `Largest: ${fy.byCategory[0].label}` : "Nothing logged yet"} />
        <Stat label="GST in bills (FY)" value={formatINR(fyGst)} sub="Potential input credit — your CA confirms eligibility" />
        <Stat label="Without a bill" value={String(ledger.expenses.filter((e) => !str(e.rec.receipt).trim()).length)} sub="Expenses with no receipt attached" />
      </dl>

      <Reimbursements today={today} canWrite={canWrite} />

      <CollectionManager<Rec>
        name="expenses"
        columns={columns}
        extraColumns={extraColumns}
        defaults={defaults}
        beforeSave={beforeSave}
        newLabel="Log expense"
        emptyText="Log fuel, tolls, kits, food, stipends — attach the bill as you go so the books are audit-ready."
        drawerExtra={(r) => <ReceiptField r={r} file={file} onFile={pick} />}
      />
      <p className="mt-3 text-xs text-blueprint">
        Amounts include tax. Enter the GST shown on the bill in “GST in bill” only for purchases from GST-registered vendors with a proper tax invoice — it feeds the input-credit estimate under Reports.
      </p>
      <p className="sr-only" aria-live="polite">
        {file ? `Receipt ${file.name} selected` : ""}
      </p>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-[var(--radius-md)] border border-graphite/12 bg-paper-50 px-4 py-3">
      <dt className="annot text-blueprint">{label}</dt>
      <dd className="tabular mt-1.5 text-xl font-bold leading-none tracking-tight">{value}</dd>
      <dd className="mt-1.5 text-[11px] text-charcoal">{sub}</dd>
    </div>
  );
}
