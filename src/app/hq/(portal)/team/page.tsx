import type { Metadata } from "next";
import { requireUser } from "@/lib/hq/auth";
import { OPS_STUDIO } from "@/lib/hq/roles";
import { TeamApp, type TeamTab } from "@/components/hq/team/TeamApp";

export const metadata: Metadata = { title: "Team & Payroll" };

/** /hq/team  ·  /hq/team?tab=payroll */
export default async function TeamPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireUser(OPS_STUDIO);
  const sp = await searchParams;
  const raw = Array.isArray(sp.tab) ? sp.tab[0] : sp.tab;
  const tab: TeamTab = raw === "payroll" ? "payroll" : "people";
  return <TeamApp initialTab={tab} />;
}
