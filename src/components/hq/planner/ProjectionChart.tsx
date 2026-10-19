"use client";

/**
 * 12-month projection chart (recharts, lazy-loaded from Projection.tsx).
 * Area = cumulative cash position after launch capex (below zero until it is paid back),
 * solid line = monthly revenue, dashed line = monthly profit. Identity is never colour-alone.
 */
import { useId } from "react";
import { useReducedMotion } from "motion/react";
import { Area, CartesianGrid, ComposedChart, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis, type TooltipContentProps } from "recharts";
import { formatINR, formatINRCompact } from "@/lib/utils";
import type { ProjectionRow } from "./model";

const C = { graphite: "#0D0D0D", charcoal: "#3A3A38", blueprint: "#72716B", accent: "#CFCEC7", paper: "#FBFBF8" };
const AXIS_TICK = { fontSize: 11, fill: C.blueprint, fontFamily: "var(--font-mono), ui-monospace, monospace" };

export default function ProjectionChart({ rows, spend, paybackLabel }: { rows: ProjectionRow[]; spend: number; paybackLabel: string | null }) {
  const reduce = useReducedMotion();
  const fillId = `cash-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const data = rows.map((r) => ({ label: r.label.replace(" 20", " ’"), full: r.label, revenue: Math.round(r.revenue), profit: Math.round(r.profit), cash: Math.round(r.cash) }));

  const tip = ({ active, payload }: TooltipContentProps) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload as (typeof data)[number];
    return (
      <div className="rounded-[var(--radius-sm)] border border-graphite/20 bg-paper-50 px-3 py-2 text-xs shadow-[var(--shadow-lift)]">
        <p className="mb-1 font-bold">{d.full}</p>
        <p className="tabular flex justify-between gap-6"><span>Revenue</span><span>{formatINR(d.revenue)}</span></p>
        <p className="tabular flex justify-between gap-6"><span>Profit</span><span>{formatINR(d.profit)}</span></p>
        <p className="tabular flex justify-between gap-6 font-bold"><span>Cash after capex</span><span>{formatINR(d.cash)}</span></p>
      </div>
    );
  };

  return (
    <div
      className="h-[300px] w-full"
      role="img"
      aria-label={
        spend > 0
          ? `Twelve month projection. Cash position after ${formatINR(spend)} of launch capex ends at ${formatINR(data[data.length - 1]?.cash ?? 0)}. ${paybackLabel ? `Capex is paid back in ${paybackLabel}.` : "Capex is not paid back within twelve months."} Exact figures are in the table above.`
          : `Twelve month projection. The cash position ends at ${formatINR(data[data.length - 1]?.cash ?? 0)}. Exact figures are in the table above.`
      }
    >
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <pattern id={fillId} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <rect width="6" height="6" fill={C.paper} />
              <line x1="0" y1="0" x2="0" y2="6" stroke={C.blueprint} strokeWidth="1.4" />
            </pattern>
          </defs>
          <CartesianGrid vertical={false} stroke={C.graphite} strokeOpacity={0.08} />
          <XAxis dataKey="label" tickLine={false} axisLine={{ stroke: C.graphite, strokeOpacity: 0.2 }} tick={AXIS_TICK} interval={0} minTickGap={4} />
          <YAxis tickFormatter={(v: number) => formatINRCompact(v)} width={60} tickLine={false} axisLine={false} tick={AXIS_TICK} />
          <ReferenceLine y={0} stroke={C.graphite} strokeOpacity={0.5} label={{ value: "Capex recovered", position: "insideTopLeft", fontSize: 10, fill: C.charcoal }} />
          <Tooltip content={tip} cursor={{ stroke: C.graphite, strokeOpacity: 0.2 }} />
          <Area type="monotone" dataKey="cash" stroke={C.graphite} strokeWidth={2} fill={`url(#${fillId})`} isAnimationActive={!reduce} baseValue={0} />
          <Line type="monotone" dataKey="revenue" stroke={C.graphite} strokeWidth={2} dot={{ r: 3, fill: C.graphite }} isAnimationActive={!reduce} />
          <Line type="monotone" dataKey="profit" stroke={C.blueprint} strokeWidth={2} strokeDasharray="5 4" dot={{ r: 3, fill: C.paper, stroke: C.blueprint, strokeWidth: 1.5 }} isAnimationActive={!reduce} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
