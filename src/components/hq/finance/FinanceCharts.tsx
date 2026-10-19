"use client";

/**
 * Finance charts (recharts) in brand greys. Loaded lazily from the overview
 * (next/dynamic, ssr:false) so recharts never ships with the first paint.
 * Identity is never colour-alone: revenue is solid graphite, expenses are
 * pencil-hatched, net is a line with ringed markers; every chart has a tooltip.
 */
import { useId } from "react";
import { useReducedMotion } from "motion/react";
import { Bar, BarChart, CartesianGrid, Cell, ComposedChart, LabelList, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis, type TooltipContentProps } from "recharts";
import { formatINR, formatINRCompact } from "@/lib/utils";
import type { MonthRow } from "./finance";

const C = {
  ink: "#161616",
  graphite: "#2B2B2B",
  charcoal: "#4A4A4A",
  blueprint: "#7A7A7A",
  accent: "#C9C9C9",
  paper: "#FBF9F4",
  paper300: "#E0D8C6",
};
const AXIS_TICK = { fontSize: 11, fill: C.blueprint, fontFamily: "var(--font-mono), ui-monospace, monospace" };
const GRID = { stroke: C.graphite, strokeOpacity: 0.08 };

function Hatch({ id }: { id: string }) {
  return (
    <pattern id={id} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <rect width="6" height="6" fill={C.paper300} />
      <line x1="0" y1="0" x2="0" y2="6" stroke={C.blueprint} strokeWidth="1.6" />
    </pattern>
  );
}

function Swatch({ kind }: { kind: "solid" | "hatch" | "line" | "light" }) {
  if (kind === "line")
    return (
      <svg width="18" height="10" aria-hidden className="shrink-0">
        <line x1="1" y1="5" x2="17" y2="5" stroke={C.blueprint} strokeWidth="2" />
        <circle cx="9" cy="5" r="3" fill={C.blueprint} stroke={C.paper} strokeWidth="1.5" />
      </svg>
    );
  if (kind === "hatch") return <HatchSwatch />;
  return <span aria-hidden className="size-3 shrink-0 rounded-[3px]" style={{ background: kind === "solid" ? C.graphite : C.accent }} />;
}

function HatchSwatch() {
  const id = `sw-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  return (
      <svg width="12" height="12" aria-hidden className="shrink-0 rounded-[3px]">
        <defs>
          <pattern id={id} width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="4" height="4" fill={C.paper300} />
            <line x1="0" y1="0" x2="0" y2="4" stroke={C.blueprint} strokeWidth="1.4" />
          </pattern>
        </defs>
        <rect width="12" height="12" rx="3" fill={`url(#${id})`} />
      </svg>
  );
}

export function ChartLegend({ items }: { items: { label: string; kind: "solid" | "hatch" | "line" | "light" }[] }) {
  return (
    <ul className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-charcoal">
      {items.map((i) => (
        <li key={i.label} className="inline-flex items-center gap-2">
          <Swatch kind={i.kind} />
          {i.label}
        </li>
      ))}
    </ul>
  );
}

function TipBox({ title, rows, foot }: { title: string; rows: { label: string; value: number; kind?: "solid" | "hatch" | "line" | "light" }[]; foot?: string }) {
  return (
    <div className="min-w-[180px] rounded-[var(--radius-sm)] border border-graphite/15 bg-paper-50 px-3 py-2.5 text-xs shadow-[var(--shadow-lift)]">
      <p className="annot mb-1.5 text-[10px] text-blueprint">{title}</p>
      <ul className="space-y-1">
        {rows.map((r) => (
          <li key={r.label} className="flex items-center justify-between gap-4">
            <span className="inline-flex items-center gap-2 text-charcoal">
              {r.kind && <Swatch kind={r.kind} />}
              {r.label}
            </span>
            <span className="tabular font-semibold text-graphite">{formatINR(r.value)}</span>
          </li>
        ))}
      </ul>
      {foot && <p className="mt-1.5 border-t border-dashed border-graphite/15 pt-1.5 text-[11px] text-blueprint">{foot}</p>}
    </div>
  );
}

