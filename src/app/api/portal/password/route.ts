import { NextResponse } from "next/server";
import { hashPassword, passwordProblem, verifyScrypt } from "@/lib/hq/accounts";
import { rateLimit } from "@/lib/hq/api";
import { cookieOptions, portalApiUser, PORTAL_COOKIE, readPortalAccounts, signPortalSession, updatePortalAccounts } from "@/lib/portal/auth";

/** POST { current, next } → the client chooses a new password (required after a one-time password). */
export async function POST(req: Request) {
  const { user, error } = await portalApiUser(true);
  if (error) return error;
  if (!rateLimit(`portal-pw:${user.email}`, 10, 10 * 60 * 1000)) return NextResponse.json({ error: "Too many attempts. Try again in 10 minutes." }, { status: 429 });
  const body = (await req.json().catch(() => ({}))) as { current?: string; next?: string };
  const current = String(body.current ?? "");
  const next = String(body.next ?? "");
  const a = (await readPortalAccounts(true)).list.find((x) => x.email === user.email);
  if (!a || !verifyScrypt(a.password, current)) return NextResponse.json({ error: "Your current password is not right." }, { status: 400 });
  const problem = passwordProblem(next, user.email.split("@")[0]);
  if (problem) return NextResponse.json({ error: problem }, { status: 400 });
  if (next === current) return NextResponse.json({ error: "Choose a password different from the one you were given." }, { status: 400 });
  const stamp = new Date().toISOString();
  const list = await updatePortalAccounts(
    (all) => {
      const x = all.find((y) => y.email === user.email);
      if (!x) return all;
      x.password = hashPassword(next);
      x.mustChange = false;
      x.passwordChangedAt = stamp;
      x.updatedAt = stamp;
      return all;
    },
    "Client portal: password changed",
    user.email,
  );
  const updated = list.find((x) => x.email === user.email)!;
  // the old session ends with the old password; give this browser a new one
  const res = NextResponse.json({ ok: true });
  res.cookies.set(PORTAL_COOKIE, await signPortalSession(updated), cookieOptions);
  return res;
}
