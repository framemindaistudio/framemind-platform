import type { MetadataRoute } from "next";

/** FrameMind HQ is an internal portal: nothing here is for search engines. */
export default function robots(): MetadataRoute.Robots {
  return { rules: [{ userAgent: "*", disallow: "/" }] };
}
