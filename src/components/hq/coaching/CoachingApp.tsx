"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Video } from "lucide-react";
import { useRouter } from "next/navigation";
import { COACHING } from "@/lib/content/catalog";
import { getCollection } from "@/lib/hq/collections";
import { can } from "@/lib/hq/roles";
import { Badge, statusTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Tabs } from "@/components/ui/Tabs";
import { CollectionManager } from "@/components/hq/CollectionManager";
import { useCollection, useHq, useShowMoney } from "@/components/hq/data";
import { RecordDrawer, blankRecord } from "@/components/hq/RecordDrawer";
import { EmptyState, Loading, PageHeader, Panel, StatCard } from "@/components/hq/ui";
import { useToday } from "@/components/hq/sales/useToday";
import { ProgressBar } from "@/components/hq/projects/bits";
import { daysBetween, num, shortDate, str } from "@/components/hq/projects/logic";
import { formatINRCompact, isoDate } from "@/lib/utils";
import { dayOf, planFor } from "./plan";

const learnersDef = getCollection("learners")!;
type Tab = "learners" | "sessions" | "programme";
const TRACK = Object.fromEntries(COACHING.tracks.map((t) => [t.id, t.label]));

export function CoachingApp({ openLearner }: { openLearner?: string }) {
  const { user, store } = useHq();
  const router = useRouter();
  const today = useToday();
  const showMoney = useShowMoney();
  const { records: learners, loading } = useCollection("learners");
  const { records: sessions } = useCollection("coachingSessions");
  const canWrite = can(user, learnersDef.write) && store.writable;
  const [tab, setTab] = useState<Tab>("learners");
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);

  const active = learners.filter((l) => ["active", "onboarding"].includes(str(l.status) || "onboarding"));
  const stats = useMemo(() => {
    const week = today ? sessions.filter((s) => str(s.date) >= today && daysBetween(today, str(s.date)) < 7 && s.status !== "cancelled").length : 0;
    const done = sessions.filter((s) => s.status === "done").length;
    const hours = learners.filter((l) => num(l.hoursSavedPerWeek) > 0);
    return {
      week,
      done,
      completed: learners.filter((l) => l.status === "completed").length,
      avgSaved: hours.length ? hours.reduce((s, l) => s + num(l.hoursSavedPerWeek), 0) / hours.length : 0,
      fees: learners.reduce((s, l) => s + num(l.fee), 0),
      unpaid: learners.reduce((s, l) => s + Math.max(0, num(l.fee) - num(l.amountPaid)), 0),
    };
  }, [learners, sessions, today]);

  const sorted = [...active].sort((a, b) => str(a.startDate).localeCompare(str(b.startDate)));
  const nextFor = (id: string) => sessions.filter((s) => s.learnerId === id && s.status === "scheduled" && today && str(s.date) >= today).sort((a, b) => str(a.date).localeCompare(str(b.date)))[0];

  return (
    <div>
      <PageHeader
        eyebrow="Coaching & Products"
        icon="GraduationCap"
        title="AI Coaching"
        description={COACHING.line}
        actions={
          canWrite ? (
            <Button size="sm" className="h-9" onClick={() => setEditing(blankRecord("learners", { coach: user.name, startDate: isoDate(), status: "onboarding" }))}>
              <Plus className="size-4" /> New learner
            </Button>
          ) : undefined
        }
      />
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard tone="dark" label="Learners on the programme" value={active.length} sub={`${stats.completed} completed so far`} />
        <StatCard label="Sessions this week" value={stats.week} sub={`${stats.done} sessions done in total`} />
        <StatCard label="Hours saved / week" value={stats.avgSaved ? stats.avgSaved.toFixed(1) : "—"} sub="Average that learners report" />
        {showMoney ? <StatCard label="Fees" value={formatINRCompact(stats.fees)} sub={stats.unpaid ? `${formatINRCompact(stats.unpaid)} still to collect` : "All collected"} /> : <StatCard label="Age tracks" value={COACHING.tracks.length} sub="10–20 · 21–35 · 36–60" />}
      </div>

      <Tabs className="mb-6" value={tab} onChange={setTab} tabs={[{ value: "learners", label: "Learners", count: active.length || undefined }, { value: "sessions", label: "Sessions" }, { value: "programme", label: "The programme" }]} />

      {tab === "learners" &&
        (loading ? (
          <Loading />
        ) : sorted.length === 0 ? (
          <EmptyState icon="GraduationCap" title="No learners on the programme" description="Turn a coaching enquiry into a learner from Enquiries, or add one here." />
        ) : (
          <>
            <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {sorted.map((l) => {
                const d = dayOf(l, today);
                const next = nextFor(l.id);
                return (
                  <li key={l.id}>
                    <Link href={`/hq/coaching/${l.id}`} className={`block h-full rounded-[var(--radius-md)] border bg-paper-50 p-4 transition-colors hover:border-graphite ${openLearner === l.id ? "border-graphite" : "border-graphite/12"}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-graphite">{str(l.name)}</p>
                          <p className="truncate text-xs text-blueprint">{[str(l.profession), TRACK[str(l.track)]].filter(Boolean).join(" · ") || "Profile to complete"}</p>
                        </div>
                        <Badge tone={statusTone(l.status)}>{str(l.status) || "onboarding"}</Badge>
                      </div>
                      <div className="mt-4">
                        <div className="mb-1 flex justify-between text-[11px] text-charcoal">
                          <span>{d.day ? `Day ${d.day} of 90` : "Not started"}</span>
                          <span>{d.end ? `Day 90: ${shortDate(d.end)}` : ""}</span>
                        </div>
                        <ProgressBar value={d.pct} />
                      </div>
                      <p className="mt-3 flex items-center gap-1.5 text-xs text-charcoal">
                        <Video className="size-3.5 text-blueprint" /> {next ? `Next: ${shortDate(next.date)}${next.time ? ` · ${str(next.time)}` : ""} — ${str(next.topic)}` : "No session scheduled"}
                      </p>
                      <p className="mt-1 text-[11px] text-blueprint">
                        {str(l.mode) === "offline" ? "Offline" : "Online"} · coach {str(l.coach) || "—"}
                      </p>
                    </Link>
                  </li>
                );
              })}
            </ul>
            <div className="mt-8">
              <h2 className="annot mb-3 text-blueprint">Every learner</h2>
              <CollectionManager name="learners" columns={["name", "status", "track", "mode", "coach", "startDate"]} hideNew emptyText="No learners yet." onOpen={(r) => router.push(`/hq/coaching/${r.id}`)} />
            </div>
          </>
        ))}

      {tab === "sessions" && <CollectionManager name="coachingSessions" columns={["date", "learnerId", "number", "topic", "status"]} defaults={{ status: "scheduled", coach: user.name, minutes: 60 }} newLabel="Schedule a session" emptyText="Sessions are logged from each learner's page." />}

      {tab === "programme" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Panel title="How the 90 days work">
            <ul className="space-y-3 text-sm text-charcoal">
              <li><strong className="text-graphite">Starts with them, not a syllabus.</strong> Before session one, map their profession, daily work, goals and what they already know.</li>
              <li><strong className="text-graphite">Applied to their real life.</strong> Practise on their actual emails, reports, projects and clients — never toy examples.</li>
              <li><strong className="text-graphite">Results by week 2.</strong> Aim for visible time saved by session 4; record the hours they report.</li>
              <li><strong className="text-graphite">Always 1:1.</strong> No cohorts or old recordings — every session is live and about their questions.</li>
              <li><strong className="text-graphite">Online or offline.</strong> Online via Google Meet or Zoom with the recording shared after; offline at a FrameMind venue or their home/office.</li>
            </ul>
          </Panel>
          <Panel title="Plan templates by track">
            {COACHING.tracks.map((t) => (
              <details key={t.id} className="border-b border-dashed border-graphite/15 py-2 last:border-0">
                <summary className="cursor-pointer text-sm font-semibold text-graphite">
                  {t.label} <span className="font-normal text-blueprint">· {t.who}</span>
                </summary>
                <ol className="mt-2 space-y-1 pl-5 text-xs text-charcoal">
                  {planFor(t.id).map((w) => (
                    <li key={w.week} className="list-decimal">
                      {w.focus} <span className="text-blueprint">→ {w.outcome}</span>
                    </li>
                  ))}
                </ol>
              </details>
            ))}
            <p className="mt-3 text-[11px] text-blueprint">Starting drafts — each learner&apos;s plan is rewritten around their profession on their page. The full curriculum lives in the library (09_AI_COACHING).</p>
          </Panel>
        </div>
      )}

      {editing && <RecordDrawer name="learners" initial={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}
