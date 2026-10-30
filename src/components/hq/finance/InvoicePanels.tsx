"use client";

import { useState } from "react";
import { Info, Loader2, Plus, ReceiptText, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select } from "@/components/ui/form";
import { CornerMarks } from "@/components/brand/Blueprint";
import type { CompanySettings } from "@/lib/hq/settings";
import { amountInWords, cn, formatINR, uid } from "@/lib/utils";
import { PAY_MODE_LABELS, fmtDate, invoiceMath, isInterState, num, round2, stateCode, stateName, str, type Payment, type Rec } from "./finance";

/* ─────────────────────────── live totals ─────────────────────────── */

function Line({ k, v, strong, muted }: { k: React.ReactNode; v: React.ReactNode; strong?: boolean; muted?: boolean }) {
  return (
    <div className={cn("flex items-baseline justify-between gap-4 py-1.5 text-sm", strong && "text-base font-bold", muted && "text-charcoal")}>
      <span>{k}</span>
      <span className="tabular">{v}</span>
    </div>
  );
}

export function PlaceOfSupplyNote({ value, settings }: { value: unknown; settings: CompanySettings }) {
  const pos = str(value).trim();
  const own = stateName(stateCode(settings.stateCode) ?? stateCode(settings.state)) || settings.state || "your state";
  if (!pos) return <>Place of supply is blank — treated as intra-state ({own}): CGST + SGST.</>;
  const code = stateCode(pos);
  const inter = isInterState(pos, settings);
  if (!code) return <>“{pos}” isn&apos;t a recognised state — use the state name (e.g. Karnataka) or its 2-digit GST code. Treated as {inter ? "inter-state (IGST)" : "intra-state (CGST + SGST)"}.</>;
  return (
    <>
      Place of supply {stateName(code)} ({code}) — {inter ? <strong>inter-state: IGST</strong> : <strong>intra-state: CGST + SGST</strong>} (you are registered in {own}).
    </>
  );
}

export function InvoiceTotalsBox({ r, settings }: { r: Rec; settings: CompanySettings }) {
  const m = invoiceMath(r, settings);
  const half = m.gstPercent / 2;
  return (
    <section aria-label="Invoice totals" className="relative mt-6 overflow-hidden rounded-[var(--radius-md)] border border-graphite/15 bg-paper-50 p-5">
      <CornerMarks />
      <div className="bp-grid-fine pointer-events-none absolute inset-0 opacity-50" aria-hidden />
      <div className="relative">
        <p className="annot mb-2 text-blueprint">Live totals</p>
        <Line k="Subtotal" v={formatINR(m.subtotal, { decimals: true })} muted />
        {m.discount > 0 && <Line k="Discount" v={`− ${formatINR(m.discount, { decimals: true })}`} muted />}
        {m.gstPercent > 0 ? <Line k="Taxable value" v={formatINR(m.taxable, { decimals: true })} /> : <Line k="GST" v="Not charged" muted />}
        {m.gstPercent > 0 &&
          (m.inter ? (
            <Line k={`IGST @ ${m.gstPercent}%`} v={formatINR(m.igst, { decimals: true })} muted />
          ) : (
            <>
              <Line k={`CGST @ ${half}%`} v={formatINR(m.cgst, { decimals: true })} muted />
              <Line k={`SGST @ ${half}%`} v={formatINR(m.sgst, { decimals: true })} muted />
            </>
          ))}
        <div className="my-2 border-t border-dashed border-graphite/25" />
        <Line k="Total" v={formatINR(m.total, { decimals: true })} strong />
        <p className="text-[11px] italic text-charcoal">{amountInWords(m.total)}</p>
        {(m.paid > 0 || m.total > 0) && (
          <>
            <div className="my-2 border-t border-dashed border-graphite/25" />
            <Line k="Received" v={formatINR(m.received, { decimals: true })} muted />
            {m.tds > 0 && <Line k="TDS deducted by payer" v={formatINR(m.tds, { decimals: true })} muted />}
            <Line k="Balance due" v={formatINR(m.balance, { decimals: true })} strong />
          </>
        )}
        <p className="mt-3 flex gap-2 rounded-[var(--radius-sm)] bg-graphite/[0.04] px-3 py-2 text-xs text-charcoal">
          <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          <span>
            {m.gstPercent > 0 && <PlaceOfSupplyNote value={r.placeOfSupply} settings={settings} />} Status updates to paid / partially paid / overdue automatically when you save
            {str(r.status) === "draft" || !r.status ? " — set it to “Sent” when you issue the invoice." : "."}
          </span>
        </p>
      </div>
    </section>
  );
}

