"use client";

import { useMemo, useState } from "react";
import { Check, ClipboardCheck, Loader2, Mail, Pencil, Phone, X } from "lucide-react";
import { CollectionManager } from "@/components/hq/CollectionManager";
import { useCollection, useHq } from "@/components/hq/data";
import { EmptyState, Loading, StatCard } from "@/components/hq/ui";
import { Badge, statusTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Overlay";
import { can, LEADERSHIP } from "@/lib/hq/roles";
import { cn, formatDate } from "@/lib/utils";
import { MemberPhoto } from "./MemberPhoto";
import { memberProjects, memberShoots, ONBOARDING, PROJECT_DONE, onboardingProgress, onboardingState, str, useTodayIso, type OnboardingState, type Rec } from "./team";

const STATUS_ORDER: Record<string, number> = { active: 0, onboarding: 1, inactive: 2 };

export function PeopleTab() {
  const { user, store } = useHq();
  const { records: team, loading, error, save, refresh } = useCollection<Rec>("team");
  const { records: projects } = useCollection<Rec>("projects");
  const { records: shoots } = useCollection<Rec>("shoots");
  const today = useTodayIso();
  const year = today?.slice(0, 4) ?? "";
  const canEdit = can(user, LEADERSHIP) && store.writable;

  const [openId, setOpenId] = useState<string | null>(null);
  const [checklistId, setChecklistId] = useState<string | null>(null);

  const members = useMemo(
    () =>
      [...team].sort((a, b) => (STATUS_ORDER[str(a.status)] ?? 3) - (STATUS_ORDER[str(b.status)] ?? 3) || str(a.name).localeCompare(str(b.name))),
    [team],
  );

  const stats = useMemo(() => {
    const active = team.filter((m) => str(m.status) === "active").length;
    const ready = team.filter((m) => m.agreementSigned === true && m.ipAssigned === true).length;
    const onboarding = team.filter((m) => str(m.status) === "onboarding").length;
    const live = projects.filter((p) => !PROJECT_DONE.includes(str(p.stage)) && str(p.stage) !== "on-hold").length;
    return { active, ready, onboarding, live };
  }, [team, projects]);

  const checklistMember = checklistId ? team.find((m) => m.id === checklistId) : undefined;

  return (
    <div className="space-y-8">
      {error && <p className="rounded border border-bad/30 bg-bad/10 px-3 py-2 text-sm text-bad">{error}</p>}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Active team" value={stats.active} sub={`${team.length} on record`} />
        <StatCard label="Paperwork done" value={`${stats.ready}/${team.length}`} sub="Agreement / NDA and IP assignment signed" progress={team.length ? stats.ready / team.length : 0} />
        <StatCard label="Onboarding" value={stats.onboarding} sub="Still finishing the onboarding checklist" />
        <StatCard label="Live projects" value={stats.live} sub="Across the whole team" tone="dark" />
      </div>

      {loading ? (
        <Loading label="Loading team…" />
      ) : members.length === 0 ? (
        <EmptyState icon="Users" title="No team members yet" description="Add founders, staff, interns and freelancers below. Everyone signs the agreement and IP assignment before touching client work." />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-label="Team directory">
          {members.map((m) => (
            <li key={m.id}>
              <MemberCard member={m} projects={projects} shoots={shoots} year={year} today={today} canEdit={canEdit} onEdit={() => setOpenId(m.id)} onChecklist={() => setChecklistId(m.id)} onPhoto={() => void refresh()} />
            </li>
          ))}
        </ul>
      )}

      <section aria-labelledby="team-table">
        <h2 id="team-table" className="mb-3 text-sm font-semibold">
          All members
        </h2>
        <CollectionManager name="team" openId={openId} onOpenChange={setOpenId} newLabel="Add member" defaults={{ status: "onboarding", type: "Freelance" }} />
      </section>

      {checklistMember && (
        <ChecklistModal
          key={checklistMember.id}
          member={checklistMember}
          canEdit={canEdit}
          onClose={() => setChecklistId(null)}
          onSave={async (checks) => {
            const allDone = ONBOARDING.every((i) => checks[i.key]);
            await save({
              ...checklistMember,
              onboarding: checks,
              agreementSigned: checks.agreement,
              ipAssigned: checks.ipAssignment,
              status: allDone && str(checklistMember.status) === "onboarding" ? "active" : checklistMember.status,
            });
          }}
        />
      )}
    </div>
  );
}

/* ───────────────────────── member card ───────────────────────── */

function MemberCard({ member, projects, shoots, year, today, canEdit, onEdit, onChecklist, onPhoto }: { member: Rec; projects: Rec[]; shoots: Rec[]; year: string; today: string | null; canEdit: boolean; onEdit: () => void; onChecklist: () => void; onPhoto: () => void }) {
  const name = str(member.name);
  const mine = useMemo(() => memberProjects(member, projects), [member, projects]);
  const live = mine.filter((p) => !PROJECT_DONE.includes(str(p.stage)) && str(p.stage) !== "on-hold").length;
  const done = year ? mine.filter((p) => str(p.stage) === "completed" && (str(p.dueDate) || str(p.startDate)).startsWith(year)).length : 0;
  const upcoming = today ? memberShoots(member, shoots).filter((s) => str(s.status) !== "cancelled" && str(s.date) >= today).length : 0;
  const { done: steps, total } = onboardingProgress(member);
  const skills = Array.isArray(member.skills) ? member.skills.map(str).filter(Boolean) : [];
  const phone = str(member.phone).trim();
  const email = str(member.email).trim();
  const status = str(member.status) || "active";

  const flags = [
    { label: "Agreement signed", ok: member.agreementSigned === true },
    { label: "IP assigned", ok: member.ipAssigned === true },
    { label: "Payout on file", ok: !!str(member.payoutDetails).trim() },
  ];

  return (
    <article className="relative flex h-full flex-col overflow-hidden rounded-[var(--radius-md)] border border-graphite/12 bg-paper-50 shadow-[var(--shadow-paper)] transition-shadow hover:shadow-[var(--shadow-lift)]">
      <div className="hatch-light pointer-events-none absolute inset-x-0 top-0 h-16 opacity-70" aria-hidden />
      <div className="relative flex items-start gap-4 p-5 pb-4">
        <MemberPhoto member={member} canEdit={canEdit} onChanged={onPhoto} />
        <div className="min-w-0 flex-1 pt-1">
          <h3 className="truncate text-[17px] font-bold leading-tight tracking-tight">{name}</h3>
          <p className="truncate text-sm text-charcoal">{str(member.role) || "Role not set"}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {str(member.type) && <Badge tone="outline">{str(member.type)}</Badge>}
            <Badge tone={statusTone(status)} dot>
              {status}
            </Badge>
            {live > 0 && <Badge tone="dark">{live} live project{live === 1 ? "" : "s"}</Badge>}
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-4 px-5 pb-5">
        {(phone || email) && (
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm">
            {phone && (
              <a href={`tel:${phone.replace(/[^\d+]/g, "")}`} className="inline-flex items-center gap-1.5 text-charcoal underline-offset-2 hover:text-graphite hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-graphite">
                <Phone className="size-3.5 text-blueprint" aria-hidden /> <span className="tabular">{phone}</span>
              </a>
            )}
            {email && (
              <a href={`mailto:${email}`} className="inline-flex min-w-0 items-center gap-1.5 text-charcoal underline-offset-2 hover:text-graphite hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-graphite">
                <Mail className="size-3.5 shrink-0 text-blueprint" aria-hidden /> <span className="truncate">{email}</span>
              </a>
            )}
          </div>
        )}

        <ul className="flex flex-wrap gap-1.5" aria-label="Compliance">
          {flags.map((f) => (
            <li
              key={f.label}
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold",
                f.ok ? "border-graphite bg-graphite text-paper" : "border-dashed border-graphite/30 text-blueprint",
              )}
            >
              {f.ok ? <Check className="size-3" aria-hidden /> : <X className="size-3" aria-hidden />}
              {f.label}
              <span className="sr-only">{f.ok ? ": yes" : ": no"}</span>
            </li>
          ))}
        </ul>

        {skills.length > 0 && (
          <p className="flex flex-wrap gap-1.5">
            {skills.slice(0, 5).map((s) => (
              <span key={s} className="rounded-[var(--radius-sm)] bg-graphite/[0.06] px-2 py-0.5 text-xs text-charcoal">
                {s}
              </span>
            ))}
            {skills.length > 5 && <span className="px-1 py-0.5 text-xs text-blueprint">+{skills.length - 5}</span>}
          </p>
        )}

        <dl className="mt-auto grid grid-cols-3 divide-x divide-graphite/10 rounded-[var(--radius-sm)] border border-graphite/10 bg-paper text-center">
          <div className="px-2 py-2">
            <dt className="annot text-[9px] text-blueprint">Delivered {year}</dt>
            <dd className="tabular text-lg font-bold">{done}</dd>
          </div>
          <div className="px-2 py-2">
            <dt className="annot text-[9px] text-blueprint">Shoots ahead</dt>
            <dd className="tabular text-lg font-bold">{upcoming}</dd>
          </div>
          <div className="px-2 py-2">
            <dt className="annot text-[9px] text-blueprint">Joined</dt>
            <dd className="tabular pt-1 text-xs font-semibold">{member.joinDate ? formatDate(str(member.joinDate), { month: "short", year: "2-digit", day: undefined }) : "—"}</dd>
          </div>
        </dl>

        <div>
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="annot text-blueprint">Onboarding</span>
            <span className="tabular font-semibold">
              {steps}/{total}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-graphite/10" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={steps} aria-label={`Onboarding steps complete for ${name}`}>
            <div className="h-full rounded-full bg-graphite transition-[width] duration-500" style={{ width: `${(steps / total) * 100}%` }} />
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="secondary" size="sm" className="flex-1" onClick={onChecklist}>
            <ClipboardCheck className="size-3.5" aria-hidden /> Checklist
          </Button>
          {canEdit && (
            <Button variant="ghost" size="sm" onClick={onEdit} aria-label={`Edit ${name}`}>
              <Pencil className="size-3.5" aria-hidden /> Edit
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}

/* ───────────────────────── onboarding checklist modal ───────────────────────── */

function ChecklistModal({ member, canEdit, onClose, onSave }: { member: Rec; canEdit: boolean; onClose: () => void; onSave: (s: OnboardingState) => Promise<void> }) {
  const [checks, setChecks] = useState<OnboardingState>(() => onboardingState(member));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const done = ONBOARDING.filter((i) => checks[i.key]).length;
  const wasOnboarding = str(member.status) === "onboarding";

  async function submit() {
    setBusy(true);
    setErr("");
    try {
      await onSave(checks);
      onClose();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not save");
      setBusy(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={`Onboarding: ${str(member.name)}`}
      size="max-w-xl"
      footer={
        <div className="flex items-center gap-2">
          <p className="tabular mr-auto text-xs text-blueprint">
            {done}/{ONBOARDING.length} complete
          </p>
          <Button variant="ghost" size="sm" onClick={onClose}>
            {canEdit ? "Cancel" : "Close"}
          </Button>
          {canEdit && (
            <Button size="sm" onClick={submit} disabled={busy}>
              {busy && <Loader2 className="size-4 animate-spin" aria-hidden />} Save checklist
            </Button>
          )}
        </div>
      }
    >
      <fieldset disabled={!canEdit || busy} className="space-y-1">
        <legend className="sr-only">Onboarding steps</legend>
        {ONBOARDING.map((item) => (
          <label key={item.key} className="flex cursor-pointer items-start gap-3 rounded-[var(--radius-sm)] border border-transparent px-2 py-2.5 hover:border-graphite/10 hover:bg-graphite/[0.03] has-[:focus-visible]:border-graphite">
            <input
              type="checkbox"
              checked={checks[item.key]}
              onChange={(e) => setChecks((c) => ({ ...c, [item.key]: e.target.checked }))}
              className="mt-0.5 size-4 shrink-0 accent-graphite"
            />
            <span>
              <span className="block text-sm font-semibold">{item.label}</span>
              <span className="block text-xs text-blueprint">{item.hint}</span>
            </span>
          </label>
        ))}
      </fieldset>
      {wasOnboarding && <p className="mt-3 rounded bg-graphite/[0.05] px-3 py-2 text-xs text-charcoal">Completing every step moves this member from “onboarding” to “active”.</p>}
      {!canEdit && <p className="mt-3 text-xs text-blueprint">Only founders and admins can change the checklist.</p>}
      {err && <p className="mt-3 rounded border border-bad/30 bg-bad/10 px-3 py-2 text-sm text-bad">{err}</p>}
    </Modal>
  );
}
