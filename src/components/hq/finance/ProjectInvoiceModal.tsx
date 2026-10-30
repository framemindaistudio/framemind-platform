"use client";

import { useId, useMemo, useState } from "react";
import { AlertTriangle, FilePlus2, Loader2 } from "lucide-react";
import type { CompanySettings } from "@/lib/hq/settings";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/form";
import { Modal } from "@/components/ui/Overlay";
import { formatINR } from "@/lib/utils";
import { invoiceFromProject, invoiceMath, milestonesOfProject, str, type Rec } from "./finance";

/**
 * "Invoice a project" — pick a project and the milestone to bill (from the quote's payment plan), or a custom amount.
 * The draft is billed to the project's client; everything can be edited before it is issued.
 */
export function ProjectInvoiceModal({
  open,
  onClose,
  projects,
  clients,
  invoices,
  settings,
  today,
  initialProjectId,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  projects: Rec[];
  clients: Rec[];
  invoices: Rec[];
  settings: CompanySettings;
  today: string;
  initialProjectId: string | null;
  onCreate: (record: Record<string, unknown>, milestoneId?: string) => Promise<void>;
}) {
  const selectId = useId();
  const [picked, setPicked] = useState<string>(initialProjectId ?? "");
  const [msId, setMsId] = useState("");
  const [custom, setCustom] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const sorted = useMemo(() => [...projects].filter((p) => str(p.stage) !== "cancelled").sort((a, b) => str(b.startDate).localeCompare(str(a.startDate))), [projects]);
  const project = sorted.find((p) => p.id === picked);
  const client = project ? clients.find((c) => c.id === str(project.clientId)) : undefined;
  const ms = project ? milestonesOfProject(project) : [];
  const open_ = ms.filter((m) => !m.invoiceId && m.status !== "paid");
  const milestone = ms.find((m) => m.id === msId) ?? (msId === "custom" ? null : open_[0] ?? null);
  const draft = project ? invoiceFromProject(project, client, settings, today, msId === "custom" ? null : milestone, Number(custom) || 0) : null;
  const math = draft ? invoiceMath(draft.record as Rec, settings) : null;
  const existing = project ? invoices.filter((i) => i.projectId === project.id && str(i.status) !== "cancelled") : [];

  async function create() {
    if (!draft) return;
    setBusy(true);
    setError("");
    try {
      await onCreate(draft.record, msId === "custom" ? undefined : milestone?.id);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create the invoice");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Invoice a project"
      size="max-w-xl"
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" onClick={create} disabled={!draft || busy}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : <FilePlus2 className="size-4" />} Create draft invoice
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Project" htmlFor={selectId}>
          <Select id={selectId} value={picked} onChange={(e) => { setPicked(e.target.value); setMsId(""); }}>
            <option value="">Choose a project…</option>
            {sorted.map((p) => (
              <option key={p.id} value={p.id}>
                {str(p.title) || "Untitled project"}
              </option>
            ))}
          </Select>
        </Field>
        {!sorted.length && <p className="rounded border border-graphite/15 bg-graphite/[0.04] px-3 py-2 text-sm text-charcoal">No projects yet. Start one from an accepted quote, or under Projects.</p>}
        {project && (
          <Field label="What to bill">
            <Select value={msId || milestone?.id || "custom"} onChange={(e) => setMsId(e.target.value)}>
              {ms.map((m) => (
                <option key={m.id} value={m.id} disabled={!!m.invoiceId}>
                  {m.label} — {formatINR(m.amount)}
                  {m.invoiceId ? " (invoiced)" : m.status === "paid" ? " (paid)" : ""}
                </option>
              ))}
              <option value="custom">A custom amount</option>
            </Select>
          </Field>
        )}
        {project && msId === "custom" && (
          <Field label="Amount before GST">
            <Input type="number" min={0} value={custom} onChange={(e) => setCustom(e.target.value)} />
          </Field>
        )}
        {existing.length > 0 && (
          <p className="flex items-start gap-2 rounded border border-warn/30 bg-warn/10 px-3 py-2 text-xs text-warn">
            <AlertTriangle className="mt-px size-4 shrink-0" /> This project already has {existing.length === 1 ? "an invoice" : `${existing.length} invoices`}.
          </p>
        )}
        {draft && math && (
          <div className="rounded-[var(--radius-md)] border border-graphite/12 bg-paper p-3 text-sm">
            <p className="font-semibold">{str(draft.record.customerName) || "No client linked"}</p>
            <p className="mt-1 text-xs text-charcoal">{(draft.record.items as { description: string }[])[0]?.description}</p>
            <p className="tabular mt-2 font-semibold">
              {math.gstPercent > 0 ? `${formatINR(math.taxable)} + GST = ${formatINR(math.total)}` : `${formatINR(math.total)} (no GST)`}
            </p>
            {draft.warnings.map((w) => (
              <p key={w} className="mt-1 text-xs text-warn">
                {w}
              </p>
            ))}
          </div>
        )}
        {error && <p className="text-sm text-bad">{error}</p>}
      </div>
    </Modal>
  );
}
