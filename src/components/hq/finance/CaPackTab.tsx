"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, Download, FileArchive, FileSpreadsheet, Info } from "lucide-react";
import { strToU8, zipSync } from "fflate";
import { useCollection } from "@/components/hq/data";
import { Panel } from "@/components/hq/ui";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/form";
import type { CompanySettings } from "@/lib/hq/settings";
import { cn, formatNumber } from "@/lib/utils";
import { buildCaPack, quarterPeriod, type PeriodKind } from "./caPack";
import { fyPeriod, fyStartYear, monthLabel, monthPeriod, shiftMonth, type Ledger, type Rec } from "./finance";

const inr = (n: number) => `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

function save(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/**
 * Finance → For the CA: pick a month, a quarter or the financial year; see what is missing; download one ZIP with
 * every register and the bills, for the Chartered Accountant. Founders and admins only (it includes payroll).
 */
export function CaPackTab({ ledger, invoices, expenses, income, settings, today }: { ledger: Ledger; invoices: Rec[]; expenses: Rec[]; income: Rec[]; settings: CompanySettings; today: string }) {
  const payrollQ = useCollection("payroll");
  const teamQ = useCollection("team");
  const thisFy = fyStartYear(today);
  const lastMonth = shiftMonth(today.slice(0, 7), -1);
  const [kind, setKind] = useState<PeriodKind>("month");
  const [month, setMonth] = useState(lastMonth);
  const [quarter, setQuarter] = useState(() => {
    const m = Number(today.slice(5, 7));
    const q = m >= 4 ? Math.floor((m - 4) / 3) + 1 : 4;
    return q === 1 ? `${thisFy - 1}-4` : `${thisFy}-${q - 1}`; // the last finished quarter
  });
  const [fy, setFy] = useState(Number(today.slice(5, 7)) >= 4 && Number(today.slice(5, 7)) <= 6 ? thisFy - 1 : thisFy);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  const period = useMemo(() => {
    if (kind === "month") return monthPeriod(month);
    if (kind === "quarter") {
      const [y, q] = quarter.split("-").map(Number);
      return quarterPeriod(y, q);
    }
    return fyPeriod(fy);
  }, [kind, month, quarter, fy]);

  const pack = useMemo(
    () => buildCaPack({ period, ledger, invoices, expenses, income, payroll: payrollQ.records, team: teamQ.records, settings, generatedAt: new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) }),
    [period, ledger, invoices, expenses, income, payrollQ.records, teamQ.records, settings],
  );
  const fixes = pack.issues.filter((i) => i.level === "fix");
  const checks = pack.issues.filter((i) => i.level === "check");
  const zipName = `FrameMind_accounts_${period.start.slice(0, 7)}_to_${period.end.slice(0, 7)}.zip`.replace(/_(\d{4}-\d{2})_to_\1/, "_$1");

  async function downloadZip() {
    setBusy("zip");
    setError("");
    try {
      const entries: Record<string, Uint8Array> = {};
      for (const f of pack.files) entries[f.name] = strToU8(f.text);
      const failed: string[] = [];
      for (const [i, b] of pack.bills.entries()) {
        setBusy(`bill ${i + 1} of ${pack.bills.length}`);
        try {
          const res = await fetch(`/api/hq/docs/raw?path=${encodeURIComponent(b.path)}`);
          if (!res.ok) throw new Error(String(res.status));
          entries[b.name] = new Uint8Array(await res.arrayBuffer());
        } catch {
          failed.push(b.name);
        }
      }
      if (failed.length) entries["Bills/_COULD_NOT_INCLUDE.txt"] = strToU8(`These bills could not be read from HQ when the pack was made:\r\n${failed.join("\r\n")}`);
      // bills are already compressed (JPEG, PDF): store them; deflate the text files
      const zipped = zipSync(Object.fromEntries(Object.entries(entries).map(([k, v]) => [k, [v, { level: k.startsWith("Bills/") ? 0 : 6 }]])) as Parameters<typeof zipSync>[0]);
      save(new Blob([zipped as BlobPart], { type: "application/zip" }), zipName);
      if (failed.length) setError(`${failed.length} bill${failed.length === 1 ? "" : "s"} could not be included; the ZIP lists them.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not make the ZIP.");
    } finally {
      setBusy("");
    }
  }

  const fyOptions = [thisFy, thisFy - 1, thisFy - 2];
  const monthOptions = Array.from({ length: 18 }, (_, i) => shiftMonth(today.slice(0, 7), -i));

  return (
    <div className="space-y-6" data-ca-pack>
      <Panel title="Accounts pack for the CA" subtitle="Every register your Chartered Accountant works from, with the bills, in one ZIP.">
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-sm">
            <span className="annot mb-1 block text-[10px] text-blueprint">Period</span>
            <Select aria-label="Kind of period" value={kind} onChange={(e) => setKind(e.target.value as PeriodKind)} className="h-10 w-40">
              <option value="month">A month</option>
              <option value="quarter">A quarter</option>
              <option value="fy">Financial year</option>
            </Select>
          </label>
          {kind === "month" && (
            <Select aria-label="Month" value={month} onChange={(e) => setMonth(e.target.value)} className="h-10 w-64">
              {monthOptions.map((m) => (
                <option key={m} value={m}>
                  {monthLabel(m, true)}
                  {m === lastMonth ? " (last month)" : ""}
                </option>
              ))}
            </Select>
          )}
          {kind === "quarter" && (
            <Select aria-label="Quarter" value={quarter} onChange={(e) => setQuarter(e.target.value)} className="h-10 w-72">
              {fyOptions.flatMap((y) => [4, 3, 2, 1].map((q) => quarterPeriod(y, q))).filter((q) => q.start <= today).map((q) => (
                <option key={q.key} value={q.key.slice(2)}>
                  {q.label}
                </option>
              ))}
            </Select>
          )}
          {kind === "fy" && (
            <Select aria-label="Financial year" value={String(fy)} onChange={(e) => setFy(Number(e.target.value))} className="h-10 w-48">
              {fyOptions.map((y) => (
                <option key={y} value={y}>
                  {fyPeriod(y).label}
                </option>
              ))}
            </Select>
          )}
          <Button onClick={() => void downloadZip()} disabled={!!busy || payrollQ.loading || teamQ.loading}>
            <FileArchive className="size-4" aria-hidden /> {busy ? (busy === "zip" ? "Making the ZIP…" : `Adding ${busy}…`) : "Download the pack (.zip)"}
          </Button>
        </div>
        <p className="mt-2 text-xs text-blueprint">
          {period.label}: {period.start} to {period.end} · {pack.files.length - 1} files and {formatNumber(pack.bills.length)} bill{pack.bills.length === 1 ? "" : "s"} · {zipName}
        </p>
        {error && <p className="mt-3 rounded border border-bad/30 bg-bad/10 px-3 py-2 text-sm text-bad">{error}</p>}
      </Panel>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <Panel
          title={fixes.length ? `Fix before sending · ${fixes.length}` : "Ready to send"}
          subtitle={fixes.length ? "These would make the CA's work wrong or incomplete." : checks.length ? "Nothing blocking. A few things to check or explain below." : "Nothing missing for this period."}
        >
          {pack.issues.length === 0 ? (
            <p className="flex items-center gap-2 text-sm text-ok">
              <CheckCircle2 className="size-4" aria-hidden /> Every invoice is issued and complete, every expense has its bill.
            </p>
          ) : (
            <ul className="space-y-2" data-issues>
              {[...fixes, ...checks].slice(0, 60).map((i, k) => (
                <li key={k} className={cn("flex gap-2 rounded-[var(--radius-sm)] border px-3 py-2 text-sm", i.level === "fix" ? "border-bad/30 bg-bad/[0.06]" : "border-warn/30 bg-warn/[0.06]")}>
                  {i.level === "fix" ? <AlertTriangle className="mt-0.5 size-4 shrink-0 text-bad" aria-hidden /> : <Info className="mt-0.5 size-4 shrink-0 text-warn" aria-hidden />}
                  <span className="min-w-0">
                    <span className="annot mr-1.5 text-[10px] text-blueprint">{i.area}</span>
                    {i.text}{" "}
                    {i.href && (
                      <Link href={i.href} className="font-semibold text-graphite underline underline-offset-2">
                        Open
                      </Link>
                    )}
                  </span>
                </li>
              ))}
              {pack.issues.length > 60 && <li className="text-xs text-blueprint">…and {pack.issues.length - 60} more in 00_Check_before_sending.csv.</li>}
            </ul>
          )}
        </Panel>

        <Panel title="The period in figures" subtitle="As in 00_Summary.csv.">
          <dl className="divide-y divide-graphite/[0.07] text-sm">
            {pack.summary.slice(5).map((s) => (
              <div key={s.label} className="flex justify-between gap-4 py-1.5">
                <dt className="text-charcoal">{s.label}</dt>
                <dd className="tabular shrink-0 font-mono text-graphite">{typeof s.value === "number" && !/^(Invoices issued|Bills|Expenses without|Things)/.test(s.label) ? inr(s.value) : String(s.value)}</dd>
              </div>
            ))}
          </dl>
        </Panel>
      </div>

      <Panel title="What is in the pack" subtitle="Each file on its own, if the CA asks for just one.">
        <ul className="grid gap-2 sm:grid-cols-2">
          {pack.files.map((f) => (
            <li key={f.name}>
              <button type="button" onClick={() => save(new Blob([f.text], { type: f.name.endsWith(".csv") ? "text/csv;charset=utf-8" : "text/plain;charset=utf-8" }), f.name)} className="flex w-full items-center gap-2 rounded-[var(--radius-sm)] border border-graphite/12 bg-paper px-3 py-2 text-left text-sm hover:border-graphite">
                {f.name.endsWith(".csv") ? <FileSpreadsheet className="size-4 shrink-0 text-blueprint" aria-hidden /> : <Download className="size-4 shrink-0 text-blueprint" aria-hidden />}
                <span className="font-mono text-xs text-graphite">{f.name}</span>
              </button>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel title="The routine" subtitle="So the CA is never waiting on the studio.">
        <ul className="grid gap-3 text-sm text-charcoal md:grid-cols-3">
          <li className="rounded-[var(--radius-sm)] border border-graphite/12 bg-paper px-4 py-3">
            <p className="font-semibold text-graphite">Every month, by the 5th</p>
            Fix the red items, then send last month&apos;s pack. A monthly GST filer files GSTR-1 by the 11th and GSTR-3B by the 20th; if the studio files quarterly, the CA will say so.
          </li>
          <li className="rounded-[var(--radius-sm)] border border-graphite/12 bg-paper px-4 py-3">
            <p className="font-semibold text-graphite">Every quarter</p>
            Send the quarter&apos;s pack for TDS and advance tax. Check 08_TDS_by_customers against Form 26AS with the CA.
          </li>
          <li className="rounded-[var(--radius-sm)] border border-graphite/12 bg-paper px-4 py-3">
            <p className="font-semibold text-graphite">After 31 March</p>
            Send the financial year&apos;s pack for the accounts and the income tax return, with bank statements from the bank.
          </li>
        </ul>
        <p className="mt-3 text-xs text-blueprint">Send the ZIP by email or a Google Drive link to the CA only. It holds pay and bank references: never post it in a group.</p>
      </Panel>
    </div>
  );
}
