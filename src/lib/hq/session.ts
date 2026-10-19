import { SignJWT, jwtVerify } from "jose";
import type { Role, SessionUser } from "./roles";

/** Shared by proxy.ts and server code — no Node-only imports here. */
export const SESSION_COOKIE = "framemind_hq";
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

function secretText() {
  const s = process.env.HQ_SESSION_SECRET;
  if (s && s.length >= 32) return s;
  if (process.env.NODE_ENV !== "production") return "framemind-dev-only-secret-change-me-please-32+chars";
  return null;
}

function secret() {
  const s = secretText();
  return s ? new TextEncoder().encode(s) : null;
}

/** A signed-in session as read from the cookie. `stamp` ties it to the password it was opened with. */
export interface Session extends SessionUser {
  stamp: string;
}

/**
 * A short fingerprint of an account's stored password, mixed with the session secret so it reveals nothing about
 * the password itself. It goes into the cookie at sign-in; when the password changes the stamp no longer matches,
 * which ends every session opened with the old one.
 */
export async function passwordStamp(storedPassword: string): Promise<string> {
  const bytes = new TextEncoder().encode(`${secretText() ?? ""}|${storedPassword}`);
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", bytes));
  return Array.from(digest.slice(0, 8), (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function signSession(user: SessionUser, stamp: string) {
  const key = secret();
  if (!key) throw new Error("HQ_SESSION_SECRET is not set (min 32 characters).");
  return new SignJWT({ name: user.name, role: user.role, pv: stamp })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.username)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(key);
}

export async function verifySession(token: string | undefined | null): Promise<Session | null> {
  if (!token) return null;
  const key = secret();
  if (!key) return null;
  try {
    const { payload } = await jwtVerify(token, key, { algorithms: ["HS256"] });
    if (!payload.sub || !payload.role) return null;
    return { username: payload.sub, name: String(payload.name ?? payload.sub), role: payload.role as Role, stamp: typeof payload.pv === "string" ? payload.pv : "" };
  } catch {
    return null;
  }
}
