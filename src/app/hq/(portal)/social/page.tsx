import type { Metadata } from "next";
import { Suspense } from "react";
import { requireUser } from "@/lib/hq/auth";
import { MEDIA_SIDE } from "@/lib/hq/roles";
import { Loading } from "@/components/hq/ui";
import { SocialStudio } from "@/components/hq/social/SocialStudio";

export const metadata: Metadata = { title: "Social Studio" };

/**
 * /hq/social  ·  ?tab=create|plan|captions|founders|brand  ·  ?d=<a design saved from Create>  ·  ?post=<the planned
 * post that design belongs to>. The studio reads the address itself, so a link inside HQ and the tabs stay in step.
 */
export default async function SocialPage() {
  await requireUser(MEDIA_SIDE);
  return (
    <Suspense fallback={<Loading label="Opening Social Studio…" />}>
      <SocialStudio />
    </Suspense>
  );
}
