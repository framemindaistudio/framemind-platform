import type { Metadata } from "next";
import { Suspense } from "react";
import { requireUser } from "@/lib/hq/auth";
import { ALL } from "@/lib/hq/roles";
import { Loading } from "@/components/hq/ui";
import { DocsApp } from "@/components/hq/docs/DocsApp";

export const metadata: Metadata = { title: "Operations Library" };

export default async function DocsPage() {
  await requireUser(ALL);
  return (
    <Suspense fallback={<Loading label="Opening the library…" />}>
      <DocsApp />
    </Suspense>
  );
}
