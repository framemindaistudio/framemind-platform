import "server-only";
import { store, StoreConflictError } from "@/lib/store";
import { COACHING, SERVICES, SOCIAL_CONTRACTS, BUNDLE, TERMS, VRITTA, type Service, type ServiceGroup, type ServiceId, type VrittaEdition, type VrittaSegment } from "@/lib/content/catalog";
import type { MoneyLine, PriceBook, RateCard, RevenueStream, VrittaRate } from "@/lib/pricebook/types";
import { uid } from "@/lib/utils";
import { ValidationError } from "./records";
import { OPS, SALES_SIDE, type Role } from "./roles";

/**
 * The rate card (data/ratecard.json in the private data repository): reading, checking and saving.
 * See src/lib/pricebook/types.ts for what is in it and who may see which part.
 */
export const PRICEBOOK_PATH = "data/ratecard.json";

const SERVICE_IDS = SERVICES.map((s) => s.id);
const SEGMENTS: VrittaSegment[] = ["college", "school"];
const EDITIONS: VrittaEdition[] = ["essential", "professional", "institutional"];

/** The rate card for an installation that has not saved one yet: the studio's published prices, and no costs. */
export function startingBook(): PriceBook {
  return {
    version: 1,
    rates: {
      gstPercent: TERMS.gstPercent,
      services: structuredClone(SERVICES),
      socialContracts: structuredClone(SOCIAL_CONTRACTS),
      bundleSteps: structuredClone(BUNDLE.steps),
      vritta: { rates: structuredClone(VRITTA.rates), oneTime: structuredClone(VRITTA.oneTime), groupLicencePercent: VRITTA.groupLicencePercent, amcPercent: VRITTA.amcPercent },
      coaching: { online: COACHING.fees.online, offline: COACHING.fees.offline, sessions: 0 },
      terms: { validityDays: TERMS.validityDays, revisionRounds: TERMS.revisionRounds, milestones: structuredClone(TERMS.defaultMilestones) },
    },
    planner: {
      fixedCosts: [],
      capex: [],
      targets: { monthlyRevenue: 0, projectsPerMonth: 0, avgProjectValue: 0, activeLearners: 0, vrittaInstitutions: 0, socialRetainers: 0, avgRetainer: 0, growthPercent: 0 },
      streams: [],
      margins: {},
    },
  };
}

/* ───────────────────────────── checking what was typed ───────────────────────────── */

const obj = (v: unknown): Record<string, unknown> => (v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {});
const arr = (v: unknown, max: number): unknown[] => (Array.isArray(v) ? v.slice(0, max) : []);
const text = (v: unknown, max: number) => (typeof v === "string" ? v : v === undefined || v === null ? "" : String(v)).replace(/\s+/g, " ").trim().slice(0, max);
/** a number within [min, max], rounded to `decimals`; anything that is not a number becomes `fallback` */
function num(v: unknown, fallback: number, min: number, max: number, decimals = 0) {
  const n = typeof v === "string" && v.trim() !== "" ? Number(v) : v;
  if (typeof n !== "number" || !Number.isFinite(n)) return fallback;
  const f = 10 ** decimals;
  return Math.min(max, Math.max(min, Math.round(n * f) / f));
}
const cleanId = (v: unknown, prefix: string) => (typeof v === "string" && /^[\w-]{1,48}$/.test(v) ? v : uid(prefix));

function cleanGroups(v: unknown, base: ServiceGroup[]): ServiceGroup[] {
  if (!Array.isArray(v)) return base;
  const seen = new Set<string>();
  return arr(v, 20)
    .map((raw) => {
      const g = obj(raw);
      let id = cleanId(g.id, "grp");
      while (seen.has(id)) id = uid("grp");
      seen.add(id);
      const optSeen = new Set<string>();
      const options = arr(g.options, 40)
        .map((o) => {
          const x = obj(o);
          let oid = cleanId(x.id, "opt");
          while (optSeen.has(oid)) oid = uid("opt");
          optSeen.add(oid);
          const detail = text(x.detail, 200);
          const badge = text(x.badge, 24);
          return { id: oid, label: text(x.label, 120), price: num(x.price, 0, 0, 100_000_000), ...(detail ? { detail } : {}), ...(badge ? { badge } : {}) };
        })
        .filter((o) => o.label);
      const help = text(g.help, 300);
      const note = text(g.note, 400);
      return { id, title: text(g.title, 80), mode: g.mode === "any" ? ("any" as const) : ("one" as const), ...(help ? { help } : {}), ...(note ? { note } : {}), options };
    })
    .filter((g) => g.title && g.options.length);
}

