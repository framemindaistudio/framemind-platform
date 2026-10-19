import type { Metadata } from "next";
import { Suspense } from "react";
import { requireUser } from "@/lib/hq/auth";
import { ProjectDetail } from "@/components/hq/projects/ProjectDetail";

export const metadata: Metadata = { title: "Project" };

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;
  return (
    <Suspense>
      <ProjectDetail id={id} />
    </Suspense>
  );
}
