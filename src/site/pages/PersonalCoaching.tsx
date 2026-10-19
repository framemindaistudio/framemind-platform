"use client";

import { useState } from "react";
import { ArrowRight, Brain, Briefcase, GraduationCap, Heart, Sparkles, ChevronDown, CheckCircle2, Clock, User, Zap, BookOpen, Target, X } from "lucide-react";
const founderPhoto = "/site/chinmay-portrait.jpg";
import SEO from "@/site/components/SEO";

// ─── Data ─────────────────────────────────────────────────────────────────────

const ageGroups = [
  {
    id: "10-20",
    range: "Ages 10 – 20",
    tag: "Students & Young Learners",
    accent: "#C8F135",
    accentText: "#0D0D0D",
    icon: GraduationCap,
    headline: "Build your future before everyone else figures out what AI even is.",
    subline:
      "You have the biggest advantage: time. Learn to use AI for studies, projects, competitive exams, coding, creativity — and graduate into the world already ahead of it.",
    useCases: [
      "Ace competitive exams using AI study tools",
      "Build projects that stand out in college applications",
      "Automate assignments and research — ethically",
      "Learn coding and AI together, not separately",
      "Use AI for creative work — art, writing, music, design",
      "Build a portfolio that proves you know the future",
    ],
    highlight: "We teach you how to think with AI, not just click through tools — a skill no school currently teaches.",
    personas: ["School students", "College students", "Competitive exam aspirants", "Young creators & coders"],
  },
  {
    id: "21-35",
    range: "Ages 21 – 35",
    tag: "Working Professionals & Entrepreneurs",
    accent: "#0D0D0D",
    accentText: "#C8F135",
    icon: Briefcase,
    headline: "The most productive version of you exists on the other side of AI fluency.",
    subline:
      "You're already capable. AI makes you 10x faster, 10x sharper — without switching careers. Learn to use it for your exact job, your real workflows, your actual deliverables.",
    useCases: [
      "Automate your most repetitive work tasks",
      "Use AI for reporting, analysis, and presentations",
      "Build internal tools without knowing how to code",
      "Write better — emails, proposals, content, copy",
      "Use AI for business research and competitive intelligence",
      "Launch or scale a side project using AI leverage",
    ],
    highlight: "We don't teach generic tools. We map AI to your profession — whether you're a lawyer, designer, marketer, doctor, or founder.",
    personas: ["Corporate professionals", "Freelancers", "Startup founders", "Side-project builders"],
  },
  {
    id: "36-60",
    range: "Ages 36 – 60",
    tag: "Experienced Professionals & Leaders",
    accent: "#C8F135",
    accentText: "#0D0D0D",
    icon: Heart,
    headline: "Your experience is the asset. AI is the multiplier.",
    subline:
      "You've spent decades building expertise. AI won't replace that — it amplifies it. Learn to lead with AI, delegate to it, and use it to do more of what only you can do.",
    useCases: [
      "Use AI to make better, faster decisions",
      "Delegate research, drafting, and analysis to AI",
      "Understand AI enough to lead teams using it",
      "Stay relevant without reinventing your career",
      "Use AI for personal productivity and life organization",
      "Learn to evaluate and use AI tools confidently",
    ],
    highlight: "No jargon. No overwhelm. We start with where you are, what you do every day, and build from there — at your pace.",
    personas: ["Senior professionals", "Business owners", "Department heads", "Educators & consultants"],
  },
];

const whyWorks = [
  {
    icon: User,
    title: "Starts with you, not a syllabus",
    desc: "Before session one, we map your profession, your daily work, your goals, and what you already know. Everything is built around that — nothing generic.",
  },
  {
    icon: Target,
    title: "Applied to your real life",
    desc: "You practice on your actual work — your emails, your reports, your projects, your clients. Not toy examples. Not demo data.",
  },
  {
    icon: Zap,
    title: "Tangible results by week 2",
    desc: "Most learners report saving 2–5 hours per week by session 4. The goal isn't to finish the course — it's to start seeing returns immediately.",
  },
  {
    icon: Clock,
    title: "90 days — because that's all it takes",
    desc: "Research shows that consistent focused practice over 90 days is enough to build genuine fluency in any new skill — even from zero. We've structured everything around that.",
  },
  {
    icon: Brain,
    title: "1-on-1, always",
    desc: "No cohorts, no group calls, no recordings from 2022. Every session is live with your coach, focused on your questions, your blockers, your next steps.",
  },
  {
    icon: BookOpen,
    title: "Personalized curriculum — not a template",
    desc: "Your curriculum doesn't exist until we build it for you. A lawyer's 90 days looks completely different from a student's or a founder's.",
  },
];

