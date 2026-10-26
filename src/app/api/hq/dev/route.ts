import { NextResponse } from "next/server";
import { apiEditor, apiUser } from "@/lib/hq/auth";
import { apiError } from "@/lib/hq/api";
import { OPS, STAFF } from "@/lib/hq/roles";
import { createTask, devQueue, devView, DevError, GitHubError, mergeTask, openPR, refreshTask, reviewTask, setupRepo, syncDocs } from "@/lib/dev/server";

/**
 * HQ → development.
 * GET ?project=<id> → the project's repository, tasks and team   ·   GET ?queue=1 → my tasks, review queue, recent merges
 * POST { action, ... } (founder / admin) → setup | docs | task | open | refresh | review | merge
 * Team members' own actions (open their PR, review as a code reviewer) go through /api/hq/dev/me.
 */
export async function GET(req: Request) {
  const { user, error } = await apiUser(STAFF);
  if (error) return error;
  const url = new URL(req.url);
  try {
    if (url.searchParams.get("queue")) return NextResponse.json(await devQueue(user));
    return NextResponse.json(await devView(url.searchParams.get("project") ?? ""));
  } catch (e) {
    return fail(e);
  }
}

export async function POST(req: Request) {
  const { user, error } = await apiEditor(OPS);
  if (error) return error;
  try {
    const b = (await req.json()) as Record<string, unknown>;
    const project = String(b.project ?? "");
    const task = String(b.task ?? "");
    switch (b.action) {
      case "setup":
        return NextResponse.json(await setupRepo(project, user));
      case "docs":
        return NextResponse.json({ changed: await syncDocs(project, user.name) });
      case "task":
        return NextResponse.json({ task: await createTask(project, (b.input as Record<string, unknown>) ?? {}, user) });
      case "open":
        return NextResponse.json({ pr: await openPR(task, user, false) });
      case "refresh":
        return NextResponse.json({ task: await refreshTask(task, user.name) });
      case "review":
        return NextResponse.json({ task: await reviewTask(task, user, b.decision === "approved" ? "approved" : "changes", String(b.comment ?? "")) });
      case "merge":
        return NextResponse.json({ task: await mergeTask(task, user) });
      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (e) {
    return fail(e);
  }
}

export function fail(e: unknown) {
  if (e instanceof DevError || e instanceof GitHubError) return NextResponse.json({ error: e.message }, { status: e.status });
  return apiError(e);
}
