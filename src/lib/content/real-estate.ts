/**
 * Real Estate Digital Platform — FrameMind's area-based standard pricing for plotted layouts, villas and townships.
 *
 * One source for the website page (/real-estate), its calculator and quote, and HQ. Change a price here and every place
 * that shows it follows.
 *
 *   Project cost = the plan's rate × total area, but never below its minimum and never above its maximum.
 *
 * Area is the gross land area of the whole project (plots, roads, parks, open spaces, common areas). Plot count does
 * not change the price.
 *
 * Market references (checked Nov 2026) behind the "typical market price" lines:
 *   • Real estate project / broker websites in India: ₹50,000 – ₹1,50,000
 *     (codingclave.com/guides/real-estate-website-development-cost-india-2026)
 *   • Interactive plot-map platforms with live availability: Fynrio ₹1,00,000 per project per year (Starter),
 *     ₹3,00,000 (Growth) (fynrio.com/pricing); Naksha and PlotPro quote on request.
 *   • 3D masterplan visuals: ₹45,000 – ₹95,000 per image (Pune, Hyderabad), ₹50,000 – ₹1,20,000 (Delhi NCR)
 *     (squarei3d.com, 3D rendering cost guide India 2026)
 *   • Drone flight time ≈ ₹10,000 – ₹20,000 per hour (irpr.agency, Mumbai)
 *   • 360° tours: 360VUE's own published prices.
 */

export type PlanId = "essential" | "professional" | "enterprise";

export interface Plan {
  id: PlanId;
  name: string;
  tagline: string;
  /** ₹ per sq ft of gross project area */
  rate: number;
  /** the least the project costs */
  min: number;
  /** the most the project costs, however large the land */
  max: number;
  /** what a comparable build typically costs elsewhere (the lowest market figure, see the sources above) */
  marketFrom: number;
  marketNote: string;
  /** maintenance included after launch, months */
  freeMonths: number;
  /** maintenance after that, ₹ per month */
  monthly: number;
  bestFor: string;
  includes: string[];
  recommended?: boolean;
}

