import type { Metadata } from "next";
import { requireUser } from "@/lib/hq/auth";
import { LEADERSHIP } from "@/lib/hq/roles";
import { ActivityLog } from "./ActivityLog";

export const metadata: Metadata = { title: "Activity Log" };

/** Timeline of every saved change, read from the repository's commit history. It names invoices, payslips and uploads, so it is for leadership. */
export default async function ActivityPage() {
  await requireUser(LEADERSHIP);
  return <ActivityLog />;
}
