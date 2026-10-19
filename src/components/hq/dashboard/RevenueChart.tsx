"use client";

import { useState } from "react";
import { useReducedMotion } from "motion/react";
import { Bar, BarChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis, type TooltipContentProps } from "recharts";
import { cn, formatINR, formatINRCompact } from "@/lib/utils";
import type { ChartRow } from "./useDashboard";
import { monthLabel } from "./time";

/* Ink for revenue, warm grey hatch for expenses: identity by lightness + texture, with the lime target line. */
const GRAPHITE = "#0D0D0D";
const EXPENSE = "#9A9890";
const GRID = "rgba(13,13,13,0.08)";
const AXIS = "#72716B";

function ChartTip({ active, payload }: TooltipContentProps<number, string>) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload as ChartRow | undefined;
  if (!row) return null;
  const net = row.revenue - row.expenses;
  return (
    <div className="min-w-44 rounded-[var(--radius-sm)] border border-graphite/20 bg-paper-50 px-3 py-2.5 text-xs shadow-[var(--shadow-lift)]">
      <p className="annot mb-1.5 text-[10px] text-blueprint">{monthLabel(row.month, { month: "long", year: "numeric" })}</p>
      <p className="flex items-center justify-between gap-4">
        <span className="flex items-center gap-1.5 text-charcoal">
          <span className="size-2 rounded-[2px] bg-graphite" aria-hidden /> Revenue
        </span>
        <span className="tabular font-semibold text-graphite">{formatINR(row.revenue)}</span>
      </p>
      <p className="mt-1 flex items-center justify-between gap-4">
        <span className="flex items-center gap-1.5 text-charcoal">
          <span className="hatch-dense size-2 rounded-[2px] border border-graphite/40" aria-hidden /> Expenses
        </span>
        <span className="tabular font-semibold text-graphite">{formatINR(row.expenses)}</span>
      </p>
      <p className="mt-1.5 flex items-center justify-between gap-4 border-t border-dashed border-graphite/15 pt-1.5">
        <span className="text-charcoal">Net</span>
        <span className={cn("tabular font-bold", net < 0 ? "text-bad" : "text-graphite")}>{formatINR(net)}</span>
      </p>
    </div>
  );
}

/**
 * Six-month revenue (ex-GST receipts + other income) vs expenses, with the
 * monthly revenue target as a dashed reference line. Includes a table view.
 */
