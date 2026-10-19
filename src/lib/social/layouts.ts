/**
 * The page layouts every Social Studio design is made from. Each one follows the template anatomy of the brand's
 * Social Media Templates Spec (background, veil, faint engineering grid, corner marks on one frame, a DM Sans
 * headline with one mono annotation, and the logo once) and arranges itself for the four sizes.
 *
 *   poster   type-led announcement: annotation, headline, a few facts or points, one call to action
 *   photo    a picture fills the frame, the words sit on a graphite veil
 *   figure   one big number with a line under it
 *   quote    someone's words and who said them
 *   list     a title and numbered points
 *   point    one numbered point (the inside slides of a carousel)
 *   thumb    a video thumbnail or cover: very few, very large words
 *   collage  two to four pictures under a title
 */
import QRCode from "qrcode";
import { C, type Painter, type Rect } from "./canvas";
import type { Picture } from "./types";

const PAPER_SOFT = "rgba(245,241,232,0.86)";

/** draws itself with its top at `y` (or only measures) and returns its height */
type Block = (y: number, dry: boolean) => number;

const stackHeight = (blocks: Block[], gap: number) => blocks.reduce((sum, b) => sum + b(0, true), 0) + gap * Math.max(0, blocks.length - 1);

/* ───────────────────────────── the frame every design shares ───────────────────────────── */

export interface Chrome {
  /** the mono annotation at the top left, such as "NOW LIVE · ANNOUNCEMENT" */
  tag: string;
  /** a short mono note at the top right: a date, "02 / 06" */
  index?: string;
  /** a short mono note at the bottom right: the website, a handle */
  foot?: string;
}

/** Annotation row on top, wordmark row at the bottom, hairlines between. Returns the space left for the design. */
export function chrome(p: Painter, c: Chrome, o: { rules?: boolean; ink?: string; white?: boolean } = {}): Rect {
  const b = p.box;
  const ink = o.ink ?? p.pal.faint;
  const tag = p.tag(b.x, b.y, c.tag, { color: ink, maxW: b.w * (c.index ? 0.66 : 1) });
  if (c.index) p.text({ text: c.index, x: b.x, y: b.y, w: b.w, size: p.s(22), mono: true, upper: true, track: 0.12, color: ink, align: "right", maxLines: 1 });
  const topRule = b.y + tag.h + p.s(26);

  const logoH = p.s(p.wide ? 74 : 84);
  const bottom = b.y + b.h;
  p.logo("wordmark", b.x, bottom - logoH, logoH, { white: o.white });
  if (c.foot) {
    const m = p.text({ text: c.foot, x: b.x, y: 0, w: b.w * 0.6, size: p.s(20), mono: true, upper: true, track: 0.12, dry: true, maxLines: 1 });
    p.text({ text: c.foot, x: b.x + b.w * 0.4, y: bottom - p.s(10) - m.cap, w: b.w * 0.6, size: p.s(20), mono: true, upper: true, track: 0.12, color: ink, align: "right", maxLines: 1 });
  }
  const bottomRule = bottom - logoH - p.s(24);
  if (o.rules !== false) {
    p.line(b.x, topRule, b.x + b.w, topRule);
    p.line(b.x, bottomRule, b.x + b.w, bottomRule);
  }
  if (p.tall) p.corners({ x: p.s(44), y: p.s(44), w: p.w - p.s(88), h: p.h - p.s(88) }, p.s(34), p.pal.line, p.s(2));
  const y = topRule + p.s(44);
  return { x: b.x, y, w: b.w, h: bottomRule - p.s(40) - y };
}

/* ───────────────────────────── shared blocks ───────────────────────────── */

export interface Fact {
  label: string;
  value: string;
}

/** A row of label-over-value pairs with hairlines, like the title block of a drawing. */
function factsBlock(p: Painter, facts: Fact[], x: number, w: number): Block {
  const items = facts.filter((f) => f.value.trim()).slice(0, 4);
  const cols = items.length <= 3 || p.wide ? items.length : 2;
  const rows = Math.ceil(items.length / Math.max(1, cols));
  const colW = w / Math.max(1, cols);
  const pad = p.s(22);
  const labelSize = p.s(18);
  const valueSize = p.s(cols >= 4 ? 28 : 32);
  const inner = colW - p.s(cols > 1 ? 26 : 0);
  const rowH = (row: number) => {
    let tallest = 0;
    for (let i = row * cols; i < Math.min(items.length, (row + 1) * cols); i++) {
      const v = p.text({ text: items[i].value, x: 0, y: 0, w: inner, size: valueSize, minSize: p.s(23), weight: 700, lh: 1.2, maxLines: 2, dry: true });
      tallest = Math.max(tallest, v.h);
    }
    return pad + labelSize * 0.72 + p.s(15) + tallest + pad;
  };
  return (y, dry) => {
    if (!items.length) return 0;
    let top = y;
    for (let r = 0; r < rows; r++) {
      const h = rowH(r);
      if (!dry) {
        p.line(x, top, x + w, top);
        for (let i = r * cols; i < Math.min(items.length, (r + 1) * cols); i++) {
          const cx = x + (i - r * cols) * colW;
          if (i > r * cols) p.line(cx, top + p.s(14), cx, top + h - p.s(14));
          const tx = cx + (i > r * cols ? p.s(26) : 0);
          const l = p.text({ text: items[i].label, x: tx, y: top + pad, w: inner, size: labelSize, mono: true, upper: true, track: 0.12, color: p.pal.faint, maxLines: 1 });
          p.text({ text: items[i].value, x: tx, y: top + pad + l.cap + p.s(15), w: inner, size: valueSize, minSize: p.s(23), weight: 700, lh: 1.2, maxLines: 2 });
        }
      }
      top += h;
    }
    if (!dry) p.line(x, top, x + w, top);
    return top - y;
  };
}

