#!/usr/bin/env node
/**
 * FrameMind HQ — environment generator for Vercel.
 *
 *   node scripts/make-hq-env.mjs               asks for each login (you choose the passwords)
 *   node scripts/make-hq-env.mjs --generate    no questions: creates a strong password for each founder
 *
 * Both write `.env.vercel` — the block to import in Vercel → Project → Settings → Environment Variables.
 * --generate also writes `.env.hq-logins` with the new passwords, so they never appear on screen.
 * Both files are gitignored (.env*). Only sha256 hashes of passwords go into HQ_USERS.
 *
 * Options
 *   --email you@example.com     public contact email shown on the website
 *   --site  https://…           HQ address (where it is deployed) [https://hq.framemindaistudio.site]
 *   --repo  owner/name          private data repository    [framemindaistudio/framemind-hq-data]
 *   --local                     also add the logins to .env.local, so they work on this computer
 *   --force                     replace existing .env.vercel / .env.hq-logins (this changes the passwords)
 *
 * Nothing is sent anywhere, except that a GitHub token you type is checked once against api.github.com.
 *
 * This is for the first set-up. Afterwards, add or remove one person with  node scripts/hq-user.mjs  — it leaves
 * everyone else's password alone. Only founder / admin accounts can change anything in HQ; the rest view and print.
 */
import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { fileURLToPath } from "node:url";
import { createHash, randomBytes, randomInt } from "node:crypto";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ENV_FILE = path.join(ROOT, ".env.vercel");
const LOGINS_FILE = path.join(ROOT, ".env.hq-logins");
const LOCAL_FILE = path.join(ROOT, ".env.local");

const ROLES = ["founder", "admin", "ops", "studio", "media", "viewer"];
const FOUNDERS = [
  { username: "shiva", name: "Shivaprasad Reddy S S", role: "founder" },
  { username: "chinmay", name: "Chinmay R M", role: "founder" },
];
const DEFAULT_REPO = "framemindaistudio/framemind-hq-data";
const DEFAULT_SITE = "https://hq.framemindaistudio.site";

function stop(message) {
  console.error(`\n${message}\n`);
  process.exit(1);
}

// ── arguments: --flag, --name value or --name=value ──────────────────────────
const FLAGS = ["generate", "local", "force"];
const OPTIONS = ["email", "site", "repo"];
const args = {};
{
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i++) {
    const [, name, inline] = /^--([a-z]+)(?:=(.*))?$/.exec(argv[i]) ?? [];
    if (FLAGS.includes(name) && inline === undefined) args[name] = true;
    else if (OPTIONS.includes(name)) {
      const value = inline ?? (argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[++i] : undefined);
      if (!value) stop(`--${name} needs a value, for example: --${name} ${name === "email" ? "you@example.com" : name === "site" ? DEFAULT_SITE : DEFAULT_REPO}`);
      args[name] = value;
    } else stop(`Unknown option: ${argv[i]}\nOptions: --generate  --local  --force  --email <address>  --site <url>  --repo <owner/name>`);
  }
}

