import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge conditional class names. Later classes win over earlier conflicting ones
 * (e.g. a `hidden` passed via className overrides a base `inline-flex`).
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
const inr2 = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 2, maximumFractionDigits: 2 });
const num = new Intl.NumberFormat("en-IN");

/** ₹1,23,456 (Indian digit grouping). */
export function formatINR(value: number | null | undefined, opts: { decimals?: boolean } = {}) {
  const v = Number(value ?? 0);
  return (opts.decimals ? inr2 : inr).format(Number.isFinite(v) ? v : 0);
}

/** 1.2L / 45K / 1.1Cr — compact Indian notation for dashboards. */
export function formatINRCompact(value: number | null | undefined) {
  const v = Number(value ?? 0);
  const abs = Math.abs(v);
  const sign = v < 0 ? "-" : "";
  if (abs >= 1_00_00_000) return `${sign}₹${trim(abs / 1_00_00_000)}Cr`;
  if (abs >= 1_00_000) return `${sign}₹${trim(abs / 1_00_000)}L`;
  if (abs >= 1_000) return `${sign}₹${trim(abs / 1_000)}K`;
  return `${sign}₹${Math.round(abs)}`;
}

function trim(n: number) {
  return n.toFixed(n >= 100 ? 0 : n >= 10 ? 1 : 2).replace(/\.0+$|(\.\d*[1-9])0+$/, "$1");
}

export function formatNumber(value: number | null | undefined) {
  return num.format(Number(value ?? 0));
}

/** "02 Oct 2026" */
export function formatDate(value: string | number | Date | null | undefined, opts: Intl.DateTimeFormatOptions = {}) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", ...opts });
}

export function formatDateTime(value: string | number | Date | null | undefined) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

/** YYYY-MM-DD in local time (for <input type="date">). */
export function isoDate(d: Date = new Date()) {
  const z = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
}

/** YYYY-MM key for monthly grouping. */
export function monthKey(value: string | Date) {
  const d = new Date(value);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Short, sortable, collision-resistant id: e.g. "k3z9x1-a7f2". */
export function uid(prefix = "") {
  const t = Date.now().toString(36);
  const r = Math.random().toString(36).slice(2, 6);
  return `${prefix}${prefix ? "_" : ""}${t}${r}`;
}

/** Amount in words, Indian system (for invoices). */
export function amountInWords(amount: number): string {
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  const two = (n: number) => (n < 20 ? ones[n] : `${tens[Math.floor(n / 10)]}${n % 10 ? " " + ones[n % 10] : ""}`);
  const three = (n: number) => (n >= 100 ? `${ones[Math.floor(n / 100)]} Hundred${n % 100 ? " " + two(n % 100) : ""}` : two(n));
  const rupees = Math.floor(Math.abs(amount));
  const paise = Math.round((Math.abs(amount) - rupees) * 100);
  if (rupees === 0 && paise === 0) return "Zero Rupees Only";
  const parts: string[] = [];
  const crore = Math.floor(rupees / 1_00_00_000);
  const lakh = Math.floor((rupees % 1_00_00_000) / 1_00_000);
  const thousand = Math.floor((rupees % 1_00_000) / 1000);
  const rest = rupees % 1000;
  if (crore) parts.push(`${three(crore)} Crore`);
  if (lakh) parts.push(`${two(lakh)} Lakh`);
  if (thousand) parts.push(`${two(thousand)} Thousand`);
  if (rest) parts.push(three(rest));
  let words = `${parts.join(" ")} Rupees`;
  if (paise) words += ` and ${two(paise)} Paise`;
  return `${words} Only`;
}

export function sum<T>(items: T[], pick: (item: T) => number | undefined | null) {
  return items.reduce((acc, it) => acc + (Number(pick(it)) || 0), 0);
}

export function groupBy<T, K extends string>(items: T[], key: (item: T) => K) {
  return items.reduce(
    (acc, it) => {
      const k = key(it);
      (acc[k] ||= []).push(it);
      return acc;
    },
    {} as Record<K, T[]>,
  );
}

export function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

/** Two-digit index label used across the blueprint UI: 1 -> "01". */
export function pad2(n: number) {
  return String(n).padStart(2, "0");
}
