/**
 * Reminders: everything in HQ that needs someone today, from every section, in one list.
 * The Command Center shows it, and the morning email sends it to the founders, so both always say the same.
 * Pure functions only; callers pass the records the person may read.
 */
import { invoiceTotals, type BaseRecord } from "@/lib/hq/collections";
import { formatINR } from "@/lib/utils";

export type ReminderLevel = "overdue" | "today" | "soon";
export type ReminderArea = "leads" | "followups" | "quotes" | "projects" | "production" | "shoots" | "coaching" | "vritta" | "invoices" | "tasks" | "papers" | "social" | "tools" | "incentives";

export interface Reminder {
  key: string;
  area: ReminderArea;
  level: ReminderLevel;
  title: string;
  detail: string;
  /** path inside HQ */
  href: string;
  /** the date it is about (YYYY-MM-DD), for sorting */
  date: string;
}

export const AREA_LABEL: Record<ReminderArea, string> = {
  leads: "Enquiries",
  followups: "Follow-ups",
  quotes: "Quotes",
  projects: "Projects",
  production: "Production",
  shoots: "Shoots",
  coaching: "Coaching",
  vritta: "Vritta",
  invoices: "Money owed",
  tasks: "Tasks",
  papers: "Papers to sign",
  social: "Social media",
  tools: "Renewals",
  incentives: "Team incentives",
};

/** The collection each area is built from: someone who cannot read it does not get its reminders. */
export const AREA_SOURCE: Record<ReminderArea, string> = {
  leads: "leads",
  followups: "clients",
  quotes: "proposals",
  projects: "projects",
  production: "deliverables",
  shoots: "shoots",
  coaching: "coachingSessions",
  vritta: "vrittaLicences",
  invoices: "invoices",
  tasks: "tasks",
  papers: "signDocs",
  social: "contentCalendar",
  tools: "subscriptions",
  // founder and admin only: the area follows who can read incentive payouts
  incentives: "incentivePayouts",
};

export interface ReminderData {
  leads?: BaseRecord[];
  clients?: BaseRecord[];
  proposals?: BaseRecord[];
  projects?: BaseRecord[];
  deliverables?: BaseRecord[];
  shoots?: BaseRecord[];
  coachingSessions?: BaseRecord[];
  learners?: BaseRecord[];
  vrittaLicences?: BaseRecord[];
  invoices?: BaseRecord[];
  tasks?: BaseRecord[];
  signDocs?: BaseRecord[];
  contentCalendar?: BaseRecord[];
  subscriptions?: BaseRecord[];
  incentivePayouts?: BaseRecord[];
  incentivePolicies?: BaseRecord[];
}

const s = (v: unknown) => (v === undefined || v === null ? "" : String(v));
const day = (v: unknown) => (/^\d{4}-\d{2}-\d{2}/.test(s(v)) ? s(v).slice(0, 10) : "");
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function addDaysIso(iso: string, n: number) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
const daysBetween = (a: string, b: string) => Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000);
/** "today", "tomorrow", "3 days ago", "on 21 Oct" */
export function whenLabel(date: string, today: string) {
  if (!date) return "";
  const d = daysBetween(today, date);
  if (d === 0) return "today";
  if (d === 1) return "tomorrow";
  if (d === -1) return "yesterday";
  if (d < 0) return `${-d} days ago`;
  const [, m, dd] = date.split("-").map(Number);
  return `on ${dd} ${MONTHS[m - 1]}`;
}
const levelFor = (date: string, today: string): ReminderLevel => (date < today ? "overdue" : date === today ? "today" : "soon");

const isOpenInvoice = (inv: BaseRecord) => !["draft", "cancelled", "paid"].includes(s(inv.status)) && invoiceTotals(inv).balance > 0.5;
const isOverdueInvoice = (inv: BaseRecord, today: string) => isOpenInvoice(inv) && (s(inv.status) === "overdue" || (!!day(inv.dueDate) && day(inv.dueDate) < today));
const CLOSED_PROJECT = ["completed", "cancelled", "support"];
const DONE_DELIVERABLE = ["approved", "delivered"];