/** Short points with a mono index in front: 01, 02, 03. */
function bulletsBlock(p: Painter, bullets: string[], x: number, w: number, o: { size?: number; max?: number } = {}): Block {
  const items = bullets.map((b) => b.trim()).filter(Boolean).slice(0, o.max ?? 4);
  const size = o.size ?? p.s(31);
  const lead = p.s(66);
  const pad = p.s(19);
  return (y, dry) => {
    let top = y;
    items.forEach((item, i) => {
      const m = p.text({ text: item, x: x + lead, y: top + pad, w: w - lead, size, weight: 500, color: p.pal.soft, lh: 1.3, maxLines: 2, dry: true });
      if (!dry) {
        p.line(x, top, x + w, top);
        p.text({ text: String(i + 1).padStart(2, "0"), x, y: top + pad + (m.cap - p.s(21) * 0.72) / 2, w: lead, size: p.s(21), mono: true, color: p.pal.faint, maxLines: 1 });
        p.text({ text: item, x: x + lead, y: top + pad, w: w - lead, size, weight: 500, color: p.pal.soft, lh: 1.3, maxLines: 2 });
      }
      top += pad + m.h + size * 0.28 + pad;
    });
    return top - y;
  };
}

/**
 * A QR code on its own light square (so it scans on the graphite tone too) and, beside it, the call to action with
 * a mono note under it, such as "Scan, or write to us to apply".
 */
export interface QrCta {
  url: string;
  note: string;
}

function qrCtaBlock(p: Painter, label: string, qr: QrCta, x: number, w: number): Block {
  const side = p.s(p.tall ? 210 : 184);
  const gapX = p.s(34);
  const noteSize = p.s(19);
  return (y, dry) => {
    const pill = p.pill(0, 0, label, { dry: true });
    const textW = Math.max(p.s(120), w - side - gapX);
    const note = p.text({ text: qr.note, x: 0, y: 0, w: textW, size: noteSize, mono: true, upper: true, track: 0.1, lh: 1.45, maxLines: 2, dry: true });
    const right = pill.h + p.s(18) + note.h;
    const h = Math.max(side, right);
    if (!dry) {
      const code = QRCode.create(qr.url, { errorCorrectionLevel: "M" });
      const n = code.modules.size;
      const quiet = p.s(14);
      const cell = (side - quiet * 2) / n;
      const top = y + (h - side) / 2;
      const c = p.ctx;
      c.save();
      c.fillStyle = C.paper50;
      c.fillRect(x, top, side, side);
      c.fillStyle = C.ink;
      for (let r = 0; r < n; r++)
        for (let k = 0; k < n; k++) {
          // each dark module, drawn a hair wider so no seams show between neighbours
          if (code.modules.get(r, k)) c.fillRect(x + quiet + k * cell, top + quiet + r * cell, cell + 0.6, cell + 0.6);
        }
      c.restore();
      p.roundRect({ x, y: top, w: side, h: side }, 0, { stroke: p.pal.line, weight: p.s(1.5) });
      const tx = x + side + gapX;
      const ty = y + (h - right) / 2;
      if (pill.w <= textW) p.pill(tx, ty, label);
      else p.pill(tx, ty, label, { size: p.s(24) });
      p.text({ text: qr.note, x: tx, y: ty + pill.h + p.s(18), w: textW, size: noteSize, mono: true, upper: true, track: 0.1, lh: 1.45, color: p.pal.faint, maxLines: 2 });
    }
    return h;
  };
}

function ctaBlock(p: Painter, label: string, x: number, o: { align?: "left" | "right" | "center"; w?: number } = {}): Block {
  return (y, dry) => {
    const m = p.pill(0, 0, label, { dry: true });
    const left = o.align === "center" && o.w ? x + (o.w - m.w) / 2 : x;
    if (!dry) p.pill(left, y, label);
    return m.h;
  };
}

/** A picture in a frame with corner marks, and the "ILLUSTRATION" note when it is not a photograph. */
function artPanel(p: Painter, r: Rect, pic: Picture) {
  p.picture(pic, r);
  p.roundRect(r, 0, { stroke: p.pal.line, weight: p.s(1.5) });
  p.corners({ x: r.x - p.s(12), y: r.y - p.s(12), w: r.w + p.s(24), h: r.h + p.s(24) });
  if (pic.illustration) p.stamp(r.x + r.w - p.s(16), r.y + r.h - p.s(16) - p.s(34), "Illustration", { align: "right", onPhoto: true });
}

export interface Hero {
  /** small mono line above, such as "THU" */
  top?: string;
  /** the big figure, such as "23" */
  main: string;
  /** small mono line below, such as "OCT 2026" */
  bottom?: string;
}

/** The construction circle with a figure inside it: a date, a count, an episode number. */
function heroCircle(p: Painter, cx: number, cy: number, r: number, hero: Hero | null) {
  p.circle(cx, cy, r);
  if (!hero) {
    p.crosshair(cx, cy, p.s(12), p.pal.line);
    return;
  }
  const w = r * 1.5;
  const main = p.text({ text: hero.main, x: cx - w / 2, y: 0, w, size: r * 0.98, minSize: r * 0.34, weight: 800, track: -0.03, align: "center", maxLines: 1, dry: true });
  const top = cy - main.cap / 2;
  p.text({ text: hero.main, x: cx - w / 2, y: top, w, size: main.size, weight: 800, track: -0.03, align: "center", maxLines: 1 });
  const note = p.s(19);
  if (hero.top) p.text({ text: hero.top, x: cx - w / 2, y: top - note * 0.72 - r * 0.16, w, size: note, mono: true, upper: true, track: 0.14, color: p.pal.faint, align: "center", maxLines: 1 });
  if (hero.bottom) p.text({ text: hero.bottom, x: cx - w / 2, y: top + main.cap + r * 0.16, w, size: note, mono: true, upper: true, track: 0.14, color: p.pal.faint, align: "center", maxLines: 1 });
}

