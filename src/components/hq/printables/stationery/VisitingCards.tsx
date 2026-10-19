"use client";

import { useMemo } from "react";
import { PrintShell } from "@/components/print/PrintShell";
import { CornerMarks } from "@/components/brand/Blueprint";
import { useCollection, useSettings } from "@/components/hq/data";
import { EmptyState, Loading } from "@/components/hq/ui";
import type { BaseRecord } from "@/lib/hq/collections";
import { site } from "@/lib/site";
import { Mark, Sheet, Tile, Wordmark } from "../PrintBits";
import { csv, str, type Q } from "../util";

interface Contact {
  name: string;
  title: string;
  phone: string;
  email: string;
  website: string;
}

const bare = (url: string) => url.replace(/^https?:\/\//i, "").replace(/\/+$/, "");

function Front({ c }: { c: Contact }) {
  const rows: [string, string][] = [
    ["T", c.phone],
    ["E", c.email],
    ["W", c.website],
  ];
  return (
    <Tile w={90} h={54} className="bg-white">
      <div className="bp-grid-fine pointer-events-none absolute inset-0 opacity-30" aria-hidden />
      <CornerMarks size={9} inset={9} className="text-graphite/40" />
      <Mark mm={15} className="absolute right-[7mm] top-[7mm]" />
      <div className="absolute inset-y-0 left-[8mm] right-[26mm] flex flex-col justify-center">
        <p className="text-[12pt] font-bold leading-[1.05] tracking-[-0.025em]">{c.name}</p>
        <p className="mt-[1.2mm] text-[6.2pt] font-semibold uppercase leading-tight tracking-[0.14em] text-charcoal">{c.title}</p>
        <span className="my-[3mm] block h-px w-[14mm] bg-graphite" />
        <dl className="space-y-[0.9mm] text-[7pt] leading-tight">
          {rows
            .filter(([, v]) => v)
            .map(([k, v]) => (
              <div key={k} className="flex gap-[2mm]">
                <dt className="w-[2.4mm] font-mono text-blueprint">{k}</dt>
                <dd className="truncate font-medium">{v}</dd>
              </div>
            ))}
        </dl>
      </div>
      <p className="absolute inset-x-[8mm] bottom-[3mm] text-[4.8pt] uppercase tracking-[0.22em] text-blueprint">Journey of Visionation &amp; Excellence</p>
    </Tile>
  );
}

function Back() {
  return (
    <Tile w={90} h={54} className="bg-graphite text-paper" cut>
      <div className="bp-grid-dark pointer-events-none absolute inset-0" aria-hidden />
      <CornerMarks size={9} inset={9} className="text-paper/40" />
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <Wordmark white mm={44} />
        <p className="mt-[3mm] text-[5.6pt] font-semibold uppercase tracking-[0.3em] text-paper/80">{site.pillars.join(" · ")}</p>
      </div>
      <p className="absolute inset-x-[8mm] bottom-[3.2mm] text-center text-[4.8pt] uppercase tracking-[0.22em] text-paper/55">Websites · Brands · Software · Automations · Photo &amp; Video</p>
    </Tile>
  );
}

export function VisitingCards({ q }: { q: Q }) {
  const { records, loading, error } = useCollection("team");
  const { settings } = useSettings();

  const people = useMemo(() => {
    const ids = csv(q.ids);
    const pick: BaseRecord[] = ids.length ? ids.map((id) => records.find((r) => r.id === id)).filter((r): r is BaseRecord => !!r) : records.filter((r) => r.status !== "inactive");
    return pick;
  }, [records, q.ids]);

  const site0 = settings.website || (/localhost|127\.0\.0\.1/.test(site.url) ? "" : site.url);
  const contacts: Contact[] = people.map((m) => ({
    name: str(m.name),
    title: str(m.role) === "Co-Founder & CCO" ? site.founders[1].role : str(m.role),
    phone: str(m.phone) || settings.phone || site.contact.phone,
    email: str(m.email) || settings.email || site.contact.email,
    website: bare(site0),
  }));
  const withBack = q.back !== "0";

  return (
    <PrintShell title="Visiting cards (90 × 54 mm)" back="/hq/printables" toolbar={<span className="text-xs text-blueprint">{contacts.length} {contacts.length === 1 ? "person" : "people"} · 10 cards per A4{withBack ? " · front + back sheets" : ""}</span>}>
      {loading ? (
        <Loading />
      ) : error ? (
        <p className="no-print rounded border border-bad/30 bg-bad/10 px-3 py-2 text-sm text-bad">{error}</p>
      ) : !contacts.length ? (
        <EmptyState icon="Users" title="No one selected" description="Choose team members in Print Studio. Add people in HQ → Team & Payroll." />
      ) : (
        contacts.flatMap((c, i) => [
          <Sheet key={`f${i}`} className="flex items-center justify-center">
            <div className="grid grid-cols-2" style={{ width: "180mm" }}>
              {Array.from({ length: 10 }, (_, j) => (
                <Front key={j} c={c} />
              ))}
            </div>
          </Sheet>,
          ...(withBack
            ? [
                <Sheet key={`b${i}`} className="flex items-center justify-center">
                  <div className="grid grid-cols-2" style={{ width: "180mm" }}>
                    {Array.from({ length: 10 }, (_, j) => (
                      <Back key={j} />
                    ))}
                  </div>
                </Sheet>,
              ]
            : []),
        ])
      )}
    </PrintShell>
  );
}
