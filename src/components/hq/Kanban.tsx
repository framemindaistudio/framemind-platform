"use client";

import { useState } from "react";
import type { BaseRecord, FieldOption } from "@/lib/hq/collections";
import { cn } from "@/lib/utils";

/**
 * Drag-and-drop board grouped by a select field (stage / status).
 * onMove is called with the record and the new column value — persist it there.
 */
export function Kanban<T extends BaseRecord>({
  records,
  field,
  columns,
  renderCard,
  onMove,
  onOpen,
  columnFooter,
  disabled,
  className,
}: {
  records: T[];
  field: string;
  columns: FieldOption[];
  renderCard: (r: T) => React.ReactNode;
  onMove: (r: T, value: string) => void | Promise<void>;
  onOpen?: (r: T) => void;
  columnFooter?: (value: string, items: T[]) => React.ReactNode;
  disabled?: boolean;
  className?: string;
}) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [over, setOver] = useState<string | null>(null);

  return (
    <div className={cn("hq-scroll -mx-1 flex gap-3 overflow-x-auto px-1 pb-3", className)} data-lenis-prevent>
      {columns.map((col) => {
        const items = records.filter((r) => String(r[field] ?? "") === col.value);
        return (
          <div
            key={col.value}
            onDragOver={(e) => {
              if (disabled) return;
              e.preventDefault();
              setOver(col.value);
            }}
            onDragLeave={() => setOver((o) => (o === col.value ? null : o))}
            onDrop={(e) => {
              e.preventDefault();
              setOver(null);
              const r = records.find((x) => x.id === dragId);
              if (r && String(r[field]) !== col.value) onMove(r, col.value);
              setDragId(null);
            }}
            className={cn(
              "flex w-72 shrink-0 flex-col rounded-[var(--radius-md)] border bg-paper-200/40 transition-colors",
              over === col.value ? "border-graphite bg-graphite/[0.06]" : "border-graphite/10",
            )}
          >
            <div className="flex items-center justify-between border-b border-graphite/10 px-3 py-2.5">
              <span className="annot text-[10px] text-charcoal">{col.label}</span>
              <span className="rounded-full bg-graphite/10 px-2 font-mono text-[10px] font-semibold">{items.length}</span>
            </div>
            <div className="hq-scroll flex max-h-[68vh] min-h-24 flex-1 flex-col gap-2 overflow-y-auto p-2" data-lenis-prevent>
              {items.map((r) => (
                <div
                  key={r.id}
                  draggable={!disabled}
                  onDragStart={() => setDragId(r.id)}
                  onDragEnd={() => setDragId(null)}
                  onClick={() => onOpen?.(r)}
                  className={cn(
                    "cursor-pointer rounded-[var(--radius-sm)] border border-graphite/12 bg-paper-50 p-3 text-sm shadow-[0_1px_0_rgb(43_43_43/0.04)] transition-all hover:border-graphite/30 hover:shadow-[var(--shadow-paper)]",
                    dragId === r.id && "opacity-40",
                  )}
                >
                  {renderCard(r)}
                </div>
              ))}
            </div>
            {columnFooter && <div className="border-t border-graphite/10 px-3 py-2 text-xs text-blueprint">{columnFooter(col.value, items)}</div>}
          </div>
        );
      })}
    </div>
  );
}
