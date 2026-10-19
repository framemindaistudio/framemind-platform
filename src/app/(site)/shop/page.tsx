import Shop from "@/site/pages/Shop";
import { pageMetadata } from "@/site/seo";

export const metadata = pageMetadata("/shop");

export default function Page() {
  return <Shop />;
}
