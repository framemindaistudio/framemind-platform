"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Copy, KeyRound, Pause, Play, Trash2, UserPlus } from "lucide-react";
import { api } from "@/components/hq/data";
import { Field, Input, Select } from "@/components/ui/form";
import { Button } from "@/components/ui/Button";
import { MANAGED_ROLES, ROLE_HELP, roleLabels, type Role } from "@/lib/hq/roles";
import { cn } from "@/lib/utils";
import { StatusPill, Subhead } from "./shared";

interface Managed {
  username: string;
  name: string;
  role: Role;
  mustChange: boolean;
  disabled: boolean;
  teamId: string;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  passwordChangedAt: string;
}
interface BuiltIn {
  username: string;
  name: string;
  role: Role;
  ownPassword: boolean;
}
interface Member {
  id: string;
  name?: string;
  role?: string;
  type?: string;
  status?: string;
}
/** A password just made, shown once so the founder can hand it over. */
interface Handover {
  name: string;
  username: string;
  password: string;
  mustChange: boolean;
}

const fmtDate = (iso: string) => (iso ? new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "");

/** A login name from a person's name: "Ravi Kumar" → "ravi.k". */
function suggestUsername(name: string, taken: Set<string>) {
  const parts = name.toLowerCase().normalize("NFKD").replace(/[^a-z\s]/g, "").split(/\s+/).filter(Boolean);
  if (!parts.length) return "";
  const base = parts.length > 1 ? `${parts[0]}.${parts[parts.length - 1][0]}` : parts[0];
  let u = base.slice(0, 28);
  for (let n = 2; taken.has(u); n++) u = `${base.slice(0, 26)}${n}`;
  return u.length >= 3 ? u : `${u}.fm`;
}

/** The role that fits a Team & Payroll member. */
function suggestRole(m: Member): Role {
  // roles are typed freely ("UI/UX Design Intern"), so match on words
  const role = String(m.role ?? "");
  if (m.type === "Intern" || /\bintern\b/i.test(role)) return "viewer";
  if (/media|editor|film|video|photo/i.test(role)) return "media";
  if (/operation/i.test(role)) return "ops";
  return "studio";
}

