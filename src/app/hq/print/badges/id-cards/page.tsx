import type { Metadata } from "next";
import { IdCards } from "@/components/hq/printables/badges/IdCards";
import { flatten, type SearchParams } from "@/components/hq/printables/util";

export const metadata: Metadata = { title: "Team ID cards" };

/** Printable generated from query-string options chosen in HQ → Printables. */
export default async function Page({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return <IdCards q={flatten(await searchParams)} />;
}
