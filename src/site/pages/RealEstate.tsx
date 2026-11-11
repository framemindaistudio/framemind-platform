"use client";

import { useState } from "react";
import { ArrowRight, Check, Download, Minus } from "lucide-react";
import { Link } from "@/site/router";
import SEO from "@/site/components/SEO";
import { submitLead } from "@/site/leads";
import { ADD_ONS, AREA_UNITS, COMPARISON, PLANS, TERMS, addOnPrice, belowMarket, planPrice, toSqft, type AreaUnit, type PlanId } from "@/lib/content/real-estate";

/*
 * Real Estate Digital Platform: FrameMind's area-based standard pricing for plotted layouts, villas and townships.
 * Every price comes from src/lib/content/real-estate.ts.
 */

const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;
const rate = (n: number) => `₹${n.toFixed(2)}`;
const esc = (v: string) => v.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

function newQuoteNo(d: Date) {
  const code = Array.from(crypto.getRandomValues(new Uint8Array(4)), (b) => "23456789ABCDEFGHJKMNPQRSTUVWXYZ"[b % 31]).join("");
  return `FM-W-${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}-${code}`;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-8">
      <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.2em]">{children}</span>
      <span className="flex-1 h-px bg-border" />
    </div>
  );
}

const Cell = ({ v }: { v: string }) =>
  v === "✓" ? <Check size={15} className="mx-auto text-[#5a9e00]" aria-label="Included" /> : v === "—" ? <Minus size={14} className="mx-auto text-muted-foreground/50" aria-label="Not included" /> : <span className="text-xs font-medium">{v}</span>;

