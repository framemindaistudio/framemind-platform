import "server-only";
import { invoiceTotals, payrollNet, type BaseRecord } from "@/lib/hq/collections";
import { getRecord, listRecords, upsertRecord } from "@/lib/hq/records";
import type { SessionUser } from "@/lib/hq/roles";
import { indiaToday } from "@/lib/hq/reminders";
import {
  bonusTier,
  claimKey,
  CLAIMING,
  commissionLines,
  countable,
  DEFAULT_TIERS,
  eligibleFeeOf,
  LOCKED,
  monthOf,
  moveProblem,
  quarterOf,
  quarterRange,
  splitProblem,
  sumFees,
  toPaise,
  toRupees,
  type Attribution,
  type BonusTier,
  type Collection,
  type CommissionLine,
  type PayoutStatus,
} from "./calc.ts";

/*
 * Team incentives on the server: everything is read from the records HQ already keeps — Team & Payroll for people,
 * Enquiries for leads, invoice payments in Finance for collections — and only the policy, the payouts and the
 * reviews are new. Every change is checked here, stamped with who and when, and kept in the record's history.
 */

type Rec = BaseRecord;
const s = (v: unknown) => (v === undefined || v === null ? "" : String(v)).trim();
const n = (v: unknown) => Number(v) || 0;

export class IncentiveError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

/* ───────────────────────────── audit ───────────────────────────── */

export interface AuditEvent {
  at: string;
  by: string;
  action: string;
  from?: string;
  to?: string;
  reason?: string;
}

const event = (by: string, action: string, extra: Partial<AuditEvent> = {}): AuditEvent => ({ at: new Date().toISOString(), by, action, ...extra });
const history = (r: Rec | null | undefined): AuditEvent[] => (Array.isArray(r?.history) ? (r!.history as AuditEvent[]) : []);

/* ───────────────────────────── policy ───────────────────────────── */

export interface Policy {
  id?: string;
  name: string;
  version: number;
  status: "draft" | "active" | "retired";
  effectiveFrom: string;
  commissionRate: number;
  tiers: BonusTier[];
  /** count TDS the client deducted as part of the fee settled (it is tax paid on the studio's behalf) */
  countTds: boolean;
  /** management's project gross-margin target after direct delivery costs, in percent — a target, not a legal rule */
  marginTarget: number;
  /** essential operating reserve to keep after obligations, in rupees */
  reserve: number;
  /** a member who joins mid-quarter: full bonus, a day-wise share, or none for that quarter */
  partialRule: "full" | "prorata" | "exclude";
  eligibilityRules: string;
  qualityRules: string;
  exceptions: string;
  history?: AuditEvent[];
}

/** The starting terms: in force until the founder saves a version of their own. */
export const PROPOSED_POLICY: Policy = {
  name: "Team incentive policy",
  version: 0,
  status: "active",
  effectiveFrom: "",
  commissionRate: 5,
  tiers: DEFAULT_TIERS,
  countTds: true,
  marginTarget: 35,
  reserve: 0,
  partialRule: "prorata",
  eligibilityRules:
    "Eligible: active full-time team members marked \"Takes part in team incentives\" in Team & Payroll for the quarter. Contribution and quality are assessed in the quarterly performance review.",
  qualityRules: "No unresolved quality or delivery issue on the member's projects in the quarter, as recorded in the quarterly review.",
  exceptions: "",
};

function asPolicy(r: Rec): Policy {
  return {
    id: r.id,
    name: s(r.name) || PROPOSED_POLICY.name,
    version: n(r.version),
    status: (["draft", "active", "retired"].includes(s(r.status)) ? s(r.status) : "draft") as Policy["status"],
    effectiveFrom: s(r.effectiveFrom),
    commissionRate: n(r.commissionRate),
    tiers: Array.isArray(r.tiers) ? (r.tiers as BonusTier[]).map((t) => ({ from: n(t.from), amount: n(t.amount) })) : DEFAULT_TIERS,
    countTds: r.countTds !== false,
    marginTarget: r.marginTarget === undefined ? 35 : n(r.marginTarget),
    reserve: n(r.reserve),
    partialRule: (["full", "prorata", "exclude"].includes(s(r.partialRule)) ? s(r.partialRule) : "prorata") as Policy["partialRule"],
    eligibilityRules: s(r.eligibilityRules),
    qualityRules: s(r.qualityRules),
    exceptions: s(r.exceptions),
    history: history(r),
  };
}

/** The policy in force: the active one (each save makes the new version active), else the starting terms. */
export function currentPolicy(policies: Rec[]): Policy {
  const list = policies.map(asPolicy).sort((a, b) => b.version - a.version);
  return list.find((p) => p.status === "active") ?? list[0] ?? PROPOSED_POLICY;
}

/* ───────────────────────────── the shared records ───────────────────────────── */

