"use client";

import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Link } from "@/site/router";
import SEO from "@/site/components/SEO";

// ─── Data ─────────────────────────────────────────────────────────────────────

const programs = [
  {
    num: "01",
    grade: "Grades 1–3",
    title: "Little Inventors",
    desc: "First encounter with robotics — building simple machines, understanding sensors, and developing logical thinking through play-based challenges.",
    badge: "Beginner",
  },
  {
    num: "02",
    grade: "Grades 4–5",
    title: "Young Builders",
    desc: "Students assemble and program basic robots, learning the foundations of mechanical design and simple coding sequences.",
    badge: "Elementary",
  },
  {
    num: "03",
    grade: "Grades 6–8",
    title: "Tech Explorers",
    desc: "Intermediate robotics with sensors, actuators, and introductory machine learning concepts. Students solve real-world problems through structured challenges.",
    badge: "Intermediate",
    highlight: true,
  },
  {
    num: "04",
    grade: "Grades 9–10",
    title: "AI Innovators",
    desc: "Advanced AI and ML concepts applied to robotics. Students design, build, and present working prototypes that demonstrate genuine innovation.",
    badge: "Advanced",
  },
];

const highlights = [
  { num: "1 Day", label: "Full-day workshop delivered on your campus" },
  { num: "4", label: "Age-specific programs — Grades 1 through 10" },
  { num: "100%", label: "Hands-on — every student builds and codes" },
  { num: "₹0", label: "FrameMind filming included — reels, drone & highlights" },
];

const includes = [
  { title: "On-campus delivery", desc: "The entire workshop comes to the school — no travel, no logistics for students or parents." },
  { title: "Age-specific programs", desc: "Four structured tracks ensure every student works at the right level of challenge, from Grade 1 through Grade 10." },
  { title: "Take-home robotics kit", desc: "Every student leaves with their own kit to continue experimenting at home — the learning doesn't stop at the bell." },
  { title: "Curriculum alignment", desc: "All programs are mapped to CBSE, ICSE, State board, and NEP 2020 frameworks — so the day counts beyond just the experience." },
  { title: "Free virtual labs", desc: "Schools can access virtual labs online before booking — giving students and teachers a preview of what the day holds." },
  { title: "Professional documentation", desc: "FrameMind AI Studio documents every JOVE event: reels, drone footage, highlight films. Valued at ₹60,000 — included at no extra cost." },
];

const framemindJove = [
  "Drone footage of the full-campus event",
  "Highlight reel for school social media",
  "Professional photographs of student activity",
  "Cinematic edit for admissions marketing",
  "Delivered within 7 working days of the event",
];

// ─── Component ────────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-8">
      <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.2em]">{children}</span>
      <span className="flex-1 h-px bg-border" />
    </div>
  );
}

