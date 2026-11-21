import "server-only";
import { unstable_cache } from "next/cache";
import { listRecords } from "@/lib/hq/records";

/** The cache tag HQ expires when the Team collection or a profile photo is saved. */
export const TEAM_TAG = "public-team";

export interface PublicMember {
  id: string;
  name: string;
  role: string;
  bio: string;
  photo: string;
}

/**
 * The people on the website's team section: only HQ team members a founder has marked "Show on the website",
 * who are active or onboarding. Only name, role, website bio and photo leave HQ. Empty if HQ can't be read.
 */
export const publicTeam = unstable_cache(
  async (): Promise<PublicMember[]> => {
    try {
      const all = await listRecords("team");
      const order = (role: string) => (/founder/i.test(role) ? 0 : 1);
      return all
        .filter((m) => m.showOnWebsite === true && m.status !== "inactive" && String(m.name ?? "").trim())
        .map((m) => ({
          id: String(m.id),
          name: String(m.name),
          role: String(m.role ?? ""),
          bio: String(m.websiteBio ?? ""),
          photo: m.photo ? `/api/site/team-photo/${encodeURIComponent(String(m.id))}?v=${encodeURIComponent(String(m.photoUpdatedAt ?? ""))}` : "",
        }))
        .sort((a, b) => order(a.role) - order(b.role) || a.name.localeCompare(b.name));
    } catch (e) {
      console.error("[website team] could not read the team:", e instanceof Error ? e.message : e);
      return [];
    }
  },
  ["public-team"],
  { tags: [TEAM_TAG], revalidate: 86400 },
);
