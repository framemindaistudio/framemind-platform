import type { Metadata } from "next";
import { requireUser } from "@/lib/hq/auth";
import { SALES_SIDE } from "@/lib/hq/roles";
import { ProposalList } from "@/components/hq/sales/ProposalList";

export const metadata: Metadata = { title: "Quotes" };

export default async function QuotesPage() {
  await requireUser(SALES_SIDE);
  return <ProposalList />;
}
