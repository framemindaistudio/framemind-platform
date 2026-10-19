"use client";

import { useSyncExternalStore } from "react";
import { isoDate } from "@/lib/utils";

/**
 * Hydration-safe "today" (YYYY-MM-DD in the viewer's local time).
 * Returns "" on the server and during hydration, then the real date — so
 * overdue / "today" maths never causes a server/client mismatch.
 * Re-checks every minute (crossing midnight with HQ open).
 */
function subscribe(cb: () => void) {
  const id = window.setInterval(cb, 60_000);
  return () => window.clearInterval(id);
}

const clientSnapshot = () => isoDate(new Date());
const serverSnapshot = () => "";

export function useToday() {
  return useSyncExternalStore(subscribe, clientSnapshot, serverSnapshot);
}
