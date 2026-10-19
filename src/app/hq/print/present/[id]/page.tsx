import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { deckById } from "@/lib/decks";
import { Presenter } from "@/components/hq/decks/Presenter";

export const metadata: Metadata = { title: "Presenting" };

type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

/** /hq/print/present/<deck>?client=…  ·  &audience=1 for the projector window that follows the presenter. */
export default async function PresentPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<SP> }) {
  const { id } = await params;
  if (!deckById(id)) notFound();
  const sp = await searchParams;
  const client = one(sp.client).slice(0, 80);
  return <Presenter id={id} client={client || undefined} audience={one(sp.audience) === "1"} />;
}
