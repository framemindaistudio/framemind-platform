import RealEstate from "@/site/pages/RealEstate";
import { publicRateCard } from "@/site/rates";
import { pageMetadata } from "@/site/seo";

export const metadata = pageMetadata("/real-estate");

/** A cached page with HQ's real estate prices; saving the rate card in HQ refreshes it (see src/site/rates.ts). */
export const dynamic = "force-static";
export const revalidate = 86400;

export default async function Page() {
  const card = await publicRateCard();
  return <RealEstate rates={card?.realEstate} />;
}
