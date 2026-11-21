"use client";

import { useState } from "react";
import { ArrowRight, Building2, Check, Download, MonitorPlay, Plus } from "lucide-react";
import { Link } from "@/site/router";
import SEO from "@/site/components/SEO";
import { submitLead } from "@/site/leads";
import { INDUSTRY_ADD_ONS, TIERS, addOnPriceOf, priceIndustry, tierPrice, type Industry, type IndustryRates, type TierId } from "@/lib/content/industries";
import { INDUSTRY_ICONS } from "./Industries";
import { brandOf, brandVars } from "@/lib/content/industry-brands";
import { BuyOptions, PlanCompare } from "@/site/components/IndustryPlans";

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
      <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--b-accent-ink)]">{children}</span>
      <span className="flex-1 h-px bg-[var(--b-primary)]/10" />
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

  // the app's own brand (logo + five colours from its kit) themes the whole page, in a light, premium look
  const b = brandOf(ind.id);
  const word = b.name.endsWith("OS") ? b.name.slice(0, -2) : b.name;
  const btnAccent = "inline-flex items-center gap-2 rounded-xl bg-[var(--b-accent)] text-[var(--b-on-accent)] px-6 py-3 text-sm font-bold shadow-[0_8px_24px_-10px_var(--b-accent)] transition hover:brightness-95";
  const btnGhost = "inline-flex items-center gap-2 rounded-xl border border-[var(--b-primary)]/15 bg-white px-6 py-3 text-sm font-semibold text-[var(--b-primary)] transition hover:border-[var(--b-accent)] hover:text-[var(--b-accent-ink)]";

  return (
    <>
      <SEO title={`${ind.product} — ${ind.tagline.replace(/\.$/, "")}`} description={`${ind.product} for ${ind.who.toLowerCase()}: ${ind.features.map((x) => x.title.toLowerCase()).join(", ")}. With your name and logo, live in 3–4 weeks.`} path={`/industries/${ind.slug}`} ogImageAlt={`FrameMind AI Studio — ${ind.product}`} />
      <div className="min-h-screen bg-[var(--b-bg)] text-[var(--b-primary)]" style={brandVars(b)}>
        {/* hero */}
        <section className="relative overflow-hidden border-b border-[var(--b-primary)]/10">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,var(--b-surface),transparent_62%)]" />
          <div className="absolute inset-0 opacity-50 [background-image:radial-gradient(var(--b-secondary)_1.2px,transparent_1.2px)] [background-size:22px_22px] [mask-image:linear-gradient(to_bottom,black,transparent_75%)]" />
          <div className="absolute top-0 inset-x-0 h-1 bg-[var(--b-accent)]" />
          <div className="max-w-6xl mx-auto px-6 pt-12 md:pt-16 pb-14 relative z-10 grid grid-cols-1 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] gap-10 lg:items-center">
            <div className="min-w-0">
              <Link to="/industries" className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--b-primary)]/55 hover:text-[var(--b-accent-ink)]">
                ← All industries
              </Link>
              <div className="mt-7 flex items-center gap-2.5">
                <span className="grid size-8 place-items-center rounded-lg bg-[var(--b-surface)] text-[var(--b-accent-ink)]">
                  <Icon size={16} />
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--b-primary)]/65">{ind.who}</span>
              </div>
              <h1 className="mt-5 text-5xl sm:text-6xl md:text-[76px] font-black tracking-tight leading-[0.95]">
                <span className="block text-base sm:text-lg font-semibold tracking-normal text-[var(--b-primary)]/60">FrameMind</span>
                {word}
                <span className="text-[var(--b-accent-ink)]">{b.name.endsWith("OS") ? "OS" : ""}</span>
              </h1>
              <p className="mt-5 text-lg leading-relaxed max-w-2xl text-[var(--b-primary)]/75">{ind.tagline} With your name, logo and colours, live in 3–4 weeks.</p>
              <div className="mt-8 flex flex-wrap gap-3">
                {demo ? (
                  <a href={demo} target="_blank" rel="noopener" className={btnAccent}>
                    <MonitorPlay size={15} /> Open live demo
                  </a>
                ) : (
                  <Link to="/connect" className={btnAccent}>
                    <MonitorPlay size={15} /> Live demo coming soon — book a demo
                  </Link>
                )}
                {ind.storyUrl ? (
                  <a href={ind.storyUrl} target="_blank" rel="noopener" className={btnGhost}>
                    See how we build yours <ArrowRight size={14} />
                  </a>
                ) : null}
                <a href="#price" className={btnGhost}>
                  Get your price <ArrowRight size={14} />
                </a>
              </div>
              <p className="mt-3 text-[11px] text-[var(--b-primary)]/55">{demo ? `The ${b.name} live demo opens in a new tab, with sample data — try every role.` : `We're building the live demo of ${b.name}. Book a demo and we'll walk you through it.`}</p>
            </div>
            {/* the app's identity card: its logo on its own surface, as on the brand guidelines cover */}
            <div className="relative hidden lg:block">
              <div className="absolute -inset-4 rounded-[2rem] bg-[var(--b-surface)]/70 blur-2xl" />
              <div className="relative rounded-[1.75rem] border border-[var(--b-primary)]/10 bg-white/90 p-8 shadow-[0_30px_60px_-30px_rgba(0,11,45,0.35)] backdrop-blur">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={b.logo} alt={`FrameMind ${b.name}`} className="w-full max-w-[340px]" />
                <p className="mt-6 text-lg font-semibold leading-snug">{b.tagline}</p>
                <div className="mt-6 flex gap-2" aria-hidden>
                  {[b.colors.primary, b.colors.accent, b.colors.secondary, b.colors.surface, b.colors.background].map((c) => (
                    <span key={c} className="h-6 flex-1 rounded-md border border-[var(--b-primary)]/10" style={{ background: c }} />
                  ))}
                </div>
                <p className="mt-3 font-mono text-[9px] uppercase tracking-[0.2em] text-[var(--b-primary)]/50">Powered by FrameMind AI Studio</p>
              </div>
            </div>
          </div>
        </section>

        {/* one industry, two products: which one is this visitor's? */}
        {ind.chooser && ind.related && (
          <section className="border-b border-[var(--b-primary)]/10">
            <div className="max-w-6xl mx-auto px-6 py-10">
              <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--b-primary)]/55">Which one are you?</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <a href="#price" className="rounded-2xl border-2 border-[var(--b-accent)] bg-white p-5">
                  <p className="text-lg font-bold">{ind.chooser.self.who}</p>
                  <p className="mt-1 text-sm text-[var(--b-primary)]/70">
                    {ind.product} — leads, site visits, follow-ups and brokerage. {ind.chooser.self.price}.
                  </p>
                  <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--b-accent-ink)]">
                    This page: see your price <ArrowRight size={14} />
                  </span>
                </a>
                <Link to={ind.related.to} className="rounded-2xl border border-[var(--b-primary)]/12 bg-white p-5 hover:border-[var(--b-accent)]">
                  <p className="text-lg font-bold">{ind.chooser.other.who}</p>
                  <p className="mt-1 text-sm text-[var(--b-primary)]/70">
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
          <section className="border-b border-[var(--b-primary)]/10 bg-white/60">
            <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-1 md:grid-cols-3 gap-4">
              {ind.pitch.map((x) => (
                <div key={x.title} className="relative overflow-hidden rounded-2xl border border-[var(--b-primary)]/10 bg-white p-6 shadow-[0_12px_30px_-22px_rgba(0,11,45,0.4)]">
                  <span className="absolute inset-x-0 top-0 h-1 bg-[var(--b-accent)]" />
                  <p className="text-lg font-bold">{x.title}</p>
                  <p className="mt-1.5 text-sm text-[var(--b-primary)]/70">{x.detail}</p>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {/* the bigger version we build (TradeOS: a city's own network) — the navy primary band, the kit's dark surface */}
        {ind.bigger ? (
          <section className="bg-[var(--b-primary)] text-white">
            <div className="max-w-6xl mx-auto px-6 py-12 md:py-14 grid grid-cols-1 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] gap-8 md:items-center">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--b-secondary)]">{ind.bigger.eyebrow}</p>
                <h2 className="mt-3 text-3xl md:text-4xl font-black tracking-tight">{ind.bigger.title}</h2>
                <p className="mt-3 text-sm md:text-base text-white/70 leading-relaxed max-w-xl">{ind.bigger.detail}</p>
              </div>
              <div>
                <ul className="grid gap-2.5">
                  {ind.bigger.points.map((p) => (
                    <li key={p} className="flex items-start gap-2.5 text-sm text-white/90">
                      <Check size={16} className="mt-0.5 shrink-0 text-[var(--b-secondary)]" /> {p}
                    </li>
                  ))}
                </ul>
                <a href="#price" className={`mt-6 ${btnAccent}`}>
                  {ind.bigger.cta} <ArrowRight size={14} />
                </a>
              </div>
            </div>
          </section>
        ) : null}

        {/* features */}
        <section className="border-b border-[var(--b-primary)]/10">
          <div className="max-w-6xl mx-auto px-6 py-16 md:py-20">
            <SectionLabel>01 · What the app does</SectionLabel>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {ind.features.map((x) => (
                <div key={x.title} className="rounded-2xl border border-[var(--b-primary)]/10 bg-white p-5">
                  <span className="grid size-8 place-items-center rounded-lg bg-[var(--b-surface)] text-[var(--b-accent-ink)]">
                    <Check size={16} />
                  </span>
                  <p className="mt-3 font-bold">{x.title}</p>
                  <p className="mt-1 text-sm text-[var(--b-primary)]/70">{x.detail}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold mr-1">Everyone gets their own screens:</span>
              {ind.roles.map((r) => (
                <span key={r} className="rounded-full bg-[var(--b-surface)] px-3 py-1 text-xs font-medium text-[var(--b-primary)]">
                  {r}
                </span>
              ))}
            </div>
            {ind.related && !ind.chooser && (
              <div className="mt-6 rounded-2xl border border-[var(--b-primary)]/10 bg-white p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <p className="text-sm text-[var(--b-primary)]/70">{ind.related.detail}</p>
                <Link to={ind.related.to} className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-[var(--b-accent-ink)]">
                  {ind.related.label} <ArrowRight size={14} />
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* calculator */}
        <section className="border-b border-[var(--b-primary)]/10 bg-white/60" id="price">
          <div className="max-w-6xl mx-auto px-6 py-16 md:py-20">
            <SectionLabel>02 · Your price</SectionLabel>
            <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-8">
              <div className="space-y-6">
                <div>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold">Plan</p>
                    <div className="inline-flex rounded-xl border border-[var(--b-primary)]/12 bg-white p-0.5 text-xs font-semibold">
                      {(["annual", "monthly"] as const).map((bl) => (
                        <button key={bl} type="button" onClick={() => setBilling(bl)} className={`rounded-lg px-3 py-1.5 ${billing === bl ? "bg-[var(--b-primary)] text-white" : "text-[var(--b-primary)]/60"}`}>
                          {bl === "annual" ? `Yearly · ${freeMonths} months free` : "Monthly"}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-2">
                    {TIERS.map((t, i) => {
                      const on = t.id === tier;
                      const m = tierPrice(rates, ind.id, t.id);
                      const shown = billing === "annual" ? Math.round((m * (12 - freeMonths)) / 12) : m;
                      return (
                        <button key={t.id} type="button" onClick={() => setTier(t.id)} className={`flex min-w-0 flex-col rounded-2xl border px-3.5 py-3.5 text-left transition-colors ${on ? "border-[var(--b-primary)] bg-[var(--b-primary)] text-white" : "border-[var(--b-primary)]/12 bg-white hover:border-[var(--b-accent)]"}`}>
                          <span className="text-sm font-bold leading-tight">{t.name}</span>
                          <span className={`mt-1 h-3.5 font-mono text-[8px] font-bold uppercase leading-[14px] tracking-widest ${on ? "text-[var(--b-secondary)]" : "text-[var(--b-accent-ink)]"}`}>{t.badge ?? ""}</span>
                          <span className="mt-2 text-xl font-black leading-none tabular-nums">{inr(shown)}</span>
                          <span className={`mt-1 text-[11px] font-medium ${on ? "text-white/60" : "text-[var(--b-primary)]/55"}`}>a month{billing === "annual" ? ", billed yearly" : ""}</span>
                          <span className={`mt-2 border-t pt-2 text-[11px] leading-snug ${on ? "border-white/15 text-[var(--b-secondary)]" : "border-[var(--b-primary)]/10 text-[var(--b-primary)]/65"}`}>{ind.limits[i]}</span>
                        </button>
                      );
                    })}
                  </div>
                  <ul className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
                    {q.tier.includes.map((x) => (
                      <li key={x} className="flex gap-2 text-xs text-[var(--b-primary)]/70">
                        <Check size={12} className="mt-0.5 shrink-0 text-[var(--b-accent-ink)]" /> {x}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-sm font-semibold mb-2">Branches</p>
                  <div className="flex items-center gap-3">
                    <div className="inline-flex items-center rounded-xl border border-[var(--b-primary)]/12 bg-white">
                      <button type="button" aria-label="Fewer branches" onClick={() => setBranches((x) => Math.max(1, x - 1))} className="px-3 py-2 text-lg leading-none">
                        −
                      </button>
                      <span className="w-10 text-center font-semibold tabular-nums">{branches}</span>
                      <button type="button" aria-label="More branches" onClick={() => setBranches((x) => Math.min(50, x + 1))} className="px-3 py-2 text-lg leading-none">
                        +
                      </button>
                    </div>
                    <p className="text-xs text-[var(--b-primary)]/60">Each extra branch adds {branchPct}% of the plan.</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-semibold mb-2">Add-ons (one-time)</p>
                  <div className="space-y-2">
                    {INDUSTRY_ADD_ONS.map((a) => {
                      const on = extras.includes(a.id);
                      return (
                        <label key={a.id} className={`flex items-start gap-3 rounded-xl border px-3 py-2.5 cursor-pointer bg-white ${on ? "border-[var(--b-accent)]" : "border-[var(--b-primary)]/12"}`}>
                          <input type="checkbox" checked={on} onChange={() => setExtras((x) => (on ? x.filter((i) => i !== a.id) : [...x, a.id]))} className="mt-0.5 size-4 accent-[var(--b-accent-ink)]" />
                          <span className="flex-1">
                            <span className="block text-sm">{a.label}</span>
                            <span className="block text-[11px] text-[var(--b-primary)]/60">{a.detail}</span>
                          </span>
                          <span className="text-xs font-semibold tabular-nums">{inr(addOnPriceOf(rates, a.id))}</span>
                        </label>
                      );
                    })}
                  </div>
                  {ind.onQuote.length > 0 && <p className="mt-2 text-[11px] text-[var(--b-primary)]/60">Also available, quoted after a call: {ind.onQuote.join(" · ")}.</p>}
                </div>
                {studio.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold mb-2">Grow it with the studio (optional)</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {studio.map((s) => {
                        const on = studioPicked.includes(s.id);
                        return (
                          <label key={s.id} className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 cursor-pointer bg-white ${on ? "border-[var(--b-accent)]" : "border-[var(--b-primary)]/12"}`}>
                            <input type="checkbox" checked={on} onChange={() => setStudioPicked((x) => (on ? x.filter((i) => i !== s.id) : [...x, s.id]))} className="size-4 accent-[var(--b-accent-ink)]" />
                            <span className="flex-1 text-sm">{s.label}</span>
                            <span className="text-[11px] text-[var(--b-primary)]/60 tabular-nums">{s.from ? `from ${inr(s.from)}` : "on quote"}</span>
                          </label>
                        );
                      })}
                    </div>
                    <p className="mt-2 text-[11px] text-[var(--b-primary)]/60">Studio services are priced in your written quote and are not in the total here.</p>
                  </div>
                )}
              </div>

              <div className="rounded-3xl bg-[var(--b-primary)] text-white p-6 h-fit lg:sticky lg:top-20 shadow-[0_30px_60px_-30px_rgba(0,11,45,0.6)]">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-[var(--b-secondary)]">Live estimate</p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={b.logoReverse} alt="" className="h-6 w-auto opacity-90" />
                </div>
                <ul className="mt-4 space-y-2.5 text-sm">
                  {q.oneTimeItems.map((l) => (
                    <li key={l.label} className="flex justify-between gap-4">
                      <span className="text-white/65">{l.group === "One-time" ? "Setup — your branding, data import, training, go-live" : l.label}</span>
                      <span className="tabular-nums font-semibold shrink-0">{inr(l.price)}</span>
                    </li>
                  ))}
                  <li className="flex justify-between gap-4">
                    <span className="text-white/65">
                      {q.tier.name} plan{q.branches > 1 ? ` × ${q.branches} branches` : ""}, {billing === "annual" ? "first year" : "first month"}
                    </span>
                    <span className="tabular-nums font-semibold shrink-0">{inr(q.recurring)}</span>
                  </li>
                </ul>
                <div className="mt-5 pt-4 border-t border-white/15 flex items-end justify-between">
                  <span className="text-sm font-semibold">First payment</span>
                  <span className="text-3xl font-bold text-[var(--b-secondary)] tabular-nums">{inr(q.firstPayment)}</span>
                </div>
                <p className="mt-2 text-[11px] text-white/50">
                  Then {billing === "annual" ? `${inr(q.recurring)} a year (${inr(q.perMonth)} a month)` : `${inr(q.recurring)} a month`}. Prices exclude GST where applicable.
                </p>
                <button type="button" onClick={() => (setErr(""), setAsking(true))} className={`mt-5 w-full justify-center ${btnAccent}`}>
                  <Download size={14} /> Get this quote as PDF
                </button>
                {demo ? (
                  <a href={demo} target="_blank" rel="noopener" className="mt-2 w-full rounded-xl border border-white/20 text-white/85 py-3 text-sm font-medium hover:text-white flex items-center justify-center gap-2">
                    <MonitorPlay size={14} /> Try the live demo first
                  </a>
                ) : (
                  <Link to="/connect" className="mt-2 w-full rounded-xl border border-white/20 text-white/85 py-3 text-sm font-medium hover:text-white flex items-center justify-center gap-2">
                    <MonitorPlay size={14} /> Live demo coming soon — book a demo
                  </Link>
                )}
                {sentNo && <p className="mt-2.5 text-center text-[11px] text-[var(--b-secondary)]">Quote {sentNo} is with us — we&apos;ll be in touch. Your PDF opened in a new tab.</p>}
              </div>
            </div>
            <p className="mt-6 text-[11px] text-[var(--b-primary)]/60 leading-relaxed">{ind.market} Our plans include your own branding, setup help and support from a studio you can call.</p>
          </div>
        </section>

        {/* every plan side by side, then the two ways to buy */}
        <section className="border-b border-[var(--b-primary)]/10">
          <div className="max-w-6xl mx-auto px-6 py-16 md:py-20">
            <SectionLabel>03 · Compare the plans</SectionLabel>
            <PlanCompare ind={ind} rates={rates} freeMonths={freeMonths} />
          </div>
        </section>
        <section className="border-b border-[var(--b-primary)]/10 bg-white/60">
          <div className="max-w-6xl mx-auto px-6 py-16 md:py-20">
            <SectionLabel>04 · Two ways to buy</SectionLabel>
            <BuyOptions setup={q.setup} />
          </div>
        </section>

        {/* terms */}
        <section className="border-b border-[var(--b-primary)]/10">
          <div className="max-w-6xl mx-auto px-6 py-16 md:py-20">
            <SectionLabel>05 · Good to know</SectionLabel>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              {[
                ["Live in 3–4 weeks", "We set up your app with your name, logo and colours, import your data and train your team. It goes live on your own web address."],
                ["Your data is yours", "Export it any time. If you stop the plan, we hand over your data in a standard format."],
                ["Change plans any time", "Move up a plan when you grow; add branches when you open them. Yearly plans renew once a year."],
              ].map(([t, d]) => (
                <div key={t} className="rounded-2xl border border-[var(--b-primary)]/10 bg-white p-5">
                  <p className="font-bold">{t}</p>
                  <p className="mt-1.5 text-[var(--b-primary)]/70">{d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-[var(--b-surface)]">
          <div className="max-w-6xl mx-auto px-6 py-16 md:py-20 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={b.logo} alt={`FrameMind ${b.name}`} className="h-9 w-auto" />
              <h2 className="mt-5 text-4xl font-black tracking-tight">See it working before you decide</h2>
              <p className="mt-3 text-sm text-[var(--b-primary)]/70 max-w-lg">Book a 20-minute demo and we walk you through the app with your own business in mind.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link to="/connect" className={btnAccent}>
                Book a demo <ArrowRight size={14} />
              </Link>
              <Link to="/industries" className={btnGhost}>
                <Plus size={14} /> Other industries
              </Link>
            </div>
          </div>
        </section>
      </div>

      {asking && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#000B2D]/60 backdrop-blur-sm px-4" role="dialog" aria-modal="true" aria-labelledby="ind-quote-title" onClick={() => !busy && setAsking(false)} style={brandVars(b)}>
          <form onClick={(e) => e.stopPropagation()} onSubmit={getQuote} className="w-full max-w-md rounded-3xl border border-[var(--b-primary)]/10 bg-white p-6 sm:p-8 text-[var(--b-primary)] shadow-2xl" noValidate>
            <div className="flex items-center justify-between gap-3 mb-3">
              <p className="font-mono text-[9px] uppercase tracking-widest text-[var(--b-accent-ink)]">Your quote · {inr(q.firstPayment)} first payment</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={b.icon} alt="" className="size-7" />
            </div>
            <h2 id="ind-quote-title" className="text-xl font-semibold mb-1">
              Where should we send it?
            </h2>
            <p className="text-xs text-[var(--b-primary)]/60 mb-5">Your PDF opens right after. We keep a copy so we can talk it through with you.</p>
            <div className="flex flex-col gap-3">
              {(
                [
                  ["name", "Your name", "e.g. Dr. Priya Rao", "text", "name"],
                  ["phone", "Phone (WhatsApp)", "Your 10-digit mobile", "tel", "tel"],
                  ["email", "Email (optional)", "you@business.com", "email", "email"],
                  ["business", "Business name (optional)", "Your clinic, gym, PG…", "text", "organization"],
                  ["city", "City (optional)", "e.g. Hubballi", "text", "address-level2"],
                ] as [keyof typeof f, string, string, string, string][]
              ).map(([k, label, ph, type, auto]) => (
                <label key={k} className="block">
                  <span className="font-mono text-[9px] uppercase tracking-widest block mb-1.5 text-[var(--b-primary)]/60">{label}</span>
                  <input type={type} value={f[k]} onChange={(e) => setF((x) => ({ ...x, [k]: e.target.value }))} placeholder={ph} autoComplete={auto} className="w-full rounded-xl bg-[var(--b-bg)] border border-[var(--b-primary)]/12 px-3 py-2.5 text-sm placeholder:text-[var(--b-primary)]/35 focus:outline-none focus:border-[var(--b-accent)]" />
                </label>
              ))}
            </div>
            {err && <p className="mt-3 text-xs text-[#C0262D]">{err}</p>}
            <div className="mt-5 flex gap-2">
              <button type="button" onClick={() => setAsking(false)} disabled={busy} className="flex-1 rounded-xl border border-[var(--b-primary)]/15 py-3 text-sm text-[var(--b-primary)]/70 hover:text-[var(--b-primary)]">
                Cancel
              </button>
              <button type="submit" disabled={busy} className={`flex-[2] justify-center ${btnAccent} disabled:opacity-60`}>
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
@page{size:A4;margin:16mm}body{font-family:system-ui,-apple-system,"Segoe UI",sans-serif;color:#171716;margin:0}
.top{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #c8f135;padding-bottom:12px}
.top img{height:64px}.muted{color:#666;font-size:12px}h1{font-size:22px;margin:18px 0 4px}
table{width:100%;border-collapse:collapse;margin-top:16px;font-size:13px}td{padding:8px 6px;border-bottom:1px solid #e5e5e5}.r{text-align:right;white-space:nowrap}
.total td{font-weight:700;font-size:16px;border-bottom:none;border-top:2px solid #171716}
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
