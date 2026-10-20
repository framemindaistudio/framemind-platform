import type { Metadata } from "next";
import { requireUser } from "@/lib/hq/auth";
import { STAFF } from "@/lib/hq/roles";
import { MyIncentives } from "@/components/hq/incentives/MyIncentives";

export const metadata: Metadata = { title: "My incentives" };

/** /hq/my-incentives — each team member's own leads, statements and reviews. */
export default async function MyIncentivesPage() {
  await requireUser(STAFF);
  return <MyIncentives />;
}
