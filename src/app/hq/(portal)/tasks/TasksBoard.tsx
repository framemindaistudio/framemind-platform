"use client";

import { useCallback, useMemo, useState } from "react";
import { Check, Circle, Columns3, List, Loader2, Search, X } from "lucide-react";
import { CollectionManager, type ExtraColumn } from "@/components/hq/CollectionManager";
import { Kanban } from "@/components/hq/Kanban";
import { EmptyState, Loading, PageHeader } from "@/components/hq/ui";
import { useCollection, useHq } from "@/components/hq/data";
import { compareTasks, isMine } from "@/components/hq/dashboard/metrics";
import { dueLabel, isIsoDate, useNow, type DueTone } from "@/components/hq/dashboard/time";
import { Badge, statusTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/form";
import { can } from "@/lib/hq/roles";
import { site } from "@/lib/site";
import { cn } from "@/lib/utils";
import { QuickAdd } from "./QuickAdd";
import { TaskDrawer } from "./TaskDrawer";
import { AREAS, PRIORITIES, STATUSES, emptyFilters, initialsOf, isDone, isFiltered, isOverdue, matchesFilters, shortDate, str, tasksDef, type DueFilter, type Filters, type Task } from "./taskUtils";

const DONE_ON_BOARD = 12;

const dueToneClass: Record<DueTone, string> = {
  bad: "bg-bad/10 text-bad",
  warn: "bg-warn/12 text-warn",
  info: "bg-info/10 text-info",
  neutral: "bg-graphite/[0.06] text-charcoal",
};

const DUE_OPTIONS: { value: DueFilter; label: string }[] = [
  { value: "all", label: "Any due date" },
  { value: "overdue", label: "Overdue" },
  { value: "week", label: "Due this week" },
  { value: "month", label: "Next 30 days" },
  { value: "nodate", label: "No due date" },
];

function priorityBadge(p: string) {
  return p === "low" ? "outline" : statusTone(p);
}

export function TasksBoard({ initialView = "board" }: { initialView?: "board" | "list" }) {
  const { user, store } = useHq();
  const { records, loading, error, save, remove } = useCollection<Task>("tasks");
  const now = useNow();
  const today = now?.today ?? null;
  const canWrite = can(user, tasksDef.write) && store.writable;

  const [view, setView] = useState<"board" | "list">(initialView);
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [editing, setEditing] = useState<Task | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");

  const founders = useMemo(() => site.founders.map((f) => f.name), []);
  const mine = useMemo(() => founders.find((n) => isMine(n, user)) ?? user.name, [founders, user]);

  const assignees = useMemo(() => {
    const set = new Set<string>([...founders, user.name]);
    for (const r of records) if (str(r.assignee).trim()) set.add(str(r.assignee).trim());
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [records, founders, user.name]);

  const filtered = useMemo(() => records.filter((t) => matchesFilters(t, filters, user, today)).sort(compareTasks), [records, filters, user, today]);

  const stats = useMemo(() => {
    let open = 0;
    let doing = 0;
    let blocked = 0;
    let overdue = 0;
    let done = 0;
    for (const t of filtered) {
      const s = str(t.status);
      if (s === "done") done++;
      else open++;
      if (s === "doing") doing++;
      if (s === "blocked") blocked++;
      if (isOverdue(t, today)) overdue++;
    }
    return { open, doing, blocked, overdue, done, total: filtered.length };
  }, [filtered, today]);

  /* The board shows every open task but only the most recently finished ones. */
  const { boardRecords, hiddenDone } = useMemo(() => {
    const open = filtered.filter((t) => !isDone(t));
    const done = filtered.filter(isDone).sort((a, b) => str(b.updatedAt).localeCompare(str(a.updatedAt)));
    return { boardRecords: [...open, ...done.slice(0, DONE_ON_BOARD)], hiddenDone: Math.max(0, done.length - DONE_ON_BOARD) };
  }, [filtered]);

  const move = useCallback(
    async (t: Task, status: string) => {
      setActionError("");
      setBusyId(t.id);
      try {
        await save({ ...t, status });
      } catch (e) {
        setActionError(e instanceof Error ? e.message : "Could not update the task");
      } finally {
        setBusyId(null);
      }
    },
    [save],
  );

  const add = useCallback(async (rec: Record<string, unknown>) => void (await save(rec)), [save]);

  const set = <K extends keyof Filters>(k: K, v: Filters[K]) => setFilters((f) => ({ ...f, [k]: v }));
  const switchView = (v: "board" | "list") => {
    setView(v);
    if (v === "list") setFilters((f) => ({ ...f, q: "" }));
  };

  const listFilter = useCallback((r: Task) => matchesFilters(r, { ...filters, q: "" }, user, today), [filters, user, today]);
  const listColumns = useMemo<ExtraColumn<Task>[]>(
    () => [
      {
        key: "timing",
        label: "Timing",
        sortValue: (r) => (isIsoDate(r.dueDate) ? r.dueDate : "9999"),
        render: (r) => {
          const due = isDone(r) ? null : today ? dueLabel(r.dueDate, today) : null;
          return due ? <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", dueToneClass[due.tone])}>{due.text}</span> : <span className="text-blueprint">—</span>;
        },
      },
    ],
    [today],
  );

  const readOnlyReason = store.writable || store.viewOnly ? "You have view-only access to tasks." : "HQ is in read-only mode.";

  const statCells: { label: string; value: number; tone?: "bad" }[] = [
    { label: "Open", value: stats.open },
    { label: "Doing", value: stats.doing },
    { label: "Blocked", value: stats.blocked },
    { label: "Overdue", value: stats.overdue, tone: stats.overdue ? "bad" : undefined },
  ];

  return (
    <div className="mx-auto max-w-[1440px]">
      <PageHeader
        eyebrow="Shared board"
        icon="ListChecks"
        title="Tasks"
        description="Everything the team has to do, who owns it and when it is due. Drag a card to move it, or use the Move menu on touch screens."
        actions={
          <div role="group" aria-label="View" className="inline-flex overflow-hidden rounded-[var(--radius-sm)] border border-graphite/20 bg-paper-50">
            {(
              [
                ["board", "Board", Columns3],
                ["list", "List", List],
              ] as const
            ).map(([v, label, Icon]) => (
              <button
                key={v}
                type="button"
                aria-pressed={view === v}
                onClick={() => switchView(v)}
                className={cn("inline-flex h-9 items-center gap-1.5 px-3.5 text-xs font-semibold transition-colors", view === v ? "bg-graphite text-paper" : "text-charcoal hover:bg-graphite/5")}
              >
                <Icon className="size-4" aria-hidden /> {label}
              </button>
            ))}
          </div>
        }
      />

      {!store.writable && !store.viewOnly && <p className="mb-4 rounded-[var(--radius-sm)] border border-warn/30 bg-warn/10 px-3 py-2 text-sm text-warn">HQ is in read-only mode, so tasks can be viewed but not changed. See Settings → System status.</p>}

      {/* ledger strip */}
      <div className="mb-4 overflow-hidden rounded-[var(--radius-md)] border border-graphite/12 bg-paper-50">
        <dl className="grid grid-cols-2 gap-px bg-graphite/10 sm:grid-cols-5">
          {statCells.map((s) => (
            <div key={s.label} className="bg-paper-50 px-4 py-3">
              <dt className="annot text-[10px] text-blueprint">{s.label}</dt>
              <dd className={cn("tabular mt-1 text-xl font-bold", s.tone === "bad" ? "text-bad" : "text-graphite")}>{loading ? "…" : s.value}</dd>
            </div>
          ))}
          <div className="col-span-2 bg-paper-50 px-4 py-3 sm:col-span-1">
            <dt className="annot text-[10px] text-blueprint">Done</dt>
            <dd className="tabular mt-1 text-xl font-bold text-graphite">
              {loading ? "…" : stats.done}
              <span className="text-sm font-medium text-blueprint"> / {stats.total}</span>
            </dd>
          </div>
        </dl>
        <div className="h-1 bg-graphite/10" role="progressbar" aria-label="Share of tasks completed" aria-valuemin={0} aria-valuemax={100} aria-valuenow={stats.total ? Math.round((stats.done / stats.total) * 100) : 0}>
          <div className="h-full bg-graphite transition-[width] duration-700" style={{ width: `${stats.total ? (stats.done / stats.total) * 100 : 0}%` }} />
        </div>
      </div>

      {canWrite && <QuickAdd assignees={assignees} defaultAssignee={mine} onAdd={add} />}

      {/* filters */}
      <div className="no-print mb-4 flex flex-wrap items-center gap-2" role="search" aria-label="Filter tasks">
        {view === "board" && (
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-blueprint" aria-hidden />
            <Input value={filters.q} onChange={(e) => set("q", e.target.value)} placeholder="Search tasks…" aria-label="Search tasks" className="pl-9" />
          </div>
        )}
        <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap">
          <Select value={filters.assignee} onChange={(e) => set("assignee", e.target.value)} aria-label="Filter by assignee" className="sm:w-48">
            <option value="all">Everyone</option>
            <option value="me">Assigned to me</option>
            {assignees.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
            <option value="none">Unassigned</option>
          </Select>
          <Select value={filters.area} onChange={(e) => set("area", e.target.value)} aria-label="Filter by area" className="sm:w-40">
            <option value="">All areas</option>
            {AREAS.map((a) => (
              <option key={a.value} value={a.value}>
                {a.label}
              </option>
            ))}
          </Select>
          <Select value={filters.priority} onChange={(e) => set("priority", e.target.value)} aria-label="Filter by priority" className="sm:w-40">
            <option value="">All priorities</option>
            {PRIORITIES.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </Select>
          <Select value={filters.due} onChange={(e) => set("due", e.target.value as DueFilter)} aria-label="Filter by due date" className="sm:w-44">
            {DUE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </div>
        {isFiltered(filters) && (
          <Button variant="ghost" size="sm" className="h-10" onClick={() => setFilters(emptyFilters)}>
            <X className="size-4" aria-hidden /> Clear filters
          </Button>
        )}
        {isFiltered(filters) && !loading && (
          <span className="text-xs text-blueprint" aria-live="polite">
            Showing {filtered.length} of {records.length}
          </span>
        )}
      </div>

      {(error || actionError) && (
        <p role="alert" className="mb-3 rounded border border-bad/30 bg-bad/10 px-3 py-2 text-sm text-bad">
          {actionError || error}
        </p>
      )}

      {loading ? (
        <Loading label="Loading tasks…" />
      ) : view === "list" ? (
        <CollectionManager<Task> name="tasks" filter={listFilter} extraColumns={listColumns} defaults={{ status: "todo", assignee: mine }} newLabel="New task" emptyText="Nothing matches these filters, or no tasks have been added yet." />
      ) : !records.length ? (
        <EmptyState
          icon="ListChecks"
          title="No tasks yet"
          description={canWrite ? "Add the first one above. Every change is recorded in the activity log. Interns see a task only when “Show this task to interns” is ticked on it." : "Tasks a founder shares with you will appear here."}
        />
      ) : !filtered.length ? (
        <EmptyState
          icon="ListChecks"
          title="No tasks match these filters"
          description="Try a wider date range or another assignee."
          action={
            <Button size="sm" variant="secondary" onClick={() => setFilters(emptyFilters)}>
              Clear filters
            </Button>
          }
        />
      ) : (
        <Kanban<Task>
          records={boardRecords}
          field="status"
          columns={STATUSES}
          disabled={!canWrite}
          onMove={move}
          onOpen={setEditing}
          columnFooter={(value, items) => {
            if (value === "done") return hiddenDone ? `${hiddenDone} older completed task${hiddenDone === 1 ? "" : "s"} in List view` : `${items.length} completed`;
            const late = items.filter((t) => isOverdue(t, today)).length;
            return late ? <span className="font-semibold text-bad">{late} overdue</span> : items.length ? "None overdue" : "Drop a card here";
          }}
          renderCard={(t) => <TaskCard task={t} today={today} canWrite={canWrite} busy={busyId === t.id} onOpen={setEditing} onMove={move} />}
        />
      )}

      <TaskDrawer
        task={editing}
        canWrite={canWrite}
        readOnlyReason={readOnlyReason}
        onClose={() => setEditing(null)}
        onSave={async (r) => void (await save(r))}
        onRemove={async (id) => void (await remove(id))}
      />
    </div>
  );
}

function TaskCard({ task, today, canWrite, busy, onOpen, onMove }: { task: Task; today: string | null; canWrite: boolean; busy: boolean; onOpen: (t: Task) => void; onMove: (t: Task, status: string) => void }) {
  const done = isDone(task);
  const priority = str(task.priority) || "medium";
  const due = !done && today ? dueLabel(task.dueDate, today) : null;
  const assignee = str(task.assignee);
  const status = str(task.status);

  return (
    <div className={cn("space-y-2.5 transition-opacity", busy && "opacity-50")}>
      <div className="flex items-start gap-2">
        {canWrite && (
          <button
            type="button"
            aria-label={done ? `Reopen “${str(task.title)}”` : `Mark “${str(task.title)}” done`}
            onClick={(e) => {
              e.stopPropagation();
              onMove(task, done ? "todo" : "done");
            }}
            className="mt-0.5 shrink-0 rounded-full text-blueprint hover:text-graphite"
          >
            {busy ? <Loader2 className="size-[18px] animate-spin" aria-hidden /> : done ? <Check className="size-[18px] rounded-full bg-graphite p-0.5 text-paper" aria-hidden /> : <Circle className="size-[18px]" aria-hidden />}
          </button>
        )}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpen(task);
          }}
          className={cn("min-w-0 flex-1 text-left text-[13px] font-semibold leading-snug text-graphite hover:underline", done && "text-blueprint line-through")}
        >
          {str(task.title) || "Untitled task"}
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {!done && (
          <Badge tone={priorityBadge(priority)} className="px-2 py-0 text-[10px]">
            {priority}
          </Badge>
        )}
        {str(task.area) && <span className="rounded-full border border-graphite/15 px-2 text-[10px] font-medium text-charcoal">{str(task.area)}</span>}
        {canWrite && task.forInterns === true && (
          <span className="rounded-full border border-info/30 bg-info/10 px-2 text-[10px] font-medium text-info" title="The interns login can see this task">
            Interns
          </span>
        )}
        {due ? (
          <span className={cn("rounded-full px-2 py-px text-[10px] font-semibold", dueToneClass[due.tone])}>{due.text}</span>
        ) : isIsoDate(task.dueDate) ? (
          <span className="font-mono text-[10px] text-blueprint">{shortDate(task.dueDate)}</span>
        ) : null}
      </div>

      <div className="flex items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-1.5" title={assignee || "Unassigned"}>
          <span className="grid size-5 shrink-0 place-items-center rounded-full border border-graphite/20 bg-paper font-mono text-[9px] font-semibold text-charcoal" aria-hidden>
            {assignee ? initialsOf(assignee) : "—"}
          </span>
          <span className="truncate text-[11px] text-blueprint">{assignee ? assignee.split(" ")[0] : "Unassigned"}</span>
        </span>
        {canWrite && (
          <span onClick={(e) => e.stopPropagation()}>
            <label className="sr-only" htmlFor={`mv-${task.id}`}>
              Move “{str(task.title)}” to another column
            </label>
            <select
              id={`mv-${task.id}`}
              value=""
              onChange={(e) => e.target.value && onMove(task, e.target.value)}
              className="max-w-[88px] cursor-pointer rounded border border-graphite/15 bg-paper-50 py-0.5 pl-1.5 pr-0.5 text-[10px] font-medium text-charcoal outline-none focus-visible:border-graphite"
            >
              <option value="">Move…</option>
              {STATUSES.filter((s) => s.value !== status).map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </span>
        )}
      </div>
    </div>
  );
}
