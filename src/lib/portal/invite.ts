import "server-only";
import { getRecord, listRecords } from "@/lib/hq/records";
import type { BaseRecord } from "@/lib/hq/collections";
import { isEmail, mailReady, sendMail } from "@/lib/hq/mail";
import { esc } from "@/lib/hq/mail";
import { grantPortalAccess, readPortalAccounts } from "./auth";
import { PORTAL_URL, portalEmail } from "./data";

const s = (v: unknown) => (v === undefined || v === null ? "" : String(v)).trim();

/** Email a client their portal sign-in. Returns false when email isn't set up (HQ then shows the details to share). */
export async function emailInvite(o: { email: string; name: string; password: string; projectTitle: string }) {
  if (!mailReady()) return false;
  const text = `Hello ${o.name},\n\nYour client portal for "${o.projectTitle}" is ready. Use it to send your requirements and brand assets, follow progress, review previews and message the team.\n\nSign-in email: ${o.email}\nOne-time password: ${o.password}\n\nYou'll choose your own password the first time you sign in.`;
  await sendMail({
    to: [o.email],
    subject: `Your FrameMind client portal — ${o.projectTitle}`,
    text: `${text}\n\n${PORTAL_URL()}`,
    html: portalEmail("Your client portal is ready", text, `<p style="background:#f5f4f0;padding:10px 14px;font-family:monospace">${esc(o.email)}<br>${esc(o.password)}</p>`),
  });
  return true;
}

/**
 * When the first payment arrives on an invoice for a project, give the client a portal login and email it —
 * automatically, but only when email is set up and the client record has an email address. Otherwise HQ's project
 * screen asks the founder to create the login with one click. Never fails the payment save that triggered it.
 */
export async function autoPortalOnPayment(prev: BaseRecord | null, saved: BaseRecord, by: string) {
  try {
    const projectId = s(saved.projectId);
    const paidNow = Array.isArray(saved.payments) && (saved.payments as unknown[]).length > 0;
    const paidBefore = Array.isArray(prev?.payments) && (prev!.payments as unknown[]).length > 0;
    if (!projectId || !paidNow || paidBefore || !mailReady()) return;
    if ((await readPortalAccounts(true)).list.some((a) => a.projectIds.includes(projectId))) return;
    const project = await getRecord("projects", projectId);
    const clientId = s(project?.clientId) || s(saved.clientId);
    if (!project || !clientId) return;
    const client = (await listRecords("clients")).find((c) => c.id === clientId);
    const email = s(client?.email) || s(saved.customerEmail);
    if (!isEmail(email)) return;
    const name = s(client?.contactName) || s(client?.name) || s(saved.customerName) || email;
    const g = await grantPortalAccess({ email, name, clientId, projectId }, by);
    if (g.password) await emailInvite({ email: g.email, name, password: g.password, projectTitle: s(project.title) });
  } catch (e) {
    console.error("[portal] automatic portal login failed:", e instanceof Error ? e.message : e);
  }
}
