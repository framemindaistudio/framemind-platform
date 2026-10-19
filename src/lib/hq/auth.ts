import "server-only";
import crypto from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { SESSION_COOKIE, verifySession } from "./session";
import { EDITORS, VIEW_ONLY_MESSAGE, type Role, type SessionUser } from "./roles";
import { verifyScrypt } from "./accounts";
import { allUsers, configuredUsers, liveUser } from "./users";

export { allUsers, configuredUsers };

function safeEqual(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) {
    crypto.timingSafeEqual(ab, ab);
    return false;
  }
  return crypto.timingSafeEqual(ab, bb);
}

export function checkPassword(stored: string, given: string) {
  if (stored.startsWith("scrypt:")) return verifyScrypt(stored, given);
  if (stored.startsWith("sha256:")) {
    const hash = crypto.createHash("sha256").update(given).digest("hex");
    return safeEqual(stored.slice(7).toLowerCase(), hash);
  }
  return safeEqual(stored, given);
}

/** The login and its stored password when the password is right, or null. */
export async function authenticate(username: string, password: string): Promise<(SessionUser & { stored: string }) | null> {
  const user = (await allUsers()).find((u) => u.username === username.trim().toLowerCase());
  if (!user) {
    checkPassword("scrypt:" + "0".repeat(32) + ":" + "0".repeat(64), password); // even out timing
    return null;
  }
  if (!checkPassword(user.password, password)) return null;
  return { username: user.username, name: user.name, role: user.role, ...(user.mustChange ? { mustChange: true } : {}), stored: user.password };
}

export async function getSession(): Promise<SessionUser | null> {
  const jar = await cookies();
  return await liveUser(await verifySession(jar.get(SESSION_COOKIE)?.value));
}

/** For server components/pages: redirect to login (or HQ home) if not allowed. */
export async function requireUser(roles?: Role[]): Promise<SessionUser> {
  const user = await getSession();
  if (!user) redirect("/hq/login");
  if (roles && !roles.includes(user.role)) redirect("/hq?denied=1");
  return user;
}

/** For route handlers: returns the user or a 401/403 response. */
export async function apiUser(roles?: Role[]): Promise<{ user: SessionUser; error?: undefined } | { user?: undefined; error: NextResponse }> {
  const user = await getSession();
  if (!user) return { error: NextResponse.json({ error: "Not signed in" }, { status: 401 }) };
  if (roles && !roles.includes(user.role)) return { error: NextResponse.json({ error: "You don't have access to this" }, { status: 403 }) };
  return { user };
}

/**
 * For route handlers that change something: the role must be allowed for this record type AND be an editor.
 * View-only accounts get a 403 that says so. (proxy.ts applies the same rule to every HQ API call that is not a read.)
 */
export async function apiEditor(roles?: Role[]): Promise<{ user: SessionUser; error?: undefined } | { user?: undefined; error: NextResponse }> {
  const res = await apiUser();
  if (res.error) return res;
  if (!EDITORS.includes(res.user.role)) return { error: NextResponse.json({ error: VIEW_ONLY_MESSAGE, viewOnly: true }, { status: 403 }) };
  if (roles && !roles.includes(res.user.role)) return { error: NextResponse.json({ error: "You don't have access to this" }, { status: 403 }) };
  return res;
}