export default function RevenueChart({ data, target }: { data: ChartRow[]; target: number }) {
  const reduce = useReducedMotion();
  const [view, setView] = useState<"chart" | "table">("chart");
  const maxVal = Math.max(target, ...data.map((d) => Math.max(d.revenue, d.expenses)));
  const empty = data.every((d) => !d.revenue && !d.expenses);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 pt-4 sm:px-5">
        <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-charcoal" aria-label="Legend">
          <li className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-[2px] bg-graphite" aria-hidden /> Revenue (ex-GST)
          </li>
          <li className="flex items-center gap-1.5">
            <span className="hatch-dense size-2.5 rounded-[2px] border border-graphite/40" aria-hidden /> Expenses
          </li>
          {target > 0 && (
            <li className="flex items-center gap-1.5">
              <span className="w-4 border-t-2 border-dashed border-graphite" aria-hidden /> Target {formatINRCompact(target)}/mo
            </li>
          )}
        </ul>
        <div className="flex rounded-[var(--radius-sm)] border border-graphite/15 p-0.5" role="group" aria-label="Chart view">
          {(["chart", "table"] as const).map((v) => (
            <button
              key={v}
              type="button"
              aria-pressed={view === v}
              onClick={() => setView(v)}
              className={cn("rounded-[3px] px-2.5 py-1 text-[11px] font-semibold capitalize transition-colors", view === v ? "bg-graphite text-paper" : "text-charcoal hover:bg-graphite/5")}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {view === "chart" ? (
        <div className="relative h-[260px] px-2 pb-3 pt-2 sm:px-3">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 16, right: 12, bottom: 0, left: 4 }} barGap={2} barCategoryGap="28%" accessibilityLayer>
              <defs>
                <pattern id="fm-expense-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                  <rect width="6" height="6" fill="#E4DED2" />
                  <line x1="0" y1="0" x2="0" y2="6" stroke={EXPENSE} strokeWidth="2" />
                </pattern>
              </defs>
              <CartesianGrid vertical={false} stroke={GRID} />
              <XAxis dataKey="label" tickLine={false} axisLine={{ stroke: "rgba(43,43,43,0.25)" }} tick={{ fill: AXIS, fontSize: 11, fontFamily: "var(--font-mono)" }} />
              <YAxis
                width={52}
                tickLine={false}
                axisLine={false}
                domain={[0, Math.ceil((maxVal || 1) * 1.15)]}
                tickFormatter={(v: number) => formatINRCompact(v)}
                tick={{ fill: AXIS, fontSize: 10, fontFamily: "var(--font-mono)" }}
              />
              <Tooltip cursor={{ fill: "rgba(43,43,43,0.05)" }} content={(p) => <ChartTip {...(p as TooltipContentProps<number, string>)} />} />
              {target > 0 && (
                <ReferenceLine
                  y={target}
                  stroke={GRAPHITE}
                  strokeDasharray="5 4"
                  strokeWidth={1.25}
                  label={{ value: `Target ${formatINRCompact(target)}`, position: "insideTopRight", fill: GRAPHITE, fontSize: 10, fontWeight: 600 }}
                />
              )}
              <Bar dataKey="revenue" name="Revenue" fill={GRAPHITE} radius={[4, 4, 0, 0]} maxBarSize={30} isAnimationActive={!reduce} />
              <Bar dataKey="expenses" name="Expenses" fill="url(#fm-expense-hatch)" stroke={EXPENSE} strokeWidth={1} radius={[4, 4, 0, 0]} maxBarSize={30} isAnimationActive={!reduce} />
            </BarChart>
          </ResponsiveContainer>
          {empty && (
            <p className="pointer-events-none absolute inset-x-0 top-1/2 mx-auto w-fit -translate-y-1/2 rounded-[var(--radius-sm)] border border-graphite/15 bg-paper-50/95 px-3 py-1.5 text-center text-xs text-charcoal">
              No invoices, income or expenses recorded yet — the bars fill in as Finance is used.
            </p>
          )}
        </div>
      ) : (
        <div className="hq-scroll overflow-x-auto px-4 pb-4 pt-3 sm:px-5" data-lenis-prevent>
          <table className="w-full min-w-[420px] text-sm">
            <caption className="sr-only">Revenue and expenses by month</caption>
            <thead>
              <tr className="border-b border-graphite/15 text-left">
                <th scope="col" className="annot py-2 text-[10px] text-blueprint">Month</th>
                <th scope="col" className="annot py-2 text-right text-[10px] text-blueprint">Revenue</th>
                <th scope="col" className="annot py-2 text-right text-[10px] text-blueprint">Expenses</th>
                <th scope="col" className="annot py-2 text-right text-[10px] text-blueprint">Net</th>
                <th scope="col" className="annot py-2 text-right text-[10px] text-blueprint">vs target</th>
              </tr>
            </thead>
            <tbody>
              {data.map((r) => (
                <tr key={r.month} className="border-b border-dashed border-graphite/10 last:border-0">
                  <th scope="row" className="py-2 text-left font-medium">{monthLabel(r.month, { month: "short", year: "numeric" })}</th>
                  <td className="tabular py-2 text-right">{formatINR(r.revenue)}</td>
                  <td className="tabular py-2 text-right">{formatINR(r.expenses)}</td>
                  <td className={cn("tabular py-2 text-right font-semibold", r.revenue - r.expenses < 0 && "text-bad")}>{formatINR(r.revenue - r.expenses)}</td>
                  <td className="tabular py-2 text-right text-charcoal">{target > 0 ? `${Math.round((r.revenue / target) * 100)}%` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
