import type { Metadata } from "next";
import { canReadPath } from "@/lib/hq/access";
import { configuredUsers, requireUser } from "@/lib/hq/auth";
import { hqNav } from "@/lib/hq/nav";
import { roleLabels } from "@/lib/hq/roles";
import { MyAccount } from "@/components/hq/account/MyAccount";

export const metadata: Metadata = { title: "My account" };

/** The HQ guides in the Operations Library; each login is shown only the ones its role may open. */
const GUIDES = [
  { label: "FrameMind HQ Team Guide", path: "OPERATIONS/03_SOP/FrameMind_HQ_Team_Guide.md" },
  { label: "FrameMind HQ User Guide", path: "OPERATIONS/17_IT_SYSTEMS/FrameMind_HQ_User_Guide.md" },
];

/** Every login's own page: who it is, what it can open, and its password. proxy.ts sends a login with a one-time password here. */
export default async function Page() {
  const user = await requireUser();
  const modules = hqNav.flatMap((g) => g.items).filter((i) => i.roles.includes(user.role)).map((i) => i.label);
  const guides = GUIDES.filter((g) => canReadPath(user.role, g.path)).map((g) => ({ label: g.label, href: `/api/hq/docs/raw?path=${encodeURIComponent(g.path)}` }));
  return (
    <MyAccount
      name={user.name}
      username={user.username}
      roleLabel={roleLabels[user.role]}
      modules={modules}
      guides={guides}
      first={!!user.mustChange}
      builtIn={configuredUsers().some((u) => u.username === user.username)}
    />
  );
}
