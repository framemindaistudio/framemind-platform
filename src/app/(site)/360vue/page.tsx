import Vue360 from "@/site/pages/Vue360";
import { pageMetadata } from "@/site/seo";

export const metadata = pageMetadata("/360vue");

export default function Page() {
  return <Vue360 />;
}
