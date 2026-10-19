"use client";

import { useState } from "react";
import Link from "next/link";
import { BookOpen, FilePlus2, Printer, Scale } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button, buttonClass } from "@/components/ui/Button";
import { Input } from "@/components/ui/form";
import { docHref } from "@/components/hq/docs/lib";
import { GROUPS, templatesIn } from "@/lib/sign/catalog";
import type { SignTemplate } from "@/lib/sign/types";
import { blankHref, type Desk } from "./desk";
import type { Preset } from "./NewDoc";

const SIGNS: Record<SignTemplate["signs"], string> = { both: "Both sides sign", party: "They sign", studio: "FrameMind signs" };
const KIND: Record<SignTemplate["kind"], string> = { letter: "Letter", agreement: "Agreement", declaration: "Declaration", form: "Form" };

/** Documents to Sign → Templates: every paper HQ can make, what it is for, and a blank copy to fill in by hand. */
export function TemplatesTab({ desk, tab, onNew }: { desk: Desk; tab: string; onNew: (preset: Preset) => void }) {
  return (
    <div className="space-y-9">
      <div role="note" className="flex gap-3 rounded-[var(--radius-sm)] border border-graphite/15 bg-paper-50 p-4">
        <Scale className="mt-0.5 size-5 shrink-0 text-blueprint" aria-hidden />
        <div className="text-sm leading-relaxed text-charcoal">
          <p className="font-semibold text-graphite">These are working templates, not legal advice.</p>
          <p>They are written from your own Operations Library. Before the first real use, have an advocate read the set once and a CA check the pay and tax lines. Each paper lists its open points under &ldquo;For your advocate&rdquo;; those points are never printed.</p>
        </div>
      </div>

      {GROUPS.map((g) => {
        const list = templatesIn(g.id);
        if (!list.length) return null;
        return (
          <section key={g.id} aria-labelledby={`grp-${g.id}`}>
            <div className="mb-4 flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
              <div>
                <h2 id={`grp-${g.id}`} className="text-base font-bold text-graphite">
                  {g.title}
                </h2>
                <p className="mt-0.5 text-sm text-charcoal">{g.note}</p>
              </div>
              <Link href={`/hq/print/sign?blank=${list.map((t) => t.id).join(",")}&tab=${tab}`} className={buttonClass("ghost", "sm")} title="One PDF with a blank copy of each paper in this group.">
                <Printer className="size-3.5" aria-hidden /> Blank copies of all {list.length}
              </Link>
            </div>
            <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {list.map((t) => (
                <li key={t.id}>
                  <TemplateCard template={t} canEdit={desk.canEdit} tab={tab} onNew={onNew} />
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

function TemplateCard({ template: t, canEdit, tab, onNew }: { template: SignTemplate; canEdit: boolean; tab: string; onNew: (preset: Preset) => void }) {
  const [open, setOpen] = useState(false);
  const [copies, setCopies] = useState("1");
  const n = Math.min(60, Math.max(1, Math.round(Number(copies)) || 1));
  const needs = [t.requiredFor?.length ? `Needed for: ${t.requiredFor.join(", ").toLowerCase()}` : "", t.requiredForClients ? "Needed for every client project" : ""].filter(Boolean).join(" · ");

  return (
    <article className="flex h-full flex-col rounded-[var(--radius-md)] border border-graphite/12 bg-paper-50 p-5 shadow-[var(--shadow-paper)]" data-template={t.id} data-parties={t.parties.join(",")} data-name={t.name}>
      <div className="mb-2 flex flex-wrap gap-1.5">
        <Badge tone="outline">{KIND[t.kind]}</Badge>
        <Badge tone="neutral">{SIGNS[t.signs]}</Badge>
      </div>
      <h3 className="text-[15px] font-bold leading-snug">{t.name}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-charcoal">{t.blurb}</p>
      <dl className="mt-3 space-y-1 text-xs text-blueprint">
        <div>
          <dt className="inline font-semibold text-charcoal">When: </dt>
          <dd className="inline">{t.when}</dd>
        </div>
        {needs && <p>{needs}</p>}
        <div>
          <dt className="inline font-semibold text-charcoal">Keep the signed copy: </dt>
          <dd className="inline">{t.keep}</dd>
        </div>
      </dl>

      {(t.source || t.lawyer.length > 0) && (
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs">
          {t.source && (
            <Link href={docHref(`OPERATIONS/${t.source}`)} className="inline-flex items-center gap-1 font-semibold text-graphite underline underline-offset-2" title="The Operations Library document this wording follows">
              <BookOpen className="size-3" aria-hidden /> Library source
            </Link>
          )}
          {t.lawyer.length > 0 && (
            <button type="button" className="inline-flex items-center gap-1 font-semibold text-graphite underline underline-offset-2" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
              <Scale className="size-3" aria-hidden /> For your advocate ({t.lawyer.length})
            </button>
          )}
        </div>
      )}
      {open && (
        <ul className="mt-2 list-disc space-y-1 rounded-[var(--radius-sm)] border border-graphite/10 bg-paper p-3 pl-7 text-xs leading-relaxed text-charcoal">
          {t.lawyer.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
      )}

      <div className="mt-auto flex flex-wrap items-center gap-2 pt-4">
        {canEdit && (
          <Button size="sm" onClick={() => onNew({ templateId: t.id })}>
            <FilePlus2 className="size-3.5" aria-hidden /> Make one
          </Button>
        )}
        <Link href={blankHref(t.id, n, tab)} className={buttonClass("secondary", "sm")} title="Nothing filled in: every name and detail is a line to write on by hand.">
          <Printer className="size-3.5" aria-hidden /> Blank {n > 1 ? `× ${n}` : "copy"}
        </Link>
        <label className="ml-auto inline-flex items-center gap-1.5 text-xs text-blueprint">
          Copies
          <Input aria-label={`Blank copies of ${t.name}`} inputMode="numeric" className="h-8 w-14 px-2 text-center text-xs" value={copies} onChange={(e) => setCopies(e.target.value.replace(/\D/g, "").slice(0, 2))} />
        </label>
      </div>
    </article>
  );
}
