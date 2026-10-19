import type { Metadata } from "next";
import { requireUser } from "@/lib/hq/auth";
import { LEADERSHIP } from "@/lib/hq/roles";
import { SignPrint } from "@/components/hq/sign/SignPrint";

export const metadata: Metadata = { title: "Documents to sign" };

type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
/** ids and template names are short words: anything else in the address is dropped */
const list = (v: string | string[] | undefined) =>
  one(v)
    .split(",")
    .map((s) => s.trim())
    .filter((s) => /^[\w-]{1,80}$/.test(s))
    .slice(0, 60);

/**
 * /hq/print/sign?ids=sgn_a,sgn_b   saved documents, one after the other (a single paper, or a person's pack)
 *               ?blank=offer-letter[,…]&copies=20   templates with nothing filled in
 * Founders and admins only: an offer letter carries pay, an agreement the terms agreed with a client.
 */
export default async function SignPrintPage({ searchParams }: { searchParams: Promise<SP> }) {
  await requireUser(LEADERSHIP);
  const sp = await searchParams;
  const copies = Math.min(60, Math.max(1, Math.round(Number(one(sp.copies))) || 1));
  const tab = /^[a-z]{1,12}$/.test(one(sp.tab)) ? one(sp.tab) : "";
  return <SignPrint ids={list(sp.ids)} blank={list(sp.blank)} copies={copies} back={tab ? `/hq/sign?tab=${tab}` : "/hq/sign"} />;
}
