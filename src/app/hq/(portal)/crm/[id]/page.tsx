import type { Metadata } from "next";
import { requireUser } from "@/lib/hq/auth";
import { SALES_SIDE } from "@/lib/hq/roles";
import { ClientDetail } from "@/components/hq/sales/ClientDetail";

export const metadata: Metadata = { title: "Client" };

export default async function ClientPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser(SALES_SIDE);
  const { id } = await params;
  return <ClientDetail id={id} />;
}
