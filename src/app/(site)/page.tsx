import Home from "@/site/pages/Home";
import { publicRateCard } from "@/site/rates";
import { pageMetadata } from "@/site/seo";
import { publicShop } from "@/site/shop";

export const metadata = pageMetadata("/");

/**
 * A cached page. It shows four store products and the industry apps' starting prices, so saving the store catalogue
 * or the rate card in HQ refreshes it too (both caches are tagged: src/site/shop.ts, src/site/rates.ts).
 */
export const dynamic = "force-static";
export const revalidate = 86400;

export default async function Page() {
  const [shop, card] = await Promise.all([publicShop().catch(() => null), publicRateCard().catch(() => null)]);
  const products = shop?.products ?? [];
  // ones that can be bought today first, featured ones first among those; four at most
  const picked = [...products]
    .filter((p) => p.status !== "hidden")
    .sort((a, b) => Number(b.buyable) - Number(a.buyable) || Number(!!b.featured) - Number(!!a.featured))
    .slice(0, 4);
  return <Home products={picked} rates={card?.industries} />;
}
