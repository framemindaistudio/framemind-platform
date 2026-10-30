"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { PenLine } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The signatory's signature on printed documents.
 *
 * Settings → "Sign documents digitally" decides the default: on, the founder's saved signature (Documents to Sign →
 * Our signatures) prints above their name; off, the space stays blank to sign by hand. Each print page also gets a
 * "Signature: digital / by hand" switch in its toolbar, for just that print.
 *
 * It is a picture of a signature, not a Digital Signature Certificate.
 */

interface Signatory {
  digital: boolean;
  inks: Record<string, string>;
}

let cached: Signatory | null = null;
let inflight: Promise<Signatory> | null = null;
function fetchSignatory(): Promise<Signatory> {
  if (cached) return Promise.resolve(cached);
  if (!inflight) {
    inflight = fetch("/api/hq/sign/signatory", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { digital: false, inks: {} }))
      .then((j: Signatory) => (cached = { digital: !!j.digital, inks: j.inks ?? {} }))
      .catch(() => ({ digital: false, inks: {} }))
      .finally(() => (inflight = null));
  }
  return inflight;
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

interface Ctx {
  /** null until the setting has loaded */
  on: boolean | null;
  inks: Record<string, string>;
  set: (on: boolean) => void;
  spaces: number;
  register: () => () => void;
}
const SignCtx = createContext<Ctx | null>(null);

/** Wraps a print page (PrintShell does this) so its signature spaces and its toolbar switch share one state. */
export function SignatureProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<Signatory | null>(cached);
  const [override, setOverride] = useState<boolean | null>(null);
  const [spaces, setSpaces] = useState(0);
  useEffect(() => {
    let alive = true;
    void fetchSignatory().then((d) => alive && setData(d));
    return () => {
      alive = false;
    };
  }, []);
  const register = useCallback(() => {
    setSpaces((n) => n + 1);
    return () => setSpaces((n) => n - 1);
  }, []);
  const value = useMemo<Ctx>(() => ({ on: override ?? data?.digital ?? null, inks: data?.inks ?? {}, set: setOverride, spaces, register }), [override, data, spaces, register]);
  return <SignCtx.Provider value={value}>{children}</SignCtx.Provider>;
}

/** The toolbar switch: shown only on pages that have a signature space. */
export function SignatureToggle() {
  const c = useContext(SignCtx);
  if (!c || !c.spaces || c.on === null) return null;
  return (
    <button
      type="button"
      role="switch"
      aria-checked={c.on}
      onClick={() => c.set(!c.on)}
      className="inline-flex h-8 items-center gap-2 rounded px-2.5 text-xs font-semibold hover:bg-graphite/5"
      title="For this print only. The default is in Settings → Company → Sign documents digitally."
    >
      <PenLine className="size-3.5" aria-hidden />
      Signature: {c.on ? "digital" : "by hand"}
      <span className={cn("relative h-4 w-7 rounded-full transition-colors", c.on ? "bg-lime" : "bg-graphite/25")}>
        <span className={cn("absolute top-0.5 size-3 rounded-full bg-white shadow transition-[left]", c.on ? "left-3.5" : "left-0.5")} />
      </span>
    </button>
  );
}

/**
 * The space above a signatory's line. With the digital signature on (and a saved signature for this name) the
 * picture fills it; otherwise it stays blank for a pen. Give it the same height the blank space had.
 */
export function SignatureSpace({ name, className, align = "center" }: { name: string; className?: string; align?: "center" | "left" | "right" }) {
  const c = useContext(SignCtx);
  const register = c?.register;
  useEffect(() => register?.(), [register]);
  const src = c?.on ? Object.entries(c.inks).find(([n]) => norm(n) === norm(name))?.[1] : undefined;
  return (
    <div className={cn("relative flex items-end", align === "center" ? "justify-center" : align === "right" ? "justify-end" : "justify-start", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element -- a data: picture; next/image would re-encode it and lose the transparency */}
      {src && <img src={src} alt={`Signature of ${name}`} className="max-h-full max-w-full object-contain" style={{ marginBottom: "-2mm" }} />}
    </div>
  );
}
