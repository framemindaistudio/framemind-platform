"use client";

import { useMemo, useState } from "react";
import { ArrowRight, Box, Check, Layers, Maximize2, Minus, PenTool, Play, Plus, Ruler, ScanEye, ShieldCheck } from "lucide-react";
import { Link } from "@/site/router";
import { Rise } from "@/site/components/ui/motion-bits";
import { submitLead } from "@/site/leads";
import { BRAND_WORLDS, inr, packagingWith, PRICE_FACTORS, type PackagingRates } from "@/lib/content/packaging";

/*
 * Packaging design (Nov 2026). Its own matte world, apart from the lime site: espresso board, brass rules, bone type and
 * film grain, like a printer's proof room. The page sells by showing: a cinematic hero, the live 3D brand stories,
 * seven brand worlds, real dielines, then the price and a quote that lands in HQ as an enquiry.
 */

const C = { bg: "#1b1916", panel: "#24211d", panel2: "#2c2823", line: "#3a342d", bone: "#ede6da", muted: "#a99f90", brass: "#c9a46a", brass2: "#e0c08a" };
const GRAIN = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 .5 0 0 0 0 .5 0 0 0 0 .5 0 0 0 1 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")`;
const STUDIO = "/packaging-3d/index.html";

function Grain({ className = "" }: { className?: string }) {
  return <div aria-hidden="true" className={`pointer-events-none absolute inset-0 opacity-[0.16] mix-blend-overlay ${className}`} style={{ backgroundImage: GRAIN }} />;
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="font-mono text-[11px] uppercase tracking-[0.26em]" style={{ color: C.brass }}>{children}</p>;
}

