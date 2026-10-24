import { NextResponse } from "next/server";
import { clientIp, rateLimit } from "@/lib/hq/api";
import { authenticatePortal, cookieOptions, PORTAL_COOKIE, signPortalSession, updatePortalAccounts } from "@/lib/portal/auth";

/** POST { email, password } → client portal sign-in · DELETE → sign out. */
export async function POST(req: Request) {
  if (!rateLimit(`portal-login:${clientIp(req)}`, 10, 10 * 60 * 1000)) return NextResponse.json({ error: "Too many attempts. Try again in 10 minutes." }, { status: 429 });
  let body: { email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const a = await authenticatePortal(String(body.email ?? ""), String(body.password ?? ""));
  if (!a) return NextResponse.json({ error: "Wrong email or password" }, { status: 401 });
  // remember the sign-in (best effort: a failed write never blocks the client)
  updatePortalAccounts(
    (list) => {
      const x = list.find((y) => y.email === a.email);
      if (x) x.lastSignInAt = new Date().toISOString();
      return list;
    },
    "Client portal: sign-in",
    a.email,
  ).catch(() => {});
  const res = NextResponse.json({ ok: true, mustChange: !!a.mustChange });
  res.cookies.set(PORTAL_COOKIE, await signPortalSession(a), cookieOptions);
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(PORTAL_COOKIE, "", { ...cookieOptions, maxAge: 0 });
  return res;
}
