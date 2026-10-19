"use client";

import { useCallback, useMemo, useState } from "react";
import { CheckCircle2, Loader2, Lock, Printer, Wand2 } from "lucide-react";
import { CollectionManager, type ExtraColumn } from "@/components/hq/CollectionManager";
import { useCollection, useHq } from "@/components/hq/data";
import { EmptyState, StatCard } from "@/components/hq/ui";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/form";
import { Modal } from "@/components/ui/Overlay";
import { payrollNet } from "@/lib/hq/collections";
import { can, LEADERSHIP } from "@/lib/hq/roles";
import { formatINR } from "@/lib/utils";
import { expenseCategoryFor, shootsInMonth, unitsText, monthLabel, num, PAY_MODES, slipTotals, str, useTodayIso, type Rec } from "./team";

export function PayrollTab() {
  const { user } = useHq();
  if (!can(user, LEADERSHIP)) {
    return (
      <EmptyState
        icon="BadgeIndianRupee"
        title="Payroll is limited to founders and admins"
        description="Pay rates, payslips and payouts are confidential. Ask a founder if you need a copy of your own payslip."
        action={
          <span className="inline-flex items-center gap-1.5 text-xs text-blueprint">
            <Lock className="size-3.5" aria-hidden /> No access with your role ({user.role})
          </span>
        }
      />
    );
  }
  return <PayrollInner />;
}

