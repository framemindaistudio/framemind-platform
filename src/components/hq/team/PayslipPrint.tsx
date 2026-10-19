"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Loader2 } from "lucide-react";
import { useCollection, useSettings } from "@/components/hq/data";
import { A4Page, Letterhead, PrintFooter, PrintShell } from "@/components/print/PrintShell";
import type { CompanySettings } from "@/lib/hq/settings";
import { amountInWords, formatDate, formatINR } from "@/lib/utils";
import { shootsInMonth, unitsText, monthLabel, payModeLabel, slipTotals, str, type Rec } from "./team";

const BACK = "/hq/team?tab=payroll";
const inr = (v: number) => formatINR(v, { decimals: true });

export function PayslipPrint({ id }: { id: string }) {
  const { records: payroll, loading, error } = useCollection<Rec>("payroll");
  const { records: team, loading: teamLoading } = useCollection<Rec>("team");
  const { records: shoots } = useCollection<Rec>("shoots");
  const { settings, loading: settingsLoading } = useSettings();

  const rec = payroll.find((p) => p.id === id);
  const member = rec ? team.find((m) => m.id === str(rec.memberId)) : undefined;

  if (loading || teamLoading || settingsLoading) return <Message title="Payslip"><Spinner /></Message>;
  if (!rec) {
    return (
      <Message title="Payslip">
        <h2 className="text-base font-semibold">{error ? "Could not load this payslip" : "Payslip not found"}</h2>
        <p className="mt-2 text-sm text-charcoal">{error ?? "It may have been deleted, or the link is wrong."}</p>
        <Link href={BACK} className="mt-5 inline-block text-sm font-semibold underline underline-offset-2">
          Back to payroll
        </Link>
      </Message>
    );
  }
  return <Ready rec={rec} member={member} shoots={shoots} settings={settings} />;
}

function Spinner() {
  return (
    <p className="flex items-center justify-center gap-2 text-sm text-blueprint">
      <Loader2 className="size-4 animate-spin" aria-hidden /> Loading…
    </p>
  );
}

function Message({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <PrintShell title={title} back={BACK}>
      <div className="w-full max-w-md rounded-[var(--radius-md)] border border-graphite/15 bg-paper-50 p-8 text-center">{children}</div>
    </PrintShell>
  );
}

function Cap({ children }: { children: React.ReactNode }) {
  return <p className="mb-1 text-[8px] font-semibold uppercase tracking-[0.2em] text-blueprint">{children}</p>;
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div>
      <Cap>{k}</Cap>
      <p className="text-[11px] font-semibold text-graphite">{v || "—"}</p>
    </div>
  );
}

