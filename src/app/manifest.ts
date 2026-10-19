import type { MetadataRoute } from "next";

/** The public website's manifest (as the Figma site had it). HQ lives at /hq on the same address. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "FrameMind AI Studio",
    short_name: "FrameMind",
    description: "Design, development, and AI solutions for Indian founders and institutions.",
    start_url: "/",
    display: "standalone",
    background_color: "#0D0D0D",
    theme_color: "#0D0D0D",
    lang: "en-IN",
    icons: [
      { src: "/favicon.png", sizes: "any", type: "image/png", purpose: "any" },
      { src: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
      { src: "/brand/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/brand/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
