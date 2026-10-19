"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { AlertTriangle, ArrowRight, Banknote, CircleDollarSign, FileText, Percent, Printer, TrendingUp, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState, Panel, StatCard } from "@/components/hq/ui";
import { cn, formatINR } from "@/lib/utils";
import { ChartSkeleton, PeriodPicker, resolvePeriod, type PeriodState } from "./controls";
import { fyMonths, fyStartYear, monthsEnding, monthlySeries, receivables, str, summarize, ym, type Ledger, DUE_DAYS } from "./finance";
import type { CompanySettings } from "@/lib/hq/settings";
import type { FinanceTab } from "./FinanceApp";

const RevenueExpenseChart = dynamic(() => import("./FinanceCharts").then((m) => m.RevenueExpenseChart), { ssr: false, loading: () => <ChartSkeleton h={300} /> });
const HBarChart = dynamic(() => import("./FinanceCharts").then((m) => m.HBarChart), { ssr: false, loading: () => <ChartSkeleton h={180} /> });
const AgingChart = dynamic(() => import("./FinanceCharts").then((m) => m.AgingChart), { ssr: false, loading: () => <ChartSkeleton h={230} /> });

const pct = (v: number | null) => (v === null ? "—" : `${Math.round(v * 100)}%`);

export function OverviewTab({ ledger, settings, today, onNavigate, empty }: { ledger: Ledger; settings: CompanySettings; today: string; onNavigate: (tab: FinanceTab, params?: Record<string, string>) => void; empty: boolean }) {
  const [period, setPeriod] = useState<PeriodState>({ mode: "this-month", month: ym(today) });
  const p = useMemo(() => resolvePeriod(period, today), [period, today]);
  const isFy = period.mode === "fy" || period.mode === "prev-fy";

  const s = useMemo(() => summarize(ledger, p), [ledger, p]);
  const rec = useMemo(() => receivables(ledger, today), [ledger, today]);
  const months = useMemo(() => (isFy ? fyMonths(fyStartYear(p.start)) : monthsEnding(ym(p.end), 12)), [isFy, p.start, p.end]);
  const series = useMemo(() => monthlySeries(ledger, months), [ledger, months]);

  const monthlyTarget = Number(settings.monthlyRevenueTarget) || 0;
  const target = isFy ? monthlyTarget * 12 : monthlyTarget;
  const cashTotals = series.reduce((a, r) => ({ inv: a.inv + r.cashInInvoices, inc: a.inc + r.cashInIncome, out: a.out + r.cashOut, net: a.net + r.cashNet }), { inv: 0, inc: 0, out: 0, net: 0 });

  return (
    <div className="space-y-6">
      {/* period */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <PeriodPicker value={period} onChange={setPeriod} today={today} />
        <p className="annot text-blueprint">
          {p.label} · <span className="tabular">{p.start}</span> → <span className="tabular">{p.end}</span>
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
        <StatCard
          label="Invoiced (ex-GST)"
          value={formatINR(s.invoicedTaxable)}
          icon={<FileText className="size-4" />}
          sub={target ? `Revenue incl. other income is ${Math.round((s.revenue / target) * 100)}% of the ${formatINR(target)} target · ${s.invoiceCount} invoice${s.invoiceCount === 1 ? "" : "s"}` : `${s.invoiceCount} invoices · ${formatINR(s.invoicedTotal)} incl. GST`}
          progress={target ? s.revenue / target : undefined}
        />
        <StatCard label="Collected" value={formatINR(s.collected)} icon={<Banknote className="size-4" />} sub={`${formatINR(s.collectedInvoices)} on invoices · ${formatINR(s.collectedIncome)} other income`} />
        <StatCard label="Expenses" value={formatINR(s.expenses)} icon={<Wallet className="size-4" />} sub={s.byCategory[0] ? `Largest: ${s.byCategory[0].label} (${formatINR(s.byCategory[0].amount)})` : "Nothing logged in this period"} />
        <StatCard tone="dark" label={s.net < 0 ? "Net loss" : "Net profit"} value={formatINR(s.net)} icon={<TrendingUp className="size-4" />} sub={`Revenue ${formatINR(s.revenue)} − expenses ${formatINR(s.expenses)}`} />
        <StatCard label="Margin" value={pct(s.margin)} icon={<Percent className="size-4" />} sub={s.margin === null ? "No revenue in this period yet" : "Net profit ÷ revenue (ex-GST)"} />
        <StatCard
          label="Receivables"
          value={formatINR(rec.outstanding)}
          icon={<CircleDollarSign className="size-4" />}
          sub={rec.overdueCount ? <span className="font-semibold text-bad">{formatINR(rec.overdue)} overdue · {rec.overdueCount} invoice{rec.overdueCount === 1 ? "" : "s"}</span> : rec.openCount ? `${rec.openCount} open · nothing overdue` : "All invoices settled"}
        />
      </div>

      {empty ? (
        <EmptyState
          icon="ReceiptIndianRupee"
          title="No money recorded yet"
          description="Raise your first invoice from a project milestone, log expenses with their receipts, and record other income — this overview, the P&L and the GST summary build themselves."
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Button size="sm" onClick={() => onNavigate("invoices", { new: "1" })}>
                Invoice a project
              </Button>
              <Button size="sm" variant="secondary" onClick={() => onNavigate("expenses")}>
                Log an expense
              </Button>
              <Button size="sm" variant="ghost" onClick={() => onNavigate("income")}>
                Record income
              </Button>
            </div>
          }
        />
      ) : (
        <>
          <div className="grid gap-6 xl:grid-cols-3">
            <Panel className="xl:col-span-2" title={isFy ? `${p.label} — revenue vs expenses` : "Last 12 months — revenue vs expenses"} subtitle="Revenue on invoice date (ex-GST) + other income · expenses as paid">
              <RevenueExpenseChart data={series} />
            </Panel>
            <Panel title="Receivables aging" subtitle={`As of today · ${formatINR(rec.outstanding)} outstanding`}>
              <AgingChart buckets={rec.buckets} />
              <p className="mt-3 text-xs text-charcoal">Days past each invoice&apos;s due date. Milestone invoices are due {DUE_DAYS} days after they are raised unless the invoice says otherwise — follow up the day one slips, escalate past 30 days.</p>
            </Panel>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Panel title="Expenses by category" subtitle={p.label}>
              {s.byCategory.length ? <HBarChart rows={s.byCategory} label="Expenses" hatched /> : <p className="py-10 text-center text-sm text-blueprint">No expenses in {p.label}.</p>}
            </Panel>
            <Panel title="Revenue by stream" subtitle={`${p.label} · invoices count as Client work`}>
              {s.byStream.length ? <HBarChart rows={s.byStream} label="Revenue" /> : <p className="py-10 text-center text-sm text-blueprint">No revenue in {p.label}.</p>}
            </Panel>
          </div>

          {rec.overdueList.length > 0 && (
            <Panel
              title={
                <span className="inline-flex items-center gap-2">
                  <AlertTriangle className="size-4 text-bad" aria-hidden /> Overdue invoices
                </span>
              }
              subtitle="Oldest first — call, then send a reminder with the invoice attached"
              action={
                <Button size="sm" variant="ghost" onClick={() => onNavigate("invoices")}>
                  All invoices <ArrowRight className="size-3.5" />
                </Button>
              }
              bodyClassName="p-0"
            >
              <ul className="divide-y divide-graphite/[0.07]">
                {rec.overdueList.slice(0, 6).map(({ inv, m, daysPast }) => (
                  <li key={inv.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3 text-sm">
                    <button type="button" onClick={() => onNavigate("invoices", { id: inv.id })} className="min-w-0 flex-1 text-left hover:underline">
                      <span className="tabular font-semibold">{str(inv.number) || "—"}</span> <span className="text-charcoal">· {str(inv.customerName)}</span>
                    </button>
                    <Badge tone="bad">{daysPast} d overdue</Badge>
                    <span className="tabular w-28 text-right font-semibold">{formatINR(m.balance)}</span>
                    <Link href={`/hq/print/invoice/${inv.id}`} className="rounded p-1.5 text-blueprint hover:bg-graphite/5 hover:text-graphite" aria-label={`Print invoice ${str(inv.number)}`}>
                      <Printer className="size-4" />
                    </Link>
                  </li>
                ))}
              </ul>
            </Panel>
          )}

          <Panel title="Cash flow by month" subtitle="Cash basis — money actually received vs spent (window shown in the chart above)" bodyClassName="p-0">
            <div className="hq-scroll overflow-x-auto" data-lenis-prevent>
              <table className="w-full min-w-[720px] text-sm">
                <caption className="sr-only">Monthly cash flow</caption>
                <thead>
                  <tr className="annot border-b border-graphite/12 bg-graphite/[0.035] text-left text-[10px] text-blueprint">
                    <th scope="col" className="px-5 py-2.5 font-medium">Month</th>
                    <th scope="col" className="px-3 py-2.5 text-right font-medium">On invoices</th>
                    <th scope="col" className="px-3 py-2.5 text-right font-medium">Other income</th>
                    <th scope="col" className="px-3 py-2.5 text-right font-medium">Cash in</th>
                    <th scope="col" className="px-3 py-2.5 text-right font-medium">Cash out</th>
                    <th scope="col" className="px-3 py-2.5 text-right font-medium">Net</th>
                    <th scope="col" className="px-5 py-2.5 text-right font-medium">Running total</th>
                  </tr>
                </thead>
                <tbody>
                  {series.map((r) => (
                    <tr key={r.ym} className={cn("border-b border-graphite/[0.06] last:border-0", r.ym === ym(today) && "bg-graphite/[0.025]")}>
                      <th scope="row" className="px-5 py-2.5 text-left font-medium">
                        {r.label}
                        {r.ym === ym(today) && <span className="annot ml-2 text-[9px] text-blueprint">now</span>}
                      </th>
                      <td className="tabular px-3 py-2.5 text-right">{r.cashInInvoices ? formatINR(r.cashInInvoices) : <span className="text-blueprint/50">—</span>}</td>
                      <td className="tabular px-3 py-2.5 text-right">{r.cashInIncome ? formatINR(r.cashInIncome) : <span className="text-blueprint/50">—</span>}</td>
                      <td className="tabular px-3 py-2.5 text-right font-medium">{formatINR(r.cashIn)}</td>
                      <td className="tabular px-3 py-2.5 text-right">{r.cashOut ? `(${formatINR(r.cashOut)})` : <span className="text-blueprint/50">—</span>}</td>
                      <td className={cn("tabular px-3 py-2.5 text-right font-semibold", r.cashNet < 0 && "text-bad")}>{formatINR(r.cashNet)}</td>
                      <td className={cn("tabular px-5 py-2.5 text-right", r.cumulative < 0 && "text-bad")}>{formatINR(r.cumulative)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-graphite/30 bg-graphite/[0.04] font-semibold">
                    <th scope="row" className="px-5 py-3 text-left">Total</th>
                    <td className="tabular px-3 py-3 text-right">{formatINR(cashTotals.inv)}</td>
                    <td className="tabular px-3 py-3 text-right">{formatINR(cashTotals.inc)}</td>
                    <td className="tabular px-3 py-3 text-right">{formatINR(cashTotals.inv + cashTotals.inc)}</td>
                    <td className="tabular px-3 py-3 text-right">({formatINR(cashTotals.out)})</td>
                    <td className={cn("tabular px-3 py-3 text-right", cashTotals.net < 0 && "text-bad")}>{formatINR(cashTotals.net)}</td>
                    <td className="px-5 py-3" />
                  </tr>
                </tfoot>
              </table>
            </div>
          </Panel>
        </>
      )}
    </div>
  );
}
