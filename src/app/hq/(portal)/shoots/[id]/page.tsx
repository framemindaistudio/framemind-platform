import type { Metadata } from "next";
import { requireUser } from "@/lib/hq/auth";
import { STAFF } from "@/lib/hq/roles";
import { ShootDetail } from "@/components/hq/shoots/ShootDetail";

export const metadata: Metadata = { title: "Shoot" };

export default async function ShootPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser(STAFF);
  const { id } = await params;
  return <ShootDetail id={id} />;
}
