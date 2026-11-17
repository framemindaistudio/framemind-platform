import type { Metadata } from "next";
import { requireUser } from "@/lib/hq/auth";
import { OPS } from "@/lib/hq/roles";
import { StoreApp } from "@/components/hq/shop/StoreApp";

export const metadata: Metadata = { title: "Digital Store" };

/** /hq/shop: the FrameMind Store's products, files, coupons and orders. Founders edit; Finance roles can read. */
export default async function ShopPage() {
  await requireUser(OPS);
  return <StoreApp />;
}
