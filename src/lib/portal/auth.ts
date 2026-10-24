import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { store, StoreConflictError } from "@/lib/store";
import { hashPassword, oneTimePassword, verifyScrypt } from "@/lib/hq/accounts";
import { passwordStamp } from "@/lib/hq/session";

/**
 * Client portal logins — a world apart from HQ's staff logins.
 *
 * • Their own file: secure/portal-accounts.json in the private data repository (scrypt hashes only; no HQ screen or
 *   API serves it).
 * • Their own cookie (framemind_portal) and token audience. An HQ session is never a portal session and a portal
 *   token carries no role, so HQ's checks refuse it everywhere.
 * • A client only ever reaches the projects listed on their own login; every portal API checks that on the server.
 */

export const PORTAL_COOKIE = "framemind_portal";

/** A refusal the person can act on (shown as is, with its HTTP status). */
export class PortalError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
export const PORTAL_TTL_SECONDS = 60 * 60 * 24 * 14;
const AUDIENCE = "framemind-portal";
export const PORTAL_ACCOUNTS_PATH = "secure/portal-accounts.json";

export interface PortalAccount {
  /** the sign-in name: the client's email, lower-case */
  email: string;
  name: string;
  clientId: string;
  projectIds: string[];
  password: string;
  mustChange?: boolean;
  disabled?: boolean;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  passwordChangedAt?: string;
  lastSignInAt?: string;
}

export interface PortalUser {
  email: string;
  name: string;
  clientId: string;
  projectIds: string[];
  mustChange: boolean;
}

/* ───────────────────────────── the accounts file ───────────────────────────── */

const KEY = "__framemindPortalAccounts";
const g = globalThis as unknown as Record<string, { at: number; list: PortalAccount[]; sha?: string } | undefined>;

function clean(v: unknown): PortalAccount[] {
  return Array.isArray(v) ? v.filter((a): a is PortalAccount => !!a && typeof a.email === "string" && typeof a.password === "string" && typeof a.clientId === "string" && Array.isArray(a.projectIds)) : [];
}

export async function readPortalAccounts(fresh = false) {
  const c = g[KEY];
  if (!fresh && c && Date.now() - c.at < 20_000) return c;
  const { data, sha } = await store.readJSON<unknown>(PORTAL_ACCOUNTS_PATH, []);
  const next = { at: Date.now(), list: clean(data), sha };
  g[KEY] = next;
  return next;
}

/** Read fresh, change, write with the sha read; one retry if someone else saved in between. */
export async function updatePortalAccounts(change: (list: PortalAccount[]) => PortalAccount[], message: string, author: string) {
  for (let attempt = 0; attempt < 2; attempt++) {
    const { list, sha } = await readPortalAccounts(true);
    const before = JSON.stringify(list);
    const next = change(list.map((a) => ({ ...a, projectIds: [...a.projectIds] })));
    // nothing actually changed: no commit
    if (JSON.stringify(next) === before) return next;
    try {
      await store.write(PORTAL_ACCOUNTS_PATH, JSON.stringify(next, null, 2) + "\n", message, { sha, author });
      g[KEY] = undefined;
      return next;
    } catch (e) {
      if (e instanceof StoreConflictError && attempt === 0) continue;
      throw e;
    }
  }
  throw new StoreConflictError();
}

/** Without the password hash: what HQ screens may show about a portal login. */
export const publicAccount = (a: PortalAccount) => ({ email: a.email, name: a.name, clientId: a.clientId, projectIds: a.projectIds, mustChange: !!a.mustChange, disabled: !!a.disabled, createdAt: a.createdAt, createdBy: a.createdBy, lastSignInAt: a.lastSignInAt ?? "" });

/**
 * Give a client a login for a project, or add the project to their existing login. Returns the one-time password
 * when a new one was set (new login, or `reset`), so it can be shared once — it is never stored in readable form.
 */
