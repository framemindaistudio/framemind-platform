/**
 * Team incentives: the arithmetic and the rules, with no I/O, so every figure HQ shows or pays can be tested
 * (calc.test.ts). Money is worked in paise (integer minor units) and shown in rupees.
 *
 * The one rule behind everything here: only a collection — a client payment recorded on an invoice in Finance,
 * reconciled, not refunded — counts. An invoice alone never does.
 */

/* ───────────────────────────── money ───────────────────────────── */

export const toPaise = (rupees: number) => Math.round((Number(rupees) || 0) * 100);
export const toRupees = (paise: number) => Math.round(paise) / 100;

/* ───────────────────────────── periods ───────────────────────────── */

/** Indian financial-year quarter of a date: "2026-Q3" is Oct–Dec 2026 (Q1 Apr–Jun, Q2 Jul–Sep, Q3 Oct–Dec, Q4 Jan–Mar). */
export function quarterOf(iso: string): string {
  const y = Number(iso.slice(0, 4));
  const m = Number(iso.slice(5, 7));
  if (m >= 4) return `${y}-Q${Math.floor((m - 4) / 3) + 1}`;
  return `${y - 1}-Q4`;
}

/** First and last day (YYYY-MM-DD) of an FY quarter key such as "2026-Q3". */
export function quarterRange(key: string): { start: string; end: string; label: string } {
  const [ys, qs] = key.split("-Q");
  const fy = Number(ys);
  const q = Number(qs);
  const startMonth = q === 4 ? 1 : 4 + (q - 1) * 3; // 1-based
  const year = q === 4 ? fy + 1 : fy;
  const endMonth = startMonth + 2;
  const lastDay = new Date(Date.UTC(year, endMonth, 0)).getUTCDate();
  const p = (n: number) => String(n).padStart(2, "0");
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return {
    start: `${year}-${p(startMonth)}-01`,
    end: `${year}-${p(endMonth)}-${p(lastDay)}`,
    label: `Q${q} FY ${fy}-${String(fy + 1).slice(2)} (${MONTHS[startMonth - 1]}–${MONTHS[endMonth - 1]} ${year})`,
  };
}

export const monthOf = (iso: string) => iso.slice(0, 7);

/* ───────────────────────────── quarterly team bonus ───────────────────────────── */

export interface BonusTier {
  /** eligible quarterly collections from which this tier applies, in rupees */
  from: number;
  /** the total bonus per eligible team member for the quarter, in rupees (not stacked) */
  amount: number;
}

export const DEFAULT_TIERS: BonusTier[] = [
  { from: 250_000, amount: 2_500 },
  { from: 500_000, amount: 5_000 },
  { from: 750_000, amount: 7_500 },
];

/** The highest tier reached by eligible collections (rupees): its per-member amount, or 0 below the first tier. */
export function bonusTier(collections: number, tiers: BonusTier[] = DEFAULT_TIERS): { amount: number; from: number; next: BonusTier | null } {
  const sorted = [...tiers].sort((a, b) => a.from - b.from);
  const c = toPaise(collections);
  let hit: BonusTier | null = null;
  for (const t of sorted) if (c >= toPaise(t.from)) hit = t;
  const next = sorted.find((t) => c < toPaise(t.from)) ?? null;
  return { amount: hit?.amount ?? 0, from: hit?.from ?? 0, next };
}

/* ───────────────────────────── 5% client-acquisition commission ───────────────────────────── */

/** Commission on one eligible collection: eligible fee × rate% × approved split%, rounded to the paisa. */
export function commissionFor(eligibleFee: number, ratePercent: number, splitPercent = 100): number {
  const paise = Math.round((toPaise(eligibleFee) * ratePercent * splitPercent) / 10_000);
  return toRupees(paise);
}

/** Splits must name people once each and add up to exactly 100%. Returns the problem, or null when they are fine. */
export function splitProblem(splits: { memberId: string; percent: number }[]): string | null {
  if (!splits.length) return "Name at least one owner.";
  const ids = new Set<string>();
  let total = 0;
  for (const s of splits) {
    if (!s.memberId) return "Every split needs a team member.";
    if (ids.has(s.memberId)) return "A person can appear only once in the split.";
    ids.add(s.memberId);
    if (!(s.percent > 0) || s.percent > 100) return "Each share must be between 1% and 100%.";
    total += Math.round(s.percent * 100);
  }
  if (total !== 10_000) return `The shares add up to ${total / 100}%, not 100%.`;
  return null;
}

/* ───────────────────────────── what part of a payment is an eligible service fee ───────────────────────────── */

export interface InvoiceAmounts {
  /** taxable value after discount, before GST (rupees) */
  taxable: number;
  /** GST on the invoice (rupees) */
  gst: number;
  /** invoice total including GST (rupees) */
  total: number;
  /** pass-through, reimbursable and third-party charges inside the taxable value (rupees, before GST) */
  excluded?: number;
}

/**
 * The eligible service fee in a settlement against an invoice: the settlement is split pro-rata between GST,
 * excluded charges and the service fee, and only the service fee counts. GST is never counted.
 */