export default function Jove() {
  return (
    <>
      <SEO
        title="JOVE — School Robotics & AI Workshops Across India"
        description="JOVE brings full-day robotics, AI, and machine learning workshops to school campuses across India for Grades 1–10. Co-founded by the team behind FrameMind AI Studio."
        path="/jove"
        keywords="school robotics workshop India, AI workshop schools India, STEM education India, NEP 2020 robotics, machine learning school program, JOVE workshop, FrameMind JOVE"
        ogImageAlt="JOVE — School Robotics & AI Workshops by FrameMind AI Studio"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "EducationalOrganization",
          "name": "JOVE — Journey of Visionation & Excellence",
          "url": "https://jove.website",
          "description": "Full-day robotics, AI and machine learning workshops delivered to school campuses across India for grades 1–10.",
        }}
      />

      <div className="min-h-screen">

        {/* ── Hero ── */}
        <section className="bg-[#0D0D0D] relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(200,241,53,0.06),transparent_60%)]" />
          <div className="absolute top-0 inset-x-0 h-[2px] bg-[#C8F135]" />

          <div className="max-w-6xl mx-auto px-6 pt-16 md:pt-24 pb-16 md:pb-24 relative z-10">
            <div className="flex items-center gap-3 mb-8">
              <span className="w-2 h-2 rounded-full bg-[#C8F135] animate-pulse" />
              <span className="font-mono text-[10px] text-[#555] uppercase tracking-[0.2em]">FrameMind AI Studio · Co-founded Venture</span>
            </div>

            <div className="max-w-4xl">
              <h1 className="text-6xl sm:text-7xl md:text-[96px] font-black text-[#F5F4F0] tracking-tight leading-none mb-3">
                JOVE
              </h1>
              <p className="font-mono text-sm text-[#C8F135] uppercase tracking-widest mb-6">
                Journey of Visionation &amp; Excellence
              </p>
              <p className="text-lg md:text-xl text-[#888] leading-relaxed max-w-2xl mb-10">
                Full-day robotics, AI &amp; machine learning workshops delivered directly to school campuses across India — every student builds, codes, and tests real technology in a single day.
              </p>

              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-[#1a1a1a] border border-[#1a1a1a] rounded-sm overflow-hidden mb-10">
                {highlights.map(({ num, label }) => (
                  <div key={label} className="bg-[#0D0D0D] px-5 py-5 flex flex-col gap-1.5">
                    <span className="text-2xl font-black text-[#F5F4F0] tracking-tight leading-none">{num}</span>
                    <span className="text-[11px] text-[#555] leading-snug">{label}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-3">
                <a
                  href="https://jove.website"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-[#C8F135] text-[#0D0D0D] px-6 py-3 text-sm font-bold rounded-sm hover:bg-[#b8e020] transition-colors"
                >
                  Visit jove.website <ArrowUpRight size={14} />
                </a>
                <Link
                  to="/connect"
                  className="inline-flex items-center gap-2 border border-[#2a2a2a] text-[#888] px-6 py-3 text-sm font-medium rounded-sm hover:border-[#444] hover:text-[#bbb] transition-colors"
                >
                  Book a workshop <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── Programs ── */}
        <section className="border-b border-border">
          <div className="max-w-6xl mx-auto px-6 py-16 md:py-20">
            <SectionLabel>01 · Programs</SectionLabel>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight leading-snug mb-4">
                  Four programs. One school. One day.
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-md">
                  Every program runs simultaneously across grade groups — so the entire school participates in a single event, without scheduling conflicts or logistical overhead.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {programs.map((p) => (
                <div
                  key={p.num}
                  className={`rounded-sm border overflow-hidden flex flex-col ${p.highlight ? "border-[#C8F135] bg-[#0D0D0D] shadow-[0_0_40px_rgba(200,241,53,0.08)]" : "border-border bg-background"}`}
                >
                  <div className={`px-5 pt-5 pb-4 border-b ${p.highlight ? "border-[#1e1e1e]" : "border-border"}`}>
                    <div className="flex items-center justify-between mb-3">
                      <span className={`font-mono text-[9px] uppercase tracking-widest ${p.highlight ? "text-[#C8F135]" : "text-muted-foreground"}`}>
                        {p.num}
                      </span>
                      <span className={`font-mono text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-sm ${p.highlight ? "bg-[#C8F135] text-[#0D0D0D]" : "bg-secondary text-muted-foreground"}`}>
                        {p.badge}
                      </span>
                    </div>
                    <p className={`font-mono text-[10px] uppercase tracking-widest mb-1.5 ${p.highlight ? "text-[#555]" : "text-muted-foreground/60"}`}>
                      {p.grade}
                    </p>
                    <h3 className={`text-lg font-black tracking-tight ${p.highlight ? "text-[#F5F4F0]" : "text-foreground"}`}>
                      {p.title}
                    </h3>
                  </div>
                  <div className="px-5 py-4 flex-1">
                    <p className={`text-xs leading-relaxed ${p.highlight ? "text-[#777]" : "text-muted-foreground"}`}>
                      {p.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── What's included ── */}
        <section className="border-b border-border bg-secondary/30">
          <div className="max-w-6xl mx-auto px-6 py-16 md:py-20">
            <SectionLabel>02 · What's included</SectionLabel>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {includes.map(({ title, desc }) => (
                <div key={title} className="border border-border rounded-sm p-6 bg-background hover:border-foreground/20 transition-colors">
                  <div className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#C8F135] shrink-0 mt-1.5" />
                    <div>
                      <h3 className="text-sm font-bold mb-1.5">{title}</h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FrameMind × JOVE ── */}
        <section className="border-b border-border bg-[#0D0D0D]">
          <div className="max-w-6xl mx-auto px-6 py-16 md:py-20">
            <SectionLabel>03 · FrameMind × JOVE</SectionLabel>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-[#F5F4F0] tracking-tight mb-5">
                  Every workshop is documented.
                </h2>
                <p className="text-sm text-[#666] leading-relaxed mb-6">
                  FrameMind AI Studio documents every JOVE event — from drone footage of the full campus to cinematic highlight films. Schools receive professional media content for admissions marketing and social media, included at no extra cost.
                </p>
                <div className="bg-[#C8F135]/5 border border-[#C8F135]/20 rounded-sm px-5 py-4 mb-6">
                  <p className="font-mono text-[9px] text-[#C8F135] uppercase tracking-widest mb-1.5">Valued at ₹60,000</p>
                  <p className="text-sm text-[#888] leading-relaxed">
                    Professional event documentation — included with every JOVE workshop at no additional charge.
                  </p>
                </div>
              </div>

              <div className="border border-[#1e1e1e] rounded-sm overflow-hidden">
                <div className="bg-[#111] px-5 py-3 border-b border-[#1e1e1e] flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#C8F135]" />
                  <span className="font-mono text-[9px] text-[#555] uppercase tracking-widest">What FrameMind delivers</span>
                </div>
                <div className="p-5 flex flex-col gap-3">
                  {framemindJove.map((item) => (
                    <div key={item} className="flex items-start gap-3">
                      <span className="text-[#C8F135] text-xs mt-0.5 shrink-0 font-black leading-none">→</span>
                      <p className="text-sm text-[#888] leading-relaxed">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Curriculum alignment ── */}
        <section className="border-b border-border">
          <div className="max-w-6xl mx-auto px-6 py-16 md:py-20">
            <SectionLabel>04 · Curriculum Alignment</SectionLabel>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1">
                <h2 className="text-3xl font-bold tracking-tight mb-4">Built for Indian schools.</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Every JOVE program is aligned with Indian educational frameworks — so the day isn't an elective detour but a recognised part of the learning calendar.
                </p>
              </div>
              <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-px bg-border border border-border rounded-sm overflow-hidden">
                {["CBSE", "ICSE", "State Boards", "NEP 2020"].map((board) => (
                  <div key={board} className="bg-background px-4 py-6 flex flex-col items-center justify-center text-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#C8F135]" />
                    <span className="text-sm font-bold tracking-tight">{board}</span>
                    <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest">Aligned</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="bg-[#0D0D0D]">
          <div className="max-w-6xl mx-auto px-6 py-16 md:py-24">
            <div className="max-w-2xl">
              <span className="font-mono text-[10px] text-[#555] uppercase tracking-[0.2em] mb-4 block">Book a Workshop</span>
              <h2 className="text-4xl md:text-5xl font-black text-[#F5F4F0] tracking-tight leading-none mb-5">
                Bring JOVE to<br />your school.
              </h2>
              <p className="text-sm text-[#666] leading-relaxed mb-8 max-w-lg">
                One message is all it takes. Tell us your school name, approximate student count by grade, and a preferred date — we will take it from there.
              </p>
              <div className="flex flex-wrap gap-3">
                <a
                  href="https://jove.website"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-[#C8F135] text-[#0D0D0D] px-6 py-3 text-sm font-bold rounded-sm hover:bg-[#b8e020] transition-colors"
                >
                  Visit jove.website <ArrowUpRight size={14} />
                </a>
                <Link
                  to="/connect"
                  className="inline-flex items-center gap-2 border border-[#2a2a2a] text-[#888] px-6 py-3 text-sm font-medium rounded-sm hover:border-[#444] hover:text-[#bbb] transition-colors"
                >
                  Contact FrameMind <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </div>
        </section>

      </div>
    </>
  );
}
