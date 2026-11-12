"use client";

import { ArrowRight, BedDouble, Building2, Car, Check, Dumbbell, FlaskConical, Gem, HardHat, Hospital, Hotel, Pill, School, Scissors, Smile, Stethoscope, Truck, UtensilsCrossed, type LucideIcon } from "lucide-react";
import { Link } from "@/site/router";
import SEO from "@/site/components/SEO";
import { INDUSTRIES, MORE_INDUSTRIES, TIERS, tierPrice, type IndustryRates } from "@/lib/content/industries";

/*
 * Industries: FrameMind's ready-made business apps, one per industry, ordered by where the money is (real estate
 * first). Words from src/lib/content/industries.ts; prices from HQ → Rate Card → Industry apps (passed in as `rates`).
 */

export const INDUSTRY_ICONS: Record<string, LucideIcon> = { Building2, Stethoscope, Smile, FlaskConical, UtensilsCrossed, Dumbbell, Scissors, BedDouble, HardHat, School, Hospital, Gem, Hotel, Truck, Car, Pill };

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
        title="Industry Apps — Ready-made Software for Clinics, Real Estate, Restaurants, Gyms & more"
        description="Ready-made apps for real estate, clinics, dental clinics, labs, restaurants, gyms, salons and PGs — with your name and logo, live in 3–4 weeks. A one-time setup and a simple monthly plan."
        path="/industries"
        keywords="clinic app India, real estate CRM India, restaurant QR menu app, gym management app, salon booking app, PG management app, lab software India, dental clinic software, FrameMind industry apps"
        ogImageAlt="FrameMind AI Studio — Industry Apps"
      />
      <div className="min-h-screen">
        {/* hero */}
        <section className="bg-[#0D0D0D] relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(200,241,53,0.06),transparent_60%)]" />
          <div className="absolute top-0 inset-x-0 h-[2px] bg-[#C8F135]" />
          <div className="max-w-6xl mx-auto px-6 pt-16 md:pt-24 pb-14 relative z-10">
            <div className="flex items-center gap-3 mb-8">
              <span className="w-2 h-2 rounded-full bg-[#C8F135] animate-pulse" />
              <span className="font-mono text-[10px] text-[#555] uppercase tracking-[0.2em]">Industry apps · Your name · Live in 3–4 weeks</span>
            </div>
            <h1 className="text-5xl sm:text-6xl md:text-[80px] font-black text-[#F5F4F0] tracking-tight leading-[0.98] mb-6">
              Your business,
              <br />
              <span className="text-[#C8F135]">already built.</span>
            </h1>
            <p className="text-lg text-[#888] leading-relaxed max-w-2xl mb-10">
              Ready-made apps for your industry — with your name, logo and colours — plus everything digital around them: website, brand, shoots and social media. Try the live demo, get your price, and go live in 3–4 weeks.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-[#1a1a1a] border border-[#1a1a1a] rounded-sm overflow-hidden">
              {[
                ["8 industries", "Ready to demo today"],
                [`${inr(setup)} setup`, "Once, then a monthly plan"],
                ["Your own brand", "Name, logo, colours, domain"],
                ["Live in 3–4 weeks", "With your data imported"],
              ].map(([t, d]) => (
                <div key={t} className="bg-[#0D0D0D] px-5 py-5">
                  <p className="text-sm font-bold text-[#F5F4F0]">{t}</p>
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
              {INDUSTRIES.map((ind, i) => {
                const Icon = INDUSTRY_ICONS[ind.icon] ?? Building2;
                const featured = i === 0;
                return (
                  <Link
                    key={ind.id}
                    to={`/industries/${ind.slug}`}
                    className={`group rounded-sm border p-6 flex flex-col transition-colors ${featured ? "border-[#C8F135] bg-[#0D0D0D] text-[#F5F4F0] sm:col-span-2 lg:col-span-1" : "border-border bg-background hover:border-foreground/40"}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`grid size-11 place-items-center rounded-sm ${featured ? "bg-[#C8F135] text-[#0D0D0D]" : "bg-secondary"}`}>
                        <Icon size={20} />
                      </span>
                      {featured && <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-[#C8F135]">Highest value</span>}
                    </div>
                    <h2 className="mt-5 text-2xl font-black tracking-tight">{ind.name}</h2>
                    <p className={`mt-1 text-sm ${featured ? "text-[#888]" : "text-muted-foreground"}`}>{ind.tagline}</p>
                    <p className="mt-5 text-sm">
                      From <span className="text-xl font-black">{inr(tierPrice(rates, ind.id, "starter"))}</span>
                      <span className={featured ? "text-[#888]" : "text-muted-foreground"}>/month {ind.unit}</span>
                    </p>
                    <span className={`mt-5 inline-flex items-center gap-1.5 text-sm font-semibold ${featured ? "text-[#C8F135]" : ""}`}>
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
            <SectionLabel>03 · One way to pay, every industry</SectionLabel>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {TIERS.map((t) => (
                <div key={t.id} className={`rounded-sm border p-6 ${t.badge ? "border-[#0D0D0D] border-2" : "border-border"}`}>
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-black">{t.name}</h3>
                    {t.badge && <span className="rounded-sm bg-[#C8F135] px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest text-[#0D0D0D]">{t.badge}</span>}
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
            <Link to="/connect" className="mt-6 inline-flex items-center gap-2 bg-[#0D0D0D] text-[#F5F4F0] px-5 py-3 text-sm font-bold rounded-sm">
              Talk to us about your industry <ArrowRight size={14} />
            </Link>
          </div>
        </section>

        {/* studio */}
        <section className="bg-[#0D0D0D]">
          <div className="max-w-6xl mx-auto px-6 py-16 md:py-20 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h2 className="text-4xl font-black text-[#F5F4F0] tracking-tight">Everything digital around your app</h2>
              <p className="mt-3 text-sm text-[#666] max-w-lg">Website, brand identity, photo and video shoots, social media and automations — from the same studio, on one bill.</p>
            </div>
            <Link to="/pricing" className="inline-flex items-center gap-2 bg-[#C8F135] text-[#0D0D0D] px-6 py-3 text-sm font-bold rounded-sm hover:bg-[#b8e020]">
              Studio services & prices <ArrowRight size={14} />
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
