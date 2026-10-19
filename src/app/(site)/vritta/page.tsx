import Vritta from "@/site/pages/Vritta";
import { publicRateCard } from "@/site/rates";
import { pageMetadata } from "@/site/seo";

export const metadata = pageMetadata("/vritta");

/** A cached page with HQ's Vritta prices; saving the rate card in HQ refreshes it (see src/site/rates.ts). */
export const dynamic = "force-static";
export const revalidate = 600;

export default async function Page() {
  const card = await publicRateCard();
  return <Vritta rates={card && { vritta: card.vritta }} />;
}
