"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ExternalLink, Plus, RotateCcw } from "lucide-react";
import { getCollection, type BaseRecord } from "@/lib/hq/collections";
import { can } from "@/lib/hq/roles";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/form";
import { Tabs } from "@/components/ui/Tabs";
import { CollectionManager } from "@/components/hq/CollectionManager";
import { useCollection, useHq } from "@/components/hq/data";
import { Kanban } from "@/components/hq/Kanban";
import { RecordDrawer, blankRecord } from "@/components/hq/RecordDrawer";
import { EmptyState, Loading, Panel, PageHeader, StatCard } from "@/components/hq/ui";
import { useToday } from "@/components/hq/sales/useToday";
import { daysBetween, isClosed, num, shortDate, str } from "@/components/hq/projects/logic";

const def = getCollection("deliverables")!;
const DONE = ["approved", "delivered"];
type Tab = "board" | "list" | "guide";

const isLate = (d: BaseRecord, today: string) => !!today && !!str(d.dueDate) && str(d.dueDate).slice(0, 10) < today && !DONE.includes(str(d.status));

/** The production rules every deliverable follows — the studio's own published standards. */
const RULES = [
  { title: "Two rounds, then a quote", body: "Every design stage and every video includes 2 rounds of revisions. Use the Revision button on a card for each round; past the rounds included, quote the extra work before doing it." },
  { title: "Rough cut before final", body: "Videos go to the client as a rough cut first. Photo shoots share a curated gallery of selects before the final edit." },
  { title: "Turnaround", body: "Photo edits: 5–7 working days after the shoot (rush: 2–3). Videos: 7–10 working days (rush: 3–4). Set the due date when the shoot is done." },
  { title: "Backups", body: "Footage is backed up to two places the same day. Tick it on the shoot's call sheet before the card moves to In progress." },
  { title: "Links, not attachments", body: "Every deliverable carries its link — Drive, Figma, a staging URL or an unlisted YouTube video — so the client and the team review the same version." },
  { title: "Delivered means handed over", body: "Approved is the client's yes; Delivered is when the files, in every format ordered, are in the client's hands." },
];

