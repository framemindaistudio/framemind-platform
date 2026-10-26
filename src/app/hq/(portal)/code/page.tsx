import type { Metadata } from "next";
import { requireUser } from "@/lib/hq/auth";
import { STAFF } from "@/lib/hq/roles";
import { DevHome } from "@/components/hq/dev/DevHome";

export const metadata: Metadata = { title: "Code" };

/** /hq/code — development tasks, review queue and merges across projects. */
export default async function CodePage() {
  await requireUser(STAFF);
  return <DevHome />;
}
