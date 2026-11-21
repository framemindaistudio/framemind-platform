"use client";

import { ArrowRight, BedDouble, Building2, Car, Check, Dumbbell, FlaskConical, Gem, GraduationCap, HardHat, Hospital, Hotel, Pill, School, Scissors, Smile, Stethoscope, Truck, UtensilsCrossed, type LucideIcon } from "lucide-react";
import { BuyOptions } from "@/site/components/IndustryPlans";
import { brandOf, brandVars } from "@/lib/content/industry-brands";
import { Link } from "@/site/router";
import SEO from "@/site/components/SEO";
import { INDUSTRIES, MORE_INDUSTRIES, TIERS, tierPrice, type IndustryRates } from "@/lib/content/industries";

/*
 * Industries: FrameMind's ready-made business apps, one per industry, ordered by where the money is (real estate
 * first). Words from src/lib/content/industries.ts; prices from HQ → Rate Card → Industry apps (passed in as `rates`).
 */

export const INDUSTRY_ICONS: Record<string, LucideIcon> = { Building2, Stethoscope, Smile, FlaskConical, UtensilsCrossed, Dumbbell, Scissors, BedDouble, GraduationCap, HardHat, School, Hospital, Gem, Hotel, Truck, Car, Pill };

const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-8">
      <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.2em]">{children}</span>
      <span className="flex-1 h-px bg-border" />
    </div>
  );
}

