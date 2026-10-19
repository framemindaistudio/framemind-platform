import { NextResponse } from "next/server";
import { apiUser, configuredUsers } from "@/lib/hq/auth";
import { apiError } from "@/lib/hq/api";
import { MANAGED_ROLES, USERNAME_RE, hashPassword, oneTimePassword, passwordProblem, readAccounts, updateAccounts, type StoredAccount } from "@/lib/hq/accounts";
import { roleLabels, type Role } from "@/lib/hq/roles";

/**
 * Settings → Logins. Founders only.
 *
 * GET                         → the built-in logins (HQ_USERS) and the ones managed here; never a password or hash
 * POST   { username, name, role, teamId?, password?, mustChange? }
 *                             → creates a login; the password is made here unless the founder typed one, and is
 *                               returned once, for the founder to hand over
 * PATCH  { username, action: "reset", password? }        → a new one-time password, returned once
 *        { username, action: "update", name?, role?, teamId? }
 *        { username, action: "pause" | "resume" }
 *        { username, action: "forget-own-password" }      → a built-in login goes back to its HQ_USERS password
 * DELETE ?username=           → removes a managed login
 *
 * Built-in logins cannot be created, changed or removed here, so HQ can never lock the founders out. Every change
 * is a commit in the private data repository by the founder who made it (Activity Log), with no password in it.
 */

const FOUNDER: Role[] = ["founder"];

type Body = { username?: string; name?: string; role?: string; teamId?: string; password?: string; mustChange?: boolean; action?: string };

const now = () => new Date().toISOString();
const label = (r: Role) => roleLabels[r] ?? r;

function bad(error: string, status = 400) {
  return NextResponse.json({ error }, { status });
}

function publicView(a: StoredAccount) {
  return {
    username: a.username,
    name: a.name,
    role: a.role,
    mustChange: !!a.mustChange,
    disabled: !!a.disabled,
    teamId: a.teamId ?? "",
    createdAt: a.createdAt,
    createdBy: a.createdBy,
    updatedAt: a.updatedAt,
    passwordChangedAt: a.passwordChangedAt ?? "",
  };
}

export async function GET() {
  const { error } = await apiUser(FOUNDER);
  if (error) return error;
  try {
    const { accounts } = await readAccounts(true);
    const builtIn = configuredUsers().map((u) => ({
      username: u.username,
      name: u.name,
      role: u.role,
      ownPassword: accounts.some((a) => a.builtInOverride && a.username === u.username),
    }));
    const names = new Set(builtIn.map((u) => u.username));
    const managed = accounts.filter((a) => !a.builtInOverride && !names.has(a.username)).map(publicView);
    return NextResponse.json({ builtIn, managed, roles: MANAGED_ROLES });
  } catch (e) {
    return apiError(e);
  }
}

async function readBody(req: Request): Promise<Body | null> {
  try {
    const b = await req.json();
    return b && typeof b === "object" ? (b as Body) : null;
  } catch {
    return null;
  }
}

function cleanName(v: unknown) {
  return String(v ?? "").replace(/\s+/g, " ").trim().slice(0, 80);
}

export async function POST(req: Request) {
  const { user, error } = await apiUser(FOUNDER);
  if (error) return error;
  const body = await readBody(req);
  if (!body) return bad("Invalid request");

  const username = String(body.username ?? "").trim().toLowerCase();
  const name = cleanName(body.name);
  const role = String(body.role ?? "") as Role;
  if (!USERNAME_RE.test(username)) return bad("Username: 3 to 32 lowercase letters, numbers, dot, dash or underscore, starting with a letter or number.");
  if (name.length < 2) return bad("Enter the person's name.");
  if (!MANAGED_ROLES.includes(role)) return bad("Choose a role. Founder logins are set up outside HQ.");
  if (configuredUsers().some((u) => u.username === username)) return bad("That username is a built-in login. Choose another.");
  const typed = String(body.password ?? "");
  if (typed) {
    const problem = passwordProblem(typed, username);
    if (problem) return bad(problem);
  }
  const password = typed || oneTimePassword();
  const mustChange = body.mustChange !== false;

  try {
    if ((await readAccounts(true)).accounts.some((a) => a.username === username)) return bad("That username is already used. Choose another.", 409);
    let taken = false;
    await updateAccounts(
      (list) => {
        if (list.some((a) => a.username === username)) {
          taken = true;
          return list;
        }
        const t = now();
        return [
          ...list,
          { username, name, role, password: hashPassword(password), mustChange, teamId: String(body.teamId ?? "").slice(0, 60) || undefined, createdAt: t, createdBy: user.name, updatedAt: t, updatedBy: user.name },
        ];
      },
      `Logins: ${user.name} created a login for ${name} (${label(role)})`,
      user.name,
    );
    if (taken) return bad("That username is already used. Choose another.", 409);
    return NextResponse.json({ ok: true, username, password, mustChange });
  } catch (e) {
    return apiError(e);
  }
}

