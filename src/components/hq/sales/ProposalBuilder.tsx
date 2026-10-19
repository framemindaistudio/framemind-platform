"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowDown, ArrowUp, ChevronDown, Copy, ExternalLink, FolderPlus, Loader2, Plus, Printer, RefreshCw, Save, Send, Trash2 } from "lucide-react";
import { COACHING, VRITTA, type ServiceId } from "@/lib/content/catalog";
import { getCollection, type BaseRecord, type LineItem } from "@/lib/hq/collections";
import { can } from "@/lib/hq/roles";
import { bundlePercent, priceService, priceVritta, splitMilestones, type QuoteLine, type QuoteMoney } from "@/lib/pricebook/math";
import type { Milestone, RateCard } from "@/lib/pricebook/types";
import { Badge, statusTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ConfirmButton } from "@/components/ui/Overlay";
import { Checkbox, Input, Label, Select, Textarea } from "@/components/ui/form";
import { nextNumber, useCollection, useHq, useRates, useSettings, useShowMoney } from "@/components/hq/data";
import { prepareInvoice } from "@/components/hq/finance/finance";
import { LineItemsEditor } from "@/components/hq/fields";
import { HqIcon } from "@/components/hq/Icon";
import { EmptyState, Loading, PageHeader, Panel } from "@/components/hq/ui";
import { cn, formatDate, formatINR } from "@/lib/utils";
import { BackLink, Notice } from "./bits";
import { addDays, str, todayIso } from "./crm";
import { blankQuote, bookingOf, coachingLine, customLine, extraItemsOf, linesOf, milestonePlan, milestonesOf, moneyOf, projectFromQuote, repriceService, serviceLine, servicesOf, vrittaLine, type Booking } from "./quote";

const proposalsDef = getCollection("proposals")!;
const STATUS_OPTIONS = proposalsDef.fields.find((f) => f.key === "status")?.options ?? [];

const num = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

/* ─────────────────────────── loader / not-found ─────────────────────────── */

export function ProposalBuilder({ id, clientId, leadId, created }: { id?: string; clientId?: string; leadId?: string; created?: boolean }) {
  const proposals = useCollection("proposals");
  const clients = useCollection("clients");
  const leads = useCollection("leads");
  const rates = useRates();

  if (proposals.loading || clients.loading || (leadId && leads.loading)) return <Loading label="Loading quote…" />;
  const existing = id ? proposals.records.find((r) => r.id === id) : undefined;
  if (id && !existing) {
    return (
      <div>
        <BackLink href="/hq/proposals">Quotes</BackLink>
        <EmptyState icon="FileSignature" title="Quote not found" description="It may have been deleted, or the link is out of date." action={<Button size="sm" href="/hq/proposals">All quotes</Button>} />
      </div>
    );
  }
  if (!rates) return <EmptyState icon="FileSignature" title="Quotes need the rate card" description="Your login does not receive the rate card." />;
  return (
    <BuilderForm
      key={existing?.id ?? "new"}
      rates={rates}
      initial={existing ?? null}
      presetClient={clientId ? clients.records.find((s) => s.id === clientId) : undefined}
      presetLead={leadId ? leads.records.find((l) => l.id === leadId) : undefined}
      created={created}
    />
  );
}

/* ─────────────────────────── the builder ─────────────────────────── */

