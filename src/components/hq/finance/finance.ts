/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  HQ FINANCE — pure maths (no React, safe on server and client)
 * ─────────────────────────────────────────────────────────────────────────────
 *  • Invoice maths on top of the shared invoiceTotals(): CGST/SGST vs IGST,
 *    payments (net received + TDS credit), status and due-date logic.
 *  • Periods (calendar months, Indian financial year Apr–Mar).
 *  • Aggregations for the overview, P&L, GST summary and cash flow.
 *  • Project milestone → invoice draft (amounts from the project's milestones, which come from the quote).
 *
 *  Conventions
 *  - Revenue is recognised on the invoice date at TAXABLE value (ex-GST);
 *    GST collected is a liability, not revenue.
 *  - "Collected" is cash: payments actually received (net of any TDS) + other income.
 *  - invoice.amountPaid = net received + TDS deducted by the payer, so the shared
 *    invoiceTotals().balance is correct everywhere in HQ.
 *  - Expenses are taken as paid (incl. GST); eligible input GST shows in the GST summary.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { EXPENSE_CATEGORIES, invoiceTotals, type BaseRecord, type LineItem } from "@/lib/hq/collections";
import type { CompanySettings } from "@/lib/hq/settings";
import { uid } from "@/lib/utils";

export type Rec = BaseRecord;

export interface Payment {
  id: string;
  date: string;
  /** net amount actually received */
  amount: number;
  mode?: string;
  reference?: string;
  /** TDS deducted by the payer (credit claimable via Form 26AS) */
  tds?: number;
  note?: string;
  /** true when synthesised from a bare amountPaid (no payment entries) */
  synthetic?: boolean;
}

export const PAY_MODE_LABELS: Record<string, string> = {
  upi: "UPI",
  bank: "Bank transfer",
  cheque: "Cheque",
  card: "Card",
  cash: "Cash",
  gateway: "Payment gateway",
};

/* ─────────────────────────── small helpers ─────────────────────────── */

export const num = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
export const str = (v: unknown) => (v === undefined || v === null ? "" : String(v));
export const round2 = (x: number) => Math.round((x + Number.EPSILON) * 100) / 100;
const ISO = /^\d{4}-\d{2}-\d{2}/;
export const isIso = (v: unknown): v is string => typeof v === "string" && ISO.test(v);
export const day = (v: unknown) => (isIso(v) ? v.slice(0, 10) : "");

function utc(iso: string) {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}
/** ISO date + n days (timezone-safe). */
export function addDays(iso: string, days: number) {
  return new Date(utc(iso) + days * 86_400_000).toISOString().slice(0, 10);
}
/** b − a in whole days. */
export function daysBetween(a: string, b: string) {
  return Math.round((utc(b) - utc(a)) / 86_400_000);
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_LONG = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** "2026-10" → "Oct 26" (short) or "October 2026" (long). Deterministic — no locale/timezone. */
export function monthLabel(ym: string, long = false) {
  const [y, m] = ym.split("-").map(Number);
  if (!y || !m) return ym;
  return long ? `${MONTHS_LONG[m - 1]} ${y}` : `${MONTHS[m - 1]} ${String(y).slice(2)}`;
}
/** "2026-10-02" → "02 Oct 2026" (deterministic). */
export function fmtDate(iso: unknown) {
  const d = day(iso);
  if (!d) return "—";
  const [y, m, dd] = d.split("-");
  return `${dd} ${MONTHS[Number(m) - 1]} ${y}`;
}

/* ─────────────────────────── periods ─────────────────────────── */

export interface Period {
  key: string;
  label: string;
  /** inclusive ISO dates */
  start: string;
  end: string;
}

export const ym = (iso: string) => iso.slice(0, 7);

export function shiftMonth(ymKey: string, delta: number) {
  const [y, m] = ymKey.split("-").map(Number);
  const idx = y * 12 + (m - 1) + delta;
  return `${Math.floor(idx / 12)}-${String((idx % 12) + 1).padStart(2, "0")}`;
}

function monthEnd(ymKey: string) {
  return addDays(`${shiftMonth(ymKey, 1)}-01`, -1);
}

export function monthPeriod(ymKey: string): Period {
  return { key: `m:${ymKey}`, label: monthLabel(ymKey, true), start: `${ymKey}-01`, end: monthEnd(ymKey) };
}

/** Starting calendar year of the Indian FY containing `iso` (Apr–Mar). */
export function fyStartYear(iso: string) {
  const [y, m] = iso.split("-").map(Number);
  return m >= 4 ? y : y - 1;
}
export function fyLabel(startYear: number) {
  return `FY ${startYear}-${String(startYear + 1).slice(2)}`;
}
export function fyPeriod(startYear: number): Period {
  return { key: `fy:${startYear}`, label: fyLabel(startYear), start: `${startYear}-04-01`, end: `${startYear + 1}-03-31` };
}
export function fyMonths(startYear: number) {
  return Array.from({ length: 12 }, (_, i) => shiftMonth(`${startYear}-04`, i));
}

/** n months ending with (and including) `endYm`, oldest first. */
export function monthsEnding(endYm: string, n: number) {
  return Array.from({ length: n }, (_, i) => shiftMonth(endYm, i - n + 1));
}

export const inPeriod = (iso: string, p: Period) => !!iso && iso >= p.start && iso <= p.end;

/* ─────────────────────────── GST place of supply ─────────────────────────── */

export const GST_STATES: { code: string; name: string }[] = [
  { code: "01", name: "Jammu and Kashmir" },
  { code: "02", name: "Himachal Pradesh" },
  { code: "03", name: "Punjab" },
  { code: "04", name: "Chandigarh" },
  { code: "05", name: "Uttarakhand" },
  { code: "06", name: "Haryana" },
  { code: "07", name: "Delhi" },
  { code: "08", name: "Rajasthan" },
  { code: "09", name: "Uttar Pradesh" },
  { code: "10", name: "Bihar" },
  { code: "11", name: "Sikkim" },
  { code: "12", name: "Arunachal Pradesh" },
  { code: "13", name: "Nagaland" },
  { code: "14", name: "Manipur" },
  { code: "15", name: "Mizoram" },
  { code: "16", name: "Tripura" },
  { code: "17", name: "Meghalaya" },
  { code: "18", name: "Assam" },
  { code: "19", name: "West Bengal" },
  { code: "20", name: "Jharkhand" },
  { code: "21", name: "Odisha" },
  { code: "22", name: "Chhattisgarh" },
  { code: "23", name: "Madhya Pradesh" },
  { code: "24", name: "Gujarat" },
  { code: "26", name: "Dadra and Nagar Haveli and Daman and Diu" },
  { code: "27", name: "Maharashtra" },
  { code: "29", name: "Karnataka" },
  { code: "30", name: "Goa" },
  { code: "31", name: "Lakshadweep" },
  { code: "32", name: "Kerala" },
  { code: "33", name: "Tamil Nadu" },
  { code: "34", name: "Puducherry" },
  { code: "35", name: "Andaman and Nicobar Islands" },
  { code: "36", name: "Telangana" },
  { code: "37", name: "Andhra Pradesh" },
  { code: "38", name: "Ladakh" },
];

const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z]/g, "");
const ALIASES: Record<string, string> = { orissa: "21", pondicherry: "34", newdelhi: "07", nctofdelhi: "07", jandk: "01", jk: "01", bangalore: "29", bengaluru: "29" };

