/**
 * Projects: the shared logic behind the project list, the project page, shoots and the dashboard.
 * Pure functions only.
 */
import { PROJECT_STAGES, SERVICE_OPTS, invoiceTotals, type BaseRecord } from "@/lib/hq/collections";
import { isoDate, uid } from "@/lib/utils";

export type Rec = BaseRecord;

export const num = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
export const str = (v: unknown) => (v === undefined || v === null ? "" : String(v));
export const list = (v: unknown): string[] => (Array.isArray(v) ? v.map(String).filter(Boolean) : []);

/* ─────────────────────────── dates ─────────────────────────── */

export const isIso = (v: unknown) => typeof v === "string" && /^\d{4}-\d{2}-\d{2}/.test(v);
export function parseIso(iso: string) {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}
export function addDays(iso: string, n: number) {
  const d = parseIso(iso);
  d.setDate(d.getDate() + n);
  return isoDate(d);
}
export function daysBetween(from: string, to: string) {
  return Math.round((parseIso(to).getTime() - parseIso(from).getTime()) / 86_400_000);
}
export const longDate = (iso: unknown) => (isIso(iso) ? parseIso(str(iso)).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" }) : "—");
export const shortDate = (iso: unknown) => (isIso(iso) ? parseIso(str(iso)).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "—");

/* ─────────────────────────── stages & services ─────────────────────────── */

export const STAGE_ORDER = PROJECT_STAGES.map((s) => s.value);
export const OPEN_STAGES = ["kickoff", "discovery", "design", "build", "review", "launch"];
export const stageLabel = (v: unknown) => PROJECT_STAGES.find((s) => s.value === v)?.label ?? (v ? String(v) : "Kick-off");
export const serviceLabel = (v: unknown) => SERVICE_OPTS.find((s) => s.value === v)?.label ?? (v ? String(v) : "—");
export const isClosed = (p: Rec) => ["completed", "cancelled"].includes(str(p.stage));
export const isLive = (p: Rec) => OPEN_STAGES.includes(str(p.stage) || "kickoff");
export const servicesOf = (p: Rec) => {
  const all = list(p.services);
  const main = str(p.service);
  return main && !all.includes(main) ? [main, ...all] : all.length ? all : main ? [main] : [];
};

export const SERVICE_ICON: Record<string, string> = {
  websites: "Globe",
  brand: "Palette",
  software: "Code2",
  automations: "Workflow",
  photography: "Camera",
  videography: "Clapperboard",
  social: "Megaphone",
  coaching: "GraduationCap",
  vritta: "Newspaper",
  other: "Layers",
};

export type DueState = "none" | "done" | "overdue" | "today" | "soon" | "later";
export function dueState(p: Rec, today: string | null): DueState {
  if (isClosed(p) || ["support"].includes(str(p.stage))) return "done";
  const d = str(p.dueDate).slice(0, 10);
  if (!d || !today) return "none";
  if (d < today) return "overdue";
  if (d === today) return "today";
  return daysBetween(today, d) <= 7 ? "soon" : "later";
}

/* ─────────────────────────── checklist ─────────────────────────── */

export interface CheckItem {
  id: string;
  phase: string;
  label: string;
  done: boolean;
  doneBy?: string;
  doneOn?: string;
}

type Tpl = [phase: string, label: string][];

const KICKOFF: Tpl = [
  ["Kick-off", "Kick-off call held and scope walked through"],
  ["Kick-off", "Advance received"],
  ["Kick-off", "Shared folder created and shared with the client"],
  ["Kick-off", "Timeline and review dates agreed"],
];
const HANDOVER: Tpl = [
  ["Handover", "Walkthrough call done"],
  ["Handover", "Source files, docs and access transferred"],
  ["Handover", "Final payment received"],
  ["Handover", "Feedback and testimonial requested"],
];

/** The studio's working checklist for each service — the real steps between kick-off and handover. */
export const CHECKLISTS: Record<string, Tpl> = {
  websites: [
    ...KICKOFF,
    ["Discovery", "Sitemap and page list agreed"],
    ["Discovery", "Content and brand assets received"],
    ["Discovery", "Reference sites collected"],
    ["Design", "Wireframes approved"],
    ["Design", "UI design — round 1 shared"],
    ["Design", "UI design approved"],
    ["Build", "Built on staging"],
    ["Build", "CMS set up and content entered"],
    ["Build", "Forms, payments and integrations tested"],
    ["QA", "Mobile and cross-browser check"],
    ["QA", "On-page SEO: titles, meta, sitemap, robots"],
    ["QA", "Speed check (Core Web Vitals)"],
    ["Launch", "Domain and DNS connected, SSL live"],
    ["Launch", "Analytics and Search Console set up"],
    ...HANDOVER,
  ],
  brand: [
    ...KICKOFF,
    ["Discovery", "Brand questionnaire completed"],
    ["Discovery", "Competitor landscape reviewed"],
    ["Discovery", "Mood boards shared"],
    ["Design", "Logo concepts presented"],
    ["Design", "Direction chosen by the client"],
    ["Design", "Revisions done (within the rounds included)"],
    ["Design", "Final logo approved"],
    ["Build", "Colour and type system"],
    ["Build", "Brand guidelines document"],
    ["Build", "Collateral and templates"],
    ["Launch", "All formats exported (SVG, PNG, PDF, favicon)"],
    ...HANDOVER,
  ],
  software: [
    ...KICKOFF,
    ["Discovery", "Discovery session held"],
    ["Discovery", "Scope and user flows signed off"],
    ["Discovery", "Tech stack and hosting agreed"],
    ["Design", "Wireframes / UI approved"],
    ["Build", "Repository and CI/CD set up"],
    ["Build", "Core features built"],
    ["Build", "Integrations connected"],
    ["Build", "Admin panel"],
    ["QA", "Tested on staging"],
    ["QA", "Client acceptance (UAT) signed off"],
    ["Launch", "Production deploy"],
    ["Launch", "Monitoring and error alerts on"],
    ["Handover", "Documentation written"],
    ["Handover", "Support period started"],
    ...HANDOVER,
  ],
  automations: [
    ...KICKOFF,
    ["Discovery", "Every workflow mapped (trigger → actions)"],
    ["Discovery", "Access to each platform received (invites, not passwords)"],
    ["Build", "Workflows built"],
    ["Build", "Error monitoring and failure alerts on"],
    ["QA", "Tested end to end with real data"],
    ["Launch", "Switched on in production"],
    ...HANDOVER,
  ],
  photography: [
    ...KICKOFF,
    ["Pre-production", "Shot list agreed"],
    ["Pre-production", "Mood board and visual brief"],
    ["Pre-production", "Location, permits and parking confirmed"],
    ["Pre-production", "Model / location releases ready"],
    ["Shoot", "Gear checked, charged and packed"],
    ["Shoot", "Shoot done"],
    ["Shoot", "Footage backed up twice"],
    ["Post-production", "Selects gallery shared for approval"],
    ["Post-production", "Edits done at the agreed edit level"],
    ["Post-production", "Client approval"],
    ["Launch", "Final delivery in every format ordered"],
    ...HANDOVER,
  ],
  videography: [
    ...KICKOFF,
    ["Pre-production", "Script approved"],
    ["Pre-production", "Storyboard / shot list"],
    ["Pre-production", "Location scouted, permits confirmed"],
    ["Pre-production", "Talent / presenter briefed"],
    ["Shoot", "Gear checked, charged and packed"],
    ["Shoot", "Shoot done"],
    ["Shoot", "Footage backed up twice"],
    ["Post-production", "Rough cut shared"],
    ["Post-production", "Revisions done (within the rounds included)"],
    ["Post-production", "Colour grade and audio mix"],
    ["Post-production", "Final cut approved"],
    ["Launch", "Platform versions exported (16:9, 9:16, 1:1…)"],
    ...HANDOVER,
  ],
  social: [
    ["Kick-off", "Access through Meta Business / platform roles (no passwords)"],
    ["Kick-off", "Brand kit and tone of voice received"],
    ["Plan", "Monthly content calendar approved"],
    ["Produce", "Creatives designed"],
    ["Produce", "Reels edited and captioned"],
    ["Publish", "Posts scheduled"],
    ["Publish", "Community replies on the agreed days"],
    ["Report", "Monthly analytics report sent"],
    ["Report", "Growth and strategy session held"],
  ],
  vritta: [
    ["Week 1", "Deployed to the chosen environment"],
    ["Week 1", "Branding, masthead, colours and type applied"],
    ["Week 1", "Department roster loaded, access links issued"],
    ["Week 2", "Page structure and binding fixed"],
    ["Week 2", "Publication calendar and deadlines configured"],
    ["Week 3", "Coordinators, editors and administrators trained"],
    ["Week 4", "First issue composed end to end"],
    ["Week 4", "Print proof with the institution's printer"],
    ["Week 4", "Administrator documentation handed over"],
  ],
  coaching: [
    ["Before session 1", "Profession, daily work and goals mapped"],
    ["Before session 1", "Personal 90-day plan written"],
    ["Weeks 1–4", "Foundations and first workflows"],
    ["Weeks 5–8", "Applied to their real work"],
    ["Weeks 9–12", "Independent use, final project"],
    ["Day 90", "Review, certificate and feedback"],
  ],
};

export function checklistFor(services: string[]): CheckItem[] {
  const seen = new Set<string>();
  const out: CheckItem[] = [];
  for (const s of services.length ? services : ["websites"]) {
    for (const [phase, label] of CHECKLISTS[s] ?? []) {
      const key = `${phase}|${label}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ id: uid("chk"), phase, label, done: false });
    }
  }
  return out;
}

export function checklistOf(p: Rec): CheckItem[] {
  return Array.isArray(p.checklist) ? (p.checklist as CheckItem[]).filter((c) => c && typeof c.label === "string") : [];
}

export function progressOf(p: Rec) {
  const items = checklistOf(p);
  if (!items.length) return null;
  return items.filter((i) => i.done).length / items.length;
}

/* ─────────────────────────── what the client provides ─────────────────────────── */

export interface ClientInput {
  id: string;
  label: string;
  received: boolean;
  receivedOn?: string;
  note?: string;
}

export const CLIENT_INPUTS: Record<string, string[]> = {
  websites: ["Logo files (SVG / high-res PNG)", "Brand colours and fonts", "Text for every page", "Photos and videos", "Domain registrar access (an invite, not a password)", "Hosting access, if they have hosting", "Reference websites they like"],
  brand: ["Brand questionnaire", "Existing logo and assets", "Competitors and brands they admire"],
  software: ["Business process notes", "Sample data", "Third-party accounts and API access (shared securely)", "Hosting / cloud account"],
  automations: ["List of the workflows to automate", "Access to each platform (invites)", "Sample records to test with"],
  photography: ["Shot wish-list", "Location access and permits", "Products / samples on the day", "Model releases signed"],
  videography: ["Script or key messages", "Location access and permits", "Talent availability", "Logo and brand assets for graphics", "Music preferences"],
  social: ["Meta Business / platform access", "Brand kit", "This month's offers and news"],
  vritta: ["Department and cell roster", "Masthead artwork and colours", "Publication calendar", "Printer's contact"],
  coaching: ["What they do every day", "Tools they already use", "Laptop with internet for online sessions"],
};

export function inputsFor(services: string[]): ClientInput[] {
  const seen = new Set<string>();
  const out: ClientInput[] = [];
  for (const s of services) for (const label of CLIENT_INPUTS[s] ?? []) if (!seen.has(label)) {
    seen.add(label);
    out.push({ id: uid("in"), label, received: false });
  }
  return out;
}

export function inputsOf(p: Rec): ClientInput[] {
  return Array.isArray(p.inputs) ? (p.inputs as ClientInput[]).filter((c) => c && typeof c.label === "string") : [];
}

/* ─────────────────────────── milestones & money ─────────────────────────── */

export interface ProjectMilestone {
  id: string;
  label: string;
  percent: number;
  amount: number;
  status: "due" | "invoiced" | "paid";
  invoiceId?: string;
  dueDate?: string;
  paidOn?: string;
}

export function milestonesOf(p: Rec): ProjectMilestone[] {
  return Array.isArray(p.milestones) ? (p.milestones as ProjectMilestone[]).filter((m) => m && typeof m.label === "string").map((m) => ({ ...m, amount: num(m.amount), percent: num(m.percent), status: m.status ?? "due" })) : [];
}

/** Agreed, invoiced and received for a project (invoices are the record; the milestones say what is still to bill). */
export function projectMoney(p: Rec, invoices: Rec[]) {
  const mine = invoices.filter((i) => i.projectId === p.id && str(i.status) !== "cancelled");
  const invoiced = mine.reduce((s, i) => s + invoiceTotals(i).taxable, 0);
  const received = mine.reduce((s, i) => s + invoiceTotals(i).paid, 0);
  const agreed = num(p.agreedAmount);
  return { agreed, invoiced, received: Math.max(received, num(p.amountReceived)), toInvoice: Math.max(0, agreed - invoiced), invoices: mine };
}

/* ─────────────────────────── handover ─────────────────────────── */

export const HANDOVER_STEPS = [
  { id: "files", label: "Source files delivered (Figma, code, RAW / project files as agreed)" },
  { id: "docs", label: "Documentation and a short how-to written" },
  { id: "access", label: "Accounts and access transferred to the client" },
  { id: "walkthrough", label: "Walkthrough / training call done" },
  { id: "payment", label: "Final payment received" },
  { id: "support", label: "Support period explained and dated" },
  { id: "feedback", label: "Feedback form sent" },
  { id: "testimonial", label: "Testimonial requested (with consent to publish)" },
  { id: "portfolio", label: "Permission to show the work in the portfolio" },
] as const;

export type HandoverState = Partial<Record<(typeof HANDOVER_STEPS)[number]["id"], boolean>>;
export const handoverOf = (p: Rec): HandoverState => (p.handover && typeof p.handover === "object" ? (p.handover as HandoverState) : {});
