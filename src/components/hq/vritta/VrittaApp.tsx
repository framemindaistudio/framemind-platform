"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Circle, Plus } from "lucide-react";
import { VRITTA, type VrittaEdition, type VrittaSegment } from "@/lib/content/catalog";
import { getCollection, type BaseRecord } from "@/lib/hq/collections";
import { can } from "@/lib/hq/roles";
import { priceVritta } from "@/lib/pricebook/math";
import { Badge, statusTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Tabs } from "@/components/ui/Tabs";
import { CollectionManager } from "@/components/hq/CollectionManager";
import { nextNumber, useCollection, useHq, useRates, useShowMoney } from "@/components/hq/data";
import { RecordDrawer, blankRecord } from "@/components/hq/RecordDrawer";
import { PageHeader, Panel, StatCard } from "@/components/hq/ui";
import { useToday } from "@/components/hq/sales/useToday";
import { daysBetween, num, shortDate, str } from "@/components/hq/projects/logic";
import { cn, formatINR, formatINRCompact } from "@/lib/utils";

const def = getCollection("vrittaLicences")!;
const EDITION = Object.fromEntries(VRITTA.editions.map((e) => [e.id, e.name]));
type Tab = "licences" | "golive" | "rates";

/** What a licence brings in per year: annual as it is, monthly × 12, perpetual → its AMC from year 2. */
export function annualValue(l: BaseRecord) {
  const fee = num(l.licenceFee);
  switch (str(l.billing)) {
    case "monthly":
    case "pilot":
      return fee * 12;
    case "perpetual":
      return 0;
    default:
      return fee;
  }
}

