"use client";

import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Overlay";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { EmptyState, KV, Loading, PageHeader, Panel, StatCard } from "@/components/hq/ui";
import { api } from "@/components/hq/data";
import { AttributionBadge, inr, Notice, PayoutBadge, str, when, type Rec } from "./shared";

interface Mine {
  linked: boolean;
  member: { id: string; name: string; role: string; incentiveEligible: boolean } | null;
  policy: { commissionRate: number; tiers: { from: number; amount: number }[]; active: boolean; version: number };
  quarter: { key: string; label: string; milestoneReached: number; nextMilestone: number | null; eligible: boolean } | null;
  leads: { id: string; name: string; organisation: string; registeredAt: string; attribution: string; decisionNote: string; decidedAt: string; split: number | null }[];
  payouts: Rec[];
  reviews: Rec[];
}

const send = (body: Record<string, unknown>) => api<{ ok: boolean }>("/api/hq/incentives/me", { method: "POST", body: JSON.stringify(body) });

/** HQ → My incentives: only this person's leads, statements and reviews — the server decides what "mine" is. */
export function MyIncentives() {
  const [data, setData] = useState<Mine | null>(null);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState<{ tone: "ok" | "bad"; text: string } | null>(null);
  const [registering, setRegistering] = useState(false);
  const [open, setOpen] = useState<{ kind: "payout" | "review"; rec: Rec } | null>(null);

  const load = useCallback(
    () =>
      api<Mine>("/api/hq/incentives/me")
        .then(setData)
        .catch((e) => setError(e instanceof Error ? e.message : "Could not load")),
    [],
  );
  useEffect(() => {
    void load();
  }, [load]);

  const doSend = async (body: Record<string, unknown>, ok: string) => {
    try {
      await send(body);
      setMsg({ tone: "ok", text: ok });
      await load();
      return true;
    } catch (e) {
      setMsg({ tone: "bad", text: e instanceof Error ? e.message : "That did not work." });
      return false;
    }
  };

  if (error) return <Notice tone="bad">{error}</Notice>;
  if (!data) return <Loading />;

  const paid = data.payouts.filter((p) => p.status === "paid").reduce((s, p) => s + (Number(p.net) || 0), 0);
  const upcoming = data.payouts.filter((p) => ["approved", "initiated"].includes(str(p.status))).reduce((s, p) => s + (Number(p.net) || 0), 0);

  return (
    <div>
      <PageHeader
        eyebrow="Overview"
        icon="Trophy"
        title="My incentives"
        description="Your registered leads, commission and bonus statements, and your reviews. Only you and the founder see these."
        actions={
          data.linked ? (
            <Button size="sm" onClick={() => setRegistering(true)}>
              Register a lead
            </Button>
          ) : undefined
        }
      />
      {msg && (
        <div className="mb-4" role="status">
          <Notice tone={msg.tone}>{msg.text}</Notice>
        </div>
      )}
      {!data.linked ? (
        <EmptyState icon="UserCheck" title="Your login is not linked to your team record yet" description="Ask the founder to link it under Settings → Logins. Then your leads, statements and reviews appear here." />
      ) : (
        <div className="space-y-5">
          {!data.policy.active && <Notice tone="warn">The incentive policy is still being reviewed for legal compliance. You can register leads now; statements become payable only once the policy is active.</Notice>}
          <div className="grid gap-3 sm:grid-cols-3">
            <StatCard
              tone="dark"
              label={data.quarter ? `Team milestone — ${data.quarter.key}` : "Team milestone"}
              value={data.quarter?.milestoneReached ? `${inr(data.quarter.milestoneReached)} reached` : "Not reached yet"}
              sub={data.quarter?.nextMilestone ? `Next: ${inr(data.quarter.nextMilestone)} per member` : data.quarter?.milestoneReached ? "Top milestone" : undefined}
            />
            <StatCard label="Approved, to be paid" value={inr(upcoming)} />
            <StatCard label="Paid to you so far" value={inr(paid)} />
          </div>
          {data.quarter && !data.quarter.eligible && <p className="text-sm text-blueprint">You are not part of the quarterly team bonus this quarter. Ask the founder if you think this is wrong.</p>}

          <Panel title="My leads" subtitle={`${data.policy.commissionRate}% of the service fee the client actually pays (GST and pass-through costs excluded), once the founder accepts the lead`}>
            {!data.leads.length ? (
              <p className="text-sm text-blueprint">No leads registered yet. Register a lead as soon as you make the introduction — the date you register it is what counts.</p>
            ) : (
              <ul className="divide-y divide-graphite/10">
                {data.leads.map((l) => (
                  <li key={l.id} className="flex flex-wrap items-center gap-2 py-2 text-sm">
                    <span className="font-medium">{l.name}</span>
                    {l.organisation && <span className="text-blueprint">{l.organisation}</span>}
                    <span className="text-xs text-blueprint">{when(l.registeredAt)}</span>
                    <span className="ml-auto flex items-center gap-2">
                      {l.split !== null && l.split < 100 && <Badge tone="info">{l.split}% share</Badge>}
                      <AttributionBadge status={l.attribution} />
                    </span>
                    {l.decisionNote && <p className="w-full text-xs text-charcoal">Founder&apos;s note: {l.decisionNote}</p>}
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="My statements">
            {!data.payouts.length ? (
              <p className="text-sm text-blueprint">Nothing yet. Statements appear once commission or the quarterly bonus is calculated.</p>
            ) : (
              <ul className="divide-y divide-graphite/10">
                {[...data.payouts]
                  .sort((a, b) => str(b.period).localeCompare(str(a.period)))
                  .map((p) => (
                    <li key={p.id}>
                      <button className="flex w-full flex-wrap items-center gap-2 py-2 text-left text-sm hover:bg-paper-50" onClick={() => setOpen({ kind: "payout", rec: p })}>
                        <span className="font-medium">{p.kind === "bonus" ? "Quarterly bonus" : "Commission"}</span>
                        <span className="text-blueprint">{str(p.period)}</span>
                        <span className="tabular ml-auto font-semibold">{inr(p.net)}</span>
                        <PayoutBadge status={p.status} />
                      </button>
                    </li>
                  ))}
              </ul>
            )}
          </Panel>

          <Panel title="My reviews">
            {!data.reviews.length ? (
              <p className="text-sm text-blueprint">No reviews shared with you yet.</p>
            ) : (
              <ul className="divide-y divide-graphite/10">
                {data.reviews.map((r) => (
                  <li key={r.id}>
                    <button className="flex w-full flex-wrap items-center gap-2 py-2 text-left text-sm hover:bg-paper-50" onClick={() => setOpen({ kind: "review", rec: r })}>
                      <span className="font-medium">{r.kind === "quarterly" ? "Quarterly assessment" : "Monthly one-to-one"}</span>
                      <span className="text-blueprint">{str(r.period)}</span>
                      <Badge className="ml-auto" tone={r.status === "acknowledged" ? "ok" : r.status === "appealed" ? "bad" : "info"}>
                        {r.status === "shared" ? "New — please read" : r.status === "appealed" ? "Correction asked" : "Acknowledged"}
                      </Badge>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="How it works">
            <ul className="list-disc space-y-1 pl-5 text-sm text-charcoal">
              <li>Quarterly team bonus: when the studio&apos;s eligible collections in a quarter reach a milestone, each eligible member gets that milestone&apos;s amount ({data.policy.tiers.map((t) => `${inr(t.from)} → ${inr(t.amount)}`).join(", ")}). Milestones are not added together.</li>
              <li>Commission: {data.policy.commissionRate}% of the service fee collected from a client you introduced, once the founder accepts the lead. If you share a lead, you share the commission.</li>
              <li>Only money actually received counts — not invoices, not GST.</li>
              <li>Every statement shows how it was worked out. If something looks wrong, open it and ask for a correction.</li>
            </ul>
          </Panel>
        </div>
      )}
      {registering && <RegisterLead onClose={() => setRegistering(false)} onSave={(lead) => doSend({ action: "registerLead", lead }, "Lead registered — the founder will review it.")} />}
      {open && <Detail item={open} onClose={() => setOpen(null)} onSend={doSend} />}
    </div>
  );
}

function RegisterLead({ onClose, onSave }: { onClose: () => void; onSave: (lead: Record<string, string>) => Promise<boolean> }) {
  const [f, setF] = useState<Record<string, string>>({ kind: "project", channel: "Referral" });
  const set = (k: string, v: string) => setF((x) => ({ ...x, [k]: v }));
  const [busy, setBusy] = useState(false);
  return (
    <Drawer
      open
      onClose={onClose}
      title="Register a lead"
      subtitle="It goes into Leads and to the founder for an attribution decision"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            disabled={busy || !f.name?.trim() || !f.message?.trim() || !(f.phone?.trim() || f.email?.trim())}
            onClick={async () => {
              setBusy(true);
              if (await onSave(f)) onClose();
              setBusy(false);
            }}
          >
            Register
          </Button>
        </div>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Contact name" required>
          <Input value={f.name ?? ""} onChange={(e) => set("name", e.target.value)} />
        </Field>
        <Field label="Organisation">
          <Input value={f.organisation ?? ""} onChange={(e) => set("organisation", e.target.value)} />
        </Field>
        <Field label="Phone">
          <Input value={f.phone ?? ""} onChange={(e) => set("phone", e.target.value)} />
        </Field>
        <Field label="Email">
          <Input type="email" value={f.email ?? ""} onChange={(e) => set("email", e.target.value)} />
        </Field>
        <Field label="City">
          <Input value={f.city ?? ""} onChange={(e) => set("city", e.target.value)} />
        </Field>
        <Field label="How you met them">
          <Select value={f.channel} onChange={(e) => set("channel", e.target.value)}>
            {["Referral", "WhatsApp", "Instagram DM", "LinkedIn", "Phone call", "Email", "Walk-in", "Event", "Other"].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </Select>
        </Field>
        <Field label="What they need" required className="sm:col-span-2">
          <Textarea rows={3} value={f.message ?? ""} onChange={(e) => set("message", e.target.value)} placeholder="The project or service, budget if known, timing" />
        </Field>
        <Field label="Evidence of your introduction" className="sm:col-span-2" help="A message, email or meeting note showing you brought them in">
          <Textarea rows={2} value={f.evidence ?? ""} onChange={(e) => set("evidence", e.target.value)} />
        </Field>
      </div>
    </Drawer>
  );
}

const SCORE_LABELS: Record<string, string> = { delivery: "Delivery & deadlines", quality: "Quality of work", collaboration: "Collaboration & communication", reliability: "Reliability & ownership", learning: "Learning & initiative" };

function Detail({ item, onClose, onSend }: { item: { kind: "payout" | "review"; rec: Rec }; onClose: () => void; onSend: (b: Record<string, unknown>, ok: string) => Promise<boolean> }) {
  const r = item.rec;
  const [text, setText] = useState("");
  const lines = (Array.isArray(r.lines) ? r.lines : []) as { date: string; eligibleFee: number; splitPercent: number; ratePercent: number; amount: number }[];
  const basis = r.basis as { eligibleCollections: number; tierAmount: number; share: number; excluded: string } | undefined;
  const ask = async (kind: "acknowledge" | "correction") => {
    if (await onSend({ action: kind, target: item.kind, id: r.id, text }, kind === "acknowledge" ? "Acknowledged." : "Your correction request was sent to the founder.")) onClose();
  };
  return (
    <Drawer
      open
      onClose={onClose}
      title={item.kind === "payout" ? `${r.kind === "bonus" ? "Quarterly bonus" : "Commission"} — ${str(r.period)}` : `${r.kind === "quarterly" ? "Quarterly assessment" : "Monthly one-to-one"} — ${str(r.period)}`}
      footer={
        <div className="space-y-2">
          <Textarea rows={2} placeholder={item.kind === "review" ? "Your comments (optional to acknowledge, required to ask for a correction)" : "What should be corrected, and why"} value={text} onChange={(e) => setText(e.target.value)} />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="sm" disabled={!text.trim()} onClick={() => void ask("correction")}>
              Ask for a correction
            </Button>
            {item.kind === "review" && r.status === "shared" && (
              <Button size="sm" onClick={() => void ask("acknowledge")}>
                Acknowledge
              </Button>
            )}
          </div>
        </div>
      }
    >
      {item.kind === "payout" ? (
        <div className="space-y-4">
          <PayoutBadge status={r.status} />
          <div className="grid gap-3 sm:grid-cols-3">
            <StatCard label="Gross" value={inr(r.gross)} />
            <StatCard label="Deductions" value={inr(r.deductions)} sub={str(r.deductionNote) || undefined} />
            <StatCard tone="dark" label="Net" value={inr(r.net)} />
          </div>
          {lines.length > 0 && (
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-blueprint">
                <tr>
                  <th className="py-1 font-medium">Client paid on</th>
                  <th className="py-1 text-right font-medium">Service fee</th>
                  <th className="py-1 text-right font-medium">Rate × your share</th>
                  <th className="py-1 text-right font-medium">Commission</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((l, i) => (
                  <tr key={i} className="border-t border-graphite/10">
                    <td className="py-1.5">{l.date}</td>
                    <td className="tabular py-1.5 text-right">{inr(l.eligibleFee)}</td>
                    <td className="tabular py-1.5 text-right">
                      {l.ratePercent}% × {l.splitPercent}%
                    </td>
                    <td className="tabular py-1.5 text-right font-semibold">{inr(l.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {basis && (
            <div>
              <KV k="Team milestone reached" v={basis.tierAmount ? `${inr(basis.tierAmount)} per member` : "None"} />
              <KV k="Your share of the quarter" v={`${Math.round(basis.share * 100)}%`} />
              {basis.excluded && <KV k="Not included because" v={basis.excluded} />}
            </div>
          )}
          <KV k="Payment reference" v={str(r.paymentReference) || "—"} />
          <KV k="Paid on" v={str(r.paidOn) || "—"} />
          {["approved", "initiated", "paid"].includes(str(r.status)) && (
            <a className="text-sm underline" href={`/hq/print/incentive-letter/${r.id}`} target="_blank" rel="noreferrer">
              Open the letter
            </a>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-x-6 sm:grid-cols-2">
            {Object.entries(SCORE_LABELS).map(([k, label]) => (
              <KV key={k} k={label} v={(r.scores as Record<string, number>)?.[k] ? `${(r.scores as Record<string, number>)[k]} / 5` : "—"} />
            ))}
          </div>
          {([["strengths", "What went well"], ["improve", "What to improve"], ["goals", "Goals for next period"], ["clientFeedback", "Client feedback"]] as const).map(([k, label]) =>
            str(r[k]) ? (
              <div key={k}>
                <p className="mb-1 text-xs font-semibold text-blueprint">{label}</p>
                <p className="whitespace-pre-wrap text-sm">{str(r[k])}</p>
              </div>
            ) : null,
          )}
          <KV k="Reviewer" v={str(r.reviewer) || "—"} />
        </div>
      )}
    </Drawer>
  );
}
