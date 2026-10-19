import { cn } from "@/lib/utils";
import { HqIcon } from "./Icon";
import { Loader2 } from "lucide-react";

/** Page title block used at the top of every HQ module. */
export function PageHeader({ title, description, icon, actions, eyebrow, className }: { title: React.ReactNode; description?: React.ReactNode; icon?: string; actions?: React.ReactNode; eyebrow?: string; className?: string }) {
  return (
    <div className={cn("mb-6 flex flex-col gap-4 border-b border-graphite/10 pb-6 md:flex-row md:items-end md:justify-between", className)}>
      <div className="flex items-start gap-4">
        {icon && (
          <span className="relative grid size-12 shrink-0 place-items-center rounded-[var(--radius-md)] bg-graphite">
            <HqIcon name={icon} className="size-5 text-lime" />
          </span>
        )}
        <div>
          {eyebrow && <p className="annot mb-1 text-blueprint">{eyebrow}</p>}
          <h1 className="text-2xl font-bold tracking-tight text-graphite sm:text-[28px]">{title}</h1>
          {description && <p className="mt-1 max-w-2xl text-sm text-charcoal">{description}</p>}
        </div>
      </div>
      {actions && <div className="no-print flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

/** KPI tile. `progress` (0–1) draws a blueprint progress bar. */
export function StatCard({ label, value, sub, progress, icon, tone = "light", className }: { label: string; value: React.ReactNode; sub?: React.ReactNode; progress?: number; icon?: React.ReactNode; tone?: "light" | "dark"; className?: string }) {
  const dark = tone === "dark";
  return (
    <div className={cn("relative overflow-hidden rounded-[var(--radius-md)] border p-5", dark ? "border-graphite bg-graphite text-paper" : "border-graphite/12 bg-paper-50", className)}>
      <div className="relative">
        <div className="flex items-center justify-between gap-2">
          <p className={cn("annot", dark ? "text-lime" : "text-blueprint")}>{label}</p>
          {icon && <span className={dark ? "text-paper/60" : "text-blueprint"}>{icon}</span>}
        </div>
        <p className="tabular mt-3 text-[26px] font-bold leading-none tracking-tight">{value}</p>
        {sub && <p className={cn("mt-2 text-xs", dark ? "text-paper/60" : "text-charcoal")}>{sub}</p>}
        {progress !== undefined && (
          <div className={cn("relative mt-4 h-2 overflow-hidden rounded-full", dark ? "bg-paper/15" : "bg-graphite/10")}>
            <div className={cn("absolute inset-y-0 left-0 rounded-full transition-[width] duration-700", dark ? "bg-lime" : "bg-graphite")} style={{ width: `${Math.min(100, Math.max(0, progress * 100))}%` }} />
            {[0.25, 0.5, 0.75].map((t) => (
              <span key={t} className={cn("absolute inset-y-0 w-px", dark ? "bg-graphite/40" : "bg-paper")} style={{ left: `${t * 100}%` }} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function EmptyState({ icon = "Inbox", title, description, action, className }: { icon?: string; title: string; description?: React.ReactNode; action?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("relative flex flex-col items-center justify-center rounded-[var(--radius-md)] border border-dashed border-graphite/25 bg-paper-50/60 px-6 py-14 text-center", className)}>
      <span className="relative grid size-14 place-items-center rounded-full border border-graphite/20 bg-paper">
        <HqIcon name={icon} className="size-6 text-charcoal" />
      </span>
      <h3 className="relative mt-4 text-base font-semibold">{title}</h3>
      {description && <p className="relative mt-1 max-w-sm text-sm text-charcoal">{description}</p>}
      {action && <div className="relative mt-5">{action}</div>}
    </div>
  );
}

export function Loading({ label = "Loading…", className }: { label?: string; className?: string }) {
  return (
    <div className={cn("flex items-center justify-center gap-2 py-16 text-sm text-blueprint", className)}>
      <Loader2 className="size-4 animate-spin" /> {label}
    </div>
  );
}

export function Panel({ title, subtitle, action, children, className, bodyClassName }: { title?: React.ReactNode; subtitle?: React.ReactNode; action?: React.ReactNode; children: React.ReactNode; className?: string; bodyClassName?: string }) {
  return (
    <section className={cn("rounded-[var(--radius-md)] border border-graphite/12 bg-paper-50", className)}>
      {(title || action) && (
        <div className="flex items-center justify-between gap-3 border-b border-graphite/10 px-5 py-3.5">
          <div className="min-w-0">
            {title && <h2 className="truncate text-sm font-semibold">{title}</h2>}
            {subtitle && <p className="text-xs text-blueprint">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      <div className={cn("p-5", bodyClassName)}>{children}</div>
    </section>
  );
}

/** Tiny key/value row used in detail panes. */
export function KV({ k, v, className }: { k: React.ReactNode; v: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-start justify-between gap-4 border-b border-dashed border-graphite/10 py-2 text-sm last:border-0", className)}>
      <span className="text-blueprint">{k}</span>
      <span className="text-right font-medium text-graphite">{v}</span>
    </div>
  );
}
