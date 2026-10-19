import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { HqIcon } from "@/components/hq/Icon";

/**
 * Blueprint "drawing sheet" used by every Command Center widget:
 * a numbered title block, an optional count and a link to the full module.
 */
export function Widget({
  index,
  title,
  subtitle,
  icon,
  count,
  countTone = "neutral",
  href,
  hrefLabel = "Open",
  action,
  children,
  className,
  bodyClassName,
}: {
  index: string;
  title: string;
  subtitle?: React.ReactNode;
  icon?: string;
  count?: number;
  countTone?: "neutral" | "bad";
  href?: string;
  hrefLabel?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  const headingId = `w-${index}-${title.replace(/\W+/g, "-").toLowerCase()}`;
  return (
    <section aria-labelledby={headingId} className={cn("relative flex min-w-0 flex-col rounded-[var(--radius-md)] border border-graphite/12 bg-paper-50 shadow-[0_1px_0_rgb(43_43_43/0.03)]", className)}>
      <header className="flex items-start justify-between gap-3 border-b border-graphite/10 px-4 py-3 sm:px-5">
        <div className="flex min-w-0 items-start gap-3">
          <span className="mt-0.5 font-mono text-[10px] tracking-widest text-blueprint" aria-hidden>
            {index}
          </span>
          <div className="min-w-0">
            <h2 id={headingId} className="flex items-center gap-2 text-sm font-semibold text-graphite">
              {icon && <HqIcon name={icon} className="size-4 shrink-0 text-charcoal" />}
              <span className="truncate">{title}</span>
              {count !== undefined && count > 0 && (
                <span className={cn("rounded-full px-1.5 font-mono text-[10px] font-semibold", countTone === "bad" ? "bg-bad/12 text-bad" : "bg-graphite/10 text-charcoal")}>{count}</span>
              )}
            </h2>
            {subtitle && <p className="mt-0.5 text-xs text-blueprint">{subtitle}</p>}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {action}
          {href && (
            <Link href={href} className="group inline-flex items-center gap-1 rounded-[var(--radius-sm)] px-1.5 py-1 text-[11px] font-semibold text-charcoal hover:bg-graphite/5 hover:text-graphite">
              {hrefLabel}
              <ArrowUpRight className="size-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
            </Link>
          )}
        </div>
      </header>
      <div className={cn("flex-1", bodyClassName)}>{children}</div>
    </section>
  );
}

/** Small, calm empty state inside a widget (hatched like an unfinished drawing area). */
export function WidgetEmpty({ icon = "Inbox", title, hint, action }: { icon?: string; title: string; hint?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="relative m-3 flex flex-col items-center justify-center overflow-hidden rounded-[var(--radius-sm)] border border-dashed border-graphite/20 px-4 py-8 text-center">
      <div className="hatch pointer-events-none absolute inset-0 opacity-[0.35]" aria-hidden />
      <span className="relative grid size-10 place-items-center rounded-full border border-graphite/15 bg-paper-50">
        <HqIcon name={icon} className="size-[18px] text-charcoal" />
      </span>
      <p className="relative mt-3 text-sm font-semibold text-graphite">{title}</p>
      {hint && <p className="relative mt-1 max-w-xs text-xs text-charcoal">{hint}</p>}
      {action && <div className="relative mt-3">{action}</div>}
    </div>
  );
}

/** Thin blueprint progress bar (0–1). */
export function MiniBar({ value, label, className }: { value: number; label: string; className?: string }) {
  const pct = Math.round(Math.min(1, Math.max(0, value)) * 100);
  return (
    <span className={cn("flex items-center gap-2", className)}>
      <span className="relative h-1.5 w-16 overflow-hidden rounded-full bg-graphite/10" role="progressbar" aria-label={label} aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <span className="absolute inset-y-0 left-0 rounded-full bg-graphite" style={{ width: `${pct}%` }} />
      </span>
      <span className="font-mono text-[10px] text-charcoal">{pct}%</span>
    </span>
  );
}

/** Skeleton rows while collections load. */
export function WidgetSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <ul className="divide-y divide-graphite/[0.07]" aria-hidden>
      {Array.from({ length: rows }, (_, i) => (
        <li key={i} className="flex items-center gap-3 px-4 py-3 sm:px-5">
          <span className="size-8 shrink-0 animate-pulse rounded-[var(--radius-sm)] bg-graphite/[0.07]" />
          <span className="flex-1 space-y-1.5">
            <span className="block h-3 w-2/3 animate-pulse rounded bg-graphite/[0.08]" />
            <span className="block h-2.5 w-1/3 animate-pulse rounded bg-graphite/[0.06]" />
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Date tile: "02 / OCT" in mono, used in delivery & follow-up rows. */
export function DateTile({ iso, tone = "neutral" }: { iso: string; tone?: "neutral" | "bad" | "dark" }) {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  const month = new Date(y, (m || 1) - 1, d || 1).toLocaleDateString("en-IN", { month: "short" });
  return (
    <span
      className={cn(
        "grid size-10 shrink-0 place-items-center rounded-[var(--radius-sm)] border text-center leading-none",
        tone === "dark" ? "border-graphite bg-graphite text-paper" : tone === "bad" ? "border-bad/30 bg-bad/[0.06] text-bad" : "border-graphite/15 bg-paper text-graphite",
      )}
      aria-hidden
    >
      <span>
        <span className="block font-mono text-sm font-bold">{String(d).padStart(2, "0")}</span>
        <span className="annot block text-[8px] tracking-[0.15em] opacity-70">{month}</span>
      </span>
    </span>
  );
}
