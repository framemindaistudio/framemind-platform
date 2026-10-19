"use client";

import Image from "next/image";
import { Check, Download, X } from "lucide-react";
import { buttonClass } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/form";
import { Panel } from "@/components/hq/ui";
import { C } from "@/lib/social/canvas";
import { FORMATS } from "@/lib/social/types";
import { cn } from "@/lib/utils";
import { Bullets } from "./parts/bits";
import { CopyButton } from "./parts/CopyButton";

/*
 * The FrameMind brand on one page: the logo files cut from the 8K master, the colours and type HQ and the studio
 * website use, sizes and safe zones, file naming and the check before publishing. Source: OPERATIONS/01_BRAND and
 * 08_SOCIAL_MEDIA. Change a rule there and here together.
 */

const SECTIONS = [
  { id: "kit-logo", name: "Logo files" },
  { id: "kit-logo-rules", name: "Logo rules" },
  { id: "kit-colour", name: "Colours" },
  { id: "kit-type", name: "Type" },
  { id: "kit-sizes", name: "Sizes and safe zones" },
  { id: "kit-pictures", name: "Pictures" },
  { id: "kit-naming", name: "File naming" },
  { id: "kit-check", name: "Before you publish" },
];

/* ───────────────────────────── logo files (public/brand) ───────────────────────────── */

interface BrandFile {
  file: string;
  name: string;
  w: number;
  h: number;
  kind: string;
  use: string;
  /** the version for dark backgrounds: shown on ink */
  dark?: boolean;
}

const LOGO_FILES: BrandFile[] = [
  { file: "fm-logo-light.png", name: "Full lock-up", w: 800, h: 761, kind: "PNG, transparent", use: "Covers, title slides and documents on light backgrounds." },
  { file: "fm-logo-dark.png", name: "Full lock-up, for dark", w: 800, h: 708, kind: "PNG, transparent", use: "Covers and title slides on black, and on photographs with a dark panel.", dark: true },
  { file: "fm-mark-light.png", name: "Mark", w: 512, h: 512, kind: "PNG, transparent", use: "Small spaces on light backgrounds: the corner of a post, stamps, watermarks." },
  { file: "fm-mark-dark.png", name: "Mark, for dark", w: 512, h: 512, kind: "PNG, transparent", use: "The same small spaces on black and on photographs.", dark: true },
  { file: "icon-512.png", name: "App icon", w: 512, h: 512, kind: "PNG", use: "Profile pictures on every platform." },
];

const LOGO_DO = [
  "Clear space: half the mark's height on all four sides. No text, edge or other logo enters it.",
  "Smallest on screen: the mark 24 px, the lock-up 120 px wide. In print: 8 mm and 30 mm.",
  "On a post: the mark with “FrameMind / AI STUDIO” set beside it, as Create draws it. One logo per design.",
  "On a photograph: the version for dark, with a darkened panel behind it.",
  "With a client's logo: client left, FrameMind right, the same height, a thin rule between. Only with the client's approval.",
];

const LOGO_DONT = [
  "Stretch, skew, rotate or outline it.",
  "Recolour it, or put the lime on a light background where it cannot be read.",
  "Place it on a busy photograph without a panel behind it.",
  "Re-type “FrameMind” in another font, or add shadows, glows or bevels.",
  "Use a low-resolution copy. Start from the 8K master.",
];

/* ───────────────────────────── colour ───────────────────────────── */

const COLOURS: { name: string; hex: string; role: string }[] = [
  { name: "Ink", hex: C.ink, role: "Primary dark: backgrounds, text, the logo" },
  { name: "Near-black", hex: C.graphite, role: "Dark panels and cards" },
  { name: "Charcoal", hex: C.charcoal, role: "Body text on paper" },
  { name: "Grey", hex: C.blueprint, role: "Annotations and secondary text" },
  { name: "Paper", hex: C.paper, role: "Primary light background" },
  { name: "Paper 50", hex: C.paper50, role: "Cards on paper" },
  { name: "Paper 200", hex: C.paper200, role: "Panels and rules on paper" },
  { name: "Lime", hex: C.accent, role: "The accent: on dark only, one thing per design" },
  { name: "Violet", hex: C.violet, role: "Second accent: on paper, sparingly" },
];

