"use client";

import Link from "next/link";
import { useMemo } from "react";
import { FileText } from "lucide-react";
import { A4Page, Letterhead, PrintFooter, PrintShell } from "@/components/print/PrintShell";
import type { CompanySettings } from "@/lib/hq/settings";
import { amountInWords, cn, formatINR } from "@/lib/utils";
import { PAY_MODE_LABELS, fmtDate, invoiceMath, str, type Payment, type Rec } from "./finance";
import { Cap, DocMessage, Stamp, useInvoiceDoc } from "./printParts";
import { SignatureSpace } from "@/components/print/Signature";

const BACK = "/hq/finance?tab=invoices";
const inr = (v: number) => formatINR(v, { decimals: true });

/** Payment receipt for one payment (?payment=<id>) or every payment on an invoice. */
export function ReceiptPrint({ id, paymentId }: { id: string; paymentId?: string }) {
  const doc = useInvoiceDoc(id);
  if (doc.kind !== "ready") return <DocMessage state={doc} title="Payment receipt" back={BACK} />;
  return <Ready inv={doc.invoice} settings={doc.settings} paymentId={paymentId} />;
}

function Ready({ inv, settings, paymentId }: { inv: Rec; settings: CompanySettings; paymentId?: string }) {
  const m = useMemo(() => invoiceMath(inv, settings), [inv, settings]);
  const number = str(inv.number) || "Draft";
  const all = m.payments;
  const one = paymentId ? all.find((p) => p.id === paymentId) : undefined;
  const idx = one ? all.indexOf(one) : -1;
  const shown: Payment[] = one ? [one] : all;
  const received = shown.reduce((s, p) => s + p.amount, 0);
  const tds = shown.reduce((s, p) => s + (p.tds || 0), 0);
  const receiptNo = one ? `${number}/R${idx + 1}` : `${number}/R-ALL`;
  const date = one ? one.date : (shown[shown.length - 1]?.date ?? "");
  const settled = m.total > 0 && m.balance < 0.5;
  const hasCheque = shown.some((p) => p.mode === "cheque");
  const back = `${BACK}&id=${encodeURIComponent(inv.id)}`;
  const docName = m.gstPercent > 0 ? "Tax invoice" : "Invoice";

  return (
    <PrintShell
      title={`Payment receipt ${receiptNo}`}
      back={back}
      toolbar={
        <Link href={`/hq/print/invoice/${inv.id}`} className="inline-flex h-8 items-center gap-1.5 rounded px-2.5 text-xs font-semibold hover:bg-graphite/5">
          <FileText className="size-3.5" /> {docName}
        </Link>
      }
    >
      {paymentId && !one && (
        <p className="no-print w-full max-w-[210mm] rounded border border-warn/30 bg-warn/10 px-3 py-2 text-xs text-charcoal">That payment entry no longer exists on this invoice, so the receipt below covers all payments received.</p>
      )}
      <A4Page>
        {shown.length > 0 && settled && !one && <Stamp>Paid in full</Stamp>}
        <div className="pb-[16mm]">
          <Letterhead settings={settings} docTitle="PAYMENT RECEIPT" docMeta={<span className="uppercase tracking-[0.18em]">{one ? "Acknowledgement of payment" : "Statement of payments received"}</span>} />

          {shown.length === 0 ? (
            <div className="rounded-[2px] border border-dashed border-graphite/40 px-6 py-14 text-center text-sm text-charcoal">
              <p className="font-semibold text-graphite">No payments have been recorded against invoice {number} yet.</p>
              <p className="mt-1 text-xs">Record a payment from HQ → Finance → Invoices, then print the receipt.</p>
            </div>
          ) : (
            <>
              <section className="grid grid-cols-[1.25fr_1fr] gap-4 text-[11px] leading-relaxed">
                <div className="rounded-[2px] border border-graphite/30 p-3.5">
                  <Cap>Received with thanks from</Cap>
                  <p className="text-[13px] font-bold">{str(inv.customerName) || "—"}</p>
                  {str(inv.customerAddress) && <p className="whitespace-pre-line text-charcoal">{str(inv.customerAddress)}</p>}
                  {str(inv.customerGstin) && (
                    <p className="mt-1">
                      <span className="text-blueprint">GSTIN:</span> <span className="font-semibold">{str(inv.customerGstin)}</span>
                    </p>
                  )}
                </div>
                <dl className="rounded-[2px] border border-graphite/30 p-3.5">
                  <Cap>Receipt details</Cap>
                  <Meta k="Receipt no." v={receiptNo} strong />
                  <Meta k={one ? "Date received" : "Last payment"} v={fmtDate(date)} />
                  <Meta k="Against invoice" v={number} />
                  <Meta k="Invoice date" v={fmtDate(inv.date)} />
                </dl>
              </section>

              {/* amount */}
              <section className="mt-6 break-inside-avoid rounded-[2px] border-2 border-graphite p-4">
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <Cap>{one ? "Amount received" : "Total received"}</Cap>
                    <p className="tabular text-3xl font-bold tracking-tight">{inr(received)}</p>
                  </div>
                  {tds > 0 && (
                    <div className="text-right text-[11px]">
                      <Cap className="text-right">TDS deducted by payer</Cap>
                      <p className="tabular text-lg font-bold">{inr(tds)}</p>
                      <p className="text-[9px] text-charcoal">Credit claimable by the studio via Form 26AS</p>
                    </div>
                  )}
                </div>
                <p className="mt-3 border-t border-dashed border-graphite/40 pt-2 text-[11px]">
                  <span className="text-blueprint">In words:</span> <span className="font-semibold">{amountInWords(received)}</span>
                </p>
              </section>

              {/* payment lines */}
              <table className="mt-5 w-full border-collapse text-[11px]">
                <caption className="sr-only">Payments received</caption>
                <thead>
                  <tr className="border-y-2 border-graphite bg-graphite/[0.05] text-left text-[9px] uppercase tracking-[0.12em]">
                    <th scope="col" className="px-2 py-2 font-semibold">Date</th>
                    <th scope="col" className="px-2 py-2 font-semibold">Mode</th>
                    <th scope="col" className="px-2 py-2 font-semibold">Reference</th>
                    <th scope="col" className="px-2 py-2 text-right font-semibold">TDS (₹)</th>
                    <th scope="col" className="px-2 py-2 text-right font-semibold">Received (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {shown.map((p) => (
                    <tr key={p.id} className="break-inside-avoid border-b border-graphite/20">
                      <td className="tabular px-2 py-2">{fmtDate(p.date)}</td>
                      <td className="px-2 py-2">{PAY_MODE_LABELS[p.mode || ""] ?? (p.mode || "—")}</td>
                      <td className="px-2 py-2 text-charcoal">{p.reference || "—"}</td>
                      <td className="tabular px-2 py-2 text-right">{p.tds ? inr(p.tds) : "—"}</td>
                      <td className="tabular px-2 py-2 text-right font-medium">{inr(p.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* invoice position */}
              <section className="mt-6 grid break-inside-avoid grid-cols-[1fr_78mm] gap-6 text-[11px]">
                <div>
                  <Cap>Towards</Cap>
                  <p>
                    {docName} <span className="font-semibold">{number}</span> dated {fmtDate(inv.date)}
                    {str(inv.customerName) ? ` issued to ${str(inv.customerName)}` : ""}.
                  </p>
                  {hasCheque && <p className="mt-2 text-[10px] text-charcoal">Cheque payments are subject to realisation.</p>}
                </div>
                <dl>
                  <Row k="Invoice total" v={inr(m.total)} />
                  <Row k="Settled to date" v={inr(m.paid)} sub={m.tds > 0 ? `incl. TDS ${inr(m.tds)}` : undefined} />
                  <div className={cn("mt-1 flex items-baseline justify-between gap-3 py-2 text-[12px] font-bold", settled ? "border-y-2 border-graphite" : "bg-graphite pl-2 pr-2 text-white")}>
                    <dt>{settled ? "Invoice settled in full" : "Balance due"}</dt>
                    <dd className="tabular">{settled ? "—" : inr(m.balance)}</dd>
                  </div>
                </dl>
              </section>

              <section className="mt-10 grid break-inside-avoid grid-cols-[1fr_62mm] items-end gap-6 text-[10px]">
                <p className="text-[9px] leading-relaxed text-blueprint">
                  This receipt acknowledges money received against the invoice above. It is not a tax invoice — GST, where charged, is shown on the invoice itself. This is a computer-generated document.
                </p>
                <div className="text-center">
                  <p className="text-[10px]">
                    For <span className="font-bold">{settings.legalName}</span>
                  </p>
                  <SignatureSpace name={settings.signatoryName} className="h-14" />
                  <div className="border-t border-graphite pt-1">
                    <p className="text-[11px] font-bold">{settings.signatoryName || "Authorised signatory"}</p>
                    <p className="text-[9px] text-charcoal">{settings.signatoryTitle || "Authorised signatory"}</p>
                  </div>
                </div>
              </section>
            </>
          )}
        </div>
        <PrintFooter note={receiptNo} />
      </A4Page>
    </PrintShell>
  );
}

function Meta({ k, v, strong }: { k: string; v: string; strong?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-0.5">
      <dt className="text-blueprint">{k}</dt>
      <dd className={cn("tabular text-right", strong ? "text-[12px] font-bold" : "font-medium")}>{v}</dd>
    </div>
  );
}

function Row({ k, v, sub }: { k: string; v: string; sub?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1 text-charcoal">
      <dt>
        {k}
        {sub && <span className="ml-1.5 text-[9px] text-blueprint">({sub})</span>}
      </dt>
      <dd className="tabular text-graphite">{v}</dd>
    </div>
  );
}