export function VrittaApp() {
  const { user, store } = useHq();
  const today = useToday();
  const rates = useRates();
  const showMoney = useShowMoney();
  const { records, save } = useCollection("vrittaLicences");
  const canWrite = can(user, def.write) && store.writable;
  const [tab, setTab] = useState<Tab>("licences");
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const [selected, setSelected] = useState<string>("");

  const live = records.filter((r) => ["live", "renewal-due", "implementing", "pilot"].includes(str(r.status)));
  const stats = useMemo(() => {
    const due = today ? records.filter((r) => str(r.renewalDate) && ["live", "renewal-due"].includes(str(r.status)) && daysBetween(today, str(r.renewalDate)) <= 60) : [];
    return {
      institutions: live.length,
      pilots: records.filter((r) => r.status === "pilot").length,
      arr: live.reduce((s, r) => s + annualValue(r), 0),
      due: due.length,
      pipeline: records.filter((r) => ["enquiry", "demo"].includes(str(r.status))).length,
    };
  }, [records, live, today]);

  const golive = records.filter((r) => ["implementing", "pilot"].includes(str(r.status)) || (r.status === "live" && !r.firstIssueDate));
  const current = golive.find((r) => r.id === selected) ?? golive[0];
  const steps = (r: BaseRecord) => (Array.isArray(r.golive) ? (r.golive as string[]) : []);

  async function newLicence() {
    const licenceNo = await nextNumber("order").catch(() => "");
    setEditing(blankRecord("vrittaLicences", { licenceNo, status: "enquiry" }));
  }

  return (
    <div>
      <PageHeader
        eyebrow="Coaching & Products"
        icon="Newspaper"
        title="Vritta"
        description={VRITTA.line}
        actions={
          canWrite ? (
            <Button size="sm" className="h-9" onClick={newLicence}>
              <Plus className="size-4" /> New institution
            </Button>
          ) : undefined
        }
      />
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard tone="dark" label="Institutions on Vritta" value={stats.institutions} sub={`${stats.pilots} on a pilot · ${stats.pipeline} in the pipeline`} />
        {showMoney ? <StatCard label="Licence value / year" value={formatINRCompact(stats.arr)} sub="Annual, plus monthly × 12" /> : <StatCard label="Editions" value="3" sub="Essential · Professional · Institutional" />}
        <StatCard label="Renewals in 60 days" value={stats.due} sub={stats.due ? <span className="font-semibold text-warn">Send the renewal or AMC invoice</span> : "Nothing due soon"} />
        <StatCard label="Go-live" value={`${VRITTA.goLiveWeeks} weeks`} sub="From purchase order to first issue" />
      </div>

      <Tabs className="mb-6" value={tab} onChange={setTab} tabs={[{ value: "licences", label: "Institutions", count: records.length || undefined }, { value: "golive", label: "Go-live", count: golive.length || undefined }, { value: "rates", label: "Rate card" }]} />

      {tab === "licences" && (
        <CollectionManager
          name="vrittaLicences"
          columns={["institution", "segment", "edition", "billing", "status", "renewalDate"]}
          extraColumns={
            showMoney
              ? [
                  {
                    key: "value",
                    label: "Per year",
                    className: "text-right",
                    sortValue: annualValue,
                    render: (r) => <span className="tabular block text-right text-xs font-semibold">{annualValue(r) ? formatINR(annualValue(r)) : str(r.billing) === "perpetual" ? "AMC from yr 2" : "—"}</span>,
                  },
                ]
              : []
          }
          hideNew
          emptyText="Add every institution you pitch Vritta to — from the first demo to renewal."
          drawerExtra={(r) =>
            rates && r.segment && r.edition && r.billing ? (
              <PriceHint segment={str(r.segment) as VrittaSegment} edition={str(r.edition) as VrittaEdition} billing={str(r.billing)} group={r.groupInstitution === true} rates={rates.vritta} />
            ) : null
          }
        />
      )}

      {tab === "golive" &&
        (golive.length === 0 ? (
          <Panel>
            <p className="text-sm text-charcoal">No institution is implementing right now. Move a licence to Implementing or Pilot to track its four-week go-live.</p>
          </Panel>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
            <ul className="space-y-2">
              {golive.map((r) => (
                <li key={r.id}>
                  <button type="button" onClick={() => setSelected(r.id)} className={cn("w-full rounded-[var(--radius-sm)] border px-3 py-2.5 text-left", current?.id === r.id ? "border-graphite bg-graphite text-paper" : "border-graphite/15 bg-paper-50 hover:border-graphite/40")}>
                    <span className="block truncate text-sm font-semibold">{str(r.institution)}</span>
                    <span className={cn("block text-xs", current?.id === r.id ? "text-paper/60" : "text-blueprint")}>
                      {EDITION[str(r.edition)]} · {steps(r).length}/{VRITTA.plan.length + 1} steps
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            {current && (
              <Panel title={str(current.institution)} subtitle={`PO ${current.poDate ? shortDate(current.poDate) : "date not set"} · ${str(current.hosting) || "managed"} hosting`} action={<Badge tone={statusTone(current.status)}>{str(current.status)}</Badge>}>
                <ol className="space-y-2">
                  {[...VRITTA.plan, { week: "Months 2–12", title: "Included support", detail: "Defect resolution, platform updates and one review session per term with the administrator." }].map((p, i) => {
                    const key = `step-${i}`;
                    const done = steps(current).includes(key);
                    return (
                      <li key={key}>
                        <button
                          type="button"
                          disabled={!canWrite}
                          onClick={() => save({ ...current, golive: done ? steps(current).filter((k) => k !== key) : [...steps(current), key], ...(i === 3 && !done ? { firstIssueDate: today || undefined, status: current.status === "implementing" ? "live" : current.status } : {}) })}
                          className={cn("flex w-full items-start gap-3 rounded-[var(--radius-md)] border p-3 text-left", done ? "border-ok/25 bg-ok/5" : "border-graphite/12 bg-paper")}
                        >
                          {done ? <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-ok" /> : <Circle className="mt-0.5 size-5 shrink-0 text-blueprint" />}
                          <span>
                            <span className="annot block text-[10px] text-blueprint">{p.week}</span>
                            <span className={cn("block text-sm font-semibold", done ? "text-blueprint line-through" : "text-graphite")}>{p.title}</span>
                            <span className="block text-xs text-charcoal">{p.detail}</span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ol>
                <p className="mt-4 text-[11px] text-blueprint">Ticking “First issue & print proof” records the first-issue date and marks an implementing institution Live.</p>
              </Panel>
            )}
          </div>
        ))}

      {tab === "rates" && rates && (
        <div className="space-y-6">
          {(["college", "school"] as VrittaSegment[]).map((seg) => (
            <Panel key={seg} title={seg === "college" ? "Colleges" : "Schools"} subtitle="Annual = two months free against monthly · perpetual = 4 × annual (self-hosted only)">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[520px] text-sm">
                  <thead>
                    <tr className="annot text-left text-[10px] text-blueprint">
                      <th className="pb-2 font-medium">Edition</th>
                      <th className="pb-2 text-right font-medium">Monthly</th>
                      <th className="pb-2 text-right font-medium">Annual</th>
                      <th className="pb-2 text-right font-medium">Perpetual</th>
                      <th className="pb-2 text-right font-medium">AMC from yr 2</th>
                    </tr>
                  </thead>
                  <tbody>
                    {VRITTA.editions.map((e) => {
                      const r = rates.vritta.rates[seg][e.id];
                      return (
                        <tr key={e.id} className="border-t border-graphite/10">
                          <td className="py-2 font-medium">
                            {e.name} <span className="text-xs text-blueprint">· support {e.support}</span>
                          </td>
                          {r ? (
                            (["monthly", "annual", "perpetual", "amc"] as const).map((c) => (
                              <td key={c} className="tabular py-2 text-right">
                                {formatINR(r[c])}
                              </td>
                            ))
                          ) : (
                            <td colSpan={4} className="py-2 text-right text-xs text-blueprint">
                              Not available for schools
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Panel>
          ))}
          <div className="grid gap-6 lg:grid-cols-2">
            <Panel title="One-time charges">
              <ul className="divide-y divide-graphite/10 text-sm">
                {rates.vritta.oneTime.map((o) => (
                  <li key={o.id} className="flex justify-between gap-4 py-2">
                    <span>
                      <span className="font-medium">{o.label}</span>
                      <span className="block text-xs text-blueprint">{o.detail}</span>
                    </span>
                    <span className="tabular shrink-0 font-semibold">{formatINR(o.price)}</span>
                  </li>
                ))}
              </ul>
            </Panel>
            <Panel title="Hosting">
              <ul className="space-y-2 text-sm">
                {VRITTA.hosting.map((h) => (
                  <li key={h.id}>
                    <span className="font-semibold">{h.label}</span> <span className="text-charcoal">— {h.detail}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-blueprint">
                {VRITTA.pilotNote} Further institutions of the same trust: {rates.vritta.groupLicencePercent}% of the licence. Maintenance on perpetual: {rates.vritta.amcPercent}% a year from year 2.
              </p>
            </Panel>
          </div>
          <p className="text-xs text-blueprint">Change these in Money → Rate Card → Vritta.</p>
        </div>
      )}

      {editing && <RecordDrawer name="vrittaLicences" initial={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

function PriceHint({ segment, edition, billing, group, rates }: { segment: VrittaSegment; edition: VrittaEdition; billing: string; group: boolean; rates: NonNullable<ReturnType<typeof useRates>>["vritta"] }) {
  const b = billing === "pilot" ? "monthly" : (billing as "monthly" | "annual" | "perpetual");
  const p = priceVritta(rates, segment, edition, b, group, []);
  if (!p.available) return <p className="mb-4 rounded border border-bad/30 bg-bad/10 px-3 py-2 text-xs text-bad">This edition is not offered for {segment === "school" ? "schools" : "colleges"}.</p>;
  return (
    <p className="mb-4 rounded border border-graphite/12 bg-paper px-3 py-2 text-xs text-charcoal">
      Rate card: <strong className="text-graphite">{formatINR(p.licence)}</strong> {b === "perpetual" ? "one-time" : `per ${b === "monthly" ? "month" : "year"}`}
      {group ? " (group rate)" : ""}
      {b === "perpetual" ? ` · AMC ${formatINR(p.amc)} a year from year 2` : ""}.
    </p>
  );
}
