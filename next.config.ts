import type { NextConfig } from "next";

/**
 * FrameMind HQ is the studio's internal portal only: every page lives under /hq (plus /papers/<token> for papers
 * sent to sign and /verify for certificates). Prices are read at request time from the private data repository
 * (data/ratecard.json), so nothing is baked into the build.
 */
const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [60, 75, 85, 90],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
          { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=()" },
        ],
      },
      { source: "/hq/:path*", headers: [{ key: "Referrer-Policy", value: "strict-origin" }] },
      { source: "/papers/:token", headers: [{ key: "Referrer-Policy", value: "no-referrer" }] },
      { source: "/verify/:code", headers: [{ key: "Referrer-Policy", value: "strict-origin" }] },
    ];
  },
};

export default nextConfig;
