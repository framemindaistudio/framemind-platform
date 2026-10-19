import type { Metadata } from "next";
import { requireUser } from "@/lib/hq/auth";
import { STAFF } from "@/lib/hq/roles";
import { TravelHome } from "@/components/hq/travel/TravelHome";

export const metadata: Metadata = { title: "Travel" };

export default async function TravelPage() {
  await requireUser(STAFF);
  return <TravelHome />;
}
