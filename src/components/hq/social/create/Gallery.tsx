"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/form";
import { EmptyState } from "@/components/hq/ui";
import { draw, type Kit } from "@/lib/social/render";
import { GROUP_NOTES, GROUP_ORDER, TEMPLATES } from "@/lib/social/templates";
import { FORMATS, type Facts, type FormatId, type TemplateDef, type TemplateGroup, type Tone } from "@/lib/social/types";
import { cn } from "@/lib/utils";
import { useStock } from "./kit";

/** A small, real rendering of a design with its sample words: drawn by the same code as the download. */
export function Thumb({ template, kit, facts, format, tone, className }: { template: TemplateDef; kit: Kit; facts: Facts; format?: FormatId; tone?: Tone; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const stock = useStock(template, template.sample);
  const f = format ?? template.formats[0];
  const o = tone ?? template.tones[0];
  useEffect(() => {
    if (!ref.current) return;
    const size = FORMATS[f];
    draw(ref.current, { template, format: f, tone: o, values: template.sample, pictures: stock, facts }, kit, 0, 360 / size.w);
  }, [template, kit, facts, f, o, stock]);
  const size = FORMATS[f];
  return <canvas ref={ref} aria-hidden className={cn("block h-auto w-full", className)} style={{ aspectRatio: `${size.w} / ${size.h}` }} />;
}

export function Gallery({ kit, facts, onPick }: { kit: Kit; facts: Facts; onPick: (t: TemplateDef) => void }) {
  const [q, setQ] = useState("");
  const [group, setGroup] = useState<TemplateGroup | "all">("all");
  const groups = useMemo(() => GROUP_ORDER.filter((g) => TEMPLATES.some((t) => t.group === g)), []);
  const shown = useMemo(() => {
    const words = q.toLowerCase().split(/\s+/).filter(Boolean);
    return TEMPLATES.filter((t) => (group === "all" || t.group === group) && words.every((w) => `${t.name} ${t.group} ${t.blurb}`.toLowerCase().includes(w)));
  }, [q, group]);

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-2xl text-sm text-charcoal">
          <strong className="text-graphite">Pick a design, type your words, download, post.</strong> Every design follows the brand guidelines and comes in the sizes each platform needs.
        </p>
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-blueprint" aria-hidden />
          <Input aria-label="Find a design" placeholder="Find a design: launch, hiring, thumbnail…" className="pl-9" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>

      <div role="radiogroup" aria-label="Kind of post" className="mb-2 flex flex-wrap gap-2">
        {(["all", ...groups] as const).map((g) => (
          <button
            key={g}
            type="button"
            role="radio"
            aria-checked={group === g}
            onClick={() => setGroup(g)}
            className={cn("rounded-[var(--radius-sm)] border px-3 py-1.5 text-xs font-semibold transition-colors", group === g ? "border-graphite bg-graphite text-paper" : "border-graphite/20 text-graphite hover:border-graphite/50")}
          >
            {g === "all" ? `All ${TEMPLATES.length}` : g}
          </button>
        ))}
      </div>
      <p className="mb-5 min-h-4 text-xs text-blueprint">{group === "all" ? "Announcements, promotion, services, hiring, milestones, behind the scenes, video, words and the founders' own posts." : GROUP_NOTES[group]}</p>

      {!shown.length && <EmptyState icon="Search" title="No design matches" description="Try a shorter word, or choose All to see every design." />}

      <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        {shown.map((t) => {
          const size = FORMATS[t.formats[0]];
          return (
            <li key={t.id}>
              <button
                type="button"
                data-design={t.id}
                data-sizes={t.formats.join(",")}
                data-looks={t.tones.join(",")}
                onClick={() => onPick(t)}
                className="group flex h-full w-full flex-col overflow-hidden rounded-[var(--radius-md)] border border-graphite/12 bg-paper-50 text-left transition-all hover:-translate-y-0.5 hover:border-graphite/40 hover:shadow-[var(--shadow-lift)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-graphite"
              >
                {/* every card keeps the same picture area, so the grid stays even whatever the shape of the design */}
                <span className="flex aspect-[4/5] items-center justify-center border-b border-graphite/10 bg-graphite/[0.05] p-3.5">
                  <span className="block overflow-hidden rounded-[3px] shadow-[var(--shadow-paper)]" style={{ width: size.w >= size.h ? "100%" : `${Math.round((size.w / size.h) * 125)}%`, maxWidth: "100%" }}>
                    <Thumb template={t} kit={kit} facts={facts} />
                  </span>
                </span>
                <span className="flex flex-1 flex-col gap-1 p-3.5">
                  <span className="annot text-[10px] text-blueprint">{t.group}</span>
                  <span className="text-sm font-semibold text-graphite">{t.name}</span>
                  <span className="text-xs leading-relaxed text-charcoal">{t.blurb}</span>
                  <span className="mt-auto pt-2 text-[11px] text-blueprint">
                    {t.formats.length} sizes{t.pages ? " · several slides" : ""}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
