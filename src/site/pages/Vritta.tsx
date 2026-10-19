"use client";

import { useState } from "react";
import { Link } from "@/site/router";
import { ArrowRight, Check, Minus, ChevronDown, BookOpen, FileText, Database, ArrowUpRight } from "lucide-react";
import SEO from "@/site/components/SEO";
import type { RateCard } from "@/lib/pricebook/types";

// ─── Data ─────────────────────────────────────────────────────────────────────

const layers = [
  {
    icon: BookOpen,
    num: "01",
    title: "The Collection Layer",
    body: "Each department, cell and committee receives a private link. No account, no password, no app. They open it, choose a month, and file what happened: a headline, a description, dates, the coordinators to credit, and photographs. The form enforces what the page can actually hold, so nothing arrives that cannot be used.",
  },
  {
    icon: FileText,
    num: "02",
    title: "The Publication Layer",
    body: "Submissions flow into a fixed-extent, print-ready issue — A4, saddle-stitch page counts, house typography, seasonal themes. Pages that have not been filled draw as placeholders rather than vanishing, so the issue reads as finished from the first of the month. The editor adjusts headlines and photographs in place and exports a press-ready PDF.",
  },
  {
    icon: Database,
    num: "03",
    title: "The Evidence Layer",
    body: "The same records, tagged and exportable by date range, department and activity type — the form in which accreditation bodies ask for them. This is the layer that changes what the platform is worth to an institution, and it is the reason the IQAC rather than the publications committee is usually the buyer.",
  },
];

const BASE_EDITIONS = [
  {
    num: "I",
    label: "Essential",
    tagline: "One institution-wide publication a month, collected from every department.",
    badge: null,
    features: [
      "Unlimited department and cell links",
      "One auto-composed issue per month",
      "In-place editing and PDF export",
      "Twelve seasonal themes",
      "Admin workroom and review screen",
    ],
    schools: { monthly: "₹6,500", annual: "₹65,000", perpetual: "₹2,60,000", amc: "₹52,000" },
    colleges: { monthly: "₹12,500", annual: "₹1,25,000", perpetual: "₹5,00,000", amc: "₹1,00,000" },
    support: "2 working days",
    highlight: false,
  },
  {
    num: "II",
    label: "Professional",
    tagline: "Every department gets its own monthly issue; the institution edition curates from them.",
    badge: "Most adopted",
    features: [
      "Everything in Essential",
      "Per-department newsletters, auto-composed",
      "Departments flag entries to feature",
      "Institution edition draws from flagged entries",
      "Per-department branding and mastheads",
      "Archive across academic years",
    ],
    schools: { monthly: "₹11,500", annual: "₹1,15,000", perpetual: "₹4,60,000", amc: "₹92,000" },
    colleges: { monthly: "₹19,500", annual: "₹1,95,000", perpetual: "₹7,80,000", amc: "₹1,56,000" },
    support: "1 working day",
    highlight: true,
  },
  {
    num: "III",
    label: "Institutional",
    tagline: "The record as accreditation evidence, across a whole campus or several.",
    badge: null,
    features: [
      "Everything in Professional",
      "Criterion tagging for NAAC and NBA",
      "Date-range and criterion-wise evidence export",
      "Multi-campus administration",
      "Bulk export and data portability",
      "Named implementation manager",
    ],
    schools: null,
    colleges: { monthly: "₹34,500", annual: "₹3,45,000", perpetual: "₹13,80,000", amc: "₹2,76,000" },
    support: "4 working hours",
    highlight: false,
  },
];

const capabilities = [
  { name: "Department submission links", e: true, p: true, i: true },
  { name: "Institution newsletter, auto-composed", e: true, p: true, i: true },
  { name: "Per-department newsletters", e: false, p: true, i: true },
  { name: "Feature-flagging and curation", e: false, p: true, i: true },
  { name: "Print-ready PDF export", e: true, p: true, i: true },
  { name: "Accreditation criterion tagging (NAAC / NBA)", e: false, p: false, i: true },
  { name: "Evidence export by date and criterion", e: false, p: false, i: true },
  { name: "Multi-campus administration", e: false, p: false, i: true },
];

const BASE_ONE_TIME = [
  { item: "Implementation — School", covers: "Deployment, branding, masthead, department roster, template pass, remote training", charge: "₹35,000" },
  { item: "Implementation — College", covers: "As above, plus cell and committee configuration and a print proof with the institution's printer", charge: "₹75,000" },
  { item: "Implementation — Institutional", covers: "As above, plus criterion mapping workshop with the IQAC and multi-campus setup", charge: "₹1,50,000" },
  { item: "On-site training week", covers: "Five consecutive working days on campus. Travel, accommodation and local transport billed at actuals.", charge: "₹85,000" },
  { item: "Additional institution, same society", covers: "Each further institution under the same trust or management", charge: "55% of licence fee" },
  { item: "Design services", covers: "Bespoke templates, hand-composed spreads, cover artwork", charge: "On request" },
];

/** The part of HQ's rate card this page shows: Vritta's licence fees and one-time charges (prices only). */
export type VrittaRates = Pick<RateCard, "vritta">;

const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;
const SEG = { schools: "school", colleges: "college" } as const;

/**
 * The editions and one-time charges with HQ's prices (HQ → Money → Rate Card → Vritta) laid over the page's own
 * wording. Without a saved rate card the published prices above are shown.
 */