export function LoginsPanel() {
  const [state, setState] = useState<{ status: "loading" } | { status: "error"; message: string } | { status: "ready"; builtIn: BuiltIn[]; managed: Managed[] }>({ status: "loading" });
  const [team, setTeam] = useState<Member[]>([]);
  const [handover, setHandover] = useState<Handover | null>(null);
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    try {
      const j = await api<{ builtIn: BuiltIn[]; managed: Managed[] }>("/api/hq/accounts");
      setState({ status: "ready", builtIn: j.builtIn, managed: j.managed });
    } catch (e) {
      setState({ status: "error", message: e instanceof Error ? e.message : "Could not load the logins." });
    }
  }, []);

  useEffect(() => {
    let alive = true;
    api<{ builtIn: BuiltIn[]; managed: Managed[] }>("/api/hq/accounts")
      .then((j) => alive && setState({ status: "ready", builtIn: j.builtIn, managed: j.managed }))
      .catch((e) => alive && setState({ status: "error", message: e instanceof Error ? e.message : "Could not load the logins." }));
    api<{ records: Member[] }>("/api/hq/collections/team")
      .then((j) => setTeam(j.records.filter((m) => m.status !== "inactive" && !/founder/i.test(String(m.role ?? "")))))
      .catch(() => setTeam([]));
    return () => {
      alive = false;
    };
  }, []);

  const taken = useMemo(() => new Set(state.status === "ready" ? [...state.builtIn, ...state.managed].map((u) => u.username) : []), [state]);

  async function change(body: Record<string, unknown>, done: string) {
    setNotice("");
    try {
      const j = await api<{ password?: string }>("/api/hq/accounts", { method: "PATCH", body: JSON.stringify(body) });
      if (j.password && state.status === "ready") {
        const a = state.managed.find((m) => m.username === body.username);
        setHandover({ name: a?.name ?? String(body.username), username: String(body.username), password: j.password, mustChange: true });
      } else setNotice(done);
      await load();
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "That did not work.");
    }
  }

  async function remove(a: Managed) {
    if (!window.confirm(`Remove the login “${a.username}” of ${a.name}? They are signed out at once and cannot sign in again. (To stop it for a while instead, use Pause.)`)) return;
    setNotice("");
    try {
      await api(`/api/hq/accounts?username=${encodeURIComponent(a.username)}`, { method: "DELETE" });
      setNotice(`Removed the login of ${a.name}.`);
      await load();
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Could not remove it.");
    }
  }

  return (
    <div data-logins>
      <p className="mb-5 max-w-[70ch] text-sm text-charcoal">
        Give every intern and employee a login of their own. You choose the username and role; HQ makes a one-time password for you to hand over, and they choose their own password the first time they sign in. You can reset it, change the role, pause the login or remove it at any time; it takes effect on their next click.
      </p>

      {handover && <HandoverCard h={handover} onClose={() => setHandover(null)} />}
      {notice && (
        <p role="status" className="mb-4 rounded-[var(--radius-sm)] border border-graphite/15 bg-paper px-3 py-2 text-sm text-graphite">
          {notice}
        </p>
      )}

      <NewLogin
        team={team}
        taken={taken}
        linked={new Set(state.status === "ready" ? state.managed.map((m) => m.teamId).filter(Boolean) : [])}
        onCreated={async (h) => {
          setHandover(h);
          setNotice("");
          await load();
        }}
      />

      <Subhead className="mt-8">Logins of the team</Subhead>
      {state.status === "loading" && <div className="h-24 animate-pulse rounded-[var(--radius-sm)] bg-graphite/[0.05]" aria-hidden />}
      {state.status === "error" && (
        <p role="alert" className="rounded border border-bad/30 bg-bad/10 px-3 py-2 text-sm text-bad">
          {state.message}
        </p>
      )}
      {state.status === "ready" &&
        (state.managed.length === 0 ? (
          <p className="rounded-[var(--radius-sm)] border border-dashed border-graphite/25 bg-paper px-4 py-5 text-sm text-charcoal">No logins yet. Give the first one above.</p>
        ) : (
          <div className="hq-scroll overflow-x-auto rounded-[var(--radius-sm)] border border-graphite/12" data-lenis-prevent>
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-graphite/12 bg-graphite/[0.035] text-left">
                  {["Person", "Username", "Role", "Status", ""].map((h) => (
                    <th key={h} className="annot px-4 py-2.5 text-[10px] font-semibold text-blueprint">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {state.managed.map((a) => (
                  <tr key={a.username} className={cn("border-b border-graphite/[0.07] last:border-0", a.disabled && "bg-graphite/[0.03] text-charcoal")} data-login={a.username}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-graphite">{a.name}</p>
                      <p className="text-[11px] text-blueprint">
                        Given {fmtDate(a.createdAt)} by {a.createdBy}
                        {a.passwordChangedAt ? ` · password changed ${fmtDate(a.passwordChangedAt)}` : ""}
                      </p>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{a.username}</td>
                    <td className="px-4 py-3">
                      <Select aria-label={`Role of ${a.name}`} value={a.role} onChange={(e) => void change({ username: a.username, action: "update", role: e.target.value }, `${a.name} is now ${roleLabels[e.target.value as Role]}.`)} className="h-8 min-w-[150px] text-xs">
                        {MANAGED_ROLES.map((r) => (
                          <option key={r} value={r}>
                            {roleLabels[r]}
                          </option>
                        ))}
                      </Select>
                    </td>
                    <td className="px-4 py-3">{a.disabled ? <StatusPill tone="neutral">Paused</StatusPill> : a.mustChange ? <StatusPill tone="warn">Waiting for first sign-in</StatusPill> : <StatusPill tone="ok">Active</StatusPill>}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <IconButton label={`New password for ${a.name}`} onClick={() => void change({ username: a.username, action: "reset" }, "")}>
                          <KeyRound className="size-4" />
                        </IconButton>
                        {a.disabled ? (
                          <IconButton label={`Resume ${a.name}`} onClick={() => void change({ username: a.username, action: "resume" }, `${a.name} can sign in again.`)}>
                            <Play className="size-4" />
                          </IconButton>
                        ) : (
                          <IconButton label={`Pause ${a.name}`} onClick={() => void change({ username: a.username, action: "pause" }, `${a.name} is paused and signed out.`)}>
                            <Pause className="size-4" />
                          </IconButton>
                        )}
                        <IconButton label={`Remove ${a.name}`} danger onClick={() => void remove(a)}>
                          <Trash2 className="size-4" />
                        </IconButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      <p className="mt-2 text-xs text-blueprint">
        <KeyRound className="mr-1 inline size-3" aria-hidden />
        New password: makes a one-time password and signs them out. <Pause className="mx-1 inline size-3" aria-hidden />
        Pause: stops the login for now (keeps it). <Trash2 className="mx-1 inline size-3" aria-hidden />
        Remove: deletes it.
      </p>

      {state.status === "ready" && state.builtIn.length > 0 && (
        <>
          <Subhead className="mt-8">Built-in logins (founders)</Subhead>
          <ul className="grid gap-2 sm:grid-cols-2">
            {state.builtIn.map((u) => (
              <li key={u.username} className="rounded-[var(--radius-sm)] border border-graphite/12 bg-paper px-4 py-3 text-sm">
                <p className="font-medium text-graphite">
                  {u.name} <span className="font-mono text-xs text-blueprint">· {u.username}</span>
                </p>
                <p className="mt-0.5 text-xs text-charcoal">
                  {roleLabels[u.role]} · {u.ownPassword ? "uses a password they set in HQ" : "uses the password from the server settings"}
                </p>
                {u.ownPassword && (
                  <button type="button" className="mt-1.5 text-xs font-semibold text-graphite underline underline-offset-2" onClick={() => void change({ username: u.username, action: "forget-own-password" }, `${u.name} uses the password from the server settings again.`)}>
                    Forgot it? Return to the server password
                  </button>
                )}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-blueprint">Built-in logins live in the server settings, so nothing done in HQ can lock the founders out. Their owners can still change their own password in My account.</p>
        </>
      )}
    </div>
  );
}

function IconButton({ label, onClick, danger, children }: { label: string; onClick: () => void; danger?: boolean; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} title={label} aria-label={label} className={cn("rounded p-1.5 text-charcoal hover:bg-graphite/[0.07] hover:text-graphite", danger && "hover:bg-bad/10 hover:text-bad")}>
      {children}
    </button>
  );
}

function NewLogin({ team, taken, linked, onCreated }: { team: Member[]; taken: Set<string>; linked: Set<string>; onCreated: (h: Handover) => void | Promise<void> }) {
  const [teamId, setTeamId] = useState("");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [role, setRole] = useState<Role>("viewer");
  const [ownPassword, setOwnPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [mustChange, setMustChange] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function pickMember(id: string) {
    setTeamId(id);
    const m = team.find((t) => t.id === id);
    if (!m) return;
    setName(m.name ?? "");
    setUsername(suggestUsername(m.name ?? "", taken));
    setRole(suggestRole(m));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const j = await api<{ username: string; password: string; mustChange: boolean }>("/api/hq/accounts", {
        method: "POST",
        body: JSON.stringify({ username, name, role, teamId, password: ownPassword ? password : "", mustChange }),
      });
      await onCreated({ name, username: j.username, password: j.password, mustChange: j.mustChange });
      setTeamId("");
      setName("");
      setUsername("");
      setRole("viewer");
      setPassword("");
      setOwnPassword(false);
      setMustChange(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not give the login.");
    } finally {
      setBusy(false);
    }
  }

  const free = team.filter((m) => !linked.has(m.id));

  return (
    <form onSubmit={submit} className="rounded-[var(--radius-md)] border border-graphite/12 bg-paper-50 p-5" noValidate data-new-login>
      <p className="flex items-center gap-2 text-base font-bold text-graphite">
        <UserPlus className="size-4" aria-hidden /> Give a login
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Field label="From Team & Payroll (optional)" htmlFor="nl-member" className="sm:col-span-2" help={free.length ? "Fills in the name, a username and the usual role" : "Everyone in Team & Payroll already has a login, or the list is empty"}>
          <Select id="nl-member" value={teamId} onChange={(e) => pickMember(e.target.value)}>
            <option value="">— Not linked to a team member —</option>
            {free.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} · {m.role ?? m.type ?? ""}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Full name" htmlFor="nl-name" required>
          <Input id="nl-name" value={name} onChange={(e) => setName(e.target.value)} onBlur={() => !username && name && setUsername(suggestUsername(name, taken))} autoComplete="off" required />
        </Field>
        <Field label="Username" htmlFor="nl-user" required help="Lowercase letters, numbers, dot, dash. They sign in with this.">
          <Input id="nl-user" value={username} onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, ""))} autoComplete="off" spellCheck={false} className="font-mono text-sm" required />
        </Field>
        <Field label="Role" htmlFor="nl-role" className="sm:col-span-2" help={ROLE_HELP[role]}>
          <Select id="nl-role" value={role} onChange={(e) => setRole(e.target.value as Role)}>
            {MANAGED_ROLES.map((r) => (
              <option key={r} value={r}>
                {roleLabels[r]}
              </option>
            ))}
          </Select>
        </Field>
        <fieldset className="sm:col-span-2">
          <legend className="text-sm font-medium text-graphite">Password</legend>
          <div className="mt-2 flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <label className="flex items-center gap-2">
              <input type="radio" name="nl-pw" checked={!ownPassword} onChange={() => setOwnPassword(false)} /> HQ makes a one-time password
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" name="nl-pw" checked={ownPassword} onChange={() => setOwnPassword(true)} /> I will type one
            </label>
          </div>
          {ownPassword && <Input aria-label="Password for this login" type="text" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="off" className="mt-2 font-mono text-sm" placeholder="At least 10 characters, with a number" />}
          <label className="mt-3 flex items-center gap-2 text-sm text-charcoal">
            <input type="checkbox" checked={mustChange} onChange={(e) => setMustChange(e.target.checked)} /> They choose their own password the first time they sign in (recommended)
          </label>
        </fieldset>
      </div>
      {error && (
        <p role="alert" className="mt-4 rounded border border-bad/30 bg-bad/10 px-3 py-2 text-sm text-bad">
          {error}
        </p>
      )}
      <Button type="submit" className="mt-4" disabled={busy || !name.trim() || username.length < 3 || (ownPassword && password.length < 10)}>
        {busy ? "Giving the login…" : "Give the login"}
      </Button>
    </form>
  );
}

function HandoverCard({ h, onClose }: { h: Handover; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const signIn = `${window.location.origin}/hq/login`;
  const text = `FrameMind HQ login for ${h.name}\nSign in at: ${signIn}\nUsername: ${h.username}\nPassword: ${h.password}${h.mustChange ? "\nYou will be asked to choose your own password when you first sign in." : ""}`;
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }
  return (
    <div role="status" className="mb-6 rounded-[var(--radius-md)] border-2 border-graphite bg-paper p-5" data-handover>
      <p className="font-bold text-graphite">Hand this over to {h.name}</p>
      <p className="mt-1 text-xs text-charcoal">Shown only now: HQ keeps no readable copy. Give it in person or in a private message, never in a group chat.</p>
      <dl className="mt-3 grid grid-cols-[100px_1fr] gap-y-1.5 text-sm">
        <dt className="text-charcoal">Sign in at</dt>
        <dd className="font-mono text-xs leading-5 text-graphite">{signIn}</dd>
        <dt className="text-charcoal">Username</dt>
        <dd className="font-mono text-graphite">{h.username}</dd>
        <dt className="text-charcoal">Password</dt>
        <dd className="font-mono text-lg font-semibold tracking-wide text-graphite" data-password>
          {h.password}
        </dd>
      </dl>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button type="button" size="sm" onClick={() => void copy()}>
          {copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />} {copied ? "Copied" : "Copy the details"}
        </Button>
        <Button type="button" size="sm" variant="secondary" onClick={onClose}>
          Done, hide it
        </Button>
      </div>
    </div>
  );
}
