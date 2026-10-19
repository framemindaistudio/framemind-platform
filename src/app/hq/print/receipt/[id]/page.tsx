import type { Metadata } from "next";
import { requireUser } from "@/lib/hq/auth";
import { OPS } from "@/lib/hq/roles";
import { ReceiptPrint } from "@/components/hq/finance/ReceiptPrint";

export const metadata: Metadata = { title: "Payment receipt", robots: { index: false, follow: false } };

/** /hq/print/receipt/<invoice id>[?payment=<payment id>] — one payment, or all payments on the invoice. */
export default async function ReceiptPrintPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ payment?: string | string[] }> }) {
  await requireUser(OPS);
  const { id } = await params;
  const { payment } = await searchParams;
  return <ReceiptPrint id={id} paymentId={Array.isArray(payment) ? payment[0] : payment} />;
}
