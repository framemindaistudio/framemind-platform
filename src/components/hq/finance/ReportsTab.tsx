"use client";

import { useMemo, useState } from "react";
import { Download, Info } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { downloadText } from "@/components/hq/CollectionManager";
import { Panel, StatCard } from "@/components/hq/ui";
import type { CompanySettings } from "@/lib/hq/settings";
import { cn, formatINR } from "@/lib/utils";
import { FySelect } from "./controls";
import { fmtDate, fyLabel, fyMonths, fyPeriod, fyStartYear, gstSummary, inPeriod, monthLabel, plStatement, round2, str, summarize, toCsv, type Ledger, type PLRow } from "./finance";

const money = (v: number) => (v ? formatINR(v) : <span className="text-blueprint/50">—</span>);
const pct = (v: number | null) => (v === null ? "—" : `${Math.round(v * 100)}%`);

const th = "px-3 py-2.5 text-right font-medium whitespace-nowrap";
const td = "tabular px-3 py-2 text-right whitespace-nowrap";

export function ReportsTab({ ledger, settings, today }: { ledger: Ledger; settings: CompanySettings; today: string }) {
  const [fy, setFy] = useState(fyStartYear(today));
  const months = useMemo(() => fyMonths(fy), [fy]);
  const period = useMemo(() => fyPeriod(fy), [fy]);
  const label = fyLabel(fy);

  const pl = useMemo(() => plStatement(ledger, months), [ledger, months]);
  const gst = useMemo(() => gstSummary(ledger, months), [ledger, months]);
  const sum = useMemo(() => summarize(ledger, period), [ledger, period]);

  const gstTotals = useMemo(
    () => ({
      invoices: gst.reduce((s, r) => s + r.invoices, 0),
      taxable: round2(gst.reduce((s, r) => s + r.taxable, 0)),
      cgst: round2(gst.reduce((s, r) => s + r.cgst, 0)),
      sgst: round2(gst.reduce((s, r) => s + r.sgst, 0)),
      igst: round2(gst.reduce((s, r) => s + r.igst, 0)),
      output: round2(gst.reduce((s, r) => s + r.output, 0)),
      input: round2(gst.reduce((s, r) => s + r.input, 0)),
      net: round2(gst.reduce((s, r) => s + r.net, 0)),
    }),
    [gst],
  );

  const tds = useMemo(() => {
    const rows = ledger.invoices
      .map(({ inv, m }) => ({ inv, tds: round2(m.payments.filter((p) => inPeriod(p.date, period)).reduce((s, p) => s + (p.tds || 0), 0)), date: m.payments.filter((p) => p.tds && inPeriod(p.date, period)).map((p) => p.date).sort().pop() ?? "" }))
      .filter((r) => r.tds > 0)
      .sort((a, b) => b.date.localeCompare(a.date));
    return { rows, total: round2(rows.reduce((s, r) => s + r.tds, 0)) };
  }, [ledger, period]);

  function exportPl() {
    const body = (rows: PLRow[]) => rows.map((r) => [r.label, ...r.values, r.total]);
    const csv = toCsv([
      [`FrameMind — Profit & loss — ${label} (ex-GST; revenue on invoice date, expenses as paid)`],
      ["Particulars", ...months.map((m) => monthLabel(m)), "FY total"],
      ["REVENUE"],
      ...body(pl.revenue),
      [pl.revenueTotal.label, ...pl.revenueTotal.values, pl.revenueTotal.total],
      ["EXPENSES"],
      ...body(pl.expenses),
      [pl.expenseTotal.label, ...pl.expenseTotal.values, pl.expenseTotal.total],
      [pl.net.label, ...pl.net.values, pl.net.total],
      ["Net margin %", ...pl.margin.map((v) => (v === null ? "" : Math.round(v * 100))), pl.marginTotal === null ? "" : Math.round(pl.marginTotal * 100)],
    ]);
    downloadText(`framemind-pnl-${fy}-${String(fy + 1).slice(2)}.csv`, csv);
  }

  function exportGst() {
    const csv = toCsv([
      [`FrameMind — GST summary (estimate — confirm with your CA) — ${label}`],
      ["Month", "Invoices", "Taxable value", "CGST", "SGST", "IGST", "Output GST", "Input GST (from expenses)", "Net payable (estimate)"],
      ...gst.map((r) => [monthLabel(r.ym, true), r.invoices, r.taxable, r.cgst, r.sgst, r.igst, r.output, r.input, r.net]),
      ["Total", gstTotals.invoices, gstTotals.taxable, gstTotals.cgst, gstTotals.sgst, gstTotals.igst, gstTotals.output, gstTotals.input, gstTotals.net],
    ]);
    downloadText(`framemind-gst-summary-${fy}-${String(fy + 1).slice(2)}.csv`, csv);
  }

  const noData = !pl.revenue.length && !pl.expenses.length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <FySelect value={fy} onChange={setFy} today={today} />
        <p className="annot text-blueprint">
          {label} · <span className="tabular">{period.start}</span> → <span className="tabular">{period.end}</span>
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Revenue (ex-GST)" value={formatINR(sum.revenue)} sub={`${sum.invoiceCount} invoice${sum.invoiceCount === 1 ? "" : "s"} + other income`} />
        <StatCard label="Expenses" value={formatINR(sum.expenses)} sub="As paid, incl. tax" />
        <StatCard tone="dark" label={sum.net < 0 ? "Net loss" : "Net profit"} value={formatINR(sum.net)} sub="Revenue − expenses" />
        <StatCard label="Net margin" value={pct(sum.margin)} sub={sum.margin === null ? "No revenue yet" : "Of revenue (ex-GST)"} />
      </div>

      {/* P&L */}
      <Panel
        title="Profit & loss statement"
        subtitle={`${label} · month by month · revenue on invoice date at taxable value, GST excluded`}
        action={
          <Button size="sm" variant="secondary" onClick={exportPl} disabled={noData}>
            <Download className="size-3.5" /> CSV
          </Button>
        }
        bodyClassName="p-0"
      >
        {noData ? (
          <p className="px-5 py-12 text-center text-sm text-blueprint">No invoices, income or expenses fall in {label} yet.</p>
        ) : (
          <div className="hq-scroll overflow-x-auto" data-lenis-prevent>
            <table className="w-full min-w-[1100px] text-sm">
              <caption className="sr-only">Profit and loss statement for {label}</caption>
              <thead>
                <tr className="annot border-b border-graphite/12 bg-graphite/[0.035] text-[10px] text-blueprint">
                  <th scope="col" className="sticky left-0 z-10 min-w-[220px] bg-paper-100 px-5 py-2.5 text-left font-medium">
                    Particulars
                  </th>
                  {months.map((m) => (
                    <th key={m} scope="col" className={th}>
                      {monthLabel(m)}
                    </th>
                  ))}
                  <th scope="col" className={cn(th, "pr-5 text-graphite")}>FY total</th>
                </tr>
              </thead>
              <tbody>
                <Section label="Revenue" cols={months.length + 2} />
                {pl.revenue.map((r) => (
                  <PLLine key={r.label} row={r} />
                ))}
                <PLLine row={pl.revenueTotal} strong />
                <Section label="Expenses" cols={months.length + 2} />
                {pl.expenses.map((r) => (
                  <PLLine key={r.label} row={r} />
                ))}
                <PLLine row={pl.expenseTotal} strong />
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-graphite/40 bg-graphite/[0.05] font-bold">
                  <th scope="row" className="sticky left-0 z-10 bg-paper-200 px-5 py-3 text-left">
                    {pl.net.label}
                  </th>
                  {pl.net.values.map((v, i) => (
                    <td key={months[i]} className={cn(td, "py-3", v < 0 && "text-bad")}>
                      {v ? formatINR(v) : <span className="text-blueprint/50">—</span>}
                    </td>
                  ))}
                  <td className={cn(td, "py-3 pr-5", pl.net.total < 0 && "text-bad")}>{formatINR(pl.net.total)}</td>
                </tr>
                <tr className="text-xs text-charcoal">
                  <th scope="row" className="sticky left-0 z-10 bg-paper-100 px-5 py-2 text-left font-medium">
                    Net margin
                  </th>
                  {pl.margin.map((v, i) => (
                    <td key={months[i]} className={cn(td, "py-2")}>
                      {pct(v)}
                    </td>
                  ))}
                  <td className={cn(td, "py-2 pr-5 font-semibold")}>{pct(pl.marginTotal)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </Panel>

      {/* GST */}
      <Panel
        title="GST summary"
        subtitle={`${label} · output tax on invoices vs input tax in expense bills`}
        action={
          <Button size="sm" variant="secondary" onClick={exportGst} disabled={!gstTotals.invoices && !gstTotals.input}>
            <Download className="size-3.5" /> CSV
          </Button>
        }
        bodyClassName="p-0"
      >
        <div className="hq-scroll overflow-x-auto" data-lenis-prevent>
          <table className="w-full min-w-[860px] text-sm">
            <caption className="sr-only">Monthly GST summary for {label}</caption>
            <thead>
              <tr className="annot border-b border-graphite/12 bg-graphite/[0.035] text-[10px] text-blueprint">
                <th scope="col" className="px-5 py-2.5 text-left font-medium">Month</th>
                <th scope="col" className={th}>Invoices</th>
                <th scope="col" className={th}>Taxable value</th>
                <th scope="col" className={th}>CGST</th>
                <th scope="col" className={th}>SGST</th>
                <th scope="col" className={th}>IGST</th>
                <th scope="col" className={th}>Output GST</th>
                <th scope="col" className={th}>Input GST</th>
                <th scope="col" className={cn(th, "pr-5")}>Net payable (est.)</th>
              </tr>
            </thead>
            <tbody>
              {gst.map((r) => (
                <tr key={r.ym} className="border-b border-graphite/[0.06] last:border-0">
                  <th scope="row" className="px-5 py-2 text-left font-medium">
                    {monthLabel(r.ym, true)}
                  </th>
                  <td className={td}>{r.invoices || <span className="text-blueprint/50">—</span>}</td>
                  <td className={td}>{money(r.taxable)}</td>
                  <td className={td}>{money(r.cgst)}</td>
                  <td className={td}>{money(r.sgst)}</td>
                  <td className={td}>{money(r.igst)}</td>
                  <td className={cn(td, "font-medium")}>{money(r.output)}</td>
                  <td className={td}>{money(r.input)}</td>
                  <td className={cn(td, "pr-5 font-semibold", r.net < 0 && "text-info")}>{r.net ? formatINR(r.net) : <span className="text-blueprint/50">—</span>}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-graphite/30 bg-graphite/[0.04] font-semibold">
                <th scope="row" className="px-5 py-3 text-left">Total</th>
                <td className={td}>{gstTotals.invoices}</td>
                <td className={td}>{formatINR(gstTotals.taxable)}</td>
                <td className={td}>{formatINR(gstTotals.cgst)}</td>
                <td className={td}>{formatINR(gstTotals.sgst)}</td>
                <td className={td}>{formatINR(gstTotals.igst)}</td>
                <td className={td}>{formatINR(gstTotals.output)}</td>
                <td className={td}>{formatINR(gstTotals.input)}</td>
                <td className={cn(td, "pr-5")}>{formatINR(gstTotals.net)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
        <div className="space-y-2 border-t border-graphite/10 px-5 py-4 text-xs text-charcoal">
          <p className="flex items-start gap-2 font-semibold text-graphite">
            <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden /> Estimate only — confirm every figure with your CA before filing.
          </p>
          <ul className="list-disc space-y-1 pl-9">
            <li>Output GST is the tax on issued invoices, counted in the month of the invoice date. Your actual time-of-supply and filing month can differ.</li>
            <li>Input GST is whatever you typed in “GST in bill” on expenses. Credit is only available on eligible purchases from registered suppliers with valid tax invoices — some categories are blocked.</li>
            <li>A negative net (shown in blue) means input exceeds output for the month; your CA decides how that is carried forward.</li>
            <li>Whether and when GST registration and returns apply to the studio depends on your turnover and activity — {settings.gstin ? `GSTIN on file: ${settings.gstin}.` : "no GSTIN is saved in Settings yet."}</li>
          </ul>
        </div>
      </Panel>

      {/* TDS */}
      <Panel title="TDS deducted by clients" subtitle={`${label} · companies and institutions may deduct TDS when they pay — record it so the invoice still settles in full`}>
        <div className="grid gap-5 lg:grid-cols-[minmax(0,260px)_1fr]">
          <div>
            <p className="annot text-blueprint">TDS recorded</p>
            <p className="tabular mt-2 text-2xl font-bold">{formatINR(tds.total)}</p>
            <p className="mt-1 text-xs text-charcoal">{tds.rows.length ? `across ${tds.rows.length} invoice${tds.rows.length === 1 ? "" : "s"}` : "No TDS deducted on payments so far"}</p>
          </div>
          <div className="text-xs text-charcoal">
            <p>
              When a payer deducts TDS you receive less than the invoice total. Enter the <strong>amount that reached the bank</strong> and the <strong>TDS deducted</strong> separately under Record payment — the invoice is then settled and your cash flow stays honest.
            </p>
            <p className="mt-2">
              TDS is a credit against your income tax, claimed through the deductor&apos;s certificate (Form 16A) and visible in Form 26AS / AIS. Applicability and rates vary by payer and nature of service — check with your CA, and reconcile this list with the portal each quarter.
            </p>
          </div>
        </div>
        {tds.rows.length > 0 && (
          <div className="mt-5 overflow-x-auto border-t border-graphite/10 pt-3" data-lenis-prevent>
            <table className="w-full min-w-[480px] text-sm">
              <caption className="sr-only">Invoices with TDS deducted</caption>
              <thead>
                <tr className="annot text-left text-[10px] text-blueprint">
                  <th scope="col" className="py-2 font-medium">Invoice</th>
                  <th scope="col" className="py-2 font-medium">Bill to</th>
                  <th scope="col" className="py-2 font-medium">Last TDS entry</th>
                  <th scope="col" className="py-2 text-right font-medium">TDS</th>
                </tr>
              </thead>
              <tbody>
                {tds.rows.slice(0, 12).map(({ inv, tds: t, date }) => (
                  <tr key={inv.id} className="border-t border-graphite/[0.07]">
                    <td className="tabular py-2 font-semibold">
                      <a href={`/hq/finance?tab=invoices&id=${encodeURIComponent(inv.id)}`} className="underline-offset-2 hover:underline">
                        {str(inv.number) || "—"}
                      </a>
                    </td>
                    <td className="py-2">{str(inv.customerName)}</td>
                    <td className="tabular py-2 text-charcoal">{fmtDate(date)}</td>
                    <td className="tabular py-2 text-right font-medium">{formatINR(t, { decimals: true })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}

function Section({ label, cols }: { label: string; cols: number }) {
  return (
    <tr>
      <th colSpan={cols} scope="colgroup" className="annot border-b border-graphite/10 bg-graphite/[0.025] px-5 py-1.5 text-left text-[10px] font-semibold text-blueprint">
        {label}
      </th>
    </tr>
  );
}

function PLLine({ row, strong }: { row: PLRow; strong?: boolean }) {
  return (
    <tr className={cn("border-b border-graphite/[0.06]", strong && "bg-graphite/[0.035] font-semibold")}>
      <th scope="row" className={cn("sticky left-0 z-10 px-5 py-2 text-left", strong ? "bg-paper-200 font-semibold" : "bg-paper-50 font-normal")}>
        {row.label}
      </th>
      {row.values.map((v, i) => (
        <td key={i} className={td}>
          {money(v)}
        </td>
      ))}
      <td className={cn(td, "pr-5 font-semibold")}>{money(row.total)}</td>
    </tr>
  );
}
