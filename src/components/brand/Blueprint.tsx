import { cn } from "@/lib/utils";

/**
 * Blueprint drawing primitives — the visual vocabulary of the FrameMind brand sheet:
 * corner marks, crosshairs, dimension lines, annotation labels and section dividers.
 * All are decorative (aria-hidden) and inherit `currentColor`.
 */

/** Little L-shaped crop marks in each corner of a card/frame. */
export function CornerMarks({ className, size = 10, inset = -1 }: { className?: string; size?: number; inset?: number }) {
  const s = { width: size, height: size };
  const pos = (v: number) => `${v}px`;
  return (
    <span aria-hidden className={cn("pointer-events-none absolute inset-0 text-graphite/50", className)}>
      <span className="absolute border-l border-t border-current" style={{ ...s, left: pos(inset), top: pos(inset) }} />
      <span className="absolute border-r border-t border-current" style={{ ...s, right: pos(inset), top: pos(inset) }} />
      <span className="absolute border-b border-l border-current" style={{ ...s, left: pos(inset), bottom: pos(inset) }} />
      <span className="absolute border-b border-r border-current" style={{ ...s, right: pos(inset), bottom: pos(inset) }} />
    </span>
  );
}

/** A registration crosshair ⊕. */
export function Crosshair({ className, size = 28 }: { className?: string; size?: number }) {
  return (
    <svg aria-hidden width={size} height={size} viewBox="0 0 28 28" className={cn("text-graphite/40", className)} fill="none" stroke="currentColor" strokeWidth="1">
      <circle cx="14" cy="14" r="6" />
      <path d="M14 0v28M0 14h28" />
    </svg>
  );
}

/** Horizontal dimension line with end ticks and a centred label: |←— 1440 —→| */
export function DimensionLine({ label, className }: { label?: React.ReactNode; className?: string }) {
  return (
    <div aria-hidden className={cn("flex items-center gap-2 text-blueprint", className)}>
      <span className="h-3 w-px bg-current" />
      <span className="relative h-px flex-1 bg-current">
        <span className="absolute -left-px -top-[3px] border-y-[3.5px] border-r-[6px] border-y-transparent border-r-current" />
      </span>
      {label && <span className="annot shrink-0 font-mono text-[10px] tracking-[0.15em]">{label}</span>}
      <span className="relative h-px flex-1 bg-current">
        <span className="absolute -right-px -top-[3px] border-y-[3.5px] border-l-[6px] border-y-transparent border-l-current" />
      </span>
      <span className="h-3 w-px bg-current" />
    </div>
  );
}

/** Vertical annotation stack, like "PRECISION / LEARNING / INNOVATION / AUTOMATION" on the logo. */
export function AnnotationStack({ items, className, align = "left" }: { items: readonly string[]; className?: string; align?: "left" | "right" }) {
  return (
    <div aria-hidden className={cn("relative flex gap-3", align === "right" && "flex-row-reverse text-right", className)}>
      <span className="relative w-px bg-current opacity-60">
        <span className="absolute -left-[3px] top-0 h-px w-[7px] bg-current" />
        <span className="absolute -left-[3px] bottom-0 h-px w-[7px] bg-current" />
      </span>
      <ul className="annot space-y-1 py-1">
        {items.map((i) => (
          <li key={i}>{i}</li>
        ))}
      </ul>
    </div>
  );
}

/** Section eyebrow: "— 01 / ABOUT FrameMind" */
export function SectionLabel({ index, children, className, light }: { index?: string; children: React.ReactNode; className?: string; light?: boolean }) {
  return (
    <div className={cn("annot flex items-center gap-3", light ? "text-paper/70" : "text-blueprint", className)}>
      <span className={cn("h-px w-8", light ? "bg-paper/50" : "bg-graphite/40")} />
      {index && <span className="font-mono tracking-[0.12em]">{index}</span>}
      {index && <span className={light ? "text-paper/40" : "text-graphite/30"}>/</span>}
      <span>{children}</span>
    </div>
  );
}

/** The brand-sheet section divider: a line through a double circle. */
export function SketchDivider({ className, light }: { className?: string; light?: boolean }) {
  return (
    <div aria-hidden className={cn("flex items-center gap-0", light ? "text-paper/40" : "text-graphite/30", className)}>
      <span className="h-px flex-1 bg-current" />
      <svg width="44" height="44" viewBox="0 0 44 44" fill="none" stroke="currentColor" strokeWidth="1" className="shrink-0">
        <circle cx="22" cy="22" r="20" />
        <circle cx="22" cy="22" r="13" />
        <path d="M0 22h44M22 0v44" strokeDasharray="2 3" />
      </svg>
      <span className="h-px flex-1 bg-current" />
    </div>
  );
}

/** Full-bleed grid paper backdrop with optional radial vignette. */
export function GridBackdrop({ className, dark, vignette = true }: { className?: string; dark?: boolean; vignette?: boolean }) {
  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0", className)}>
      <div className={cn("absolute inset-0", dark ? "bp-grid-dark" : "bp-grid")} />
      <div className="paper-grain absolute inset-0 opacity-60 mix-blend-multiply" />
      {vignette && (
        <div
          className="absolute inset-0"
          style={{
            background: dark
              ? "radial-gradient(ellipse at center, transparent 40%, rgb(22 22 22 / 0.65) 100%)"
              : "radial-gradient(ellipse at center, transparent 45%, rgb(245 241 232 / 0.9) 100%)",
          }}
        />
      )}
    </div>
  );
}

/** Construction circle with crosshair — large decorative element. */
export function ConstructionCircle({ className, size = 320 }: { className?: string; size?: number }) {
  return (
    <svg aria-hidden width={size} height={size} viewBox="0 0 200 200" fill="none" stroke="currentColor" strokeWidth="0.5" className={cn("text-graphite/15", className)}>
      <circle cx="100" cy="100" r="98" />
      <circle cx="100" cy="100" r="70" strokeDasharray="2 3" />
      <circle cx="100" cy="100" r="40" />
      <path d="M0 100h200M100 0v200" />
      <path d="M29 29l142 142M171 29L29 171" strokeDasharray="1 4" />
    </svg>
  );
}

/** Numbered spec row used in feature lists: 01 ─── Title */
export function SpecIndex({ n, className }: { n: string | number; className?: string }) {
  return <span className={cn("font-mono text-xs tracking-widest text-blueprint", className)}>{String(n).padStart(2, "0")}</span>;
}