/* ───────────────────────────── poster ───────────────────────────── */

export interface PosterContent extends Chrome {
  /** small mono line above the headline */
  eyebrow?: string;
  headline: string;
  sub?: string;
  /** a mono label on the dimension line under the headline */
  dim?: string;
  facts?: Fact[];
  bullets?: string[];
  cta?: string;
  /** a QR code beside the call to action */
  qr?: QrCta;
  picture?: Picture | null;
  hero?: Hero | null;
}

export function poster(p: Painter, c: PosterContent) {
  p.background();
  const R = chrome(p, c);
  const pic = c.picture ?? null;
  const gap = p.s(34);
  const heroR = p.s(p.tall ? 132 : 112);
  const hasBullets = !!c.bullets?.some((b) => b.trim());
  const hasFacts = !!c.facts?.some((f) => f.value.trim());

  /**
   * Everything is measured before anything is drawn. When the words do not leave the headline enough room, the
   * layout gives way in steps: the sub line shortens and then goes, and only after that the picture gets lower
   * and the list loses its last point.
   */
  const plan = (pressure: number) => {
    let col: Rect = R;
    let art: Rect | null = null;
    if (p.wide) {
      const side = p.s(72);
      const leftW = Math.round(R.w * (pic ? 0.53 : 0.6));
      col = { ...R, w: leftW };
      art = { x: R.x + leftW + side, y: R.y, w: R.w - leftW - side, h: R.h };
    } else if (pic) {
      const squeeze = pressure >= 5 ? 0.72 : pressure >= 4 ? 0.86 : 1;
      // a square sheet with no list of points can give the picture more of its height
      const share = p.tall ? 0.4 : p.portrait ? 0.42 : hasBullets ? 0.34 : 0.43;
      const h = Math.round(Math.min(R.h * share, R.w / Math.max(1, pic.w / pic.h)) * squeeze);
      art = { x: R.x, y: R.y, w: R.w, h };
      col = { x: R.x, y: R.y + h + p.s(46), w: R.w, h: R.h - h - p.s(46) };
    }
    const band = !p.wide && !pic && c.hero ? heroR * 2.28 + p.s(30) : 0;

    const lower: Block[] = [];
    const most = (p.tall ? 4 : pic ? 3 : 4) - (pressure >= 5 ? 1 : 0);
    if (hasBullets) lower.push(bulletsBlock(p, c.bullets ?? [], col.x, col.w, { max: Math.max(2, most) }));
    if (hasFacts) lower.push(factsBlock(p, c.facts ?? [], col.x, col.w));
    if (c.cta && c.qr) lower.push(qrCtaBlock(p, c.cta, c.qr, col.x, col.w));
    else if (c.cta) lower.push(ctaBlock(p, c.cta, col.x));
    const lowerH = stackHeight(lower, gap);

    const upperH = col.h - (lower.length ? lowerH + p.s(50) : 0);
    const eyebrowW = band ? col.w - heroR * 2.5 : col.w;
    const eyebrow = c.eyebrow ? p.text({ text: c.eyebrow, x: col.x, y: 0, w: eyebrowW, size: p.s(22), mono: true, upper: true, track: 0.12, lh: 1.5, maxLines: band ? 3 : 2, dry: true }) : null;
    const subLines = pressure >= 3 ? 0 : pressure >= 2 ? 1 : pressure >= 1 ? 2 : p.tall ? 4 : 3;
    const subSize = p.s(p.wide ? 30 : 34);
    const sub = c.sub && subLines ? p.text({ text: c.sub, x: col.x, y: 0, w: col.w * 0.96, size: subSize, weight: 500, lh: 1.36, maxLines: subLines, dry: true }) : null;
    const dimH = c.dim ? p.s(62) : 0;
    const lead = band ? band : eyebrow ? eyebrow.h + p.s(34) : 0;
    const headMax = upperH - lead - dimH - (sub ? sub.h + subSize * 0.3 + p.s(44) : 0);
    return { col, art, band, lower, lowerH, eyebrow, eyebrowW, sub, subLines, subSize, lead, headMax };
  };

  const headSize = p.s(p.wide ? 100 : p.tall ? 140 : p.portrait ? 122 : 104);
  const headline = (L: ReturnType<typeof plan>) => ({ text: c.headline, x: L.col.x, w: L.col.w, size: headSize, minSize: p.s(40), weight: 800, track: -0.025, lh: 1.04, maxLines: p.tall ? 5 : 4, maxH: Math.max(p.s(44), L.headMax), balance: true });
  // large enough to stop a thumb: about two thirds of its full size, and never cut short
  const reads = (L: ReturnType<typeof plan>) => {
    const m = p.text({ ...headline(L), y: 0, dry: true });
    return m.size >= headSize * 0.62 && !m.lines[m.lines.length - 1].endsWith("…");
  };
  let L = plan(0);
  for (let pressure = 1; pressure <= 5 && !reads(L); pressure++) L = plan(pressure);
  const { col } = L;

  // the picture, or on a wide sheet the drawing-board panel with the date or number in a circle
  if (L.art && pic) artPanel(p, L.art, pic);
  else if (L.art) {
    const side = L.art;
    p.hatch({ x: side.x, y: side.y + side.h * 0.72, w: side.w, h: side.h * 0.28 }, p.s(16));
    p.corners(side, p.s(30));
    heroCircle(p, side.x + side.w / 2, side.y + side.h * 0.4, Math.min(side.w, side.h) * 0.3, c.hero ?? null);
    p.text({ text: "Precision · Learning · Innovation · Automation", x: side.x + p.s(24), y: side.y + side.h - p.s(46), w: side.w - p.s(48), size: p.s(17), mono: true, upper: true, track: 0.12, color: p.pal.faint, align: "center", maxLines: 1 });
  }
  if (L.band && c.hero) heroCircle(p, col.x + col.w - heroR * 1.14, col.y + heroR * 1.14, heroR, c.hero);

  // the words: eyebrow, headline (as large as the space allows), sub line
  let y = col.y;
  if (L.eyebrow && c.eyebrow) {
    const ey = L.band ? col.y + (L.band - p.s(30) - L.eyebrow.h) / 2 : y;
    p.text({ text: c.eyebrow, x: col.x, y: ey, w: L.eyebrowW, size: p.s(22), mono: true, upper: true, track: 0.12, lh: 1.5, color: p.pal.faint, maxLines: L.band ? 3 : 2 });
  }
  y += L.lead;
  const head = p.text({ ...headline(L), y });
  y += head.h;
  if (c.dim) {
    y += p.s(40);
    p.dimension(col.x, y, Math.max(p.s(260), Math.min(col.w, head.w)), c.dim);
    y += p.s(22);
  }
  if (L.sub && c.sub) {
    y += p.s(44);
    y += p.text({ text: c.sub, x: col.x, y, w: col.w * 0.96, size: L.subSize, weight: 500, lh: 1.36, color: p.pal.soft, maxLines: L.subLines }).h + L.subSize * 0.3;
  }

  const lowerTop = col.y + col.h - L.lowerH;
  // the construction circle, once, in the open space between the words and what follows
  if (!p.wide && !c.hero) {
    const free = (L.lower.length ? lowerTop : col.y + col.h) - y - p.s(70);
    if (free > p.s(150)) {
      const r = Math.min(free * 0.62, p.s(250));
      const c2 = p.ctx;
      c2.save();
      c2.beginPath();
      c2.rect(0, y + p.s(30), p.w, free + p.s(40));
      c2.clip();
      p.circle(col.x + col.w - r * 0.42, y + p.s(70) + free / 2, r);
      c2.restore();
    }
  }
  let ly = lowerTop;
  for (const block of L.lower) ly += block(ly, false) + gap;
}

