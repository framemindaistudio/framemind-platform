"use client";

import Link from "next/link";
import { Pencil } from "lucide-react";
import { A4Page, Letterhead, PrintFooter, PrintShell } from "@/components/print/PrintShell";
import { lineItemsTotal, type LineItem } from "@/lib/hq/collections";
import type { CompanySettings } from "@/lib/hq/settings";
import { useCollection, useSettings } from "@/components/hq/data";
import { amountInWords, formatDate, formatINR } from "@/lib/utils";
import { num, str, type Rec } from "@/components/hq/projects/logic";
import { DocMessage } from "./DocMessage";

const BACK = "/hq/tools?tab=purchases";
const inr = (v: number) => formatINR(v, { decimals: true });

export function PoPrint({ id }: { id: string }) {
  const pos = useCollection<Rec>("purchases");
  const vendors = useCollection<Rec>("vendors");
  const { settings, loading: settingsLoading } = useSettings();

  if (pos.loading || vendors.loading || settingsLoading) return <DocMessage title="Purchase order" back={BACK} state="loading" noun="purchase order" backLabel="Back to purchase orders" />;
  const po = pos.records.find((r) => r.id === id);
  if (!po) return <DocMessage title="Purchase order" back={BACK} state={pos.error ? "error" : "missing"} noun="purchase order" backLabel="Back to purchase orders" />;
  const vendor = vendors.records.find((v) => v.id === po.vendorId);
  return <Ready po={po} vendor={vendor} settings={settings} />;
}

