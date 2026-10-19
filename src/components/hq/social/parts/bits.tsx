"use client";

import { useId } from "react";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import type { FieldSpec } from "@/lib/social/types";
import { cn } from "@/lib/utils";

/** One option of a "pick one" row: a card that turns dark when it is the one picked. Put them in a role="radiogroup". */
export function Choice({ checked, onSelect, title, note, lead, className }: { checked: boolean; onSelect: () => void; title: React.ReactNode; note?: React.ReactNode; lead?: React.ReactNode; className?: string }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      onClick={onSelect}
      className={cn(
        "flex items-start gap-3 rounded-[var(--radius-sm)] border px-3 py-2.5 text-left transition-colors",
        checked ? "border-graphite bg-graphite text-paper" : "border-graphite/20 bg-paper-50 text-graphite hover:border-graphite/50",
        className,
      )}
    >
      {lead}
      <span className="min-w-0">
        <span className="block text-sm font-semibold">{title}</span>
        {note && <span className={cn("mt-0.5 block text-xs leading-snug", checked ? "text-paper/80" : "text-charcoal")}>{note}</span>}
      </span>
    </button>
  );
}

/** A plain list with the small square marker of the drafting sheet. */
export function Bullets({ items, className }: { items: React.ReactNode[]; className?: string }) {
  return (
    <ul className={cn("space-y-1.5 text-sm leading-relaxed text-charcoal", className)}>
      {items.map((item, i) => (
        <li key={i} className="flex gap-2.5">
          <span aria-hidden className="mt-[0.6em] size-1 shrink-0 bg-graphite/45" />
          <span className="min-w-0">{item}</span>
        </li>
      ))}
    </ul>
  );
}

/** A box to type in, made from a field description (text, several lines, or a pick list). */
export function TextBox({ spec, value, onChange }: { spec: FieldSpec; value: string; onChange: (v: string) => void }) {
  const id = useId();
  const over = !!spec.max && value.length > spec.max;
  return (
    <Field label={spec.label} htmlFor={id} help={over ? `Long (${value.length} of about ${spec.max} characters). Shorter reads better.` : spec.help}>
      {spec.kind === "textarea" ? (
        <Textarea id={id} rows={spec.rows ?? 3} value={value} placeholder={spec.placeholder} onChange={(e) => onChange(e.target.value)} />
      ) : spec.kind === "select" ? (
        <Select id={id} value={value} onChange={(e) => onChange(e.target.value)}>
          {(spec.options ?? []).map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
      ) : (
        <Input id={id} type={spec.kind === "date" ? "date" : "text"} value={value} placeholder={spec.placeholder} onChange={(e) => onChange(e.target.value)} />
      )}
    </Field>
  );
}
