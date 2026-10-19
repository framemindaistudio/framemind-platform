import type { Metadata } from "next";
import { requireUser } from "@/lib/hq/auth";
import { SALES_SIDE } from "@/lib/hq/roles";
import { CrmBoard } from "@/components/hq/sales/CrmBoard";

export const metadata: Metadata = { title: "Clients CRM" };

export default async function CrmPage({ searchParams }: { searchParams: Promise<{ view?: string | string[] }> }) {
  await requireUser(SALES_SIDE);
  const { view } = await searchParams;
  return <CrmBoard initialView={view === "table" ? "table" : "pipeline"} />;
}
