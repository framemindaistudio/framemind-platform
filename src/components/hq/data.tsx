"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import type { BaseRecord } from "@/lib/hq/collections";
import { can, OPS, type SessionUser } from "@/lib/hq/roles";
import type { CompanySettings } from "@/lib/hq/settings";
import type { PriceBook, RateCard } from "@/lib/pricebook/types";
import { defaultSettings } from "@/lib/hq/settings";

/* ─────────────────────────── HQ session context ─────────────────────────── */

export interface StoreInfo {
  mode: "github" | "local" | "readonly";
  repo?: string;
  branch: string;
  writable: boolean;
  /** true when GITHUB_REPO points at a public repository — HQ then refuses to save. */
  publicRepo?: boolean;
  /** true when GITHUB_REPO names JOVE's data repository — FrameMind HQ then reads and writes nothing. */
  otherCompany?: boolean;
  /** true for accounts that may look and print but never save (writable is then false too). */
  viewOnly?: boolean;
}

interface HqCtx {
  user: SessionUser;
  store: StoreInfo;
  /** the rate card's prices: sent to everyone who prepares or reads quotes (null for the interns login) */
  rates: RateCard | null;
  /** the whole rate card with costs, targets and margins: only sent to the roles that see Finance (null for everyone else) */
  book: PriceBook | null;
}

const HqContext = createContext<HqCtx | null>(null);

export function HqProvider({ user, store, rates = null, book = null, children }: Omit<HqCtx, "rates" | "book"> & Partial<Pick<HqCtx, "rates" | "book">> & { children: React.ReactNode }) {
  return <HqContext.Provider value={{ user, store, rates, book }}>{children}</HqContext.Provider>;
}

export function useHq() {
  const c = useContext(HqContext);
  if (!c) throw new Error("useHq must be used inside <HqProvider>");
  return c;
}

/** Amounts of money are shown only to the roles that see Finance (the server leaves them out for everyone else too). */
export function useShowMoney() {
  return can(useHq().user, OPS);
}

/**
 * The whole rate card as saved in HQ → Money → Rate Card, with monthly costs, targets and margins. Null for roles
 * that do not see Finance — always handle that case. It is read on the server for each page.
 */
export function useBook() {
  return useHq().book;
}

/** The rate card's prices (services, options, bundle, Vritta, coaching, terms). Null only for the interns login. */
export function useRates() {
  return useHq().rates;
}

/* ─────────────────────────── API helpers ─────────────────────────── */

export async function api<T = unknown>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, headers: { "Content-Type": "application/json", ...(init?.headers || {}) } });
  const json = await res.json().catch(() => ({}));
  if (res.status === 401) {
    // Session expired: a full page load (not a client transition) so every cached HQ record is dropped.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = `/hq/login?next=${encodeURIComponent(window.location.pathname)}`;
    throw new Error("Session expired");
  }
  if (!res.ok) throw new Error(json.error || `Request failed (${res.status})`);
  return json as T;
}

/* ─────────────────────────── Collection cache ─────────────────────────── */

type Entry = { records: BaseRecord[]; loading: boolean; error?: string; loadedAt?: number };
const cache = new Map<string, Entry>();
const inflight = new Map<string, Promise<void>>();
const listeners = new Map<string, Set<() => void>>();

function emit(name: string) {
  listeners.get(name)?.forEach((l) => l());
}
function getEntry(name: string): Entry {
  let e = cache.get(name);
  if (!e) {
    // "__none" is a placeholder used for optional lookups — never fetched
    e = name.startsWith("__") ? { records: [], loading: false, loadedAt: 1 } : { records: [], loading: true };
    cache.set(name, e);
  }
  return e;
}
function setEntry(name: string, patch: Partial<Entry>) {
  cache.set(name, { ...getEntry(name), ...patch });
  emit(name);
}

async function load(name: string, force = false) {
  const running = inflight.get(name);
  if (running && !force) return running;
  const e = getEntry(name);
  if (!force && e.loadedAt && Date.now() - e.loadedAt < 15_000) return;
  const p = (async () => {
    try {
      const json = await api<{ records: BaseRecord[] }>(`/api/hq/collections/${name}`);
      setEntry(name, { records: json.records, loading: false, error: undefined, loadedAt: Date.now() });
    } catch (err) {
      setEntry(name, { loading: false, error: err instanceof Error ? err.message : "Failed to load" });
    } finally {
      inflight.delete(name);
    }
  })();
  inflight.set(name, p);
  return p;
}

