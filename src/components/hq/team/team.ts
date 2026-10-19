import { useSyncExternalStore } from "react";
import { payrollNet, type BaseRecord } from "@/lib/hq/collections";
import { isoDate } from "@/lib/utils";

export type Rec = BaseRecord;

export const str = (v: unknown) => (v === undefined || v === null ? "" : String(v));
export const num = (v: unknown) => Number(v) || 0;

/* ───────────────────────── today (hydration-safe) ───────────────────────── */

const noopSubscribe = () => () => {};
/** "YYYY-MM-DD" in the browser, `null` during server render / hydration. */
export function useTodayIso(): string | null {
  return useSyncExternalStore(noopSubscribe, () => isoDate(), () => null);
}

/* ───────────────────────── months ───────────────────────── */

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** "2026-10" → "October 2026". */
export function monthLabel(month: string) {
  const m = /^(\d{4})-(\d{2})$/.exec(month);
  if (!m) return month || "—";
  return `${MONTHS[Number(m[2]) - 1] ?? m[2]} ${m[1]}`;
}

/* ───────────────────────── onboarding checklist ───────────────────────── */

export const ONBOARDING = [
  { key: "idProof", label: "ID proof collected", hint: "Aadhaar / PAN copy, filed in the HQ vault" },
  { key: "agreement", label: "Agreement / NDA signed", hint: "Offer or engagement letter plus confidentiality. Sets “Agreement signed”.", sync: "agreementSigned" },
  { key: "ipAssignment", label: "IP assignment signed", hint: "Work made for clients belongs to the studio, then the client. Sets “IP assigned”.", sync: "ipAssigned" },
  { key: "dataUndertaking", label: "Data & client-confidentiality undertaking", hint: "Signed from Documents to Sign → Policies" },
  { key: "payout", label: "Payout details on file", hint: "UPI ID or last 4 digits of the bank account" },
  { key: "accounts", label: "Studio accounts set up", hint: "Studio email, Drive, Figma / GitHub access as the role needs — and 2FA on" },
  { key: "walkthrough", label: "Studio walkthrough done", hint: "Read the SOP, brand guide and the playbook for their craft in the Operations Library" },
  { key: "shadow", label: "First project shadowed", hint: "Sat in on one client project end to end before leading one" },
] as const;

export type OnboardingKey = (typeof ONBOARDING)[number]["key"];
export type OnboardingState = Record<OnboardingKey, boolean>;

/** Checklist state: explicit `onboarding` values win, otherwise derive from the member's existing flags. */
export function onboardingState(member: Rec): OnboardingState {
  const saved = (member.onboarding && typeof member.onboarding === "object" ? member.onboarding : {}) as Record<string, unknown>;
  const derived: Record<OnboardingKey, boolean> = {
    idProof: false,
    agreement: member.agreementSigned === true,
    ipAssignment: member.ipAssigned === true,
    dataUndertaking: false,
    payout: !!str(member.payoutDetails).trim(),
    accounts: false,
    walkthrough: false,
    shadow: false,
  };
  const out = { ...derived };
  for (const item of ONBOARDING) if (typeof saved[item.key] === "boolean") out[item.key] = saved[item.key] as boolean;
  return out;
}

export function onboardingProgress(member: Rec) {
  const s = onboardingState(member);
  const done = ONBOARDING.filter((i) => s[i.key]).length;
  return { done, total: ONBOARDING.length };
}

/* ───────────────────────── projects & shoots ↔ people ───────────────────────── */

const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/** "Chinmay" matches "Chinmay R M"; "Rahul Sharma" does not match "Rahul Verma". */
export function teamTagMatches(memberName: string, tag: string) {
  const a = norm(memberName);
  const b = norm(tag);
  if (!a || !b) return false;
  return a === b || a.startsWith(`${b} `) || b.startsWith(`${a} `);
}

function tagsOf(v: unknown): string[] {
  if (Array.isArray(v)) return v.map(str);
  if (typeof v === "string") return v.split(",").map((s) => s.trim());
  return [];
}

const named = (tags: string[], name: string) => tags.some((t) => teamTagMatches(name, t));

/** Projects the member leads or is on the team of. */
export function memberProjects(member: Rec, projects: Rec[]) {
  const name = str(member.name);
  return projects.filter((p) => named([...tagsOf(p.team), str(p.lead)], name));
}

/** Shoots the member is crewing. */
export function memberShoots(member: Rec, shoots: Rec[]) {
  const name = str(member.name);
  return shoots.filter((s) => named(tagsOf(s.crew), name));
}

export const PROJECT_DONE = ["completed", "cancelled"];

/** Shoot days the member crewed in a month — the default count for day-rate freelancers. */
export function shootsInMonth(member: Rec, shoots: Rec[], month: string) {
  return memberShoots(member, shoots).filter((s) => str(s.status) !== "cancelled" && str(s.date).slice(0, 7) === month);
}

/* ───────────────────────── pay ───────────────────────── */

export const PAY_MODES = [
  { value: "upi", label: "UPI" },
  { value: "bank", label: "Bank transfer" },
  { value: "cheque", label: "Cheque" },
  { value: "cash", label: "Cash" },
];

export function payModeLabel(v: unknown) {
  return PAY_MODES.find((m) => m.value === str(v))?.label ?? (str(v) || "—");
}

export function expenseCategoryFor(member?: Rec) {
  const freelance = str(member?.type) === "Freelance" || /freelance/i.test(str(member?.role));
  return freelance ? "Freelancers & contractors" : "Salaries & stipends";
}

export function slipTotals(rec: Rec) {
  const fixed = num(rec.fixedPay);
  const units = num(rec.units);
  const rate = num(rec.unitRate);
  const unitLabel = str(rec.unitLabel) || "day";
  const unitPay = units * rate;
  const allowances = num(rec.allowances);
  const bonus = num(rec.bonus);
  const deductions = num(rec.deductions);
  const tds = num(rec.tds);
  const gross = fixed + unitPay + allowances + bonus;
  return { fixed, units, rate, unitLabel, unitPay, allowances, bonus, deductions, tds, gross, totalDeductions: deductions + tds, net: payrollNet(rec) };
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return (parts[0][0] + (parts.length > 1 ? parts[1][0] : "")).toUpperCase();
}

/** "3 days", "1 deliverable" */
export function unitsText(n: number, label: string) {
  return `${n} ${label}${n === 1 ? "" : "s"}`;
}
