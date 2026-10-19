import type { Metadata } from "next";
import { requireUser } from "@/lib/hq/auth";
import { STAFF } from "@/lib/hq/roles";
import { GearApp } from "@/components/hq/studio/StudioApps";

export const metadata: Metadata = { title: "Gear & Assets" };

export default async function GearPage() {
  await requireUser(STAFF);
  return <GearApp />;
}
