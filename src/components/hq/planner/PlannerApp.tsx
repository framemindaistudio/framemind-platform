"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Save, Trash2, Undo2 } from "lucide-react";
import { can, LEADERSHIP } from "@/lib/hq/roles";
import { invoiceTotals } from "@/lib/hq/collections";
import type { MoneyLine, PriceBook, RevenueStream } from "@/lib/pricebook/types";
import { api, useBook, useCollection, useHq, useRates } from "@/components/hq/data";
import { EmptyState, PageHeader, StatCard } from "@/components/hq/ui";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/form";
import { cn, formatINR, formatINRCompact, isoDate, uid } from "@/lib/utils";
import { Metric, Note, NumField, Section, TABLE_WRAP, TH } from "./controls";
import { monthlyModel, projection } from "./model";

const ProjectionChart = dynamic(() => import("./ProjectionChart"), { ssr: false, loading: () => <div className="h-[300px] animate-pulse rounded bg-graphite/[0.05]" /> });

const HEADER = { title: "Business Planner", eyebrow: "Money", icon: "Calculator" } as const;

/** /hq/planner: the studio's monthly model, targets and a 12-month projection, saved with the rate card. */
export function PlannerApp() {
  const book = useBook();
  if (!book) {
    return (
      <>
        <PageHeader {...HEADER} description="Monthly costs, targets and a 12-month projection." />
        <EmptyState icon="Calculator" title="The planner is not available for this login" description="It works with the studio's costs, which are shown only to founders, admins and operations." />
      </>
    );
  }
  return <Planner initial={book} />;
}