/* ───────────────────────────── photo ───────────────────────────── */

export interface PhotoContent extends Chrome {
  headline: string;
  sub?: string;
  /** short mono notes in boxes above the headline: a date, a place */
  chips?: string[];
  picture: Picture | null;
}

/** The six layers of the spec: picture, veil, grid, corner marks, headline with one annotation, logo. */
function photoGround(p: Painter, pic: Picture | null, o: { from?: "bottom" | "left" } = {}) {
  const full: Rect = { x: 0, y: 0, w: p.w, h: p.h };
  if (pic) {
    p.picture(pic, full);
    p.veil(full, 0.2);
    if (o.from === "left") p.scrim({ x: 0, y: 0, w: p.w * 0.78, h: p.h }, "left", 0.9, 0);
    p.scrim({ x: 0, y: p.h * 0.36, w: p.w, h: p.h * 0.64 }, "bottom", 0.9, 0);
    p.scrim({ x: 0, y: 0, w: p.w, h: p.h * 0.3 }, "top", 0.62, 0);
    p.grid(full, 1.15);
  } else {
    p.background();
    p.hatch({ x: 0, y: 0, w: p.w, h: p.h * 0.52 }, p.s(20), "rgba(245,241,232,0.07)");
    p.circle(p.w * 0.68, p.h * 0.3, p.s(230), "rgba(245,241,232,0.2)");
  }
}

