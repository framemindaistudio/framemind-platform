"use client";

import { useMemo } from "react";
import Link from "next/link";
import { FilePlus2 } from "lucide-react";
import { Button, buttonClass } from "@/components/ui/Button";
import { EmptyState, Panel } from "@/components/hq/ui";
import type { SignDoc } from "@/lib/sign/context";
import { ChipLegend } from "./bits";
import { str, type Desk } from "./desk";
import type { Preset } from "./NewDoc";
import { PaperSet } from "./PaperSet";

/** Documents to Sign → Others: vendors, partners, people in shoots, property owners. Anyone who is not team or a client. */
export function OthersTab({ desk, tab, onOpen, onNew }: { desk: Desk; tab: string; onOpen: (doc: SignDoc) => void; onNew: (preset: Preset) => void }) {
  const groups = useMemo(() => {
    const by = new Map<string, { name: string; kind: string; id: string; docs: SignDoc[] }>();
    for (const d of desk.docs) {
      if (d.partyKind !== "vendor" && d.partyKind !== "other") continue;
      const key = `${d.partyKind}:${d.partyId || str(d.partyName).toLowerCase()}`;
      if (!by.has(key)) by.set(key, { name: str(d.partyName) || "No name yet", kind: d.partyKind, id: str(d.partyId), docs: [] });
      by.get(key)!.docs.push(d);
    }
    return [...by.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [desk.docs]);

  const start: Preset = { kinds: ["vendor", "other"] };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="max-w-3xl text-sm text-charcoal">Papers with anyone who is not on the team and not a client: a partner or agency under NDA, a rental house, a model or a property owner at a shoot, or a coaching learner.</p>
        {desk.canEdit && (
          <Button size="sm" onClick={() => onNew(start)}>
            <FilePlus2 className="size-3.5" aria-hidden /> New document
          </Button>
        )}
      </div>

      {groups.length === 0 ? (
        <EmptyState icon="Signature" title="Nothing here yet" description="A mutual NDA with a partner, gear rental terms, a model or location release, a coaching enrolment: make one with New document." />
      ) : (
        <ul className="space-y-4">
          {groups.map((g) => (
            <li key={`${g.kind}:${g.id || g.name}`}>
              <article className="rounded-[var(--radius-md)] border border-graphite/12 bg-paper-50 p-5 shadow-[var(--shadow-paper)]">
                <h3 className="text-base font-bold leading-tight">{g.name}</h3>
                <p className="mb-3 text-sm text-charcoal">{g.kind === "vendor" ? "Vendor" : "Not on record in HQ"}</p>
                <PaperSet desk={desk} required={[]} docs={g.docs} tab={tab} makeLabel="" onMake={async () => []} onOpen={onOpen} onOther={g.kind === "vendor" && g.id ? () => onNew({ kind: "vendor", id: g.id }) : undefined} />
              </article>
            </li>
          ))}
        </ul>
      )}
      {groups.length > 0 && <ChipLegend />}

      <Panel title="Releases on a shoot day" subtitle="Model, location and drone releases for photo and video shoots">
        <div className="flex flex-wrap items-center gap-3">
          <p className="min-w-56 flex-1 text-sm text-charcoal">Print blank model releases for everyone who may appear, and a location release for the property, before the crew leaves. Templates → Shoot releases has blank copies; each signed one is ticked here once it comes back.</p>
          <Link href="/hq/sign?tab=templates" className={buttonClass("secondary", "sm")}>
            Open templates
          </Link>
        </div>
      </Panel>
    </div>
  );
}
