"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeftRight, Printer } from "lucide-react";
import { getCollection, lineItemsTotal, type BaseRecord } from "@/lib/hq/collections";
import { can } from "@/lib/hq/roles";
import { Badge, statusTone } from "@/components/ui/Badge";
import { Select } from "@/components/ui/form";
import { Tabs } from "@/components/ui/Tabs";
import { CollectionManager } from "@/components/hq/CollectionManager";
import { nextNumber, useCollection, useHq, useShowMoney } from "@/components/hq/data";
import { PageHeader, StatCard } from "@/components/hq/ui";
import { useToday } from "@/components/hq/sales/useToday";
import { daysBetween, num, shortDate, str } from "@/components/hq/projects/logic";
import { formatINR, formatINRCompact } from "@/lib/utils";

/* ─────────────────────────── gear ─────────────────────────── */

export function GearApp() {
  const { user, store } = useHq();
  const today = useToday();
  const showMoney = useShowMoney();
  const { records, save } = useCollection("gear");
  const canWrite = can(user, getCollection("gear")!.write) && store.writable;
  const [category, setCategory] = useState("");
  const cats = useMemo(() => [...new Set(records.map((r) => str(r.category)).filter(Boolean))].sort(), [records]);
  const active = records.filter((r) => r.status !== "retired");
  const stats = {
    items: active.reduce((s, r) => s + (num(r.qty) || 1), 0),
    out: active.filter((r) => r.status === "out" || r.status === "with-member").length,
    repair: active.filter((r) => r.status === "repair" || r.condition === "Needs service").length,
    value: active.reduce((s, r) => s + num(r.purchaseCost) * (num(r.qty) || 1), 0),
    warranty: today ? active.filter((r) => str(r.warrantyUntil) && str(r.warrantyUntil) >= today && daysBetween(today, str(r.warrantyUntil)) <= 60).length : 0,
  };

  return (
    <div>
      <PageHeader eyebrow="Studio" icon="Aperture" title="Gear & Assets" description="Cameras, lenses, lights, audio, drones, computers and accessories — what the studio owns, who has it and its condition. Pick from here for a shoot's gear list." />
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard tone="dark" label="Items" value={stats.items} sub={`${cats.length} categories`} />
        <StatCard label="Out right now" value={stats.out} sub="On a shoot or with a team member" />
        <StatCard label="Needs attention" value={stats.repair} sub={stats.warranty ? `${stats.warranty} warranty ending within 60 days` : "In repair or needs service"} />
        {showMoney ? <StatCard label="Gear value" value={formatINRCompact(stats.value)} sub="At purchase cost" /> : <StatCard label="Available" value={active.filter((r) => (str(r.status) || "available") === "available").length} sub="Ready to take out" />}
      </div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Category" className="w-auto">
          <option value="">All categories</option>
          {cats.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </Select>
      </div>
      <CollectionManager
        name="gear"
        filter={(r) => !category || r.category === category}
        columns={["name", "category", "assetTag", "status", "holder", "condition"]}
        defaults={{ status: "available", condition: "Good", qty: 1 }}
        newLabel="Add gear"
        emptyText="List every camera body, lens, light, mic, drone and laptop — with an asset tag — so shoots can be packed from here."
        rowActions={(r) =>
          canWrite && r.status !== "retired" ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                const out = r.status === "out" || r.status === "with-member";
                void save({ ...r, status: out ? "available" : "out", holder: out ? "Studio" : user.name });
              }}
              className="inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-[var(--radius-sm)] border border-graphite/20 px-2.5 text-xs font-semibold hover:border-graphite hover:bg-lime"
              title={r.status === "out" || r.status === "with-member" ? "Check it back in" : "Check it out to yourself"}
            >
              <ArrowLeftRight className="size-3.5" /> {r.status === "out" || r.status === "with-member" ? "Check in" : "Check out"}
            </button>
          ) : null
        }
      />
    </div>
  );
}

/* ─────────────────────────── tools, vendors, purchases ─────────────────────────── */

type ToolsTab = "subscriptions" | "vendors" | "purchases";

/** Monthly cost of a subscription in rupees (USD/EUR at a rough rate the founders can change here). */
const FX: Record<string, number> = { INR: 1, USD: 84, EUR: 91 };
export function monthlyCost(r: BaseRecord) {
  const c = num(r.cost) * (FX[str(r.currency) || "INR"] ?? 1);
  return str(r.cycle) === "yearly" ? c / 12 : str(r.cycle) === "monthly" || !r.cycle ? c : 0;
}