const formats = [
  {
    type: "Online",
    desc: "1-on-1 live video sessions. Join from anywhere — your home, office, or anywhere with a connection. Sessions are recorded for your reference.",
    perks: ["Flexible scheduling — morning, evening, or weekend", "Sessions via Google Meet or Zoom", "Recordings shared after every session", "WhatsApp/email support between sessions"],
  },
  {
    type: "Offline",
    desc: "In-person coaching at a FrameMind venue or at your home/office (location-dependent). Best for learners who prefer face-to-face mentorship.",
    perks: ["Face-to-face sessions with your coach", "Available in select cities — Pune, Mumbai, Delhi, Bangalore", "We come to you (home/office) for select plans", "Printed resources and session notes provided"],
  },
];

// ─── Curriculum Modal ─────────────────────────────────────────────────────────

function CurriculumModal({ group, onClose }: { group: typeof ageGroups[0]; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0D0D0D]/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-background border border-border rounded-sm max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-background border-b border-border px-5 sm:px-8 py-4 sm:py-5 flex items-center justify-between">
          <div>
            <p className="font-mono text-xs text-muted-foreground uppercase tracking-widest mb-1">Curriculum · {group.range}</p>
            <h3 className="font-semibold text-lg">How we build your personal plan</h3>
          </div>
          <button onClick={onClose} className="p-2 rounded-sm hover:bg-secondary transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="px-5 sm:px-8 py-6 sm:py-8 flex flex-col gap-6 sm:gap-8">
          {/* Why no template */}
          <div className="bg-[#C8F135]/10 border border-[#C8F135]/30 rounded-sm p-6">
            <p className="font-mono text-xs text-muted-foreground uppercase tracking-widest mb-2">Why there is no standard curriculum</p>
            <p className="text-sm leading-relaxed text-foreground">
              A doctor using AI for clinical notes has completely different needs than a CA using it for compliance research, or a college student using it for JEE prep. A single template would serve none of them well. So we don't have one. Your curriculum is built in session one, and refined every week based on what you need next.
            </p>
          </div>

          {/* How it's built */}
          <div>
            <p className="font-mono text-xs text-muted-foreground uppercase tracking-widest mb-5">How your plan is built</p>
            <div className="flex flex-col gap-4">
              {[
                {
                  step: "Week 1–2",
                  title: "Profiling & Foundation",
                  desc: `We map your profession, your daily tasks, your existing tech comfort, and your specific goals for the next 90 days. For ${group.range}: ${
                    group.id === "10-20"
                      ? "this means understanding your current grade/course, exam targets, creative interests, and what kind of work or projects matter most to you."
                      : group.id === "21-35"
                      ? "this means auditing your actual job or business — what you spend time on, what slows you down, what would have the biggest impact if it were faster."
                      : "this means understanding your role, your decision-making process, and where your attention currently goes — so AI handles the parts that don't need you."
                  } Foundation AI concepts are introduced only as needed.`,
                },
                {
                  step: "Week 3–6",
                  title: "Applied Learning — Your Work, Your Tools",
                  desc: `This is where 70% of the coaching happens. We pick the 8–12 AI tools and workflows most relevant to your specific context and go deep on each one. Every session uses your actual work as the practice material — not dummy examples. ${
                    group.id === "10-20"
                      ? "Students work on their own assignments, projects, and study materials."
                      : group.id === "21-35"
                      ? "Professionals work on their own emails, reports, client work, and deliverables."
                      : "Leaders work on their own briefs, decisions, team communications, and strategy documents."
                  }`,
                },
                {
                  step: "Week 7–10",
                  title: "Building Systems & Habits",
                  desc: "We shift from learning tools to building repeatable systems. You end this phase with workflows, prompts, and routines that run on autopilot — so your AI skills don't fade once coaching ends.",
                },
                {
                  step: "Week 11–13",
                  title: "Mastery & Independence",
                  desc: "Final phase focuses on making you self-sufficient: evaluating new AI tools on your own, adapting your workflows as AI evolves, and handling edge cases without needing a coach. You leave genuinely fluent — not dependent.",
                },
              ].map((s) => (
                <div key={s.step} className="flex gap-5 border border-border rounded-sm p-5">
                  <div className="shrink-0">
                    <span className="font-mono text-xs bg-[#0D0D0D] text-[#C8F135] px-2.5 py-1 rounded-sm">{s.step}</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm mb-1.5">{s.title}</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Personalization note */}
          <div className="border-t border-border pt-6">
            <p className="text-xs text-muted-foreground leading-relaxed">
              <span className="font-medium text-foreground">Note:</span> Because this is truly personalized, there is no PDF to download — the curriculum document is built with you in session one and evolves throughout. Contact us to discuss your specific situation before enrolling.
            </p>
          </div>

          <a
            href="/connect"
            className="bg-[#C8F135] text-[#0D0D0D] text-sm font-semibold px-6 py-3.5 rounded-sm hover:bg-[#b8e020] transition-colors flex items-center justify-center gap-2"
          >
            Contact Founder — Discuss Your Plan <ArrowRight size={14} />
          </a>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PersonalCoaching() {
  const [activeGroup, setActiveGroup] = useState("21-35");
  const [curriculumGroup, setCurriculumGroup] = useState<typeof ageGroups[0] | null>(null);

  const selectedGroup = ageGroups.find((g) => g.id === activeGroup)!;
  const Icon = selectedGroup.icon;

  return (
    <div>
      <SEO
        title="1-on-1 AI Personal Coaching — Learn AI in 90 Days"
        description="FrameMind Studio's AI personal coaching — tailored for ages 10 to 60. Build real AI skills through structured, one-on-one sessions. Available online and offline across India."
        path="/personal-coaching"
        keywords="AI coaching India, learn artificial intelligence India, AI training for beginners, one on one AI tutor India, AI course students India, AI for professionals India, FrameMind coaching"
        ogImageAlt="FrameMind AI Studio — 1:1 AI Personal Coaching, Learn AI in 90 Days"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Course",
          "name": "1-on-1 AI Personal Coaching",
          "description": "Tailored one-on-one AI coaching for ages 10–60. Build real AI skills in 90 days through structured sessions, available online and offline across India.",
          "provider": { "@type": "Organization", "name": "FrameMind AI Studio", "url": "https://www.framemindaistudio.com" },
          "courseMode": ["online", "offline"],
          "educationalLevel": "Beginner to Advanced",
          "inLanguage": ["en", "kn", "hi"],
          "offers": {
            "@type": "Offer",
            "priceCurrency": "INR",
            "availability": "https://schema.org/InStock",
            "url": "https://www.framemindaistudio.com/personal-coaching",
          },
        }}
      />
      {/* ── Hero ── */}
      <section className="relative bg-[#0D0D0D] overflow-hidden">
        {/* Founder photo — right side, barely visible */}
        <div className="absolute inset-y-0 right-0 w-1/2 pointer-events-none">
          <img
            src={founderPhoto}
            alt=""
            aria-hidden="true"
            className="absolute bottom-0 right-0 h-full w-auto object-contain object-bottom opacity-[0.08]"
            style={{ maskImage: "linear-gradient(to right, transparent 0%, #000 40%)", WebkitMaskImage: "linear-gradient(to right, transparent 0%, #000 40%)" }}
          />
          {/* Fade edges */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#0D0D0D] via-transparent to-[#0D0D0D]/60" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D0D] via-transparent to-[#0D0D0D]/20" />
        </div>

        <div className="max-w-6xl mx-auto px-6 pt-16 md:pt-24 pb-16 md:pb-20 relative">
          {/* Label */}
          <div className="flex items-center gap-3 mb-6">
            <span className="font-mono text-xs text-[#C8F135] uppercase tracking-widest">1:1 Personal Coaching</span>
            <span className="w-6 h-px bg-[#C8F135]/40" />
            <span className="font-mono text-xs text-[#555] uppercase tracking-widest">AI & ML · All Ages</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-semibold text-[#F5F4F0] tracking-tight leading-[1.0] mb-6 max-w-4xl">
            Learn AI completely.{" "}
            <span className="text-[#C8F135]">In 90 days.</span>
            <br />
            Starting from zero.
          </h1>

          {/* Tagline */}
          <div className="flex items-start gap-4 mb-10 max-w-2xl">
            <div className="shrink-0 mt-1 w-5 h-5 rounded-full bg-[#C8F135] flex items-center justify-center">
              <Sparkles size={10} className="text-[#0D0D0D]" />
            </div>
            <p className="text-base text-[#888] leading-relaxed">
              Research has proven that with consistent, focused practice, you can achieve genuine fluency in any new skill within 90 days — even if you are starting with absolutely zero prior knowledge. We have built the entire coaching structure around exactly that.
            </p>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap gap-x-8 sm:gap-x-12 gap-y-5 mb-10 md:mb-12">
            {[
              { n: "90", unit: "Days", label: "To full AI fluency" },
              { n: "1:1", unit: "", label: "Always personal, never group" },
              { n: "3", unit: "+", label: "Age-group tracks" },
              { n: "100%", unit: "", label: "Built around your profession" },
            ].map(({ n, unit, label }) => (
              <div key={label}>
                <div className="flex items-end gap-1 mb-1">
                  <span className="text-3xl font-semibold text-[#F5F4F0]">{n}</span>
                  <span className="text-[#C8F135] font-semibold text-lg mb-0.5">{unit}</span>
                </div>
                <p className="font-mono text-xs text-[#555] uppercase tracking-widest">{label}</p>
              </div>
            ))}
          </div>

          {/* CTAs */}
          <div className="flex flex-wrap gap-4">
            <a
              href="/connect"
              className="inline-flex items-center gap-2 bg-[#C8F135] text-[#0D0D0D] px-7 py-4 text-sm font-semibold rounded-sm hover:bg-[#b8e020] transition-colors"
            >
              Contact Founder <ArrowRight size={14} />
            </a>
            <a
              href="#age-groups"
              className="inline-flex items-center gap-2 border border-[#333] text-[#888] px-7 py-4 text-sm font-medium rounded-sm hover:border-[#555] hover:text-[#aaa] transition-colors"
            >
              Find your age group <ChevronDown size={14} />
            </a>
          </div>
        </div>
      </section>

      {/* ── Why this works ── */}
      <section className="border-t border-border">
        <div className="max-w-6xl mx-auto px-6 py-14 md:py-20">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10 md:mb-14">
            <div>
              <span className="font-mono text-xs text-muted-foreground uppercase tracking-widest mb-3 block">The Difference</span>
              <h2 className="text-3xl font-semibold tracking-tight max-w-xl leading-snug">
                Why 1:1 personalized coaching works when nothing else has.
              </h2>
            </div>
            <p className="text-sm text-muted-foreground max-w-xs leading-relaxed md:text-right">
              YouTube tutorials teach tools. We teach you to use AI for your specific life and work.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-border">
            {whyWorks.map(({ icon: IIcon, title, desc }) => (
              <div key={title} className="bg-background p-6 sm:p-8 hover:bg-secondary/50 transition-colors">
                <div className="w-10 h-10 bg-[#C8F135] rounded-sm flex items-center justify-center mb-5">
                  <IIcon size={17} className="text-[#0D0D0D]" />
                </div>
                <h3 className="font-semibold text-base mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Age Groups ── */}
      <section id="age-groups" className="border-t border-border bg-[#0D0D0D]">
        <div className="max-w-6xl mx-auto px-6 py-14 md:py-20">
          <div className="mb-8 md:mb-10">
            <span className="font-mono text-xs text-[#555] uppercase tracking-widest mb-3 block">Your Track</span>
            <h2 className="text-3xl font-semibold text-[#F5F4F0] tracking-tight">Coaching built for your age and context.</h2>
          </div>

          {/* Tab switcher */}
          <div className="flex flex-wrap gap-2 mb-10">
            {ageGroups.map((g) => {
              const GIcon = g.icon;
              const isActive = activeGroup === g.id;
              return (
                <button
                  key={g.id}
                  onClick={() => setActiveGroup(g.id)}
                  className={`flex items-center gap-2 px-5 py-3 text-sm font-medium rounded-sm border transition-all ${
                    isActive
                      ? "bg-[#C8F135] text-[#0D0D0D] border-[#C8F135]"
                      : "border-[#222] text-[#666] hover:text-[#aaa] hover:border-[#333]"
                  }`}
                >
                  <GIcon size={15} />
                  {g.range}
                </button>
              );
            })}
          </div>

          {/* Active group content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
            {/* Left: headline & uses */}
            <div>
              <div
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-sm mb-5 text-xs font-mono font-semibold uppercase tracking-widest"
                style={{ backgroundColor: selectedGroup.accent, color: selectedGroup.accentText }}
              >
                <Icon size={12} />
                {selectedGroup.tag}
              </div>
              <h3 className="text-2xl md:text-3xl font-semibold text-[#F5F4F0] tracking-tight mb-4 leading-snug">
                {selectedGroup.headline}
              </h3>
              <p className="text-sm text-[#888] leading-relaxed mb-8">{selectedGroup.subline}</p>

              {/* Use cases */}
              <div className="flex flex-col gap-3 mb-8">
                {selectedGroup.useCases.map((uc) => (
                  <div key={uc} className="flex items-start gap-3">
                    <CheckCircle2 size={16} className="text-[#C8F135] shrink-0 mt-0.5" />
                    <span className="text-sm text-[#aaa]">{uc}</span>
                  </div>
                ))}
              </div>

              {/* Curriculum button */}
              <button
                onClick={() => setCurriculumGroup(selectedGroup)}
                className="inline-flex items-center gap-2 border border-[#333] text-[#888] px-5 py-3 text-sm font-medium rounded-sm hover:border-[#C8F135] hover:text-[#C8F135] transition-colors"
              >
                <BookOpen size={14} />
                See How the Curriculum is Built
              </button>
            </div>

            {/* Right: highlight + personas + CTA */}
            <div className="flex flex-col gap-6">
              {/* Highlight */}
              <div className="border border-[#C8F135]/30 bg-[#C8F135]/5 rounded-sm p-6">
                <p className="font-mono text-xs text-[#C8F135] uppercase tracking-widest mb-3">The Highlight</p>
                <p className="text-sm text-[#ddd] leading-relaxed">{selectedGroup.highlight}</p>
              </div>

              {/* Personas */}
              <div className="border border-[#1a1a1a] bg-[#0a0a0a] rounded-sm p-6">
                <p className="font-mono text-xs text-[#555] uppercase tracking-widest mb-4">Who this is for</p>
                <div className="flex flex-wrap gap-2">
                  {selectedGroup.personas.map((p) => (
                    <span key={p} className="text-xs border border-[#2a2a2a] text-[#666] px-3 py-1.5 rounded-sm">
                      {p}
                    </span>
                  ))}
                </div>
              </div>

              {/* Delivery */}
              <div className="grid grid-cols-2 gap-3">
                {formats.map((f) => (
                  <div key={f.type} className="border border-[#1a1a1a] rounded-sm p-5">
                    <p className="font-mono text-xs text-[#555] uppercase tracking-widest mb-1">{f.type}</p>
                    <p className="text-xs text-[#666] leading-relaxed">{f.desc.split(".")[0]}.</p>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <a
                href="/connect"
                className="bg-[#C8F135] text-[#0D0D0D] px-6 py-4 text-sm font-semibold rounded-sm hover:bg-[#b8e020] transition-colors flex items-center justify-center gap-2"
              >
                Get a Custom Quote <ArrowRight size={14} />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── Delivery formats ── */}
      <section className="border-t border-border">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="mb-12">
            <span className="font-mono text-xs text-muted-foreground uppercase tracking-widest mb-3 block">Delivery</span>
            <h2 className="text-3xl font-semibold tracking-tight">Online or Offline — both are truly 1:1.</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {formats.map((f) => (
              <div key={f.type} className="border border-border rounded-sm p-8 flex flex-col gap-6 bg-background hover:bg-secondary/30 transition-colors">
                <div>
                  <div className="w-10 h-10 bg-[#C8F135] rounded-sm flex items-center justify-center mb-4">
                    <span className="font-mono text-[10px] font-bold text-[#0D0D0D]">{f.type.slice(0, 3).toUpperCase()}</span>
                  </div>
                  <h3 className="font-semibold text-xl mb-2">{f.type} Coaching</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </div>
                <ul className="flex flex-col gap-2.5">
                  {f.perks.map((perk) => (
                    <li key={perk} className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#C8F135] shrink-0" />
                      {perk}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* Curriculum modal */}
      {curriculumGroup && (
        <CurriculumModal group={curriculumGroup} onClose={() => setCurriculumGroup(null)} />
      )}
    </div>
  );
}