function Planner({ initial }: { initial: PriceBook }) {
  const { user, store } = useHq();
  const router = useRouter();
  const rates = useRates();
  const editable = can(user, LEADERSHIP) && store.writable;
  const [saved, setSaved] = useState(initial);
  const [draft, setDraft] = useState(() => structuredClone(initial));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const { records: invoices } = useCollection("invoices");
  const { records: expenses } = useCollection("expenses");
  const { records: income } = useCollection("income");
  const { records: quotes } = useCollection("proposals");
  const p = draft.planner;
  const t = p.targets;
  const changed = JSON.stringify(saved.planner) !== JSON.stringify(p);

  // a new saved planner from the server replaces what is held here (adjusting state during render, not in an effect)
  const [seen, setSeen] = useState(initial);
  if (seen !== initial) {
    setSeen(initial);
    setSaved(initial);
  }

  const m = useMemo(() => monthlyModel(p, rates), [p, rates]);
  const start = isoDate().slice(0, 7);
  const proj = useMemo(() => projection(p, rates, start), [p, rates, start]);

  // what the books say: average accepted quote, and the last six months
  const accepted = quotes.filter((q) => q.status === "accepted" && Number(q.total) > 0);
  const avgQuote = accepted.length ? accepted.reduce((s, q) => s + Number(q.total), 0) / accepted.length : 0;
  const actuals = useMemo(() => {
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (5 - i));
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    });
    return months.map((mo) => ({
      month: mo,
      revenue: invoices.filter((i) => String(i.date ?? "").startsWith(mo)).reduce((s, i) => s + invoiceTotals(i).paid * (invoiceTotals(i).total ? invoiceTotals(i).taxable / invoiceTotals(i).total : 1), 0) + income.filter((i) => String(i.date ?? "").startsWith(mo)).reduce((s, i) => s + (Number(i.amount) || 0), 0),
      expenses: expenses.filter((e) => String(e.date ?? "").startsWith(mo)).reduce((s, e) => s + (Number(e.amount) || 0), 0),
    }));
  }, [invoices, expenses, income]);

  const set = (change: (pl: PriceBook["planner"]) => PriceBook["planner"]) => setDraft((d) => ({ ...d, planner: change(d.planner) }));
  const setT = (k: keyof typeof t, v: number) => set((pl) => ({ ...pl, targets: { ...pl.targets, [k]: v } }));

  async function save() {
    setSaving(true);
    setError("");
    try {
      const j = await api<{ book: PriceBook }>("/api/hq/pricebook", { method: "PUT", body: JSON.stringify({ book: { ...saved, planner: draft.planner } }) });
      setSaved(j.book);
      setDraft(structuredClone(j.book));
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader {...HEADER} description="What a month brings in from each line of work, what the studio costs to run, what is left — and twelve months ahead. Every number is yours: nothing is assumed." />

      <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard tone="dark" label="Planned revenue / month" value={formatINRCompact(m.revenue)} sub={t.monthlyRevenue ? `Target ${formatINRCompact(t.monthlyRevenue)}` : "Set a revenue target below"} progress={t.monthlyRevenue ? m.revenue / t.monthlyRevenue : undefined} />
        <StatCard label="Fixed costs / month" value={formatINRCompact(m.fixed)} sub={`${p.fixedCosts.length} cost lines`} />
        <StatCard label="Profit / month" value={formatINRCompact(m.profit)} sub={m.revenue ? `${m.marginPct}% of revenue` : "—"} />
        <StatCard label="Break-even" value={m.breakEvenProjects === null ? "—" : `${m.breakEvenProjects} projects`} sub={m.breakEvenProjects === null ? "Set the average project value" : "a month, with the other lines as planned"} />
      </div>

      <div className="space-y-12">
        <Section id="mix" index="01" title="The month" intro="How much work a typical month holds. Projects, retainers, coaching and Vritta are counted separately because they bill differently.">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <NumField label="Projects a month" value={t.projectsPerMonth} onChange={(v) => setT("projectsPerMonth", v)} step={0.5} />
            <NumField label="Average project value" prefix="₹" value={t.avgProjectValue} onChange={(v) => setT("avgProjectValue", v)} step={1000} hint={avgQuote ? `Accepted quotes average ${formatINR(Math.round(avgQuote))}` : undefined} />
            <NumField label="Social retainers running" value={t.socialRetainers} onChange={(v) => setT("socialRetainers", v)} />
            <NumField label="Average retainer / month" prefix="₹" value={t.avgRetainer} onChange={(v) => setT("avgRetainer", v)} step={1000} />
            <NumField label="Coaching learners at once" value={t.activeLearners} onChange={(v) => setT("activeLearners", v)} hint={rates && !Math.max(rates.coaching.online, rates.coaching.offline) ? "Set the coaching fee in the Rate Card" : undefined} />
            <NumField label="Vritta institutions" value={t.vrittaInstitutions} onChange={(v) => setT("vrittaInstitutions", v)} />
            <NumField label="Revenue target / month" prefix="₹" value={t.monthlyRevenue} onChange={(v) => setT("monthlyRevenue", v)} step={5000} />
            <NumField label="Project growth / month" suffix="%" min={-50} value={t.growthPercent} onChange={(v) => setT("growthPercent", v)} step={0.5} />
          </div>
          <div className={cn(TABLE_WRAP, "mt-6")}>
            <table className="w-full min-w-[620px] text-sm">
              <thead>
                <tr className="border-b border-graphite/10">
                  <th className={TH}>Line of work</th>
                  <th className={cn(TH, "text-right")}>Revenue / month</th>
                  <th className={cn(TH, "w-40 text-right")}>Kept after direct costs</th>
                  <th className={cn(TH, "text-right")}>Contribution</th>
                </tr>
              </thead>
              <tbody>
                {m.lines.map((l) => (
                  <tr key={l.key} className="border-b border-graphite/8">
                    <td className="px-3 py-2.5">
                      <span className="font-medium">{l.label}</span>
                      <span className="block text-[11px] text-blueprint">{l.detail}</span>
                    </td>
                    <td className="tabular px-3 py-2.5 text-right">{formatINR(Math.round(l.revenue))}</td>
                    <td className="px-3 py-1.5">
                      <NumField ariaLabel={`${l.label} margin`} suffix="%" value={p.margins[l.key] ?? 0} onChange={(v) => set((pl) => ({ ...pl, margins: { ...pl.margins, [l.key]: v } }))} max={100} />
                    </td>
                    <td className="tabular px-3 py-2.5 text-right font-semibold">{formatINR(Math.round(l.contribution))}</td>
                  </tr>
                ))}
                <tr>
                  <td className="px-3 py-2.5 font-bold">Total</td>
                  <td className="tabular px-3 py-2.5 text-right font-bold">{formatINR(Math.round(m.revenue))}</td>
                  <td />
                  <td className="tabular px-3 py-2.5 text-right font-bold">{formatINR(Math.round(m.contribution))}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <Note className="mt-3">“Kept after direct costs” is the share of the price left after freelancers, gear rental, stock media, travel and API costs for that kind of work. Left at 0, nothing is taken off — so set it.</Note>
        </Section>

        <Section id="costs" index="02" title="Monthly fixed costs" intro="What the studio costs to run whether or not work comes in: salaries and stipends, rent, tools and subscriptions, internet, accountant.">
          <MoneyList lines={p.fixedCosts} onChange={(next) => set((pl) => ({ ...pl, fixedCosts: next }))} editable={editable} placeholder="e.g. Figma + Adobe + hosting" />
        </Section>

        <Section id="projection" index="03" title="Twelve months ahead" intro={`Profit each month, and cash after the one-time setup spend${proj.payback ? ` — paid back by ${proj.payback}` : proj.capex ? " — not paid back within the year at this plan" : ""}.`}>
          <ProjectionChart rows={proj.rows} spend={proj.capex} paybackLabel={proj.payback} />
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Metric label="Revenue, 12 months" value={formatINRCompact(proj.rows.reduce((s, r) => s + r.revenue, 0))} />
            <Metric label="Profit, 12 months" value={formatINRCompact(proj.rows.reduce((s, r) => s + r.profit, 0))} />
            <Metric label="Setup spend" value={formatINRCompact(proj.capex)} />
            <Metric label="Cash at month 12" value={formatINRCompact(proj.rows.at(-1)?.cash ?? 0)} strong />
          </div>
        </Section>

        <Section id="capex" index="04" title="One-time setup and gear" intro="Cameras, lenses, lights, a computer, software licences bought outright — anything paid once.">
          <MoneyList lines={p.capex} onChange={(next) => set((pl) => ({ ...pl, capex: next }))} editable={editable} placeholder="e.g. Second camera body" />
        </Section>

        <Section id="actuals" index="05" title="What actually happened" intro="Revenue (receipts before GST, plus other income) and expenses from Finance, for the last six months, beside the plan.">
          <div className={TABLE_WRAP}>
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="border-b border-graphite/10">
                  <th className={TH}>Month</th>
                  <th className={cn(TH, "text-right")}>Revenue</th>
                  <th className={cn(TH, "text-right")}>Expenses</th>
                  <th className={cn(TH, "text-right")}>Net</th>
                  <th className={cn(TH, "text-right")}>vs planned revenue</th>
                </tr>
              </thead>
              <tbody>
                {actuals.map((a) => (
                  <tr key={a.month} className="border-b border-graphite/8">
                    <td className="px-3 py-2">{new Date(`${a.month}-01`).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}</td>
                    <td className="tabular px-3 py-2 text-right">{formatINR(Math.round(a.revenue))}</td>
                    <td className="tabular px-3 py-2 text-right">{formatINR(Math.round(a.expenses))}</td>
                    <td className={cn("tabular px-3 py-2 text-right font-semibold", a.revenue - a.expenses < 0 && "text-bad")}>{formatINR(Math.round(a.revenue - a.expenses))}</td>
                    <td className="tabular px-3 py-2 text-right text-charcoal">{m.revenue ? `${Math.round((a.revenue / m.revenue) * 100)}%` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        <Section id="streams" index="06" title="Revenue streams" intro="Ideas and lines of business you are building or weighing: how they would make money and where they stand.">
          <Streams list={p.streams} onChange={(next) => set((pl) => ({ ...pl, streams: next }))} editable={editable} />
        </Section>
      </div>

      {editable && changed && (
        <div className="sticky bottom-3 z-30 mt-8 flex flex-wrap items-center gap-3 rounded-[var(--radius-md)] border border-graphite bg-graphite px-4 py-3 text-paper shadow-[var(--shadow-lift)]">
          <p className="min-w-0 flex-1 text-sm">
            <span className="font-semibold">Plan not saved</span>
            {error && <span className="text-bad"> · {error}</span>}
          </p>
          <Button variant="outline-light" size="sm" onClick={() => setDraft(structuredClone(saved))} disabled={saving}>
            <Undo2 className="size-4" /> Discard
          </Button>
          <Button variant="lime" size="sm" onClick={save} disabled={saving}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Save plan
          </Button>
        </div>
      )}
    </div>
  );
}

function MoneyList({ lines, onChange, editable, placeholder }: { lines: MoneyLine[]; onChange: (l: MoneyLine[]) => void; editable: boolean; placeholder: string }) {
  const total = lines.reduce((s, l) => s + l.amount, 0);
  return (
    <div className="max-w-2xl space-y-2">
      {lines.map((l, i) => (
        <div key={l.id} className="grid grid-cols-[1fr_160px_auto] items-center gap-2">
          <Input aria-label="Item" value={l.label} disabled={!editable} onChange={(e) => onChange(lines.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} placeholder={placeholder} />
          <NumField ariaLabel="Amount" prefix="₹" value={l.amount} onChange={(v) => onChange(lines.map((x, j) => (j === i ? { ...x, amount: v } : x)))} step={500} />
          {editable && (
            <button type="button" onClick={() => onChange(lines.filter((_, j) => j !== i))} className="rounded p-2 text-blueprint hover:bg-bad/10 hover:text-bad" aria-label="Remove">
              <Trash2 className="size-4" />
            </button>
          )}
        </div>
      ))}
      <div className="flex items-center justify-between border-t border-graphite/10 pt-2">
        {editable ? (
          <Button size="sm" variant="ghost" onClick={() => onChange([...lines, { id: uid("ln"), label: "", amount: 0 }])}>
            <Plus className="size-4" /> Add a line
          </Button>
        ) : (
          <span />
        )}
        <span className="tabular text-sm font-bold">{formatINR(total)}</span>
      </div>
    </div>
  );
}

function Streams({ list, onChange, editable }: { list: RevenueStream[]; onChange: (l: RevenueStream[]) => void; editable: boolean }) {
  const set = (i: number, patch: Partial<RevenueStream>) => onChange(list.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  return (
    <div className="space-y-2">
      {list.map((s, i) => (
        <div key={s.id} className="grid gap-2 rounded-[var(--radius-sm)] border border-graphite/10 bg-paper-50 p-2 sm:grid-cols-[1fr_1.2fr_1.2fr_140px_auto]">
          <Input aria-label="Stream" value={s.name} disabled={!editable} placeholder="Name" onChange={(e) => set(i, { name: e.target.value })} />
          <Input aria-label="Model" value={s.model} disabled={!editable} placeholder="How it makes money" onChange={(e) => set(i, { model: e.target.value })} />
          <Input aria-label="Potential" value={s.potential} disabled={!editable} placeholder="Potential" onChange={(e) => set(i, { potential: e.target.value })} />
          <Input aria-label="Stage" value={s.stage} disabled={!editable} placeholder="Idea / testing / live" onChange={(e) => set(i, { stage: e.target.value })} />
          {editable && (
            <button type="button" onClick={() => onChange(list.filter((_, j) => j !== i))} className="rounded p-2 text-blueprint hover:bg-bad/10 hover:text-bad" aria-label="Remove">
              <Trash2 className="size-4" />
            </button>
          )}
        </div>
      ))}
      {editable && (
        <Button size="sm" variant="ghost" onClick={() => onChange([...list, { id: uid("stream"), name: "", model: "", potential: "", stage: "Idea" }])}>
          <Plus className="size-4" /> Add a stream
        </Button>
      )}
      {!list.length && !editable && <p className="text-sm text-charcoal">No streams written down yet.</p>}
    </div>
  );
}
