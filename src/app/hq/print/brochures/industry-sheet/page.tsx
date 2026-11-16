import type { Metadata } from "next";
import { IndustryPosters } from "@/components/hq/printables/brochures/IndustryPosters";

export const metadata: Metadata = { title: "All industries · A3 QR sheet" };

/** One A3 sheet with every industry app, its brand and a QR code (HQ → Printables). */
export default function Page() {
  return <IndustryPosters q={{ kind: "sheet" }} />;
}
