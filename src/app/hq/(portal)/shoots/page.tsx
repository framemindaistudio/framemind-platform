import type { Metadata } from "next";
import { Suspense } from "react";
import { requireUser } from "@/lib/hq/auth";
import { STAFF } from "@/lib/hq/roles";
import { ShootsHome } from "@/components/hq/shoots/ShootsHome";

export const metadata: Metadata = { title: "Shoots" };

export default async function ShootsPage() {
  await requireUser(STAFF);
  return (
    <Suspense>
      <ShootsHome />
    </Suspense>
  );
}
