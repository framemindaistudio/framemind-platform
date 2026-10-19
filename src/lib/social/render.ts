/**
 * Turning a design into pixels and files: draw one page on a canvas, export it, pack several into a ZIP.
 * Browser only.
 */
import { Painter, loadImage, pictureOf, type Assets, type Fonts } from "./canvas";
import { FORMATS, type DrawInput, type Facts, type FormatId, type Picture, type TemplateDef, type Tone, type Values } from "./types";

export interface Kit {
  fonts: Fonts;
  assets: Assets;
}

export interface Design {
  template: TemplateDef;
  format: FormatId;
  tone: Tone;
  values: Values;
  pictures: Record<string, Picture | null>;
  facts: Facts;
}

export const pagesOf = (d: Pick<Design, "template" | "values">) => Math.max(1, d.template.pages?.(d.values) ?? 1);

/**
 * Draws one page of a design. `scale` below 1 makes a small copy (gallery thumbnails) with the same drawing code:
 * the canvas is smaller and everything is scaled down, so a thumbnail can never differ from the real thing.
 */
export function draw(canvas: HTMLCanvasElement, d: Design, kit: Kit, page = 0, scale = 1) {
  const format = FORMATS[d.format];
  const w = Math.round(format.w * scale), h = Math.round(format.h * scale);
  if (canvas.width !== w) canvas.width = w;
  if (canvas.height !== h) canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.clearRect(0, 0, format.w, format.h);
  const pages = pagesOf(d);
  const input: DrawInput = { values: d.values, pictures: d.pictures, page: Math.min(page, pages - 1), pages, facts: d.facts };
  ctx.save();
  try {
    d.template.draw(new Painter(ctx, format, d.tone, kit.fonts, kit.assets), input);
  } finally {
    ctx.restore();
  }
}

/** One page as a file. PNG for flat designs; JPG is much smaller when a photograph fills the frame. */
export function toBlob(d: Design, kit: Kit, page = 0, type: "image/png" | "image/jpeg" = "image/png"): Promise<Blob> {
  const canvas = document.createElement("canvas");
  draw(canvas, d, kit, page);
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("The picture could not be made"))), type, 0.93));
}

/** FrameMind_hiring_20261012_post.png, after the file naming rule of the template spec. */
export function fileName(d: Pick<Design, "template" | "format">, page: number | null, ext: "png" | "jpg", today: Date) {
  const stamp = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}${String(today.getDate()).padStart(2, "0")}`;
  const slide = page === null ? "" : `_${String(page + 1).padStart(2, "0")}`;
  return `FrameMind_${d.template.id}_${stamp}_${d.format}${slide}.${ext}`;
}

export function saveBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/* ───────────────────────────── pictures ───────────────────────────── */

const stockCache = new Map<string, Promise<Picture>>();
/** One of the site's own illustrations, used until the person adds a photo. */
export function stockPicture(path: string): Promise<Picture> {
  let hit = stockCache.get(path);
  if (!hit) {
    hit = loadImage(path).then((img) => pictureOf(img, true));
    stockCache.set(path, hit);
  }
  return hit;
}

export async function pictureFromFile(file: File): Promise<Picture> {
  const url = URL.createObjectURL(file);
  try {
    return pictureOf(await loadImage(url), false);
  } finally {
    // the decoded image stays in memory; the address is no longer needed
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}

/** The frame a video is showing right now, as a picture. */
export function pictureFromVideo(video: HTMLVideoElement): Picture | null {
  if (!video.videoWidth || !video.videoHeight) return null;
  const c = document.createElement("canvas");
  c.width = video.videoWidth;
  c.height = video.videoHeight;
  const g = c.getContext("2d");
  if (!g) return null;
  g.drawImage(video, 0, 0, c.width, c.height);
  return pictureOf(c, false);
}

/* ───────────────────────────── a ZIP of several files ───────────────────────────── */

const crcTable = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(bytes: Uint8Array) {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) c = crcTable[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

/**
 * Packs files into one ZIP without compressing them (PNG and JPG are compressed already), so a set of sizes or
 * the slides of a carousel arrive as one download.
 */
export async function zip(files: { name: string; blob: Blob }[]): Promise<Blob> {
  const enc = new TextEncoder();
  // plain buffers, which is what a Blob takes
  const buf = (u: Uint8Array) => u.buffer.slice(u.byteOffset, u.byteOffset + u.byteLength) as ArrayBuffer;
  const chunks: ArrayBuffer[] = [];
  const central: ArrayBuffer[] = [];
  let offset = 0;
  const now = new Date();
  const time = (now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1);
  const date = ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();
  for (const f of files) {
    const data = new Uint8Array(await f.blob.arrayBuffer());
    const name = enc.encode(f.name);
    const crc = crc32(data);
    const local = new DataView(new ArrayBuffer(30));
    local.setUint32(0, 0x04034b50, true);
    local.setUint16(4, 20, true);
    local.setUint16(6, 0x0800, true); // names are UTF-8
    local.setUint16(8, 0, true); // stored
    local.setUint16(10, time, true);
    local.setUint16(12, date, true);
    local.setUint32(14, crc, true);
    local.setUint32(18, data.length, true);
    local.setUint32(22, data.length, true);
    local.setUint16(26, name.length, true);
    local.setUint16(28, 0, true);
    chunks.push(local.buffer, buf(name), buf(data));
    const head = new DataView(new ArrayBuffer(46));
    head.setUint32(0, 0x02014b50, true);
    head.setUint16(4, 20, true);
    head.setUint16(6, 20, true);
    head.setUint16(8, 0x0800, true);
    head.setUint16(10, 0, true);
    head.setUint16(12, time, true);
    head.setUint16(14, date, true);
    head.setUint32(16, crc, true);
    head.setUint32(20, data.length, true);
    head.setUint32(24, data.length, true);
    head.setUint16(28, name.length, true);
    head.setUint32(42, offset, true);
    const entry = new Uint8Array(46 + name.length);
    entry.set(new Uint8Array(head.buffer), 0);
    entry.set(name, 46);
    central.push(buf(entry));
    offset += 30 + name.length + data.length;
  }
  const size = central.reduce((s, e) => s + e.byteLength, 0);
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true);
  end.setUint16(8, files.length, true);
  end.setUint16(10, files.length, true);
  end.setUint32(12, size, true);
  end.setUint32(16, offset, true);
  return new Blob([...chunks, ...central, end.buffer], { type: "application/zip" });
}
