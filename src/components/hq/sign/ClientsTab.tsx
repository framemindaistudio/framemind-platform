"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Badge, statusTone } from "@/components/ui/Badge";
import { Button, buttonClass } from "@/components/ui/Button";
import { EmptyState } from "@/components/hq/ui";
import { shortDate } from "@/components/hq/printables/util";
import { requiredForClient } from "@/lib/sign/catalog";
import { partyFromClient, type SignDoc } from "@/lib/sign/context";
import { ChipLegend } from "./bits";
import { proposalFor, str, type Desk, type Rec } from "./desk";
import type { Preset } from "./NewDoc";
import { PaperSet } from "./PaperSet";

/** A client is "in play" once a quote has gone out, a project exists, or a paper has been made for it. */
const IN_PLAY = ["quoted", "negotiation", "won", "active"];
const LIVE_PROJECT = ["kickoff", "discovery", "design", "build", "review", "launch", "support", "completed"];

/** Documents to Sign → Clients: each client with a quote or a project, and the papers every project needs. */
export function ClientsTab({ desk, tab, onOpen, onNew }: { desk: Desk; tab: string; onOpen: (doc: SignDoc) => void; onNew: (preset: Preset) => void }) {
  const rows = useMemo(() => {
    const withDocs = new Set(desk.docs.filter((d) => d.partyKind === "client" && d.partyId).map((d) => d.partyId));
    return desk.clients
      .map((client) => ({ client, projects: desk.projects.filter((w) => w.clientId === client.id && LIVE_PROJECT.includes(str(w.stage) || "kickoff")).sort((a, b) => str(b.startDate).localeCompare(str(a.startDate))) }))
      .filter((r) => IN_PLAY.includes(str(r.client.stage)) || r.projects.length > 0 || withDocs.has(r.client.id))
      .sort((a, b) => str(a.client.name).localeCompare(str(b.client.name)));
  }, [desk.clients, desk.projects, desk.docs]);

  if (!rows.length)
    return (
      <EmptyState
        icon="Building2"
        title="No client has a quote or a project yet"
        description="A client appears here once a quote is sent or a project starts. Its papers are then filled in from the client's record, the quote and the project."
        action={
          <div className="flex flex-wrap justify-center gap-2">
            <Link href="/hq/crm" className={buttonClass("secondary", "sm")}>
              Open Clients CRM
            </Link>
            {desk.canEdit && (
              <Button size="sm" variant="ghost" onClick={() => onNew({ kind: "client" })}>
                Make a paper for any client
              </Button>
            )}
          </div>
        }
      />
    );

  return (
    <div>
      <p className="mb-4 max-w-3xl text-sm text-charcoal">
        Every project needs the same papers: the Client Services Agreement (once per client) and a Statement of Work. They are filled in from the client&rsquo;s record, the accepted quote and the project, with the client&rsquo;s signatory and yours on the signature lines.
      </p>
      <ul className="space-y-4">
        {rows.map(({ client, projects }) => (
          <li key={client.id}>
            <ClientCard desk={desk} client={client} projects={projects} tab={tab} onOpen={onOpen} onNew={onNew} />
          </li>
        ))}
      </ul>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <ChipLegend />
        {desk.canEdit && (
          <Button size="sm" variant="ghost" onClick={() => onNew({ kind: "client" })}>
            A paper for another client…
          </Button>
        )}
      </div>
    </div>
  );
}

function ClientCard({ desk, client, projects, tab, onOpen, onNew }: { desk: Desk; client: Rec; projects: Rec[]; tab: string; onOpen: (doc: SignDoc) => void; onNew: (preset: Preset) => void }) {
  const required = useMemo(() => requiredForClient(), []);
  const docs = useMemo(() => desk.docs.filter((d) => d.partyKind === "client" && d.partyId === client.id), [desk.docs, client.id]);
  const party = partyFromClient(client);
  const stage = str(client.stage) || "lead";
  // one set of papers for each project; papers made without a project sit with the newest one
  const sets = projects.length ? projects.map((w, i) => ({ project: w as Rec | undefined, docs: docs.filter((d) => d.projectId === w.id || (i === 0 && !d.projectId)) })) : [{ project: undefined, docs }];

  return (
    <article className="rounded-[var(--radius-md)] border border-graphite/12 bg-paper-50 p-5 shadow-[var(--shadow-paper)]" data-client={client.id}>
      <div className="mb-1 flex flex-wrap items-start gap-x-4 gap-y-2">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-bold leading-tight">{str(client.name)}</h3>
          <p className="truncate text-sm text-charcoal">{[str(client.city), party.person && `${party.person}${party.role ? `, ${party.role}` : ""}`].filter(Boolean).join(" · ") || "No contact on record"}</p>
        </div>
        <Badge tone={statusTone(stage)} dot>
          {stage}
        </Badge>
      </div>
      {!party.person && <p className="mb-2 text-xs text-warn">No contact is on record for this client, so the signature line will be left to fill by hand. Add the name in Clients CRM, or type it on the paper.</p>}
      <div className="divide-y divide-graphite/10">
        {sets.map(({ project, docs: mine }) => {
          const proposal = proposalFor(desk.proposals, client.id, project);
          return (
            <div key={project?.id ?? "none"} className="py-4 last:pb-0">
              <p className="annot mb-2.5 text-charcoal">{project ? `${str(project.title) || "Project"} · ${shortDate(project.startDate) || "not started"} · ${str(project.stage) || "kickoff"}` : "No project yet"}</p>
              <PaperSet
                desk={desk}
                required={required}
                docs={mine}
                tab={tab}
                makeLabel="Make this project's papers"
                onMake={(templates) => desk.make(templates.map((template) => ({ template, party, sources: { client, project, proposal }, projectId: project?.id, proposalId: proposal?.id })))}
                onOpen={onOpen}
                onOther={() => onNew({ kind: "client", id: client.id, projectId: project?.id })}
              />
            </div>
          );
        })}
      </div>
    </article>
  );
}
