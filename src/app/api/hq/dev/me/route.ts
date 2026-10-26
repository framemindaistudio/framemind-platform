import { NextResponse } from "next/server";
import { apiUser } from "@/lib/hq/auth";
import { apiError, rateLimit } from "@/lib/hq/api";
import { STAFF } from "@/lib/hq/roles";
import { DevError, GitHubError, openPR, refreshTask, reviewTask } from "@/lib/dev/server";

/**
 * A team member's own development actions — open the pull request for their task, refresh it, or review someone
 * else's as a code reviewer. The server decides who may do what (proxy.ts lets this path through for every login).
 */
export async function POST(req: Request) {
  const { user, error } = await apiUser(STAFF);
  if (error) return error;
  if (!rateLimit(`dev-me:${user.username}`, 60, 10 * 60 * 1000)) return NextResponse.json({ error: "Too many requests — try again in a few minutes." }, { status: 429 });
  try {
    const b = (await req.json()) as Record<string, unknown>;
    const task = String(b.task ?? "");
    switch (b.action) {
      case "open":
        return NextResponse.json({ pr: await openPR(task, user, true) });
      case "refresh":
        return NextResponse.json({ task: await refreshTask(task, user.name) });
      case "review":
        return NextResponse.json({ task: await reviewTask(task, user, b.decision === "approved" ? "approved" : "changes", String(b.comment ?? "")) });
      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (e) {
    if (e instanceof DevError || e instanceof GitHubError) return NextResponse.json({ error: e.message }, { status: e.status });
    return apiError(e);
  }
}
