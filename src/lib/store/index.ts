import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  REPO STORE — "a private GitHub repo IS the database"
 * ─────────────────────────────────────────────────────────────────────────────
 *  The website code can live in a public repo; company data never does.
 *  GITHUB_REPO names a SEPARATE PRIVATE repo that holds data/, OPERATIONS/ and vault/.
 *
 *  • github   — GITHUB_TOKEN + GITHUB_REPO set: every read hits the GitHub
 *               Contents API, every write is a commit (full version history).
 *               Writes are refused if that repo is public.
 *  • local    — development: reads/writes files in the project folder
 *               (data/, OPERATIONS/ and vault/ are gitignored in the code repo).
 *  • readonly — deployed without a token: nothing to read, writes are rejected
 *               with a clear message.
 *
 *  Only these roots are reachable: data/, OPERATIONS/, vault/, secure/ (logins; never served to a screen)
 * ─────────────────────────────────────────────────────────────────────────────
 */

export type StoreMode = "github" | "local" | "readonly";

export interface StoreEntry {
  path: string;
  name: string;
  type: "file" | "dir";
  size?: number;
  sha?: string;
}

export interface StoreFile {
  path: string;
  content: string; // utf-8 text
  sha?: string;
  size: number;
}

export interface CommitInfo {
  sha: string;
  message: string;
  author: string;
  date: string;
  url?: string;
}

export class StoreConflictError extends Error {
  constructor(message = "The file was changed by someone else. Reload and try again.") {
    super(message);
    this.name = "StoreConflictError";
  }
}
export class StoreReadOnlyError extends Error {
  constructor(message = "HQ is in read-only mode. Add GITHUB_TOKEN and GITHUB_REPO in Vercel → Settings → Environment Variables to enable saving.") {
    super(message);
    this.name = "StoreReadOnlyError";
  }
}
/** The data repo is public — saving company data there would publish it. */
export class StorePublicRepoError extends StoreReadOnlyError {
  constructor() {
    super("GITHUB_REPO is a PUBLIC repository. HQ will not save company data where anyone can read it — point GITHUB_REPO at a private repository (see README).");
    this.name = "StorePublicRepoError";
  }
}
export class StorePathError extends Error {
  constructor(message = "Path not allowed") {
    super(message);
    this.name = "StorePathError";
  }
}

// secure/ holds the HQ logins (password hashes): written by lib/hq/accounts.ts, never served by any HQ view
const ALLOWED_ROOTS = ["data", "OPERATIONS", "vault", "secure"];

