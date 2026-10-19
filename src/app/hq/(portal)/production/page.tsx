import type { Metadata } from "next";
import { requireUser } from "@/lib/hq/auth";
import { ProductionApp } from "@/components/hq/production/ProductionApp";

export const metadata: Metadata = { title: "Production" };

type Params = Record<string, string | string[] | undefined>;

export default async function ProductionPage({ searchParams }: { searchParams: Promise<Params> }) {
  await requireUser();
  const { project } = await searchParams;
  return <ProductionApp initialProject={Array.isArray(project) ? project[0] : project} />;
}