export function eligibleFeeOf(settled: number, inv: InvoiceAmounts): number {
  const total = toPaise(inv.total);
  if (total <= 0) return 0;
  const taxable = toPaise(inv.taxable);
  const excluded = Math.min(Math.max(0, toPaise(inv.excluded ?? 0)), taxable);
  const fee = taxable - excluded;
  const s = Math.min(Math.max(0, toPaise(settled)), total);
  return toRupees(Math.floor((s * fee) / total));
}

/* ───────────────────────────── collections ───────────────────────────── */

export interface Collection {
  invoiceId: string;
  paymentId: string;
  date: string;
  /** what settled the invoice: cash received plus TDS when the policy counts TDS */
  settled: number;
  eligibleFee: number;
  reconciled: boolean;
  refunded: boolean;
  leadId?: string;
  clientId?: string;
}

/** Only reconciled, not refunded payments count — once each, even if a list repeats one. */
export function countable<T extends Collection>(list: T[]): T[] {
  const seen = new Set<string>();
  return list.filter((c) => {
    const key = `${c.invoiceId}::${c.paymentId}`;
    if (!c.reconciled || c.refunded || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export const sumFees = (list: Collection[]) => toRupees(list.reduce((s, c) => s + toPaise(c.eligibleFee), 0));

/* ───────────────────────────── commission lines for one person in one month ───────────────────────────── */

export interface Attribution {
  leadId: string;
  status: string;
  splits: { memberId: string; percent: number }[];
}

export interface CommissionLine {
  invoiceId: string;
  paymentId: string;
  leadId: string;
  date: string;
  eligibleFee: number;
  ratePercent: number;
  splitPercent: number;
  amount: number;
}

/**
 * The commission lines a person earns from collections in a month: only collections on invoices linked to an
 * ACCEPTED lead the person holds a split of, and never a payment already claimed on another payout of theirs.
 */
export function commissionLines(o: {
  memberId: string;
  month: string;
  collections: Collection[];
  attributions: Attribution[];
  ratePercent: number;
  alreadyClaimed: Set<string>;
}): CommissionLine[] {
  const lines: CommissionLine[] = [];
  for (const c of countable(o.collections)) {
    if (monthOf(c.date) !== o.month || !c.leadId) continue;
    const a = o.attributions.find((x) => x.leadId === c.leadId);
    if (!a || a.status !== "accepted" || splitProblem(a.splits)) continue;
    const mine = a.splits.find((s) => s.memberId === o.memberId);
    if (!mine) continue;
    if (o.alreadyClaimed.has(claimKey(c.paymentId, o.memberId))) continue;
    lines.push({ invoiceId: c.invoiceId, paymentId: c.paymentId, leadId: c.leadId, date: c.date, eligibleFee: c.eligibleFee, ratePercent: o.ratePercent, splitPercent: mine.percent, amount: commissionFor(c.eligibleFee, o.ratePercent, mine.percent) });
  }
  return lines;
}

/** One person may claim commission on one payment once. */
export const claimKey = (paymentId: string, memberId: string) => `${paymentId}::${memberId}`;

/* ───────────────────────────── payouts: who may move them where ───────────────────────────── */

export type PayoutStatus = "draft" | "calculated" | "pending" | "approved" | "on-hold" | "initiated" | "paid" | "rejected" | "reversed";

export const PAYOUT_LABELS: Record<PayoutStatus, string> = {
  draft: "Draft",
  calculated: "Calculated",
  pending: "Pending approval",
  approved: "Approved",
  "on-hold": "On hold",
  initiated: "Payment initiated",
  paid: "Paid",
  rejected: "Rejected",
  reversed: "Reversed / adjusted",
};

const MOVES: Record<PayoutStatus, PayoutStatus[]> = {
  draft: ["calculated", "rejected"],
  calculated: ["pending", "approved", "on-hold", "rejected"],
  pending: ["approved", "on-hold", "rejected"],
  approved: ["initiated", "paid", "on-hold", "rejected"],
  "on-hold": ["pending", "rejected"],
  initiated: ["paid", "on-hold"],
  paid: ["reversed"],
  rejected: [],
  reversed: [],
};

/** Statuses whose figures are frozen: recalculation never touches them. */
export const LOCKED: PayoutStatus[] = ["approved", "initiated", "paid", "reversed"];
/** Statuses that hold a claim on a payment (so it cannot be claimed again). */
export const CLAIMING: PayoutStatus[] = ["draft", "calculated", "pending", "approved", "on-hold", "initiated", "paid"];

export function moveProblem(o: {
  from: PayoutStatus;
  to: PayoutStatus;
  actorRole: string;
  actorTeamId?: string;
  payoutMemberId: string;
  reason?: string;
  paymentReference?: string;
}): string | null {
  if (!MOVES[o.from]?.includes(o.to)) return `A payout cannot go from ${PAYOUT_LABELS[o.from]} to ${PAYOUT_LABELS[o.to]}.`;
  if (o.actorTeamId && o.actorTeamId === o.payoutMemberId) return "Nobody can move their own payout.";
  if (o.to === "approved" && o.actorRole !== "founder") return "Only the founder approves incentives.";
  if ((o.to === "paid" || o.to === "initiated") && !(o.paymentReference ?? "").trim()) return "Enter the payment reference (UTR, cheque number or transaction ID) first.";
  if (["rejected", "on-hold", "reversed"].includes(o.to) && !(o.reason ?? "").trim()) return "Give a reason: it is kept in the audit trail.";
  return null;
}