function BuilderForm({ rates, initial, presetClient, presetLead, created }: { rates: RateCard; initial: BaseRecord | null; presetClient?: BaseRecord; presetLead?: BaseRecord; created?: boolean }) {
  const router = useRouter();
  const { user, store } = useHq();
  const showMoney = useShowMoney();
  const proposals = useCollection("proposals");
  const clientsCol = useCollection("clients");
  const activities = useCollection("activities");
  const projects = useCollection("projects");
  const invoices = useCollection(showMoney ? "invoices" : "__none");
  const { settings } = useSettings();
  const leads = useCollection("leads");
  const canWrite = can(user, proposalsDef.write) && store.writable;

  const [form, setForm] = useState<Record<string, unknown>>(() => (initial ? { ...initial } : blankQuote(rates, presetClient, presetLead)));
  const [snapshot, setSnapshot] = useState(() => JSON.stringify(initial ?? null));
  const [persistedStatus, setPersistedStatus] = useState<string>(() => str(initial?.status));
  const [saving, setSaving] = useState<"save" | "pdf" | "send" | "book" | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(created ? "Quote created." : presetLead ? "Started from the enquiry — check each service's options, then save." : "");
  const [open, setOpen] = useState<string | null>(() => linesOf(form)[0]?.key ?? null);

  const set = (patch: Record<string, unknown>) => {
    setForm((f) => ({ ...f, ...patch }));
    setNotice("");
  };
  const lines = linesOf(form);
  const setLines = (next: QuoteLine[]) => set({ lines: next, services: servicesOf(next) });
  const setLine = (key: string, line: QuoteLine) => setLines(lines.map((l) => (l.key === key ? line : l)));

  const clients = useMemo(() => [...clientsCol.records].sort((a, b) => str(a.name).localeCompare(str(b.name))), [clientsCol.records]);
  const client = clients.find((s) => s.id === form.clientId);
  const money = useMemo(() => moneyOf(form, rates), [form, rates]);
  const milestones = milestonesOf(form, rates.terms.milestones);
  const plan = milestonePlan(form, money, rates.terms.milestones);
  const milestoneSum = milestones.reduce((s, m) => s + m.percent, 0);

  const isNew = !form.id;
  const dirty = isNew || JSON.stringify(form) !== snapshot;

  useEffect(() => {
    if (!dirty || isNew) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty, isNew]);

  const bundleTouched = useRef(false);

  function add(line: QuoteLine) {
    setLines([...lines, line]);
    setOpen(line.key);
    const serviceCount = new Set([...lines, line].filter((l) => l.kind === "service").map((l) => (l as Extract<QuoteLine, { kind: "service" }>).serviceId)).size;
    // the bundle switches itself on at the second service, unless someone has set the checkbox by hand
    if (serviceCount >= 2 && !bundleTouched.current && form.applyBundle !== true) set({ applyBundle: true });
  }

  /* ── persistence ── */
  async function persist(overrides: Record<string, unknown> = {}, mode: "save" | "pdf" | "send" = "save"): Promise<BaseRecord | null> {
    if (!form.clientId) {
      setError("Choose the client this quote is for.");
      return null;
    }
    if (milestones.length && Math.abs(milestoneSum - 100) > 0.01) {
      setError(`The payment milestones add up to ${milestoneSum}%, not 100%.`);
      return null;
    }
    setSaving(mode);
    setError("");
    setNotice("");
    try {
      const merged = { ...form, ...overrides };
      const m = moneyOf(merged, rates);
      const number = str(merged.number) || (await nextNumber("proposal"));
      const saved = await proposals.save({ ...merged, number, services: servicesOf(linesOf(merged)), total: m.taxable, grandTotal: m.total, status: str(merged.status) || "draft" });
      setForm(saved);
      setSnapshot(JSON.stringify(saved));
      const prev = persistedStatus;
      setPersistedStatus(str(saved.status));
      let crmNote = "";
      try {
        crmNote = await syncCrm(saved, m, prev);
      } catch {
        crmNote = " The CRM could not be updated automatically.";
      }
      setNotice(`Saved as ${number}.${crmNote}`);
      if (isNew) router.replace(`/hq/proposals/${saved.id}?created=1`);
      return saved;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save the quote");
      return null;
    } finally {
      setSaving(null);
    }
  }

  /** Keep the client's stage, deal value and follow-ups in step with the quote's status. */
  async function syncCrm(saved: BaseRecord, m: QuoteMoney, prevStatus: string) {
    const target = clientsCol.records.find((s) => s.id === saved.clientId);
    if (!target) return "";
    const status = str(saved.status);
    if (status === prevStatus || (status !== "sent" && status !== "accepted")) return "";
    const today = todayIso();
    const stage = str(target.stage) || "lead";
    const patch: Record<string, unknown> = {};
    const notes: string[] = [];
    if (status === "sent") {
      if (["lead", "contacted", "discovery"].includes(stage)) {
        patch.stage = "quoted";
        notes.push("Client moved to Quote sent");
      }
      if (!num(target.dealValue)) patch.dealValue = m.taxable;
      if (!target.nextFollowUp || str(target.nextFollowUp) <= today) {
        patch.nextFollowUp = addDays(today, 3);
        notes.push("follow-up set for 3 days from now");
      }
      patch.lastContact = today;
    } else {
      if (stage !== "won" && stage !== "active") {
        patch.stage = "won";
        notes.push("Client marked Won");
      }
      patch.dealValue = m.taxable;
    }
    await clientsCol.save({ ...target, ...patch });
    await activities.save({
      clientId: target.id,
      type: "Quote",
      date: today,
      summary: status === "sent" ? `Quote ${str(saved.number)} sent — ${str(saved.title) || "studio work"}, ${formatINR(m.taxable)} + GST` : `Quote ${str(saved.number)} accepted — ${formatINR(m.taxable)} + GST`,
      outcome: status === "accepted" ? "Positive" : "Neutral",
      nextStep: status === "sent" ? "Follow up on the quote" : "Start the project and collect the advance",
      nextDate: addDays(today, status === "sent" ? 3 : 1),
      by: user.name,
    });
    if (status === "accepted" && saved.leadId) {
      const lead = leads.records.find((l) => l.id === saved.leadId);
      if (lead && lead.status !== "converted") await leads.save({ ...lead, status: "converted", clientId: target.id });
    }
    return notes.length ? ` ${notes.join("; ")}.` : "";
  }

  /** Accepted quote → the project (with its milestones), a draft invoice for the first milestone, the client active. */
  async function startProject() {
    if (!form.id || bookingOf(form as BaseRecord)) return;
    setSaving("book");
    setError("");
    try {
      const q = form as BaseRecord;
      const project = await projects.save(projectFromQuote(q, money, rates.terms.milestones, client));
      let invoiceId: string | undefined;
      const first = plan[0];
      if (showMoney && first && first.amount > 0) {
        const today = todayIso();
        // the same preparation as Finance → Invoices (number, totals, status), so both routes make the same invoice
        const draft = await prepareInvoice(
          {
            date: today,
            dueDate: addDays(today, 7),
            clientId: str(q.clientId),
            projectId: project.id,
            milestone: `${first.label} (${first.percent}%)`,
            customerName: str(client?.name),
            customerGstin: str(client?.gstin),
            customerAddress: [str(client?.address), str(client?.city)].filter(Boolean).join(", "),
            placeOfSupply: settings.state,
            gstPercent: money.gstPercent,
            items: [{ description: `${str(q.title) || "Studio project"} — ${first.label} (${first.percent}% of quote ${str(q.number)})`, qty: 1, rate: first.amount, sac: settings.sacCode || undefined }],
            status: "draft",
            payments: [],
          },
          { today, settings, reserveNumber: () => nextNumber("invoice") },
        );
        const inv = await invoices.save(draft);
        invoiceId = inv.id;
        const ms = (project.milestones as Record<string, unknown>[]).map((m, i) => (i === 0 ? { ...m, status: "invoiced", invoiceId: inv.id } : m));
        await projects.save({ ...project, milestones: ms });
      }
      if (client) await clientsCol.save({ ...client, stage: "active" });
      const booking: Booking = { bookedOn: todayIso(), projectId: project.id, invoiceId };
      const saved = await proposals.save({ ...form, status: "accepted", booking });
      setForm(saved);
      setSnapshot(JSON.stringify(saved));
      setNotice(`Project created${invoiceId ? " with a draft invoice for the first milestone" : ""}. The client is now Active.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start the project");
    } finally {
      setSaving(null);
    }
  }

  async function saveAndOpenPdf() {
    const saved = dirty ? await persist({}, "pdf") : form;
    const id = str(saved?.id);
    if (id) router.push(`/hq/print/proposal/${id}`);
  }

  async function duplicate() {
    if (!form.id) return;
    setSaving("save");
    setError("");
    try {
      const copy = { ...form, number: "", status: "draft", date: todayIso(), validUntil: addDays(todayIso(), rates.terms.validityDays) } as Record<string, unknown>;
      for (const k of ["id", "createdAt", "updatedAt", "createdBy", "updatedBy", "booking"]) delete copy[k];
      const saved = await proposals.save({ ...copy, number: await nextNumber("proposal") });
      router.push(`/hq/proposals/${saved.id}?created=1`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not duplicate");
      setSaving(null);
    }
  }

  async function remove() {
    try {
      await proposals.remove(str(form.id));
      router.push("/hq/proposals");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete");
    }
  }

  const status = str(form.status) || "draft";
  const booked = bookingOf(form as BaseRecord);
  const busy = saving !== null;
  const serviceIds = new Set(lines.filter((l) => l.kind === "service").map((l) => (l as Extract<QuoteLine, { kind: "service" }>).serviceId));
  const bundleAvailable = bundlePercent(serviceIds.size, rates.bundleSteps);

  return (
    <div>
      <BackLink href="/hq/proposals">Quotes</BackLink>
      <PageHeader
        eyebrow="Sales · 03"
        title={isNew ? "New quote" : `Quote ${str(form.number) || "(draft)"}`}
        icon="FileSignature"
        description={client ? `For ${str(client.name)}${client.city ? `, ${str(client.city)}` : ""} — priced live from the rate card.` : "Choose a client, then add services and configure them exactly like the website's pricing page."}
        actions={
          <>
            <Badge tone={statusTone(status)} dot>
              {status}
            </Badge>
            {!isNew && !dirty && (
              <Button variant="secondary" size="sm" className="h-10" href={`/hq/print/proposal/${str(form.id)}`}>
                <Printer className="size-4" aria-hidden /> Print / PDF
              </Button>
            )}
          </>
        }
      />

      {!canWrite && <Notice className="mb-4">{store.writable || store.viewOnly ? "You have view-only access to quotes." : "HQ is in read-only mode — changes cannot be saved."}</Notice>}
      {error && <Notice tone="bad" className="mb-4">{error}</Notice>}
      {notice && <Notice tone="ok" className="mb-4">{notice}</Notice>}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
        <fieldset disabled={!canWrite} className="m-0 min-w-0 space-y-6 border-0 p-0">
          <legend className="sr-only">Quote details</legend>

          {/* 01 client */}
          <Panel title={<StepTitle n="01">Client &amp; project</StepTitle>}>
            <div className="grid gap-4 sm:grid-cols-6">
              <div className="sm:col-span-4">
                <Label htmlFor="q-client">Client</Label>
                <Select id="q-client" value={str(form.clientId)} onChange={(e) => set({ clientId: e.target.value })} required>
                  <option value="">Choose a client…</option>
                  {clients.map((s) => (
                    <option key={s.id} value={s.id}>
                      {str(s.name)}
                      {s.city ? ` — ${str(s.city)}` : ""}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="q-date">Quote date</Label>
                <Input id="q-date" type="date" value={str(form.date)} onChange={(e) => set({ date: e.target.value })} className="tabular" />
              </div>
              <div className="sm:col-span-6">
                <Label htmlFor="q-title">Project title (printed on the quote)</Label>
                <Input id="q-title" value={str(form.title)} onChange={(e) => set({ title: e.target.value })} placeholder="e.g. Website + brand refresh for the new campus" />
              </div>
              {client ? (
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-[var(--radius-sm)] border border-graphite/10 bg-paper px-3.5 py-2.5 text-xs text-charcoal sm:col-span-6">
                  <span className="font-semibold text-graphite">{str(client.name)}</span>
                  <span>{[client.contactName, client.phone].filter(Boolean).map(String).join(" · ") || "No contact on file"}</span>
                  {client.budgetBand ? <span>Budget {str(client.budgetBand)}</span> : null}
                  <Link href={`/hq/crm/${client.id}`} className="ml-auto inline-flex items-center gap-1 font-semibold text-graphite underline-offset-4 hover:underline">
                    Open client <ExternalLink className="size-3" aria-hidden />
                  </Link>
                </div>
              ) : (
                <p className="text-xs text-blueprint sm:col-span-6">
                  Not in the CRM yet?{" "}
                  <Link href="/hq/crm" className="font-semibold text-graphite underline-offset-4 hover:underline">
                    Add the client first
                  </Link>
                  .
                </p>
              )}
            </div>
          </Panel>

          {/* 02 services */}
          <Panel title={<StepTitle n="02">Services</StepTitle>} subtitle="Add each service and pick its options — the same choices and prices as the website's pricing page.">
            <div className="flex flex-wrap gap-2">
              {rates.services.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => add(serviceLine(rates, s.id))}
                  className="inline-flex items-center gap-2 rounded-full border border-graphite/20 bg-paper-50 px-3 py-1.5 text-xs font-semibold text-graphite transition-colors hover:border-graphite hover:bg-lime"
                >
                  <HqIcon name={s.icon} className="size-3.5" /> {s.name}
                </button>
              ))}
              <button type="button" onClick={() => add(coachingLine(rates))} className="inline-flex items-center gap-2 rounded-full border border-graphite/20 bg-paper-50 px-3 py-1.5 text-xs font-semibold text-graphite hover:border-graphite hover:bg-lime">
                <HqIcon name="GraduationCap" className="size-3.5" /> AI Coaching
              </button>
              <button type="button" onClick={() => add(vrittaLine(rates))} className="inline-flex items-center gap-2 rounded-full border border-graphite/20 bg-paper-50 px-3 py-1.5 text-xs font-semibold text-graphite hover:border-graphite hover:bg-lime">
                <HqIcon name="Newspaper" className="size-3.5" /> Vritta
              </button>
              <button type="button" onClick={() => add(customLine())} className="inline-flex items-center gap-2 rounded-full border border-dashed border-graphite/30 px-3 py-1.5 text-xs font-semibold text-charcoal hover:border-graphite">
                <Plus className="size-3.5" /> Custom work
              </button>
            </div>

            <div className="mt-5 space-y-3">
              {lines.length === 0 && <p className="rounded-[var(--radius-md)] border border-dashed border-graphite/20 px-4 py-8 text-center text-sm text-charcoal">Add a service above to start the quote.</p>}
              {lines.map((l, i) => (
                <LineCard
                  key={l.key}
                  line={l}
                  rates={rates}
                  open={open === l.key}
                  onToggle={() => setOpen(open === l.key ? null : l.key)}
                  onChange={(next) => setLine(l.key, next)}
                  onRemove={() => setLines(lines.filter((x) => x.key !== l.key))}
                  onMove={(by) => {
                    const j = i + by;
                    if (j < 0 || j >= lines.length) return;
                    const next = [...lines];
                    [next[i], next[j]] = [next[j], next[i]];
                    setLines(next);
                  }}
                  editable={canWrite}
                />
              ))}
            </div>
          </Panel>

          {/* 03 discounts */}
          <Panel title={<StepTitle n="03">Discounts &amp; extra items</StepTitle>}>
            <div className="grid gap-4 sm:grid-cols-6">
              <div className="sm:col-span-6">
                <Checkbox
                  checked={form.applyBundle === true}
                  onChange={(e) => {
                    bundleTouched.current = true;
                    set({ applyBundle: e.target.checked });
                  }}
                  label={
                    <span>
                      <span className="font-semibold">Studio bundle discount</span>
                      <span className="block text-xs text-charcoal">
                        {serviceIds.size} studio service{serviceIds.size === 1 ? "" : "s"} on this quote →{" "}
                        {bundleAvailable ? `${bundleAvailable}% off` : `no bundle discount (from ${rates.bundleSteps[0]?.services ?? 2} services)`}
                      </span>
                    </span>
                  }
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="q-discount">Extra discount %</Label>
                <Input id="q-discount" type="number" min={0} max={100} step={0.5} inputMode="decimal" value={num(form.discountPercent) || ""} placeholder="0" onChange={(e) => set({ discountPercent: Math.min(100, Math.max(0, num(e.target.value))) })} className="tabular" />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="q-gst">GST %</Label>
                <Input id="q-gst" type="number" min={0} max={40} inputMode="decimal" value={num(form.gstPercent)} onChange={(e) => set({ gstPercent: Math.min(40, Math.max(0, num(e.target.value))) })} className="tabular" />
              </div>
              <div className="sm:col-span-6">
                <Label>Extra line items (ex-GST, one-time)</Label>
                <LineItemsEditor value={form.extraItems} onChange={(items: LineItem[]) => set({ extraItems: items })} disabled={!canWrite} />
              </div>
            </div>
          </Panel>

          {/* 04 payment & terms */}
          <Panel title={<StepTitle n="04">Payment, timeline &amp; terms</StepTitle>}>
            <div className="grid gap-4 sm:grid-cols-6">
              <div className="sm:col-span-6">
                <Label>Payment milestones</Label>
                <div className="space-y-2">
                  {milestones.map((m, i) => (
                    <div key={i} className="grid grid-cols-[1fr_100px_120px_auto] items-center gap-2">
                      <Input aria-label="Milestone" value={m.label} onChange={(e) => set({ milestones: milestones.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) })} />
                      <div className="relative">
                        <Input aria-label="Percent" type="number" min={0} max={100} value={m.percent} onChange={(e) => set({ milestones: milestones.map((x, j) => (j === i ? { ...x, percent: num(e.target.value) } : x)) })} className="tabular pr-7" />
                        <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-blueprint">%</span>
                      </div>
                      <span className="tabular text-right text-sm text-charcoal">{formatINR(plan[i]?.amount ?? 0)}</span>
                      <button type="button" onClick={() => set({ milestones: milestones.filter((_, j) => j !== i) })} className="rounded p-2 text-blueprint hover:bg-bad/10 hover:text-bad" aria-label="Remove milestone">
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  ))}
                  <div className="flex items-center justify-between">
                    <button type="button" onClick={() => set({ milestones: [...milestones, { label: "Milestone", percent: 0 } as Milestone] })} className="inline-flex items-center gap-1.5 rounded px-2 py-1 text-xs font-semibold text-charcoal hover:bg-graphite/5">
                      <Plus className="size-3.5" /> Add a milestone
                    </button>
                    <span className={cn("text-xs font-semibold", Math.abs(milestoneSum - 100) < 0.01 ? "text-ok" : "text-bad")}>{milestoneSum}% of the one-time work</span>
                  </div>
                </div>
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="q-weeks">Timeline (weeks)</Label>
                <Input id="q-weeks" type="number" min={0} max={104} value={num(form.timelineWeeks) || ""} placeholder="e.g. 4" onChange={(e) => set({ timelineWeeks: Math.max(0, num(e.target.value)) })} className="tabular" />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="q-rev">Revision rounds</Label>
                <Input id="q-rev" type="number" min={0} max={20} value={num(form.revisionRounds)} onChange={(e) => set({ revisionRounds: Math.max(0, num(e.target.value)) })} className="tabular" />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="q-valid">Valid until</Label>
                <Input id="q-valid" type="date" value={str(form.validUntil)} onChange={(e) => set({ validUntil: e.target.value })} className="tabular" />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="q-status">Status</Label>
                <Select id="q-status" value={status} onChange={(e) => set({ status: e.target.value })}>
                  {STATUS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="flex items-end sm:col-span-4">
                <Checkbox checked={form.includeTerms !== false} onChange={(e) => set({ includeTerms: e.target.checked })} label="Print the studio's standard terms (revisions, client responsibilities, handoff)" />
              </div>
              <div className="sm:col-span-6">
                <Label htmlFor="q-notes">Notes / special terms</Label>
                <Textarea id="q-notes" rows={4} value={str(form.notes)} onChange={(e) => set({ notes: e.target.value })} placeholder="Printed on the quote — e.g. what the client provides, launch date, anything agreed on the call" />
              </div>
            </div>
          </Panel>
        </fieldset>

        {/* ── live summary ── */}
        <aside className="min-w-0 xl:sticky xl:top-4 xl:self-start">
          <QuoteSummary money={money} lines={lines} extra={extraItemsOf(form)} plan={plan} />
          {booked && (
            <div className="mt-4 rounded-[var(--radius-md)] border border-ok/30 bg-ok/5 p-4">
              <p className="annot mb-2 text-charcoal">Project started {formatDate(booked.bookedOn)}</p>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="secondary" href={`/hq/projects/${booked.projectId}`}>
                  Open project
                </Button>
                {booked.invoiceId && showMoney && (
                  <Button size="sm" variant="ghost" href="/hq/finance?tab=invoices">
                    Draft invoice
                  </Button>
                )}
              </div>
            </div>
          )}
          <div className="mt-4 flex flex-col gap-2.5">
            {canWrite && (
              <>
                <Button className="h-11 w-full" onClick={() => persist({}, "save")} disabled={busy || (!dirty && !isNew)}>
                  {saving === "save" ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Save className="size-4" aria-hidden />} {isNew ? "Create quote" : dirty ? "Save changes" : "Saved"}
                </Button>
                <div className="grid grid-cols-2 gap-2.5">
                  <Button variant="secondary" className="h-11" onClick={saveAndOpenPdf} disabled={busy}>
                    {saving === "pdf" ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Printer className="size-4" aria-hidden />} {dirty ? "Save & PDF" : "Print / PDF"}
                  </Button>
                  <Button variant="secondary" className="h-11" onClick={() => persist({ status: "sent" }, "send")} disabled={busy || status === "sent" || status === "accepted"} title="Saves the quote as sent, moves the client to Quote sent and logs the activity">
                    {saving === "send" ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Send className="size-4" aria-hidden />} Mark sent
                  </Button>
                </div>
                {status === "sent" && (
                  <Button variant="ghost" size="sm" className="w-full" onClick={() => persist({ status: "accepted" }, "save")} disabled={busy}>
                    Mark accepted — client won
                  </Button>
                )}
                {status === "accepted" && !isNew && !booked && (
                  <div className="rounded-[var(--radius-md)] border border-graphite/15 bg-paper-50 p-3">
                    <Button variant="lime" className="h-11 w-full" onClick={startProject} disabled={busy || dirty} title={dirty ? "Save the changes first" : undefined}>
                      {saving === "book" ? <Loader2 className="size-4 animate-spin" /> : <FolderPlus className="size-4" aria-hidden />} Start the project
                    </Button>
                    <p className="mt-2 text-[11px] leading-snug text-blueprint">{dirty ? "Save the changes first. " : ""}Creates the project with its payment milestones, a draft invoice for the first milestone, and marks the client Active.</p>
                  </div>
                )}
                {!isNew && (
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <button type="button" onClick={duplicate} disabled={busy} className="inline-flex items-center gap-1.5 rounded px-2 py-1.5 text-xs font-semibold text-charcoal hover:bg-graphite/5 disabled:opacity-50">
                      <Copy className="size-3.5" aria-hidden /> Duplicate
                    </button>
                    <ConfirmButton onConfirm={remove} message="Delete this quote? It stays in the change history." className="inline-flex items-center gap-1.5 rounded px-2 py-1.5 text-xs font-semibold text-bad hover:bg-bad/10">
                      <Trash2 className="size-3.5" aria-hidden /> Delete
                    </ConfirmButton>
                  </div>
                )}
              </>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

function StepTitle({ n, children }: { n: string; children: React.ReactNode }) {
  return (
    <span className="flex items-center gap-2.5">
      <span className="font-mono text-[11px] font-medium text-blueprint">{n}</span>
      {children}
    </span>
  );
}

/* ─────────────────────────── one line of the quote ─────────────────────────── */

function LineCard({
  line,
  rates,
  open,
  onToggle,
  onChange,
  onRemove,
  onMove,
  editable,
}: {
  line: QuoteLine;
  rates: RateCard;
  open: boolean;
  onToggle: () => void;
  onChange: (l: QuoteLine) => void;
  onRemove: () => void;
  onMove: (by: number) => void;
  editable: boolean;
}) {
  const service = line.kind === "service" ? rates.services.find((s) => s.id === line.serviceId) : undefined;
  const icon = line.kind === "service" ? (service?.icon ?? "Circle") : line.kind === "coaching" ? "GraduationCap" : line.kind === "vritta" ? "Newspaper" : "Plus";
  // a service line whose stored prices no longer match today's rate card
  const stale = line.kind === "service" && service && priceService(service, line.selections).subtotal !== line.items.reduce((s, i) => s + i.price, 0);

  return (
    <div className={cn("rounded-[var(--radius-md)] border transition-colors", open ? "border-graphite bg-paper" : "border-graphite/15 bg-paper-50")}>
      <div className="flex items-center gap-3 px-4 py-3">
        <span className={cn("grid size-9 shrink-0 place-items-center rounded-full", open ? "bg-lime text-graphite" : "bg-graphite/[0.06] text-graphite")}>
          <HqIcon name={icon} className="size-4" />
        </span>
        <button type="button" onClick={onToggle} className="min-w-0 flex-1 text-left">
          <span className="block truncate text-sm font-semibold text-graphite">{line.title}</span>
          <span className="block truncate text-xs text-blueprint">
            {line.kind === "service" ? `${line.items.filter((i) => i.price > 0).length} paid option${line.items.filter((i) => i.price > 0).length === 1 ? "" : "s"}${line.billing === "month" ? ` · ${line.months ?? 1}-month contract` : ""}` : line.kind === "vritta" ? `${line.segment} · ${line.billing}${line.group ? " · group rate" : ""}` : line.kind === "coaching" ? `${line.learners} learner${line.learners === 1 ? "" : "s"}` : `${line.items.length} item${line.items.length === 1 ? "" : "s"}`}
          </span>
        </button>
        <span className="tabular shrink-0 text-right text-sm font-bold">
          {formatINR(line.amount)}
          {"billing" in line && line.billing === "month" && <span className="block text-[10px] font-normal text-blueprint">per month</span>}
        </span>
        <button type="button" onClick={onToggle} className="rounded p-1.5 text-blueprint hover:bg-graphite/5" aria-label={open ? "Collapse" : "Expand"}>
          <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} />
        </button>
      </div>

      {open && (
        <div className="space-y-5 border-t border-graphite/10 px-4 py-4">
          {stale && editable && line.kind === "service" && (
            <p className="flex flex-wrap items-center gap-2 rounded-[var(--radius-sm)] border border-warn/30 bg-warn/10 px-3 py-2 text-xs text-warn">
              <AlertTriangle className="size-3.5" /> The rate card has changed since this line was priced.
              <button type="button" onClick={() => onChange(repriceService(line, rates))} className="inline-flex items-center gap-1 font-semibold underline underline-offset-2">
                <RefreshCw className="size-3" /> Re-price at today&apos;s rates
              </button>
            </p>
          )}

          {line.kind === "service" && service && (
            <>
              {service.groups.map((g) => {
                const chosen = line.selections[g.id] ?? [];
                return (
                  <div key={g.id}>
                    <p className="mb-2 flex items-baseline gap-2">
                      <span className="text-sm font-semibold text-graphite">{g.title}</span>
                      <span className="annot text-[9px] text-blueprint">{g.mode === "one" ? "Choose one" : "Choose any"}</span>
                    </p>
                    <div className="grid gap-1.5 sm:grid-cols-2">
                      {g.options.map((o) => {
                        const on = chosen.includes(o.id);
                        return (
                          <label
                            key={o.id}
                            className={cn(
                              "flex cursor-pointer items-start gap-2.5 rounded-[var(--radius-sm)] border px-3 py-2 text-sm transition-colors",
                              on ? "border-graphite bg-lime/25" : "border-graphite/12 bg-paper-50 hover:border-graphite/40",
                              !editable && "cursor-default",
                            )}
                          >
                            <input
                              type={g.mode === "one" ? "radio" : "checkbox"}
                              name={`${line.key}-${g.id}`}
                              checked={on}
                              disabled={!editable}
                              onChange={(e) => {
                                const next = g.mode === "one" ? [o.id] : e.target.checked ? [...chosen, o.id] : chosen.filter((x) => x !== o.id);
                                onChange(repriceService(line, rates, { ...line.selections, [g.id]: next }));
                              }}
                              className="mt-1 accent-[#0d0d0d]"
                            />
                            <span className="min-w-0 flex-1">
                              <span className="flex items-center gap-1.5 font-medium text-graphite">
                                {o.label}
                                {o.badge && <span className="rounded-full bg-graphite px-1.5 py-px text-[9px] font-semibold uppercase tracking-wider text-lime">{o.badge}</span>}
                              </span>
                              {o.detail && <span className="block text-[11px] leading-snug text-blueprint">{o.detail}</span>}
                            </span>
                            <span className="tabular shrink-0 text-xs font-semibold text-charcoal">{o.price ? `+${formatINR(o.price)}` : "Included"}</span>
                          </label>
                        );
                      })}
                    </div>
                    {g.note && <p className="mt-1.5 text-[11px] text-blueprint">ℹ {g.note}</p>}
                  </div>
                );
              })}
              {service.billing === "month" && (
                <div className="max-w-xs">
                  <Label>Contract length</Label>
                  <Select value={String(line.months ?? 1)} onChange={(e) => onChange(repriceService(line, rates, line.selections, Number(e.target.value)))} disabled={!editable}>
                    {rates.socialContracts.map((c) => (
                      <option key={c.months} value={c.months}>
                        {c.label}
                        {c.discountPercent ? ` — save ${c.discountPercent}%` : ""}
                      </option>
                    ))}
                  </Select>
                </div>
              )}
            </>
          )}

          {line.kind === "coaching" && (
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <Label>Mode</Label>
                <Select value={line.mode} disabled={!editable} onChange={(e) => onChange({ ...coachingLine(rates, e.target.value === "offline" ? "offline" : "online", line.learners), key: line.key, note: line.note })}>
                  <option value="online">Online</option>
                  <option value="offline">Offline</option>
                </Select>
              </div>
              <div>
                <Label>Learners</Label>
                <Input type="number" min={1} value={line.learners} disabled={!editable} onChange={(e) => onChange({ ...coachingLine(rates, line.mode, Math.max(1, num(e.target.value))), key: line.key, note: line.note })} className="tabular" />
              </div>
              <div>
                <Label>Fee per learner (ex-GST)</Label>
                <Input type="number" min={0} value={line.learners ? Math.round(line.amount / line.learners) : 0} disabled={!editable} onChange={(e) => onChange({ ...line, amount: Math.max(0, num(e.target.value)) * line.learners })} className="tabular" />
              </div>
              {(line.mode === "online" ? rates.coaching.online : rates.coaching.offline) === 0 && (
                <p className="text-xs text-warn sm:col-span-3">No {line.mode} coaching fee is set in the Rate Card yet — type the fee for this learner, or set it under Money → Rate Card → AI Coaching.</p>
              )}
              <p className="text-[11px] text-blueprint sm:col-span-3">{COACHING.line}</p>
            </div>
          )}

          {line.kind === "vritta" && <VrittaEditor line={line} rates={rates} editable={editable} onChange={onChange} />}

          {line.kind === "custom" && (
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="sm:col-span-2">
                  <Label>Title</Label>
                  <Input value={line.title} disabled={!editable} onChange={(e) => onChange({ ...line, title: e.target.value })} />
                </div>
                <div>
                  <Label>Billing</Label>
                  <Select value={line.billing} disabled={!editable} onChange={(e) => onChange({ ...line, billing: e.target.value === "month" ? "month" : "project" })}>
                    <option value="project">One-time</option>
                    <option value="month">Per month</option>
                  </Select>
                </div>
              </div>
              {line.items.map((it, i) => (
                <div key={i} className="grid grid-cols-[1fr_140px_auto] gap-2">
                  <Input aria-label="Item" value={it.label} disabled={!editable} onChange={(e) => onChange(recalcCustom({ ...line, items: line.items.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) }))} />
                  <Input aria-label="Price" type="number" min={0} value={it.price} disabled={!editable} onChange={(e) => onChange(recalcCustom({ ...line, items: line.items.map((x, j) => (j === i ? { ...x, price: Math.max(0, num(e.target.value)) } : x)) }))} className="tabular" />
                  <button type="button" disabled={!editable} onClick={() => onChange(recalcCustom({ ...line, items: line.items.filter((_, j) => j !== i) }))} className="rounded p-2 text-blueprint hover:bg-bad/10 hover:text-bad" aria-label="Remove item">
                    <Trash2 className="size-4" />
                  </button>
                </div>
              ))}
              {editable && (
                <button type="button" onClick={() => onChange(recalcCustom({ ...line, items: [...line.items, { group: "Custom", label: "", price: 0 }] }))} className="inline-flex items-center gap-1.5 rounded px-2 py-1 text-xs font-semibold text-charcoal hover:bg-graphite/5">
                  <Plus className="size-3.5" /> Add an item
                </button>
              )}
            </div>
          )}

          <div>
            <Label>Note on this line (printed)</Label>
            <Input value={line.note ?? ""} disabled={!editable} onChange={(e) => onChange({ ...line, note: e.target.value })} placeholder="e.g. Client provides product photos" />
          </div>

          {editable && (
            <div className="flex items-center justify-between border-t border-dashed border-graphite/15 pt-3">
              <span className="flex gap-1">
                <button type="button" onClick={() => onMove(-1)} className="rounded p-1.5 text-blueprint hover:bg-graphite/5" aria-label="Move up">
                  <ArrowUp className="size-4" />
                </button>
                <button type="button" onClick={() => onMove(1)} className="rounded p-1.5 text-blueprint hover:bg-graphite/5" aria-label="Move down">
                  <ArrowDown className="size-4" />
                </button>
              </span>
              <button type="button" onClick={onRemove} className="inline-flex items-center gap-1.5 rounded px-2 py-1.5 text-xs font-semibold text-bad hover:bg-bad/10">
                <Trash2 className="size-3.5" /> Remove from quote
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function recalcCustom(l: Extract<QuoteLine, { kind: "custom" }>): QuoteLine {
  return { ...l, amount: l.items.reduce((s, i) => s + (Number(i.price) || 0), 0) };
}

function VrittaEditor({ line, rates, editable, onChange }: { line: Extract<QuoteLine, { kind: "vritta" }>; rates: RateCard; editable: boolean; onChange: (l: QuoteLine) => void }) {
  const ids = line.oneTime.map((o) => rates.vritta.oneTime.find((x) => x.label === o.label)?.id).filter(Boolean) as string[];
  const rebuild = (patch: Partial<{ segment: "college" | "school"; edition: "essential" | "professional" | "institutional"; billing: "monthly" | "annual" | "perpetual"; group: boolean; oneTimeIds: string[] }>) => {
    const next = { segment: line.segment, edition: line.edition, billing: line.billing, group: line.group, oneTimeIds: ids, ...patch };
    onChange({ ...vrittaLine(rates, next.segment, next.edition, next.billing, next.group, next.oneTimeIds), key: line.key, note: line.note });
  };
  const available = priceVritta(rates.vritta, line.segment, line.edition, line.billing, line.group, ids).available;
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <Label>Institution</Label>
          <Select value={line.segment} disabled={!editable} onChange={(e) => rebuild({ segment: e.target.value === "school" ? "school" : "college" })}>
            <option value="college">College</option>
            <option value="school">School</option>
          </Select>
        </div>
        <div>
          <Label>Edition</Label>
          <Select value={line.edition} disabled={!editable} onChange={(e) => rebuild({ edition: e.target.value as "essential" | "professional" | "institutional" })}>
            {VRITTA.editions.map((ed) => (
              <option key={ed.id} value={ed.id}>
                {ed.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label>Billing</Label>
          <Select value={line.billing} disabled={!editable} onChange={(e) => rebuild({ billing: e.target.value as "monthly" | "annual" | "perpetual" })}>
            <option value="monthly">Monthly (pilot)</option>
            <option value="annual">Annual</option>
            <option value="perpetual">Perpetual (self-hosted)</option>
          </Select>
        </div>
      </div>
      {!available && <p className="text-xs text-bad">The {VRITTA.editions.find((e) => e.id === line.edition)?.name} edition is not offered for {line.segment === "school" ? "schools" : "colleges"}.</p>}
      <Checkbox checked={line.group} disabled={!editable} onChange={(e) => rebuild({ group: e.target.checked })} label={`Further institution of the same trust (${rates.vritta.groupLicencePercent}% of the licence)`} />
      <div className="space-y-1.5">
        {rates.vritta.oneTime.map((o) => (
          <Checkbox
            key={o.id}
            checked={ids.includes(o.id)}
            disabled={!editable}
            onChange={(e) => rebuild({ oneTimeIds: e.target.checked ? [...ids, o.id] : ids.filter((x) => x !== o.id) })}
            label={
              <span>
                <span className="font-medium">{o.label}</span> <span className="tabular text-xs text-charcoal">{formatINR(o.price)}</span>
                <span className="block text-[11px] text-blueprint">{o.detail}</span>
              </span>
            }
            className="items-start [&>input]:mt-1"
          />
        ))}
      </div>
      <p className="text-[11px] text-blueprint">{VRITTA.pilotNote}</p>
    </div>
  );
}

/* ─────────────────────────── live summary ─────────────────────────── */

function Row({ label, detail, amount, strong, negative }: { label: React.ReactNode; detail?: React.ReactNode; amount: React.ReactNode; strong?: boolean; negative?: boolean }) {
  return (
    <div className={cn("flex items-start justify-between gap-3 py-1.5 text-sm", strong && "font-semibold")}>
      <div className="min-w-0">
        <p className="leading-snug text-graphite">{label}</p>
        {detail && <p className="mt-0.5 text-[11px] leading-snug text-blueprint">{detail}</p>}
      </div>
      <p className={cn("tabular shrink-0", negative && "text-bad")}>{amount}</p>
    </div>
  );
}

export function QuoteSummary({ money: m, lines, extra, plan }: { money: QuoteMoney; lines: QuoteLine[]; extra: LineItem[]; plan: { label: string; percent: number; amount: number }[] }) {
  const none = !lines.length && !extra.length;
  return (
    <section aria-label="Live pricing" className="relative overflow-hidden rounded-[var(--radius-lg)] border border-graphite/15 bg-paper-50 shadow-[var(--shadow-paper)]">
      <div className="bg-graphite px-5 py-4 text-paper">
        <p className="annot text-lime">Total incl. GST</p>
        <p className="tabular mt-1.5 text-3xl font-bold tracking-tight" aria-live="polite">
          {formatINR(m.total)}
        </p>
        <p className="mt-1.5 text-xs text-paper/60">
          {lines.length} line{lines.length === 1 ? "" : "s"}
          {m.monthly > 0 ? ` · includes ${formatINR(m.monthlyNet)}/month × ${m.months}` : ""}
        </p>
      </div>
      <div className="px-5 py-4">
        {none ? (
          <p className="py-3 text-sm text-charcoal">Add services to see the breakdown.</p>
        ) : (
          <div className="divide-y divide-dashed divide-graphite/15">
            <div className="pb-2">
              {lines.map((l) => (
                <Row key={l.key} label={l.title} detail={"billing" in l && l.billing === "month" ? `per month${l.kind === "service" ? ` × ${l.months ?? 1}` : ""}` : undefined} amount={formatINR(l.amount)} />
              ))}
              {extra.map((x, i) => (
                <Row key={i} label={x.description || "Extra item"} detail={`${x.qty} × ${formatINR(Number(x.rate) || 0)}`} amount={formatINR((Number(x.qty) || 0) * (Number(x.rate) || 0))} />
              ))}
            </div>
            <div className="py-2">
              {m.bundleAmount > 0 && <Row label={`Studio bundle (${m.bundlePercent}%)`} amount={`− ${formatINR(m.bundleAmount)}`} negative />}
              {m.extraAmount > 0 && <Row label={`Discount (${m.extraPercent}%)`} amount={`− ${formatINR(m.extraAmount)}`} negative />}
              <Row label="Subtotal (ex-GST)" amount={formatINR(m.taxable)} strong />
              <Row label={`GST ${m.gstPercent}%`} amount={formatINR(m.gst)} />
              <Row label="Grand total" amount={formatINR(m.total)} strong />
            </div>
          </div>
        )}
        {plan.length > 0 && plan.some((p) => p.amount > 0) && (
          <dl className="mt-3 grid gap-2 text-xs">
            {plan.map((p) => (
              <div key={p.label} className="flex items-center justify-between rounded-[var(--radius-sm)] bg-graphite/[0.05] px-3 py-2">
                <dt className="text-charcoal">
                  {p.label} · {p.percent}%
                </dt>
                <dd className="tabular font-semibold text-graphite">{formatINR(p.amount)} + GST</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </section>
  );
}

/** Milestone amounts for a stored quote (used by the print). */
export function planFor(r: Record<string, unknown>, rates: RateCard | null, money: QuoteMoney) {
  return milestonePlan(r, money, rates?.terms.milestones ?? []);
}

export { splitMilestones };
export type { ServiceId };
