import Industries from "@/site/pages/Industries";
import { publicRateCard } from "@/site/rates";
import { pageMetadata } from "@/site/seo";

export const metadata = pageMetadata("/industries");

/** A cached page with HQ's industry prices; saving the rate card in HQ refreshes it (see src/site/rates.ts). */
export const dynamic = "force-static";
export const revalidate = 86400;

export default async function Page() {
  const card = await publicRateCard();
  return <Industries rates={card?.industries} />;
}
