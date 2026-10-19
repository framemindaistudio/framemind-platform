"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getCollection } from "@/lib/hq/collections";
import { can, type SessionUser } from "@/lib/hq/roles";
import { AREA_LABEL, AREA_SOURCE, buildReminders, countByLevel, type Reminder, type ReminderArea, type ReminderLevel, type SignsOf } from "@/lib/hq/reminders";
import { cn } from "@/lib/utils";
import { useCollection, useHq } from "@/components/hq/data";
import { Widget, WidgetEmpty, WidgetSkeleton } from "./Widget";

/** Collection name if the signed-in role may read it, else a never-fetched placeholder. */
function readable(user: SessionUser, name: string) {
  const def = getCollection(name);
  return def && can(user, def.read) ? name : `__none_${name}`;
}

const LEVEL: Record<ReminderLevel, { label: string; dot: string; row: string }> = {
  overdue: { label: "Overdue", dot: "bg-bad", row: "bg-bad/[0.035] shadow-[inset_2px_0_0_var(--color-bad)]" },
  today: { label: "Today", dot: "bg-graphite", row: "" },
  soon: { label: "Coming up", dot: "border border-graphite/40", row: "" },
};
const SHOW = 8;

/**
 * "Today": everything that needs someone, from every section HQ keeps, overdue first.
 * The same list goes to the founders by email each morning (src/app/api/cron/digest).
 */
