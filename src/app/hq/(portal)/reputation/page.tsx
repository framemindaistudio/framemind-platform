import type { Metadata } from "next";
import { requireUser } from "@/lib/hq/auth";
import { MEDIA_SIDE } from "@/lib/hq/roles";
import { ReputationApp } from "@/components/hq/reputation/ReputationApp";

export const metadata: Metadata = { title: "Feedback & Testimonials" };

type Params = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/** /hq/reputation  ·  ?tab=feedback|testimonials|case-studies */
export default async function ReputationPage({ searchParams }: { searchParams: Promise<Params> }) {
  await requireUser(MEDIA_SIDE);
  const sp = await searchParams;
  return <ReputationApp initialTab={one(sp.tab)} />;
}
