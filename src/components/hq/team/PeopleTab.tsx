"use client";

import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { CollectionManager } from "@/components/hq/CollectionManager";
import { useCollection, useHq } from "@/components/hq/data";
import { StatCard } from "@/components/hq/ui";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Overlay";
import { can, LEADERSHIP } from "@/lib/hq/roles";
import { RolesBoard } from "./RolesBoard";
import { ONBOARDING, onboardingState, str, type OnboardingState, type Rec } from "./team";

/** Team → People: the company roles with their numbered places (RolesBoard), then every record in a table. */
export function PeopleTab() {
  const { user, store } = useHq();
  const { records: team, error, save, refresh } = useCollection<Rec>("team");
  const canEdit = can(user, LEADERSHIP) && store.writable;

  const [openId, setOpenId] = useState<string | null>(null);
  const [checklistId, setChecklistId] = useState<string | null>(null);

  const stats = useMemo(() => {
    const current = team.filter((m) => str(m.status) !== "inactive");
    const ready = current.filter((m) => m.agreementSigned === true && m.ipAssigned === true).length;
    const onboarding = current.filter((m) => str(m.status) === "onboarding").length;
    const interns = current.filter((m) => str(m.type) === "Intern").length;
    return { current: current.length, ready, onboarding, interns, past: team.length - current.length };
  }, [team]);

  const checklistMember = checklistId ? team.find((m) => m.id === checklistId) : undefined;

  return (
    <div className="space-y-8">
      {error && <p className="rounded border border-bad/30 bg-bad/10 px-3 py-2 text-sm text-bad">{error}</p>}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="In the team now" value={stats.current} sub={stats.past ? `${stats.past} past people on record` : "Nobody has left yet"} />
        <StatCard label="Paperwork done" value={`${stats.ready}/${stats.current}`} sub="Agreement / NDA and IP assignment signed" progress={stats.current ? stats.ready / stats.current : 0} />
        <StatCard label="Onboarding" value={stats.onboarding} sub="Still finishing the onboarding checklist" />
        <StatCard label="Interns" value={stats.interns} sub="Engagement set to Intern" tone="dark" />
      </div>

      <RolesBoard members={team} canEdit={canEdit} onEdit={setOpenId} onChecklist={setChecklistId} onChanged={() => void refresh()} />

      <section aria-labelledby="team-table">
        <h2 id="team-table" className="mb-1 text-sm font-semibold">
          All records
        </h2>
        <p className="mb-3 text-xs text-blueprint">Everyone, including past people. Add people to a role from the board above so they get their place and login.</p>
        <CollectionManager name="team" openId={openId} onOpenChange={setOpenId} newLabel="Add someone outside the roles" defaults={{ status: "onboarding", type: "Freelance" }} />
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
