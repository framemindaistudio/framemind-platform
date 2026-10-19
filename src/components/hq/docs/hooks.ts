"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/components/hq/data";
import { buildTree, indexTree, OPS_ROOT, type TreeEntry } from "./lib";

/**
 * Tiny fetch hook with derived loading state (no setState in effect bodies).
 * Pass `null` as key to stay idle. `reload()` refetches while keeping stale data visible.
 */
export function useRemote<T>(key: string | null, fetcher: () => Promise<T>) {
  const [state, setState] = useState<{ key: string | null; req: string; data?: T; error?: string }>({ key: null, req: "" });
  const [nonce, setNonce] = useState(0);
  const fetcherRef = useRef(fetcher);
  useEffect(() => {
    fetcherRef.current = fetcher;
  });

  useEffect(() => {
    if (key === null) return;
    let alive = true;
    const req = `${key}#${nonce}`;
    fetcherRef.current().then(
      (data) => {
        if (alive) setState({ key, req, data });
      },
      (e: unknown) => {
        if (alive) setState({ key, req, error: e instanceof Error ? e.message : "Something went wrong" });
      },
    );
    return () => {
      alive = false;
    };
  }, [key, nonce]);

  const req = key === null ? "" : `${key}#${nonce}`;
  const sameKey = key !== null && state.key === key;
  const reload = useCallback(() => setNonce((n) => n + 1), []);
  return {
    data: sameKey ? state.data : undefined,
    error: sameKey && state.req === req ? state.error : undefined,
    loading: key !== null && state.req !== req,
    reload,
  };
}

/** Folder tree of OPERATIONS/ as a nested structure + path index. */
export function useOpsTree() {
  const r = useRemote<TreeEntry[]>("ops-tree", async () => {
    const j = await api<{ entries: TreeEntry[] }>(`/api/hq/docs?tree=${OPS_ROOT}`);
    return j.entries;
  });
  const root = useMemo(() => (r.data ? buildTree(r.data) : null), [r.data]);
  const index = useMemo(() => (root ? indexTree(root) : null), [root]);
  return { root, index, loading: r.loading && !r.data, refreshing: r.loading, error: r.error, reload: r.reload };
}

export interface SendResult {
  ok: boolean;
  status: number;
  data: Record<string, unknown>;
  error?: string;
}

/** JSON request that keeps the HTTP status (needed to recognise 409 edit conflicts). */
export async function sendJson(url: string, method: "PUT" | "POST" | "DELETE", body?: unknown): Promise<SendResult> {
  try {
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (res.status === 401) {
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- full navigation on purpose: a signed-out session reloads through the server login redirect
      window.location.href = `/hq/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`;
    }
    return { ok: res.ok, status: res.status, data, error: res.ok ? undefined : String(data.error || `Request failed (${res.status})`) };
  } catch {
    return { ok: false, status: 0, data: {}, error: "Network error — check your connection and try again." };
  }
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }
}

export interface CommitInfo {
  sha: string;
  message: string;
  author: string;
  date: string;
  url?: string;
}

export function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (!el) return false;
  el.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });
  return true;
}
