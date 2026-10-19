"use client";

import { useEffect, useRef, useState } from "react";
import { Check, CircleDashed, FileText, Hourglass, Plus, X } from "lucide-react";
import { Badge, type Tone } from "@/components/ui/Badge";
import { shortDate } from "@/components/hq/printables/util";
import { templateById } from "@/lib/sign/catalog";
import { progressOf, type Progress, type SignDoc, type Standing } from "@/lib/sign/context";
import type { SignTemplate } from "@/lib/sign/types";
import { cn } from "@/lib/utils";

const TONE: Record<Standing, Tone> = { draft: "neutral", waiting: "warn", signed: "ok", void: "outline" };

/** Where a document stands, in words: Draft, Waiting for Asha, Signed, Withdrawn. */
export function StandingBadge({ progress }: { progress: Progress }) {
  return (
    <Badge tone={TONE[progress.standing]} dot={progress.standing !== "void"}>
      {progress.label}
    </Badge>
  );
}

const ICON: Record<Standing, typeof Check> = { draft: FileText, waiting: Hourglass, signed: Check, void: X };

/**
 * One paper in a person's or a client's row. With a document: its name and where it stands; click to open it.
 * Without one: a dashed chip that makes it.
 */
export function DocChip({ template, doc, onOpen, onMake, canEdit }: { template: SignTemplate; doc?: SignDoc; onOpen: (doc: SignDoc) => void; onMake?: () => void; canEdit: boolean }) {
  if (!doc) {
    return (
      <button
        type="button"
        disabled={!canEdit || !onMake}
        onClick={onMake}
        title={canEdit ? `Make the ${template.name.toLowerCase()} with the names filled in` : `Not made yet: ${template.name}`}
        className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-graphite/35 px-2.5 py-1 text-xs font-medium text-charcoal transition-colors hover:border-graphite hover:bg-graphite/5 disabled:pointer-events-none disabled:opacity-60"
      >
        {canEdit ? <Plus className="size-3" aria-hidden /> : <CircleDashed className="size-3" aria-hidden />} {template.name}
      </button>
    );
  }
  const p = progressOf(doc, template);
  const Icon = ICON[p.standing];
  const when = p.standing === "signed" ? shortDate(doc.partySignedOn || doc.studioSignedOn) : p.standing === "waiting" ? shortDate(doc.issuedOn) : "";
  return (
    <button
      type="button"
      onClick={() => onOpen(doc)}
      title={`${template.name}: ${p.standing === "void" ? "not needed, or withdrawn" : p.label.toLowerCase()}${when ? ` (${p.standing === "signed" ? "signed" : "printed"} ${when})` : ""}. Click to open.`}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors",
        p.standing === "signed" && "border-ok/30 bg-ok/10 text-ok hover:bg-ok/15",
        p.standing === "waiting" && "border-warn/35 bg-warn/10 text-warn hover:bg-warn/15",
        p.standing === "draft" && "border-graphite/25 bg-paper text-graphite hover:bg-graphite/5",
        p.standing === "void" && "border-graphite/15 text-blueprint line-through hover:bg-graphite/5",
      )}
    >
      <Icon className="size-3" aria-hidden /> {template.name}
      <span className="sr-only">: {p.label}</span>
    </button>
  );
}

/** The legend under a row of chips. */
export function ChipLegend() {
  const item = "inline-flex items-center gap-1.5";
  return (
    <p className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-blueprint">
      <span className={item}>
        <Plus className="size-3" aria-hidden /> Not made yet
      </span>
      <span className={item}>
        <FileText className="size-3" aria-hidden /> Draft
      </span>
      <span className={item}>
        <Hourglass className="size-3 text-warn" aria-hidden /> Printed, waiting for a signature
      </span>
      <span className={item}>
        <Check className="size-3 text-ok" aria-hidden /> Signed
      </span>
    </p>
  );
}

/** A document's template, or nothing when the template no longer exists. */
export const templateOf = (doc: SignDoc) => templateById(doc.template);

/** How much a sheet of `width` px must shrink to fit the box it sits in (1 = it fits). */
export function useFit(width: number) {
  const ref = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState(1);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setFit(Math.min(1, Math.max(0.3, Math.floor((el.clientWidth / width) * 100) / 100)));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [width]);
  return { ref, fit };
}
