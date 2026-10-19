import type { Metadata } from "next";
import { CommandCenter } from "@/components/hq/dashboard/CommandCenter";

export const metadata: Metadata = {
  title: "Command Center",
};

/** HQ home — targets, pipeline, cash and what needs attention today. */
export default async function HqHome({ searchParams }: { searchParams: Promise<{ denied?: string | string[] }> }) {
  const { denied } = await searchParams;
  return <CommandCenter denied={denied === "1"} />;
}
