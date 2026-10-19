import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "FrameMind HQ",
    short_name: "FrameMind HQ",
    description: "FrameMind AI Studio · internal operations",
    start_url: "/hq",
    display: "standalone",
    background_color: "#F5F4F0",
    theme_color: "#0D0D0D",
    icons: [
      { src: "/brand/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/brand/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