const SHARES = [
  { name: "Ink", hex: C.ink, share: "45 to 55%", width: 50 },
  { name: "Paper", hex: C.paper, share: "35 to 45%", width: 40 },
  { name: "Grey", hex: C.blueprint, share: "about 5%", width: 5 },
  { name: "Lime", hex: C.accent, share: "3 to 5%", width: 4 },
  { name: "Violet", hex: C.violet, share: "sparingly", width: 1 },
];

/* ───────────────────────────── type ───────────────────────────── */

const SCALE: { style: string; font: string; size: string; px: number; line: number; use: string; sample: string; cls: string }[] = [
  { style: "Display / H1", font: "DM Sans 700", size: "64 / 70", px: 64, line: 70, use: "Hero lines, covers", sample: "Shipped.", cls: "font-bold tracking-[-0.02em]" },
  { style: "H2", font: "DM Sans 700", size: "44 / 52", px: 44, line: 52, use: "Section titles", sample: "How we work", cls: "font-bold tracking-[-0.015em]" },
  { style: "H3", font: "DM Sans 600", size: "28 / 36", px: 28, line: 36, use: "Sub-sections", sample: "Scope, then price", cls: "font-semibold tracking-[-0.01em]" },
  { style: "Body", font: "DM Sans 400 / 500", size: "16 / 26", px: 16, line: 26, use: "Paragraphs", sample: "You own everything we build.", cls: "font-normal" },
  { style: "Small", font: "DM Sans 500", size: "14 / 22", px: 14, line: 22, use: "Captions, help text", sample: "Prices ex-GST.", cls: "font-medium" },
  { style: "Label", font: "JetBrains Mono 500, uppercase", size: "11 / 16", px: 11, line: 16, use: "Tags, indices", sample: "Case study · 01", cls: "font-mono font-medium uppercase tracking-[0.12em]" },
  { style: "Numerals", font: "JetBrains Mono 500", size: "any", px: 16, line: 26, use: "Prices, codes, dates", sample: "₹63,000 · 1080 × 1350", cls: "font-mono font-medium tabular" },
];

const WORDS_ON_A_DESIGN = [
  "One headline and one mono label. No more.",
  "Feed post: one idea, one image. Headline 10 words at most.",
  "Reel cover: 2 to 6 words, 3 lines at most. YouTube thumbnail: 2 words at most.",
  "Carousel: one point a slide, 25 words at most.",
  "No exclamation marks and no emoji on a design.",
];

/* ───────────────────────────── sizes ───────────────────────────── */

const safe = FORMATS.story.safe;
const px = (f: keyof typeof FORMATS) => `${FORMATS[f].w} × ${FORMATS[f].h}`;

const SIZES: { format: string; canvas: string; ratio: string; note: string; create: string }[] = [
  { format: "Feed post, portrait", canvas: px("post"), ratio: "4:5", note: "The default for Instagram and LinkedIn. Keep the subject and headline inside the centre 1080 × 1080: the profile grid crops to it.", create: FORMATS.post.label },
  { format: "Feed post, square", canvas: px("square"), ratio: "1:1", note: "Quotes and numbers.", create: FORMATS.square.label },
  { format: "Carousel", canvas: px("post"), ratio: "4:5", note: "Slide 1 is the hook, the last slide the call to action. On LinkedIn, upload the slides as one PDF.", create: FORMATS.post.label },
  { format: "Story, Reel cover", canvas: px("story"), ratio: "9:16", note: `Keep clear: top ${safe.top} px, bottom ${safe.bottom} px, right ${safe.right} px. A Reel cover must also read as a 4:5 crop.`, create: FORMATS.story.label },
  { format: "Reel, Short", canvas: px("story"), ratio: "9:16", note: "H.264 MP4, 30 fps, AAC 48 kHz. Captions burned in: most people watch muted.", create: "Made in the edit" },
  { format: "YouTube thumbnail", canvas: px("wide"), ratio: "16:9", note: "Two words of text at most.", create: FORMATS.wide.label },
  { format: "Profile picture", canvas: "512 × 512", ratio: "1:1", note: "The app icon above.", create: "The app icon" },
];

