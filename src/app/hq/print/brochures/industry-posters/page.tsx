import type { Metadata } from "next";
import { IndustryPosters } from "@/components/hq/printables/brochures/IndustryPosters";
import { flatten, type SearchParams } from "@/components/hq/printables/util";

export const metadata: Metadata = { title: "Industry QR posters" };

/** One A4 QR poster per industry app, in its brand, no prices (HQ → Printables). */
export default async function Page({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return <IndustryPosters q={{ ...flatten(await searchParams), kind: "qr" }} />;
}
