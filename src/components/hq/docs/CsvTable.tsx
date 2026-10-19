"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { parseCsv } from "./lib";

const num = (s: string) => {
  const t = s.replace(/[₹,%\s]/g, "").replace(/^\((.*)\)$/, "-$1");
  if (t === "" || !/^-?\d+(\.\d+)?$/.test(t)) return null;
  return Number(t);
};

/** Sortable, filterable table for .csv documents. */
export function CsvTable({ text, className }: { text: string; className?: string }) {
  const rows = useMemo(() => parseCsv(text), [text]);
  const [sort, setSort] = useState<{ col: number; dir: 1 | -1 } | null>(null);
  const [q, setQ] = useState("");

  const header = rows[0] ?? [];
  const cols = rows.reduce((m, r) => Math.max(m, r.length), 0);

  const body = useMemo(() => {
    let data = rows.slice(1);
    const needle = q.trim().toLowerCase();
    if (needle) data = data.filter((r) => r.some((c) => c.toLowerCase().includes(needle)));
    if (sort) {
      const { col, dir } = sort;
      data = [...data].sort((a, b) => {
        const av = a[col] ?? "";
        const bv = b[col] ?? "";
        const an = num(av);
        const bn = num(bv);
        if (an !== null && bn !== null) return (an - bn) * dir;
        return av.localeCompare(bv, "en", { numeric: true, sensitivity: "base" }) * dir;
      });
    }
    return data;
  }, [rows, sort, q]);

  if (!rows.length) return <p className="text-sm text-blueprint">This CSV file is empty.</p>;

  return (
    <div className={className}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <label className="relative block w-full max-w-xs">
          <span className="sr-only">Filter rows</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-blueprint" aria-hidden />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Filter rows…"
            className="h-9 w-full rounded-[var(--radius-sm)] border border-graphite/20 bg-paper-50 pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-blueprint/70 focus:border-graphite focus:bg-white focus:ring-2 focus:ring-graphite/10"
          />
        </label>
        <p className="tabular text-xs text-blueprint">
          {body.length} of {Math.max(0, rows.length - 1)} rows · {cols} columns
        </p>
      </div>
      <div className="hq-scroll max-h-[70vh] overflow-auto rounded-[var(--radius-sm)] border border-graphite/15 bg-white" data-lenis-prevent>
        <table className="w-full border-collapse text-left text-[13px]">
          <thead className="sticky top-0 z-10 bg-paper-100">
            <tr>
              {Array.from({ length: cols }, (_, i) => {
                const active = sort?.col === i;
                return (
                  <th key={i} scope="col" aria-sort={active ? (sort.dir === 1 ? "ascending" : "descending") : "none"} className="border-b border-graphite/20 p-0 font-semibold">
                    <button
                      type="button"
                      onClick={() => setSort((s) => (s?.col === i ? (s.dir === 1 ? { col: i, dir: -1 } : null) : { col: i, dir: 1 }))}
                      className="flex w-full items-center gap-1.5 whitespace-nowrap px-3 py-2.5 text-left hover:bg-graphite/5"
                    >
                      {header[i] || `Column ${i + 1}`}
                      {active ? sort.dir === 1 ? <ArrowUp className="size-3.5" aria-hidden /> : <ArrowDown className="size-3.5" aria-hidden /> : <ArrowUpDown className="size-3.5 text-blueprint/60" aria-hidden />}
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {body.map((r, ri) => (
              <tr key={ri} className={cn("border-b border-graphite/10 last:border-0", ri % 2 && "bg-paper-50/60")}>
                {Array.from({ length: cols }, (_, ci) => (
                  <td key={ci} className="px-3 py-2 align-top">
                    {r[ci] ?? ""}
                  </td>
                ))}
              </tr>
            ))}
            {!body.length && (
              <tr>
                <td colSpan={Math.max(1, cols)} className="px-3 py-8 text-center text-blueprint">
                  No rows match “{q}”.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
