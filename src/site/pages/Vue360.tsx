"use client";

import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Link } from "@/site/router";
import SEO from "@/site/components/SEO";

/*
 * 360VUE — a FrameMind AI Studio company. Every line here comes from 360VUE's own website (360vue.website, /about and
 * its services); prices are left to 360VUE's own price calculator, which is always current.
 */

const SITE = "https://www.360vue.website";

// ─── Data ─────────────────────────────────────────────────────────────────────

const services = [
  {
    num: "01",
    title: "360° Virtual Tour",
    desc: "A 360° tour of your space that customers open on their phone: they walk from room to room, tap points for details, and call or WhatsApp you from inside the tour. Published on Google Maps and shared as one link.",
    highlight: true,
  },
  {
    num: "02",
    title: "SkyVUE Aerial 360°",
    desc: "A drone 360° of your property from up to 120 m, with nearby places labelled with distances. Tap a building or amenity and its own 360° opens. On its own, or with your ground tour in one link.",
  },
  {
    num: "03",
    title: "3D & Immersive",
    desc: "Measured floor plans, virtual showrooms with shoppable product tags, 3D dollhouse walkthroughs and digital twins for commercial spaces. Scoped after a site visit.",
  },
  {
    num: "04",
    title: "Hosting & Care",
    desc: "Every tour includes 12 months of hosting. After that, keep it online, with updates and visitor stats if you like. Your Google Maps listing stays live either way.",
  },
];

const pillars = ["360° Virtual Tours", "SkyVUE Aerial 360°", "Google Maps Publishing", "3D & Digital Twins"];

const forWho = ["Restaurants", "Hotels", "Banquet halls", "Showrooms", "Hospitals", "Colleges", "Real estate"];

const values = [
  { title: "Premium", desc: "Every frame levelled, lit and checked. Cinematic, never cluttered." },
  { title: "Precise", desc: "A written scope, planned viewpoints and the same eight steps every time." },
  { title: "Respectful", desc: "Private areas stay private. People are asked, or removed." },
  { title: "Honest", desc: "No promised rankings, no invented numbers. What we say is in the quote." },
];

const founders = [
  { initials: "HK", name: "Hrishikesh Kulkarni", role: "Founder, 360VUE", focus: "Clients, capture & operations", bio: "Runs 360VUE day to day and is the person you meet: from the first call to the day your tour goes live." },
  { initials: "CR", name: "Chinmay R M", role: "Co-Founder, 360VUE · Founder, FrameMind AI Studio", focus: "Technology, brand & growth", bio: "Builds what sits behind every tour — the platform, the brand and the systems — with the FrameMind AI Studio team." },
];

