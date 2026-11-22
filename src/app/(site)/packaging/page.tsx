import Packaging from "@/site/pages/Packaging";
import { pageMetadata } from "@/site/seo";
import { publicRateCard } from "@/site/rates";

export const metadata = pageMetadata("/packaging", {
  title: "Packaging Design Studio — Pouches, Cartons, Labels in 3D",
  description: "Packaging design for Indian brands: pouches, cartons, labels, cans, gift boxes and carry bags on real dielines, built in Adobe and shown in 3D before you print. Priced per SKU, with a quote estimator.",
  keywords: "packaging design India, pouch design, label design, carton dieline design, FSSAI label design, product packaging designer, 3D packaging mockup, brand packaging studio",
  ogImageAlt: "FrameMind packaging design: sample brand ranges in 3D",
});

/** Cached with HQ's rate card; saving the Packaging tab in HQ refreshes it (see src/site/rates.ts). */
export const dynamic = "force-static";
export const revalidate = 86400;

export default async function Page() {
  const card = await publicRateCard();
  return <Packaging rates={card?.packaging ?? null} />;
}