/** Today in India (YYYY-MM-DD), whatever clock the server keeps. */
export function indiaToday(now = new Date()) {
  return new Date(now.getTime() + 330 * 60_000).toISOString().slice(0, 10);
}

/** Who signs a paper: both sides, only the studio, or only the other party. Comes from the paper's template. */
export type SignsOf = (templateId: string) => "both" | "studio" | "party";

export function buildReminders(data: ReminderData, today: string, o: { signsOf?: SignsOf } = {}): Reminder[] {
  const out: Reminder[] = [];
  const add = (r: Reminder) => out.push(r);
  const in1 = addDaysIso(today, 1);
  const in3 = addDaysIso(today, 3);
  const clientName = new Map((data.clients ?? []).map((x) => [x.id, s(x.name)]));
  const projectById = new Map((data.projects ?? []).map((p) => [p.id, p]));
  const learnerName = new Map((data.learners ?? []).map((l) => [l.id, s(l.name)]));

  /* enquiries waiting for a first reply */
  for (const l of data.leads ?? []) {
    if ((s(l.status) || "new") !== "new") continue;
    const got = indiaToday(new Date(s(l.createdAt) || Date.now()));
    const kind = l.kind === "careers" ? "application" : l.kind === "coaching" ? "coaching enquiry" : l.kind === "vritta" ? "Vritta enquiry" : "enquiry";
    add({ key: `lead:${l.id}`, area: "leads", level: got < today ? "overdue" : "today", title: `Reply to ${s(l.name) || "a new enquiry"}`, detail: `${kind[0].toUpperCase()}${kind.slice(1)} received ${whenLabel(got, today)}${l.organisation ? ` · ${s(l.organisation)}` : ""}${l.channel ? ` · ${s(l.channel)}` : ""}`, href: "/hq/leads", date: got });
  }

  /* client follow-ups */
  for (const x of (data.clients ?? []).filter((c) => day(c.nextFollowUp) && day(c.nextFollowUp) <= in1 && !["lost", "nurture"].includes(s(c.stage)))) {
    const d = day(x.nextFollowUp);
    add({ key: `follow:${x.id}`, area: "followups", level: levelFor(d, today), title: `Follow up with ${s(x.name)}`, detail: [x.contactName ? s(x.contactName) : "", `due ${whenLabel(d, today)}`].filter(Boolean).join(" · "), href: `/hq/crm/${x.id}`, date: d });
  }

  /* quotes: answers running out, and accepted ones without a project */
  for (const q of data.proposals ?? []) {
    const status = s(q.status);
    const name = clientName.get(s(q.clientId)) || "a client";
    const until = day(q.validUntil);
    if (status === "sent" && until && until <= in3) {
      add({ key: `quote:${q.id}`, area: "quotes", level: until < today ? "overdue" : until === today ? "today" : "soon", title: `Quote ${s(q.number)} for ${name} ${until < today ? "has expired" : "expires " + whenLabel(until, today)}`, detail: "Call for an answer, or renew it", href: `/hq/proposals/${q.id}`, date: until });
    }
    const booked = q.booking && typeof q.booking === "object" && s((q.booking as { projectId?: string }).projectId);
    if (status === "accepted" && !booked) {
      add({ key: `book:${q.id}`, area: "quotes", level: "today", title: `Start the project for ${name}: quote ${s(q.number)} is accepted`, detail: "Press Start the project to create it with its milestones and the advance invoice", href: `/hq/proposals/${q.id}`, date: day(q.updatedAt) || today });
    }
  }

  /* projects: delivery dates and the client's missing inputs */
  for (const p of data.projects ?? []) {
    if (CLOSED_PROJECT.includes(s(p.stage))) continue;
    const title = s(p.title) || "Project";
    const due = day(p.dueDate);
    if (due && due <= addDaysIso(today, 3)) {
      add({ key: `proj:${p.id}`, area: "projects", level: levelFor(due, today), title: due < today ? `Late: ${title}` : `${title} is due ${whenLabel(due, today)}`, detail: [clientName.get(s(p.clientId)), p.lead ? `lead ${s(p.lead)}` : ""].filter(Boolean).join(" · "), href: `/hq/projects/${p.id}`, date: due });
    }
    const inputs = Array.isArray(p.inputs) ? (p.inputs as { received?: boolean }[]) : [];
    const missing = inputs.filter((i) => !i.received).length;
    const started = day(p.startDate);
    if (missing && started && started <= addDaysIso(today, -5) && ["kickoff", "discovery", "design"].includes(s(p.stage) || "kickoff")) {
      add({ key: `inputs:${p.id}`, area: "projects", level: "soon", title: `${missing} item${missing === 1 ? "" : "s"} still to come from the client: ${title}`, detail: "Send the reminder from the project's From the client tab", href: `/hq/projects/${p.id}?tab=inputs`, date: started });
    }
  }

  /* production */
  for (const d of (data.deliverables ?? []).filter((x) => day(x.dueDate) && day(x.dueDate) <= addDaysIso(today, 2) && !DONE_DELIVERABLE.includes(s(x.status)))) {
    const due = day(d.dueDate);
    const p = projectById.get(s(d.projectId));
    add({ key: `dlv:${d.id}`, area: "production", level: levelFor(due, today), title: s(d.title) || "Deliverable", detail: [p ? s(p.title) : "", `due ${whenLabel(due, today)}`, d.assignee ? s(d.assignee) : ""].filter(Boolean).join(" · "), href: `/hq/production${d.projectId ? `?project=${s(d.projectId)}` : ""}`, date: due });
  }

  /* shoots: tomorrow and today, and footage not backed up */
  for (const sh of data.shoots ?? []) {
    const d = day(sh.date);
    if (!d || s(sh.status) === "cancelled") continue;
    if ((d === today || d === in1) && s(sh.status) !== "shot") {
      add({ key: `shoot:${sh.id}`, area: "shoots", level: d === today ? "today" : "soon", title: `${d === today ? "Shoot today" : "Shoot tomorrow"}: ${s(sh.title)}`, detail: [sh.callTime ? `crew call ${s(sh.callTime)}` : "", s(sh.location), s(sh.status) === "tentative" ? "still tentative" : ""].filter(Boolean).join(" · "), href: `/hq/shoots/${sh.id}`, date: d });
    }
    if (s(sh.status) === "shot" && sh.backupDone !== true && d >= addDaysIso(today, -14)) {
      add({ key: `backup:${sh.id}`, area: "shoots", level: "overdue", title: `Back up the footage: ${s(sh.title)}`, detail: `Shot ${whenLabel(d, today)} — two copies before editing starts`, href: `/hq/shoots/${sh.id}`, date: d });
    }
  }

  /* coaching sessions today and tomorrow */
  for (const c of data.coachingSessions ?? []) {
    const d = day(c.date);
    if (s(c.status) !== "scheduled" || !d || d > in1 || d < today) continue;
    add({ key: `ses:${c.id}`, area: "coaching", level: d === today ? "today" : "soon", title: `${d === today ? "Coaching today" : "Coaching tomorrow"}: ${learnerName.get(s(c.learnerId)) || "a learner"}`, detail: [c.time ? s(c.time) : "", s(c.topic)].filter(Boolean).join(" · "), href: `/hq/coaching/${s(c.learnerId)}`, date: d });
  }

  /* Vritta renewals and AMC */
  for (const v of data.vrittaLicences ?? []) {
    const d = day(v.renewalDate);
    if (!d || !["live", "renewal-due"].includes(s(v.status)) || d > addDaysIso(today, 30)) continue;
    add({ key: `vr:${v.id}`, area: "vritta", level: d < today ? "overdue" : d <= addDaysIso(today, 7) ? "today" : "soon", title: `Vritta renewal: ${s(v.institution)}`, detail: `${s(v.billing) === "perpetual" ? "Maintenance (AMC)" : "Licence"} due ${whenLabel(d, today)}`, href: "/hq/vritta", date: d });
  }

  /* money owed */
  for (const inv of data.invoices ?? []) {
    if (!isOpenInvoice(inv)) continue;
    const due = day(inv.dueDate);
    const balance = formatINR(Math.round(invoiceTotals(inv).balance));
    if (isOverdueInvoice(inv, today)) add({ key: `inv:${inv.id}`, area: "invoices", level: "overdue", title: `Chase ${s(inv.customerName) || "payment"}: ${balance} overdue`, detail: `Invoice ${s(inv.number)}${due ? `, due ${whenLabel(due, today)}` : ""}`, href: `/hq/finance?id=${inv.id}`, date: due || today });
    else if (due && due <= in3) add({ key: `inv:${inv.id}`, area: "invoices", level: due === today ? "today" : "soon", title: `${s(inv.customerName) || "Payment"}: ${balance} due ${whenLabel(due, today)}`, detail: `Invoice ${s(inv.number)}`, href: `/hq/finance?id=${inv.id}`, date: due });
  }

  /* tasks */
  for (const t of data.tasks ?? []) {
    if (s(t.status) === "done") continue;
    const due = day(t.dueDate);
    if (!due || due > today) continue;
    add({ key: `task:${t.id}`, area: "tasks", level: levelFor(due, today), title: s(t.title) || "Task", detail: [t.assignee ? s(t.assignee) : "Nobody assigned", `due ${whenLabel(due, today)}`].join(" · "), href: "/hq/tasks", date: due });
  }

  /* papers waiting for a signature */
  for (const doc of data.signDocs ?? []) {
    if (s(doc.status) !== "issued") continue;
    const tab = `${doc.partyKind === "team" ? "team" : doc.partyKind === "client" ? "clients" : "others"}&doc=${encodeURIComponent(doc.id)}`;
    // they uploaded a signed copy from the link: a founder checks it and marks it signed
    const got = Array.isArray(doc.received) ? (doc.received as { at?: string }[]) : [];
    if (got.length && doc.partySigned !== true) {
      const at = day(got.at(-1)?.at) || today;
      add({ key: `paper-in:${doc.id}`, area: "papers", level: "today", title: `Signed copy received: ${s(doc.title).split(" · ")[0] || "paper"} for ${s(doc.partyName) || "someone"}`, detail: `${got.length === 1 ? "1 file" : `${got.length} files`} sent ${whenLabel(at, today)}; check it and mark it signed`, href: `/hq/sign?tab=${tab}`, date: at });
      continue;
    }
    const signs = o.signsOf?.(s(doc.template)) ?? "both";
    const needsParty = signs !== "studio" && doc.partySigned !== true;
    const needsStudio = signs !== "party" && doc.studioSigned !== true;
    if (!needsParty && !needsStudio) continue;
    const due = day(doc.dueBy);
    const issued = day(doc.issuedOn);
    const waiting = needsParty && needsStudio ? "both signatures" : needsParty ? `${s(doc.partyName) || "their"} signature` : "FrameMind's signature";
    if (due && due <= in3) add({ key: `paper:${doc.id}`, area: "papers", level: levelFor(due, today), title: `${s(doc.title).split(" · ")[0] || "Paper"} for ${s(doc.partyName) || "someone"}`, detail: `Waiting for ${waiting}; to be returned ${whenLabel(due, today)}`, href: `/hq/sign?tab=${tab}`, date: due });
    else if (!due && issued && issued <= addDaysIso(today, -7)) add({ key: `paper:${doc.id}`, area: "papers", level: "soon", title: `${s(doc.title).split(" · ")[0] || "Paper"} for ${s(doc.partyName) || "someone"}`, detail: `Waiting for ${waiting} since ${whenLabel(issued, today)}`, href: `/hq/sign?tab=${tab}`, date: issued });
  }

  /* social posts planned for today, or missed */
  for (const post of data.contentCalendar ?? []) {
    const d = day(post.date);
    if (!d || s(post.status) === "published" || d > today || d < addDaysIso(today, -7)) continue;
    add({ key: `post:${post.id}`, area: "social", level: d < today ? "overdue" : "today", title: `${d < today ? "Not posted yet" : "Post today"}: ${s(post.title) || "a planned post"}`, detail: [s(post.platform), d < today ? `planned ${whenLabel(d, today)}` : ""].filter(Boolean).join(" · "), href: "/hq/social?tab=plan", date: d });
  }

  /* tool renewals in the next 3 days */
  for (const t of data.subscriptions ?? []) {
    const d = day(t.renewalDate);
    if (!d || !["active", "trial"].includes(s(t.status) || "active") || d > in3 || d < addDaysIso(today, -3)) continue;
    add({ key: `sub:${t.id}`, area: "tools", level: levelFor(d, today), title: `${s(t.tool)} ${s(t.status) === "trial" ? "trial ends" : "renews"} ${whenLabel(d, today)}`, detail: "Keep it, or cancel before it charges", href: "/hq/tools", date: d });
  }

  /* team incentives: decisions and payments waiting on the founder, payments to reconcile, the legal review's renewal */
  const HREF = "/hq/incentives";
  for (const l of data.leads ?? []) {
    if (s(l.attribution) !== "pending") continue;
    const at = day(l.registeredAt) || day(l.createdAt) || today;
    add({ key: `attr:${l.id}`, area: "incentives", level: at < addDaysIso(today, -7) ? "overdue" : "today", title: `Decide commission attribution: ${s(l.name) || "a registered lead"}`, detail: `Registered by ${s(l.registeredBy) || "a team member"} ${whenLabel(at, today)}`, href: `${HREF}?tab=leads`, date: at });
  }
  const payouts = data.incentivePayouts ?? [];
  const pending = payouts.filter((p) => s(p.status) === "pending");
  if (pending.length) add({ key: "inc:pending", area: "incentives", level: "today", title: `${pending.length} incentive statement${pending.length === 1 ? "" : "s"} waiting for approval`, detail: pending.map((p) => s(p.memberName)).filter(Boolean).slice(0, 4).join(", "), href: `${HREF}?tab=payouts`, date: today });
  const unpaid = payouts.filter((p) => ["approved", "initiated"].includes(s(p.status)));
  if (unpaid.length) add({ key: "inc:unpaid", area: "incentives", level: "soon", title: `${unpaid.length} approved incentive${unpaid.length === 1 ? "" : "s"} to pay`, detail: "Pay from the bank, then record the reference", href: `${HREF}?tab=payouts`, date: today });
  if (payouts.length || (data.incentivePolicies ?? []).length) {
    const unreconciled = (data.invoices ?? []).flatMap((inv) => (Array.isArray(inv.payments) ? (inv.payments as BaseRecord[]) : []).filter((p) => !p.reconciled && !p.refunded && day(p.date) && day(p.date) <= addDaysIso(today, -3)));
    if (unreconciled.length) add({ key: "inc:recon", area: "incentives", level: "soon", title: `${unreconciled.length} client payment${unreconciled.length === 1 ? "" : "s"} to reconcile`, detail: "Unreconciled payments do not count toward team incentives", href: "/hq/finance?tab=invoices", date: today });
  }
  for (const p of data.incentivePolicies ?? []) {
    const c = (p.compliance ?? {}) as { status?: string; expiresOn?: string };
    if (s(p.status) !== "active" || c.status !== "approved" || !day(c.expiresOn)) continue;
    const exp = day(c.expiresOn);
    if (exp <= addDaysIso(today, 30)) add({ key: `pol:${p.id}`, area: "incentives", level: exp < today ? "overdue" : exp <= addDaysIso(today, 7) ? "today" : "soon", title: `Incentive policy legal review ${exp < today ? "has expired" : `expires ${whenLabel(exp, today)}`}`, detail: "Renew it with the labour-law professional; approvals stop when it lapses", href: `${HREF}?tab=policy`, date: exp });
  }

  const rank: Record<ReminderLevel, number> = { overdue: 0, today: 1, soon: 2 };
  return out.sort((a, b) => rank[a.level] - rank[b.level] || a.date.localeCompare(b.date) || a.title.localeCompare(b.title));
}

export function countByLevel(list: Reminder[]) {
  return { overdue: list.filter((r) => r.level === "overdue").length, today: list.filter((r) => r.level === "today").length, soon: list.filter((r) => r.level === "soon").length };
}
