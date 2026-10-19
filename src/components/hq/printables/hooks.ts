"use client";

import { useSyncExternalStore } from "react";
import { toIso, verifyBase } from "./util";

const subscribe = () => () => {};

/** A value that only exists in the browser (today's date, window origin…). Returns `server` during SSR and hydration. */
export function useClientValue<T>(get: () => T, server: T): T {
  return useSyncExternalStore(subscribe, get, () => server);
}

/** Local "YYYY-MM-DD" for today, or "" until the browser has hydrated. */
export const useToday = () => useClientValue(() => toIso(new Date()), "");

/** Current month key "YYYY-MM", or "" until hydrated. */
export const useThisMonth = () => useClientValue(() => toIso(new Date()).slice(0, 7), "");

/** Base URL for certificate verification links, or "" until hydrated. */
export const useVerifyBase = () => useClientValue(verifyBase, "");
