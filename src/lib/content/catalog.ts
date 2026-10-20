/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  FRAMEMIND CATALOGUE — WHAT THE STUDIO SELLS AND THE STARTING PRICES
 * ─────────────────────────────────────────────────────────────────────────────
 *  Every service on the studio's interactive pricing page (framemindaistudio.com/pricing), with each
 *  configurable group and option at its published price, plus the bundle discounts, the Vritta rate card and
 *  the commercial terms the site states.
 *
 *  These are the STARTING values. Founders change prices in HQ → Money → Rate Card, which saves a full copy to
 *  the private data repository (data/ratecard.json); HQ then reads that copy at run time. To change a price,
 *  change it in HQ, not here.
 *
 *  Currency: INR, exclusive of GST.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { WEBSITE_SERVICES } from "./site-pricing";

export type ServiceId = "websites" | "brand" | "software" | "automations" | "photography" | "videography" | "social";

export interface ServiceOption {
  id: string;
  label: string;
  detail?: string;
  /** price in rupees before GST; 0 = included */
  price: number;
  badge?: string;
  /** the website shows the price as the base price of the service (no "+"); 0 is then not shown as "Included" */
  base?: boolean;
  /** a unit after the price, e.g. "/language" */
  unit?: string;
}

export interface ServiceGroup {
  id: string;
  title: string;
  /** "one": choose exactly one (radio) · "any": choose any number (checkboxes) */
  mode: "one" | "any";
  help?: string;
  note?: string;
  /** part of the core spec: hidden and not charged while a ready package (group id "package") is chosen */
  core?: boolean;
  options: ServiceOption[];
}

export interface Service {
  id: ServiceId;
  name: string;
  short: string;
  description: string;
  /** "project": a one-time price · "month": a monthly retainer (social media) */
  billing: "project" | "month";
  /** what is always included, from the site's "What's included" notes */
  included: string[];
  groups: ServiceGroup[];
  /** icon for HQ screens (a lucide-react export name) */
  icon: string;
}

/** What HQ adds to each service of the website's price list: a short line, an icon and the always-included list. */
const META: Record<ServiceId, { short: string; icon: string; included: string[] }> = {
  websites: { short: "Design · Development · Launch", icon: "Globe", included: ["Custom design (no templates)", "Responsive layout for all screen sizes", "Cross-browser testing", "Domain connection and deployment", "Basic SEO-ready structure", "30-min handover walkthrough"] },
  brand: { short: "Identity · Guidelines · Assets", icon: "Palette", included: ["Strategy-led logo concepts", "Final logo in all formats", "Colour palette and typography", "2 rounds of revisions per concept"] },
  software: { short: "Dashboards · Platforms · Tools", icon: "Code2", included: ["Structured discovery session before development", "Source code and documentation at handover", "Deployment to the client's hosting"] },
  automations: { short: "Workflow · AI · Integration", icon: "Workflow", included: ["Workflow mapping before build", "Testing with real data", "Handover walkthrough and documentation"] },
  photography: { short: "Brand · Product · Events", icon: "Camera", included: ["Colour-corrected, retouched high-resolution JPEGs", "Curated gallery of selects for approval", "Travel within 25 km of base", "Standard licence: digital and web use"] },
  videography: { short: "Films · Reels · Events", icon: "Clapperboard", included: ["Rough cut for approval, then final delivery", "2 rounds of revisions per video", "Travel within 25 km of base", "Landscape 16:9 master"] },
  social: { short: "Management & Growth", icon: "Megaphone", included: ["Custom static creatives", "Captions, scheduling and publishing", "Basic optimisation per platform"] },
};

/**
 * Every service on the website's pricing configurator (src/lib/content/site-pricing.ts), as HQ's rate card holds it:
 * the same groups, options, prices, notes and tags. The social-media contract group becomes SOCIAL_CONTRACTS and the
 * Studio Bundle becomes BUNDLE below.
 */
export const SERVICES: Service[] = WEBSITE_SERVICES.filter((s): s is typeof s & { id: ServiceId } => s.id !== "bundle").map((s) => ({
  id: s.id,
  name: s.name,
  short: META[s.id].short,
  description: s.description,
  billing: s.unit,
  included: META[s.id].included,
  icon: META[s.id].icon,
  groups: s.groups
    .filter((g) => !g.isDiscount)
    .map((g) => ({
      id: g.id,
      title: g.title,
      mode: g.type === "radio" ? ("one" as const) : ("any" as const),
      ...(g.subtitle ? { help: g.subtitle } : {}),
      ...(g.note ? { note: g.note } : {}),
      ...(g.core ? { core: true } : {}),
      options: g.options.map((o) => ({ id: o.id, label: o.label, price: o.price, ...(o.desc ? { detail: o.desc } : {}), ...(o.tag ? { badge: o.tag } : {}), ...(o.isBase ? { base: true } : {}), ...(o.unit ? { unit: o.unit } : {}) })),
    })),
}));

