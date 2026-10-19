#!/usr/bin/env node
/**
 * Fetch routes from the running dev server (http://localhost:3011) and report status.
 * Logs in to HQ automatically using the local test account from .env.local (never prints it).
 * Usage: node scripts/check-routes.mjs / /programs /hq/crm "/hq/print/invoice/abc"
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const base = process.env.BASE_URL || "http://localhost:3011";
// Git Bash (MSYS) rewrites "/route" into "C:/Program Files/Git/route" — undo that.
const routes = process.argv.slice(2).map((r) => r.replace(/\\/g, "/").replace(/^[A-Za-z]:\/(?:.*?\/)?Git(?=\/|$)/i, "") || "/");
if (!routes.length) {
  console.error("Usage: node scripts/check-routes.mjs /route [/route…]");
  process.exit(2);
}

let cookie = "";
if (routes.some((r) => r.startsWith("/hq") || r.startsWith("/api/hq"))) {
  let pw = "";
  try {
    pw = /^# HQ_TEST_PASSWORD=(.*)$/m.exec(readFileSync(path.join(root, ".env.local"), "utf8"))?.[1]?.trim() || "";
  } catch {}
  try {
    const res = await fetch(`${base}/api/hq/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: process.env.HQ_TEST_USER || "founder", password: pw }) });
    cookie = (res.headers.get("set-cookie") || "").split(";")[0];
    if (!res.ok) console.log(`! HQ login failed (${res.status})`);
  } catch {
    console.log(`✗ Dev server not reachable at ${base}. It should be running (node node_modules/next/dist/bin/next dev -p 3011).`);
    process.exit(1);
  }
}

let failed = 0;
for (const r of routes) {
  const t = Date.now();
  try {
    const res = await fetch(base + r, { headers: cookie ? { cookie } : {}, redirect: "manual" });
    const body = await res.text();
    const markers = ["Unhandled Runtime Error", "Application error: a", "nextjs__container_errors", "Internal Server Error"].filter((m) => body.includes(m));
    const ok = res.status < 400 && !markers.length;
    if (!ok) failed++;
    console.log(`${ok ? "✓" : "✗"} ${res.status} ${r} (${Date.now() - t} ms)${markers.length ? "  markers: " + markers.join(", ") : ""}${res.status >= 300 && res.status < 400 ? " → " + res.headers.get("location") : ""}`);
    if (!ok && res.status >= 500) {
      const msg = /<pre[^>]*>([\s\S]{0,800}?)<\/pre>/.exec(body)?.[1] || body.slice(0, 600);
      console.log("   " + msg.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").slice(0, 600));
    }
  } catch (e) {
    failed++;
    console.log(`✗ ERR ${r} ${e instanceof Error ? e.message : e}`);
  }
}
process.exit(failed ? 1 : 0);
