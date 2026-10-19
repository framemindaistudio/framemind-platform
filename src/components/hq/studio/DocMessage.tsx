"use client";

import Link from "next/link";
import { Loader2 } from "lucide-react";
import { PrintShell } from "@/components/print/PrintShell";

/** What a printable page shows while its record loads, or when it cannot be found. */
export function DocMessage({ title, back, state, noun, backLabel }: { title: string; back: string; state: "loading" | "error" | "missing"; noun: string; backLabel: string }) {
  return (
    <PrintShell title={title} back={back}>
      <div className="w-full max-w-md rounded-[var(--radius-md)] border border-graphite/15 bg-paper-50 p-8 text-center">
        {state === "loading" ? (
          <p className="flex items-center justify-center gap-2 text-sm text-blueprint">
            <Loader2 className="size-4 animate-spin" aria-hidden /> Loading…
          </p>
        ) : (
          <>
            <h2 className="text-base font-semibold">{state === "error" ? `Could not load this ${noun}` : `${noun.charAt(0).toUpperCase()}${noun.slice(1)} not found`}</h2>
            <p className="mt-2 text-sm text-charcoal">{state === "error" ? "Check your connection and try again." : "It may have been deleted, or the link is wrong."}</p>
            <Link href={back} className="mt-5 inline-block text-sm font-semibold underline underline-offset-2">
              {backLabel}
            </Link>
          </>
        )}
      </div>
    </PrintShell>
  );
}