/** Social media contract lengths and their discount on the monthly fee: the website's "Contract Duration" choice. */
export const SOCIAL_CONTRACTS: { months: number; label: string; discountPercent: number; badge?: string }[] = (
  WEBSITE_SERVICES.find((s) => s.id === "social")?.groups.find((g) => g.isDiscount)?.options ?? []
).map((o) => ({ months: Number(/\d+/.exec(o.label)?.[0] ?? 1), label: o.label, discountPercent: o.discountPct ?? 0, ...(o.tag ? { badge: o.tag } : {}) }));

/** Studio Bundle: a standard engagement per service, and the discount for buying several. */
export const BUNDLE = {
  standard: [
    { id: "websites", label: "Website", detail: "6–10 page custom site with an edit-it-yourself CMS", price: 45000 },
    { id: "brand", label: "Brand Identity", detail: "3 concepts + standard guidelines + stationery", price: 44000 },
    { id: "software", label: "Software Solution", detail: "Business web app with roles and admin panel", price: 150000 },
    { id: "automations", label: "Automations", detail: "3 connected workflows with AI steps", price: 45000 },
    { id: "photography", label: "Photography", detail: "Full-day commercial shoot package", price: 28000 },
    { id: "videography", label: "Videography", detail: "Corporate video package", price: 40000 },
    { id: "social", label: "Social Media", detail: "Growth package — first month", price: 30000 },
  ] as { id: ServiceId; label: string; detail: string; price: number }[],
  /** number of services → discount percent (5 or more = the last step) */
  steps: [
    { services: 2, discountPercent: 5 },
    { services: 3, discountPercent: 8 },
    { services: 4, discountPercent: 10 },
    { services: 5, discountPercent: 12 },
  ],
};

/** The bundle discount for buying `n` different services, in percent. */
export function bundleDiscountFor(n: number, steps = BUNDLE.steps) {
  let pct = 0;
  for (const s of [...steps].sort((a, b) => a.services - b.services)) if (n >= s.services) pct = s.discountPercent;
  return pct;
}

/* ── Vritta ─────────────────────────────────────────────────────────────── */

export type VrittaSegment = "college" | "school";
export type VrittaEdition = "essential" | "professional" | "institutional";
export type VrittaBilling = "monthly" | "annual" | "perpetual";

export const VRITTA = {
  name: "Vritta",
  line: "A departmental activity record for educational institutions — that produces the institution's newsletter as a by-product.",
  editions: [
    { id: "essential", name: "Essential", roman: "I", support: "2 working days", summary: "One institution-wide publication a month, collected from every department." },
    { id: "professional", name: "Professional", roman: "II", support: "1 working day", summary: "Every department gets its own monthly issue; the institution edition curates from them.", badge: "Most adopted" },
    { id: "institutional", name: "Institutional", roman: "III", support: "4 working hours", summary: "The record as accreditation evidence (NAAC / NBA), across a whole campus or several." },
  ] as { id: VrittaEdition; name: string; roman: string; support: string; summary: string; badge?: string }[],
  /** licence fee by segment and edition; null = not offered */
  rates: {
    college: {
      essential: { monthly: 12500, annual: 125000, perpetual: 500000, amc: 100000 },
      professional: { monthly: 19500, annual: 195000, perpetual: 780000, amc: 156000 },
      institutional: { monthly: 34500, annual: 345000, perpetual: 1380000, amc: 276000 },
    },
    school: {
      essential: { monthly: 6500, annual: 65000, perpetual: 260000, amc: 52000 },
      professional: { monthly: 11500, annual: 115000, perpetual: 460000, amc: 92000 },
      institutional: null,
    },
  } as Record<VrittaSegment, Record<VrittaEdition, { monthly: number; annual: number; perpetual: number; amc: number } | null>>,
  oneTime: [
    { id: "impl-school", label: "Implementation — School", detail: "Deployment, branding, masthead, department roster, template pass, remote training", price: 35000 },
    { id: "impl-college", label: "Implementation — College", detail: "As school, plus cell and committee configuration and a print proof with the institution's printer", price: 75000 },
    { id: "impl-institutional", label: "Implementation — Institutional", detail: "As college, plus criterion mapping workshop with the IQAC and multi-campus setup", price: 150000 },
    { id: "onsite-week", label: "On-site training week", detail: "Five consecutive working days on campus. Travel, stay and local transport at actuals.", price: 85000 },
  ],
  /** each further institution under the same trust pays this share of the licence fee, in percent */
  groupLicencePercent: 55,
  /** maintenance on a perpetual licence, per year from year 2, as a percent of the perpetual fee */
  amcPercent: 20,
  hosting: [
    { id: "managed", label: "Managed", detail: "FrameMind hosts and operates it. Included in the licence fee. Not available with a perpetual licence." },
    { id: "institution-cloud", label: "Institution Cloud", detail: "The institution's own managed database and hosting (approx. ₹45,000/year to the provider, billed in USD)." },
    { id: "on-campus", label: "On Campus", detail: "The institution's own server and network. Nil recurring cost beyond existing infrastructure." },
  ],
  pilotNote: "Monthly billing is for pilots: a three-month paid pilot converting to annual, with the pilot fee credited in full against the first annual invoice.",
  goLiveWeeks: 4,
  plan: [
    { week: "Week 1", title: "Environment & identity", detail: "Deployment, branding, masthead, department roster loaded and access links issued." },
    { week: "Week 2", title: "Template & calendar", detail: "Page structure and binding fixed, sections allocated, publication calendar and deadlines configured." },
    { week: "Week 3", title: "Training", detail: "Coordinators on submission, editors on composition and export, administrators on the workroom." },
    { week: "Week 4", title: "First issue & print proof", detail: "A live issue composed end to end, exported and proofed with the institution's printer. Admin docs handed over." },
  ],
};

