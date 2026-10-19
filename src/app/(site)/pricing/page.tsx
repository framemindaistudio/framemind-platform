import Pricing from "@/site/pages/Pricing";
import { publicRateCard } from "@/site/rates";
import { pageMetadata } from "@/site/seo";

export const metadata = pageMetadata("/pricing");

/** A cached page with HQ's prices; saving the rate card in HQ refreshes it (see src/site/rates.ts). */
export const dynamic = "force-static";
export const revalidate = 600;

export default async function Page() {
  const card = await publicRateCard();
  return <Pricing rates={card && { services: card.services, socialContracts: card.socialContracts, bundleSteps: card.bundleSteps }} />;
}
