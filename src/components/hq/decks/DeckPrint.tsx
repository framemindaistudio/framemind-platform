"use client";

import { useEffect, useMemo } from "react";
import { useRates } from "@/components/hq/data";
import { deckById } from "@/lib/decks";
import { PrintShell } from "@/components/print/PrintShell";
import { H, SlideView, W } from "./SlideView";

/** 16:9 page the size of a slide on A4 width (297 × 167 mm): one slide per page, quiz answers shown. */
const PAGE_W_MM = 297;
const PAGE_H_MM = 167.06;

/**
 * A deck as a PDF: one slide per landscape 16:9 page, or (notes) two slides per A4 page, each with the speaker's
 * words under it, as a handout to rehearse from.
 */
export function DeckPrint({ id, client, withNotes }: { id: string; client?: string; withNotes?: boolean }) {
  const rates = useRates();
  const deck = deckById(id);
  const slides = useMemo(() => (deck ? deck.slides({ client, rates }) : []), [deck, client, rates]);
  useEffect(() => {
    if (deck) document.title = `FrameMind - ${deck.title}${client ? ` - ${client}` : ""}${withNotes ? " - with notes" : ""}`;
  }, [deck, client, withNotes]);
  if (!deck) return <p className="p-10 text-center">That presentation was not found.</p>;

  const pageCss = withNotes
    ? "@page { size: A4; margin: 12mm; }"
    : `@page { size: ${PAGE_W_MM}mm ${PAGE_H_MM}mm; margin: 0; }`;
  // with notes: 170 mm wide slides, two to an A4 page (273 mm of height inside the margins)
  const scaleMm = withNotes ? 170 / PAGE_W_MM : 1;
  const pages = withNotes ? slides.flatMap((_, i) => (i % 2 === 0 ? [[i, i + 1].filter((k) => k < slides.length)] : [])) : slides.map((_, i) => [i]);

  return (
    <PrintShell title={`${deck.title}${withNotes ? " · with notes" : ""}`} back="/hq/presentations" toolbar={<span className="text-xs text-blueprint">Choose “Save as PDF” in the print window</span>}>
      <style>{`${pageCss}
        .deck-page { break-after: page; }
        .deck-page:last-child { break-after: auto; }
        @media print { html, body { background: #fff !important; } }`}</style>
      <div className="flex flex-col items-center gap-6 print:block print:gap-0">
        {pages.map((group) => (
          <div key={group[0]} className={`deck-page bg-white shadow-[var(--shadow-lift)] print:shadow-none ${withNotes ? "p-[6mm] print:p-0" : ""}`} style={{ width: withNotes ? "186mm" : `${PAGE_W_MM}mm` }}>
            {group.map((i) => {
              const s = slides[i];
              return (
                <div key={i} className={withNotes ? "break-inside-avoid pb-[6mm]" : ""} style={{ height: withNotes ? "136mm" : undefined, overflow: withNotes ? "hidden" : undefined }}>
                  <div style={{ width: `${PAGE_W_MM * scaleMm}mm`, height: `${PAGE_H_MM * scaleMm}mm`, overflow: "hidden", position: "relative", border: withNotes ? "0.3mm solid #ddd" : undefined }}>
                    {/* the slide is drawn at 1600×900 px and shrunk to the page's width */}
                    <ScaleToPage widthMm={PAGE_W_MM * scaleMm}>
                      <SlideView deck={deck} slide={s} index={i} total={slides.length} reveal />
                    </ScaleToPage>
                  </div>
                  {withNotes && (
                    <div className="pt-3 text-[10pt] leading-snug text-graphite">
                      <p className="font-mono text-[7.5pt] uppercase tracking-widest text-blueprint">
                        Slide {i + 1}
                        {s.phase ? ` · ${s.phase}` : ""}
                        {s.minutes ? ` · ${s.minutes} min` : ""}
                      </p>
                      <p className="mt-1 whitespace-pre-line">{s.notes || "—"}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </PrintShell>
  );
}

/**
 * Scales the 1600×900 slide to a page width in millimetres (1 mm = 96 / 25.4 CSS px). Zoom, not a transform: Chrome's
 * print engine lays a transformed slide out at its full 1600 px and then shrinks and crops the page.
 */
function ScaleToPage({ widthMm, children }: { widthMm: number; children: React.ReactNode }) {
  const px = (widthMm * 96) / 25.4;
  return <div style={{ position: "absolute", left: 0, top: 0, width: W, height: H, zoom: px / W }}>{children}</div>;
}
