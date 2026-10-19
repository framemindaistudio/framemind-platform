"use client";

import { useState } from "react";
import { Download, FileJson, Loader2, PackageOpen } from "lucide-react";
import { api, useBook, useHq } from "@/components/hq/data";
import { refLabel } from "@/components/hq/fields";
import { Button } from "@/components/ui/Button";
import { collections, type BaseRecord, type CollectionDef } from "@/lib/hq/collections";
import { can } from "@/lib/hq/roles";
import { formatDateTime, formatNumber, isoDate } from "@/lib/utils";
import { SettingsSection } from "./shared";

type Loaded = Record<string, BaseRecord[]>;

type State = { status: "idle" } | { status: "loading"; done: number; total: number } | { status: "ready"; data: Loaded; settings: unknown; failed: string[] };

function download(filename: string, text: string, type: string, bom = false) {
  const blob = new Blob([bom ? "﻿" + text : text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

const esc = (v: unknown) => {
  const s = v === undefined || v === null ? "" : Array.isArray(v) ? v.map((x) => (typeof x === "object" ? JSON.stringify(x) : x)).join("; ") : typeof v === "object" ? JSON.stringify(v) : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** One CSV per collection; references are written as names instead of ids. */
function toCsv(def: CollectionDef, rows: BaseRecord[], data: Loaded) {
  const lookups = new Map<string, Map<string, BaseRecord>>();
  for (const f of def.fields) {
    if (f.type === "ref" && f.ref && !lookups.has(f.ref)) lookups.set(f.ref, new Map((data[f.ref] ?? []).map((r) => [r.id, r])));
  }
  const header = ["id", ...def.fields.map((f) => f.label), "Created", "Created by", "Updated", "Updated by"].map(esc).join(",");
  const lines = rows.map((r) =>
    [r.id, ...def.fields.map((f) => (f.type === "ref" ? refLabel(lookups.get(f.ref ?? "")?.get(String(r[f.key])), f.ref) || r[f.key] : r[f.key])), r.createdAt, r.createdBy, r.updatedAt, r.updatedBy].map(esc).join(","),
  );
  return [header, ...lines].join("\r\n");
}

async function loadAll(defs: CollectionDef[], onProgress: (done: number) => void) {
  const out: Loaded = {};
  const failed: string[] = [];
  let next = 0;
  let done = 0;
  async function worker() {
    while (next < defs.length) {
      const d = defs[next++];
      try {
        const j = await api<{ records: BaseRecord[] }>(`/api/hq/collections/${d.name}`);
        out[d.name] = j.records;
      } catch {
        failed.push(d.label);
      }
      onProgress(++done);
    }
  }
  await Promise.all(Array.from({ length: 4 }, worker));
  return { out, failed };
}

export function DataExport() {
  const { user, store } = useHq();
  // prices and costs (Money → Prices & Costs) are part of a full backup
  const book = useBook();
  const [state, setState] = useState<State>({ status: "idle" });
  const defs = collections.filter((c) => can(user, c.read));

  async function prepare() {
    setState({ status: "loading", done: 0, total: defs.length + 1 });
    try {
      const [{ out, failed }, settings] = await Promise.all([
        loadAll(defs, (done) => setState((s) => (s.status === "loading" ? { ...s, done } : s))),
        api<{ settings: unknown }>("/api/hq/settings").then((j) => j.settings),
      ]);
      setState({ status: "ready", data: out, settings, failed });
    } catch {
      setState({ status: "idle" });
    }
  }

  function backup() {
    if (state.status !== "ready") return;
    const file = {
      app: "FrameMind HQ",
      format: 1,
      exportedAt: new Date().toISOString(),
      exportedBy: user.name,
      storage: { mode: store.mode, repo: store.repo ?? null, branch: store.branch },
      settings: state.settings,
      priceBook: book,
      collections: state.data,
    };
    download(`framemind-hq-backup-${isoDate()}.json`, JSON.stringify(file, null, 2), "application/json");
  }

  const total = state.status === "ready" ? Object.values(state.data).reduce((n, r) => n + r.length, 0) : 0;

  return (
    <SettingsSection id="data" index="08" title="Data export" description="A portable copy of everything HQ knows: one JSON backup, or a spreadsheet-ready CSV for each module.">
      <div className="rounded-[var(--radius-sm)] border border-graphite/12 bg-paper px-4 py-3 text-sm text-charcoal">
        <p>
          Your data is already versioned: every collection is a file in the private repository, and GitHub keeps every earlier version. These downloads are an extra, portable copy for your own records or for handing a CA the numbers.
        </p>
        <p className="mt-2 text-xs text-blueprint">Exports contain customer contacts, pay and bank details. Keep them somewhere private and do not email them unencrypted.</p>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        {state.status !== "ready" ? (
          <Button onClick={prepare} disabled={state.status === "loading"}>
            {state.status === "loading" ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <PackageOpen className="size-4" aria-hidden />}
            {state.status === "loading" ? `Collecting data… ${state.done} of ${state.total}` : "Collect data for export"}
          </Button>
        ) : (
          <>
            <Button onClick={backup}>
              <FileJson className="size-4" aria-hidden /> Download full backup (JSON)
            </Button>
            <Button variant="secondary" onClick={prepare}>
              Refresh data
            </Button>
            <span className="text-xs text-blueprint" role="status">
              {formatNumber(total)} records across {Object.keys(state.data).length} collections, plus company settings and the price book.
            </span>
          </>
        )}
      </div>

      {state.status === "ready" && state.failed.length > 0 && (
        <p role="alert" className="mt-3 rounded border border-warn/30 bg-warn/10 px-3 py-2 text-sm text-warn">
          Could not load: {state.failed.join(", ")}. The backup will not include them. Try again, or check the Activity Log for problems.
        </p>
      )}

      {state.status === "ready" && (
        <div className="hq-scroll mt-5 overflow-x-auto rounded-[var(--radius-sm)] border border-graphite/12" data-lenis-prevent>
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-graphite/12 bg-graphite/[0.035] text-left">
                <th className="annot px-4 py-2.5 text-[10px] font-semibold text-blueprint">Collection</th>
                <th className="annot px-4 py-2.5 text-right text-[10px] font-semibold text-blueprint">Records</th>
                <th className="annot px-4 py-2.5 text-[10px] font-semibold text-blueprint">Last change</th>
                <th className="px-4 py-2.5">
                  <span className="sr-only">Download</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {defs.map((d) => {
                const rows = state.data[d.name];
                const latest = rows?.reduce((m, r) => (String(r.updatedAt ?? "") > m ? String(r.updatedAt) : m), "") ?? "";
                return (
                  <tr key={d.name} className="border-b border-graphite/[0.07] last:border-0">
                    <td className="px-4 py-2.5 font-medium text-graphite">{d.label}</td>
                    <td className="tabular px-4 py-2.5 text-right">{rows ? formatNumber(rows.length) : "n/a"}</td>
                    <td className="px-4 py-2.5 text-xs text-blueprint">{latest ? formatDateTime(latest) : "—"}</td>
                    <td className="px-4 py-2 text-right">
                      <Button variant="ghost" size="sm" disabled={!rows?.length} onClick={() => download(`framemind-${d.name}-${isoDate()}.csv`, toCsv(d, rows ?? [], state.data), "text/csv;charset=utf-8", true)} aria-label={`Download ${d.label} as CSV`}>
                        <Download className="size-3.5" aria-hidden /> CSV
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-5 text-xs leading-relaxed text-blueprint">
        Not included: the Operations Library documents (OPERATIONS/ folder) and uploaded vault files. They live in the repository too. For a complete offline copy, open the repository on GitHub and choose Code → Download ZIP.
      </p>
    </SettingsSection>
  );
}
