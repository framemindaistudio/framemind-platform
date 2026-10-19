import type { Metadata } from "next";
import { requireUser } from "@/lib/hq/auth";
import { OPS } from "@/lib/hq/roles";
import { RateCardApp } from "@/components/hq/prices/RateCardApp";

export const metadata: Metadata = { title: "Rate Card" };

/** /hq/prices: the rate card. Founders edit; the roles that see Finance can read. */
export default async function PricesPage() {
  await requireUser(OPS);
  return <RateCardApp />;
}
