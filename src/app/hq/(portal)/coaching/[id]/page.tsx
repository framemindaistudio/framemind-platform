import type { Metadata } from "next";
import { requireUser } from "@/lib/hq/auth";
import { DELIVERY_SIDE } from "@/lib/hq/roles";
import { LearnerDetail } from "@/components/hq/coaching/LearnerDetail";

export const metadata: Metadata = { title: "Learner" };

export default async function LearnerPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser(DELIVERY_SIDE);
  const { id } = await params;
  return <LearnerDetail id={id} />;
}
