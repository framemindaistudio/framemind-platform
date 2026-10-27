import { NextResponse } from "next/server";
import { apiUser, configuredUsers } from "@/lib/hq/auth";
import { apiError } from "@/lib/hq/api";
import { hashPassword, MANAGED_ROLES, oneTimePassword, readAccounts, updateAccounts, type StoredAccount } from "@/lib/hq/accounts";
import { POSITIONS, placeLabel, placeUsername, positionOf } from "@/lib/hq/positions";
import { getRecord, listRecords, upsertRecord } from "@/lib/hq/records";
import { LEADERSHIP, roleLabels, type Role } from "@/lib/hq/roles";

/**
 * Team → Roles: numbered places per company role (lib/hq/positions.ts), each with one fixed login.
 *
 * GET                       → the roles, the people in them (current and past) and, for founders, each place's login
 * POST { action: "add", position, access?, person: { name, phone?, email?, type?, joinDate?, monthlyPay? } }
 *                           → the person takes the lowest free place of that role (Developer 1, 2, …) and its login
 *                             (dev1, dev2, …) gets a new one-time password, returned once
 * POST { action: "left", teamId, leftOn? }     → the person has left: record kept, place freed, login paused
 * POST { action: "password", teamId }          → a new one-time password for that person's place login, returned once
 *
 * Adding people and giving passwords is for founders, like Settings → Logins. Admins see the board.
 */

const FOUNDER: Role[] = ["founder"];
const s = (v: unknown) => (v === undefined || v === null ? "" : String(v).trim());
const isCurrent = (m: Record<string, unknown>) => s(m.status) !== "inactive";

function bad(error: string, status = 400) {
  return NextResponse.json({ error }, { status });
}

export async function GET() {
  const { user, error } = await apiUser(LEADERSHIP);
  if (error) return error;
  try {
    const [team, { accounts }] = await Promise.all([listRecords("team"), user.role === "founder" ? readAccounts(true) : Promise.resolve({ accounts: [] as StoredAccount[] })]);
    const login = (username: string) => {
      const a = accounts.find((x) => !x.builtInOverride && x.username === username);
      return a ? { username: a.username, disabled: !!a.disabled, mustChange: !!a.mustChange, access: a.role, teamId: a.teamId ?? "" } : null;
    };
    const roles = POSITIONS.map((p) => {
      const people = team
        .filter((m) => m.position === p.key)
        .map((m) => {
          const place = Number(m.place) || 0;
          return {
            id: m.id,
            name: s(m.name),
            place,
            label: place ? placeLabel(p, place) : p.title,
            status: s(m.status) || "active",
            type: s(m.type),
            joinDate: s(m.joinDate),
            leftOn: s(m.leftOn),
            phone: s(m.phone),
            email: s(m.email),
            login: place ? login(placeUsername(p, place)) : null,
          };
        })
        .sort((a, b) => Number(isCurrent(b)) - Number(isCurrent(a)) || a.place - b.place || b.leftOn.localeCompare(a.leftOn));
      return { ...p, accessLabel: roleLabels[p.access], people };
    });
    const unplaced = team.filter((m) => !positionOf(m.position)).map((m) => ({ id: m.id, name: s(m.name), role: s(m.role), status: s(m.status) }));
    return NextResponse.json({ roles, unplaced, accessOptions: MANAGED_ROLES.map((r) => ({ value: r, label: roleLabels[r] })), canManage: user.role === "founder" });
  } catch (e) {
    return apiError(e);
  }
}

/** Give the place's login to this person with a fresh one-time password: created if new, re-opened if it existed. */
async function giveLogin(username: string, name: string, access: Role, teamId: string, by: string) {
  if (configuredUsers().some((u) => u.username === username)) throw Object.assign(new Error(`${username} is a built-in login. Rename that login or the role's code first.`), { status: 409 });
  const password = oneTimePassword();
  const now = new Date().toISOString();
  await updateAccounts(
    (list) => {
      const fresh = { name, role: access, teamId, password: hashPassword(password), mustChange: true, disabled: false, passwordChangedAt: now, updatedAt: now, updatedBy: by };
      if (list.some((a) => !a.builtInOverride && a.username === username)) return list.map((a) => (!a.builtInOverride && a.username === username ? { ...a, ...fresh } : a));
      return [...list, { username, createdAt: now, createdBy: by, ...fresh }];
    },
    `Logins: ${by} gave the login ${username} to ${name}`,
    by,
  );
  return password;
}

