"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Loader2, Plus, Save, Trash2, TriangleAlert, Undo2 } from "lucide-react";
import type { Service, ServiceGroup, ServiceOption, VrittaEdition, VrittaSegment } from "@/lib/content/catalog";
import { VRITTA } from "@/lib/content/catalog";
import type { PriceBook, RateCard } from "@/lib/pricebook/types";
import { can, LEADERSHIP } from "@/lib/hq/roles";
import { cn, formatDateTime, formatINR, uid } from "@/lib/utils";
import { api, useHq } from "@/components/hq/data";
import { HqIcon } from "@/components/hq/Icon";
import { EmptyState, Loading, PageHeader, Panel } from "@/components/hq/ui";
import { Button } from "@/components/ui/Button";
import { Tabs } from "@/components/ui/Tabs";

type TabId = "services" | "discounts" | "vritta" | "coaching" | "terms";
const TAB_NAMES: Record<TabId, string> = { services: "Services", discounts: "Bundles & retainers", vritta: "Vritta", coaching: "AI Coaching", terms: "Terms & GST" };
const LEAVE_QUESTION = "You have changes that are not saved. Leave this page without saving them?";

interface Loaded {
  book: PriceBook;
  exists: boolean;
  storeMode: string;
}

/** Asks before the page is left with changes that are not saved (closing the tab, or a link inside HQ). */
function useLeaveGuard(active: boolean) {
  useEffect(() => {
    if (!active) return;
    const beforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const link = e.target instanceof Element ? e.target.closest<HTMLAnchorElement>("a[href]") : null;
      if (!link || link.target === "_blank" || link.hasAttribute("download")) return;
      const to = new URL(link.href, window.location.href);
      if (to.origin !== window.location.origin || to.pathname === window.location.pathname) return;
      if (!window.confirm(LEAVE_QUESTION)) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    window.addEventListener("beforeunload", beforeUnload);
    window.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
      window.removeEventListener("click", onClick, true);
    };
  }, [active]);
}

const box =
  "h-9 w-full min-w-0 rounded-[var(--radius-sm)] border border-graphite/20 bg-paper-50 px-2.5 text-sm text-graphite outline-none transition-colors placeholder:text-blueprint/50 focus:border-graphite focus:bg-white focus:ring-2 focus:ring-lime/40 disabled:border-graphite/10 disabled:bg-transparent";

function Text({ value, onChange, placeholder, disabled, className, label }: { value: string; onChange: (v: string) => void; placeholder?: string; disabled?: boolean; className?: string; label?: string }) {
  return <input aria-label={label ?? placeholder} value={value} placeholder={placeholder} disabled={disabled} onChange={(e) => onChange(e.target.value)} className={cn(box, className)} />;
}

