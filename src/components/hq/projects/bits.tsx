"use client";

import { CalendarClock } from "lucide-react";
import { Badge, statusTone } from "@/components/ui/Badge";
import { HqIcon } from "@/components/hq/Icon";
import { cn } from "@/lib/utils";
import { daysBetween, dueState, serviceLabel, servicesOf, SERVICE_ICON, shortDate, stageLabel, str, type Rec } from "./logic";

export function ProgressBar({ value, className, dark, label }: { value: number; className?: string; dark?: boolean; label?: string }) {
  const pct = Math.round(Math.min(1, Math.max(0, value)) * 100);
  return (
    <div className={cn("relative h-1.5 overflow-hidden rounded-full", dark ? "bg-paper/15" : "bg-graphite/10", className)} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label={label}>
      <div className={cn("absolute inset-y-0 left-0 rounded-full transition-[width] duration-700 ease-[var(--ease-out-expo)]", dark ? "bg-lime" : "bg-graphite")} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function StageBadge({ stage }: { stage: unknown }) {
  return (
    <Badge tone={statusTone(stage || "kickoff")} dot>
      {stageLabel(stage)}
    </Badge>
  );
}

export function ServiceChips({ project, max = 3, className }: { project: Rec; max?: number; className?: string }) {
  const s = servicesOf(project);
  if (!s.length) return null;
  return (
    <span className={cn("flex flex-wrap gap-1", className)}>
      {s.slice(0, max).map((x) => (
        <span key={x} className="inline-flex items-center gap-1 rounded-full bg-lime/35 px-2 py-0.5 text-[10px] font-semibold text-graphite">
          <HqIcon name={SERVICE_ICON[x] ?? "Layers"} className="size-3" />
          {serviceLabel(x)}
        </span>
      ))}
      {s.length > max && <span className="text-[10px] text-blueprint">+{s.length - max}</span>}
    </span>
  );
}

export function DueChip({ project, today, className }: { project: Rec; today: string | null; className?: string }) {
  const d = str(project.dueDate).slice(0, 10);
  const state = dueState(project, today);
  if (!d) return <span className={cn("text-[11px] text-blueprint", className)}>No delivery date</span>;
  if (state === "done") return <span className={cn("text-[11px] text-charcoal", className)}>Delivered {shortDate(d)}</span>;
  if (state === "overdue")
    return (
      <Badge tone="bad" className={className}>
        <CalendarClock className="size-3" /> {shortDate(d)} · {today ? daysBetween(d, today) : 0}d late
      </Badge>
    );
  if (state === "today")
    return (
      <Badge tone="warn" className={className}>
        <CalendarClock className="size-3" /> Due today
      </Badge>
    );
  if (state === "soon")
    return (
      <Badge tone="info" className={className}>
        <CalendarClock className="size-3" /> Due {shortDate(d)}
      </Badge>
    );
  return <span className={cn("tabular text-[11px] text-charcoal", className)}>Due {shortDate(d)}</span>;
}