export async function POST(req: Request) {
  const { user, error } = await apiUser(FOUNDER);
  if (error) return error;
  let b: Record<string, unknown>;
  try {
    b = (await req.json()) as Record<string, unknown>;
  } catch {
    return bad("Invalid request");
  }
  try {
    if (b.action === "add") {
      const p = positionOf(b.position);
      if (!p) return bad("Choose a role.");
      const person = (b.person ?? {}) as Record<string, unknown>;
      const name = s(person.name).replace(/\s+/g, " ").slice(0, 80);
      if (name.length < 2) return bad("Enter the person's full name.");
      const access = (MANAGED_ROLES.includes(b.access as Role) ? b.access : p.access) as Role;
      const team = await listRecords("team");
      const taken = new Set(team.filter((m) => m.position === p.key && isCurrent(m)).map((m) => Number(m.place)));
      let place = 1;
      while (taken.has(place)) place++;
      const type = ["Full-time", "Part-time", "Freelance", "Intern"].includes(s(person.type)) ? s(person.type) : "Full-time";
      const monthlyPay = Number(person.monthlyPay) || undefined;
      const record = await upsertRecord(
        "team",
        {
          name,
          role: type === "Intern" ? `${p.title} Intern` : p.title,
          position: p.key,
          place,
          type,
          status: "onboarding",
          joinDate: s(person.joinDate) || undefined,
          phone: s(person.phone) || undefined,
          email: s(person.email) || undefined,
          monthlyPay,
          compensationBasis: type === "Intern" ? "stipend" : type === "Freelance" ? "freelance" : "fixed",
        },
        user.name,
      );
      const username = placeUsername(p, place);
      const password = await giveLogin(username, name, access, record.id, user.name);
      return NextResponse.json({ ok: true, member: { id: record.id, name, label: placeLabel(p, place) }, username, password });
    }

    const teamId = s(b.teamId);
    const m = await getRecord("team", teamId);
    if (!m) return bad("No such person.", 404);
    const p = positionOf(m.position);
    const place = Number(m.place) || 0;
    if (!p || !place) return bad("This person isn't in a numbered role place. Edit them in the All records table.");
    const username = placeUsername(p, place);

    if (b.action === "left") {
      const leftOn = /^\d{4}-\d{2}-\d{2}$/.test(s(b.leftOn)) ? s(b.leftOn) : new Date().toISOString().slice(0, 10);
      await upsertRecord("team", { ...m, status: "inactive", leftOn }, user.name);
      await updateAccounts(
        (list) => (list.some((a) => a.username === username && a.teamId === teamId && !a.disabled) ? list.map((a) => (a.username === username && a.teamId === teamId ? { ...a, disabled: true, updatedAt: new Date().toISOString(), updatedBy: user.name } : a)) : list),
        `Logins: ${user.name} paused ${username} — ${s(m.name)} left`,
        user.name,
      );
      return NextResponse.json({ ok: true });
    }

    if (b.action === "password") {
      if (!isCurrent(m)) return bad("This person has left. Add the new person to the role instead.");
      const current = (await readAccounts(true)).accounts.find((a) => !a.builtInOverride && a.username === username);
      const password = await giveLogin(username, s(m.name), current?.role ?? p.access, teamId, user.name);
      return NextResponse.json({ ok: true, username, password });
    }

    return bad("Unknown action");
  } catch (e) {
    const status = (e as { status?: number }).status;
    if (status) return bad(e instanceof Error ? e.message : "That did not work.", status);
    return apiError(e);
  }
}
