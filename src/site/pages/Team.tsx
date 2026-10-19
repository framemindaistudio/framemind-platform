"use client";

import { Link } from "@/site/router";
import { ArrowRight } from "lucide-react";
import SEO from "@/site/components/SEO";
import { ImageWithFallback } from "@/site/components/ImageWithFallback";
const chinmayPhoto = "/site/chinmay-portrait.jpg";
const shivaprasadPhoto = "/site/shivaprasad.jpg";

const team = [
  {
    name: "Chinmay R M",
    role: "Founder",
    tag: "Visionary · Builder · Strategist",
    bio: "Chinmay founded FrameMind AI Studio with one conviction — that great design and real software should be accessible to founders who are actually building something. He leads every project end-to-end, from the first brief to the final handover.",
    photo: chinmayPhoto,
    photoClass: "object-center",
    socials: { linkedin: "#", twitter: "#", instagram: "#" },
    accent: "#C8F135",
    badge: "Founder",
  },
  {
    name: "Shivaprasad Reddy S S",
    role: "Head of Business Development & Client Relations",
    tag: "Growth · Partnerships · Revenue",
    bio: "Shivaprasad drives FrameMind's growth engine — from identifying the right clients to building relationships that last well beyond the first project. He bridges the gap between studio capability and business opportunity, making sure every conversation turns into the right fit.",
    photo: shivaprasadPhoto,
    photoClass: "grayscale saturate-0 object-[25%_50%]",
    socials: { linkedin: "#", twitter: "#", instagram: "#" },
    accent: "#C8F135",
    badge: "Core Team",
  },
];

const values = [
  { n: "01", title: "Founder-led, always", body: "Every project is owned by someone who cares about outcomes — not passed down a chain." },
  { n: "02", title: "Small team, full depth", body: "We stay lean by design. Every person on this team does real, irreplaceable work." },
  { n: "03", title: "Built to grow right", body: "We add people when the work demands it — not to look bigger. Quality over headcount." },
  { n: "04", title: "One studio, one standard", body: "Whether you are the first client or the fiftieth, the standard does not change." },
];