export default function Industries({ rates }: { rates?: IndustryRates | null }) {
  const setup = rates?.setup ?? 14999;
  return (
    <>
      <SEO
        title="Industry Apps — Ready-made Software for Distributors, Real Estate, Clinics, Restaurants & more"
        description="Ready-made apps for distributors and wholesalers, real estate, clinics, dental clinics, labs, restaurants, gyms, salons and PGs — with your name and logo, live in 3–4 weeks. A one-time setup and a simple monthly plan."
        path="/industries"
        keywords="clinic app India, real estate CRM India, restaurant QR menu app, gym management app, salon booking app, PG management app, lab software India, dental clinic software, FrameMind industry apps"
        ogImageAlt="FrameMind AI Studio — Industry Apps"
      />
      <div className="min-h-screen">
        {/* hero */}
        <section className="bg-[#171716] relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(200,241,53,0.06),transparent_60%)]" />
          <div className="absolute top-0 inset-x-0 h-[2px] bg-[#C8F135]" />
          <div className="max-w-6xl mx-auto px-6 pt-16 md:pt-24 pb-14 relative z-10">
            <div className="flex items-center gap-3 mb-8">
              <span className="w-2 h-2 rounded-full bg-[#C8F135] animate-pulse" />
              <span className="font-mono text-[10px] text-[#555] uppercase tracking-[0.2em]">Industry apps · Your name · Live in 3–4 weeks</span>
            </div>
            <h1 className="text-5xl sm:text-6xl md:text-[80px] font-black text-[#eceae4] tracking-tight leading-[0.98] mb-6">
              Your business,
              <br />
              <span className="text-[#C8F135]">already built.</span>
            </h1>
            <p className="text-lg text-[#888] leading-relaxed max-w-2xl mb-10">
              Ready-made apps for your industry — with your name, logo and colours — plus everything digital around them: website, brand, shoots and social media. Try the live demo, get your price, and go live in 3–4 weeks.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-[#1f1f1d] border border-[#1f1f1d] rounded-sm overflow-hidden">
              {[
                [`${INDUSTRIES.length} industries`, "Ready to demo today"],
                [`From ${inr(setup)} setup`, "Once, then a monthly plan"],
                ["Your own brand", "Name, logo, colours, domain"],
                ["Live in 3–4 weeks", "With your data imported"],
              ].map(([t, d]) => (
                <div key={t} className="bg-[#171716] px-5 py-5">
                  <p className="text-sm font-bold text-[#eceae4]">{t}</p>
                  <p className="text-[11px] text-[#555] mt-1">{d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* the apps */}
        <section className="border-b border-border">
          <div className="max-w-6xl mx-auto px-6 py-16 md:py-20">
            <SectionLabel>01 · Pick your industry</SectionLabel>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {INDUSTRIES.map((ind) => {
                // each card wears its own app's brand: logo, accent bar and surface from its kit
                const b = brandOf(ind.id);
                return (
                  <Link
                    key={ind.id}
                    to={`/industries/${ind.slug}`}
                    style={brandVars(b)}
                    className="group relative overflow-hidden rounded-2xl border border-[var(--b-primary)]/10 bg-white p-6 flex flex-col text-[var(--b-primary)] shadow-[0_12px_30px_-24px_rgba(0,11,45,0.45)] transition hover:-translate-y-0.5 hover:border-[var(--b-accent)] hover:shadow-[0_22px_40px_-24px_rgba(0,11,45,0.5)]"
                  >
                    <span className="absolute inset-x-0 top-0 h-1 bg-[var(--b-accent)]" />
                    <div className="relative flex items-center justify-between gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={b.logo} alt={`FrameMind ${b.name}`} className="h-9 w-auto" />
                      {ind.demoUrl ? (
                        <span className="shrink-0 rounded-full bg-[var(--b-surface)] px-2.5 py-1 font-mono text-[9px] font-bold uppercase tracking-widest text-[var(--b-accent-ink)]">Live demo</span>
                      ) : (
                        <span className="shrink-0 font-mono text-[9px] font-bold uppercase tracking-widest text-[var(--b-primary)]/45">Demo soon</span>
                      )}
                    </div>
                    <h2 className="relative mt-5 text-2xl font-black tracking-tight">{ind.name}</h2>
                    <p className="relative mt-1 text-sm text-[var(--b-primary)]/70">{ind.tagline}</p>
                    <p className="relative mt-5 text-sm">
                      From <span className="text-xl font-black">{inr(tierPrice(rates, ind.id, "starter"))}</span>
                      <span className="text-[var(--b-primary)]/60">/month {ind.unit}</span>
                    </p>
                    <span className="relative mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--b-accent-ink)]">
                      See the app & your price <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </Link>
                );
              })}
            </div>
            <div className="mt-4 rounded-sm border border-border bg-secondary/40 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <p className="text-sm">
                <span className="font-bold">Developing a layout, villa project or township?</span>{" "}
                <span className="text-muted-foreground">The Real Estate Digital Platform is priced per sq ft of the project, with an interactive plot map.</span>
              </p>
              <Link to="/real-estate" className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold">
                Real Estate Platform <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </section>

        {/* how it works */}
        <section className="border-b border-border bg-secondary/30">
          <div className="max-w-6xl mx-auto px-6 py-16 md:py-20">
            <SectionLabel>02 · How it works</SectionLabel>
            <ol className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                ["Try the demo", "Open the live demo of your industry's app and click through every role."],
                ["Get your price", "Pick a plan, branches and add-ons, and download your quote."],
                ["We set it up", "Your name, logo and colours, your data imported, and a training session."],
                ["Go live", "In 3–4 weeks, on your own web address, with support every month."],
              ].map(([t, d], i) => (
                <li key={t} className="rounded-sm border border-border bg-background p-5">
                  <span className="font-mono text-[10px] text-muted-foreground">0{i + 1}</span>
                  <p className="mt-2 font-bold">{t}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{d}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* plans */}
        <section className="border-b border-border">
          <div className="max-w-6xl mx-auto px-6 py-16 md:py-20">
            <SectionLabel>03 · Five plans in every industry</SectionLabel>
            <p className="mb-6 max-w-2xl text-sm text-muted-foreground">Prices and limits are set per industry, from what software for that industry costs in India today. Each industry's page has its own prices, limits and overage rates.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {TIERS.map((t) => (
                <div key={t.id} className={`rounded-sm border p-5 ${t.badge ? "border-[#171716] border-2" : "border-border"}`}>
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-black">{t.name}</h3>
                    {t.badge && <span className="rounded-sm bg-[#C8F135] px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest text-[#171716]">{t.badge}</span>}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{t.summary}</p>
                  <ul className="mt-4 space-y-2">
                    {t.includes.map((x) => (
                      <li key={x} className="flex gap-2 text-sm">
                        <Check size={14} className="mt-0.5 shrink-0 text-[#5a9e00]" /> {x}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              A one-time setup of {inr(setup)} covers your branding, data import, training and go-live. Pay yearly and get {rates?.annualFreeMonths ?? 2} months free. Prices exclude GST where applicable.
            </p>
            <div className="mt-10">
              <BuyOptions setup={setup} />
            </div>
          </div>
        </section>

        {/* more industries */}
        <section className="border-b border-border bg-secondary/30">
          <div className="max-w-6xl mx-auto px-6 py-16 md:py-20">
            <SectionLabel>04 · More industries — built to order</SectionLabel>
            <p className="mb-6 max-w-2xl text-sm text-muted-foreground">No ready app for your industry yet? We build it on the same foundation, so it costs far less than software from scratch. Tell us what you need and we quote after a short call.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {MORE_INDUSTRIES.map((m) => {
                const Icon = INDUSTRY_ICONS[m.icon] ?? Building2;
                return (
                  <div key={m.name} className="rounded-sm border border-border bg-background p-4">
                    <Icon size={18} className="text-muted-foreground" />
                    <p className="mt-3 text-sm font-bold">{m.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{m.examples}</p>
                  </div>
                );
              })}
            </div>
            <Link to="/connect" className="mt-6 inline-flex items-center gap-2 bg-[#171716] text-[#eceae4] px-5 py-3 text-sm font-bold rounded-sm">
              Talk to us about your industry <ArrowRight size={14} />
            </Link>
          </div>
        </section>

        {/* studio */}
        <section className="bg-[#171716]">
          <div className="max-w-6xl mx-auto px-6 py-16 md:py-20 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h2 className="text-4xl font-black text-[#eceae4] tracking-tight">Everything digital around your app</h2>
              <p className="mt-3 text-sm text-[#666] max-w-lg">Website, brand identity, photo and video shoots, social media and automations — from the same studio, on one bill.</p>
            </div>
            <Link to="/pricing" className="inline-flex items-center gap-2 bg-[#C8F135] text-[#171716] px-6 py-3 text-sm font-bold rounded-sm hover:bg-[#b8e020]">
              Studio services & prices <ArrowRight size={14} />
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
