import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

/** The public website is for search engines; HQ, papers sent to sign, certificate checks and the APIs are not. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/hq", "/api/", "/papers/", "/verify"] }],
    sitemap: `${site.url}/sitemap.xml`,
    host: site.url,
  };
}
