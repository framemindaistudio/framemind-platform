"use client";

import { useMemo, useState } from "react";
import { Award, CheckCircle2, Circle, Loader2, Pencil, Plus, Trash2, Wand2 } from "lucide-react";
import { COACHING } from "@/lib/content/catalog";
import { getCollection } from "@/lib/hq/collections";
import { can } from "@/lib/hq/roles";
import { Badge, statusTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/form";
import { certificateCodes, useCollection, useHq, useShowMoney } from "@/components/hq/data";
import { RecordDrawer } from "@/components/hq/RecordDrawer";
import { EmptyState, KV, Loading, Panel } from "@/components/hq/ui";
import { BackLink, ContactButtons, Notice } from "@/components/hq/sales/bits";
import { useToday } from "@/components/hq/sales/useToday";
import { ProgressBar } from "@/components/hq/projects/bits";
import { longDate, num, shortDate, str } from "@/components/hq/projects/logic";
import { cn, formatINR, isoDate, uid } from "@/lib/utils";
import { dayOf, nextNumber, planFor, planOf, sessionsFor, type PlanWeek } from "./plan";

const learnersDef = getCollection("learners")!;
const TRACK = Object.fromEntries(COACHING.tracks.map((t) => [t.id, t.label]));

export function LearnerDetail({ id }: { id: string }) {
  const { user, store } = useHq();
  const today = useToday();
  const showMoney = useShowMoney();
  const learners = useCollection("learners");
  const sessionsCol = useCollection("coachingSessions");
  const certs = useCollection("certificates");
  const canWrite = can(user, learnersDef.write) && store.writable;
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const [sessionDraft, setSessionDraft] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const l = learners.records.find((r) => r.id === id);
  const sessions = useMemo(() => sessionsFor(sessionsCol.records, id), [sessionsCol.records, id]);
  const cert = certs.records.find((c) => c.learnerId === id && c.status !== "revoked");

  if (learners.loading) return <Loading label="Loading learner…" />;
  if (!l) return (<div><BackLink href="/hq/coaching">AI Coaching</BackLink><EmptyState icon="GraduationCap" title="Learner not found" /></div>);

  const plan = planOf(l);
  const d = dayOf(l, today);
  const done = sessions.filter((s) => s.status === "done");
  const planned = num(l.sessionsPlanned);

  async function patch(change: Record<string, unknown>) {
    setError("");
    try {
      await learners.save({ ...l!, ...change });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save");
    }
  }
  const setPlan = (next: PlanWeek[]) => patch({ plan: next });

  async function issueCertificate() {
    setBusy(true);
    setError("");
    try {
      const [code] = await certificateCodes(1);
      await certs.save({
        code,
        studentName: str(l!.name),
        type: "AI Coaching — completion",
        program: `90-Day AI Fluency — ${TRACK[str(l!.track)] ?? "1:1"} track`,
        learnerId: l!.id,
        detail: str(l!.profession) ? `For ${str(l!.profession)}` : "",
        issueDate: isoDate(),
        status: "valid",
      });
      await patch({ status: "completed" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not issue the certificate");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <BackLink href="/hq/coaching">AI Coaching</BackLink>
      <section className="overflow-hidden rounded-[var(--radius-lg)] border border-graphite/12 bg-paper-50">
        <div className="bg-graphite px-5 py-5 text-paper sm:px-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="annot text-lime">1:1 AI coaching · {TRACK[str(l.track)] ?? "Track not set"} · {str(l.mode) === "offline" ? "Offline" : "Online"}</p>
              <h1 className="mt-1 text-2xl font-semibold tracking-[-0.02em] sm:text-3xl">{str(l.name)}</h1>
              <p className="mt-1 text-sm text-paper/60">{str(l.profession) || "Profession not set"}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge tone={statusTone(l.status)}>{str(l.status) || "onboarding"}</Badge>
              {canWrite && (
                <Button size="sm" variant="outline-light" onClick={() => setEditing({ ...l })}>
                  <Pencil className="size-4" /> Edit
                </Button>
              )}
            </div>
          </div>
          <div className="mt-5">
            <div className="mb-1.5 flex justify-between text-xs text-paper/60">
              <span>{d.day ? `Day ${d.day} of 90` : "Not started"}</span>
              <span>{d.end ? `Day 90 · ${longDate(d.end)}` : "Set a start date"}</span>
            </div>
            <ProgressBar value={d.pct} dark />
          </div>
        </div>
        <div className="grid gap-4 px-5 py-4 sm:grid-cols-2 sm:px-7 lg:grid-cols-4">
          <div>
            <p className="annot text-blueprint">Sessions</p>
            <p className="tabular mt-1.5 text-lg font-bold">
              {done.length}
              {planned ? ` / ${planned}` : ""}
            </p>
            <p className="text-xs text-charcoal">done{planned ? " of those planned" : ""}</p>
          </div>
          <div>
            <p className="annot text-blueprint">Plan</p>
            <p className="tabular mt-1.5 text-lg font-bold">{plan.length ? `${plan.filter((w) => w.done).length} / ${plan.length}` : "—"}</p>
            <p className="text-xs text-charcoal">weeks covered</p>
          </div>
          <div>
            <p className="annot text-blueprint">Hours saved / week</p>
            <p className="tabular mt-1.5 text-lg font-bold">{num(l.hoursSavedPerWeek) || "—"}</p>
            <p className="text-xs text-charcoal">as they report it</p>
          </div>
          {showMoney ? (
            <div>
              <p className="annot text-blueprint">Fee</p>
              <p className="tabular mt-1.5 text-lg font-bold">{num(l.fee) ? formatINR(num(l.fee)) : "—"}</p>
              <p className="tabular text-xs text-charcoal">{num(l.fee) ? `${formatINR(num(l.amountPaid))} paid` : "Set it in Edit"}</p>
            </div>
          ) : (
            <div>
              <p className="annot text-blueprint">Coach</p>
              <p className="mt-1.5 text-lg font-bold">{str(l.coach) || "—"}</p>
            </div>
          )}
        </div>
      </section>
      {error && <Notice tone="bad" className="mt-4">{error}</Notice>}

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <Panel
            title="Their 90-day plan"
            subtitle="Built around their profession — rewrite every week before session one."
            action={
              canWrite && plan.length === 0 ? (
                <Button size="sm" onClick={() => setPlan(planFor(l.track))}>
                  <Wand2 className="size-4" /> Start from the {TRACK[str(l.track)] ?? "professionals"} template
                </Button>
              ) : undefined
            }
          >
            {plan.length === 0 ? (
              <p className="text-sm text-charcoal">No plan yet.</p>
            ) : (
              <ol className="space-y-2">
                {plan.map((w) => (
                  <li key={w.id} className={cn("rounded-[var(--radius-sm)] border p-3", w.done ? "border-ok/25 bg-ok/5" : "border-graphite/12 bg-paper")}>
                    <div className="flex items-start gap-3">
                      <button type="button" disabled={!canWrite} onClick={() => setPlan(plan.map((x) => (x.id === w.id ? { ...x, done: !x.done } : x)))} aria-label={w.done ? "Mark not done" : "Mark done"} className="mt-1">
                        {w.done ? <CheckCircle2 className="size-5 text-ok" /> : <Circle className="size-5 text-blueprint" />}
                      </button>
                      <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-[52px_1fr]">
                        <span className="font-mono text-xs font-semibold text-blueprint">Wk {String(w.week).padStart(2, "0")}</span>
                        <div className="grid gap-1.5">
                          {canWrite ? (
                            <>
                              <Input aria-label="Focus" value={w.focus} onChange={(e) => setPlan(plan.map((x) => (x.id === w.id ? { ...x, focus: e.target.value } : x)))} className="h-8 font-medium" />
                              <div className="grid gap-1.5 sm:grid-cols-2">
                                <Input aria-label="Tools" value={w.tools} placeholder="Tools" onChange={(e) => setPlan(plan.map((x) => (x.id === w.id ? { ...x, tools: e.target.value } : x)))} className="h-8 text-xs" />
                                <Input aria-label="Outcome" value={w.outcome} placeholder="They can show…" onChange={(e) => setPlan(plan.map((x) => (x.id === w.id ? { ...x, outcome: e.target.value } : x)))} className="h-8 text-xs" />
                              </div>
                            </>
                          ) : (
                            <>
                              <p className="text-sm font-medium text-graphite">{w.focus}</p>
                              <p className="text-xs text-charcoal">{w.tools} → {w.outcome}</p>
                            </>
                          )}
                        </div>
                      </div>
                      {canWrite && (
                        <button type="button" onClick={() => setPlan(plan.filter((x) => x.id !== w.id).map((x, i) => ({ ...x, week: i + 1 })))} className="rounded p-1 text-blueprint hover:text-bad" aria-label="Remove week">
                          <Trash2 className="size-3.5" />
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            )}
            {canWrite && plan.length > 0 && (
              <Button size="sm" variant="ghost" className="mt-3" onClick={() => setPlan([...plan, { id: uid("wk"), week: plan.length + 1, focus: "", tools: "", outcome: "", done: false }])}>
                <Plus className="size-4" /> Add a week
              </Button>
            )}
          </Panel>

          <Panel
            title="Sessions"
            subtitle={`${sessions.length} logged`}
            action={
              canWrite && (
                <Button size="sm" onClick={() => setSessionDraft({ learnerId: l.id, number: nextNumber(sessions), status: "scheduled", date: isoDate(), minutes: 60, coach: str(l.coach) || user.name, topic: plan.find((w) => !w.done)?.focus ?? "" })}>
                  <Plus className="size-4" /> Schedule / log a session
                </Button>
              )
            }
          >
            {sessions.length === 0 ? (
              <p className="text-sm text-charcoal">No sessions yet.</p>
            ) : (
              <ul className="divide-y divide-graphite/10">
                {[...sessions].reverse().map((s) => (
                  <li key={s.id}>
                    <button type="button" onClick={() => setSessionDraft({ ...s })} className="flex w-full items-start gap-3 py-3 text-left hover:bg-graphite/[0.02]">
                      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-graphite font-mono text-[11px] font-semibold text-lime">{num(s.number) || "·"}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-graphite">{str(s.topic) || "Session"}</span>
                        <span className="block text-xs text-blueprint">
                          {longDate(s.date)}
                          {s.time ? ` · ${str(s.time)}` : ""} · {num(s.minutes) || 60} min
                        </span>
                        {s.homework ? <span className="mt-1 block text-xs text-charcoal">Practice: {str(s.homework)}</span> : null}
                        {s.learnerWin ? <span className="mt-1 block text-xs font-medium text-ok">Win: {str(s.learnerWin)}</span> : null}
                      </span>
                      <Badge tone={statusTone(s.status === "done" ? "done" : s.status)}>{str(s.status)}</Badge>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>

        <aside className="space-y-6">
          <Panel title="Profile">
            <KV k="Age track" v={TRACK[str(l.track)] ?? "—"} />
            <KV k="City" v={str(l.city) || "—"} />
            <KV k="Usual slot" v={str(l.schedule) || "—"} />
            <KV k="Started" v={l.startDate ? shortDate(l.startDate) : "—"} />
            {l.guardian ? <KV k="Parent / guardian" v={str(l.guardian)} /> : null}
            {l.meetLink ? <KV k="Meeting link" v={<a className="underline" href={str(l.meetLink)} target="_blank" rel="noopener noreferrer">Open</a>} /> : null}
            <ContactButtons className="mt-3" size="sm" phone={l.phone} email={l.email} whatsappText={`Hi ${str(l.name).split(" ")[0]}, this is ${user.name} from FrameMind AI Studio — `} emailSubject="Your AI coaching — FrameMind AI Studio" />
          </Panel>
          {!!(l.goals || l.dailyWork || l.knowsAlready) && (
            <Panel title="What we mapped">
              {l.goals ? <p className="text-sm"><strong className="text-graphite">Goals:</strong> <span className="whitespace-pre-line text-charcoal">{str(l.goals)}</span></p> : null}
              {l.dailyWork ? <p className="mt-2 text-sm"><strong className="text-graphite">Daily work:</strong> <span className="whitespace-pre-line text-charcoal">{str(l.dailyWork)}</span></p> : null}
              {l.knowsAlready ? <p className="mt-2 text-sm"><strong className="text-graphite">Already knows:</strong> <span className="whitespace-pre-line text-charcoal">{str(l.knowsAlready)}</span></p> : null}
            </Panel>
          )}
          <Panel title="Completion">
            {cert ? (
              <div>
                <p className="text-sm text-charcoal">
                  Certificate <span className="font-mono font-semibold text-graphite">{str(cert.code)}</span> issued {shortDate(cert.issueDate)}.
                </p>
                <Button size="sm" variant="secondary" className="mt-3" href="/hq/certificates">
                  <Award className="size-4" /> Open certificates
                </Button>
              </div>
            ) : (
              <div>
                <p className="text-sm text-charcoal">At day 90, review their results, record the hours saved, then issue the completion certificate (verifiable by its code).</p>
                {canWrite && (
                  <Button size="sm" className="mt-3" onClick={issueCertificate} disabled={busy}>
                    {busy ? <Loader2 className="size-4 animate-spin" /> : <Award className="size-4" />} Issue completion certificate
                  </Button>
                )}
              </div>
            )}
          </Panel>
          {l.notes ? (
            <Panel title="Coach's notes">
              <p className="whitespace-pre-line text-sm text-graphite">{str(l.notes)}</p>
            </Panel>
          ) : null}
        </aside>
      </div>

      {editing && <RecordDrawer name="learners" initial={editing} onClose={() => setEditing(null)} />}
      {sessionDraft && <RecordDrawer name="coachingSessions" initial={sessionDraft} onClose={() => setSessionDraft(null)} />}
    </div>
  );
}
