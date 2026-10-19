"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";
import { fyLabel, fyPeriod, fyStartYear, monthPeriod, shiftMonth, ym, type Period } from "./finance";

/* ─────────────────────────── segmented control ─────────────────────────── */

export function Segmented<T extends string>({ options, value, onChange, label, className }: { options: { value: T; label: string }[]; value: T; onChange: (v: T) => void; label: string; className?: string }) {
  return (
    <div role="radiogroup" aria-label={label} className={cn("inline-flex flex-wrap rounded-[var(--radius-sm)] border border-graphite/15 bg-paper-50 p-0.5", className)}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.value)}
            className={cn("rounded-[3px] px-3 py-1.5 text-xs font-semibold transition-colors", on ? "bg-graphite text-paper shadow-[var(--shadow-paper)]" : "text-charcoal hover:bg-graphite/5 hover:text-graphite")}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/* ─────────────────────────── period picker ─────────────────────────── */

export type PeriodMode = "this-month" | "last-month" | "fy" | "prev-fy" | "custom";
export interface PeriodState {
  mode: PeriodMode;
  month: string; // YYYY-MM for custom
}

export function resolvePeriod(s: PeriodState, today: string): Period {
  const cur = ym(today);
  const fy = fyStartYear(today);
  switch (s.mode) {
    case "last-month":
      return monthPeriod(shiftMonth(cur, -1));
    case "fy":
      return fyPeriod(fy);
    case "prev-fy":
      return fyPeriod(fy - 1);
    case "custom":
      return monthPeriod(/^\d{4}-\d{2}$/.test(s.month) ? s.month : cur);
    default:
      return monthPeriod(cur);
  }
}

export function PeriodPicker({ value, onChange, today }: { value: PeriodState; onChange: (v: PeriodState) => void; today: string }) {
  const id = useId();
  const fy = fyStartYear(today);
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Segmented<PeriodMode>
        label="Reporting period"
        value={value.mode}
        onChange={(mode) => onChange({ ...value, mode, month: value.month || ym(today) })}
        options={[
          { value: "this-month", label: "This month" },
          { value: "last-month", label: "Last month" },
          { value: "fy", label: fyLabel(fy) },
          { value: "prev-fy", label: fyLabel(fy - 1) },
          { value: "custom", label: "Pick month" },
        ]}
      />
      {value.mode === "custom" && (
        <>
          <label htmlFor={id} className="sr-only">
            Month
          </label>
          <input
            id={id}
            type="month"
            value={value.month}
            max={ym(today)}
            onChange={(e) => onChange({ ...value, month: e.target.value })}
            className="h-9 rounded-[var(--radius-sm)] border border-graphite/20 bg-paper-50 px-2 text-sm outline-none focus:border-graphite"
          />
        </>
      )}
    </div>
  );
}

/** Financial-year select (current FY and the four before it, plus next FY for early invoicing). */
export function FySelect({ value, onChange, today }: { value: number; onChange: (v: number) => void; today: string }) {
  const id = useId();
  const cur = fyStartYear(today);
  const years = [cur + 1, cur, cur - 1, cur - 2, cur - 3];
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-2">
      <label htmlFor={id} className="annot text-blueprint">
        Financial year
      </label>
      <select id={id} value={value} onChange={(e) => onChange(Number(e.target.value))} className="h-9 min-w-0 max-w-full rounded-[var(--radius-sm)] border border-graphite/20 bg-paper-50 px-2 text-sm font-semibold outline-none focus:border-graphite">
        {years.map((y) => (
          <option key={y} value={y}>
            {fyLabel(y)} · Apr {String(y).slice(2)} – Mar {String(y + 1).slice(2)}
          </option>
        ))}
      </select>
    </div>
  );
}

export function ChartSkeleton({ h = 240 }: { h?: number }) {
  return <div className="bp-grid-fine w-full animate-pulse rounded-[var(--radius-sm)] bg-graphite/[0.03]" style={{ height: h }} aria-hidden />;
}

/** Thin progress bar with blueprint ticks (0–1). */
export function Meter({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn("relative h-1.5 overflow-hidden rounded-full bg-graphite/10", className)}>
      <div className="absolute inset-y-0 left-0 rounded-full bg-graphite transition-[width] duration-700" style={{ width: `${Math.min(100, Math.max(0, value * 100))}%` }} />
    </div>
  );
}