export function safePath(p: string): string {
  const clean = p.replace(/\\/g, "/").replace(/^\/+/, "").replace(/\/+$/, "");
  // no "..", and nothing a Windows disk would read as another name for the same folder (streams ":", trailing dot or space, wildcards)
  if (!clean || clean.split("/").some((seg) => seg === ".." || seg === "." || seg === "" || /[:*?"<>|\u0000-\u001f]/.test(seg) || /[. ]$/.test(seg))) throw new StorePathError();
  const root = clean.split("/")[0];
  if (!ALLOWED_ROOTS.includes(root)) throw new StorePathError(`Path must start with ${ALLOWED_ROOTS.join(", ")}`);
  return clean;
}

/**
 * FrameMind and JOVE share a team but never their data. A GITHUB_REPO that names JOVE's data repository is refused
 * outright (HQ stays read-only and reads nothing from it), so a copied environment variable cannot mix the two.
 */
export function pointsAtOtherCompany(repo = process.env.GITHUB_REPO || "") {
  return /jove/i.test(repo);
}

export function storeMode(): StoreMode {
  if (pointsAtOtherCompany()) return "readonly";
  if (process.env.GITHUB_TOKEN && process.env.GITHUB_REPO) return "github";
  if (process.env.VERCEL || process.env.FRAMEMIND_READONLY === "1") return "readonly";
  return "local";
}

export function storeInfo() {
  const mode = storeMode();
  return {
    mode,
    repo: mode === "github" ? process.env.GITHUB_REPO : undefined,
    branch: branch(),
    writable: mode !== "readonly",
    /** GITHUB_REPO names JOVE's data repository: refused (see pointsAtOtherCompany) */
    otherCompany: pointsAtOtherCompany(),
  };
}

/** storeInfo() plus a live check that the data repo is private (HQ is read-only if it is public). */
export async function storeInfoChecked() {
  const info = storeInfo();
  if (info.mode !== "github") return { ...info, publicRepo: false };
  try {
    const isPrivate = await dataRepoIsPrivate();
    return { ...info, writable: isPrivate, publicRepo: !isPrivate };
  } catch {
    return { ...info, publicRepo: false };
  }
}

function branch() {
  return process.env.GITHUB_BRANCH || "main";
}

/* ───────────────────────────── GitHub backend ───────────────────────────── */

const GH = "https://api.github.com";

function ghHeaders(extra: Record<string, string> = {}) {
  return {
    Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "framemind-hq",
    ...extra,
  };
}

function encodePath(p: string) {
  return p.split("/").map(encodeURIComponent).join("/");
}

async function gh(pathname: string, init: RequestInit & { revalidate?: number } = {}) {
  const { revalidate, ...rest } = init;
  const res = await fetch(`${GH}/repos/${process.env.GITHUB_REPO}${pathname}`, {
    ...rest,
    headers: ghHeaders((rest.headers as Record<string, string>) || {}),
    ...(revalidate ? { next: { revalidate } } : { cache: "no-store" }),
  });
  return res;
}

/** Is the data repo private? Checked against GitHub and cached for 10 minutes per server instance. */
let privacy: { repo: string; isPrivate: boolean; at: number } | null = null;
export async function dataRepoIsPrivate(): Promise<boolean> {
  const repo = process.env.GITHUB_REPO || "";
  if (privacy && privacy.repo === repo && Date.now() - privacy.at < 10 * 60 * 1000) return privacy.isPrivate;
  const res = await gh("");
  if (!res.ok) throw new Error(`Cannot access GITHUB_REPO "${repo}" (${res.status}). Check the repo name and that the token has Contents read/write on it.`);
  const json = await res.json();
  privacy = { repo, isPrivate: json.private === true, at: Date.now() };
  return privacy.isPrivate;
}

/** Company data must never be committed to a public repository. */
async function assertPrivateDataRepo() {
  if (!(await dataRepoIsPrivate())) throw new StorePublicRepoError();
}

async function ghRead(p: string, opts: { revalidate?: number } = {}): Promise<StoreFile | null> {
  const res = await gh(`/contents/${encodePath(p)}?ref=${encodeURIComponent(branch())}`, { revalidate: opts.revalidate });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GitHub read failed (${res.status}): ${await res.text()}`);
  const json = await res.json();
  if (Array.isArray(json)) throw new Error(`${p} is a directory`);
  let b64: string = json.content || "";
  if (!b64 && json.size > 0 && json.sha) {
    // > 1 MB files: fetch the blob
    const blob = await gh(`/git/blobs/${json.sha}`);
    if (!blob.ok) throw new Error(`GitHub blob read failed (${blob.status})`);
    b64 = (await blob.json()).content;
  }
  const buf = Buffer.from(b64, "base64");
  return { path: p, content: buf.toString("utf-8"), sha: json.sha, size: json.size };
}

async function ghReadBinary(p: string): Promise<Buffer | null> {
  const res = await gh(`/contents/${encodePath(p)}?ref=${encodeURIComponent(branch())}`, { headers: { Accept: "application/vnd.github.raw" } });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GitHub read failed (${res.status})`);
  return Buffer.from(await res.arrayBuffer());
}

async function ghWrite(p: string, content: string | Buffer, message: string, sha?: string, author?: string): Promise<{ sha: string }> {
  const body: Record<string, unknown> = {
    message: author ? `${message}\n\nby ${author} via FrameMind HQ` : message,
    content: (typeof content === "string" ? Buffer.from(content, "utf-8") : content).toString("base64"),
    branch: branch(),
  };
  if (sha) body.sha = sha;
  else {
    // creating or blind-overwriting: look up current sha (GitHub requires it for updates)
    const existing = await gh(`/contents/${encodePath(p)}?ref=${encodeURIComponent(branch())}`, { method: "GET" });
    if (existing.ok) {
      const j = await existing.json();
      if (!Array.isArray(j)) body.sha = j.sha;
    }
  }
  const res = await gh(`/contents/${encodePath(p)}`, { method: "PUT", body: JSON.stringify(body), headers: { "Content-Type": "application/json" } });
  // 409 = the file or branch moved since we read it (GitHub words this several ways, e.g.
  // "does not match <sha>" or "is at <sha> but expected <sha>") → always a conflict the caller can retry.
  if (res.status === 409) throw new StoreConflictError();
  if (res.status === 422) {
    const text = await res.text();
    if (/sha|does not match|conflict/i.test(text)) throw new StoreConflictError();
    throw new Error(`GitHub write failed (${res.status}): ${text}`);
  }
  if (!res.ok) throw new Error(`GitHub write failed (${res.status}): ${await res.text()}`);
  const json = await res.json();
  return { sha: json.content?.sha };
}

async function ghRemove(p: string, message: string, sha?: string, author?: string) {
  let s = sha;
  if (!s) {
    const cur = await ghRead(p);
    if (!cur) return;
    s = cur.sha;
  }
  const res = await gh(`/contents/${encodePath(p)}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: author ? `${message}\n\nby ${author} via FrameMind HQ` : message, sha: s, branch: branch() }),
  });
  if (res.status === 409) throw new StoreConflictError();
  if (!res.ok && res.status !== 404) throw new Error(`GitHub delete failed (${res.status}): ${await res.text()}`);
}

async function ghList(dir: string): Promise<StoreEntry[]> {
  const res = await gh(`/contents/${encodePath(dir)}?ref=${encodeURIComponent(branch())}`);
  if (res.status === 404) return [];
  if (!res.ok) throw new Error(`GitHub list failed (${res.status})`);
  const json = await res.json();
  if (!Array.isArray(json)) return [];
  return json.map((e: { path: string; name: string; type: string; size: number; sha: string }) => ({
    path: e.path,
    name: e.name,
    type: e.type === "dir" ? "dir" : "file",
    size: e.size,
    sha: e.sha,
  }));
}

async function ghTree(prefix: string): Promise<StoreEntry[]> {
  const res = await gh(`/git/trees/${encodeURIComponent(branch())}?recursive=1`);
  if (!res.ok) throw new Error(`GitHub tree failed (${res.status})`);
  const json = await res.json();
  return (json.tree as { path: string; type: string; size?: number; sha: string }[])
    .filter((t) => t.path === prefix || t.path.startsWith(prefix + "/"))
    .map((t) => ({ path: t.path, name: t.path.split("/").pop()!, type: t.type === "tree" ? "dir" : "file", size: t.size, sha: t.sha }));
}

async function ghHistory(p?: string, limit = 30): Promise<CommitInfo[]> {
  const q = new URLSearchParams({ sha: branch(), per_page: String(limit) });
  if (p) q.set("path", p);
  const res = await gh(`/commits?${q}`);
  if (!res.ok) return [];
  const json = await res.json();
  return json.map((c: { sha: string; html_url: string; commit: { message: string; author: { name: string; date: string } } }) => {
    const by = /by (.+) via FrameMind HQ/.exec(c.commit.message)?.[1];
    return {
      sha: c.sha,
      message: c.commit.message.split("\n")[0],
      author: by || c.commit.author?.name || "unknown",
      date: c.commit.author?.date,
      url: c.html_url,
    };
  });
}

async function ghReadAt(p: string, ref: string): Promise<string | null> {
  const res = await gh(`/contents/${encodePath(p)}?ref=${encodeURIComponent(ref)}`, { headers: { Accept: "application/vnd.github.raw" } });
  if (!res.ok) return null;
  return await res.text();
}

/* ───────────────────────────── Local backend ────────────────────────────── */

/**
 * Resolve a store path on disk (only the allowed roots).
 * The fs calls below carry `turbopackIgnore` so the bundler does not trace the whole project into the
 * server output; the folders that must ship are listed in next.config.ts → outputFileTracingIncludes.
 */
function abs(p: string) {
  const [root, ...rest] = p.split("/");
  if (root === "data") return path.join(process.cwd(), "data", ...rest);
  if (root === "OPERATIONS") return path.join(process.cwd(), "OPERATIONS", ...rest);
  if (root === "vault") return path.join(process.cwd(), "vault", ...rest);
  if (root === "secure") return path.join(process.cwd(), "secure", ...rest);
  throw new StorePathError();
}
const sha1 = (buf: Buffer | string) => crypto.createHash("sha1").update(buf).digest("hex");

async function fsRead(p: string): Promise<StoreFile | null> {
  try {
    const buf = await fs.readFile(/*turbopackIgnore: true*/ abs(p));
    return { path: p, content: buf.toString("utf-8"), sha: sha1(buf), size: buf.length };
  } catch {
    return null;
  }
}
async function fsReadBinary(p: string): Promise<Buffer | null> {
  try {
    return await fs.readFile(/*turbopackIgnore: true*/ abs(p));
  } catch {
    return null;
  }
}
async function fsWrite(p: string, content: string | Buffer, _message: string, sha?: string): Promise<{ sha: string }> {
  if (sha) {
    const cur = await fsRead(p);
    if (cur && cur.sha !== sha) throw new StoreConflictError();
  }
  await fs.mkdir(path.dirname(abs(p)), { recursive: true });
  await fs.writeFile(abs(p), content);
  return { sha: sha1(content) };
}
async function fsRemove(p: string) {
  await fs.rm(abs(p), { force: true });
}
async function fsList(dir: string): Promise<StoreEntry[]> {
  try {
    const items = await fs.readdir(/*turbopackIgnore: true*/ abs(dir), { withFileTypes: true });
    const out: StoreEntry[] = [];
    for (const it of items) {
      if (it.name.startsWith(".")) continue;
      const rel = `${dir}/${it.name}`;
      if (it.isDirectory()) out.push({ path: rel, name: it.name, type: "dir" });
      else {
        const st = await fs.stat(/*turbopackIgnore: true*/ abs(rel));
        out.push({ path: rel, name: it.name, type: "file", size: st.size });
      }
    }
    return out;
  } catch {
    return [];
  }
}
async function fsTree(prefix: string): Promise<StoreEntry[]> {
  const out: StoreEntry[] = [];
  async function walk(dir: string) {
    const entries = await fsList(dir);
    for (const e of entries) {
      out.push(e);
      if (e.type === "dir") await walk(e.path);
    }
  }
  await walk(prefix);
  return out;
}

/* ───────────────────────────── Public API ───────────────────────────────── */

export const store = {
  mode: storeMode,

  async read(p: string, opts: { revalidate?: number } = {}): Promise<StoreFile | null> {
    const sp = safePath(p);
    return storeMode() === "github" ? ghRead(sp, opts) : fsRead(sp);
  },

  async readBinary(p: string): Promise<Buffer | null> {
    const sp = safePath(p);
    return storeMode() === "github" ? ghReadBinary(sp) : fsReadBinary(sp);
  },

  async readJSON<T>(p: string, fallback: T, opts: { revalidate?: number } = {}): Promise<{ data: T; sha?: string }> {
    const f = await store.read(p, opts);
    if (!f) return { data: fallback };
    try {
      return { data: JSON.parse(f.content) as T, sha: f.sha };
    } catch {
      return { data: fallback, sha: f.sha };
    }
  },

  async write(p: string, content: string | Buffer, message: string, opts: { sha?: string; author?: string } = {}) {
    const sp = safePath(p);
    const mode = storeMode();
    if (mode === "readonly") throw new StoreReadOnlyError();
    if (mode === "github") {
      await assertPrivateDataRepo();
      return ghWrite(sp, content, message, opts.sha, opts.author);
    }
    return fsWrite(sp, content, message, opts.sha);
  },

  async remove(p: string, message: string, opts: { sha?: string; author?: string } = {}) {
    const sp = safePath(p);
    const mode = storeMode();
    if (mode === "readonly") throw new StoreReadOnlyError();
    if (mode === "github") {
      await assertPrivateDataRepo();
      return ghRemove(sp, message, opts.sha, opts.author);
    }
    return fsRemove(sp);
  },

  async list(dir: string): Promise<StoreEntry[]> {
    const sp = safePath(dir);
    return storeMode() === "github" ? ghList(sp) : fsList(sp);
  },

  async tree(prefix: string): Promise<StoreEntry[]> {
    const sp = safePath(prefix);
    return storeMode() === "github" ? ghTree(sp) : fsTree(sp);
  },

  async history(p?: string, limit = 30): Promise<CommitInfo[]> {
    if (p) safePath(p);
    return storeMode() === "github" ? ghHistory(p, limit) : [];
  },

  async readAt(p: string, ref: string): Promise<string | null> {
    const sp = safePath(p);
    return storeMode() === "github" ? ghReadAt(sp, ref) : (await fsRead(sp))?.content ?? null;
  },
};
