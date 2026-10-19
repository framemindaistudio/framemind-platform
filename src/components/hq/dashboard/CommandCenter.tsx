"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useMemo } from "react";
import { motion, MotionConfig } from "motion/react";
import { FolderKanban, IndianRupee, Inbox, Layers, ListChecks, TrendingUp, Wallet, X } from "lucide-react";
import { can, roleLabels, OPS, type Role } from "@/lib/hq/roles";
import { getCollection } from "@/lib/hq/collections";
import { StatCard } from "@/components/hq/ui";
import { cn, formatINR, formatINRCompact, formatNumber } from "@/lib/utils";
import { useDashboard } from "./useDashboard";
import { DashboardHero, type Attention } from "./DashboardHero";
import { GettingStarted, type SetupStep } from "./GettingStarted";
import { QuickActions } from "./QuickActions";
import { TodayReminders } from "./Reminders";
import { Widget } from "./Widget";
import { DeliverablesDue, FollowUps, MyTasks, Receivables, RecentLeads, ThisWeek, UpcomingDeliveries } from "./widgets";

const RevenueChart = dynamic(() => import("./RevenueChart"), {
  ssr: false,
  loading: () => <div className="m-4 h-[260px] animate-pulse rounded-[var(--radius-sm)] bg-graphite/[0.05]" aria-hidden />,
});

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

function canRead(role: Role, name: string) {
  const def = getCollection(name);
  return !!def && def.read.includes(role);
}

const rise = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const } },
};

