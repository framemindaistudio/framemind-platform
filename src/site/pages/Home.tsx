"use client";

import { Link } from "@/site/router";
import {
  ArrowRight, Globe, Palette, Code2, Zap, Brain,
  Sparkles, ShieldCheck,
} from "lucide-react";
import SEO from "@/site/components/SEO";

import { ImageWithFallback } from "@/site/components/ImageWithFallback";
const jagkalyanMissionScreenshot = "/site/jagkalyan-mission.jpg";
const msmeLogo = "/site/msme-logo.png";
const heroVideo = "/site/logo-video.mp4";

// ─── Data ─────────────────────────────────────────────────────────────────────

const marqueeItems = [
  "Websites", "Brand Systems", "Custom Software", "Automations",
  "AI Coaching", "Digital Products", "UI / UX Design",
  "Notion Systems", "Pitch Decks", "School Programs", "Startup Tools",
];


const services = [
  {
    n: "01",
    icon: Globe,
    title: "Websites",
    outcome: "Your business looks credible before you say a word.",
    tagline: "Design · Development · Launch",
    bullets: [
      "Built from scratch — no templates, no drag-and-drop",
      "Optimised for speed, SEO, and conversions",
      "Fully handed over with training and support",
    ],
    price: "From ₹25,000",
    link: "/pricing",
    color: "#C8F135",
  },
  {
    n: "02",
    icon: Palette,
    title: "Brand Systems",
    outcome: "Your brand works without you having to explain it.",
    tagline: "Identity · Guidelines · Assets",
    bullets: [
      "Logo, color, typography — the full system",
      "Brand guidelines your team actually uses",
      "Consistent across every touchpoint",
    ],
    price: "From ₹15,000",
    link: "/pricing",
    color: "#C8F135",
  },
  {
    n: "03",
    icon: Code2,
    title: "Custom Software",
    outcome: "A tool built exactly for how your business works.",
    tagline: "Dashboards · Platforms · Tools",
    bullets: [
      "Scoped to your exact requirements — no over-engineering",
      "Clean code, real documentation, handed over fully",
      "From internal tools to customer-facing platforms",
    ],
    price: "Custom",
    link: "/pricing",
    color: "#C8F135",
    badge: "",
  },
  {
    n: "04",
    icon: Zap,
    title: "Automations",
    outcome: "10+ hours a week back — without hiring anyone.",
    tagline: "Workflow · AI · Integration",
    bullets: [
      "We map your manual process and automate the repetitive parts",
      "WhatsApp flows, CRM sync, invoicing, follow-ups",
      "Built on n8n, Make, Zapier — whatever fits best",
    ],
    price: "From ₹12,000",
    link: "/pricing",
    color: "#C8F135",
  },
  {
    n: "05",
    icon: Brain,
    title: "1:1 AI Coaching",
    outcome: "AI fluency built around your life — in 90 days.",
    tagline: "Ages 10–60 · Online & Offline",
    bullets: [
      "Personalised curriculum — built for your profession",
      "Not a course. A 1:1 coach, every session",
      "Research-proven: 90 days to real fluency from zero",
    ],
    price: "Custom",
    link: "/personal-coaching",
    color: "#C8F135",
    badge: "New",
  },
];

const steps = [
  { n: "1", title: "Tell us what you're building", desc: "A 20-minute call. No decks, no proposals. Just a direct conversation about what you need and whether we're the right fit." },
  { n: "2", title: "We scope it honestly", desc: "You get a clear scope, timeline, and price. No vague retainers. No hidden costs. If it can't be done well in your budget, we'll say so." },
  { n: "3", title: "We build — you stay in the loop", desc: "Daily or weekly updates depending on project length. You see real progress, not just a Notion board." },
  { n: "4", title: "Shipped. Then supported.", desc: "Delivery isn't the end. We stick around for handover, training, and follow-up — so the work actually gets used." },
];


// ─── Services Section ─────────────────────────────────────────────────────────