function Ready({ rec, member, shoots, settings }: { rec: Rec; member?: Rec; shoots: Rec[]; settings: CompanySettings }) {
  const t = useMemo(() => slipTotals(rec), [rec]);
  const month = str(rec.month);
  const name = str(member?.name) || "Team member";
  const paid = str(rec.status) === "paid";
  const slipNo = `PS-${month || "0000-00"}-${rec.id.slice(-4).toUpperCase()}`;
  const counted = useMemo(() => (member ? shootsInMonth(member, shoots, month) : []), [member, shoots, month]);
  const freelance = str(member?.type) === "Freelance" || /freelance/i.test(str(member?.role));

  const earnings: { label: string; basis?: string; amount: number }[] = [
    { label: freelance ? "Retainer / fixed fee" : "Fixed pay (salary / stipend)", amount: t.fixed },
    { label: "Freelance pay", basis: `${unitsText(t.units, t.unitLabel)} × ${inr(t.rate)}`, amount: t.unitPay },
    { label: "Travel & other allowances", amount: t.allowances },
    { label: "Bonus / incentive", amount: t.bonus },
  ];
  const deductions: { label: string; amount: number }[] = [
    { label: "Advances / deductions", amount: t.deductions },
    { label: "TDS", amount: t.tds },
  ];

  return (
    <PrintShell
      title={`Payslip · ${name} · ${monthLabel(month)}`}
      back={BACK}
      toolbar={
        paid ? undefined : (
          <span className="rounded bg-warn/12 px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-warn">Payment pending</span>
        )
      }
    >
      <A4Page>
        <div className="pb-[18mm]">
          <Letterhead
            settings={settings}
            docTitle="PAYSLIP"
            docMeta={
              <>
                <span className="block text-sm font-semibold text-graphite">{monthLabel(month)}</span>
                <span className="tabular block uppercase tracking-[0.18em]">{slipNo}</span>
              </>
            }
          />

          {/* employee */}
          <section aria-label="Employee details" className="grid grid-cols-3 gap-x-6 gap-y-3 rounded-[2px] border border-graphite/25 bg-paper-50/40 px-5 py-4">
            <Row k="Name" v={name} />
            <Row k="Role" v={str(member?.role)} />
            <Row k="Engagement" v={str(member?.type)} />
            <Row k="Employee ID" v={<span className="tabular">{str(member?.id) || str(rec.memberId)}</span>} />
            <Row k="Joined" v={member?.joinDate ? formatDate(str(member.joinDate)) : ""} />
            <Row k="Payout to" v={str(member?.payoutDetails)} />
          </section>

          {/* earnings & deductions */}
          <section aria-label="Earnings and deductions" className="mt-6 grid grid-cols-2 gap-6">
            <div>
              <table className="w-full border-collapse text-[11px]">
                <caption className="mb-1 text-left text-[9px] font-bold uppercase tracking-[0.2em] text-graphite">Earnings</caption>
                <thead>
                  <tr className="border-y-2 border-graphite text-left text-[8px] uppercase tracking-[0.18em] text-blueprint">
                    <th scope="col" className="py-1.5 font-semibold">
                      Description
                    </th>
                    <th scope="col" className="py-1.5 text-right font-semibold">
                      Amount (₹)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {earnings.map((e) => (
                    <tr key={e.label} className="border-b border-graphite/15 align-top">
                      <td className="py-2 pr-2">
                        {e.label}
                        {e.basis && <span className="tabular block text-[9px] text-blueprint">{e.basis}</span>}
                      </td>
                      <td className="tabular py-2 text-right">{inr(e.amount)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-b-2 border-graphite font-bold">
                    <td className="py-2">Gross earnings</td>
                    <td className="tabular py-2 text-right">{inr(t.gross)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <div>
              <table className="w-full border-collapse text-[11px]">
                <caption className="mb-1 text-left text-[9px] font-bold uppercase tracking-[0.2em] text-graphite">Deductions</caption>
                <thead>
                  <tr className="border-y-2 border-graphite text-left text-[8px] uppercase tracking-[0.18em] text-blueprint">
                    <th scope="col" className="py-1.5 font-semibold">
                      Description
                    </th>
                    <th scope="col" className="py-1.5 text-right font-semibold">
                      Amount (₹)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {deductions.map((d) => (
                    <tr key={d.label} className="border-b border-graphite/15">
                      <td className="py-2 pr-2">{d.label}</td>
                      <td className="tabular py-2 text-right">{inr(d.amount)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-b-2 border-graphite font-bold">
                    <td className="py-2">Total deductions</td>
                    <td className="tabular py-2 text-right">{inr(t.totalDeductions)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>

          {/* net pay */}
          <section aria-label="Net pay" className="relative mt-6 overflow-hidden rounded-[2px] border-2 border-graphite px-5 py-4">
            <div className="hatch-light pointer-events-none absolute inset-0 opacity-60" aria-hidden />
            <div className="relative flex items-end justify-between gap-6">
              <div>
                <Cap>Net pay (gross earnings − deductions)</Cap>
                <p className="text-[11px] italic text-charcoal">{amountInWords(t.net)}</p>
              </div>
              <p className="tabular whitespace-nowrap text-3xl font-bold tracking-tight">{inr(t.net)}</p>
            </div>
          </section>

          {/* payment */}
          <section aria-label="Payment details" className="mt-6 grid grid-cols-4 gap-x-6 gap-y-3">
            <Row k="Payment status" v={paid ? "Paid" : str(rec.status) === "on-hold" ? "On hold" : "Pending"} />
            <Row k="Paid on" v={paid && rec.paidOn ? formatDate(str(rec.paidOn)) : ""} />
            <Row k="Mode" v={paid ? payModeLabel(rec.mode) : ""} />
            <Row k="Reference / UTR" v={<span className="tabular break-all">{str(rec.reference)}</span>} />
          </section>

          {counted.length > 0 && (
            <section aria-label="Shoots on record" className="mt-6">
              <Cap>Shoots crewed in {monthLabel(month)}</Cap>
              <ul className="text-[10px] text-charcoal">
                {counted.map((w) => (
                  <li key={w.id} className="flex justify-between gap-4 border-b border-dashed border-graphite/20 py-1">
                    <span>{str(w.title) || str(w.location)}</span>
                    <span className="tabular shrink-0">{formatDate(str(w.date))}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {str(rec.notes) && (
            <section aria-label="Notes" className="mt-6">
              <Cap>Notes</Cap>
              <p className="whitespace-pre-line text-[10px] text-charcoal">{str(rec.notes)}</p>
            </section>
          )}

          {/* signatures */}
          <section aria-label="Signatures" className="mt-14 grid grid-cols-2 gap-16 text-[10px]">
            <div className="border-t border-graphite pt-1.5">
              <p className="font-semibold">{name}</p>
              <p className="text-blueprint">Received by (signature & date)</p>
            </div>
            <div className="border-t border-graphite pt-1.5 text-right">
              <p className="font-semibold">{settings.signatoryName || "Authorised signatory"}</p>
              <p className="text-blueprint">{settings.signatoryTitle || "For " + settings.legalName}</p>
            </div>
          </section>

          <p className="mt-6 text-[8px] leading-relaxed text-blueprint">
            This is a computer-generated payslip. Deductions and TDS are shown as recorded by the company; confirm their treatment with your chartered accountant. Amounts are in Indian rupees.
          </p>
        </div>
        <PrintFooter note={`Payslip ${slipNo}`} />
      </A4Page>
    </PrintShell>
  );
}
