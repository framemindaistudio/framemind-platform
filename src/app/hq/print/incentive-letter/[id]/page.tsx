import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/hq/auth";
import { can, LEADERSHIP, STAFF } from "@/lib/hq/roles";
import { readSettings } from "@/lib/hq/records";
import { loadData, memberOf } from "@/lib/incentives/server";
import { IncentiveLetter } from "@/components/hq/incentives/IncentiveLetter";

export const metadata: Metadata = { title: "Incentive letter", robots: { index: false, follow: false } };

/**
 * /hq/print/incentive-letter/<payout id>: the commission or bonus letter. The founder and admins see any;
 * a team member sees only their own — decided here on the server, so a guessed link shows nothing.
 */
export default async function IncentiveLetterPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser(STAFF);
  const { id } = await params;
  const d = await loadData();
  const payout = d.payouts.find((p) => p.id === id);
  if (!payout) notFound();
  const leader = can(user, LEADERSHIP);
  const me = memberOf(user, d.team);
  if (!leader && (!me || me.id !== payout.memberId)) notFound();
  const member = d.team.find((m) => m.id === payout.memberId);
  const { settings } = await readSettings();
  return (
    <IncentiveLetter
      payout={JSON.parse(JSON.stringify(payout))}
      member={{ name: String(member?.name ?? payout.memberName ?? ""), role: String(member?.role ?? "") }}
      settings={settings}
      back={leader ? "/hq/incentives?tab=payouts" : "/hq/my-incentives"}
    />
  );
}
