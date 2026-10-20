"use client";

import { A4Page, Letterhead, PrintFooter, PrintShell } from "@/components/print/PrintShell";
import type { CompanySettings } from "@/lib/hq/settings";
import { quarterRange } from "@/lib/incentives/calc.ts";
import { amountInWords, formatDate, formatINR } from "@/lib/utils";

type Rec = Record<string, unknown> & { id: string };
const str = (v: unknown) => (v === undefined || v === null ? "" : String(v));
const inr = (v: unknown) => formatINR(Number(v) || 0, { decimals: true });

function periodLabel(p: Rec) {
  const period = str(p.period);
  if (p.kind === "bonus" && /^\d{4}-Q[1-4]$/.test(period)) return quarterRange(period).label;
  if (/^\d{4}-\d{2}$/.test(period)) return new Date(Date.parse(`${period}-01`)).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  return period;
}

/** A4 letter for one commission or bonus statement. Marked DRAFT until the founder approves it. */
export function IncentiveLetter({ payout: p, member, settings, back }: { payout: Rec; member: { name: string; role: string }; settings: CompanySettings; back: string }) {
  const status = str(p.status);
  const approved = ["approved", "initiated", "paid"].includes(status);
  const paid = status === "paid";
  const bonus = p.kind === "bonus";
  const title = bonus ? "QUARTERLY TEAM BONUS" : "CLIENT-ACQUISITION COMMISSION";
  const ref = str(p.letterRef) || `DRAFT/${p.id.slice(-6).toUpperCase()}`;
  const lines = (Array.isArray(p.lines) ? p.lines : []) as { date: string; eligibleFee: number; ratePercent: number; splitPercent: number; amount: number }[];
  const basis = p.basis as { eligibleCollections: number; tierFrom: number; tierAmount: number; share: number; excluded: string } | undefined;
  const first = member.name.split(" ")[0] || "there";

  return (
    <PrintShell
      title={`${bonus ? "Bonus" : "Commission"} letter · ${member.name} · ${str(p.period)}`}
      back={back}
      toolbar={approved ? undefined : <span className="rounded bg-warn/12 px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-warn">Draft — not approved</span>}
    >
      <A4Page>
        <div className="relative pb-[18mm]">
          {!approved && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden>
              <span className="-rotate-30 text-[110px] font-black tracking-widest text-graphite/[0.06]">DRAFT</span>
            </div>
          )}
          <Letterhead
            settings={settings}
            docTitle={title}
            docMeta={
              <>
                <span className="block text-sm font-semibold text-graphite">{periodLabel(p)}</span>
                <span className="tabular block uppercase tracking-[0.18em]">{ref}</span>
              </>
            }
          />

          <div className="space-y-4 text-[11.5px] leading-relaxed text-graphite">
            {approved && str(p.approvedAt) && <p>{formatDate(str(p.approvedAt).slice(0, 10))}</p>}
            <p>
              <strong>{member.name}</strong>
              {member.role && <span className="block text-charcoal">{member.role}</span>}
            </p>
            <p>Dear {first},</p>
            {bonus ? (
              <p>
                We are pleased to confirm your quarterly team bonus for {periodLabel(p)}. The studio&apos;s eligible collections for the quarter — client service fees actually received and reconciled, excluding GST and pass-through charges — were <strong>{inr(basis?.eligibleCollections)}</strong>, reaching the
                milestone of {inr(basis?.tierFrom)}
                {basis && basis.share < 1 ? `, and you took part for ${Math.round(basis.share * 100)}% of the quarter` : ""}.
              </p>
            ) : (
              <p>
                We are pleased to confirm your client-acquisition commission for {periodLabel(p)}: {lines[0]?.ratePercent ?? ""}% of the eligible service fee received from clients you introduced, at your approved share of each lead.
              </p>
            )}

            {!bonus && lines.length > 0 && (
              <table className="w-full border-collapse text-[10.5px]">
                <thead>
                  <tr className="border-y-2 border-graphite text-left text-[8px] uppercase tracking-[0.18em] text-blueprint">
                    <th className="py-1.5 font-semibold">Client payment received</th>
                    <th className="py-1.5 text-right font-semibold">Eligible fee</th>
                    <th className="py-1.5 text-right font-semibold">Rate × share</th>
                    <th className="py-1.5 text-right font-semibold">Commission</th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((l, i) => (
                    <tr key={i} className="border-b border-graphite/15">
                      <td className="py-1.5">{formatDate(l.date)}</td>
                      <td className="tabular py-1.5 text-right">{inr(l.eligibleFee)}</td>
                      <td className="tabular py-1.5 text-right">
                        {l.ratePercent}% × {l.splitPercent}%
                      </td>
                      <td className="tabular py-1.5 text-right">{inr(l.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            <table className="w-full border-collapse text-[11px]">
              <tbody>
                <tr className="border-b border-graphite/15">
                  <td className="py-1.5">Gross {bonus ? "bonus" : "commission"}</td>
                  <td className="tabular py-1.5 text-right">{inr(p.gross)}</td>
                </tr>
                <tr className="border-b border-graphite/15">
                  <td className="py-1.5">Less: deductions{str(p.deductionNote) ? ` (${str(p.deductionNote)})` : ""}</td>
                  <td className="tabular py-1.5 text-right">{inr(p.deductions)}</td>
                </tr>
                <tr className="border-b-2 border-graphite font-bold">
                  <td className="py-2">Net payable</td>
                  <td className="tabular py-2 text-right">{inr(p.net)}</td>
                </tr>
              </tbody>
            </table>
            <p className="italic text-charcoal">{amountInWords(Number(p.net) || 0)}</p>

            {paid ? (
              <p>
                <strong>Payment completed</strong> on {formatDate(str(p.paidOn))}, reference <span className="tabular">{str(p.paymentReference)}</span>.
              </p>
            ) : approved ? (
              <p>This amount has been approved and will be paid to your registered bank account.</p>
            ) : (
              <p className="text-bad">This is a draft for checking only. It is not a commitment to pay until it is approved.</p>
            )}
            <p className="text-[10px] text-charcoal">
              Calculated under the studio&apos;s incentive policy (version {str(p.policyVersion)}). If any figure looks wrong, raise it in HQ → My incentives.
            </p>
          </div>

          <section aria-label="Signatures" className="mt-14 grid grid-cols-2 gap-16 text-[10px]">
            <div className="border-t border-graphite pt-1.5">
              <p className="font-semibold">{member.name}</p>
              <p className="text-blueprint">Acknowledged (signature &amp; date)</p>
            </div>
            <div className="border-t border-graphite pt-1.5 text-right">
              <p className="font-semibold">{approved ? str(p.approvedBy) || settings.signatoryName || "Authorised signatory" : "Authorised signatory"}</p>
              <p className="text-blueprint">{settings.signatoryTitle || "For " + settings.legalName}</p>
            </div>
          </section>
        </div>
        <PrintFooter note={`${bonus ? "Bonus" : "Commission"} letter ${ref}`} />
      </A4Page>
    </PrintShell>
  );
}
