"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, Mail, ShieldCheck, Smartphone } from "lucide-react";
import { Link } from "@/site/router";
import SEO from "@/site/components/SEO";
import { CtaPanel, PageHero } from "@/site/components/ui/page-bits";
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
    <div className="bg-[var(--fm-stone)]">
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

      <PageHero
        kicker="FrameMind Store · new drops every week"
        lines={["Steal our", <span key="b">shortcuts<span className="text-[var(--fm-lime)]">.</span></span>]}
        lede={
          <>
            Guides, presets and templates from the studio&apos;s own workflow. <b className="font-medium text-[#eceae4]">Most packs include an app that works offline.</b> From ₹49, instant download.
          </>
        }
        actions={
          <div className="flex flex-wrap gap-2 text-[13px]">
            {["UPI · GPay · PhonePe", "Instant download", "Made in India"].map((t) => (
              <span key={t} className="rounded-full border border-white/12 px-4 py-2 text-[#d6d4cd]">
                {t}
              </span>
            ))}
          </div>
        }
        aside={
          fan.length === 3 ? (
            <div className="relative mx-auto h-[300px] w-full max-w-[440px] sm:h-[380px]" aria-hidden>
              {fan.map((p, i) => (
                <div
                  key={p.id}
                  className="absolute w-[46%] rounded-2xl shadow-[0_30px_60px_-18px_rgba(0,0,0,.7)]"
                  style={{ left: `${[2, 27, 52][i]}%`, top: `${[14, 6, 14][i]}%`, transform: `rotate(${[-9, 0, 9][i]}deg)`, zIndex: [1, 3, 2][i] }}
                >
                  <ProductCover product={p} />
                </div>
              ))}
            </div>
          ) : undefined
        }
      >
        {/* ticker */}
        <div className="overflow-hidden bg-[var(--fm-lime)] py-3 text-[#171716]">
          <div className="flex w-max animate-[fm-marquee_38s_linear_infinite] gap-8 whitespace-nowrap font-mono text-xs uppercase tracking-[0.2em] motion-reduce:animate-none">
            {[0, 1].map((k) => (
              <span key={k} className="flex gap-8">
                {["Claude Code", "Vibe coding", "Lightroom presets", "Cinematic LUTs", "Carousel templates", "Colour palettes", "Camera basics", "Freelancer kit"].map((t) => (
                  <span key={t} className="flex items-center gap-8">
                    {t} <span className="h-2 w-2 rounded-full bg-[#171716]" />
                  </span>
                ))}
              </span>
            ))}
          </div>
        </div>
      </PageHero>

      {/* Categories */}
      <section className="sticky top-[76px] z-30 bg-[var(--fm-stone)]/90 backdrop-blur-xl sm:top-[84px]">
        <div className="mx-auto flex max-w-[1320px] gap-2 overflow-x-auto px-5 py-3 sm:px-8 [scrollbar-width:none]">
          {[{ id: "all", name: "All", icon: "" }, ...shop.categories].map((c) => {
            const on = cat === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => pick(c.id)}
                aria-pressed={on}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm transition-colors ${on ? "border-[#171716] bg-[#171716] text-[#eceae4]" : "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground"}`}
              >
                {c.id !== "all" && <CategoryIcon name={c.icon} className="h-3.5 w-3.5" />}
                {c.name}
              </button>
            );
          })}
        </div>
      </section>

      {/* Products */}
      <section className="mx-auto max-w-[1320px] px-5 py-12 sm:px-8 md:py-16">
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
      <section className="rounded-t-[36px] bg-[#171716] text-[#eceae4] md:rounded-t-[56px]">
        <div className="mx-auto max-w-[1320px] px-5 py-20 sm:px-8 md:py-28">
          <p className="mb-12 text-[clamp(2rem,4vw,3.4rem)] leading-none tracking-[-0.045em]">How buying works.</p>
          <div className="grid gap-8 md:grid-cols-3">
            {STEPS.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-[24px] border border-white/[0.07] bg-[#1f1f1d] p-7">
                <Icon className="mb-4 h-6 w-6 text-[#C8F135]" strokeWidth={1.6} />
                <h2 className="mb-2 text-xl font-normal tracking-[-0.02em]">{title}</h2>
                <p className="text-sm leading-relaxed text-[#999]">{desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-12 flex flex-col gap-4 border-t border-[#222] pt-8 text-sm text-[#999] md:flex-row md:items-center md:justify-between">
            <p className="inline-flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[#C8F135]" /> Payments are processed by Razorpay. We never see your card or UPI PIN.
            </p>
            <div className="flex gap-5">
              <Link to="/shop/downloads" className="hover:text-[#eceae4]">
                Lost your download?
              </Link>
              <Link to="/shop/terms" className="hover:text-[#eceae4]">
                Store terms & refunds
              </Link>
            </div>
          </div>
        </div>
      </section>

      <CtaPanel kicker="Custom work" lines={["Need it made", "for you instead?"]} lede="Websites, brand kits, photo, video and AI coaching, done by the studio." primary={{ to: "/connect", label: "Let's talk" }} />
    </div>
  );
}
