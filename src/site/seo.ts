import type { Metadata } from "next";
import { site } from "@/lib/site";
import { PAGE_SEO } from "./seo-data";

export const SITE_NAME = "FrameMind AI Studio";
/** The link-preview picture (WhatsApp, LinkedIn, X). Raise ?v= when it changes: the apps cache it by its address. */
export const OG_IMAGE = "/og-image.png?v=2";

/**
 * The metadata of one public page, as the Figma site's SEO component wrote it: "<title> | FrameMind AI Studio" (the
 * name is not added twice when the title already carries it).
 */
export function pageMetadata(path: string): Metadata {
  const seo = PAGE_SEO[path];
  const title = seo.title.includes(SITE_NAME) ? seo.title : `${seo.title} | ${SITE_NAME}`;
  const url = `${site.url}${path === "/" ? "" : path}`;
  const image = { url: OG_IMAGE, width: 1200, height: 630, alt: seo.ogImageAlt ?? title };
  return {
    title: { absolute: title },
    description: seo.description,
    keywords: seo.keywords,
    alternates: { canonical: url },
    robots: { index: true, follow: true, "max-snippet": -1, "max-image-preview": "large", "max-video-preview": -1 },
    authors: [{ name: SITE_NAME }],
    openGraph: { title, description: seo.description, type: "website", url, siteName: SITE_NAME, images: [image], locale: "en_IN" },
    twitter: { card: "summary_large_image", title, description: seo.description, images: [image] },
    other: { "geo.region": "IN-KA", "geo.placename": "Gadag, Karnataka, India", "geo.position": "15.4310;75.6215", ICBM: "15.4310, 75.6215" },
  };
}