export function photo(p: Painter, c: PhotoContent) {
  const pic = c.picture;
  photoGround(p, pic, { from: p.wide ? "left" : "bottom" });
  const b = p.box;
  p.corners({ x: b.x - p.s(20), y: b.y - p.s(22), w: b.w + p.s(40), h: b.h + p.s(44) }, p.s(34), C.paper, p.s(3));

  p.tag(b.x, b.y, c.tag, { color: C.paper, maxW: b.w * (c.index ? 0.66 : 1) });
  if (c.index) p.text({ text: c.index, x: b.x, y: b.y, w: b.w, size: p.s(22), mono: true, upper: true, track: 0.12, color: C.paper, align: "right", maxLines: 1 });
  if (pic?.illustration) p.stamp(b.x + b.w, b.y + p.s(46), "Illustration", { align: "right", onPhoto: true });

  const bottom = b.y + b.h;
  const logoH = p.s(p.wide ? 74 : 84);
  p.logo("wordmark", b.x, bottom - logoH, logoH, { white: true });
  if (c.foot) {
    const m = p.text({ text: c.foot, x: 0, y: 0, w: b.w * 0.6, size: p.s(20), mono: true, upper: true, track: 0.12, dry: true, maxLines: 1 });
    p.text({ text: c.foot, x: b.x + b.w * 0.4, y: bottom - p.s(10) - m.cap, w: b.w * 0.6, size: p.s(20), mono: true, upper: true, track: 0.12, color: C.paper, align: "right", maxLines: 1 });
  }

  const w = p.wide ? b.w * 0.64 : b.w;
  let y = bottom - logoH - p.s(48);
  if (c.sub) {
    const size = p.s(p.wide ? 31 : 34);
    const m = p.text({ text: c.sub, x: b.x, y: 0, w: w * 0.94, size, weight: 500, lh: 1.36, maxLines: 3, dry: true });
    y -= m.h + size * 0.3;
    p.text({ text: c.sub, x: b.x, y, w: w * 0.94, size, weight: 500, lh: 1.36, color: PAPER_SOFT, maxLines: 3 });
    y -= p.s(38);
  }
  const headSize = p.s(p.wide ? 124 : p.tall ? 142 : p.portrait ? 118 : 102);
  const head = { text: c.headline, x: b.x, w, size: headSize, minSize: p.s(p.tall ? 96 : 56), weight: 800, track: -0.025, lh: 1.03, color: C.paper, maxLines: p.tall ? 4 : 3, maxH: b.h * 0.46, balance: true };
  const hm = p.text({ ...head, y: 0, dry: true });
  y -= hm.h;
  p.text({ ...head, y });

  const chips = (c.chips ?? []).map((s) => s.trim()).filter(Boolean).slice(0, 3);
  if (chips.length) {
    const gap = p.s(12);
    const rows: string[][] = [[]];
    let used = 0;
    let rowH = p.s(39);
    for (const chip of chips) {
      const m = p.stamp(0, 0, chip, { dry: true });
      rowH = m.h;
      if (rows[rows.length - 1].length && used + m.w > w) {
        rows.push([]);
        used = 0;
      }
      rows[rows.length - 1].push(chip);
      used += m.w + gap;
    }
    y -= p.s(40) + rows.length * rowH + (rows.length - 1) * gap;
    rows.forEach((row, r) => {
      let x = b.x;
      for (const chip of row) x += p.stamp(x, y + r * (rowH + gap), chip, { onPhoto: true }).w + gap;
    });
  }
}

/* ───────────────────────────── figure ───────────────────────────── */

export interface FigureContent extends Chrome {
  /** the number itself: "1,000", "03", "10" */
  figure: string;
  /** mono label on the dimension line under the number: "STUDENTS", "DAYS TO GO" */
  unit?: string;
  label: string;
  sub?: string;
  cta?: string;
}

export function figure(p: Painter, c: FigureContent) {
  p.background();
  const R = chrome(p, c);
  const numberIn = (zone: Rect) => {
    const r = Math.min(zone.w * 0.4, zone.h * 0.42);
    const cx = zone.x + zone.w / 2, cy = zone.y + zone.h * 0.46;
    p.circle(cx, cy, r);
    const w = zone.w * 0.94;
    const m = p.text({ text: c.figure, x: cx - w / 2, y: 0, w, size: r * 1.5, minSize: p.s(90), weight: 800, track: -0.035, align: "center", maxLines: 1, dry: true });
    p.text({ text: c.figure, x: cx - w / 2, y: cy - m.cap / 2, w, size: m.size, weight: 800, track: -0.035, align: "center", maxLines: 1 });
    if (c.unit) p.dimension(cx - Math.min(w, r * 2.2) / 2, cy + m.cap / 2 + p.s(64), Math.min(w, r * 2.2), c.unit);
  };
  const words = (zone: Rect, align: "left" | "center") => {
    const blocks: Block[] = [];
    const labelSize = p.s(p.wide ? 70 : p.tall ? 84 : 72);
    blocks.push((y, dry) => p.text({ text: c.label, x: zone.x, y, w: zone.w, size: labelSize, minSize: p.s(40), weight: 800, track: -0.02, lh: 1.08, align, maxLines: 3, balance: true, dry }).h);
    if (c.sub) blocks.push((y, dry) => p.text({ text: c.sub ?? "", x: zone.x, y, w: zone.w, size: p.s(33), weight: 500, lh: 1.36, color: p.pal.soft, align, maxLines: 3, dry }).h + p.s(8));
    if (c.cta) blocks.push(ctaBlock(p, c.cta, zone.x, { align, w: zone.w }));
    const gap = p.s(38);
    const h = stackHeight(blocks, gap);
    let y = zone.y + Math.max(0, (zone.h - h) / 2);
    for (const b of blocks) y += b(y, false) + gap;
    return h;
  };
  if (p.wide) {
    const half = R.w * 0.46;
    numberIn({ x: R.x, y: R.y, w: half, h: R.h });
    p.line(R.x + half + p.s(40), R.y + p.s(20), R.x + half + p.s(40), R.y + R.h - p.s(20));
    words({ x: R.x + half + p.s(96), y: R.y, w: R.w - half - p.s(96), h: R.h }, "left");
  } else {
    const split = R.h * (p.tall ? 0.52 : 0.56);
    numberIn({ x: R.x, y: R.y, w: R.w, h: split });
    words({ x: R.x + R.w * 0.04, y: R.y + split, w: R.w * 0.92, h: R.h - split }, "center");
  }
}

/* ───────────────────────────── quote ───────────────────────────── */

export interface QuoteContent extends Chrome {
  quote: string;
  name: string;
  role?: string;
  portrait?: Picture | null;
}

