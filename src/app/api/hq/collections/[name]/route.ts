import { NextResponse } from "next/server";
import { apiEditor, apiUser } from "@/lib/hq/auth";
import { apiError } from "@/lib/hq/api";
import { getCollection } from "@/lib/hq/collections";
import { deleteRecord, listRecords, upsertMany, upsertRecord } from "@/lib/hq/records";
import { can, LEADERSHIP, OPS, STAFF } from "@/lib/hq/roles";
import { storeInfo } from "@/lib/store";
import { deleteProject, ProjectHasInvoices } from "@/lib/hq/project-delete";

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
export async function POST(req: Request, ctx: Ctx) {
  const { name } = await ctx.params;
  const def = getCollection(name);
  if (!def) return NextResponse.json({ error: "Unknown collection" }, { status: 404 });
  const { user, error } = await apiEditor(def.write);
  if (error) return error;
  try {
    const body = await req.json();
    if (Array.isArray(body.records)) {
      const records = await upsertMany(name, body.records, user.name);
      return NextResponse.json({ records });
    }
    if (!body.record || typeof body.record !== "object") return NextResponse.json({ error: "Missing record" }, { status: 400 });
    const record = await upsertRecord(name, body.record, user.name);
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
