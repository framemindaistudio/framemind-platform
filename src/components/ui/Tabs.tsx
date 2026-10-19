"use client";

import { cn } from "@/lib/utils";

export function Tabs<T extends string>({ tabs, value, onChange, className }: { tabs: { value: T; label: React.ReactNode; count?: number }[]; value: T; onChange: (v: T) => void; className?: string }) {
  return (
    <div className={cn("no-scrollbar flex gap-1 overflow-x-auto border-b border-graphite/15", className)} role="tablist">
      {tabs.map((t) => {
        const active = t.value === value;
        return (
          <button
            key={t.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(t.value)}
            className={cn(
              "relative -mb-px flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium transition-colors",
              active ? "border-graphite text-graphite" : "border-transparent text-blueprint hover:text-graphite",
            )}
          >
            {t.label}
            {t.count !== undefined && <span className={cn("rounded-full px-1.5 text-[10px] font-semibold", active ? "bg-graphite text-paper" : "bg-graphite/10")}>{t.count}</span>}
          </button>
        );
      })}
    </div>
  );
}
