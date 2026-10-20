"use client";

import { useCallback, useEffect, useState } from "react";
import { Badge, type Tone } from "@/components/ui/Badge";
import { api } from "@/components/hq/data";
import { COMPLIANCE_LABELS, PAYOUT_LABELS, type ComplianceStatus, type PayoutStatus } from "@/lib/incentives/calc.ts";
import { formatINR } from "@/lib/utils";

/* What /api/hq/incentives returns (the server works every figure out; the screens only show and send actions). */

export interface AuditEvent {
  at: string;
  by: string;
  action: string;
  from?: string;
  to?: string;
  reason?: string;
}

export type Rec = Record<string, unknown> & { id: string };

export interface Quarter {
  key: string;
  range: { start: string; end: string; label: string };
  eligible: number;
  tier: { amount: number; from: number; next: { from: number; amount: number } | null };
  nextGap: number;
  members: { id: string; name: string; share: number }[];
  pool: number;
  counted: number;
  unreconciled: number;
  unreconciledAmount: number;
  refunds: number;
  gst: number;
  directCosts: number;
  margin: number;
  projectFlags: { id: string; title: string; fee: number; cost: number; margin: number }[];
  payrollDue: number;
  vendorMonthly: number;
  approvedUnpaid: number;
  pendingCommission: number;
  reserve: number;
  flags: string[];
}

export interface Policy {
  id?: string;
  name: string;
  version: number;
  status: "draft" | "active" | "retired";
  effectiveFrom: string;
  commissionRate: number;
  tiers: { from: number; amount: number }[];
  countTds: boolean;
  marginTarget: number;
  reserve: number;
  partialRule: "full" | "prorata" | "exclude";
  eligibilityRules: string;
  qualityRules: string;
  exceptions: string;
  compliance: { status: ComplianceStatus; reviewer?: string; firm?: string; reviewedOn?: string; expiresOn?: string; notes?: string; document?: string };
  history?: AuditEvent[];
}

export interface Member {
  id: string;
  name: string;
  role?: string;
  status?: string;
  compensationBasis?: string;
  incentiveEligible: boolean;
  incentiveFrom?: string;
  joinDate?: string;
  facts: { deliverables: number; delivered: number; reworked: number; tasks: number; tasksDone: number; leadsRegistered: number; leadsAccepted: number };
}

export interface Dashboard {
  today: string;
  month: string;
  quarter: Quarter;
  commissionsThisMonth: { count: number; amount: number };
  awaiting: { count: number; amount: number };
  approvedUnpaid: { count: number; amount: number };
  overdueInvoices: number;
  reviewDue: string[];
  reviewMonth: string;
  compliance: { status: ComplianceStatus; policyVersion: number; policyStatus: string; active: boolean };
  incentiveOnly: string[];
  payoutReadiness: string;
}

export interface Data {
  dashboard: Dashboard;
  quarter: Quarter;
  policy: Policy;
  policies: Rec[];
  payouts: Rec[];
  reviews: Rec[];
  leads: Rec[];
  team: Member[];
}

export function useIncentives(quarter: string) {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const fetchData = useCallback(
    () =>
      api<Data>(`/api/hq/incentives${quarter ? `?quarter=${encodeURIComponent(quarter)}` : ""}`)
        .then((d) => {
          setData(d);
          setError("");
        })
        .catch((e) => setError(e instanceof Error ? e.message : "Could not load incentives"))
        .finally(() => setLoading(false)),
    [quarter],
  );
  useEffect(() => {
    void fetchData();
  }, [fetchData]);
  const reload = useCallback(async () => {
    setLoading(true);
    await fetchData();
  }, [fetchData]);
  return { data, error, loading, reload };
}

/** Send one action; the server checks it and keeps it in the audit trail. */
export async function act(action: string, payload: Record<string, unknown>) {
  return api<{ ok?: boolean; done?: string[]; error?: string }>("/api/hq/incentives", { method: "POST", body: JSON.stringify({ action, ...payload }) });
}

export const str = (v: unknown) => (v === undefined || v === null ? "" : String(v));
export const num = (v: unknown) => Number(v) || 0;
export const inr = (v: unknown) => formatINR(num(v));
export const when = (iso: unknown) => (str(iso) ? new Date(str(iso)).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—");

const PAYOUT_TONES: Record<PayoutStatus, Tone> = { draft: "outline", calculated: "info", pending: "warn", approved: "dark", "on-hold": "warn", initiated: "info", paid: "ok", rejected: "bad", reversed: "neutral" };
export function PayoutBadge({ status }: { status: unknown }) {
  const s = (str(status) || "draft") as PayoutStatus;
  return <Badge tone={PAYOUT_TONES[s] ?? "neutral"}>{PAYOUT_LABELS[s] ?? s}</Badge>;
}

const COMPLIANCE_TONES: Record<ComplianceStatus, Tone> = { "review-required": "warn", "under-review": "info", approved: "ok", blocked: "bad", expired: "bad" };
export function ComplianceBadge({ status }: { status: ComplianceStatus }) {
  return <Badge tone={COMPLIANCE_TONES[status] ?? "warn"}>{COMPLIANCE_LABELS[status] ?? status}</Badge>;
}

const ATTR: Record<string, [string, Tone]> = { none: ["Not registered", "outline"], pending: ["Pending decision", "warn"], accepted: ["Accepted", "ok"], rejected: ["Rejected", "bad"] };
export function AttributionBadge({ status }: { status: unknown }) {
  const [label, tone] = ATTR[str(status) || "none"] ?? ATTR.none;
  return <Badge tone={tone}>{label}</Badge>;
}

/** The history kept on a record, newest first. */
export function History({ events }: { events: unknown }) {
  const list = (Array.isArray(events) ? (events as AuditEvent[]) : []).slice().reverse();
  if (!list.length) return <p className="text-xs text-blueprint">No changes recorded yet.</p>;
  return (
    <ol className="space-y-1.5 text-xs">
      {list.map((e, i) => (
        <li key={i} className="flex flex-wrap gap-x-2 border-b border-dashed border-graphite/10 pb-1.5 last:border-0">
          <span className="tabular text-blueprint">{when(e.at)}</span>
          <span className="font-semibold text-graphite">{e.by}</span>
          <span className="text-charcoal">
            {e.action}
            {e.from || e.to ? `: ${e.from ? `${e.from} → ` : ""}${e.to ?? ""}` : ""}
          </span>
          {e.reason && <span className="w-full text-charcoal/80">“{e.reason}”</span>}
        </li>
      ))}
    </ol>
  );
}

export function Notice({ tone = "info", children }: { tone?: "info" | "warn" | "bad" | "ok"; children: React.ReactNode }) {
  const cls = { info: "border-info/30 bg-info/10 text-info", warn: "border-warn/30 bg-warn/10 text-warn", bad: "border-bad/30 bg-bad/10 text-bad", ok: "border-ok/30 bg-ok/10 text-ok" }[tone];
  return <div className={`rounded-[var(--radius-sm)] border px-3 py-2 text-sm ${cls}`}>{children}</div>;
}