export interface Data {
  today: string;
  team: Rec[];
  leads: Rec[];
  invoices: Rec[];
  expenses: Rec[];
  payroll: Rec[];
  subscriptions: Rec[];
  projects: Rec[];
  deliverables: Rec[];
  tasks: Rec[];
  policies: Rec[];
  payouts: Rec[];
  reviews: Rec[];
  policy: Policy;
}

export async function loadData(): Promise<Data> {
  const [team, leads, invoices, expenses, payroll, subscriptions, projects, deliverables, tasks, policies, payouts, reviews] = await Promise.all(
    ["team", "leads", "invoices", "expenses", "payroll", "subscriptions", "projects", "deliverables", "tasks", "incentivePolicies", "incentivePayouts", "performanceReviews"].map((c) => listRecords(c)),
  );
  return { today: indiaToday(), team, leads, invoices, expenses, payroll, subscriptions, projects, deliverables, tasks, policies, payouts, reviews, policy: currentPolicy(policies) };
}

/** Every payment recorded on an issued invoice, with the part of it that is an eligible service fee. */
export function collectionsOf(d: Pick<Data, "invoices" | "policy">): (Collection & { gst: number; projectId?: string })[] {
  const out: (Collection & { gst: number; projectId?: string })[] = [];
  for (const inv of d.invoices) {
    if (["draft", "cancelled"].includes(s(inv.status))) continue;
    const t = invoiceTotals(inv);
    const payments = Array.isArray(inv.payments) ? (inv.payments as Rec[]) : [];
    for (const p of payments) {
      const settled = n(p.amount) + (d.policy.countTds ? n(p.tds) : 0);
      if (!settled) continue;
      const fee = eligibleFeeOf(settled, { taxable: t.taxable, gst: t.gst, total: t.total, excluded: n(inv.excludedAmount) });
      out.push({
        invoiceId: inv.id,
        paymentId: s(p.id) || `${inv.id}-${s(p.date)}-${n(p.amount)}`,
        date: s(p.date).slice(0, 10) || s(inv.date).slice(0, 10),
        settled,
        eligibleFee: fee,
        // the GST share of the payment, worked the same way as the fee share
        gst: t.total > 0 ? toRupees(Math.floor((toPaise(Math.min(settled, t.total)) * toPaise(t.gst)) / toPaise(t.total))) : 0,
        reconciled: p.reconciled === true,
        refunded: p.refunded === true,
        leadId: s(inv.leadId) || undefined,
        clientId: s(inv.clientId) || undefined,
        projectId: s(inv.projectId) || undefined,
      });
    }
  }
  return out;
}

export function attributionsOf(leads: Rec[]): Attribution[] {
  return leads.map((l) => ({
    leadId: l.id,
    status: s(l.attribution) || "none",
    splits: Array.isArray(l.splits) && (l.splits as unknown[]).length ? (l.splits as { memberId: string; percent: number }[]) : l.ownerId ? [{ memberId: s(l.ownerId), percent: 100 }] : [],
  }));
}

/** The team member a login belongs to: the link set on the login, or (for the founder's built-in login) the same name. */
export function memberOf(user: SessionUser, team: Rec[]): Rec | undefined {
  if (user.teamId) return team.find((m) => m.id === user.teamId);
  if (user.role === "founder" || user.role === "admin") return team.find((m) => s(m.name).toLowerCase() === user.name.toLowerCase());
  return undefined;
}

/** Payments already claimed by someone's commission (on any payout that still stands), except the ones in `skip`. */
function claimsOf(payouts: Rec[], skip?: string) {
  const set = new Set<string>();
  for (const p of payouts) {
    if (p.kind !== "commission" || p.id === skip || !CLAIMING.includes(s(p.status) as PayoutStatus)) continue;
    for (const l of (Array.isArray(p.lines) ? p.lines : []) as CommissionLine[]) set.add(claimKey(l.paymentId, s(p.memberId)));
  }
  return set;
}

/* ───────────────────────────── quarter: collections, tier, safeguards ───────────────────────────── */

const eligibleMembers = (d: Data, range: { start: string; end: string }) =>
  d.team.filter((m) => m.incentiveEligible === true && s(m.status) !== "inactive" && (!s(m.incentiveFrom) || s(m.incentiveFrom) <= range.end) && (!s(m.joinDate) || s(m.joinDate) <= range.end));

/** The share of a quarter's bonus a member gets under the policy's partial-period rule (1 = full). */
export function participation(m: Rec, range: { start: string; end: string }, rule: Policy["partialRule"]): number {
  const from = [s(m.incentiveFrom), s(m.joinDate)].filter(Boolean).sort().pop() ?? "";
  if (!from || from <= range.start) return 1;
  if (rule === "full") return 1;
  if (rule === "exclude") return 0;
  const day = 86_400_000;
  const total = (Date.parse(range.end) - Date.parse(range.start)) / day + 1;
  const served = (Date.parse(range.end) - Date.parse(from)) / day + 1;
  return Math.max(0, Math.min(1, Math.round((served / total) * 1000) / 1000));
}

