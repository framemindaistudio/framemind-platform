"use client";

import { useMemo, useState } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Check, ChevronLeft, ChevronRight, Copy, Download, FolderArchive } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Panel } from "@/components/hq/ui";
import { INDUSTRIES } from "@/lib/content/industries";
import { brandOf } from "@/lib/content/industry-brands";
import { saveBlob, zip } from "@/lib/social/render";
import { CAROUSELS, STYLES, type Carousel, type IndustryStories } from "@/lib/social/carousels";
import { H, SlideSvg, W, fontCss } from "@/lib/social/carousels/slides";
import { cn } from "@/lib/utils";

/*
 * Social Studio → Carousels: five storytelling carousels for each of the ten industry apps (one per style), drawn as
 * illustrated slides in the app's brand. Each slide downloads as a 1080 × 1350 PNG, or the whole carousel as a ZIP,
 * with its caption ready to copy.
 */

const SCREEN_FONTS = fontCss((f) => `/fonts/social/${f}`);

/* ── export: the slide's SVG, with its fonts and logos inlined, drawn onto a canvas ── */

const cache = new Map<string, Promise<string>>();
function dataUri(url: string, type: string) {
  if (!cache.has(url))
    cache.set(
      url,
      fetch(url)
        .then((r) => r.arrayBuffer())
        .then((b) => {
          let s = "";
          const bytes = new Uint8Array(b);
          for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
          return `data:${type};base64,${btoa(s)}`;
        }),
    );
  return cache.get(url)!;
}

async function slidePng(story: IndustryStories, car: Carousel, i: number): Promise<Blob> {
  const files = ["bangers.woff2", "kalam-400.woff2", "kalam-700.woff2", "archivo-black.woff2", "inter.woff2"];
  const uris = Object.fromEntries(await Promise.all(files.map(async (f) => [f, await dataUri(`/fonts/social/${f}`, "font/woff2")] as const)));
  let svg = renderToStaticMarkup(<SlideSvg story={story} car={car} i={i} fonts={fontCss((f) => uris[f])} uid={`x${i}`} />);
  const logos = [...new Set(svg.match(/\/brand\/os\/[a-z-]+\.svg/g) ?? [])];
  for (const l of logos) svg = svg.split(`"${l}"`).join(`"${await dataUri(l, "image/svg+xml")}"`);
  const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
  try {
    const img = new Image();
    img.decoding = "sync";
    await new Promise<void>((ok, fail) => {
      img.onload = () => ok();
      img.onerror = () => fail(new Error("The slide could not be drawn."));
      img.src = url;
    });
    // fonts inside an SVG image need a moment after load before they paint
    await new Promise((r) => setTimeout(r, 120));
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    canvas.getContext("2d")!.drawImage(img, 0, 0, W, H);
    return await new Promise<Blob>((ok, fail) => canvas.toBlob((b) => (b ? ok(b) : fail(new Error("PNG failed"))), "image/png"));
  } finally {
    URL.revokeObjectURL(url);
  }
}

/* ── the tab ──────────────────────────────────────────────────────────── */

