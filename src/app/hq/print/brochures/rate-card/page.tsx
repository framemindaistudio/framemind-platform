import type { Metadata } from "next";
import { RateCardDoc } from "@/components/hq/printables/brochures/RateCardDoc";
import { flatten, type SearchParams } from "@/components/hq/printables/util";

export const metadata: Metadata = { title: "Rate card" };

/** Printable generated from query-string options chosen in HQ → Printables. */
export default async function Page({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return <RateCardDoc q={flatten(await searchParams)} />;
}
