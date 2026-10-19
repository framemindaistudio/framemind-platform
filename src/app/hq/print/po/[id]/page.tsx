import type { Metadata } from "next";
import { requireUser } from "@/lib/hq/auth";
import { OPS } from "@/lib/hq/roles";
import { PoPrint } from "@/components/hq/studio/PoPrint";

export const metadata: Metadata = { title: "Purchase order", robots: { index: false, follow: false } };

export default async function PoPrintPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser(OPS);
  const { id } = await params;
  return <PoPrint id={id} />;
}