/** Force all mounted users of a collection to refetch. */
export function invalidate(name: string) {
  return load(name, true);
}

/**
 * useCollection("clients") → { records, loading, error, save, saveMany, remove, refresh }
 * Shared across components: two widgets reading "projects" make one request.
 */
export function useCollection<T extends BaseRecord = BaseRecord>(name: string) {
  const subscribe = useCallback(
    (cb: () => void) => {
      if (!listeners.has(name)) listeners.set(name, new Set());
      listeners.get(name)!.add(cb);
      return () => listeners.get(name)!.delete(cb);
    },
    [name],
  );
  const snapshot = useSyncExternalStore(
    subscribe,
    () => getEntry(name),
    () => getEntry(name),
  );

  useEffect(() => {
    if (!name.startsWith("__")) load(name);
  }, [name]);

  const save = useCallback(
    async (record: Partial<T> & Record<string, unknown>) => {
      const json = await api<{ record: T }>(`/api/hq/collections/${name}`, { method: "POST", body: JSON.stringify({ record }) });
      const cur = getEntry(name).records;
      const idx = cur.findIndex((r) => r.id === json.record.id);
      const next = idx >= 0 ? cur.map((r, i) => (i === idx ? json.record : r)) : [...cur, json.record];
      setEntry(name, { records: next, loadedAt: Date.now() });
      return json.record;
    },
    [name],
  );

  const saveMany = useCallback(
    async (records: Record<string, unknown>[]) => {
      const json = await api<{ records: T[] }>(`/api/hq/collections/${name}`, { method: "POST", body: JSON.stringify({ records }) });
      await load(name, true);
      return json.records;
    },
    [name],
  );

  const remove = useCallback(
    async (id: string) => {
      await api(`/api/hq/collections/${name}?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      setEntry(name, { records: getEntry(name).records.filter((r) => r.id !== id) });
    },
    [name],
  );

  const refresh = useCallback(() => load(name, true), [name]);

  return {
    records: snapshot.records as T[],
    loading: snapshot.loading && !snapshot.loadedAt,
    error: snapshot.error,
    save,
    saveMany,
    remove,
    refresh,
  };
}

/** Lookup helper: id → record for a referenced collection. */
export function useLookup(name: string) {
  const { records } = useCollection(name);
  return useMemo(() => new Map(records.map((r) => [r.id, r])), [records]);
}

/* ─────────────────────────── Settings ─────────────────────────── */

let settingsCache: CompanySettings | null = null;

export function useSettings() {
  const [settings, setSettings] = useState<CompanySettings>(settingsCache ?? defaultSettings);
  const [loading, setLoading] = useState(!settingsCache);
  useEffect(() => {
    let alive = true;
    api<{ settings: CompanySettings }>("/api/hq/settings")
      .then((j) => {
        settingsCache = j.settings;
        if (alive) setSettings(j.settings);
      })
      .catch(() => {})
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);
  const save = useCallback(async (patch: Partial<CompanySettings>) => {
    const j = await api<{ settings: CompanySettings }>("/api/hq/settings", { method: "PUT", body: JSON.stringify({ settings: patch }) });
    settingsCache = j.settings;
    setSettings(j.settings);
    return j.settings;
  }, []);
  return { settings, loading, save };
}

/** Reserve the next document number (invoice / proposal / po / order) or certificate codes. */
export async function nextNumber(kind: "invoice" | "proposal" | "po" | "order"): Promise<string> {
  const j = await api<{ value: string }>("/api/hq/sequence", { method: "POST", body: JSON.stringify({ kind }) });
  settingsCache = null;
  return j.value;
}
export async function certificateCodes(count: number): Promise<string[]> {
  const j = await api<{ values: string[] }>("/api/hq/sequence", { method: "POST", body: JSON.stringify({ kind: "certificate", count }) });
  return j.values;
}