/** Production: every deliverable promised to a client, across projects, from planned to delivered. */
export function ProductionApp({ initialProject }: { initialProject?: string }) {
  const { user, store } = useHq();
  const today = useToday();
  const { records, loading, error, save } = useCollection("deliverables");
  const { records: projects } = useCollection("projects");
  const canWrite = can(user, def.write) && store.writable;
  const [tab, setTab] = useState<Tab>("board");
  const [projectId, setProjectId] = useState(initialProject ?? "");
  const [assignee, setAssignee] = useState("");
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);

  const projectName = useMemo(() => new Map(projects.map((p) => [p.id, str(p.title)])), [projects]);
  const people = useMemo(() => [...new Set(records.map((r) => str(r.assignee)).filter(Boolean))].sort(), [records]);
  const list = useMemo(() => records.filter((r) => (!projectId || r.projectId === projectId) && (!assignee || r.assignee === assignee)), [records, projectId, assignee]);
  const columns = def.fields.find((f) => f.key === "status")?.options ?? [];

  const stats = useMemo(() => {
    const open = list.filter((d) => !DONE.includes(str(d.status)));
    return {
      open: open.length,
      withClient: list.filter((d) => d.status === "client-review").length,
      revisions: list.filter((d) => d.status === "revisions").length,
      late: list.filter((d) => isLate(d, today)).length,
      week: today ? open.filter((d) => str(d.dueDate) && daysBetween(today, str(d.dueDate)) >= 0 && daysBetween(today, str(d.dueDate)) <= 7).length : 0,
    };
  }, [list, today]);

  return (
    <div>
      <PageHeader
        eyebrow="Delivery"
        icon="Layers"
        title="Production"
        description={
          <>
            Every deliverable promised to a client — pages, logos, films, reels, photo sets, builds — from planned to delivered. Open a{" "}
            <Link href="/hq/projects" className="font-semibold text-graphite underline underline-offset-2">
              project
            </Link>{" "}
            for its milestones and checklist.
          </>
        }
        actions={
          canWrite ? (
            <Button size="sm" className="h-9" onClick={() => setEditing(blankRecord("deliverables", { projectId: projectId || undefined, status: "planned", assignee: user.name }))}>
              <Plus className="size-4" /> New deliverable
            </Button>
          ) : undefined
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard tone="dark" label="In production" value={stats.open} sub={`${stats.week} due in the next 7 days`} />
        <StatCard label="With the client" value={stats.withClient} sub="Waiting on their review" />
        <StatCard label="In revisions" value={stats.revisions} sub="Changes requested" />
        <StatCard label="Late" value={stats.late} sub={stats.late ? <span className="font-semibold text-bad">Past their due date</span> : "Nothing late"} />
      </div>

      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <Tabs className="lg:flex-1" value={tab} onChange={setTab} tabs={[{ value: "board", label: "Board" }, { value: "list", label: "List" }, { value: "guide", label: "Production rules" }]} />
        {tab !== "guide" && (
          <div className="flex flex-wrap gap-2">
            <Select aria-label="Project" value={projectId} onChange={(e) => setProjectId(e.target.value)} className="w-full sm:w-64">
              <option value="">All projects</option>
              {projects
                .filter((p) => !isClosed(p) || p.id === projectId)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {str(p.title) || "Untitled project"}
                  </option>
                ))}
            </Select>
            <Select aria-label="Assignee" value={assignee} onChange={(e) => setAssignee(e.target.value)} className="w-full sm:w-44">
              <option value="">Everyone</option>
              {people.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </Select>
          </div>
        )}
      </div>

      {error && <p className="mb-4 rounded border border-bad/30 bg-bad/10 px-3 py-2 text-sm text-bad">{error}</p>}

      {tab === "board" &&
        (loading ? (
          <Loading />
        ) : !list.length ? (
          <EmptyState icon="Layers" title="Nothing in production" description="Add deliverables from a project, or here — every page, concept, film and photo set the client was promised." />
        ) : (
          <Kanban
            records={list.map((r) => (r.status ? r : { ...r, status: "planned" }))}
            field="status"
            columns={columns}
            disabled={!canWrite}
            onMove={async (r, status) => {
              await save({ ...r, status, ...(status === "revisions" && r.status !== "revisions" ? { round: num(r.round) + 1 } : {}) });
            }}
            onOpen={(r) => setEditing({ ...r })}
            renderCard={(r) => (
              <div>
                <p className="line-clamp-2 font-semibold leading-snug text-graphite">{str(r.title)}</p>
                <p className="mt-0.5 truncate text-xs text-blueprint">{projectName.get(str(r.projectId)) || "No project"}</p>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  {r.type ? <Badge tone="outline">{str(r.type)}</Badge> : null}
                  {num(r.round) > 0 && (
                    <Badge tone="warn">
                      <RotateCcw className="size-3" /> Round {num(r.round)}
                    </Badge>
                  )}
                </div>
                <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-dashed border-graphite/12 pt-2 text-[11px]">
                  <span className="truncate text-charcoal">{str(r.assignee) || "Unassigned"}</span>
                  {isLate(r, today) ? (
                    <span className="inline-flex items-center gap-1 font-semibold text-bad">
                      <AlertTriangle className="size-3" /> {shortDate(r.dueDate)}
                    </span>
                  ) : r.dueDate ? (
                    <span className="tabular text-charcoal">{shortDate(r.dueDate)}</span>
                  ) : null}
                </div>
                {r.link ? (
                  <a href={str(r.link)} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold text-graphite underline-offset-4 hover:underline">
                    Open link <ExternalLink className="size-3" />
                  </a>
                ) : null}
              </div>
            )}
          />
        ))}

      {tab === "list" && (
        <CollectionManager
          name="deliverables"
          filter={(r) => (!projectId || r.projectId === projectId) && (!assignee || r.assignee === assignee)}
          defaults={{ projectId: projectId || undefined, status: "planned" }}
          columns={["title", "type", "projectId", "status", "assignee", "dueDate"]}
          emptyText="No deliverables yet."
        />
      )}

      {tab === "guide" && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {RULES.map((r, i) => (
            <Panel key={r.title} title={`${String(i + 1).padStart(2, "0")} · ${r.title}`}>
              <p className="text-sm leading-relaxed text-charcoal">{r.body}</p>
            </Panel>
          ))}
          <Panel title="SOPs in the library">
            <p className="text-sm text-charcoal">Shoot, edit and delivery SOPs live in the Operations Library under Photo &amp; Video and the Design and Dev playbooks.</p>
            <Button size="sm" variant="secondary" className="mt-3" href="/hq/docs">
              Open the library
            </Button>
          </Panel>
        </div>
      )}

      {editing && <RecordDrawer name="deliverables" initial={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}
