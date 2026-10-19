import type { Metadata } from "next";
import { requireUser } from "@/lib/hq/auth";
import { PrintStudio } from "@/components/hq/printables/PrintStudio";

export const metadata: Metadata = { title: "Printables" };

/** /hq/printables — Print Studio hub: certificates, consent & feedback forms, badges, stationery. */
export default async function PrintablesPage() {
  await requireUser();
  return <PrintStudio />;
}
