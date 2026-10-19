import type { Metadata } from "next";
import { requireUser } from "@/lib/hq/auth";
import { STAFF } from "@/lib/hq/roles";
import { CallSheetPrint } from "@/components/hq/shoots/CallSheetPrint";

export const metadata: Metadata = { title: "Call sheet", robots: { index: false, follow: false } };

export default async function CallSheetPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser(STAFF);
  const { id } = await params;
  return <CallSheetPrint id={id} />;
}
