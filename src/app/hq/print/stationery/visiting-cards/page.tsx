import type { Metadata } from "next";
import { VisitingCards } from "@/components/hq/printables/stationery/VisitingCards";
import { flatten, type SearchParams } from "@/components/hq/printables/util";

export const metadata: Metadata = { title: "Visiting cards" };

/** Printable generated from query-string options chosen in HQ → Printables. */
export default async function Page({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return <VisitingCards q={flatten(await searchParams)} />;
}
