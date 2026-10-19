import type { Metadata } from "next";
import { requireUser } from "@/lib/hq/auth";
import { DELIVERY_SIDE } from "@/lib/hq/roles";
import { CoachingApp } from "@/components/hq/coaching/CoachingApp";

export const metadata: Metadata = { title: "AI Coaching" };

type Params = Record<string, string | string[] | undefined>;

export default async function CoachingPage({ searchParams }: { searchParams: Promise<Params> }) {
  await requireUser(DELIVERY_SIDE);
  const { learner } = await searchParams;
  return <CoachingApp openLearner={Array.isArray(learner) ? learner[0] : learner} />;
}
