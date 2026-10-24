import { NextResponse } from "next/server";
import { apiError, rateLimit } from "@/lib/hq/api";
import { ownProject, portalApiUser } from "@/lib/portal/auth";
import { clientMessage, clientProjects, clientView, PortalError, respondToUpdate, saveSubmission } from "@/lib/portal/data";

/**
 * The client portal's data — only the signed-in client's own projects, decided here on the server.
 * GET ?project=<id> → { me, projects, view }   (view is the chosen project, or the first one)
 * POST { action, project, ... } → saveDraft | submit | respond | message
 */
export async function GET(req: Request) {
  const { user, error } = await portalApiUser();
  if (error) return error;
  try {
    const projects = await clientProjects(user);
    const wanted = new URL(req.url).searchParams.get("project");
    const id = ownProject(user, wanted) ?? projects[0]?.id ?? null;
    return NextResponse.json({ me: { name: user.name, email: user.email }, projects, view: id ? await clientView(user, id) : null }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (e) {
    return fail(e);
  }
}

export async function POST(req: Request) {
  const { user, error } = await portalApiUser();
  if (error) return error;
  if (!rateLimit(`portal:${user.email}`, 60, 10 * 60 * 1000)) return NextResponse.json({ error: "Too many requests — try again in a few minutes." }, { status: 429 });
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const project = ownProject(user, String(body.project ?? ""));
    switch (body.action) {
      case "saveDraft":
      case "submit":
        if (!project) throw new PortalError("Project not found.", 404);
        return NextResponse.json({ submission: await saveSubmission(user, project, (body.submission as Record<string, unknown>) ?? {}, body.action === "submit") });
      case "respond":
        await respondToUpdate(user, String(body.id ?? ""), body.decision === "approved" ? "approved" : "changes", String(body.comment ?? ""));
        return NextResponse.json({ ok: true });
      case "message":
        if (!project) throw new PortalError("Project not found.", 404);
        await clientMessage(user, project, String(body.text ?? ""));
        return NextResponse.json({ ok: true });
      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (e) {
    return fail(e);
  }
}

function fail(e: unknown) {
  if (e instanceof PortalError) return NextResponse.json({ error: e.message }, { status: e.status });
  return apiError(e);
}
