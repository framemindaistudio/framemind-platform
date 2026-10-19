import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { deckById } from "@/lib/decks";
import { DeckPrint } from "@/components/hq/decks/DeckPrint";

export const metadata: Metadata = { title: "Presentation PDF" };

type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

/** /hq/print/deck/<deck>?client=…  ·  &notes=1: one slide per A4 page with the speaker notes, to rehearse from. */
export default async function DeckPrintPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<SP> }) {
  const { id } = await params;
  if (!deckById(id)) notFound();
  const sp = await searchParams;
  return <DeckPrint id={id} client={one(sp.client).slice(0, 80) || undefined} withNotes={one(sp.notes) === "1"} />;
}
