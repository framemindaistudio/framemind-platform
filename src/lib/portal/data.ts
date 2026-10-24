import "server-only";
import { getRecord, listRecords, upsertRecord } from "@/lib/hq/records";
import { invoiceTotals, type BaseRecord } from "@/lib/hq/collections";
import { esc, isEmail, mailReady, sendMail } from "@/lib/hq/mail";
import { site } from "@/lib/site";
import { PortalError, type PortalUser } from "./auth";

/*
 * The client portal's records and rules. A client reads one project at a time and only what is meant for them:
 * the stage, the timeline, published updates, their own submission, messages, payment milestones and invoices —
 * never internal notes, costs, team pay or other clients. Every change here is stamped and kept in history.
 */

type Rec = BaseRecord;
const s = (v: unknown) => (v === undefined || v === null ? "" : String(v)).trim();
const n = (v: unknown) => Number(v) || 0;
const now = () => new Date().toISOString();

export { PortalError };

export const PORTAL_URL = () => `${site.website}/portal`;

/** The client-facing stages, in order (on-hold / cancelled are shown as a note, not a step). */
export const STAGES: [string, string][] = [
  ["kickoff", "Kick-off"],
  ["discovery", "Requirements"],
  ["design", "Design"],
  ["build", "Development"],
  ["review", "Your review"],
  ["launch", "Launch & handover"],
  ["support", "Support"],
  ["completed", "Completed"],
];

const history = (r: Rec | null | undefined) => (Array.isArray(r?.history) ? (r!.history as unknown[]) : []);
const event = (by: string, action: string, note?: string) => ({ at: now(), by, action, ...(note ? { note } : {}) });

/* ───────────────────────────── what the client sees ───────────────────────────── */

export async function clientProjects(user: PortalUser) {
  const projects = await listRecords("projects");
  return projects.filter((p) => user.projectIds.includes(p.id)).map((p) => ({ id: p.id, title: s(p.title) }));
}

export async function clientView(user: PortalUser, projectId: string) {
  const p = await getRecord("projects", projectId);
  if (!p || !user.projectIds.includes(p.id)) throw new PortalError("Project not found.", 404);
  const [subs, updates, messages, invoices] = await Promise.all([listRecords("portalSubmissions"), listRecords("portalUpdates"), listRecords("portalMessages"), listRecords("invoices")]);
  const stage = s(p.stage) || "kickoff";
  const idx = STAGES.findIndex(([k]) => k === stage);
  const milestones = Array.isArray(p.milestones) ? (p.milestones as Rec[]) : [];
  const inputs = Array.isArray(p.inputs) ? (p.inputs as Rec[]) : [];
  const sub = subs.find((x) => s(x.projectId) === p.id);
  return {
    project: {
      id: p.id,
      title: s(p.title),
      stage,
      onHold: stage === "on-hold" || stage === "cancelled",
      progress: idx < 0 ? 0 : Math.round(((idx + (stage === "completed" ? 1 : 0.5)) / STAGES.length) * 100),
      timeline: STAGES.map(([key, label], i) => ({ key, label, state: idx < 0 ? "upcoming" : i < idx || stage === "completed" ? "done" : i === idx ? "current" : "upcoming" })),
      startDate: s(p.startDate),
      dueDate: s(p.dueDate),
      lead: s(p.lead),
      stagingUrl: s(p.stagingUrl),
      liveUrl: s(p.liveUrl),
      revisionsAllowed: n(p.revisionsAllowed),
      revisionsUsed: n(p.revisionsUsed),
    },
    milestones: milestones.map((m) => ({ label: s(m.label), amount: n(m.amount), status: s(m.status) || "due", dueDate: s(m.dueDate) })),
    stillNeeded: inputs.filter((i) => !i.received).map((i) => s(i.label)),
    submission: sub ? clientSubmission(sub) : null,
    updates: updates
      .filter((u) => s(u.projectId) === p.id)
      .sort((a, b) => s(b.createdAt).localeCompare(s(a.createdAt)))
      .map((u) => ({ id: u.id, title: s(u.title), body: s(u.body), previewUrl: s(u.previewUrl), needsApproval: u.needsApproval === true, approval: (u.approval as Rec | undefined) ?? null, createdAt: s(u.createdAt) })),
    messages: messages
      .filter((m) => s(m.projectId) === p.id)
      .sort((a, b) => s(a.createdAt).localeCompare(s(b.createdAt)))
      .map((m) => ({ id: m.id, from: s(m.from), author: s(m.author), text: s(m.text), createdAt: s(m.createdAt) })),
    invoices: invoices
      .filter((i) => s(i.projectId) === p.id && !["draft", "cancelled"].includes(s(i.status)))
      .map((i) => {
        const t = invoiceTotals(i);
        return { number: s(i.number), date: s(i.date), dueDate: s(i.dueDate), total: t.total, paid: t.paid, balance: t.balance, status: s(i.status) };
      }),
  };
}

