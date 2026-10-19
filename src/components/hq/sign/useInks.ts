"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/components/hq/data";
import type { Inks } from "@/lib/sign/ink";

export interface FounderInk {
  id: string;
  name: string;
  title: string;
  ink: string | null;
}

let cached: FounderInk[] | null = null;
let inflight: Promise<FounderInk[]> | null = null;
const fetchInks = (force = false) => {
  if (!force && cached) return Promise.resolve(cached);
  if (!force && inflight) return inflight;
  inflight = api<{ founders: FounderInk[] }>("/api/hq/sign/signatures")
    .then((j) => (cached = j.founders))
    .finally(() => (inflight = null));
  return inflight;
};

/** The founders' saved signatures (founders and admins only), shared by every paper on the page. */
export function useInks() {
  const [founders, setFounders] = useState<FounderInk[] | null>(cached);
  useEffect(() => {
    let alive = true;
    fetchInks()
      .then((f) => alive && setFounders(f))
      .catch(() => alive && setFounders([]));
    return () => {
      alive = false;
    };
  }, []);
  const reload = useCallback(async () => setFounders(await fetchInks(true)), []);
  const inks: Inks = Object.fromEntries((founders ?? []).filter((f) => f.ink).map((f) => [f.name, f.ink as string]));
  return { founders, inks, ready: founders !== null, reload };
}
