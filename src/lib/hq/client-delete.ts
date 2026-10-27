import "server-only";
import { updatePortalAccounts } from "@/lib/portal/auth";
import { deleteProject } from "./project-delete";
import { deleteRecord, getRecord, listRecords, mutateCollection } from "./records";
import type { BaseRecord } from "./collections";

/**
 * Deleting a client takes what belongs only to it with it:
 *
 *   deleted with it  its projects (each the way a project is deleted: see project-delete.ts), its quotes, its
 *                    activity notes, and its client portal logins
 *   kept, unlinked   the leads it came from, VRITTA licences and case studies
 *   blocks it        invoices: a tax invoice is never removed silently. Delete the draft, or cancel the invoice in
 *                    Finance, first
 *
 * The client goes last, so a failure half-way never leaves records pointing at a client that no longer exists.
 */
const DELETED_WITH = [
  { name: "proposals", label: "quotes" },
  { name: "activities", label: "activity notes" },
] as const;
const UNLINKED = ["leads", "vrittaLicences", "caseStudies"] as const;

const linked = (r: BaseRecord, id: string) => r.clientId === id;

export class ClientHasInvoices extends Error {
  constructor(public invoices: { id: string; number: string; status: string }[]) {
    super(`This client has ${invoices.length === 1 ? "an invoice" : `${invoices.length} invoices`} (${invoices.map((i) => i.number || "draft").join(", ")}). Delete the draft or cancel the invoice in Finance first: a tax invoice is never removed with a client.`);
    this.name = "ClientHasInvoices";
  }
}

export async function deleteClient(id: string, author: string) {
  const c = await getRecord("clients", id);
  if (!c) return { removed: 0 };
  const name = String(c.name ?? id).slice(0, 60);
  const projectIds = (await listRecords("projects")).filter((p) => linked(p, id)).map((p) => p.id);
  const invoices = (await listRecords("invoices")).filter((r) => linked(r, id) || projectIds.includes(String(r.projectId ?? "")));
  if (invoices.length) throw new ClientHasInvoices(invoices.map((r) => ({ id: r.id, number: String(r.number ?? ""), status: String(r.status ?? "draft") })));

  let removed = 0;
  for (const pid of projectIds) {
    removed += 1 + (await deleteProject(pid, author)).removed;
  }
  for (const col of DELETED_WITH) {
    const n = (await listRecords(col.name)).filter((r) => linked(r, id)).length;
    if (!n) continue;
    await mutateCollection(col.name, (list) => list.filter((r) => !linked(r, id)), `Delete ${n} ${col.label} of the deleted client ${name}`, author);
    removed += n;
  }
  for (const col of UNLINKED) {
    const n = (await listRecords(col)).filter((r) => linked(r, id)).length;
    if (!n) continue;
    await mutateCollection(col, (list) => list.map((r) => (linked(r, id) ? { ...r, clientId: undefined } : r)), `Unlink ${n} ${col} from the deleted client ${name}`, author);
  }
  await updatePortalAccounts((list) => list.filter((a) => a.clientId !== id), `Remove the client portal logins of the deleted client ${name}`, author);
  await deleteRecord("clients", id, author);
  return { removed };
}
