import type { Metadata } from "next";
import { requireUser } from "@/lib/hq/auth";
import { SALES_SIDE } from "@/lib/hq/roles";
import { ProposalBuilder } from "@/components/hq/sales/ProposalBuilder";

export const metadata: Metadata = { title: "Quote" };

export default async function QuotePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string | string[] }> }) {
  await requireUser(SALES_SIDE);
  const { id } = await params;
  const { created } = await searchParams;
  return <ProposalBuilder id={id} created={!!created} />;
}
