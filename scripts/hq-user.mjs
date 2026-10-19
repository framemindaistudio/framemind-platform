#!/usr/bin/env node
/**
 * FrameMind HQ — add, remove or re-key ONE login without touching anyone else's password.
 *
 *   node scripts/hq-user.mjs list
 *   node scripts/hq-user.mjs add intern "FrameMind Interns"               view-only login (the default role)
 *   node scripts/hq-user.mjs add ravi "Ravi K" --role trainer
 *   node scripts/hq-user.mjs password intern                         a new password for one login
 *   node scripts/hq-user.mjs remove intern
 *
 * Roles: founder / admin can change everything. Every other role can only look and print:
 *   viewer   the interns login: workshops (no amounts), media, certificates, feedback, curriculum, the teaching
 *            part of the library and printables — nothing about sales, money, people, stock or settings
 *   ops, trainer, media   wider views for staff (see README → Roles)
 *
 * A new password, or removing a login, signs out everyone using the old one as soon as Vercel is redeployed.
 *
 * What it writes (all gitignored, nothing is sent anywhere):
 *   .env.hq-users    the new HQ_USERS value, with the three steps to put it into Vercel
 *   .env.hq-logins   the new password, so it never appears on screen
 *   .env.local       kept in step, so the login also works on this computer
 *   .env.vercel      kept in step if it still exists
 *
 * Passwords are created here (5 groups of 4 characters) and only their sha256 hash goes into HQ_USERS.
 * The list of existing logins is read from .env.vercel, or from .env.local once that file has been deleted.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash, randomBytes, randomInt } from "node:crypto";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const file = (name) => path.join(ROOT, name);
const VERCEL = file(".env.vercel");
const LOCAL = file(".env.local");
const VALUE = file(".env.hq-users");
const LOGINS = file(".env.hq-logins");

const ROLES = ["founder", "admin", "ops", "studio", "media", "viewer"];
const EDITORS = ["founder", "admin"];
const SITE = "https://hq.framemindaistudio.site";

function stop(message) {
  console.error(`\n${message}\n`);
  process.exit(1);
}
const USAGE = `Usage:
  node scripts/hq-user.mjs list
  node scripts/hq-user.mjs add <username> "<Full Name>" [--role ${ROLES.join("|")}]
  node scripts/hq-user.mjs password <username>
  node scripts/hq-user.mjs remove <username>`;

// ── arguments ────────────────────────────────────────────────────────────────
const words = [];
let role = "viewer";
{
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i++) {
    const m = /^--role(?:=(.*))?$/.exec(argv[i]);
    if (m) role = (m[1] ?? argv[++i] ?? "").toLowerCase();
    else if (argv[i].startsWith("--")) stop(`Unknown option: ${argv[i]}\n\n${USAGE}`);
    else words.push(argv[i]);
  }
}
const [command, rawUsername, ...nameParts] = words;
if (!["list", "add", "password", "remove"].includes(command)) stop(USAGE);
if (!ROLES.includes(role)) stop(`"${role}" is not a role. Choose one of: ${ROLES.join(", ")}.`);
const username = (rawUsername ?? "").toLowerCase();
if (command !== "list" && !/^[a-z0-9][a-z0-9._-]{1,30}$/.test(username)) stop(`Give a username of 2–31 lowercase letters, numbers, dots or dashes.\n\n${USAGE}`);

// ── reading and writing the .env files ───────────────────────────────────────
const read = (f) => (fs.existsSync(f) ? fs.readFileSync(f, "utf8") : "");
/** "#" would start a comment on an unquoted .env line and "$" would be expanded, so both are written as \u escapes. */
const usersJson = (users) => JSON.stringify(users).replace(/[#$]/g, (c) => "\\u" + c.charCodeAt(0).toString(16).padStart(4, "0"));

function usersIn(text, label) {
  const raw = [...text.matchAll(/^HQ_USERS=(.*)$/gm)].pop()?.[1].trim();
  if (!raw) return null;
  let users;
  try {
    users = JSON.parse(raw.replace(/^(['"`])(.*)\1$/s, "$2"));
  } catch {
    users = null;
  }
  if (!Array.isArray(users) || users.some((u) => !u || typeof u !== "object" || !u.username || !u.password)) {
    stop(`The HQ_USERS line in ${label} cannot be read as a list of logins. Fix or remove that line first. Nothing was changed.`);
  }
  return users;
}

/** Replaces every `KEY=` line with one (or appends it), leaving the rest of the file alone. */
function setLine(text, key, value) {
  const line = `${key}=${value}`;
  let placed = false;
  const next = text.replace(new RegExp(`^${key}=.*$`, "gm"), () => (placed ? "\0" : ((placed = true), line))).replace(/\0\r?\n?/g, "");
  return placed ? next : `${text.replace(/\s*$/, "")}${text.trim() ? "\n" : ""}${line}\n`;
}

// Accounts that exist only for testing on this computer are named on a "# HQ_LOCAL_ONLY=a,b" line in .env.local.
// A login that uses the test password written in that file ("# HQ_TEST_PASSWORD=…") is treated the same way.
const localText = read(LOCAL);
const localOnlyLine = /^#[ 	]*HQ_LOCAL_ONLY[ 	]*=[ 	]*(.*)$/m.exec(localText); // [ 	], not \s: an empty value must not swallow the next line
const hash = (password) => "sha256:" + createHash("sha256").update(password).digest("hex");
const testPassword = /^#[ 	]*HQ_TEST_PASSWORD[ 	]*=[ 	]*(.+)$/m.exec(localText)?.[1].trim();
const localUsers = usersIn(localText, ".env.local") ?? [];
const localOnly = [
  ...new Set([
    ...(localOnlyLine?.[1] ?? "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean),
    ...(testPassword ? localUsers.filter((u) => u.password === hash(testPassword) || u.password === testPassword).map((u) => String(u.username).toLowerCase()) : []),
  ]),
];
const vercelText = read(VERCEL);
const fromVercel = usersIn(vercelText, ".env.vercel");
// Falling back to .env.local is only safe when the file says which of its accounts are for testing on this computer.
if (!fromVercel && localUsers.length && !localOnlyLine) {
  stop(
    "There is no .env.vercel, and .env.local does not say which of its logins are test accounts.\n" +
      "Add a line like this to .env.local (leave it empty after the = if there are none), then run this again:\n\n  # HQ_LOCAL_ONLY=founder,trainer\n\nNothing was changed.",
  );
}
/** The live logins: what is (or should be) in Vercel. */
let team = fromVercel ?? localUsers.filter((u) => !localOnly.includes(String(u.username).toLowerCase()));
const source = fromVercel ? ".env.vercel" : ".env.local";
if (!team.length) stop("No existing logins were found in .env.vercel or .env.local.\nSet HQ up first with:  node scripts/make-hq-env.mjs --generate --local");
const sourceDate = fs.statSync(fromVercel ? VERCEL : LOCAL).mtime.toISOString().slice(0, 10);

const describe = (users) => users.map((u) => `${u.username} (${u.role})`).join(", ");

if (command === "list") {
  console.log(`\nHQ logins (from ${source}, last changed ${sourceDate}):\n`);
  for (const u of team) console.log(`  ${String(u.username).padEnd(14)} ${String(u.role).padEnd(9)} ${u.name ?? ""}${EDITORS.includes(u.role) ? "" : "   · view & print only"}`);
  if (localOnly.length) console.log(`\n  (test accounts on this computer only: ${localOnly.join(", ")})`);
  console.log("");
  process.exit(0);
}

// ── the change ───────────────────────────────────────────────────────────────
const existing = team.find((u) => String(u.username).toLowerCase() === username);
/** 5 groups of 4 from an alphabet without look-alikes (no 0/o, 1/l/i) — about 99 bits, and easy to type. */
function strongPassword() {
  const alphabet = "abcdefghjkmnpqrstuvwxyz23456789";
  return Array.from({ length: 5 }, () => Array.from({ length: 4 }, () => alphabet[randomInt(alphabet.length)]).join("")).join("-");
}

let login = null; // { name, role, username, password } when a password was created
let summary;
if (command === "add") {
  if (existing) stop(`"${username}" already has a login (${existing.role}). Use  password ${username}  for a new password, or  remove ${username}  first.`);
  if (localOnly.includes(username)) stop(`"${username}" is the name of a test account on this computer. Pick another username.`);
  const name = nameParts.join(" ").trim() || username;
  login = { username, name, role, password: strongPassword() };
  team = [...team, { username, name, role, password: hash(login.password) }];
  summary = `Added ${username} — ${name} (${role}${EDITORS.includes(role) ? ", full access" : ", view & print only"}).`;
} else if (command === "password") {
  if (!existing) stop(`There is no login called "${username}". Logins: ${describe(team)}.`);
  login = { username, name: existing.name ?? username, role: existing.role, password: strongPassword() };
  team = team.map((u) => (u === existing ? { ...u, password: hash(login.password) } : u));
  summary = `New password for ${username}. Once Vercel is updated the old one stops working and everyone signed in with it is signed out.`;
} else {
  if (!existing) stop(`There is no login called "${username}". Logins: ${describe(team)}.`);
  if (EDITORS.includes(existing.role) && team.filter((u) => EDITORS.includes(u.role)).length === 1) stop(`${username} is the only account with full access. Add another founder before removing this one.`);
  team = team.filter((u) => u !== existing);
  summary = `Removed ${username}. They are signed out the moment Vercel is updated and redeployed.`;
}

// ── write ────────────────────────────────────────────────────────────────────
const today = new Date().toISOString().slice(0, 10);
fs.writeFileSync(
  VALUE,
  [
    `# FrameMind HQ — new value for HQ_USERS (${today}).  Logins: ${describe(team)}`,
    "#",
    "# 1. Vercel → project framemind-hq → Environment Variables (left menu) → HQ_USERS → ⋯ → Edit",
    "# 2. Clear the old Value, paste the ONE long line below (from [ to ]) and press Save",
    "# 3. Deployments → ⋯ on the top row → Redeploy. The change is live when the new one says Ready.",
    "#",
    "# Then delete this file.",
    "",
    usersJson(team),
    "",
  ].join("\n"),
);
if (vercelText) fs.writeFileSync(VERCEL, setLine(vercelText, "HQ_USERS", usersJson(team)));
if (localText) {
  const names = new Set(team.map((u) => String(u.username).toLowerCase()));
  // keep this computer's own accounts (test logins), replace everything else with the live list
  const keep = localUsers.filter((u) => localOnly.includes(String(u.username).toLowerCase()) && !names.has(String(u.username).toLowerCase()));
  let next = setLine(localText, "HQ_USERS", usersJson([...keep, ...team]));
  if (!/^HQ_SESSION_SECRET=.{32,}$/m.test(next)) next = setLine(next, "HQ_SESSION_SECRET", randomBytes(32).toString("hex"));
  fs.writeFileSync(LOCAL, next);
}
// the passwords sheet: drop any earlier entry for this username (it no longer works), then add the new one
const TRAILER = "Give each person their login privately, save it in a password manager, then delete this file.";
const withoutOld = (sheet) => sheet.replace(new RegExp(`^ {2}\\S.*\\r?\\n {4}username: ${username}\\r?\\n {4}password: .*\\r?\\n(\\r?\\n)?`, "m"), "");
if (!login && fs.existsSync(LOGINS)) fs.writeFileSync(LOGINS, withoutOld(read(LOGINS)));
if (login) {
  const head = fs.existsSync(LOGINS) ? withoutOld(read(LOGINS)).replace(TRAILER, "").replace(/\s*$/, "\n\n") : `FrameMind HQ — logins\nSign in at ${SITE}/hq\n\n`;
  fs.writeFileSync(
    LOGINS,
    `${head}  ${login.name} (${login.role}) — ${command === "add" ? "added" : "new password"} ${today}\n    username: ${login.username}\n    password: ${login.password}\n\n${TRAILER}\n`,
  );
}

const line = "─".repeat(72);
console.log(`\n${line}\n${summary}\nLogins now: ${describe(team)}`);
if (login) console.log("The password is in .env.hq-logins — it was not printed here.");
console.log(`\nCheck before you paste: apart from this change, the list above must match HQ → Settings → Team accounts`);
console.log(`(the live logins). It was built from ${source}, last changed ${sourceDate}. If someone is missing or should not be`);
console.log("there, this computer's copy is out of date — do not paste it.");
console.log(`${line}\nTo make it live, open .env.hq-users and follow the three steps at the top:`);
console.log("  1. Vercel → framemind-hq → Environment Variables (left menu) → HQ_USERS → ⋯ → Edit");
console.log("  2. Replace the Value with the long line from .env.hq-users → Save");
console.log("  3. Deployments → ⋯ on the top row → Redeploy\n");