function cleanServices(v: unknown, base: Service[]): Service[] {
  const input = Array.isArray(v) ? v.map(obj) : [];
  // the seven services are fixed (quotes, projects and income streams name them); their content is the founders'
  return SERVICE_IDS.map((id) => {
    const b = base.find((s) => s.id === id) ?? SERVICES.find((s) => s.id === id)!;
    const s = input.find((x) => x.id === id);
    if (!s) return b;
    return {
      ...b,
      name: text(s.name, 60) || b.name,
      short: text(s.short, 80) || b.short,
      description: text(s.description, 400) || b.description,
      included: Array.isArray(s.included) ? arr(s.included, 20).map((x) => text(x, 160)).filter(Boolean) : b.included,
      groups: cleanGroups(s.groups, b.groups),
    };
  });
}

const cleanMoney = (v: unknown, prefix: string): MoneyLine[] =>
  arr(v, 80)
    .map((raw) => {
      const l = obj(raw);
      return { id: cleanId(l.id, prefix), label: text(l.label, 160), amount: num(l.amount, 0, 0, 100_000_000) };
    })
    .filter((l) => l.label);
const cleanStreams = (v: unknown): RevenueStream[] =>
  arr(v, 80)
    .map((raw) => {
      const l = obj(raw);
      return { id: cleanId(l.id, "stream"), name: text(l.name, 120), model: text(l.model, 160), potential: text(l.potential, 200), stage: text(l.stage, 40) };
    })
    .filter((l) => l.name);

function cleanRates(input: unknown, base: RateCard): RateCard {
  const i = obj(input);
  const v = obj(i.vritta);
  const vr = obj(v.rates);
  const c = obj(i.coaching);
  const t = obj(i.terms);
  const rates = Object.fromEntries(
    SEGMENTS.map((seg) => {
      const segIn = obj(vr[seg]);
      return [
        seg,
        Object.fromEntries(
          EDITIONS.map((ed) => {
            const b = base.vritta.rates[seg][ed];
            if (!b) return [ed, null];
            const r = obj(segIn[ed]);
            const out: VrittaRate = { monthly: num(r.monthly, b.monthly, 0, 100_000_000), annual: num(r.annual, b.annual, 0, 100_000_000), perpetual: num(r.perpetual, b.perpetual, 0, 1_000_000_000), amc: num(r.amc, b.amc, 0, 100_000_000) };
            return [ed, out];
          }),
        ),
      ];
    }),
  ) as RateCard["vritta"]["rates"];
  const milestones = Array.isArray(t.milestones)
    ? arr(t.milestones, 8)
        .map((m) => ({ label: text(obj(m).label, 80), percent: num(obj(m).percent, 0, 0, 100, 1) }))
        .filter((m) => m.label)
    : base.terms.milestones;
  return {
    gstPercent: num(i.gstPercent, base.gstPercent, 0, 40, 1),
    services: cleanServices(i.services, base.services),
    socialContracts: Array.isArray(i.socialContracts)
      ? arr(i.socialContracts, 8)
          .map((x) => {
            const o = obj(x);
            const badge = text(o.badge, 24);
            return { months: num(o.months, 1, 1, 60), label: text(o.label, 40), discountPercent: num(o.discountPercent, 0, 0, 90, 1), ...(badge ? { badge } : {}) };
          })
          .filter((x) => x.label)
      : base.socialContracts,
    bundleSteps: Array.isArray(i.bundleSteps) ? arr(i.bundleSteps, 8).map((x) => ({ services: num(obj(x).services, 2, 2, 9), discountPercent: num(obj(x).discountPercent, 0, 0, 90, 1) })) : base.bundleSteps,
    vritta: {
      rates,
      oneTime: Array.isArray(v.oneTime)
        ? arr(v.oneTime, 12)
            .map((x) => {
              const o = obj(x);
              return { id: cleanId(o.id, "vr"), label: text(o.label, 80), detail: text(o.detail, 240), price: num(o.price, 0, 0, 100_000_000) };
            })
            .filter((x) => x.label)
        : base.vritta.oneTime,
      groupLicencePercent: num(v.groupLicencePercent, base.vritta.groupLicencePercent, 0, 100, 1),
      amcPercent: num(v.amcPercent, base.vritta.amcPercent, 0, 100, 1),
    },
    coaching: { online: num(c.online, base.coaching.online, 0, 10_000_000), offline: num(c.offline, base.coaching.offline, 0, 10_000_000), sessions: num(c.sessions, base.coaching.sessions, 0, 500) },
    terms: { validityDays: num(t.validityDays, base.terms.validityDays, 1, 365), revisionRounds: num(t.revisionRounds, base.terms.revisionRounds, 0, 20), milestones },
  };
}

/**
 * Turns whatever was sent (or stored) into a complete, well-formed rate card. Values that are missing fall back to
 * `base`. With `strict` it also refuses a rate card quotes could not be made from, and says why.
 */
