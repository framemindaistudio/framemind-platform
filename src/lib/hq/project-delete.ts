import "server-only";
import { store } from "@/lib/store";
import { updatePortalAccounts } from "@/lib/portal/auth";
import { deleteRecord, getRecord, listRecords, mutateCollection } from "./records";
import type { BaseRecord } from "./collections";

/**
 * Deleting a project takes what belongs only to it with it, so nothing is left pointing at a project that no longer
 * exists:
 *
 *   deleted with it  its deliverables (Production), its shoots, its coding tasks (Development), and its client
 *                    portal: the client's form, updates, messages and uploaded files. A client login that was only
 *                    for this project is removed; one shared with other projects just loses this one.
 *   not touched      the project's GitHub repository: delete or archive it on GitHub if it is no longer needed
 *   kept, unlinked   tasks, trips, expenses, purchase orders, subscriptions, feedback, testimonials, case studies,
 *                    and the quote's booking (the quote can be booked again)
 *   blocks it        invoices: a tax invoice is never removed silently. Delete the draft, or cancel the invoice in
 *                    Finance, first
 *
 * The project goes last, so a failure half-way never leaves orphans behind a deleted project.
 */
const DELETED_WITH = [
  { name: "deliverables", label: "deliverables" },
  { name: "shoots", label: "shoots" },
  { name: "portalSubmissions", label: "client portal forms" },
  { name: "portalUpdates", label: "client portal updates" },
  { name: "portalMessages", label: "client portal messages" },
] as const;
const UNLINKED = ["tasks", "trips", "expenses", "purchases", "subscriptions", "feedback", "testimonials", "caseStudies"] as const;

const linked = (r: BaseRecord, id: string) => r.projectId === id;

export class ProjectHasInvoices extends Error {
  constructor(public invoices: { id: string; number: string; status: string }[]) {
    super(`This project has ${invoices.length === 1 ? "an invoice" : `${invoices.length} invoices`} (${invoices.map((i) => i.number || "draft").join(", ")}). Delete the draft or cancel the invoice in Finance first: a tax invoice is never removed with a project.`);
    this.name = "ProjectHasInvoices";
  }
}

export async function deleteProject(id: string, author: string) {
  const p = await getRecord("projects", id);
  if (!p) return { removed: 0 };
  const title = String(p.title ?? id).slice(0, 60);
  const invoices = (await listRecords("invoices")).filter((r) => linked(r, id));
  if (invoices.length) throw new ProjectHasInvoices(invoices.map((r) => ({ id: r.id, number: String(r.number ?? ""), status: String(r.status ?? "draft") })));

  let removed = 0;
  for (const c of DELETED_WITH) {
    const before = (await listRecords(c.name)).filter((r) => linked(r, id)).length;
    if (!before) continue;
    await mutateCollection(c.name, (list) => list.filter((r) => !linked(r, id)), `Delete ${before} ${c.label} of the deleted project ${title}`, author);
    removed += before;
  }
  // coding tasks (they carry a task ID and a branch) belong only to this project; ordinary tasks are kept, unlinked
  const devTasks = (await listRecords("tasks")).filter((r) => linked(r, id) && r.taskKey).length;
  if (devTasks) {
    await mutateCollection("tasks", (list) => list.filter((r) => !(linked(r, id) && r.taskKey)), `Delete ${devTasks} coding tasks of the deleted project ${title}`, author);
    removed += devTasks;
  }
  // the client's uploaded files
  for (const f of (await store.tree(`vault/clients/${id}`).catch(() => [])).filter((e) => e.type === "file")) {
    await store.remove(f.path, `Delete a client upload of the deleted project ${title}`, { sha: f.sha, author });
    removed++;
  }
  // client logins: drop this project; a login left with no project is removed
  await updatePortalAccounts(
    (list) => {
      if (!list.some((a) => a.projectIds.includes(id))) return list;
      return list.map((a) => ({ ...a, projectIds: a.projectIds.filter((x) => x !== id) })).filter((a) => a.projectIds.length);
    },
    `Remove client portal access to the deleted project ${title}`,
    author,
  );
  for (const name of UNLINKED) {
    const n = (await listRecords(name)).filter((r) => linked(r, id)).length;
    if (!n) continue;
    await mutateCollection(name, (list) => list.map((r) => (linked(r, id) ? { ...r, projectId: undefined } : r)), `Unlink ${n} ${name} from the deleted project ${title}`, author);
  }
  if ((await listRecords("proposals")).some((r) => (r.booking as { projectId?: string } | undefined)?.projectId === id)) {
    await mutateCollection("proposals", (list) => list.map((r) => ((r.booking as { projectId?: string } | undefined)?.projectId === id ? { ...r, booking: undefined } : r)), `Unbook the deleted project ${title} from its quote`, author);
  }
  await deleteRecord("projects", id, author);
  return { removed };
}