export function ToolsApp({ initialTab }: { initialTab?: string }) {
  const today = useToday();
  const { user } = useHq();
  const showMoney = useShowMoney();
  const [tab, setTab] = useState<ToolsTab>(["subscriptions", "vendors", "purchases"].includes(initialTab ?? "") ? (initialTab as ToolsTab) : "subscriptions");
  const { records: subs } = useCollection("subscriptions");
  const canPurchases = can(user, getCollection("purchases")!.read);
  const live = subs.filter((s) => ["active", "trial"].includes(str(s.status) || "active"));
  const burn = live.reduce((s, r) => s + monthlyCost(r), 0);
  const renewing = today ? live.filter((s) => str(s.renewalDate) && str(s.renewalDate) >= today && daysBetween(today, str(s.renewalDate)) <= 14) : [];
  const trials = live.filter((s) => s.status === "trial");

  return (
    <div>
      <PageHeader eyebrow="Studio" icon="CreditCard" title="Tools & Vendors" description="Every paid tool and when it renews, the freelancers and suppliers you work with, and purchase orders. Never store passwords here — use a password manager." />
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard tone="dark" label="Tools in use" value={live.length} sub={`${trials.length} on a trial`} />
        {showMoney ? <StatCard label="Monthly software bill" value={formatINR(Math.round(burn))} sub="Yearly plans spread over 12 months; USD at ₹84" /> : <StatCard label="Categories" value={new Set(live.map((s) => str(s.category))).size} sub="Design, dev, AI, storage…" />}
        <StatCard label="Renewing in 14 days" value={renewing.length} sub={renewing[0] ? `${str(renewing[0].tool)} on ${shortDate(renewing[0].renewalDate)}` : "Nothing soon"} />
        <StatCard label="Billable to clients" value={live.filter((s) => s.projectId).length} sub="Tools paid for a client project" />
      </div>
      <Tabs className="mb-5" value={tab} onChange={setTab} tabs={[{ value: "subscriptions", label: "Subscriptions" }, ...(canPurchases ? [{ value: "vendors" as ToolsTab, label: "Vendors" }, { value: "purchases" as ToolsTab, label: "Purchase orders" }] : [])]} />
      {tab === "subscriptions" && (
        <CollectionManager
          name="subscriptions"
          columns={["tool", "category", "plan", "status", "renewalDate", "owner"]}
          extraColumns={showMoney ? [{ key: "monthly", label: "Per month", className: "text-right", sortValue: monthlyCost, render: (r) => <span className="tabular block text-right text-xs font-semibold">{monthlyCost(r) ? formatINR(Math.round(monthlyCost(r))) : "—"}</span> }] : []}
          defaults={{ status: "active", cycle: "monthly", currency: "INR" }}
          newLabel="Add a tool"
          emptyText="Add Figma, hosting, domains, AI APIs, Adobe, storage… with the renewal date, so nothing renews by surprise."
        />
      )}
      {tab === "vendors" && <CollectionManager name="vendors" columns={["name", "category", "contactName", "phone", "city", "rating"]} newLabel="Add vendor" emptyText="Freelancers, rental houses, printers, hosting and service providers." />}
      {tab === "purchases" && (
        <CollectionManager
          name="purchases"
          columns={["poNumber", "date", "vendorId", "projectId", "status", "paid"]}
          extraColumns={[{ key: "total", label: "Total", className: "text-right", sortValue: (r) => lineItemsTotal(r.items) + num(r.shipping), render: (r) => <span className="tabular block text-right text-xs font-semibold">{formatINR(lineItemsTotal(r.items) + num(r.shipping))}</span> }]}
          defaults={{ status: "draft" }}
          beforeSave={async (r) => ({ ...r, poNumber: str(r.poNumber) || (await nextNumber("po")), total: lineItemsTotal(r.items) + num(r.shipping) })}
          newLabel="New purchase order"
          emptyText="Gear purchases, rentals, printing and freelance work orders."
          rowActions={(r) => (
            <Link href={`/hq/print/po/${r.id}`} onClick={(e) => e.stopPropagation()} className="grid size-8 place-items-center rounded-[var(--radius-sm)] border border-graphite/15 text-charcoal hover:border-graphite hover:bg-graphite hover:text-paper" title="Print / PDF">
              <Printer className="size-3.5" />
            </Link>
          )}
        />
      )}
      <p className="mt-6 text-xs text-blueprint">
        Status colours: <Badge tone={statusTone("active")}>active</Badge> <Badge tone={statusTone("trial")}>trial</Badge> <Badge tone={statusTone("cancelled")}>cancelled</Badge>
      </p>
    </div>
  );
}
