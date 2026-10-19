import type { Metadata } from "next";
import { requireUser } from "@/lib/hq/auth";
import { SALES_SIDE } from "@/lib/hq/roles";
import { ProposalBuilder } from "@/components/hq/sales/ProposalBuilder";

export const metadata: Metadata = { title: "New quote" };

export default async function NewQuotePage({ searchParams }: { searchParams: Promise<{ client?: string | string[]; lead?: string | string[] }> }) {
  await requireUser(SALES_SIDE);
  const { client, lead } = await searchParams;
  return <ProposalBuilder clientId={Array.isArray(client) ? client[0] : client} leadId={Array.isArray(lead) ? lead[0] : lead} />;
}
