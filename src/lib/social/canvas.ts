/**
 * The drawing kit of Social Studio: brand colours, type and the blueprint elements (grid, corner marks,
 * construction circle, dimension line, hatching), drawn on a canvas at the real size of the post.
 * Browser only. Layouts are in layouts.ts; this file knows nothing about any particular design.
 */
import type { Format, Picture, Tone } from "./types";

/* ───────────────────────────── brand colours ───────────────────────────── */

export const C = {
  ink: "#0D0D0D",
  graphite: "#161616",
  charcoal: "#3d3d3d",
  blueprint: "#77756f",
  accent: "#C8F135",
  violet: "#7C3AED",
  paper: "#F5F4F0",
  paper50: "#FBFAF7",
  paper200: "#EAE8E1",
  paper300: "#DEDBD2",
} as const;

const GRAPHITE_RGB = "22,22,22";
const PAPER_RGB = "245,244,240";
const INK_RGB = "13,13,13";

export interface Palette {
  dark: boolean;
  bg: string;
  /** headlines and the logo */
  fg: string;
  /** body text */
  soft: string;
  /** mono annotations */
  faint: string;
  /** hairlines */
  line: string;
  /** resting panels */
  panel: string;
  /** engineering grid: minor and major lines */
  gridMinor: string;
  gridMajor: string;
}

export function paletteFor(tone: Tone): Palette {
  if (tone === "paper") {
    return { dark: false, bg: C.paper, fg: C.graphite, soft: C.charcoal, faint: C.blueprint, line: `rgba(${GRAPHITE_RGB},0.22)`, panel: C.paper50, gridMinor: `rgba(${GRAPHITE_RGB},0.045)`, gridMajor: `rgba(${GRAPHITE_RGB},0.085)` };
  }
  return { dark: true, bg: C.graphite, fg: C.paper, soft: `rgba(${PAPER_RGB},0.84)`, faint: C.accent, line: `rgba(${PAPER_RGB},0.26)`, panel: `rgba(${PAPER_RGB},0.06)`, gridMinor: `rgba(${PAPER_RGB},0.04)`, gridMajor: `rgba(${PAPER_RGB},0.075)` };
}

/* ───────────────────────────── fonts and brand images ───────────────────────────── */

export interface Fonts {
  sans: string;
  mono: string;
}

/** HQ's own fonts (DM Sans and JetBrains Mono), by the names the page gave them. */
export function readFonts(): Fonts {
  const read = (name: string) => getComputedStyle(document.body).getPropertyValue(name).trim() || getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return {
    sans: `${read("--font-dm-sans") || "DM Sans"}, system-ui, sans-serif`,
    mono: `${read("--font-mono-jb") || "JetBrains Mono"}, ui-monospace, monospace`,
  };
}

/** A canvas draws with a font only once the browser has it: fetch every weight the designs use. */
export async function loadFonts(fonts: Fonts): Promise<void> {
  if (!document.fonts) return;
  const sample = "FrameMind AI Studio 0123456789";
  await Promise.all([
    ...[400, 500, 600, 700, 800].map((w) => document.fonts.load(`${w} 40px ${fonts.sans}`, sample)),
    document.fonts.load(`500 40px ${fonts.mono}`, sample),
  ]).catch(() => undefined);
}

