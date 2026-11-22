import type { MetadataRoute } from "next";
import { site } from "@/lib/site";
import { INDUSTRIES } from "@/lib/content/industries";
import { publicShop } from "@/site/shop";

/** Every public page, with the priorities the Figma site's sitemap gave them. */
const PAGES: { path: string; priority: number; changeFrequency: "weekly" | "monthly" }[] = [
  { path: "", priority: 1, changeFrequency: "weekly" },
  { path: "/pricing", priority: 0.9, changeFrequency: "monthly" },
  { path: "/packaging", priority: 0.85, changeFrequency: "monthly" },
  { path: "/connect", priority: 0.9, changeFrequency: "monthly" },
  { path: "/vritta", priority: 0.8, changeFrequency: "monthly" },
  { path: "/personal-coaching", priority: 0.8, changeFrequency: "monthly" },
  { path: "/testimonials", priority: 0.7, changeFrequency: "monthly" },
  { path: "/team", priority: 0.6, changeFrequency: "monthly" },
  { path: "/careers", priority: 0.6, changeFrequency: "monthly" },
  { path: "/industries", priority: 0.9, changeFrequency: "monthly" },
  ...INDUSTRIES.map((i) => ({ path: `/industries/${i.slug}`, priority: 0.8, changeFrequency: "monthly" as const })),
  { path: "/real-estate", priority: 0.8, changeFrequency: "monthly" },
  { path: "/shop", priority: 0.8, changeFrequency: "weekly" },
  { path: "/shop/terms", priority: 0.3, changeFrequency: "monthly" },
  { path: "/privacy", priority: 0.3, changeFrequency: "monthly" },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // store products (from the cached catalogue, so the sitemap costs no extra GitHub read)
  const products = (await publicShop()).products.map((p) => ({ path: `/shop/${p.slug}`, priority: 0.7, changeFrequency: "weekly" as const }));
  return [...PAGES, ...products].map((p) => ({ url: `${site.url}${p.path}`, changeFrequency: p.changeFrequency, priority: p.priority }));
}