export function quarterSummary(d: Data, key: string) {
  const range = quarterRange(key);
  const all = collectionsOf(d);
  const inQuarter = all.filter((c) => c.date >= range.start && c.date <= range.end);
  const counted = countable(inQuarter);
  const eligible = sumFees(counted);
  const tier = bonusTier(eligible, d.policy.tiers);
  const members = eligibleMembers(d, range).map((m) => ({ id: m.id, name: s(m.name), share: participation(m, range, d.policy.partialRule) }));
  const pool = toRupees(members.reduce((sum, m) => sum + Math.round(toPaise(tier.amount) * m.share), 0));
  const unreconciled = inQuarter.filter((c) => !c.reconciled && !c.refunded);
  const refunds = inQuarter.filter((c) => c.refunded);
  const gst = toRupees(counted.reduce((sum, c) => sum + toPaise(c.gst), 0));

  // direct costs: expenses booked to a project in the quarter
  const directCosts = toRupees(d.expenses.filter((e) => s(e.projectId) && s(e.date) >= range.start && s(e.date) <= range.end).reduce((sum, e) => sum + toPaise(n(e.amount) - n(e.gstAmount)), 0));
  const margin = eligible > 0 ? Math.round(((eligible - directCosts) / eligible) * 1000) / 10 : 0;

  // per project: fee collected vs direct cost, to flag negative or below-target margins
  const byProject = new Map<string, { fee: number; cost: number }>();
  for (const c of counted) if (c.projectId) byProject.set(c.projectId, { fee: (byProject.get(c.projectId)?.fee ?? 0) + c.eligibleFee, cost: byProject.get(c.projectId)?.cost ?? 0 });
  for (const e of d.expenses) {
    const pid = s(e.projectId);
    if (!pid || s(e.date) < range.start || s(e.date) > range.end) continue;
    byProject.set(pid, { fee: byProject.get(pid)?.fee ?? 0, cost: (byProject.get(pid)?.cost ?? 0) + n(e.amount) - n(e.gstAmount) });
  }
  const projectFlags = [...byProject.entries()]
    .map(([id, v]) => ({ id, title: s(d.projects.find((p) => p.id === id)?.title) || "Project", fee: Math.round(v.fee), cost: Math.round(v.cost), margin: v.fee > 0 ? Math.round(((v.fee - v.cost) / v.fee) * 100) : v.cost > 0 ? -100 : 0 }))
    .filter((p) => p.margin < d.policy.marginTarget);

  const months = [0, 1, 2].map((i) => {
    const dt = new Date(Date.parse(range.start));
    dt.setUTCMonth(dt.getUTCMonth() + i);
    return dt.toISOString().slice(0, 7);
  });
  const payrollDue = toRupees(d.payroll.filter((p) => months.includes(s(p.month).slice(0, 7)) && s(p.status) !== "paid").reduce((sum, p) => sum + toPaise(payrollNet(p)), 0));
  const vendorMonthly = toRupees(d.subscriptions.filter((x) => s(x.status) !== "cancelled" && s(x.billedTo) !== "client").reduce((sum, x) => sum + toPaise(s(x.cycle) === "yearly" ? n(x.cost) / 12 : n(x.cost)), 0));
  const approvedUnpaid = toRupees(d.payouts.filter((p) => ["approved", "initiated"].includes(s(p.status))).reduce((sum, p) => sum + toPaise(n(p.net)), 0));
  const pendingCommission = toRupees(d.payouts.filter((p) => p.kind === "commission" && ["calculated", "pending"].includes(s(p.status))).reduce((sum, p) => sum + toPaise(n(p.net)), 0));

  const pendingLeads = d.leads.filter((l) => s(l.attribution) === "pending" || (s(l.ownerId) && ["", "none"].includes(s(l.attribution))));
  const linkedToUnaccepted = d.invoices.filter((i) => s(i.leadId) && s(d.leads.find((l) => l.id === s(i.leadId))?.attribution) !== "accepted");
  const claims = new Map<string, number>();
  for (const p of d.payouts) {
    if (p.kind !== "commission" || !CLAIMING.includes(s(p.status) as PayoutStatus)) continue;
    for (const l of (Array.isArray(p.lines) ? p.lines : []) as CommissionLine[]) claims.set(claimKey(l.paymentId, s(p.memberId)), (claims.get(claimKey(l.paymentId, s(p.memberId))) ?? 0) + 1);
  }
  const duplicates = [...claims.values()].filter((c) => c > 1).length;
  const disputes = d.projects.filter((p) => s(p.stage) === "on-hold").map((p) => s(p.title));

  return {
    key,
    range,
    eligible,
    tier,
    nextGap: tier.next ? Math.max(0, Math.round((tier.next.from - eligible) * 100) / 100) : 0,
    members,
    pool,
    counted: counted.length,
    unreconciled: unreconciled.length,
    unreconciledAmount: Math.round(unreconciled.reduce((sum, c) => sum + c.settled, 0)),
    refunds: Math.round(refunds.reduce((sum, c) => sum + c.settled, 0)),
    gst,
    directCosts,
    margin,
    projectFlags,
    payrollDue,
    vendorMonthly,
    approvedUnpaid,
    pendingCommission,
    reserve: d.policy.reserve,
    flags: [
      ...(unreconciled.length ? [`${unreconciled.length} payment${unreconciled.length === 1 ? "" : "s"} this quarter not reconciled — they do not count until they are.`] : []),
      ...(pendingLeads.length ? [`${pendingLeads.length} lead${pendingLeads.length === 1 ? "" : "s"} waiting for an attribution decision.`] : []),
      ...(linkedToUnaccepted.length ? [`${linkedToUnaccepted.length} invoice${linkedToUnaccepted.length === 1 ? " is" : "s are"} linked to a lead that is not accepted — no commission until it is.`] : []),
      ...(duplicates ? [`${duplicates} payment${duplicates === 1 ? " is" : "s are"} claimed twice by the same person — resolve before approving.`] : []),
      ...projectFlags.map((p) => `${p.title}: margin ${p.margin}% is below the ${d.policy.marginTarget}% target${p.margin < 0 ? " (negative)" : ""}.`),
      ...disputes.map((t) => `${t} is on hold — check for an unresolved delivery issue.`),
    ],
  };
}

