import "server-only";
import { unstable_cache } from "next/cache";
import { readPriceBook } from "@/lib/hq/pricebook";
import type { RateCard } from "@/lib/pricebook/types";

/** The cache tag HQ expires when the rate card is saved (/api/hq/pricebook). */
export const RATECARD_TAG = "ratecard";

/**
 * The prices the public pages show: the services, contract discounts, bundle steps and Vritta fees of HQ's rate card.
 * Read from the private data repository once and cached, so visitors never wait on (or use up) the GitHub API; saving
 * the rate card in HQ expires it at once, and it refreshes by itself every 10 minutes. Costs, margins, coaching fees
 * and the business plan are never part of it. Null when no rate card is saved or the repository cannot be read: the
 * pages then show the published price list.
 */
export const publicRateCard = unstable_cache(
  async (): Promise<Pick<RateCard, "services" | "socialContracts" | "bundleSteps" | "vritta"> | null> => {
    try {
      const { book, exists } = await readPriceBook();
      if (!exists) return null;
      const { services, socialContracts, bundleSteps, vritta } = book.rates;
      return { services, socialContracts, bundleSteps, vritta };
    } catch (e) {
      console.error("[website prices] could not read the rate card, showing the published prices:", e instanceof Error ? e.message : e);
      return null;
    }
  },
  ["public-ratecard"],
  { tags: [RATECARD_TAG], revalidate: 600 },
);