/* ─────────────────────────── payments ─────────────────────────── */

export function PaymentsPanel({ r, settings, today, canWrite, onSave }: { r: Rec; settings: CompanySettings; today: string; canWrite: boolean; onSave: (next: Record<string, unknown>) => Promise<void> }) {
  const m = invoiceMath(r, settings);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ date: today, amount: "", mode: "upi", reference: "", tds: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  /** Real payment entries (a bare amountPaid becomes an explicit entry once you edit payments). */
  const baseEntries = (): Payment[] => m.payments.map((p) => (p.synthetic ? { ...p, id: uid("pay"), synthetic: undefined, reference: "Recorded on invoice" } : p));

  async function commit(entries: Payment[]) {
    setBusy(true);
    setErr("");
    try {
      await onSave({
        ...r,
        payments: entries.map((p) => ({ ...p, synthetic: undefined })),
        // explicit, so removing the last entry resets the invoice to unpaid
        amountPaid: round2(entries.reduce((s, p) => s + p.amount + (p.tds || 0), 0)),
        tdsDeducted: round2(entries.reduce((s, p) => s + (p.tds || 0), 0)),
      });
      return true;
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not save the payment");
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function record(e: React.FormEvent) {
    e.preventDefault();
    const amount = round2(num(form.amount));
    const tds = round2(num(form.tds));
    if (amount <= 0 && tds <= 0) return setErr("Enter the amount received.");
    if (!form.date) return setErr("Enter the payment date.");
    const ok = await commit([...baseEntries(), { id: uid("pay"), date: form.date, amount, mode: form.mode, reference: form.reference.trim(), tds }]);
    if (ok) {
      setOpen(false);
      setForm({ date: today, amount: "", mode: form.mode, reference: "", tds: "" });
    }
  }

  /** Mark a payment as matched to the bank statement, or as refunded: incentives count reconciled, unrefunded payments only. */
  async function flag(id: string, key: "reconciled" | "refunded", value: boolean) {
    if (key === "refunded" && value && !window.confirm("Mark this payment as refunded to the client? It will stop counting toward team incentives.")) return;
    await commit(baseEntries().map((p) => (p.id === id ? { ...p, [key]: value } : p)));
  }

  async function removePayment(id: string) {
    if (!window.confirm("Remove this payment entry? The invoice balance and status will be recalculated.")) return;
    await commit(baseEntries().filter((p) => p.id !== id && !(p.synthetic && id.startsWith("legacy_"))));
  }

  return (
    <section aria-label="Payments received" className="mt-6 rounded-[var(--radius-md)] border border-graphite/15 bg-paper-50">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-graphite/10 px-5 py-3">
        <div>
          <h3 className="text-sm font-semibold">Payments received</h3>
          <p className="text-xs text-blueprint">
            {m.payments.length ? `${m.payments.length} entr${m.payments.length === 1 ? "y" : "ies"} · ${formatINR(m.paid)} settled · ${formatINR(m.balance)} balance` : "Nothing recorded yet"}
          </p>
        </div>
        {canWrite && r.id && !open && m.balance > 0 && (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              setForm((f) => ({ ...f, date: today, amount: String(m.balance) }));
              setErr("");
              setOpen(true);
            }}
          >
            <Plus className="size-3.5" /> Record payment
          </Button>
        )}
      </div>

      {m.payments.length > 0 && (
        <ul className="divide-y divide-graphite/[0.07]">
          {m.payments.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-5 py-2.5 text-sm">
              <span className="tabular w-24 shrink-0 text-charcoal">{fmtDate(p.date)}</span>
              <span className="min-w-0 flex-1 truncate">
                {PAY_MODE_LABELS[p.mode || ""] ?? (p.mode || "—")}
                {p.reference && <span className="text-blueprint"> · {p.reference}</span>}
                {!!p.tds && <span className="text-blueprint"> · TDS {formatINR(p.tds)}</span>}
              </span>
              <span className="tabular font-semibold">{formatINR(p.amount, { decimals: true })}</span>
              {!p.synthetic && (
                <span className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={!canWrite || busy}
                    onClick={() => void flag(p.id, "reconciled", !p.reconciled)}
                    className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${p.reconciled ? "border-ok/40 bg-ok/10 text-ok" : "border-graphite/20 text-blueprint hover:border-graphite/40"}`}
                    title={p.reconciled ? `Reconciled${p.reconciledBy ? ` by ${p.reconciledBy}` : ""}${p.reconciledAt ? ` on ${fmtDate(p.reconciledAt.slice(0, 10))}` : ""}` : "Tick once this payment is matched to the bank statement"}
                    aria-pressed={!!p.reconciled}
                  >
                    {p.reconciled ? "Reconciled" : "Reconcile"}
                  </button>
                  {(p.refunded || (canWrite && p.reconciled)) && (
                    <button
                      type="button"
                      disabled={!canWrite || busy}
                      onClick={() => void flag(p.id, "refunded", !p.refunded)}
                      className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${p.refunded ? "border-bad/40 bg-bad/10 text-bad" : "border-graphite/20 text-blueprint hover:border-graphite/40"}`}
                      title={p.refunded ? `Refunded${p.refundedBy ? ` — marked by ${p.refundedBy}` : ""}` : "Mark as refunded to the client"}
                      aria-pressed={!!p.refunded}
                    >
                      {p.refunded ? "Refunded" : "Refund?"}
                    </button>
                  )}
                </span>
              )}
              {r.id && !p.synthetic && (
                <a href={`/hq/print/receipt/${r.id}?payment=${encodeURIComponent(p.id)}`} className="rounded p-1 text-blueprint hover:bg-graphite/5 hover:text-graphite" aria-label={`Print receipt for payment on ${fmtDate(p.date)}`} title="Print receipt">
                  <ReceiptText className="size-4" />
                </a>
              )}
              {canWrite && !p.synthetic && (
                <button type="button" onClick={() => removePayment(p.id)} disabled={busy} className="rounded p-1 text-blueprint hover:bg-bad/10 hover:text-bad" aria-label={`Remove payment on ${fmtDate(p.date)}`}>
                  <Trash2 className="size-3.5" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {!r.id && <p className="px-5 py-3 text-xs text-charcoal">Save the invoice first — then record payments against it here.</p>}

      {open && (
        <form onSubmit={record} className="grid gap-3 border-t border-graphite/10 bg-paper px-5 py-4 sm:grid-cols-6">
          <div className="sm:col-span-2">
            <Label htmlFor="pay-date">Date received</Label>
            <Input id="pay-date" type="date" value={form.date} max={today} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="pay-amount">Amount received (₹)</Label>
            <Input id="pay-amount" type="number" inputMode="decimal" step="any" min="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="tabular" />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="pay-mode">Mode</Label>
            <Select id="pay-mode" value={form.mode} onChange={(e) => setForm({ ...form, mode: e.target.value })}>
              {Object.entries(PAY_MODE_LABELS).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </Select>
          </div>
          <div className="sm:col-span-4">
            <Label htmlFor="pay-ref">Reference / UTR / cheque no.</Label>
            <Input id="pay-ref" value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} placeholder="e.g. UTR 4123 9876 5521" />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="pay-tds">TDS deducted (₹)</Label>
            <Input id="pay-tds" type="number" inputMode="decimal" step="any" min="0" value={form.tds} onChange={(e) => setForm({ ...form, tds: e.target.value })} placeholder="0" className="tabular" />
          </div>
          <p className="text-[11px] text-blueprint sm:col-span-6">
            Enter the amount that actually reached the bank. If the client deducted TDS, enter it separately — it settles the invoice and is claimed later via Form 26AS / Form 16A.
          </p>
          {err && <p className="rounded border border-bad/30 bg-bad/10 px-3 py-2 text-xs text-bad sm:col-span-6">{err}</p>}
          <div className="flex gap-2 sm:col-span-6">
            <Button size="sm" type="submit" disabled={busy}>
              {busy && <Loader2 className="size-3.5 animate-spin" />} Save payment
            </Button>
            <Button size="sm" variant="ghost" type="button" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
          <p className="text-[11px] text-charcoal sm:col-span-6">Saving a payment also saves any unsaved changes in the form above.</p>
        </form>
      )}
      {!open && err && <p className="mx-5 my-3 rounded border border-bad/30 bg-bad/10 px-3 py-2 text-xs text-bad">{err}</p>}
    </section>
  );
}
