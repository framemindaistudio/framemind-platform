"use client";

import { useMemo, useSyncExternalStore } from "react";
import { isoDate } from "@/lib/utils";

/**
 * Hydration-safe "now".
 * The server snapshot is empty, so anything that depends on the viewer's clock
 * (greeting, "today", overdue maths) renders only after hydration — no mismatch
 * between the server's UTC clock and the viewer's IST clock.
 * Re-renders once a minute and whenever the tab becomes visible again.
 */
export interface Now {
  /** YYYY-MM-DD in the viewer's local time */
  today: string;
  hour: number;
  /** epoch ms, rounded down to the minute */
  ms: number;
}

function subscribe(cb: () => void) {
  const id = window.setInterval(cb, 60_000);
  const onVisible = () => {
    if (document.visibilityState === "visible") cb();
  };
  document.addEventListener("visibilitychange", onVisible);
  return () => {
    window.clearInterval(id);
    document.removeEventListener("visibilitychange", onVisible);
  };
}

function snapshot() {
  const d = new Date();
  return `${isoDate(d)}|${d.getHours()}|${Math.floor(d.getTime() / 60_000)}`;
}

const serverSnapshot = () => "";

export function useNow(): Now | null {
  const s = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  return useMemo(() => {
    if (!s) return null;
    const [today, hour, minute] = s.split("|");
    return { today, hour: Number(hour), ms: Number(minute) * 60_000 };
  }, [s]);
}

/* ─────────────────────────── date-string helpers ─────────────────────────── */

export function isIsoDate(v: unknown): v is string {
  return typeof v === "string" && /^\d{4}-\d{2}-\d{2}/.test(v);
}

/** "2026-10-02" → local Date at midnight. */
export function parseIso(iso: string) {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function addDays(iso: string, n: number) {
  const d = parseIso(iso);
  d.setDate(d.getDate() + n);
  return isoDate(d);
}

/** Whole days from `from` to `to` (positive when `to` is later). */
export function dayDiff(from: string, to: string) {
  const a = parseIso(from);
  const b = parseIso(to);
  return Math.round((Date.UTC(b.getFullYear(), b.getMonth(), b.getDate()) - Date.UTC(a.getFullYear(), a.getMonth(), a.getDate())) / 86_400_000);
}

/** Sunday of the current Monday-first week. */
export function endOfWeek(iso: string) {
  const d = parseIso(iso);
  const dow = (d.getDay() + 6) % 7; // Monday = 0
  d.setDate(d.getDate() + (6 - dow));
  return isoDate(d);
}

/** ISO-8601 week number. */
export function isoWeek(iso: string) {
  const d = parseIso(iso);
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  return Math.ceil(((t.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
}

/** The last `n` month keys (YYYY-MM), oldest first, ending with the month of `today`. */
export function lastMonths(today: string, n: number) {
  const d = parseIso(today);
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const m = new Date(d.getFullYear(), d.getMonth() - i, 1);
    out.push(`${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, "0")}`);
  }
  return out;
}

export function monthLabel(key: string, opts: Intl.DateTimeFormatOptions = { month: "short" }) {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-IN", opts);
}

export type DueTone = "bad" | "warn" | "info" | "neutral";

/** Human due label relative to today: "3d overdue", "Today", "Tomorrow", "in 5d", "12 Oct". */
export function dueLabel(due: unknown, today: string): { text: string; tone: DueTone; days: number } | null {
  if (!isIsoDate(due)) return null;
  const days = dayDiff(today, due);
  if (days < -1) return { text: `${-days}d overdue`, tone: "bad", days };
  if (days === -1) return { text: "1d overdue", tone: "bad", days };
  if (days === 0) return { text: "Today", tone: "warn", days };
  if (days === 1) return { text: "Tomorrow", tone: "warn", days };
  if (days <= 7) return { text: `in ${days}d`, tone: "info", days };
  return { text: parseIso(due).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }), tone: "neutral", days };
}

/** "just now", "12 min ago", "3 h ago", "2 d ago", else a date. */
export function timeAgo(value: unknown, nowMs: number) {
  if (!value) return "";
  const t = new Date(String(value)).getTime();
  if (!Number.isFinite(t)) return "";
  const diff = Math.max(0, nowMs - t);
  const min = Math.floor(diff / 60_000);
  if (min < 1) return "just now";
  if (min < 60) return `${min} min ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} d ago`;
  return new Date(t).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

/** Local YYYY-MM-DD of an ISO timestamp (createdAt etc.). */
export function localDay(value: unknown) {
  if (!value) return "";
  const d = new Date(String(value));
  return Number.isNaN(d.getTime()) ? "" : isoDate(d);
}
