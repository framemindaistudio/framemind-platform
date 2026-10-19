import type { Metadata } from "next";
import { requireUser } from "@/lib/hq/auth";
import { STAFF } from "@/lib/hq/roles";
import { ToolsApp } from "@/components/hq/studio/StudioApps";

export const metadata: Metadata = { title: "Tools & Vendors" };

type Params = Record<string, string | string[] | undefined>;

export default async function ToolsPage({ searchParams }: { searchParams: Promise<Params> }) {
  await requireUser(STAFF);
  const { tab } = await searchParams;
  return <ToolsApp initialTab={Array.isArray(tab) ? tab[0] : tab} />;
}
