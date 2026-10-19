import type { Metadata } from "next";
import { requireUser } from "@/lib/hq/auth";
import { SALES_SIDE } from "@/lib/hq/roles";
import { VrittaApp } from "@/components/hq/vritta/VrittaApp";

export const metadata: Metadata = { title: "Vritta" };

export default async function VrittaPage() {
  await requireUser(SALES_SIDE);
  return <VrittaApp />;
}
