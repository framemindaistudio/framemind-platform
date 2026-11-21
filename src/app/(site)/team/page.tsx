import Team from "@/site/pages/Team";
import { pageMetadata } from "@/site/seo";
import { publicTeam } from "@/site/team";

export const metadata = pageMetadata("/team");

/** Cached; saving the Team in HQ (or a profile photo) refreshes it (src/site/team.ts). */
export const dynamic = "force-static";
export const revalidate = 86400;

export default async function Page() {
  const team = await publicTeam().catch(() => []);
  return <Team team={team} />;
}
