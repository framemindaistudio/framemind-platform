"use client";

import { ArrowUpRight, Check } from "lucide-react";
import { useRates } from "@/components/hq/data";
import { Loading } from "@/components/hq/ui";
import { site } from "@/lib/site";
import { BackCover, BookletShell, C, Cover, H2, Hi, Inside, Kicker, type BookletMode } from "./Booklet";

/**
 * The studio profile booklet: who FrameMind is, what it does, how a project runs, real work, the FrameMind family
 * and the founder. Every line comes from the website (Home, Team, Testimonials, Vritta, JOVE, 360VUE) and the
 * Rate Card's service descriptions — nothing here is a new claim.
 */

/** The website's "What we do" outcomes (Home). */
const OUTCOMES: Record<string, string> = {
  websites: "Your business looks credible before you say a word.",
  brand: "Your brand works without you having to explain it.",
  software: "A tool built exactly for how your business works.",
  automations: "10+ hours a week back — without hiring anyone.",
};

/** How a project runs (Home → "From first message to final delivery"). */
const STEPS = [
  ["Tell us what you're building", "A 20-minute call. No decks, no proposals. Just a direct conversation about what you need and whether we're the right fit."],
  ["We scope it honestly", "You get a clear scope, timeline, and price. No vague retainers. No hidden costs. If it can't be done well in your budget, we'll say so."],
  ["We build — you stay in the loop", "Daily or weekly updates depending on project length. You see real progress, not just a Notion board."],
  ["Shipped. Then supported.", "Delivery isn't the end. We stick around for handover, training, and follow-up — so the work actually gets used."],
] as const;

/** What the studio makes (Home marquee). */
const MAKES = ["Websites", "Brand Systems", "Custom Software", "Automations", "AI Coaching", "Digital Products", "UI / UX Design", "Notion Systems", "Pitch Decks", "School Programs", "Startup Tools"];

/** How the team works (Team page). */
const PRINCIPLES = [
  ["Founder-led, always", "Every project is owned by someone who cares about outcomes — not passed down a chain."],
  ["Small team, full depth", "We stay lean by design. Every person on this team does real, irreplaceable work."],
  ["Built to grow right", "We add people when the work demands it — not to look bigger. Quality over headcount."],
  ["One studio, one standard", "Whether you are the first client or the fiftieth, the standard does not change."],
] as const;

/** Client words (Testimonials page). */
const QUOTES = [
  {
    quote: "FrameMind built us a website that truly represents our business — clean, professional, and exactly what our clients expect from a trusted timber merchant. We started receiving enquiries through the site almost immediately after it went live.",
    name: "Shivaprasad Reddy S S",
    role: "Proprietor, Trinetra Timber Traders, Ilkal, Karnataka",
  },
  {
    quote: "We needed a platform that could handle a wide range of deals and listings without feeling cluttered or overwhelming. FrameMind delivered something sharp and easy to navigate — exactly what a deals marketplace needs to convert browsers into buyers.",
    name: "SmartDeal A2Z",
    role: "Founding Team, smartdeala2z.com",
  },
];

/** The FrameMind family (the Vritta, JOVE and 360VUE pages). */
const FAMILY = [
  {
    name: "Vritta",
    tag: "Software for schools & colleges",
    body: "A departmental activity record platform for schools and colleges that produces the institution's newsletter as a by-product. NAAC evidence, auto-composed newsletters, 4-week go-live.",
    url: "framemindaistudio.com/vritta",
  },
  {
    name: "JOVE",
    tag: "Co-founded venture",
    body: "Full-day robotics, AI and machine learning workshops delivered to school campuses across India for Grades 1–10. FrameMind documents every JOVE event.",
    url: "jove.website",
  },
  {
    name: "360VUE",
    tag: "A FrameMind AI Studio company",
    body: "360° virtual tours, SkyVUE drone 360° aerial views and Google Maps listings for restaurants, hotels, showrooms, hospitals, colleges and real estate across South India.",
    url: "360vue.website",
  },
];