/* ───────────────────────────── calculations ───────────────────────────── */

const memberName = (d: Data, id: string) => s(d.team.find((m) => m.id === id)?.name) || "Team member";

/** Commission statements for every lead owner with eligible collections in the month. Locked statements are left alone. */
export async function calculateCommissions(d: Data, month: string, by: string) {
  if (!/^\d{4}-\d{2}$/.test(month)) throw new IncentiveError("Choose a month.");
  const collections = collectionsOf(d);
  const attributions = attributionsOf(d.leads);
  const owners = new Set(attributions.filter((a) => a.status === "accepted").flatMap((a) => a.splits.map((x) => x.memberId)));
  const done: string[] = [];
  for (const memberId of owners) {
    // the open statement for the month, if any; approved ones keep their payments, and new payments start a fresh one
    const existing = d.payouts.find((p) => p.kind === "commission" && s(p.memberId) === memberId && s(p.period) === month && !["rejected", ...LOCKED].includes(s(p.status)));
    const lines = commissionLines({ memberId, month, collections, attributions, ratePercent: d.policy.commissionRate, alreadyClaimed: claimsOf(d.payouts, existing?.id) });
    if (!lines.length && !existing) continue;
    const gross = toRupees(lines.reduce((sum, l) => sum + toPaise(l.amount), 0));
    if (existing && n(existing.gross) === gross && JSON.stringify(existing.lines ?? []) === JSON.stringify(lines)) continue;
    const deductions = n(existing?.deductions);
    const record: Record<string, unknown> = {
      ...(existing ?? {}),
      kind: "commission",
      memberId,
      memberName: memberName(d, memberId),
      period: month,
      lines,
      gross,
      deductions,
      net: toRupees(toPaise(gross) - toPaise(deductions)),
      policyId: d.policy.id ?? "",
      policyVersion: d.policy.version,
      status: existing ? s(existing.status) : "calculated",
      history: [...history(existing), event(by, existing ? "Recalculated" : "Calculated", { to: `₹${gross}`, ...(existing ? { from: `₹${n(existing.gross)}` } : {}) })],
    };
    await upsertRecord("incentivePayouts", record, by);
    done.push(memberName(d, memberId));
  }
  return done;
}

/** Quarterly team bonus statements for the eligible members, at the tier the quarter's collections reached. */
export async function calculateBonus(d: Data, key: string, by: string, exclusions: { memberId: string; reason: string }[] = [], skipZero = false) {
  if (!/^\d{4}-Q[1-4]$/.test(key)) throw new IncentiveError("Choose a quarter.");
  const q = quarterSummary(d, key);
  const out: string[] = [];
  for (const m of q.members) {
    const existing = d.payouts.find((p) => p.kind === "bonus" && s(p.memberId) === m.id && s(p.period) === key && s(p.status) !== "rejected");
    if (existing && LOCKED.includes(s(existing.status) as PayoutStatus)) continue;
    const ex = exclusions.find((x) => x.memberId === m.id);
    const gross = ex ? 0 : toRupees(Math.round(toPaise(q.tier.amount) * m.share));
    if (!existing && !gross && skipZero) continue;
    if (existing && n(existing.gross) === gross && (existing.basis as { eligibleCollections?: number } | undefined)?.eligibleCollections === q.eligible) continue;
    const deductions = n(existing?.deductions);
    await upsertRecord(
      "incentivePayouts",
      {
        ...(existing ?? {}),
        kind: "bonus",
        memberId: m.id,
        memberName: m.name,
        period: key,
        basis: { eligibleCollections: q.eligible, tierFrom: q.tier.from, tierAmount: q.tier.amount, share: m.share, excluded: ex?.reason ?? "" },
        gross,
        deductions,
        net: toRupees(Math.max(0, toPaise(gross) - toPaise(deductions))),
        policyId: d.policy.id ?? "",
        policyVersion: d.policy.version,
        status: existing ? s(existing.status) : "calculated",
        history: [...history(existing), event(by, existing ? "Recalculated" : "Calculated", { to: `₹${gross}`, ...(ex ? { reason: `Excluded: ${ex.reason}` } : {}) })],
      },
      by,
    );
    out.push(m.name);
  }
  return out;
}

