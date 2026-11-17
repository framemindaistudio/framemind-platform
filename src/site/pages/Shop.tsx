"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Download, Mail, ShieldCheck, Smartphone } from "lucide-react";
import { Link } from "@/site/router";
import SEO from "@/site/components/SEO";
import { ProductCard, CategoryIcon, ProductCover } from "@/site/components/shop/ShopBits";
import type { PublicShop } from "@/site/shop";

const STEPS = [
  { icon: Smartphone, title: "Pay with UPI", desc: "GPay, PhonePe, Paytm, cards or netbanking through Razorpay." },
  { icon: Download, title: "Download at once", desc: "Your files open on the next screen. No waiting, no DMs." },
  { icon: Mail, title: "Keep the link", desc: "The download link is emailed to you, so you can get your files again later." },
];

export default function Shop({ shop, initialCategory }: { shop: PublicShop; initialCategory?: string }) {
  const [cat, setCat] = useState<string>(initialCategory && shop.categories.some((c) => c.id === initialCategory) ? initialCategory : "all");
  // the page is static, so the ?c= category in a shared link is read in the browser
  useEffect(() => {
    const c = new URLSearchParams(window.location.search).get("c");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read once from the address after the static page loads
    if (c && shop.categories.some((x) => x.id === c)) setCat(c);
  }, [shop.categories]);
  // three covers for the hero fan: one per kind, featured first
  const fan = useMemo(() => {
    const seen = new Set<string>();
    return shop.products.filter((p) => !p.cover && !seen.has(p.category) && seen.add(p.category)).slice(0, 3);
  }, [shop.products]);
  const shown = cat === "all" ? shop.products : shop.products.filter((p) => p.category === cat);
  const current = shop.categories.find((c) => c.id === cat);

  const pick = (id: string) => {
    setCat(id);
    const url = new URL(window.location.href);
    if (id === "all") url.searchParams.delete("c");
    else url.searchParams.set("c", id);
    window.history.replaceState(null, "", url);
  };

  return (
    <div>
      <SEO
        title="FrameMind Store: Guides, Presets & Templates"
        description="Digital downloads from FrameMind AI Studio: Claude Code and vibe coding guides, camera cheat sheets, Lightroom presets, LUTs, carousel templates, colour palettes and freelancer kits. Pay with UPI, download at once."
        path="/shop"
        keywords="digital products India, Lightroom presets India, LUTs, Instagram carousel templates, colour palettes, Claude Code guide, vibe coding guide, camera basics guide, PSD mockups, FrameMind store"
        ogImageAlt="FrameMind Store: guides, presets and templates"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "FrameMind Store",
          itemListElement: shop.products.map((p, i) => ({ "@type": "ListItem", position: i + 1, url: `https://www.framemindaistudio.com/shop/${p.slug}`, name: p.title })),
        }}
      />

      {/* Header */}
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 pb-14 pt-14 md:grid-cols-[1.15fr_1fr] md:items-center md:pt-20">
          <div>
            <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 font-mono text-[10px] uppercase tracking-widest">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#FF3B30]" /> New drops every week
            </span>
            <h1 className="text-[2.6rem] font-semibold leading-[0.98] tracking-[-0.035em] sm:text-6xl md:text-7xl">
              Steal our <span className="font-serif font-normal italic">shortcuts</span>
              <span className="text-[#9B7BFF]">.</span>
            </h1>
            <p className="mt-5 max-w-md text-base leading-relaxed text-muted-foreground">
              Guides, presets and templates from the studio&apos;s own workflow, packed for creators and builders. Prices start at ₹49, and downloads are instant.
            </p>
            <div className="mt-7 flex flex-wrap gap-2 font-mono text-[10px] uppercase tracking-widest">
              {["UPI · GPay · PhonePe", "Instant download", "Made in India"].map((t) => (
                <span key={t} className="rounded-full border border-border px-3 py-1.5 text-muted-foreground">
                  {t}
                </span>
              ))}
            </div>
          </div>
          {fan.length === 3 && (
            <div className="relative mx-auto h-[300px] w-full max-w-[420px] sm:h-[380px]" aria-hidden>
              {fan.map((p, i) => (
                <div
                  key={p.id}
                  className="absolute w-[46%] rounded-2xl shadow-[0_24px_50px_-18px_rgba(0,0,0,.5)]"
                  style={{ left: `${[2, 27, 52][i]}%`, top: `${[14, 6, 14][i]}%`, transform: `rotate(${[-9, 0, 9][i]}deg)`, zIndex: [1, 3, 2][i] }}
                >
                  <ProductCover product={p} />
                </div>
              ))}
            </div>
          )}
        </div>
        {/* ticker */}
        <div className="overflow-hidden border-y border-[#0D0D0D] bg-[#0D0D0D] py-2.5 text-[#C8F135]">
          <div className="flex w-max animate-[fm-marquee_38s_linear_infinite] gap-8 whitespace-nowrap font-mono text-xs uppercase tracking-[0.2em] motion-reduce:animate-none">
            {[0, 1].map((k) => (
              <span key={k} className="flex gap-8">
                {["Claude Code", "Vibe coding", "Lightroom presets", "Cinematic LUTs", "Carousel templates", "Colour palettes", "Camera basics", "Freelancer kit"].map((t) => (
                  <span key={t} className="flex items-center gap-8">
                    {t} <span className="text-[#F5F4F0]/40">✦</span>
                  </span>
                ))}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="sticky top-16 z-30 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl gap-2 overflow-x-auto px-6 py-3 [scrollbar-width:none]">
          {[{ id: "all", name: "All", icon: "" }, ...shop.categories].map((c) => {
            const on = cat === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => pick(c.id)}
                aria-pressed={on}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm transition-colors ${on ? "border-[#0D0D0D] bg-[#0D0D0D] text-[#F5F4F0]" : "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground"}`}
              >
                {c.id !== "all" && <CategoryIcon name={c.icon} className="h-3.5 w-3.5" />}
                {c.name}
              </button>
            );
          })}
        </div>
      </section>

      {/* Products */}
      <section className="mx-auto max-w-6xl px-6 py-10">
        {current && <p className="mb-6 text-sm text-muted-foreground">{current.blurb}</p>}
        {shown.length ? (
          <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-6 sm:gap-y-10 lg:grid-cols-4">
            {shown.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <p className="py-16 text-center text-muted-foreground">Nothing here yet. New products land every week.</p>
        )}
      </section>

      {/* How it works */}
      <section className="border-t border-border bg-[#0D0D0D] text-[#F5F4F0]">
        <div className="mx-auto max-w-6xl px-6 py-14 md:py-20">
          <span className="mb-8 block font-mono text-[10px] uppercase tracking-widest text-[#C8F135]">How buying works</span>
          <div className="grid gap-8 md:grid-cols-3">
            {STEPS.map(({ icon: Icon, title, desc }) => (
              <div key={title}>
                <Icon className="mb-4 h-6 w-6 text-[#C8F135]" strokeWidth={1.6} />
                <h2 className="mb-2 text-lg font-semibold">{title}</h2>
                <p className="text-sm leading-relaxed text-[#999]">{desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-12 flex flex-col gap-4 border-t border-[#222] pt-8 text-sm text-[#999] md:flex-row md:items-center md:justify-between">
            <p className="inline-flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[#C8F135]" /> Payments are processed by Razorpay. We never see your card or UPI PIN.
            </p>
            <div className="flex gap-5">
              <Link to="/shop/downloads" className="hover:text-[#F5F4F0]">
                Lost your download?
              </Link>
              <Link to="/shop/terms" className="hover:text-[#F5F4F0]">
                Store terms & refunds
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Custom work */}
      <section className="mx-auto flex max-w-6xl flex-col items-start gap-5 px-6 py-14 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Need it made for you instead?</h2>
          <p className="mt-1 text-muted-foreground">Websites, brand kits, photo, video and AI coaching, done by the studio.</p>
        </div>
        <Link to="/connect" className="inline-flex items-center gap-2 rounded-sm bg-[#C8F135] px-6 py-3 text-sm font-semibold text-[#0D0D0D] transition-colors hover:bg-[#b8e020]">
          Let&apos;s talk <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    </div>
  );
}
