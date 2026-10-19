"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Info, Pencil, ReceiptText } from "lucide-react";
import { A4Page, Letterhead, PrintFooter, PrintShell } from "@/components/print/PrintShell";
import type { LineItem } from "@/lib/hq/collections";
import type { CompanySettings } from "@/lib/hq/settings";
import { amountInWords, cn, formatINR } from "@/lib/utils";
import { PAY_MODE_LABELS, fmtDate, invoiceMath, effectiveDueDate, num, str, type Rec } from "./finance";
import { Cap, DocMessage, Stamp, placeLabel, useInvoiceDoc } from "./printParts";

const BACK = "/hq/finance?tab=invoices";
const inr = (v: number) => formatINR(v, { decimals: true });

export function InvoicePrint({ id }: { id: string }) {
  const doc = useInvoiceDoc(id);
  if (doc.kind !== "ready") return <DocMessage state={doc} title="Tax invoice" back={BACK} />;
  return <Ready inv={doc.invoice} settings={doc.settings} />;
}

function Ready({ inv, settings }: { inv: Rec; settings: CompanySettings }) {
  const m = useMemo(() => invoiceMath(inv, settings), [inv, settings]);
  const number = str(inv.number) || "Draft";
  const status = str(inv.status) || "draft";
  const items = (Array.isArray(inv.items) ? inv.items : []) as LineItem[];
  const half = m.gstPercent / 2;
  const due = effectiveDueDate(inv);
  const place = placeLabel(inv.placeOfSupply, settings.state ? `${settings.state}${settings.stateCode ? ` (${settings.stateCode})` : ""}` : "");
  const supplierState = placeLabel(settings.stateCode || settings.state);
  const settled = m.total > 0 && m.balance < 0.5;

  /* UPI QR for the balance — generated in the browser, never sent anywhere */
  const upiUri = useMemo(() => {
    if (!settings.upiId || settled || status === "cancelled" || m.balance <= 0) return "";
    const qs = [`pa=${encodeURIComponent(settings.upiId)}`, `pn=${encodeURIComponent(settings.legalName || settings.brandName || "FrameMind AI Studio")}`, `am=${m.balance.toFixed(2)}`, "cu=INR", `tn=${encodeURIComponent(`Invoice ${number}`)}`];
    return `upi://pay?${qs.join("&")}`;
  }, [settings.upiId, settings.legalName, settings.brandName, settled, status, m.balance, number]);
  const [qr, setQr] = useState<{ uri: string; src: string } | null>(null);
  useEffect(() => {
    if (!upiUri) return;
    let alive = true;
    import("qrcode")
      .then((mod) => {
        const lib = (mod as unknown as { default?: typeof mod }).default ?? mod;
        return lib.toDataURL(upiUri, { margin: 1, width: 320, errorCorrectionLevel: "M", color: { dark: "#161616", light: "#FFFFFF" } });
      })
      .then((src) => alive && setQr({ uri: upiUri, src }))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [upiUri]);
  const qrSrc = qr && qr.uri === upiUri ? qr.src : "";

  const bank = [
    ["Account name", settings.bankAccountName],
    ["Bank", settings.bankName],
    ["Account no.", settings.bankAccountNumber],
    ["IFSC", settings.bankIfsc],
    ["UPI ID", settings.upiId],
  ].filter(([, v]) => v);

  const warnings = [
    !settings.gstin && "Your GSTIN is missing — add it in HQ → Settings before issuing this as a tax invoice.",
    !str(inv.customerName).trim() && "Bill-to name is empty.",
    status === "draft" && "This invoice is still a draft. Set the status to “Sent” when you issue it.",
    place && !/\(\d{2}\)$/.test(place) && "Place of supply isn't a recognised state, so it was treated as intra-state (CGST + SGST). Use the state name or its 2-digit GST code.",
  ].filter(Boolean) as string[];

  return (
    <PrintShell
      title={`Tax invoice ${number}`}
      back={`${BACK}&id=${encodeURIComponent(inv.id)}`}
      toolbar={
        <>
          <Link href={`/hq/finance?tab=invoices&id=${encodeURIComponent(inv.id)}`} className="inline-flex h-8 items-center gap-1.5 rounded px-2.5 text-xs font-semibold hover:bg-graphite/5">
            <Pencil className="size-3.5" /> Edit
          </Link>
          {m.payments.length > 0 && (
            <Link href={`/hq/print/receipt/${inv.id}`} className="inline-flex h-8 items-center gap-1.5 rounded px-2.5 text-xs font-semibold hover:bg-graphite/5">
              <ReceiptText className="size-3.5" /> Receipt
            </Link>
          )}
        </>
      }
    >
      {warnings.length > 0 && (
        <ul className="no-print w-full max-w-[210mm] space-y-1.5">
          {warnings.map((w) => (
            <li key={w} className="flex items-start gap-2 rounded border border-warn/30 bg-warn/10 px-3 py-2 text-xs text-charcoal">
              <Info className="mt-0.5 size-3.5 shrink-0 text-warn" aria-hidden /> {w}
            </li>
          ))}
        </ul>
      )}

      <A4Page>
        {status === "cancelled" ? <Stamp>Cancelled</Stamp> : status === "draft" ? <Stamp>Draft</Stamp> : settled ? <Stamp>Paid</Stamp> : null}
        <div className="pb-[16mm]">
          <Letterhead settings={settings} docTitle="TAX INVOICE" docMeta={<span className="uppercase tracking-[0.18em]">Original for recipient</span>} />

          {/* parties + meta */}
          <section className="grid grid-cols-[1.25fr_1fr] gap-4 text-[11px] leading-relaxed">
            <div className="rounded-[2px] border border-graphite/30 p-3.5">
              <Cap>Bill to</Cap>
              <p className="text-[13px] font-bold">{str(inv.customerName) || "—"}</p>
              {str(inv.customerAddress) && <p className="whitespace-pre-line text-charcoal">{str(inv.customerAddress)}</p>}
              {str(inv.customerGstin) && (
                <p className="mt-1">
                  <span className="text-blueprint">GSTIN:</span> <span className="font-semibold">{str(inv.customerGstin)}</span>
                </p>
              )}
              <p className="mt-1">
                <span className="text-blueprint">Place of supply:</span> <span className="font-semibold">{place || "—"}</span>
              </p>
            </div>
            <dl className="rounded-[2px] border border-graphite/30 p-3.5">
              <Cap>Invoice details</Cap>
              <Meta k="Invoice no." v={number} strong />
              <Meta k="Invoice date" v={fmtDate(inv.date)} />
              <Meta k="Due date" v={due ? fmtDate(due) : "—"} />
              {supplierState && <Meta k="Supplier state" v={supplierState} />}
              <Meta k="Reverse charge" v="No" />
            </dl>
          </section>

          {/* items */}
          <table className="mt-5 w-full border-collapse text-[11px]">
            <caption className="sr-only">Invoice line items</caption>
            <thead>
              <tr className="border-y-2 border-graphite bg-graphite/[0.05] text-left text-[9px] uppercase tracking-[0.12em]">
                <th scope="col" className="w-8 px-2 py-2 font-semibold">#</th>
                <th scope="col" className="px-2 py-2 font-semibold">Description</th>
                <th scope="col" className="w-16 px-2 py-2 font-semibold">SAC</th>
                <th scope="col" className="w-12 px-2 py-2 text-right font-semibold">Qty</th>
                <th scope="col" className="w-24 px-2 py-2 text-right font-semibold">Rate (₹)</th>
                <th scope="col" className="w-28 px-2 py-2 text-right font-semibold">Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              {items.length ? (
                items.map((it, i) => (
                  <tr key={i} className="break-inside-avoid border-b border-graphite/20 align-top">
                    <td className="tabular px-2 py-2 text-blueprint">{i + 1}</td>
                    <td className="whitespace-pre-line px-2 py-2">{it.description}</td>
                    <td className="tabular px-2 py-2 text-charcoal">{it.sac || settings.sacCode}</td>
                    <td className="tabular px-2 py-2 text-right">{num(it.qty)}</td>
                    <td className="tabular px-2 py-2 text-right">{inr(num(it.rate))}</td>
                    <td className="tabular px-2 py-2 text-right font-medium">{inr(num(it.qty) * num(it.rate))}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-2 py-6 text-center text-charcoal">
                    No line items on this invoice.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* totals */}
          <section className="mt-4 grid grid-cols-[1fr_78mm] gap-6 break-inside-avoid text-[11px]">
            <div>
              <Cap>Amount in words</Cap>
              <p className="font-semibold">{amountInWords(m.total)}</p>
              {str(inv.notes) && (
                <>
                  <Cap className="mt-4">Notes</Cap>
                  <p className="whitespace-pre-line text-charcoal">{str(inv.notes)}</p>
                </>
              )}
            </div>
            <dl>
              <TotalRow k="Subtotal" v={inr(m.subtotal)} />
              {m.discount > 0 && <TotalRow k="Discount" v={`− ${inr(m.discount)}`} />}
              <TotalRow k="Taxable value" v={inr(m.taxable)} />
              {m.gstPercent > 0 &&
                (m.inter ? (
                  <TotalRow k={`IGST @ ${m.gstPercent}%`} v={inr(m.igst)} />
                ) : (
                  <>
                    <TotalRow k={`CGST @ ${half}%`} v={inr(m.cgst)} />
                    <TotalRow k={`SGST @ ${half}%`} v={inr(m.sgst)} />
                  </>
                ))}
              <div className="mt-1 flex items-baseline justify-between gap-3 border-y-2 border-graphite py-2 text-[13px] font-bold">
                <dt>Total</dt>
                <dd className="tabular">{inr(m.total)}</dd>
              </div>
              {m.payments.length > 0 && (
                <>
                  <TotalRow k="Received" v={`− ${inr(m.received)}`} />
                  {m.tds > 0 && <TotalRow k="TDS deducted by payer" v={`− ${inr(m.tds)}`} />}
                  <div className="mt-1 flex items-baseline justify-between gap-3 bg-graphite py-2 pl-2 pr-2 text-[12px] font-bold text-white">
                    <dt>{settled ? "Balance" : "Balance due"}</dt>
                    <dd className="tabular">{inr(m.balance)}</dd>
                  </div>
                </>
              )}
            </dl>
          </section>

          {/* payments received */}
          {m.payments.length > 0 && (
            <section className="mt-5 break-inside-avoid">
              <Cap>Payments received</Cap>
              <table className="w-full border-collapse text-[10px]">
                <caption className="sr-only">Payments received against this invoice</caption>
                <thead>
                  <tr className="border-b border-graphite/40 text-left text-[8px] uppercase tracking-[0.14em] text-blueprint">
                    <th scope="col" className="py-1.5 font-semibold">Date</th>
                    <th scope="col" className="py-1.5 font-semibold">Mode</th>
                    <th scope="col" className="py-1.5 font-semibold">Reference</th>
                    <th scope="col" className="py-1.5 text-right font-semibold">TDS</th>
                    <th scope="col" className="py-1.5 text-right font-semibold">Received</th>
                  </tr>
                </thead>
                <tbody>
                  {m.payments.map((p) => (
                    <tr key={p.id} className="border-b border-graphite/15">
                      <td className="tabular py-1.5">{fmtDate(p.date)}</td>
                      <td className="py-1.5">{PAY_MODE_LABELS[p.mode || ""] ?? (p.mode || "—")}</td>
                      <td className="py-1.5 text-charcoal">{p.reference || "—"}</td>
                      <td className="tabular py-1.5 text-right">{p.tds ? inr(p.tds) : "—"}</td>
                      <td className="tabular py-1.5 text-right font-medium">{inr(p.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}

          {/* bank + QR */}
          {(bank.length > 0 || qrSrc) && (
            <section className="mt-6 grid break-inside-avoid grid-cols-[1fr_auto] items-start gap-6 border-t border-dashed border-graphite/40 pt-4 text-[11px]">
              <div>
                <Cap>Pay by bank transfer / UPI</Cap>
                {bank.length ? (
                  <dl className="grid grid-cols-[88px_1fr] gap-x-3 gap-y-0.5">
                    {bank.map(([k, v]) => (
                      <div key={k} className="contents">
                        <dt className="text-blueprint">{k}</dt>
                        <dd className={cn("font-semibold", (k === "Account no." || k === "IFSC") && "tabular")}>{v}</dd>
                      </div>
                    ))}
                  </dl>
                ) : (
                  <p className="text-charcoal">Bank details are not set yet.</p>
                )}
              </div>
              {qrSrc && (
                <figure className="text-center">
                  {/* eslint-disable-next-line @next/next/no-img-element -- data URL generated in the browser */}
                  <img src={qrSrc} alt={`UPI QR code to pay ${inr(m.balance)} for invoice ${number}`} width={96} height={96} className="size-24 border border-graphite/30" />
                  <figcaption className="mt-1 text-[8px] uppercase tracking-[0.14em] text-blueprint">
                    Scan to pay {inr(m.balance)}
                  </figcaption>
                </figure>
              )}
            </section>
          )}

          {/* terms + signatory */}
          <section className="mt-6 grid break-inside-avoid grid-cols-[1fr_62mm] items-end gap-6 text-[10px]">
            <div>
              <Cap>Terms &amp; conditions</Cap>
              <p className="whitespace-pre-line leading-relaxed text-charcoal">{settings.invoiceTerms || "Payment due as per the due date above."}</p>
              <p className="mt-2 text-[9px] text-blueprint">This is a computer-generated invoice.</p>
            </div>
            <div className="text-center">
              <p className="text-[10px]">
                For <span className="font-bold">{settings.legalName}</span>
              </p>
              <div className="h-14" />
              <div className="border-t border-graphite pt-1">
                <p className="text-[11px] font-bold">{settings.signatoryName || "Authorised signatory"}</p>
                <p className="text-[9px] text-charcoal">{settings.signatoryTitle || "Authorised signatory"}</p>
              </div>
            </div>
          </section>
        </div>
        <PrintFooter note={number} />
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

function TotalRow({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1 text-charcoal">
      <dt>{k}</dt>
      <dd className="tabular text-graphite">{v}</dd>
    </div>
  );
}
