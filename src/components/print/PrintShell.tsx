"use client";

import { useLayoutEffect, useRef, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Printer } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import type { CompanySettings } from "@/lib/hq/settings";
import { SignatureProvider, SignatureToggle } from "./Signature";

/** Paper sizes a print page can ask for. Without one the sheet is A4 portrait (the default in globals.css). */
export type Paper = "A4 landscape" | "A3" | "A3 landscape";
const PAPER_WIDTH_MM: Record<Paper, number> = { "A4 landscape": 297, A3: 297, "A3 landscape": 420 };

const onResize = (cb: () => void) => {
  window.addEventListener("resize", cb);
  return () => window.removeEventListener("resize", cb);
};

/** How much a sheet of this width must shrink to fit the window (1 = fits). Screen only; print always uses true size. */
function usePaperFit(widthMm: number) {
  return useSyncExternalStore(
    onResize,
    () => (widthMm ? Math.min(1, Math.floor(((window.innerWidth - 24) / ((widthMm * 96) / 25.4)) * 200) / 200) : 1),
    () => 1,
  );
}

/**
 * Wraps one or more pages with an on-screen toolbar (Back · Print / Save as PDF).
 * Children should be <A4Page> elements (or sheets of the size named in `paper`). Use the browser's "Save as PDF" to download.
 * `paper` sets the printed page size and scales big sheets down on screen so the whole sheet is visible.
 */
export function PrintShell({ title, back, children, toolbar, landscape, paper }: { title: string; back?: string; children: React.ReactNode; toolbar?: React.ReactNode; landscape?: boolean; paper?: Paper }) {
  const size = paper ?? (landscape ? "A4 landscape" : undefined);
  const fit = usePaperFit(paper ? PAPER_WIDTH_MM[paper] : 210);
  return (
    <SignatureProvider>
    <div className="min-h-dvh bg-paper-300/60 print:bg-white">
      {size && <style>{`@page { size: ${size}; margin: 0; }`}</style>}
      <div className="no-print sticky top-0 z-20 flex flex-wrap items-center gap-3 border-b border-graphite/15 bg-paper/95 px-4 py-3 backdrop-blur sm:px-6">
        {back && (
          <Link href={back} className="inline-flex items-center gap-1.5 rounded px-2 py-1.5 text-sm font-medium hover:bg-graphite/5">
            <ArrowLeft className="size-4" /> Back
          </Link>
        )}
        <h1 className="truncate text-sm font-semibold">{title}</h1>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          {toolbar}
          <SignatureToggle />
          <Button size="sm" onClick={() => window.print()}>
            <Printer className="size-4" /> Print / Save PDF
          </Button>
        </div>
      </div>
      <div className="paper-fit flex flex-col items-center gap-6 px-2 py-8 print:block print:p-0" style={fit < 1 ? ({ "--paper-fit": fit } as React.CSSProperties) : undefined}>
        {children}
      </div>
    </div>
    </SignatureProvider>
  );
}

/** One A4 sheet (210×297mm, or 297×210 landscape). */
/**
 * The size a sheet is laid out at: a hair under the paper, so that rounding in the print engine never pushes a sheet
 * onto a second page.
 */
const SHEET_MM = { portrait: { w: 210, h: 296.6 }, landscape: { w: 297, h: 209.6 } };
/** A sheet's content is never shrunk below this. Past it, the sheet runs on to more pages rather than turn hard to read. */
const MIN_FIT = 0.8;

/**
 * Makes a sheet exactly one page. When its content is taller than the paper, the whole sheet is laid out larger and
 * scaled down to the paper (CSS zoom), so the page keeps its full size and its edge-to-edge background, and only the
 * content gets a little smaller: no extra page, no white border, nothing cut off. The shrink is written to
 * data-fit ("1" when it fits as it is, "overflow" when it is too long to shrink).
 */
