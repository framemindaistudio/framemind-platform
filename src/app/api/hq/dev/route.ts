import { after, NextResponse } from "next/server";
import { apiEditor, apiUser } from "@/lib/hq/auth";
import { apiError } from "@/lib/hq/api";
import { OPS, STAFF } from "@/lib/hq/roles";
import { autoBuild, buildReady, createTask, devQueue, devView, DevError, GitHubError, mergeTask, openPR, refreshTask, reviewTask, saveFounderBrief, setupRepo, syncDocs } from "@/lib/dev/server";

/** The automatic build (Claude drafting + GitHub) runs after the response, within this limit. */
export const maxDuration = 300;

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
      case "auto":
        if (!buildReady()) throw new DevError("Connect GitHub and Claude first (GITHUB_DEV_TOKEN, GITHUB_DEV_OWNER and ANTHROPIC_API_KEY in Vercel).", 503);
        await saveFounderBrief(project, String(b.brief ?? ""), user.name);
        after(() => autoBuild(project, user.name));
        return NextResponse.json({ ok: true, started: true });
      case "setup":
        return NextResponse.json(await setupRepo(project, user.name));
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
