import type { Metadata } from "next";
import { requireUser } from "@/lib/hq/auth";
import { LEADERSHIP } from "@/lib/hq/roles";
import { IncentivesApp, type IncentivesTab } from "@/components/hq/incentives/IncentivesApp";

export const metadata: Metadata = { title: "Team incentives" };

const TABS: IncentivesTab[] = ["home", "leads", "payouts", "reviews", "policy", "audit"];

/** /hq/incentives?tab=home|leads|payouts|reviews|policy|audit — founder and admin only. */
export default async function IncentivesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireUser(LEADERSHIP);
  const tab = (await searchParams).tab;
  const t = (Array.isArray(tab) ? tab[0] : tab) as IncentivesTab;
  return <IncentivesApp initialTab={TABS.includes(t) ? t : "home"} />;
}