export default function Team() {
  return (
    <div>
      <SEO
        title="Our Team — Designers, Developers & Strategists"
        description="Meet the people behind FrameMind Studio — a small, senior team of designers, developers, and strategists who handle every project from brief to launch."
        path="/team"
        keywords="FrameMind team, design studio team Karnataka, web developers India, UI UX designers India, FrameMind AI Studio founders"
        ogImageAlt="FrameMind AI Studio — Meet the Team"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "AboutPage",
          "name": "Our Team — FrameMind AI Studio",
          "description": "The designers, developers, and strategists behind FrameMind AI Studio.",
          "url": "https://www.framemindaistudio.com/team",
          "publisher": { "@type": "Organization", "name": "FrameMind AI Studio" },
        }}
      />
      {/* Header */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-12">
        <span className="font-mono text-xs text-muted-foreground uppercase tracking-widest mb-4 block">
          The Team
        </span>
        <h1 className="text-3xl md:text-5xl font-semibold tracking-tight mb-5 max-w-2xl leading-tight">
          The people behind<br className="hidden sm:block" /> the work.
        </h1>
        <p className="text-base text-muted-foreground leading-relaxed max-w-xl">
          FrameMind is a founder-led studio. Small by choice, deep by design. Every person here owns their craft fully.
        </p>
      </section>

      {/* Team grid */}
      <section className="border-t border-border">
        <div className="max-w-6xl mx-auto px-6 py-14 md:py-20 space-y-6">

          {/* ── Founder featured card ── */}
          {team[0] && (
            <div className="group relative bg-[#0D0D0D] border border-[#1e1e1e] rounded-sm overflow-hidden hover:border-[#C8F135]/25 transition-colors duration-500 flex flex-col md:flex-row">
              {/* Photo */}
              <div className="relative md:w-[38%] aspect-[4/5] md:aspect-auto overflow-hidden shrink-0">
                <ImageWithFallback
                  src={team[0].photo!}
                  alt={team[0].name}
                  className={`w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700 ${team[0].photoClass ?? "object-center"}`}
                />
                {/* Right-side fade into dark content area */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[#0D0D0D] hidden md:block" />
                {/* Bottom fade on mobile */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D0D]/80 via-transparent to-transparent md:hidden" />
                {/* Founder badge */}
                <div className="absolute top-5 left-5">
                  <span className="font-mono text-[10px] bg-[#C8F135] text-[#0D0D0D] px-3 py-1.5 rounded-sm uppercase tracking-[0.15em] font-black">
                    Founder
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="flex flex-col justify-center px-8 py-10 md:px-12 md:py-14 flex-1">
                <span className="font-mono text-[10px] text-[#C8F135] uppercase tracking-[0.2em] mb-3 block">
                  {team[0].tag}
                </span>
                <h2 className="text-4xl md:text-5xl font-bold text-[#F5F4F0] tracking-tight leading-none mb-3">
                  {team[0].name}
                </h2>
                <p className="text-sm text-[#C8F135] font-semibold uppercase tracking-widest mb-6">
                  {team[0].role}
                </p>
                <div className="w-10 h-[2px] bg-[#C8F135] mb-6 rounded-full" />
                <p className="text-sm text-[#777] leading-relaxed max-w-lg">
                  {team[0].bio}
                </p>
              </div>

              {/* Decorative corner accent */}
              <div className="absolute bottom-0 right-0 w-24 h-24 border-b-2 border-r-2 border-[#C8F135]/10 rounded-sm pointer-events-none" />
            </div>
          )}

          {/* ── Rest of team — compact equal cards ── */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {team.slice(1).map((member) => (
              <div
                key={member.name}
                className="group border border-border rounded-sm overflow-hidden bg-background hover:border-foreground/20 transition-colors duration-300 flex flex-col h-full"
              >
                {/* Photo */}
                <div className="relative aspect-[3/4] bg-[#0D0D0D] overflow-hidden shrink-0">
                  {member.photo ? (
                    <ImageWithFallback
                      src={member.photo}
                      alt={member.name}
                      className={`w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700 ${member.photoClass ?? "object-center"}`}
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                      <div className="w-16 h-16 rounded-full border-2 border-dashed border-[#2a2a2a] flex items-center justify-center">
                        <span className="font-mono text-2xl font-bold text-[#2a2a2a]">{member.name[0]}</span>
                      </div>
                    </div>
                  )}
                  <div className="absolute top-3 left-3">
                    <span className="font-mono text-[9px] bg-[#C8F135] text-[#0D0D0D] px-2 py-0.5 rounded-sm uppercase tracking-widest font-bold">
                      {member.badge}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 flex flex-col flex-1">
                  <h3 className="text-sm font-semibold tracking-tight leading-snug line-clamp-1 min-h-[1.25rem]">{member.name}</h3>
                  <p className="text-xs text-muted-foreground font-medium mt-0.5 leading-snug line-clamp-2 min-h-[2rem]">{member.role}</p>
                  <p className="font-mono text-[9px] text-muted-foreground/60 uppercase tracking-widest mt-1.5 mb-3 line-clamp-1 min-h-[1rem]">{member.tag}</p>
                  <div className="w-full h-px bg-border mb-3" />
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-5">{member.bio}</p>
                </div>
              </div>
            ))}

            {/* Open slot */}
            <div className="border border-dashed border-border rounded-sm p-5 flex flex-col items-center justify-center text-center hover:border-[#C8F135]/30 transition-colors duration-300 h-full">
              <div className="w-9 h-9 border border-dashed border-border rounded-sm flex items-center justify-center mb-3">
                <span className="text-xl text-muted-foreground font-light">+</span>
              </div>
              <p className="font-semibold text-xs mb-1">We are growing.</p>
              <p className="text-[11px] text-muted-foreground max-w-[160px] leading-relaxed mb-4">
                Could be you.
              </p>
              <Link
                to="/connect"
                className="inline-flex items-center gap-1.5 font-mono text-[9px] text-muted-foreground hover:text-foreground uppercase tracking-widest hover:underline underline-offset-4 transition-colors"
              >
                Say hello <ArrowRight size={10} />
              </Link>
            </div>
          </div>

        </div>
      </section>

      {/* Studio values strip */}
      <section className="border-t border-border bg-[#0D0D0D]">
        <div className="max-w-6xl mx-auto px-6 py-14 md:py-20">
          <div className="mb-10">
            <span className="font-mono text-xs text-[#555] uppercase tracking-widest mb-3 block">How we operate</span>
            <h2 className="text-2xl md:text-3xl font-semibold text-[#F5F4F0] tracking-tight">
              The way we work, defines the work we do.
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-[#1a1a1a] border border-[#1a1a1a]">
            {values.map((v) => (
              <div key={v.n} className="bg-[#0a0a0a] p-6 sm:p-8">
                <span className="font-mono text-3xl font-bold text-[#C8F135] block mb-4 leading-none">{v.n}</span>
                <h3 className="font-semibold text-[#F5F4F0] text-sm mb-2">{v.title}</h3>
                <p className="text-xs text-[#666] leading-relaxed">{v.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border bg-secondary">
        <div className="max-w-6xl mx-auto px-6 py-16 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight mb-1">Work with us.</h2>
            <p className="text-sm text-muted-foreground">Tell us what you're building — we'll tell you how we can help.</p>
          </div>
          <Link
            to="/connect"
            className="bg-[#C8F135] text-[#0D0D0D] px-6 py-3 text-sm font-semibold rounded-sm hover:bg-[#b8e020] transition-colors flex items-center gap-2"
          >
            Start a conversation <ArrowRight size={13} />
          </Link>
        </div>
      </section>
    </div>
  );
}
