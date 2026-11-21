"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { ArrowUpRight, Bot, Brain, Check, Code2, Globe, LayoutGrid, Palette, Zap } from "lucide-react";
import { Link } from "@/site/router";
import SEO from "@/site/components/SEO";
import { INDUSTRIES, tierPrice, type IndustryRates } from "@/lib/content/industries";
import { brandOf } from "@/lib/content/industry-brands";
import { ProductCard } from "@/site/components/shop/ShopBits";
import type { PublicProduct } from "@/lib/shop/types";
import { ArrowLink, Kicker, Marked, MaskLines, PillLink, Rise, ScrollWords } from "@/site/components/ui/motion-bits";
import TeamRail, { type RailMember } from "@/site/components/TeamRail";

/*
 * The home page (Nov 2026 redesign). Matte graphite and warm stone with a paper grain, one lime accent, smooth scroll.
 * References: 13g.fr (pill nav, huge quiet type, statements that light up word by word, colour panels),
 * royalbev.com (a giant wordmark with an object dropped into it, sections that rise over each other) and the
 * founder's saved 21st.dev components (Unlimited Design hero pills, Orbiting Circles spotlight, How It Works,
 * Collapsing Cards accordion, Team Lanyard Rail, Light Beam footer).
 *
 *   1. hero: what we build, in one line, with the four things as pills
 *   2. the giant FrameMind wordmark with the logo dropping into it, then the one-team statement
 *   3. a marquee of services
 *   4. services as an orbit: the one in the spotlight explains itself
 *   5. the ten industry apps on a 3D ring
 *   6. the store, with its three real advantages marked
 *   7. how a project runs
 *   8. our ventures as collapsing cards
 *   9. the team on a lanyard rail
 *  10. a lime panel to start a project
 */

const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;
const EASE = [0.16, 1, 0.3, 1] as const;

/* ─────────────────────────── 1. hero ─────────────────────────── */

const WHAT = [
  { icon: Globe, label: "Websites", to: "/pricing" },
  { icon: LayoutGrid, label: "Industry apps", to: "/industries" },
  { icon: Code2, label: "Software", to: "/pricing" },
  { icon: Bot, label: "AI automation", to: "/pricing" },
];

function Hero() {
  const reduce = useReducedMotion();
  return (
    <section className="fm-dark relative flex min-h-[100dvh] flex-col overflow-hidden" aria-label="FrameMind AI Studio">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_55%_at_80%_10%,rgba(217,163,91,0.10),transparent_70%),radial-gradient(50%_45%_at_0%_100%,rgba(200,241,53,0.06),transparent_70%)]" />

      <div className="relative mx-auto flex w-full max-w-[1320px] flex-1 flex-col justify-end px-5 pb-10 pt-32 sm:px-8 md:pb-14">
        <motion.div initial={reduce ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: EASE, delay: 0.1 }}>
          <Kicker>Design · Software · AI studio, India</Kicker>
        </motion.div>

        <MaskLines
          as="h1"
          className="mt-6 text-[clamp(2.7rem,8.6vw,8.6rem)] font-normal leading-[0.94] tracking-[-0.055em]"
          lines={[
            <>We build the</>,
            <>
              <span className="text-[#9a9890]">websites, apps</span> &amp; AI
            </>,
            <>
              your business <span className="fm-mark text-[#171716]">runs on.</span>
            </>,
          ]}
          delay={0.15}
        />

        <div className="mt-10 grid gap-8 md:mt-14 md:grid-cols-[1fr_auto] md:items-end">
          <Rise delay={0.55} y={16}>
            <p className="max-w-md text-[17px] leading-relaxed text-[#bcbab2]">
              One studio designs it, builds it, launches it and looks after it. Ready-made apps for ten industries, or something built only for you.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {WHAT.map(({ icon: Icon, label, to }) => (
                <Link key={label} to={to} className="group inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.03] py-1.5 pl-1.5 pr-4 text-[13px] text-[#e3e1da] transition-colors hover:border-[var(--fm-lime)]/50">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#2a2a27] text-[var(--fm-lime)] transition-transform duration-500 group-hover:rotate-12">
                    <Icon size={14} />
                  </span>
                  {label}
                </Link>
              ))}
            </div>
          </Rise>
          <Rise delay={0.7} y={16} className="flex flex-col items-start gap-4 md:items-end">
            <PillLink to="/connect">Start a project</PillLink>
            <ArrowLink to="/industries" className="text-[#d6d4cd]">
              Try an industry app demo
            </ArrowLink>
          </Rise>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────── 2. wordmark + statement ─────────────────────────── */