/* ── 1:1 AI Coaching ────────────────────────────────────────────────────── */

export type CoachingTrack = "10-20" | "21-35" | "36-60";

export const COACHING = {
  name: "1:1 AI Coaching",
  line: "Learn AI completely, in 90 days, starting from zero — always 1:1, built around the learner's profession.",
  days: 90,
  tracks: [
    { id: "10-20", label: "Ages 10–20", who: "Students" },
    { id: "21-35", label: "Ages 21–35", who: "Early-career professionals, freelancers and founders" },
    { id: "36-60", label: "Ages 36–60", who: "Working professionals & entrepreneurs" },
  ] as { id: CoachingTrack; label: string; who: string }[],
  modes: [
    { id: "online", label: "Online", detail: "1-on-1 live video sessions (Google Meet or Zoom), recordings shared after every session, WhatsApp/email support between sessions." },
    { id: "offline", label: "Offline", detail: "In-person coaching at a FrameMind venue or at the learner's home/office (location-dependent). Printed resources and session notes." },
  ],
  /** fees are not published on the website ("Get a custom quote"): set them in HQ → Rate Card */
  fees: { online: 0, offline: 0 },
};

/* ── Commercial terms, as the studio's site states them ─────────────────── */

export const TERMS = {
  gstPercent: 18,
  /** the usual split: 50% to start, 50% on delivery (larger projects: more milestones) */
  defaultMilestones: [
    { label: "Advance — to start", percent: 50 },
    { label: "On delivery", percent: 50 },
  ],
  validityDays: 15,
  revisionRounds: 2,
  revisionPolicy: "2 rounds of revisions per design stage, on the agreed brief. Send each round's feedback together, from one person. New pages, extra videos, a new creative direction or other scope changes are quoted before we start them.",
  clientResponsibilities: "You provide text, images, logos, brand assets and account access before work begins, and approve each stage on time. Copywriting is not included unless it is on the quote.",
  handoff: "The agreed final deliverables, source files, documentation and a walkthrough call. Ownership of the final deliverables passes to you once the project is paid in full. Third-party software, open-source libraries, stock assets, fonts and plugins stay under their own licences.",
  pricesFinal: "Prices are starting prices for the scope described; ready packages are fixed for what they list. The final price is confirmed in a written quote after a short discovery call.",
  timelines: "A focused website or brand identity runs 3–6 weeks. Software projects range from 6 to 16 weeks. Timelines start once the advance, the brief and your materials are in.",
  /** milestone guidance in words (the default split itself is in defaultMilestones / the rate card) */
  paymentTerms: "Projects up to ₹1 lakh: 50% advance, 50% before final delivery. Larger projects: 40% advance, 30% at an agreed milestone, 30% before handover. Monthly retainers are billed in advance. Work starts once the advance and your materials are in.",
  thirdParty: "Domains, hosting, databases, cloud storage, API and AI usage, email, SMS and WhatsApp fees, ad spend, stock assets and travel beyond 25 km are not included unless the quote lists them. They are paid by you directly, in accounts you own, or billed at cost.",
  warranty: "Websites and software include a 30-day bug-fix warranty after launch: anything that doesn't work as agreed is fixed free. It doesn't cover new features, changes made by others or outages of third-party services. Ongoing care is a separate plan.",
  delays: "If approvals, materials or payments are late, the schedule moves by the same time. A project paused by the client for more than 30 days is re-scheduled when it restarts.",
  discounts: "Discounts apply to our service fees only — not to third-party costs, taxes or expenses — and don't combine: a quote gets either the bundle or the contract-length discount, whichever is higher.",
  tax: "All prices are in Indian rupees and exclude GST, which is added at the applicable rate and shown separately on the invoice.",
  international: "We work with clients internationally. Pricing is INR-based; international payments are by bank transfer or Wise.",
  process: [
    { title: "Tell us what you're building", detail: "A 20-minute call. A direct conversation about what's needed and whether we're the right fit." },
    { title: "We scope it honestly", detail: "A clear scope, timeline and price. No vague retainers, no hidden costs." },
    { title: "We build — you stay in the loop", detail: "Daily or weekly updates depending on project length." },
    { title: "Shipped. Then supported.", detail: "Handover, training and follow-up — so the work actually gets used." },
  ],
};

export const serviceById = (id: string) => SERVICES.find((s) => s.id === id);
export const SERVICE_OPTIONS = SERVICES.map((s) => ({ value: s.id, label: s.name }));