function vrittaPrices(rates: VrittaRates | null | undefined) {
  const v = rates?.vritta;
  if (!v) return { editions: BASE_EDITIONS, oneTimeCharges: BASE_ONE_TIME, groupPct: 55, amcPct: 20 };
  const editions = BASE_EDITIONS.map((ed) => {
    const id = ed.label.toLowerCase() as "essential" | "professional" | "institutional";
    const priced = (seg: keyof typeof SEG, base: typeof ed.schools) => {
      // an edition the rate card does not offer for this segment keeps the page's own entry (Institutional: colleges only)
      const r = v.rates[SEG[seg]]?.[id];
      return r ? { monthly: inr(r.monthly), annual: inr(r.annual), perpetual: inr(r.perpetual), amc: inr(r.amc) } : base;
    };
    return { ...ed, schools: priced("schools", ed.schools), colleges: priced("colleges", ed.colleges) };
  });
  const byId = Object.fromEntries(v.oneTime.map((o) => [o.id, o]));
  const ids = ["impl-school", "impl-college", "impl-institutional", "onsite-week"];
  const oneTimeCharges = BASE_ONE_TIME.map((row, k) => {
    if (k < ids.length && byId[ids[k]]) return { ...row, charge: inr(byId[ids[k]].price) };
    if (row.charge.includes("% of licence fee")) return { ...row, charge: `${v.groupLicencePercent}% of licence fee` };
    return row;
  });
  return { editions, oneTimeCharges, groupPct: v.groupLicencePercent, amcPct: v.amcPercent };
}

const hostingOptions = [
  {
    label: "Managed",
    sub: "We host and operate it",
    cost: "Included in licence fee",
    holder: "Us, on the institution's behalf",
    perpetual: false,
    note: "Managed hosting and perpetual licences are mutually exclusive — perpetual licences require self-hosting.",
  },
  {
    label: "Institution Cloud",
    sub: "Their own managed database and hosting",
    cost: "Approx. ₹45,000/year, paid direct to provider",
    holder: "The institution",
    perpetual: true,
    note: "Billed in USD by cloud providers. Finance offices that cannot operate a recurring international card should choose managed or on-campus instead.",
  },
  {
    label: "On Campus",
    sub: "Their own server, their own network",
    cost: "Nil beyond existing infrastructure",
    holder: "The institution",
    perpetual: true,
    note: null,
  },
];

const timeline = [
  { label: "Week 1", title: "Environment & Identity", desc: "Deployment to the chosen environment. Institution branding, masthead artwork, colour and typography applied. Department roster loaded and access links issued." },
  { label: "Week 2", title: "Template & Calendar", desc: "Page structure fixed to the institution's extent and binding. Section allocation agreed. Publication calendar and submission deadlines configured for the academic year." },
  { label: "Week 3", title: "Training", desc: "Coordinators trained on submission, editors on composition and export, administrators on the workroom. Remote by default; the on-site week runs here when purchased." },
  { label: "Week 4", title: "First Issue & Print Proof", desc: "A live issue composed end to end with real submissions, exported and proofed with the institution's printer. Handover of administrator documentation." },
  { label: "Months 2–12", title: "Included Support", desc: "Defect resolution, platform updates, and one review session per term with the administrator. Response targets as per edition." },
];

const dos = [
  "Name one administrator with authority — someone who can decide what goes on a page and hold a deadline.",
  "Send photographs from the original camera or phone. Images forwarded through messaging apps are compressed below print resolution.",
  "Set submission deadlines a full week before publication. Departments file on the deadline, not before it.",
  "Involve the IQAC from the first meeting, even when the newsletter is the immediate goal.",
  "Confirm the printer's requirements before the first issue — bleed, trim, binding and colour profile.",
  "Raise the purchase order in the April–June budget window. Approvals sought outside it typically wait for the next cycle.",
];

const donts = [
  "Don't collect content over messaging groups in parallel. Two collection routes means two versions.",
  "Don't share one submission link between departments. Links identify who filed what; a shared link destroys the record.",
  "Don't treat page limits as a starting position. Content beyond them is not published — it is held over.",
  "Don't defer training to the coordinators' convenience. Untrained coordinators file late and file wrongly.",
  "Don't modify a self-hosted deployment directly. Changes made outside the release process are overwritten by the next update.",
  "Don't assume a sister institution is covered. Licences name one institution.",
];

const faqs = [
  {
    q: "Can we buy it once and never pay again?",
    a: "Yes — the perpetual licence grants an indefinite right to run the version delivered at handover, together with all updates released during the first twelve months. After that, an annual maintenance contract (20% of the perpetual fee) covers updates and support. Without it, you retain the software but receive no further updates, patches or support.",
  },
  {
    q: "What happens if we stop paying the maintenance contract?",
    a: "You keep the version you have and it continues to run as delivered. You lose access to security patches, platform updates, compatibility maintenance as underlying technologies change, and continued support. Software left unmaintained for several years is not the same asset it was on handover — frameworks release breaking versions, hosting providers deprecate interfaces, and browsers change how pages print.",
  },
  {
    q: "We have five institutions under one trust. What do we pay?",
    a: "The first institution is licensed at the full applicable rate. Each additional institution under the same trust or society is licensed at 55% of the applicable fee. Raise this early — it is far cheaper than discovering it after purchase orders have been raised for each institution separately.",
  },
  {
    q: "Does this replace our ERP?",
    a: "No. Vritta is purpose-built for activity records and newsletter production — the specific evidence and publication layer that ERPs do not address. It is complementary to your existing systems. Submissions flow in through lightweight department links; nothing requires integration with existing infrastructure.",
  },
  {
    q: "Who actually uses it day to day?",
    a: "Department coordinators file submissions through a private link — no account, no app, no password. Editors compose and adjust the auto-laid issue in the workroom. Administrators manage departments, review submissions, and export evidence. The IQAC accesses criterion-tagged records directly in Institutional edition. The platform is designed so that coordinators spend under ten minutes per month filing their department's activity.",
  },
  {
    q: "Can we see it working before we commit?",
    a: "Yes. A three-month paid pilot is the intended path. The pilot fee is credited in full against the first annual invoice where conversion occurs within thirty days of the pilot ending. A reference conversation with the autonomous engineering college in Karnataka — currently publishing a monthly 16-page issue across 13 departments and 5 cells — can be arranged for serious enquiries.",
  },
];

