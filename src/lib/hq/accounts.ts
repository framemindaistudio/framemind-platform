import "server-only";
import crypto from "node:crypto";
import { store, StoreConflictError } from "@/lib/store";
import { ALL, MANAGED_ROLES, type Role, type SessionUser } from "./roles";

/**
 * HQ logins that the founders manage inside HQ (Settings → Logins), next to the built-in ones in the HQ_USERS
 * environment variable.
 *
 * • Built-in (HQ_USERS): the founders' own logins. They cannot be changed or removed from HQ, so a mistake in HQ can
 *   never lock the founders out; their owners may still set a new password from My account (stored here as an
 *   override of the password only).
 * • Managed here: one login per intern or employee, with a role. A founder creates it with a one-time password, and
 *   the person must choose their own at the first sign-in. A founder can reset the password, change the role,
 *   pause the login or remove it; each takes effect on the person's next click (within half a minute on other
 *   servers).
 *
 * The file lives at secure/accounts.json in the private data repository. Passwords are kept only as scrypt hashes,
 * and no HQ screen or API serves this file: not the document, file or history views, not even to founders.
 */

export const ACCOUNTS_PATH = "secure/accounts.json";

export { MANAGED_ROLES };

export interface StoredAccount {
  username: string;
  name: string;
  role: Role;
  /** "scrypt:<salt hex>:<hash hex>" */
  password: string;
  /** a one-time password set by a founder: the person must choose their own before using HQ */
  mustChange?: boolean;
  /** paused by a founder: cannot sign in, and is signed out at once */
  disabled?: boolean;
  /** the Team & Payroll member this login belongs to */
  teamId?: string;
  /** true for an entry that only overrides the password of a built-in (HQ_USERS) login */
  builtInOverride?: boolean;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
  passwordChangedAt?: string;
}

/* ── passwords ───────────────────────────────────────────────────────────── */

const SCRYPT = { N: 16384, r: 8, p: 1, keylen: 32 };

export function hashPassword(plain: string): string {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(plain, salt, SCRYPT.keylen, { N: SCRYPT.N, r: SCRYPT.r, p: SCRYPT.p });
  return `scrypt:${salt.toString("hex")}:${hash.toString("hex")}`;
}

export function verifyScrypt(stored: string, plain: string): boolean {
  const [, saltHex, hashHex] = stored.split(":");
  if (!saltHex || !hashHex) return false;
  const want = Buffer.from(hashHex, "hex");
  const got = crypto.scryptSync(plain, Buffer.from(saltHex, "hex"), want.length, { N: SCRYPT.N, r: SCRYPT.r, p: SCRYPT.p });
  return want.length === got.length && crypto.timingSafeEqual(want, got);
}

/** A one-time password that reads easily aloud or on a phone: three groups of four, no 0/O or 1/l/I. */
export function oneTimePassword(): string {
  const chars = "abcdefghjkmnpqrstuvwxyz23456789";
  const group = () => Array.from({ length: 4 }, () => chars[crypto.randomInt(chars.length)]).join("");
  return `${group()}-${group()}-${group()}`;
}

/** Why a new password is not good enough, or null. */
export function passwordProblem(plain: string, username: string): string | null {
  if (plain.length < 10) return "Use at least 10 characters.";
  if (plain.length > 128) return "Use 128 characters or fewer.";
  if (!/[a-z]/i.test(plain) || !/[0-9]/.test(plain)) return "Use letters and at least one number.";
  if (plain.toLowerCase().includes(username.toLowerCase())) return "Do not put your username in your password.";
  if (/^(.)\1+$/.test(plain) || /^(?:password|framemind|qwerty|12345)/i.test(plain)) return "That password is too easy to guess.";
  return null;
}

export const USERNAME_RE = /^[a-z0-9][a-z0-9._-]{2,31}$/;

/* ── reading and writing, with a short cache for the check made on every click ───────────────── */

interface Cache {
  at: number;
  accounts: StoredAccount[];
  sha?: string;
}
/*
 * One cache per server process, kept on globalThis: proxy.ts and the route handlers are bundled separately, and a
 * module-level variable would give each its own copy (so a login made on one would be unknown to the other).
 * Servers in other processes may lag by up to CACHE_MS; liveUser() re-reads fresh before refusing a session.
 */
const KEY = "__framemindHqAccountsCache";
const g = globalThis as unknown as Record<string, Cache | null | undefined>;
const getCache = () => g[KEY] ?? null;
const setCache = (c: Cache | null) => {
  g[KEY] = c;
};
const CACHE_MS = 20_000;

function clean(list: unknown): StoredAccount[] {
  if (!Array.isArray(list)) return [];
  return list.filter((a): a is StoredAccount => !!a && typeof a.username === "string" && typeof a.password === "string" && (a.builtInOverride || ALL.includes(a.role)));
}

/** The managed accounts. On a read failure the last good copy is used (or none), so HQ_USERS logins always work. */
export async function readAccounts(fresh = false): Promise<{ accounts: StoredAccount[]; sha?: string }> {
  const cache = getCache();
  if (!fresh && cache && Date.now() - cache.at < CACHE_MS) return cache;
  try {
    const { data, sha } = await store.readJSON<unknown>(ACCOUNTS_PATH, []);
    const next = { at: Date.now(), accounts: clean(data), sha };
    setCache(next);
    return next;
  } catch (e) {
    console.warn(`HQ logins: could not read ${ACCOUNTS_PATH}, using ${cache ? "the last good copy" : "the built-in logins only"}:`, e instanceof Error ? e.message : e);
    return cache ?? { accounts: [] };
  }
}

/**
 * Change the accounts file with one function. It is read fresh, changed, and written with the sha it was read at;
 * if someone else saved in between, it is read again and the change re-applied once. A function that returns the
 * very list it was given changes nothing and makes no commit.
 */
export async function updateAccounts(change: (list: StoredAccount[]) => StoredAccount[], message: string, author: string) {
  for (let attempt = 0; attempt < 2; attempt++) {
    const { accounts, sha } = await readAccounts(true);
    const copy = accounts.map((a) => ({ ...a }));
    const next = change(copy);
    // nothing changed (for example the login was not found): no commit
    if (next === copy) return next;
    try {
      await store.write(ACCOUNTS_PATH, JSON.stringify(next, null, 2) + "\n", message, { sha, author });
      // the next read fetches the file again, with its new sha
      setCache(null);
      return next;
    } catch (e) {
      if (e instanceof StoreConflictError && attempt === 0) continue;
      throw e;
    }
  }
  throw new StoreConflictError();
}

/** What a session needs to know about a managed account, without the password. */
export type AccountInfo = SessionUser & { mustChange?: boolean };

export function forgetAccountsCache() {
  setCache(null);
}
