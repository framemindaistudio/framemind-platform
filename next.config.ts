import type { NextConfig } from "next";

/**
 * One deployment, two websites: the public studio site at / and FrameMind HQ at /hq (plus /papers/<token> for papers
 * sent to sign and /verify for certificates). Only the public site is for search engines. HQ reads prices at request
 * time from the private data repository (data/ratecard.json), so nothing is baked into the build.
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
          { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=()" },
        ],
      },
      { source: "/hq/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }, { key: "Referrer-Policy", value: "strict-origin" }] },
      { source: "/api/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] },
      { source: "/papers/:token", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }, { key: "Referrer-Policy", value: "no-referrer" }] },
      { source: "/verify/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }, { key: "Referrer-Policy", value: "strict-origin" }] },
      { source: "/site/:file*", headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }] },
      // the industry app demos (public/demos/<name>): made-up data, so kept out of search results
      { source: "/demos/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] },
      { source: "/demos/:app/_next/static/:file*", headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }] },
      // the FrameMind <Name>OS demo apps (public/apps/<id>, built from D:\FrameMind-Apps): sample data, so kept out of search
      { source: "/apps/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] },
      { source: "/apps/:app/_next/static/:file*", headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }] },
    ];
  },
  /**
   * The industry app demos are static exports in public/demos/<name>/, one folder per page with an index.html. A page
   * address (/demos/clinic/book) has no file of its own, so it is served that folder's index.html. Files that exist
   * (scripts, styles, pictures) are served first, before these rules are looked at.
   */
  async rewrites() {
    return {
      beforeFiles: [],
      afterFiles: [
        { source: "/demos/:app", destination: "/demos/:app/index.html" },
        { source: "/demos/:app/:path*", destination: "/demos/:app/:path*/index.html" },
        // same for the OS apps: static exports in public/apps/<id>/ (scripts/publish-app.sh <id> puts them there)
        { source: "/apps/:app", destination: "/apps/:app/index.html" },
        { source: "/apps/:app/:path*", destination: "/apps/:app/:path*/index.html" },
      ],
      fallback: [],
    };
  },
};

export default nextConfig;