export function quote(p: Painter, c: QuoteContent) {
  p.background();
  const R = chrome(p, c);
  let col = R;
  if (p.wide && c.portrait) {
    const w = R.h * 0.8;
    artPanel(p, { x: R.x + R.w - w, y: R.y, w, h: R.h }, c.portrait);
    col = { ...R, w: R.w - w - p.s(80) };
  }
  // opening marks: two hatched strokes, drawn rather than typed, like a pencil would
  const mark = p.s(p.tall ? 128 : 108);
  for (let i = 0; i < 2; i++) {
    const mx = col.x + i * mark * 0.78;
    const c2 = p.ctx;
    c2.save();
    c2.beginPath();
    c2.moveTo(mx + mark * 0.3, col.y);
    c2.lineTo(mx + mark * 0.62, col.y);
    c2.lineTo(mx + mark * 0.34, col.y + mark);
    c2.lineTo(mx, col.y + mark);
    c2.closePath();
    c2.clip();
    p.fill(p.pal.dark ? "rgba(245,241,232,0.14)" : "rgba(43,43,43,0.1)", { x: mx, y: col.y, w: mark, h: mark });
    p.hatch({ x: mx, y: col.y, w: mark, h: mark }, p.s(9), p.pal.faint, p.s(1.6));
    c2.restore();
  }

  // who said it, at the bottom
  const face = !p.wide && c.portrait ? p.s(112) : 0;
  const nameSize = p.s(34);
  const attrH = Math.max(face, nameSize * 0.72 + (c.role ? p.s(18) + p.s(20) * 0.72 : 0));
  const attrY = col.y + col.h - attrH;
  p.line(col.x, attrY - p.s(34), col.x + p.s(120), attrY - p.s(34), p.pal.fg, p.s(4));
  let tx = col.x;
  if (face && c.portrait) {
    const c2 = p.ctx;
    c2.save();
    c2.beginPath();
    c2.arc(col.x + face / 2, attrY + face / 2, face / 2, 0, Math.PI * 2);
    c2.clip();
    p.picture(c.portrait, { x: col.x, y: attrY, w: face, h: face });
    c2.restore();
    c2.save();
    c2.strokeStyle = p.pal.line;
    c2.lineWidth = p.s(2);
    c2.beginPath();
    c2.arc(col.x + face / 2, attrY + face / 2, face / 2, 0, Math.PI * 2);
    c2.stroke();
    c2.restore();
    tx += face + p.s(28);
    // the brand rule holds for the small round portrait too: a drawn or generated picture says so
    if (c.portrait.illustration) p.stamp(col.x + col.w, attrY - p.s(51), "Illustration", { align: "right" });
  }
  const nameY = attrY + (attrH - (nameSize * 0.72 + (c.role ? p.s(18) + p.s(20) * 0.72 : 0))) / 2;
  const nm = p.text({ text: c.name, x: tx, y: nameY, w: col.x + col.w - tx, size: nameSize, weight: 700, maxLines: 1 });
  if (c.role) p.text({ text: c.role, x: tx, y: nameY + nm.cap + p.s(18), w: col.x + col.w - tx, size: p.s(20), mono: true, upper: true, track: 0.12, color: p.pal.faint, maxLines: 1 });

  const top = col.y + mark + p.s(46);
  const maxH = attrY - p.s(34) - p.s(56) - top;
  const size = p.s(p.wide ? 76 : p.tall ? 100 : p.portrait ? 88 : 72);
  const q = { text: c.quote, x: col.x, w: col.w, size, minSize: p.s(32), weight: 700, track: -0.012, lh: 1.26, maxLines: 12, maxH };
  const m = p.text({ ...q, y: 0, dry: true });
  p.text({ ...q, y: top + Math.max(0, (maxH - m.h) * 0.4) });
}

/* ───────────────────────────── list ───────────────────────────── */

export interface ListItem {
  title: string;
  text?: string;
}

export interface ListContent extends Chrome {
  eyebrow?: string;
  title: string;
  items: ListItem[];
  cta?: string;
}

export function list(p: Painter, c: ListContent) {
  p.background();
  const R = chrome(p, c);
  const items = c.items.filter((i) => i.title.trim()).slice(0, p.wide ? 4 : p.tall ? 6 : p.portrait ? 5 : 4);
  const titleBox = p.wide ? { x: R.x, w: R.w * 0.36 } : { x: R.x, w: R.w };
  let y = R.y;
  if (c.eyebrow) {
    const e = p.text({ text: c.eyebrow, x: titleBox.x, y, w: titleBox.w, size: p.s(22), mono: true, upper: true, track: 0.12, color: p.pal.faint, maxLines: 1 });
    y += e.h + p.s(32);
  }
  const title = p.text({ text: c.title, x: titleBox.x, y, w: titleBox.w, size: p.s(p.wide ? 78 : p.tall ? 92 : p.portrait ? 80 : 70), minSize: p.s(44), weight: 800, track: -0.025, lh: 1.05, maxLines: p.wide ? 5 : 3, maxH: p.wide ? R.h * 0.62 : R.h * 0.3, balance: true });
  y += title.h;

  const rows: Rect = p.wide ? { x: R.x + R.w * 0.42, y: R.y, w: R.w * 0.58, h: R.h } : { x: R.x, y: y + p.s(54), w: R.w, h: R.y + R.h - (y + p.s(54)) };
  let bottom = rows.y + rows.h;
  if (c.cta) {
    const m = p.pill(0, 0, c.cta, { dry: true });
    const cy = p.wide ? R.y + R.h - m.h : bottom - m.h;
    p.pill(p.wide ? R.x : rows.x, cy, c.cta);
    if (!p.wide) bottom = cy - p.s(40);
  }
  if (!items.length) return;
  const rowH = (bottom - rows.y) / items.length;
  const lead = p.s(p.wide ? 104 : 112);
  items.forEach((item, i) => {
    const top = rows.y + i * rowH;
    p.line(rows.x, top, rows.x + rows.w, top);
    const hasText = !!item.text?.trim();
    const titleSize = p.s(hasText ? 37 : 42);
    const t = p.text({ text: item.title, x: rows.x + lead, y: 0, w: rows.w - lead, size: titleSize, minSize: p.s(28), weight: 700, lh: 1.16, maxLines: hasText ? 2 : 3, dry: true });
    const b = hasText ? p.text({ text: item.text ?? "", x: rows.x + lead, y: 0, w: rows.w - lead, size: p.s(27), weight: 500, lh: 1.34, maxLines: 2, dry: true }) : null;
    const blockH = t.h + (b ? p.s(22) + b.h : 0);
    const ty = top + Math.max(p.s(22), (rowH - blockH) / 2);
    p.text({ text: String(i + 1).padStart(2, "0"), x: rows.x, y: ty - p.s(2), w: lead, size: p.s(46), mono: true, color: p.pal.faint, maxLines: 1 });
    p.text({ text: item.title, x: rows.x + lead, y: ty, w: rows.w - lead, size: titleSize, minSize: p.s(28), weight: 700, lh: 1.16, maxLines: hasText ? 2 : 3 });
    if (b) p.text({ text: item.text ?? "", x: rows.x + lead, y: ty + t.h + p.s(22), w: rows.w - lead, size: p.s(27), weight: 500, lh: 1.34, color: p.pal.soft, maxLines: 2 });
  });
  p.line(rows.x, bottom, rows.x + rows.w, bottom);
}

