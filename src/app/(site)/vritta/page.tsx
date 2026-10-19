import Vritta, { type VrittaRates } from "@/site/pages/Vritta";
import { readPriceBook } from "@/lib/hq/pricebook";
import { pageMetadata } from "@/site/seo";

export const metadata = pageMetadata("/vritta");

/** Rebuilt at most every 10 minutes, and at once when HQ saves the rate card (revalidatePath in /api/hq/pricebook). */
export const revalidate = 600;

/** Vritta's prices from HQ's Rate Card, or null to show the published prices when the data repository cannot be read. */
async function vrittaRates(): Promise<VrittaRates | null> {
  try {
    const { book, exists } = await readPriceBook();
    return exists ? { vritta: book.rates.vritta } : null;
  } catch (e) {
    console.error("[vritta] could not read the rate card, showing the published prices:", e instanceof Error ? e.message : e);
    return null;
  }
}

export default async function Page() {
  return <Vritta rates={await vrittaRates()} />;
}
