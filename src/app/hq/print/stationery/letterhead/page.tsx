import type { Metadata } from "next";
import { LetterheadDoc } from "@/components/hq/printables/stationery/LetterheadDoc";
import { flatten, type SearchParams } from "@/components/hq/printables/util";

export const metadata: Metadata = { title: "Letterhead" };

/** Printable generated from query-string options chosen in HQ → Printables. */
export default async function Page({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return <LetterheadDoc q={flatten(await searchParams)} />;
}
