/**
 * Quotes: how a quote record is shaped, priced and turned into a project.
 * Pure functions only — the builder, the list, the print and the dashboard all use them.
 */
import { COACHING, VRITTA, type ServiceId, type VrittaEdition, type VrittaSegment } from "@/lib/content/catalog";
import type { BaseRecord, LineItem } from "@/lib/hq/collections";
import { AREA_UNITS, PLANS as RE_PLANS, priceRealEstate, toSqft, type AreaUnit, type PlanId } from "@/lib/content/real-estate";
import { TIERS, industryById, priceIndustry, type IndustryId, type TierId } from "@/lib/content/industries";
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

/* ─────────────────────────── what the client gets ─────────────────────────── */

/** One point of a quote's "What you get": a short title and, if wanted, a line of detail. */
export interface Deliverable {
  id: string;
  title: string;
  detail?: string;
}

/** The quote's own "What you get" points, written per client (empty ones are left out). */
export function deliverablesOf(r: Record<string, unknown>): Deliverable[] {
  return Array.isArray(r.deliverables) ? (r.deliverables as Deliverable[]).filter((x) => x && typeof x.title === "string" && x.title.trim()) : [];
}

/** Starting points from the quote's lines: what each service, plan or app includes — to edit per client. */
export function suggestedDeliverables(lines: QuoteLine[], rates: RateCard): Deliverable[] {
  const out: Deliverable[] = [];
  const add = (title: string, detail?: string) => {
    const t = title.trim();
    if (t && !t.endsWith(":") && !out.some((x) => x.title.toLowerCase() === t.toLowerCase())) out.push({ id: uid("dl"), title: t, ...(detail ? { detail } : {}) });
  };
  for (const l of lines) {
    if (l.kind === "service") rates.services.find((s) => s.id === l.serviceId)?.included.forEach((x) => add(x));
    else if (l.kind === "realestate") RE_PLANS.find((p) => p.id === l.plan)?.includes.forEach((x) => add(x));
    else if (l.kind === "industry") {
      industryById(l.industry)?.features.forEach((f) => add(f.title, f.detail));
      TIERS.find((t) => t.id === l.tier)?.includes.forEach((x) => add(x));
    } else if (l.kind === "vritta") add(VRITTA.line);
    else if (l.kind === "coaching") add(COACHING.line);
  }
  return out;
}

/**
 * Extra line items at ₹0 were used as "What you get" points before this section existed ("Title — detail").
 * They become points; the priced extra items stay where they are.
 */
