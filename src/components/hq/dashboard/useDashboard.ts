"use client";

import { useEffect, useMemo, useState } from "react";
import { getCollection, type BaseRecord } from "@/lib/hq/collections";
import { can, LEADERSHIP, OPS, type SessionUser } from "@/lib/hq/roles";
import { api, useCollection, useHq, useSettings } from "@/components/hq/data";
import { compareTasks, deliverablesDue, expensesForMonth, followUpsDue, isMine, isOverdueInvoice, pipeline, projectsInMonth, receivables, revenueForMonth, thisWeek, upcomingDeliveries } from "./metrics";
import { addDays, lastMonths, monthLabel, useNow } from "./time";

/** Collection name if the signed-in role may read it, else a never-fetched placeholder. */
function readable(user: SessionUser, name: string) {
  const def = getCollection(name);
  return def && can(user, def.read) ? name : `__none_${name}`;
}

export interface ChartRow {
  month: string;
  label: string;
  revenue: number;
  expenses: number;
}

/**
 * Everything the Command Center needs, derived from the shared collection cache.
 * Collections the role cannot read are never requested (no 403 noise),
 * and money is only computed for founder / admin / ops.
 */
export function useDashboard() {
  const { user, store } = useHq();
  const now = useNow();
  const money = can(user, OPS);
  const leadership = can(user, LEADERSHIP);

  const projects = useCollection(readable(user, "projects"));
  const tasks = useCollection(readable(user, "tasks"));
  const deliverables = useCollection(readable(user, "deliverables"));
  const clients = useCollection(readable(user, "clients"));
  const quotes = useCollection(money ? "proposals" : "__none_proposals");
  const leads = useCollection(readable(user, "leads"));
  const shoots = useCollection(readable(user, "shoots"));
  const sessions = useCollection(readable(user, "coachingSessions"));
  const learners = useCollection(readable(user, "learners"));
  const team = useCollection(readable(user, "team"));
  const invoices = useCollection(money ? "invoices" : "__none_invoices");
  const expenses = useCollection(money ? "expenses" : "__none_expenses");
  const income = useCollection(money ? "income" : "__none_income");
  const { settings, loading: settingsLoading } = useSettings();

  /* HQ login count — leadership only (the endpoint is LEADERSHIP-gated). */
  const [userCount, setUserCount] = useState<number | null>(null);
  useEffect(() => {
    if (!leadership) return;
    let alive = true;
    api<{ users: unknown[] }>("/api/hq/users")
      .then((j) => alive && setUserCount(j.users.length))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [leadership]);

  const derived = useMemo(() => {
    if (!now) return null;
    const today = now.today;
    const month = today.slice(0, 7);
    const in3 = addDays(today, 3);
    const in7 = addDays(today, 7);
    const in30 = addDays(today, 30);

    const revenue = revenueForMonth(month, invoices.records, income.records);
    const projMonth = projectsInMonth(projects.records, month);
    const pipe = pipeline(clients.records, quotes.records);
    const recv = receivables(invoices.records, today);
    const newLeads = leads.records.filter((l) => String(l.status ?? "new") === "new");

    const upcoming = upcomingDeliveries(projects.records, in30);
    const followUps = followUpsDue(clients.records, in3);
    const dueSoon = deliverablesDue(deliverables.records, in7);
    const week = thisWeek(shoots.records, sessions.records, today, in7);
    const myTasks = tasks.records.filter((t) => String(t.status) !== "done" && isMine(t.assignee, user)).sort(compareTasks);
    const recentLeads = [...leads.records].sort((a, b) => String(b.createdAt ?? "").localeCompare(String(a.createdAt ?? ""))).slice(0, 5);

    const chart: ChartRow[] = lastMonths(today, 6).map((m) => ({
      month: m,
      label: monthLabel(m),
      revenue: revenueForMonth(m, invoices.records, income.records).total,
      expenses: expensesForMonth(m, expenses.records),
    }));

    const [y, mo, d] = today.split("-").map(Number);
    const daysInMonth = new Date(y, mo, 0).getDate();

    return {
      today,
      month,
      dayOfMonth: d,
      daysInMonth,
      revenue,
      projMonth,
      pipe,
      recv,
      newLeads,
      upcoming,
      upcomingLate: upcoming.filter((p) => String(p.dueDate).slice(0, 10) < today),
      upcomingWeek: upcoming.filter((p) => String(p.dueDate) <= in7),
      followUps,
      followUpsOverdue: followUps.filter((x) => String(x.nextFollowUp).slice(0, 10) < today),
      dueSoon,
      dueOverdue: dueSoon.filter((j) => String(j.dueDate).slice(0, 10) < today),
      week,
      myTasks,
      myTasksDue: myTasks.filter((t) => t.dueDate && String(t.dueDate).slice(0, 10) <= today),
      recentLeads,
      chart,
      overdueInvoices: invoices.records.filter((i) => isOverdueInvoice(i, today)),
    };
  }, [now, invoices.records, income.records, expenses.records, projects.records, clients.records, quotes.records, leads.records, deliverables.records, shoots.records, sessions.records, tasks.records, user]);

  const clientLookup = useMemo(() => new Map<string, BaseRecord>(clients.records.map((r) => [r.id, r])), [clients.records]);
  const projectLookup = useMemo(() => new Map<string, BaseRecord>(projects.records.map((r) => [r.id, r])), [projects.records]);
  const learnerLookup = useMemo(() => new Map<string, BaseRecord>(learners.records.map((r) => [r.id, r])), [learners.records]);

  return {
    user,
    store,
    now,
    money,
    leadership,
    settings,
    settingsLoading,
    userCount,
    d: derived,
    clientLookup,
    projectLookup,
    learnerLookup,
    collections: { projects, tasks, deliverables, clients, leads, shoots, sessions, team, invoices, expenses, income },
  };
}

export type Dashboard = ReturnType<typeof useDashboard>;
