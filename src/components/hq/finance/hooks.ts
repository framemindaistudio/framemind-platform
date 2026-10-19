"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { useCollection, useSettings } from "@/components/hq/data";
import { isoDate } from "@/lib/utils";
import { buildLedger } from "./finance";

const noop = () => () => {};

/**
 * Today's local date (YYYY-MM-DD) — null during SSR/hydration so server and
 * client markup always match; the real value arrives on the first client render.
 */
export function useToday(): string | null {
  return useSyncExternalStore(noop, () => isoDate(), () => null);
}

/** Invoices + expenses + income + settings, folded into one ledger. */
export function useFinanceData() {
  const inv = useCollection("invoices");
  const exp = useCollection("expenses");
  const inc = useCollection("income");
  const { settings, loading: settingsLoading } = useSettings();
  const ledger = useMemo(() => buildLedger(inv.records, exp.records, inc.records, settings), [inv.records, exp.records, inc.records, settings]);
  const { refresh: r1 } = inv;
  const { refresh: r2 } = exp;
  const { refresh: r3 } = inc;
  const refresh = useCallback(() => Promise.all([r1(), r2(), r3()]), [r1, r2, r3]);
  return {
    invoices: inv.records,
    expenses: exp.records,
    income: inc.records,
    settings,
    ledger,
    loading: inv.loading || exp.loading || inc.loading || settingsLoading,
    error: inv.error || exp.error || inc.error,
    refresh,
  };
}

/** Update the query string without a server round-trip (Next syncs useSearchParams). */
export function writeParams(patch: Record<string, string | null | undefined>, mode: "push" | "replace" = "replace") {
  if (typeof window === "undefined") return;
  const sp = new URLSearchParams(window.location.search);
  for (const [k, v] of Object.entries(patch)) {
    if (v === null || v === undefined || v === "") sp.delete(k);
    else sp.set(k, v);
  }
  const qs = sp.toString();
  const url = `${window.location.pathname}${qs ? `?${qs}` : ""}`;
  if (mode === "push") window.history.pushState(null, "", url);
  else window.history.replaceState(null, "", url);
}