const clientSubmission = (x: Rec) => ({
  id: x.id,
  status: s(x.status) || "draft",
  company: s(x.company),
  contactName: s(x.contactName),
  phone: s(x.phone),
  email: s(x.email),
  website: s(x.website),
  about: s(x.about),
  audience: s(x.audience),
  requirements: s(x.requirements),
  pages: s(x.pages),
  colors: Array.isArray(x.colors) ? (x.colors as string[]) : [],
  fonts: s(x.fonts),
  logo: s(x.logo),
  references: Array.isArray(x.references) ? (x.references as string[]) : [],
  referenceLinks: s(x.referenceLinks),
  files: Array.isArray(x.files) ? (x.files as string[]) : [],
  decisionNote: s(x.decisionNote),
  submittedAt: s(x.submittedAt),
});

/* ───────────────────────────── what the client sends ───────────────────────────── */

const TEXT_LIMITS: Record<string, number> = { company: 160, contactName: 120, phone: 30, email: 160, website: 200, about: 3000, audience: 1500, requirements: 6000, pages: 2000, fonts: 300, referenceLinks: 2000 };
export const clientFolder = (projectId: string) => `vault/clients/${projectId}`;
const ownFile = (projectId: string, v: unknown) => (typeof v === "string" && v.startsWith(`${clientFolder(projectId)}/`) && !v.includes("..") ? v : "");