function Wordmark() {
  const box = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: box, offset: ["start end", "end start"] });
  const drop = useTransform(scrollYProgress, [0, 0.55], reduce ? ["0%", "0%"] : ["-70%", "0%"]);
  const spin = useTransform(scrollYProgress, [0, 0.55, 1], reduce ? [0, 0, 0] : [-28, 0, 10]);
  const scale = useTransform(scrollYProgress, [0, 0.55], reduce ? [1, 1] : [0.7, 1]);
  const slideL = useTransform(scrollYProgress, [0, 1], reduce ? ["0%", "0%"] : ["4%", "-6%"]);

  return (
    <section ref={box} className="fm-dark relative overflow-hidden pb-20 md:pb-32">
      <div className="relative flex items-center justify-center pt-6 md:pt-10">
        <motion.p aria-hidden="true" style={{ x: slideL }} className="select-none whitespace-nowrap text-[23vw] font-medium leading-[0.85] tracking-[-0.07em] text-[#eceae4]">
          FrameMind
        </motion.p>
        <motion.img
          src="/brand/kit/preview/framemind-icon-4k.webp"
          alt="The FrameMind mark: a camera shutter opening into a mind"
          width={900}
          height={900}
          style={{ y: drop, rotate: spin, scale }}
          className="absolute left-1/2 top-1/2 w-[30vw] max-w-[420px] -translate-x-1/2 -translate-y-[46%] drop-shadow-[0_40px_60px_rgba(0,0,0,0.55)]"
        />
      </div>

      <div className="mx-auto mt-16 grid max-w-[1320px] gap-10 px-5 sm:px-8 md:mt-24 md:grid-cols-[0.8fr_2fr]">
        <Kicker className="text-[#d6d4cd]">Why one studio</Kicker>
        <div>
          <ScrollWords
            className="text-[clamp(1.7rem,3.6vw,3.3rem)] leading-[1.12] tracking-[-0.03em]"
            text="Most businesses juggle a designer, a developer, an app company and someone for social media. We are all of them in one team, so nothing falls between people and you get one honest price."
          />
          <div className="mt-10 flex flex-wrap gap-x-10 gap-y-4 font-mono text-[11px] uppercase tracking-[0.18em] text-[#9a9890]">
            <span>
              <b className="mr-2 text-2xl font-normal tracking-normal text-[#eceae4]">10</b>ready-made industry apps
            </span>
            <span>
              <b className="mr-2 text-2xl font-normal tracking-normal text-[#eceae4]">₹</b>prices on the website
            </span>
            <span>
              <b className="mr-2 text-2xl font-normal tracking-normal text-[#eceae4]">1</b>team from brief to support
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────── 3. marquee ─────────────────────────── */

const MARQUEE = ["Websites", "Brand systems", "Industry apps", "Custom software", "AI automations", "1:1 AI coaching", "Digital store"];

function Marquee() {
  const row = [...MARQUEE, ...MARQUEE];
  return (
    <div className="relative z-10 -my-6 overflow-hidden py-6" aria-hidden="true">
      <div className="-rotate-2 scale-105 bg-[var(--fm-lime)] py-4 text-[#171716] shadow-[0_20px_40px_-20px_rgba(0,0,0,0.5)]">
        <div className="flex w-max animate-[fm-marquee_38s_linear_infinite] motion-reduce:animate-none">
          {row.map((w, i) => (
            <span key={i} className="flex items-center gap-8 px-4 text-[clamp(1.5rem,3.2vw,2.6rem)] font-medium tracking-[-0.03em]">
              {w}
              <span className="h-3 w-3 rounded-full bg-[#171716]" />
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────── 4. services: orbiting spotlight ─────────────────────────── */

const SERVICES = [
  {
    icon: Globe,
    title: "Websites",
    outcome: "Your business looks credible before you say a word.",
    bullets: ["Designed from scratch, no templates", "Fast, found on Google, built to get enquiries", "Handed over with training and support"],
    price: "From ₹25,000",
    to: "/pricing",
  },
  {
    icon: Palette,
    title: "Brand systems",
    outcome: "Your brand works without you having to explain it.",
    bullets: ["Logo, colour and type as one system", "Guidelines your team actually uses", "The same look on every touchpoint"],
    price: "From ₹15,000",
    to: "/pricing",
  },
  {
    icon: LayoutGrid,
    title: "Industry apps",
    outcome: "Your industry's app, already built, with your name on it.",
    bullets: ["Ten ready-made apps with live demos", "Live in 3 to 4 weeks", "One-time setup, then a simple monthly plan"],
    price: "Monthly plans",
    to: "/industries",
  },
  {
    icon: Code2,
    title: "Custom software",
    outcome: "A tool built exactly for how your business works.",
    bullets: ["Scoped to what you need, nothing extra", "Clean code and real documentation", "Internal tools to customer platforms"],
    price: "Custom quote",
    to: "/pricing",
  },
  {
    icon: Zap,
    title: "Automations",
    outcome: "Hours back every week, without hiring anyone.",
    bullets: ["We map the manual work and automate it", "WhatsApp flows, CRM sync, invoices, follow-ups", "Built on the tools that fit you"],
    price: "From ₹12,000",
    to: "/pricing",
  },
  {
    icon: Brain,
    title: "1:1 AI coaching",
    outcome: "AI fluency built around your work, one coach, every session.",
    bullets: ["A plan built for your profession", "Online or in person, ages 10 to 60", "Not a course: a coach"],
    price: "Ask us",
    to: "/personal-coaching",
  },
];

function Services() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduce = useReducedMotion();
  const n = SERVICES.length;

  useEffect(() => {
    if (paused || reduce) return;
    const id = setInterval(() => setActive((a) => (a + 1) % n), 4200);
    return () => clearInterval(id);
  }, [paused, reduce, n]);

  const svc = SERVICES[active]!;
  const Icon = svc.icon;

  return (
    <section className="relative overflow-hidden pb-24 pt-28 md:pb-32 md:pt-40">
      <div className="mx-auto max-w-[1320px] px-5 sm:px-8">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <Kicker>What we do</Kicker>
            <MaskLines className="mt-5 text-[clamp(2.4rem,5.6vw,5.2rem)] font-normal leading-[0.98] tracking-[-0.045em]" lines={["Everything your business", <>needs, <span className="text-[#64635d]">under one roof.</span></>]} />
          </div>
          <ArrowLink to="/pricing">All services and prices</ArrowLink>
        </div>

        <div className="mt-14 grid items-center gap-10 lg:mt-20 lg:grid-cols-[1.1fr_1fr]" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
          {/* the orbit */}
          <div className="relative mx-auto aspect-square w-full max-w-[540px]">
            <div className="absolute inset-[6%] rounded-full border border-[#1b1b19]/12" />
            <div className="absolute inset-[24%] rounded-full border border-dashed border-[#1b1b19]/15" />
            <motion.div className="absolute inset-0" animate={reduce ? undefined : { rotate: 360 }} transition={{ duration: 90, ease: "linear", repeat: Infinity }} style={{ rotate: 0 }}>
              {SERVICES.map((s, i) => {
                const a = (i / n) * Math.PI * 2 - Math.PI / 2;
                const SIcon = s.icon;
                const on = i === active;
                return (
                  <div key={s.title} className="absolute" style={{ left: `${50 + 44 * Math.cos(a)}%`, top: `${50 + 44 * Math.sin(a)}%`, transform: "translate(-50%,-50%)" }}>
                    <motion.button
                      type="button"
                      onClick={() => setActive(i)}
                      aria-pressed={on}
                      aria-label={s.title}
                      animate={reduce ? undefined : { rotate: -360 }}
                      transition={{ duration: 90, ease: "linear", repeat: Infinity }}
                      className={`flex h-14 w-14 items-center justify-center rounded-full border transition-[background-color,box-shadow,color,border-color] duration-500 sm:h-16 sm:w-16 ${
                        on ? "border-transparent bg-[#171716] text-[var(--fm-lime)] shadow-[0_0_0_6px_rgba(200,241,53,0.35),0_18px_30px_-10px_rgba(0,0,0,0.45)]" : "border-[#1b1b19]/15 bg-[#f3f2ee] text-[#1b1b19] hover:border-[#1b1b19]/40"
                      }`}
                    >
                      <SIcon size={22} />
                    </motion.button>
                  </div>
                );
              })}
            </motion.div>
            {/* centre panel */}
            <div className="absolute inset-[27%] flex flex-col items-center justify-center rounded-full bg-[#171716] text-center text-[#eceae4] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06),0_30px_60px_-25px_rgba(0,0,0,0.6)]">
              <AnimatePresence mode="wait">
                <motion.div key={active} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.4, ease: EASE }} className="px-4">
                  <Icon size={22} className="mx-auto text-[var(--fm-lime)]" />
                  <p className="mt-2 text-[clamp(1.1rem,2.4vw,1.6rem)] leading-tight tracking-[-0.02em]">{svc.title}</p>
                  <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.16em] text-[#9a9890]">
                    {String(active + 1).padStart(2, "0")} / {String(n).padStart(2, "0")}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* the detail of the one in the spotlight */}
          <div className="min-h-[300px]">
            <AnimatePresence mode="wait">
              <motion.div key={active} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.5, ease: EASE }}>
                <p className="text-[clamp(1.7rem,3vw,2.6rem)] leading-[1.1] tracking-[-0.03em]">{svc.outcome}</p>
                <ul className="mt-7 space-y-3 border-t border-[#1b1b19]/12 pt-6">
                  {svc.bullets.map((b) => (
                    <li key={b} className="flex gap-3 text-[15px] text-[#3f3e3a]">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#171716] text-[var(--fm-lime)]">
                        <Check size={12} />
                      </span>
                      {b}
                    </li>
                  ))}
                </ul>
                <div className="mt-8 flex flex-wrap items-center gap-5">
                  <PillLink to={svc.to} tone="ink">
                    {svc.price}
                  </PillLink>
                  <div className="flex gap-1.5" role="tablist" aria-label="Services">
                    {SERVICES.map((s, i) => (
                      <button
                        key={s.title}
                        type="button"
                        role="tab"
                        aria-selected={i === active}
                        aria-label={s.title}
                        onClick={() => setActive(i)}
                        className={`h-1.5 rounded-full transition-all duration-500 ${i === active ? "w-8 bg-[#171716]" : "w-3 bg-[#1b1b19]/20"}`}
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────── 5. industry apps: an index and a brand card ─────────────────────────── */

type Ind = (typeof INDUSTRIES)[number];

/** One app, in its own brand colour: the reverse logo, its promise, its price and the live demo. */
function BrandCard({ ind, rates, big }: { ind: Ind; rates?: IndustryRates | null; big?: boolean }) {
  const b = brandOf(ind.id);
  const bg = `linear-gradient(155deg, color-mix(in oklab, ${b.colors.accent} 88%, black) 0%, color-mix(in oklab, ${b.colors.accent} 42%, #111) 100%)`;
  return (
    <div className={`relative flex h-full flex-col overflow-hidden text-white ${big ? "rounded-[32px] p-8 md:p-10" : "rounded-[26px] p-6"}`} style={{ background: bg }}>
      {/* the app's icon, huge and cropped, as a watermark */}
      <img src={b.icon} alt="" aria-hidden="true" className={`pointer-events-none absolute opacity-[0.13] mix-blend-luminosity ${big ? "-bottom-16 -right-16 w-[62%]" : "-bottom-10 -right-10 w-[60%]"}`} />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(80%_60%_at_10%_0%,rgba(255,255,255,0.18),transparent_60%)]" />
      <img src={b.logoReverse} alt={`FrameMind ${b.name}`} className={`relative w-auto self-start ${big ? "h-11" : "h-8"}`} />
      <p className={`relative font-mono uppercase tracking-[0.2em] text-white/70 ${big ? "mt-auto pt-16 text-[11px]" : "mt-auto pt-10 text-[10px]"}`}>{ind.name}</p>
      <p className={`relative mt-3 leading-[1.05] tracking-[-0.035em] ${big ? "text-[clamp(1.9rem,3vw,2.8rem)]" : "text-[1.45rem]"}`}>{ind.tagline}</p>
      <div className={`relative flex flex-wrap items-center justify-between gap-4 border-t border-white/20 ${big ? "mt-8 pt-6" : "mt-6 pt-4"}`}>
        <p className="text-[15px] text-white/85">
          From <b className="text-[1.25em] font-medium text-white">{inr(tierPrice(rates, ind.id, "starter"))}</b>/month
        </p>
        <div className="flex gap-2">
          {ind.demoUrl && (
            <a href={ind.demoUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-[13px] font-medium text-[#171716] transition-transform hover:-translate-y-0.5">
              Live demo <ArrowUpRight size={14} />
            </a>
          )}
          <Link to={`/industries/${ind.slug}`} className="inline-flex items-center rounded-full border border-white/35 px-4 py-2 text-[13px] transition-colors hover:bg-white/10">
            Plans
          </Link>
        </div>
      </div>
    </div>
  );
}

function IndustryIndex({ rates }: { rates?: IndustryRates | null }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduce = useReducedMotion();
  const n = INDUSTRIES.length;

  useEffect(() => {
    if (paused || reduce) return;
    const id = setInterval(() => setActive((a) => (a + 1) % n), 3600);
    return () => clearInterval(id);
  }, [paused, reduce, n]);

  const ind = INDUSTRIES[active]!;
  return (
    <section className="fm-dark relative overflow-hidden rounded-t-[36px] md:rounded-t-[56px]">
      <div className="relative mx-auto max-w-[1320px] px-5 pb-24 pt-24 sm:px-8 md:pb-32 md:pt-32">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <Kicker className="text-[#d6d4cd]">Industry apps</Kicker>
            <MaskLines className="mt-5 text-[clamp(2.4rem,5.6vw,5.2rem)] font-normal leading-[0.98] tracking-[-0.045em]" lines={["Your industry's app,", <span key="a" className="text-[var(--fm-lime)]">already built.</span>]} />
          </div>
          <p className="max-w-sm text-[16px] leading-relaxed text-[#bcbab2]">
            {n} ready-made apps with your name and logo, live in 3 to 4 weeks. Open any demo and click around before you talk to us.
          </p>
        </div>

        {/* wide screens: the index on the left, the brand card on the right */}
        <div className="mt-16 hidden gap-12 lg:grid lg:grid-cols-[1fr_1.05fr]" onMouseLeave={() => setPaused(false)}>
          <ol className="border-t border-white/10">
            {INDUSTRIES.map((x, i) => {
              const on = i === active;
              const b = brandOf(x.id);
              return (
                <li key={x.id} className="border-b border-white/10">
                  <Link
                    to={`/industries/${x.slug}`}
                    onMouseEnter={() => {
                      setActive(i);
                      setPaused(true);
                    }}
                    onFocus={() => setActive(i)}
                    className="group flex items-center gap-5 py-3.5"
                  >
                    <span className="w-6 font-mono text-[11px] text-[#7d7b74]">{String(i + 1).padStart(2, "0")}</span>
                    <span className={`flex-1 text-[clamp(1.4rem,2.2vw,2rem)] leading-none tracking-[-0.035em] transition-[color,transform] duration-500 ease-[cubic-bezier(.16,1,.3,1)] ${on ? "translate-x-2 text-[#eceae4]" : "text-[#5f5e58]"}`}>{x.name}</span>
                    <span className="flex items-center gap-2 font-mono text-[11px] text-[#9a9890]">
                      <span className="h-2 w-2 rounded-full transition-transform duration-500" style={{ background: b.colors.accent, transform: on ? "scale(1.6)" : "scale(1)" }} />
                      {b.name}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ol>
          <div className="sticky top-28 h-[520px] self-start">
            <AnimatePresence mode="wait">
              <motion.div key={ind.id} className="h-full" initial={{ opacity: 0, y: 24, rotate: -1.5 }} animate={{ opacity: 1, y: 0, rotate: 0 }} exit={{ opacity: 0, y: -16, rotate: 1 }} transition={{ duration: 0.55, ease: EASE }}>
                <BrandCard ind={ind} rates={rates} big />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* phones and tablets: swipe through the brand cards */}
        <div className="-mx-5 mt-12 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-2 sm:-mx-8 sm:px-8 lg:hidden [scrollbar-width:none]" data-lenis-prevent-wheel>
          {INDUSTRIES.map((x) => (
            <div key={x.id} className="h-[400px] w-[82%] max-w-[340px] shrink-0 snap-start">
              <BrandCard ind={x} rates={rates} />
            </div>
          ))}
        </div>

        <div className="mt-12">
          <PillLink to="/industries" tone="chalk">
            See all {n} apps and prices
          </PillLink>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────── 6. the store ─────────────────────────── */

function Store({ products }: { products: PublicProduct[] }) {
  if (!products.length) return null;
  return (
    <section className="relative -mt-10 rounded-t-[36px] bg-[var(--fm-stone)] md:-mt-14 md:rounded-t-[56px]">
      <div className="mx-auto max-w-[1320px] px-5 pb-24 pt-24 sm:px-8 md:pb-32 md:pt-32">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <Kicker>FrameMind Store</Kicker>
            <h2 className="mt-5 max-w-3xl text-[clamp(2.4rem,5.6vw,5.2rem)] font-normal leading-[1.02] tracking-[-0.045em]">
              Tools that <Marked mark="circle">save you hours,</Marked> not more PDFs.
            </h2>
            <div className="mt-7 flex flex-wrap gap-2 text-[14px]">
              <span className="rounded-full bg-[#171716] px-4 py-2 text-[#eceae4]">
                <b className="font-medium text-[var(--fm-lime)]">Apps that work offline</b> in most packs
              </span>
              <span className="rounded-full border border-[#1b1b19]/15 px-4 py-2">Made in India, priced in ₹</span>
              <span className="rounded-full border border-[#1b1b19]/15 px-4 py-2">Instant download</span>
            </div>
          </div>
          <PillLink to="/shop" tone="ink">
            Visit the store
          </PillLink>
        </div>
        <div className="mt-14 grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4 lg:gap-x-6">
          {products.map((p, i) => (
            <Rise key={p.id} delay={i * 0.06}>
              <ProductCard product={p} />
            </Rise>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────── 7. how a project runs ─────────────────────────── */

const STEPS = [
  { n: "01", title: "Tell us what you're building", desc: "A 20-minute call about what you need and whether we're the right fit. No sales script.", tag: "Day 1" },
  { n: "02", title: "We scope it honestly", desc: "A clear scope, timeline and price in writing. No vague retainers, no hidden costs.", tag: "Within days" },
  { n: "03", title: "We build, you stay in the loop", desc: "Regular updates and a client portal, so you see real progress instead of chasing it.", tag: "Weekly updates" },
  { n: "04", title: "Shipped. Then supported.", desc: "Handover, training and support after launch, so the work actually gets used.", tag: "After launch" },
];

function Process() {
  const box = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: box, offset: ["start 70%", "end 60%"] });
  const fill = useTransform(scrollYProgress, [0, 1], [0, 1]);
  return (
    <section className="fm-dark rounded-t-[36px] md:rounded-t-[56px]">
      <div className="mx-auto grid max-w-[1320px] gap-12 px-5 py-24 sm:px-8 md:grid-cols-[0.9fr_1.1fr] md:py-32">
        <div className="md:sticky md:top-32 md:self-start">
          <Kicker className="text-[#d6d4cd]">How it works</Kicker>
          <MaskLines className="mt-5 text-[clamp(2.4rem,5vw,4.6rem)] font-normal leading-[0.98] tracking-[-0.045em]" lines={["From first message", <span key="b" className="text-[#9a9890]">to final delivery.</span>]} />
          <div className="mt-8">
            <PillLink to="/connect">Book the 20-minute call</PillLink>
          </div>
        </div>

        <div ref={box} className="relative">
          <div className="absolute bottom-6 left-[22px] top-6 w-px bg-white/10" />
          <motion.div style={{ scaleY: fill }} className="absolute bottom-6 left-[22px] top-6 w-px origin-top bg-[var(--fm-lime)]" />
          <ol className="flex flex-col gap-5">
            {STEPS.map((s, i) => (
              <Rise key={s.n} delay={i * 0.05}>
                <li className="relative flex gap-5">
                  <span className="relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/15 bg-[#171716] font-mono text-[12px] text-[var(--fm-lime)]">{s.n}</span>
                  <div className="flex-1 rounded-[22px] border border-white/8 bg-[#1f1f1d] p-6 transition-colors hover:border-white/20 md:p-7">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="text-xl font-normal tracking-[-0.02em] md:text-2xl">{s.title}</h3>
                      <span className="rounded-full bg-[#2a2a27] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-[#9a9890]">{s.tag}</span>
                    </div>
                    <p className="mt-3 text-[15px] leading-relaxed text-[#aaa8a0]">{s.desc}</p>
                  </div>
                </li>
              </Rise>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────── 8. ventures: collapsing cards ─────────────────────────── */

const VENTURES = [
  { to: "/360vue", name: "360VUE", what: "360° virtual tours, SkyVUE aerial 360° and Google Maps listings.", accent: "#d9a35b" },
  { to: "/vritta", name: "Vritta", what: "Activity records and newsletters for schools and colleges.", accent: "#9fb7ff" },
  { to: "/jove", name: "JOVE", what: "Robotics and AI workshops for schools, Grades 1 to 10.", accent: "#8fd6b4" },
  { to: "/personal-coaching", name: "Coaching", what: "1:1 AI coaching built around your profession.", accent: "#c8f135" },
];

function Ventures() {
  const [open, setOpen] = useState(0);
  return (
    <section className="bg-[var(--fm-stone)]">
      <div className="mx-auto max-w-[1320px] px-5 py-24 sm:px-8 md:py-32">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <Kicker>The FrameMind family</Kicker>
            <MaskLines className="mt-5 text-[clamp(2.4rem,5vw,4.6rem)] font-normal leading-[0.98] tracking-[-0.045em]" lines={["One studio,", <span key="c" className="text-[#64635d]">a family of ventures.</span>]} />
          </div>
        </div>

        <div className="mt-12 flex h-[460px] flex-col gap-2 md:h-[440px] md:flex-row">
          {VENTURES.map((v, i) => {
            const on = open === i;
            return (
              <motion.div
                key={v.to}
                layout
                onMouseEnter={() => setOpen(i)}
                onFocus={() => setOpen(i)}
                onClick={() => setOpen(i)}
                transition={{ duration: 0.6, ease: EASE }}
                className="relative cursor-pointer overflow-hidden rounded-[26px] border border-white/[0.06] bg-[#1c1c1a] text-[#eceae4]"
                style={{ flex: on ? 5 : 1 }}
              >
                {/* each venture keeps one colour of its own: a soft wash, the dot and the name when open */}
                <span aria-hidden="true" className={`pointer-events-none absolute inset-0 transition-opacity duration-700 ${on ? "opacity-100" : "opacity-0"}`} style={{ background: `radial-gradient(90% 80% at 85% 10%, ${v.accent}33, transparent 65%)` }} />
                <span aria-hidden="true" className="absolute left-5 top-5 h-2.5 w-2.5 rounded-full md:left-1/2 md:-translate-x-1/2" style={{ background: v.accent, opacity: on ? 0 : 1 }} />
                {/* collapsed: the name runs vertically */}
                <span className={`absolute bottom-5 left-1/2 hidden origin-center -translate-x-1/2 whitespace-nowrap text-2xl tracking-[-0.02em] transition-opacity duration-300 [writing-mode:vertical-rl] md:block ${on ? "opacity-0" : "rotate-180 opacity-100"}`}>
                  {v.name}
                </span>
                <span className={`absolute left-5 top-1/2 -translate-y-1/2 text-xl tracking-[-0.02em] transition-opacity duration-300 md:hidden ${on ? "opacity-0" : "opacity-100"}`}>{v.name}</span>

                <div className={`absolute inset-0 flex flex-col justify-between p-6 transition-opacity duration-500 md:p-9 ${on ? "opacity-100 delay-200" : "pointer-events-none opacity-0"}`}>
                  <span className="font-mono text-[11px] uppercase tracking-[0.2em] opacity-60">0{i + 1}</span>
                  <div>
                    <p className="text-[clamp(2.6rem,6vw,5.5rem)] leading-[0.9] tracking-[-0.05em]" style={{ color: v.accent }}>{v.name}</p>
                    <p className="mt-4 max-w-sm text-[16px] leading-snug text-[#bcbab2]">{v.what}</p>
                    <Link to={v.to} className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#eceae4] px-4 py-2 text-sm text-[#171716] transition-transform hover:-translate-y-0.5" tabIndex={on ? 0 : -1}>
                      Visit {v.name} <ArrowUpRight size={15} />
                    </Link>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────── 10. call to action ─────────────────────────── */

function FinalCta() {
  return (
    <section className="bg-[#171716] px-3 pb-3 sm:px-5 sm:pb-5">
      <div className="relative overflow-hidden rounded-[32px] bg-[var(--fm-lime)] text-[#171716] md:rounded-[48px]">
        <div className="mx-auto max-w-[1320px] px-6 py-20 sm:px-10 md:py-28">
          <Kicker className="opacity-80">Start here</Kicker>
          <MaskLines className="mt-6 text-[clamp(3rem,9vw,8.5rem)] font-normal leading-[0.9] tracking-[-0.06em]" lines={["Let's build", "yours."]} />
          <div className="mt-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <p className="max-w-md text-[17px] leading-relaxed text-[#171716]/75">Tell us what you need. You get a straight answer on scope, time and price, usually within a day.</p>
            <div className="flex flex-wrap gap-3">
              <PillLink to="/connect" tone="ink">
                Start a project
              </PillLink>
              <PillLink to="https://wa.me/918073087576" tone="ghost" external>
                WhatsApp us
              </PillLink>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────── page ─────────────────────────── */

export default function Home({ products = [], rates, team }: { products?: PublicProduct[]; rates?: IndustryRates | null; team?: RailMember[] }) {
  return (
    <div className="overflow-x-clip bg-[var(--fm-stone)]">
      <SEO
        title="Web Design, Development & AI Solutions"
        description="FrameMind AI Studio is an MSME-registered design and development studio in India. We build websites, brand systems, custom software, ready-made industry apps and AI automations, with transparent INR pricing."
        path="/"
        keywords="web design India, website development India, brand identity India, AI studio India, MSME design studio Karnataka, custom software India, industry apps India, FrameMind AI Studio"
        ogImageAlt="FrameMind AI Studio: Web Design, Development & AI Solutions"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "FrameMind AI Studio",
          url: "https://www.framemindaistudio.com",
        }}
      />
      <Hero />
      <Wordmark />
      <Marquee />
      <Services />
      <IndustryIndex rates={rates} />
      <Store products={products} />
      <Process />
      <Ventures />
      <TeamRail members={team} />
      <FinalCta />
    </div>
  );
}