function Money({ value, onChange, disabled, label, suffix }: { value: number; onChange: (v: number) => void; disabled?: boolean; label: string; suffix?: "%" | "count" }) {
  return (
    <div className="relative">
      {!suffix && <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 font-mono text-xs text-blueprint">₹</span>}
      <input
        aria-label={label}
        inputMode="decimal"
        disabled={disabled}
        value={Number.isFinite(value) ? String(value) : ""}
        onChange={(e) => {
          const n = Number(e.target.value.replace(/[,\s₹%]/g, ""));
          onChange(Number.isFinite(n) ? n : 0);
        }}
        className={cn(box, "tabular text-right font-mono", suffix === "%" ? "pr-7" : suffix ? "" : "pl-6")}
      />
      {suffix === "%" && <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 font-mono text-xs text-blueprint">%</span>}
    </div>
  );
}

const move = <T,>(list: T[], i: number, by: number) => {
  const j = i + by;
  if (j < 0 || j >= list.length) return list;
  const next = [...list];
  [next[i], next[j]] = [next[j], next[i]];
  return next;
};

/** HQ → Money → Rate Card: every service, option and price the studio quotes. */
export function RateCardApp() {
  const { user, store } = useHq();
  const router = useRouter();
  const editable = can(user, LEADERSHIP) && store.writable;
  const [data, setData] = useState<Loaded | null>(null);
  const [draft, setDraft] = useState<PriceBook | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [tab, setTab] = useState<TabId>("services");
  const [serviceId, setServiceId] = useState("websites");
  const [saving, setSaving] = useState(false);
  const [refusal, setRefusal] = useState<string[] | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    api<Loaded>("/api/hq/pricebook")
      .then((j) => {
        if (!alive) return;
        setData(j);
        setDraft(structuredClone(j.book));
      })
      .catch((e) => alive && setLoadError(e instanceof Error ? e.message : "The rate card could not be loaded"));
    return () => {
      alive = false;
    };
  }, []);

  const changed = useMemo(() => !!data && !!draft && JSON.stringify(data.book) !== JSON.stringify(draft), [data, draft]);
  useLeaveGuard(changed && editable);

  const header = (
    <PageHeader
      eyebrow="Money"
      icon="BadgeIndianRupee"
      title="Rate Card"
      description="Every service, option and price the studio quotes — the same configurator as the website's pricing page. New quotes use these prices at once; quotes already made keep theirs."
    />
  );
  if (loadError) return (<>{header}<EmptyState icon="BadgeIndianRupee" title="The rate card could not be loaded" description={loadError} /></>);
  if (!data || !draft) return (<>{header}<Loading label="Loading the rate card…" /></>);

  const rates = draft.rates;
  const setRates = (change: (r: RateCard) => RateCard) => {
    setDraft((d) => (d ? { ...d, rates: change(d.rates) } : d));
    setRefusal(null);
  };
  const setService = (id: string, change: (s: Service) => Service) => setRates((r) => ({ ...r, services: r.services.map((s) => (s.id === id ? change(s) : s)) }));

  async function save() {
    if (!draft || saving) return;
    setSaving(true);
    setRefusal(null);
    try {
      const j = await api<Loaded>("/api/hq/pricebook", { method: "PUT", body: JSON.stringify({ book: draft }) });
      setData(j);
      setDraft(structuredClone(j.book));
      setSavedAt(new Date().toISOString());
      router.refresh();
    } catch (e) {
      setRefusal((e instanceof Error ? e.message : "The changes could not be saved").split("; "));
    } finally {
      setSaving(false);
    }
  }

  const service = rates.services.find((s) => s.id === serviceId) ?? rates.services[0];

  return (
    <>
      {header}
      <div className="space-y-3">
        <p className="text-xs text-blueprint">
          {data.exists ? (
            <>
              Last saved {data.book.updatedAt ? formatDateTime(data.book.updatedAt) : ""}
              {data.book.updatedBy ? ` by ${data.book.updatedBy}` : ""}.
            </>
          ) : (
            "Not saved yet: these are the prices on the studio's website pricing page. Save once to keep your own copy."
          )}
          {savedAt && <span className="ml-2 font-semibold text-ok">Saved.</span>}
        </p>
        {!editable && (
          <p className="rounded-[var(--radius-sm)] border border-graphite/15 bg-graphite/[0.035] px-4 py-2.5 text-sm text-charcoal">
            {can(user, LEADERSHIP) ? "HQ is in read-only mode, so the rate card can be read but not changed." : "You can read every price here. Only a founder or an admin can change them."}
          </p>
        )}
      </div>

      <div className="mt-6">
        <Tabs value={tab} onChange={setTab} tabs={(Object.keys(TAB_NAMES) as TabId[]).map((id) => ({ value: id, label: TAB_NAMES[id] }))} />
        <div className="pt-6">
          {tab === "services" && (
            <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
              <nav className="flex gap-2 overflow-x-auto lg:flex-col" aria-label="Services">
                {rates.services.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setServiceId(s.id)}
                    className={cn(
                      "flex shrink-0 items-center gap-2.5 rounded-[var(--radius-sm)] border px-3 py-2.5 text-left text-sm transition-colors",
                      s.id === service.id ? "border-graphite bg-graphite text-paper" : "border-graphite/15 bg-paper-50 hover:border-graphite/40",
                    )}
                  >
                    <HqIcon name={s.icon} className={cn("size-4", s.id === service.id ? "text-lime" : "text-blueprint")} />
                    <span className="font-medium">{s.name}</span>
                    {s.billing === "month" && <span className="annot ml-auto text-[9px] opacity-60">/mo</span>}
                  </button>
                ))}
              </nav>
              <ServiceEditor service={service} editable={editable} onChange={(change) => setService(service.id, change)} />
            </div>
          )}

          {tab === "discounts" && (
            <div className="grid gap-6 lg:grid-cols-2">
              <Panel title="Studio bundle" subtitle="Discount when a quote has several different services (as on the website: 2 = 5%, 3 = 10%, 4 = 15%, 5+ = 20%).">
                <div className="space-y-2">
                  {rates.bundleSteps.map((s, i) => (
                    <div key={i} className="grid grid-cols-[1fr_1fr_auto] items-center gap-2">
                      <Money label="Number of services" suffix="count" value={s.services} disabled={!editable} onChange={(v) => setRates((r) => ({ ...r, bundleSteps: r.bundleSteps.map((x, j) => (j === i ? { ...x, services: v } : x)) }))} />
                      <Money label="Discount" suffix="%" value={s.discountPercent} disabled={!editable} onChange={(v) => setRates((r) => ({ ...r, bundleSteps: r.bundleSteps.map((x, j) => (j === i ? { ...x, discountPercent: v } : x)) }))} />
                      {editable && (
                        <button onClick={() => setRates((r) => ({ ...r, bundleSteps: r.bundleSteps.filter((_, j) => j !== i) }))} className="rounded p-2 text-blueprint hover:bg-bad/10 hover:text-bad" aria-label="Remove step">
                          <Trash2 className="size-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <p className="text-[11px] text-blueprint">Left: services on the quote (or more). Right: discount.</p>
                  {editable && (
                    <Button size="sm" variant="ghost" onClick={() => setRates((r) => ({ ...r, bundleSteps: [...r.bundleSteps, { services: (r.bundleSteps.at(-1)?.services ?? 1) + 1, discountPercent: 0 }] }))}>
                      <Plus className="size-4" /> Add a step
                    </Button>
                  )}
                </div>
              </Panel>
              <Panel title="Social media contracts" subtitle="Longer commitments get a discount on the monthly fee.">
                <div className="space-y-2">
                  {rates.socialContracts.map((c, i) => (
                    <div key={i} className="grid grid-cols-[1.4fr_0.8fr_0.9fr_auto] items-center gap-2">
                      <Text label="Label" value={c.label} disabled={!editable} onChange={(v) => setRates((r) => ({ ...r, socialContracts: r.socialContracts.map((x, j) => (j === i ? { ...x, label: v } : x)) }))} />
                      <Money label="Months" suffix="count" value={c.months} disabled={!editable} onChange={(v) => setRates((r) => ({ ...r, socialContracts: r.socialContracts.map((x, j) => (j === i ? { ...x, months: v } : x)) }))} />
                      <Money label="Discount" suffix="%" value={c.discountPercent} disabled={!editable} onChange={(v) => setRates((r) => ({ ...r, socialContracts: r.socialContracts.map((x, j) => (j === i ? { ...x, discountPercent: v } : x)) }))} />
                      {editable && (
                        <button onClick={() => setRates((r) => ({ ...r, socialContracts: r.socialContracts.filter((_, j) => j !== i) }))} className="rounded p-2 text-blueprint hover:bg-bad/10 hover:text-bad" aria-label="Remove contract">
                          <Trash2 className="size-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <p className="text-[11px] text-blueprint">Label · months · discount.</p>
                  {editable && (
                    <Button size="sm" variant="ghost" onClick={() => setRates((r) => ({ ...r, socialContracts: [...r.socialContracts, { months: 24, label: "24 months", discountPercent: 0 }] }))}>
                      <Plus className="size-4" /> Add a contract length
                    </Button>
                  )}
                </div>
              </Panel>
            </div>
          )}

          {tab === "vritta" && <VrittaRates rates={rates} editable={editable} setRates={setRates} />}

          {tab === "coaching" && (
            <Panel title="1:1 AI Coaching — 90 days" subtitle="The website asks learners for a custom quote, so no fee is published. Set the programme fees the studio quotes here; 0 means not set.">
              <div className="grid gap-4 sm:grid-cols-3">
                <label className="block text-sm">
                  <span className="annot mb-1.5 block text-blueprint">Online programme fee</span>
                  <Money label="Online fee" value={rates.coaching.online} disabled={!editable} onChange={(v) => setRates((r) => ({ ...r, coaching: { ...r.coaching, online: v } }))} />
                </label>
                <label className="block text-sm">
                  <span className="annot mb-1.5 block text-blueprint">Offline programme fee</span>
                  <Money label="Offline fee" value={rates.coaching.offline} disabled={!editable} onChange={(v) => setRates((r) => ({ ...r, coaching: { ...r.coaching, offline: v } }))} />
                </label>
                <label className="block text-sm">
                  <span className="annot mb-1.5 block text-blueprint">Live sessions included</span>
                  <Money label="Sessions" suffix="count" value={rates.coaching.sessions} disabled={!editable} onChange={(v) => setRates((r) => ({ ...r, coaching: { ...r.coaching, sessions: v } }))} />
                </label>
              </div>
            </Panel>
          )}

          {tab === "terms" && (
            <div className="grid gap-6 lg:grid-cols-2">
              <Panel title="Tax and validity">
                <div className="grid gap-4 sm:grid-cols-3">
                  <label className="block">
                    <span className="annot mb-1.5 block text-blueprint">GST</span>
                    <Money label="GST percent" suffix="%" value={rates.gstPercent} disabled={!editable} onChange={(v) => setRates((r) => ({ ...r, gstPercent: v }))} />
                  </label>
                  <label className="block">
                    <span className="annot mb-1.5 block text-blueprint">Quote valid (days)</span>
                    <Money label="Validity days" suffix="count" value={rates.terms.validityDays} disabled={!editable} onChange={(v) => setRates((r) => ({ ...r, terms: { ...r.terms, validityDays: v } }))} />
                  </label>
                  <label className="block">
                    <span className="annot mb-1.5 block text-blueprint">Revision rounds</span>
                    <Money label="Revision rounds" suffix="count" value={rates.terms.revisionRounds} disabled={!editable} onChange={(v) => setRates((r) => ({ ...r, terms: { ...r.terms, revisionRounds: v } }))} />
                  </label>
                </div>
              </Panel>
              <Panel title="Payment milestones" subtitle="The default split on a new quote — the website says 50% to start, 50% on delivery. Must add up to 100%.">
                <div className="space-y-2">
                  {rates.terms.milestones.map((m, i) => (
                    <div key={i} className="grid grid-cols-[1fr_110px_auto] items-center gap-2">
                      <Text label="Milestone" value={m.label} disabled={!editable} onChange={(v) => setRates((r) => ({ ...r, terms: { ...r.terms, milestones: r.terms.milestones.map((x, j) => (j === i ? { ...x, label: v } : x)) } }))} />
                      <Money label="Percent" suffix="%" value={m.percent} disabled={!editable} onChange={(v) => setRates((r) => ({ ...r, terms: { ...r.terms, milestones: r.terms.milestones.map((x, j) => (j === i ? { ...x, percent: v } : x)) } }))} />
                      {editable && (
                        <button onClick={() => setRates((r) => ({ ...r, terms: { ...r.terms, milestones: r.terms.milestones.filter((_, j) => j !== i) } }))} className="rounded p-2 text-blueprint hover:bg-bad/10 hover:text-bad" aria-label="Remove milestone">
                          <Trash2 className="size-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <p className={cn("text-xs font-semibold", Math.abs(rates.terms.milestones.reduce((s, m) => s + m.percent, 0) - 100) < 0.01 ? "text-ok" : "text-bad")}>
                    Total {rates.terms.milestones.reduce((s, m) => s + m.percent, 0)}%
                  </p>
                  {editable && (
                    <Button size="sm" variant="ghost" onClick={() => setRates((r) => ({ ...r, terms: { ...r.terms, milestones: [...r.terms.milestones, { label: "Milestone", percent: 0 }] } }))}>
                      <Plus className="size-4" /> Add a milestone
                    </Button>
                  )}
                </div>
              </Panel>
            </div>
          )}
        </div>
      </div>

      {editable && changed && (
        <div className="sticky bottom-3 z-30 mt-8 space-y-2">
          {refusal && (
            <div role="alert" className="rounded-[var(--radius-md)] border border-bad/40 bg-paper px-4 py-3 shadow-[var(--shadow-lift)]">
              <p className="flex items-center gap-2 text-sm font-semibold text-bad">
                <TriangleAlert className="size-4 shrink-0" aria-hidden /> Not saved. HQ could not accept these changes:
              </p>
              <ul className="mt-2 space-y-1 pl-6 text-sm text-graphite">
                {refusal.map((t) => (
                  <li key={t} className="list-disc">
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="flex flex-wrap items-center gap-3 rounded-[var(--radius-md)] border border-graphite bg-graphite px-4 py-3 text-paper shadow-[var(--shadow-lift)]">
            <p className="min-w-0 flex-1 text-sm">
              <span className="font-semibold">Changes not saved</span>
              <span className="text-paper/60"> · new quotes will use them once saved</span>
            </p>
            <Button
              variant="outline-light"
              size="sm"
              disabled={saving}
              onClick={() => {
                if (window.confirm("Discard every change since the last save?")) setDraft(structuredClone(data.book));
              }}
            >
              <Undo2 className="size-4" /> Discard
            </Button>
            <Button variant="lime" size="sm" onClick={save} disabled={saving}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Save
            </Button>
          </div>
        </div>
      )}
    </>
  );
}

function ServiceEditor({ service, editable, onChange }: { service: Service; editable: boolean; onChange: (change: (s: Service) => Service) => void }) {
  const setGroup = (gid: string, change: (g: ServiceGroup) => ServiceGroup) => onChange((s) => ({ ...s, groups: s.groups.map((g) => (g.id === gid ? change(g) : g)) }));
  const setOption = (gid: string, oid: string, patch: Partial<ServiceOption>) => setGroup(gid, (g) => ({ ...g, options: g.options.map((o) => (o.id === oid ? { ...o, ...patch } : o)) }));
  return (
    <div className="min-w-0 space-y-5">
      <Panel>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="annot mb-1.5 block text-blueprint">Name</span>
            <Text label="Service name" value={service.name} disabled={!editable} onChange={(v) => onChange((s) => ({ ...s, name: v }))} />
          </label>
          <label className="block">
            <span className="annot mb-1.5 block text-blueprint">Short line</span>
            <Text label="Short line" value={service.short} disabled={!editable} onChange={(v) => onChange((s) => ({ ...s, short: v }))} />
          </label>
          <label className="block sm:col-span-2">
            <span className="annot mb-1.5 block text-blueprint">Description (printed on quotes)</span>
            <textarea aria-label="Description" value={service.description} disabled={!editable} onChange={(e) => onChange((s) => ({ ...s, description: e.target.value }))} rows={2} className={cn(box, "h-auto py-2")} />
          </label>
          <label className="block sm:col-span-2">
            <span className="annot mb-1.5 block text-blueprint">Always included — one per line</span>
            <textarea
              aria-label="Always included"
              value={service.included.join("\n")}
              disabled={!editable}
              onChange={(e) => onChange((s) => ({ ...s, included: e.target.value.split("\n") }))}
              rows={Math.max(3, service.included.length)}
              className={cn(box, "h-auto py-2")}
            />
          </label>
        </div>
        <p className="mt-3 text-xs text-blueprint">{service.billing === "month" ? "Billed monthly — the contract-length discounts are under Bundles & retainers." : "Billed per project."}</p>
      </Panel>

      {service.groups.map((g, gi) => (
        <Panel
          key={g.id}
          title={
            <span className="flex flex-wrap items-center gap-2">
              {editable ? <Text label="Group title" value={g.title} onChange={(v) => setGroup(g.id, (x) => ({ ...x, title: v }))} className="w-64 font-semibold" /> : g.title}
              <select
                aria-label="Choose one or any"
                disabled={!editable}
                value={g.mode}
                onChange={(e) => setGroup(g.id, (x) => ({ ...x, mode: e.target.value === "any" ? "any" : "one" }))}
                className="h-8 rounded-[var(--radius-sm)] border border-graphite/20 bg-paper-50 px-2 text-xs font-semibold uppercase tracking-wider text-charcoal"
              >
                <option value="one">Choose one</option>
                <option value="any">Choose any</option>
              </select>
              {service.groups.some((x) => x.id === "package") && g.id !== "package" && (
                <label className="flex items-center gap-1.5 text-xs text-charcoal" title="Hidden and not charged when a ready package is chosen">
                  <input type="checkbox" disabled={!editable} checked={!!g.core} onChange={(e) => setGroup(g.id, (x) => ({ ...x, core: e.target.checked || undefined }))} />
                  Covered by packages
                </label>
              )}
            </span>
          }
          action={
            editable && (
              <span className="flex items-center gap-1">
                <button onClick={() => onChange((s) => ({ ...s, groups: move(s.groups, gi, -1) }))} className="rounded p-1.5 text-blueprint hover:bg-graphite/5" aria-label="Move group up">
                  <ArrowUp className="size-4" />
                </button>
                <button onClick={() => onChange((s) => ({ ...s, groups: move(s.groups, gi, 1) }))} className="rounded p-1.5 text-blueprint hover:bg-graphite/5" aria-label="Move group down">
                  <ArrowDown className="size-4" />
                </button>
                <button
                  onClick={() => window.confirm(`Remove the group "${g.title}" and its options?`) && onChange((s) => ({ ...s, groups: s.groups.filter((x) => x.id !== g.id) }))}
                  className="rounded p-1.5 text-blueprint hover:bg-bad/10 hover:text-bad"
                  aria-label="Remove group"
                >
                  <Trash2 className="size-4" />
                </button>
              </span>
            )
          }
        >
          <div className="hq-scroll overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="annot text-left text-[10px] text-blueprint">
                  <th className="pb-2 pr-2 font-medium">Option</th>
                  <th className="pb-2 pr-2 font-medium">Detail</th>
                  <th className="w-32 pb-2 pr-2 text-right font-medium">Price</th>
                  <th className="w-32 pb-2 pr-2 font-medium">Badge</th>
                  {editable && <th className="w-24" />}
                </tr>
              </thead>
              <tbody>
                {g.options.map((o, oi) => (
                  <tr key={o.id} className="border-t border-graphite/8">
                    <td className="py-1.5 pr-2">{editable ? <Text label="Option" value={o.label} onChange={(v) => setOption(g.id, o.id, { label: v })} /> : <span className="font-medium">{o.label}</span>}</td>
                    <td className="py-1.5 pr-2">{editable ? <Text label="Detail" value={o.detail ?? ""} onChange={(v) => setOption(g.id, o.id, { detail: v })} /> : <span className="text-charcoal">{o.detail}</span>}</td>
                    <td className="py-1.5 pr-2">{editable ? <Money label="Price" value={o.price} onChange={(v) => setOption(g.id, o.id, { price: v })} /> : <span className="tabular block text-right font-mono">{o.price ? formatINR(o.price) : "Included"}</span>}</td>
                    <td className="py-1.5 pr-2">{editable ? <Text label="Badge" placeholder="—" value={o.badge ?? ""} onChange={(v) => setOption(g.id, o.id, { badge: v })} /> : o.badge}</td>
                    {editable && (
                      <td className="whitespace-nowrap py-1.5 text-right">
                        <button onClick={() => setGroup(g.id, (x) => ({ ...x, options: move(x.options, oi, -1) }))} className="rounded p-1 text-blueprint hover:bg-graphite/5" aria-label="Move up">
                          <ArrowUp className="size-3.5" />
                        </button>
                        <button onClick={() => setGroup(g.id, (x) => ({ ...x, options: move(x.options, oi, 1) }))} className="rounded p-1 text-blueprint hover:bg-graphite/5" aria-label="Move down">
                          <ArrowDown className="size-3.5" />
                        </button>
                        <button onClick={() => setGroup(g.id, (x) => ({ ...x, options: x.options.filter((y) => y.id !== o.id) }))} className="rounded p-1 text-blueprint hover:bg-bad/10 hover:text-bad" aria-label="Remove option">
                          <Trash2 className="size-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {g.note && <p className="mt-3 text-xs text-blueprint">ℹ {g.note}</p>}
          {editable && (
            <Button size="sm" variant="ghost" className="mt-2" onClick={() => setGroup(g.id, (x) => ({ ...x, options: [...x.options, { id: uid("opt"), label: "New option", price: 0 }] }))}>
              <Plus className="size-4" /> Add an option
            </Button>
          )}
        </Panel>
      ))}
      {editable && (
        <Button size="sm" variant="secondary" onClick={() => onChange((s) => ({ ...s, groups: [...s.groups, { id: uid("grp"), title: "New group", mode: "any", options: [{ id: uid("opt"), label: "New option", price: 0 }] }] }))}>
          <Plus className="size-4" /> Add a group of options
        </Button>
      )}
    </div>
  );
}

function VrittaRates({ rates, editable, setRates }: { rates: RateCard; editable: boolean; setRates: (change: (r: RateCard) => RateCard) => void }) {
  const segs: VrittaSegment[] = ["college", "school"];
  const eds: VrittaEdition[] = ["essential", "professional", "institutional"];
  const cols = ["monthly", "annual", "perpetual", "amc"] as const;
  return (
    <div className="space-y-6">
      {segs.map((seg) => (
        <Panel key={seg} title={seg === "college" ? "Colleges" : "Schools"} subtitle="Annual = two months free against monthly; perpetual = four times the annual licence (needs self-hosting).">
          <div className="hq-scroll overflow-x-auto">
            <table className="w-full min-w-[620px] text-sm">
              <thead>
                <tr className="annot text-left text-[10px] text-blueprint">
                  <th className="pb-2 font-medium">Edition</th>
                  <th className="pb-2 text-right font-medium">Monthly</th>
                  <th className="pb-2 text-right font-medium">Annual</th>
                  <th className="pb-2 text-right font-medium">Perpetual</th>
                  <th className="pb-2 text-right font-medium">AMC from year 2</th>
                </tr>
              </thead>
              <tbody>
                {eds.map((ed) => {
                  const r = rates.vritta.rates[seg][ed];
                  const name = VRITTA.editions.find((e) => e.id === ed)?.name ?? ed;
                  return (
                    <tr key={ed} className="border-t border-graphite/8">
                      <td className="py-2 pr-3 font-medium">{name}</td>
                      {r ? (
                        cols.map((c) => (
                          <td key={c} className="py-1.5 pl-2">
                            <Money
                              label={`${name} ${c}`}
                              value={r[c]}
                              disabled={!editable}
                              onChange={(v) =>
                                setRates((x) => ({ ...x, vritta: { ...x.vritta, rates: { ...x.vritta.rates, [seg]: { ...x.vritta.rates[seg], [ed]: { ...x.vritta.rates[seg][ed]!, [c]: v } } } } }))
                              }
                            />
                          </td>
                        ))
                      ) : (
                        <td colSpan={4} className="py-2 pl-2 text-xs text-blueprint">
                          Not offered for {seg === "school" ? "schools" : "colleges"}
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
          <div className="space-y-2">
            {rates.vritta.oneTime.map((o, i) => (
              <div key={o.id} className="grid grid-cols-[1fr_140px] gap-2">
                <div>
                  <Text label="Charge" value={o.label} disabled={!editable} onChange={(v) => setRates((x) => ({ ...x, vritta: { ...x.vritta, oneTime: x.vritta.oneTime.map((y, j) => (j === i ? { ...y, label: v } : y)) } }))} />
                  <p className="mt-1 text-[11px] text-blueprint">{o.detail}</p>
                </div>
                <Money label="Price" value={o.price} disabled={!editable} onChange={(v) => setRates((x) => ({ ...x, vritta: { ...x.vritta, oneTime: x.vritta.oneTime.map((y, j) => (j === i ? { ...y, price: v } : y)) } }))} />
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Group and maintenance">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="annot mb-1.5 block text-blueprint">Further institution, same trust</span>
              <Money label="Group licence percent" suffix="%" value={rates.vritta.groupLicencePercent} disabled={!editable} onChange={(v) => setRates((x) => ({ ...x, vritta: { ...x.vritta, groupLicencePercent: v } }))} />
              <span className="mt-1 block text-[11px] text-blueprint">of the licence fee</span>
            </label>
            <label className="block">
              <span className="annot mb-1.5 block text-blueprint">Maintenance on perpetual</span>
              <Money label="AMC percent" suffix="%" value={rates.vritta.amcPercent} disabled={!editable} onChange={(v) => setRates((x) => ({ ...x, vritta: { ...x.vritta, amcPercent: v } }))} />
              <span className="mt-1 block text-[11px] text-blueprint">of the perpetual fee, per year from year 2</span>
            </label>
          </div>
        </Panel>
      </div>
    </div>
  );
}
