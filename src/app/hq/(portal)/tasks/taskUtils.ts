import { getCollection, type BaseRecord } from "@/lib/hq/collections";
import type { SessionUser } from "@/lib/hq/roles";
import { addDays, endOfWeek, isIsoDate, parseIso } from "@/components/hq/dashboard/time";
import { isMine } from "@/components/hq/dashboard/metrics";

export type Task = BaseRecord;

export const tasksDef = getCollection("tasks")!;

const optionsOf = (key: string) => tasksDef.fields.find((f) => f.key === key)?.options ?? [];

export const STATUSES = optionsOf("status");
export const AREAS = optionsOf("area");
export const PRIORITIES = optionsOf("priority");

export const str = (v: unknown) => (v === undefined || v === null ? "" : String(v));
export const isDone = (t: Task) => str(t.status) === "done";

export type DueFilter = "all" | "overdue" | "week" | "month" | "nodate";

export interface Filters {
  /** "all" | "me" | "none" (unassigned) | an assignee name */
  assignee: string;
  area: string;
  priority: string;
  due: DueFilter;
  q: string;
}

export const emptyFilters: Filters = { assignee: "all", area: "", priority: "", due: "all", q: "" };

export const isFiltered = (f: Filters) => f.assignee !== "all" || !!f.area || !!f.priority || f.due !== "all" || !!f.q.trim();

/** Is this open task past its due date? */
export function isOverdue(t: Task, today: string | null) {
  const due = t.dueDate;
  return !!today && !isDone(t) && isIsoDate(due) && due < today;
}

export function matchesFilters(t: Task, f: Filters, user: Pick<SessionUser, "name" | "username">, today: string | null) {
  if (f.assignee === "me" && !isMine(t.assignee, user)) return false;
  if (f.assignee === "none" && str(t.assignee).trim()) return false;
  if (f.assignee !== "all" && f.assignee !== "me" && f.assignee !== "none" && str(t.assignee) !== f.assignee) return false;
  if (f.area && str(t.area) !== f.area) return false;
  if (f.priority && str(t.priority) !== f.priority) return false;

  if (f.due !== "all") {
    const raw = t.dueDate;
    const due = isIsoDate(raw) ? raw : null;
    if (f.due === "nodate") {
      if (due) return false;
    } else {
      if (!today || !due) return false;
      if (f.due === "overdue" && !(due < today && !isDone(t))) return false;
      if (f.due === "week" && !(due >= today && due <= endOfWeek(today))) return false;
      if (f.due === "month" && !(due >= today && due <= addDays(today, 30))) return false;
    }
  }

  const q = f.q.trim().toLowerCase();
  if (q) {
    const hay = `${str(t.title)} ${str(t.description)} ${str(t.assignee)} ${str(t.area)}`.toLowerCase();
    if (!hay.includes(q)) return false;
  }
  return true;
}

export function initialsOf(name: unknown) {
  const parts = str(name).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "—";
  return (parts.length === 1 ? parts[0].slice(0, 2) : parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** "05 Oct" — local-date safe (no UTC shift). */
export function shortDate(iso: unknown, withYear = false) {
  if (!isIsoDate(iso)) return "";
  return parseIso(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", ...(withYear ? { year: "numeric" } : {}) });
}