export function CommandCenter({ denied }: { denied?: boolean }) {
  const dash = useDashboard();
  const { user, store, now, money, leadership, settings, d, collections: c } = dash;
  const role = user.role;
  const today = d?.today ?? "";

  const sees = {
    sales: can(user, OPS),
    leads: canRead(role, "leads"),
    week: canRead(role, "shoots") || canRead(role, "coachingSessions"),
    tasksWrite: store.writable && !!getCollection("tasks")?.write.includes(role),
  };

  const target = Number(settings.monthlyRevenueTarget) || 0;
  const projTarget = Number(settings.projectsPerMonthTarget) || 0;

  /* ── needs-attention chips ── */
  const attention: Attention[] = useMemo(() => {
    if (!d) return [];
    const out: Attention[] = [];
    if (sees.sales && d.followUpsOverdue.length) out.push({ id: "fu", label: `${plural(d.followUpsOverdue.length, "follow-up")} overdue`, href: "/hq/crm", urgent: true });
    if (money && d.recv.overdue.length) out.push({ id: "inv", label: `${plural(d.recv.overdue.length, "invoice")} overdue · ${formatINRCompact(d.recv.overdueBalance)}`, href: "/hq/finance", urgent: true });
    if (d.myTasksDue.length) out.push({ id: "tsk", label: `${plural(d.myTasksDue.length, "task")} due today or late`, href: "/hq/tasks", urgent: true });
    if (d.upcomingLate.length) out.push({ id: "late", label: `${plural(d.upcomingLate.length, "project")} past delivery`, href: "/hq/projects", urgent: true });
    if (d.dueOverdue.length) out.push({ id: "dlv", label: `${plural(d.dueOverdue.length, "deliverable")} overdue`, href: "/hq/production", urgent: true });
    if (d.upcomingWeek.length) out.push({ id: "wk", label: `${plural(d.upcomingWeek.length, "delivery", "deliveries")} this week`, href: "/hq/projects" });
    if (d.week.length) out.push({ id: "shoot", label: `${plural(d.week.length, "shoot or session", "shoots and sessions")} this week`, href: "/hq/shoots" });
    if (sees.leads && d.newLeads.length) out.push({ id: "lead", label: `${plural(d.newLeads.length, "new enquiry", "new enquiries")}`, href: "/hq/leads" });
    return out;
  }, [d, money, sees.sales, sees.leads]);

  /* ── pacing dial ── */
  const dial = useMemo(() => {
    if (!d) return null;
    if (money && target > 0) {
      const v = d.revenue.total / target;
      return { value: v, center: `${Math.round(v * 100)}%`, caption: "of revenue target" };
    }
    if (projTarget > 0) {
      const v = d.projMonth.delivered / projTarget;
      return { value: v, center: `${d.projMonth.delivered}/${projTarget}`, caption: "projects delivered" };
    }
    return null;
  }, [d, money, target, projTarget]);

  const paceNote = useMemo(() => {
    if (!d || !money || target <= 0) return undefined;
    const expected = (target * d.dayOfMonth) / d.daysInMonth;
    const gap = Math.round(expected - d.revenue.total);
    return gap > 0 ? `${formatINRCompact(gap)} behind a straight-line pace to ${formatINRCompact(target)}.` : `On pace — ${formatINRCompact(-gap)} ahead of a straight-line month.`;
  }, [d, money, target]);

  /* ── first-run checklist ── */
  const loadingCore = c.clients.loading || c.projects.loading;
  const fresh = !loadingCore && c.clients.records.length === 0 && c.projects.records.length === 0;
  const steps: SetupStep[] = useMemo(() => {
    const s = settings;
    const list: SetupStep[] = [];
    if (leadership) {
      list.push(
        { id: "store", title: "Connect GitHub storage", detail: store.mode === "github" ? `Every save is a commit to ${store.repo ?? "the repo"}.` : store.mode === "local" ? "Local dev mode — data is saved to the project folder. Add GITHUB_TOKEN + GITHUB_REPO on Vercel." : "Read-only — add GITHUB_TOKEN + GITHUB_REPO in Vercel to enable saving.", href: "/hq/settings#system", cta: "System status", done: store.mode === "github" },
        { id: "users", title: "Add HQ accounts for the team", detail: dash.userCount === null ? "Checking configured logins…" : `${plural(dash.userCount, "login")} configured in HQ_USERS.`, href: "/hq/settings#team", cta: "Team accounts", done: dash.userCount === null ? null : dash.userCount >= 2 },
        { id: "company", title: "Complete the company profile", detail: "Address, phone, email and Udyam number print on every invoice, quote and paper.", href: "/hq/settings#company", cta: "Company profile", done: !!(s.addressLine1 && s.city && s.pincode && s.phone && s.email) },
        { id: "bank", title: "Add tax & bank details", detail: "PAN / GSTIN (once registered) and bank or UPI details for invoice payments.", href: "/hq/settings#tax", cta: "Tax & bank", done: !!(s.pan && (s.upiId || (s.bankAccountNumber && s.bankIfsc))) },
      );
    }
    list.push(
      { id: "team", title: "Add the team", detail: "Founders, designers, developers, editors, coaches and freelancers — then send their papers from Documents to Sign.", href: "/hq/team", cta: "Team", done: c.team.records.length >= 2 },
      { id: "rates", title: "Check the rate card", detail: "Every service and option from the website's pricing page is already in. Set your coaching fees.", href: "/hq/prices", cta: "Rate Card", done: null },
      { id: "clients", title: "Add your clients and live enquiries", detail: "Every business you are talking to, with a follow-up date — and every WhatsApp or Instagram enquiry in Enquiries.", href: "/hq/crm", cta: "Clients CRM", done: c.clients.records.length > 0 },
      { id: "projects", title: "Put live work into Projects", detail: "Each project gets the studio checklist for its services, the client-inputs list and its payment milestones.", href: "/hq/projects", cta: "Projects", done: c.projects.records.length > 0 },
      { id: "tasks", title: "Share the to-do board", detail: "Everyone's tasks in one place, with due dates and who owns them.", href: "/hq/tasks", cta: "Tasks", done: c.tasks.records.some((t) => String(t.status) === "done") },
    );
    return list;
  }, [settings, leadership, store, dash.userCount, c.team.records, c.clients.records, c.projects.records, c.tasks.records]);

  const nowMs = now?.ms ?? 0;
  const finLoading = c.invoices.loading || c.income.loading;

  /* ── KPI tiles ── */
  const kpis: React.ReactNode[] = [];
  if (d) {
    if (money) {
      kpis.push(
        <StatCard
          key="rev"
          tone="dark"
          label="Revenue · this month"
          icon={<IndianRupee className="size-4" aria-hidden />}
          value={finLoading ? "…" : formatINR(d.revenue.total)}
          sub={target > 0 ? `of ${formatINRCompact(target)} target · ex-GST receipts${d.revenue.other ? ` + ${formatINRCompact(d.revenue.other)} other` : ""}` : "Set a monthly target in Settings"}
          progress={target > 0 ? d.revenue.total / target : undefined}
        />,
      );
    }
    kpis.push(
      <StatCard
        key="proj"
        label="Live projects"
        icon={<FolderKanban className="size-4" aria-hidden />}
        value={c.projects.loading ? "…" : `${d.projMonth.live}`}
        sub={`${d.projMonth.delivered} delivered this month${projTarget ? ` of ${projTarget}` : ""} · ${d.projMonth.due} due this month`}
        progress={projTarget ? d.projMonth.delivered / projTarget : undefined}
      />,
    );
    if (money) {
      kpis.push(
        <StatCard
          key="pipe"
          label="Open pipeline"
          icon={<TrendingUp className="size-4" aria-hidden />}
          value={c.clients.loading ? "…" : formatINRCompact(d.pipe.value)}
          sub={`Weighted forecast ${formatINRCompact(d.pipe.weighted)} · ${plural(d.pipe.active.length, "client")}${d.pipe.estimated ? ` · ${formatINRCompact(d.pipe.estimated)} from quotes` : ""}`}
        />,
        <StatCard
          key="recv"
          label="Receivables"
          icon={<Wallet className="size-4" aria-hidden />}
          value={c.invoices.loading ? "…" : formatINRCompact(d.recv.balance)}
          sub={d.recv.overdue.length ? `${plural(d.recv.overdue.length, "invoice")} overdue · ${formatINRCompact(d.recv.overdueBalance)}` : `${plural(d.recv.open.length, "open invoice")} · none overdue`}
        />,
      );
    } else {
      kpis.push(
        <StatCard key="dlv" label="Deliverables · 7 days" icon={<Layers className="size-4" aria-hidden />} value={formatNumber(d.dueSoon.length)} sub={d.dueOverdue.length ? `${d.dueOverdue.length} overdue` : "none overdue"} />,
        <StatCard key="tasks" label="My open tasks" icon={<ListChecks className="size-4" aria-hidden />} value={formatNumber(d.myTasks.length)} sub={d.myTasksDue.length ? `${d.myTasksDue.length} due today or late` : "nothing late"} />,
      );
    }
    if (sees.leads) {
      kpis.push(
        <StatCard
          key="leads"
          label="New enquiries"
          icon={<Inbox className="size-4" aria-hidden />}
          value={c.leads.loading ? "…" : formatNumber(d.newLeads.length)}
          sub={d.newLeads.length ? "Waiting for a first reply" : `${plural(c.leads.records.length, "enquiry", "enquiries")} in total`}
        />,
      );
    }
  }

  return (
    <MotionConfig reducedMotion="user">
      <div className="mx-auto max-w-[1440px] space-y-6">
        {denied && (
          <div role="status" className="flex items-start gap-3 rounded-[var(--radius-md)] border border-warn/30 bg-warn/10 px-4 py-3 text-sm text-warn">
            <span className="flex-1">That module isn&apos;t part of the {roleLabels[role]} role, so you were brought back here. Ask a founder if you need access.</span>
            <Link href="/hq" aria-label="Dismiss" className="rounded p-0.5 hover:bg-warn/10">
              <X className="size-4" />
            </Link>
          </div>
        )}

        <DashboardHero
          name={user.name}
          roleLabel={roleLabels[role]}
          today={now?.today ?? null}
          hour={now?.hour ?? null}
          attention={attention}
          dial={dial}
          dayOfMonth={d?.dayOfMonth ?? 1}
          daysInMonth={d?.daysInMonth ?? 30}
          paceNote={paceNote}
        />

        {fresh && can(user, OPS) && <GettingStarted steps={steps} />}

        {/* KPI row */}
        <motion.div
          className={cn("grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 lg:grid-cols-3", kpis.length === 4 ? "xl:grid-cols-4" : "xl:grid-cols-5")}
          initial="hidden"
          animate={d ? "show" : "hidden"}
          variants={{ show: { transition: { staggerChildren: 0.06 } } }}
          aria-label="Key numbers"
          role="group"
        >
          {d
            ? kpis.map((k, i) => (
                <motion.div key={i} variants={rise} className={i === 0 && money ? "min-[420px]:col-span-2 lg:col-span-1" : undefined}>
                  {k}
                </motion.div>
              ))
            : Array.from({ length: 5 }, (_, i) => <div key={i} className="h-[132px] animate-pulse rounded-[var(--radius-md)] border border-graphite/10 bg-paper-50" aria-hidden />)}
        </motion.div>

        {d && <TodayReminders index="00" today={today} />}

        {d && (
          <div className="grid gap-6 lg:grid-cols-12">
            {/* main column */}
            <div className="min-w-0 space-y-6 lg:col-span-8">
              {money && (
                <Widget index="01" title="Revenue vs expenses" subtitle="Last 6 months · revenue = invoice receipts (ex-GST) by invoice date + other income" icon="IndianRupee" href="/hq/finance" hrefLabel="P&L">
                  <RevenueChart data={d.chart} target={target} />
                </Widget>
              )}
              <UpcomingDeliveries index={money ? "02" : "01"} items={d.upcoming} today={today} loading={c.projects.loading} clients={dash.clientLookup} money={money} canPlan={can(user, OPS)} />
              {sees.sales && (
                <div className="grid gap-6 xl:grid-cols-2">
                  <FollowUps index="03" items={d.followUps} today={today} loading={c.clients.loading} />
                  <Receivables index="04" open={d.recv.open} today={today} loading={c.invoices.loading} />
                </div>
              )}
              {!money && <DeliverablesDue index="02" items={d.dueSoon} today={today} loading={c.deliverables.loading} projects={dash.projectLookup} />}
            </div>

            {/* side column */}
            <div className="min-w-0 space-y-6 lg:col-span-4">
              <QuickActions index={money ? "05" : "03"} role={role} />
              <MyTasks
                index={money ? "06" : "04"}
                items={d.myTasks}
                today={today}
                loading={c.tasks.loading}
                canWrite={sees.tasksWrite}
                onDone={(t) => c.tasks.save({ ...t, status: "done" })}
              />
              {money && <DeliverablesDue index="07" items={d.dueSoon} today={today} loading={c.deliverables.loading} projects={dash.projectLookup} />}
              {sees.week && <ThisWeek index={money ? "08" : "05"} items={d.week} today={today} loading={c.shoots.loading || c.sessions.loading} learners={dash.learnerLookup} />}
              {sees.leads && <RecentLeads index={money ? "09" : "05"} items={d.recentLeads} nowMs={nowMs} loading={c.leads.loading} newCount={d.newLeads.length} />}
            </div>
          </div>
        )}

        <p className="pt-2 text-center text-[11px] text-blueprint">
          Numbers update live from HQ records{store.mode === "github" ? " — every change is a commit in the private repo" : ""}. Targets come from{" "}
          {leadership ? (
            <Link href="/hq/settings#targets" className="underline underline-offset-2 hover:text-graphite">
              Settings → Targets
            </Link>
          ) : (
            "Settings → Targets"
          )}
          .
        </p>
      </div>
    </MotionConfig>
  );
}
