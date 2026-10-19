"use client";

import { useId, useState } from "react";
import Link from "next/link";
const PRICES_HREF = "/hq/prices";
import { cn } from "@/lib/utils";

const fieldBase =
  "h-10 w-full rounded-[var(--radius-sm)] border border-graphite/20 bg-paper-50 px-3 text-sm tabular text-graphite outline-none transition-colors focus:border-graphite focus:bg-white focus:ring-2 focus:ring-graphite/10 disabled:opacity-60";

/**
 * Number input that keeps what you type while focused (so you can clear it and retype)
 * and reports a clean number on every keystroke. `prefix` / `suffix` sit inside the field.
 */
export function NumField({
  value,
  onChange,
  label,
  prefix,
  suffix,
  min = 0,
  max,
  step = 1,
  className,
  inputClassName,
  ariaLabel,
  hint,
}: {
  value: number;
  onChange: (v: number) => void;
  label?: string;
  prefix?: string;
  suffix?: string;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
  inputClassName?: string;
  ariaLabel?: string;
  hint?: string;
}) {
  const id = useId();
  const [draft, setDraft] = useState<string | null>(null);
  const input = (
    <div className="relative">
      {prefix && <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-blueprint">{prefix}</span>}
      <input
        id={id}
        type="number"
        inputMode="decimal"
        min={min}
        max={max}
        step={step}
        aria-label={label ? undefined : ariaLabel}
        value={draft ?? String(Number.isFinite(value) ? value : 0)}
        onChange={(e) => {
          setDraft(e.target.value);
          let v = parseFloat(e.target.value);
          if (!Number.isFinite(v)) v = 0;
          if (max !== undefined) v = Math.min(max, v);
          onChange(Math.max(min, v));
        }}
        onBlur={() => setDraft(null)}
        className={cn(fieldBase, prefix && "pl-7", suffix && "pr-10", inputClassName)}
      />
      {suffix && <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-blueprint">{suffix}</span>}
    </div>
  );
  if (!label) return <div className={className}>{input}</div>;
  return (
    <div className={className}>
      <label htmlFor={id} className="annot mb-1.5 block text-charcoal">
        {label}
      </label>
      {input}
      {hint && <p className="mt-1 text-xs text-blueprint">{hint}</p>}
    </div>
  );
}

export function SliderField({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  format,
  className,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
  className?: string;
}) {
  const id = useId();
  return (
    <div className={className}>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="annot text-charcoal">
          {label}
        </label>
        <output htmlFor={id} className="tabular text-sm font-bold">
          {format ? format(value) : value}
        </output>
      </div>
      <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="h-2 w-full cursor-pointer accent-graphite focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-graphite" />
      <div className="tabular mt-1 flex justify-between text-[10px] text-blueprint">
        <span>{format ? format(min) : min}</span>
        <span>{format ? format(max) : max}</span>
      </div>
    </div>
  );
}

/** Section frame with a blueprint index, used for the six planner sections. */
export function Section({ id, index, title, intro, action, children }: { id: string; index: string; title: string; intro?: React.ReactNode; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-h`} className="scroll-mt-28">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3 border-b border-graphite/15 pb-3">
        <div className="min-w-0">
          <p className="annot mb-1 text-blueprint">
            <span className="tabular">{index}</span> / {title}
          </p>
          <h2 id={`${id}-h`} className="text-xl font-bold tracking-tight sm:text-2xl">
            {title}
          </h2>
          {intro && <p className="mt-1 max-w-3xl text-sm text-charcoal">{intro}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

/** Label + big value, used inside result strips. */
export function Metric({ label, value, sub, strong, className }: { label: string; value: React.ReactNode; sub?: React.ReactNode; strong?: boolean; className?: string }) {
  return (
    <div className={cn("min-w-0", className)}>
      <p className="annot text-[10px] text-blueprint">{label}</p>
      <p className={cn("tabular mt-1 break-words font-bold leading-tight tracking-tight", strong ? "text-2xl" : "text-lg")}>{value}</p>
      {sub && <p className="mt-0.5 text-xs text-charcoal">{sub}</p>}
    </div>
  );
}

/** Small icon-less text button used for "Add line" / "Remove". */
export function TextButton({ children, className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={cn("inline-flex h-8 items-center gap-1.5 rounded-[var(--radius-sm)] px-2.5 text-xs font-semibold text-charcoal transition-colors hover:bg-graphite/[0.06] hover:text-graphite focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-graphite disabled:opacity-50", className)}
      {...props}
    >
      {children}
    </button>
  );
}

/** Link to the screen where the founders keep what things cost: the planner's defaults all come from there. */
export function PricesLink({ children = "Money → Rate Card", className }: { children?: React.ReactNode; className?: string }) {
  return (
    <Link href={PRICES_HREF} className={cn("font-semibold underline underline-offset-2 hover:text-graphite", className)}>
      {children}
    </Link>
  );
}

/** A short line that says what is missing, or where a number comes from. */
export function Note({ tone = "neutral", children, className }: { tone?: "neutral" | "warn"; children: React.ReactNode; className?: string }) {
  return (
    <p role="status" className={cn("rounded-[var(--radius-sm)] border px-3 py-2 text-xs leading-relaxed", tone === "warn" ? "border-warn/30 bg-warn/10 text-warn" : "border-graphite/15 bg-graphite/[0.04] text-charcoal", className)}>
      {children}
    </p>
  );
}

/** "a, b and c" */
export const listAnd = (items: string[]) => (items.length > 1 ? `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}` : items.join(""));

export const TABLE_WRAP ="hq-scroll overflow-x-auto rounded-[var(--radius-md)] border border-graphite/12 bg-paper-50";
export const TH = "annot px-3 py-2.5 text-left text-[10px] font-semibold text-blueprint";
