import { NextResponse } from "next/server";
import { allUsers, apiUser, checkPassword } from "@/lib/hq/auth";
import { apiError, rateLimit } from "@/lib/hq/api";
import { hashPassword, passwordProblem, updateAccounts } from "@/lib/hq/accounts";
import { SESSION_COOKIE, SESSION_TTL_SECONDS, passwordStamp, signSession } from "@/lib/hq/session";

/**
 * My account → change my password. Open to every login, view-only ones included (proxy.ts lets this one write
 * through), and to a login that still has its one-time password.
 *
 * POST { current, next } → checks the current password, saves the new one as an scrypt hash and keeps this browser
 * signed in; every other session of the login ends, because its stamp no longer matches.
 * A built-in (HQ_USERS) login keeps its role and name; only its password is overridden in HQ.
 */
export async function POST(req: Request) {
  const { user, error } = await apiUser();
  if (error) return error;
  if (!rateLimit(`own-password:${user.username}`, 8, 10 * 60 * 1000)) return NextResponse.json({ error: "Too many attempts. Try again in 10 minutes." }, { status: 429 });

  let body: { current?: string; next?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const current = String(body.current ?? "");
  const next = String(body.next ?? "");

  const me = (await allUsers()).find((u) => u.username === user.username);
  if (!me) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  if (!checkPassword(me.password, current)) return NextResponse.json({ error: "Your current password is not right." }, { status: 400 });
  const problem = passwordProblem(next, user.username);
  if (problem) return NextResponse.json({ error: problem }, { status: 400 });
  if (next === current) return NextResponse.json({ error: "Choose a password different from the one you have now." }, { status: 400 });

  try {
    const hash = hashPassword(next);
    const t = new Date().toISOString();
    await updateAccounts(
      (list) => {
        if (me.builtIn) {
          const rest = list.filter((a) => !(a.builtInOverride && a.username === me.username));
          return [...rest, { username: me.username, name: me.name, role: me.role, password: hash, builtInOverride: true, createdAt: t, createdBy: me.name, updatedAt: t, updatedBy: me.name, passwordChangedAt: t }];
        }
        return list.map((a) => (!a.builtInOverride && a.username === me.username ? { ...a, password: hash, mustChange: false, passwordChangedAt: t, updatedAt: t, updatedBy: me.name } : a));
      },
      `Logins: ${me.name} changed their own password`,
      me.name,
    );
    // a new session for this browser, tied to the new password
    const token = await signSession({ username: me.username, name: me.name, role: me.role }, await passwordStamp(hash));
    const res = NextResponse.json({ ok: true });
    res.cookies.set(SESSION_COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: SESSION_TTL_SECONDS });
    return res;
  } catch (e) {
    return apiError(e);
  }
}