/* ───────────────────────────── point (inside slide of a carousel) ───────────────────────────── */

export interface PointContent extends Chrome {
  /** "02" */
  number: string;
  title: string;
  text?: string;
  /** show "SWIPE" with an arrow at the bottom right */
  more?: boolean;
}

export function point(p: Painter, c: PointContent) {
  p.background();
  const R = chrome(p, c);
  const numSize = p.s(p.tall ? 250 : 210);
  p.circle(R.x + R.w - p.s(150), R.y + p.s(150), p.s(140));
  const n = p.text({ text: c.number, x: R.x, y: R.y, w: R.w, size: numSize, mono: true, color: p.pal.faint, track: -0.04, maxLines: 1 });
  const blocks: Block[] = [];
  blocks.push((y, dry) => p.text({ text: c.title, x: R.x, y, w: R.w, size: p.s(p.tall ? 92 : 82), minSize: p.s(46), weight: 800, track: -0.025, lh: 1.06, maxLines: 4, balance: true, dry }).h);
  if (c.text) blocks.push((y, dry) => p.text({ text: c.text ?? "", x: R.x, y, w: R.w * 0.96, size: p.s(37), minSize: p.s(28), weight: 500, lh: 1.4, color: p.pal.soft, maxLines: p.tall ? 8 : 6, dry }).h);
  const gap = p.s(44);
  const h = stackHeight(blocks, gap);
  const zoneTop = R.y + n.h + p.s(70);
  const free = R.y + R.h - (c.more ? p.s(70) : 0) - zoneTop - h;
  let y = zoneTop + Math.max(0, free * 0.3);
  for (const b of blocks) y += b(y, false) + gap;
  if (c.more) {
    const m = p.text({ text: "Swipe", x: 0, y: 0, w: R.w, size: p.s(21), mono: true, upper: true, track: 0.16, dry: true, maxLines: 1 });
    const by = R.y + R.h - m.cap;
    p.text({ text: "Swipe", x: R.x, y: by, w: R.w - p.s(74), size: p.s(21), mono: true, upper: true, track: 0.16, color: p.pal.faint, align: "right", maxLines: 1 });
    p.line(R.x + R.w - p.s(58), by + m.cap / 2, R.x + R.w, by + m.cap / 2, p.pal.faint, p.s(2));
    p.line(R.x + R.w - p.s(14), by + m.cap / 2 - p.s(10), R.x + R.w, by + m.cap / 2, p.pal.faint, p.s(2));
    p.line(R.x + R.w - p.s(14), by + m.cap / 2 + p.s(10), R.x + R.w, by + m.cap / 2, p.pal.faint, p.s(2));
  }
}

/* ───────────────────────────── thumb (video thumbnail or cover) ───────────────────────────── */

export interface ThumbContent {
  /** two to four words, very large */
  words: string;
  /** mono line above the words: the series, the topic */
  series?: string;
  /** boxed note at the top right: "EP 03", "BTS", "4 MIN" */
  badge?: string;
  picture: Picture | null;
}

export function thumb(p: Painter, c: ThumbContent) {
  photoGround(p, c.picture, { from: p.wide ? "left" : "bottom" });
  const b = p.box;
  // the symbol at the top left (never together with the wordmark)
  const markH = p.s(p.wide ? 118 : 108);
  p.logo("mark", b.x, b.y, markH, { white: true });

  let badgeH = 0;
  if (c.badge?.trim()) {
    const size = p.s(p.wide ? 40 : 34);
    const pad = size * 0.62;
    const m = p.text({ text: c.badge, x: 0, y: 0, w: b.w * 0.5, size, mono: true, upper: true, track: 0.08, dry: true, maxLines: 1 });
    const bw = m.w + pad * 2, bh = m.cap + pad * 2;
    p.fill("rgba(22,22,22,0.5)", { x: b.x + b.w - bw, y: b.y, w: bw, h: bh });
    p.roundRect({ x: b.x + b.w - bw, y: b.y, w: bw, h: bh }, p.s(4), { stroke: C.paper, weight: p.s(3) });
    p.text({ text: c.badge, x: b.x + b.w - bw + pad, y: b.y + pad, w: m.w + size, size, mono: true, upper: true, track: 0.08, color: C.paper, maxLines: 1 });
    badgeH = bh + p.s(16);
  }
  if (c.picture?.illustration) p.stamp(b.x + b.w, b.y + badgeH, "Illustration", { align: "right", onPhoto: true });
  // the words: bottom left, clear of the time stamp YouTube puts at the bottom right
  const w = p.wide ? b.w * 0.66 : b.w;
  const size = p.s(p.wide ? 208 : p.tall ? 176 : p.portrait ? 160 : 140);
  const words = { text: c.words, x: b.x, w, size, minSize: p.s(84), weight: 800, track: -0.035, lh: 0.98, color: C.paper, upper: true, maxLines: p.wide ? 3 : 4, maxH: b.h * (p.wide ? 0.62 : 0.5), balance: true };
  const m = p.text({ ...words, y: 0, dry: true });
  const y = b.y + b.h - m.h - p.s(6);
  p.text({ ...words, y });
  if (c.series?.trim()) {
    const s = p.s(p.wide ? 28 : 25);
    const sm = p.text({ text: c.series, x: b.x, y: 0, w, size: s, mono: true, upper: true, track: 0.14, dry: true, maxLines: 1 });
    const sy = y - p.s(40) - sm.cap;
    p.line(b.x, sy - p.s(26), b.x + p.s(110), sy - p.s(26), C.paper, p.s(5));
    p.text({ text: c.series, x: b.x, y: sy, w, size: s, mono: true, upper: true, track: 0.14, color: C.paper, maxLines: 1 });
  }
}