// ── checks on what is typed ──────────────────────────────────────────────────
/** Returns the cleaned value, or null when it cannot be used. */
const clean = {
  site(value) {
    try {
      const url = new URL(/^[a-z]+:\/\//i.test(value) ? value : `https://${value}`);
      return /^https?:$/.test(url.protocol) && url.hostname.includes(".") ? url.origin : null;
    } catch {
      return null;
    }
  },
  repo(value) {
    const repo = value.replace(/^https?:\/\/github\.com\//i, "").replace(/\.git$/i, "").replace(/\/+$/, "");
    return /^[\w.-]+\/[\w.-]+$/.test(repo) ? repo : null;
  },
  email(value) {
    return value === "" || /^[^\s@#$]+@[^\s@#$]+\.[^\s@#$]+$/.test(value) ? value : null;
  },
};
const HINT = { site: "a web address such as https://hq.framemindaistudio.site", repo: "owner/name, for example framemindaistudio/framemind-hq-data", email: "an email address" };

function fromFlag(name, fallback) {
  if (args[name] === undefined) return fallback;
  const value = clean[name](args[name]);
  if (value === null) stop(`--${name} "${args[name]}" is not ${HINT[name]}.`);
  return value;
}

const hash = (password) => "sha256:" + createHash("sha256").update(password).digest("hex");

/** 5 groups of 4 from an alphabet without look-alikes (no 0/o, 1/l/i) — about 99 bits, and easy to type. */
function strongPassword() {
  const alphabet = "abcdefghjkmnpqrstuvwxyz23456789";
  return Array.from({ length: 5 }, () => Array.from({ length: 4 }, () => alphabet[randomInt(alphabet.length)]).join("")).join("-");
}

/** JSON on one unquoted .env line: "#" would start a comment and "$" would be expanded, so both are written as \u escapes. */
const usersJson = (users) => JSON.stringify(users).replace(/[#$]/g, (c) => "\\u" + c.charCodeAt(0).toString(16).padStart(4, "0"));

function envBlock({ users, repo, site, email, token }) {
  return [
    "# FrameMind HQ — Vercel environment variables (add to Production and Preview, then redeploy).",
    "# Vercel → Project → Settings → Environment Variables → Import .env, or paste this whole block into the Key box.",
    "# Keep this file private and delete it once the variables are saved in Vercel.",
    "",
    `HQ_SESSION_SECRET=${randomBytes(32).toString("hex")}`,
    `HQ_USERS=${usersJson(users)}`,
    "",
    `GITHUB_REPO=${repo}`,
    "GITHUB_BRANCH=main",
    "# Fine-grained GitHub token — access to the data repo only, Contents: Read and write. Paste it after the = sign.",
    `GITHUB_TOKEN=${token || ""}`,
    "",
    `NEXT_PUBLIC_SITE_URL=${site}`,
    email ? `NEXT_PUBLIC_CONTACT_EMAIL=${email}` : "# NEXT_PUBLIC_CONTACT_EMAIL=",
    "",
    "# Optional — printed on papers, cards and documents when set. To use one, remove the # and type the value after the = sign.",
    "# NEXT_PUBLIC_WEBSITE_URL=",
    "# NEXT_PUBLIC_CONTACT_PHONE=",
    "# WhatsApp: digits only, with the country code, for example 919876543210",
    "# NEXT_PUBLIC_WHATSAPP=",
    "# NEXT_PUBLIC_LOCATION=",
    "# NEXT_PUBLIC_INSTAGRAM=",
    "# NEXT_PUBLIC_YOUTUBE=",
    "# NEXT_PUBLIC_LINKEDIN=",
    "",
  ].join("\n");
}

function loginsSheet(logins, site) {
  const lines = [`FrameMind HQ — logins (created ${new Date().toISOString().slice(0, 10)})`, `Sign in at ${site}/hq`, ""];
  for (const l of logins) lines.push(`  ${l.name} (${l.role})`, `    username: ${l.username}`, `    password: ${l.password}`, "");
  lines.push(
    "Save each login in a password manager, share it privately with its owner, then delete this file.",
    'To change one password later: node scripts/hash-password.mjs "the-new-password", put the printed value in place of',
    'that person\'s "password" inside HQ_USERS in Vercel, and redeploy. (Running make-hq-env again replaces every login.)',
    "",
  );
  return lines.join("\n");
}

function refuseOverwrite(files) {
  const existing = files.filter((f) => fs.existsSync(f));
  if (!existing.length || args.force) return;
  stop(
    `${existing.map((f) => path.basename(f)).join(" and ")} already exist${existing.length > 1 ? "" : "s"}.\n` +
      "Running again creates a new session secret and replaces every login. Add --force to do that.",
  );
}

// ── .env.local (only with --local) ───────────────────────────────────────────
const USERS_LINE = /^HQ_USERS=(.*)$/gm;

/** The logins already in .env.local. Stops before anything is written when they cannot be read safely. */
function readLocal() {
  const text = fs.existsSync(LOCAL_FILE) ? fs.readFileSync(LOCAL_FILE, "utf8") : "";
  const raw = [...text.matchAll(USERS_LINE)].pop()?.[1].trim(); // the last one wins, as it does when the file is loaded
  if (!raw) return { text, users: [] };
  let users;
  try {
    users = JSON.parse(raw.replace(/^(['"`])(.*)\1$/s, "$2"));
  } catch {
    users = null;
  }
  if (!Array.isArray(users) || users.some((u) => !u || typeof u !== "object" || !u.username)) {
    stop("The HQ_USERS line in .env.local is not a list of logins, so --local cannot add to it safely.\nFix or remove that line, or run again without --local. Nothing was written.");
  }
  return { text, users };
}

/** Adds or replaces these logins (and the contact email) in .env.local, leaving everything else as it is. */
function writeLocal({ text, users: current }, users, email) {
  const setLine = (key, value) => {
    const line = `${key}=${value}`;
    const re = new RegExp(`^${key}=.*$`, "gm");
    let placed = false;
    const next = text.replace(re, () => (placed ? "\0" : ((placed = true), line))).replace(/\0\r?\n?/g, "");
    text = placed ? next : `${text.replace(/\s*$/, "")}${text.trim() ? "\n" : ""}${line}\n`;
  };
  const names = new Set(users.map((u) => u.username));
  setLine("HQ_USERS", usersJson([...current.filter((u) => !names.has(u.username)), ...users]));
  if (!/^HQ_SESSION_SECRET=.{32,}$/m.test(text)) setLine("HQ_SESSION_SECRET", randomBytes(32).toString("hex"));
  if (email) setLine("NEXT_PUBLIC_CONTACT_EMAIL", email);
  fs.writeFileSync(LOCAL_FILE, text);
}

/** Checks a fine-grained token against the data repo. `keep` is false when GitHub itself turned it down. */
async function checkToken(token, repo) {
  const headers = { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json", "User-Agent": "framemind-hq-env" };
  const bad = (message) => ({ ok: false, keep: false, message });
  try {
    const res = await fetch(`https://api.github.com/repos/${repo}`, { headers });
    if (res.status === 401) return bad("GitHub rejected this token. Check that you copied all of it.");
    if (res.status === 403 || res.status === 404) return bad(`This token cannot see ${repo}. Under Repository access, choose "Only select repositories" and pick that repository.`);
    if (!res.ok) return { ok: false, keep: true, message: `GitHub answered ${res.status} for ${repo}, so the token was saved unchecked.` };
    if (!(await res.json()).private) return bad(`${repo} is PUBLIC. HQ refuses to save company data in a public repository.`);
    const contents = await fetch(`https://api.github.com/repos/${repo}/contents/data`, { headers });
    if (contents.status === 401 || contents.status === 403) return bad("This token cannot read the repository's files. Set Repository permissions → Contents → Read and write.");
    const empty = contents.status === 404 ? " It has no data folder yet; HQ creates it on the first save." : "";
    return { ok: true, keep: true, message: `The token can read ${repo}, and the repository is private.${empty} (Saving is confirmed the first time you save in HQ.)` };
  } catch {
    return { ok: false, keep: true, message: "Could not reach GitHub to check the token, so it was saved unchecked." };
  }
}

function finish({ users, logins, site, token, notes = [] }) {
  const line = "─".repeat(72);
  console.log(`\n${line}`);
  console.log(`Saved  .env.vercel${logins ? "  and  .env.hq-logins" : ""}${args.local || fs.existsSync(LOCAL_FILE) ? "  (and updated .env.local)" : ""}`);
  console.log(`Logins: ${users.map((u) => `${u.username} (${u.role})`).join(", ")}`);
  if (logins) console.log("Passwords are in .env.hq-logins — they were not printed here.");
  for (const note of notes) console.log(note);
  console.log(line);
  console.log("Next:");
  let n = 1;
  if (!token) console.log(`  ${n++}. Create the GitHub token and paste it after GITHUB_TOKEN= in .env.vercel`);
  console.log(`  ${n++}. Vercel → Project → Settings → Environment Variables → Import .env → choose .env.vercel → Save`);
  console.log(`  ${n++}. Vercel → Deployments → Redeploy`);
  console.log(`  ${n++}. Sign in at ${site}/hq, then delete .env.vercel${logins ? " and .env.hq-logins" : ""}\n`);
}

// ── --generate: no questions ─────────────────────────────────────────────────
if (args.generate) {
  refuseOverwrite([ENV_FILE, LOGINS_FILE]);
  const site = fromFlag("site", DEFAULT_SITE);
  const repo = fromFlag("repo", DEFAULT_REPO);
  const email = fromFlag("email", "");
  const local = args.local || fs.existsSync(LOCAL_FILE) ? readLocal() : null; // an existing .env.local is always kept in step: hq-user.mjs reads the logins from it later
  const logins = FOUNDERS.map((f) => ({ ...f, password: strongPassword() }));
  const users = logins.map((l) => ({ ...l, password: hash(l.password) }));
  fs.writeFileSync(ENV_FILE, envBlock({ users, repo, site, email, token: "" }));
  fs.writeFileSync(LOGINS_FILE, loginsSheet(logins, site));
  if (local) writeLocal(local, users, email);
  const stale = !local && fs.existsSync(LOCAL_FILE) && /^HQ_USERS=/m.test(fs.readFileSync(LOCAL_FILE, "utf8"));
  finish({ users, logins, site, token: "", notes: stale ? ["Note: .env.local still has its own logins. Add --local to use these on this computer too."] : [] });
  process.exit(0);
}

// ── interactive ──────────────────────────────────────────────────────────────
// One reader for the whole session. In a real terminal, echo is muted while a password is typed.
const tty = !!process.stdin.isTTY;
const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: tty });
let muted = false;
const echo = rl._writeToOutput.bind(rl);
rl._writeToOutput = (s) => {
  if (!muted) echo(s);
};
const lines = rl[Symbol.asyncIterator]();
const HIDDEN = tty ? "hidden" : "VISIBLE as you type";

async function ask(question, { hidden = false, fallback = "" } = {}) {
  process.stdout.write(question);
  muted = hidden;
  const { value, done } = await lines.next();
  muted = false;
  if (hidden || !tty) process.stdout.write("\n");
  if (done) stop("Input ended before all questions were answered. Nothing was written.");
  // a hidden answer is kept exactly as typed: sign-in compares the password character for character
  const answer = hidden ? String(value ?? "").replace(/[\r\n]+$/, "") : String(value ?? "").trim();
  return answer || fallback;
}

/** Asks until the answer passes the check for `name`. */
async function askChecked(name, question, fallback) {
  for (;;) {
    const value = clean[name](await ask(question, { fallback }));
    if (value !== null) return value;
    console.log(`  That is not ${HINT[name]}. Try again.`);
  }
}

async function askPassword(label) {
  for (;;) {
    const a = await ask(`  ${label} password (${HIDDEN}, at least 10 characters): `, { hidden: true });
    if (a.length < 10) {
      console.log("  Too short — use at least 10 characters.");
      continue;
    }
    if (a !== a.trim()) {
      console.log("  A password cannot start or end with a space.");
      continue;
    }
    const b = await ask("  Type it again: ", { hidden: true });
    if (a !== b) {
      console.log("  The two entries did not match. Try again.");
      continue;
    }
    return a;
  }
}

refuseOverwrite([ENV_FILE]);
const local = args.local || fs.existsSync(LOCAL_FILE) ? readLocal() : null; // an existing .env.local is always kept in step: hq-user.mjs reads the logins from it later
console.log("\nFrameMind HQ — environment generator\nPress Enter to accept a [default].");
if (!tty) console.log("\n! This window cannot hide what you type. Passwords and the token will be visible on screen.\n  For hidden input use PowerShell or Windows Terminal — or run with --generate instead.");
console.log("");

const users = [];
for (let i = 0; ; i++) {
  const d = FOUNDERS[i] || { username: "", name: "", role: "viewer" };
  console.log(`User ${i + 1}`);
  let username = "";
  while (!username) {
    username = (await ask(`  Username${d.username ? ` [${d.username}]` : ""}: `, { fallback: d.username })).toLowerCase().replace(/\s+/g, "");
    if (!username) console.log("  A username is required.");
    else if (users.some((u) => u.username === username)) {
      console.log("  That username is already taken in this list.");
      username = "";
    }
  }
  const name = await ask(`  Full name${d.name ? ` [${d.name}]` : ""}: `, { fallback: d.name || username });
  let role = "";
  while (!role) {
    role = (await ask(`  Role (${ROLES.join(" / ")}) [${d.role}]: `, { fallback: d.role })).toLowerCase();
    if (!ROLES.includes(role)) {
      console.log(`  Choose one of: ${ROLES.join(", ")}.`);
      role = "";
    }
  }
  users.push({ username, name, role, password: hash(await askPassword(username)) });
  const more = await ask("\nAdd another user? [y/N]: ", { fallback: i + 1 < FOUNDERS.length ? "y" : "n" });
  if (!/^y/i.test(more)) break;
  console.log("");
}

const repo = await askChecked("repo", `\nPrivate data repo (owner/name) [${fromFlag("repo", DEFAULT_REPO)}]: `, fromFlag("repo", DEFAULT_REPO));
const site = await askChecked("site", `HQ address [${fromFlag("site", DEFAULT_SITE)}]: `, fromFlag("site", DEFAULT_SITE));
const email = await askChecked("email", `Public contact email${fromFlag("email", "") ? ` [${fromFlag("email", "")}]` : " (Enter to skip)"}: `, fromFlag("email", ""));
let token = (await ask(`GitHub token for the data repo (${HIDDEN} — Enter to add it later): `, { hidden: true })).trim();
rl.close();

if (token) {
  const check = await checkToken(token, repo);
  console.log(`\n${check.ok ? "✓" : "!"} ${check.message}`);
  if (!check.keep) {
    token = "";
    console.log("  The token was NOT saved. Fix it, then paste the right one after GITHUB_TOKEN= in .env.vercel.");
  }
}

fs.writeFileSync(ENV_FILE, envBlock({ users, repo, site, email, token }));
const notes = [];
if (fs.existsSync(LOGINS_FILE)) {
  fs.rmSync(LOGINS_FILE);
  notes.push("Removed the old .env.hq-logins — its passwords no longer match.");
}
if (local) writeLocal(local, users, email);
finish({ users, logins: null, site, token, notes });
