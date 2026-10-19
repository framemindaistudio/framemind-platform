import type { Metadata } from "next";
import { requireUser } from "@/lib/hq/auth";
import { OPS } from "@/lib/hq/roles";
import { InvoicePrint } from "@/components/hq/finance/InvoicePrint";

export const metadata: Metadata = { title: "Tax invoice", robots: { index: false, follow: false } };

export default async function InvoicePrintPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser(OPS);
  const { id } = await params;
  return <InvoicePrint id={id} />;
}
