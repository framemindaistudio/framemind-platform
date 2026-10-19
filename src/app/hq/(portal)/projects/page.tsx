import type { Metadata } from "next";
import { Suspense } from "react";
import { requireUser } from "@/lib/hq/auth";
import { ProjectsHome } from "@/components/hq/projects/ProjectsHome";

export const metadata: Metadata = { title: "Projects" };

export default async function ProjectsPage() {
  await requireUser();
  return (
    <Suspense>
      <ProjectsHome />
    </Suspense>
  );
}