/**
 * Keeps the statements up to date without anyone pressing Calculate: commission for this month and last month, and the
 * bonus for the quarter that last ended. Only statements whose figures changed are written.
 */
export async function autoCalculate(d: Data, by: string) {
  const month = monthOf(d.today);
  const prev = new Date(Date.parse(`${month}-01`));
  prev.setUTCMonth(prev.getUTCMonth() - 1);
  const lastMonth = prev.toISOString().slice(0, 7);
  const done = [...(await calculateCommissions(d, lastMonth, by)), ...(await calculateCommissions(d, month, by))];
  const [y, q] = quarterOf(d.today).split("-Q").map(Number);
  const lastQuarter = q === 1 ? `${y - 1}-Q4` : `${y}-Q${q - 1}`;
  done.push(...(await calculateBonus(d, lastQuarter, by, [], true)));
  return done;
}

/* ───────────────────────────── changes, each checked and logged ───────────────────────────── */

export async function movePayout(d: Data, user: SessionUser, id: string, to: PayoutStatus, o: { reason?: string; paymentReference?: string; paidOn?: string }) {
  const p = d.payouts.find((x) => x.id === id);
  if (!p) throw new IncentiveError("That payout no longer exists.", 404);
  const actor = memberOf(user, d.team);
  const problem = moveProblem({ from: s(p.status) as PayoutStatus, to, actorRole: user.role, actorTeamId: actor?.id, payoutMemberId: s(p.memberId), reason: o.reason, paymentReference: o.paymentReference ?? s(p.paymentReference) });
  if (problem) throw new IncentiveError(problem);
  const next: Record<string, unknown> = { ...p, status: to, history: [...history(p), event(user.name, "Status", { from: s(p.status), to, reason: o.reason })] };
  if (to === "approved") {
    next.approvedBy = user.name;
    next.approvedAt = new Date().toISOString();
    next.letterRef = s(p.letterRef) || `FM/INC/${s(p.period)}/${p.id.slice(-6).toUpperCase()}`;
  }
  if (o.paymentReference) next.paymentReference = o.paymentReference.trim();
  if (to === "paid") next.paidOn = o.paidOn || d.today;
  await upsertRecord("incentivePayouts", next, user.name);
}

export async function setDeductions(d: Data, user: SessionUser, id: string, deductions: number, note: string) {
  const p = d.payouts.find((x) => x.id === id);
  if (!p) throw new IncentiveError("That payout no longer exists.", 404);
  if (LOCKED.includes(s(p.status) as PayoutStatus)) throw new IncentiveError("An approved payout is frozen. Put it on hold first, or record an adjustment.");
  if (deductions < 0 || deductions > n(p.gross)) throw new IncentiveError("Deductions must be between ₹0 and the gross amount.");
  if (!note.trim()) throw new IncentiveError("Say what the deduction is (for example TDS under section 192 or 194H).");
  await upsertRecord("incentivePayouts", { ...p, deductions, deductionNote: note.trim(), net: toRupees(toPaise(n(p.gross)) - toPaise(deductions)), history: [...history(p), event(user.name, "Deductions", { to: `₹${deductions}`, reason: note.trim() })] }, user.name);
}

export async function decideLead(d: Data, user: SessionUser, leadId: string, decision: "accepted" | "rejected", reason: string, splits?: { memberId: string; percent: number }[]) {
  const lead = d.leads.find((l) => l.id === leadId);
  if (!lead) throw new IncentiveError("That lead no longer exists.", 404);
  if (user.role !== "founder") throw new IncentiveError("Only the founder decides lead attribution.", 403);
  const actor = memberOf(user, d.team);
  const owners = splits?.length ? splits : lead.ownerId ? [{ memberId: s(lead.ownerId), percent: 100 }] : [];
  if (decision === "accepted") {
    if (!owners.length) throw new IncentiveError("Choose the lead owner first.");
    const problem = splitProblem(owners);
    if (problem) throw new IncentiveError(problem);
  }
  if (actor && owners.some((o) => o.memberId === actor.id)) throw new IncentiveError("Nobody can decide a lead they would earn commission on.");
  if (decision === "rejected" && !reason.trim()) throw new IncentiveError("Give the reason for rejecting: the team member sees it.");
  const prevSplits = JSON.stringify(lead.splits ?? []);
  // once accepted and paid against, the split is fixed; a first acceptance after the client paid is fine
  if (decision === "accepted" && s(lead.attribution) === "accepted" && prevSplits !== "[]" && JSON.stringify(owners) !== prevSplits && hasCollections(d, leadId)) {
    throw new IncentiveError("The client has already paid against this lead, so the split can no longer change. Record an exception in the policy instead.");
  }
  await upsertRecord(
    "leads",
    {
      ...lead,
      attribution: decision,
      splits: decision === "accepted" ? owners : lead.splits ?? [],
      decidedBy: user.name,
      decidedAt: new Date().toISOString(),
      decisionNote: reason.trim(),
      attributionHistory: [...(Array.isArray(lead.attributionHistory) ? (lead.attributionHistory as AuditEvent[]) : []), event(user.name, "Attribution", { from: s(lead.attribution) || "none", to: decision, reason: reason.trim() || undefined })],
    },
    user.name,
  );
}

