"use client";

import { useMemo } from "react";
import { Info } from "lucide-react";
import { formatINR } from "@/lib/utils";
import { CollectionManager } from "@/components/hq/CollectionManager";
import { fyPeriod, fyStartYear, inPeriod, monthPeriod, round2, ym, type Ledger, type Rec } from "./finance";

/** Other income = money received outside invoices (kit sales, studio retainers, courses…). */
export function IncomeTab({ ledger, today }: { ledger: Ledger; today: string }) {
  const stats = useMemo(() => {
    const m = monthPeriod(ym(today));
    const fy = fyPeriod(fyStartYear(today));
    const rows = ledger.cashIn.filter((c) => c.source === "income");
    const sum = (list: typeof rows) => round2(list.reduce((s, c) => s + c.amount, 0));
    const fyRows = rows.filter((c) => inPeriod(c.date, fy));
    const byStream = new Map<string, number>();
    fyRows.forEach((c) => byStream.set(c.stream, (byStream.get(c.stream) ?? 0) + c.amount));
    const top = [...byStream].sort((a, b) => b[1] - a[1])[0];
    return { month: sum(rows.filter((c) => inPeriod(c.date, m))), fy: sum(fyRows), top: top ? { label: top[0], amount: round2(top[1]) } : null, streams: byStream.size };
  }, [ledger, today]);

  return (
    <div>
      <dl className="mb-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Stat label="This month" value={formatINR(stats.month)} sub="Received outside invoices" />
        <Stat label="Financial year to date" value={formatINR(stats.fy)} sub={`${stats.streams} revenue stream${stats.streams === 1 ? "" : "s"}`} />
        <Stat label="Top stream (FY)" value={stats.top ? formatINR(stats.top.amount) : "—"} sub={stats.top ? stats.top.label : "Nothing recorded yet"} />
        <Stat label="Counts as" value="Revenue" sub="On the day received, in the P&L and cash flow" />
      </dl>

      <p className="mb-4 flex items-start gap-2 rounded-[var(--radius-sm)] border border-graphite/15 bg-graphite/[0.04] px-4 py-3 text-xs text-charcoal">
        <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
        <span>
          Money from a client against an <strong>invoice</strong> is recorded on the invoice itself (Invoices → open → Record payment) — don&apos;t enter it here too, or it will be counted twice. Use this tab for coaching fees, Vritta licence payments, studio retainers, courses, sponsorships and anything else without a JOVE invoice. If GST applies to a sale, confirm the treatment with your CA.
        </span>
      </p>

      <CollectionManager<Rec>
        name="income"
        columns={["date", "stream", "description", "amount"]}
        defaults={{ date: today }}
        newLabel="Record income"
        emptyText="Record coaching fees, Vritta payments, retainers and other money received that isn't tied to an invoice."
      />
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
