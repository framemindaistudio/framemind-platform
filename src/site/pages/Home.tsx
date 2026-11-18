"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from "motion/react";
import { ArrowRight, ArrowUpRight, Bot, Code2, Globe, LayoutGrid, Palette, ShieldCheck, ShoppingBag, Zap, Brain, Check } from "lucide-react";
import { Link } from "@/site/router";
import SEO from "@/site/components/SEO";
import { INDUSTRIES, tierPrice, type IndustryRates } from "@/lib/content/industries";
import { brandOf } from "@/lib/content/industry-brands";
import { ProductCard } from "@/site/components/shop/ShopBits";
import type { PublicProduct } from "@/lib/shop/types";

/*
 * The home page. One idea per screen:
 *   1. a real-time 3D hero that says, at a glance, what FrameMind builds
 *   2. the services as cards that stack as you scroll
 *   3. the ten industry apps on a 3D ring that turns with the scroll
 *   4. the digital store
 *   5. how a project runs, then one call to action
 * 360VUE, Vritta and JOVE live in the footer.
 */

// three.js only on the client, after the words are already on screen
const HeroScene = dynamic(() => import("@/site/components/home/HeroScene"), { ssr: false });

const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

const WHAT = [
  { icon: Globe, label: "Websites & brand", to: "/pricing" },
  { icon: LayoutGrid, label: "Industry apps", to: "/industries" },
  { icon: Code2, label: "Custom software", to: "/pricing" },
  { icon: Bot, label: "AI & automation", to: "/pricing" },
];

const services = [
  {
    n: "01",
    icon: Globe,
    title: "Websites",
    outcome: "Your business looks credible before you say a word.",
    tagline: "Design · Development · Launch",
    bullets: ["Built from scratch — no templates, no drag-and-drop", "Optimised for speed, SEO and conversions", "Fully handed over with training and support"],
    price: "From ₹25,000",
    link: "/pricing",
  },
  {
    n: "02",
    icon: Palette,
    title: "Brand Systems",
    outcome: "Your brand works without you having to explain it.",
    tagline: "Identity · Guidelines · Assets",
    bullets: ["Logo, colour, typography — the full system", "Brand guidelines your team actually uses", "Consistent across every touchpoint"],
    price: "From ₹15,000",
    link: "/pricing",
  },
  {
    n: "03",
    icon: Code2,
    title: "Custom Software",
    outcome: "A tool built exactly for how your business works.",
    tagline: "Dashboards · Platforms · Tools",
    bullets: ["Scoped to your exact requirements — no over-engineering", "Clean code, real documentation, handed over fully", "From internal tools to customer-facing platforms"],
    price: "Custom quote",
    link: "/pricing",
  },
  {
    n: "04",
    icon: Zap,
    title: "Automations",
    outcome: "10+ hours a week back — without hiring anyone.",
    tagline: "Workflow · AI · Integration",
    bullets: ["We map your manual process and automate the repetitive parts", "WhatsApp flows, CRM sync, invoicing, follow-ups", "Built on n8n, Make, Zapier — whatever fits best"],
    price: "From ₹12,000",
    link: "/pricing",
  },
  {
    n: "05",
    icon: Brain,
    title: "1:1 AI Coaching",
    outcome: "AI fluency built around your life — in 90 days.",
    tagline: "Ages 10–60 · Online & Offline",
    bullets: ["Personalised curriculum — built for your profession", "Not a course. A 1:1 coach, every session", "90 days to real fluency from zero"],
    price: "Custom",
    link: "/personal-coaching",
  },
];

const steps = [
  { n: "01", title: "Tell us what you're building", desc: "A 20-minute call. A direct conversation about what you need and whether we're the right fit." },
  { n: "02", title: "We scope it honestly", desc: "A clear scope, timeline and price. No vague retainers, no hidden costs." },
  { n: "03", title: "We build — you stay in the loop", desc: "Regular updates and a client portal, so you see real progress." },
  { n: "04", title: "Shipped. Then supported.", desc: "Handover, training and support after launch, so the work actually gets used." },
];

