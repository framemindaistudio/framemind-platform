import Shop from "@/site/pages/Shop";
import { pageMetadata } from "@/site/seo";
import { publicShop } from "@/site/shop";

export const metadata = pageMetadata("/shop");

/** A cached page; saving the catalogue in HQ → Digital Store refreshes it (see src/site/shop.ts). */
export const dynamic = "force-static";
export const revalidate = 86400;

export default async function Page() {
  return <Shop shop={await publicShop()} />;
}
