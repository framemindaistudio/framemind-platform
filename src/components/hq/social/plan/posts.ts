/**
 * The content plan in plain terms: what a post is, whose channel it goes out from, and the few counts the Plan tab
 * shows. No React here, and "today" is always passed in, so the server and the browser work out the same thing.
 */
import { getCollection, type BaseRecord, type FieldOption } from "@/lib/hq/collections";
import { site } from "@/lib/site";
import { addDays, isIso, parseIso } from "@/components/hq/printables/util";

/** The collection behind the plan: the studio's own social media, not client social work. */
export const PLAN = "contentCalendar";

export interface Post extends BaseRecord {
  account?: string;
  date?: string;
  platform?: string;
  format?: string;
  title?: string;
  pillar?: string;
  status?: string;
  caption?: string;
  link?: string;
  owner?: string;
  /** a design saved from Create: opens again at /hq/social?tab=create&d=<this> */
  design?: string;
}

const options = (key: string): FieldOption[] => getCollection(PLAN)?.fields.find((f) => f.key === key)?.options ?? [];

export const PLATFORM_OPTIONS = options("platform");
export const STATUS_OPTIONS = options("status");

/** The studio's brand channels. A post saved without an account belongs here. */
export const HOUSE = "FrameMind";

/** Whose channel a post goes out from. The short label drops "(personal)"; the mark is what the calendar prints. */
export const CHANNELS = options("account").map((o) => {
  const label = o.label.replace(/\s*\(.*\)$/, "");
  return { value: o.value, label, personal: o.value !== HOUSE, mark: label.slice(0, 1).toUpperCase() };
});

export const accountOf = (p: Pick<Post, "account">) => String(p.account || HOUSE);
export const channelOf = (p: Pick<Post, "account">) => CHANNELS.find((c) => c.value === accountOf(p));
export const channelLabel = (account: string) => CHANNELS.find((c) => c.value === account)?.label ?? account;

export const statusOf = (p: Pick<Post, "status">) => String(p.status || "idea");
export const statusLabel = (status: string) => STATUS_OPTIONS.find((o) => o.value === status)?.label ?? status;
export const isPublished = (p: Pick<Post, "status">) => statusOf(p) === "published";

/** "2026-10-14", or "" for a post that has no day yet. */
export const dayOf = (p: Pick<Post, "date">) => (isIso(p.date) ? p.date.slice(0, 10) : "");

/** Where a saved design opens again in Create, or "" when the post has none. The post's id rides along, so Create saves back to it. */
export function designLink(p: Pick<Post, "design" | "id">) {
  const d = typeof p.design === "string" ? p.design.trim() : "";
  return d ? `/hq/social?tab=create&d=${encodeURIComponent(d)}${p.id ? `&post=${encodeURIComponent(String(p.id))}` : ""}` : "";
}

/** Create, opened to make the design for a post that has none yet. */
export const newDesignLink = (p: Pick<Post, "id">) => `/hq/social?tab=create${p.id ? `&post=${encodeURIComponent(String(p.id))}` : ""}`;

/** Who usually makes the post: the founder for a personal profile, the creative lead for the studio's channels. */
export function ownerFor(account: string) {
  const first = channelLabel(account).toLowerCase();
  const founder = site.founders.find((f) => f.name.toLowerCase().startsWith(first));
  return (founder ?? site.founders.find((f) => f.id === "chinmay"))?.name ?? "";
}

/** "12 Oct" */
export const dayMonth = (iso: string) => parseIso(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
/** "12 to 18 Oct", or "28 Sep to 4 Oct" across two months */
export const daySpan = (start: string, end: string) => `${start.slice(0, 7) === end.slice(0, 7) ? parseIso(start).getDate() : dayMonth(start)} to ${dayMonth(end)}`;
/** "October" */
export const monthName = (month: string) => parseIso(`${month}-01`).toLocaleDateString("en-IN", { month: "long" });

/** Monday to Sunday around a day. */
export function weekOf(today: string) {
  if (!today) return null;
  const start = addDays(today, -((parseIso(today).getDay() + 6) % 7));
  return { start, end: addDays(start, 6) };
}

/** The four counts of the summary row; each one is also a way to narrow the list. */
export type Focus = "week" | "undated" | "designed" | "published";

export function inFocus(p: Post, focus: Focus, today: string, month: string) {
  const day = dayOf(p);
  if (focus === "week") {
    const w = weekOf(today);
    return !!w && !!day && day >= w.start && day <= w.end;
  }
  if (focus === "undated") return !day && !isPublished(p);
  if (focus === "designed") return statusOf(p) === "designed";
  return isPublished(p) && !!month && day.startsWith(month);
}
