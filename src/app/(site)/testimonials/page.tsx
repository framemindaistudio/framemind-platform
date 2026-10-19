import Testimonials from "@/site/pages/Testimonials";
import { pageMetadata } from "@/site/seo";

export const metadata = pageMetadata("/testimonials");

export default function Page() {
  return <Testimonials />;
}