function useOnePage(ref: React.RefObject<HTMLDivElement | null>, size: { w: number; h: number }, enabled: boolean) {
  useLayoutEffect(() => {
    const el = ref.current;
    if (!enabled || !el) return;
    let frame = 0;
    const fit = () => {
      // measure at full size with the sheet free to grow; height against width, so a zoomed screen does not matter
      el.style.zoom = "";
      el.style.width = "";
      el.style.height = "auto";
      el.style.minHeight = `${size.h}mm`;
      el.style.removeProperty("page");
      delete el.dataset.pages;
      const needMm = (el.scrollHeight * size.w) / Math.max(1, el.offsetWidth);
      // when content must shrink it is aimed 1 mm short of the foot, so a line laid out a hair taller by the printer
      // than on screen is never cut off
      const z = needMm <= size.h + 0.3 ? 1 : Math.floor(((size.h - 1) / needMm) * 1000) / 1000;
      el.style.minHeight = "";
      if (z === 1) {
        el.style.height = "";
        el.dataset.fit = "1";
      } else if (z >= MIN_FIT) {
        el.style.zoom = String(z);
        el.style.width = `${size.w / z}mm`;
        el.style.height = `${size.h / z}mm`;
        el.dataset.fit = String(z);
      } else {
        // too long to shrink: it runs on to the following pages, as a long list must, with a margin at the top and
        // foot of every page (the "sheet-long" page in globals.css), and the screen says how many pages it prints on
        el.style.height = "auto";
        el.style.minHeight = `${size.h}mm`;
        el.style.setProperty("page", "sheet-long");
        el.dataset.fit = "overflow";
        el.dataset.pages = String(Math.ceil((needMm + 26) / (size.h + 0.4 - 26)));
      }
    };
    const again = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(fit);
    };
    fit();
    // text and pictures arriving later change the height: fonts, images, data that loads after the first paint
    const watch = new MutationObserver(again);
    watch.observe(el, { childList: true, subtree: true, characterData: true });
    el.addEventListener("load", again, true);
    void document.fonts?.ready.then(again);
    return () => {
      cancelAnimationFrame(frame);
      watch.disconnect();
      el.removeEventListener("load", again, true);
    };
  }, [ref, size, enabled]);
}

/**
 * One sheet of paper: A4 portrait (210 × 297 mm) or, with `landscape`, A4 landscape. It is always exactly one page:
 * see useOnePage. `flow` is for long documents that run over as many pages as they need (library documents, papers
 * to sign): they set their own page margins and are not fitted.
 */
export function A4Page({ children, className, landscape, padded = true, flow = false }: { children: React.ReactNode; className?: string; landscape?: boolean; padded?: boolean; flow?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useOnePage(ref, landscape ? SHEET_MM.landscape : SHEET_MM.portrait, !flow);
  return (
    <div
      ref={ref}
      className={cn(
        "print-page relative overflow-hidden bg-white text-graphite shadow-[0_10px_40px_-12px_rgb(0_0_0/0.35)]",
        flow ? (landscape ? "min-h-[210mm] w-[297mm]" : "min-h-[297mm] w-[210mm]") : landscape ? "h-[209.6mm] w-[297mm]" : "h-[296.6mm] w-[210mm]",
        padded && "px-[16mm] py-[14mm]",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Brand letterhead header for invoices, quotes, letters. */
export function Letterhead({ settings, docTitle, docMeta }: { settings: CompanySettings; docTitle?: string; docMeta?: React.ReactNode }) {
  const addr = [settings.addressLine1, settings.addressLine2, [settings.city, settings.state, settings.pincode].filter(Boolean).join(", ")].filter(Boolean);
  return (
    <header className="relative mb-8 pb-5">
      <div className="flex items-start justify-between gap-6">
        <div className="flex items-center gap-3">
          <Image src="/brand/fm-mark-light.png" alt="" width={512} height={512} className="size-[15mm]" priority />
          <div className="leading-none">
            <p className="text-[17pt] font-semibold tracking-[-0.02em] text-graphite">FrameMind</p>
            <p className="mt-1 text-[7pt] font-medium uppercase tracking-[0.32em] text-violet">AI Studio</p>
          </div>
        </div>
        <div className="text-right text-[10px] leading-relaxed text-charcoal">
          <p className="text-[11px] font-bold text-graphite">{settings.legalName}</p>
          {addr.map((l) => (
            <p key={l}>{l}</p>
          ))}
          {(settings.phone || settings.email) && <p>{[settings.phone, settings.email].filter(Boolean).join(" · ")}</p>}
          {settings.website && <p>{settings.website}</p>}
          {settings.gstin && <p className="font-semibold">GSTIN: {settings.gstin}</p>}
          {settings.udyamNumber && <p>Udyam Reg. No. {settings.udyamNumber}</p>}
        </div>
      </div>
      {docTitle && (
        <div className="mt-5 flex items-end justify-between gap-4">
          <h1 className="text-2xl font-bold tracking-tight">{docTitle}</h1>
          {docMeta && <div className="text-right text-xs text-charcoal">{docMeta}</div>}
        </div>
      )}
      <div className="absolute inset-x-0 bottom-0 flex h-[3px]">
        <span className="w-[22%] bg-lime" />
        <span className="flex-1 bg-graphite" />
      </div>
    </header>
  );
}

/** Footer strip with tagline for printed docs. */
export function PrintFooter({ note }: { note?: string }) {
  return (
    <footer className="absolute inset-x-[16mm] bottom-[8mm] flex items-center justify-between border-t border-graphite/20 pt-2 text-[8px] uppercase tracking-[0.2em] text-blueprint">
      <span>Design · Software · AI</span>
      <span>{note ?? "FrameMind AI Studio"}</span>
    </footer>
  );
}