/* ───────────────────────────── pictures, naming, the check ───────────────────────────── */

const PICTURE_RULES = [
  "Client work, screens and results only with the client's written approval.",
  "People only with their consent; a learner under 18 only with a parent's.",
  "A generated or drawn picture is labelled as an illustration, and never captioned as real client work.",
  "Drone footage only within the drone rules and the location's permission.",
  "No client data in a frame: real dashboards, emails, phone numbers.",
];

const CHECKS = [
  "Is every claim true today, or written as a plan?",
  "Are the prices right against the current Rate Card, with “ex-GST”?",
  "Has the client approved their name, logo and work being shown?",
  "Does it sound like a person, not a brochure?",
  "Are the names and ₹ amounts spelled exactly right?",
];

function Code({ text }: { text: string }) {
  const bits = text.split("_");
  return (
    <code className="my-1 block w-fit max-w-full rounded-[3px] bg-graphite/[0.07] px-2 py-1 font-mono text-xs leading-relaxed text-graphite">
      {bits.map((bit, i) => (
        <span key={i}>
          {bit}
          {i < bits.length - 1 && (
            <>
              _<wbr />
            </>
          )}
        </span>
      ))}
    </code>
  );
}
const Sub = ({ children, className }: { children: React.ReactNode; className?: string }) => <p className={cn("annot mb-2 text-[10px] text-blueprint", className)}>{children}</p>;

/**
 * Social Studio → Brand kit: what someone needs while making a post, on one page. Logo files to download, colours,
 * type, sizes and safe zones, file naming and the check before publishing.
 */