const framemindDelivers = [
  "Photography: brand, product and event shoots",
  "Videography: brand films, reels and event videos",
  "Social media management",
  "Websites, brand identity and custom software",
  "Automations, AI and integrations",
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

export default function Vue360() {
  return (
    <>
      <SEO
        title="360VUE — 360° Virtual Tours, SkyVUE Aerial 360° & Google Maps"
        description="360VUE makes 360° virtual tours, SkyVUE drone 360° aerial views and Google Maps listings for restaurants, hotels, showrooms, hospitals, colleges and real estate across South India. A FrameMind AI Studio company."
        path="/360vue"
        keywords="360 virtual tour India, virtual tour Bengaluru, Google Maps 360 tour, drone 360 aerial view, SkyVUE, real estate virtual tour, hotel virtual tour, 360VUE, FrameMind 360VUE"
        ogImageAlt="360VUE — 360° Virtual Tours, a FrameMind AI Studio company"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "360VUE",
          url: SITE,
          description: "360° virtual tours, SkyVUE drone 360° aerial views, Google Maps publishing and 3D digital twins for businesses across South India.",
          parentOrganization: { "@type": "Organization", name: "FrameMind AI Studio", url: "https://www.framemindaistudio.com" },
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
              <span className="font-mono text-[10px] text-[#555] uppercase tracking-[0.2em]">A FrameMind AI Studio company</span>
            </div>

            <div className="max-w-4xl">
              <h1 className="text-6xl sm:text-7xl md:text-[96px] font-black text-[#F5F4F0] tracking-tight leading-none mb-3">360VUE</h1>
              <p className="font-mono text-sm text-[#C8F135] uppercase tracking-widest mb-6">See Every Angle. · Pronounced Three-Sixty View</p>
              <p className="text-lg md:text-xl text-[#888] leading-relaxed max-w-2xl mb-10">
                360VUE helps businesses present their physical spaces as interactive digital experiences — so customers can explore inside before they visit in person.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-[#1a1a1a] border border-[#1a1a1a] rounded-sm overflow-hidden mb-10">
                {pillars.map((p) => (
                  <div key={p} className="bg-[#0D0D0D] px-5 py-5 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#C8F135] shrink-0" />
                    <span className="text-sm font-bold text-[#F5F4F0] leading-snug">{p}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-3">
                <a href={SITE} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-[#C8F135] text-[#0D0D0D] px-6 py-3 text-sm font-bold rounded-sm hover:bg-[#b8e020] transition-colors">
                  Visit 360vue.website <ArrowUpRight size={14} />
                </a>
                <a href={`${SITE}/pricing`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 border border-[#2a2a2a] text-[#888] px-6 py-3 text-sm font-medium rounded-sm hover:border-[#444] hover:text-[#bbb] transition-colors">
                  See your price <ArrowUpRight size={14} />
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ── What 360VUE makes ── */}
        <section className="border-b border-border">
          <div className="max-w-6xl mx-auto px-6 py-16 md:py-20">
            <SectionLabel>01 · What 360VUE makes</SectionLabel>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight leading-snug mb-4">Real spaces. Real experiences.</h2>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-md">
                  For {forWho.slice(0, -1).join(", ").toLowerCase()} and {forWho[forWho.length - 1].toLowerCase()} across South India — Bengaluru, Chennai, Hyderabad, Kochi and beyond — and anywhere in India on request.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {services.map((s) => (
                <div key={s.num} className={`rounded-sm border overflow-hidden flex flex-col ${s.highlight ? "border-[#C8F135] bg-[#0D0D0D] shadow-[0_0_40px_rgba(200,241,53,0.08)]" : "border-border bg-background"}`}>
                  <div className={`px-5 pt-5 pb-4 border-b ${s.highlight ? "border-[#1e1e1e]" : "border-border"}`}>
                    <span className={`font-mono text-[9px] uppercase tracking-widest ${s.highlight ? "text-[#C8F135]" : "text-muted-foreground"}`}>{s.num}</span>
                    <h3 className={`mt-3 text-lg font-black tracking-tight ${s.highlight ? "text-[#F5F4F0]" : "text-foreground"}`}>{s.title}</h3>
                  </div>
                  <div className="px-5 py-4 flex-1">
                    <p className={`text-xs leading-relaxed ${s.highlight ? "text-[#777]" : "text-muted-foreground"}`}>{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Approach ── */}
        <section className="border-b border-border bg-secondary/30">
          <div className="max-w-6xl mx-auto px-6 py-16 md:py-20">
            <SectionLabel>02 · The approach</SectionLabel>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
              <div className="lg:col-span-1">
                <h2 className="text-3xl font-bold tracking-tight mb-4">Capture. Process. Connect. Deliver.</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Careful on-site capture, high-quality image processing, interactive tour creation and dependable delivery, so businesses can present their spaces professionally online.
                </p>
              </div>
              <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {values.map(({ title, desc }) => (
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
          </div>
        </section>

        {/* ── FrameMind × 360VUE ── */}
        <section className="border-b border-border bg-[#0D0D0D]">
          <div className="max-w-6xl mx-auto px-6 py-16 md:py-20">
            <SectionLabel>03 · FrameMind × 360VUE</SectionLabel>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-[#F5F4F0] tracking-tight mb-5">A FrameMind AI Studio company.</h2>
                <p className="text-sm text-[#666] leading-relaxed mb-6">
                  FrameMind AI Studio is 360VUE&apos;s parent company. 360VUE focuses on 360° virtual tours and immersive experiences; photography, videography, social media, websites, software and automations are delivered in-house by FrameMind AI Studio.
                </p>
                <Link to="/pricing" className="inline-flex items-center gap-2 text-sm font-semibold text-[#C8F135] hover:underline underline-offset-4">
                  FrameMind services &amp; pricing <ArrowRight size={14} />
                </Link>
              </div>

              <div className="border border-[#1e1e1e] rounded-sm overflow-hidden">
                <div className="bg-[#111] px-5 py-3 border-b border-[#1e1e1e] flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#C8F135]" />
                  <span className="font-mono text-[9px] text-[#555] uppercase tracking-widest">Delivered in-house by FrameMind</span>
                </div>
                <div className="p-5 flex flex-col gap-3">
                  {framemindDelivers.map((item) => (
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

        {/* ── Founders ── */}
        <section className="border-b border-border">
          <div className="max-w-6xl mx-auto px-6 py-16 md:py-20">
            <SectionLabel>04 · Founders</SectionLabel>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {founders.map((f) => (
                <div key={f.name} className="border border-border rounded-sm p-6 bg-background">
                  <div className="flex items-center gap-4 mb-4">
                    <span className="w-12 h-12 rounded-full bg-[#0D0D0D] text-[#C8F135] font-black text-sm flex items-center justify-center shrink-0">{f.initials}</span>
                    <div>
                      <h3 className="text-base font-bold tracking-tight">{f.name}</h3>
                      <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">{f.role}</p>
                    </div>
                  </div>
                  <p className="text-xs font-semibold mb-1.5">{f.focus}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.bio}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="bg-[#0D0D0D]">
          <div className="max-w-6xl mx-auto px-6 py-16 md:py-24">
            <div className="max-w-2xl">
              <span className="font-mono text-[10px] text-[#555] uppercase tracking-[0.2em] mb-4 block">Let customers look inside</span>
              <h2 className="text-4xl md:text-5xl font-black text-[#F5F4F0] tracking-tight leading-none mb-5">
                Your space,
                <br />
                from every angle.
              </h2>
              <p className="text-sm text-[#666] leading-relaxed mb-8 max-w-lg">Enter your area, floors and rooms on 360VUE&apos;s website and see your exact price in two minutes. Then pick a capture date.</p>
              <div className="flex flex-wrap gap-3">
                <a href={`${SITE}/pricing`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-[#C8F135] text-[#0D0D0D] px-6 py-3 text-sm font-bold rounded-sm hover:bg-[#b8e020] transition-colors">
                  See your price on 360vue.website <ArrowUpRight size={14} />
                </a>
                <Link to="/connect" className="inline-flex items-center gap-2 border border-[#2a2a2a] text-[#888] px-6 py-3 text-sm font-medium rounded-sm hover:border-[#444] hover:text-[#bbb] transition-colors">
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