function PayrollInner() {
  const { store } = useHq();
  const today = useTodayIso();
  const { records: team } = useCollection<Rec>("team");
  const { records: payroll, saveMany, save } = useCollection<Rec>("payroll");
  const { records: shoots } = useCollection<Rec>("shoots");
  const { records: expenses, save: saveExpense } = useCollection<Rec>("expenses");

  const [picked, setPicked] = useState("");
  const month = picked || today?.slice(0, 7) || "";
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ tone: "ok" | "bad"; text: string } | null>(null);
  const [payId, setPayId] = useState<string | null>(null);

  const memberMap = useMemo(() => new Map(team.map((m) => [m.id, m])), [team]);
  const slips = useMemo(() => payroll.filter((p) => str(p.month) === month), [payroll, month]);
  const missing = useMemo(() => team.filter((m) => str(m.status) === "active" && !slips.some((p) => p.memberId === m.id)), [team, slips]);

  const totals = useMemo(() => {
    const net = slips.reduce((s, p) => s + payrollNet(p), 0);
    const paid = slips.filter((p) => str(p.status) === "paid").reduce((s, p) => s + payrollNet(p), 0);
    const held = slips.filter((p) => str(p.status) === "on-hold").reduce((s, p) => s + payrollNet(p), 0);
    return { net, paid, held, pending: net - paid - held, gross: slips.reduce((s, p) => s + slipTotals(p).gross, 0) };
  }, [slips]);

  const writable = store.writable;

  async function generate() {
    if (!month || !missing.length) return;
    setBusy(true);
    setNotice(null);
    try {
      const records = missing.map((m) => {
        const rec: Record<string, unknown> = {
          month,
          memberId: m.id,
          status: "pending",
          fixedPay: num(m.monthlyPay),
          // day-rate freelancers start from the shoot days they crewed; other units are typed in
          units: num(m.unitRate) ? shootsInMonth(m, shoots, month).length : 0,
          unitRate: num(m.unitRate),
          unitLabel: "day",
          allowances: 0,
          bonus: 0,
          deductions: 0,
          tds: 0,
        };
        rec.netPay = payrollNet(rec);
        return rec;
      });
      await saveMany(records);
      setNotice({ tone: "ok", text: `Created ${records.length} pending payslip${records.length === 1 ? "" : "s"} for ${monthLabel(month)}. Review allowances, bonus and deductions before paying.` });
    } catch (e) {
      setNotice({ tone: "bad", text: e instanceof Error ? e.message : "Could not generate payroll" });
    } finally {
      setBusy(false);
    }
  }

  const filter = useCallback((r: Rec) => str(r.month) === month, [month]);

  const extraColumns = useMemo<ExtraColumn<Rec>[]>(
    () => [
      { key: "fixed", label: "Fixed", render: (r) => <span className="tabular">{formatINR(num(r.fixedPay))}</span>, sortValue: (r) => num(r.fixedPay) },
      {
        key: "units",
        label: "Freelance units",
        render: (r) => (
          <span className="tabular">
            {unitsText(num(r.units), str(r.unitLabel) || "day")} × {formatINR(num(r.unitRate))}
          </span>
        ),
        sortValue: (r) => num(r.units),
      },
      { key: "net", label: "Net pay", render: (r) => <span className="tabular font-bold">{formatINR(payrollNet(r))}</span>, sortValue: (r) => payrollNet(r) },
    ],
    [],
  );

  const payRecord = payId ? payroll.find((p) => p.id === payId) : undefined;

  return (
    <div className="space-y-6">
      <div className="no-print flex flex-col gap-4 rounded-[var(--radius-md)] border border-graphite/12 bg-paper-50 p-4 sm:flex-row sm:flex-wrap sm:items-end">
        <Field label="Pay month" htmlFor="pay-month" className="w-full sm:w-52">
          <Input id="pay-month" type="month" value={month} onChange={(e) => setPicked(e.target.value)} />
        </Field>
        <div className="flex flex-col gap-1.5 sm:flex-1">
          <Button onClick={generate} disabled={busy || !writable || !month || missing.length === 0} className="sm:w-fit">
            {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Wand2 className="size-4" aria-hidden />}
            Generate payroll for {month ? monthLabel(month) : "…"}
          </Button>
          <p className="text-xs text-blueprint">
            {missing.length > 0
              ? `${missing.length} active member${missing.length === 1 ? "" : "s"} without a payslip: ${missing.map((m) => str(m.name)).join(", ")}.`
              : team.length
                ? "Every active member already has a payslip for this month."
                : "Add team members first."}
          </p>
        </div>
      </div>

      {notice && (
        <p role="status" className={`rounded border px-3 py-2 text-sm ${notice.tone === "ok" ? "border-ok/30 bg-ok/10 text-ok" : "border-bad/30 bg-bad/10 text-bad"}`}>
          {notice.text}
        </p>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Net payable" value={formatINR(totals.net)} sub={`${slips.length} payslip${slips.length === 1 ? "" : "s"} · gross ${formatINR(totals.gross)}`} tone="dark" />
        <StatCard label="Paid" value={formatINR(totals.paid)} progress={totals.net ? totals.paid / totals.net : 0} />
        <StatCard label="Pending" value={formatINR(totals.pending)} sub="Awaiting payout" />
        <StatCard label="On hold" value={formatINR(totals.held)} sub="Not part of this run" />
      </div>

      <CollectionManager<Rec>
        name="payroll"
        columns={["memberId", "status", "paidOn"]}
        extraColumns={extraColumns}
        filter={filter}
        defaults={{ month, status: "pending" }}
        newLabel="Add payslip"
        emptyText={`No payslips for ${month ? monthLabel(month) : "this month"} yet. Use “Generate payroll” above, or add one manually.`}
        beforeSave={(r) => ({ ...r, netPay: payrollNet(r) })}
        drawerExtra={(r) => (
          <p className="mt-4 flex items-baseline justify-between rounded-[var(--radius-sm)] border border-graphite/15 bg-paper-50 px-4 py-3 text-sm">
            <span className="text-charcoal">Net pay (calculated on save)</span>
            <span className="tabular text-lg font-bold">{formatINR(payrollNet(r))}</span>
          </p>
        )}
        drawerActions={(r) =>
          r.id ? (
            <Button variant="ghost" size="sm" href={`/hq/print/payslip/${String(r.id)}`}>
              <Printer className="size-3.5" aria-hidden /> Payslip
            </Button>
          ) : null
        }
        rowActions={(r) => (
          <div className="flex justify-end gap-1.5">
            {str(r.status) !== "paid" && (
              <Button variant="secondary" size="sm" disabled={!writable} onClick={() => setPayId(r.id)}>
                <CheckCircle2 className="size-3.5" aria-hidden /> Mark paid<span className="sr-only"> for {str(memberMap.get(str(r.memberId))?.name) || "this member"}</span>
              </Button>
            )}
            <Button variant="ghost" size="sm" href={`/hq/print/payslip/${r.id}`}>
              <Printer className="size-3.5" aria-hidden /> Payslip<span className="sr-only"> for {str(memberMap.get(str(r.memberId))?.name) || "this member"}</span>
            </Button>
          </div>
        )}
      />

      {payRecord && (
        <MarkPaidModal
          key={payRecord.id}
          rec={payRecord}
          member={memberMap.get(str(payRecord.memberId))}
          defaultDate={today ?? ""}
          onClose={() => setPayId(null)}
          onConfirm={async ({ paidOn, mode, reference }) => {
            const member = memberMap.get(str(payRecord.memberId));
            const net = payrollNet(payRecord);
            let expenseId = str(payRecord.expenseId);
            if (net > 0 && !expenseId) {
              // reuse an expense created by an earlier attempt instead of duplicating it
              const existing = expenses.find((e) => str(e.payrollId) === payRecord.id);
              if (existing) expenseId = existing.id;
              else {
                const exp = await saveExpense({
                  date: paidOn,
                  category: expenseCategoryFor(member),
                  amount: net,
                  description: `Payslip ${monthLabel(str(payRecord.month))} — ${str(member?.name) || "team member"}`,
                  vendor: str(member?.name),
                  paidBy: "Company account",
                  mode,
                  receipt: reference,
                  payrollId: payRecord.id,
                  notes: "Auto-created from HQ → Team & Payroll",
                });
                expenseId = exp.id;
              }
            }
            await save({ ...payRecord, status: "paid", paidOn, mode, reference, netPay: net, ...(expenseId ? { expenseId } : {}) });
          }}
        />
      )}
    </div>
  );
}

function MarkPaidModal({
  rec,
  member,
  defaultDate,
  onClose,
  onConfirm,
}: {
  rec: Rec;
  member?: Rec;
  defaultDate: string;
  onClose: () => void;
  onConfirm: (v: { paidOn: string; mode: string; reference: string }) => Promise<void>;
}) {
  const net = payrollNet(rec);
  const [paidOn, setPaidOn] = useState(str(rec.paidOn) || defaultDate);
  const [mode, setMode] = useState(str(rec.mode) || "upi");
  const [reference, setReference] = useState(str(rec.reference));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const category = expenseCategoryFor(member);

  async function submit() {
    if (!paidOn) {
      setErr("Choose the payment date.");
      return;
    }
    setBusy(true);
    setErr("");
    try {
      await onConfirm({ paidOn, mode, reference: reference.trim() });
      onClose();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not record the payment");
      setBusy(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Mark payslip as paid"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" onClick={submit} disabled={busy}>
            {busy && <Loader2 className="size-4 animate-spin" aria-hidden />} Confirm payment
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <p className="flex items-baseline justify-between rounded-[var(--radius-sm)] border border-graphite/15 bg-paper-50 px-4 py-3">
          <span className="text-sm text-charcoal">
            {str(member?.name) || "Team member"} · {monthLabel(str(rec.month))}
          </span>
          <span className="tabular text-xl font-bold">{formatINR(net)}</span>
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Paid on" htmlFor="mp-date" required>
            <Input id="mp-date" type="date" value={paidOn} onChange={(e) => setPaidOn(e.target.value)} />
          </Field>
          <Field label="Mode" htmlFor="mp-mode">
            <Select id="mp-mode" value={mode} onChange={(e) => setMode(e.target.value)}>
              {PAY_MODES.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <Field label="Reference / UTR" htmlFor="mp-ref" help="Optional. Stored on the payslip and the expense.">
          <Input id="mp-ref" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="e.g. UPI transaction id" />
        </Field>
        <p className="text-xs text-blueprint">
          {net > 0 ? (
            <>
              This also records an expense of {formatINR(net)} under <strong className="text-graphite">{category}</strong> in Finance.
            </>
          ) : (
            "Net pay is ₹0, so no expense will be recorded."
          )}
        </p>
        {err && <p className="rounded border border-bad/30 bg-bad/10 px-3 py-2 text-sm text-bad">{err}</p>}
      </div>
    </Modal>
  );
}
