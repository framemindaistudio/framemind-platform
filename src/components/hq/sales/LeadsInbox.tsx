"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Building2, CheckCheck, FileSignature, GraduationCap, Loader2, MessageCircle, Pencil, Phone, RotateCcw, ShieldX, Trash2, X } from "lucide-react";
import { getCollection, SERVICE_OPTS, type BaseRecord, type CollectionDef } from "@/lib/hq/collections";
import { can } from "@/lib/hq/roles";
import { Badge, statusTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Drawer, Modal } from "@/components/ui/Overlay";
import { Input, Label, Textarea } from "@/components/ui/form";
import { Tabs } from "@/components/ui/Tabs";
import { CollectionManager, type ExtraColumn } from "@/components/hq/CollectionManager";
import { useCollection, useHq } from "@/components/hq/data";
import { RecordForm } from "@/components/hq/fields";
import { PageHeader, StatCard } from "@/components/hq/ui";
import { cn, formatDate, formatDateTime, formatNumber, isoDate } from "@/lib/utils";
import { introMessage, introSubject, phoneDigits, telHref, whatsappHref } from "./contact";
import { addDays, isWithinDays, relativeDay, str, todayIso } from "./crm";
import { ContactButtons, Notice } from "./bits";
import { useToday } from "./useToday";
import { appliedFor, cleanApplication, type Application } from "@/lib/content/careers";
import type { Tone } from "@/components/ui/Badge";

/** A lead registered by a team member for commission, and the founder's decision on it (decided in HQ → Team incentives). */
const ATTRIBUTION: Record<string, [string, Tone]> = { pending: ["Commission: pending", "warn"], accepted: ["Commission: accepted", "ok"], rejected: ["Commission: rejected", "bad"] };

const leadsDef = getCollection("leads")!;
const proposalHref = (clientId: string, leadId: string) => `/hq/proposals/new?client=${encodeURIComponent(clientId)}&lead=${encodeURIComponent(leadId)}`;
const serviceLabel = (v: unknown) => SERVICE_OPTS.find((o) => o.value === v)?.label ?? String(v);
const KIND_OPTIONS = leadsDef.fields.find((f) => f.key === "kind")?.options ?? [];
const STATUS_OPTIONS = leadsDef.fields.find((f) => f.key === "status")?.options ?? [];
const TRACK_OPTIONS = leadsDef.fields.find((f) => f.key === "ageTrack")?.options ?? [];
/**
 * The boxes each type of enquiry has: a project enquiry asks about services, budget and timeline; a coaching
 * enquiry about the learner's age track; an application about the role — so nobody sees boxes that do not apply.
 */
const KIND_FIELDS: Record<string, string[]> = {
  project: ["channel", "organisation", "role", "phone", "email", "city", "services", "budget", "timeline", "clientId"],
  coaching: ["channel", "role", "phone", "email", "city", "ageTrack", "budget"],
  vritta: ["channel", "organisation", "role", "phone", "email", "city", "clientId"],
  careers: ["channel", "role", "phone", "email", "city"],
  partner: ["channel", "organisation", "role", "phone", "email", "city"],
  contact: ["channel", "organisation", "role", "phone", "email", "city", "services", "clientId"],
};
const LABELS: Record<string, Record<string, string>> = {
  careers: { role: "Role applied for" },
  coaching: { role: "Profession" },
  partner: { organisation: "Organisation" },
  vritta: { organisation: "Institution" },
};
function leadDefFor(kind: unknown): CollectionDef {
  const k = KIND_FIELDS[str(kind)] ? str(kind) : "contact";
  const keep = new Set(["kind", "status", "name", ...KIND_FIELDS[k], "message", "page"]);
  return { ...leadsDef, fields: leadsDef.fields.filter((f) => keep.has(f.key)).map((f) => (LABELS[k]?.[f.key] ? { ...f, label: LABELS[k][f.key] } : f)) };
}
const applyingForOf = (lead: BaseRecord) => (lead.kind === "careers" && str(lead.role) ? str(lead.role) : undefined);
const servicesOfLead = (r: BaseRecord) => (Array.isArray(r.services) ? (r.services as string[]) : []);

