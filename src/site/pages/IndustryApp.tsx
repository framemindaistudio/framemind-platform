"use client";

import { useState } from "react";
import { ArrowRight, Building2, Check, Download, MonitorPlay, Plus } from "lucide-react";
import { Link } from "@/site/router";
import SEO from "@/site/components/SEO";
import { submitLead } from "@/site/leads";
import { INDUSTRY_ADD_ONS, TIERS, addOnPriceOf, priceIndustry, tierPrice, type Industry, type IndustryRates, type TierId } from "@/lib/content/industries";
import { INDUSTRY_ICONS } from "./Industries";

/*
 * One industry app: what it does, its roles, plans and add-ons, a price calculator and a quote that lands in HQ as a
 * lead (services ["industry", …studio services], config.industry). Words from src/lib/content/industries.ts; prices
 * from HQ → Rate Card → Industry apps (passed in as `rates`), and studio starting prices from the rate card.
 */

const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;
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

export interface StudioExtra {
  id: string;
  label: string;
  from: number;
}

export default function IndustryApp({ industry: ind, rates, studio }: { industry: Industry; rates?: IndustryRates | null; studio: StudioExtra[] }) {
  const [tier, setTier] = useState<TierId>("growth");
  const [billing, setBilling] = useState<"monthly" | "annual">("annual");
  const [branches, setBranches] = useState(1);
  const [extras, setExtras] = useState<string[]>([]);
  const [studioPicked, setStudioPicked] = useState<string[]>([]);
  const [asking, setAsking] = useState(false);
  const [f, setF] = useState({ name: "", phone: "", email: "", business: "", city: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [sentNo, setSentNo] = useState("");

  const Icon = INDUSTRY_ICONS[ind.icon] ?? Building2;
  const q = priceIndustry(rates, ind.id, tier, billing, branches, extras);
  const freeMonths = rates?.annualFreeMonths ?? 2;
  const branchPct = rates?.branchPercent ?? 50;
  const chosenStudio = studio.filter((s) => studioPicked.includes(s.id));
  // The old template demos were retired (Nov 2026); the new FrameMind apps replace them one by one.
  // Until an industry has a demoUrl again, its demo buttons say "coming soon" and lead to Book a demo.
  const demo = ind.demoUrl ?? null;

  async function getQuote(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (!f.name.trim()) return setErr("Please enter your name.");
    if (!/^[+\d][\d\s-]{7,15}$/.test(f.phone.trim())) return setErr("Please enter a valid phone number.");
    if (f.email.trim() && !/^\S+@\S+\.\S+$/.test(f.email.trim())) return setErr("Please enter a valid email, or leave it empty.");
    const quoteNo = newQuoteNo(new Date());
    const win = window.open("", "_blank");
    setBusy(true);
    const planText = `${q.tier.name} plan, ${billing === "annual" ? `paid yearly (${inr(q.recurring)} a year)` : `paid monthly (${inr(q.recurring)} a month)`}${q.branches > 1 ? `, ${q.branches} branches` : ""}`;
    const r = await submitLead({
      kind: "project",
      name: f.name.trim(),
      phone: f.phone.trim(),
      email: f.email.trim() || undefined,
      organisation: f.business.trim() || undefined,
      city: f.city.trim() || undefined,
      services: ["industry", ...chosenStudio.map((s) => s.id)],
      config: { industry: { industry: ind.id, tier, billing, branches: q.branches, addOns: q.addOns.map((a) => a.id) } },
      estimate: q.firstPayment,
      quoteNo,
      budget: `${inr(q.firstPayment)} first payment (website estimate)`,
      message: [
        `Quote ${quoteNo} downloaded from the website: ${ind.product}.`,
        `Plan: ${planText}.`,
        ...q.oneTimeItems.map((i) => `• ${i.label}: ${inr(i.price)}`),
        `First payment: ${inr(q.firstPayment)} + GST where applicable.`,
        chosenStudio.length ? `Also interested in: ${chosenStudio.map((s) => s.label).join(", ")}.` : "",
      ]
        .filter(Boolean)
        .join("\n"),
    });
    setBusy(false);
    if (!r.ok) {
      win?.close();
      return setErr(r.error);
    }
    openQuote(win, { quoteNo, name: f.name.trim(), business: f.business.trim(), ind, q, planText, studio: chosenStudio, freeMonths });
    setSentNo(quoteNo);
    setAsking(false);
  }

  return (
    <>
      <SEO title={`${ind.product} — ${ind.tagline.replace(/\.$/, "")}`} description={`${ind.product} for ${ind.who.toLowerCase()}: ${ind.features.map((x) => x.title.toLowerCase()).join(", ")}. With your name and logo, live in 3–4 weeks.`} path={`/industries/${ind.slug}`} ogImageAlt={`FrameMind AI Studio — ${ind.product}`} />
      <div className="min-h-screen">
        {/* hero */}
        <section className="bg-[#0D0D0D] relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(200,241,53,0.06),transparent_60%)]" />
          <div className="absolute top-0 inset-x-0 h-[2px] bg-[#C8F135]" />
          <div className="max-w-6xl mx-auto px-6 pt-14 md:pt-20 pb-14 relative z-10">
            <Link to="/industries" className="font-mono text-[10px] text-[#555] uppercase tracking-[0.2em] hover:text-[#888]">
              ← All industries
            </Link>
            <div className="mt-8 flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-sm bg-[#C8F135] text-[#0D0D0D]">
                <Icon size={20} />
              </span>
              <span className="font-mono text-[10px] text-[#888] uppercase tracking-[0.2em]">{ind.who}</span>
            </div>
            <h1 className="mt-6 text-5xl sm:text-6xl md:text-[72px] font-black text-[#F5F4F0] tracking-tight leading-[0.98]">{ind.product}</h1>
            <p className="mt-5 text-lg text-[#888] leading-relaxed max-w-2xl">{ind.tagline} With your name, logo and colours, live in 3–4 weeks.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              {demo ? (
                <a href={demo} target="_blank" rel="noopener" className="inline-flex items-center gap-2 bg-[#C8F135] text-[#0D0D0D] px-6 py-3 text-sm font-bold rounded-sm hover:bg-[#b8e020]">
                  <MonitorPlay size={15} /> Open live demo
                </a>
              ) : (
                <Link to="/connect" className="inline-flex items-center gap-2 bg-[#C8F135] text-[#0D0D0D] px-6 py-3 text-sm font-bold rounded-sm hover:bg-[#b8e020]">
                  <MonitorPlay size={15} /> New live demo coming soon — book a demo
                </Link>
              )}
              {ind.storyUrl ? (
                <a href={ind.storyUrl} target="_blank" rel="noopener" className="inline-flex items-center gap-2 border border-[#2a2a2a] text-[#ccc] px-6 py-3 text-sm font-medium rounded-sm hover:text-white">
                  See how we build yours <ArrowRight size={14} />
                </a>
              ) : null}
              <a href="#price" className="inline-flex items-center gap-2 border border-[#2a2a2a] text-[#ccc] px-6 py-3 text-sm font-medium rounded-sm hover:text-white">
                Get your price <ArrowRight size={14} />
              </a>
            </div>
            <p className="mt-3 text-[11px] text-[#555]">{demo ? `The ${ind.product} live demo opens in a new tab, with sample data — try every role.` : `We're building a new live demo of ${ind.product}. Book a demo and we'll walk you through it.`}</p>
          </div>
        </section>

        {/* one industry, two products: which one is this visitor's? */}
        {ind.chooser && ind.related && (
          <section className="border-b border-border bg-secondary/30">
            <div className="max-w-6xl mx-auto px-6 py-10">
              <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Which one are you?</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <a href="#price" className="rounded-sm border-2 border-[#0D0D0D] bg-background p-5">
                  <p className="text-lg font-bold">{ind.chooser.self.who}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {ind.product} — leads, site visits, follow-ups and brokerage. {ind.chooser.self.price}.
                  </p>
                  <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold">
                    This page: see your price <ArrowRight size={14} />
                  </span>
                </a>
                <Link to={ind.related.to} className="rounded-sm border border-border bg-background p-5 hover:border-foreground/40">
                  <p className="text-lg font-bold">{ind.chooser.other.who}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {ind.related.label} — project website, interactive plot map and 3D masterplan. {ind.chooser.other.price}.
                  </p>
                  <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold">
                    {ind.related.label} <ArrowRight size={14} />
                  </span>
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* what sells this app, in three cards */}
        {ind.pitch ? (
          <section className="border-b border-border bg-secondary/30">
            <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-1 md:grid-cols-3 gap-4">
              {ind.pitch.map((x) => (
                <div key={x.title} className="rounded-sm border-2 border-[#0D0D0D] bg-background p-5">
                  <p className="text-lg font-bold">{x.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{x.detail}</p>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {/* features */}
        <section className="border-b border-border">
          <div className="max-w-6xl mx-auto px-6 py-16 md:py-20">
            <SectionLabel>01 · What the app does</SectionLabel>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {ind.features.map((x) => (
                <div key={x.title} className="rounded-sm border border-border p-5">
                  <Check size={16} className="text-[#5a9e00]" />
                  <p className="mt-3 font-bold">{x.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{x.detail}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold mr-1">Everyone gets their own screens:</span>
              {ind.roles.map((r) => (
                <span key={r} className="rounded-full border border-border px-3 py-1 text-xs">
                  {r}
                </span>
              ))}
            </div>
            {ind.related && !ind.chooser && (
              <div className="mt-6 rounded-sm border border-border bg-secondary/40 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground">{ind.related.detail}</p>
                <Link to={ind.related.to} className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold">
                  {ind.related.label} <ArrowRight size={14} />
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* calculator */}
        <section className="border-b border-border bg-secondary/30" id="price">
          <div className="max-w-6xl mx-auto px-6 py-16 md:py-20">
            <SectionLabel>02 · Your price</SectionLabel>
            <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-8">
              <div className="space-y-6">
                <div>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold">Plan</p>
                    <div className="inline-flex rounded-sm border border-border bg-background p-0.5 text-xs font-semibold">
                      {(["annual", "monthly"] as const).map((b) => (
                        <button key={b} type="button" onClick={() => setBilling(b)} className={`rounded-sm px-3 py-1.5 ${billing === b ? "bg-[#0D0D0D] text-[#F5F4F0]" : "text-muted-foreground"}`}>
                          {b === "annual" ? `Yearly · ${freeMonths} months free` : "Monthly"}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {TIERS.map((t, i) => {
                      const on = t.id === tier;
                      const m = tierPrice(rates, ind.id, t.id);
                      const shown = billing === "annual" ? Math.round((m * (12 - freeMonths)) / 12) : m;
                      return (
                        <button key={t.id} type="button" onClick={() => setTier(t.id)} className={`rounded-sm border px-4 py-4 text-left transition-colors ${on ? "border-[#0D0D0D] bg-[#0D0D0D] text-[#F5F4F0]" : "border-border bg-background hover:border-foreground/30"}`}>
                          <p className="flex items-center justify-between text-sm font-bold">
                            {t.name}
                            {t.badge && <span className={`font-mono text-[8px] uppercase tracking-widest ${on ? "text-[#C8F135]" : "text-muted-foreground"}`}>{t.badge}</span>}
                          </p>
                          <p className="mt-1 text-2xl font-black">
                            {inr(shown)}
                            <span className={`text-xs font-medium ${on ? "text-[#888]" : "text-muted-foreground"}`}>/month</span>
                          </p>
                          <p className={`mt-1 text-xs ${on ? "text-[#C8F135]" : "text-muted-foreground"}`}>{ind.limits[i]}</p>
                        </button>
                      );
                    })}
                  </div>
                  <ul className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
                    {q.tier.includes.map((x) => (
                      <li key={x} className="flex gap-2 text-xs text-muted-foreground">
                        <Check size={12} className="mt-0.5 shrink-0 text-[#5a9e00]" /> {x}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-sm font-semibold mb-2">Branches</p>
                  <div className="flex items-center gap-3">
                    <div className="inline-flex items-center rounded-sm border border-border bg-background">
                      <button type="button" aria-label="Fewer branches" onClick={() => setBranches((b) => Math.max(1, b - 1))} className="px-3 py-2 text-lg leading-none">
                        −
                      </button>
                      <span className="w-10 text-center font-semibold tabular-nums">{branches}</span>
                      <button type="button" aria-label="More branches" onClick={() => setBranches((b) => Math.min(50, b + 1))} className="px-3 py-2 text-lg leading-none">
                        +
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground">Each extra branch adds {branchPct}% of the plan.</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-semibold mb-2">Add-ons (one-time)</p>
                  <div className="space-y-2">
                    {INDUSTRY_ADD_ONS.map((a) => {
                      const on = extras.includes(a.id);
                      return (
                        <label key={a.id} className={`flex items-start gap-3 rounded-sm border px-3 py-2.5 cursor-pointer ${on ? "border-[#0D0D0D] bg-background" : "border-border bg-background/60"}`}>
                          <input type="checkbox" checked={on} onChange={() => setExtras((x) => (on ? x.filter((i) => i !== a.id) : [...x, a.id]))} className="mt-0.5 size-4 accent-[#0D0D0D]" />
                          <span className="flex-1">
                            <span className="block text-sm">{a.label}</span>
                            <span className="block text-[11px] text-muted-foreground">{a.detail}</span>
                          </span>
                          <span className="text-xs font-semibold tabular-nums">{inr(addOnPriceOf(rates, a.id))}</span>
                        </label>
                      );
                    })}
                  </div>
                  {ind.onQuote.length > 0 && <p className="mt-2 text-[11px] text-muted-foreground">Also available, quoted after a call: {ind.onQuote.join(" · ")}.</p>}
                </div>
                {studio.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold mb-2">Grow it with the studio (optional)</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {studio.map((s) => {
                        const on = studioPicked.includes(s.id);
                        return (
                          <label key={s.id} className={`flex items-center gap-3 rounded-sm border px-3 py-2.5 cursor-pointer ${on ? "border-[#0D0D0D] bg-background" : "border-border bg-background/60"}`}>
                            <input type="checkbox" checked={on} onChange={() => setStudioPicked((x) => (on ? x.filter((i) => i !== s.id) : [...x, s.id]))} className="size-4 accent-[#0D0D0D]" />
                            <span className="flex-1 text-sm">{s.label}</span>
                            <span className="text-[11px] text-muted-foreground tabular-nums">{s.from ? `from ${inr(s.from)}` : "on quote"}</span>
                          </label>
                        );
                      })}
                    </div>
                    <p className="mt-2 text-[11px] text-muted-foreground">Studio services are priced in your written quote and are not in the total here.</p>
                  </div>
                )}
              </div>

              <div className="rounded-sm bg-[#0D0D0D] text-[#F5F4F0] p-6 h-fit lg:sticky lg:top-20">
                <p className="font-mono text-[10px] text-[#C8F135] uppercase tracking-widest mb-4">Live estimate</p>
                <ul className="space-y-2.5 text-sm">
                  {q.oneTimeItems.map((l) => (
                    <li key={l.label} className="flex justify-between gap-4">
                      <span className="text-[#aaa]">{l.group === "One-time" ? "Setup — your branding, data import, training, go-live" : l.label}</span>
                      <span className="tabular-nums font-semibold shrink-0">{inr(l.price)}</span>
                    </li>
                  ))}
                  <li className="flex justify-between gap-4">
                    <span className="text-[#aaa]">
                      {q.tier.name} plan{q.branches > 1 ? ` × ${q.branches} branches` : ""}, {billing === "annual" ? "first year" : "first month"}
                    </span>
                    <span className="tabular-nums font-semibold shrink-0">{inr(q.recurring)}</span>
                  </li>
                </ul>
                <div className="mt-5 pt-4 border-t border-[#222] flex items-end justify-between">
                  <span className="text-sm font-semibold">First payment</span>
                  <span className="text-3xl font-bold text-[#C8F135] tabular-nums">{inr(q.firstPayment)}</span>
                </div>
                <p className="mt-2 text-[11px] text-[#666]">
                  Then {billing === "annual" ? `${inr(q.recurring)} a year (${inr(q.perMonth)} a month)` : `${inr(q.recurring)} a month`}. Prices exclude GST where applicable.
                </p>
                <button type="button" onClick={() => (setErr(""), setAsking(true))} className="mt-5 w-full bg-[#C8F135] text-[#0D0D0D] py-3 text-sm font-bold rounded-sm hover:bg-[#b8e020] flex items-center justify-center gap-2">
                  <Download size={14} /> Get this quote as PDF
                </button>
                {demo ? (
                  <a href={demo} target="_blank" rel="noopener" className="mt-2 w-full border border-[#2a2a2a] text-[#ccc] py-3 text-sm font-medium rounded-sm hover:text-white flex items-center justify-center gap-2">
                    <MonitorPlay size={14} /> Try the live demo first
                  </a>
                ) : (
                  <Link to="/connect" className="mt-2 w-full border border-[#2a2a2a] text-[#ccc] py-3 text-sm font-medium rounded-sm hover:text-white flex items-center justify-center gap-2">
                    <MonitorPlay size={14} /> Live demo coming soon — book a demo
                  </Link>
                )}
                {sentNo && <p className="mt-2.5 text-center text-[11px] text-[#C8F135]">Quote {sentNo} is with us — we&apos;ll be in touch. Your PDF opened in a new tab.</p>}
              </div>
            </div>
            <p className="mt-6 text-[11px] text-muted-foreground leading-relaxed">{ind.market} Our plans include your own branding, setup help and support from a studio you can call.</p>
          </div>
        </section>

        {/* terms */}
        <section className="border-b border-border">
          <div className="max-w-6xl mx-auto px-6 py-16 md:py-20">
            <SectionLabel>03 · Good to know</SectionLabel>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              {[
                ["Live in 3–4 weeks", "We set up your app with your name, logo and colours, import your data and train your team. It goes live on your own web address."],
                ["Your data is yours", "Export it any time. If you stop the plan, we hand over your data in a standard format."],
                ["Change plans any time", "Move up a plan when you grow; add branches when you open them. Yearly plans renew once a year."],
              ].map(([t, d]) => (
                <div key={t} className="rounded-sm border border-border p-5">
                  <p className="font-bold">{t}</p>
                  <p className="mt-1.5 text-muted-foreground">{d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-[#0D0D0D]">
          <div className="max-w-6xl mx-auto px-6 py-16 md:py-20 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h2 className="text-4xl font-black text-[#F5F4F0] tracking-tight">See it working before you decide</h2>
              <p className="mt-3 text-sm text-[#666] max-w-lg">Book a 20-minute demo and we walk you through the app with your own business in mind.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link to="/connect" className="inline-flex items-center gap-2 bg-[#C8F135] text-[#0D0D0D] px-6 py-3 text-sm font-bold rounded-sm hover:bg-[#b8e020]">
                Book a demo <ArrowRight size={14} />
              </Link>
              <Link to="/industries" className="inline-flex items-center gap-2 border border-[#2a2a2a] text-[#888] px-6 py-3 text-sm font-medium rounded-sm hover:text-[#bbb]">
                <Plus size={14} /> Other industries
              </Link>
            </div>
          </div>
        </section>
      </div>

      {asking && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 px-4" role="dialog" aria-modal="true" aria-labelledby="ind-quote-title" onClick={() => !busy && setAsking(false)}>
          <form onClick={(e) => e.stopPropagation()} onSubmit={getQuote} className="w-full max-w-md rounded-sm border border-[#1e1e1e] bg-[#0D0D0D] p-6 sm:p-8" noValidate>
            <p className="font-mono text-[9px] text-[#C8F135] uppercase tracking-widest mb-2">
              Your quote · {inr(q.firstPayment)} first payment
            </p>
            <h2 id="ind-quote-title" className="text-xl font-semibold text-[#F5F4F0] mb-1">
              Where should we send it?
            </h2>
            <p className="text-xs text-[#888] mb-5">Your PDF opens right after. We keep a copy so we can talk it through with you.</p>
            <div className="flex flex-col gap-3">
              {(
                [
                  ["name", "Your name", "e.g. Dr. Priya Rao", "text", "name"],
                  ["phone", "Phone (WhatsApp)", "e.g. 98450 12345", "tel", "tel"],
                  ["email", "Email (optional)", "you@business.com", "email", "email"],
                  ["business", "Business name (optional)", "Your clinic, gym, PG…", "text", "organization"],
                  ["city", "City (optional)", "e.g. Hubballi", "text", "address-level2"],
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
function openQuote(win: Window | null, d: { quoteNo: string; name: string; business: string; ind: Industry; q: ReturnType<typeof priceIndustry>; planText: string; studio: StudioExtra[]; freeMonths: number }) {
  const w = win ?? window.open("", "_blank");
  if (!w) return;
  const { q } = d;
  const today = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  const rows = [
    ...q.oneTimeItems.map((l) => `<tr><td>${esc(l.label)}</td><td class="r">${inr(l.price)}</td></tr>`),
    `<tr><td>${esc(q.tier.name)} plan${q.branches > 1 ? ` × ${q.branches} branches` : ""} — ${d.q.billing === "annual" ? `first year (${d.freeMonths} months free)` : "first month"}</td><td class="r">${inr(q.recurring)}</td></tr>`,
  ].join("");
  w.document.write(`<!doctype html><html lang="en-IN"><head><meta charset="utf-8"><title>${esc(d.quoteNo)} — ${esc(d.ind.product)}</title>
<style>
@page{size:A4;margin:16mm}body{font-family:system-ui,-apple-system,"Segoe UI",sans-serif;color:#0d0d0d;margin:0}
.top{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #c8f135;padding-bottom:12px}
.top img{height:64px}.muted{color:#666;font-size:12px}h1{font-size:22px;margin:18px 0 4px}
table{width:100%;border-collapse:collapse;margin-top:16px;font-size:13px}td{padding:8px 6px;border-bottom:1px solid #e5e5e5}.r{text-align:right;white-space:nowrap}
.total td{font-weight:700;font-size:16px;border-bottom:none;border-top:2px solid #0d0d0d}
ul{font-size:12px;color:#444;line-height:1.6;padding-left:18px}
</style></head><body>
<div class="top"><img src="${location.origin}/brand/fm-logo-light.png" alt="FrameMind AI Studio"><div style="text-align:right"><b>${esc(d.quoteNo)}</b><div class="muted">${today}</div></div></div>
<h1>${esc(d.ind.product)} — ${esc(q.tier.name)} plan</h1>
<div class="muted">Prepared for <b>${esc(d.name)}</b>${d.business ? `, ${esc(d.business)}` : ""}<br>${esc(d.planText)}</div>
<table>${rows}<tr class="total"><td>First payment</td><td class="r">${inr(q.firstPayment)}</td></tr></table>
<ul>
<li>Then ${q.billing === "annual" ? `${inr(q.recurring)} a year (${inr(q.perMonth)} a month)` : `${inr(q.recurring)} a month`}. Prices exclude GST where applicable.</li>
<li>Plan includes: ${q.tier.includes.map(esc).join("; ")}.</li>
<li>Live in 3–4 weeks: your name, logo and colours, your data imported and your team trained.</li>
${d.studio.length ? `<li>Also interested in: ${d.studio.map((s) => esc(s.label)).join(", ")} — priced in your written quote.</li>` : ""}
<li>Your data is yours: export it any time, and it is handed over if you stop the plan.</li>
<li>This is an estimate from the website. The final price is confirmed in a written quote.</li>
</ul>
<p class="muted">FrameMind AI Studio · Gadag, Karnataka · framemindaistudio.com</p>
<script>setTimeout(function(){window.print()},700)</script>
</body></html>`);
  w.document.close();
}