function Ready({ po, vendor, settings }: { po: Rec; vendor?: Rec; settings: CompanySettings }) {
  const items = (Array.isArray(po.items) ? (po.items as LineItem[]) : []).filter((i) => str(i.description).trim() || num(i.qty));
  const subtotal = lineItemsTotal(items);
  const shipping = num(po.shipping);
  const total = subtotal + shipping;
  const number = str(po.poNumber) || "Draft";
  const status = str(po.status) || "draft";

  const deliverTo = [settings.addressLine1, settings.addressLine2, [settings.city, settings.state, settings.pincode].filter(Boolean).join(", ")].filter(Boolean);
  const vendorLines = [
    str(vendor?.contactName) && `Attn: ${str(vendor?.contactName)}`,
    str(vendor?.city),
    [str(vendor?.phone), str(vendor?.email)].filter(Boolean).join(" · "),
    str(vendor?.website),
    str(vendor?.gstin) && `GSTIN: ${str(vendor?.gstin)}`,
  ].filter(Boolean) as string[];

  const terms = [
    "Supply exactly the items, specifications and quantities listed above. Any substitution needs our written approval before dispatch.",
    "Deliver to the address shown by the expected date and quote this PO number on the delivery challan and invoice.",
    `Send a GST tax invoice${settings.gstin ? ` made out to our GSTIN ${settings.gstin}` : ""}. Rates are as quoted by the vendor; GST is charged as applicable on the vendor's invoice.`,
    `Payment: ${str(vendor?.paymentTerms) || "as agreed with the vendor"}.`,
    "Items that arrive damaged, short or different from this order will be returned for replacement or credit.",
  ];

  const warnings = [
    !vendor && "No vendor is selected on this purchase order — pick one before sending it.",
    !items.length && "This purchase order has no items yet.",
    status === "draft" && "This PO is still a draft. Set the status to “Ordered” when you send it to the vendor.",
    !deliverTo.length && "Your company address is empty — add it in HQ → Settings so the delivery address prints.",
  ].filter(Boolean) as string[];

  return (
    <PrintShell
      title={`Purchase order ${number}`}
      back={`${BACK}&id=${encodeURIComponent(po.id)}`}
      toolbar={
        <Link href={`${BACK}&id=${encodeURIComponent(po.id)}`} className="inline-flex h-8 items-center gap-1.5 rounded px-2.5 text-xs font-semibold hover:bg-graphite/5">
          <Pencil className="size-3.5" aria-hidden /> Edit
        </Link>
      }
    >
      {warnings.length > 0 && (
        <ul className="no-print w-full max-w-[210mm] space-y-1.5">
          {warnings.map((w) => (
            <li key={w} className="rounded border border-warn/30 bg-warn/10 px-3 py-2 text-xs text-graphite">
              {w}
            </li>
          ))}
        </ul>
      )}
      <A4Page>
        <Letterhead
          settings={settings}
          docTitle="Purchase order"
          docMeta={
            <>
              <p className="font-mono text-sm font-bold text-graphite">{number}</p>
              <p>Date: {po.date ? formatDate(str(po.date)) : "—"}</p>
              {po.expectedDate ? <p>Expected by: {formatDate(str(po.expectedDate))}</p> : null}
            </>
          }
        />

        <div className="grid grid-cols-2 gap-6 text-xs">
          <section aria-label="Vendor">
            <p className="annot mb-1.5 text-[9px] text-blueprint">Vendor</p>
            <p className="text-sm font-bold">{str(vendor?.name) || "—"}</p>
            {vendorLines.map((l) => (
              <p key={l} className="mt-0.5 text-charcoal">
                {l}
              </p>
            ))}
          </section>
          <section aria-label="Deliver to">
            <p className="annot mb-1.5 text-[9px] text-blueprint">Deliver to</p>
            <p className="text-sm font-bold">{settings.legalName}</p>
            {deliverTo.map((l) => (
              <p key={l} className="mt-0.5 text-charcoal">
                {l}
              </p>
            ))}
            {settings.phone && <p className="mt-0.5 text-charcoal">{settings.phone}</p>}
            {settings.gstin && <p className="mt-0.5 font-semibold text-charcoal">GSTIN: {settings.gstin}</p>}
          </section>
        </div>

        <table className="mt-7 w-full border-collapse text-xs">
          <caption className="sr-only">Items ordered</caption>
          <thead>
            <tr className="border-y-2 border-graphite text-left">
              <th scope="col" className="w-8 py-2 pr-2 font-semibold">
                #
              </th>
              <th scope="col" className="py-2 pr-2 font-semibold">
                Description
              </th>
              <th scope="col" className="w-16 py-2 pr-2 text-right font-semibold">
                Qty
              </th>
              <th scope="col" className="w-24 py-2 pr-2 text-right font-semibold">
                Rate
              </th>
              <th scope="col" className="w-28 py-2 text-right font-semibold">
                Amount
              </th>
            </tr>
          </thead>
          <tbody>
            {items.length ? (
              items.map((it, i) => (
                <tr key={i} className="break-inside-avoid border-b border-graphite/15">
                  <td className="tabular py-2 pr-2 text-blueprint">{i + 1}</td>
                  <td className="py-2 pr-2">{str(it.description)}</td>
                  <td className="tabular py-2 pr-2 text-right">{num(it.qty)}</td>
                  <td className="tabular py-2 pr-2 text-right">{inr(num(it.rate))}</td>
                  <td className="tabular py-2 text-right font-medium">{inr(num(it.qty) * num(it.rate))}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="py-6 text-center text-blueprint">
                  No items
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* the totals stay together when a long order runs on to a second page */}
        <div className="mt-4 flex break-inside-avoid items-start justify-between gap-8">
          <p className="max-w-[95mm] text-[10px] leading-relaxed text-charcoal">
            <span className="annot mr-1 text-[9px] text-blueprint">Amount in words</span>
            <br />
            <span className="font-semibold text-graphite">{amountInWords(Math.round(total))}</span>
          </p>
          <dl className="w-60 text-xs">
            <div className="flex justify-between border-b border-graphite/15 py-1.5">
              <dt className="text-charcoal">Subtotal</dt>
              <dd className="tabular">{inr(subtotal)}</dd>
            </div>
            <div className="flex justify-between border-b border-graphite/15 py-1.5">
              <dt className="text-charcoal">Shipping</dt>
              <dd className="tabular">{inr(shipping)}</dd>
            </div>
            <div className="flex justify-between border-b-2 border-graphite py-2 text-sm font-bold">
              <dt>Total</dt>
              <dd className="tabular">{inr(total)}</dd>
            </div>
          </dl>
        </div>

        {str(po.notes) && (
          <section className="mt-6 break-inside-avoid text-xs">
            <p className="annot mb-1 text-[9px] text-blueprint">Notes</p>
            <p className="whitespace-pre-line text-charcoal">{str(po.notes)}</p>
          </section>
        )}

        <section className="mt-6 break-inside-avoid text-[10px] leading-relaxed text-charcoal">
          <p className="annot mb-1 text-[9px] text-blueprint">Terms</p>
          <ol className="list-decimal space-y-0.5 pl-4">
            {terms.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ol>
        </section>

        <div className="mt-10 flex justify-end break-inside-avoid">
          <div className="w-56 text-center text-xs">
            <div className="h-14 border-b border-graphite" />
            <p className="mt-1.5 font-semibold">{settings.signatoryName || "Authorised signatory"}</p>
            <p className="text-[10px] text-charcoal">{[settings.signatoryTitle, settings.brandName].filter(Boolean).join(", ")}</p>
          </div>
        </div>

        <PrintFooter note={`PO ${number}`} />
      </A4Page>
    </PrintShell>
  );
}
