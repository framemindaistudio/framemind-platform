import { Suspense } from "react";
import Careers from "@/site/pages/Careers";
import { pageMetadata } from "@/site/seo";

export const metadata = pageMetadata("/careers");

export default function Page() {
  // the page reads ?role= from the address, so it renders inside a Suspense boundary
  return (
    <Suspense>
      <Careers />
    </Suspense>
  );
}