/* ───────────────────────────── collage ───────────────────────────── */

export interface CollageContent extends Chrome {
  title: string;
  sub?: string;
  pictures: (Picture | null)[];
}

export function collage(p: Painter, c: CollageContent) {
  p.background();
  const R = chrome(p, c);
  const pics = c.pictures.slice(0, 4);
  const count = Math.max(2, pics.length);
  let grid: Rect;
  if (p.wide) {
    const textW = R.w * 0.34;
    const t = p.text({ text: c.title, x: R.x, y: R.y, w: textW, size: p.s(76), minSize: p.s(42), weight: 800, track: -0.025, lh: 1.06, maxLines: 4, balance: true });
    if (c.sub) p.text({ text: c.sub, x: R.x, y: R.y + t.h + p.s(40), w: textW, size: p.s(30), weight: 500, lh: 1.36, color: p.pal.soft, maxLines: 5 });
    grid = { x: R.x + textW + p.s(64), y: R.y, w: R.w - textW - p.s(64), h: R.h };
  } else {
    const t = p.text({ text: c.title, x: R.x, y: R.y, w: R.w, size: p.s(p.tall ? 88 : 74), minSize: p.s(44), weight: 800, track: -0.025, lh: 1.06, maxLines: 2, balance: true });
    let y = R.y + t.h;
    if (c.sub) {
      y += p.s(36);
      y += p.text({ text: c.sub, x: R.x, y, w: R.w * 0.96, size: p.s(31), weight: 500, lh: 1.36, color: p.pal.soft, maxLines: 2 }).h;
    }
    y += p.s(52);
    grid = { x: R.x, y, w: R.w, h: R.y + R.h - y };
  }
  const gap = p.s(16);
  const cells: Rect[] = [];
  const stacked = grid.h > grid.w * 1.05;
  if (count === 2) {
    if (stacked) {
      const h = (grid.h - gap) / 2;
      cells.push({ x: grid.x, y: grid.y, w: grid.w, h }, { x: grid.x, y: grid.y + h + gap, w: grid.w, h });
    } else {
      const w = (grid.w - gap) / 2;
      cells.push({ x: grid.x, y: grid.y, w, h: grid.h }, { x: grid.x + w + gap, y: grid.y, w, h: grid.h });
    }
  } else if (count === 3) {
    if (stacked) {
      const big = (grid.h - gap) * 0.58, small = grid.h - gap - big, w = (grid.w - gap) / 2;
      cells.push({ x: grid.x, y: grid.y, w: grid.w, h: big }, { x: grid.x, y: grid.y + big + gap, w, h: small }, { x: grid.x + w + gap, y: grid.y + big + gap, w, h: small });
    } else {
      const big = (grid.w - gap) * 0.6, small = grid.w - gap - big, h = (grid.h - gap) / 2;
      cells.push({ x: grid.x, y: grid.y, w: big, h: grid.h }, { x: grid.x + big + gap, y: grid.y, w: small, h }, { x: grid.x + big + gap, y: grid.y + h + gap, w: small, h });
    }
  } else {
    const w = (grid.w - gap) / 2, h = (grid.h - gap) / 2;
    cells.push({ x: grid.x, y: grid.y, w, h }, { x: grid.x + w + gap, y: grid.y, w, h }, { x: grid.x, y: grid.y + h + gap, w, h }, { x: grid.x + w + gap, y: grid.y + h + gap, w, h });
  }
  let illustration = false;
  cells.forEach((cell, i) => {
    const pic = pics[i] ?? null;
    if (pic) {
      p.picture(pic, cell);
      illustration ||= pic.illustration;
    } else {
      p.fill(p.pal.panel, cell);
      p.hatch(cell, p.s(18));
      p.text({ text: `Photo ${String(i + 1).padStart(2, "0")}`, x: cell.x, y: cell.y + cell.h / 2 - p.s(8), w: cell.w, size: p.s(20), mono: true, upper: true, track: 0.14, color: p.pal.faint, align: "center", maxLines: 1 });
    }
    p.roundRect(cell, 0, { stroke: p.pal.line, weight: p.s(1.5) });
  });
  p.corners({ x: grid.x - p.s(12), y: grid.y - p.s(12), w: grid.w + p.s(24), h: grid.h + p.s(24) });
  if (illustration) p.stamp(grid.x + grid.w - p.s(16), grid.y + grid.h - p.s(50), "Illustration", { align: "right", onPhoto: true });
}