export const PLANS: Plan[] = [
  {
    id: "essential",
    name: "Essential",
    tagline: "Professional project website",
    rate: 0.75,
    min: 30000,
    max: 125000,
    marketFrom: 50000,
    marketNote: "Real estate project websites in India typically cost ₹50,000 – ₹1,50,000.",
    freeMonths: 3,
    monthly: 1500,
    bestFor: "Digital presentation with a 2D layout (ideal for simple and smaller layouts)",
    includes: [
      "Custom responsive website",
      "Project overview & information",
      "2D master layout (high-resolution)",
      "Plot / land details & specifications",
      "RERA number and RERA website shown, as RERA requires",
      "Location map with nearby landmarks",
      "WhatsApp, call & enquiry buttons",
    ],
  },
  {
    id: "professional",
    name: "Professional",
    tagline: "Interactive layout platform",
    rate: 1.25,
    min: 47000,
    max: 250000,
    marketFrom: 100000,
    marketNote: "Interactive plot-map platforms with live availability start around ₹1,00,000 per project, per year.",
    freeMonths: 6,
    monthly: 2500,
    bestFor: "Interactive layout with enquiry & content management (most suitable for most projects)",
    recommended: true,
    includes: [
      "Everything in Essential, plus:",
      "Interactive 2D layout (clickable plots)",
      "Availability management (Available / Booked / Sold)",
      "Admin / CMS for content & plot updates",
      "Enquiry forms & lead capture",
      "Brochure, images & media management",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    tagline: "Immersive & advanced experience",
    rate: 1.75,
    min: 65000,
    max: 450000,
    marketFrom: 145000,
    marketNote: "A 3D masterplan visual alone typically costs ₹45,000 – ₹95,000 per image; with an interactive platform, from about ₹1,45,000.",
    freeMonths: 12,
    monthly: 4000,
    bestFor: "Complete 3D real estate experience with advanced integrations (ideal for premium & large-scale projects)",
    includes: [
      "Everything in Professional, plus:",
      "3D interactive layout & masterplan",
      "High-quality 3D visualisation of the layout",
      "Advanced enquiry & lead management",
      "Custom features & integrations (CRM, booking, etc.)",
      "Priority support & extended flexibility",
    ],
  },
];

/** "✓" included · "—" not included · any other text is shown as it is */
export const COMPARISON: { feature: string; values: [string, string, string] }[] = [
  { feature: "Custom website (responsive, secure https)", values: ["✓", "✓", "✓"] },
  { feature: "Project information & media", values: ["✓", "✓", "✓"] },
  { feature: "2D master layout", values: ["✓", "✓", "✓"] },
  { feature: "RERA details on the website", values: ["✓", "✓", "✓"] },
  { feature: "Location map, WhatsApp & call buttons", values: ["✓", "✓", "✓"] },
  { feature: "Interactive layout (clickable)", values: ["—", "✓", "✓"] },
  { feature: "3D layout / visualisation", values: ["—", "—", "✓"] },
  { feature: "Admin / CMS (self management)", values: ["—", "✓", "✓"] },
  { feature: "Plot availability management", values: ["—", "✓", "✓"] },
  { feature: "Brochure download", values: ["—", "✓", "✓"] },
  { feature: "Enquiry forms & lead capture", values: ["Basic", "Advanced", "Advanced"] },
  { feature: "CRM / booking integration", values: ["—", "—", "✓"] },
  { feature: "Customisations & integrations", values: ["—", "Limited", "✓"] },
  { feature: "Maintenance included", values: ["3 months", "6 months", "12 months"] },
];

export interface AddOn {
  id: string;
  label: string;
  /** a price per sq ft of project area (with a minimum and a maximum), or a fixed range */
  perSqft?: { rate: number; min: number; max: number };
  range?: { from: number; to?: number };
  note?: string;
}

export const ADD_ONS: AddOn[] = [
  { id: "layout-2d", label: "2D layout creation / digitisation", perSqft: { rate: 0.05, min: 5000, max: 30000 }, note: "From your CAD, PDF or paper layout" },
  { id: "layout-3d", label: "3D layout & masterplan modelling", perSqft: { rate: 0.3, min: 25000, max: 150000 }, note: "Included in Enterprise" },
  { id: "video", label: "Cinematic project videography", range: { from: 15000, to: 50000 } },
  { id: "drone", label: "Drone aerial videography", range: { from: 8000, to: 25000 } },
  { id: "tour", label: "360° virtual tour / aerial 360° (by 360VUE)", range: { from: 6999, to: 31999 }, note: "360VUE's published prices" },
  { id: "crm", label: "CRM / booking system integration", range: { from: 25000, to: 75000 }, note: "Included in Enterprise" },
  { id: "payments", label: "Payment gateway integration", range: { from: 10000 } },
];

export const TERMS = {
  payment: "50% advance, 30% after design & functionality approval, 20% before final deployment.",
  revisions: "Two rounds of reasonable design revisions are included. Further revisions and scope changes are charged.",
  timeline: "7 – 21 working days, by project size, plan and scope. The timeline depends on approved drawings, data and content arriving on time.",
  tax: "All prices exclude applicable taxes (GST, where applicable).",
  infrastructure: [
    "Domain, hosting, database and all third-party subscriptions are bought by the client, in the client's name.",
    "All accounts are created with the client's official email ID.",
    "FrameMind is given the access it needs to set up and manage the platform.",
    "If traffic or data use grows, the client upgrades the hosting / database plan as needed.",
    "The website, data and assets belong to the client after full payment.",
  ],
  maintenance: "Covers technical support, bug fixes, security updates and routine changes.",
};

/* ── areas ── */

export type AreaUnit = "sqft" | "acre" | "gunta" | "cent" | "sqm";
export const AREA_UNITS: { id: AreaUnit; label: string; sqft: number }[] = [
  { id: "acre", label: "Acres", sqft: 43560 },
  { id: "gunta", label: "Guntas", sqft: 1089 },
  { id: "cent", label: "Cents", sqft: 435.6 },
  { id: "sqft", label: "Sq ft", sqft: 1 },
  { id: "sqm", label: "Sq m", sqft: 10.7639 },
];

export const toSqft = (value: number, unit: AreaUnit) => Math.max(0, value) * (AREA_UNITS.find((u) => u.id === unit)?.sqft ?? 1);

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/** The plan's price for an area: rate × area, kept between its minimum and its maximum. */
export function planPrice(plan: Plan, sqft: number) {
  const raw = Math.round(plan.rate * sqft);
  const price = clamp(raw, plan.min, plan.max);
  return { raw, price, rule: price === plan.min && raw < plan.min ? "minimum" : price === plan.max && raw > plan.max ? "maximum" : "area" } as const;
}

/** An add-on's price for an area (per-sq-ft ones), or its starting price (fixed ranges). */
export function addOnPrice(a: AddOn, sqft: number) {
  if (a.perSqft) return clamp(Math.round(a.perSqft.rate * sqft), a.perSqft.min, a.perSqft.max);
  return a.range?.from ?? 0;
}

/** How far below the typical market price a plan starts, in whole percent (0 when it is not below). */
export const belowMarket = (plan: Plan) => Math.max(0, Math.round((1 - plan.min / plan.marketFrom) * 100));

/* ── the prices HQ controls (Money → Rate Card → Real estate) ── */

/** The numbers of the real estate pricing that the founders edit in HQ. The words stay in this file. */
export interface RealEstateRates {
  plans: { id: PlanId; rate: number; min: number; max: number; freeMonths: number; monthly: number }[];
  addOns: { id: string; rate?: number; min?: number; max?: number; from?: number; to?: number }[];
}

/** The published prices, used until HQ saves its own. */
export const DEFAULT_RE_RATES: RealEstateRates = {
  plans: PLANS.map(({ id, rate, min, max, freeMonths, monthly }) => ({ id, rate, min, max, freeMonths, monthly })),
  addOns: ADD_ONS.map((a) => (a.perSqft ? { id: a.id, rate: a.perSqft.rate, min: a.perSqft.min, max: a.perSqft.max } : { id: a.id, from: a.range?.from ?? 0, ...(a.range?.to ? { to: a.range.to } : {}) })),
};

/** The plans and add-ons with HQ's numbers put in (anything HQ has not set keeps the published price). */
export function realEstateWith(rates?: RealEstateRates | null): { plans: Plan[]; addOns: AddOn[] } {
  const plans = PLANS.map((p) => {
    const r = rates?.plans.find((x) => x.id === p.id);
    return r ? { ...p, rate: r.rate, min: r.min, max: Math.max(r.min, r.max), freeMonths: r.freeMonths, monthly: r.monthly } : p;
  });
  const addOns = ADD_ONS.map((a) => {
    const r = rates?.addOns.find((x) => x.id === a.id);
    if (!r) return a;
    if (a.perSqft) return { ...a, perSqft: { rate: r.rate ?? a.perSqft.rate, min: r.min ?? a.perSqft.min, max: Math.max(r.min ?? a.perSqft.min, r.max ?? a.perSqft.max) } };
    return { ...a, range: { from: r.from ?? a.range?.from ?? 0, ...(r.to ? { to: r.to } : {}) } };
  });
  return { plans, addOns };
}

/** The comparison table, with the maintenance row following the plans' included months. */
export const comparisonFor = (plans: Plan[]) =>
  COMPARISON.map((row) => (row.feature === "Maintenance included" ? { ...row, values: plans.map((p) => `${p.freeMonths} months`) as [string, string, string] } : row));

/** In Enterprise, 3D modelling and CRM are part of the plan. */
export const addOnsFor = (planId: PlanId, addOns: AddOn[]) => addOns.filter((a) => !(planId === "enterprise" && (a.id === "layout-3d" || a.id === "crm")));

const sqftText = (sqft: number) => `${Math.round(sqft).toLocaleString("en-IN")} sq ft`;

/** A priced real estate project: one row for the plan and one per add-on. Used by the website's estimate and HQ's quotes. */
export function priceRealEstate(rates: RealEstateRates | null | undefined, planId: PlanId, sqft: number, addOnIds: string[]) {
  const { plans, addOns } = realEstateWith(rates);
  const plan = plans.find((p) => p.id === planId) ?? plans[1];
  const base = planPrice(plan, sqft);
  const rule = base.rule === "minimum" ? " (minimum billing)" : base.rule === "maximum" ? " (maximum billing)" : "";
  const chosen = addOnsFor(plan.id, addOns).filter((a) => addOnIds.includes(a.id));
  const items = [
    { group: "Plan", label: `${plan.name} plan — ₹${plan.rate.toFixed(2)}/sq ft × ${sqftText(sqft)}${rule}`, price: base.price },
    ...chosen.map((a) => ({ group: "Add-ons", label: a.perSqft ? a.label : `${a.label} (from)`, price: addOnPrice(a, sqft) })),
  ];
  return { plan, items, amount: items.reduce((s, i) => s + i.price, 0), maintenance: `${plan.freeMonths} months of maintenance included, then ₹${plan.monthly.toLocaleString("en-IN")}/month.` };
}
