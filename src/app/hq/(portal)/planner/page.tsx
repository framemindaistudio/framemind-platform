import type { Metadata } from "next";
import { requireUser } from "@/lib/hq/auth";
import { OPS } from "@/lib/hq/roles";
import { PlannerApp } from "@/components/hq/planner/PlannerApp";

export const metadata: Metadata = { title: "Business Planner" };

/** /hq/planner: the founders' cockpit (scenario values are kept in the browser). */
export default async function PlannerPage() {
  await requireUser(OPS);
  return <PlannerApp />;
}