function ServicesSection() {
  return (
    <section className="bg-background border-b border-border">
      <div className="max-w-6xl mx-auto px-6 py-14 md:py-20">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10">
          <div>
            <span className="font-mono text-xs text-muted-foreground uppercase tracking-widest mb-3 block">What We Do</span>
            <h2 className="text-3xl md:text-4xl font-semibold text-foreground tracking-tight leading-[1.05]">
              Everything your business<br />needs. Under one roof.
            </h2>
          </div>
          <Link
            to="/pricing"
            className="shrink-0 inline-flex items-center gap-2 font-mono text-[10px] text-muted-foreground uppercase tracking-widest hover:text-foreground transition-colors"
          >
            View all pricing <ArrowRight size={11} />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {services.map((svc) => {
            const Icon = svc.icon;
            return (
              <Link
                key={svc.n}
                to={svc.link}
                className="group relative flex flex-col gap-5 p-6 rounded-sm border border-border bg-white hover:border-[#C8F135]/60 hover:shadow-[0_4px_24px_rgba(200,241,53,0.08)] transition-all duration-300"
              >
                {/* Number + badge */}
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] text-muted-foreground/50 uppercase tracking-[0.2em]">{svc.n}</span>
                  {svc.badge && (
                    <span className="font-mono text-[9px] bg-[#C8F135] text-[#0D0D0D] px-2 py-0.5 rounded-sm uppercase tracking-widest font-bold">
                      {svc.badge}
                    </span>
                  )}
                </div>

                {/* Icon */}
                <div className="w-10 h-10 rounded-sm border border-border group-hover:border-[#C8F135] group-hover:bg-[#C8F135]/10 flex items-center justify-center transition-all duration-300">
                  <Icon size={18} className="text-muted-foreground group-hover:text-[#0D0D0D] transition-colors duration-300" />
                </div>

                {/* Title + tagline */}
                <div>
                  <h3 className="font-semibold text-foreground text-base mb-1">
                    {svc.title}
                  </h3>
                  <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">{svc.tagline}</p>
                </div>

                {/* Arrow */}
                <div className="mt-auto flex items-center gap-1.5 text-muted-foreground/40 group-hover:text-[#0D0D0D] transition-colors duration-300">
                  <span className="font-mono text-[10px] uppercase tracking-widest">Explore</span>
                  <ArrowRight size={11} className="group-hover:translate-x-0.5 transition-transform duration-200" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── Marquee ─────────────────────────────────────────────────────────────────

function Marquee({ items, bg = "#C8F135", textColor = "#0D0D0D", dotColor = "#0D0D0D", reverse = false }: {
  items: string[];
  bg?: string;
  textColor?: string;
  dotColor?: string;
  reverse?: boolean;
}) {
  const doubled = [...items, ...items];
  const animName = reverse ? "marqueeReverse" : "marquee";
  return (
    <div className="overflow-hidden border-t border-b" style={{ backgroundColor: bg, borderColor: bg === "#C8F135" ? "#b8e020" : "#1a1a1a" }}>
      <div
        className="flex gap-0 whitespace-nowrap py-3.5"
        style={{ animation: `${animName} 32s linear infinite` }}
      >
        {doubled.map((item, i) => (
          <span key={i} className="inline-flex items-center gap-4 px-6 text-xs font-semibold uppercase tracking-widest font-mono" style={{ color: textColor }}>
            {item}
            <span className="w-1 h-1 rounded-full shrink-0" style={{ backgroundColor: `${dotColor}4D` }} />
          </span>
        ))}
      </div>
      <style>{`
        @keyframes marquee { from { transform: translateX(0) } to { transform: translateX(-50%) } }
        @keyframes marqueeReverse { from { transform: translateX(-50%) } to { transform: translateX(0) } }
      `}</style>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Home() {
  return (
    <div>
      <SEO
        title="Web Design, Development & AI Solutions"
        description="FrameMind Studio is an MSME-registered design and development studio in India. We build websites, brand systems, custom software, and AI-powered tools — delivered on time, at transparent INR pricing."
        path="/"
        keywords="web design India, website development India, brand identity India, AI studio India, MSME design studio Karnataka, custom software India, design agency Gadag, FrameMind AI Studio"
        ogImageAlt="FrameMind AI Studio — Web Design, Development & AI Solutions"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "FrameMind AI Studio",
          "url": "https://www.framemindaistudio.com",
        }}
      />

      {/* ── Hero ── */}
      <section className="relative w-full bg-[#0D0D0D] overflow-hidden min-h-[100svh] flex flex-col">
        {/* Video background */}
        <video
          src={heroVideo}
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          style={{ opacity: 0.35, animation: "heroFadeIn 1.2s ease-out forwards" }}
        />
        {/* Stronger overlay on mobile for text legibility */}
        <div className="absolute inset-0 pointer-events-none bg-black/50 sm:bg-black/20" />
        <style>{`
          @keyframes heroFadeIn { from { opacity: 0 } to { opacity: 0.35 } }
          @keyframes heroContentUp { from { opacity: 0; transform: translateY(18px) } to { opacity: 1; transform: translateY(0) } }
        `}</style>

        <div className="relative z-10 flex-1 flex flex-col" style={{ animation: "heroContentUp 1s 0.3s ease-out both" }}>

          {/* Hero text */}
          <div className="flex-1 flex flex-col justify-center px-5 sm:px-8 pt-10 sm:pt-0">
            <div className="w-full max-w-[280px] sm:max-w-sm mx-auto sm:mx-0 text-center sm:text-left">
              <div className="inline-flex items-center gap-2 border border-[#2a2a2a] rounded-full px-3 py-1.5 mb-5 w-fit mx-auto sm:mx-0">
                <Sparkles size={10} className="text-[#C8F135]" />
                <span className="font-mono text-[10px] text-[#888] uppercase tracking-widest">Design & Software Studio</span>
              </div>
              <h1 className="text-[2rem] leading-[1.1] sm:text-4xl md:text-5xl lg:text-[64px] font-semibold text-[#F5F4F0] tracking-tight lg:leading-[1.0]">
                We build what<br />
                founders need<br />
                <span className="text-[#C8F135]">actually shipped.</span>
              </h1>
            </div>
          </div>

          {/* Bottom strip */}
          <div className="px-5 sm:px-8">
            <div className="border-t border-[#ffffff10] pt-4 pb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">

              {/* Stats */}
              <div className="flex items-center justify-center sm:justify-start gap-6">
                {[
                  { n: "100%", label: "In-house delivery" },
                  { n: "3+", label: "Years of studio work" },
                ].map(({ n, label }) => (
                  <div key={label} className="text-center sm:text-left">
                    <p className="text-base font-semibold text-[#F5F4F0] tracking-tight">{n}</p>
                    <p className="font-mono text-[9px] text-[#555] uppercase tracking-widest mt-0.5">{label}</p>
                  </div>
                ))}
              </div>

              {/* Buttons */}
              <div className="flex gap-2 w-full sm:w-auto">
                <Link to="/connect" className="flex-1 sm:flex-none bg-[#C8F135] text-[#0D0D0D] px-5 py-3 text-sm font-semibold rounded-sm hover:bg-[#b8e020] transition-colors flex items-center justify-center gap-2">
                  Start a Project <ArrowRight size={13} />
                </Link>
                <Link to="/testimonials" className="flex-1 sm:flex-none border border-[#2a2a2a] text-[#888] px-5 py-3 text-sm font-medium rounded-sm hover:border-[#444] hover:text-[#aaa] transition-colors text-center flex items-center justify-center">
                  See Our Work
                </Link>
              </div>

              {/* MSME — hidden on mobile */}
              <div className="hidden sm:flex items-center gap-3 bg-white/90 backdrop-blur-sm rounded-sm px-4 py-2.5 shrink-0">
                <img src={msmeLogo} alt="MSME" className="w-7 h-7 object-contain shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-[#0D0D0D] leading-none">MSME Registered Studio</p>
                  <p className="font-mono text-[9px] text-[#888] mt-0.5">Govt. of India · Ministry of MSME</p>
                </div>
                <ShieldCheck size={15} className="text-[#0D0D0D] ml-1" />
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* ── Marquee ── */}
      <Marquee items={marqueeItems} />

      {/* ── What We Do ── */}
      <ServicesSection />

      <Marquee items={marqueeItems} />

      {/* ── Featured Work ── */}
      <section className="border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8 md:mb-12">
            <div>
              <span className="font-mono text-xs text-muted-foreground uppercase tracking-widest mb-3 block">Featured Work</span>
              <h2 className="text-3xl md:text-4xl font-semibold tracking-tight leading-snug">Real projects. Real results.</h2>
            </div>
            <Link to="/testimonials" className="inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground hover:text-foreground transition-colors uppercase tracking-widest shrink-0 mb-1">
              View all work <ArrowRight size={12} />
            </Link>
          </div>

          <Link to="/testimonials" className="group block border border-border rounded-sm overflow-hidden hover:border-foreground/20 transition-colors">
            <div className="grid grid-cols-1 lg:grid-cols-5">
              <div className="lg:col-span-3 bg-secondary overflow-hidden min-h-[300px]">
                <ImageWithFallback
                  src={jagkalyanMissionScreenshot}
                  alt="JagKalyan Holistic Mission — website built by FrameMind"
                  className="w-full h-full object-cover object-top group-hover:scale-[1.02] transition-transform duration-700"
                />
              </div>
              <div className="lg:col-span-2 p-6 sm:p-8 md:p-10 flex flex-col justify-between bg-background">
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <span className="font-mono text-[10px] border border-border px-3 py-1 rounded-sm text-muted-foreground uppercase tracking-widest">NGO · Mission</span>
                    <span className="font-mono text-[10px] border border-border px-3 py-1 rounded-sm text-muted-foreground uppercase tracking-widest">Brand + Website</span>
                  </div>
                  <p className="font-mono text-[9px] text-muted-foreground uppercase tracking-widest mb-2">॥ सर्वे भवन्तु सुखिनः ॥</p>
                  <h3 className="text-3xl font-semibold tracking-tight mb-4">JagKalyan Holistic Mission</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                    A registered NGO with a mission spanning self, society, nation, and humanity — built a digital presence worthy of its 500-acre Wisdom City vision and nine-shala Academy.
                  </p>
                  <div className="flex flex-col gap-2">
                    {["Cinematic, purpose-driven design", "Academy, Ecosystem & Startup Hub", "12A & 80G registered trust", "One Humanity · One Planet"].map((f) => (
                      <div key={f} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#C8F135] shrink-0" />
                        {f}
                      </div>
                    ))}
                  </div>
                </div>
                <span className="font-mono text-xs text-foreground flex items-center gap-1.5 group-hover:gap-3 transition-all mt-8 border-t border-border pt-6">
                  View case study <ArrowRight size={12} />
                </span>
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* ── How We Work ── */}
      <section className="bg-[#0D0D0D]">
        <div className="max-w-6xl mx-auto px-6 py-14 md:py-20">
          <div className="mb-10 md:mb-14">
            <span className="font-mono text-xs text-[#555] uppercase tracking-widest mb-3 block">How It Works</span>
            <h2 className="text-3xl md:text-4xl font-semibold text-[#F5F4F0] tracking-tight leading-snug max-w-lg">
              From first message to final delivery.
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-0 border border-[#1a1a1a]">
            {steps.map((step, i) => (
              <div key={step.n} className={`p-6 sm:p-8 bg-[#0a0a0a] flex flex-col gap-4 border-b border-[#1a1a1a] last:border-b-0 lg:border-b-0 ${i < steps.length - 1 ? "lg:border-r border-[#1a1a1a]" : ""}`}>
                <span className="text-5xl font-semibold text-[#C8F135] leading-none">{step.n}</span>
                <div>
                  <h3 className="font-semibold text-base text-[#F5F4F0] mb-2">{step.title}</h3>
                  <p className="text-sm text-[#666] leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Marquee items={marqueeItems} />

    </div>
  );
}
