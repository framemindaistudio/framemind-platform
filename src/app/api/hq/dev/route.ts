import { NextResponse } from "next/server";
import { apiEditor, apiUser } from "@/lib/hq/auth";
import { apiError } from "@/lib/hq/api";
import { OPS, STAFF } from "@/lib/hq/roles";
import { approvePlan, autopilotTick, buildTask, createTask, devQueue, devView, DevError, GitHubError, mergeTask, openPR, refreshTask, reviewTask, saveAutopilot, saveFounderBrief, setupRepo, startPlan, syncDocs } from "@/lib/dev/server";
import { getRecord, upsertRecord } from "@/lib/hq/records";

/** Approving a plan creates every task and its branch on GitHub, which can take a while for a big plan. */
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
      case "brief": {
        await saveFounderBrief(project, String(b.brief ?? ""), user.name);
        const p = await getRecord("projects", project);
        if (p?.repo) await syncDocs(project, user.name);
        return NextResponse.json({ ok: true });
      }
      case "plan":
        if (b.brief !== undefined) await saveFounderBrief(project, String(b.brief), user.name);
        await startPlan(project, user.name);
        return NextResponse.json({ ok: true });
      case "approvePlan":
        return NextResponse.json({ created: await approvePlan(project, user.name) });
      case "autopilot":
        return NextResponse.json({ autopilot: await saveAutopilot(project, (b.settings as Record<string, boolean>) ?? {}, user.name) });
      case "build":
        return NextResponse.json({ task: await buildTask(task, user.name) });
      case "retry": {
        // clear a failed Claude build so the autopilot (or a manual build) can try again
        const t = await getRecord("tasks", task);
        if (t) await upsertRecord("tasks", { ...t, aiBuild: { ...((t.aiBuild as Record<string, unknown> | undefined) ?? {}), status: "retry", rounds: 0 } }, user.name);
        if (t?.projectId) await autopilotTick(String(t.projectId));
        return NextResponse.json({ ok: true });
      }
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
