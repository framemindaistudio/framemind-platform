"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Overlay";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/form";
import { EmptyState, KV, Loading, PageHeader, Panel, StatCard } from "@/components/hq/ui";
import { useHq } from "@/components/hq/data";
import { PAYOUT_LABELS, type PayoutStatus } from "@/lib/incentives/calc.ts";
import { act, AttributionBadge, History, inr, Notice, num, PayoutBadge, str, useIncentives, when, type Data, type Policy, type Rec } from "./shared";

export type IncentivesTab = "home" | "leads" | "payouts" | "reviews" | "policy" | "audit";

const MORE: { value: Exclude<IncentivesTab, "home">; label: string }[] = [
  { value: "payouts", label: "All statements" },
  { value: "leads", label: "All leads" },
  { value: "reviews", label: "Reviews" },
  { value: "policy", label: "Rules" },
  { value: "audit", label: "History" },
];

/** HQ → Team incentives: one page — what needs you, the team's progress, and who has earned what. */
export function IncentivesApp({ initialTab = "home" }: { initialTab?: IncentivesTab }) {
  const [tab, setTab] = useState<IncentivesTab>(initialTab);
  const { data, error, loading, reload } = useIncentives("");
  const [msg, setMsg] = useState<{ tone: "ok" | "bad"; text: string } | null>(null);

  // figures update by themselves: on opening, bring this month's and last month's statements up to date
  useEffect(() => {
    let alive = true;
    act("autoCalculate", {})
      .then((r) => {
        if (alive && r.done?.length) void reload();
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [reload]);

  /** run one action, show its outcome, refresh the figures */
  const run = async (action: string, payload: Record<string, unknown>, okText: string) => {
    try {
      await act(action, payload);
      // an accepted lead or a changed rule can change what people have earned
      if (action === "decideLead" || action === "savePolicy") await act("autoCalculate", {}).catch(() => {});
      setMsg({ tone: "ok", text: okText });
      await reload();
      return true;
    } catch (e) {
      setMsg({ tone: "bad", text: e instanceof Error ? e.message : "That did not work." });
      return false;
    }
  };

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader eyebrow="Money" icon="Trophy" title="Team incentives" description="5% commission for bringing in clients, plus a team bonus each quarter. Figures update by themselves from client payments in Finance." />
      {msg && (
        <div className="mb-4" role="status">
          <Notice tone={msg.tone}>
            {msg.text}
            <button className="ml-3 underline" onClick={() => setMsg(null)}>
              OK
            </button>
          </Notice>
        </div>
      )}
      {error && <Notice tone="bad">{error}</Notice>}
      {!data && loading && <Loading label="Working out the figures…" />}
      {data &&
        (tab === "home" ? (
          <Home data={data} run={run} />
        ) : (
          <div>
            <button className="mb-4 text-sm font-semibold underline underline-offset-4" onClick={() => setTab("home")}>
              ← Back to Team incentives
            </button>
            {tab === "leads" && <LeadsTab data={data} run={run} />}
            {tab === "payouts" && <PayoutsTab data={data} run={run} />}
            {tab === "reviews" && <ReviewsTab data={data} run={run} />}
            {tab === "policy" && <PolicyTab data={data} run={run} />}
            {tab === "audit" && <AuditTab data={data} />}
          </div>
        ))}
      {data && tab === "home" && (
        <p className="mt-8 flex flex-wrap gap-x-5 gap-y-2 border-t border-graphite/10 pt-4 text-sm text-blueprint">
          <span>More:</span>
          {MORE.map((m) => (
            <button key={m.value} className="underline underline-offset-4 hover:text-graphite" onClick={() => setTab(m.value)}>
              {m.label}
            </button>
          ))}
        </p>
      )}
    </div>
  );
}

type Run = (action: string, payload: Record<string, unknown>, okText: string) => Promise<boolean>;

const monthLabel = (m: string) => new Date(Date.parse(`${m}-01`)).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
const periodText = (p: Rec) => (p.kind === "bonus" ? `team bonus ${str(p.period).replace("-", " ")}` : `commission ${/^\d{4}-\d{2}$/.test(str(p.period)) ? monthLabel(str(p.period)) : str(p.period)}`);

/* ───────────────────────────── the one page ───────────────────────────── */

function Home({ data, run }: { data: Data; run: Run }) {
  const { user } = useHq();
  const founder = user.role === "founder";
  const q = data.quarter;
  const next = q.tier.next;
  const progress = next ? Math.min(100, Math.round((q.eligible / next.from) * 100)) : 100;
  const [paying, setPaying] = useState<string | null>(null);
  const [ref, setRef] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const name = (id: unknown) => data.team.find((m) => m.id === str(id))?.name ?? "Someone";

  // registered by a team member, or given an owner in Enquiries and not decided yet
  const leads = data.leads.filter((l) => str(l.attribution) === "pending" || (str(l.ownerId) && ["", "none"].includes(str(l.attribution))));
  const toApprove = data.payouts.filter((p) => ["calculated", "pending"].includes(str(p.status)) && num(p.net) > 0);
  const toPay = data.payouts.filter((p) => ["approved", "initiated"].includes(str(p.status)));
  const nothing = !leads.length && !toApprove.length && !toPay.length;

  const month = data.dashboard.month;
  const people = data.team.filter((m) => str(m.status) !== "inactive" && (m.incentiveEligible || data.payouts.some((p) => p.memberId === m.id)));
  const sumFor = (id: string, f: (p: Rec) => boolean) => data.payouts.filter((p) => p.memberId === id && str(p.status) !== "rejected" && f(p)).reduce((s, p) => s + num(p.net), 0);

  return (
    <div className="space-y-6">
      {/* 1 · team progress */}
      <section className="rounded-[var(--radius)] bg-graphite p-5 text-paper">
        <p className="text-xs uppercase tracking-[0.18em] text-paper/60">Team bonus · {q.range.label}</p>
        <p className="mt-2 text-2xl font-semibold">{inr(q.eligible)} collected</p>
        <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-paper/15">
          <div className="h-full rounded-full bg-lime" style={{ width: `${progress}%` }} />
        </div>
        <p className="mt-2 text-sm text-paper/80">
          {q.tier.amount ? `Reached: ${inr(q.tier.amount)} for each person. ` : ""}
          {next ? `${inr(q.nextGap)} more → ${inr(next.amount)} for each person.` : "Top milestone reached."}
        </p>
      </section>

      {/* 2 · what needs the founder */}
      <section>
        <h2 className="mb-2 text-base font-semibold">Needs you</h2>
        {nothing ? (
          <p className="flex items-center gap-2 rounded-[var(--radius)] border border-graphite/10 bg-white px-4 py-3 text-sm text-charcoal">
            <CheckCircle2 className="size-4 text-ok" /> Nothing to do right now.
          </p>
        ) : (
          <ul className="divide-y divide-graphite/10 rounded-[var(--radius)] border border-graphite/10 bg-white">
            {leads.map((l) => (
              <li key={l.id} className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm">
                <span className="flex-1">
                  <strong>{name(l.ownerId)}</strong> brought in <strong>{str(l.name)}</strong>
                  {str(l.organisation) && <span className="text-blueprint"> · {str(l.organisation)}</span>}
                  {str(l.evidence) && <span className="block text-xs text-blueprint">{str(l.evidence)}</span>}
                </span>
                {founder && (
                  <span className="flex gap-2">
                    <Button size="sm" onClick={() => void run("decideLead", { leadId: l.id, decision: "accepted", reason: "" }, `Accepted — ${name(l.ownerId)} earns commission when ${str(l.name)} pays.`)}>
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        const reason = window.prompt(`Why reject ${str(l.name)}? ${name(l.ownerId)} will see this.`);
                        if (reason?.trim()) void run("decideLead", { leadId: l.id, decision: "rejected", reason }, "Lead rejected.");
                      }}
                    >
                      Reject
                    </Button>
                  </span>
                )}
              </li>
            ))}
            {toApprove.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm">
                <span className="flex-1">
                  Approve <strong>{inr(p.net)}</strong> for <strong>{str(p.memberName)}</strong> <span className="text-blueprint">· {periodText(p)}</span>
                </span>
                <span className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={() => setOpen(p.id)}>
                    Details
                  </Button>
                  {founder && (
                    <Button size="sm" onClick={() => void run("movePayout", { id: p.id, to: "approved" }, `Approved. Now pay ${str(p.memberName)} from the bank.`)}>
                      Approve
                    </Button>
                  )}
                </span>
              </li>
            ))}
            {toPay.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm">
                <span className="flex-1">
                  Pay <strong>{inr(p.net)}</strong> to <strong>{str(p.memberName)}</strong> <span className="text-blueprint">· {periodText(p)}</span>
                </span>
                {paying === p.id ? (
                  <span className="flex w-full gap-2 sm:w-auto">
                    <Input autoFocus className="sm:w-56" placeholder="Bank UTR / reference" value={ref} onChange={(e) => setRef(e.target.value)} />
                    <Button
                      size="sm"
                      disabled={!ref.trim()}
                      onClick={async () => {
                        if (await run("movePayout", { id: p.id, to: "paid", paymentReference: ref }, `Marked as paid. ${str(p.memberName)} can see the letter in My Incentives.`)) {
                          setPaying(null);
                          setRef("");
                        }
                      }}
                    >
                      Save
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setPaying(null)}>
                      Cancel
                    </Button>
                  </span>
                ) : (
                  <span className="flex gap-2">
                    <Link className="self-center text-xs underline" href={`/hq/print/incentive-letter/${p.id}`} target="_blank">
                      Letter
                    </Link>
                    <Button
                      size="sm"
                      onClick={() => {
                        setPaying(p.id);
                        setRef("");
                      }}
                    >
                      Mark as paid
                    </Button>
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 3 · the team */}
      <section>
        <h2 className="mb-2 text-base font-semibold">Your team</h2>
        {!people.length ? (
          <p className="rounded-[var(--radius)] border border-graphite/10 bg-white px-4 py-3 text-sm text-charcoal">
            Nobody yet. Add people in{" "}
            <Link className="underline" href="/hq/team">
              Team &amp; Payroll
            </Link>{" "}
            and tick “Takes part in team incentives”.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-[var(--radius)] border border-graphite/10 bg-white">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-blueprint">
                <tr>
                  <th className="px-4 py-2 font-medium">Name</th>
                  <th className="px-4 py-2 text-right font-medium">Commission · {monthLabel(month).split(" ")[0]}</th>
                  <th className="px-4 py-2 text-right font-medium">Waiting to be paid</th>
                  <th className="px-4 py-2 text-right font-medium">Paid so far</th>
                </tr>
              </thead>
              <tbody>
                {people.map((m) => (
                  <tr key={m.id} className="border-t border-graphite/10">
                    <td className="px-4 py-2.5">
                      {m.name}
                      {!m.incentiveEligible && <span className="ml-2 text-xs text-blueprint">(not in team bonus)</span>}
                    </td>
                    <td className="tabular px-4 py-2.5 text-right">{inr(sumFor(m.id, (p) => p.kind === "commission" && str(p.period) === month))}</td>
                    <td className="tabular px-4 py-2.5 text-right">{inr(sumFor(m.id, (p) => !["paid", "reversed"].includes(str(p.status))))}</td>
                    <td className="tabular px-4 py-2.5 text-right font-semibold">{inr(sumFor(m.id, (p) => str(p.status) === "paid"))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* how it works, in three lines */}
      <section className="rounded-[var(--radius)] border border-dashed border-graphite/20 px-4 py-3 text-sm text-charcoal">
        <p className="mb-1 font-semibold text-graphite">How it works</p>
        <ol className="list-decimal space-y-0.5 pl-5">
          <li>A team member registers a client in My Incentives — you Accept it here.</li>
          <li>In Finance, link that client&apos;s invoice to the lead and tick “Reconciled” when the money is in the bank.</li>
          <li>Their {data.policy.commissionRate}% appears here to Approve. Pay from the bank, then Mark as paid with the UTR.</li>
        </ol>
      </section>

      {open && data.payouts.find((p) => p.id === open) && <PayoutDrawer p={data.payouts.find((p) => p.id === open)!} data={data} onClose={() => setOpen(null)} run={run} />}
    </div>
  );
}

/* ───────────────────────────── lead attribution ───────────────────────────── */

function LeadsTab({ data, run }: { data: Data; run: Run }) {
  const { user } = useHq();
  const [filter, setFilter] = useState("pending");
  const [open, setOpen] = useState<Rec | null>(null);
  const list = data.leads.filter((l) => filter === "all" || (str(l.attribution) || "none") === filter);
  const name = (id: unknown) => data.team.find((m) => m.id === str(id))?.name ?? "—";
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Select value={filter} onChange={(e) => setFilter(e.target.value)} className="w-auto" aria-label="Filter leads">
          <option value="pending">Pending decision</option>
          <option value="accepted">Accepted</option>
          <option value="rejected">Rejected</option>
          <option value="none">Owner set, not registered</option>
          <option value="all">All</option>
        </Select>
        <span className="text-xs text-blueprint">Team members register leads from My incentives; you can also set “Lead owner” on any enquiry in Leads.</span>
      </div>
      {!list.length ? (
        <EmptyState icon="UserCheck" title="Nothing here" description="Leads with an owner appear here for your decision." />
      ) : (
        <div className="overflow-x-auto rounded-[var(--radius)] border border-graphite/10 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-paper-100 text-left text-xs text-blueprint">
              <tr>
                <th className="px-3 py-2 font-medium">Lead</th>
                <th className="px-3 py-2 font-medium">Owner</th>
                <th className="px-3 py-2 font-medium">Registered</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {list.map((l) => (
                <tr key={l.id} className="border-t border-graphite/10">
                  <td className="px-3 py-2">
                    <div className="font-medium">{str(l.name)}</div>
                    <div className="text-xs text-blueprint">{str(l.organisation)}</div>
                  </td>
                  <td className="px-3 py-2">{Array.isArray(l.splits) && (l.splits as unknown[]).length > 1 ? (l.splits as { memberId: string; percent: number }[]).map((x) => `${name(x.memberId)} ${x.percent}%`).join(", ") : name(l.ownerId)}</td>
                  <td className="px-3 py-2 text-xs">{when(l.registeredAt || l.createdAt)}</td>
                  <td className="px-3 py-2">
                    <AttributionBadge status={l.attribution} />
                  </td>
                  <td className="px-3 py-2 text-right">
                    <Button size="sm" variant="secondary" onClick={() => setOpen(l)}>
                      {str(l.attribution) === "pending" ? "Decide" : "Open"}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {open && <LeadDecision lead={open} data={data} founder={user.role === "founder"} onClose={() => setOpen(null)} run={run} />}
    </div>
  );
}

function LeadDecision({ lead, data, founder, onClose, run }: { lead: Rec; data: Data; founder: boolean; onClose: () => void; run: Run }) {
  const initial = Array.isArray(lead.splits) && (lead.splits as unknown[]).length ? (lead.splits as { memberId: string; percent: number }[]) : lead.ownerId ? [{ memberId: str(lead.ownerId), percent: 100 }] : [{ memberId: "", percent: 100 }];
  const [splits, setSplits] = useState(initial);
  const [reason, setReason] = useState("");
  const total = splits.reduce((s, x) => s + num(x.percent), 0);
  const decide = async (decision: "accepted" | "rejected") => {
    if (await run("decideLead", { leadId: lead.id, decision, reason, splits: decision === "accepted" ? splits : undefined }, decision === "accepted" ? "Lead accepted" : "Lead rejected")) onClose();
  };
  return (
    <Drawer
      open
      onClose={onClose}
      title={str(lead.name)}
      subtitle={str(lead.organisation) || "Lead attribution"}
      footer={
        founder ? (
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="danger" size="sm" onClick={() => void decide("rejected")} disabled={!reason.trim()}>
              Reject
            </Button>
            <Button size="sm" onClick={() => void decide("accepted")} disabled={total !== 100}>
              Accept
            </Button>
          </div>
        ) : (
          <p className="text-xs text-blueprint">Only the founder decides attribution.</p>
        )
      }
    >
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <AttributionBadge status={lead.attribution} />
          <Link className="text-xs underline" href={`/hq/leads?id=${lead.id}`}>
            Open the enquiry
          </Link>
        </div>
        <KV k="Contact" v={[str(lead.phone), str(lead.email)].filter(Boolean).join(" · ") || "—"} />
        <KV k="Registered by" v={`${str(lead.registeredBy) || "—"} · ${when(lead.registeredAt || lead.createdAt)}`} />
        <div>
          <p className="mb-1 text-xs font-semibold text-blueprint">Opportunity</p>
          <p className="whitespace-pre-wrap text-sm">{str(lead.message) || "—"}</p>
        </div>
        <div>
          <p className="mb-1 text-xs font-semibold text-blueprint">Evidence of the introduction</p>
          <p className="whitespace-pre-wrap text-sm">{str(lead.evidence) || "None given."}</p>
        </div>
        {str(lead.decisionNote) && <KV k="Decision note" v={str(lead.decisionNote)} />}
        <div>
          <p className="mb-2 text-xs font-semibold text-blueprint">Commission split (must total 100%)</p>
          {splits.map((x, i) => (
            <div key={i} className="mb-2 flex gap-2">
              <Select value={x.memberId} onChange={(e) => setSplits((s) => s.map((y, j) => (j === i ? { ...y, memberId: e.target.value } : y)))} disabled={!founder}>
                <option value="">Choose…</option>
                {data.team.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </Select>
              <Input type="number" min={1} max={100} className="w-24" value={x.percent} onChange={(e) => setSplits((s) => s.map((y, j) => (j === i ? { ...y, percent: Number(e.target.value) } : y)))} disabled={!founder} aria-label="Share %" />
              {splits.length > 1 && founder && (
                <Button variant="ghost" size="sm" onClick={() => setSplits((s) => s.filter((_, j) => j !== i))}>
                  Remove
                </Button>
              )}
            </div>
          ))}
          {founder && (
            <Button variant="ghost" size="sm" onClick={() => setSplits((s) => [...s, { memberId: "", percent: 0 }])}>
              + Add a person
            </Button>
          )}
          <p className={`text-xs ${total === 100 ? "text-ok" : "text-bad"}`}>Total {total}%</p>
        </div>
        {founder && (
          <Field label="Reason / note" help="Required to reject — the team member sees it.">
            <Textarea rows={2} value={reason} onChange={(e) => setReason(e.target.value)} />
          </Field>
        )}
        <div>
          <p className="mb-1 text-xs font-semibold text-blueprint">History</p>
          <History events={lead.attributionHistory} />
        </div>
      </div>
    </Drawer>
  );
}

/* ───────────────────────────── payouts register ───────────────────────────── */

const NEXT: Record<string, PayoutStatus[]> = {
  draft: ["calculated", "rejected"],
  calculated: ["pending", "on-hold", "rejected"],
  pending: ["approved", "on-hold", "rejected"],
  approved: ["initiated", "on-hold", "rejected"],
  "on-hold": ["pending", "rejected"],
  initiated: ["paid", "on-hold"],
  paid: ["reversed"],
};

function PayoutsTab({ data, run }: { data: Data; run: Run }) {
  const [kind, setKind] = useState("all");
  const [status, setStatus] = useState("open");
  const [open, setOpen] = useState<string | null>(null);
  const list = data.payouts
    .filter((p) => kind === "all" || p.kind === kind)
    .filter((p) => status === "all" || (status === "open" ? !["paid", "rejected", "reversed"].includes(str(p.status)) : str(p.status) === status))
    .sort((a, b) => str(b.period).localeCompare(str(a.period)));
  const current = data.payouts.find((p) => p.id === open) ?? null;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Select value={kind} onChange={(e) => setKind(e.target.value)} className="w-auto" aria-label="Type">
          <option value="all">Commission and bonus</option>
          <option value="commission">Commission</option>
          <option value="bonus">Quarterly bonus</option>
        </Select>
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-auto" aria-label="Status">
          <option value="open">Open</option>
          <option value="all">All</option>
          {Object.entries(PAYOUT_LABELS).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </Select>
      </div>
      {!list.length ? (
        <EmptyState icon="HandCoins" title="No statements" description="Calculate commission or the quarterly bonus from the Overview tab." />
      ) : (
        <div className="overflow-x-auto rounded-[var(--radius)] border border-graphite/10 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-paper-100 text-left text-xs text-blueprint">
              <tr>
                <th className="px-3 py-2 font-medium">Team member</th>
                <th className="px-3 py-2 font-medium">Type</th>
                <th className="px-3 py-2 font-medium">Period</th>
                <th className="px-3 py-2 text-right font-medium">Gross</th>
                <th className="px-3 py-2 text-right font-medium">Net</th>
                <th className="px-3 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {list.map((p) => (
                <tr key={p.id} className="cursor-pointer border-t border-graphite/10 hover:bg-paper-50" onClick={() => setOpen(p.id)}>
                  <td className="px-3 py-2 font-medium">{str(p.memberName)}</td>
                  <td className="px-3 py-2">{p.kind === "bonus" ? "Quarterly bonus" : "Commission"}</td>
                  <td className="px-3 py-2">{str(p.period)}</td>
                  <td className="tabular px-3 py-2 text-right">{inr(p.gross)}</td>
                  <td className="tabular px-3 py-2 text-right font-semibold">{inr(p.net)}</td>
                  <td className="px-3 py-2">
                    <PayoutBadge status={p.status} />
                    {Array.isArray(p.requests) && (p.requests as { kind: string; status: string }[]).some((r) => r.kind === "correction" && r.status === "open") && <Badge tone="bad" className="ml-1">Correction asked</Badge>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {current && <PayoutDrawer p={current} data={data} onClose={() => setOpen(null)} run={run} />}
    </div>
  );
}

function PayoutDrawer({ p, data, onClose, run }: { p: Rec; data: Data; onClose: () => void; run: Run }) {
  const { user } = useHq();
  const [to, setTo] = useState<PayoutStatus | "">("");
  const [reason, setReason] = useState("");
  const [ref, setRef] = useState(str(p.paymentReference));
  const [paidOn, setPaidOn] = useState(data.dashboard.today);
  const [ded, setDed] = useState(String(num(p.deductions)));
  const [dedNote, setDedNote] = useState(str(p.deductionNote));
  const status = str(p.status) as PayoutStatus;
  const locked = ["approved", "initiated", "paid", "reversed"].includes(status);
  const lines = (Array.isArray(p.lines) ? p.lines : []) as { invoiceId: string; date: string; eligibleFee: number; splitPercent: number; ratePercent: number; amount: number; leadId: string }[];
  const basis = p.basis as { eligibleCollections: number; tierFrom: number; tierAmount: number; share: number; excluded: string } | undefined;
  const needsRef = to === "initiated" || to === "paid";
  const needsReason = to === "rejected" || to === "on-hold" || to === "reversed";
  const leadName = (id: string) => str(data.leads.find((l) => l.id === id)?.name) || "Lead";
  return (
    <Drawer
      open
      onClose={onClose}
      width="max-w-3xl"
      title={`${str(p.memberName)} — ${p.kind === "bonus" ? "Quarterly bonus" : "Commission"} ${str(p.period)}`}
      subtitle={<PayoutBadge status={p.status} />}
      footer={
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Link className="text-sm underline" href={`/hq/print/incentive-letter/${p.id}`} target="_blank">
            {status === "approved" || status === "initiated" || status === "paid" ? "Open the letter" : "Preview the letter (draft)"}
          </Link>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-3">
          <StatCard label="Gross" value={inr(p.gross)} />
          <StatCard label="Deductions" value={inr(p.deductions)} sub={str(p.deductionNote) || undefined} />
          <StatCard tone="dark" label="Net payable" value={inr(p.net)} />
        </div>

        {p.kind === "commission" ? (
          <Panel title="How it was worked out" subtitle={`Policy v${num(p.policyVersion)} · only reconciled payments, GST and pass-through charges left out`}>
            {lines.length ? (
              <table className="w-full text-sm">
                <thead className="text-left text-xs text-blueprint">
                  <tr>
                    <th className="py-1 font-medium">Paid on</th>
                    <th className="py-1 font-medium">Lead</th>
                    <th className="py-1 text-right font-medium">Eligible fee</th>
                    <th className="py-1 text-right font-medium">Rate × share</th>
                    <th className="py-1 text-right font-medium">Commission</th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((l, i) => (
                    <tr key={i} className="border-t border-graphite/10">
                      <td className="py-1.5">
                        <Link className="underline" href={`/hq/finance?tab=invoices&id=${l.invoiceId}`}>
                          {l.date}
                        </Link>
                      </td>
                      <td className="py-1.5">{leadName(l.leadId)}</td>
                      <td className="tabular py-1.5 text-right">{inr(l.eligibleFee)}</td>
                      <td className="tabular py-1.5 text-right">
                        {l.ratePercent}% × {l.splitPercent}%
                      </td>
                      <td className="tabular py-1.5 text-right font-semibold">{inr(l.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-sm text-blueprint">No eligible payments in this month.</p>
            )}
          </Panel>
        ) : basis ? (
          <Panel title="How it was worked out" subtitle={`Policy v${num(p.policyVersion)}`}>
            <KV k="Eligible collections in the quarter" v={inr(basis.eligibleCollections)} />
            <KV k="Milestone reached" v={basis.tierAmount ? `${inr(basis.tierFrom)} → ${inr(basis.tierAmount)} per member` : "None"} />
            <KV k="Share of the quarter" v={`${Math.round(basis.share * 100)}%`} />
            {basis.excluded && <KV k="Excluded" v={basis.excluded} />}
          </Panel>
        ) : null}

        <Panel title="Deductions" subtitle={locked ? "Frozen once approved" : "TDS or any agreed deduction, with a note"}>
          <div className="flex flex-wrap items-end gap-2">
            <Field label="Amount (₹)" className="w-36">
              <Input type="number" min={0} value={ded} onChange={(e) => setDed(e.target.value)} disabled={locked} />
            </Field>
            <Field label="Note" className="flex-1">
              <Input value={dedNote} onChange={(e) => setDedNote(e.target.value)} disabled={locked} placeholder="e.g. TDS u/s 192" />
            </Field>
            <Button size="sm" variant="secondary" disabled={locked} onClick={() => void run("setDeductions", { id: p.id, deductions: Number(ded) || 0, note: dedNote }, "Deductions saved")}>
              Save
            </Button>
          </div>
        </Panel>

        <Panel title="Move to the next step">
          {(NEXT[status] ?? []).length ? (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {(NEXT[status] ?? []).map((s) => (
                  <Button key={s} size="sm" variant={to === s ? "primary" : "secondary"} onClick={() => setTo(s)} disabled={s === "approved" && user.role !== "founder"}>
                    {PAYOUT_LABELS[s]}
                  </Button>
                ))}
              </div>
              {needsRef && (
                <div className="grid gap-2 sm:grid-cols-2">
                  <Field label="Payment reference" required help="UTR, cheque number or transaction ID from the bank">
                    <Input value={ref} onChange={(e) => setRef(e.target.value)} />
                  </Field>
                  {to === "paid" && (
                    <Field label="Paid on">
                      <Input type="date" value={paidOn} onChange={(e) => setPaidOn(e.target.value)} />
                    </Field>
                  )}
                </div>
              )}
              {(needsReason || to === "approved") && (
                <Field label={needsReason ? "Reason" : "Note (optional)"} required={needsReason}>
                  <Textarea rows={2} value={reason} onChange={(e) => setReason(e.target.value)} />
                </Field>
              )}
              {to && (
                <Button
                  size="sm"
                  disabled={(needsRef && !ref.trim()) || (needsReason && !reason.trim())}
                  onClick={async () => {
                    if (await run("movePayout", { id: p.id, to, reason, paymentReference: ref, paidOn }, `Moved to ${PAYOUT_LABELS[to]}`)) setTo("");
                  }}
                >
                  Confirm: {PAYOUT_LABELS[to]}
                </Button>
              )}
              <p className="text-xs text-blueprint">HQ never moves money. Make the transfer from the bank yourself, then record its reference here.</p>
            </div>
          ) : (
            <p className="text-sm text-blueprint">This statement is closed.</p>
          )}
        </Panel>

        {Array.isArray(p.requests) && (p.requests as unknown[]).length > 0 && (
          <Panel title="From the team member">
            <ul className="space-y-2 text-sm">
              {(p.requests as { at: string; kind: string; text: string }[]).map((r, i) => (
                <li key={i}>
                  <Badge tone={r.kind === "correction" ? "bad" : "ok"}>{r.kind === "correction" ? "Correction asked" : "Acknowledged"}</Badge> <span className="text-xs text-blueprint">{when(r.at)}</span>
                  {r.text && <p className="mt-1 whitespace-pre-wrap">{r.text}</p>}
                </li>
              ))}
            </ul>
          </Panel>
        )}

        <div className="grid gap-x-6 sm:grid-cols-2">
          <KV k="Approved by" v={p.approvedBy ? `${str(p.approvedBy)} · ${when(p.approvedAt)}` : "—"} />
          <KV k="Payment reference" v={str(p.paymentReference) || "—"} />
          <KV k="Paid on" v={str(p.paidOn) || "—"} />
          <KV k="Letter ref" v={str(p.letterRef) || "—"} />
        </div>
        <div>
          <p className="mb-1 text-xs font-semibold text-blueprint">History</p>
          <History events={p.history} />
        </div>
      </div>
    </Drawer>
  );
}

/* ───────────────────────────── performance reviews ───────────────────────────── */

const SCORE_LABELS: Record<string, string> = { delivery: "Delivery & deadlines", quality: "Quality of work", collaboration: "Collaboration & communication", reliability: "Reliability & ownership", learning: "Learning & initiative" };

function ReviewsTab({ data, run }: { data: Data; run: Run }) {
  const [edit, setEdit] = useState<Record<string, unknown> | null>(null);
  const reviews = [...data.reviews].sort((a, b) => str(b.period).localeCompare(str(a.period)));
  const lastMonth = data.dashboard.reviewMonth;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" onClick={() => setEdit({ kind: "monthly", period: lastMonth, scores: {}, status: "draft", bonusEligible: true })}>
          New review
        </Button>
        {data.dashboard.reviewDue.length > 0 && <span className="text-sm text-warn">Due for {monthLabel(lastMonth)}: {data.dashboard.reviewDue.join(", ")}</span>}
      </div>
      {!reviews.length ? (
        <EmptyState icon="ClipboardCheck" title="No reviews yet" description="Monthly one-to-ones and quarterly assessments. A draft stays private; “Share” shows it to the person, who can acknowledge it or ask for a correction." />
      ) : (
        <div className="overflow-x-auto rounded-[var(--radius)] border border-graphite/10 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-paper-100 text-left text-xs text-blueprint">
              <tr>
                <th className="px-3 py-2 font-medium">Team member</th>
                <th className="px-3 py-2 font-medium">Type</th>
                <th className="px-3 py-2 font-medium">Period</th>
                <th className="px-3 py-2 font-medium">Average</th>
                <th className="px-3 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {reviews.map((r) => {
                const sc = Object.values((r.scores as Record<string, number>) ?? {}).filter((v) => v > 0);
                return (
                  <tr key={r.id} className="cursor-pointer border-t border-graphite/10 hover:bg-paper-50" onClick={() => setEdit(r)}>
                    <td className="px-3 py-2 font-medium">{str(r.memberName)}</td>
                    <td className="px-3 py-2">{r.kind === "quarterly" ? "Quarterly" : "Monthly"}</td>
                    <td className="px-3 py-2">{str(r.period)}</td>
                    <td className="tabular px-3 py-2">{sc.length ? (sc.reduce((a, b) => a + b, 0) / sc.length).toFixed(1) : "—"}</td>
                    <td className="px-3 py-2">
                      <Badge tone={r.status === "acknowledged" ? "ok" : r.status === "appealed" ? "bad" : r.status === "shared" ? "info" : "outline"}>{r.status === "appealed" ? "Correction asked" : str(r.status)}</Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {edit && <ReviewEditor initial={edit} data={data} onClose={() => setEdit(null)} run={run} />}
    </div>
  );
}

function ReviewEditor({ initial, data, onClose, run }: { initial: Record<string, unknown>; data: Data; onClose: () => void; run: Run }) {
  const [r, setR] = useState<Record<string, unknown>>(initial);
  const set = (k: string, v: unknown) => setR((x) => ({ ...x, [k]: v }));
  const scores = (r.scores as Record<string, number>) ?? {};
  const member = data.team.find((m) => m.id === str(r.memberId));
  const save = async (status: "draft" | "shared") => {
    if (await run("saveReview", { review: { ...r, status } }, status === "shared" ? "Review shared" : "Draft saved")) onClose();
  };
  return (
    <Drawer
      open
      onClose={onClose}
      width="max-w-3xl"
      title={r.id ? `Review — ${str(r.memberName)}` : "New review"}
      subtitle="Confidential: the founder, admins and the person reviewed only"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={() => void save("draft")}>
            Save draft
          </Button>
          <Button size="sm" onClick={() => void save("shared")}>
            Share with {member?.name.split(" ")[0] ?? "them"}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Team member" required>
            <Select value={str(r.memberId)} onChange={(e) => set("memberId", e.target.value)} disabled={!!r.id}>
              <option value="">Choose…</option>
              {data.team
                .filter((m) => str(m.status) !== "inactive")
                .map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
            </Select>
          </Field>
          <Field label="Type">
            <Select value={str(r.kind)} onChange={(e) => setR((x) => ({ ...x, kind: e.target.value, period: e.target.value === "quarterly" ? data.quarter.key : data.dashboard.reviewMonth }))} disabled={!!r.id}>
              <option value="monthly">Monthly one-to-one</option>
              <option value="quarterly">Quarterly assessment</option>
            </Select>
          </Field>
          <Field label="Period" help={r.kind === "quarterly" ? "e.g. 2026-Q3" : "YYYY-MM"}>
            <Input value={str(r.period)} onChange={(e) => set("period", e.target.value)} disabled={!!r.id} />
          </Field>
        </div>
        {member && (
          <Notice tone="info">
            From the records ({data.quarter.key}): {member.facts.delivered}/{member.facts.deliverables} deliverables approved, {member.facts.reworked} needed more than two revision rounds; {member.facts.tasksDone}/{member.facts.tasks} tasks done; {member.facts.leadsRegistered} lead(s) registered, {member.facts.leadsAccepted} accepted. Facts to inform the review — not a score.
          </Notice>
        )}
        <div className="grid gap-2 sm:grid-cols-2">
          {Object.entries(SCORE_LABELS).map(([k, label]) => (
            <Field key={k} label={label}>
              <Select value={String(scores[k] ?? 0)} onChange={(e) => set("scores", { ...scores, [k]: Number(e.target.value) })}>
                <option value="0">Not rated</option>
                <option value="1">1 — Well below expectations</option>
                <option value="2">2 — Below expectations</option>
                <option value="3">3 — Meets expectations</option>
                <option value="4">4 — Above expectations</option>
                <option value="5">5 — Outstanding</option>
              </Select>
            </Field>
          ))}
        </div>
        <Field label="What went well">
          <Textarea rows={3} value={str(r.strengths)} onChange={(e) => set("strengths", e.target.value)} />
        </Field>
        <Field label="What to improve">
          <Textarea rows={3} value={str(r.improve)} onChange={(e) => set("improve", e.target.value)} />
        </Field>
        <Field label="Goals for next period">
          <Textarea rows={3} value={str(r.goals)} onChange={(e) => set("goals", e.target.value)} />
        </Field>
        <Field label="Client feedback (if any)">
          <Textarea rows={2} value={str(r.clientFeedback)} onChange={(e) => set("clientFeedback", e.target.value)} />
        </Field>
        <Field label="Evidence / links">
          <Textarea rows={2} value={str(r.evidence)} onChange={(e) => set("evidence", e.target.value)} />
        </Field>
        <Checkbox label="Meets the quality conditions for the quarterly bonus" checked={r.bonusEligible !== false} onChange={(e) => set("bonusEligible", e.target.checked)} />
        {Array.isArray(r.requests) && (r.requests as unknown[]).length > 0 && (
          <Panel title="From the team member">
            {(r.requests as { at: string; kind: string; text: string }[]).map((q, i) => (
              <p key={i} className="text-sm">
                <Badge tone={q.kind === "correction" ? "bad" : "ok"}>{q.kind === "correction" ? "Correction asked" : "Acknowledged"}</Badge> <span className="text-xs text-blueprint">{when(q.at)}</span> {q.text}
              </p>
            ))}
          </Panel>
        )}
        {r.id ? (
          <div>
            <p className="mb-1 text-xs font-semibold text-blueprint">History</p>
            <History events={r.history} />
          </div>
        ) : null}
      </div>
    </Drawer>
  );
}

/* ───────────────────────────── policy ───────────────────────────── */

function PolicyTab({ data, run }: { data: Data; run: Run }) {
  const { user } = useHq();
  const founder = user.role === "founder";
  const [draft, setDraft] = useState<Policy>(data.policy);
  const set = <K extends keyof Policy>(k: K, v: Policy[K]) => setDraft((p) => ({ ...p, [k]: v }));
  const versions = [...data.policies].sort((a, b) => num(b.version) - num(a.version));
  return (
    <div className="grid gap-5 xl:grid-cols-[1.3fr_1fr]">
      <Panel title="Policy terms" subtitle="These terms are in force. Saving applies the change at once as a new version.">
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Name" className="sm:col-span-2">
              <Input value={draft.name} onChange={(e) => set("name", e.target.value)} disabled={!founder} />
            </Field>
            <Field label="Effective from">
              <Input type="date" value={draft.effectiveFrom} onChange={(e) => set("effectiveFrom", e.target.value)} disabled={!founder} />
            </Field>
            <Field label="Commission rate (%)">
              <Input type="number" min={0} max={50} step={0.5} value={draft.commissionRate} onChange={(e) => set("commissionRate", Number(e.target.value))} disabled={!founder} />
            </Field>
            <Field label="Margin target (%)" help="Projects below it are flagged">
              <Input type="number" min={0} max={100} value={draft.marginTarget} onChange={(e) => set("marginTarget", Number(e.target.value))} disabled={!founder} />
            </Field>
            <Field label="Cash reserve (₹)" help="Shown beside approvals">
              <Input type="number" min={0} value={draft.reserve} onChange={(e) => set("reserve", Number(e.target.value))} disabled={!founder} />
            </Field>
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold text-blueprint">Quarterly milestones (per eligible member, not stacked)</p>
            {draft.tiers.map((t, i) => (
              <div key={i} className="mb-2 flex items-center gap-2 text-sm">
                <span className="text-blueprint">From</span>
                <Input type="number" className="w-36" value={t.from} onChange={(e) => set("tiers", draft.tiers.map((x, j) => (j === i ? { ...x, from: Number(e.target.value) } : x)))} disabled={!founder} aria-label="Collections from" />
                <span className="text-blueprint">→ ₹</span>
                <Input type="number" className="w-28" value={t.amount} onChange={(e) => set("tiers", draft.tiers.map((x, j) => (j === i ? { ...x, amount: Number(e.target.value) } : x)))} disabled={!founder} aria-label="Amount per member" />
                {founder && (
                  <Button variant="ghost" size="sm" onClick={() => set("tiers", draft.tiers.filter((_, j) => j !== i))}>
                    Remove
                  </Button>
                )}
              </div>
            ))}
            {founder && (
              <Button variant="ghost" size="sm" onClick={() => set("tiers", [...draft.tiers, { from: 0, amount: 0 }])}>
                + Add a milestone
              </Button>
            )}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Joined mid-quarter">
              <Select value={draft.partialRule} onChange={(e) => set("partialRule", e.target.value as Policy["partialRule"])} disabled={!founder}>
                <option value="prorata">Pro-rata by days served</option>
                <option value="full">Full amount</option>
                <option value="exclude">Not eligible that quarter</option>
              </Select>
            </Field>
            <div className="pt-6">
              <Checkbox label="Count TDS deducted by the client as collected" checked={draft.countTds} onChange={(e) => set("countTds", e.target.checked)} disabled={!founder} />
            </div>
          </div>
          <Field label="Eligibility rules">
            <Textarea rows={3} value={draft.eligibilityRules} onChange={(e) => set("eligibilityRules", e.target.value)} disabled={!founder} />
          </Field>
          <Field label="Quality conditions">
            <Textarea rows={3} value={draft.qualityRules} onChange={(e) => set("qualityRules", e.target.value)} disabled={!founder} />
          </Field>
          <Field label="Exceptions">
            <Textarea rows={2} value={draft.exceptions} onChange={(e) => set("exceptions", e.target.value)} disabled={!founder} />
          </Field>
          {founder && (
            <Button size="sm" onClick={() => void run("savePolicy", { policy: draft }, "Saved — the new terms are in force")}>
              Save
            </Button>
          )}
        </div>
      </Panel>

      <Panel title="Versions" subtitle="Each save applies at once; older versions are kept for the record">
        {!versions.length ? (
          <p className="text-sm text-blueprint">The terms on the left are in force now. Change them and save to make a new version.</p>
        ) : (
          <ul className="space-y-2">
            {versions.map((v) => (
              <li key={v.id} className="flex flex-wrap items-center gap-2 rounded-[var(--radius-sm)] border border-graphite/10 p-3 text-sm">
                <span className="font-semibold">v{num(v.version)}</span>
                <Badge tone={v.status === "active" ? "ok" : "neutral"}>{v.status === "active" ? "In force" : "Replaced"}</Badge>
                <span className="ml-auto text-xs text-blueprint">
                  {num(v.commissionRate)}% · from {str(v.effectiveFrom)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}

/* ───────────────────────────── audit trail ───────────────────────────── */

function AuditTab({ data }: { data: Data }) {
  const events = useMemo(() => {
    const out: { at: string; by: string; what: string; detail: string; reason?: string }[] = [];
    const push = (where: string, list: unknown) => {
      for (const e of (Array.isArray(list) ? list : []) as { at: string; by: string; action: string; from?: string; to?: string; reason?: string }[]) out.push({ at: e.at, by: e.by, what: where, detail: `${e.action}${e.from || e.to ? `: ${e.from ? `${e.from} → ` : ""}${e.to ?? ""}` : ""}`, reason: e.reason });
    };
    for (const p of data.payouts) push(`${p.kind === "bonus" ? "Bonus" : "Commission"} · ${str(p.memberName)} · ${str(p.period)}`, p.history);
    for (const l of data.leads) push(`Lead · ${str(l.name)}`, l.attributionHistory);
    for (const v of data.policies) push(`Policy v${num(v.version)}`, v.history);
    for (const r of data.reviews) push(`Review · ${str(r.memberName)} · ${str(r.period)}`, r.history);
    return out.sort((a, b) => b.at.localeCompare(a.at));
  }, [data]);
  if (!events.length) return <EmptyState icon="History" title="Nothing recorded yet" description="Every calculation, decision, approval and payment is listed here with who did it and when." />;
  return (
    <div className="overflow-x-auto rounded-[var(--radius)] border border-graphite/10 bg-white">
      <table className="w-full text-sm">
        <thead className="bg-paper-100 text-left text-xs text-blueprint">
          <tr>
            <th className="px-3 py-2 font-medium">When</th>
            <th className="px-3 py-2 font-medium">Who</th>
            <th className="px-3 py-2 font-medium">Record</th>
            <th className="px-3 py-2 font-medium">Change</th>
          </tr>
        </thead>
        <tbody>
          {events.slice(0, 500).map((e, i) => (
            <tr key={i} className="border-t border-graphite/10 align-top">
              <td className="tabular whitespace-nowrap px-3 py-2 text-xs">{when(e.at)}</td>
              <td className="px-3 py-2">{e.by}</td>
              <td className="px-3 py-2">{e.what}</td>
              <td className="px-3 py-2">
                {e.detail}
                {e.reason && <div className="text-xs text-blueprint">“{e.reason}”</div>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
