import type { Metadata } from "next";
import Image from "next/image";
import { Download } from "lucide-react";
import { requireUser } from "@/lib/hq/auth";
import { PageHeader, Panel } from "@/components/hq/ui";
import { C } from "@/lib/social/canvas";

export const metadata: Metadata = { title: "Brand Kit" };

/*
 * The logo kit: the icon upscaled to 4K and cut out with Higgsfield, the wordmark set in Montserrat by
 * scripts/brand-assets.py. public/brand/kit/ holds the files. The icon is the same for FrameMind AI Studio and 360VUE;
 * the wordmarks differ.
 */

const ICONS = [
  { file: "framemind-icon-4k.png", name: "Icon", note: "4096 × 4096 · transparent", bg: "bg-[#2a2a2e]" },
  { file: "framemind-icon-on-ink-4k.png", name: "Icon on Ink", note: "4096 × 4096 · profile pictures, app icons", bg: "bg-[#0D0D0D]" },
  { file: "framemind-icon-mono-4k.png", name: "Icon — monochrome", note: "4096 × 4096 · transparent, one colour", bg: "bg-[#ecebe6]" },
];

const LOGOS = [
  { file: "framemind-logo-profile-dp-4k.png", name: "Profile picture (DP)", note: "3840 × 3840 · fits a round crop: Instagram, WhatsApp, LinkedIn", bg: "bg-[#0D0D0D]" },
  { file: "framemind-logo-dark-4k.png", name: "Primary — dark", note: "3840 × 3840 · on Ink", bg: "bg-[#0D0D0D]" },
  { file: "framemind-logo-light-4k.png", name: "Primary — light", note: "3840 × 3840 · on Paper", bg: "bg-[#F5F4F0]" },
  { file: "framemind-logo-mono-4k.png", name: "Monochrome", note: "3840 × 3840 · one colour", bg: "bg-[#ecebe6]" },
  { file: "framemind-logo-on-dark-transparent-4k.png", name: "Primary — for dark", note: "Transparent · light letters", bg: "bg-[#2a2a2e]" },
  { file: "framemind-logo-on-light-transparent-4k.png", name: "Primary — for light", note: "Transparent · dark letters", bg: "bg-[#F5F4F0]" },
  { file: "framemind-horizontal-dark-4k.png", name: "Horizontal — dark", note: "Wide lock-up · on Ink", bg: "bg-[#0D0D0D]" },
  { file: "framemind-horizontal-on-dark-transparent-4k.png", name: "Horizontal — for dark", note: "Transparent · light letters", bg: "bg-[#2a2a2e]" },
  { file: "framemind-horizontal-on-light-transparent-4k.png", name: "Horizontal — for light", note: "Transparent · dark letters", bg: "bg-[#F5F4F0]" },
];

const COLOURS = [
  { name: "Ink", hex: C.ink, use: "Backgrounds, text, the main identity" },
  { name: "Near-black", hex: C.graphite, use: "Dark panels and cards" },
  { name: "Paper", hex: C.paper, use: "Light backgrounds, text on dark" },
  { name: "Lime", hex: C.accent, use: "The accent: on dark only, one thing per design" },
  { name: "Violet", hex: C.violet, use: "Second accent: on paper, sparingly" },
  { name: "Grey", hex: C.blueprint, use: "Annotations and secondary text" },
];

/** The colours inside the logo itself (its own artwork, not the UI palette). */
const LOGO_COLOURS = [
  { name: "Mind gold", hex: "#F7C448", use: "“Mind” in the wordmark: #FFE896 → #F7C448 → #EA981C" },
  { name: "Studio lavender", hex: "#B9AFF0", use: "“AI STUDIO” on dark: #D6CFFA → #A092E8" },
  { name: "Dot gold", hex: "#F9C422", use: "The dots in the tagline" },
];

