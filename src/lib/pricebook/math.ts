/**
 * The arithmetic of the rate card and of quotes. Pure functions: used by the server when it saves, by the Rate Card
 * screen while the founders type, and by the quote builder, the quote print and the project screens.
 */
import type { Service, ServiceId, VrittaEdition, VrittaSegment } from "@/lib/content/catalog";
import type { BundleStep, RateCard, SocialContract } from "./types";

/* ───────────────────────────── one service, configured ───────────────────────────── */

/** groupId → the option ids chosen in it */
export type Selections = Record<string, string[]>;

export interface PricedItem {
  group: string;
  label: string;
  price: number;
}

/** What a configured service costs: one row per chosen option (included options show at ₹0). */
export function priceService(service: Service, selections: Selections): { items: PricedItem[]; subtotal: number } {
  const items: PricedItem[] = [];
  for (const g of service.groups) {
    const chosen = selections[g.id] ?? [];
    const picked = g.options.filter((o) => chosen.includes(o.id));
    for (const o of g.mode === "one" ? picked.slice(0, 1) : picked) items.push({ group: g.title, label: o.label, price: o.price });
  }
  return { items, subtotal: items.reduce((s, i) => s + i.price, 0) };
}

/** A sensible starting configuration: in every "choose one" group, the option marked popular / most common, else the first. */
export function defaultSelections(service: Service): Selections {
  const out: Selections = {};
  for (const g of service.groups) {
    if (g.mode !== "one") continue;
    const pick = g.options.find((o) => /popular|most common/i.test(o.badge ?? "")) ?? g.options[0];
    if (pick) out[g.id] = [pick.id];
  }
  return out;
}

export function contractFor(months: number, contracts: SocialContract[]) {
  return contracts.find((c) => c.months === months) ?? contracts[0] ?? { months: 1, label: "Month-to-month", discountPercent: 0 };
}

/** The bundle discount for buying `n` different services, in percent. */
export function bundlePercent(n: number, steps: BundleStep[]) {
  let pct = 0;
  for (const s of [...steps].sort((a, b) => a.services - b.services)) if (n >= s.services) pct = s.discountPercent;
  return pct;
}

/* ───────────────────────────── a quote ───────────────────────────── */

/**
 * One block of a quote. Its prices are COPIED in when the line is made (`items`, `amount`), so a quote never changes
 * when the rate card does. `selections` keeps what was chosen, so the line can be re-priced on purpose.
 */
export type QuoteLine =
  | { kind: "service"; key: string; serviceId: ServiceId; title: string; selections: Selections; items: PricedItem[]; amount: number; billing: "project" | "month"; months?: number; contractDiscountPercent?: number; note?: string }
  | { kind: "coaching"; key: string; title: string; mode: "online" | "offline"; learners: number; amount: number; note?: string }
  | { kind: "vritta"; key: string; title: string; segment: VrittaSegment; edition: VrittaEdition; billing: "monthly" | "annual" | "perpetual"; licence: number; oneTime: PricedItem[]; group: boolean; amount: number; note?: string }
  | { kind: "custom"; key: string; title: string; items: PricedItem[]; amount: number; billing: "project" | "month"; note?: string };

export interface QuoteMoney {
  /** one-time work before any discount */
  oneTime: number;
  /** monthly retainers before any discount (social media) */
  monthly: number;
  /** months the retainers run for (the longest contract on the quote) */
  months: number;
  /** distinct studio services on the quote (coaching, Vritta and custom lines do not count) */
  serviceCount: number;
  bundlePercent: number;
  bundleAmount: number;
  extraPercent: number;
  extraAmount: number;
  /** what the studio charges before GST: one-time + monthly × months, less discounts */
  taxable: number;
  gstPercent: number;
  gst: number;
  total: number;
  /** the monthly retainer after the contract and bundle discounts */
  monthlyNet: number;
}

/** Monthly lines are worked out per month (after their contract discount); everything else is one-time. */
export function quoteMoney(lines: QuoteLine[], o: { applyBundle: boolean; bundleSteps: BundleStep[]; extraPercent: number; gstPercent: number }): QuoteMoney {
  let oneTime = 0;
  let monthly = 0;
  let months = 0;
  const services = new Set<string>();
  for (const l of lines) {
    if (l.kind === "service") services.add(l.serviceId);
    const isMonthly = (l.kind === "service" || l.kind === "custom") && l.billing === "month";
    if (isMonthly) {
      const m = l.kind === "service" ? Math.max(1, l.months ?? 1) : 1;
      monthly += l.amount;
      months = Math.max(months, m);
    } else oneTime += l.amount;
  }
  if (monthly > 0 && months === 0) months = 1;
  const gross = oneTime + monthly * months;
  const bPct = o.applyBundle ? bundlePercent(services.size, o.bundleSteps) : 0;
  const bundleAmount = Math.round((gross * bPct) / 100);
  const extraPercent = Math.min(100, Math.max(0, o.extraPercent || 0));
  const extraAmount = Math.round(((gross - bundleAmount) * extraPercent) / 100);
  const taxable = Math.max(0, gross - bundleAmount - extraAmount);
  const gst = Math.round((taxable * o.gstPercent) / 100);
  const keep = (1 - bPct / 100) * (1 - extraPercent / 100);
  return {
    oneTime,
    monthly,
    months,
    serviceCount: services.size,
    bundlePercent: bPct,
    bundleAmount,
    extraPercent,
    extraAmount,
    taxable,
    gstPercent: o.gstPercent,
    gst,
    total: taxable + gst,
    monthlyNet: Math.round(monthly * keep),
  };
}

/** Price a social media line: the monthly fee from the options, less the contract-length discount. */
export function socialMonthly(subtotal: number, months: number, contracts: SocialContract[]) {
  const c = contractFor(months, contracts);
  return { contract: c, monthly: Math.round(subtotal * (1 - c.discountPercent / 100)) };
}

/** A Vritta line: the licence for the segment / edition / billing, the group rate, and the one-time fees chosen. */
export function priceVritta(rates: RateCard["vritta"], segment: VrittaSegment, edition: VrittaEdition, billing: "monthly" | "annual" | "perpetual", group: boolean, oneTimeIds: string[]) {
  const r = rates.rates[segment]?.[edition];
  const base = r ? r[billing] : 0;
  const licence = Math.round(group ? (base * rates.groupLicencePercent) / 100 : base);
  const oneTime = rates.oneTime.filter((x) => oneTimeIds.includes(x.id)).map((x) => ({ group: "One-time", label: x.label, price: x.price }));
  return { available: !!r, licence, oneTime, amount: licence + oneTime.reduce((s, i) => s + i.price, 0), amc: r?.amc ?? 0 };
}

/** Split an amount by milestone percentages; the last milestone takes the rounding so the parts add up exactly. */
export function splitMilestones(total: number, percents: number[]) {
  const parts = percents.map((p) => Math.round((total * p) / 100));
  const diff = total - parts.reduce((s, x) => s + x, 0);
  if (parts.length) parts[parts.length - 1] += diff;
  return parts;
}

/** A short, stable fingerprint of a value (FNV-1a over its JSON). Not a secret: it only tells two versions apart. */
export function fingerprint(value: unknown) {
  const text = JSON.stringify(value);
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}
