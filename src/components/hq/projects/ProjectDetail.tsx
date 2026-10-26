"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ExternalLink, PenTool, FolderOpen, GitBranch, Globe, Minus, MonitorPlay, Pencil, Plus, Trash2 } from "lucide-react";
import { getCollection, PROJECT_STAGES, type BaseRecord } from "@/lib/hq/collections";
import { can } from "@/lib/hq/roles";
import { Button } from "@/components/ui/Button";
import { ConfirmButton } from "@/components/ui/Overlay";
import { Select } from "@/components/ui/form";
import { Tabs } from "@/components/ui/Tabs";
import { useCollection, useHq, useShowMoney } from "@/components/hq/data";
import { EmptyState, KV, Loading, Panel } from "@/components/hq/ui";
import { BackLink, ContactButtons, Notice } from "@/components/hq/sales/bits";
import { introMessage } from "@/components/hq/sales/contact";
import { useToday } from "@/components/hq/sales/useToday";
import { formatDate, formatINR } from "@/lib/utils";
import { DueChip, ProgressBar, ServiceChips, StageBadge } from "./bits";
import { checklistOf, inputsOf, longDate, num, progressOf, projectMoney, str, type Rec } from "./logic";
import { ProjectFormDrawer } from "./ProjectFormDrawer";
import { PortalTab } from "./PortalTab";
import { DevTab } from "@/components/hq/dev/DevTab";
import { ChecklistTab, DeliverablesTab, HandoverTab, InputsTab, MilestonesTab, ShootsTab } from "./ProjectTabs";

const projectsDef = getCollection("projects")!;
type Tab = "overview" | "payments" | "deliverables" | "checklist" | "inputs" | "portal" | "dev" | "shoots" | "handover";

/** The project record and a way to change part of it, shared by every tab. */
export function useProject(id: string) {
  const projects = useCollection("projects");
  const project = projects.records.find((r) => r.id === id);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  async function patch(change: Record<string, unknown> | ((p: Rec) => Record<string, unknown>)) {
    const cur = projects.records.find((r) => r.id === id);
    if (!cur) return;
    setSaving(true);
    setError("");
    try {
      await projects.save({ ...cur, ...(typeof change === "function" ? change(cur) : change) });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save");
    } finally {
      setSaving(false);
    }
  }
  return { project, loading: projects.loading, patch, saving, error, remove: projects.remove };
}