const commercialTerms = [
  { term: "Taxes", basis: "No GST charged currently. If the studio becomes registered during the term, GST at the prevailing rate will be added with prior written notice. TDS may be applied against a certificate." },
  { term: "Payment — subscription", basis: "50% on purchase order, 50% on go-live. Renewals invoiced thirty days before the anniversary." },
  { term: "Payment — perpetual", basis: "40% on purchase order, 40% on deployment, 20% on acceptance of the first published issue." },
  { term: "Payment terms", basis: "Thirty days from invoice." },
  { term: "Quotation validity", basis: "Sixty days from issue." },
  { term: "Rate card validity", basis: "To 31 March 2027. Renewals honour the rate in force at signature for the term of the agreement." },
  { term: "Pilot conversion", basis: "Pilot fees credited in full against the first annual invoice where conversion occurs within thirty days of the pilot ending." },
  { term: "Termination", basis: "Subscriptions terminable at the end of a paid term with thirty days' notice. Fees for the current term are not refundable. Data export provided regardless." },
  { term: "Governing law", basis: "Indian law. Jurisdiction as stated in the executed agreement." },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-8">
      <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.2em]">{children}</span>
      <span className="flex-1 h-px bg-border" />
    </div>
  );
}

function CapCell({ value }: { value: boolean | string }) {
  if (value === true) return <span className="text-foreground/70"><Check size={15} strokeWidth={3} /></span>;
  if (value === false) return <span className="text-muted-foreground/25"><Minus size={14} /></span>;
  return <span className="text-xs text-muted-foreground">{value}</span>;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Vritta({ rates = null }: { rates?: VrittaRates | null }) {
  const { editions, oneTimeCharges, groupPct, amcPct } = vrittaPrices(rates);
  const pct = (text: string) => text.replace(/\b55%/g, `${groupPct}%`).replace(/\b20% of (the )?perpetual/g, (m) => m.replace("20%", `${amcPct}%`));
  const annual = (label: string, seg: "schools" | "colleges") => (editions.find((e) => e.label === label)?.[seg]?.annual ?? "").replace(/[^\d]/g, "");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [segment, setSegment] = useState<"schools" | "colleges">("colleges");

  return (
    <>
      <SEO
        title="Vritta — Activity Records & Newsletter Platform for Schools & Colleges"
        description="Vritta by FrameMind AI Studio is a departmental activity record platform for schools and colleges that produces the institution's newsletter as a by-product. NAAC evidence, auto-composed newsletters, 4-week go-live."
        path="/vritta"
        keywords="institutional newsletter software India, NAAC evidence software, activity record schools colleges India, department newsletter platform, education software India, IQAC software, accreditation evidence India, college newsletter automation"
        ogImageAlt="Vritta — Departmental Activity Record & Newsletter Platform by FrameMind AI Studio"
        jsonLd={[
          {
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "Vritta",
            "applicationCategory": "BusinessApplication",
            "operatingSystem": "Web",
            "description": "A departmental activity record for educational institutions that produces the institution's newsletter as a by-product. Supports NAAC/NBA accreditation evidence export.",
            "creator": { "@type": "Organization", "name": "FrameMind AI Studio", "url": "https://www.framemindaistudio.com" },
            "countriesSupported": "IN",
            "offers": [
              { "@type": "Offer", "name": "Essential — Schools", "price": annual("Essential", "schools") || "65000", "priceCurrency": "INR", "priceSpecification": { "@type": "UnitPriceSpecification", "unitText": "year" } },
              { "@type": "Offer", "name": "Professional — Schools", "price": annual("Professional", "schools") || "115000", "priceCurrency": "INR", "priceSpecification": { "@type": "UnitPriceSpecification", "unitText": "year" } },
              { "@type": "Offer", "name": "Essential — Colleges", "price": annual("Essential", "colleges") || "125000", "priceCurrency": "INR", "priceSpecification": { "@type": "UnitPriceSpecification", "unitText": "year" } },
              { "@type": "Offer", "name": "Professional — Colleges", "price": annual("Professional", "colleges") || "195000", "priceCurrency": "INR", "priceSpecification": { "@type": "UnitPriceSpecification", "unitText": "year" } },
              { "@type": "Offer", "name": "Institutional — Colleges", "price": annual("Institutional", "colleges") || "345000", "priceCurrency": "INR", "priceSpecification": { "@type": "UnitPriceSpecification", "unitText": "year" } },
            ],
          },
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
              { "@type": "Question", "name": "Can we buy Vritta once and never pay again?", "acceptedAnswer": { "@type": "Answer", "text": pct("Yes — the perpetual licence grants an indefinite right to run the version delivered at handover, together with all updates released during the first twelve months. After that, an annual maintenance contract (20% of the perpetual fee) covers updates and support.") } },
              { "@type": "Question", "name": "Does Vritta replace our ERP?", "acceptedAnswer": { "@type": "Answer", "text": "No. Vritta is purpose-built for activity records and newsletter production — the specific evidence and publication layer that ERPs do not address. It is complementary to your existing systems." } },
              { "@type": "Question", "name": "How quickly can Vritta go live?", "acceptedAnswer": { "@type": "Answer", "text": "Four weeks from purchase order to first published issue, assuming the institution meets the implementation dependencies." } },
            ],
          },
        ]}
      />
      <div className="min-h-screen">

        {/* ── Hero ── */}
        <section className="bg-[#0D0D0D] relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(200,241,53,0.06),transparent_60%)]" />
          <div className="absolute top-0 inset-x-0 h-[2px] bg-[#C8F135]" />
          <div className="max-w-6xl mx-auto px-6 pt-16 md:pt-24 pb-16 md:pb-24 relative z-10">
            <div className="flex items-center gap-3 mb-8">
              <span className="w-2 h-2 rounded-full bg-[#C8F135] animate-pulse" />
              <span className="font-mono text-[10px] text-[#555] uppercase tracking-[0.2em]">FrameMind AI Studio · Product</span>
            </div>
            <div className="max-w-4xl">
              <h1 className="text-6xl sm:text-7xl md:text-[96px] font-black text-[#F5F4F0] tracking-tight leading-none mb-4">
                Vritta
              </h1>
              <p className="text-lg md:text-xl text-[#888] leading-relaxed max-w-2xl mb-10">
                A departmental activity record for educational institutions — that produces the institution's newsletter as a by-product.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-[#1a1a1a] border border-[#1a1a1a] rounded-sm overflow-hidden mb-10">
                {[
                  { num: "4 weeks", label: "From PO to first issue" },
                  { num: "3", label: "Editions — Essential to Institutional" },
                  { num: "₹65K", label: "Entry price · Schools, per year" },
                  { num: "0", label: "Accounts needed · Departments just file" },
                ].map(({ num, label }) => (
                  <div key={label} className="bg-[#0D0D0D] px-5 py-5 flex flex-col gap-1.5">
                    <span className="text-2xl font-black text-[#F5F4F0] tracking-tight leading-none">{num}</span>
                    <span className="text-[11px] text-[#555] leading-snug">{label}</span>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-3">
                <Link to="/connect"
                  className="inline-flex items-center gap-2 bg-[#C8F135] text-[#0D0D0D] px-6 py-3 text-sm font-bold rounded-sm hover:bg-[#b8e020] transition-colors">
                  Enquire about Vritta <ArrowRight size={14} />
                </Link>
                <a href="#rate-card"
                  className="inline-flex items-center gap-2 border border-[#2a2a2a] text-[#888] px-6 py-3 text-sm font-medium rounded-sm hover:border-[#444] hover:text-[#bbb] transition-colors">
                  View pricing <ArrowRight size={14} />
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ── What the institution is buying ── */}
        <section className="border-b border-border">
          <div className="max-w-6xl mx-auto px-6 py-16 md:py-20">
            <SectionLabel>01 · What the institution is buying</SectionLabel>
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 lg:gap-16 mb-12">
              <div className="lg:col-span-2">
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight leading-snug mb-5">
                  Every department already does the work.
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  What no institution reliably has is a record of it — dated, described, photographed, attributed, and in one place. Vritta collects that record continuously, and prints from it.
                </p>
              </div>
              <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
                {layers.map((layer) => {
                  const Icon = layer.icon;
                  return (
                    <div key={layer.num} className="border border-border rounded-sm p-5 flex flex-col gap-4 bg-background hover:border-foreground/20 transition-colors">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[9px] text-muted-foreground uppercase tracking-widest">{layer.num}</span>
                        <div className="w-8 h-8 border border-border rounded-sm flex items-center justify-center">
                          <Icon size={14} className="text-muted-foreground" />
                        </div>
                      </div>
                      <h3 className="text-sm font-bold leading-snug">{layer.title}</h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">{layer.body}</p>
                    </div>
                  );
                })}
              </div>
            </div>
            {/* Positioning note */}
            <div className="bg-[#0D0D0D] rounded-sm px-6 py-5 flex flex-col sm:flex-row gap-4 sm:items-start">
              <span className="font-mono text-[9px] text-[#C8F135] uppercase tracking-widest shrink-0 mt-0.5">Positioning</span>
              <p className="text-sm text-[#888] leading-relaxed">
                Sold as newsletter software, this competes with a freelance designer's day rate. Sold as an activity record, it competes with the three weeks an IQAC spends reconstructing two years of departmental evidence from group chats before a visit. <span className="text-[#C8F135] font-medium">Price and pitch accordingly.</span>
              </p>
            </div>
          </div>
        </section>

        {/* ── Editions ── */}
        <section className="border-b border-border bg-secondary/30">
          <div className="max-w-6xl mx-auto px-6 py-16 md:py-20">
            <SectionLabel>02 · Editions</SectionLabel>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
              {editions.map((ed) => (
                <div key={ed.num}
                  className={`rounded-sm border overflow-hidden flex flex-col ${ed.highlight ? "border-[#C8F135] bg-[#0D0D0D] shadow-[0_0_40px_rgba(200,241,53,0.08)]" : "border-border bg-background"}`}>
                  {/* Card header */}
                  <div className={`px-6 pt-6 pb-5 border-b ${ed.highlight ? "border-[#1e1e1e]" : "border-border"}`}>
                    <div className="flex items-start justify-between mb-3">
                      <span className={`font-mono text-[9px] uppercase tracking-widest ${ed.highlight ? "text-[#C8F135]" : "text-muted-foreground"}`}>
                        Edition {ed.num}
                      </span>
                      {ed.badge && (
                        <span className="font-mono text-[8px] font-bold uppercase tracking-widest bg-[#C8F135] text-[#0D0D0D] px-2 py-0.5 rounded-sm">
                          {ed.badge}
                        </span>
                      )}
                    </div>
                    <h3 className={`text-2xl font-black tracking-tight mb-2 ${ed.highlight ? "text-[#F5F4F0]" : "text-foreground"}`}>
                      {ed.label}
                    </h3>
                    <p className={`text-xs leading-relaxed ${ed.highlight ? "text-[#777]" : "text-muted-foreground"}`}>
                      {ed.tagline}
                    </p>
                  </div>
                  {/* Features */}
                  <div className="px-6 py-5 flex flex-col gap-2.5 flex-1">
                    {ed.features.map((f) => (
                      <div key={f} className="flex items-start gap-2.5">
                        <Check size={12} className={`mt-0.5 shrink-0 ${ed.highlight ? "text-[#C8F135]" : "text-foreground/50"}`} strokeWidth={3} />
                        <span className={`text-xs leading-snug ${ed.highlight ? "text-[#999]" : "text-muted-foreground"}`}>{f}</span>
                      </div>
                    ))}
                  </div>
                  {/* Support */}
                  <div className={`px-6 py-4 border-t flex justify-between items-center ${ed.highlight ? "border-[#1e1e1e]" : "border-border"}`}>
                    <span className={`text-[10px] uppercase tracking-wider ${ed.highlight ? "text-[#555]" : "text-muted-foreground/60"}`}>Support</span>
                    <span className={`text-xs font-semibold ${ed.highlight ? "text-[#C8F135]" : "text-foreground"}`}>{ed.support}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Capability table */}
            <h3 className="text-sm font-bold mb-4 text-muted-foreground uppercase tracking-widest text-xs">Capability by edition</h3>
            <div className="overflow-x-auto rounded-sm border border-border">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-[#0D0D0D]">
                    <th className="text-left px-5 py-3 text-xs font-bold text-[#F5F4F0] uppercase tracking-wider w-[55%]">Capability</th>
                    {["Essential", "Professional", "Institutional"].map((h) => (
                      <th key={h} className="px-4 py-3 text-xs font-bold text-[#F5F4F0] uppercase tracking-wider text-center">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {capabilities.map((row, i) => (
                    <tr key={row.name} className={i % 2 === 0 ? "bg-background" : "bg-secondary/40"}>
                      <td className="px-5 py-3 text-sm text-foreground">{row.name}</td>
                      <td className="px-4 py-3 text-center"><CapCell value={row.e} /></td>
                      <td className="px-4 py-3 text-center"><CapCell value={row.p} /></td>
                      <td className="px-4 py-3 text-center"><CapCell value={row.i} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ── Rate Card ── */}
        <section id="rate-card" className="border-b border-border">
          <div className="max-w-6xl mx-auto px-6 py-16 md:py-20">
            <SectionLabel>03 · Rate Card</SectionLabel>
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">Pricing</h2>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-xl">
                  Annual billing carries the equivalent of two months free against monthly. Perpetual is set at four times the annual licence.
                </p>
              </div>
              {/* Toggle */}
              <div className="flex border border-border rounded-sm overflow-hidden shrink-0 self-start sm:self-auto">
                {(["colleges", "schools"] as const).map((seg) => (
                  <button key={seg} onClick={() => setSegment(seg)}
                    className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors capitalize ${segment === seg ? "bg-[#0D0D0D] text-[#C8F135]" : "bg-background text-muted-foreground hover:text-foreground"}`}>
                    {seg}
                  </button>
                ))}
              </div>
            </div>

            {/* Pricing table */}
            <div className="overflow-x-auto rounded-sm border border-border mb-10">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-[#0D0D0D]">
                    <th className="text-left px-5 py-3.5 text-xs font-bold text-[#F5F4F0] uppercase tracking-wider">Edition</th>
                    {["Monthly", "Annual", "Perpetual", "AMC from year 2"].map((h) => (
                      <th key={h} className="px-4 py-3.5 text-xs font-bold text-[#F5F4F0] uppercase tracking-wider text-right">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {editions.map((ed, i) => {
                    const prices = segment === "schools" ? ed.schools : ed.colleges;
                    return (
                      <tr key={ed.num} className={`${i % 2 === 0 ? "bg-background" : "bg-secondary/40"} ${ed.highlight ? "ring-1 ring-inset ring-[#C8F135]/30" : ""}`}>
                        <td className="px-5 py-4">
                          <div className="font-semibold text-foreground flex items-center gap-2">
                            {ed.label}
                            {ed.badge && <span className="font-mono text-[8px] font-bold bg-[#0D0D0D] text-[#C8F135] px-1.5 py-0.5 rounded-sm uppercase tracking-wide">{ed.badge}</span>}
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">Edition {ed.num}</div>
                        </td>
                        {prices ? (
                          <>
                            <td className="px-4 py-4 text-right font-mono text-sm text-foreground">{prices.monthly}</td>
                            <td className="px-4 py-4 text-right font-mono text-sm font-bold text-foreground">{prices.annual}</td>
                            <td className="px-4 py-4 text-right font-mono text-sm text-foreground">{prices.perpetual}</td>
                            <td className="px-4 py-4 text-right font-mono text-sm text-muted-foreground">{prices.amc}</td>
                          </>
                        ) : (
                          <td colSpan={4} className="px-4 py-4 text-center text-xs text-muted-foreground italic">Not available for schools</td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Note on monthly */}
            <div className="bg-secondary/50 border border-border rounded-sm px-5 py-4 mb-10">
              <p className="text-xs text-muted-foreground leading-relaxed">
                <span className="font-bold text-foreground">On monthly billing: </span>
                Monthly is offered for pilots, not as a standing arrangement. A three-month paid pilot converting to annual is the intended path, and the pilot fee is credited in full against the first annual invoice.
              </p>
            </div>

            {/* One-time charges */}
            <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground text-xs mb-4">One-time charges</h3>
            <div className="overflow-x-auto rounded-sm border border-border">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-[#0D0D0D]">
                    <th className="text-left px-5 py-3 text-xs font-bold text-[#F5F4F0] uppercase tracking-wider w-[28%]">Item</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-[#F5F4F0] uppercase tracking-wider">What it covers</th>
                    <th className="text-right px-4 py-3 text-xs font-bold text-[#F5F4F0] uppercase tracking-wider w-[18%]">Charge</th>
                  </tr>
                </thead>
                <tbody>
                  {oneTimeCharges.map((row, i) => (
                    <tr key={row.item} className={i % 2 === 0 ? "bg-background" : "bg-secondary/40"}>
                      <td className="px-5 py-4 font-semibold text-foreground text-sm align-top">{row.item}</td>
                      <td className="px-4 py-4 text-xs text-muted-foreground leading-relaxed align-top">{row.covers}</td>
                      <td className="px-4 py-4 text-right font-mono text-sm font-bold text-foreground align-top whitespace-nowrap">{row.charge}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ── Hosting ── */}
        <section className="border-b border-border bg-secondary/30">
          <div className="max-w-6xl mx-auto px-6 py-16 md:py-20">
            <SectionLabel>04 · Hosting & Where the Data Lives</SectionLabel>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
              {hostingOptions.map((opt) => (
                <div key={opt.label} className="border border-border bg-background rounded-sm p-6 flex flex-col gap-4">
                  <div>
                    <h3 className="text-base font-bold mb-1">{opt.label}</h3>
                    <p className="text-xs text-muted-foreground">{opt.sub}</p>
                  </div>
                  <div className="flex flex-col gap-3 flex-1">
                    <div>
                      <p className="font-mono text-[9px] text-muted-foreground/60 uppercase tracking-widest mb-1">Recurring cost</p>
                      <p className="text-xs text-foreground font-medium">{opt.cost}</p>
                    </div>
                    <div>
                      <p className="font-mono text-[9px] text-muted-foreground/60 uppercase tracking-widest mb-1">Data held by</p>
                      <p className="text-xs text-foreground font-medium">{opt.holder}</p>
                    </div>
                    <div>
                      <p className="font-mono text-[9px] text-muted-foreground/60 uppercase tracking-widest mb-1">Perpetual licence</p>
                      <p className={`text-xs font-semibold ${opt.perpetual ? "text-foreground" : "text-muted-foreground"}`}>
                        {opt.perpetual ? "Available" : "Not available"}
                      </p>
                    </div>
                  </div>
                  {opt.note && (
                    <div className="border-t border-border pt-3">
                      <p className="text-[11px] text-muted-foreground/80 leading-relaxed italic">{opt.note}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="bg-[#0D0D0D] rounded-sm px-5 py-4">
              <p className="text-xs text-[#666] leading-relaxed">
                <span className="text-[#888] font-medium">Practical note: </span>
                Managed hosting and perpetual licences are mutually exclusive. A perpetual licence transfers a right to run the software indefinitely; it cannot also oblige us to operate infrastructure indefinitely. Institutions wanting a single capital payment take self-hosting.
              </p>
            </div>
          </div>
        </section>

        {/* ── Implementation ── */}
        <section className="border-b border-border">
          <div className="max-w-6xl mx-auto px-6 py-16 md:py-20">
            <SectionLabel>05 · Implementation</SectionLabel>
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Go live in 4 weeks.</h2>
              <p className="text-sm text-muted-foreground">From purchase order to first published issue.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-0 border border-border rounded-sm overflow-hidden">
              {timeline.map((step, i) => (
                <div key={step.label} className={`p-5 flex flex-col gap-3 border-b md:border-b-0 md:border-r border-border last:border-0 ${i === 4 ? "bg-secondary/50" : "bg-background"}`}>
                  <div>
                    <span className={`font-mono text-[9px] uppercase tracking-widest font-bold ${i < 4 ? "text-foreground/60" : "text-muted-foreground"}`}>{step.label}</span>
                    <h3 className="text-sm font-bold mt-1.5 leading-snug">{step.title}</h3>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Licensing ── */}
        <section className="border-b border-border bg-secondary/30">
          <div className="max-w-6xl mx-auto px-6 py-16 md:py-20">
            <SectionLabel>06 · Licensing Terms</SectionLabel>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div>
                <h3 className="text-sm font-bold mb-3">What a perpetual licence is, precisely</h3>
                <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                  A perpetual licence grants an indefinite right to run the version delivered at handover, together with all updates released during the first twelve months. Updates published after that period require an active maintenance contract.
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  This is the standard construction for perpetual software licences and is stated plainly here because the word "lifetime" is often read to mean free upgrades in perpetuity. It does not.
                </p>
              </div>
              <div>
                <h3 className="text-sm font-bold mb-3">Scope of the licence</h3>
                <div className="flex flex-col gap-2.5">
                  {[
                    { label: "Named institution", text: "The licence names one institution and is not transferable, including institutions under the same trust." },
                    { label: "Internal use only", text: "Licensed for the institution's own publications and records. Not for operating the platform as a service for third parties." },
                    { label: "No redistribution", text: "Self-hosted deployments do not carry a right to copy, share, sublicense or resell the source code." },
                    { label: "Group licensing", text: pct("Trusts operating several institutions are licensed per institution at 55% of the applicable fee after the first. Ask early.") },
                  ].map(({ label, text }) => (
                    <div key={label} className="flex gap-2.5 items-start">
                      <span className="w-1 h-1 rounded-full bg-foreground/40 mt-1.5 shrink-0" />
                      <div>
                        <span className="text-xs font-semibold text-foreground">{label}: </span>
                        <span className="text-xs text-muted-foreground">{text}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-bold mb-3">Data ownership & maintenance</h3>
                <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                  All content submitted by the institution remains the property of the institution. On termination, a complete export is provided in open formats within fifteen working days at no charge.
                </p>
                <div className="bg-background border border-border rounded-sm p-4">
                  <p className="font-mono text-[9px] text-muted-foreground uppercase tracking-widest mb-1">Maintenance contract</p>
                  <p className="text-sm font-bold text-foreground mb-2">{amcPct}% of perpetual fee / year</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    From year 2. Covers defect resolution, security patches, platform updates, and compatibility maintenance as underlying technologies change.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Dos and Don'ts ── */}
        <section className="border-b border-border">
          <div className="max-w-6xl mx-auto px-6 py-16 md:py-20">
            <SectionLabel>07 · Dos &amp; Don'ts</SectionLabel>
            <p className="text-sm text-muted-foreground mb-10 max-w-xl">
              Stated openly because most implementation failures are predictable, and every one of these has a specific cost attached.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border border-border rounded-sm overflow-hidden">
                <div className="bg-secondary border-b border-border px-5 py-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-foreground/40" />
                  <span className="text-xs font-bold uppercase tracking-widest text-foreground">Do</span>
                </div>
                <div className="p-5 flex flex-col gap-3">
                  {dos.map((d, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <Check size={12} className="text-foreground/60 mt-0.5 shrink-0" strokeWidth={3} />
                      <p className="text-xs text-muted-foreground leading-relaxed">{d}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="border border-border rounded-sm overflow-hidden">
                <div className="bg-red-50 dark:bg-red-950/20 border-b border-border px-5 py-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-400" />
                  <span className="text-xs font-bold uppercase tracking-widest text-foreground">Don't</span>
                </div>
                <div className="p-5 flex flex-col gap-3">
                  {donts.map((d, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <span className="text-red-400 text-xs mt-0.5 shrink-0 font-bold leading-none">✕</span>
                      <p className="text-xs text-muted-foreground leading-relaxed">{d}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Commitments */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border border-border rounded-sm p-5">
                <h4 className="text-xs font-bold uppercase tracking-widest mb-4 text-foreground">We will</h4>
                <div className="flex flex-col gap-2.5">
                  {[
                    "Deliver to the four-week schedule where dependencies are met, or tell you in writing the week we know we cannot.",
                    "Keep the institution's data exportable in open formats at any time, with no exit charge.",
                    "Quote every charge before it is incurred. Nothing appears on an invoice that was not agreed first.",
                    "Give notice of at least ninety days before any change to renewal pricing.",
                    "Hold the institution's content in confidence and never use it as a reference without written permission.",
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <Check size={11} className="text-foreground/60 mt-0.5 shrink-0" strokeWidth={3} />
                      <p className="text-xs text-muted-foreground leading-relaxed">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="border border-border rounded-sm p-5">
                <h4 className="text-xs font-bold uppercase tracking-widest mb-4 text-foreground">We will not</h4>
                <div className="flex flex-col gap-2.5">
                  {[
                    "Support environments modified outside the release process, or infrastructure we have no access to diagnose.",
                    "Provide unlimited support under a fixed fee. Response targets are per edition; scope is defect resolution.",
                    "Undertake design work under the licence fee. Bespoke spreads, cover artwork and hand composition are quoted separately.",
                    "Continue support beyond the included twelve months without an active maintenance contract.",
                    "Migrate historical archives from prior systems as part of implementation. It is real work and is quoted as such.",
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <span className="text-muted-foreground/50 text-xs mt-0.5 shrink-0 font-bold leading-none">—</span>
                      <p className="text-xs text-muted-foreground leading-relaxed">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Commercial Terms ── */}
        <section className="border-b border-border bg-secondary/30">
          <div className="max-w-6xl mx-auto px-6 py-16 md:py-20">
            <SectionLabel>08 · Commercial Terms</SectionLabel>
            <div className="overflow-x-auto rounded-sm border border-border mb-6">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-[#0D0D0D]">
                    <th className="text-left px-5 py-3 text-xs font-bold text-[#F5F4F0] uppercase tracking-wider w-[26%]">Term</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-[#F5F4F0] uppercase tracking-wider">Basis</th>
                  </tr>
                </thead>
                <tbody>
                  {commercialTerms.map((row, i) => (
                    <tr key={row.term} className={i % 2 === 0 ? "bg-background" : "bg-secondary/40"}>
                      <td className="px-5 py-4 font-semibold text-foreground text-sm align-top whitespace-nowrap">{row.term}</td>
                      <td className="px-4 py-4 text-xs text-muted-foreground leading-relaxed align-top">{row.basis}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="bg-background border border-amber-200 dark:border-amber-900/40 rounded-sm px-5 py-4">
              <p className="text-xs text-muted-foreground leading-relaxed">
                <span className="font-bold text-foreground">Procurement note: </span>
                Purchases above roughly ₹50,000 generally move from a head's discretionary approval to a purchase committee, and may require three comparative quotations. Expect a cycle of three to nine months for perpetual and Institutional-edition purchases, and begin the conversation in the preceding academic year.
              </p>
            </div>
          </div>
        </section>

        {/* ── FAQs ── */}
        <section className="border-b border-border">
          <div className="max-w-6xl mx-auto px-6 py-16 md:py-20">
            <SectionLabel>09 · Questions we are always asked</SectionLabel>
            <div className="max-w-3xl mx-auto divide-y divide-border">
              {faqs.map((f) => ({ ...f, a: pct(f.a) })).map((faq, i) => (
                <div key={i} className="py-5">
                  <button
                    className="w-full flex items-start justify-between gap-4 text-left group"
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  >
                    <span className={`text-sm font-semibold leading-snug transition-colors ${openFaq === i ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"}`}>
                      {faq.q}
                    </span>
                    <ChevronDown size={16} className={`shrink-0 mt-0.5 text-muted-foreground transition-transform duration-200 ${openFaq === i ? "rotate-180" : ""}`} />
                  </button>
                  {openFaq === i && (
                    <p className="text-sm text-muted-foreground leading-relaxed mt-3 pr-8">{faq.a}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Studio ── */}
        <section className="bg-[#0D0D0D]">
          <div className="max-w-6xl mx-auto px-6 py-16 md:py-20">
            <SectionLabel>10 · The Studio</SectionLabel>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-[#F5F4F0] tracking-tight mb-5">
                  Built by FrameMind AI Studio.
                </h2>
                <p className="text-sm text-[#666] leading-relaxed mb-8">
                  Vritta is built and delivered by FrameMind AI Studio — a design and software studio working end to end, in house, from identity through to the software that runs on it. A twenty-minute call. No deck, no proposal. A direct conversation about what the institution needs and whether we are the right fit for it.
                </p>
                <div className="border border-[#1e1e1e] rounded-sm p-5 mb-6">
                  <p className="font-mono text-[9px] text-[#555] uppercase tracking-widest mb-2">Reference engagement</p>
                  <p className="text-sm text-[#888] leading-relaxed">
                    Vritta is in production at an autonomous engineering college in Karnataka publishing a monthly sixteen-page issue across thirteen departments and five cells and committees. A reference conversation can be arranged for serious enquiries.
                  </p>
                </div>
                <div className="bg-[#C8F135]/5 border border-[#C8F135]/20 rounded-sm px-5 py-4">
                  <p className="text-xs text-[#888] leading-relaxed">
                    <span className="text-[#C8F135] font-semibold">MSME registered · Govt. of India. </span>
                    Where an institution runs a comparative-quotation process, MSME registration is frequently a scored criterion rather than a formality.
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-4">
                {[
                  { label: "Studio", value: "FrameMind AI Studio" },
                  { label: "Delivery", value: "Design & software · 100% in-house" },
                  { label: "Registration", value: "MSME · Ministry of MSME, Govt. of India" },
                  { label: "Web", value: "www.framemindaistudio.com" },
                  { label: "Enquiries", value: "framemindaistudio@gmail.com" },
                  { label: "Telephone", value: "+91 80730 87576" },
                  { label: "Office", value: "Gadag, Karnataka, India" },
                ].map(({ label, value }) => (
                  <div key={label} className="flex gap-4 py-3 border-b border-[#1a1a1a]">
                    <span className="font-mono text-[9px] text-[#444] uppercase tracking-widest w-24 shrink-0 mt-0.5">{label}</span>
                    <span className="text-sm text-[#aaa]">{value}</span>
                  </div>
                ))}
                <div className="mt-4 flex gap-3">
                  <Link to="/connect"
                    className="flex-1 bg-[#C8F135] text-[#0D0D0D] px-4 py-3 text-sm font-bold rounded-sm hover:bg-[#b8e020] transition-colors text-center flex items-center justify-center gap-2">
                    Book a call <ArrowRight size={13} />
                  </Link>
                  <a href="mailto:framemindaistudio@gmail.com"
                    className="flex-1 border border-[#2a2a2a] text-[#888] px-4 py-3 text-sm font-medium rounded-sm hover:border-[#444] hover:text-[#bbb] transition-colors text-center flex items-center justify-center gap-2">
                    Email us <ArrowUpRight size={13} />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Legal footer note */}
        <div className="border-t border-[#1a1a1a] bg-[#080808]">
          <div className="max-w-6xl mx-auto px-6 py-6">
            <p className="text-[10px] text-[#333] leading-relaxed">
              Vritta is a working product name and may be adapted to the studio's own branding. All figures are in Indian rupees. No GST is charged at present; see Part 08. This rate card is a commercial proposal document; it is not a contract, and it does not constitute legal, tax or financial advice. Licence terms take effect only through an executed agreement, which should be reviewed by a qualified professional before signature. Third-party hosting costs quoted in Part 04 are estimates based on typical single-institution volumes and are subject to the relevant provider's own pricing. © 2026 FrameMind AI Studio.
            </p>
          </div>
        </div>

      </div>
    </>
  );
}
