/**
 * Sales helpers shared by Enquiries, Clients CRM and Quotes.
 * Pure functions only — safe to import from client and server code.
 */
import { CLIENT_STAGES, type BaseRecord } from "@/lib/hq/collections";
import { isoDate } from "@/lib/utils";

/* ─────────────────────────── stages ─────────────────────────── */

export type StageId = "lead" | "contacted" | "discovery" | "quoted" | "negotiation" | "won" | "active" | "lost" | "nurture";

/** Probability a client in each stage ends up signing (used for the weighted forecast). */
export const STAGE_PROBABILITY: Record<StageId, number> = {
  lead: 0.05,
  contacted: 0.1,
  discovery: 0.25,
  quoted: 0.45,
  negotiation: 0.7,
  won: 1,
  active: 1,
  lost: 0,
  nurture: 0,
};

/** Stages that are still being actively worked. */
export const OPEN_STAGES: StageId[] = ["lead", "contacted", "discovery", "quoted", "negotiation"];

/** Linear sales track shown on the client profile (lost / nurture sit outside it). */
export const TRACK_STAGES: StageId[] = ["lead", "contacted", "discovery", "quoted", "negotiation", "won", "active"];

export function stageLabel(stage: unknown) {
  return CLIENT_STAGES.find((s) => s.value === stage)?.label ?? (stage ? String(stage) : "Lead");
}

export function stageProbability(stage: unknown) {
  return STAGE_PROBABILITY[(stage as StageId) ?? "lead"] ?? 0;
}

export function stageIndex(stage: unknown) {
  return TRACK_STAGES.indexOf((stage as StageId) ?? "lead");
}

/* ─────────────────────────── deal value ─────────────────────────── */

/**
 * Deal value used by the pipeline: the entered expected value, else the latest open quote's total for this client
 * (pass the client's quotes in), else nothing. HQ never invents a number from a budget band.
 */
export function clientValue(r: Record<string, unknown>, quotes: BaseRecord[] = []): { value: number; estimated: boolean } {
  const entered = Number(r.dealValue) || 0;
  if (entered > 0) return { value: entered, estimated: false };
  const open = quotes
    .filter((q) => q.clientId === r.id && q.status !== "rejected" && q.status !== "expired")
    .sort((a, b) => String(b.date ?? "").localeCompare(String(a.date ?? "")))[0];
  const fromQuote = Number(open?.total) || 0;
  return { value: fromQuote, estimated: fromQuote > 0 };
}

/* ─────────────────────────── dates ─────────────────────────── */

/** YYYY-MM-DD shifted by n days (local time). */
export function addDays(base: string, n: number) {
  const [y, m, d] = base.split("-").map(Number);
  const dt = new Date(y, (m || 1) - 1, d || 1);
  dt.setDate(dt.getDate() + n);
  return isoDate(dt);
}

export function todayIso() {
  return isoDate(new Date());
}

/** Whole days from `from` to `to` (both YYYY-MM-DD). */
export function daysBetween(from: string, to: string) {
  const a = Date.UTC(...(from.split("-").map(Number) as [number, number, number]));
  const b = Date.UTC(...(to.split("-").map(Number) as [number, number, number]));
  return Math.round((b - a) / 86_400_000);
}

export type FollowUpState = "none" | "overdue" | "today" | "soon" | "later";

export function followUpState(date: unknown, today: string): FollowUpState {
  const d = typeof date === "string" ? date.slice(0, 10) : "";
  if (!d || !today) return "none";
  if (d < today) return "overdue";
  if (d === today) return "today";
  return daysBetween(today, d) <= 3 ? "soon" : "later";
}

/** "Today", "Yesterday" or a short date, for inbox timestamps. */
export function relativeDay(value: unknown, today: string) {
  if (!value) return "—";
  const d = new Date(String(value));
  if (Number.isNaN(d.getTime())) return "—";
  const iso = isoDate(d);
  const time = d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  if (today && iso === today) return `Today · ${time}`;
  if (today && iso === addDays(today, -1)) return `Yesterday · ${time}`;
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: today && iso.slice(0, 4) === today.slice(0, 4) ? undefined : "numeric" });
}

/** Records created within the last n days. */
export function isWithinDays(value: unknown, n: number, today: string) {
  if (!value || !today) return false;
  const d = new Date(String(value));
  if (Number.isNaN(d.getTime())) return false;
  const diff = daysBetween(isoDate(d), today);
  return diff >= 0 && diff < n;
}

/* ─────────────────────────── misc ─────────────────────────── */

export function str(v: unknown) {
  return v === undefined || v === null ? "" : String(v);
}

export function byDateDesc<T extends BaseRecord>(key: string) {
  return (a: T, b: T) => str(b[key]).localeCompare(str(a[key])) || str(b.createdAt).localeCompare(str(a.createdAt));
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
