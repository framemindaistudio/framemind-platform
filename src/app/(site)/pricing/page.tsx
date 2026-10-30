import Pricing from "@/site/pages/Pricing";
import { publicGstOn, publicRateCard } from "@/site/rates";
import { pageMetadata } from "@/site/seo";

export const metadata = pageMetadata("/pricing");

/** A cached page with HQ's prices; saving the rate card in HQ refreshes it (see src/site/rates.ts). */
export const dynamic = "force-static";
export const revalidate = 600;

export default async function Page() {
  const [card, gstOn] = await Promise.all([publicRateCard(), publicGstOn()]);
  return <Pricing gstOn={gstOn} rates={card && { services: card.services, socialContracts: card.socialContracts, bundleSteps: card.bundleSteps }} />;
}
