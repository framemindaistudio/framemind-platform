"use client";

import Link from "next/link";
import { Loader2 } from "lucide-react";
import { PrintShell } from "@/components/print/PrintShell";
import { useCollection, useSettings } from "@/components/hq/data";
import type { CompanySettings } from "@/lib/hq/settings";
import { cn } from "@/lib/utils";
import { stateCode, stateName, str, type Rec } from "./finance";

export type DocState =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "missing" }
  | { kind: "ready"; invoice: Rec; settings: CompanySettings };

/** Load one invoice + company settings for a printable page. */
export function useInvoiceDoc(id: string): DocState {
  const { records, loading, error } = useCollection<Rec>("invoices");
  const { settings, loading: settingsLoading } = useSettings();
  if (loading || settingsLoading) return { kind: "loading" };
  const invoice = records.find((r) => r.id === id);
  if (invoice) return { kind: "ready", invoice, settings };
  if (error) return { kind: "error", message: error };
  return { kind: "missing" };
}

/** Loading / error / not-found screens that keep the print chrome. */
export function DocMessage({ state, title, back }: { state: Exclude<DocState, { kind: "ready" }>; title: string; back: string }) {
  return (
    <PrintShell title={title} back={back}>
      <div className="w-full max-w-md rounded-[var(--radius-md)] border border-graphite/15 bg-paper-50 p-8 text-center">
        {state.kind === "loading" ? (
          <p className="flex items-center justify-center gap-2 text-sm text-blueprint">
            <Loader2 className="size-4 animate-spin" aria-hidden /> Loading…
          </p>
        ) : (
          <>
            <h2 className="text-base font-semibold">{state.kind === "error" ? "Could not load this document" : "Invoice not found"}</h2>
            <p className="mt-2 text-sm text-charcoal">{state.kind === "error" ? state.message : "It may have been deleted, or the link is wrong."}</p>
            <Link href={back} className="mt-5 inline-block text-sm font-semibold underline underline-offset-2">
              Back to invoices
            </Link>
          </>
        )}
      </div>
    </PrintShell>
  );
}

/** Rotated ink stamp (PAID / DRAFT / CANCELLED). */
export function Stamp({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute right-[16mm] top-[58mm] -rotate-12 rounded-[3px] border-[3px] border-double border-graphite/35 px-4 py-1 text-3xl font-bold uppercase tracking-[0.25em] text-graphite/30", className)}
    >
      {children}
    </div>
  );
}

/** Small uppercase label above a block of text on the page. */
export function Cap({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn("mb-1.5 text-[8px] font-semibold uppercase tracking-[0.2em] text-blueprint", className)}>{children}</p>;
}

/** "Karnataka (29)" for a place-of-supply string; falls back to the raw text. */
export function placeLabel(value: unknown, fallback = "") {
  const raw = str(value).trim() || fallback;
  if (!raw) return "";
  const code = stateCode(raw);
  return code ? `${stateName(code)} (${code})` : raw;
}
