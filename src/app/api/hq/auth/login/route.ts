import { NextResponse } from "next/server";
import { allUsers, authenticate } from "@/lib/hq/auth";
import { SESSION_COOKIE, SESSION_TTL_SECONDS, passwordStamp, signSession } from "@/lib/hq/session";
import { clientIp, rateLimit } from "@/lib/hq/api";

export async function POST(req: Request) {
  const ip = clientIp(req);
  if (!rateLimit(`login:${ip}`, 10, 10 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many attempts. Try again in 10 minutes." }, { status: 429 });
  }
  if (!(await allUsers()).length) {
    return NextResponse.json({ error: "No HQ users configured. Set HQ_USERS in the environment (see README)." }, { status: 503 });
  }
  let body: { username?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const found = await authenticate(String(body.username || ""), String(body.password || ""));
  if (!found) return NextResponse.json({ error: "Wrong username or password" }, { status: 401 });
  const { stored, ...user } = found;

  let token: string;
  try {
    token = await signSession(user, await passwordStamp(stored));
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Session error" }, { status: 500 });
  }
  const res = NextResponse.json({ ok: true, user });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
  return res;
}
