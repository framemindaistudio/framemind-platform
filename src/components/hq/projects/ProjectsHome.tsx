"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CalendarDays, ChevronLeft, ChevronRight, Columns3, List, Loader2, Plus, Search, Table2 } from "lucide-react";
import { getCollection, PROJECT_STAGES, SERVICE_OPTS, type BaseRecord } from "@/lib/hq/collections";
import { can } from "@/lib/hq/roles";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/form";
import { CollectionManager, type ExtraColumn } from "@/components/hq/CollectionManager";
import { useCollection, useHq, useShowMoney } from "@/components/hq/data";
import { Kanban } from "@/components/hq/Kanban";
import { EmptyState, Loading, PageHeader, StatCard } from "@/components/hq/ui";
import { Notice, Segmented } from "@/components/hq/sales/bits";
import { useToday } from "@/components/hq/sales/useToday";
import { cn, formatINRCompact, formatNumber, isoDate } from "@/lib/utils";
import { DueChip, ProgressBar, ServiceChips, StageBadge } from "./bits";
import { addDays, dueState, isClosed, isLive, parseIso, progressOf, projectMoney, servicesOf, shortDate, str, type Rec } from "./logic";
import { newProjectDraft, ProjectFormDrawer } from "./ProjectFormDrawer";

const projectsDef = getCollection("projects")!;
type View = "board" | "timeline" | "calendar" | "table";

