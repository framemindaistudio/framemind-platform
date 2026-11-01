import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PricingBooklet } from "@/components/hq/printables/booklets/PricingBooklet";
import { StudioBooklet } from "@/components/hq/printables/booklets/StudioBooklet";
import { flatten, type SearchParams } from "@/components/hq/printables/util";

const BOOKLETS = { pricing: PricingBooklet, studio: StudioBooklet };
type Kind = keyof typeof BOOKLETS;

export async function generateMetadata({ params }: { params: Promise<{ kind: string }> }): Promise<Metadata> {
  const { kind } = await params;
  return { title: kind === "studio" ? "Studio profile booklet" : "Pricing booklet" };
}

/** /hq/print/brochures/booklet/<pricing|studio>?mode=print|read&for=… — folded A4 booklets. */
export default async function Page({ params, searchParams }: { params: Promise<{ kind: string }>; searchParams: Promise<SearchParams> }) {
  const { kind } = await params;
  if (!(kind in BOOKLETS)) notFound();
  const q = flatten(await searchParams);
  const Booklet = BOOKLETS[kind as Kind];
  return <Booklet mode={q.mode === "read" ? "read" : "print"} preparedFor={(q.for ?? "").trim().slice(0, 80) || undefined} />;
}