export function cleanBook(input: unknown, base: PriceBook, strict = false): PriceBook {
  const i = obj(input);
  const planner = obj(i.planner);
  const tg = obj(planner.targets);
  const book: PriceBook = {
    version: 1,
    rates: cleanRates(i.rates, base.rates),
    planner: {
      fixedCosts: Array.isArray(planner.fixedCosts) ? cleanMoney(planner.fixedCosts, "fixed") : base.planner.fixedCosts,
      capex: Array.isArray(planner.capex) ? cleanMoney(planner.capex, "capex") : base.planner.capex,
      targets: {
        monthlyRevenue: num(tg.monthlyRevenue, base.planner.targets.monthlyRevenue, 0, 1_000_000_000),
        projectsPerMonth: num(tg.projectsPerMonth, base.planner.targets.projectsPerMonth, 0, 500),
        avgProjectValue: num(tg.avgProjectValue, base.planner.targets.avgProjectValue, 0, 100_000_000),
        activeLearners: num(tg.activeLearners, base.planner.targets.activeLearners, 0, 10_000),
        vrittaInstitutions: num(tg.vrittaInstitutions, base.planner.targets.vrittaInstitutions, 0, 10_000),
        socialRetainers: num(tg.socialRetainers, base.planner.targets.socialRetainers, 0, 10_000),
        avgRetainer: num(tg.avgRetainer, base.planner.targets.avgRetainer, 0, 10_000_000),
        growthPercent: num(tg.growthPercent, base.planner.targets.growthPercent, -50, 100, 1),
      },
      streams: Array.isArray(planner.streams) ? cleanStreams(planner.streams) : base.planner.streams,
      margins:
        planner.margins && typeof planner.margins === "object"
          ? Object.fromEntries(
              Object.entries(obj(planner.margins))
                .filter(([k]) => /^[\w-]{1,40}$/.test(k))
                .slice(0, 40)
                .map(([k, n]) => [k, num(n, 0, 0, 100, 1)]),
            )
          : base.planner.margins,
    },
  };

  if (strict) {
    const issues: string[] = [];
    for (const s of book.rates.services) {
      if (!s.groups.length) issues.push(`${s.name}: keep at least one group of options.`);
      for (const g of s.groups) if (!g.options.length) issues.push(`${s.name} → ${g.title}: keep at least one option.`);
    }
    const sum = book.rates.terms.milestones.reduce((a, m) => a + m.percent, 0);
    if (book.rates.terms.milestones.length && Math.abs(sum - 100) > 0.01) issues.push(`The payment milestones add up to ${sum}%, not 100%.`);
    if (!book.rates.socialContracts.some((c) => c.months === 1)) issues.push("Social media: keep a month-to-month contract (1 month).");
    if (issues.length) throw new ValidationError(issues);
  }
  return book;
}

/* ───────────────────────────── reading and saving ───────────────────────────── */

export async function readPriceBook(): Promise<{ book: PriceBook; sha?: string; exists: boolean }> {
  const { data, sha } = await store.readJSON<Partial<PriceBook> | null>(PRICEBOOK_PATH, null);
  const book = cleanBook(data ?? {}, startingBook());
  if (data) {
    book.updatedAt = typeof data.updatedAt === "string" ? data.updatedAt : undefined;
    book.updatedBy = typeof data.updatedBy === "string" ? data.updatedBy : undefined;
  }
  return { book, sha, exists: !!data };
}

const backoff = (attempt: number) => new Promise((r) => setTimeout(r, 120 * (attempt + 1)));

/** Checks and saves the whole rate card. */
export async function writePriceBook(input: unknown, author: string): Promise<PriceBook> {
  for (let attempt = 0; attempt < 4; attempt++) {
    const current = await readPriceBook();
    const next = cleanBook(input, current.book, true);
    next.updatedAt = new Date().toISOString();
    next.updatedBy = author;
    try {
      await store.write(PRICEBOOK_PATH, JSON.stringify(next, null, 2) + "\n", "Update the rate card", { sha: current.sha, author });
      return next;
    } catch (e) {
      if (!(e instanceof StoreConflictError)) throw e;
      await backoff(attempt);
    }
  }
  throw new StoreConflictError();
}

/* ───────────────────────────── who gets what ───────────────────────────── */

/**
 * What a signed-in role receives: everyone who prepares or reads quotes gets the rates; the roles that see Finance
 * also get the planning part (costs, targets, margins). The interns login gets neither.
 */
export function bookForRole(role: Role, book: PriceBook): { rates: RateCard | null; book: PriceBook | null } {
  return { rates: SALES_SIDE.includes(role) ? book.rates : null, book: OPS.includes(role) ? book : null };
}

export const isServiceId = (v: unknown): v is ServiceId => typeof v === "string" && (SERVICE_IDS as string[]).includes(v);