/** Save the requirements form as a draft, or submit it for the studio's review. Locked while under review or approved. */
export async function saveSubmission(user: PortalUser, projectId: string, input: Record<string, unknown>, submit: boolean) {
  if (!user.projectIds.includes(projectId)) throw new PortalError("Project not found.", 404);
  const p = await getRecord("projects", projectId);
  if (!p) throw new PortalError("Project not found.", 404);
  const existing = (await listRecords("portalSubmissions")).find((x) => s(x.projectId) === projectId);
  const status = s(existing?.status) || "draft";
  if (status === "submitted") throw new PortalError("Your submission is with the studio for review. You can change it if they ask for changes.");
  if (status === "approved") throw new PortalError("Your requirements are approved. Send any change as a message.");
  const rec: Record<string, unknown> = { ...(existing ?? {}), projectId, clientId: user.clientId };
  for (const [k, max] of Object.entries(TEXT_LIMITS)) if (input[k] !== undefined) rec[k] = s(input[k]).slice(0, max);
  if (Array.isArray(input.colors)) rec.colors = input.colors.map(s).filter((c) => /^#[0-9a-f]{6}$/i.test(c)).slice(0, 8);
  if (input.logo !== undefined) rec.logo = ownFile(projectId, input.logo);
  if (Array.isArray(input.references)) rec.references = input.references.map((v) => ownFile(projectId, v)).filter(Boolean).slice(0, 20);
  if (Array.isArray(input.files)) rec.files = input.files.map((v) => ownFile(projectId, v)).filter(Boolean).slice(0, 20);
  if (submit) {
    if (!s(rec.company) || !s(rec.requirements)) throw new PortalError("Add your company name and what you need before submitting.");
    rec.status = "submitted";
    rec.submittedAt = now();
  } else rec.status = status === "changes" ? "changes" : "draft";
  rec.history = [...history(existing), event(user.name, submit ? "Submitted by the client" : "Draft saved")];
  const saved = await upsertRecord("portalSubmissions", rec, `${user.name} (client)`);
  return clientSubmission(saved);
}

/** The client approves an update (a design, a preview, a milestone) or asks for changes. */
export async function respondToUpdate(user: PortalUser, updateId: string, decision: "approved" | "changes", comment: string) {
  const u = await getRecord("portalUpdates", updateId);
  if (!u || !user.projectIds.includes(s(u.projectId))) throw new PortalError("Update not found.", 404);
  if (u.needsApproval !== true) throw new PortalError("This update doesn't need an approval.");
  if (decision === "changes" && !comment.trim()) throw new PortalError("Tell us what you'd like changed.");
  await upsertRecord("portalUpdates", { ...u, approval: { status: decision, comment: comment.trim().slice(0, 3000), by: user.name, at: now() }, history: [...history(u), event(user.name, decision === "approved" ? "Approved by the client" : "Changes requested", comment.trim() || undefined)] }, `${user.name} (client)`);
}

export async function clientMessage(user: PortalUser, projectId: string, text: string) {
  if (!user.projectIds.includes(projectId)) throw new PortalError("Project not found.", 404);
  const t = text.trim().slice(0, 4000);
  if (!t) throw new PortalError("Write a message first.");
  await upsertRecord("portalMessages", { projectId, from: "client", author: user.name, text: t, readByTeam: false }, `${user.name} (client)`);
}

/* ───────────────────────────── the studio's side (HQ) ───────────────────────────── */

export async function hqPortalView(projectId: string) {
  const [subs, updates, messages] = await Promise.all([listRecords("portalSubmissions"), listRecords("portalUpdates"), listRecords("portalMessages")]);
  return {
    submission: subs.find((x) => s(x.projectId) === projectId) ?? null,
    updates: updates.filter((u) => s(u.projectId) === projectId).sort((a, b) => s(b.createdAt).localeCompare(s(a.createdAt))),
    messages: messages.filter((m) => s(m.projectId) === projectId).sort((a, b) => s(a.createdAt).localeCompare(s(b.createdAt))),
  };
}

/** Approve the client's requirements (they become the project brief when it has none) or send them back with a note. */
export async function decideSubmission(projectId: string, decision: "approved" | "changes", note: string, by: string) {
  const sub = (await listRecords("portalSubmissions")).find((x) => s(x.projectId) === projectId);
  if (!sub) throw new PortalError("The client hasn't sent anything yet.", 404);
  if (s(sub.status) !== "submitted") throw new PortalError("Only a submitted form can be approved or sent back.");
  if (decision === "changes" && !note.trim()) throw new PortalError("Say what the client should change — they see this note.");
  await upsertRecord("portalSubmissions", { ...sub, status: decision, decisionNote: note.trim().slice(0, 2000), decidedBy: by, decidedAt: now(), history: [...history(sub), event(by, decision === "approved" ? "Approved" : "Changes requested", note.trim() || undefined)] }, by);
  const p = await getRecord("projects", projectId);
  if (p && decision === "approved") {
    const brief = [s(sub.requirements), s(sub.pages) && `Pages / sections: ${s(sub.pages)}`, s(sub.audience) && `Audience: ${s(sub.audience)}`].filter(Boolean).join("\n\n");
    await upsertRecord("projects", { ...p, ...(s(p.brief) ? {} : { brief }), requirementsApprovedAt: now(), ...(["kickoff", "discovery"].includes(s(p.stage)) ? { stage: "design" } : {}) }, by);
  }
  if (p) await notifyClient(p, decision === "approved" ? "Your requirements are approved" : "Please update your requirements", decision === "approved" ? "Thank you — we've approved your requirements and moved your project to the next stage." : `We need a few changes before we can start:\n\n${note.trim()}`, `sub-${sub.id}-${decision}`);
}

export async function publishUpdate(projectId: string, input: { title: string; body: string; previewUrl?: string; needsApproval?: boolean }, by: string) {
  const p = await getRecord("projects", projectId);
  if (!p) throw new PortalError("Project not found.", 404);
  const title = s(input.title).slice(0, 160);
  if (!title) throw new PortalError("Give the update a title.");
  const previewUrl = s(input.previewUrl);
  if (previewUrl && !/^https:\/\//i.test(previewUrl)) throw new PortalError("A preview link must start with https://");
  const u = await upsertRecord("portalUpdates", { projectId, title, body: s(input.body).slice(0, 5000), previewUrl, needsApproval: input.needsApproval === true, publishedBy: by, history: [event(by, "Published")] }, by);
  await notifyClient(p, input.needsApproval ? `Please review: ${title}` : `Project update: ${title}`, `${s(input.body)}${previewUrl ? `\n\nPreview: ${previewUrl}` : ""}${input.needsApproval ? "\n\nOpen the portal to approve it or ask for changes." : ""}`, `upd-${u.id}`);
  return u;
}

export async function teamMessage(projectId: string, text: string, by: string) {
  const p = await getRecord("projects", projectId);
  if (!p) throw new PortalError("Project not found.", 404);
  const t = text.trim().slice(0, 4000);
  if (!t) throw new PortalError("Write a message first.");
  const m = await upsertRecord("portalMessages", { projectId, from: "team", author: by, text: t, readByTeam: true }, by);
  await notifyClient(p, `New message from ${site.name}`, t, `msg-${m.id}`);
}

/** Mark the client's messages on a project as read by the team. */
export async function markRead(projectId: string, by: string) {
  for (const m of (await listRecords("portalMessages")).filter((x) => s(x.projectId) === projectId && x.from === "client" && x.readByTeam !== true)) {
    await upsertRecord("portalMessages", { ...m, readByTeam: true }, by);
  }
}

/* ───────────────────────────── emails to the client ───────────────────────────── */

/** Email every portal login of the project's client, when email is set up. Never fails the action that called it. */
async function notifyClient(project: Rec, subject: string, text: string, once: string) {
  if (!mailReady()) return;
  try {
    const { readPortalAccounts } = await import("./auth");
    const to = (await readPortalAccounts()).list.filter((a) => !a.disabled && a.projectIds.includes(project.id)).map((a) => a.email).filter(isEmail);
    if (!to.length) return;
    await sendMail({ to, subject: `${subject} — ${s(project.title)}`, text: `${text}\n\nOpen your project: ${PORTAL_URL()}`, html: portalEmail(subject, text), once });
  } catch (e) {
    console.error("[portal] could not email the client:", e instanceof Error ? e.message : e);
  }
}

export function portalEmail(heading: string, text: string, extra = "") {
  return `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#111"><h2 style="font-size:18px">${esc(heading)}</h2><p style="white-space:pre-line;line-height:1.5">${esc(text)}</p>${extra}<p><a href="${PORTAL_URL()}" style="display:inline-block;background:#0d0d0d;color:#f5f4f0;padding:10px 16px;text-decoration:none;border-radius:4px">Open your client portal</a></p><p style="color:#777;font-size:12px">${esc(site.name)}</p></div>`;
}