export function Carousels() {
  const [indId, setIndId] = useState(CAROUSELS[0].industry);
  const story = CAROUSELS.find((s) => s.industry === indId) ?? CAROUSELS[0];
  const [carId, setCarId] = useState(story.carousels[0].id);
  const car = story.carousels.find((c) => c.id === carId) ?? story.carousels[0];
  const [at, setAt] = useState(0);
  const [busy, setBusy] = useState("");
  const [copied, setCopied] = useState(false);
  const [err, setErr] = useState("");
  const total = car.slides.length + 1;
  const b = brandOf(story.industry);
  const ind = INDUSTRIES.find((i) => i.id === story.industry);
  const style = STYLES.find((s) => s.id === car.style)!;

  const pick = (s: IndustryStories) => {
    setIndId(s.industry);
    setCarId(s.carousels[0].id);
    setAt(0);
  };
  const name = (i: number) => `${b.name}_${car.style}_${String(i + 1).padStart(2, "0")}.png`;

  async function run(label: string, job: () => Promise<void>) {
    setBusy(label);
    setErr("");
    try {
      await job();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "That did not work. Try again.");
    } finally {
      setBusy("");
    }
  }

  const thumbs = useMemo(() => Array.from({ length: total }, (_, i) => i), [total]);

  return (
    <div className="space-y-6">
      <Panel title="Story carousels for every industry app" subtitle="Five illustrated stories per app, one in each style: a real problem, told so people swipe, solved by the app. Each slide is 1080 × 1350 (Instagram 4:5), in the app's own brand.">
        <div className="flex flex-wrap gap-2">
          {CAROUSELS.map((s) => {
            const bb = brandOf(s.industry);
            const on = s.industry === story.industry;
            return (
              <button
                key={s.industry}
                type="button"
                onClick={() => pick(s)}
                className={cn("flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition", on ? "border-ink bg-ink text-paper" : "border-graphite/15 bg-white hover:border-graphite/40")}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={bb.icon} alt="" className="size-6" />
                {bb.name}
              </button>
            );
          })}
        </div>
      </Panel>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {story.carousels.map((c) => {
          const st = STYLES.find((s) => s.id === c.style)!;
          const on = c.id === car.id;
          return (
            <button key={c.id} type="button" onClick={() => (setCarId(c.id), setAt(0))} className={cn("overflow-hidden rounded-2xl border text-left transition", on ? "border-ink ring-2 ring-ink" : "border-graphite/15 bg-white hover:border-graphite/40")}>
              <div className="aspect-[4/5] w-full bg-paper [&>svg]:h-full [&>svg]:w-full">
                <SlideSvg story={story} car={c} i={0} fonts={SCREEN_FONTS} uid={`t-${c.id}`} />
              </div>
              <div className="p-3">
                <p className="annot text-[10px] text-blueprint">{st.name}</p>
                <p className="mt-0.5 text-sm font-semibold leading-snug">{c.title}</p>
              </div>
            </button>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <Panel title={car.title} subtitle={`${style.name} · ${ind?.name} · ${total} slides. ${style.idea}`}>
          <div className="mx-auto max-w-[520px]">
            <div className="relative overflow-hidden rounded-2xl border border-graphite/15 shadow-sm [&>svg]:h-auto [&>svg]:w-full">
              <SlideSvg story={story} car={car} i={at} fonts={SCREEN_FONTS} uid={`big-${car.id}-${at}`} />
            </div>
            <div className="mt-3 flex items-center justify-between gap-3">
              <Button variant="secondary" size="sm" onClick={() => setAt((a) => Math.max(0, a - 1))} disabled={at === 0}>
                <ChevronLeft className="size-4" /> Back
              </Button>
              <span className="text-sm font-semibold tabular-nums">
                {at + 1} / {total}
              </span>
              <Button variant="secondary" size="sm" onClick={() => setAt((a) => Math.min(total - 1, a + 1))} disabled={at === total - 1}>
                Next <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
          <div className="mt-5 flex gap-2 overflow-x-auto pb-2">
            {thumbs.map((i) => (
              <button key={i} type="button" onClick={() => setAt(i)} className={cn("w-20 shrink-0 overflow-hidden rounded-lg border [&>svg]:h-auto [&>svg]:w-full", i === at ? "border-ink ring-2 ring-ink" : "border-graphite/15")}>
                <SlideSvg story={story} car={car} i={i} fonts={SCREEN_FONTS} uid={`s-${car.id}-${i}`} />
              </button>
            ))}
          </div>
        </Panel>

        <div className="space-y-4">
          <Panel title="Download">
            <div className="flex flex-col gap-2">
              <Button onClick={() => run("one", async () => saveBlob(await slidePng(story, car, at), name(at)))} disabled={!!busy}>
                <Download className="size-4" /> {busy === "one" ? "Drawing…" : `This slide (PNG)`}
              </Button>
              <Button
                variant="secondary"
                onClick={() =>
                  run("all", async () => {
                    const files: { name: string; blob: Blob }[] = [];
                    for (let i = 0; i < total; i++) files.push({ name: name(i), blob: await slidePng(story, car, i) });
                    saveBlob(await zip(files), `${b.name}_${car.style}_carousel.zip`);
                  })
                }
                disabled={!!busy}
              >
                <FolderArchive className="size-4" /> {busy === "all" ? "Drawing all slides…" : `All ${total} slides (ZIP)`}
              </Button>
              {err && <p className="text-xs text-red-600">{err}</p>}
            </div>
          </Panel>
          <Panel title="Caption" subtitle={car.angle}>
            <pre className="max-h-72 overflow-auto whitespace-pre-wrap rounded-lg bg-paper p-3 font-sans text-sm leading-relaxed">{car.caption}</pre>
            <Button
              variant="secondary"
              size="sm"
              className="mt-2"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(car.caption);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1600);
                } catch {
                  setErr("The browser did not allow copying. Select the caption and copy it by hand.");
                }
              }}
            >
              {copied ? <Check className="size-4" /> : <Copy className="size-4" />} {copied ? "Copied" : "Copy caption"}
            </Button>
          </Panel>
        </div>
      </div>
    </div>
  );
}
