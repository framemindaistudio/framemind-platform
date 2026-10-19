/**
 * Quotes: how a quote record is shaped, priced and turned into a project.
 * Pure functions only — the builder, the list, the print and the dashboard all use them.
 */
import { COACHING, VRITTA, type ServiceId, type VrittaEdition, type VrittaSegment } from "@/lib/content/catalog";
import type { BaseRecord, LineItem } from "@/lib/hq/collections";
import { defaultSelections, priceService, priceVritta, quoteMoney, socialMonthly, splitMilestones, type QuoteLine, type QuoteMoney, type Selections } from "@/lib/pricebook/math";
import type { Milestone, RateCard } from "@/lib/pricebook/types";
import { uid } from "@/lib/utils";
import { addDays, str, todayIso } from "./crm";

export type { QuoteLine } from "@/lib/pricebook/math";

const num = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

/* ─────────────────────────── reading a stored quote ─────────────────────────── */

export function linesOf(r: Record<string, unknown>): QuoteLine[] {
  return Array.isArray(r.lines) ? (r.lines as QuoteLine[]).filter((l) => l && typeof l === "object" && typeof l.kind === "string") : [];
}

export function milestonesOf(r: Record<string, unknown>, fallback: Milestone[]): Milestone[] {
  const m = Array.isArray(r.milestones) ? (r.milestones as Milestone[]).filter((x) => x && typeof x.label === "string") : [];
  return m.length ? m.map((x) => ({ label: x.label, percent: num(x.percent) })) : fallback;
}

export function extraItemsOf(r: Record<string, unknown>): LineItem[] {
  return Array.isArray(r.extraItems) ? (r.extraItems as LineItem[]).filter((x) => x && (x.description || num(x.rate))) : [];
}

/** Every money figure of a quote, from its stored lines (prices as they were when each line was made). */
export function moneyOf(r: Record<string, unknown>, rates: Pick<RateCard, "bundleSteps" | "gstPercent"> | null): QuoteMoney {
  const extra = extraItemsOf(r);
  const lines: QuoteLine[] = [...linesOf(r)];
  if (extra.length) lines.push({ kind: "custom", key: "extra", title: "Extra items", items: extra.map((i) => ({ group: "Extra", label: i.description, price: num(i.qty) * num(i.rate) })), amount: extra.reduce((s, i) => s + num(i.qty) * num(i.rate), 0), billing: "project" });
  return quoteMoney(lines, {
    applyBundle: r.applyBundle === true,
    bundleSteps: rates?.bundleSteps ?? [],
    extraPercent: num(r.discountPercent),
    gstPercent: r.gstPercent === undefined || r.gstPercent === "" ? (rates?.gstPercent ?? 18) : num(r.gstPercent),
  });
}

/* ─────────────────────────── making lines ─────────────────────────── */

export function serviceLine(rates: RateCard, serviceId: ServiceId, selections?: Selections, months = 1): QuoteLine {
  const service = rates.services.find((s) => s.id === serviceId)!;
  const sel = selections ?? defaultSelections(service);
  const priced = priceService(service, sel);
  if (service.billing === "month") {
    const { contract, monthly } = socialMonthly(priced.subtotal, months, rates.socialContracts);
    return { kind: "service", key: uid("ln"), serviceId, title: service.name, selections: sel, items: priced.items, amount: monthly, billing: "month", months: contract.months, contractDiscountPercent: contract.discountPercent };
  }
  return { kind: "service", key: uid("ln"), serviceId, title: service.name, selections: sel, items: priced.items, amount: priced.subtotal, billing: "project" };
}

/** Re-price a service line from today's rate card, keeping what was chosen and its key. */
export function repriceService(line: Extract<QuoteLine, { kind: "service" }>, rates: RateCard, selections = line.selections, months = line.months ?? 1): QuoteLine {
  return { ...serviceLine(rates, line.serviceId, selections, months), key: line.key, note: line.note };
}

export function coachingLine(rates: RateCard, mode: "online" | "offline" = "online", learners = 1): QuoteLine {
  const fee = mode === "online" ? rates.coaching.online : rates.coaching.offline;
  return { kind: "coaching", key: uid("ln"), title: `${COACHING.name} — ${COACHING.days} days, ${mode}`, mode, learners: Math.max(1, learners), amount: fee * Math.max(1, learners) };
}

export function vrittaLine(rates: RateCard, segment: VrittaSegment = "college", edition: VrittaEdition = "professional", billing: "monthly" | "annual" | "perpetual" = "annual", group = false, oneTimeIds?: string[]): QuoteLine {
  const ids = oneTimeIds ?? [segment === "school" ? "impl-school" : edition === "institutional" ? "impl-institutional" : "impl-college"];
  const p = priceVritta(rates.vritta, segment, edition, billing, group, ids);
  const ed = VRITTA.editions.find((e) => e.id === edition)?.name ?? edition;
  return { kind: "vritta", key: uid("ln"), title: `Vritta — ${ed} edition, ${billing} licence`, segment, edition, billing, licence: p.licence, oneTime: p.oneTime, group, amount: p.amount };
}

