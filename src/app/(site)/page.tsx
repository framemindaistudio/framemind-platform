import Home from "@/site/pages/Home";
import { pageMetadata } from "@/site/seo";

export const metadata = pageMetadata("/");

export default function Page() {
  return <Home />;
}
