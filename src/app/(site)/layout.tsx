import { Spline_Sans } from "next/font/google";
import SiteShell from "@/site/components/SiteShell";
import { Analytics } from "@/site/components/Analytics";

/** The website's typeface. HQ keeps DM Sans; only the public site uses Spline Sans. */
const spline = Spline_Sans({ variable: "--font-spline", subsets: ["latin"], display: "swap" });

/** The public website at framemindaistudio.com: every page except /hq, /papers and /verify. */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={spline.variable}>
      <SiteShell>{children}</SiteShell>
      <Analytics />
    </div>
  );
}