export async function PATCH(req: Request) {
  const { user, error } = await apiUser(FOUNDER);
  if (error) return error;
  const body = await readBody(req);
  if (!body) return bad("Invalid request");
  const username = String(body.username ?? "").trim().toLowerCase();
  const action = String(body.action ?? "");
  const builtIn = configuredUsers().some((u) => u.username === username);

  try {
    if (action === "forget-own-password") {
      if (!builtIn) return bad("Only a built-in login has a password of its own to forget.");
      await updateAccounts((list) => list.filter((a) => !(a.builtInOverride && a.username === username)), `Logins: ${user.name} returned ${username} to its built-in password`, user.name);
      return NextResponse.json({ ok: true });
    }
    if (builtIn) return bad("Built-in logins are changed with scripts/hq-user.mjs, not here.");

    // look the login up first, so the change can be checked and described before it is saved
    const current = (await readAccounts(true)).accounts.find((a) => !a.builtInOverride && a.username === username);
    if (!current) return bad("No such login.", 404);

    const t = now();
    const stamp = { updatedAt: t, updatedBy: user.name };
    let patch: Partial<StoredAccount>;
    let message: string;
    let password = "";
    switch (action) {
      case "reset": {
        const typed = String(body.password ?? "");
        const problem = typed ? passwordProblem(typed, username) : null;
        if (problem) return bad(problem);
        password = typed || oneTimePassword();
        patch = { password: hashPassword(password), mustChange: true, passwordChangedAt: t };
        message = `Logins: ${user.name} reset the password of ${current.name}`;
        break;
      }
      case "pause":
        patch = { disabled: true };
        message = `Logins: ${user.name} paused the login of ${current.name}`;
        break;
      case "resume":
        patch = { disabled: false };
        message = `Logins: ${user.name} resumed the login of ${current.name}`;
        break;
      case "update": {
        const name = body.name !== undefined ? cleanName(body.name) : current.name;
        const role = body.role !== undefined ? (String(body.role) as Role) : current.role;
        if (name.length < 2) return bad("Enter the person's name.");
        if (!MANAGED_ROLES.includes(role)) return bad("Choose a role. Founder logins are set up outside HQ.");
        patch = { name, role, teamId: body.teamId !== undefined ? String(body.teamId).slice(0, 60) || undefined : current.teamId };
        message = role !== current.role ? `Logins: ${user.name} changed ${name} from ${label(current.role)} to ${label(role)}` : `Logins: ${user.name} updated the login of ${name}`;
        break;
      }
      default:
        return bad("Unknown change.");
    }

    let found = false;
    await updateAccounts(
      (list) =>
        list.map((a) => {
          if (a.builtInOverride || a.username !== username) return a;
          found = true;
          return { ...a, ...patch, ...stamp };
        }),
      message,
      user.name,
    );
    if (!found) return bad("No such login.", 404);
    return NextResponse.json({ ok: true, ...(password ? { password } : {}) });
  } catch (e) {
    return apiError(e);
  }
}

export async function DELETE(req: Request) {
  const { user, error } = await apiUser(FOUNDER);
  if (error) return error;
  const username = (new URL(req.url).searchParams.get("username") ?? "").trim().toLowerCase();
  if (configuredUsers().some((u) => u.username === username)) return bad("Built-in logins are removed with scripts/hq-user.mjs, not here.");
  try {
    if (!(await readAccounts(true)).accounts.some((a) => !a.builtInOverride && a.username === username)) return bad("No such login.", 404);
    let name = "";
    await updateAccounts(
      (list) =>
        list.filter((a) => {
          if (a.builtInOverride || a.username !== username) return true;
          name = a.name;
          return false;
        }),
      `Logins: ${user.name} removed the login ${username}`,
      user.name,
    );
    if (!name) return bad("No such login.", 404);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}