export function TodayReminders({ index, today }: { index: string; today: string }) {
  const { user } = useHq();
  const leads = useCollection(readable(user, "leads"));
  const clients = useCollection(readable(user, "clients"));
  const proposals = useCollection(readable(user, "proposals"));
  const projects = useCollection(readable(user, "projects"));
  const deliverables = useCollection(readable(user, "deliverables"));
  const shoots = useCollection(readable(user, "shoots"));
  const coachingSessions = useCollection(readable(user, "coachingSessions"));
  const learners = useCollection(readable(user, "learners"));
  const vrittaLicences = useCollection(readable(user, "vrittaLicences"));
  const invoices = useCollection(readable(user, "invoices"));
  const tasks = useCollection(readable(user, "tasks"));
  const signDocs = useCollection(readable(user, "signDocs"));
  const contentCalendar = useCollection(readable(user, "contentCalendar"));
  const subscriptions = useCollection(readable(user, "subscriptions"));
  const all = [leads, clients, proposals, projects, deliverables, shoots, coachingSessions, learners, vrittaLicences, invoices, tasks, signDocs, contentCalendar, subscriptions];
  const loading = all.some((c) => c.loading);

  // who signs which paper comes from the templates, loaded only for people who see papers
  const [signsOf, setSignsOf] = useState<SignsOf | undefined>(undefined);
  const seesPapers = can(user, getCollection("signDocs")?.read ?? []);
  useEffect(() => {
    if (!seesPapers) return;
    let alive = true;
    import("@/lib/sign/catalog").then((m) => alive && setSignsOf(() => (id: string) => m.templateById(id)?.signs ?? "both"));
    return () => {
      alive = false;
    };
  }, [seesPapers]);

  const [open, setOpen] = useState(false);
  const [area, setArea] = useState<ReminderArea | "all">("all");

  const list = useMemo(() => {
    if (!today || loading || (seesPapers && !signsOf)) return null;
    const allowed = (a: ReminderArea) => can(user, getCollection(AREA_SOURCE[a])?.read ?? []);
    return buildReminders(
      {
        leads: leads.records,
        clients: clients.records,
        proposals: proposals.records,
        projects: projects.records,
        deliverables: deliverables.records,
        shoots: shoots.records,
        coachingSessions: coachingSessions.records,
        learners: learners.records,
        vrittaLicences: vrittaLicences.records,
        invoices: invoices.records,
        tasks: tasks.records,
        signDocs: signDocs.records,
        contentCalendar: contentCalendar.records,
        subscriptions: subscriptions.records,
      },
      today,
      { signsOf },
    ).filter((r) => allowed(r.area));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the collections are listed one by one below
  }, [today, loading, signsOf, seesPapers, user, leads.records, clients.records, proposals.records, projects.records, deliverables.records, shoots.records, coachingSessions.records, learners.records, vrittaLicences.records, invoices.records, tasks.records, signDocs.records, contentCalendar.records, subscriptions.records]);

  const counts = list ? countByLevel(list) : { overdue: 0, today: 0, soon: 0 };
  const areas = useMemo(() => (list ? [...new Set(list.map((r) => r.area))] : []), [list]);
  const filtered = list ? list.filter((r) => area === "all" || r.area === area) : [];
  const shown = open ? filtered : filtered.slice(0, SHOW);

  const subtitle = !list
    ? "Gathering today's list…"
    : !list.length
      ? "Nothing needs anyone today"
      : [counts.overdue && `${counts.overdue} overdue`, counts.today && `${counts.today} for today`, counts.soon && `${counts.soon} coming up`].filter(Boolean).join(" · ");

  return (
    <Widget index={index} title="Today" subtitle={subtitle} icon="BellRing" count={counts.overdue + counts.today} countTone={counts.overdue ? "bad" : "neutral"} className="scroll-mt-24" bodyClassName="p-0">
      <div id="today" />
      {!list ? (
        <WidgetSkeleton rows={4} />
      ) : !list.length ? (
        <WidgetEmpty icon="CheckCheck" title="All clear" hint="Overdue follow-ups, unpaid invoices, papers to sign, deliveries, shoots and today's posts show up here." />
      ) : (
        <>
          {areas.length > 1 && (
            <div className="flex flex-wrap gap-1.5 border-b border-graphite/[0.07] px-4 py-2.5 sm:px-5" role="group" aria-label="Show reminders for">
              {(["all", ...areas] as const).map((a) => (
                <button
                  key={a}
                  type="button"
                  aria-pressed={area === a}
                  onClick={() => setArea(a)}
                  className={cn("rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors", area === a ? "bg-graphite text-paper" : "text-charcoal hover:bg-graphite/[0.06]")}
                >
                  {a === "all" ? `All ${list.length}` : `${AREA_LABEL[a]} ${list.filter((r) => r.area === a).length}`}
                </button>
              ))}
            </div>
          )}
          <ul className="divide-y divide-graphite/[0.07]" data-reminders>
            {shown.map((r) => (
              <ReminderRow key={r.key} r={r} />
            ))}
          </ul>
          {filtered.length > SHOW && (
            <button type="button" onClick={() => setOpen((v) => !v)} className="w-full border-t border-graphite/[0.07] px-4 py-2.5 text-center text-xs font-semibold text-charcoal hover:bg-graphite/[0.035] hover:text-graphite">
              {open ? "Show fewer" : `Show all ${filtered.length}`}
            </button>
          )}
        </>
      )}
    </Widget>
  );
}

function ReminderRow({ r }: { r: Reminder }) {
  const lv = LEVEL[r.level];
  return (
    <li className={lv.row} data-level={r.level}>
      <Link href={r.href} className="group flex items-start gap-3 px-4 py-3 transition-colors hover:bg-graphite/[0.035] focus-visible:bg-graphite/[0.05] sm:px-5">
        <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", lv.dot)} aria-hidden />
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold leading-snug text-graphite group-hover:underline group-hover:underline-offset-4">{r.title}</span>
          <span className="mt-0.5 block text-xs leading-snug text-charcoal">{r.detail}</span>
        </span>
        <span className="flex shrink-0 flex-col items-end gap-1 text-right">
          <span className={cn("text-[10px] font-semibold uppercase tracking-wider", r.level === "overdue" ? "text-bad" : "text-blueprint")}>{lv.label}</span>
          <span className="font-mono text-[10px] text-blueprint">{AREA_LABEL[r.area]}</span>
        </span>
      </Link>
    </li>
  );
}