export function BrandKit() {
  return (
    <div>
      <p className="mb-4 max-w-2xl text-sm text-charcoal">
        What you need while making a post, on one page. The designs in Create follow all of this already: use it when you make something by hand, or brief someone else.
      </p>
      <nav aria-label="On this page" className="mb-6 flex flex-wrap gap-2">
        {SECTIONS.map((s) => (
          <a key={s.id} href={`#${s.id}`} className="rounded-[var(--radius-sm)] border border-graphite/20 px-3 py-1.5 text-xs font-semibold text-graphite transition-colors hover:border-graphite/50 hover:bg-graphite/5">
            {s.name}
          </a>
        ))}
      </nav>

      <div className="space-y-5">
        <div id="kit-logo" className="scroll-mt-20">
          <Panel title="Logo files" subtitle="Never redraw, recolour, stretch or re-type the logo. Use these files.">
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {LOGO_FILES.map((f) => (
                <li key={f.file} className="flex flex-col overflow-hidden rounded-[var(--radius-sm)] border border-graphite/12 bg-paper-50">
                  <div className={cn("relative aspect-square", f.dark ? "bg-ink" : "bg-paper")}>
                    <Image src={`/brand/${f.file}`} alt="" fill unoptimized sizes="(min-width: 1024px) 220px, (min-width: 640px) 45vw, 90vw" className="object-contain p-6" />
                  </div>
                  <div className="flex flex-1 flex-col border-t border-graphite/10 p-3.5">
                    <h3 className="text-sm font-semibold text-graphite">{f.name}</h3>
                    <p className="mt-1 text-xs leading-relaxed text-charcoal">{f.use}</p>
                    <p className="mb-3 mt-2 font-mono text-[11px] leading-relaxed text-charcoal">
                      {f.file}
                      <br />
                      {f.w} × {f.h} px · {f.kind}
                    </p>
                    <a href={`/brand/${f.file}`} download className={buttonClass("secondary", "sm", "mt-auto self-start")}>
                      <Download className="size-3.5" aria-hidden /> Download<span className="sr-only">: {f.name}</span>
                    </a>
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-4 border-t border-graphite/10 pt-4 text-xs leading-relaxed text-charcoal">
              For print, start from the 8K master in the brand folder (<span className="font-mono">Brand-Assets/LOGO Versions</span>). It is not edited or renamed.
            </p>
          </Panel>
        </div>

        <div id="kit-logo-rules" className="scroll-mt-20">
          <Panel title="Logo: do and do not" subtitle="The framed head: a mind inside a frame.">
            <div className="grid gap-x-8 gap-y-6 lg:grid-cols-2">
              <div>
                <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-graphite">
                  <Check className="size-4 text-ok" aria-hidden /> Do
                </p>
                <Bullets items={LOGO_DO} />
              </div>
              <div>
                <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-graphite">
                  <X className="size-4 text-bad" aria-hidden /> Do not
                </p>
                <Bullets items={LOGO_DONT} />
              </div>
            </div>
          </Panel>
        </div>

        <div id="kit-colour" className="scroll-mt-20">
          <Panel title="Colours" subtitle="Ink and paper, with lime as the one accent. Press a hex to copy it.">
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {COLOURS.map((c) => (
                <li key={c.name} className="overflow-hidden rounded-[var(--radius-sm)] border border-graphite/12 bg-paper-50">
                  <div aria-hidden className="h-14 border-b border-graphite/10" style={{ background: c.hex }} />
                  <div className="px-3 pb-2 pt-2.5">
                    <p className="text-sm font-semibold text-graphite">{c.name}</p>
                    <p className="min-h-8 text-xs leading-snug text-charcoal">{c.role}</p>
                    <CopyButton text={c.hex.toUpperCase()} label={c.hex.toUpperCase()} what={`copy the hex of ${c.name}`} variant="ghost" className="-ml-3 mt-0.5 font-mono" />
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-5 grid gap-x-8 gap-y-4 border-t border-graphite/10 pt-4 lg:grid-cols-2">
              <div>
                <Sub>Share of any layout</Sub>
                <div aria-hidden className="flex h-5 overflow-hidden rounded-[3px] border border-graphite/20">
                  {SHARES.map((s) => (
                    <span key={s.name} style={{ width: `${s.width}%`, background: s.hex }} />
                  ))}
                </div>
                <p className="mt-2 text-xs leading-relaxed text-charcoal">{SHARES.map((s) => `${s.name} ${s.share}`).join(" · ")}</p>
              </div>
              <div>
                <Sub>Rules</Sub>
                <Bullets
                  className="text-xs"
                  items={["Lime only on ink or near-black, never as text on paper.", "One accent per design: lime, or violet, not both.", "The status colours of HQ (green, amber, red) never appear in a post."]}
                />
              </div>
            </div>
          </Panel>
        </div>

        <div id="kit-type" className="scroll-mt-20">
          <Panel title="Type" subtitle="Two fonts. Both are free on Google Fonts.">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-[var(--radius-sm)] border border-graphite/12 bg-paper p-4">
                <p className="font-sans text-4xl font-bold tracking-[-0.02em] text-graphite">DM Sans</p>
                <p className="mt-2 font-sans text-sm text-charcoal">Everything a person reads. Weights 400 to 700.</p>
                <p className="mt-2 font-sans text-lg font-medium text-graphite">Aa Bb Cc Dd Ee Ff Gg 0123456789 ₹</p>
              </div>
              <div className="rounded-[var(--radius-sm)] border border-graphite/12 bg-paper p-4">
                <p className="font-mono text-4xl font-medium text-graphite">JetBrains Mono</p>
                <p className="mt-2 font-sans text-sm text-charcoal">Numbers, codes and labels. Weight 500.</p>
                <p className="mt-2 font-mono text-lg font-medium text-graphite">Aa Bb Cc Dd Ee 0123456789 ₹</p>
              </div>
            </div>
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-xs">
                <caption className="sr-only">The type scale</caption>
                <thead>
                  <tr className="border-b border-graphite/15">
                    {["Style", "Looks like", "Font and weight", "Size / line", "Use"].map((h) => (
                      <th key={h} scope="col" className="annot whitespace-nowrap px-2 pb-2 text-[10px] font-medium text-blueprint first:pl-0">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-dashed divide-graphite/12">
                  {SCALE.map((r) => (
                    <tr key={r.style}>
                      <th scope="row" className="whitespace-nowrap py-2 pr-2 font-semibold text-graphite">
                        {r.style}
                      </th>
                      <td className="px-2 py-2">
                        <span className={cn("block whitespace-nowrap text-graphite", r.cls)} style={{ fontSize: r.px, lineHeight: `${r.line}px` }}>
                          {r.sample}
                        </span>
                      </td>
                      <td className="px-2 py-2 text-charcoal">{r.font}</td>
                      <td className="whitespace-nowrap px-2 py-2 font-mono text-charcoal">{r.size}</td>
                      <td className="px-2 py-2 text-charcoal">{r.use}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-5 border-t border-graphite/10 pt-4">
              <Sub>Words on a design</Sub>
              <Bullets className="text-xs" items={[...WORDS_ON_A_DESIGN, "Numbers as numerals with Indian grouping (₹1,25,000). Dates as 2 Oct 2026."]} />
            </div>
          </Panel>
        </div>

        <div id="kit-sizes" className="scroll-mt-20">
          <Panel title="Sizes and safe zones" subtitle="Export stills as PNG or high-quality JPG, sRGB, under 8 MB.">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-xs">
                <caption className="sr-only">Formats, their canvas sizes and what to keep in mind</caption>
                <thead>
                  <tr className="border-b border-graphite/15">
                    {["Format", "Canvas, px", "Ratio", "Keep in mind"].map((h) => (
                      <th key={h} scope="col" className="annot whitespace-nowrap px-2 pb-2 text-[10px] font-medium text-blueprint first:pl-0">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-dashed divide-graphite/12">
                  {SIZES.map((r) => (
                    <tr key={r.format}>
                      <th scope="row" className="py-2 pr-2 align-top font-semibold text-graphite">
                        {r.format}
                        <span className="mt-0.5 block whitespace-nowrap font-normal text-charcoal">{r.create}</span>
                      </th>
                      <td className="whitespace-nowrap px-2 py-2 align-top font-mono text-graphite">{r.canvas}</td>
                      <td className="whitespace-nowrap px-2 py-2 align-top font-mono text-charcoal">{r.ratio}</td>
                      <td className="px-2 py-2 align-top leading-relaxed text-charcoal">{r.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>

        <div className="grid items-start gap-5 xl:grid-cols-3">
          <div id="kit-pictures" className="scroll-mt-20">
            <Panel title="Pictures" subtitle="Photographs, screens and video.">
              <Sub>Look</Sub>
              <p className="text-sm leading-relaxed text-charcoal">Real work in real light. Screens shown clean and large. Photographs in colour or black and white; no heavy filters.</p>
              <Sub className="mt-4">Rules</Sub>
              <Bullets items={PICTURE_RULES} />
            </Panel>
          </div>
          <div id="kit-naming" className="scroll-mt-20">
            <Panel title="File naming" subtitle="So a file can be found again.">
              <Sub>From Create</Sub>
              <div className="text-sm leading-relaxed text-charcoal">
                Downloads are named for you:
                <Code text="FrameMind_<design>_<YYYYMMDD>_<size>.png" />
                For example:
                <Code text="FrameMind_hiring_20261012_post.png" />
              </div>
              <Sub className="mt-4">Client deliverables</Sub>
              <div className="text-sm leading-relaxed text-charcoal">
                <Code text="<ClientCode>_<Project>_<YYYYMMDD>_<Format>_<Version>.<ext>" />
                For example:
                <Code text="CL014_BrandFilm_20261023_Reel01_v2.mp4" />
              </div>
            </Panel>
          </div>
          <div id="kit-check" className="scroll-mt-20">
            <Panel title="Before you publish" subtitle="The 30-second check. Tick as you go: nothing is saved.">
              <ul className="space-y-3">
                {CHECKS.map((c) => (
                  <li key={c}>
                    <Checkbox label={<span className="leading-relaxed text-graphite">{c}</span>} className="items-start [&>input]:mt-1 [&>input]:shrink-0" />
                  </li>
                ))}
              </ul>
              <p className="mt-4 border-l-2 border-graphite/25 pl-3 text-xs leading-relaxed text-charcoal">Tag a client only after they have approved the post. Reply to comments within 24 hours.</p>
            </Panel>
          </div>
        </div>
      </div>
    </div>
  );
}