const hasCollections = (d: Data, leadId: string) => collectionsOf(d).some((c) => c.leadId === leadId && c.reconciled);

export async function savePolicy(d: Data, user: SessionUser, input: Partial<Policy>) {
  if (user.role !== "founder") throw new IncentiveError("Only the founder changes the incentive policy.", 403);
  const base = d.policy;
  const tiers = Array.isArray(input.tiers) ? input.tiers.map((t) => ({ from: Math.max(0, n(t.from)), amount: Math.max(0, n(t.amount)) })).filter((t) => t.from > 0).sort((a, b) => a.from - b.from) : base.tiers;
  const rate = input.commissionRate === undefined ? base.commissionRate : n(input.commissionRate);
  if (rate < 0 || rate > 50) throw new IncentiveError("The commission rate must be between 0% and 50%.");
  const version = Math.max(0, ...d.policies.map((p) => n(p.version))) + 1;
  // a saved version applies at once; the previous one is retired and kept for the record
  const policy: Policy = {
    name: s(input.name) || base.name,
    version,
    status: "active",
    effectiveFrom: s(input.effectiveFrom) || d.today,
    commissionRate: rate,
    tiers,
    countTds: input.countTds === undefined ? base.countTds : !!input.countTds,
    marginTarget: input.marginTarget === undefined ? base.marginTarget : Math.max(0, Math.min(100, n(input.marginTarget))),
    reserve: input.reserve === undefined ? base.reserve : Math.max(0, n(input.reserve)),
    partialRule: (["full", "prorata", "exclude"].includes(s(input.partialRule)) ? s(input.partialRule) : base.partialRule) as Policy["partialRule"],
    eligibilityRules: s(input.eligibilityRules ?? base.eligibilityRules).slice(0, 4000),
    qualityRules: s(input.qualityRules ?? base.qualityRules).slice(0, 4000),
    exceptions: s(input.exceptions ?? base.exceptions).slice(0, 4000),
    history: [event(user.name, "Saved and in force", { to: `v${version}` })],
  };
  for (const other of d.policies.filter((x) => x.status === "active")) {
    await upsertRecord("incentivePolicies", { ...other, status: "retired", history: [...history(other), event(user.name, "Retired", { reason: `Replaced by v${version}` })] }, user.name);
  }
  return upsertRecord("incentivePolicies", policy as unknown as Record<string, unknown>, user.name);
}

/* ───────────────────────────── performance reviews ───────────────────────────── */

export const REVIEW_SCORES = ["delivery", "quality", "collaboration", "reliability", "learning"] as const;

/** What the records say about a person's work in a period — facts to inform a review, never a score by themselves. */
export function workFacts(d: Data, memberId: string, start: string, end: string) {
  const name = memberName(d, memberId).toLowerCase();
  const first = name.split(" ")[0];
  const mine = (v: unknown) => {
    const a = s(v).toLowerCase();
    return !!a && (a === name || a.split(/[ ,]+/).includes(first));
  };
  const deliverables = d.deliverables.filter((x) => mine(x.assignee) && s(x.dueDate) >= start && s(x.dueDate) <= end);
  const delivered = deliverables.filter((x) => ["approved", "delivered", "done"].includes(s(x.status)));
  const reworked = deliverables.filter((x) => n(x.round) > 2);
  const tasks = d.tasks.filter((t) => mine(t.assignee) && s(t.dueDate) >= start && s(t.dueDate) <= end);
  const tasksDone = tasks.filter((t) => s(t.status) === "done");
  const leads = d.leads.filter((l) => s(l.ownerId) === memberId && s(l.createdAt).slice(0, 10) >= start && s(l.createdAt).slice(0, 10) <= end);
  return {
    deliverables: deliverables.length,
    delivered: delivered.length,
    reworked: reworked.length,
    tasks: tasks.length,
    tasksDone: tasksDone.length,
    leadsRegistered: leads.length,
    leadsAccepted: leads.filter((l) => s(l.attribution) === "accepted").length,
  };
}