type KindTab = "all" | "project" | "coaching" | "vritta" | "partner" | "contact" | "careers";
const TAB_LABELS: Record<KindTab, string> = {
  all: "All",
  project: "Projects",
  coaching: "Coaching",
  vritta: "Vritta",
  partner: "Partners",
  contact: "Contact",
  careers: "Careers",
};

const kindLabel = (k: unknown) => KIND_OPTIONS.find((o) => o.value === k)?.label ?? (k ? String(k) : "Enquiry");
const statusLabel = (s: unknown) => STATUS_OPTIONS.find((o) => o.value === s)?.label ?? (s ? String(s) : "New");
const isNew = (r: BaseRecord) => !r.status || r.status === "new";

export function LeadsInbox() {
  const { user } = useHq();
  const today = useToday();
  const { records } = useCollection("leads");
  const [tab, setTab] = useState<KindTab>("all");
  const [openId, setOpenId] = useState<string | null>(null);

  const stats = useMemo(() => {
    const unread = records.filter(isNew).length;
    const week = records.filter((r) => isWithinDays(r.createdAt, 7, today)).length;
    const openProjects = records.filter((r) => (r.kind === "project" || r.kind === "vritta" || r.kind === "coaching") && ["new", "in-progress", undefined, ""].includes(r.status as string)).length;
    const qualifying = records.filter((r) => r.kind !== "careers" && r.status !== "spam");
    const converted = qualifying.filter((r) => r.status === "converted").length;
    return { unread, week, openProjects, converted, rate: qualifying.length ? converted / qualifying.length : 0 };
  }, [records, today]);

  const tabs = useMemo(
    () =>
      (Object.keys(TAB_LABELS) as KindTab[])
        .map((k) => {
          const list = k === "all" ? records : records.filter((r) => r.kind === k);
          const unread = list.filter(isNew).length;
          return {
            value: k,
            count: list.length,
            unread,
            label: (
              <span className="inline-flex items-center gap-1.5">
                {TAB_LABELS[k]}
                {unread > 0 && <span className="size-1.5 rounded-full bg-graphite" aria-label={`${unread} unread`} />}
              </span>
            ),
          };
        })
        .filter((t) => t.value === "all" || t.value === "project" || t.count > 0),
    [records],
  );

  const columns: ExtraColumn<BaseRecord>[] = useMemo(
    () => [
      {
        key: "createdAt",
        label: "Received",
        sortValue: (r) => str(r.createdAt),
        render: (r) => (
          <span className="flex items-center gap-2.5 whitespace-nowrap">
            <span className={cn("size-2 shrink-0 rounded-full", isNew(r) ? "bg-graphite" : "border border-graphite/25")} aria-hidden />
            <span className={cn("tabular text-xs", isNew(r) ? "font-semibold text-graphite" : "text-charcoal")}>{today ? relativeDay(r.createdAt, today) : formatDate(str(r.createdAt))}</span>
            {isNew(r) && <span className="sr-only">Unread</span>}
          </span>
        ),
      },
      {
        key: "name",
        label: "From",
        sortValue: (r) => str(r.name).toLowerCase(),
        render: (r) => (
          <span className="block min-w-[10rem]">
            <span className={cn("block truncate", isNew(r) ? "font-bold text-ink" : "font-medium text-graphite")}>{str(r.name) || "—"}</span>
            <span className="block truncate text-xs text-blueprint">{[r.role, r.organisation].filter(Boolean).map(String).join(" · ") || "—"}</span>
          </span>
        ),
      },
      {
        key: "kind",
        label: "Type",
        sortValue: (r) => str(r.kind),
        render: (r) => <Badge tone={r.kind === "project" ? "dark" : "outline"}>{kindLabel(r.kind)}</Badge>,
      },
      {
        key: "details",
        label: "Details",
        sortValue: (r) => servicesOfLead(r).length,
        render: (r) => (
          <span className="block min-w-[9rem] text-xs text-charcoal">
            {(r.kind === "careers" ? applicantLine(r) : [r.city, servicesOfLead(r).map(serviceLabel).join(", "), r.budget ? `Budget ${str(r.budget)}` : "", r.channel])
              .filter(Boolean)
              .map(String)
              .join(" · ") || "—"}
          </span>
        ),
      },
      {
        key: "status",
        label: "Status",
        sortValue: (r) => str(r.status),
        render: (r) => (
          <span className="inline-flex flex-wrap gap-1">
            <Badge tone={statusTone(r.status || "new")}>{statusLabel(r.status || "new")}</Badge>
            {ATTRIBUTION[str(r.attribution)] && <Badge tone={ATTRIBUTION[str(r.attribution)][1]}>{ATTRIBUTION[str(r.attribution)][0]}</Badge>}
          </span>
        ),
      },
    ],
    [today],
  );

  return (
    <div>
      <PageHeader
        eyebrow="Sales · 01"
        title="Enquiries"
        icon="Inbox"
        description="Every enquiry — website, WhatsApp, Instagram, calls and referrals. Reply in one tap, convert businesses into the CRM and learners into coaching."
        actions={
          <Button variant="secondary" size="sm" className="h-10" href="/hq/crm">
            Clients CRM <ArrowRight className="size-4" aria-hidden />
          </Button>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard tone="dark" label="Unread" value={formatNumber(stats.unread)} sub={stats.unread ? "Reply within a working day" : "Inbox zero — nicely done"} />
        <StatCard label="Last 7 days" value={formatNumber(stats.week)} sub="New submissions this week" />
        <StatCard label="Open work enquiries" value={formatNumber(stats.openProjects)} sub="Projects, coaching and Vritta — new or in progress" />
        <StatCard label="Converted" value={formatNumber(stats.converted)} sub={`${Math.round(stats.rate * 100)}% of genuine enquiries`} progress={stats.rate} />
      </div>

      <Tabs tabs={tabs.map(({ value, label, count }) => ({ value, label, count }))} value={tab} onChange={setTab} className="mb-4" />

      <CollectionManager
        name="leads"
        columns={[]}
        extraColumns={columns}
        filter={tab === "all" ? undefined : (r) => r.kind === tab}
        onOpen={(r) => setOpenId(r.id)}
        defaults={{ kind: tab !== "all" ? tab : "project", status: "new", channel: "WhatsApp", page: "Added in HQ" }}
        newLabel="Add enquiry"
        emptyText="Add every enquiry here — WhatsApp, Instagram DMs, calls and referrals — so nothing is forgotten. Website form submissions land here automatically once the site posts to HQ."
        rowActions={(r) => <RowQuickActions lead={r} sender={user.name} />}
      />

      <LeadDrawer leadId={openId} onClose={() => setOpenId(null)} />
    </div>
  );
}

/* ─────────────────────────── row quick actions ─────────────────────────── */

function useMarkInProgress() {
  const { user, store } = useHq();
  const { save } = useCollection("leads");
  const canWrite = can(user, leadsDef.write) && store.writable;
  return (lead: BaseRecord) => {
    if (!canWrite || !isNew(lead)) return;
    save({ ...lead, status: "in-progress" }).catch(() => {});
  };
}

function RowQuickActions({ lead, sender }: { lead: BaseRecord; sender: string }) {
  const mark = useMarkInProgress();
  const text = introMessage({ kind: str(lead.kind), name: lead.name, organisation: lead.organisation, sender, applyingFor: applyingForOf(lead) });
  const tel = telHref(lead.phone);
  const wa = whatsappHref(lead.phone, text);
  const cls = "grid size-8 place-items-center rounded-[var(--radius-sm)] border border-graphite/15 text-charcoal transition-colors hover:border-graphite hover:bg-graphite hover:text-paper focus-visible:outline-2 focus-visible:outline-graphite";
  return (
    <span className="inline-flex gap-1.5">
      {tel && (
        <a href={tel} className={cls} aria-label={`Call ${str(lead.name)}`} title="Call" onClick={() => mark(lead)}>
          <Phone className="size-3.5" aria-hidden />
        </a>
      )}
      {wa && (
        <a href={wa} target="_blank" rel="noopener noreferrer" className={cls} aria-label={`WhatsApp ${str(lead.name)}`} title="WhatsApp" onClick={() => mark(lead)}>
          <MessageCircle className="size-3.5" aria-hidden />
        </a>
      )}
    </span>
  );
}

/* ─────────────────────────── lead drawer ─────────────────────────── */

function LeadDrawer({ leadId, onClose }: { leadId: string | null; onClose: () => void }) {
  const { user, store } = useHq();
  const { records, save, remove } = useCollection("leads");
  const lead = leadId ? records.find((r) => r.id === leadId) ?? null : null;
  const canWrite = can(user, leadsDef.write) && store.writable;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const [converting, setConverting] = useState<false | "client" | "proposal" | "learner">(false);

  async function setStatus(status: string) {
    if (!lead) return;
    setBusy(true);
    setError("");
    try {
      await save({ ...lead, status });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update");
    } finally {
      setBusy(false);
    }
  }

  async function onDelete() {
    if (!lead) return;
    if (!window.confirm("Delete this enquiry? The change is kept in the history and can be restored.")) return;
    setBusy(true);
    try {
      await remove(lead.id);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete");
    } finally {
      setBusy(false);
    }
  }

  const status = str(lead?.status) || "new";
  const canConvert = !!lead && lead.kind !== "careers" && lead.kind !== "coaching" && status !== "converted";
  const canLearner = !!lead && lead.kind === "coaching" && status !== "converted" && can(user, getCollection("learners")!.write);
  const canProposal = !!lead && (lead.kind === "project" || lead.kind === "vritta" || lead.kind === "contact") && can(user, getCollection("proposals")!.write);

  return (
    <>
      <Drawer
        open={!!lead}
        onClose={onClose}
        title={str(lead?.name) || "Enquiry"}
        subtitle={lead ? `${kindLabel(lead.kind)} · received ${formatDateTime(str(lead.createdAt))}` : undefined}
        footer={
          lead && canWrite ? (
            <div className="flex flex-wrap items-center gap-2">
              <button onClick={onDelete} disabled={busy} className="inline-flex items-center gap-1.5 rounded px-2 py-1.5 text-xs font-semibold text-bad hover:bg-bad/10 focus-visible:outline-2 focus-visible:outline-bad">
                <Trash2 className="size-3.5" aria-hidden /> Delete
              </button>
              <div className="ml-auto flex flex-wrap items-center gap-2">
                {busy && <Loader2 className="size-4 animate-spin text-blueprint" aria-label="Saving" />}
                {status === "new" && (
                  <Button variant="ghost" size="sm" onClick={() => setStatus("in-progress")} disabled={busy}>
                    <CheckCheck className="size-4" aria-hidden /> Mark in progress
                  </Button>
                )}
                {["closed", "spam"].includes(status) ? (
                  <Button variant="ghost" size="sm" onClick={() => setStatus("in-progress")} disabled={busy}>
                    <RotateCcw className="size-4" aria-hidden /> Reopen
                  </Button>
                ) : (
                  status !== "converted" && (
                    <>
                      <Button variant="ghost" size="sm" onClick={() => setStatus("spam")} disabled={busy}>
                        <ShieldX className="size-4" aria-hidden /> Spam
                      </Button>
                      <Button variant="secondary" size="sm" onClick={() => setStatus("closed")} disabled={busy}>
                        <X className="size-4" aria-hidden /> Close
                      </Button>
                    </>
                  )
                )}
                {canConvert && (
                  <Button size="sm" variant={canProposal ? "secondary" : "primary"} onClick={() => setConverting("client")} disabled={busy}>
                    <Building2 className="size-4" aria-hidden /> Convert to client
                  </Button>
                )}
                {canLearner && (
                  <Button size="sm" onClick={() => setConverting("learner")} disabled={busy}>
                    <GraduationCap className="size-4" aria-hidden /> Start as a learner
                  </Button>
                )}
                {canProposal && (
                  <Button size="sm" onClick={() => (status === "converted" && lead?.clientId ? router.push(proposalHref(str(lead.clientId), str(lead.id))) : setConverting("proposal"))} disabled={busy}>
                    <FileSignature className="size-4" aria-hidden /> Make the quote
                  </Button>
                )}
              </div>
            </div>
          ) : undefined
        }
      >
        {lead && <LeadDetail key={lead.id} lead={lead} canWrite={canWrite} />}
        {error && <Notice tone="bad" className="mt-4">{error}</Notice>}
      </Drawer>
      {lead && converting === "learner" && <LearnerModal lead={lead} onClose={() => setConverting(false)} />}
      {lead && (converting === "client" || converting === "proposal") && <ConvertModal lead={lead} then={converting} onClose={() => setConverting(false)} />}
    </>
  );
}

function LeadDetail({ lead, canWrite }: { lead: BaseRecord; canWrite: boolean }) {
  const { user } = useHq();
  const { save } = useCollection("leads");
  const mark = useMarkInProgress();
  const [message, setMessage] = useState(() => introMessage({ kind: str(lead.kind), name: lead.name, organisation: lead.organisation, sender: user.name, applyingFor: applyingForOf(lead) }));
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const status = str(lead.status) || "new";
  const def = leadDefFor(lead.kind);
  const label = (key: string) => def.fields.find((f) => f.key === key)?.label ?? key;
  const shown = new Set(def.fields.map((f) => f.key));
  const facts: [string, React.ReactNode][] = (
    [
      ["organisation", str(lead.organisation)],
      ["role", str(lead.role)],
      ["city", str(lead.city)],
      ["phone", lead.phone ? <span className="tabular">{str(lead.phone)}</span> : ""],
      ["email", lead.email ? <span className="break-all">{str(lead.email)}</span> : ""],
      ["channel", str(lead.channel)],
      ["services", servicesOfLead(lead).map(serviceLabel).join(", ")],
      ["budget", str(lead.budget)],
      ["timeline", str(lead.timeline)],
      ["ageTrack", TRACK_OPTIONS.find((o) => o.value === lead.ageTrack)?.label ?? ""],
      ["page", str(lead.page)],
    ] as [string, React.ReactNode][]
  )
    .filter(([k]) => shown.has(k))
    .map(([k, v]) => [label(k), v]);

  async function onSave() {
    if (!editing) return;
    setSaving(true);
    setError("");
    try {
      await save(editing);
      setEditing(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={statusTone(status)} dot>
          {statusLabel(status)}
        </Badge>
        <Badge tone={lead.kind === "project" ? "dark" : "outline"}>{kindLabel(lead.kind)}</Badge>
        {ATTRIBUTION[str(lead.attribution)] && (
          <Link href="/hq/incentives?tab=leads" title="Lead attribution for team commission">
            <Badge tone={ATTRIBUTION[str(lead.attribution)][1]}>{ATTRIBUTION[str(lead.attribution)][0]}</Badge>
          </Link>
        )}
        {status === "converted" && lead.clientId ? (
          <Link href={`/hq/crm/${str(lead.clientId)}`} className="ml-auto inline-flex items-center gap-1 text-sm font-semibold text-graphite underline-offset-4 hover:underline">
            Open client in CRM <ArrowRight className="size-4" aria-hidden />
          </Link>
        ) : null}
      </div>

      {lead.message ? (
        <figure className="relative rounded-[var(--radius-md)] border border-graphite/12 bg-paper-50 px-5 py-4">
          <span className="annot absolute -top-2 left-4 bg-paper px-1.5 text-[10px] text-blueprint">Message</span>
          <blockquote className="whitespace-pre-line text-sm leading-relaxed text-graphite">{str(lead.message)}</blockquote>
        </figure>
      ) : null}

      <section aria-labelledby="lead-reply">
        <h3 id="lead-reply" className="annot mb-2 text-charcoal">
          Reply
        </h3>
        <Textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={5} aria-label="Reply message used for WhatsApp and email" />
        <p className="mt-1.5 text-[11px] text-blueprint">Used as the WhatsApp text and email body. Edit before sending.</p>
        <ContactButtons
          className="mt-3"
          phone={lead.phone}
          email={lead.email}
          whatsappText={message}
          emailSubject={introSubject(str(lead.kind), lead.organisation)}
          emailBody={message}
          onContact={() => mark(lead)}
        />
      </section>

      <section aria-labelledby="lead-facts">
        <div className="mb-2 flex items-center justify-between">
          <h3 id="lead-facts" className="annot text-charcoal">
            Details
          </h3>
          {canWrite && !editing && (
            <button onClick={() => setEditing({ ...lead })} className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-semibold text-graphite hover:bg-graphite/5 focus-visible:outline-2 focus-visible:outline-graphite">
              <Pencil className="size-3.5" aria-hidden /> Edit
            </button>
          )}
        </div>
        {editing ? (
          <div className="rounded-[var(--radius-md)] border border-graphite/12 bg-paper-50 p-4">
            <RecordForm def={leadDefFor(editing.kind)} value={editing} onChange={setEditing} />
            {error && <Notice tone="bad" className="mt-4">{error}</Notice>}
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setEditing(null)}>
                Cancel
              </Button>
              <Button size="sm" onClick={onSave} disabled={saving}>
                {saving && <Loader2 className="size-4 animate-spin" aria-hidden />} Save
              </Button>
            </div>
          </div>
        ) : (
          <dl className="grid gap-x-6 rounded-[var(--radius-md)] border border-graphite/12 bg-paper-50 px-4 py-2 sm:grid-cols-2">
            {facts.map(([k, v]) => (
              <div key={k} className="flex items-start justify-between gap-3 border-b border-dashed border-graphite/10 py-2 text-sm">
                <dt className="text-blueprint">{k}</dt>
                <dd className="text-right font-medium text-graphite">{v || <span className="text-blueprint/60">—</span>}</dd>
              </div>
            ))}
          </dl>
        )}
      </section>

      {lead.kind === "careers" && cleanApplication(lead.application) && <ApplicationFacts app={cleanApplication(lead.application)!} lead={lead} />}

      {lead.kind === "careers" && (
        <Notice tone="info">Applications are not clients — reply, then add promising people in Team &amp; Payroll and send their offer from Documents to Sign.</Notice>
      )}
    </div>
  );
}

/** One line for the table: the role applied for, the experience, how they want to work, and the city. */
function applicantLine(r: BaseRecord): string[] {
  const app = cleanApplication(r.application);
  if (!app) return [str(r.city), str(r.channel)];
  return [app.experience > 0 ? `${formatNumber(app.experience)} yr${app.experience === 1 ? "" : "s"}` : app.student ? "Student" : "", app.engagement.join(" / "), str(r.city)];
}

/** What the careers form asked, as the applicant answered it. */
function ApplicationFacts({ app, lead }: { app: Application; lead: BaseRecord }) {
  const links = app.links.split(/\s+/).filter(Boolean);
  const rows: [string, React.ReactNode][] = [
    ["Applying for", <strong key="r">{appliedFor(app)}</strong>],
    [app.student ? "Student at" : "Does now", app.current || str(lead.organisation)],
    ["Experience", `${formatNumber(app.experience)} year${app.experience === 1 ? "" : "s"}`],
    ["Skills", app.skills.join(", ")],
    ["Wants to work", app.engagement.join(", ")],
    ["Where", app.workMode],
    ["Languages", app.languages.join(", ")],
    ["Can start", app.startFrom ? formatDate(app.startFrom) : ""],
    ["Heard about us", app.heardFrom],
    [
      "Portfolio / links",
      links.length ? (
        <span key="l" className="flex flex-col items-end gap-1">
          {links.map((l) =>
            /^https?:\/\//i.test(l) ? (
              <a key={l} href={l} target="_blank" rel="noopener noreferrer nofollow" className="break-all underline underline-offset-2">
                {l}
              </a>
            ) : (
              <span key={l} className="break-all">
                {l}
              </span>
            ),
          )}
        </span>
      ) : (
        ""
      ),
    ],
  ];
  return (
    <section aria-labelledby="lead-app">
      <h3 id="lead-app" className="annot mb-2 text-charcoal">
        Application
      </h3>
      <dl className="rounded-[var(--radius-md)] border border-graphite/12 bg-paper-50 px-4 py-2">
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-start justify-between gap-4 border-b border-dashed border-graphite/10 py-2 text-sm last:border-0">
            <dt className="shrink-0 text-blueprint">{k}</dt>
            <dd className="text-right font-medium text-graphite">{v || <span className="text-blueprint/60">—</span>}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/* ─────────────────────────── convert to client ─────────────────────────── */

const norm = (s: unknown) =>
  String(s ?? "")
    .toLowerCase()
    .replace(/\b(the|pvt|private|ltd|limited|llp|inc|studio|company|co)\b/g, "")
    .replace(/[^a-z0-9]/g, "");

function enquiryNotes(lead: BaseRecord) {
  return [
    `Enquiry (${kindLabel(lead.kind)}${lead.channel ? `, via ${str(lead.channel)}` : ""}) received ${formatDate(str(lead.createdAt))}.`,
    servicesOfLead(lead).length ? `Services: ${servicesOfLead(lead).map(serviceLabel).join(", ")}.` : "",
    lead.budget ? `Budget mentioned: ${str(lead.budget)}.` : "",
    lead.timeline ? `Timeline: ${str(lead.timeline)}.` : "",
    lead.message ? `Message: “${str(lead.message)}”` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

const SOURCE_OF: Record<string, string> = { "Website form": "Website", WhatsApp: "WhatsApp", "Instagram DM": "Instagram", LinkedIn: "LinkedIn", Referral: "Referral", Event: "Event" };

function ConvertModal({ lead, then, onClose }: { lead: BaseRecord; then: "client" | "proposal"; onClose: () => void }) {
  const router = useRouter();
  const { user } = useHq();
  const clients = useCollection("clients");
  const activities = useCollection("activities");
  const leads = useCollection("leads");
  const [name, setName] = useState(str(lead.organisation) || str(lead.name));
  const [city, setCity] = useState(str(lead.city));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const matches = useMemo(() => {
    const digits = phoneDigits(lead.phone);
    const key = norm(name);
    return clients.records
      .filter((s) => (digits && phoneDigits(s.phone) === digits) || (key.length >= 4 && (norm(s.name) === key || norm(s.name).includes(key) || key.includes(norm(s.name) || "∅"))))
      .slice(0, 4);
  }, [clients.records, lead.phone, name]);

  async function finish(clientId: string, created: boolean) {
    const today = todayIso();
    await activities.save({
      clientId,
      type: "Note",
      date: today,
      summary: created ? `Converted from an enquiry — ${kindLabel(lead.kind).toLowerCase()} from ${str(lead.name)}` : `Enquiry linked — ${kindLabel(lead.kind).toLowerCase()} from ${str(lead.name)}`,
      details: enquiryNotes(lead),
      nextStep: "Book the 20-minute discovery call",
      nextDate: addDays(today, 1),
      by: user.name,
    });
    await leads.save({ ...lead, status: "converted", clientId });
    router.push(then === "proposal" ? proposalHref(clientId, lead.id) : `/hq/crm/${clientId}`);
  }

  async function create() {
    if (!name.trim()) {
      setError("Enter the client name.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const today = todayIso();
      const created = lead.createdAt ? isoDate(new Date(str(lead.createdAt))) : today;
      const services = servicesOfLead(lead).length ? servicesOfLead(lead) : lead.kind === "vritta" ? ["vritta"] : [];
      const client = await clients.save({
        name: name.trim(),
        stage: "contacted",
        clientType: lead.kind === "vritta" ? "College / university" : undefined,
        city: city.trim(),
        contactName: str(lead.name),
        contactRole: str(lead.role),
        phone: str(lead.phone),
        email: str(lead.email),
        services,
        source: SOURCE_OF[str(lead.channel)] ?? "Other",
        owner: user.name,
        lastContact: created,
        nextFollowUp: addDays(today, 1),
        notes: enquiryNotes(lead),
      });
      await finish(client.id, true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not convert");
      setBusy(false);
    }
  }

  async function link(clientId: string) {
    setBusy(true);
    setError("");
    try {
      await finish(clientId, false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not link");
      setBusy(false);
    }
  }

  return (
    <Modal
      open
      onClose={busy ? () => {} : onClose}
      title="Convert to client"
      size="max-w-xl"
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button size="sm" onClick={create} disabled={busy}>
            {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Building2 className="size-4" aria-hidden />} {then === "proposal" ? "Create client & make the quote" : "Create client & open"}
          </Button>
        </>
      }
    >
      <p className="text-sm text-charcoal">
        Creates a client in the CRM at stage <strong>Contacted</strong> with {str(lead.name) || "this contact"} as the key contact, a follow-up for tomorrow, and the enquiry logged on its timeline.
        {then === "proposal" ? " Then a new quote opens with the services they asked about." : ""}
      </p>
      <div className="mt-5 grid gap-4 sm:grid-cols-6">
        <div className="sm:col-span-4">
          <Label htmlFor="cv-name">Client / company name</Label>
          <Input id="cv-name" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="cv-city">City</Label>
          <Input id="cv-city" value={city} onChange={(e) => setCity(e.target.value)} />
        </div>
      </div>
      {matches.length > 0 && (
        <div className="mt-6">
          <p className="annot mb-2 text-charcoal">Already in the CRM?</p>
          <ul className="divide-y divide-graphite/10 rounded-[var(--radius-sm)] border border-graphite/15">
            {matches.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm">
                <span className="min-w-0">
                  <span className="block truncate font-semibold">{str(s.name)}</span>
                  <span className="block truncate text-xs text-blueprint">{[s.city, s.contactName, s.phone].filter(Boolean).map(String).join(" · ")}</span>
                </span>
                <Button variant="secondary" size="sm" onClick={() => link(s.id)} disabled={busy}>
                  Link enquiry
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {error && <Notice tone="bad" className="mt-4">{error}</Notice>}
    </Modal>
  );
}

/* ─────────────────────────── coaching enquiry → learner ─────────────────────────── */

function LearnerModal({ lead, onClose }: { lead: BaseRecord; onClose: () => void }) {
  const router = useRouter();
  const { user } = useHq();
  const learners = useCollection("learners");
  const leads = useCollection("leads");
  const [mode, setMode] = useState("online");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function create() {
    setBusy(true);
    setError("");
    try {
      const learner = await learners.save({
        name: str(lead.name),
        status: "onboarding",
        track: str(lead.ageTrack) || undefined,
        mode,
        coach: user.name,
        profession: str(lead.role),
        city: str(lead.city),
        phone: str(lead.phone),
        email: str(lead.email),
        goals: str(lead.message),
        notes: enquiryNotes(lead),
      });
      await leads.save({ ...lead, status: "converted" });
      router.push(`/hq/coaching?learner=${learner.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create the learner");
      setBusy(false);
    }
  }

  return (
    <Modal
      open
      onClose={busy ? () => {} : onClose}
      title="Start as a coaching learner"
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button size="sm" onClick={create} disabled={busy}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : <GraduationCap className="size-4" />} Create learner
          </Button>
        </>
      }
    >
      <p className="text-sm text-charcoal">
        Creates {str(lead.name) || "this person"} in AI Coaching at <strong>Onboarding</strong>, with what they wrote as their goals. Map their profession and daily work before session one.
      </p>
      <div className="mt-4 max-w-xs">
        <Label htmlFor="lr-mode">Mode</Label>
        <select id="lr-mode" value={mode} onChange={(e) => setMode(e.target.value)} className="h-10 w-full rounded-[var(--radius-sm)] border border-graphite/20 bg-paper-50 px-3 text-sm">
          <option value="online">Online</option>
          <option value="offline">Offline</option>
        </select>
      </div>
      {error && <Notice tone="bad" className="mt-4">{error}</Notice>}
    </Modal>
  );
}
