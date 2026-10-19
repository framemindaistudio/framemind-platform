import "server-only";
import { deleteRecord, getRecord, listRecords, mutateCollection } from "./records";
import type { BaseRecord } from "./collections";

/**
 * Deleting a project takes what belongs only to it with it, so nothing is left pointing at a project that no longer
 * exists:
 *
 *   deleted with it  its deliverables (Production) and its shoots
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
