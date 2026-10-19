"use client";

import { useEffect, useMemo, useState } from "react";
import { site } from "@/lib/site";
import { loadAssets, loadFonts, readFonts } from "@/lib/social/canvas";
import { stockPicture, type Kit } from "@/lib/social/render";
import type { Facts, FormatId, Picture, TemplateDef, Tone, Values } from "@/lib/social/types";
import { useSettings } from "@/components/hq/data";

/** The fonts and logo files a design is drawn with. Null until the browser has them. */
export function useKit(): Kit | null {
  const [kit, setKit] = useState<Kit | null>(null);
  useEffect(() => {
    let alive = true;
    const fonts = readFonts();
    Promise.all([loadFonts(fonts), loadAssets()])
      .then(([, assets]) => alive && setKit({ fonts, assets }))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);
  return kit;
}

/** Company details a design or a caption may print: read from Settings, with the public site as the fallback. */
export function useFacts(): Facts {
  const { settings } = useSettings();
  return useMemo(
    () => ({
      website: settings.website || site.url,
      phone: settings.phone || site.contact.phone,
      email: settings.email || site.contact.email,
      instagram: site.socials.instagram,
    }),
    [settings.website, settings.phone, settings.email],
  );
}

/** The illustrations a design shows until the person adds their own pictures. */
export function useStock(template: TemplateDef, values: Values): Record<string, Picture> {
  const key = JSON.stringify(template.stock?.(values) ?? {});
  const [loaded, setLoaded] = useState<{ key: string; pictures: Record<string, Picture> }>({ key: "{}", pictures: {} });
  useEffect(() => {
    let alive = true;
    const entries = Object.entries(JSON.parse(key) as Record<string, string>);
    Promise.all(entries.map(async ([field, path]) => [field, await stockPicture(path)] as const))
      .then((list) => alive && setLoaded({ key, pictures: Object.fromEntries(list) }))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [key]);
  return loaded.key === key ? loaded.pictures : {};
}

/* ───────────────────────────── a design as a link ───────────────────────────── */

export interface Draft {
  /** template id */
  t: string;
  /** size */
  f?: FormatId;
  /** look */
  o?: Tone;
  /** what was typed (pictures are never saved) */
  v: Values;
}

/** What was typed, packed into a short text that can sit in a link or in a planner entry. */
export function encodeDraft(d: Draft): string {
  const bytes = new TextEncoder().encode(JSON.stringify(d));
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function decodeDraft(text: string | undefined | null): Draft | null {
  if (!text) return null;
  try {
    const bin = atob(text.replace(/-/g, "+").replace(/_/g, "/"));
    const d = JSON.parse(new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)))) as Draft;
    if (!d || typeof d.t !== "string" || typeof d.v !== "object" || !d.v) return null;
    const v: Values = {};
    for (const [k, val] of Object.entries(d.v)) if (typeof val === "string") v[k] = val.slice(0, 2000);
    return { t: d.t, f: d.f, o: d.o, v };
  } catch {
    return null;
  }
}

export const designHref = (d: Draft) => `/hq/social?tab=create&d=${encodeDraft(d)}`;

/* ───────────────────────────── remembering what was typed ───────────────────────────── */

const memoryKey = (id: string) => `fm.social.${id}`;

/** The last entries for a design on this computer, so a returning person does not start from nothing. */
export function recall(id: string): Values | null {
  try {
    const raw = window.localStorage.getItem(memoryKey(id));
    const v = raw ? (JSON.parse(raw) as Values) : null;
    return v && typeof v === "object" ? v : null;
  } catch {
    return null;
  }
}
export function remember(id: string, values: Values) {
  try {
    window.localStorage.setItem(memoryKey(id), JSON.stringify(values));
  } catch {
    /* a full or blocked store only means nothing is remembered */
  }
}
export function forget(id: string) {
  try {
    window.localStorage.removeItem(memoryKey(id));
  } catch {
    /* nothing to forget */
  }
}
