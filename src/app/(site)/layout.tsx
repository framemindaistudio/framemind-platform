import SiteShell from "@/site/components/SiteShell";
import { Analytics } from "@/site/components/Analytics";

/** The public website at framemindaistudio.com: every page except /hq, /papers and /verify. */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteShell>{children}</SiteShell>
      <Analytics />
    </>
  );
}
