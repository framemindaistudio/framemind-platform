import type { Metadata } from "next";
import { requireUser } from "@/lib/hq/auth";
import { STAFF } from "@/lib/hq/roles";
import { FilesApp } from "@/components/hq/docs/FilesApp";

export const metadata: Metadata = { title: "File Vault" };

export default async function FilesPage() {
  await requireUser(STAFF);
  return <FilesApp />;
}
