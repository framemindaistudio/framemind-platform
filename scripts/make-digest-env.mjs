#!/usr/bin/env node
/**
 * FrameMind HQ — the settings for the morning email.
 *
 *   node scripts/make-digest-env.mjs
 *
 * Writes `.env.digest` (gitignored, like every .env file) with:
 *   CRON_SECRET      a new random value; Vercel sends it with the daily call so nobody else can trigger the email
 *   RESEND_API_KEY=  left empty: paste your key from resend.com after the "=" yourself
 *   DIGEST_FROM      commented out until your domain is verified in Resend
 * and adds CRON_SECRET to `.env.local`, so the email can be tried on this computer.
 * Then import `.env.digest` in Vercel → Project → Settings → Environment Variables and redeploy.
 *
 * Nothing is printed and nothing is sent anywhere. Run it again with --force to make a new CRON_SECRET.
 */
import fs from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const FILE = path.join(ROOT, ".env.digest");
const LOCAL = path.join(ROOT, ".env.local");
const force = process.argv.includes("--force");

if (fs.existsSync(FILE) && !force) {
  console.log(".env.digest already exists. Open it, paste the Resend key after RESEND_API_KEY= if it is still empty, and import it in Vercel.");
  console.log("To make a new CRON_SECRET, run:  node scripts/make-digest-env.mjs --force");
  process.exit(0);
}

const secret = randomBytes(32).toString("base64url");
fs.writeFileSync(
  FILE,
  [
    "# FrameMind HQ morning email. Import this file in Vercel → Project → Settings → Environment Variables (Production).",
    "# Never commit or share it.",
    `CRON_SECRET=${secret}`,
    "# Paste your API key from resend.com → API Keys after the = sign:",
    "RESEND_API_KEY=",
    "# Once your domain is verified in Resend, remove the # below so the email comes from your own address:",
    '# DIGEST_FROM="FrameMind HQ <hq@framemindaistudio.com>"',
    "",
  ].join("\n"),
);

// the same CRON_SECRET locally, replacing an older one
let local = fs.existsSync(LOCAL) ? fs.readFileSync(LOCAL, "utf8") : "";
local = local.replace(/^CRON_SECRET=.*\r?\n?/m, "");
if (local && !local.endsWith("\n")) local += "\n";
fs.writeFileSync(LOCAL, `${local}CRON_SECRET=${secret}\n`);

console.log("Done. Wrote .env.digest and added CRON_SECRET to .env.local (no values shown here).");
console.log("Next: open .env.digest, paste your Resend API key after RESEND_API_KEY=, then import the file in Vercel.");
