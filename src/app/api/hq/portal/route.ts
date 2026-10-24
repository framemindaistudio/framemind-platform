import { NextResponse } from "next/server";
import { apiEditor, apiUser } from "@/lib/hq/auth";
import { apiError } from "@/lib/hq/api";
import { getRecord, listRecords } from "@/lib/hq/records";
import { OPS, STAFF } from "@/lib/hq/roles";
import { mailReady } from "@/lib/hq/mail";
import { grantPortalAccess, publicAccount, readPortalAccounts, updatePortalAccounts } from "@/lib/portal/auth";
import { decideSubmission, hqPortalView, markRead, PORTAL_URL, PortalError, publishUpdate, teamMessage } from "@/lib/portal/data";
import { emailInvite } from "@/lib/portal/invite";

/**
 * HQ → a project's client portal.
 * GET ?project=<id> → logins (no passwords), the client's submission, updates and messages.
 * POST { action, project, ... } → grant | reset | pause | decide | publish | message | read
 */
export async function GET(req: Request) {
  const { error } = await apiUser(STAFF);
  if (error) return error;
  const project = new URL(req.url).searchParams.get("project") ?? "";
  try {
    const accounts = (await readPortalAccounts()).list.filter((a) => a.projectIds.includes(project)).map(publicAccount);
    const p = await getRecord("projects", project);
    const client = p?.clientId ? (await listRecords("clients")).find((c) => c.id === p.clientId) : undefined;
    return NextResponse.json({ accounts, mailReady: mailReady(), portalUrl: PORTAL_URL(), client: client ? { name: String(client.contactName || client.name || ""), email: String(client.email || "") } : null, ...(await hqPortalView(project)) });
  } catch (e) {
    return apiError(e);
  }
}

export async function POST(req: Request) {
  const { user, error } = await apiEditor(OPS);
  if (error) return error;
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const projectId = String(body.project ?? "");
    const project = await getRecord("projects", projectId);
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
    switch (body.action) {
      case "grant":
      case "reset": {
        const clientId = String(project.clientId ?? "");
        if (!clientId) throw new PortalError("Link this project to a client first.");
        const client = (await listRecords("clients")).find((c) => c.id === clientId);
        const email = String(body.email ?? client?.email ?? "");
        const name = String(body.name ?? client?.contactName ?? client?.name ?? "");
        const g = await grantPortalAccess({ email, name, clientId, projectId, reset: body.action === "reset" }, user.name);
        let emailed = false;
        let mailError = "";
        if (g.password) {
          try {
            emailed = await emailInvite({ email: g.email, name: name || g.email, password: g.password, projectTitle: String(project.title ?? "") });
          } catch (e) {
            mailError = e instanceof Error ? e.message : "The email could not be sent.";
          }
        }
        // the one-time password is shown once, so it can be shared another way when email isn't set up
        return NextResponse.json({ ok: true, email: g.email, password: g.password ?? null, created: g.created, emailed, mailError, portalUrl: PORTAL_URL() });
      }
      case "pause": {
        const email = String(body.email ?? "");
        await updatePortalAccounts(
          (list) => {
            const a = list.find((x) => x.email === email && x.projectIds.includes(projectId));
            if (!a) return list;
            a.disabled = body.disabled === true;
            a.updatedAt = new Date().toISOString();
            return list;
          },
          `Client portal: ${body.disabled ? "pause" : "resume"} login`,
          user.name,
        );
        return NextResponse.json({ ok: true });
      }
      case "decide":
        await decideSubmission(projectId, body.decision === "approved" ? "approved" : "changes", String(body.note ?? ""), user.name);
        return NextResponse.json({ ok: true });
      case "publish":
        await publishUpdate(projectId, { title: String(body.title ?? ""), body: String(body.body ?? ""), previewUrl: String(body.previewUrl ?? ""), needsApproval: body.needsApproval === true }, user.name);
        return NextResponse.json({ ok: true });
      case "message":
        await teamMessage(projectId, String(body.text ?? ""), user.name);
        return NextResponse.json({ ok: true });
      case "read":
        await markRead(projectId, user.name);
        return NextResponse.json({ ok: true });
      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (e) {
    if (e instanceof PortalError) return NextResponse.json({ error: e.message }, { status: e.status });
    return apiError(e);
  }
}