export function ProjectsHome() {
  const router = useRouter();
  const params = useSearchParams();
  const today = useToday();
  const { user, store } = useHq();
  const showMoney = useShowMoney();
  const { records, loading, error, save } = useCollection("projects");
  const clientsQ = useCollection(can(user, getCollection("clients")!.read) ? "clients" : "__none");
  const { records: invoices } = useCollection(showMoney ? "invoices" : "__none");
  const { records: shoots } = useCollection(can(user, getCollection("shoots")!.read) ? "shoots" : "__none");
  const { records: deliverables } = useCollection("deliverables");
  const canWrite = can(user, projectsDef.write) && store.writable;
  const clients = useMemo(() => new Map(clientsQ.records.map((c) => [c.id, c])), [clientsQ.records]);

  const [view, setView] = useState<View>("board");
  const [q, setQ] = useState("");
  const [service, setService] = useState("");
  const [showClosed, setShowClosed] = useState(false);
  const [draft, setDraft] = useState<Record<string, unknown> | null>(null);
  const [moving, setMoving] = useState<string | null>(null);
  const [moveError, setMoveError] = useState("");

  // /hq/projects?new=1&client=… opens the form straight away (from a client profile)
  useEffect(() => {
    if (params.get("new") && canWrite) {
      const client = params.get("client") ?? "";
      const c = clients.get(client);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDraft(newProjectDraft({ clientId: client, lead: user.name, startDate: isoDate(), title: c ? `${str(c.name)} — ` : "", clientContact: str(c?.contactName), clientContactPhone: str(c?.phone) }));
      router.replace("/hq/projects", { scroll: false });
    }
  }, [params, canWrite, clients, router, user.name]);

  const clientName = (p: Rec) => str(clients.get(str(p.clientId))?.name);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return records.filter((p) => {
      if (!showClosed && isClosed(p) && view !== "table") return false;
      if (service && !servicesOf(p).includes(service)) return false;
      if (!s) return true;
      return [p.title, clientName(p), p.lead, ...(Array.isArray(p.team) ? p.team : [])].some((v) => str(v).toLowerCase().includes(s));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [records, q, service, showClosed, view, clients]);

  const stats = useMemo(() => {
    const live = records.filter(isLive);
    const dueSoon = live.filter((p) => ["overdue", "today", "soon"].includes(dueState(p, today)));
    const overdue = live.filter((p) => dueState(p, today) === "overdue").length;
    const review = records.filter((p) => p.stage === "review").length;
    const toInvoice = records.filter((p) => !isClosed(p) || p.stage === "completed").reduce((s, p) => s + projectMoney(p, invoices).toInvoice, 0);
    const outstanding = records.reduce((s, p) => {
      const m = projectMoney(p, invoices);
      return s + Math.max(0, m.invoiced - m.received);
    }, 0);
    return { live: live.length, dueSoon: dueSoon.length, overdue, review, toInvoice, outstanding, support: records.filter((p) => p.stage === "support").length };
  }, [records, invoices, today]);

  async function move(p: Rec, stage: string) {
    setMoving(p.id);
    setMoveError("");
    try {
      await save({ ...p, stage });
    } catch (e) {
      setMoveError(e instanceof Error ? e.message : "Could not move the project");
    } finally {
      setMoving(null);
    }
  }

  const tableExtra: ExtraColumn<BaseRecord>[] = [
    { key: "client", label: "Client", sortValue: (r) => clientName(r), render: (r) => <span className="text-sm">{clientName(r) || "—"}</span> },
    { key: "progress", label: "Checklist", sortValue: (r) => progressOf(r) ?? -1, render: (r) => (progressOf(r) === null ? <span className="text-xs text-blueprint">—</span> : <span className="tabular text-xs">{Math.round((progressOf(r) ?? 0) * 100)}%</span>) },
  ];

  return (
    <div>
      <PageHeader
        eyebrow="Delivery"
        title="Projects"
        icon="FolderKanban"
        description="Every client project from kick-off to handover — milestones, deliverables, revisions, shoots and the client's inputs in one place."
        actions={
          <>
            <Segmented
              label="View"
              value={view}
              onChange={setView}
              options={[
                { value: "board", label: (<><Columns3 className="size-3.5" aria-hidden /> Board</>) },
                { value: "timeline", label: (<><List className="size-3.5" aria-hidden /> Timeline</>) },
                { value: "calendar", label: (<><CalendarDays className="size-3.5" aria-hidden /> Calendar</>) },
                { value: "table", label: (<><Table2 className="size-3.5" aria-hidden /> Table</>) },
              ]}
            />
            {canWrite && (
              <Button size="sm" className="h-9" onClick={() => setDraft(newProjectDraft({ lead: user.name, startDate: isoDate() }))}>
                <Plus className="size-4" aria-hidden /> New project
              </Button>
            )}
          </>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard tone="dark" label="Live projects" value={formatNumber(stats.live)} sub={`${stats.support} in their support period`} />
        <StatCard label="Due within 7 days" value={formatNumber(stats.dueSoon)} sub={stats.overdue ? <span className="font-semibold text-bad">{stats.overdue} overdue</span> : "Nothing overdue"} />
        <StatCard label="With the client" value={formatNumber(stats.review)} sub="Waiting on review or feedback" />
        {showMoney ? (
          <StatCard label="Still to invoice" value={formatINRCompact(stats.toInvoice)} sub={stats.outstanding ? `${formatINRCompact(stats.outstanding)} invoiced, not yet received` : "Agreed amounts not yet billed"} />
        ) : (
          <StatCard label="Deliverables open" value={formatNumber(deliverables.filter((d) => !["approved", "delivered"].includes(str(d.status))).length)} sub="Across every project" />
        )}
      </div>

      {error && <Notice tone="bad" className="mb-4">{error}</Notice>}
      {moveError && <Notice tone="bad" className="mb-4">{moveError}</Notice>}

      {view !== "table" && (
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-blueprint" aria-hidden />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search projects, clients, people…" aria-label="Search projects" className="pl-9" />
          </div>
          <Select value={service} onChange={(e) => setService(e.target.value)} aria-label="Service" className="w-auto">
            <option value="">All services</option>
            {SERVICE_OPTS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
          <label className="inline-flex items-center gap-2 text-xs text-charcoal">
            <input type="checkbox" checked={showClosed} onChange={(e) => setShowClosed(e.target.checked)} className="accent-[#0d0d0d]" /> Show completed &amp; cancelled
          </label>
          {moving && (
            <span className="inline-flex items-center gap-1.5 text-xs text-charcoal">
              <Loader2 className="size-3.5 animate-spin" aria-hidden /> Saving…
            </span>
          )}
        </div>
      )}

      {loading ? (
        <Loading />
      ) : !records.length && view !== "table" ? (
        <EmptyState
          icon="FolderKanban"
          title="No projects yet"
          description="Start one from an accepted quote (it brings the milestones), or create it here."
          action={
            <div className="flex flex-wrap justify-center gap-2">
              {canWrite && (
                <Button size="sm" onClick={() => setDraft(newProjectDraft({ lead: user.name, startDate: isoDate() }))}>
                  <Plus className="size-4" /> New project
                </Button>
              )}
              <Button size="sm" variant="secondary" href="/hq/proposals">
                Open quotes
              </Button>
            </div>
          }
        />
      ) : view === "board" ? (
        <Kanban
          records={filtered.map((p) => (p.stage ? p : { ...p, stage: "kickoff" }))}
          field="stage"
          columns={PROJECT_STAGES.filter((s) => showClosed || !["completed", "cancelled"].includes(s.value))}
          disabled={!canWrite}
          onMove={move}
          onOpen={(p) => router.push(`/hq/projects/${p.id}`)}
          renderCard={(p) => <ProjectCard p={p} client={clientName(p)} today={today} busy={moving === p.id} money={showMoney ? projectMoney(p, invoices) : null} />}
        />
      ) : view === "timeline" ? (
        <Timeline projects={filtered} clientName={clientName} today={today} />
      ) : view === "calendar" ? (
        <ProjectCalendar projects={filtered} shoots={shoots} deliverables={deliverables} today={today || isoDate()} clientName={clientName} />
      ) : (
        <CollectionManager name="projects" columns={["title", "service", "stage", "lead", "dueDate"]} extraColumns={tableExtra} hideNew onOpen={(r) => router.push(`/hq/projects/${r.id}`)} emptyText="No projects yet." />
      )}

      <ProjectFormDrawer value={draft} onChange={setDraft} onClose={() => setDraft(null)} onSaved={(r, isNew) => isNew && router.push(`/hq/projects/${r.id}`)} />
    </div>
  );
}

function ProjectCard({ p, client, today, busy, money }: { p: Rec; client: string; today: string | null; busy: boolean; money: ReturnType<typeof projectMoney> | null }) {
  const progress = progressOf(p);
  return (
    <div className={cn("relative", busy && "opacity-60")}>
      <Link href={`/hq/projects/${p.id}`} onClick={(e) => e.stopPropagation()} draggable={false} className="line-clamp-2 font-semibold leading-snug text-graphite hover:underline">
        {str(p.title) || "Untitled project"}
      </Link>
      {client && <p className="mt-0.5 truncate text-xs text-blueprint">{client}</p>}
      <ServiceChips project={p} className="mt-2" />
      {progress !== null && (
        <div className="mt-3">
          <div className="mb-1 flex justify-between text-[10px] text-blueprint">
            <span>Checklist</span>
            <span className="tabular">{Math.round(progress * 100)}%</span>
          </div>
          <ProgressBar value={progress} />
        </div>
      )}
      <div className="mt-3 flex items-center justify-between gap-2 border-t border-dashed border-graphite/12 pt-2.5">
        <DueChip project={p} today={today} />
        {money && money.agreed > 0 && <span className="tabular text-xs font-semibold text-graphite">{formatINRCompact(money.agreed)}</span>}
      </div>
      {p.lead ? <p className="mt-1.5 truncate text-[11px] text-charcoal">Lead: {str(p.lead)}</p> : null}
    </div>
  );
}

function Timeline({ projects, clientName, today }: { projects: Rec[]; clientName: (p: Rec) => string; today: string | null }) {
  const sorted = [...projects].sort((a, b) => (str(a.dueDate) || "9999").localeCompare(str(b.dueDate) || "9999"));
  if (!sorted.length) return <p className="py-8 text-center text-sm text-charcoal">No projects match.</p>;
  const groups = new Map<string, Rec[]>();
  for (const p of sorted) {
    const d = str(p.dueDate);
    const key = d ? parseIso(d).toLocaleDateString("en-IN", { month: "long", year: "numeric" }) : "No delivery date";
    groups.set(key, [...(groups.get(key) ?? []), p]);
  }
  return (
    <div className="space-y-6">
      {[...groups.entries()].map(([month, list]) => (
        <section key={month}>
          <h3 className="annot mb-2 text-blueprint">{month}</h3>
          <ul className="divide-y divide-graphite/10 rounded-[var(--radius-md)] border border-graphite/12 bg-paper-50">
            {list.map((p) => {
              const progress = progressOf(p);
              return (
                <li key={p.id}>
                  <Link href={`/hq/projects/${p.id}`} className="grid gap-3 px-4 py-3 hover:bg-graphite/[0.03] sm:grid-cols-[1fr_auto_120px_150px] sm:items-center">
                    <span className="min-w-0">
                      <span className="block truncate font-semibold text-graphite">{str(p.title)}</span>
                      <span className="block truncate text-xs text-blueprint">{[clientName(p), str(p.lead)].filter(Boolean).join(" · ")}</span>
                    </span>
                    <ServiceChips project={p} max={2} />
                    <span>{progress === null ? <span className="text-xs text-blueprint">—</span> : <ProgressBar value={progress} />}</span>
                    <span className="flex items-center justify-end gap-2">
                      <StageBadge stage={p.stage} />
                    </span>
                    <span className="sm:col-span-4">
                      <DueChip project={p} today={today} />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}

/* ─────────────────────────── calendar ─────────────────────────── */

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function shiftMonth(month: string, delta: number) {
  const d = parseIso(`${month}-01`);
  d.setMonth(d.getMonth() + delta);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function ProjectCalendar({ projects, shoots, deliverables, today, clientName }: { projects: Rec[]; shoots: Rec[]; deliverables: Rec[]; today: string; clientName: (p: Rec) => string }) {
  const [month, setMonth] = useState(today.slice(0, 7));
  const ids = new Set(projects.map((p) => p.id));
  const byDate = useMemo(() => {
    const m = new Map<string, { kind: "due" | "start" | "shoot" | "deliverable"; label: string; href: string }[]>();
    const add = (d: string, e: { kind: "due" | "start" | "shoot" | "deliverable"; label: string; href: string }) => {
      if (!d) return;
      const k = d.slice(0, 10);
      m.set(k, [...(m.get(k) ?? []), e]);
    };
    for (const p of projects) {
      add(str(p.dueDate), { kind: "due", label: `Due: ${str(p.title)}`, href: `/hq/projects/${p.id}` });
      add(str(p.startDate), { kind: "start", label: `Start: ${str(p.title)}`, href: `/hq/projects/${p.id}` });
    }
    for (const s of shoots) if (!s.projectId || ids.has(str(s.projectId))) if (str(s.status) !== "cancelled") add(str(s.date), { kind: "shoot", label: `Shoot: ${str(s.title)}`, href: `/hq/shoots/${s.id}` });
    for (const d of deliverables) if (ids.has(str(d.projectId)) && !["approved", "delivered"].includes(str(d.status))) add(str(d.dueDate), { kind: "deliverable", label: str(d.title), href: `/hq/projects/${str(d.projectId)}?tab=deliverables` });
    return m;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projects, shoots, deliverables]);

  const days = useMemo(() => {
    const first = parseIso(`${month}-01`);
    const offset = (first.getDay() + 6) % 7;
    const start = addDays(`${month}-01`, -offset);
    const all = Array.from({ length: 42 }, (_, i) => addDays(start, i));
    return all.slice(35).every((d) => !d.startsWith(month)) ? all.slice(0, 35) : all;
  }, [month]);

  const tone = { due: "border-l-bad bg-bad/10", start: "border-l-ok bg-ok/10", shoot: "border-l-violet bg-violet/10", deliverable: "border-l-graphite bg-graphite/[0.06]" } as const;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => setMonth(shiftMonth(month, -1))} className="grid size-9 place-items-center rounded-[var(--radius-sm)] border border-graphite/15 bg-paper-50 hover:border-graphite/40" aria-label="Previous month">
          <ChevronLeft className="size-4" />
        </button>
        <button type="button" onClick={() => setMonth(shiftMonth(month, 1))} className="grid size-9 place-items-center rounded-[var(--radius-sm)] border border-graphite/15 bg-paper-50 hover:border-graphite/40" aria-label="Next month">
          <ChevronRight className="size-4" />
        </button>
        <Button variant="secondary" size="sm" className="h-9" onClick={() => setMonth(today.slice(0, 7))}>
          Today
        </Button>
        <h2 className="ml-2 text-lg font-bold tracking-tight">{parseIso(`${month}-01`).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}</h2>
        <span className="ml-auto flex flex-wrap gap-3 text-[11px] text-charcoal">
          <span className="inline-flex items-center gap-1"><span className="size-2 rounded-full bg-ok" /> Start</span>
          <span className="inline-flex items-center gap-1"><span className="size-2 rounded-full bg-bad" /> Delivery</span>
          <span className="inline-flex items-center gap-1"><span className="size-2 rounded-full bg-violet" /> Shoot</span>
          <span className="inline-flex items-center gap-1"><span className="size-2 rounded-full bg-graphite" /> Deliverable due</span>
        </span>
      </div>
      <div className="overflow-hidden rounded-[var(--radius-md)] border border-graphite/15 bg-paper-50">
        <div className="grid grid-cols-7 bg-graphite text-paper">
          {WEEKDAYS.map((d) => (
            <div key={d} className="annot py-2 text-center text-[10px] text-paper/70">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((d) => {
            const items = byDate.get(d) ?? [];
            const inMonth = d.startsWith(month);
            return (
              <div key={d} className={cn("min-h-28 border-b border-r border-graphite/10 p-1.5", !inMonth && "bg-graphite/[0.03]", d === today && "bg-lime/15")}>
                <p className={cn("tabular mb-1 text-right text-[11px]", inMonth ? "text-charcoal" : "text-blueprint/60", d === today && "font-bold text-graphite")}>{Number(d.slice(8, 10))}</p>
                <ul className="space-y-1">
                  {items.slice(0, 4).map((e, i) => (
                    <li key={i}>
                      <Link href={e.href} className={cn("block truncate rounded-[3px] border-l-2 px-1.5 py-0.5 text-[10.5px] text-graphite hover:brightness-95", tone[e.kind])} title={e.label}>
                        {e.label}
                      </Link>
                    </li>
                  ))}
                  {items.length > 4 && <li className="px-1 text-[10px] text-blueprint">+{items.length - 4} more</li>}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
      <p className="text-xs text-blueprint">{projects.filter((p) => str(p.dueDate).startsWith(month)).length} deliveries this month · {shortDate(`${month}-01`)} – {shortDate(addDays(shiftMonth(month, 1) + "-01", -1))}</p>
    </div>
  );
}