function FileCard({ f, base = "/brand/kit" }: { f: { file: string; name: string; note: string; bg: string }; base?: string }) {
  return (
    <li className="overflow-hidden rounded-[var(--radius-md)] border border-graphite/12">
      <div className={`relative grid aspect-[4/3] place-items-center p-6 ${f.bg}`}>
        <Image src={`${base}/preview/${f.file.replace(/\.png$/, ".webp")}`} alt={f.name} width={600} height={600} unoptimized className="max-h-full w-auto object-contain" />
      </div>
      <div className="flex items-center justify-between gap-3 bg-paper-50 px-4 py-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{f.name}</p>
          <p className="text-xs text-blueprint">{f.note}</p>
        </div>
        <a href={`${base}/${f.file}`} download className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-graphite/20 px-3 py-1.5 text-xs font-semibold hover:bg-graphite hover:text-paper">
          <Download className="size-3.5" /> PNG
        </a>
      </div>
    </li>
  );
}

export default async function BrandKitPage() {
  await requireUser();
  return (
    <>
      <PageHeader
        eyebrow="Knowledge"
        icon="Palette"
        title="Brand Kit"
        description="The FrameMind AI Studio logo and icon in 4K, the colours and the type. Download any file: the dark logo goes on Ink, the light one on Paper."
      />
      <div className="space-y-6">
        <Panel title="Icon" subtitle="One icon for FrameMind AI Studio and 360VUE: the gold shutter and the mind inside it. The wordmark is what tells the two companies apart.">
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {ICONS.map((f) => (
              <FileCard key={f.file} f={f} />
            ))}
          </ul>
        </Panel>

        <Panel title="Logo" subtitle="Rendered in 4K. “FrameMind” is Montserrat Bold with “Mind” in gold; “AI STUDIO” sits between two rules; the line under it is DESIGN • SOFTWARE • AI SOLUTIONS.">
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {LOGOS.map((f) => (
              <FileCard key={f.file} f={f} />
            ))}
          </ul>
          <p className="mt-4 border-t border-graphite/10 pt-4 text-xs leading-relaxed text-charcoal">
            Never redraw, recolour, stretch or re-type the logo: use these files. Clear space is half the icon&apos;s height on every side. Smallest on screen: the icon 24 px, the stacked logo 160 px wide.
          </p>
        </Panel>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <Panel title="Colours" subtitle="The studio's palette for screens, print and posts. Ink and paper, with lime as the one accent.">
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {COLOURS.map((c) => (
                <li key={c.hex} className="overflow-hidden rounded-[var(--radius-md)] border border-graphite/12">
                  <div className="h-16" style={{ background: c.hex }} />
                  <div className="px-3 py-2.5">
                    <p className="text-sm font-semibold">{c.name}</p>
                    <p className="font-mono text-xs text-blueprint">{c.hex}</p>
                    <p className="mt-1 text-[11px] leading-snug text-charcoal">{c.use}</p>
                  </div>
                </li>
              ))}
            </ul>
            <p className="annot mt-5 text-[10px] text-blueprint">In the logo artwork only</p>
            <ul className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
              {LOGO_COLOURS.map((c) => (
                <li key={c.name} className="flex items-center gap-2.5 rounded-[var(--radius-sm)] border border-graphite/12 px-2.5 py-2">
                  <span className="size-7 shrink-0 rounded-full" style={{ background: c.hex }} />
                  <span className="min-w-0">
                    <span className="block text-xs font-semibold">{c.name}</span>
                    <span className="block text-[10px] leading-snug text-charcoal">{c.use}</span>
                  </span>
                </li>
              ))}
            </ul>
          </Panel>
          <Panel title="Type">
            <p className="text-5xl font-bold tracking-tight" style={{ fontFamily: "Montserrat, var(--font-sans)" }}>
              Frame<span style={{ color: "#E9A62C" }}>Mind</span>
            </p>
            <p className="mt-2 text-xs font-medium uppercase tracking-[0.5em] text-violet">AI Studio</p>
            <dl className="mt-6 space-y-3 text-sm">
              <div>
                <dt className="font-semibold">Montserrat</dt>
                <dd className="text-charcoal">The wordmark only, already set in the logo files.</dd>
              </div>
              <div>
                <dt className="font-semibold">DM Sans</dt>
                <dd className="text-charcoal">Everything a person reads: headings and body, weights 400 to 700.</dd>
              </div>
              <div>
                <dt className="font-mono font-semibold">JetBrains Mono</dt>
                <dd className="text-charcoal">Numbers, codes and labels.</dd>
              </div>
            </dl>
          </Panel>
        </div>
      </div>
    </>
  );
}
