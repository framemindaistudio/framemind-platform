import type { Metadata } from "next";
import { Suspense } from "react";
import { requireUser } from "@/lib/hq/auth";
import { LEADERSHIP } from "@/lib/hq/roles";
import { Loading } from "@/components/hq/ui";
import { SignDesk } from "@/components/hq/sign/SignDesk";

export const metadata: Metadata = { title: "Documents to Sign" };

/**
 * /hq/sign  ·  ?tab=team|clients|others|all|templates  ·  &doc=<id> opens one paper
 * Founders and admins only: offer letters carry pay, and agreements carry the terms agreed with a client.
 */
export default async function SignPage() {
  await requireUser(LEADERSHIP);
  return (
    <Suspense fallback={<Loading label="Opening Documents to Sign…" />}>
      <SignDesk />
    </Suspense>
  );
}
