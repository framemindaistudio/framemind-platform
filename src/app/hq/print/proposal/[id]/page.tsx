import type { Metadata } from "next";
import { requireUser } from "@/lib/hq/auth";
import { SALES_SIDE } from "@/lib/hq/roles";
import { ProposalPrint } from "@/components/hq/sales/ProposalPrint";

export const metadata: Metadata = { title: "Quote", robots: { index: false, follow: false } };

export default async function QuotePrintPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser(SALES_SIDE);
  const { id } = await params;
  return <ProposalPrint id={id} />;
}
