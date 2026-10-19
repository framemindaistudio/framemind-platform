#!/usr/bin/env node
/**
 * Type-check only some folders/files (plus whatever they import).
 * Usage:  node scripts/typecheck-paths.mjs "src/app/(site)/shop" "src/components/site/shop"
 * Exit code 0 = no errors in those paths.
 */
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync, existsSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
if (!args.length) {
  console.error('Usage: node scripts/typecheck-paths.mjs "src/app/(site)/shop" ...');
  process.exit(2);
}
const toPosix = (p) => p.split(path.sep).join("/");
const include = [toPosix(path.join(root, "next-env.d.ts"))];
for (const a of args) {
  const abs = path.resolve(root, a);
  if (!existsSync(abs)) {
    console.error(`Not found: ${a}`);
    continue;
  }
  if (statSync(abs).isDirectory()) {
    include.push(toPosix(abs) + "/**/*.ts", toPosix(abs) + "/**/*.tsx");
  } else include.push(toPosix(abs));
}
const dir = mkdtempSync(path.join(tmpdir(), "framemind-tc-"));
const cfg = path.join(dir, "tsconfig.json");
writeFileSync(
  cfg,
  JSON.stringify({ extends: toPosix(path.join(root, "tsconfig.json")), compilerOptions: { incremental: false, noEmit: true }, include }, null, 2),
);
const tsc = path.join(root, "node_modules", "typescript", "bin", "tsc");
const r = spawnSync(process.execPath, [tsc, "-p", cfg], { cwd: root, encoding: "utf8" });
rmSync(dir, { recursive: true, force: true });
const out = (r.stdout || "") + (r.stderr || "");
if (r.status === 0) {
  console.log(`✓ No type errors in: ${args.join(", ")}`);
} else {
  console.log(out.trim());
}
process.exit(r.status ?? 1);
