"use client";

import { Link } from "@/site/router";
import { ArrowRight, BookOpen, Layers, Zap, Package } from "lucide-react";
import SEO from "@/site/components/SEO";

const upcoming = [
  {
    icon: BookOpen,
    title: "Templates & Kits",
    desc: "Ready-to-use website templates, brand starter kits, and design components — built to the same standard as our client work.",
  },
  {
    icon: Layers,
    title: "Notion & Workflow Systems",
    desc: "Business operating systems, project management setups, and productivity frameworks for founders and small teams.",
  },
  {
    icon: Zap,
    title: "Automation Blueprints",
    desc: "Pre-built automation workflows for common business tasks — plug in your tools, turn them on, save hours every week.",
  },
  {
    icon: Package,
    title: "Digital Resources",
    desc: "Guides, playbooks, and mini-courses on brand building, web presence, and using AI tools in your business.",
  },
];

export default function Shop() {
  return (
    <div>
      <SEO
        title="Shop — Digital Products & Templates"
        description="FrameMind Studio's digital shop: website templates, Notion systems, automation blueprints, and workflow tools. Studio-quality resources for founders and builders."
        path="/shop"
        keywords="digital products India, website templates India, Notion templates, workflow automation tools, digital resources for founders, design templates India, FrameMind shop"
        ogImageAlt="FrameMind AI Studio — Digital Products & Templates Shop"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Store",
          "name": "FrameMind AI Studio — Digital Shop",
          "description": "Website templates, Notion systems, automation blueprints, and workflow tools.",
          "url": "https://www.framemindaistudio.com/shop",
          "seller": { "@type": "Organization", "name": "FrameMind AI Studio" },
          "currenciesAccepted": "INR",
          "areaServed": "Worldwide",
        }}
      />
      {/* Header */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-12">
        <span className="font-mono text-xs text-muted-foreground uppercase tracking-widest mb-4 block">
          Shop
        </span>
        <h1 className="text-3xl md:text-5xl font-semibold tracking-tight mb-5 max-w-2xl leading-tight">
          Something is being built<br className="hidden sm:block" /> here.
        </h1>
        <p className="text-base text-muted-foreground leading-relaxed max-w-xl">
          The FrameMind Shop is coming soon — a curated set of templates, systems, and resources built for founders who move fast.
        </p>
      </section>

      {/* Coming soon block */}
      <section className="border-t border-border bg-[#0D0D0D]">
        <div className="max-w-6xl mx-auto px-6 py-16 md:py-24 flex flex-col items-center text-center">
          <span className="font-mono text-[10px] text-[#C8F135] uppercase tracking-widest mb-6 block">Coming Soon</span>
          <h2 className="text-4xl md:text-6xl font-semibold text-[#F5F4F0] tracking-tight mb-6">
            Shop opens soon.
          </h2>
          <p className="text-base text-[#888] max-w-md leading-relaxed mb-10">
            We are building a collection of tools and resources that reflect the same standard as our client work. No filler. Nothing generic.
          </p>
          <div className="w-full max-w-xs h-px bg-[#1a1a1a] mb-10" />
          <p className="font-mono text-[10px] text-[#444] uppercase tracking-widest">
            In the meantime — want custom work done for you?
          </p>
          <Link
            to="/connect"
            className="mt-5 inline-flex items-center gap-2 bg-[#C8F135] text-[#0D0D0D] px-6 py-3 text-sm font-semibold rounded-sm hover:bg-[#b8e020] transition-colors"
          >
            {"Let's talk"} <ArrowRight size={13} />
          </Link>
        </div>
      </section>

      {/* What's coming */}
      <section className="border-t border-border">
        <div className="max-w-6xl mx-auto px-6 py-16 md:py-20">
          <div className="mb-12">
            <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest mb-4 block">What to expect</span>
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">
              {"What we're building for you."}
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-border border border-border">
            {upcoming.map((item) => (
              <div key={item.title} className="bg-background p-8">
                <item.icon size={20} className="text-[#C8F135] mb-5" />
                <h3 className="font-semibold text-base mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
