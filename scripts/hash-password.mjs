#!/usr/bin/env node
// Usage: node scripts/hash-password.mjs "my-strong-password"
// Paste the output as the "password" value inside HQ_USERS.
import { createHash } from "node:crypto";

const pw = process.argv[2];
if (!pw) {
  console.error('Usage: node scripts/hash-password.mjs "your-password"');
  process.exit(1);
}
if (pw.length < 10) console.warn("⚠  Use at least 10 characters for HQ passwords.");
console.log("sha256:" + createHash("sha256").update(pw).digest("hex"));
