"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Columns3, Loader2, Plus, Search, Table2 } from "lucide-react";
import { CLIENT_STAGES, getCollection, SERVICE_OPTS, type BaseRecord } from "@/lib/hq/collections";
import { can } from "@/lib/hq/roles";
import { Badge, statusTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Overlay";
import { Input, Label } from "@/components/ui/form";
import { CollectionManager, type ExtraColumn } from "@/components/hq/CollectionManager";
import { useBook, useCollection, useHq, useShowMoney } from "@/components/hq/data";
import { Kanban } from "@/components/hq/Kanban";
import { EmptyState, Loading, PageHeader, StatCard } from "@/components/hq/ui";
import { cn, formatINR, formatINRCompact, formatNumber } from "@/lib/utils";
import { clientValue, followUpState, OPEN_STAGES, stageLabel, stageProbability, str, TRACK_STAGES } from "./crm";
import { FollowUpChip, Notice, Segmented } from "./bits";
import { ClientFormDrawer, newClientDraft } from "./ClientFormDrawer";
import { useToday } from "./useToday";

const clientsDef = getCollection("clients")!;
const serviceLabel = (v: unknown) => SERVICE_OPTS.find((o) => o.value === v)?.label ?? String(v);

export type CrmView = "pipeline" | "table";

const withStage = (r: BaseRecord) => (r.stage ? r : { ...r, stage: "lead" });

export function CrmBoard({ initialView }: { initialView: CrmView }) {
  const router = useRouter();
  const today = useToday();
  const { user, store } = useHq();
  const { records, loading, error, save } = useCollection("clients");
  const { records: quotes } = useCollection(useShowMoney() ? "proposals" : "__none");
  const canWrite = can(user, clientsDef.write) && store.writable;

  const [view, setView] = useState<CrmView>(initialView);
  const [q, setQ] = useState("");
  const [draft, setDraft] = useState<Record<string, unknown> | null>(null);
  const [pendingMove, setPendingMove] = useState<{ client: BaseRecord; stage: string } | null>(null);
  const [reason, setReason] = useState("");
  const [moving, setMoving] = useState<string | null>(null);
  const [moveError, setMoveError] = useState("");

  const clients = useMemo(() => records.map(withStage), [records]);
  const value = useMemo(() => (r: BaseRecord) => clientValue(r, quotes), [quotes]);

  /* ── header stats ── */
  const stats = useMemo(() => {
    const perStage = CLIENT_STAGES.map((s) => {
      const list = clients.filter((r) => r.stage === s.value);
      const amount = list.reduce((acc, r) => acc + value(r).value, 0);
      return { ...s, count: list.length, amount, weighted: amount * stageProbability(s.value) };
    });
    const get = (v: string) => perStage.find((s) => s.value === v)!;
    const open = perStage.filter((s) => (OPEN_STAGES as string[]).includes(s.value));
    const openCount = open.reduce((a, s) => a + s.count, 0);
    const openValue = open.reduce((a, s) => a + s.amount, 0);
    const won = { ...get("won"), count: get("won").count + get("active").count };
    const lost = get("lost");
    const decided = won.count + lost.count;
    const forecast = perStage.reduce((a, s) => a + s.weighted, 0);
    const active = clients.filter((r) => r.stage !== "lost");
    const overdue = active.filter((r) => followUpState(r.nextFollowUp, today) === "overdue").length;
    const dueToday = active.filter((r) => followUpState(r.nextFollowUp, today) === "today").length;
    return { perStage, openCount, openValue, won, lost, conversion: decided ? won.count / decided : 0, decided, forecast, overdue, dueToday };
  }, [clients, today, value]);

  /* ── pipeline search ── */
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return clients;
    return clients.filter((r) => [r.name, r.city, r.industry, r.contactName, r.owner, r.clientType, ...(Array.isArray(r.tags) ? r.tags : []), ...(Array.isArray(r.services) ? r.services.map(serviceLabel) : [])].some((v) => str(v).toLowerCase().includes(s)));
  }, [clients, q]);

  function changeView(v: CrmView) {
    setView(v);
    router.replace(v === "table" ? "/hq/crm?view=table" : "/hq/crm", { scroll: false });
  }

  async function move(client: BaseRecord, stage: string, lostReason?: string) {
    setMoving(client.id);
    setMoveError("");
    try {
      await save({ ...client, stage, ...(lostReason !== undefined ? { lostReason } : {}) });
    } catch (e) {
      setMoveError(e instanceof Error ? e.message : "Could not move the client");
    } finally {
      setMoving(null);
    }
  }

  function onMove(client: BaseRecord, stage: string) {
    if (stage === "lost" || stage === "nurture") {
      setReason(str(client.lostReason));
      setPendingMove({ client, stage });
      return;
    }
    void move(client, stage);
  }

  const tableColumns: ExtraColumn<BaseRecord>[] = useMemo(
    () => [
      {
        key: "services",
        label: "Interested in",
        sortValue: (r) => (Array.isArray(r.services) ? r.services.length : 0),
        render: (r) => <span className="text-xs text-charcoal">{Array.isArray(r.services) && r.services.length ? r.services.map(serviceLabel).join(", ") : "—"}</span>,
      },
      {
        key: "dealValue",
        label: "Deal value",
        className: "text-right",
        sortValue: (r) => value(r).value,
        render: (r) => {
          const v = value(r);
          return (
            <span className="tabular block whitespace-nowrap text-right" title={v.estimated ? "From the latest open quote" : undefined}>
              {v.value ? `${v.estimated ? "≈ " : ""}${formatINR(v.value)}` : "—"}
            </span>
          );
        },
      },
      {
        key: "nextFollowUp",
        label: "Next follow-up",
        sortValue: (r) => str(r.nextFollowUp) || "9999",
        render: (r) => <FollowUpChip date={r.nextFollowUp} today={today} />,
      },
    ],
    [today, value],
  );

  // a planning number from Money → Business Planner: 0 for logins that do not see Finance, or before it is filled in
  const monthlyTarget = useBook()?.planner.targets.monthlyRevenue ?? 0;

  return (
    <div>
      <PageHeader
        eyebrow="Sales · 02"
        title="Clients CRM"
        icon="Building2"
        description="Every business, founder and institution from first lead to repeat client. Drag cards between stages; open a client for its full timeline."
        actions={
          <>
            <Segmented
              label="View"
              value={view}
              onChange={changeView}
              options={[
                { value: "pipeline", label: (<><Columns3 className="size-3.5" aria-hidden /> Pipeline</>) },
                { value: "table", label: (<><Table2 className="size-3.5" aria-hidden /> Table</>) },
              ]}
            />
            {canWrite && (
              <Button size="sm" className="h-9" onClick={() => setDraft(newClientDraft({ owner: user.name }))}>
                <Plus className="size-4" aria-hidden /> New client
              </Button>
            )}
          </>
        }
      />

      {/* KPI row */}
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Open pipeline" value={formatINRCompact(stats.openValue)} sub={`${formatNumber(stats.openCount)} client${stats.openCount === 1 ? "" : "s"} being worked`} />
        <StatCard
          tone="dark"
          label="Weighted forecast"
          value={formatINRCompact(stats.forecast)}
          sub={monthlyTarget > 0 ? `≈ ${(stats.forecast / monthlyTarget).toFixed(1)} months of the ${formatINRCompact(monthlyTarget)} monthly target` : "Open deals, weighted by how far along they are"}
        />
        <StatCard
          label="Conversion rate"
          value={stats.decided ? `${Math.round(stats.conversion * 100)}%` : "—"}
          sub={stats.decided ? `${stats.won.count} won · ${stats.lost.count} lost` : "Shown once deals are won or lost"}
          progress={stats.decided ? stats.conversion : undefined}
        />
        <StatCard
          label="Follow-ups due"
          value={formatNumber(stats.overdue + stats.dueToday)}
          sub={stats.overdue ? <span className="font-semibold text-bad">{stats.overdue} overdue</span> : stats.dueToday ? `${stats.dueToday} today` : "Nothing overdue"}
        />
      </div>

      {/* stage strip */}
      <section aria-label="Pipeline by stage" className="relative mb-6 overflow-hidden rounded-[var(--radius-md)] border border-graphite/12 bg-paper-50">
        <div className="bp-grid-fine pointer-events-none absolute inset-0 opacity-50" aria-hidden />
        <ol className="relative -mb-px -mr-px grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7">
          {TRACK_STAGES.map((id, i) => {
            const s = stats.perStage.find((x) => x.value === id)!;
            const share = stats.forecast ? s.weighted / stats.forecast : 0;
            return (
              <li key={id} className="relative border-b border-r border-graphite/10 px-4 py-3.5">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="annot text-[10px] text-blueprint">
                    <span className="font-mono">{String(i + 1).padStart(2, "0")}</span> {s.label}
                  </span>
                  <span className="font-mono text-[10px] text-blueprint">{Math.round(stageProbability(id) * 100)}%</span>
                </div>
                <p className="tabular mt-1.5 text-lg font-bold leading-none text-graphite">{formatINRCompact(s.amount)}</p>
                <p className="mt-1 text-xs text-charcoal">
                  {s.count} client{s.count === 1 ? "" : "s"}
                </p>
                <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-graphite/10" aria-hidden>
                  <div className="h-full rounded-full bg-lime transition-[width] duration-700" style={{ width: `${Math.round(share * 100)}%` }} />
                </div>
              </li>
            );
          })}
        </ol>
        <div className="relative flex flex-wrap items-center gap-x-5 gap-y-1 border-t border-graphite/10 px-4 py-2 text-xs text-blueprint">
          <span>Bars show each stage&apos;s share of the weighted forecast.</span>
          <span className="ml-auto">
            Lost <strong className="tabular text-charcoal">{stats.perStage.find((s) => s.value === "lost")?.count ?? 0}</strong> · Nurture{" "}
            <strong className="tabular text-charcoal">{stats.perStage.find((s) => s.value === "nurture")?.count ?? 0}</strong>
          </span>
        </div>
      </section>

      {error && <Notice tone="bad" className="mb-4">{error}</Notice>}
      {moveError && <Notice tone="bad" className="mb-4">{moveError}</Notice>}

      {view === "pipeline" ? (
        loading ? (
          <Loading />
        ) : !clients.length ? (
          <EmptyState
            icon="Building2"
            title="No clients in the pipeline yet"
            description="Add businesses you are talking to, or convert enquiries from the Enquiries inbox."
            action={
              <div className="flex flex-wrap justify-center gap-2">
                {canWrite && (
                  <Button size="sm" onClick={() => setDraft(newClientDraft({ owner: user.name }))}>
                    <Plus className="size-4" aria-hidden /> Add a client
                  </Button>
                )}
                <Button variant="secondary" size="sm" href="/hq/leads">
                  Open enquiries
                </Button>
              </div>
            }
          />
        ) : (
          <>
            <div className="mb-3 flex flex-wrap items-center gap-3">
              <div className="relative w-full sm:max-w-xs">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-blueprint" aria-hidden />
                <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter cards…" aria-label="Filter pipeline cards" className="pl-9" />
              </div>
              <p className="text-xs text-blueprint">{canWrite ? "Drag a card to change its stage · click to open" : "Click a card to open the client"}</p>
              {moving && (
                <span className="inline-flex items-center gap-1.5 text-xs text-charcoal">
                  <Loader2 className="size-3.5 animate-spin" aria-hidden /> Saving…
                </span>
              )}
            </div>
            <Kanban
              records={filtered}
              field="stage"
              columns={CLIENT_STAGES}
              disabled={!canWrite}
              onMove={onMove}
              onOpen={(r) => router.push(`/hq/crm/${r.id}`)}
              columnFooter={(stage, items) => {
                const total = items.reduce((a, r) => a + value(r).value, 0);
                return (
                  <span className="flex items-center justify-between gap-2">
                    <span className="tabular font-semibold text-charcoal">{formatINRCompact(total)}</span>
                    <span className="tabular">weighted {formatINRCompact(total * stageProbability(stage))}</span>
                  </span>
                );
              }}
              renderCard={(r) => <ClientCard client={r} today={today} busy={moving === r.id} v={value(r)} />}
            />
          </>
        )
      ) : (
        <CollectionManager
          name="clients"
          columns={["name", "stage", "city", "contactName", "phone"]}
          extraColumns={tableColumns}
          hideNew
          onOpen={(r) => router.push(`/hq/crm/${r.id}`)}
          emptyText="Add businesses you are talking to, or convert enquiries from the Enquiries inbox."
        />
      )}

      <ClientFormDrawer value={draft} onChange={setDraft} onClose={() => setDraft(null)} onSaved={(rec, isNew) => isNew && router.push(`/hq/crm/${rec.id}`)} />

      <Modal
        open={!!pendingMove}
        onClose={() => setPendingMove(null)}
        title={pendingMove ? `Move to ${stageLabel(pendingMove.stage)}` : ""}
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setPendingMove(null)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => {
                if (!pendingMove) return;
                void move(pendingMove.client, pendingMove.stage, reason.trim());
                setPendingMove(null);
              }}
            >
              Move client
            </Button>
          </>
        }
      >
        {pendingMove && (
          <div>
            <p className="text-sm text-charcoal">
              <strong className="text-graphite">{str(pendingMove.client.name)}</strong> will move to <Badge tone={statusTone(pendingMove.stage)}>{stageLabel(pendingMove.stage)}</Badge>. What happened? The reason helps the next conversation.
            </p>
            <div className="mt-4">
              <Label htmlFor="move-reason">Reason (optional)</Label>
              <Input id="move-reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder={pendingMove.stage === "lost" ? "e.g. Went with a cheaper freelancer" : "e.g. Revisit after their funding round"} autoFocus />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function ClientCard({ client, today, busy, v }: { client: BaseRecord; today: string; busy: boolean; v: { value: number; estimated: boolean } }) {
  const meta = [client.city, client.clientType].filter(Boolean).map(String).join(" · ");
  const services = Array.isArray(client.services) ? client.services.map(serviceLabel) : [];
  return (
    <div className={cn("relative", busy && "opacity-60")}>
      <Link
        href={`/hq/crm/${client.id}`}
        onClick={(e) => e.stopPropagation()}
        draggable={false}
        className="line-clamp-2 font-semibold leading-snug text-graphite hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-graphite"
      >
        {str(client.name) || "Untitled client"}
      </Link>
      {meta && <p className="mt-0.5 truncate text-xs text-blueprint">{meta}</p>}
      {services.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {services.slice(0, 3).map((s) => (
            <span key={s} className="rounded-full bg-lime/35 px-2 py-0.5 text-[10px] font-semibold text-graphite">
              {s}
            </span>
          ))}
          {services.length > 3 && <span className="text-[10px] text-blueprint">+{services.length - 3}</span>}
        </div>
      )}
      <div className="mt-3 flex items-center justify-between gap-2 border-t border-dashed border-graphite/12 pt-2.5 text-xs">
        <span className="truncate text-charcoal">{str(client.contactName) || "—"}</span>
        <span className="tabular font-semibold text-graphite" title={v.estimated ? "From the latest open quote" : "Expected deal value"}>
          {v.value ? `${v.estimated ? "≈ " : ""}${formatINRCompact(v.value)}` : "—"}
        </span>
      </div>
      <div className="mt-2">
        <FollowUpChip date={client.nextFollowUp} today={today} empty={<span className="text-[11px]">No follow-up set</span>} />
      </div>
    </div>
  );
}