function Eyebrow({ children, dark }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <p className={`mb-4 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.22em] ${dark ? "text-[#8E95AD]" : "text-muted-foreground"}`}>
      <span className="h-px w-8 bg-[#C8F135]" />
      {children}
    </p>
  );
}

/* ─────────────────────────── 1. hero ─────────────────────────── */

/** true on large screens, where the hero pins and the words sit beside the 3D scene */
function useWide() {
  const [wide, setWide] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const on = () => setWide(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return wide;
}

function Hero() {
  const track = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const wide = useWide();
  const { scrollYProgress } = useScroll({ target: track, offset: ["start start", "end end"] });
  // the words drift up and soften as the 3D scene takes over
  const y = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -60]);
  const fade = useTransform(scrollYProgress, [0.55, 1], [1, 0.15]);
  const cue = useTransform(scrollYProgress, [0, 0.15], [1, 0]);

  return (
    <section ref={track} className="relative bg-[#070A14] lg:h-[175vh]" aria-label="FrameMind AI Studio">
      {/* large screens: pinned while the 3D scene plays; phones and tablets: the scene on top, the words below */}
      <div className="relative overflow-hidden lg:sticky lg:top-0 lg:h-[100svh]">
        {/* depth: navy glow, gold warmth, a fine grid */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_60%_at_75%_40%,rgba(123,92,255,0.22),transparent_70%),radial-gradient(50%_45%_at_70%_85%,rgba(200,146,46,0.18),transparent_70%)]" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:linear-gradient(rgba(255,255,255,.6)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.6)_1px,transparent_1px)] [background-size:56px_56px] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_75%)]" />

        <div className="relative h-[46svh] min-h-[300px] max-h-[520px] lg:absolute lg:inset-0 lg:h-auto lg:max-h-none">
          <HeroScene track={track} />
        </div>
        <div className="pointer-events-none absolute inset-y-0 left-0 hidden w-[55%] bg-gradient-to-r from-[#070A14] via-[#070A14]/70 to-transparent lg:block" />

        <motion.div
          style={wide ? { y, opacity: fade } : undefined}
          className="relative z-10 mx-auto max-w-6xl px-5 pb-14 sm:px-8 lg:absolute lg:inset-x-0 lg:top-0 lg:flex lg:h-full lg:flex-col lg:justify-center lg:pb-0"
        >
          <div className="max-w-xl lg:max-w-[600px]">
            <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-[#C9CDDB] backdrop-blur">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#C8F135]" />
              Design · Software · AI — one studio
            </span>
            <h1 className="text-[2.35rem] font-semibold leading-[1.02] tracking-[-0.035em] text-[#F5F4F0] sm:text-5xl lg:text-[3.55rem]">
              Websites, apps &amp; AI —
              <span className="block text-[#C8F135]">built for your business.</span>
            </h1>
            <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-[#AEB4C8] sm:text-base">
              FrameMind AI Studio designs and builds websites, custom software, ready-made industry apps and AI automations — and looks after them
              after launch. One team, from idea to live.
            </p>

            <div className="mt-6 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
              {WHAT.map(({ icon: Icon, label, to }) => (
                <Link
                  key={label}
                  to={to}
                  className="group inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-3.5 py-2 text-[13px] font-medium text-[#E6E8F2] backdrop-blur transition hover:border-[#C8F135]/60 hover:bg-[#C8F135]/10"
                >
                  <Icon size={14} className="shrink-0 text-[#E7B866] transition group-hover:text-[#C8F135]" />
                  {label}
                </Link>
              ))}
            </div>

            <div className="mt-7 flex flex-col gap-2.5 sm:flex-row">
              <Link to="/connect" className="inline-flex items-center justify-center gap-2 rounded-full bg-[#C8F135] px-6 py-3.5 text-sm font-semibold text-[#0D0D0D] shadow-[0_0_40px_-8px_rgba(200,241,53,0.6)] transition hover:bg-[#d6ff4a]">
                Start a project <ArrowRight size={15} />
              </Link>
              <Link to="/industries" className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 px-6 py-3.5 text-sm font-semibold text-[#F5F4F0] transition hover:border-white/50">
                See industry apps
              </Link>
            </div>

            <p className="mt-6 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[#7E86A0]">
              <ShieldCheck size={13} className="text-[#E7B866]" /> MSME registered · Govt. of India · In-house team
            </p>
          </div>
        </motion.div>

        <motion.div style={{ opacity: cue }} className="pointer-events-none absolute bottom-5 left-1/2 z-10 hidden -translate-x-1/2 flex-col items-center gap-2 lg:flex">
          <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-[#7E86A0]">Scroll</span>
          <span className="relative h-9 w-[22px] rounded-full border border-white/25">
            <span className="absolute left-1/2 top-1.5 h-2 w-[3px] -translate-x-1/2 animate-bounce rounded-full bg-[#C8F135]" />
          </span>
        </motion.div>
      </div>
    </section>
  );
}

/* ─────────────────────────── 2. services: stacking cards ─────────────────────────── */

function StackCard({ svc, i, total, progress }: { svc: (typeof services)[number]; i: number; total: number; progress: MotionValue<number> }) {
  const reduce = useReducedMotion();
  const scale = useTransform(progress, [i / total, 1], [1, reduce ? 1 : 1 - (total - i) * 0.035]);
  const Icon = svc.icon;
  const dark = i % 2 === 0;
  return (
    <div className="sticky" style={{ top: `calc(88px + ${i * 18}px)` }}>
      <motion.div style={{ scale, transformOrigin: "top center" }}>
        <Link
          to={svc.link}
          className={`group grid gap-6 rounded-[28px] border p-6 shadow-[0_30px_60px_-30px_rgba(7,10,20,0.45)] sm:p-9 md:grid-cols-[1.1fr_1fr] md:gap-10 ${
            dark ? "border-[#1A2040] bg-[#0B0F1E] text-[#F5F4F0]" : "border-border bg-white text-foreground"
          }`}
        >
          <div className="flex flex-col">
            <div className="flex items-center justify-between">
              <span className={`font-mono text-[11px] tracking-[0.2em] ${dark ? "text-[#E7B866]" : "text-muted-foreground"}`}>{svc.n} / 05</span>
              <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${dark ? "bg-white/[0.06] text-[#C8F135]" : "bg-[#0D0D0D] text-[#C8F135]"}`}>
                <Icon size={20} />
              </span>
            </div>
            <h3 className="mt-6 text-3xl font-semibold tracking-tight sm:text-4xl">{svc.title}</h3>
            <p className={`mt-1 font-mono text-[10px] uppercase tracking-[0.2em] ${dark ? "text-[#7E86A0]" : "text-muted-foreground"}`}>{svc.tagline}</p>
            <p className={`mt-5 text-lg leading-snug ${dark ? "text-[#C9CDDB]" : "text-foreground/80"}`}>{svc.outcome}</p>
          </div>
          <div className="flex flex-col">
            <ul className="space-y-2.5">
              {svc.bullets.map((b) => (
                <li key={b} className={`flex gap-2.5 text-sm leading-relaxed ${dark ? "text-[#AEB4C8]" : "text-muted-foreground"}`}>
                  <Check size={15} className="mt-0.5 shrink-0 text-[#7aa800]" />
                  {b}
                </li>
              ))}
            </ul>
            <div className={`mt-auto flex items-center justify-between border-t pt-5 ${dark ? "border-white/10" : "border-border"}`}>
              <span className="text-base font-semibold">{svc.price}</span>
              <span className={`inline-flex items-center gap-1.5 text-sm font-semibold transition-transform group-hover:translate-x-1 ${dark ? "text-[#C8F135]" : ""}`}>
                Explore <ArrowRight size={15} />
              </span>
            </div>
          </div>
        </Link>
      </motion.div>
    </div>
  );
}

function Services() {
  const box = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: box, offset: ["start start", "end end"] });
  return (
    <section className="bg-[#F5F4F0]">
      <div className="mx-auto max-w-5xl px-5 pb-10 pt-20 sm:px-8 md:pt-28">
        <Eyebrow>What we do</Eyebrow>
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <h2 className="max-w-2xl text-4xl font-semibold leading-[1.02] tracking-[-0.03em] md:text-6xl">Everything your business needs. Under one roof.</h2>
          <Link to="/pricing" className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold">
            All services &amp; prices <ArrowUpRight size={15} />
          </Link>
        </div>
        <div ref={box} className="mt-12 flex flex-col gap-6 pb-[10vh]">
          {services.map((svc, i) => (
            <StackCard key={svc.n} svc={svc} i={i} total={services.length} progress={scrollYProgress} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────── 3. industry apps on a 3D ring ─────────────────────────── */

function AppCard({ ind, rates }: { ind: (typeof INDUSTRIES)[number]; rates?: IndustryRates | null }) {
  const b = brandOf(ind.id);
  return (
    <Link
      to={`/industries/${ind.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-3xl border border-white/10 bg-white p-5 text-[#0E1222] shadow-[0_30px_60px_-30px_rgba(0,0,0,0.6)] transition hover:-translate-y-1"
    >
      <span className="h-1 w-12 rounded-full" style={{ background: b.colors.accent }} />
      <img src={b.logo} alt={`FrameMind ${b.name}`} className="mt-4 h-8 w-auto self-start" loading="lazy" />
      <p className="mt-4 text-lg font-semibold leading-tight tracking-tight">{ind.name}</p>
      <p className="mt-1 line-clamp-2 text-[13px] leading-snug text-[#0E1222]/65">{ind.tagline}</p>
      <p className="mt-auto pt-4 text-sm">
        From <b className="text-base">{inr(tierPrice(rates, ind.id, "starter"))}</b>
        <span className="text-[#0E1222]/55">/month</span>
      </p>
    </Link>
  );
}

function IndustryRing({ rates }: { rates?: IndustryRates | null }) {
  const box = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: box, offset: ["start end", "end start"] });
  const turn = useTransform(scrollYProgress, [0, 1], reduce ? [-18, -18] : [40, -220]);
  const n = INDUSTRIES.length;
  const CARD = 236;
  const R = Math.round((CARD + 26) / (2 * Math.tan(Math.PI / n)));

  return (
    <section ref={box} className="relative overflow-hidden bg-[#070A14] text-[#F5F4F0]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_60%,rgba(123,92,255,0.18),transparent_70%)]" />
      <div className="relative mx-auto max-w-6xl px-5 pt-20 sm:px-8 md:pt-28">
        <Eyebrow dark>Industry apps</Eyebrow>
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h2 className="max-w-2xl text-4xl font-semibold leading-[1.02] tracking-[-0.03em] md:text-6xl">
              Your industry&apos;s app, <span className="text-[#C8F135]">already built.</span>
            </h2>
            <p className="mt-4 max-w-xl text-[15px] text-[#AEB4C8]">
              {n} ready-made apps with your name and logo — live in 3–4 weeks, with a one-time setup and a simple monthly plan. Try any live demo.
            </p>
          </div>
          <Link to="/industries" className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-[#C8F135]">
            All industry apps <ArrowUpRight size={15} />
          </Link>
        </div>
      </div>

      {/* large screens: a ring of apps that turns as you scroll */}
      <div className="relative hidden h-[560px] items-center justify-center lg:flex" style={{ perspective: "1600px" }}>
        <motion.div className="relative" style={{ width: CARD, height: 300, transformStyle: "preserve-3d", rotateX: -6, rotateY: turn }}>
          {INDUSTRIES.map((ind, i) => (
            <div
              key={ind.id}
              className="absolute inset-0"
              style={{ transform: `rotateY(${(i * 360) / n}deg) translateZ(${R}px)`, backfaceVisibility: "hidden" }}
            >
              <AppCard ind={ind} rates={rates} />
            </div>
          ))}
        </motion.div>
      </div>

      {/* phones and tablets: swipe through */}
      <div className="relative mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-16 sm:px-8 lg:hidden [scrollbar-width:none]">
        {INDUSTRIES.map((ind) => (
          <div key={ind.id} className="h-[280px] w-[230px] shrink-0 snap-start">
            <AppCard ind={ind} rates={rates} />
          </div>
        ))}
      </div>
      <div className="hidden h-10 lg:block" />
    </section>
  );
}

/* ─────────────────────────── 4. the store ─────────────────────────── */

function Store({ products }: { products: PublicProduct[] }) {
  if (!products.length) return null;
  return (
    <section className="bg-[#F5F4F0]">
      <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 md:py-28">
        <Eyebrow>FrameMind store</Eyebrow>
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h2 className="max-w-2xl text-4xl font-semibold leading-[1.02] tracking-[-0.03em] md:text-6xl">Tools we use, ready to download.</h2>
            <p className="mt-4 max-w-xl text-[15px] text-muted-foreground">Templates, guides and toolkits made by the studio — instant download after payment.</p>
          </div>
          <Link to="/shop" className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[#0D0D0D] px-5 py-3 text-sm font-semibold text-[#F5F4F0] transition hover:bg-[#222]">
            <ShoppingBag size={15} className="text-[#C8F135]" /> Visit the store
          </Link>
        </div>
        <div className="mt-12 grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4 lg:gap-x-6">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────── 5. how it works ─────────────────────────── */

function Process() {
  const box = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: box, offset: ["start 80%", "end 60%"] });
  const line = useTransform(scrollYProgress, [0, 1], [0, 1]);
  return (
    <section ref={box} className="bg-[#070A14] text-[#F5F4F0]">
      <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 md:py-28">
        <Eyebrow dark>How it works</Eyebrow>
        <h2 className="max-w-2xl text-4xl font-semibold leading-[1.02] tracking-[-0.03em] md:text-6xl">From first message to final delivery.</h2>
        <div className="relative mt-14">
          <div className="absolute left-0 right-0 top-[18px] hidden h-px bg-white/10 md:block" />
          <motion.div style={{ scaleX: line, transformOrigin: "left center" }} className="absolute left-0 right-0 top-[18px] hidden h-px bg-gradient-to-r from-[#C8F135] via-[#E7B866] to-[#7B5CFF] md:block" />
          <ol className="grid gap-10 md:grid-cols-4 md:gap-6">
            {steps.map((s) => (
              <li key={s.n} className="relative">
                <span className="relative z-10 flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-[#070A14] font-mono text-[11px] text-[#C8F135]">{s.n}</span>
                <h3 className="mt-5 text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#8E95AD]">{s.desc}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="bg-[#C8F135] text-[#0D0D0D]">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-8 px-5 py-16 sm:px-8 md:flex-row md:items-center md:py-20">
        <h2 className="max-w-2xl text-4xl font-semibold leading-[1.02] tracking-[-0.03em] md:text-5xl">Your business, live online — designed, built and looked after.</h2>
        <div className="flex w-full flex-col gap-2.5 sm:w-auto sm:flex-row">
          <Link to="/connect" className="inline-flex items-center justify-center gap-2 rounded-full bg-[#0D0D0D] px-6 py-3.5 text-sm font-semibold text-[#F5F4F0]">
            Start a project <ArrowRight size={15} />
          </Link>
          <a href="https://wa.me/918073087576" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center rounded-full border border-[#0D0D0D] px-6 py-3.5 text-sm font-semibold">
            WhatsApp us
          </a>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────── page ─────────────────────────── */

export default function Home({ products = [], rates }: { products?: PublicProduct[]; rates?: IndustryRates | null }) {
  return (
    <div className="overflow-x-clip">
      <SEO
        title="Web Design, Development & AI Solutions"
        description="FrameMind AI Studio is an MSME-registered design and development studio in India. We build websites, brand systems, custom software, ready-made industry apps and AI automations — delivered on time, at transparent INR pricing."
        path="/"
        keywords="web design India, website development India, brand identity India, AI studio India, MSME design studio Karnataka, custom software India, industry apps India, FrameMind AI Studio"
        ogImageAlt="FrameMind AI Studio — Web Design, Development & AI Solutions"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "FrameMind AI Studio",
          url: "https://www.framemindaistudio.com",
        }}
      />
      <Hero />
      <Services />
      <IndustryRing rates={rates} />
      <Store products={products} />
      <Process />
      <FinalCta />
    </div>
  );
}