export default function RealEstate() {
  const [area, setArea] = useState("5");
  const [unit, setUnit] = useState<AreaUnit>("acre");
  const [planId, setPlanId] = useState<PlanId>("professional");
  const [extras, setExtras] = useState<string[]>([]);
  const [asking, setAsking] = useState(false);
  const [f, setF] = useState({ name: "", phone: "", email: "", business: "", project: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [sentNo, setSentNo] = useState("");

  const sqft = toSqft(Number(area) || 0, unit);
  const plan = PLANS.find((p) => p.id === planId)!;
  const base = planPrice(plan, sqft);
  // in Enterprise, 3D modelling and CRM are part of the plan
  const available = ADD_ONS.filter((a) => !(plan.id === "enterprise" && (a.id === "layout-3d" || a.id === "crm")));
  const chosen = available.filter((a) => extras.includes(a.id));
  const lines = [
    { label: `${plan.name} plan — ${rate(plan.rate)}/sq ft × ${Math.round(sqft).toLocaleString("en-IN")} sq ft${base.rule === "minimum" ? " (minimum billing)" : base.rule === "maximum" ? " (maximum billing)" : ""}`, price: base.price },
    ...chosen.map((a) => ({ label: a.perSqft ? a.label : `${a.label} (from)`, price: addOnPrice(a, sqft) })),
  ];
  const total = lines.reduce((s, l) => s + l.price, 0);

  async function getQuote(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (!f.name.trim()) return setErr("Please enter your name.");
    if (!/^[+\d][\d\s-]{7,15}$/.test(f.phone.trim())) return setErr("Please enter a valid phone number.");
    if (f.email.trim() && !/^\S+@\S+\.\S+$/.test(f.email.trim())) return setErr("Please enter a valid email, or leave it empty.");
    if (!(sqft > 0)) return setErr("Please enter the project's area.");
    const quoteNo = newQuoteNo(new Date());
    const win = window.open("", "_blank");
    setBusy(true);
    const areaText = `${Number(area).toLocaleString("en-IN")} ${AREA_UNITS.find((u) => u.id === unit)?.label.toLowerCase()} (${Math.round(sqft).toLocaleString("en-IN")} sq ft)`;
    const r = await submitLead({
      kind: "project",
      name: f.name.trim(),
      phone: f.phone.trim(),
      email: f.email.trim() || undefined,
      organisation: f.business.trim() || undefined,
      services: ["realestate"],
      estimate: total,
      quoteNo,
      budget: `${inr(total)} (website estimate)`,
      message: [
        `Quote ${quoteNo} downloaded from the website: Real Estate Digital Platform.`,
        f.project.trim() ? `Project: ${f.project.trim()}` : "",
        `Area: ${areaText}`,
        ...lines.map((l) => `• ${l.label}: ${inr(l.price)}`),
        `Total: ${inr(total)} + GST where applicable. Maintenance: ${plan.freeMonths} months included, then ${inr(plan.monthly)}/month.`,
      ]
        .filter(Boolean)
        .join("\n"),
    });
    setBusy(false);
    if (!r.ok) {
      win?.close();
      return setErr(r.error);
    }
    openQuote(win, { quoteNo, name: f.name.trim(), business: f.business.trim(), project: f.project.trim(), areaText, lines, total, plan });
    setSentNo(quoteNo);
    setAsking(false);
  }

  return (
    <>
      <SEO
        title="Real Estate Digital Platform — Layout Websites & Interactive Plot Maps"
        description="Area-based pricing for plotted layouts, villas and townships: project websites, interactive plot maps with live availability, and 3D masterplans. From ₹0.75 per sq ft, with a minimum and a maximum."
        path="/real-estate"
        keywords="real estate website India, layout website, interactive plot map, plot availability website, 3D masterplan, plotted development website, FrameMind real estate"
        ogImageAlt="FrameMind AI Studio — Real Estate Digital Platform"
      />

      <div className="min-h-screen">
        {/* hero */}
        <section className="bg-[#0D0D0D] relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(200,241,53,0.06),transparent_60%)]" />
          <div className="absolute top-0 inset-x-0 h-[2px] bg-[#C8F135]" />
          <div className="max-w-6xl mx-auto px-6 pt-16 md:pt-24 pb-14 relative z-10">
            <div className="flex items-center gap-3 mb-8">
              <span className="w-2 h-2 rounded-full bg-[#C8F135] animate-pulse" />
              <span className="font-mono text-[10px] text-[#555] uppercase tracking-[0.2em]">Standard pricing model · Layouts · Visualisation · Sales platforms</span>
            </div>
            <h1 className="text-5xl sm:text-6xl md:text-[80px] font-black text-[#F5F4F0] tracking-tight leading-[0.98] mb-6">
              Real Estate
              <br />
              <span className="text-[#C8F135]">Digital Platform</span>
            </h1>
            <p className="text-lg text-[#888] leading-relaxed max-w-2xl mb-10">
              One area-based price for every real estate project — residential layouts, villas, plotted developments and townships. Charged per square foot, with a minimum and a maximum, so you know the price before we start.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-[#1a1a1a] border border-[#1a1a1a] rounded-sm overflow-hidden">
              {[
                ["One standard model", "For every project type"],
                ["Area-based pricing", "Per square foot of the project"],
                ["3 flexible plans", "Pick what the project needs"],
                ["Scalable", "From small layouts to townships"],
              ].map(([t, d]) => (
                <div key={t} className="bg-[#0D0D0D] px-5 py-5">
                  <p className="text-sm font-bold text-[#F5F4F0]">{t}</p>
                  <p className="text-[11px] text-[#555] mt-1">{d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* plans */}
        <section className="border-b border-border">
          <div className="max-w-6xl mx-auto px-6 py-16 md:py-20">
            <SectionLabel>01 · Plans</SectionLabel>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {PLANS.map((p) => (
                <div key={p.id} className={`relative rounded-sm border flex flex-col ${p.recommended ? "border-[#C8F135] bg-[#0D0D0D] text-[#F5F4F0] shadow-[0_0_40px_rgba(200,241,53,0.08)]" : "border-border bg-background"}`}>
                  {p.recommended && <span className="absolute -top-3 left-5 bg-[#C8F135] text-[#0D0D0D] font-mono text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-sm">Recommended</span>}
                  <div className="p-6 border-b border-current/10">
                    <h3 className="text-2xl font-black tracking-tight">{p.name}</h3>
                    <p className={`text-sm ${p.recommended ? "text-[#888]" : "text-muted-foreground"}`}>{p.tagline}</p>
                    <p className="mt-5 text-4xl font-black tracking-tight">
                      {rate(p.rate)}
                      <span className="text-base font-semibold"> / sq ft</span>
                    </p>
                    <p className={`mt-2 text-xs ${p.recommended ? "text-[#888]" : "text-muted-foreground"}`}>
                      Minimum {inr(p.min)} · Maximum {inr(p.max)}
                    </p>
                    {belowMarket(p) > 0 && (
                      <p className={`mt-3 rounded-sm px-3 py-2 text-xs leading-relaxed ${p.recommended ? "bg-[#C8F135]/10 text-[#C8F135]" : "bg-[#C8F135]/15 text-[#3d5c00]"}`}>
                        <span className="font-mono font-bold uppercase tracking-wider">Starts {belowMarket(p)}% below market.</span> Typical market price from {inr(p.marketFrom)}.
                      </p>
                    )}
                  </div>
                  <ul className="p-6 flex-1 space-y-2.5">
                    {p.includes.map((t) => (
                      <li key={t} className="flex items-start gap-2.5 text-sm leading-snug">
                        {t.endsWith(":") ? (
                          <span className="font-semibold">{t}</span>
                        ) : (
                          <>
                            <Check size={14} className="mt-0.5 shrink-0 text-[#5a9e00]" /> {t}
                          </>
                        )}
                      </li>
                    ))}
                  </ul>
                  <p className={`px-6 pb-6 text-[11px] ${p.recommended ? "text-[#666]" : "text-muted-foreground"}`}>
                    {p.freeMonths} months of maintenance included, then {inr(p.monthly)}/month.
                  </p>
                </div>
              ))}
            </div>
            <p className="mt-4 text-[11px] text-muted-foreground leading-relaxed">
              Market prices are typical published figures in India in 2026: project websites ₹50,000 – ₹1,50,000; interactive plot-map platforms from about ₹1,00,000 per project per year; 3D masterplan visuals ₹45,000 – ₹95,000 per image.
            </p>
          </div>
        </section>

        {/* calculator */}
        <section className="border-b border-border bg-secondary/30" id="calculator">
          <div className="max-w-6xl mx-auto px-6 py-16 md:py-20">
            <SectionLabel>02 · Your price</SectionLabel>
            <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-8">
              <div className="space-y-6">
                <div>
                  <p className="text-sm font-semibold mb-2">Total project area</p>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min={0}
                      inputMode="decimal"
                      value={area}
                      onChange={(e) => setArea(e.target.value)}
                      className="w-full rounded-sm border border-border bg-background px-3 py-2.5 text-base tabular-nums focus:outline-none focus:border-[#0D0D0D]"
                      aria-label="Total project area"
                    />
                    <select value={unit} onChange={(e) => setUnit(e.target.value as AreaUnit)} className="rounded-sm border border-border bg-background px-3 py-2.5 text-sm" aria-label="Unit">
                      {AREA_UNITS.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    = {Math.round(sqft).toLocaleString("en-IN")} sq ft. The gross land area of the whole project, including plots, roads, parks, open spaces and common areas. Plot count does not change the price.
                  </p>
                </div>
                <div>
                  <p className="text-sm font-semibold mb-2">Plan</p>
                  <div className="grid grid-cols-3 gap-2">
                    {PLANS.map((p) => (
                      <button key={p.id} type="button" onClick={() => setPlanId(p.id)} className={`rounded-sm border px-3 py-3 text-left transition-colors ${p.id === planId ? "border-[#0D0D0D] bg-[#0D0D0D] text-[#F5F4F0]" : "border-border bg-background hover:border-foreground/30"}`}>
                        <p className="text-sm font-bold">{p.name}</p>
                        <p className={`text-xs ${p.id === planId ? "text-[#C8F135]" : "text-muted-foreground"}`}>{rate(p.rate)}/sq ft</p>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-semibold mb-2">Add-ons (optional)</p>
                  <div className="space-y-2">
                    {available.map((a) => {
                      const on = extras.includes(a.id);
                      return (
                        <label key={a.id} className={`flex items-center gap-3 rounded-sm border px-3 py-2.5 cursor-pointer ${on ? "border-[#0D0D0D] bg-background" : "border-border bg-background/60"}`}>
                          <input type="checkbox" checked={on} onChange={() => setExtras((x) => (on ? x.filter((i) => i !== a.id) : [...x, a.id]))} className="size-4 accent-[#0D0D0D]" />
                          <span className="flex-1 text-sm">{a.label}</span>
                          <span className="text-xs font-semibold tabular-nums">{a.perSqft ? inr(addOnPrice(a, sqft)) : `${inr(a.range!.from)}${a.range!.to ? ` – ${inr(a.range!.to)}` : "+"}`}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="rounded-sm bg-[#0D0D0D] text-[#F5F4F0] p-6 h-fit lg:sticky lg:top-20">
                <p className="font-mono text-[10px] text-[#C8F135] uppercase tracking-widest mb-4">Live estimate</p>
                <ul className="space-y-2.5 text-sm">
                  {lines.map((l) => (
                    <li key={l.label} className="flex justify-between gap-4">
                      <span className="text-[#aaa]">{l.label}</span>
                      <span className="tabular-nums font-semibold shrink-0">{inr(l.price)}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-5 pt-4 border-t border-[#222] flex items-end justify-between">
                  <span className="text-sm font-semibold">Total estimate</span>
                  <span className="text-3xl font-bold text-[#C8F135] tabular-nums">{inr(total)}</span>
                </div>
                <p className="mt-2 text-[11px] text-[#666]">
                  {TERMS.tax} Add-ons with a range are shown at their starting price. {plan.freeMonths} months of maintenance included, then {inr(plan.monthly)}/month.
                </p>
                <button type="button" onClick={() => (setErr(""), setAsking(true))} disabled={!(sqft > 0)} className="mt-5 w-full bg-[#C8F135] text-[#0D0D0D] py-3 text-sm font-bold rounded-sm hover:bg-[#b8e020] disabled:opacity-40 flex items-center justify-center gap-2">
                  <Download size={14} /> Get this quote as PDF
                </button>
                {sentNo && <p className="mt-2.5 text-center text-[11px] text-[#C8F135]">Quote {sentNo} is with us — we&apos;ll be in touch. Your PDF opened in a new tab.</p>}
              </div>
            </div>
          </div>
        </section>

        {/* comparison */}
        <section className="border-b border-border">
          <div className="max-w-6xl mx-auto px-6 py-16 md:py-20">
            <SectionLabel>03 · Service & feature comparison</SectionLabel>
            <div className="overflow-x-auto rounded-sm border border-border">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="bg-[#0D0D0D] text-[#F5F4F0]">
                    <th className="px-4 py-3 text-left font-semibold">Features / services</th>
                    {PLANS.map((p) => (
                      <th key={p.id} className={`px-4 py-3 text-center font-semibold ${p.recommended ? "text-[#C8F135]" : ""}`}>
                        {p.name}
                        <span className="block text-[10px] font-normal opacity-70">{rate(p.rate)}/sq ft</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {COMPARISON.map((row) => (
                    <tr key={row.feature}>
                      <td className="px-4 py-2.5">{row.feature}</td>
                      {row.values.map((v, i) => (
                        <td key={i} className="px-4 py-2.5 text-center">
                          <Cell v={v} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* add-ons + formula */}
        <section className="border-b border-border bg-secondary/30">
          <div className="max-w-6xl mx-auto px-6 py-16 md:py-20 grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div>
              <SectionLabel>04 · Add-on services</SectionLabel>
              <ul className="divide-y divide-border rounded-sm border border-border bg-background">
                {ADD_ONS.map((a) => (
                  <li key={a.id} className="flex items-start justify-between gap-4 px-4 py-3">
                    <span>
                      <span className="text-sm font-medium">{a.label}</span>
                      {a.note && <span className="block text-[11px] text-muted-foreground">{a.note}</span>}
                    </span>
                    <span className="shrink-0 text-right text-sm font-semibold tabular-nums">
                      {a.perSqft ? (
                        <>
                          {rate(a.perSqft.rate)}/sq ft
                          <span className="block text-[10px] font-normal text-muted-foreground">
                            {inr(a.perSqft.min)} – {inr(a.perSqft.max)}
                          </span>
                        </>
                      ) : (
                        `${inr(a.range!.from)}${a.range!.to ? ` – ${inr(a.range!.to)}` : "+"}`
                      )}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-muted-foreground">Add-ons are charged only when they are not already part of the chosen plan.</p>
            </div>
            <div>
              <SectionLabel>05 · Pricing formula</SectionLabel>
              <div className="rounded-sm border-2 border-[#0D0D0D] bg-background p-5">
                <p className="font-mono text-sm font-semibold leading-relaxed">
                  Project cost = Total area (sq ft) × Rate per sq ft,
                  <br />
                  never below the Minimum and never above the Maximum.
                </p>
              </div>
              <ul className="mt-5 space-y-2.5 text-sm text-muted-foreground">
                <li className="flex gap-2.5"><Check size={14} className="mt-0.5 shrink-0 text-[#5a9e00]" /> Area means the gross land area of the entire project (plots, roads, parks, open spaces and common areas).</li>
                <li className="flex gap-2.5"><Check size={14} className="mt-0.5 shrink-0 text-[#5a9e00]" /> Plot count does not change the area-based price.</li>
                <li className="flex gap-2.5"><Check size={14} className="mt-0.5 shrink-0 text-[#5a9e00]" /> Small projects pay the plan&apos;s minimum; large ones never pay more than its maximum.</li>
              </ul>
              <div className="mt-6 rounded-sm border border-border bg-background">
                <p className="px-4 py-2.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground border-b border-border">Package positioning</p>
                {PLANS.map((p) => (
                  <div key={p.id} className={`grid grid-cols-[110px_1fr] gap-3 px-4 py-2.5 text-sm ${p.recommended ? "bg-[#C8F135]/10" : ""}`}>
                    <span className="font-bold">{p.name}</span>
                    <span className="text-muted-foreground">{p.bestFor}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* terms */}
        <section className="border-b border-border">
          <div className="max-w-6xl mx-auto px-6 py-16 md:py-20">
            <SectionLabel>06 · Terms, ownership & timeline</SectionLabel>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-sm border border-border p-5">
                <h3 className="text-sm font-bold mb-3">Project terms</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li><strong className="text-foreground">Payment:</strong> {TERMS.payment}</li>
                  <li>{TERMS.revisions}</li>
                  <li>{TERMS.tax}</li>
                </ul>
              </div>
              <div className="rounded-sm border border-border p-5">
                <h3 className="text-sm font-bold mb-3">Infrastructure & ownership</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {TERMS.infrastructure.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-sm border border-border p-5">
                <h3 className="text-sm font-bold mb-3">Delivery & maintenance</h3>
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">Timeline:</strong> {TERMS.timeline}
                </p>
                <ul className="mt-3 space-y-1.5 text-sm">
                  {PLANS.map((p) => (
                    <li key={p.id} className="flex justify-between">
                      <span>{p.name}</span>
                      <span className="tabular-nums">
                        {p.freeMonths} months free, then {inr(p.monthly)}/mo
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-xs text-muted-foreground">{TERMS.maintenance}</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-[#0D0D0D]">
          <div className="max-w-6xl mx-auto px-6 py-16 md:py-20 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h2 className="text-4xl font-black text-[#F5F4F0] tracking-tight">Have a layout to launch?</h2>
              <p className="mt-3 text-sm text-[#666] max-w-lg">Send the layout drawing and the project&apos;s area. We reply with a written quote.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <a href="#calculator" className="inline-flex items-center gap-2 bg-[#C8F135] text-[#0D0D0D] px-6 py-3 text-sm font-bold rounded-sm hover:bg-[#b8e020]">
                Calculate your price <ArrowRight size={14} />
              </a>
              <Link to="/connect" className="inline-flex items-center gap-2 border border-[#2a2a2a] text-[#888] px-6 py-3 text-sm font-medium rounded-sm hover:text-[#bbb]">
                Talk to us <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </section>
      </div>

      {/* name and phone before the quote */}
      {asking && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 px-4" role="dialog" aria-modal="true" aria-labelledby="re-quote-title" onClick={() => !busy && setAsking(false)}>
          <form onClick={(e) => e.stopPropagation()} onSubmit={getQuote} className="w-full max-w-md rounded-sm border border-[#1e1e1e] bg-[#0D0D0D] p-6 sm:p-8" noValidate>
            <p className="font-mono text-[9px] text-[#C8F135] uppercase tracking-widest mb-2">Your quote · {inr(total)}</p>
            <h2 id="re-quote-title" className="text-xl font-semibold text-[#F5F4F0] mb-1">Where should we send it?</h2>
            <p className="text-xs text-[#888] mb-5">Your PDF opens right after. We keep a copy so we can talk it through with you.</p>
            <div className="flex flex-col gap-3">
              {(
                [
                  ["name", "Your name", "e.g. Rahul Sharma", "text", "name"],
                  ["phone", "Phone (WhatsApp)", "e.g. 98450 12345", "tel", "tel"],
                  ["email", "Email (optional)", "you@company.com", "email", "email"],
                  ["business", "Company (optional)", "Your company or brand", "text", "organization"],
                  ["project", "Project name (optional)", "e.g. Green Valley Layout", "text", "off"],
                ] as [keyof typeof f, string, string, string, string][]
              ).map(([k, label, ph, type, auto]) => (
                <label key={k} className="block">
                  <span className="font-mono text-[9px] text-[#aaa] uppercase tracking-widest block mb-1.5">{label}</span>
                  <input type={type} value={f[k]} onChange={(e) => setF((x) => ({ ...x, [k]: e.target.value }))} placeholder={ph} autoComplete={auto} className="w-full bg-[#0a0a0a] border border-[#1e1e1e] rounded-sm px-3 py-2.5 text-sm text-[#F5F4F0] placeholder:text-[#333] focus:outline-none focus:border-[#C8F135]/50" />
                </label>
              ))}
            </div>
            {err && <p className="mt-3 text-xs text-[#ff7a7a]">{err}</p>}
            <div className="mt-5 flex gap-2">
              <button type="button" onClick={() => setAsking(false)} disabled={busy} className="flex-1 border border-[#1e1e1e] text-[#888] hover:text-[#F5F4F0] py-3 text-sm rounded-sm">
                Cancel
              </button>
              <button type="submit" disabled={busy} className="flex-[2] bg-[#C8F135] text-[#0D0D0D] py-3 text-sm font-bold rounded-sm hover:bg-[#b8e020] flex items-center justify-center gap-2 disabled:opacity-60">
                <Download size={13} /> {busy ? "Saving your quote…" : "Get my quote"}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}

/** A printable quote in a new window (opened on the click, so it is never blocked as a pop-up). */
function openQuote(
  win: Window | null,
  q: { quoteNo: string; name: string; business: string; project: string; areaText: string; lines: { label: string; price: number }[]; total: number; plan: (typeof PLANS)[number] },
) {
  const w = win ?? window.open("", "_blank");
  if (!w) return;
  const today = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  const rows = q.lines.map((l) => `<tr><td>${esc(l.label)}</td><td class="r">${inr(l.price)}</td></tr>`).join("");
  w.document.write(`<!doctype html><html lang="en-IN"><head><meta charset="utf-8"><title>${esc(q.quoteNo)} — Real Estate Digital Platform</title>
<style>
@page{size:A4;margin:16mm}body{font-family:system-ui,-apple-system,"Segoe UI",sans-serif;color:#0d0d0d;margin:0}
.top{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #c8f135;padding-bottom:12px}
.top img{height:64px}.muted{color:#666;font-size:12px}h1{font-size:22px;margin:18px 0 4px}
table{width:100%;border-collapse:collapse;margin-top:16px;font-size:13px}td{padding:8px 6px;border-bottom:1px solid #e5e5e5}.r{text-align:right;white-space:nowrap}
.total td{font-weight:700;font-size:16px;border-bottom:none;border-top:2px solid #0d0d0d}
ul{font-size:12px;color:#444;line-height:1.6;padding-left:18px}
</style></head><body>
<div class="top"><img src="${location.origin}/brand/fm-logo-light.png" alt="FrameMind AI Studio"><div style="text-align:right"><b>${esc(q.quoteNo)}</b><div class="muted">${today}</div></div></div>
<h1>Real Estate Digital Platform — ${esc(q.plan.name)}</h1>
<div class="muted">Prepared for <b>${esc(q.name)}</b>${q.business ? `, ${esc(q.business)}` : ""}${q.project ? ` · Project: ${esc(q.project)}` : ""}<br>Project area: ${esc(q.areaText)}</div>
<table>${rows}<tr class="total"><td>Total estimate</td><td class="r">${inr(q.total)}</td></tr></table>
<ul>
<li>${esc(TERMS.tax)} Add-ons with a range are shown at their starting price.</li>
<li>Maintenance: ${q.plan.freeMonths} months included, then ${inr(q.plan.monthly)}/month. ${esc(TERMS.maintenance)}</li>
<li>Payment: ${esc(TERMS.payment)}</li>
<li>${esc(TERMS.revisions)}</li>
<li>Timeline: ${esc(TERMS.timeline)}</li>
${TERMS.infrastructure.map((t) => `<li>${esc(t)}</li>`).join("")}
<li>This is an estimate from the website. The final price is confirmed in a written quote.</li>
</ul>
<p class="muted">FrameMind AI Studio · Gadag, Karnataka · framemindaistudio.com</p>
<script>setTimeout(function(){window.print()},700)</script>
</body></html>`);
  w.document.close();
  w.focus();
}
