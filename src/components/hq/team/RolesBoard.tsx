"use client";

import { useCallback, useEffect, useState } from "react";
import { ClipboardCheck, Copy, FileSignature, KeyRound, Loader2, Pencil, Plus, UserMinus } from "lucide-react";
import { api } from "@/components/hq/data";
import { Badge, statusTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Overlay";
import { Field, Input, Select } from "@/components/ui/form";
import { cn, formatDate } from "@/lib/utils";
import { MemberPhoto } from "./MemberPhoto";
import type { Rec } from "./team";

interface Person {
  id: string;
  name: string;
  place: number;
  label: string;
  status: string;
  type: string;
  joinDate: string;
  leftOn: string;
  phone: string;
  email: string;
  login: { username: string; disabled: boolean; mustChange: boolean; access: string } | null;
}
interface RoleRow {
  key: string;
  title: string;
  code: string;
  access: string;
  accessLabel: string;
  group: string;
  about: string;
  people: Person[];
}
interface Board {
  roles: RoleRow[];
  unplaced: { id: string; name: string; role: string; status: string }[];
  accessOptions: { value: string; label: string }[];
  canManage: boolean;
}
interface Given {
  who: string;
  label: string;
  username: string;
  password: string;
}

/**
 * Team → Roles. Every company role with its numbered places (Developer 1, Developer 2, …). Adding a person gives them
 * the next free place and that place's login; when they leave, the login is paused and their record stays.
 */
export function RolesBoard({ members, canEdit, onEdit, onChecklist, onChanged }: { members: Rec[]; canEdit: boolean; onEdit: (id: string) => void; onChecklist: (id: string) => void; onChanged: () => void }) {
  const [board, setBoard] = useState<Board | null>(null);
  const [err, setErr] = useState("");
  const [adding, setAdding] = useState<RoleRow | null>(null);
  const [given, setGiven] = useState<Given | null>(null);
  const [busy, setBusy] = useState("");

  const load = useCallback(
    () =>
      api<Board>("/api/hq/team/places")
        .then((b) => {
          setBoard(b);
          setErr("");
        })
        .catch((e) => setErr(e instanceof Error ? e.message : "Could not load the roles")),
    [],
  );
  useEffect(() => {
    void load();
  }, [load]);

  async function post(body: Record<string, unknown>) {
    const r = await api<Record<string, unknown>>("/api/hq/team/places", { method: "POST", body: JSON.stringify(body) });
    await load();
    onChanged();
    return r;
  }

  async function newPassword(p: Person) {
    if (!window.confirm(`Give ${p.name} a new one-time password for ${p.login?.username ?? "their login"}? The old password stops working.`)) return;
    setBusy(p.id);
    try {
      const r = await post({ action: "password", teamId: p.id });
      setGiven({ who: p.name, label: p.label, username: String(r.username), password: String(r.password) });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not reset the password");
    } finally {
      setBusy("");
    }
  }

  async function left(p: Person) {
    const date = window.prompt(`${p.name} has left ${p.label}?\n\nTheir record, letters and payslips stay. Their login ${p.login?.username ?? ""} is paused until the next person takes this place.\n\nLast working day (YYYY-MM-DD):`, new Date().toISOString().slice(0, 10));
    if (date === null) return;
    setBusy(p.id);
    try {
      await post({ action: "left", teamId: p.id, leftOn: date });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not save");
    } finally {
      setBusy("");
    }
  }

  if (!board) return err ? <p className="rounded border border-bad/30 bg-bad/10 px-3 py-2 text-sm text-bad">{err}</p> : <p className="text-sm text-blueprint">Loading roles…</p>;
  const groups = [...new Set(board.roles.map((r) => r.group))];

  return (
    <div className="space-y-8">
      {err && <p className="rounded border border-bad/30 bg-bad/10 px-3 py-2 text-sm text-bad">{err}</p>}
      {!board.canManage && <p className="rounded border border-dashed border-graphite/25 px-3 py-2 text-sm text-charcoal">Only a founder can add people and give logins.</p>}

      {groups.map((g) => (
        <section key={g} aria-labelledby={`grp-${g}`}>
          <h2 id={`grp-${g}`} className="annot mb-3 text-blueprint">
            {g}
          </h2>
          <div className="grid gap-4 lg:grid-cols-2">
            {board.roles
              .filter((r) => r.group === g)
              .map((r) => {
                const current = r.people.filter((p) => p.status !== "inactive");
                const past = r.people.filter((p) => p.status === "inactive");
                return (
                  <article key={r.key} className="rounded-[var(--radius-md)] border border-graphite/12 bg-paper-50 p-4 shadow-[var(--shadow-paper)]">
                    <header className="flex items-start gap-3">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-[15px] font-bold leading-tight">{r.title}</h3>
                        <p className="mt-0.5 text-xs text-blueprint">{r.about}</p>
                        <p className="mt-1 text-[11px] text-charcoal">
                          Logins {r.code}1, {r.code}2… · opens HQ as {r.accessLabel}
                        </p>
                      </div>
                      {board.canManage && (
                        <Button size="sm" variant="secondary" onClick={() => setAdding(r)}>
                          <Plus className="size-3.5" aria-hidden /> Add person
                        </Button>
                      )}
                    </header>

                    {current.length ? (
                      <ul className="mt-3 divide-y divide-graphite/10 border-t border-graphite/10">
                        {current.map((p) => (
                          <li key={p.id} className="flex flex-wrap items-center gap-x-3 gap-y-1.5 py-2.5">
                            {(() => {
                              const rec = members.find((m) => m.id === p.id);
                              return rec ? <MemberPhoto member={rec} canEdit={canEdit} onChanged={onChanged} /> : null;
                            })()}
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold">
                                <span className="mr-1.5 inline-flex size-6 items-center justify-center rounded-full bg-graphite text-[11px] font-bold text-paper">{p.place}</span>
                                {p.name}
                              </p>
                              <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-blueprint">
                                <Badge tone={statusTone(p.status)} dot>
                                  {p.status}
                                </Badge>
                                {p.type && <span>{p.type}</span>}
                                {p.login ? (
                                  <span className={cn("font-mono", p.login.disabled && "line-through")}>
                                    login {p.login.username}
                                    {p.login.mustChange ? " · one-time password not changed yet" : ""}
                                  </span>
                                ) : board.canManage ? (
                                  <span className="text-warn">no login</span>
                                ) : null}
                              </p>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              <Button size="sm" variant="ghost" onClick={() => onEdit(p.id)} aria-label={`Edit ${p.name}`}>
                                <Pencil className="size-3.5" aria-hidden /> Details
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => onChecklist(p.id)}>
                                <ClipboardCheck className="size-3.5" aria-hidden /> Checklist
                              </Button>
                              <Button size="sm" variant="ghost" href="/hq/sign">
                                <FileSignature className="size-3.5" aria-hidden /> Letters
                              </Button>
                              {board.canManage && (
                                <>
                                  <Button size="sm" variant="ghost" disabled={busy === p.id} onClick={() => void newPassword(p)}>
                                    <KeyRound className="size-3.5" aria-hidden /> {p.login ? "New password" : "Give login"}
                                  </Button>
                                  <Button size="sm" variant="ghost" className="text-bad" disabled={busy === p.id} onClick={() => void left(p)}>
                                    <UserMinus className="size-3.5" aria-hidden /> Person left
                                  </Button>
                                </>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-3 border-t border-graphite/10 pt-3 text-sm text-blueprint">Nobody in this role yet.</p>
                    )}

                    {past.length > 0 && (
                      <details className="mt-2 text-xs text-blueprint">
                        <summary className="cursor-pointer">Past people ({past.length})</summary>
                        <ul className="mt-1 space-y-0.5">
                          {past.map((p) => (
                            <li key={p.id}>
                              <button type="button" className="hover:underline" onClick={() => onEdit(p.id)}>
                                {p.label} · {p.name}
                                {p.leftOn ? ` · left ${formatDate(p.leftOn)}` : ""}
                              </button>
                            </li>
                          ))}
                        </ul>
                      </details>
                    )}
                  </article>
                );
              })}
          </div>
        </section>
      ))}

      {board.unplaced.length > 0 && (
        <p className="text-xs text-blueprint">
          Not in a role yet: {board.unplaced.map((m) => m.name).join(", ")}. Founders are outside the roles. Others can be set in the All records table below.
        </p>
      )}

      {adding && (
        <AddPerson
          role={adding}
          accessOptions={board.accessOptions}
          onClose={() => setAdding(null)}
          onAdd={async (person, access) => {
            const r = await post({ action: "add", position: adding.key, access, person });
            const m = r.member as { name: string; label: string };
            setAdding(null);
            setGiven({ who: m.name, label: m.label, username: String(r.username), password: String(r.password) });
          }}
        />
      )}
      {given && <LoginGiven given={given} onClose={() => setGiven(null)} />}
    </div>
  );
}

function AddPerson({ role, accessOptions, onClose, onAdd }: { role: RoleRow; accessOptions: Board["accessOptions"]; onClose: () => void; onAdd: (person: Record<string, string>, access: string) => Promise<void> }) {
  const [f, setF] = useState({ name: "", phone: "", email: "", type: "Full-time", joinDate: new Date().toISOString().slice(0, 10), monthlyPay: "" });
  const [access, setAccess] = useState(role.access);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const next = Math.max(0, ...role.people.filter((p) => p.status !== "inactive").map((p) => p.place)) + 1;
  const freePlace = (() => {
    const taken = new Set(role.people.filter((p) => p.status !== "inactive").map((p) => p.place));
    let n = 1;
    while (taken.has(n)) n++;
    return n;
  })();
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF((x) => ({ ...x, [k]: e.target.value }));

  async function submit() {
    setBusy(true);
    setErr("");
    try {
      await onAdd(f, access);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not add");
      setBusy(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={`Add ${role.title} ${freePlace}`}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" disabled={busy || f.name.trim().length < 2} onClick={() => void submit()}>
            {busy && <Loader2 className="size-4 animate-spin" aria-hidden />} Add and give login {role.code}
            {freePlace}
          </Button>
        </div>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Full name" required className="sm:col-span-2">
          <Input value={f.name} onChange={set("name")} autoFocus placeholder="As on their ID: it goes on letters" />
        </Field>
        <Field label="Phone">
          <Input value={f.phone} onChange={set("phone")} inputMode="tel" />
        </Field>
        <Field label="Email">
          <Input value={f.email} onChange={set("email")} type="email" />
        </Field>
        <Field label="Engagement">
          <Select value={f.type} onChange={set("type")}>
            {["Full-time", "Part-time", "Freelance", "Intern"].map((t) => (
              <option key={t}>{t}</option>
            ))}
          </Select>
        </Field>
        <Field label="Joining date">
          <Input type="date" value={f.joinDate} onChange={set("joinDate")} />
        </Field>
        <Field label={f.type === "Intern" ? "Monthly stipend (₹)" : f.type === "Freelance" ? "Monthly retainer (₹, optional)" : "Monthly salary (₹)"}>
          <Input value={f.monthlyPay} onChange={set("monthlyPay")} inputMode="numeric" />
        </Field>
        <Field label="What the login opens" help="The role's usual access is chosen. View and print only, except for Admin.">
          <Select value={access} onChange={(e) => setAccess(e.target.value)}>
            {accessOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <p className="mt-3 text-xs text-blueprint">
        They become <strong>{role.title} {freePlace}</strong>
        {freePlace < next ? " (a free place someone left)" : ""} with the login <code>{role.code}{freePlace}</code>. You&apos;ll see a one-time password next; they choose their own when they first sign in. Add the rest (address, payout, documents) from Details.
      </p>
      {err && <p className="mt-3 rounded border border-bad/30 bg-bad/10 px-3 py-2 text-sm text-bad">{err}</p>}
    </Modal>
  );
}

function LoginGiven({ given, onClose }: { given: Given; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const url = typeof window !== "undefined" ? `${window.location.origin}/hq/login` : "/hq/login";
  const text = `Hi ${given.who.split(" ")[0]}, your FrameMind HQ login (${given.label}):\n${url}\nUsername: ${given.username}\nOne-time password: ${given.password}\nYou'll choose your own password when you first sign in.`;
  return (
    <Modal
      open
      onClose={onClose}
      title={`Login for ${given.who}`}
      footer={
        <div className="flex justify-end gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              void navigator.clipboard?.writeText(text).then(() => setCopied(true));
            }}
          >
            <Copy className="size-3.5" aria-hidden /> {copied ? "Copied" : "Copy message"}
          </Button>
          <Button size="sm" onClick={onClose}>
            Done
          </Button>
        </div>
      }
    >
      <dl className="grid grid-cols-[110px_1fr] gap-y-2 text-sm">
        <dt className="text-blueprint">Place</dt>
        <dd className="font-semibold">{given.label}</dd>
        <dt className="text-blueprint">Sign in at</dt>
        <dd className="break-all font-mono text-xs">{url}</dd>
        <dt className="text-blueprint">Username</dt>
        <dd className="font-mono">{given.username}</dd>
        <dt className="text-blueprint">Password</dt>
        <dd className="font-mono text-base font-bold">{given.password}</dd>
      </dl>
      <p className="mt-3 rounded bg-warn/10 px-3 py-2 text-xs text-charcoal">This password is shown only once. Send it to them privately (WhatsApp or in person). They must change it when they first sign in.</p>
    </Modal>
  );
}
