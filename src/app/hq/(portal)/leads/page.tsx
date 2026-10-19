import type { Metadata } from "next";
import { requireUser } from "@/lib/hq/auth";
import { SALES_SIDE } from "@/lib/hq/roles";
import { LeadsInbox } from "@/components/hq/sales/LeadsInbox";

export const metadata: Metadata = { title: "Enquiries" };

export default async function LeadsPage() {
  await requireUser(SALES_SIDE);
  return <LeadsInbox />;
}
