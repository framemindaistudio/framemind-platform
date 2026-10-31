import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

/** Every public page, with the priorities the Figma site's sitemap gave them. */
const PAGES: { path: string; priority: number; changeFrequency: "weekly" | "monthly" }[] = [
  { path: "", priority: 1, changeFrequency: "weekly" },
  { path: "/pricing", priority: 0.9, changeFrequency: "monthly" },
  { path: "/connect", priority: 0.9, changeFrequency: "monthly" },
  { path: "/vritta", priority: 0.8, changeFrequency: "monthly" },
  { path: "/personal-coaching", priority: 0.8, changeFrequency: "monthly" },
  { path: "/testimonials", priority: 0.7, changeFrequency: "monthly" },
  { path: "/team", priority: 0.6, changeFrequency: "monthly" },
  { path: "/careers", priority: 0.6, changeFrequency: "monthly" },
  { path: "/jove", priority: 0.6, changeFrequency: "monthly" },
  { path: "/360vue", priority: 0.6, changeFrequency: "monthly" },
  { path: "/shop", priority: 0.5, changeFrequency: "monthly" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  return PAGES.map((p) => ({ url: `${site.url}${p.path}`, changeFrequency: p.changeFrequency, priority: p.priority }));
}