/** "Karnataka", "29", "29-Karnataka", "KARNATAKA (29)" → "29". Unknown → null. */
export function stateCode(input: unknown): string | null {
  const s = str(input).trim();
  if (!s) return null;
  const digits = /^\D*(\d{2})\b/.exec(s)?.[1];
  if (digits && GST_STATES.some((x) => x.code === digits)) return digits;
  const n = norm(s);
  const hit = GST_STATES.find((x) => norm(x.name) === n) ?? GST_STATES.find((x) => n.includes(norm(x.name)));
  return hit?.code ?? ALIASES[n] ?? null;
}
export function stateName(code: string | null) {
  return GST_STATES.find((x) => x.code === code)?.name ?? "";
}

/** True when the place of supply is a different state from the supplier → IGST. */
export function isInterState(placeOfSupply: unknown, settings: Pick<CompanySettings, "state" | "stateCode">) {
  const pos = str(placeOfSupply).trim();
  if (!pos) return false;
  const pc = stateCode(pos);
  const sc = stateCode(settings.stateCode) ?? stateCode(settings.state);
  if (pc && sc) return pc !== sc;
  return norm(pos) !== norm(settings.state || "");
}

/* ─────────────────────────── invoice maths ─────────────────────────── */

/** Payment entries on an invoice (or one synthetic entry for a bare amountPaid). */
export function invoicePayments(inv: Rec): Payment[] {
  const raw = Array.isArray(inv.payments) ? (inv.payments as Partial<Payment>[]) : [];
  const list: Payment[] = raw
    .filter((p) => p && (num(p.amount) || num(p.tds)))
    .map((p) => ({
      id: str(p.id) || uid("pay"),
      date: day(p.date) || day(inv.date),
      amount: round2(num(p.amount)),
      mode: str(p.mode),
      reference: str(p.reference),
      tds: round2(num(p.tds)),
      note: str(p.note),
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
  if (!list.length && num(inv.amountPaid) > 0) {
    list.push({ id: `legacy_${inv.id}`, date: day(inv.date), amount: round2(num(inv.amountPaid)), reference: "Recorded on invoice", synthetic: true });
  }
  return list;
}

export interface InvoiceMath {
  subtotal: number;
  discount: number;
  taxable: number;
  gstPercent: number;
  gst: number;
  inter: boolean;
  cgst: number;
  sgst: number;
  igst: number;
  total: number;
  /** settled = net received + TDS */
  paid: number;
  received: number;
  tds: number;
  balance: number;
  payments: Payment[];
}

export function invoiceMath(inv: Rec, settings: Pick<CompanySettings, "state" | "stateCode">): InvoiceMath {
  const payments = invoicePayments(inv);
  const hasEntries = Array.isArray(inv.payments) && (inv.payments as unknown[]).length > 0;
  const received = round2(payments.reduce((s, p) => s + p.amount, 0));
  const tds = round2(payments.reduce((s, p) => s + (p.tds || 0), 0));
  const t = invoiceTotals({ ...inv, amountPaid: hasEntries ? received + tds : num(inv.amountPaid) });
  const inter = isInterState(inv.placeOfSupply, settings);
  const cgst = inter ? 0 : round2(t.gst / 2);
  const sgst = inter ? 0 : round2(t.gst - cgst);
  return {
    subtotal: round2(t.subtotal),
    discount: round2(t.discount),
    taxable: round2(t.taxable),
    gstPercent: t.gstPercent,
    gst: round2(t.gst),
    inter,
    cgst,
    sgst,
    igst: inter ? round2(t.gst) : 0,
    total: round2(t.total),
    paid: round2(t.paid),
    received,
    tds,
    balance: round2(t.balance),
    payments,
  };
}

export const invoiceStatus = (inv: Rec) => str(inv.status) || "draft";
/** Counted as revenue / receivable: everything except drafts and cancelled invoices. */
export const isIssued = (inv: Rec) => !["draft", "cancelled"].includes(invoiceStatus(inv));

/** Due date, or invoice date + balance-due days when none is set. */
export function effectiveDueDate(inv: Rec) {
  return day(inv.dueDate) || (day(inv.date) ? addDays(day(inv.date), DUE_DAYS) : "");
}

/** Stored status recomputed from payments and dates. */
export function deriveStatus(inv: Rec, m: Pick<InvoiceMath, "total" | "paid" | "balance">, today: string) {
  const s = invoiceStatus(inv);
  // drafts stay drafts until someone issues them; cancelled is final
  if (s === "cancelled" || s === "draft") return s;
  if (m.total > 0 && m.balance < 0.5) return "paid";
  const due = effectiveDueDate(inv);
  if (due && due < today) return "overdue";
  if (m.paid > 0) return "partially-paid";
  return "sent";
}

export type DueKey = "cancelled" | "paid" | "draft" | "nodue" | "overdue" | "today" | "upcoming";
export interface DueInfo {
  key: DueKey;
  days: number;
  label: string;
  tone: "neutral" | "ok" | "warn" | "bad" | "info";
}

/** Live due status for tables — independent of the stored status. */
export function dueInfo(inv: Rec, m: Pick<InvoiceMath, "total" | "balance">, today: string): DueInfo {
  const s = invoiceStatus(inv);
  if (s === "cancelled") return { key: "cancelled", days: 0, label: "Cancelled", tone: "neutral" };
  if (m.total > 0 && m.balance < 0.5) return { key: "paid", days: 0, label: "Settled", tone: "ok" };
  if (s === "draft") return { key: "draft", days: 0, label: "Not issued", tone: "neutral" };
  const due = effectiveDueDate(inv);
  if (!due) return { key: "nodue", days: 0, label: "No due date", tone: "neutral" };
  const d = daysBetween(due, today);
  if (d > 0) return { key: "overdue", days: d, label: `${d} d overdue`, tone: "bad" };
  if (d === 0) return { key: "today", days: 0, label: "Due today", tone: "warn" };
  return { key: "upcoming", days: -d, label: `Due in ${-d} d`, tone: "info" };
}

/**
 * Normalise an invoice before saving: payments → amountPaid/tdsDeducted, default due date,
 * GST %, total, status — and reserve the next invoice number when empty.
 */
export async function prepareInvoice(
  input: Record<string, unknown>,
  ctx: { today: string; settings: Pick<CompanySettings, "state" | "stateCode">; reserveNumber: () => Promise<string> },
) {
  const r: Record<string, unknown> = { ...input };
  if (r.gstPercent === undefined || r.gstPercent === "" || r.gstPercent === null) r.gstPercent = GST_PERCENT;
  if (!day(r.date)) r.date = ctx.today;
  if (!day(r.dueDate)) r.dueDate = addDays(day(r.date), DUE_DAYS);
  // payment entries win over a hand-typed "amount received" — but an empty list must not wipe a typed amount
  if (Array.isArray(r.payments) && r.payments.length > 0) {
    const pays = invoicePayments({ ...r, amountPaid: 0 } as unknown as Rec).filter((p) => !p.synthetic);
    r.payments = pays.map((p) => ({ id: p.id, date: p.date, amount: p.amount, mode: p.mode || "", reference: p.reference || "", tds: p.tds || 0, ...(p.note ? { note: p.note } : {}) }));
    r.amountPaid = round2(pays.reduce((s, p) => s + p.amount + (p.tds || 0), 0));
    r.tdsDeducted = round2(pays.reduce((s, p) => s + (p.tds || 0), 0));
  }
  const m = invoiceMath(r as Rec, ctx.settings);
  r.total = m.total;
  r.status = deriveStatus(r as Rec, m, ctx.today);
  if (!str(r.number).trim()) r.number = await ctx.reserveNumber();
  return r;
}

/* ─────────────────────────── project milestone → invoice ─────────────────────────── */

/** GST on studio services, and the days a client has to pay an invoice when no due date is typed. */
export const GST_PERCENT = 18;
export const DUE_DAYS = 7;

export interface ProjectMilestoneLike {
  id: string;
  label: string;
  percent: number;
  amount: number;
  status?: string;
  invoiceId?: string;
}

export interface ProjectInvoiceDraft {
  record: Record<string, unknown>;
  warnings: string[];
}

/** The milestones of a project, as the project screen keeps them. */
export function milestonesOfProject(p: Rec): ProjectMilestoneLike[] {
  return Array.isArray(p.milestones) ? (p.milestones as ProjectMilestoneLike[]).filter((m) => m && typeof m.label === "string") : [];
}

/** Build a draft invoice for one milestone of a project (or a custom amount), billed to its client. */
export function invoiceFromProject(
  p: Rec,
  client: Rec | undefined,
  settings: Pick<CompanySettings, "state" | "sacCode">,
  today: string,
  milestone: ProjectMilestoneLike | null,
  customAmount = 0,
): ProjectInvoiceDraft {
  const warnings: string[] = [];
  const amount = milestone ? num(milestone.amount) : customAmount;
  if (!amount) warnings.push("The amount is ₹0 — set the agreed amount and milestones on the project, or type the line yourself.");
  if (milestone?.invoiceId) warnings.push("This milestone already has an invoice.");
  const address = [str(client?.address), str(client?.city)].filter(Boolean).join(", ");
  const items: LineItem[] = [
    {
      description: `${str(p.title) || "Project"} — ${milestone ? `${milestone.label}${milestone.percent ? ` (${milestone.percent}%)` : ""}` : "work as agreed"}`,
      qty: 1,
      rate: amount,
      sac: settings.sacCode || undefined,
    },
  ];
  const record: Record<string, unknown> = {
    date: today,
    dueDate: addDays(today, DUE_DAYS),
    clientId: str(client?.id) || str(p.clientId),
    projectId: p.id,
    milestone: milestone ? `${milestone.label}${milestone.percent ? ` (${milestone.percent}%)` : ""}` : "",
    customerName: str(client?.name) || str(p.title),
    customerAddress: address,
    customerGstin: str(client?.gstin),
    placeOfSupply: settings.state,
    gstPercent: GST_PERCENT,
    items,
    status: "draft",
    notes: "",
    payments: [],
  };
  return { record, warnings };
}

/* ─────────────────────────── aggregations ─────────────────────────── */

export interface Ledger {
  /** accrual revenue events (ex-GST) */
  revenue: { date: string; stream: string; amount: number }[];
  /** cash in */
  cashIn: { date: string; amount: number; source: "invoice" | "income"; stream: string }[];
  expenses: { date: string; category: string; amount: number; gst: number; rec: Rec }[];
  /** issued invoices with their maths */
  invoices: { inv: Rec; m: InvoiceMath; date: string; due: string }[];
}

export const WORKSHOP_STREAM = "Client work";

export function buildLedger(invoices: Rec[], expenses: Rec[], income: Rec[], settings: Pick<CompanySettings, "state" | "stateCode">): Ledger {
  const L: Ledger = { revenue: [], cashIn: [], expenses: [], invoices: [] };
  for (const inv of invoices) {
    if (invoiceStatus(inv) === "cancelled") continue;
    const m = invoiceMath(inv, settings);
    const date = day(inv.date);
    // cash received counts even on a draft (advance taken before issuing)
    for (const p of m.payments) if (p.amount && p.date) L.cashIn.push({ date: p.date, amount: p.amount, source: "invoice", stream: WORKSHOP_STREAM });
    if (!isIssued(inv) || !date) continue;
    L.invoices.push({ inv, m, date, due: effectiveDueDate(inv) });
    if (m.taxable) L.revenue.push({ date, stream: WORKSHOP_STREAM, amount: m.taxable });
  }
  for (const r of income) {
    const date = day(r.date);
    const amount = num(r.amount);
    if (!date || !amount) continue;
    const stream = str(r.stream) || "Other";
    L.revenue.push({ date, stream, amount });
    L.cashIn.push({ date, amount, source: "income", stream });
  }
  for (const r of expenses) {
    const date = day(r.date);
    const amount = num(r.amount);
    if (!date || !amount) continue;
    L.expenses.push({ date, category: str(r.category) || "Miscellaneous", amount, gst: num(r.gstAmount), rec: r });
  }
  return L;
}

export interface PeriodSummary {
  invoicedTaxable: number;
  invoicedTotal: number;
  invoiceCount: number;
  collectedInvoices: number;
  collectedIncome: number;
  collected: number;
  otherIncome: number;
  revenue: number;
  expenses: number;
  net: number;
  margin: number | null;
  byCategory: { label: string; amount: number }[];
  byStream: { label: string; amount: number }[];
}

const byLabel = (rows: { label: string; amount: number }[]) => rows.filter((r) => r.amount).sort((a, b) => b.amount - a.amount);

export function summarize(L: Ledger, p: Period): PeriodSummary {
  const invs = L.invoices.filter((x) => inPeriod(x.date, p));
  const invoicedTaxable = round2(invs.reduce((s, x) => s + x.m.taxable, 0));
  const invoicedTotal = round2(invs.reduce((s, x) => s + x.m.total, 0));
  const cash = L.cashIn.filter((c) => inPeriod(c.date, p));
  const collectedInvoices = round2(cash.filter((c) => c.source === "invoice").reduce((s, c) => s + c.amount, 0));
  const collectedIncome = round2(cash.filter((c) => c.source === "income").reduce((s, c) => s + c.amount, 0));
  const rev = L.revenue.filter((r) => inPeriod(r.date, p));
  const revenue = round2(rev.reduce((s, r) => s + r.amount, 0));
  const exp = L.expenses.filter((e) => inPeriod(e.date, p));
  const expenses = round2(exp.reduce((s, e) => s + e.amount, 0));
  const net = round2(revenue - expenses);
  const cat = new Map<string, number>();
  exp.forEach((e) => cat.set(e.category, (cat.get(e.category) || 0) + e.amount));
  const stream = new Map<string, number>();
  rev.forEach((r) => stream.set(r.stream, (stream.get(r.stream) || 0) + r.amount));
  return {
    invoicedTaxable,
    invoicedTotal,
    invoiceCount: invs.length,
    collectedInvoices,
    collectedIncome,
    collected: round2(collectedInvoices + collectedIncome),
    otherIncome: round2(revenue - invoicedTaxable),
    revenue,
    expenses,
    net,
    margin: revenue > 0 ? net / revenue : null,
    byCategory: byLabel([...cat].map(([label, amount]) => ({ label, amount: round2(amount) }))),
    byStream: byLabel([...stream].map(([label, amount]) => ({ label, amount: round2(amount) }))),
  };
}

export interface Receivables {
  outstanding: number;
  overdue: number;
  overdueCount: number;
  openCount: number;
  buckets: { key: string; label: string; amount: number; count: number }[];
  overdueList: { inv: Rec; m: InvoiceMath; daysPast: number }[];
}

export function receivables(L: Ledger, today: string): Receivables {
  const buckets = [
    { key: "current", label: "Not yet due", amount: 0, count: 0 },
    { key: "0-30", label: "0–30 days", amount: 0, count: 0 },
    { key: "31-60", label: "31–60 days", amount: 0, count: 0 },
    { key: "61-90", label: "61–90 days", amount: 0, count: 0 },
    { key: "90+", label: "90+ days", amount: 0, count: 0 },
  ];
  let outstanding = 0;
  let overdue = 0;
  let overdueCount = 0;
  let openCount = 0;
  const overdueList: Receivables["overdueList"] = [];
  for (const x of L.invoices) {
    if (x.m.balance < 0.5) continue;
    openCount++;
    outstanding += x.m.balance;
    const past = x.due ? daysBetween(x.due, today) : 0;
    const b = past < 0 ? 0 : past <= 30 ? 1 : past <= 60 ? 2 : past <= 90 ? 3 : 4;
    buckets[b].amount += x.m.balance;
    buckets[b].count++;
    if (past > 0) {
      overdue += x.m.balance;
      overdueCount++;
      overdueList.push({ inv: x.inv, m: x.m, daysPast: past });
    }
  }
  overdueList.sort((a, b) => b.daysPast - a.daysPast);
  return { outstanding: round2(outstanding), overdue: round2(overdue), overdueCount, openCount, buckets: buckets.map((b) => ({ ...b, amount: round2(b.amount) })), overdueList };
}

export interface MonthRow {
  ym: string;
  label: string;
  revenue: number;
  expenses: number;
  net: number;
  cashIn: number;
  cashInInvoices: number;
  cashInIncome: number;
  cashOut: number;
  cashNet: number;
  cumulative: number;
}

export function monthlySeries(L: Ledger, months: string[]): MonthRow[] {
  let cumulative = 0;
  return months.map((m) => {
    const revenue = round2(L.revenue.filter((r) => r.date.startsWith(m)).reduce((s, r) => s + r.amount, 0));
    const expenses = round2(L.expenses.filter((e) => e.date.startsWith(m)).reduce((s, e) => s + e.amount, 0));
    const cash = L.cashIn.filter((c) => c.date.startsWith(m));
    const cashInInvoices = round2(cash.filter((c) => c.source === "invoice").reduce((s, c) => s + c.amount, 0));
    const cashInIncome = round2(cash.filter((c) => c.source === "income").reduce((s, c) => s + c.amount, 0));
    const cashIn = round2(cashInInvoices + cashInIncome);
    const cashNet = round2(cashIn - expenses);
    cumulative = round2(cumulative + cashNet);
    return { ym: m, label: monthLabel(m), revenue, expenses, net: round2(revenue - expenses), cashIn, cashInInvoices, cashInIncome, cashOut: expenses, cashNet, cumulative };
  });
}

/* ─────────────────────────── P&L statement ─────────────────────────── */

export interface PLRow {
  label: string;
  values: number[];
  total: number;
}
export interface PLStatement {
  months: string[];
  revenue: PLRow[];
  revenueTotal: PLRow;
  expenses: PLRow[];
  expenseTotal: PLRow;
  net: PLRow;
  margin: (number | null)[];
  marginTotal: number | null;
}

const row = (label: string, values: number[]): PLRow => ({ label, values: values.map(round2), total: round2(values.reduce((s, v) => s + v, 0)) });

export function plStatement(L: Ledger, months: string[]): PLStatement {
  const streams = [...new Set(L.revenue.filter((r) => months.some((m) => r.date.startsWith(m))).map((r) => r.stream))];
  streams.sort((a, b) => (a === WORKSHOP_STREAM ? -1 : b === WORKSHOP_STREAM ? 1 : a.localeCompare(b)));
  const revenue = streams.map((s) =>
    row(
      s === WORKSHOP_STREAM ? "Client work (invoiced, ex-GST)" : s,
      months.map((m) => L.revenue.filter((r) => r.stream === s && r.date.startsWith(m)).reduce((t, r) => t + r.amount, 0)),
    ),
  );
  const order = EXPENSE_CATEGORIES.map((c) => c.value);
  const cats = [...new Set(L.expenses.filter((e) => months.some((m) => e.date.startsWith(m))).map((e) => e.category))];
  cats.sort((a, b) => (order.indexOf(a) === -1 ? 99 : order.indexOf(a)) - (order.indexOf(b) === -1 ? 99 : order.indexOf(b)));
  const expenses = cats.map((c) => row(c, months.map((m) => L.expenses.filter((e) => e.category === c && e.date.startsWith(m)).reduce((t, e) => t + e.amount, 0))));
  const revenueTotal = row("Total revenue", months.map((_, i) => revenue.reduce((s, r) => s + r.values[i], 0)));
  const expenseTotal = row("Total expenses", months.map((_, i) => expenses.reduce((s, r) => s + r.values[i], 0)));
  const net = row("Net profit / (loss)", months.map((_, i) => revenueTotal.values[i] - expenseTotal.values[i]));
  return {
    months,
    revenue,
    revenueTotal,
    expenses,
    expenseTotal,
    net,
    margin: months.map((_, i) => (revenueTotal.values[i] > 0 ? net.values[i] / revenueTotal.values[i] : null)),
    marginTotal: revenueTotal.total > 0 ? net.total / revenueTotal.total : null,
  };
}

/* ─────────────────────────── GST summary ─────────────────────────── */

export interface GstRow {
  ym: string;
  label: string;
  taxable: number;
  cgst: number;
  sgst: number;
  igst: number;
  output: number;
  input: number;
  net: number;
  invoices: number;
}

export function gstSummary(L: Ledger, months: string[]): GstRow[] {
  return months.map((m) => {
    const invs = L.invoices.filter((x) => x.date.startsWith(m));
    const cgst = round2(invs.reduce((s, x) => s + x.m.cgst, 0));
    const sgst = round2(invs.reduce((s, x) => s + x.m.sgst, 0));
    const igst = round2(invs.reduce((s, x) => s + x.m.igst, 0));
    const output = round2(cgst + sgst + igst);
    const input = round2(L.expenses.filter((e) => e.date.startsWith(m)).reduce((s, e) => s + e.gst, 0));
    return { ym: m, label: monthLabel(m), taxable: round2(invs.reduce((s, x) => s + x.m.taxable, 0)), cgst, sgst, igst, output, input, net: round2(output - input), invoices: invs.length };
  });
}

/* ─────────────────────────── CSV ─────────────────────────── */

export function toCsv(rows: (string | number | null | undefined)[][]) {
  const esc = (v: string | number | null | undefined) => {
    const s = v === null || v === undefined ? "" : typeof v === "number" ? String(round2(v)) : v;
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return rows.map((r) => r.map(esc).join(",")).join("\n");
}

/** Path → viewable URL for a stored receipt (vault path or external link). */
export function receiptUrl(receipt: unknown) {
  const s = str(receipt).trim();
  if (!s) return "";
  if (/^https?:\/\//i.test(s)) return s;
  return `/api/hq/docs/raw?path=${encodeURIComponent(s)}`;
}
export const isImagePath = (p: string) => /\.(png|jpe?g|webp|gif)$/i.test(p);