export async function grantPortalAccess(o: { email: string; name: string; clientId: string; projectId: string; reset?: boolean }, by: string): Promise<{ email: string; password?: string; created: boolean }> {
  const email = o.email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new PortalError("Give the client's email address — it is their sign-in name.");
  const now = new Date().toISOString();
  let password: string | undefined;
  let created = false;
  await updatePortalAccounts(
    (list) => {
      const a = list.find((x) => x.email === email);
      if (a) {
        if (a.clientId !== o.clientId) throw new PortalError("That email already signs in for another client.");
        if (!a.projectIds.includes(o.projectId)) a.projectIds.push(o.projectId);
        if (o.reset) {
          password = oneTimePassword();
          a.password = hashPassword(password);
          a.mustChange = true;
          a.disabled = false;
        }
        a.updatedAt = now;
        return list;
      }
      created = true;
      password = oneTimePassword();
      list.push({ email, name: o.name.trim().slice(0, 120) || email, clientId: o.clientId, projectIds: [o.projectId], password: hashPassword(password), mustChange: true, createdAt: now, createdBy: by, updatedAt: now });
      return list;
    },
    `Client portal: ${created ? "new login" : "update login"}`,
    by,
  );
  return { email, password, created };
}

/* ───────────────────────────── sessions ───────────────────────────── */

function key() {
  const s = process.env.HQ_SESSION_SECRET || (process.env.NODE_ENV !== "production" ? "framemind-dev-only-secret-change-me-please-32+chars" : "");
  if (s.length < 32) throw new Error("HQ_SESSION_SECRET is not set (min 32 characters).");
  return new TextEncoder().encode(s);
}

export async function signPortalSession(a: PortalAccount) {
  return new SignJWT({ kind: "portal", pv: await passwordStamp(a.password) })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(a.email)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${PORTAL_TTL_SECONDS}s`)
    .sign(key());
}

/** The signed-in client, re-checked against the accounts file (a paused login or a new password ends the session). */
export async function getPortalUser(): Promise<PortalUser | null> {
  const token = (await cookies()).get(PORTAL_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key(), { algorithms: ["HS256"], audience: AUDIENCE });
    if (payload.kind !== "portal" || !payload.sub) return null;
    const find = async (fresh: boolean) => (await readPortalAccounts(fresh)).list.find((x) => x.email === payload.sub);
    let a = await find(false);
    if (!a || (await passwordStamp(a.password)) !== payload.pv) a = await find(true);
    if (!a || a.disabled || (await passwordStamp(a.password)) !== payload.pv) return null;
    return { email: a.email, name: a.name, clientId: a.clientId, projectIds: a.projectIds, mustChange: !!a.mustChange };
  } catch {
    return null;
  }
}

/** For portal route handlers: the client, or a 401. `allowFirst` lets a one-time-password login through (to change it). */
export async function portalApiUser(allowFirst = false): Promise<{ user: PortalUser; error?: undefined } | { user?: undefined; error: NextResponse }> {
  const user = await getPortalUser();
  if (!user) return { error: NextResponse.json({ error: "Please sign in again." }, { status: 401 }) };
  if (user.mustChange && !allowFirst) return { error: NextResponse.json({ error: "Choose your own password first.", mustChange: true }, { status: 403 }) };
  return { user };
}

/** The project id, if this client may see it. */
export function ownProject(user: PortalUser, projectId: string | null | undefined) {
  return projectId && user.projectIds.includes(projectId) ? projectId : null;
}

export async function authenticatePortal(email: string, password: string): Promise<PortalAccount | null> {
  const a = (await readPortalAccounts(true)).list.find((x) => x.email === email.trim().toLowerCase());
  if (!a) {
    verifyScrypt("scrypt:" + "0".repeat(32) + ":" + "0".repeat(64), password); // even out timing
    return null;
  }
  if (a.disabled || !verifyScrypt(a.password, password)) return null;
  return a;
}

export const cookieOptions = { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path: "/", maxAge: PORTAL_TTL_SECONDS };