export function ProjectDetail({ id }: { id: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const today = useToday();
  const { user, store } = useHq();
  const showMoney = useShowMoney();
  const { project, loading, patch, saving, error, remove } = useProject(id);
  const canWrite = can(user, projectsDef.write) && store.writable;
  const clientsQ = useCollection(can(user, getCollection("clients")!.read) ? "clients" : "__none");
  const { records: invoices } = useCollection(showMoney ? "invoices" : "__none");
  const { records: deliverables } = useCollection("deliverables");
  const { records: shoots } = useCollection(can(user, getCollection("shoots")!.read) ? "shoots" : "__none");
  const [tab, setTab] = useState<Tab>(() => {
    const t = params.get("tab");
    return (["overview", "payments", "deliverables", "checklist", "inputs", "portal", "dev", "shoots", "handover"] as Tab[]).includes(t as Tab) ? (t as Tab) : "overview";
  });
  const [draft, setDraft] = useState<Record<string, unknown> | null>(null);

  const client = useMemo(() => clientsQ.records.find((c) => c.id === project?.clientId), [clientsQ.records, project?.clientId]);
  const mine = useMemo(() => deliverables.filter((d) => d.projectId === id), [deliverables, id]);
  const myShoots = useMemo(() => shoots.filter((s) => s.projectId === id), [shoots, id]);

  if (loading) return <Loading label="Loading project…" />;
  if (!project) {
    return (
      <div>
        <BackLink href="/hq/projects">Projects</BackLink>
        <EmptyState icon="FolderKanban" title="Project not found" description="It may have been deleted, or the link is out of date." action={<Button size="sm" href="/hq/projects">All projects</Button>} />
      </div>
    );
  }

  const progress = progressOf(project);
  const money = projectMoney(project, invoices);
  const checklist = checklistOf(project);
  const inputs = inputsOf(project);
  const openDeliverables = mine.filter((d) => !["approved", "delivered"].includes(str(d.status))).length;
  const pendingInputs = inputs.filter((i) => !i.received).length;

  const tabs: { value: Tab; label: React.ReactNode; count?: number }[] = [
    { value: "overview", label: "Overview" },
    ...(showMoney ? [{ value: "payments" as Tab, label: "Payments" }] : []),
    { value: "deliverables", label: "Deliverables", count: openDeliverables || undefined },
    { value: "checklist", label: "Checklist", count: checklist.length ? checklist.filter((c) => !c.done).length || undefined : undefined },
    { value: "inputs", label: "From the client", count: pendingInputs || undefined },
    { value: "portal", label: "Client portal" },
    { value: "dev", label: "Development" },
    ...(can(user, getCollection("shoots")!.read) ? [{ value: "shoots" as Tab, label: "Shoots", count: myShoots.length || undefined }] : []),
    { value: "handover", label: "Handover" },
  ];

  const links: { label: string; href: string; Icon: typeof Globe }[] = [
    { label: "Shared folder", href: str(project.driveUrl), Icon: FolderOpen },
    { label: "Design file", href: str(project.figmaUrl), Icon: PenTool },
    { label: "Repository", href: str(project.repoUrl), Icon: GitBranch },
    { label: "Staging", href: str(project.stagingUrl), Icon: MonitorPlay },
    { label: "Live", href: str(project.liveUrl), Icon: Globe },
  ].filter((l) => l.href);

  return (
    <div>
      <BackLink href="/hq/projects">Projects</BackLink>

      {/* header */}
      <section className="overflow-hidden rounded-[var(--radius-lg)] border border-graphite/12 bg-paper-50 shadow-[var(--shadow-paper)]">
        <div className="bg-graphite px-5 py-5 text-paper sm:px-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <p className="annot text-lime">Project{client ? ` · ${str(client.name)}` : ""}</p>
              <h1 className="mt-1 text-2xl font-semibold tracking-[-0.02em] sm:text-3xl">{str(project.title) || "Untitled project"}</h1>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <StageBadge stage={project.stage} />
                <ServiceChips project={project} max={6} />
              </div>
            </div>
            <div className="flex w-full shrink-0 flex-col gap-2 lg:w-60">
              <Select value={str(project.stage) || "kickoff"} onChange={(e) => patch({ stage: e.target.value })} disabled={!canWrite || saving} aria-label="Stage" className="border-paper/20 bg-paper/10 text-paper">
                {PROJECT_STAGES.map((s) => (
                  <option key={s.value} value={s.value} className="text-graphite">
                    {s.label}
                  </option>
                ))}
              </Select>
              {canWrite && (
                <Button variant="outline-light" size="sm" onClick={() => setDraft({ ...project })}>
                  <Pencil className="size-4" /> Edit details
                </Button>
              )}
            </div>
          </div>
          {progress !== null && (
            <div className="mt-5">
              <div className="mb-1.5 flex justify-between text-xs text-paper/60">
                <span>Checklist</span>
                <span className="tabular">
                  {checklist.filter((c) => c.done).length} / {checklist.length} · {Math.round(progress * 100)}%
                </span>
              </div>
              <ProgressBar value={progress} dark />
            </div>
          )}
        </div>
        <div className="grid gap-4 px-5 py-4 sm:grid-cols-2 sm:px-7 lg:grid-cols-4">
          <div>
            <p className="annot text-blueprint">Delivery</p>
            <div className="mt-1.5">
              <DueChip project={project} today={today} />
            </div>
            <p className="mt-1 text-xs text-charcoal">{project.dueDate ? longDate(project.dueDate) : "Set a delivery date in Edit details"}</p>
          </div>
          <div>
            <p className="annot text-blueprint">Revisions</p>
            <div className="mt-1.5 flex items-center gap-2">
              {canWrite && (
                <button type="button" onClick={() => patch((p) => ({ revisionsUsed: Math.max(0, num(p.revisionsUsed) - 1) }))} className="grid size-7 place-items-center rounded-full border border-graphite/20 hover:bg-graphite/5" aria-label="One fewer revision round">
                  <Minus className="size-3.5" />
                </button>
              )}
              <span className={num(project.revisionsUsed) > num(project.revisionsAllowed) ? "tabular text-lg font-bold text-bad" : "tabular text-lg font-bold"}>
                {num(project.revisionsUsed)} / {num(project.revisionsAllowed) || 2}
              </span>
              {canWrite && (
                <button type="button" onClick={() => patch((p) => ({ revisionsUsed: num(p.revisionsUsed) + 1 }))} className="grid size-7 place-items-center rounded-full border border-graphite/20 hover:bg-graphite/5" aria-label="One more revision round">
                  <Plus className="size-3.5" />
                </button>
              )}
            </div>
            <p className="mt-1 text-xs text-charcoal">{num(project.revisionsUsed) > num(project.revisionsAllowed || 2) ? "Over the rounds included — quote extra rounds" : "Rounds used of those included"}</p>
          </div>
          <div>
            <p className="annot text-blueprint">Team</p>
            <p className="mt-1.5 text-sm font-semibold text-graphite">{str(project.lead) || "—"}</p>
            <p className="mt-0.5 text-xs text-charcoal">{Array.isArray(project.team) && project.team.length ? (project.team as string[]).join(", ") : "No team added"}</p>
          </div>
          {showMoney ? (
            <div>
              <p className="annot text-blueprint">Money</p>
              <p className="tabular mt-1.5 text-lg font-bold">{money.agreed ? formatINR(money.agreed) : "—"}</p>
              <p className="tabular mt-0.5 text-xs text-charcoal">
                {formatINR(money.received)} received · {formatINR(money.toInvoice)} to invoice
              </p>
            </div>
          ) : (
            <div>
              <p className="annot text-blueprint">Deliverables</p>
              <p className="tabular mt-1.5 text-lg font-bold">{mine.length}</p>
              <p className="mt-0.5 text-xs text-charcoal">{openDeliverables} still open</p>
            </div>
          )}
        </div>
      </section>

      {error && <Notice tone="bad" className="mt-4">{error}</Notice>}

      <Tabs tabs={tabs} value={tab} onChange={setTab} className="mt-6" />
      <div className="pt-6">
        {tab === "overview" && (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="space-y-6">
              <Panel title="Brief">
                {project.brief ? <p className="whitespace-pre-line text-sm leading-relaxed text-graphite">{str(project.brief)}</p> : <p className="text-sm text-charcoal">No brief yet. Add what the client wants, who it is for and what success looks like (Edit details).</p>}
              </Panel>
              {links.length > 0 && (
                <Panel title="Links">
                  <div className="flex flex-wrap gap-2">
                    {links.map((l) => (
                      <a key={l.label} href={/^https?:/i.test(l.href) ? l.href : `https://${l.href}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-[var(--radius-sm)] border border-graphite/20 bg-paper px-3 py-2 text-sm font-medium hover:border-graphite hover:bg-lime">
                        <l.Icon className="size-4" /> {l.label} <ExternalLink className="size-3 text-blueprint" />
                      </a>
                    ))}
                  </div>
                </Panel>
              )}
              {project.notes ? (
                <Panel title="Internal notes">
                  <p className="whitespace-pre-line text-sm leading-relaxed text-graphite">{str(project.notes)}</p>
                </Panel>
              ) : null}
            </div>
            <aside className="space-y-6">
              <Panel title="Client">
                <KV k="Client" v={client ? <Link href={`/hq/crm/${client.id}`} className="underline-offset-4 hover:underline">{str(client.name)}</Link> : "—"} />
                <KV k="Contact" v={str(project.clientContact) || str(client?.contactName) || "—"} />
                <KV k="Phone" v={str(project.clientContactPhone) || str(client?.phone) || "—"} />
                <KV k="Started" v={project.startDate ? formatDate(str(project.startDate)) : "—"} />
                <KV k="Support until" v={project.supportUntil ? formatDate(str(project.supportUntil)) : "—"} />
                {project.quoteId ? <KV k="Quote" v={<Link href={`/hq/proposals/${str(project.quoteId)}`} className="underline-offset-4 hover:underline">Open the quote</Link>} /> : null}
                <ContactButtons
                  className="mt-4"
                  size="sm"
                  phone={project.clientContactPhone || client?.phone}
                  email={client?.email}
                  whatsappText={introMessage({ kind: "project", name: project.clientContact || client?.contactName, organisation: client?.name, sender: user.name }).replace(/Thank you for reaching out.*$/, `A quick update on ${str(project.title)}: `)}
                  emailSubject={`${str(project.title)} — update from FrameMind AI Studio`}
                />
              </Panel>
              {canWrite && (
                <Panel title="Danger zone">
                  <ConfirmButton
                    onConfirm={async () => {
                      await remove(project.id);
                      router.push("/hq/projects");
                    }}
                    message="Delete this project? Its deliverables and shoots stay, unlinked. The change is kept in the history."
                    className="inline-flex items-center gap-1.5 rounded px-2 py-1.5 text-xs font-semibold text-bad hover:bg-bad/10"
                  >
                    <Trash2 className="size-3.5" /> Delete project
                  </ConfirmButton>
                </Panel>
              )}
            </aside>
          </div>
        )}
        {tab === "payments" && showMoney && <MilestonesTab project={project} client={client} invoices={money.invoices} canWrite={canWrite} patch={patch} />}
        {tab === "deliverables" && <DeliverablesTab project={project} deliverables={mine} today={today} />}
        {tab === "checklist" && <ChecklistTab project={project} canWrite={canWrite} patch={patch} />}
        {tab === "inputs" && <InputsTab project={project} client={client} canWrite={canWrite} patch={patch} />}
        {tab === "portal" && <PortalTab project={project} canWrite={canWrite} />}
        {tab === "dev" && <DevTab projectId={project.id} />}
        {tab === "shoots" && <ShootsTab project={project} shoots={myShoots} />}
        {tab === "handover" && <HandoverTab project={project} client={client} canWrite={canWrite} patch={patch} />}
      </div>

      <ProjectFormDrawer value={draft} onChange={setDraft} onClose={() => setDraft(null)} />
    </div>
  );
}

export type Patch = (change: Record<string, unknown> | ((p: Rec) => Record<string, unknown>)) => Promise<void>;
export type { BaseRecord };
