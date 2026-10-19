/**
 * The studio's business model, as plain arithmetic: what a month brings in from each line of work, what it costs,
 * what is left, and a 12-month projection. Every input is the founders' own (HQ → Money → Business Planner); nothing
 * here is assumed for them.
 */
import type { PlannerBook, RateCard } from "@/lib/pricebook/types";

export interface ProjectionRow {
  label: string;
  revenue: number;
  profit: number;
  cash: number;
}

const sum = (xs: number[]) => xs.reduce((s, x) => s + x, 0);

/** The share kept after direct costs, as a fraction; a margin not set counts as 100% (nothing assumed). */
const keep = (margins: Record<string, number>, key: string) => (typeof margins[key] === "number" && margins[key] > 0 ? margins[key] / 100 : 1);

export function monthlyModel(planner: PlannerBook, rates: RateCard | null) {
  const t = planner.targets;
  const coachingFee = rates ? Math.max(rates.coaching.online, rates.coaching.offline) : 0;
  // a 90-day programme spreads its fee over three months
  const coachingMonthly = (t.activeLearners * coachingFee) / 3;
  const vrittaAnnual = rates?.vritta.rates.college.professional?.annual ?? 0;
  const lines = [
    { key: "projects", label: "Client projects", detail: `${t.projectsPerMonth} a month × average value`, revenue: t.projectsPerMonth * t.avgProjectValue, keep: keep(planner.margins, "projects") },
    { key: "social", label: "Social media retainers", detail: `${t.socialRetainers} running × average fee`, revenue: t.socialRetainers * t.avgRetainer, keep: keep(planner.margins, "social") },
    { key: "coaching", label: "1:1 AI coaching", detail: coachingFee ? `${t.activeLearners} learners × fee ÷ 3 months` : "Set the coaching fee in the Rate Card", revenue: coachingMonthly, keep: keep(planner.margins, "coaching") },
    { key: "vritta", label: "Vritta licences", detail: `${t.vrittaInstitutions} institutions × Professional annual ÷ 12`, revenue: (t.vrittaInstitutions * vrittaAnnual) / 12, keep: keep(planner.margins, "vritta") },
  ].map((l) => ({ ...l, contribution: l.revenue * l.keep }));
  const revenue = sum(lines.map((l) => l.revenue));
  const contribution = sum(lines.map((l) => l.contribution));
  const fixed = sum(planner.fixedCosts.map((c) => c.amount));
  const profit = contribution - fixed;
  const projectKeep = keep(planner.margins, "projects");
  const perProject = t.avgProjectValue * projectKeep;
  const otherContribution = contribution - lines[0].contribution;
  const breakEvenProjects = perProject > 0 ? Math.max(0, Math.ceil((fixed - otherContribution) / perProject)) : null;
  return { lines, revenue, contribution, fixed, profit, breakEvenProjects, marginPct: revenue > 0 ? Math.round((profit / revenue) * 100) : 0 };
}

/** Twelve months from `start` (YYYY-MM): project count grows by the growth rate, everything else holds. */
export function projection(planner: PlannerBook, rates: RateCard | null, start: string): { rows: ProjectionRow[]; capex: number; payback: string | null } {
  const capex = sum(planner.capex.map((c) => c.amount));
  const [y, m] = start.split("-").map(Number);
  const rows: ProjectionRow[] = [];
  let cash = -capex;
  let payback: string | null = capex > 0 ? null : "No setup spend";
  for (let i = 0; i < 12; i++) {
    const d = new Date(y, m - 1 + i, 1);
    const label = d.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
    const grown = { ...planner, targets: { ...planner.targets, projectsPerMonth: planner.targets.projectsPerMonth * Math.pow(1 + planner.targets.growthPercent / 100, i) } };
    const mm = monthlyModel(grown, rates);
    cash += mm.profit;
    if (payback === null && cash >= 0) payback = label;
    rows.push({ label, revenue: mm.revenue, profit: mm.profit, cash });
  }
  return { rows, capex, payback };
}
