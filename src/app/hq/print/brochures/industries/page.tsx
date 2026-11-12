import type { Metadata } from "next";
import { IndustryFlyers } from "@/components/hq/printables/brochures/IndustryFlyers";
import { flatten, type SearchParams } from "@/components/hq/printables/util";

export const metadata: Metadata = { title: "Industry app flyers" };

/** Printable generated from query-string options chosen in HQ → Printables. */
export default async function Page({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return <IndustryFlyers q={flatten(await searchParams)} />;
}