/* ─────────────────────────── 12-month revenue vs expenses ─────────────────────────── */

export function RevenueExpenseChart({ data }: { data: MonthRow[] }) {
  const reduce = useReducedMotion();
  const hatchId = `hatch-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const tip = ({ active, payload, label }: TooltipContentProps) => {
    if (!active || !payload?.length) return null;
    const r = payload[0].payload as MonthRow;
    return (
      <TipBox
        title={String(label)}
        rows={[
          { label: "Revenue", value: r.revenue, kind: "solid" },
          { label: "Expenses", value: r.expenses, kind: "hatch" },
          { label: r.net < 0 ? "Net loss" : "Net profit", value: r.net, kind: "line" },
        ]}
        foot={r.revenue > 0 ? `Margin ${Math.round((r.net / r.revenue) * 100)}%` : undefined}
      />
    );
  };
  return (
    <div>
      <ChartLegend
        items={[
          { label: "Revenue (ex-GST)", kind: "solid" },
          { label: "Expenses", kind: "hatch" },
          { label: "Net", kind: "line" },
        ]}
      />
      <div className="mt-4 h-[280px] w-full" role="img" aria-label="Monthly revenue, expenses and net for the last twelve months. Exact figures are in the cash flow table below.">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: 4, left: 0, bottom: 0 }} barGap={2} barCategoryGap="22%">
            <defs>
              <Hatch id={hatchId} />
            </defs>
            <CartesianGrid vertical={false} {...GRID} />
            <XAxis dataKey="label" tickLine={false} axisLine={{ stroke: C.graphite, strokeOpacity: 0.2 }} tick={AXIS_TICK} interval="preserveStartEnd" minTickGap={8} />
            <YAxis tickFormatter={(v: number) => formatINRCompact(v)} width={58} tickLine={false} axisLine={false} tick={AXIS_TICK} />
            <ReferenceLine y={0} stroke={C.graphite} strokeOpacity={0.35} />
            <Tooltip content={tip} cursor={{ fill: C.graphite, fillOpacity: 0.04 }} />
            <Bar dataKey="revenue" name="Revenue" fill={C.graphite} radius={[4, 4, 0, 0]} maxBarSize={18} isAnimationActive={!reduce} />
            <Bar dataKey="expenses" name="Expenses" fill={`url(#${hatchId})`} radius={[4, 4, 0, 0]} maxBarSize={18} isAnimationActive={!reduce} />
            <Line
              dataKey="net"
              name="Net"
              type="monotone"
              stroke={C.blueprint}
              strokeWidth={2}
              dot={{ r: 3.5, fill: C.blueprint, stroke: C.paper, strokeWidth: 2 }}
              activeDot={{ r: 5, fill: C.charcoal, stroke: C.paper, strokeWidth: 2 }}
              isAnimationActive={!reduce}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/* ─────────────────────────── horizontal bar list ─────────────────────────── */

function CategoryTick({ x, y, payload }: { x?: number | string; y?: number | string; payload?: { value: string } }) {
  const v = String(payload?.value ?? "");
  const short = v.length > 22 ? `${v.slice(0, 21)}…` : v;
  return (
    <text x={Number(x)} y={Number(y)} dy={4} textAnchor="end" fontSize={11} fill={C.charcoal}>
      <title>{v}</title>
      {short}
    </text>
  );
}

export function HBarChart({ rows, label, hatched }: { rows: { label: string; amount: number }[]; label: string; hatched?: boolean }) {
  const reduce = useReducedMotion();
  const hatchId = `hb-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const total = rows.reduce((s, r) => s + r.amount, 0);
  const tip = ({ active, payload }: TooltipContentProps) => {
    if (!active || !payload?.length) return null;
    const r = payload[0].payload as { label: string; amount: number };
    return <TipBox title={r.label} rows={[{ label, value: r.amount, kind: hatched ? "hatch" : "solid" }]} foot={total ? `${Math.round((r.amount / total) * 100)}% of total` : undefined} />;
  };
  return (
    <div className="w-full" style={{ height: Math.max(120, rows.length * 34 + 16) }} role="img" aria-label={`${label}: ${rows.map((r) => `${r.label} ${formatINR(r.amount)}`).join(", ")}`}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 60, left: 4, bottom: 4 }} barCategoryGap={8}>
          <defs>
            <Hatch id={hatchId} />
          </defs>
          <CartesianGrid horizontal={false} {...GRID} />
          <XAxis type="number" hide domain={[0, "dataMax"]} />
          <YAxis type="category" dataKey="label" width={142} tickLine={false} axisLine={{ stroke: C.graphite, strokeOpacity: 0.2 }} tick={CategoryTick} interval={0} />
          <Tooltip content={tip} cursor={{ fill: C.graphite, fillOpacity: 0.04 }} />
          <Bar dataKey="amount" name={label} fill={hatched ? `url(#${hatchId})` : C.graphite} radius={[0, 4, 4, 0]} maxBarSize={16} isAnimationActive={!reduce}>
            <LabelList dataKey="amount" position="right" offset={8} formatter={(v: unknown) => formatINRCompact(Number(v))} style={{ fontSize: 11, fill: C.charcoal, fontFamily: "var(--font-mono), ui-monospace, monospace" }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ─────────────────────────── receivables aging ─────────────────────────── */

const AGING_RAMP = ["#D6D0C3", "#A9A49A", "#7A7A7A", "#4A4A4A", "#161616"];

export function AgingChart({ buckets }: { buckets: { key: string; label: string; amount: number; count: number }[] }) {
  const reduce = useReducedMotion();
  const tip = ({ active, payload }: TooltipContentProps) => {
    if (!active || !payload?.length) return null;
    const b = payload[0].payload as { key: string; label: string; amount: number; count: number };
    return <TipBox title={b.key === "current" ? "Not yet due" : `${b.label} past due`} rows={[{ label: "Balance", value: b.amount }]} foot={`${b.count} invoice${b.count === 1 ? "" : "s"}`} />;
  };
  return (
    <div className="h-[230px] w-full" role="img" aria-label={`Receivables by days past due: ${buckets.map((b) => `${b.label} ${formatINR(b.amount)}`).join(", ")}`}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={buckets} margin={{ top: 22, right: 4, left: 0, bottom: 0 }} barCategoryGap="24%">
          <CartesianGrid vertical={false} {...GRID} />
          <XAxis dataKey="label" tickFormatter={(v: string) => v.replace(" days", "").replace("Not yet due", "Not due")} tickLine={false} axisLine={{ stroke: C.graphite, strokeOpacity: 0.2 }} tick={{ ...AXIS_TICK, fontSize: 10 }} interval={0} />
          <YAxis tickFormatter={(v: number) => formatINRCompact(v)} width={52} tickLine={false} axisLine={false} tick={AXIS_TICK} allowDecimals={false} />
          <Tooltip content={tip} cursor={{ fill: C.graphite, fillOpacity: 0.04 }} />
          <Bar dataKey="amount" name="Balance" radius={[4, 4, 0, 0]} maxBarSize={44} isAnimationActive={!reduce}>
            {buckets.map((b, i) => (
              <Cell key={b.key} fill={AGING_RAMP[i] ?? C.graphite} />
            ))}
            <LabelList dataKey="amount" position="top" offset={6} formatter={(v: unknown) => (Number(v) ? formatINRCompact(Number(v)) : "")} style={{ fontSize: 11, fill: C.charcoal, fontFamily: "var(--font-mono), ui-monospace, monospace" }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