export async function saveReview(d: Data, user: SessionUser, input: Record<string, unknown>) {
  const memberId = s(input.memberId);
  if (!d.team.some((m) => m.id === memberId)) throw new IncentiveError("Choose a team member.");
  const actor = memberOf(user, d.team);
  if (actor?.id === memberId) throw new IncentiveError("Nobody reviews themselves.");
  const kind = s(input.kind) === "quarterly" ? "quarterly" : "monthly";
  const period = s(input.period);
  if (kind === "monthly" ? !/^\d{4}-\d{2}$/.test(period) : !/^\d{4}-Q[1-4]$/.test(period)) throw new IncentiveError("Choose the period.");
  const existing = input.id ? d.reviews.find((r) => r.id === input.id) : d.reviews.find((r) => s(r.memberId) === memberId && s(r.kind) === kind && s(r.period) === period);
  if (existing && ["acknowledged"].includes(s(existing.status)) && input.status !== "draft") throw new IncentiveError("This review was acknowledged. Reopen it as a draft to change it.");
  const scores = Object.fromEntries(REVIEW_SCORES.map((k) => [k, Math.max(0, Math.min(5, Math.round(n((input.scores as Record<string, unknown> | undefined)?.[k]))))]));
  const status = ["draft", "shared"].includes(s(input.status)) ? s(input.status) : "draft";
  return upsertRecord(
    "performanceReviews",
    {
      ...(existing ?? {}),
      memberId,
      memberName: memberName(d, memberId),
      kind,
      period,
      scores,
      strengths: s(input.strengths).slice(0, 3000),
      improve: s(input.improve).slice(0, 3000),
      goals: s(input.goals).slice(0, 3000),
      clientFeedback: s(input.clientFeedback).slice(0, 2000),
      evidence: s(input.evidence).slice(0, 2000),
      bonusEligible: input.bonusEligible === undefined ? true : !!input.bonusEligible,
      status,
      reviewer: user.name,
      history: [...history(existing), event(user.name, existing ? "Updated" : "Written", { to: status })],
    },
    user.name,
  );
}

/* ───────────────────────────── the team member's own view ───────────────────────────── */

/** Only what belongs to this person: their leads, statements and shared reviews — never anyone else's. */
export function myView(d: Data, user: SessionUser) {
  const me = memberOf(user, d.team);
  const range = quarterRange(quarterOf(d.today));
  const q = me ? quarterSummary(d, quarterOf(d.today)) : null;
  return {
    linked: !!me,
    member: me ? { id: me.id, name: s(me.name), role: s(me.role), incentiveEligible: me.incentiveEligible === true } : null,
    policy: { commissionRate: d.policy.commissionRate, tiers: d.policy.tiers, version: d.policy.version },
    quarter: q ? { key: q.key, label: range.label, milestoneReached: q.tier.amount, nextMilestone: q.tier.next?.amount ?? null, eligible: q.members.some((m) => m.id === me?.id) } : null,
    leads: me
      ? d.leads
          .filter((l) => s(l.ownerId) === me.id || (Array.isArray(l.splits) && (l.splits as { memberId: string }[]).some((x) => x.memberId === me.id)))
          .map((l) => ({ id: l.id, name: s(l.name), organisation: s(l.organisation), registeredAt: s(l.registeredAt || l.createdAt), attribution: s(l.attribution) || "none", decisionNote: s(l.decisionNote), decidedAt: s(l.decidedAt), split: (Array.isArray(l.splits) ? (l.splits as { memberId: string; percent: number }[]) : []).find((x) => x.memberId === me.id)?.percent ?? null }))
      : [],
    // their statements, with each commission line's date and amounts (no other person's or client's figures)
    payouts: me
      ? d.payouts
          .filter((p) => s(p.memberId) === me.id)
          .map((p) => ({ ...p, lines: (Array.isArray(p.lines) ? (p.lines as CommissionLine[]) : []).map((l) => ({ date: l.date, eligibleFee: l.eligibleFee, splitPercent: l.splitPercent, ratePercent: l.ratePercent, amount: l.amount })) }))
      : [],
    reviews: me ? d.reviews.filter((r) => s(r.memberId) === me.id && s(r.status) !== "draft") : [],
  };
}

