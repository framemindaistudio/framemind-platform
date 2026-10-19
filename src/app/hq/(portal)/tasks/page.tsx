import type { Metadata } from "next";
import { TasksBoard } from "./TasksBoard";

export const metadata: Metadata = { title: "Tasks" };

/** Shared to-do board — Kanban by status, with a filterable list view. */
export default async function TasksPage({ searchParams }: { searchParams: Promise<{ view?: string | string[] }> }) {
  const { view } = await searchParams;
  return <TasksBoard initialView={view === "list" ? "list" : "board"} />;
}