export function customLine(): QuoteLine {
  return { kind: "custom", key: uid("ln"), title: "Custom work", items: [{ group: "Custom", label: "Describe the work", price: 0 }], amount: 0, billing: "project" };
}

/* ─────────────────────────── a new quote ─────────────────────────── */

export function blankQuote(rates: RateCard | null, client?: BaseRecord, lead?: BaseRecord): Record<string, unknown> {
  const today = todayIso();
  const wanted = (Array.isArray(lead?.services) ? lead.services : Array.isArray(client?.services) ? client.services : []) as string[];
  const lines: QuoteLine[] = [];
  if (rates) {
    for (const s of wanted) {
      if (rates.services.some((x) => x.id === s)) lines.push(serviceLine(rates, s as ServiceId));
      else if (s === "coaching") lines.push(coachingLine(rates));
      else if (s === "vritta") lines.push(vrittaLine(rates));
    }
  }
  const name = str(client?.name || lead?.organisation || lead?.name);
  return {
    status: "draft",
    date: today,
    validUntil: addDays(today, rates?.terms.validityDays ?? 15),
    clientId: client?.id ?? "",
    title: name ? `${wanted.length === 1 ? "Project" : "Studio project"} — ${name}` : "",
    lines,
    applyBundle: lines.filter((l) => l.kind === "service").length >= 2,
    discountPercent: 0,
    extraItems: [],
    gstPercent: rates?.gstPercent ?? 18,
    milestones: rates?.terms.milestones ?? [],
    timelineWeeks: 0,
    revisionRounds: rates?.terms.revisionRounds ?? 2,
    includeTerms: true,
    notes: lead?.message ? `From the enquiry: ${str(lead.message).slice(0, 400)}` : "",
    ...(lead ? { leadId: lead.id } : {}),
  };
}

/** The services a quote covers, for the record's `services` field (lists, CRM, filters). */
export function servicesOf(lines: QuoteLine[]): string[] {
  const out = new Set<string>();
  for (const l of lines) out.add(l.kind === "service" ? l.serviceId : l.kind === "coaching" ? "coaching" : l.kind === "vritta" ? "vritta" : "other");
  return [...out];
}

/* ─────────────────────────── booking: quote → project ─────────────────────────── */

export interface Booking {
  bookedOn: string;
  projectId: string;
  invoiceId?: string;
}

export function bookingOf(r: BaseRecord): Booking | null {
  const b = r.booking as Booking | undefined;
  return b && typeof b === "object" && b.projectId ? b : null;
}

/** Milestones with their amounts (on the total before GST), for the project and its invoices. */
export function milestonePlan(r: Record<string, unknown>, money: QuoteMoney, fallback: Milestone[]) {
  const ms = milestonesOf(r, fallback);
  const oneTimeTaxable = Math.max(0, money.taxable - money.monthlyNet * money.months);
  const amounts = splitMilestones(oneTimeTaxable, ms.map((m) => m.percent));
  return ms.map((m, i) => ({ label: m.label, percent: m.percent, amount: amounts[i] ?? 0 }));
}

/** The project a booked quote becomes. */
export function projectFromQuote(q: BaseRecord, money: QuoteMoney, fallbackMilestones: Milestone[], client?: BaseRecord) {
  const lines = linesOf(q);
  const services = servicesOf(lines);
  const start = todayIso();
  const weeks = num(q.timelineWeeks);
  return {
    title: str(q.title) || `${str(client?.name) || "Client"} — project`,
    clientId: str(q.clientId),
    service: services.find((s) => s !== "other") ?? "other",
    services,
    stage: "kickoff",
    priority: "normal",
    startDate: start,
    ...(weeks > 0 ? { dueDate: addDays(start, Math.round(weeks * 7)) } : {}),
    quoteId: q.id,
    agreedAmount: money.taxable,
    amountReceived: 0,
    revisionsAllowed: num(q.revisionRounds) || 2,
    revisionsUsed: 0,
    clientContact: str(client?.contactName),
    clientContactPhone: str(client?.phone),
    brief: [str(q.notes), ...lines.map((l) => `• ${l.title}${l.kind === "service" ? `: ${l.items.map((i) => i.label).join(", ")}` : ""}`)].filter(Boolean).join("\n"),
    milestones: milestonePlan(q, money, fallbackMilestones).map((m) => ({ ...m, id: uid("ms"), status: "due", invoiceId: "" })),
  };
}
