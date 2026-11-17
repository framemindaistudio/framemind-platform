import "server-only";
import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import { readCatalog } from "@/lib/shop/store";
import { DEFAULT_CATALOG } from "@/lib/shop/defaults";
import { publicProducts } from "@/lib/shop/logic";
import type { PublicProduct, ShopCategory } from "@/lib/shop/types";
import { payMode } from "@/lib/shop/razorpay";

/** The cache tag HQ expires when the store catalogue is saved (/api/hq/shop). */
export const SHOP_TAG = "shop-catalog";

export interface PublicShop {
  categories: ShopCategory[];
  products: PublicProduct[];
  /** whether the checkout can take payments at all */
  paymentsOn: boolean;
}

/**
 * The shop as visitors see it: no file paths, no coupons. Read from the data repository once and cached for a day;
 * saving in HQ → Digital Store expires it at once (same pattern as the rate card, to stay inside Vercel Hobby's CPU).
 */
export const publicShop = unstable_cache(
  async (): Promise<PublicShop> => {
    let catalog = DEFAULT_CATALOG;
    try {
      catalog = (await readCatalog()).catalog;
    } catch (e) {
      console.error("[shop] could not read the catalogue, showing the starting one:", e instanceof Error ? e.message : e);
    }
    const categories = catalog.categories.filter((c) => catalog.products.some((p) => p.category === c.id && p.status !== "hidden"));
    return { categories, products: publicProducts(catalog), paymentsOn: payMode() !== "off" };
  },
  ["public-shop"],
  { tags: [SHOP_TAG], revalidate: 86400 },
);

/** Expire the cached shop pages so visitors see a saved change at once (called by the HQ store APIs). */
export function refreshShop() {
  revalidateTag(SHOP_TAG, { expire: 0 });
  revalidatePath("/shop");
  revalidatePath("/shop/[slug]", "page");
  revalidatePath("/sitemap.xml");
}
