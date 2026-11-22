import Packaging from "@/site/pages/Packaging";
import { pageMetadata } from "@/site/seo";

export const metadata = pageMetadata("/packaging", {
  title: "Packaging Design Studio — Pouches, Cartons, Labels in 3D",
  description: "Packaging design for Indian brands: pouches, cartons, labels, cans, gift boxes and carry bags on real dielines, built in Adobe and shown in 3D before you print. Prices from ₹9,500 per SKU.",
  keywords: "packaging design India, pouch design, label design, carton dieline design, FSSAI label design, product packaging designer, 3D packaging mockup, brand packaging studio",
  ogImageAlt: "FrameMind packaging design: sample brand ranges in 3D",
});

export const dynamic = "force-static";

export default function Page() {
  return <Packaging />;
}
