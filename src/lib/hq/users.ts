import { readAccounts } from "./accounts";
import { ALL, type Role, type SessionUser } from "./roles";
import { passwordStamp, type Session } from "./session";

/** Shared by proxy.ts and server code. */

export interface ConfiguredUser extends SessionUser {
  password: string; // "scrypt:…" (managed in HQ), "sha256:…" or plain (HQ_USERS)
  /** true for a login defined in HQ_USERS: it cannot be changed or removed from HQ */
  builtIn?: boolean;
}

/**
 * The built-in logins from the HQ_USERS environment variable (JSON array):
 * [{"username":"chinmay","name":"Chinmay R M","role":"founder","password":"sha256:..."}]
 * Create it with:  node scripts/make-hq-env.mjs   ·   change one login with:  node scripts/hq-user.mjs
 * An entry whose role is not recognised is ignored, so a typing mistake shows up at once as a login that does not work.
 */
export function configuredUsers(): ConfiguredUser[] {
  const raw = process.env.HQ_USERS;
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr
      .filter((u) => u && u.username && u.password && ALL.includes(u.role))
      .map((u) => ({ username: String(u.username).toLowerCase(), name: String(u.name || u.username), role: u.role as Role, password: String(u.password), builtIn: true }));
  } catch {
    return [];
  }
}

/**
 * Every login that may sign in now: the built-in ones (with a new password if the owner set one in HQ) and the
 * ones the founders manage in Settings → Logins, minus any that are paused. A managed login can never take the
 * username of a built-in one.
 */
export async function allUsers(fresh = false): Promise<ConfiguredUser[]> {
  const builtIn = configuredUsers();
  const { accounts } = await readAccounts(fresh);
  const names = new Set(builtIn.map((u) => u.username));
  const withOverrides = builtIn.map((u) => {
    const o = accounts.find((a) => a.builtInOverride && a.username === u.username);
    return o ? { ...u, password: o.password } : u;
  });
  const managed = accounts
    .filter((a) => !a.builtInOverride && !a.disabled && !names.has(a.username))
    .map((a) => ({ username: a.username, name: a.name, role: a.role, password: a.password, mustChange: !!a.mustChange, ...(a.teamId ? { teamId: a.teamId } : {}) }));
  return [...withOverrides, ...managed];
}

/**
 * A signed-in session, checked against today's logins: the account must still exist, not be paused and have the
 * same password, and its role and name are taken from there rather than from the cookie. So removing or pausing
 * someone, changing their role or giving the login a new password takes effect on their next click, not when a
 * 7-day session runs out.
 */
export async function liveUser(session: Session | null): Promise<SessionUser | null> {
  if (!session) return null;
  const name = session.username.toLowerCase();
  const matches = async (list: ConfiguredUser[]) => {
    const u = list.find((x) => x.username === name);
    return u && session.stamp && session.stamp === (await passwordStamp(u.password)) ? u : null;
  };
  // the cached list first; before refusing, the file read fresh (a login just made, or changed, on another server)
  const user = (await matches(await allUsers())) ?? (await matches(await allUsers(true)));
  if (!user) return null;
  return { username: user.username, name: user.name, role: user.role, ...(user.mustChange ? { mustChange: true } : {}), ...(user.teamId ? { teamId: user.teamId } : {}) };
}
