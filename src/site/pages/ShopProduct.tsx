"use client";

import { useState } from "react";
import { ArrowLeft, Check, FileDown, Minus, Plus, Smartphone, WifiOff, Lock as LockIcon, MonitorSmartphone } from "lucide-react";
import { Link } from "@/site/router";
import type { PublicProduct, ShopCategory } from "@/lib/shop/types";
import { ProductCard, ProductCover, WorksWith } from "@/site/components/shop/ShopBits";
import { appsFor, COMPAT_NOTE } from "@/lib/shop/compat";
import { BuyBox } from "@/site/components/shop/BuyBox";
import { site } from "@/lib/site";
import { showcaseFor, type Showcase } from "@/lib/shop/showcase";
import { Kicker, Marked, MaskLines, Rise } from "@/site/components/ui/motion-bits";
import { SectionHead } from "@/site/components/ui/page-bits";

/*
 * A store product page (Nov 2026). The first screen answers "what does this do for me" with almost no reading:
 * the promise, three marked points, the price and the buy box, and the real offline app on a laptop and a phone.
 * Everything else (what's inside, the app, the details, the comparison, questions) sits below.
 */

export default function ShopProduct({ product, category, related, inBundle, paymentsOn }: { product: PublicProduct; category?: ShopCategory; related: PublicProduct[]; inBundle: PublicProduct[]; paymentsOn: boolean }) {
  const paragraphs = product.description.split(/\n\s*\n/).filter(Boolean);
  const show = showcaseFor(product.id);
  const points = show?.points ?? product.includes.slice(0, 3).map((text, i) => ({ text, mark: (["circle", "highlight", "underline"] as const)[i] }));

  return (
    <div className="bg-[var(--fm-stone)]">
      {/* ── first screen ── */}
      <section className="fm-dark relative overflow-hidden">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_55%_at_85%_10%,rgba(200,241,53,0.10),transparent_70%)]" />
        <div className="relative mx-auto max-w-[1320px] px-5 pb-16 pt-32 sm:px-8 md:pb-24 md:pt-40">
          <Link to={category ? `/shop?c=${category.id}` : "/shop"} className="inline-flex items-center gap-2 rounded-full bg-[#2a2a27] px-3.5 py-1.5 text-[13px] text-[#d6d4cd] transition-colors hover:bg-[#34342f]">
            <ArrowLeft className="h-3.5 w-3.5" /> {category?.name ?? "Store"}
          </Link>

          <div className="mt-8 grid gap-12 lg:grid-cols-[1fr_1.05fr] lg:items-start">
            <div>
              <Kicker className="text-[#d6d4cd]">
                {show?.app ? "Includes an offline app" : category?.name}
                {product.level ? ` · ${product.level}` : ""}
              </Kicker>
              <MaskLines as="h1" className="mt-5 text-[clamp(2.4rem,5.4vw,4.8rem)] font-normal leading-[0.98] tracking-[-0.05em]" lines={[product.title]} />
              <Rise delay={0.25} y={12}>
                <p className="mt-5 max-w-xl text-[18px] leading-relaxed text-[#bcbab2]">{show?.promise ?? product.tagline}</p>
              </Rise>

              <ul className="mt-9 space-y-5">
                {points.map((p, i) => (
                  <Rise key={p.text} delay={0.3 + i * 0.08} y={12}>
                    <li className="flex items-baseline gap-4 text-[clamp(1.15rem,1.9vw,1.45rem)] leading-snug tracking-[-0.015em]">
                      <span className="font-mono text-[11px] text-[#7d7b74]">0{i + 1}</span>
                      <Marked mark={p.mark}>{p.text}</Marked>
                    </li>
                  </Rise>
                ))}
              </ul>

              <div className="mt-10 max-w-md">
                <BuyBox product={product} paymentsOn={paymentsOn} whatsapp={site.contact.whatsapp} />
                <p className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-[#9a9890]">
                  <span className="inline-flex items-center gap-1.5">
                    <FileDown className="h-3.5 w-3.5 text-[var(--fm-lime)]" /> Instant download
                  </span>
                  <span>{product.formats.join(" · ")}</span>
                </p>
              </div>
            </div>

            <Rise delay={0.2} y={24}>{show?.app ? <AppStage product={product} show={show} /> : <CoverStage product={product} />}</Rise>
          </div>
        </div>
      </section>

      {/* ── what's inside ── */}
      <section className="relative -mt-8 rounded-t-[36px] bg-[var(--fm-stone)] md:-mt-12 md:rounded-t-[56px]">
        <div className="mx-auto max-w-[1320px] px-5 py-20 sm:px-8 md:py-28">
          <SectionHead
            kicker="What's in the download"
            lines={[`${product.includes.length} things,`, <span key="b" className="text-[#64635d]">one folder.</span>]}
            side={<WorksWithBlock product={product} />}
          />
          <div className="mt-14 grid gap-10 lg:grid-cols-[0.85fr_1.15fr]">
            <Folder product={product} />
            <ol className="grid gap-2">
              {product.includes.map((x, i) => (
                <Rise key={x} delay={i * 0.04} y={14}>
                  <li className="flex gap-4 rounded-[20px] bg-[#f3f2ee] px-5 py-4">
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#171716] font-mono text-[11px] text-[var(--fm-lime)]">{i + 1}</span>
                    <span className="text-[16px] leading-snug">{x}</span>
                  </li>
                </Rise>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* ── the app ── */}
      {show?.app && <AppBand show={show} />}

      {/* ── about ── */}
      <section className="bg-[var(--fm-stone)]">
        <div className="mx-auto grid max-w-[1320px] gap-10 px-5 py-20 sm:px-8 md:grid-cols-[0.8fr_1.2fr] md:py-28">
          <Kicker>About this pack</Kicker>
          <div>
            <div className="space-y-5 text-[clamp(1.15rem,1.7vw,1.35rem)] leading-relaxed tracking-[-0.01em] text-[#2d2c29]">
              {paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
            <dl className="mt-10 grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
              <div className="rounded-[20px] bg-[#f3f2ee] p-5">
                <dt className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Format</dt>
                <dd className="mt-2 text-[15px]">{product.formats.join(", ")}</dd>
              </div>
              <div className="rounded-[20px] bg-[#f3f2ee] p-5">
                <dt className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Delivery</dt>
                <dd className="mt-2 text-[15px]">Instant download, link by email</dd>
              </div>
              {product.level && (
                <div className="rounded-[20px] bg-[#f3f2ee] p-5">
                  <dt className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">For</dt>
                  <dd className="mt-2 text-[15px]">{product.level}</dd>
                </div>
              )}
            </dl>
            <div className="mt-6 space-y-2 text-xs leading-relaxed text-muted-foreground">
              {product.note && <p>{product.note}</p>}
              {appsFor(product).length > 0 && <p>{COMPAT_NOTE}</p>}
              <p>
                Digital product: no physical item is shipped. See the{" "}
                <Link to="/shop/terms" className="underline underline-offset-2">
                  store terms &amp; refunds
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </section>

      {product.compare && product.compare.rows.length > 0 && <Compare product={product} />}

      <Faq hasApp={!!show?.app} />

      {inBundle.length > 0 && (
        <section className="bg-[var(--fm-stone)]">
          <div className="mx-auto max-w-[1320px] px-5 py-20 sm:px-8">
            <SectionHead kicker="Bundle" lines={["Inside this bundle."]} />
            <div className="mt-10 grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-6 lg:grid-cols-4">
              {inBundle.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      {related.length > 0 && (
        <section className="bg-[var(--fm-stone)]">
          <div className="mx-auto max-w-[1320px] px-5 pb-24 pt-10 sm:px-8">
            <SectionHead kicker="More from the store" lines={["You may also like."]} />
            <div className="mt-10 grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-6 lg:grid-cols-4">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

/* ─────────────── first-screen visuals ─────────────── */

/** The real app on a laptop-style window with the phone version in front of it. */
function AppStage({ product, show }: { product: PublicProduct; show: Showcase }) {
  const app = show.app!;
  return (
    <div className="relative pb-10 lg:pt-4">
      <div className="overflow-hidden rounded-[18px] border border-white/10 bg-[#1f1f1d] shadow-[0_40px_80px_-30px_rgba(0,0,0,0.8)]">
        <div className="flex items-center gap-1.5 border-b border-white/[0.07] px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-[#3a3a36]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#3a3a36]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#3a3a36]" />
          <span className="ml-3 truncate rounded-full bg-[#2a2a27] px-3 py-1 font-mono text-[10px] text-[#9a9890]">{app.name}.html · works offline</span>
        </div>
        <img src={app.shots.desktop} alt={`${app.name}, the offline app in ${product.title}`} width={1440} height={900} className="block aspect-[16/10] w-full object-cover object-top" />
      </div>
      <div className="absolute -bottom-2 right-3 w-[30%] min-w-[120px] max-w-[190px] overflow-hidden rounded-[26px] border-[5px] border-[#2a2a27] bg-[#1f1f1d] shadow-[0_30px_60px_-20px_rgba(0,0,0,0.85)] sm:right-6">
        <img src={app.shots.phone} alt={`${app.name} on a phone`} width={390} height={844} className="block aspect-[390/844] w-full object-cover object-top" />
      </div>
      <div className="absolute -top-5 left-5 hidden -rotate-2 rounded-[16px] bg-[var(--fm-lime)] px-4 py-2.5 text-[#171716] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.6)] sm:block lg:-top-1">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em]">Included</p>
        <p className="text-[17px] leading-tight tracking-[-0.02em]">{app.name}</p>
      </div>
    </div>
  );
}

/** Products without an app: the cover, large and lifted. */
function CoverStage({ product }: { product: PublicProduct }) {
  return (
    <div className="mx-auto max-w-[460px] -rotate-2 rounded-2xl shadow-[0_40px_80px_-30px_rgba(0,0,0,0.85)] transition-transform duration-700 hover:rotate-0">
      <ProductCover product={product} />
    </div>
  );
}

/* ─────────────── what's inside ─────────────── */

/** The download as a folder: its file types fan out of it on hover (after the Glassmorphism Folder Cards on 21st.dev). */
function Folder({ product }: { product: PublicProduct }) {
  const files = product.formats.slice(0, 5);
  return (
    <div className="group relative mx-auto h-[300px] w-full max-w-[420px] select-none sm:h-[340px]" aria-hidden="true">
      {/* back panel with its tab */}
      <div className="absolute inset-x-0 bottom-0 h-[78%] rounded-[24px] rounded-tl-none bg-[#1f1f1d]" />
      <div className="absolute left-0 top-[16%] h-10 w-[42%] rounded-t-[18px] bg-[#1f1f1d]" />
      {/* the files */}
      {files.map((f, i) => {
        const n = files.length;
        const spread = (i - (n - 1) / 2) * 14;
        return (
          <div
            key={f}
            className="absolute bottom-[22%] left-1/2 flex h-[58%] w-[46%] -translate-x-1/2 flex-col justify-between rounded-[14px] border border-black/5 bg-[#f3f2ee] p-4 shadow-[0_10px_30px_-12px_rgba(0,0,0,0.5)] transition-transform duration-700 ease-[cubic-bezier(.16,1,.3,1)] [transform:translateX(calc(-50%+var(--x)))_rotate(var(--r))] group-hover:[transform:translateX(calc(-50%+var(--hx)))_translateY(var(--hy))_rotate(var(--hr))]"
            style={{ ["--x" as string]: `${spread * 0.6}px`, ["--r" as string]: `${spread * 0.25}deg`, ["--hx" as string]: `${spread * 4.2}px`, ["--hy" as string]: `-${18 + Math.abs(spread)}px`, ["--hr" as string]: `${spread * 0.9}deg`, zIndex: i } as React.CSSProperties}
          >
            <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#64635d]">File</span>
            <span className="text-[1.6rem] leading-none tracking-[-0.03em] text-[#171716]">.{f.toLowerCase()}</span>
          </div>
        );
      })}
      {/* front panel */}
      <div className="absolute inset-x-0 bottom-0 z-10 flex h-[52%] flex-col justify-end rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(54,54,50,0.92),rgba(31,31,29,0.97))] p-6 text-[#eceae4] backdrop-blur-md">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#9a9890]">FrameMind-{product.slug}.zip</p>
        <p className="mt-2 text-[1.4rem] leading-tight tracking-[-0.03em]">{product.title}</p>
      </div>
    </div>
  );
}

function WorksWithBlock({ product }: { product: PublicProduct }) {
  if (!appsFor(product).length) return null;
  return (
    <div>
      <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.18em] text-[#64635d]">Works with</p>
      <WorksWith product={product} />
    </div>
  );
}

/* ─────────────── the app band ─────────────── */

function AppBand({ show }: { show: Showcase }) {
  const app = show.app!;
  const facts = [
    { icon: MonitorSmartphone, t: "Opens in any browser", d: "Double-click the file. Nothing to install, no account." },
    { icon: WifiOff, t: "Works offline", d: "Use it on a train or a shoot. It never needs the internet." },
    { icon: LockIcon, t: "Stays on your device", d: "What you type is saved in your browser, never uploaded." },
    { icon: Smartphone, t: "Works on your phone", d: "The same app, laid out for a small screen." },
  ];
  return (
    <section className="fm-dark rounded-t-[36px] md:rounded-t-[56px]">
      <div className="mx-auto max-w-[1320px] px-5 py-20 sm:px-8 md:py-28">
        <SectionHead dark kicker="The app inside" lines={[app.name, <span key="b" className="text-[#9a9890]">a tool, not a PDF.</span>]} side={<p className="text-[16px] leading-relaxed text-[#bcbab2]">{app.does}</p>} />
        <div className="mt-14 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {facts.map(({ icon: Icon, t, d }, i) => (
            <Rise key={t} delay={i * 0.06}>
              <div className="h-full rounded-[24px] border border-white/[0.07] bg-[#1f1f1d] p-6">
                <Icon className="h-6 w-6 text-[var(--fm-lime)]" strokeWidth={1.6} />
                <p className="mt-8 text-[1.2rem] tracking-[-0.02em]">{t}</p>
                <p className="mt-2 text-[14px] leading-relaxed text-[#9a9890]">{d}</p>
              </div>
            </Rise>
          ))}
        </div>
        <Rise className="mt-10">
          <div className="overflow-hidden rounded-[22px] border border-white/10">
            <img src={app.shots.desktop} alt={`${app.name} in a browser`} width={1440} height={900} loading="lazy" className="block w-full" />
          </div>
        </Rise>
      </div>
    </section>
  );
}

/* ─────────────── compare ─────────────── */

/** "How it compares": this product in the first, highlighted column. Yes/No cells become icons. */
function Compare({ product }: { product: PublicProduct }) {
  const c = product.compare!;
  const cell = (v: string, ours: boolean) => {
    const t = v.trim();
    if (/^yes$/i.test(t)) return <Check className={`h-4 w-4 ${ours ? "" : "text-foreground/70"}`} aria-label="Yes" />;
    if (/^no$/i.test(t)) return <Minus className="h-4 w-4 text-muted-foreground/60" aria-label="No" />;
    return <span className={ours ? "font-medium" : "text-muted-foreground"}>{t}</span>;
  };
  return (
    <section className="bg-[var(--fm-stone)]">
      <div className="mx-auto max-w-[1320px] px-5 pb-20 sm:px-8 md:pb-28">
        <SectionHead kicker="Before you buy" lines={["How it compares."]} />
        <div className="mt-10 overflow-x-auto rounded-[26px] bg-[#f3f2ee] p-2 sm:p-4" data-lenis-prevent-wheel>
          <table className="w-full min-w-[720px] border-collapse text-left text-sm">
            <thead>
              <tr>
                <th className="w-[22%] px-4 pb-4 pt-4 align-bottom font-normal text-muted-foreground" />
                {c.columns.map((h, i) => (
                  <th key={h} className={`px-4 pb-4 pt-4 align-bottom font-medium leading-snug ${i === 0 ? "rounded-t-[18px] bg-[#171716] text-[var(--fm-lime)]" : "text-muted-foreground"}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {c.rows.map((r, ri) => (
                <tr key={r.label} className="border-t border-[#1b1b19]/8">
                  <th scope="row" className="px-4 py-4 align-top font-medium">
                    {r.label}
                  </th>
                  {r.values.map((v, i) => (
                    <td key={i} className={`px-4 py-4 align-top leading-snug ${i === 0 ? `bg-[#171716] text-[#eceae4] ${ri === c.rows.length - 1 ? "rounded-b-[18px]" : ""}` : ""}`}>
                      {cell(v, i === 0)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {c.note && <p className="mt-5 max-w-3xl text-xs leading-relaxed text-muted-foreground">{c.note}</p>}
      </div>
    </section>
  );
}

/* ─────────────── questions ─────────────── */

function Faq({ hasApp }: { hasApp: boolean }) {
  const qa = [
    { q: "How do I get the files?", a: "Your download page opens as soon as the payment is confirmed, and the link is emailed to you. If anything goes wrong, the “Lost your download?” page or a WhatsApp message gets you a fresh link." },
    ...(hasApp
      ? [{ q: "What is the HTML app, and do I need the internet?", a: "It's a single file that opens in Chrome, Edge, Safari or any browser, on a computer or a phone. Once downloaded it works offline, and what you type stays in your browser." }]
      : []),
    { q: "How do I pay?", a: "UPI, GPay, PhonePe, cards or netbanking, through Razorpay. We never see your card or UPI PIN." },
    { q: "Can I use it for client work?", a: "Yes, in your own personal and client work. Please don't resell, share or upload the files themselves. One purchase is for one person." },
    { q: "What if a file doesn't work?", a: "Tell us within 7 days. If we can't send a working copy within 3 days, you get a full refund. The store terms have the details." },
  ];
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className="bg-[var(--fm-stone)]">
      <div className="mx-auto grid max-w-[1320px] gap-10 px-5 pb-20 sm:px-8 md:grid-cols-[0.8fr_1.2fr] md:pb-28">
        <div>
          <Kicker>Questions</Kicker>
          <MaskLines className="mt-5 text-[clamp(2rem,4vw,3.4rem)] font-normal leading-[1] tracking-[-0.045em]" lines={["Asked a lot."]} />
        </div>
        <div className="flex flex-col gap-2">
          {qa.map((x, i) => {
            const on = open === i;
            return (
              <div key={x.q} className="rounded-[20px] bg-[#f3f2ee]">
                <button type="button" onClick={() => setOpen(on ? null : i)} aria-expanded={on} className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-[16px]">
                  {x.q}
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-[transform,background-color] duration-300 ${on ? "rotate-45 bg-[#171716] text-[var(--fm-lime)]" : "bg-[#e3e1da]"}`}>
                    <Plus className="h-4 w-4" />
                  </span>
                </button>
                <div className={`grid transition-[grid-template-rows] duration-500 ease-[cubic-bezier(.16,1,.3,1)] ${on ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                  <div className="overflow-hidden">
                    <p className="px-5 pb-5 text-[15px] leading-relaxed text-[#55544e]">{x.a}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