export interface Assets {
  /** the framed-head mark, for light backgrounds and for dark ones */
  mark: HTMLImageElement;
  markWhite: HTMLImageElement;
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Could not load ${src}`));
    img.src = src;
  });
}

let assetsOnce: Promise<Assets> | null = null;
export function loadAssets(): Promise<Assets> {
  assetsOnce ??= Promise.all([loadImage("/brand/fm-mark-light.png"), loadImage("/brand/fm-mark-dark.png")]).then(([mark, markWhite]) => ({ mark, markWhite }));
  return assetsOnce;
}

/** A picture ready to place: the whole image in view, centred. */
export function pictureOf(el: HTMLImageElement | HTMLCanvasElement, illustration: boolean): Picture {
  const w = el instanceof HTMLImageElement ? el.naturalWidth : el.width;
  const h = el instanceof HTMLImageElement ? el.naturalHeight : el.height;
  return { el, w, h, illustration, fx: 0.5, fy: 0.5, zoom: 1, bw: !illustration };
}

/* ───────────────────────────── black and white ───────────────────────────── */

const toned = new WeakMap<object, HTMLCanvasElement>();
/** The brand's photograph look: black and white with paper whites and deep ink blacks. */
function tonedCopy(pic: Picture): HTMLCanvasElement {
  const key = pic.el as object;
  const hit = toned.get(key);
  if (hit) return hit;
  const k = Math.min(1, 2400 / Math.max(pic.w, pic.h));
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(pic.w * k));
  c.height = Math.max(1, Math.round(pic.h * k));
  const g = c.getContext("2d", { willReadFrequently: true });
  if (g) {
    g.drawImage(pic.el, 0, 0, c.width, c.height);
    const data = g.getImageData(0, 0, c.width, c.height);
    const a = data.data;
    // ink #0D0D0D → paper white #FBFAF7, with a gentle S-curve for depth
    for (let i = 0; i < a.length; i += 4) {
      let l = (0.2126 * a[i] + 0.7152 * a[i + 1] + 0.0722 * a[i + 2]) / 255;
      l = l * l * (3 - 2 * l) * 0.6 + l * 0.4;
      a[i] = 13 + (251 - 13) * l;
      a[i + 1] = 13 + (250 - 13) * l;
      a[i + 2] = 13 + (247 - 13) * l;
    }
    g.putImageData(data, 0, 0);
  }
  toned.set(key, c);
  return c;
}

/* ───────────────────────────── text ───────────────────────────── */

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface TextStyle {
  size: number;
  /** DM Sans weight 400–800 (JetBrains Mono is always 500) */
  weight?: number;
  mono?: boolean;
  color?: string;
  /** line height as a multiple of the size */
  lh?: number;
  /** letter spacing in em */
  track?: number;
  upper?: boolean;
  align?: "left" | "center" | "right";
}

export interface TextBox extends TextStyle {
  text: string;
  x: number;
  /** top of the capital letters of the first line */
  y: number;
  w: number;
  maxLines?: number;
  /** shrink the type until the block is no taller than this */
  maxH?: number;
  /** how small the type may get when it has to shrink */
  minSize?: number;
  /** break lines to similar lengths (headlines) */
  balance?: boolean;
  /** measure only */
  dry?: boolean;
}

export interface TextMetricsOut {
  /** from the top of the first line's capitals to the last baseline */
  h: number;
  size: number;
  lines: string[];
  /** width of the longest line */
  w: number;
  /** distance between baselines */
  step: number;
  cap: number;
}

const RUPEE = "₹";

/* ───────────────────────────── the painter ───────────────────────────── */

export class Painter {
  readonly w: number;
  readonly h: number;
  /** one design unit in pixels: designs are drawn for a 1080 px short side */
  readonly u: number;
  /** where text may go */
  readonly box: Rect;
  readonly pal: Palette;

  constructor(
    readonly ctx: CanvasRenderingContext2D,
    readonly format: Format,
    readonly tone: Tone,
    private readonly fonts: Fonts,
    private readonly assets: Assets,
  ) {
    this.w = format.w;
    this.h = format.h;
    this.u = Math.min(this.w, this.h) / 1080;
    const s = format.safe;
    this.box = { x: s.left, y: s.top, w: this.w - s.left - s.right, h: this.h - s.top - s.bottom };
    this.pal = paletteFor(tone);
  }

  /** design units → pixels */
  s(n: number) {
    return n * this.u;
  }

  get portrait() {
    return this.h > this.w * 1.05;
  }
  get wide() {
    return this.w > this.h * 1.3;
  }
  get tall() {
    return this.h > this.w * 1.6;
  }

  /* ── text ── */

  private applyFont(size: number, weight: number, mono: boolean, track: number) {
    const c = this.ctx;
    c.font = `${mono ? 500 : weight} ${size}px ${mono ? this.fonts.mono : this.fonts.sans}`;
    if ("letterSpacing" in c) c.letterSpacing = `${track * size}px`;
    c.textBaseline = "alphabetic";
    c.textAlign = "left";
  }

  /** width of one line as it will be drawn (the rupee sign is drawn, not typed: the fonts' Latin set lacks it) */
  private lineWidth(line: string, size: number, track: number) {
    if (!line) return 0;
    const c = this.ctx;
    const parts = line.split(RUPEE);
    let w = 0;
    for (const part of parts) w += part ? c.measureText(part).width : 0;
    w += (parts.length - 1) * size * 0.64;
    // letter spacing is added after every glyph, the last one included: take that one back
    return Math.max(0, w - track * size);
  }

  /** true when the last wrap() had to cut a word in two */
  private cut = false;

  private wrap(text: string, maxW: number, size: number, track: number): string[] {
    const fits = (s: string) => this.lineWidth(s, size, track) <= maxW;
    const out: string[] = [];
    this.cut = false;
    for (const para of text.split("\n")) {
      const words = para.split(/\s+/).filter(Boolean);
      if (!words.length) {
        out.push("");
        continue;
      }
      let line = "";
      for (let word of words) {
        // a single word wider than the box is cut where it has to be
        while (!fits(word) && word.length > 1) {
          this.cut = true;
          let cut = word.length - 1;
          while (cut > 1 && !fits((line ? `${line} ` : "") + word.slice(0, cut))) cut -= 1;
          if (line && cut <= 1) {
            out.push(line);
            line = "";
            continue;
          }
          out.push((line ? `${line} ` : "") + word.slice(0, cut));
          line = "";
          word = word.slice(cut);
        }
        const next = line ? `${line} ${word}` : word;
        if (fits(next)) line = next;
        else {
          if (line) out.push(line);
          line = word;
        }
      }
      if (line) out.push(line);
    }
    return out;
  }

  /** Draws (or only measures) a block of text. Returns what it took. */
  text(o: TextBox): TextMetricsOut {
    const c = this.ctx;
    const weight = o.weight ?? 500;
    const mono = !!o.mono;
    const track = o.track ?? 0;
    const lh = o.lh ?? 1.25;
    const raw = (o.upper ? o.text.toUpperCase() : o.text).trim();
    const minSize = Math.min(o.size, o.minSize ?? o.size);
    let size = o.size;
    let lines: string[] = [];
    let cap = 0;
    let broke = false;

    const layout = (sz: number) => {
      this.applyFont(sz, weight, mono, track);
      cap = c.measureText("H").actualBoundingBoxAscent || sz * 0.7;
      let ls = this.wrap(raw, o.w, sz, track);
      broke = this.cut;
      if (o.balance && !broke && ls.length > 1 && !raw.includes("\n")) {
        // same number of lines, but broken where the lines come out most alike in length
        const count = ls.length;
        let lo = o.w * 0.4, hi = o.w;
        for (let i = 0; i < 12; i++) {
          const mid = (lo + hi) / 2;
          if (this.wrap(raw, mid, sz, track).length <= count && !this.cut) hi = mid;
          else lo = mid;
        }
        let best = ls, bestScore = Infinity;
        for (let k = 0; k <= 8; k++) {
          const cand = this.wrap(raw, hi + ((o.w - hi) * k) / 8, sz, track);
          if (cand.length !== count || this.cut) continue;
          const widths = cand.map((l) => this.lineWidth(l, sz, track));
          const longest = Math.max(...widths);
          // a lone short word on the first or the last line reads worst of all
          const score = longest - Math.min(...widths) + (widths[0] < longest * 0.45 ? longest : 0) + (widths[count - 1] < longest * 0.3 ? longest * 0.5 : 0);
          if (score < bestScore) {
            best = cand;
            bestScore = score;
          }
        }
        ls = best;
      }
      return ls;
    };
    const height = (n: number, sz: number) => cap + Math.max(0, n - 1) * lh * sz;

    for (;;) {
      lines = layout(size);
      const okLines = !o.maxLines || lines.length <= o.maxLines;
      const okHeight = !o.maxH || height(lines.length, size) <= o.maxH;
      if ((okLines && okHeight && !broke) || size <= minSize) break;
      size = Math.max(minSize, size - Math.max(1, size * 0.04));
    }
    // still too long at the smallest size: cut, and say so with an ellipsis
    let limit = o.maxLines ?? lines.length;
    if (o.maxH) while (limit > 1 && height(limit, size) > o.maxH) limit -= 1;
    if (lines.length > limit) {
      lines = lines.slice(0, limit);
      let last = lines[limit - 1].replace(/[\s.,;:!?·+-]+$/, "");
      while (last.length > 1 && this.lineWidth(`${last}…`, size, track) > o.w) last = last.slice(0, -1).replace(/[\s.,;:!?·+-]+$/, "");
      lines[limit - 1] = `${last}…`;
    }

    const step = lh * size;
    let widest = 0;
    const widths = lines.map((l) => {
      const w = this.lineWidth(l, size, track);
      widest = Math.max(widest, w);
      return w;
    });

    if (!o.dry) {
      c.fillStyle = o.color ?? this.pal.fg;
      c.strokeStyle = c.fillStyle;
      lines.forEach((line, i) => {
        const y = o.y + cap + i * step;
        let x = o.align === "center" ? o.x + (o.w - widths[i]) / 2 : o.align === "right" ? o.x + o.w - widths[i] : o.x;
        const parts = line.split(RUPEE);
        parts.forEach((part, k) => {
          if (part) {
            c.fillText(part, x, y);
            x += c.measureText(part).width;
          }
          if (k < parts.length - 1) {
            this.rupee(x, y, size, mono ? 500 : weight);
            x += size * 0.64;
          }
        });
      });
    }
    if ("letterSpacing" in c) c.letterSpacing = "0px";
    return { h: height(lines.length, size), size, lines, w: widest, step, cap };
  }

  /** The rupee sign, drawn to match the weight of the text around it. `y` is the baseline. */
  private rupee(x: number, y: number, size: number, weight: number) {
    const c = this.ctx;
    const k = (size * 0.73) / 140;
    c.save();
    c.translate(x + size * 0.02, y - size * 0.73);
    c.scale(k, k);
    c.lineWidth = 9 + weight / 90;
    c.lineJoin = "bevel";
    c.lineCap = "butt";
    c.stroke(new Path2D("M4 8H96M4 41H96M4 8H36C78 8 78 74 36 74H14L72 138"));
    c.restore();
  }

  /* ── surfaces ── */

  fill(color: string, r: Rect = { x: 0, y: 0, w: this.w, h: this.h }) {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(r.x, r.y, r.w, r.h);
  }

  /** The sheet itself: paper, or near-black with a soft fall-off to ink, and the grid. */
  background(o: { grid?: boolean } = {}) {
    const c = this.ctx;
    if (this.pal.dark) {
      const g = c.createRadialGradient(this.w * 0.5, this.h * 0.42, 0, this.w * 0.5, this.h * 0.42, Math.hypot(this.w, this.h) * 0.62);
      g.addColorStop(0, "#232323");
      g.addColorStop(0.55, C.graphite);
      g.addColorStop(1, C.ink);
      c.fillStyle = g;
      c.fillRect(0, 0, this.w, this.h);
    } else this.fill(C.paper);
    if (o.grid !== false) this.grid();
  }

  /** 24-unit minor and 120-unit major lines, as on a drafting sheet. */
  grid(r: Rect = { x: 0, y: 0, w: this.w, h: this.h }, strength = 1) {
    const c = this.ctx;
    const minor = this.s(24);
    c.save();
    c.beginPath();
    c.rect(r.x, r.y, r.w, r.h);
    c.clip();
    c.globalAlpha = strength;
    c.lineWidth = Math.max(1, Math.round(this.u));
    const off = c.lineWidth % 2 ? 0.5 : 0;
    for (let i = 0, x = 0; x <= this.w; i++, x = i * minor) {
      c.strokeStyle = i % 5 === 0 ? this.pal.gridMajor : this.pal.gridMinor;
      c.beginPath();
      c.moveTo(Math.round(x) + off, r.y);
      c.lineTo(Math.round(x) + off, r.y + r.h);
      c.stroke();
    }
    for (let i = 0, y = 0; y <= this.h; i++, y = i * minor) {
      c.strokeStyle = i % 5 === 0 ? this.pal.gridMajor : this.pal.gridMinor;
      c.beginPath();
      c.moveTo(r.x, Math.round(y) + off);
      c.lineTo(r.x + r.w, Math.round(y) + off);
      c.stroke();
    }
    c.restore();
  }

  /* ── lines and marks ── */

  line(x1: number, y1: number, x2: number, y2: number, color = this.pal.line, weight = this.s(1.5)) {
    const c = this.ctx;
    c.save();
    c.strokeStyle = color;
    c.lineWidth = Math.max(1, weight);
    c.lineCap = "butt";
    c.beginPath();
    c.moveTo(x1, y1);
    c.lineTo(x2, y2);
    c.stroke();
    c.restore();
  }

  /** L-shaped crop marks on the four corners of a frame. */
  corners(r: Rect, len = this.s(28), color = this.pal.fg, weight = this.s(2.5)) {
    const c = this.ctx;
    c.save();
    c.strokeStyle = color;
    c.lineWidth = Math.max(1, weight);
    c.lineCap = "square";
    const { x, y, w, h } = r;
    const corner = (cx: number, cy: number, dx: number, dy: number) => {
      c.beginPath();
      c.moveTo(cx + dx * len, cy);
      c.lineTo(cx, cy);
      c.lineTo(cx, cy + dy * len);
      c.stroke();
    };
    corner(x, y, 1, 1);
    corner(x + w, y, -1, 1);
    corner(x, y + h, 1, -1);
    corner(x + w, y + h, -1, -1);
    c.restore();
  }

  /** A registration cross. */
  crosshair(cx: number, cy: number, r = this.s(9), color = this.pal.faint, weight = this.s(1.5)) {
    const c = this.ctx;
    c.save();
    c.strokeStyle = color;
    c.lineWidth = Math.max(1, weight);
    c.beginPath();
    c.arc(cx, cy, r * 0.62, 0, Math.PI * 2);
    c.moveTo(cx - r * 1.4, cy);
    c.lineTo(cx + r * 1.4, cy);
    c.moveTo(cx, cy - r * 1.4);
    c.lineTo(cx, cy + r * 1.4);
    c.stroke();
    c.restore();
  }

  /** The thin construction circle that echoes the "O" of the logo: one per design. */
  circle(cx: number, cy: number, r: number, color = this.pal.line, weight = this.s(1.5)) {
    const c = this.ctx;
    c.save();
    c.strokeStyle = color;
    c.lineWidth = Math.max(1, weight);
    c.beginPath();
    c.arc(cx, cy, r, 0, Math.PI * 2);
    c.stroke();
    c.setLineDash([this.s(5), this.s(11)]);
    c.beginPath();
    c.arc(cx, cy, r * 1.12, 0, Math.PI * 2);
    c.stroke();
    c.setLineDash([]);
    c.globalAlpha = 0.7;
    c.beginPath();
    c.moveTo(cx - r * 1.24, cy);
    c.lineTo(cx + r * 1.24, cy);
    c.moveTo(cx, cy - r * 1.24);
    c.lineTo(cx, cy + r * 1.24);
    c.stroke();
    c.restore();
  }

  /** A dimension line: end ticks and a mono label in the middle. */
  dimension(x: number, y: number, w: number, label: string, color = this.pal.faint) {
    const tick = this.s(9);
    const size = this.s(19);
    const m = this.text({ text: label, x, y, w, size, mono: true, upper: true, track: 0.12, dry: true, maxLines: 1 });
    const gap = m.w ? m.w + this.s(28) : 0;
    const mid = x + w / 2;
    this.line(x, y - tick, x, y + tick, color);
    this.line(x + w, y - tick, x + w, y + tick, color);
    if (gap && gap < w - this.s(40)) {
      this.line(x, y, mid - gap / 2, y, color);
      this.line(mid + gap / 2, y, x + w, y, color);
      this.text({ text: label, x: mid - m.w / 2, y: y - m.cap / 2, w: m.w + size, size, mono: true, upper: true, track: 0.12, color, maxLines: 1 });
    } else this.line(x, y, x + w, y, color);
  }

  /** Pencil hatching inside a frame. */
  hatch(r: Rect, spacing = this.s(14), color = this.pal.line, weight = this.s(1.2)) {
    const c = this.ctx;
    c.save();
    c.beginPath();
    c.rect(r.x, r.y, r.w, r.h);
    c.clip();
    c.strokeStyle = color;
    c.lineWidth = Math.max(1, weight);
    c.beginPath();
    for (let d = -r.h; d < r.w + spacing; d += spacing) {
      c.moveTo(r.x + d, r.y + r.h);
      c.lineTo(r.x + d + r.h, r.y);
    }
    c.stroke();
    c.restore();
  }

  roundRect(r: Rect, radius: number, o: { fill?: string; stroke?: string; weight?: number }) {
    const c = this.ctx;
    c.save();
    c.beginPath();
    c.roundRect(r.x, r.y, r.w, r.h, radius);
    if (o.fill) {
      c.fillStyle = o.fill;
      c.fill();
    }
    if (o.stroke) {
      c.strokeStyle = o.stroke;
      c.lineWidth = Math.max(1, o.weight ?? this.s(1.5));
      c.stroke();
    }
    c.restore();
  }

  /* ── small parts ── */

  /** A mono annotation with a registration cross in front: "⊕ CASE STUDY · 01". Returns its width. */
  tag(x: number, y: number, label: string, o: { color?: string; size?: number; cross?: boolean; maxW?: number } = {}) {
    const size = o.size ?? this.s(22);
    const color = o.color ?? this.pal.faint;
    const lead = o.cross === false ? 0 : this.s(34);
    const m = this.text({ text: label, x: x + lead, y, w: (o.maxW ?? this.box.w) - lead, size, mono: true, upper: true, track: 0.12, color, maxLines: 1 });
    if (lead) this.crosshair(x + this.s(11), y + m.cap / 2, this.s(8), color);
    return { w: lead + m.w, h: m.cap };
  }

  /** A button-like label. Returns its size; `y` is its top. */
  pill(x: number, y: number, label: string, o: { filled?: boolean; size?: number; arrow?: boolean; dry?: boolean; align?: "left" | "right" } = {}) {
    const size = o.size ?? this.s(30);
    const padX = size * 0.95;
    const h = size * 2.15;
    const arrow = o.arrow === false ? 0 : size * 1.25;
    const m = this.text({ text: label, x: 0, y: 0, w: this.w, size, weight: 700, dry: true, maxLines: 1 });
    const w = m.w + padX * 2 + arrow;
    const left = o.align === "right" ? x - w : x;
    if (!o.dry) {
      const filled = o.filled !== false;
      this.roundRect({ x: left, y, w, h }, this.s(8), filled ? { fill: this.pal.fg } : { stroke: this.pal.fg, weight: this.s(2.5) });
      const ink = filled ? this.pal.bg : this.pal.fg;
      this.text({ text: label, x: left + padX, y: y + (h - m.cap) / 2, w: m.w + size, size, weight: 700, color: ink, maxLines: 1 });
      if (arrow) {
        const ax = left + padX + m.w + size * 0.45, ay = y + h / 2, al = size * 0.62;
        const c = this.ctx;
        c.save();
        c.strokeStyle = ink;
        c.lineWidth = Math.max(1.5, size * 0.085);
        c.lineCap = "round";
        c.lineJoin = "round";
        c.beginPath();
        c.moveTo(ax, ay);
        c.lineTo(ax + al, ay);
        c.moveTo(ax + al - al * 0.42, ay - al * 0.42);
        c.lineTo(ax + al, ay);
        c.lineTo(ax + al - al * 0.42, ay + al * 0.42);
        c.stroke();
        c.restore();
      }
    }
    return { w, h };
  }

  /** A small boxed mono note, such as "ILLUSTRATION". `x`,`y` is its top-left (or top-right with align "right"). */
  stamp(x: number, y: number, label: string, o: { align?: "left" | "right"; onPhoto?: boolean; dry?: boolean } = {}) {
    const size = this.s(17);
    const pad = this.s(11);
    const m = this.text({ text: label, x: 0, y: 0, w: this.w, size, mono: true, upper: true, track: 0.12, dry: true, maxLines: 1 });
    const w = m.w + pad * 2, h = m.cap + pad * 2;
    if (o.dry) return { w, h };
    const left = o.align === "right" ? x - w : x;
    const ink = o.onPhoto ? C.paper : this.pal.faint;
    if (o.onPhoto) this.fill(`rgba(${INK_RGB},0.55)`, { x: left, y, w, h });
    this.roundRect({ x: left, y, w, h }, this.s(3), { stroke: o.onPhoto ? `rgba(${PAPER_RGB},0.7)` : this.pal.line, weight: this.s(1.5) });
    this.text({ text: label, x: left + pad, y: y + pad, w: m.w + size, size, mono: true, upper: true, track: 0.12, color: ink, maxLines: 1 });
    return { w, h };
  }

  /**
   * The FrameMind logo: the framed-head mark alone, or the mark with "FrameMind / AI STUDIO" set beside it in DM Sans
   * (the same lock-up as HQ's sidebar). `h` is the height of the whole logo. Returns its width.
   */
  logo(kind: "wordmark" | "mark", x: number, y: number, h: number, o: { white?: boolean; align?: "left" | "right" | "center"; alpha?: number } = {}) {
    const white = o.white ?? this.pal.dark;
    const img = white ? this.assets.markWhite : this.assets.mark;
    const c = this.ctx;
    const markW = (h * img.naturalWidth) / img.naturalHeight;
    const name = Math.round(h * 0.46);
    const line = Math.round(h * 0.2);
    c.save();
    c.font = `600 ${name}px ${this.fonts.sans}`;
    const nameW = c.measureText("FrameMind").width;
    c.font = `500 ${line}px ${this.fonts.sans}`;
    const lineW = c.measureText("AI STUDIO").width + line * 0.3 * 8;
    const gap = h * 0.22;
    const w = kind === "mark" ? markW : markW + gap + Math.max(nameW, lineW);
    const left = o.align === "right" ? x - w : o.align === "center" ? x - w / 2 : x;
    c.globalAlpha = o.alpha ?? 1;
    c.imageSmoothingQuality = "high";
    c.drawImage(img, left, y, markW, h);
    if (kind === "wordmark") {
      const tx = left + markW + gap;
      c.textBaseline = "alphabetic";
      c.textAlign = "left";
      c.fillStyle = white ? C.paper : C.ink;
      c.font = `600 ${name}px ${this.fonts.sans}`;
      c.fillText("FrameMind", tx, y + h * 0.56);
      c.fillStyle = white ? C.accent : C.violet;
      c.font = `500 ${line}px ${this.fonts.sans}`;
      if ("letterSpacing" in c) (c as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${line * 0.3}px`;
      c.fillText("AI STUDIO", tx, y + h * 0.88);
    }
    c.restore();
    return w;
  }

  /* ── pictures ── */

  /** A picture filling a frame, cropped around its focus point. */
  picture(pic: Picture, r: Rect, o: { radius?: number; bw?: boolean } = {}) {
    const c = this.ctx;
    const bw = o.bw ?? pic.bw;
    const src: CanvasImageSource = bw ? tonedCopy(pic) : pic.el;
    const srcW = bw ? (src as HTMLCanvasElement).width : pic.w;
    const srcH = bw ? (src as HTMLCanvasElement).height : pic.h;
    const scale = Math.max(r.w / srcW, r.h / srcH) * Math.max(1, pic.zoom);
    const sw = r.w / scale, sh = r.h / scale;
    const sx = Math.min(Math.max(pic.fx * srcW - sw / 2, 0), srcW - sw);
    const sy = Math.min(Math.max(pic.fy * srcH - sh / 2, 0), srcH - sh);
    c.save();
    c.beginPath();
    if (o.radius) c.roundRect(r.x, r.y, r.w, r.h, o.radius);
    else c.rect(r.x, r.y, r.w, r.h);
    c.clip();
    c.imageSmoothingQuality = "high";
    c.drawImage(src, sx, sy, sw, sh, r.x, r.y, r.w, r.h);
    c.restore();
  }

  /** A graphite veil over part of a picture so that text on it can be read. */
  scrim(r: Rect, from: "bottom" | "top" | "left" | "right", strong = 0.82, weak = 0) {
    const c = this.ctx;
    const g =
      from === "bottom" ? c.createLinearGradient(0, r.y + r.h, 0, r.y) : from === "top" ? c.createLinearGradient(0, r.y, 0, r.y + r.h) : from === "left" ? c.createLinearGradient(r.x, 0, r.x + r.w, 0) : c.createLinearGradient(r.x + r.w, 0, r.x, 0);
    g.addColorStop(0, `rgba(${INK_RGB},${strong})`);
    g.addColorStop(0.55, `rgba(${INK_RGB},${weak + (strong - weak) * 0.45})`);
    g.addColorStop(1, `rgba(${INK_RGB},${weak})`);
    c.fillStyle = g;
    c.fillRect(r.x, r.y, r.w, r.h);
  }

  /** An even veil (for a whole photograph under text). */
  veil(r: Rect, strength = 0.4) {
    this.fill(`rgba(${INK_RGB},${strength})`, r);
  }
}