export function deliverablesFromFreeExtras(r: Record<string, unknown>): { points: Deliverable[]; rest: LineItem[] } {
  const items = Array.isArray(r.extraItems) ? (r.extraItems as LineItem[]) : [];
  const free = items.filter((x) => x && str(x.description).trim() && !num(x.rate));
  const points = free.map((x) => {
    const [title, ...more] = str(x.description).split(/\s+[—–-]\s+/);
    const detail = more.join(" — ").trim();
    return { id: uid("dl"), title: title.trim(), ...(detail ? { detail } : {}) };
  });
  return { points, rest: items.filter((x) => !free.includes(x)) };
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

/** The Real Estate Digital Platform: a plan priced on the project's area, plus add-ons (Rate Card → Real estate). */
export function realEstateLine(rates: RateCard, plan: PlanId = "professional", area = 5, unit: AreaUnit = "acre", addOns: string[] = []): QuoteLine {
  const sqft = Math.round(toSqft(area, unit));
  const p = priceRealEstate(rates.realEstate, plan, sqft, addOns);
  const unitName = AREA_UNITS.find((u) => u.id === unit)?.label.toLowerCase() ?? unit;
  return {
    kind: "realestate",
    key: uid("ln"),
    title: `Real Estate Digital Platform — ${p.plan.name}${unit === "sqft" ? "" : `, ${area.toLocaleString("en-IN")} ${unitName}`}`,
    plan: p.plan.id,
    area,
    unit,
    sqft,
    addOns,
    items: [...p.items, { group: "Maintenance", label: p.maintenance, price: 0 }],
    amount: p.amount,
    billing: "project",
  };
}

/** An industry app: setup and add-ons once, then the plan for every branch, per month or per year (Rate Card → Industries). By default a quote shows one year: 12 months, or 1 year. */
export function industryLine(rates: RateCard, industry: IndustryId = "clinic", tier: TierId = "growth", plan: "monthly" | "annual" = "annual", branches = 1, addOns: string[] = [], periods?: number): QuoteLine {
  const q = priceIndustry(rates.industries, industry, tier, plan, branches, addOns);
  return {
    kind: "industry",
    key: uid("ln"),
    title: `${q.industry.product} — ${q.tier.name} plan${q.branches > 1 ? `, ${q.branches} branches` : ""}`,
    industry: q.industry.id,
    tier: q.tier.id,
    plan,
    branches: q.branches,
    addOns: q.addOns.map((a) => a.id),
    items: q.oneTimeItems,
    setup: q.oneTimeItems.reduce((s, i) => s + i.price, 0),
    amount: q.recurring,
    periods: Math.max(1, Math.round(periods ?? (plan === "annual" ? 1 : 12))),
  };
}

export function customLine(): QuoteLine {
  return { kind: "custom", key: uid("ln"), title: "Custom work", items: [{ group: "Custom", label: "Describe the work", price: 0 }], amount: 0, billing: "project" };
}

/* ─────────────────────────── a new quote ─────────────────────────── */

export function blankQuote(rates: RateCard | null, client?: BaseRecord, lead?: BaseRecord): Record<string, unknown> {
  const today = todayIso();
  const wanted = (Array.isArray(lead?.services) ? lead.services : Array.isArray(client?.services) ? client.services : []) as string[];
  const lines: QuoteLine[] = [];
  // an enquiry from the website's pricing page carries exactly what was chosen: start from that
  const config = (lead?.config && typeof lead.config === "object" ? lead.config : {}) as Record<string, { selections?: Selections; months?: number; plan?: PlanId; sqft?: number; addOns?: string[]; industry?: IndustryId; tier?: TierId; billing?: "monthly" | "annual"; branches?: number }>;
  if (rates) {
    for (const s of wanted) {
      const c = config[s];
      if (rates.services.some((x) => x.id === s)) lines.push(c?.selections && typeof c.selections === "object" ? serviceLine(rates, s as ServiceId, c.selections, Math.max(1, Number(c.months) || 1)) : serviceLine(rates, s as ServiceId));
      else if (s === "coaching") lines.push(coachingLine(rates));
      else if (s === "vritta") lines.push(vrittaLine(rates));
      else if (s === "industry") {
        // an industry page sends its industry, plan, billing, branches and add-ons
        const c3 = config.industry;
        lines.push(industryLine(rates, c3?.industry ?? "clinic", c3?.tier ?? "growth", c3?.billing === "monthly" ? "monthly" : "annual", Number(c3?.branches) || 1, Array.isArray(c3?.addOns) ? c3.addOns : []));
      } else if (s === "realestate") {
        // the real estate page sends its plan, area (sq ft) and add-ons
        const c2 = config.realestate;
        lines.push(c2?.sqft ? realEstateLine(rates, c2.plan ?? "professional", Number(c2.sqft), "sqft", Array.isArray(c2.addOns) ? c2.addOns : []) : realEstateLine(rates));
      }
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
  for (const l of lines) out.add(l.kind === "service" ? l.serviceId : l.kind === "coaching" ? "coaching" : l.kind === "vritta" ? "vritta" : l.kind === "realestate" ? "realestate" : l.kind === "industry" ? "industry" : "other");
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
  const oneTimeTaxable = Math.max(0, money.taxable - money.monthlyNet * money.months - money.planNet);
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
    brief: [
      str(q.notes),
      ...lines.map((l) => `• ${l.title}${l.kind === "service" ? `: ${l.items.map((i) => i.label).join(", ")}` : ""}`),
      ...(deliverablesOf(q).length ? ["", "What the client gets:", ...deliverablesOf(q).map((x) => `– ${x.title}${x.detail ? ` — ${x.detail}` : ""}`)] : []),
    ]
      .filter((x, i) => x || i > 0)
      .join("\n")
      .trim(),
    milestones: milestonePlan(q, money, fallbackMilestones).map((m) => ({ ...m, id: uid("ms"), status: "due", invoiceId: "" })),
  };
}
