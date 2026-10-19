"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Badge, statusTone } from "@/components/ui/Badge";
import { buttonClass } from "@/components/ui/Button";
import { EmptyState } from "@/components/hq/ui";
import { requiredForMember } from "@/lib/sign/catalog";
import { memberGroup, partyFromMember, type SignDoc } from "@/lib/sign/context";
import { ChipLegend } from "./bits";
import { str, type Desk, type Rec } from "./desk";
import type { Preset } from "./NewDoc";
import { PaperSet, tally } from "./PaperSet";

const ORDER: Record<string, number> = { onboarding: 0, active: 1, inactive: 2 };

/** Documents to Sign → Team: every person, the papers their kind of engagement needs, and where each paper stands. */
export function TeamTab({ desk, tab, onOpen, onNew }: { desk: Desk; tab: string; onOpen: (doc: SignDoc) => void; onNew: (preset: Preset) => void }) {
  const members = useMemo(() => [...desk.team].sort((a, b) => (ORDER[str(a.status)] ?? 1) - (ORDER[str(b.status)] ?? 1) || str(a.name).localeCompare(str(b.name))), [desk.team]);

  if (!members.length)
    return (
      <EmptyState
        icon="Users"
        title="No one on the team list yet"
        description="Add a person in Team & Payroll first. They then appear here with the papers their role needs, already filled in with their name."
        action={
          <Link href="/hq/team" className={buttonClass("secondary", "sm")}>
            Open Team &amp; Payroll
          </Link>
        }
      />
    );

  return (
    <div>
      <p className="mb-4 max-w-3xl text-sm text-charcoal">
        Each person is listed with the papers their kind of work needs. Press a dashed chip to make that paper, or <strong>Make the missing papers</strong> for all of them at once. The person&rsquo;s name and yours are already on the signature lines.
      </p>
      <ul className="space-y-4">
        {members.map((m) => (
          <li key={m.id}>
            <MemberCard desk={desk} member={m} tab={tab} onOpen={onOpen} onNew={onNew} />
          </li>
        ))}
      </ul>
      <div className="mt-5">
        <ChipLegend />
      </div>
    </div>
  );
}

function MemberCard({ desk, member, tab, onOpen, onNew }: { desk: Desk; member: Rec; tab: string; onOpen: (doc: SignDoc) => void; onNew: (preset: Preset) => void }) {
  const group = memberGroup(member);
  const required = useMemo(() => requiredForMember(group), [group]);
  const docs = useMemo(() => desk.docs.filter((d) => d.partyKind === "team" && d.partyId === member.id), [desk.docs, member.id]);
  const { needed, settled } = tally(required, docs);
  const status = str(member.status) || "active";
  const party = partyFromMember(member);

  return (
    <article className="rounded-[var(--radius-md)] border border-graphite/12 bg-paper-50 p-5 shadow-[var(--shadow-paper)]" data-member={member.id}>
      <div className="mb-4 flex flex-wrap items-start gap-x-4 gap-y-2">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-bold leading-tight">{str(member.name)}</h3>
          <p className="truncate text-sm text-charcoal">{str(member.role) || "Role not set"}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Badge tone="outline">{group}</Badge>
            <Badge tone={statusTone(status)} dot>
              {status}
            </Badge>
          </div>
        </div>
        {needed > 0 && (
          <div className="w-40 text-right">
            <p className="tabular text-sm font-semibold text-graphite">
              {settled} of {needed} signed
            </p>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-graphite/10" role="progressbar" aria-valuemin={0} aria-valuemax={needed} aria-valuenow={settled} aria-label={`${str(member.name)}: papers signed`}>
              <div className="h-full rounded-full bg-graphite transition-all" style={{ width: `${(settled / needed) * 100}%` }} />
            </div>
          </div>
        )}
      </div>
      <PaperSet
        desk={desk}
        required={required}
        docs={docs}
        tab={tab}
        makeLabel="Make the missing papers"
        onMake={(templates) => desk.make(templates.map((template) => ({ template, party, sources: { member } })))}
        onOpen={onOpen}
        onOther={() => onNew({ kind: "team", id: member.id })}
      />
    </article>
  );
}