export async function registerLead(d: Data, user: SessionUser, input: Record<string, unknown>) {
  const me = memberOf(user, d.team);
  if (!me) throw new IncentiveError("Your login is not linked to your Team & Payroll record yet. Ask the founder to link it in Settings → Logins.", 403);
  const name = s(input.name).slice(0, 120);
  if (!name) throw new IncentiveError("Give the client or contact's name.");
  if (!s(input.message)) throw new IncentiveError("Describe the opportunity.");
  const phone = s(input.phone).slice(0, 30);
  const email = s(input.email).slice(0, 160);
  if (!phone && !email) throw new IncentiveError("Add a phone number or email for the contact.");
  const dup = d.leads.find((l) => (phone && s(l.phone).replace(/\D/g, "").slice(-10) === phone.replace(/\D/g, "").slice(-10)) || (email && s(l.email).toLowerCase() === email.toLowerCase()));
  const now = new Date().toISOString();
  return upsertRecord(
    "leads",
    {
      kind: ["project", "coaching", "vritta", "partner"].includes(s(input.kind)) ? s(input.kind) : "project",
      status: "new",
      channel: ["WhatsApp", "Instagram DM", "LinkedIn", "Phone call", "Email", "Referral", "Walk-in", "Event", "Other"].includes(s(input.channel)) ? s(input.channel) : "Referral",
      name,
      organisation: s(input.organisation).slice(0, 160),
      phone,
      email,
      city: s(input.city).slice(0, 80),
      message: s(input.message).slice(0, 3000),
      evidence: s(input.evidence).slice(0, 2000),
      page: "Registered in HQ",
      ownerId: me.id,
      attribution: "pending",
      registeredBy: user.name,
      registeredAt: now,
      attributionHistory: [event(user.name, "Registered", { to: "pending", reason: dup ? `Possible duplicate of an existing enquiry (${s(dup.name)})` : undefined })],
    },
    user.name,
  );
}

/** Acknowledge a review, or ask for a correction on a review or a statement: kept on the record, for the founder. */
export async function myRequest(d: Data, user: SessionUser, input: { kind: "acknowledge" | "correction"; target: "review" | "payout"; id: string; text?: string }) {
  const me = memberOf(user, d.team);
  if (!me) throw new IncentiveError("Your login is not linked to your Team & Payroll record yet.", 403);
  const coll = input.target === "review" ? "performanceReviews" : "incentivePayouts";
  const rec = await getRecord(coll, input.id);
  if (!rec || s(rec.memberId) !== me.id) throw new IncentiveError("Not found.", 404);
  if (input.kind === "correction" && !s(input.text)) throw new IncentiveError("Say what should be corrected, and why.");
  const requests = [...(Array.isArray(rec.requests) ? (rec.requests as unknown[]) : []), { at: new Date().toISOString(), by: user.name, kind: input.kind, text: s(input.text).slice(0, 2000), status: "open" }];
  const patch: Record<string, unknown> = { ...rec, requests, history: [...history(rec), event(user.name, input.kind === "acknowledge" ? "Acknowledged" : "Correction requested", { reason: s(input.text) || undefined })] };
  if (input.target === "review") patch.status = input.kind === "acknowledge" ? "acknowledged" : "appealed";
  await upsertRecord(coll, patch, user.name);
}

/* ───────────────────────────── dashboard ───────────────────────────── */

export function dashboard(d: Data) {
  const key = quarterOf(d.today);
  const q = quarterSummary(d, key);
  const month = monthOf(d.today);
  const st = (p: Rec) => s(p.status);
  const sum = (list: Rec[]) => toRupees(list.reduce((a, p) => a + toPaise(n(p.net)), 0));
  const overdue = d.invoices.filter((i) => s(i.status) === "overdue" || (["sent", "partially-paid"].includes(s(i.status)) && s(i.dueDate) && s(i.dueDate) < d.today));
  const reviewMonth = (() => {
    const dt = new Date(Date.parse(`${month}-01`));
    dt.setUTCMonth(dt.getUTCMonth() - 1);
    return dt.toISOString().slice(0, 7);
  })();
  const reviewDue = d.team.filter((m) => m.incentiveEligible === true && s(m.status) !== "inactive" && !d.reviews.some((r) => s(r.memberId) === m.id && s(r.kind) === "monthly" && s(r.period) === reviewMonth));
  const commissionsThisMonth = d.payouts.filter((p) => p.kind === "commission" && s(p.period) === month && st(p) !== "rejected");
  const awaiting = d.payouts.filter((p) => st(p) === "pending");
  const approvedUnpaid = d.payouts.filter((p) => ["approved", "initiated"].includes(st(p)));
  const incentiveOnly = d.team.filter((m) => s(m.compensationBasis) === "incentive-only" && s(m.status) !== "inactive");
  return {
    today: d.today,
    month,
    quarter: q,
    commissionsThisMonth: { count: commissionsThisMonth.length, amount: sum(commissionsThisMonth) },
    awaiting: { count: awaiting.length, amount: sum(awaiting) },
    approvedUnpaid: { count: approvedUnpaid.length, amount: sum(approvedUnpaid) },
    overdueInvoices: overdue.length,
    reviewDue: reviewDue.map((m) => s(m.name)),
    reviewMonth,
    incentiveOnly: incentiveOnly.map((m) => s(m.name)),
    payoutReadiness: q.flags.length ? `${q.flags.length} issue${q.flags.length === 1 ? "" : "s"} to clear before approving.` : "Ready: nothing is blocking approvals.",
  };
}
