/**
 * Small pure helpers shared by the Print Studio, certificates, media and reputation modules.
 * No React, no Date-in-render — everything here is safe to call anywhere.
 */
import { site } from "@/lib/site";

export type Q = Record<string, string>;
export type SearchParams = Record<string, string | string[] | undefined>;

export const str = (v: unknown) => (v === undefined || v === null ? "" : String(v));
export const num = (v: unknown, d = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
};
export const list = (v: unknown): string[] => (Array.isArray(v) ? v.map(String).filter(Boolean) : []);

/** Next gives string | string[] per key — keep the first value. */
export function flatten(sp: SearchParams): Q {
  const out: Q = {};
  for (const [k, v] of Object.entries(sp)) {
    const s = Array.isArray(v) ? v[0] : v;
    if (s !== undefined) out[k] = s;
  }
  return out;
}

/** Build "?a=1&b=2", skipping empty / false values. */
export function qs(values: Record<string, string | number | boolean | null | undefined>) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(values)) {
    if (v === undefined || v === null || v === "" || v === false) continue;
    p.set(k, v === true ? "1" : String(v));
  }
  const s = p.toString();
  return s ? `?${s}` : "";
}

export const csv = (v: string | undefined) =>
  (v ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

export const textLines = (v: string | undefined) =>
  (v ?? "")
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);

export function clampInt(v: unknown, min: number, max: number, fallback: number) {
  const n = Math.round(Number(v));
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

export function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

/* ───────────────────────── dates (local YYYY-MM-DD) ───────────────────────── */

export function isIso(v: unknown): v is string {
  return typeof v === "string" && /^\d{4}-\d{2}-\d{2}/.test(v);
}

export function parseIso(iso: string) {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function toIso(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function addDays(iso: string, n: number) {
  const d = parseIso(iso);
  d.setDate(d.getDate() + n);
  return toIso(d);
}

/** Add working days (Mon–Fri) to an ISO date. */
export function addWorkingDays(iso: string, n: number) {
  const d = parseIso(iso);
  let left = n;
  while (left > 0) {
    d.setDate(d.getDate() + 1);
    const day = d.getDay();
    if (day !== 0 && day !== 6) left -= 1;
  }
  return toIso(d);
}

/** "2 Oct 2026" */
export function shortDate(iso: unknown) {
  if (!isIso(iso)) return "";
  return parseIso(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

/** "Friday, 2 October 2026" */
export function longDate(iso: unknown) {
  if (!isIso(iso)) return "";
  return parseIso(iso).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

/** "2 October 2026" */
export function plainDate(iso: unknown) {
  if (!isIso(iso)) return "";
  return parseIso(iso).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

/* ───────────────────────── names ───────────────────────── */

export interface NameRow {
  name: string;
  grade: string;
}

/** One person per line; optional "Name, Grade" (comma or tab separated, as pasted from a sheet). */
export function parseNameLines(text: string | undefined, defaultGrade = ""): NameRow[] {
  return textLines(text)
    .map((line) => {
      const [name = "", ...rest] = line.split(/\t|,/).map((s) => s.trim());
      return { name, grade: rest.filter(Boolean).join(", ") || defaultGrade };
    })
    .filter((r) => r.name);
}

/* ───────────────────────── URLs ───────────────────────── */

/**
 * Base URL certificates point their QR code to. Uses the configured site URL; if that is still the
 * localhost default, falls back to the origin HQ is currently served from. Client-only.
 */
export function verifyBase() {
  const configured = site.url.replace(/\/+$/, "");
  if (typeof window === "undefined") return configured;
  const local = /^(https?:\/\/)?(localhost|127\.0\.0\.1|\[::1\])(:|\/|$)/i.test(configured);
  return local ? window.location.origin : configured;
}

export const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