function H2({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <h2 className={`mt-4 text-[clamp(2rem,4.4vw,3.6rem)] font-normal leading-[1.02] tracking-[-0.045em] ${className}`} style={{ color: C.bone }}>{children}</h2>;
}

const STEPS = [
  { icon: ScanEye, title: "Shelf and brand research", text: "We study your category on the shelf and online, your buyers and your rivals, and agree what the pack must say first." },
  { icon: Layers, title: "The brand world", text: "Palette with roles, type pairing, one graphic device and a voice. The system every SKU and size follows." },
  { icon: Ruler, title: "Dielines from your printer", text: "Artwork built in Adobe Illustrator on your converter's real template: cut, fold, bleed, safe area and glue tabs." },
  { icon: Box, title: "Every size in 3D", text: "You turn each pack in your browser before a single sheet is printed, and sign off on what you actually see." },
  { icon: ShieldCheck, title: "Print-ready hand-off", text: "Layered source files, press PDFs, a dieline sheet and a check of the legal panel. The files are yours." },
];

const CRAFT = [
  { icon: PenTool, title: "Designed by people, in Adobe", text: "Every client pack is drawn and built by our designers in Illustrator, Photoshop and InDesign. No template packs, no generated layouts." },
  { icon: ShieldCheck, title: "To your brand guidelines", text: "We work inside your guidelines. No guidelines yet? We write them first, so the packs, site and social all match." },
  { icon: Ruler, title: "Legal panel done properly", text: "Net quantity, MRP box, batch and dates, FSSAI or cosmetic licence, veg mark, barcode zone and consumer care, sized to read." },
  { icon: Box, title: "A range, not a one-off", text: "One hierarchy on every pack (brand, product, variant, claims) so the next flavour or size is a quick, cheap variant." },
];

const PACK_TYPES = [
  { id: "label", label: "Labels or wraps" },
  { id: "pouch", label: "Pouches or bags" },
  { id: "carton", label: "Cartons or boxes" },
  { id: "rigid", label: "Gift boxes or carry bags" },
];

export default function Packaging({ rates = null }: { rates?: PackagingRates | null }) {
  const { tiers: PACK_TIERS, extras: PACK_EXTRAS, bundles: PACK_BUNDLES } = useMemo(() => packagingWith(rates), [rates]);
  const [live, setLive] = useState(false);
  const [counts, setCounts] = useState<Record<string, number>>({ label: 0, pouch: 1, carton: 0, rigid: 0 });
  const [sizes, setSizes] = useState(1);
  const [illus, setIllus] = useState(false);
  const [needIdentity, setNeedIdentity] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "", brand: "", timeline: "", message: "", website: "" });
  const [state, setState] = useState<{ busy: boolean; done: boolean; error: string }>({ busy: false, done: false, error: "" });

  const skus = Object.values(counts).reduce((a, b) => a + b, 0);
  const estimate = useMemo(() => {
    let t = 0;
    for (const tier of PACK_TIERS) t += (counts[tier.id] ?? 0) * tier.from;
    t += skus * Math.max(0, sizes - 1) * PACK_EXTRAS[0].from;
    if (illus) t += PACK_EXTRAS[1].from;
    return t;
  }, [counts, sizes, illus, skus, PACK_TIERS, PACK_EXTRAS]);

  const step = (id: string, d: number) => setCounts((c) => ({ ...c, [id]: Math.max(0, Math.min(20, (c[id] ?? 0) + d)) }));

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || (!form.phone.trim() && !form.email.trim())) {
      setState({ busy: false, done: false, error: "Add your name and a phone number or email so we can reply." });
      return;
    }
    setState({ busy: true, done: false, error: "" });
    const lines = PACK_TYPES.filter((p) => counts[p.id]).map((p) => `${counts[p.id]} × ${p.label.toLowerCase()}`);
    const message = [
      `Packaging design request${form.brand ? ` for ${form.brand}` : ""}.`,
      `Packs: ${lines.join(", ") || "not chosen yet"}; ${sizes} size${sizes > 1 ? "s" : ""} or flavour${sizes > 1 ? "s" : ""} each.`,
      illus ? "Needs custom illustration." : "",
      needIdentity ? "Also needs brand identity and guidelines." : "",
      `Website estimate: from ${inr(estimate)}.`,
      form.message ? `Notes: ${form.message}` : "",
    ].filter(Boolean).join("\n");
    const r = await submitLead({
      kind: "project", name: form.name, phone: form.phone, email: form.email, organisation: form.brand, timeline: form.timeline,
      services: needIdentity ? ["packaging", "brand"] : ["packaging"], estimate, message, website: form.website,
    });
    setState({ busy: false, done: r.ok, error: r.ok ? "" : r.error });
  }

  const input = "w-full rounded-xl border bg-transparent px-4 py-3 text-[15px] outline-none transition-colors placeholder:text-[#7d7467] focus:border-[#c9a46a]";

  return (
    <div style={{ background: C.bg, color: C.bone }}>
      {/* ── hero ── */}
      <section className="relative isolate overflow-hidden bg-[#1b1916] md:flex md:min-h-[100dvh] md:items-end">
        {/* phones: the packs first, as a tall close-up that melts into the page */}
        <div className="relative h-[64svh] min-h-[440px] md:hidden">
          <img src="/packaging/tall-chai.webp" alt="Chai Kutty sample pouches and tea tin in 3D on a tea-stall table" className="absolute inset-0 h-full w-full object-cover object-[50%_60%] [mask-image:linear-gradient(180deg,#000_0%,#000_55%,transparent_90%)]" />
          <div aria-hidden="true" className="absolute inset-x-0 top-0 h-28 bg-[linear-gradient(180deg,#1b1916cc,#1b191600)]" />
        </div>
        <img src="/packaging/hero-chai.webp" alt="Chai Kutty sample range in 3D: three pouches, a tea tin and a tea-bag box on a tea-stall table" className="absolute inset-y-0 right-0 -z-20 hidden h-full w-[76%] object-cover md:block" />
        <div aria-hidden="true" className="absolute inset-0 -z-10 hidden md:block md:bg-[linear-gradient(90deg,#1b1916_24%,#1b1916d9_34%,#1b191600_52%),linear-gradient(0deg,#1b1916_0%,#1b191600_30%)]" />
        <Grain className="hidden md:block" />
        <div className="relative mx-auto -mt-16 w-full max-w-[1320px] px-5 pb-16 sm:px-8 md:mt-0 md:pb-24 md:pt-36">
          <Rise y={14}><Eyebrow>New at FrameMind · Packaging design studio</Eyebrow></Rise>
          <Rise delay={0.08} y={18}>
            <h1 className="mt-6 max-w-[11ch] text-[clamp(2.8rem,6vw,5.4rem)] font-normal leading-[0.95] tracking-[-0.055em]">
              Packaging that tells your <em className="not-italic" style={{ color: C.brass2 }}>brand&apos;s story.</em>
            </h1>
          </Rise>
          <Rise delay={0.16} y={14}>
            <p className="mt-6 max-w-md text-[18px] leading-relaxed" style={{ color: "#d7cfc2" }}>
              Pouches, cartons, labels, cans, gift boxes and carry bags, designed as one brand world, built on your printer&apos;s dielines and shown to you in 3D before anything is printed.
            </p>
          </Rise>
          <Rise delay={0.24} y={12}>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <a href="#quote" className="inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-[15px] font-semibold transition-transform active:scale-[0.98]" style={{ background: C.brass, color: "#1b1916" }}>
                Get a packaging quote <ArrowRight className="h-4 w-4" />
              </a>
              <a href="#studio" className="inline-flex items-center justify-center gap-2 rounded-full border px-6 py-3.5 text-[15px] font-semibold backdrop-blur-md transition-colors hover:bg-white/5" style={{ borderColor: "#ffffff33" }}>
                <Play className="h-4 w-4" /> Walk the brands in 3D
              </a>
            </div>
            <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.18em]" style={{ color: C.muted }}>Built in Adobe Illustrator and Photoshop · to your brand guidelines · print-ready</p>
          </Rise>
        </div>
      </section>

      {/* ── 3D studio ── */}
      <section id="studio" className="relative overflow-hidden border-y" style={{ borderColor: C.line }}>
        <Grain />
        <div className="relative mx-auto max-w-[1320px] px-5 py-20 sm:px-8 md:py-28">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <Eyebrow>Brand stories in 3D</Eyebrow>
              <H2>Seven brands. Every pack. Turn them in your hands.</H2>
              <p className="mt-5 max-w-2xl text-[17px] leading-relaxed" style={{ color: C.muted }}>
                This is how you will review your own packs: each brand as a chapter, its full range on a set that speaks its voice, and every size side by side. Drag to turn, use the arrows to move between brands.
              </p>
            </div>
            <a href={STUDIO} target="_blank" rel="noopener" className="inline-flex items-center gap-2 self-start rounded-full border px-5 py-3 text-[14px] font-semibold transition-colors hover:bg-white/5 lg:self-end" style={{ borderColor: C.line }}>
              <Maximize2 className="h-4 w-4" /> Open full screen
            </a>
          </div>
          <div className="relative mt-10 aspect-[4/5] w-full overflow-hidden rounded-[22px] border shadow-[0_50px_120px_-40px_rgba(0,0,0,0.8)] sm:aspect-[16/10] md:aspect-[16/9]" style={{ borderColor: C.line, background: "#11100e" }}>
            {live ? (
              <iframe src={STUDIO} title="FrameMind brand stories in 3D" className="absolute inset-0 h-full w-full" allow="fullscreen" />
            ) : (
              <button onClick={() => setLive(true)} className="group absolute inset-0 h-full w-full text-left" aria-label="Load the 3D brand stories">
                <img src="/packaging/tall-kaapi.webp" alt="" className="absolute inset-0 h-full w-full object-cover sm:hidden" />
                <img src="/packaging/story-kaapi.webp" alt="" className="absolute inset-0 hidden h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.02] sm:block" />
                <div className="absolute inset-0" style={{ background: "linear-gradient(0deg,#0d0c0bcc,#0d0c0b10 55%)" }} />
                {/* phones: just the play chip on the poster, the words sit under it */}
                <span className="absolute bottom-6 left-1/2 inline-flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full px-6 py-3.5 text-[15px] font-semibold sm:hidden" style={{ background: C.brass, color: "#1b1916" }}>
                  <Play className="h-4 w-4" /> Start the 3D studio
                </span>
                <div className="absolute bottom-6 left-6 right-6 hidden flex-wrap items-center justify-between gap-4 sm:bottom-9 sm:left-9 sm:right-9 sm:flex">
                  <div>
                    <p className="font-mono text-[11px] uppercase tracking-[0.22em]" style={{ color: C.brass2 }}>Interactive · loads about 16 MB</p>
                    <p className="mt-2 text-[clamp(1.4rem,2.6vw,2.2rem)] tracking-[-0.03em]">Kaapi Katte, Mithaas, Monsoon Soda and four more</p>
                  </div>
                  <span className="inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-[15px] font-semibold transition-transform group-active:scale-[0.98]" style={{ background: C.brass, color: "#1b1916" }}>
                    <Play className="h-4 w-4" /> Start the 3D studio
                  </span>
                </div>
              </button>
            )}
          </div>
          <p className="mt-4 text-center text-[13px] sm:hidden" style={{ color: C.muted }}>Seven brands · every size · about 16 MB, best on Wi-Fi</p>
        </div>
      </section>

      {/* ── brand worlds ── */}
      <section className="relative overflow-hidden">
        <div className="relative mx-auto max-w-[1320px] px-5 py-20 sm:px-8 md:py-28">
          <Eyebrow>Sample brand worlds</Eyebrow>
          <H2>Seven industries, seven voices.</H2>
          <p className="mt-5 max-w-2xl text-[17px] leading-relaxed" style={{ color: C.muted }}>
            <span className="mb-2 block font-mono text-[11px] uppercase tracking-[0.2em] md:hidden" style={{ color: C.brass }}>Swipe through the seven →</span>
            Each concept brand has a platform (vision and voice), a palette with roles, a type pairing, one graphic device, and a full range of print-ready packs across sizes.
          </p>
          <div className="-mx-5 mt-12 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-2 [scrollbar-width:none] sm:-mx-8 sm:px-8 md:mx-0 md:grid md:grid-cols-6 md:gap-5 md:overflow-visible md:px-0 md:pb-0">
            {BRAND_WORLDS.map((b, i) => (
              <Rise key={b.id} delay={(i % 3) * 0.06} y={18} className={`w-[84vw] max-w-[420px] shrink-0 snap-center md:w-auto md:max-w-none ${i < 2 ? "md:col-span-3" : i < 5 ? "md:col-span-2" : "md:col-span-3"}`}>
                <article className="group h-full overflow-hidden rounded-[20px] border" style={{ borderColor: C.line, background: C.panel }}>
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <img src={`/packaging/story-${b.id}.webp`} alt={`${b.name} sample packaging range in 3D`} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]" />
                    <span className="absolute left-4 top-4 rounded-full px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] backdrop-blur-md" style={{ background: "#14110eb3", color: C.brass2 }}>{b.industry}</span>
                  </div>
                  <div className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <h3 className="text-[24px] tracking-[-0.03em]">{b.name}</h3>
                      <div className="flex shrink-0 overflow-hidden rounded-full border" style={{ borderColor: C.line }}>
                        {b.palette.map((c) => <span key={c} className="h-5 w-5" style={{ background: c }} />)}
                      </div>
                    </div>
                    <p className="mt-2 text-[15px] leading-relaxed" style={{ color: "#d7cfc2" }}>{b.vision}</p>
                    <p className="mt-4 font-mono text-[10.5px] uppercase tracking-[0.16em]" style={{ color: C.brass }}>{b.voice.join(" · ")}</p>
                    <p className="mt-2 text-[13px]" style={{ color: C.muted }}>{b.range}</p>
                  </div>
                </article>
              </Rise>
            ))}
            <Rise delay={0.12} y={18} className="w-[84vw] max-w-[420px] shrink-0 snap-center md:w-auto md:max-w-none md:col-span-6">
              <a href={STUDIO} target="_blank" rel="noopener" className="flex h-full min-h-[180px] flex-col justify-between gap-6 md:flex-row md:items-end rounded-[20px] border p-7 transition-colors hover:bg-white/[0.03]" style={{ borderColor: C.brass + "66" }}>
                <Eyebrow>All 40 pack designs</Eyebrow>
                <p className="max-w-2xl text-[clamp(1.5rem,2.4vw,2rem)] leading-tight tracking-[-0.03em]">Open the 3D studio and switch to <em className="not-italic" style={{ color: C.brass2 }}>All sizes</em> to compare every pouch, can, jar and box.</p>
                <span className="inline-flex items-center gap-2 text-[15px] font-semibold" style={{ color: C.brass2 }}>Open full screen <ArrowRight className="h-4 w-4" /></span>
              </a>
            </Rise>
          </div>
        </div>
      </section>

      {/* ── craft ── */}
      <section className="relative overflow-hidden border-y" style={{ borderColor: C.line, background: C.panel }}>
        <Grain />
        <div className="relative mx-auto max-w-[1320px] px-5 py-20 sm:px-8 md:py-28">
          <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <Eyebrow>How it is made</Eyebrow>
              <H2>Real dielines. Real designers. Files you own.</H2>
              <div className="mt-10 grid gap-7 sm:grid-cols-2">
                {CRAFT.map(({ icon: Icon, title, text }) => (
                  <div key={title}>
                    <Icon className="h-5 w-5" style={{ color: C.brass }} />
                    <h3 className="mt-3 text-[18px] font-medium tracking-[-0.02em]">{title}</h3>
                    <p className="mt-2 text-[14.5px] leading-relaxed" style={{ color: C.muted }}>{text}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 self-start">
              {[["sutra", "Serum carton, all panels"], ["chai", "Stand-up pouch, front and back"], ["mithaas", "Gift box lid with glue tabs"], ["kora", "Carry bag with gussets"]].map(([id, cap]) => (
                <figure key={id} className="overflow-hidden rounded-2xl border" style={{ borderColor: C.line, background: "#f4f1ea" }}>
                  <img src={`/packaging/dieline-${id}.webp`} alt={`${cap}: print-ready dieline with cut and fold lines`} loading="lazy" className="aspect-[4/3] w-full object-contain p-2" />
                  <figcaption className="border-t px-4 py-2.5 text-[12.5px]" style={{ borderColor: "#d9d3c7", color: "#4a4339" }}>{cap}</figcaption>
                </figure>
              ))}
              <p className="col-span-2 text-[12.5px]" style={{ color: C.muted }}>Magenta is the die-cut, cyan dashes are folds, green is the safe area. Every licence number, address and barcode on the samples is a placeholder.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── process ── */}
      <section className="relative">
        <div className="mx-auto max-w-[1320px] px-5 py-20 sm:px-8 md:py-28">
          <Eyebrow>The process</Eyebrow>
          <H2>From brief to press in five steps.</H2>
          <ol className="mt-12 grid gap-px overflow-hidden rounded-[20px] border md:grid-cols-5" style={{ borderColor: C.line, background: C.line }}>
            {STEPS.map(({ icon: Icon, title, text }, i) => (
              <li key={title} className="p-6" style={{ background: C.bg }}>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[12px]" style={{ color: C.brass }}>0{i + 1}</span>
                  <Icon className="h-5 w-5" style={{ color: C.muted }} />
                </div>
                <h3 className="mt-8 text-[18px] font-medium tracking-[-0.02em]">{title}</h3>
                <p className="mt-2 text-[14px] leading-relaxed" style={{ color: C.muted }}>{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── pricing ── */}
      <section id="pricing" className="relative overflow-hidden border-t" style={{ borderColor: C.line, background: "#211e1a" }}>
        <Grain />
        <div className="relative mx-auto max-w-[1320px] px-5 py-20 sm:px-8 md:py-28">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <Eyebrow>Pricing</Eyebrow>
              <H2>Studio quality, priced per pack.</H2>
            </div>
            <p className="max-w-md text-[14.5px] leading-relaxed" style={{ color: C.muted }}>Starting prices in INR. Your written quote follows a short call about your range, printer and timeline.</p>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PACK_TIERS.map((t) => (
              <div key={t.id} className="flex flex-col rounded-[20px] border p-6" style={{ borderColor: C.line, background: C.panel }}>
                <h3 className="text-[19px] font-medium tracking-[-0.02em]">{t.name}</h3>
                <p className="mt-5 text-[13px]" style={{ color: C.muted }}>from</p>
                <p className="text-[34px] tracking-[-0.04em]" style={{ color: C.brass2 }}>{inr(t.from)}</p>
                <p className="text-[13px]" style={{ color: C.muted }}>{t.unit}</p>
                <p className="mt-5 text-[14px] leading-relaxed">{t.detail}</p>
                <p className="mt-auto pt-5 text-[12.5px]" style={{ color: C.muted }}>{t.examples}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {PACK_BUNDLES.map((b) => (
              <div key={b.id} className="flex flex-wrap items-center justify-between gap-4 rounded-[20px] border p-6" style={{ borderColor: C.brass + "55", background: "linear-gradient(120deg,#2c2620,#24211d)" }}>
                <div>
                  <h3 className="text-[20px] font-medium tracking-[-0.02em]">{b.name}</h3>
                  <p className="mt-1 text-[14px]" style={{ color: C.muted }}>{b.detail}</p>
                </div>
                <p className="text-[28px] tracking-[-0.04em]" style={{ color: C.brass2 }}><span className="text-[13px]" style={{ color: C.muted }}>from </span>{inr(b.from)}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 grid gap-10 lg:grid-cols-2">
            <div>
              <h3 className="font-mono text-[11px] uppercase tracking-[0.22em]" style={{ color: C.brass }}>Add-ons</h3>
              <ul className="mt-4 divide-y" style={{ borderColor: C.line }}>
                {PACK_EXTRAS.map((x) => (
                  <li key={x.id} className="flex items-baseline justify-between gap-6 py-3.5" style={{ borderColor: C.line }}>
                    <span><span className="text-[15px]">{x.name}</span><span className="block text-[13px]" style={{ color: C.muted }}>{x.detail}</span></span>
                    <span className="shrink-0 text-[15px]" style={{ color: C.brass2 }}>{inr(x.from)} <span className="text-[12px]" style={{ color: C.muted }}>{x.unit}</span></span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-mono text-[11px] uppercase tracking-[0.22em]" style={{ color: C.brass }}>What moves the price</h3>
              <ul className="mt-4 space-y-3">
                {PRICE_FACTORS.map((f) => (
                  <li key={f} className="flex gap-3 text-[15px]"><Check className="mt-1 h-4 w-4 shrink-0" style={{ color: C.brass }} />{f}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── identity ── */}
      <section className="relative">
        <div className="mx-auto max-w-[1320px] px-5 py-16 sm:px-8">
          <div className="grid items-center gap-8 overflow-hidden rounded-[24px] border p-8 md:grid-cols-[1.2fr_1fr] md:p-12" style={{ borderColor: C.line, background: "#ede6da", color: "#1b1916" }}>
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.26em] text-[#8a6a3a]">No brand guidelines yet?</p>
              <h2 className="mt-4 text-[clamp(1.9rem,3.6vw,3rem)] font-normal leading-[1.04] tracking-[-0.045em]">We design the identity first, then every pack follows it.</h2>
              <p className="mt-4 max-w-lg text-[16px] leading-relaxed text-[#4a4339]">Logo, palette, type, voice and a guidelines book, so your packaging, website and social posts finally look like one brand.</p>
              <Link to="/pricing?service=brand" className="mt-7 inline-flex items-center gap-2 rounded-full bg-[#1b1916] px-6 py-3.5 text-[15px] font-semibold text-[#ede6da] transition-transform active:scale-[0.98]">
                See brand identity and guidelines <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <img src="/packaging/story-kora.webp" alt="Kora Studio sample identity: shopping bag, rigid box, business cards, envelope, letterhead and notebook" loading="lazy" className="w-full rounded-2xl object-cover" />
          </div>
        </div>
      </section>

      {/* ── quote ── */}
      <section id="quote" className="relative overflow-hidden border-t" style={{ borderColor: C.line }}>
        <Grain />
        <div className="relative mx-auto grid max-w-[1320px] gap-12 px-5 py-20 sm:px-8 md:py-28 lg:grid-cols-[1fr_1.1fr]">
          <div>
            <Eyebrow>Get a quote</Eyebrow>
            <H2>Tell us about your range.</H2>
            <p className="mt-5 max-w-md text-[16px] leading-relaxed" style={{ color: C.muted }}>Pick your packs and we will reply within one working day with a written quote, a timeline and the questions for your printer.</p>
            <div className="mt-10 space-y-3">
              {PACK_TYPES.map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-2xl border px-5 py-3.5" style={{ borderColor: C.line, background: C.panel }}>
                  <span className="text-[15px]">{p.label}</span>
                  <div className="flex items-center gap-3">
                    <button type="button" aria-label={`Fewer ${p.label}`} onClick={() => step(p.id, -1)} className="grid h-8 w-8 place-items-center rounded-full border" style={{ borderColor: C.line }}><Minus className="h-3.5 w-3.5" /></button>
                    <span className="w-6 text-center tabular-nums">{counts[p.id]}</span>
                    <button type="button" aria-label={`More ${p.label}`} onClick={() => step(p.id, 1)} className="grid h-8 w-8 place-items-center rounded-full border" style={{ borderColor: C.line }}><Plus className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-between rounded-2xl border px-5 py-3.5" style={{ borderColor: C.line, background: C.panel }}>
                <span className="text-[15px]">Sizes or flavours per pack</span>
                <div className="flex items-center gap-3">
                  <button type="button" aria-label="Fewer sizes" onClick={() => setSizes((s) => Math.max(1, s - 1))} className="grid h-8 w-8 place-items-center rounded-full border" style={{ borderColor: C.line }}><Minus className="h-3.5 w-3.5" /></button>
                  <span className="w-6 text-center tabular-nums">{sizes}</span>
                  <button type="button" aria-label="More sizes" onClick={() => setSizes((s) => Math.min(8, s + 1))} className="grid h-8 w-8 place-items-center rounded-full border" style={{ borderColor: C.line }}><Plus className="h-3.5 w-3.5" /></button>
                </div>
              </div>
              {[[illus, setIllus, "Custom illustration"], [needIdentity, setNeedIdentity, "We also need brand identity and guidelines"]].map(([v, set, label]) => (
                <label key={label as string} className="flex cursor-pointer items-center justify-between rounded-2xl border px-5 py-3.5" style={{ borderColor: C.line, background: C.panel }}>
                  <span className="text-[15px]">{label as string}</span>
                  <input type="checkbox" checked={v as boolean} onChange={(e) => (set as (b: boolean) => void)(e.target.checked)} className="h-5 w-5 accent-[#c9a46a]" />
                </label>
              ))}
            </div>
            <div className="mt-6 rounded-2xl border p-6" style={{ borderColor: C.brass + "66", background: "#2a2520" }}>
              <p className="text-[13px]" style={{ color: C.muted }}>{skus} pack{skus === 1 ? "" : "s"} × {sizes} size{sizes === 1 ? "" : "s"}{illus ? " · illustration" : ""}{needIdentity ? " · identity quoted separately" : ""}</p>
              <p className="mt-1 text-[40px] tracking-[-0.045em]" style={{ color: C.brass2 }}><span className="text-[15px]" style={{ color: C.muted }}>from </span>{inr(estimate)}</p>
              <p className="text-[12.5px]" style={{ color: C.muted }}>A starting estimate. Your written quote may be lower for simple packs or higher for special finishes.</p>
            </div>
          </div>

          <form onSubmit={send} className="self-start rounded-[24px] border p-6 sm:p-8" style={{ borderColor: C.line, background: C.panel }}>
            {state.done ? (
              <div className="py-16 text-center">
                <Check className="mx-auto h-10 w-10" style={{ color: C.brass }} />
                <p className="mt-5 text-[26px] tracking-[-0.03em]">Thank you. Your request is with us.</p>
                <p className="mt-2 text-[15px]" style={{ color: C.muted }}>We will reply within one working day.</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {([["name", "Your name", "text", "name"], ["brand", "Brand or company", "text", "organization"], ["phone", "Phone or WhatsApp", "tel", "tel"], ["email", "Email", "email", "email"]] as const).map(([k, ph, type, ac]) => (
                  <input key={k} type={type} autoComplete={ac} placeholder={ph} value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} className={input} style={{ borderColor: C.line, color: C.bone }} />
                ))}
                <select value={form.timeline} onChange={(e) => setForm({ ...form, timeline: e.target.value })} className={`${input} sm:col-span-2`} style={{ borderColor: C.line, color: form.timeline ? C.bone : "#7d7467", background: C.panel }}>
                  <option value="">When do you need it printed?</option>
                  <option>Within a month</option><option>1 to 3 months</option><option>3 months or more</option><option>Just exploring</option>
                </select>
                <textarea rows={5} placeholder="Your product, where it sells, your printer if you have one, and any packs you love" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className={`${input} sm:col-span-2`} style={{ borderColor: C.line, color: C.bone }} />
                <input tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
                {state.error && <p className="text-[14px] text-[#e8907a] sm:col-span-2">{state.error}</p>}
                <button disabled={state.busy} className="inline-flex items-center justify-center gap-2 rounded-full px-6 py-4 text-[15px] font-semibold transition-transform active:scale-[0.98] disabled:opacity-60 sm:col-span-2" style={{ background: C.brass, color: "#1b1916" }}>
                  {state.busy ? "Sending…" : <>Request my quote <ArrowRight className="h-4 w-4" /></>}
                </button>
                <p className="text-[12.5px] sm:col-span-2" style={{ color: C.muted }}>Prefer to talk? WhatsApp <a className="underline" href="https://wa.me/918073087576">+91 80730 87576</a>.</p>
              </div>
            )}
          </form>
        </div>
        <p className="relative mx-auto max-w-[1320px] px-5 pb-12 text-[12px] leading-relaxed sm:px-8" style={{ color: "#7d7467" }}>
          The seven sample brands are fictional concepts by FrameMind. Their photographic sets and hero illustrations were made with AI tools for this showcase; the packs themselves are print-ready dieline files. Client packaging is drawn and built by our designers in Adobe software.
        </p>
      </section>
    </div>
  );
}
