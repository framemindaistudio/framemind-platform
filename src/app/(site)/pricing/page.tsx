import Pricing, { type PublicRates } from "@/site/pages/Pricing";
import { readPriceBook } from "@/lib/hq/pricebook";
import { pageMetadata } from "@/site/seo";

export const metadata = pageMetadata("/pricing");

/** Rebuilt at most every 10 minutes, and at once when HQ saves the rate card (revalidatePath in /api/hq/pricebook). */
export const revalidate = 600;

/** The prices HQ's Rate Card holds, or null to show the published price list when the data repository cannot be read. */
async function publicRates(): Promise<PublicRates | null> {
  try {
    const { book, exists } = await readPriceBook();
    if (!exists) return null;
    const { services, socialContracts, bundleSteps } = book.rates;
    return { services, socialContracts, bundleSteps };
  } catch (e) {
    console.error("[pricing] could not read the rate card, showing the published prices:", e instanceof Error ? e.message : e);
    return null;
  }
}

export default async function Page() {
  return <Pricing rates={await publicRates()} />;
}