export function StudioBooklet({ mode, preparedFor }: { mode: BookletMode; preparedFor?: string }) {
  const rates = useRates();
  if (!rates) return <Loading label="Loading the services…" />;
  const founder = site.founders[0];
  const services = rates.services;

  const pages: ((n: number) => React.ReactNode)[] = [
    // 1 — cover
    () => (
      <Cover
        kicker="Studio profile"
        title={
          <>
            We build what founders need,
            <br />
            <span style={{ color: C.lime }}>actually shipped.</span>
          </>
        }
        titlePt={40}
        sub="A design & software studio: websites, brand systems, custom software, automations, photography, video, social media and 1:1 AI coaching — under one roof, delivered in-house."
        chips={["Design", "Software", "AI", "Media"]}
        preparedFor={preparedFor}
      />
    ),
    // 2 — who we are
    (n) => (
      <Inside n={n} section="Who we are">
        <Kicker>Design & software studio</Kicker>
        <H2 pt={28}>
          Everything your business needs. <Hi>Under one roof.</Hi>
        </H2>
        <p className="mt-[4mm] max-w-[165mm] text-[11pt] leading-[1.6]" style={{ opacity: 0.75 }}>
          A small, senior team of designers, developers, and strategists who handle every project from brief to launch.
        </p>

        <div className="mt-[8mm] grid grid-cols-3 gap-[4mm]">
          {[
            ["100%", "In-house delivery"],
            ["3+", "Years of studio work"],
            [String(services.length + 1), "Services, one team"],
          ].map(([k, v]) => (
            <div key={v} className="rounded-[2.5mm] p-[5mm]" style={{ background: C.ink, color: C.paper }}>
              <p className="font-mono text-[24pt] font-bold leading-none" style={{ color: C.lime }}>{k}</p>
              <p className="mt-[2.5mm] text-[10pt]" style={{ color: "rgba(245,244,240,0.75)" }}>{v}</p>
            </div>
          ))}
        </div>

        <div className="mt-[8mm] flex items-center gap-[5mm] rounded-[2.5mm] border p-[5mm]" style={{ borderColor: C.line, background: C.white }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/site/msme-logo.png" alt="MSME" className="h-[16mm] w-auto" loading="eager" />
          <div>
            <p className="text-[12pt] font-semibold">MSME Registered Studio</p>
            <p className="text-[9.5pt]" style={{ opacity: 0.6 }}>Govt. of India · Ministry of MSME</p>
          </div>
        </div>

        <div className="mt-[8mm]">
          <Kicker>What we make</Kicker>
          <div className="mt-[4mm] flex flex-wrap gap-[2.5mm]">
            {MAKES.map((m) => (
              <span key={m} className="rounded-full border px-[4mm] py-[1.8mm] text-[11pt] font-semibold" style={{ borderColor: C.ink }}>
                {m}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-auto grid grid-cols-2 gap-x-[6mm] gap-y-[6mm] pt-[8mm]">
          {PRINCIPLES.map(([t, d], i) => (
            <div key={t} className="border-t pt-[3mm]" style={{ borderColor: C.ink }}>
              <p className="font-mono text-[8pt] font-semibold" style={{ opacity: 0.5 }}>{String(i + 1).padStart(2, "0")}</p>
              <p className="mt-[1mm] text-[12.5pt] font-semibold">{t}</p>
              <p className="mt-[1mm] text-[10.5pt] leading-[1.5]" style={{ opacity: 0.68 }}>{d}</p>
            </div>
          ))}
        </div>
      </Inside>
    ),
    // 3 — what we do
    (n) => (
      <Inside n={n} section="What we do" dark>
        <Kicker light>Services</Kicker>
        <H2 dark>
          One studio, <Hi dark>every layer.</Hi>
        </H2>
        <div className="mt-[7mm] grid flex-1 auto-rows-fr grid-cols-2 gap-[4mm]">
          {services.map((s, i) => (
            <div key={s.id} className="flex flex-col rounded-[2.5mm] border p-[5.5mm]" style={{ borderColor: C.lineDark, background: C.night }}>
              <p className="font-mono text-[8.5pt]" style={{ color: C.lime }}>{String(i + 1).padStart(2, "0")} · {s.short}</p>
              <p className="mt-[2mm] text-[15pt] font-semibold leading-tight">{s.name}</p>
              <p className="mt-auto pt-[3mm] text-[10pt] leading-[1.5]" style={{ color: "rgba(245,244,240,0.7)" }}>{OUTCOMES[s.id] ?? s.description}</p>
            </div>
          ))}
          <div className="flex flex-col rounded-[2.5mm] border p-[5.5mm]" style={{ borderColor: C.lime, background: C.night }}>
            <p className="font-mono text-[8.5pt]" style={{ color: C.lime }}>{String(services.length + 1).padStart(2, "0")} · Ages 10–60 · Online & Offline</p>
            <p className="mt-[2mm] text-[15pt] font-semibold leading-tight">1:1 AI Coaching</p>
            <p className="mt-auto pt-[3mm] text-[10pt] leading-[1.5]" style={{ color: "rgba(245,244,240,0.7)" }}>AI fluency built around your life — in 90 days. Not a course: a 1:1 coach, every session.</p>
          </div>
        </div>
      </Inside>
    ),
    // 4 — how we work
    (n) => (
      <Inside n={n} section="How we work">
        <Kicker>From first message to final delivery</Kicker>
        <H2>
          Four steps. <Hi>No surprises.</Hi>
        </H2>
        <div className="mt-[7mm] grid flex-1 auto-rows-fr gap-[4mm]">
          {STEPS.map(([t, d], i) => (
            <div key={t} className="grid grid-cols-[22mm_1fr] items-center gap-[4mm] rounded-[2.5mm] border p-[6mm]" style={{ borderColor: C.line, background: C.white }}>
              <p className="font-mono text-[34pt] font-bold leading-none">{i + 1}</p>
              <div>
                <p className="text-[15pt] font-semibold">{t}</p>
                <p className="mt-[2mm] text-[11pt] leading-[1.55]" style={{ opacity: 0.7 }}>{d}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-[7mm] rounded-[2.5mm] p-[5.5mm]" style={{ background: C.ink, color: C.paper }}>
          <Kicker light>With every website</Kicker>
          <div className="mt-[3mm] grid grid-cols-2 gap-x-[5mm] gap-y-[1.6mm]">
            {(services.find((s) => s.id === "websites")?.included ?? []).map((t) => (
              <p key={t} className="flex items-start gap-[1.6mm] text-[9.5pt]">
                <Check className="mt-[0.4mm] size-[3.4mm] shrink-0" style={{ color: C.lime }} strokeWidth={2.6} /> {t}
              </p>
            ))}
          </div>
        </div>
      </Inside>
    ),
    // 5 — work
    (n) => (
      <Inside n={n} section="Our work">
        <Kicker>Real projects. Real results.</Kicker>
        <div className="relative mt-[5mm] min-h-[78mm] flex-1 overflow-hidden rounded-[2.5mm]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/site/jagkalyan-mission.jpg" alt="JagKalyan Holistic Mission website" className="absolute inset-0 h-full w-full object-cover object-top" loading="eager" />
        </div>
        <div className="mt-[5mm] rounded-[2.5mm] p-[5.5mm]" style={{ background: C.ink, color: C.paper }}>
          <p className="font-mono text-[8pt] uppercase tracking-[0.2em]" style={{ color: C.lime }}>Case study · Website</p>
          <p className="mt-[2mm] text-[16pt] font-semibold leading-tight">JagKalyan Holistic Mission</p>
          <p className="mt-[2mm] text-[9.5pt] leading-[1.5]" style={{ color: "rgba(245,244,240,0.72)" }}>
            A registered NGO with a mission spanning self, society, nation, and humanity — built a digital presence worthy of its 500-acre Wisdom City vision and nine-shala Academy.
          </p>
        </div>
        <div className="mt-[5mm] grid grid-cols-2 gap-[4mm]">
          {QUOTES.map((q) => (
            <figure key={q.name} className="rounded-[2.5mm] border p-[5mm]" style={{ borderColor: C.line, background: C.white }}>
              <p className="font-mono text-[22pt] leading-none" style={{ color: C.ink }}>“</p>
              <blockquote className="text-[10pt] leading-[1.55]" style={{ opacity: 0.8 }}>{q.quote}</blockquote>
              <figcaption className="mt-[3mm] border-t pt-[2.5mm]" style={{ borderColor: C.line }}>
                <p className="text-[10pt] font-semibold">{q.name}</p>
                <p className="text-[8.5pt]" style={{ opacity: 0.6 }}>{q.role}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </Inside>
    ),
    // 6 — the FrameMind family
    (n) => (
      <Inside n={n} section="The FrameMind family" dark>
        <Kicker light>Ventures & products</Kicker>
        <H2 dark>
          More than <Hi dark>a studio.</Hi>
        </H2>
        <p className="mt-[3mm] max-w-[165mm] text-[10.5pt] leading-[1.55]" style={{ color: "rgba(245,244,240,0.7)" }}>
          The same team builds its own products and ventures — and puts the studio&apos;s work into them.
        </p>
        <div className="mt-[7mm] grid flex-1 auto-rows-fr gap-[4mm]">
          {FAMILY.map((f) => (
            <div key={f.name} className="flex flex-col rounded-[2.5mm] border p-[7mm]" style={{ borderColor: C.lineDark, background: C.night }}>
              <div className="flex items-baseline justify-between gap-[4mm]">
                <p className="text-[26pt] font-semibold tracking-[-0.02em]">{f.name}</p>
                <p className="font-mono text-[8pt] uppercase tracking-[0.18em]" style={{ color: C.lime }}>{f.tag}</p>
              </div>
              <p className="mt-[3mm] text-[11.5pt] leading-[1.55]" style={{ color: "rgba(245,244,240,0.72)" }}>{f.body}</p>
              <p className="mt-auto flex items-center gap-[1.2mm] pt-[3mm] font-mono text-[9pt]" style={{ color: C.lime }}>
                {f.url} <ArrowUpRight className="size-[3.2mm]" />
              </p>
            </div>
          ))}
        </div>
      </Inside>
    ),
    // 7 — founder
    (n) => (
      <Inside n={n} section="The founder">
        <div className="grid grid-cols-[88mm_1fr] gap-[7mm]">
          <div className="relative h-[150mm] overflow-hidden rounded-[2.5mm]" style={{ background: C.ink }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/site/chinmay-portrait.jpg" alt={founder.name} className="absolute inset-0 h-full w-full object-cover" loading="eager" />
          </div>
          <div className="flex flex-col justify-end">
            <Kicker>{founder.role}</Kicker>
            <H2 pt={30}>{founder.name}</H2>
            <p className="mt-[2mm] font-mono text-[8.5pt] uppercase tracking-[0.14em]" style={{ opacity: 0.6 }}>{founder.focus}</p>
            <p className="mt-[4mm] text-[11.5pt] leading-[1.6]" style={{ opacity: 0.78 }}>{founder.bio}</p>
          </div>
        </div>
        <div className="mt-auto rounded-[2.5mm] p-[7mm]" style={{ background: C.ink, color: C.paper }}>
          <Kicker light>From the first brief to the final handover</Kicker>
          <div className="mt-[5mm] grid grid-cols-2 gap-x-[6mm] gap-y-[5mm]">
            {STEPS.map(([t, d]) => (
              <div key={t}>
                <p className="text-[12pt] font-semibold" style={{ color: C.lime }}>{t}</p>
                <p className="mt-[1.2mm] text-[10pt] leading-[1.5]" style={{ color: "rgba(245,244,240,0.7)" }}>{d.split(". ")[0]}.</p>
              </div>
            ))}
          </div>
        </div>
      </Inside>
    ),
    // 8 — back cover
    () => (
      <BackCover
        kicker="Start a project"
        headline={
          <>
            Tell us what
            <br />
            <span style={{ color: C.lime }}>you&apos;re building.</span>
          </>
        }
        line="Scan the code to write to us, or call or WhatsApp. One message is all it takes."
        steps={STEPS.slice(0, 3).map(([t, d]) => [t, d.split(". ")[0] + "."])}
        qrPath="/connect"
        qrLabel="Start a project"
      />
    ),
  ];

  return <BookletShell title="Studio profile booklet" mode={mode} pages={pages} />;
}
