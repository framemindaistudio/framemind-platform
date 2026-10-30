"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Camera, Check, CheckCircle2, Circle, ExternalLink, Loader2, MessageCircle, Plus, ReceiptText, RotateCcw, Trash2, Wand2 } from "lucide-react";
import { getCollection, invoiceTotals } from "@/lib/hq/collections";
import { can } from "@/lib/hq/roles";
import { Badge, statusTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/form";
import { CollectionManager } from "@/components/hq/CollectionManager";
import { useCollection, useHq, useSettings } from "@/components/hq/data";
import { Panel } from "@/components/hq/ui";
import { Notice } from "@/components/hq/sales/bits";
import { phoneDigits, whatsappHref } from "@/components/hq/sales/contact";
import { cn, formatDate, formatINR, isoDate, uid } from "@/lib/utils";
import { addDays, CHECKLISTS, checklistFor, checklistOf, handoverOf, HANDOVER_STEPS, inputsFor, inputsOf, milestonesOf, num, serviceLabel, servicesOf, str, type CheckItem, type ClientInput, type ProjectMilestone, type Rec } from "./logic";
import type { Patch } from "./ProjectDetail";

/* ─────────────────────────── payments ─────────────────────────── */

export function MilestonesTab({ project, client, invoices, canWrite, patch }: { project: Rec; client?: Rec; invoices: Rec[]; canWrite: boolean; patch: Patch }) {
  const invoicesCol = useCollection("invoices");
  const { settings } = useSettings();
  const ms = milestonesOf(project);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const agreed = num(project.agreedAmount);
  const total = ms.reduce((s, m) => s + m.amount, 0);

  const setMs = (next: ProjectMilestone[]) => patch({ milestones: next });

  async function raise(m: ProjectMilestone) {
    setBusy(m.id);
    setError("");
    try {
      const today = isoDate();
      const inv = await invoicesCol.save({
        date: today,
        dueDate: m.dueDate || addDays(today, 7),
        clientId: str(project.clientId),
        projectId: project.id,
        milestone: `${m.label} (${m.percent}%)`,
        customerName: str(client?.name),
        customerGstin: str(client?.gstin),
        customerAddress: str(client?.address),
        projectName: str(project.title),
        // GST follows HQ → Settings → Tax & bank
        chargeGst: !!settings.gstRegistered,
        gstPercent: 18,
        items: [{ description: `${str(project.title)} — ${m.label}${m.percent ? ` (${m.percent}%)` : ""}`, qty: 1, rate: m.amount }],
        status: "draft",
      });
      await setMs(ms.map((x) => (x.id === m.id ? { ...x, status: "invoiced", invoiceId: inv.id } : x)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not raise the invoice");
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <Panel title="Payment milestones" subtitle={agreed ? `${formatINR(total)} of the agreed ${formatINR(agreed)} (before GST) is split into milestones` : "Set the agreed amount in Edit details"}>
        {ms.length === 0 && <p className="mb-4 text-sm text-charcoal">No milestones yet. A project started from an accepted quote brings them; or add them here (usually 50% to start, 50% on delivery).</p>}
        <ul className="space-y-2">
          {ms.map((m, i) => {
            const inv = invoices.find((x) => x.id === m.invoiceId);
            const t = inv ? invoiceTotals(inv) : null;
            const paid = m.status === "paid" || (t && t.total > 0 && t.balance === 0);
            return (
              <li key={m.id} className="rounded-[var(--radius-md)] border border-graphite/12 bg-paper p-3">
                <div className="grid items-center gap-2 sm:grid-cols-[28px_1fr_90px_130px_auto]">
                  <span className={cn("grid size-7 place-items-center rounded-full font-mono text-[10px] font-semibold", paid ? "bg-ok text-white" : "bg-graphite/[0.07] text-graphite")}>{paid ? <Check className="size-3.5" /> : i + 1}</span>
                  <Input aria-label="Milestone" value={m.label} disabled={!canWrite} onChange={(e) => setMs(ms.map((x) => (x.id === m.id ? { ...x, label: e.target.value } : x)))} />
                  <div className="relative">
                    <Input
                      aria-label="Percent"
                      type="number"
                      value={m.percent}
                      disabled={!canWrite}
                      onChange={(e) => {
                        const pct = num(e.target.value);
                        setMs(ms.map((x) => (x.id === m.id ? { ...x, percent: pct, amount: Math.round((agreed * pct) / 100) } : x)));
                      }}
                      className="tabular pr-6"
                    />
                    <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-blueprint">%</span>
                  </div>
                  <Input aria-label="Amount" type="number" value={m.amount} disabled={!canWrite} onChange={(e) => setMs(ms.map((x) => (x.id === m.id ? { ...x, amount: num(e.target.value) } : x)))} className="tabular" />
                  {canWrite && (
                    <button type="button" onClick={() => setMs(ms.filter((x) => x.id !== m.id))} className="rounded p-2 text-blueprint hover:bg-bad/10 hover:text-bad" aria-label="Remove milestone">
                      <Trash2 className="size-4" />
                    </button>
                  )}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2 pl-9 text-xs">
                  <Badge tone={statusTone(paid ? "paid" : m.status)}>{paid ? "paid" : m.status}</Badge>
                  {inv ? (
                    <Link href="/hq/finance?tab=invoices" className="inline-flex items-center gap-1 font-semibold text-graphite underline-offset-4 hover:underline">
                      {str(inv.number) || "Draft invoice"} · {formatINR(t?.total ?? 0)}{t && t.gstPercent > 0 ? " incl. GST" : ""}{t && t.balance > 0 ? ` · ${formatINR(t.balance)} due` : ""}
                    </Link>
                  ) : (
                    canWrite &&
                    m.amount > 0 && (
                      <Button size="sm" variant="secondary" onClick={() => raise(m)} disabled={busy === m.id}>
                        {busy === m.id ? <Loader2 className="size-3.5 animate-spin" /> : <ReceiptText className="size-3.5" />} Raise invoice
                      </Button>
                    )
                  )}
                  {canWrite && !inv && m.status !== "paid" && (
                    <button type="button" onClick={() => setMs(ms.map((x) => (x.id === m.id ? { ...x, status: "paid", paidOn: isoDate() } : x)))} className="text-xs font-semibold text-charcoal underline-offset-4 hover:underline">
                      Mark paid without an invoice
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
        {canWrite && (
          <Button size="sm" variant="ghost" className="mt-3" onClick={() => setMs([...ms, { id: uid("ms"), label: "Milestone", percent: 0, amount: 0, status: "due" }])}>
            <Plus className="size-4" /> Add a milestone
          </Button>
        )}
        {error && <Notice tone="bad" className="mt-3">{error}</Notice>}
      </Panel>
      <Panel title="Invoices for this project">
        {invoices.length === 0 ? (
          <p className="text-sm text-charcoal">None yet.</p>
        ) : (
          <ul className="divide-y divide-graphite/10">
            {invoices.map((inv) => {
              const t = invoiceTotals(inv);
              return (
                <li key={inv.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">{str(inv.number) || "Draft"}</span>
                    <span className="block truncate text-xs text-blueprint">{str(inv.milestone) || formatDate(str(inv.date))}</span>
                  </span>
                  <span className="text-right">
                    <span className="tabular block font-semibold">{formatINR(t.total)}</span>
                    <span className="tabular block text-xs text-charcoal">{t.balance > 0 ? `${formatINR(t.balance)} due` : "Settled"}</span>
                  </span>
                </li>
              );
            })}
          </ul>
        )}
        <Button size="sm" variant="secondary" className="mt-4" href="/hq/finance?tab=invoices">
          Open Finance
        </Button>
      </Panel>
    </div>
  );
}

/* ─────────────────────────── deliverables ─────────────────────────── */

export function DeliverablesTab({ project, deliverables, today }: { project: Rec; deliverables: Rec[]; today: string }) {
  const { user, store } = useHq();
  const { save } = useCollection("deliverables");
  const canWrite = can(user, getCollection("deliverables")!.write) && store.writable;
  const late = deliverables.filter((d) => today && str(d.dueDate) && str(d.dueDate) < today && !["approved", "delivered"].includes(str(d.status))).length;

  async function bump(d: Rec) {
    await save({ ...d, round: num(d.round) + 1, status: "revisions" });
  }

  return (
    <div className="space-y-4">
      {late > 0 && <Notice tone="warn">{late} deliverable{late === 1 ? " is" : "s are"} past due.</Notice>}
      <CollectionManager
        name="deliverables"
        columns={["title", "type", "status", "assignee", "dueDate"]}
        filter={(r) => r.projectId === project.id}
        defaults={{ projectId: project.id, status: "planned", assignee: str(project.lead) }}
        newLabel="Add deliverable"
        emptyText="List everything promised to the client — pages, logo concepts, films, reels, photo sets — so nothing is forgotten."
        extraColumns={[
          { key: "round", label: "Round", sortValue: (r) => num(r.round), render: (r) => <span className="tabular text-xs">{num(r.round) || "—"}</span> },
          {
            key: "link",
            label: "Link",
            render: (r) =>
              r.link ? (
                <a href={str(r.link)} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-1 text-xs font-semibold text-graphite underline-offset-4 hover:underline">
                  Open <ExternalLink className="size-3" />
                </a>
              ) : (
                <span className="text-xs text-blueprint">—</span>
              ),
          },
        ]}
        rowActions={(r) =>
          canWrite && !["approved", "delivered"].includes(str(r.status)) ? (
            <button type="button" onClick={(e) => { e.stopPropagation(); void bump(r); }} className="inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-[var(--radius-sm)] border border-graphite/20 px-2.5 text-xs font-semibold hover:border-graphite hover:bg-lime" title="The client asked for changes: next revision round">
              <RotateCcw className="size-3.5" /> Revision
            </button>
          ) : null
        }
      />
      <p className="text-xs text-blueprint">All deliverables across projects are on the Production board.</p>
    </div>
  );
}

/* ─────────────────────────── checklist ─────────────────────────── */

export function ChecklistTab({ project, canWrite, patch }: { project: Rec; canWrite: boolean; patch: Patch }) {
  const { user } = useHq();
  const items = checklistOf(project);
  const [label, setLabel] = useState("");
  const [phase, setPhase] = useState("");
  const phases = useMemo(() => [...new Set(items.map((i) => i.phase))], [items]);
  const set = (next: CheckItem[]) => patch({ checklist: next });

  function toggle(it: CheckItem) {
    set(items.map((x) => (x.id === it.id ? { ...x, done: !x.done, doneBy: !x.done ? user.name : undefined, doneOn: !x.done ? isoDate() : undefined } : x)));
  }

  const services = servicesOf(project);
  const missing = services.filter((s) => CHECKLISTS[s] && !items.some((i) => CHECKLISTS[s].some(([, l]) => l === i.label)));

  return (
    <div className="space-y-6">
      {items.length === 0 ? (
        <Panel title="No checklist yet">
          <p className="text-sm text-charcoal">Load the studio&apos;s working checklist for {services.map(serviceLabel).join(", ") || "this project"} — every step from kick-off to handover.</p>
          {canWrite && (
            <Button size="sm" className="mt-4" onClick={() => set(checklistFor(services))}>
              <Wand2 className="size-4" /> Load the checklist
            </Button>
          )}
        </Panel>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {phases.map((ph) => {
            const list = items.filter((i) => i.phase === ph);
            const done = list.filter((i) => i.done).length;
            return (
              <Panel key={ph} title={ph} action={<span className="tabular text-xs text-blueprint">{done}/{list.length}</span>}>
                <ul className="space-y-1">
                  {list.map((it) => (
                    <li key={it.id} className="group flex items-start gap-2">
                      <button type="button" disabled={!canWrite} onClick={() => toggle(it)} className="mt-0.5 shrink-0 text-graphite disabled:cursor-default" aria-label={it.done ? "Mark not done" : "Mark done"}>
                        {it.done ? <CheckCircle2 className="size-[18px] text-ok" /> : <Circle className="size-[18px] text-blueprint" />}
                      </button>
                      <span className="min-w-0 flex-1">
                        <span className={cn("block text-sm", it.done ? "text-blueprint line-through" : "text-graphite")}>{it.label}</span>
                        {it.done && it.doneBy && <span className="block text-[10px] text-blueprint">{it.doneBy} · {formatDate(str(it.doneOn))}</span>}
                      </span>
                      {canWrite && (
                        <button type="button" onClick={() => set(items.filter((x) => x.id !== it.id))} className="invisible rounded p-0.5 text-blueprint hover:text-bad group-hover:visible" aria-label="Remove step">
                          <Trash2 className="size-3.5" />
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              </Panel>
            );
          })}
        </div>
      )}
      {canWrite && items.length > 0 && (
        <Panel title="Add a step">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!label.trim()) return;
              set([...items, { id: uid("chk"), phase: phase.trim() || phases[phases.length - 1] || "Other", label: label.trim(), done: false }]);
              setLabel("");
            }}
            className="grid gap-2 sm:grid-cols-[200px_1fr_auto]"
          >
            <Input list="phases" value={phase} onChange={(e) => setPhase(e.target.value)} placeholder="Phase" aria-label="Phase" />
            <datalist id="phases">
              {phases.map((p) => (
                <option key={p} value={p} />
              ))}
            </datalist>
            <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="What needs doing" aria-label="Step" />
            <Button size="sm" type="submit" className="h-10">
              <Plus className="size-4" /> Add
            </Button>
          </form>
          {missing.length > 0 && (
            <p className="mt-3 text-xs text-charcoal">
              Services without their steps yet:{" "}
              {missing.map((s) => (
                <button key={s} type="button" onClick={() => set([...items, ...checklistFor([s])])} className="mr-2 font-semibold underline underline-offset-2">
                  add {serviceLabel(s)}
                </button>
              ))}
            </p>
          )}
        </Panel>
      )}
    </div>
  );
}

/* ─────────────────────────── what the client provides ─────────────────────────── */

export function InputsTab({ project, client, canWrite, patch }: { project: Rec; client?: Rec; canWrite: boolean; patch: Patch }) {
  const { user } = useHq();
  const items = inputsOf(project);
  const [label, setLabel] = useState("");
  const set = (next: ClientInput[]) => patch({ inputs: next });
  const pending = items.filter((i) => !i.received);
  const phone = project.clientContactPhone || client?.phone;
  const reminder = `Hi ${str(project.clientContact || client?.contactName).split(" ")[0] || "there"}, this is ${user.name} from FrameMind AI Studio. To keep ${str(project.title)} on schedule, we still need:\n${pending.map((i) => `• ${i.label}`).join("\n")}\nYou can drop them in the shared folder${project.driveUrl ? `: ${str(project.driveUrl)}` : ""}. Thank you!`;
  const wa = phoneDigits(phone) ? whatsappHref(phone, reminder) : null;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <Panel title="What we need from the client" subtitle="The client provides all content and brand assets before work begins — delays here move the timeline.">
        {items.length === 0 ? (
          <div>
            <p className="text-sm text-charcoal">No list yet.</p>
            {canWrite && (
              <Button size="sm" className="mt-3" onClick={() => set(inputsFor(servicesOf(project)))}>
                <Wand2 className="size-4" /> Load the usual list for {servicesOf(project).map(serviceLabel).join(", ") || "this project"}
              </Button>
            )}
          </div>
        ) : (
          <ul className="divide-y divide-graphite/10">
            {items.map((it) => (
              <li key={it.id} className="flex items-center gap-3 py-2.5">
                <button
                  type="button"
                  disabled={!canWrite}
                  onClick={() => set(items.map((x) => (x.id === it.id ? { ...x, received: !x.received, receivedOn: !x.received ? isoDate() : undefined } : x)))}
                  aria-label={it.received ? "Mark not received" : "Mark received"}
                >
                  {it.received ? <CheckCircle2 className="size-5 text-ok" /> : <Circle className="size-5 text-blueprint" />}
                </button>
                <span className="min-w-0 flex-1">
                  <span className={cn("block text-sm", it.received ? "text-blueprint line-through" : "font-medium text-graphite")}>{it.label}</span>
                  {it.received && it.receivedOn && <span className="text-[10px] text-blueprint">Received {formatDate(it.receivedOn)}</span>}
                </span>
                {canWrite && (
                  <button type="button" onClick={() => set(items.filter((x) => x.id !== it.id))} className="rounded p-1 text-blueprint hover:text-bad" aria-label="Remove">
                    <Trash2 className="size-3.5" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
        {canWrite && items.length > 0 && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!label.trim()) return;
              set([...items, { id: uid("in"), label: label.trim(), received: false }]);
              setLabel("");
            }}
            className="mt-4 flex gap-2"
          >
            <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Something else they must send" aria-label="Item" />
            <Button size="sm" type="submit" className="h-10">
              <Plus className="size-4" />
            </Button>
          </form>
        )}
      </Panel>
      <Panel title="Nudge the client">
        <p className="text-sm text-charcoal">{pending.length ? `${pending.length} item${pending.length === 1 ? "" : "s"} still outstanding.` : "Everything is in. 🎉"}</p>
        {pending.length > 0 && (
          <>
            <pre className="mt-3 whitespace-pre-wrap rounded-[var(--radius-sm)] border border-graphite/10 bg-paper p-3 font-sans text-xs leading-relaxed text-charcoal">{reminder}</pre>
            {wa ? (
              <Button size="sm" className="mt-3" href={wa} external>
                <MessageCircle className="size-4" /> Send on WhatsApp
              </Button>
            ) : (
              <p className="mt-3 text-xs text-blueprint">Add the client contact&apos;s phone to send it on WhatsApp.</p>
            )}
          </>
        )}
        <p className="mt-4 text-[11px] text-blueprint">Never ask for passwords on WhatsApp or email — ask the client to invite the studio&apos;s account instead.</p>
      </Panel>
    </div>
  );
}

/* ─────────────────────────── shoots ─────────────────────────── */

export function ShootsTab({ project, shoots }: { project: Rec; shoots: Rec[] }) {
  const { user, store } = useHq();
  const canWrite = can(user, getCollection("shoots")!.write) && store.writable;
  const sorted = [...shoots].sort((a, b) => str(a.date).localeCompare(str(b.date)));
  return (
    <Panel title="Shoots for this project" action={canWrite ? <Button size="sm" href={`/hq/shoots?new=1&project=${project.id}`}><Plus className="size-4" /> Plan a shoot</Button> : undefined}>
      {sorted.length === 0 ? (
        <p className="text-sm text-charcoal">No shoots planned. Photo and video projects get a call sheet and a shoot-day checklist from Shoots.</p>
      ) : (
        <ul className="divide-y divide-graphite/10">
          {sorted.map((s) => (
            <li key={s.id}>
              <Link href={`/hq/shoots/${s.id}`} className="flex items-center gap-3 py-3 hover:bg-graphite/[0.02]">
                <span className="grid size-9 place-items-center rounded-full bg-violet/10 text-violet">
                  <Camera className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{str(s.title)}</span>
                  <span className="block truncate text-xs text-blueprint">{[formatDate(str(s.date)), str(s.callTime) && `call ${str(s.callTime)}`, str(s.location)].filter(Boolean).join(" · ")}</span>
                </span>
                <Badge tone={statusTone(s.status)}>{str(s.status) || "tentative"}</Badge>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

/* ─────────────────────────── handover ─────────────────────────── */

export function HandoverTab({ project, client, canWrite, patch }: { project: Rec; client?: Rec; canWrite: boolean; patch: Patch }) {
  const { user } = useHq();
  const state = handoverOf(project);
  const done = HANDOVER_STEPS.filter((s) => state[s.id]).length;
  const phone = project.clientContactPhone || client?.phone;
  const first = str(project.clientContact || client?.contactName).split(" ")[0] || "there";
  const feedbackText = `Hi ${first}, thank you for building ${str(project.title)} with FrameMind AI Studio! Could you share two lines on how it went — what worked, and what we could do better? And if you're happy, may we quote you on our website (with your name and company)? It really helps a small studio like ours. — ${user.name}`;
  const wa = phoneDigits(phone) ? whatsappHref(phone, feedbackText) : null;
  const allDone = done === HANDOVER_STEPS.length;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <Panel title="Handover" subtitle={`${done} of ${HANDOVER_STEPS.length} done — nothing is locked behind us; the client owns everything we build.`}>
        <ul className="space-y-1.5">
          {HANDOVER_STEPS.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                disabled={!canWrite}
                onClick={() => patch((p) => ({ handover: { ...handoverOf(p), [s.id]: !handoverOf(p)[s.id] } }))}
                className={cn("flex w-full items-center gap-3 rounded-[var(--radius-sm)] border px-3 py-2.5 text-left text-sm transition-colors", state[s.id] ? "border-ok/30 bg-ok/5 text-blueprint" : "border-graphite/12 bg-paper hover:border-graphite/40", !canWrite && "cursor-default")}
              >
                {state[s.id] ? <CheckCircle2 className="size-5 shrink-0 text-ok" /> : <Circle className="size-5 shrink-0 text-blueprint" />}
                <span className={state[s.id] ? "line-through" : "font-medium text-graphite"}>{s.label}</span>
              </button>
            </li>
          ))}
        </ul>
        {canWrite && (
          <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-dashed border-graphite/15 pt-4">
            <Select value={str(project.stage)} onChange={(e) => patch({ stage: e.target.value })} aria-label="Stage" className="w-auto">
              <option value="launch">Launch & handover</option>
              <option value="support">Support period</option>
              <option value="completed">Completed</option>
            </Select>
            {allDone && str(project.stage) !== "completed" && (
              <Button size="sm" variant="lime" onClick={() => patch({ stage: project.supportUntil ? "support" : "completed" })}>
                <Check className="size-4" /> Close it out
              </Button>
            )}
          </div>
        )}
      </Panel>
      <div className="space-y-6">
        <Panel title="Ask for feedback & a testimonial">
          <pre className="whitespace-pre-wrap rounded-[var(--radius-sm)] border border-graphite/10 bg-paper p-3 font-sans text-xs leading-relaxed text-charcoal">{feedbackText}</pre>
          <div className="mt-3 flex flex-wrap gap-2">
            {wa && (
              <Button size="sm" href={wa} external>
                <MessageCircle className="size-4" /> WhatsApp
              </Button>
            )}
            <Button size="sm" variant="secondary" href="/hq/reputation">
              Record the reply
            </Button>
          </div>
        </Panel>
        <Panel title="Turn it into a case study">
          <p className="text-sm text-charcoal">Real projects, real results — write it up for pitches and the website. Use only numbers the client confirms.</p>
          <Button size="sm" variant="secondary" className="mt-3" href="/hq/reputation?tab=case-studies">
            Open case studies
          </Button>
        </Panel>
      </div>
    </div>
  );
}
