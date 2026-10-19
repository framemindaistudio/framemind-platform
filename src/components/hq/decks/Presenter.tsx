"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronLeft, ChevronRight, Eye, Grid3x3, Maximize, MonitorUp, NotebookText, Printer } from "lucide-react";
import { useRates } from "@/components/hq/data";
import { deckById } from "@/lib/decks";
import { cn } from "@/lib/utils";
import { H, SlideView, W } from "./SlideView";

/** A slide scaled to fit its box. */
export function Scaled({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [s, setS] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fit = () => setS(Math.min(el.clientWidth / W, el.clientHeight / H));
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <div ref={ref} className={cn("relative grid place-items-center overflow-hidden", className)}>
      {s > 0 && (
        <div style={{ width: W * s, height: H * s }}>
          <div style={{ width: W, height: H, transform: `scale(${s})`, transformOrigin: "top left" }}>{children}</div>
        </div>
      )}
    </div>
  );
}

const fmt = (sec: number) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;

/**
 * Presenting a deck. Keys: → / Space / PageDown next (a quiz reveals its answer first), ← back, N notes, G all slides,
 * F full screen, R reveal, Home / End. "Audience window" opens a second window that shows only the slide and follows
 * this one, for a projector beside a laptop that shows the notes.
 */
export function Presenter({ id, client, audience, channel }: { id: string; client?: string; audience?: boolean; channel?: string }) {
  const rates = useRates();
  const deck = deckById(id);
  const slides = useMemo(() => (deck ? deck.slides({ client, rates }) : []), [deck, client, rates]);
  const [i, setI] = useState(0);
  const [reveal, setReveal] = useState<Record<number, boolean>>({});
  const [notes, setNotes] = useState(!audience);
  const [grid, setGrid] = useState(false);
  const [started] = useState(() => Date.now());
  const [now, setNow] = useState(() => Date.now());
  const bc = useRef<BroadcastChannel | null>(null);
  const sync = channel || `fm-deck-${id}`;

  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, []);

  // presenter and audience windows follow each other
  useEffect(() => {
    if (typeof BroadcastChannel === "undefined") return;
    const ch = new BroadcastChannel(sync);
    bc.current = ch;
    ch.onmessage = (e) => {
      const m = e.data as { i: number; reveal: Record<number, boolean> };
      if (typeof m?.i === "number") {
        setI(m.i);
        setReveal(m.reveal ?? {});
      }
    };
    return () => ch.close();
  }, [sync]);

  const go = useCallback(
    (next: number, nextReveal = reveal) => {
      const k = Math.max(0, Math.min(slides.length - 1, next));
      setI(k);
      bc.current?.postMessage({ i: k, reveal: nextReveal });
    },
    [slides.length, reveal],
  );
  const forward = useCallback(() => {
    const s = slides[i];
    if (s?.kind === "quiz" && !reveal[i]) {
      const r = { ...reveal, [i]: true };
      setReveal(r);
      bc.current?.postMessage({ i, reveal: r });
      return;
    }
    go(i + 1);
  }, [slides, i, reveal, go]);

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === "INPUT") return;
      if (["ArrowRight", "PageDown", " ", "Enter"].includes(e.key)) {
        e.preventDefault();
        forward();
      }
      else if (["ArrowLeft", "PageUp", "Backspace"].includes(e.key)) {
        e.preventDefault();
        go(i - 1);
      }
      else if (e.key === "Home") go(0);
      else if (e.key === "End") go(slides.length - 1);
      else if (e.key.toLowerCase() === "n") setNotes((v) => !v);
      else if (e.key.toLowerCase() === "g") setGrid((v) => !v);
      else if (e.key === "Escape") setGrid(false);
      else if (e.key.toLowerCase() === "f") void (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen());
      else if (e.key.toLowerCase() === "r") {
        const r = { ...reveal, [i]: !reveal[i] };
        setReveal(r);
        bc.current?.postMessage({ i, reveal: r });
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [forward, go, i, slides.length, reveal]);

  if (!deck) return <p className="p-10 text-center">That presentation was not found.</p>;
  const slide = slides[i];
  const planned = slides.slice(0, i + 1).reduce((s, x) => s + (x.minutes ?? 0), 0);
  const elapsed = Math.floor((now - started) / 1000);
  const q = client ? `?client=${encodeURIComponent(client)}` : "";

  if (audience)
    return (
      <div className="fixed inset-0 bg-black" onClick={forward}>
        <Scaled className="size-full">
          <SlideView deck={deck} slide={slide} index={i} total={slides.length} reveal={!!reveal[i]} live />
        </Scaled>
      </div>
    );

  return (
    <div className="fixed inset-0 flex flex-col bg-[#18181b] text-paper" data-presenter>
      <div className="flex flex-wrap items-center gap-2 border-b border-white/10 px-3 py-2 text-sm">
        <Link href="/hq/presentations" className="inline-flex items-center gap-1.5 rounded px-2 py-1.5 text-paper/80 hover:bg-white/10 hover:text-paper">
          <ArrowLeft className="size-4" aria-hidden /> Presentations
        </Link>
        <span className="truncate font-semibold">{deck.title}</span>
        <span className="font-mono text-xs text-paper/50">
          {i + 1} / {slides.length}
        </span>
        <div className="ml-auto flex flex-wrap items-center gap-1">
          <button type="button" onClick={() => setNotes((v) => !v)} className={cn("inline-flex items-center gap-1.5 rounded px-2.5 py-1.5 hover:bg-white/10", notes && "bg-white/15")} title="Speaker notes (N)">
            <NotebookText className="size-4" aria-hidden /> Notes
          </button>
          <button type="button" onClick={() => setGrid((v) => !v)} className={cn("inline-flex items-center gap-1.5 rounded px-2.5 py-1.5 hover:bg-white/10", grid && "bg-white/15")} title="All slides (G)">
            <Grid3x3 className="size-4" aria-hidden /> All slides
          </button>
          <button type="button" onClick={() => window.open(`/hq/print/present/${id}?audience=1${client ? `&client=${encodeURIComponent(client)}` : ""}`, `fm-audience-${id}`, "popup,width=1280,height=720")} className="inline-flex items-center gap-1.5 rounded px-2.5 py-1.5 hover:bg-white/10" title="A second window for the projector, following this one">
            <MonitorUp className="size-4" aria-hidden /> Audience window
          </button>
          <a href={`/hq/print/deck/${id}${q}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded px-2.5 py-1.5 hover:bg-white/10">
            <Printer className="size-4" aria-hidden /> PDF
          </a>
          <button type="button" onClick={() => void (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen())} className="inline-flex items-center gap-1.5 rounded px-2.5 py-1.5 hover:bg-white/10" title="Full screen (F)">
            <Maximize className="size-4" aria-hidden /> Full screen
          </button>
        </div>
      </div>

      {grid ? (
        <div className="grid flex-1 grid-cols-2 gap-4 overflow-auto p-4 sm:grid-cols-3 lg:grid-cols-4">
          {slides.map((s, k) => (
            <button key={k} type="button" onClick={() => (go(k), setGrid(false))} className={cn("overflow-hidden rounded-md ring-2", k === i ? "ring-amber-400" : "ring-transparent hover:ring-white/40")}>
              <Scaled className="aspect-video w-full">
                <SlideView deck={deck} slide={s} index={k} total={slides.length} reveal />
              </Scaled>
            </button>
          ))}
        </div>
      ) : (
        <div className={cn("grid min-h-0 flex-1", notes ? "lg:grid-cols-[1fr_380px]" : "grid-cols-1")}>
          <div className="relative min-h-0 cursor-pointer" onClick={forward} data-stage>
            <Scaled className="absolute inset-2">
              <SlideView deck={deck} slide={slide} index={i} total={slides.length} reveal={!!reveal[i]} live />
            </Scaled>
            <button type="button" onClick={(e) => (e.stopPropagation(), go(i - 1))} aria-label="Previous slide" className="absolute bottom-3 left-3 grid size-11 place-items-center rounded-full bg-white/10 hover:bg-white/20">
              <ChevronLeft className="size-5" aria-hidden />
            </button>
            <button type="button" onClick={(e) => (e.stopPropagation(), forward())} aria-label="Next slide" className="absolute bottom-3 right-3 grid size-11 place-items-center rounded-full bg-white/10 hover:bg-white/20">
              <ChevronRight className="size-5" aria-hidden />
            </button>
          </div>
          {notes && (
            <aside className="flex min-h-0 flex-col gap-4 overflow-auto border-t border-white/10 p-4 lg:border-l lg:border-t-0" data-notes>
              <div className="flex items-center justify-between font-mono text-sm">
                <span title="Time since you started">{fmt(elapsed)}</span>
                <span className="text-paper/50" title="Planned minutes up to this slide">
                  plan {planned} / {deck.minutes} min
                </span>
              </div>
              {slide.kind === "quiz" && (
                <button type="button" onClick={() => setReveal({ ...reveal, [i]: !reveal[i] })} className="inline-flex items-center justify-center gap-1.5 rounded bg-white/10 px-3 py-2 text-sm font-semibold hover:bg-white/20">
                  <Eye className="size-4" aria-hidden /> {reveal[i] ? "Hide the answer" : "Reveal the answer (R)"}
                </button>
              )}
              <div>
                <p className="font-mono text-[11px] uppercase tracking-widest text-paper/50">Say</p>
                <p className="mt-2 whitespace-pre-line text-[15px] leading-relaxed text-paper/90">{slide.notes || "No notes for this slide."}</p>
              </div>
              {slides[i + 1] && (
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-widest text-paper/50">Next</p>
                  <Scaled className="mt-2 aspect-video w-full overflow-hidden rounded">
                    <SlideView deck={deck} slide={slides[i + 1]} index={i + 1} total={slides.length} />
                  </Scaled>
                </div>
              )}
              <p className="mt-auto text-[11px] leading-relaxed text-paper/45">→ or click: next · ← back · R reveal · N notes · G all slides · F full screen</p>
            </aside>
          )}
        </div>
      )}
    </div>
  );
}
