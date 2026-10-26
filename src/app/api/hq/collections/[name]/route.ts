import { NextResponse } from "next/server";
import { apiEditor, apiUser } from "@/lib/hq/auth";
import { apiError } from "@/lib/hq/api";
import { getCollection } from "@/lib/hq/collections";
import { deleteRecord, getRecord, listRecords, upsertMany, upsertRecord } from "@/lib/hq/records";
import { can, LEADERSHIP, OPS, STAFF } from "@/lib/hq/roles";
import { storeInfo } from "@/lib/store";
import { deleteProject, ProjectHasInvoices } from "@/lib/hq/project-delete";
import { autoPortalOnPayment } from "@/lib/portal/invite";

type Ctx = { params: Promise<{ name: string }> };

/** GET /api/hq/collections/:name → { records, store } */
export async function GET(_req: Request, ctx: Ctx) {
  const { name } = await ctx.params;
  const def = getCollection(name);
  if (!def) return NextResponse.json({ error: "Unknown collection" }, { status: 404 });
  const { user, error } = await apiUser(def.read);
  if (error) return error;
  try {
    let records = await listRecords(name);
    // pay details stay with leadership, and amounts with the roles that see Finance, even where the rest of the record is open
    // …and the shared interns login gets neither contact numbers and internal notes nor the records nobody chose to show it
    const shared = def.internsOnlyIf;
    if (shared && !can(user, STAFF)) records = records.filter((r) => r[shared] === true);
    const hidden = def.fields.filter((f) => (f.leadershipOnly && !can(user, LEADERSHIP)) || (f.opsOnly && !can(user, OPS)) || (f.staffOnly && !can(user, STAFF))).map((f) => f.key);
    if (hidden.length) records = records.map((r) => Object.fromEntries(Object.entries(r).filter(([k]) => !hidden.includes(k))) as typeof r);
    return NextResponse.json({ records, store: storeInfo() });
  } catch (e) {
    return apiError(e);
  }
}

/** POST { record } → upsert one · POST { records: [] } → bulk upsert in one commit */
const MANAGED = (label: string) => NextResponse.json({ error: `${label} change only through HQ → Incentives, so every change is checked and kept in the audit trail.` }, { status: 403 });

/** The founder's decision on a lead's commission attribution is made in Incentives: an ordinary edit keeps it as it was. */
const ATTRIBUTION_KEYS = ["attribution", "splits", "decidedBy", "decidedAt", "decisionNote", "attributionHistory", "registeredBy", "registeredAt"];
/** Kept from the stored record: the development workflow changes these only through /api/hq/dev and GitHub events. */
const DEV_TASK_KEYS = ["taskKey", "devType", "branch", "pr", "checks", "reviews", "devStatus", "commits", "lastCommit", "previewUrl", "assigneeId", "devHistory", "mergedBy", "mergedAt"];
const DEV_PROJECT_KEYS = ["repo", "devCounter", "devDocsAt", "aiDocs", "aiRun", "aiTasksFrom", "founderBrief"];

/**
 * Payments ticked "reconciled" (or "refunded") are stamped with who did it and when, from the session — never from
 * what the browser sent — so the incentive figures that rest on them have a trustworthy trail.
 */
function stampPayments(next: Record<string, unknown>, prev: Record<string, unknown> | null, by: string) {
  if (!Array.isArray(next.payments)) return next;
  const before = new Map((Array.isArray(prev?.payments) ? (prev!.payments as Record<string, unknown>[]) : []).map((p) => [String(p.id), p]));
  const now = new Date().toISOString();
  const payments = (next.payments as Record<string, unknown>[]).map((p) => {
    const old = before.get(String(p.id));
    const out = { ...p };
    if (p.reconciled === true) {
      if (old?.reconciled === true) Object.assign(out, { reconciledBy: old.reconciledBy, reconciledAt: old.reconciledAt });
      else Object.assign(out, { reconciledBy: by, reconciledAt: now });
    } else {
      delete out.reconciledBy;
      delete out.reconciledAt;
    }
    if (p.refunded === true) {
      if (old?.refunded === true) Object.assign(out, { refundedBy: old.refundedBy, refundedAt: old.refundedAt });
      else Object.assign(out, { refundedBy: by, refundedAt: now });
    } else {
      delete out.refundedBy;
      delete out.refundedAt;
    }
    return out;
  });
  return { ...next, payments };
}

async function guarded(name: string, record: Record<string, unknown>, by: string) {
  const prev = record.id ? await getRecord(name, String(record.id)) : null;
  if (name === "leads") {
    const out = { ...record };
    for (const k of ATTRIBUTION_KEYS) {
      if (prev && k in prev) out[k] = prev[k];
      else delete out[k];
    }
    return out;
  }
  if (name === "invoices") return stampPayments(record, prev, by);
  const keep = name === "tasks" ? DEV_TASK_KEYS : name === "projects" ? DEV_PROJECT_KEYS : null;
  if (keep) {
    const out = { ...record };
    for (const k of keep) {
      if (prev && k in prev) out[k] = prev[k];
      else delete out[k];
    }
    return out;
  }
  return record;
}

export async function POST(req: Request, ctx: Ctx) {
  const { name } = await ctx.params;
  const def = getCollection(name);
  if (!def) return NextResponse.json({ error: "Unknown collection" }, { status: 404 });
  const { user, error } = await apiEditor(def.write);
  if (error) return error;
  if (def.managed) return MANAGED(def.label);
  try {
    const body = await req.json();
    if (Array.isArray(body.records)) {
      const list = await Promise.all((body.records as Record<string, unknown>[]).map((r) => guarded(name, r, user.name)));
      const records = await upsertMany(name, list, user.name);
      return NextResponse.json({ records });
    }
    if (!body.record || typeof body.record !== "object") return NextResponse.json({ error: "Missing record" }, { status: 400 });
    const before = name === "invoices" && body.record.id ? await getRecord(name, String(body.record.id)) : null;
    const record = await upsertRecord(name, await guarded(name, body.record, user.name), user.name);
    // the first payment on a project's invoice opens the client's portal (when email is set up)
    if (name === "invoices") await autoPortalOnPayment(before, record, user.name);
    return NextResponse.json({ record });
  } catch (e) {
    return apiError(e);
  }
}

/** DELETE ?id=... */
export async function DELETE(req: Request, ctx: Ctx) {
  const { name } = await ctx.params;
  const def = getCollection(name);
  if (!def) return NextResponse.json({ error: "Unknown collection" }, { status: 404 });
  const { user, error } = await apiEditor(def.write);
  if (error) return error;
  if (def.managed) return MANAGED(def.label);
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  try {
    // a project takes its deliverables and shoots with it, and unlinks the rest (lib/hq/project-delete.ts)
    if (name === "projects") {
      const { removed } = await deleteProject(id, user.name);
      return NextResponse.json({ ok: true, removed });
    }
    await deleteRecord(name, id, user.name);
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof ProjectHasInvoices) return NextResponse.json({ error: e.message, invoices: e.invoices }, { status: 409 });
    return apiError(e);
  }
}
