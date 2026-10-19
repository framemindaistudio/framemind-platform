/**
 * Pure helpers shared by the Operations Library, Curriculum, File Vault and the
 * printable document renderer. No React, no browser globals at import time.
 */
import { pad2 } from "@/lib/utils";

export const OPS_ROOT = "OPERATIONS";
export const VAULT_ROOT = "vault";

/* ───────────────────────────── tree ───────────────────────────── */

export interface TreeEntry {
  path: string;
  name: string;
  type: "file" | "dir";
  size?: number;
  sha?: string;
}

export interface TreeNode {
  name: string;
  path: string;
  type: "file" | "dir";
  size?: number;
  children: TreeNode[];
  /** Number of files below this node (1 for a file). */
  fileCount: number;
}

const collator = new Intl.Collator("en", { numeric: true, sensitivity: "base" });
const isReadme = (name: string) => /^readme(\.[a-z]+)?$/i.test(name);

function compareNodes(a: TreeNode, b: TreeNode) {
  const ra = isReadme(a.name);
  const rb = isReadme(b.name);
  if (ra !== rb) return ra ? -1 : 1;
  if (a.type !== b.type) return a.type === "dir" ? -1 : 1;
  return collator.compare(a.name, b.name);
}

export function dirname(p: string) {
  const i = p.lastIndexOf("/");
  return i < 0 ? "" : p.slice(0, i);
}
export function basename(p: string) {
  return p.slice(p.lastIndexOf("/") + 1);
}
export function extOf(name: string) {
  const i = name.lastIndexOf(".");
  return i < 0 ? "" : name.slice(i + 1).toLowerCase();
}

export function buildTree(entries: TreeEntry[], root = OPS_ROOT): TreeNode {
  const rootNode: TreeNode = { name: root, path: root, type: "dir", children: [], fileCount: 0 };
  const map = new Map<string, TreeNode>([[root, rootNode]]);

  const ensureDir = (p: string): TreeNode => {
    const existing = map.get(p);
    if (existing) return existing;
    const parent = ensureDir(dirname(p));
    const node: TreeNode = { name: basename(p), path: p, type: "dir", children: [], fileCount: 0 };
    map.set(p, node);
    parent.children.push(node);
    return node;
  };

  const usable = entries.filter((e) => e.path.startsWith(`${root}/`) && !e.path.split("/").some((seg) => seg.startsWith(".")));
  for (const e of usable) {
    if (e.type === "dir") {
      ensureDir(e.path);
      continue;
    }
    if (map.has(e.path)) continue;
    const parent = ensureDir(dirname(e.path));
    const node: TreeNode = { name: e.name || basename(e.path), path: e.path, type: "file", size: e.size, children: [], fileCount: 1 };
    map.set(e.path, node);
    parent.children.push(node);
  }

  const finish = (n: TreeNode): number => {
    if (n.type === "file") return 1;
    n.children.sort(compareNodes);
    n.fileCount = n.children.reduce((s, c) => s + finish(c), 0);
    return n.fileCount;
  };
  finish(rootNode);
  return rootNode;
}

export function indexTree(root: TreeNode): Map<string, TreeNode> {
  const map = new Map<string, TreeNode>();
  const walk = (n: TreeNode) => {
    map.set(n.path, n);
    n.children.forEach(walk);
  };
  walk(root);
  return map;
}

/** All folders (depth-first) — used by pickers. */
export function allFolders(root: TreeNode): TreeNode[] {
  const out: TreeNode[] = [];
  const walk = (n: TreeNode) => {
    if (n.type !== "dir") return;
    out.push(n);
    n.children.forEach(walk);
  };
  walk(root);
  return out;
}

/** Files below a node, README first, in tree order. */
export function filesBelow(node: TreeNode | undefined, recursive = true): TreeNode[] {
  if (!node || node.type !== "dir") return [];
  const out: TreeNode[] = [];
  const walk = (n: TreeNode, depth: number) => {
    for (const c of n.children) {
      if (c.type === "file") out.push(c);
      else if (recursive || depth < 0) walk(c, depth + 1);
    }
  };
  walk(node, 0);
  return out;
}

export function ancestorsOf(path: string): string[] {
  const parts = path.split("/");
  const out: string[] = [];
  for (let i = 1; i < parts.length; i++) out.push(parts.slice(0, i).join("/"));
  return out;
}

/** Keep nodes whose name (raw or friendly) matches — or that have a matching descendant. */
export function filterTree(node: TreeNode, query: string): TreeNode | null {
  const q = query.trim().toLowerCase();
  if (!q) return node;
  const self = `${node.name} ${nodeTitle(node)}`.toLowerCase().includes(q);
  if (node.type === "file") return self ? node : null;
  if (self && node.path !== OPS_ROOT) return node;
  const kids = node.children.map((c) => filterTree(c, q)).filter((c): c is TreeNode => !!c);
  if (!kids.length && !(self && node.path !== OPS_ROOT)) return null;
  return { ...node, children: kids, fileCount: kids.reduce((s, c) => s + c.fileCount, 0) };
}

/* ───────────────────────────── names ───────────────────────────── */

const KEEP_UPPER = new Set(["FM", "AI", "UI", "UX", "SEO", "SOP", "RACI", "NAAC", "IQAC", "GSTIN", "UPI", "GST", "API", "AMC"]);
const SMALL = new Set(["and", "of", "to", "the", "for", "in", "a", "an", "vs", "on", "at", "or"]);

/** "03_SOP" → "SOP", "07_Shoot_Day_SOP.md" → "Shoot Day SOP", README → "Overview". */
export function friendlyName(name: string, isFile = false) {
  let n = isFile ? name.replace(/\.[^.]+$/, "") : name;
  if (/^readme$/i.test(n)) return "Overview";
  n = n.replace(/^\d+[_\s-]+/, "").replace(/_/g, " ").replace(/\s+/g, " ").trim();
  if (!n) return name;
  return n
    .split(" ")
    .map((w, i) => {
      if (!w) return w;
      if (/^[A-Z0-9][A-Z0-9\-+&]*$/.test(w)) {
        // all-caps token: keep short ones/acronyms/ids, soften long shouting words
        if (KEEP_UPPER.has(w) || w.length <= 3 || /\d/.test(w)) return w;
        return w[0] + w.slice(1).toLowerCase();
      }
      if (i > 0 && SMALL.has(w.toLowerCase())) return w.toLowerCase();
      return w[0].toUpperCase() + w.slice(1);
    })
    .join(" ");
}

export function nodeTitle(node: Pick<TreeNode, "name" | "type" | "path">) {
  if (node.path === OPS_ROOT) return "Operations";
  return friendlyName(node.name, node.type === "file");
}

export function titleForPath(path: string) {
  if (path === OPS_ROOT) return "Operations";
  const name = basename(path);
  return friendlyName(name, /\.[a-z0-9]+$/i.test(name));
}

/* ───────────────────────────── file kinds ───────────────────────────── */

export type FileKind = "markdown" | "text" | "csv" | "json" | "image" | "pdf" | "other";

export function fileKind(name: string): FileKind {
  const e = extOf(name);
  if (e === "md" || e === "markdown") return "markdown";
  if (e === "txt") return "text";
  if (e === "csv") return "csv";
  if (e === "json") return "json";
  if (["png", "jpg", "jpeg", "webp", "gif", "svg"].includes(e)) return "image";
  if (e === "pdf") return "pdf";
  return "other";
}
export const isTextKind = (k: FileKind) => k === "markdown" || k === "text" || k === "csv" || k === "json";

export function formatBytes(n: number | undefined) {
  if (n === undefined || !Number.isFinite(n)) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(n < 10 * 1024 ? 1 : 0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

/* ───────────────────────────── hrefs ───────────────────────────── */

export const encodePathParam = (path: string) => path.split("/").map(encodeURIComponent).join("/");
export const docHref = (path: string) => (path === OPS_ROOT ? "/hq/docs" : `/hq/docs?path=${encodePathParam(path)}`);
export const rawHref = (path: string, download = false) => `/api/hq/docs/raw?path=${encodePathParam(path)}${download ? "&download=1" : ""}`;
export const printDocHref = (path: string) => `/hq/print/doc?path=${encodePathParam(path)}`;
export function printPackHref(folders: string[], title?: string, back?: string) {
  const p = new URLSearchParams();
  if (folders.length === 1) p.set("folder", folders[0]);
  else p.set("folders", folders.join(","));
  if (title) p.set("title", title);
  if (back) p.set("back", back);
  return `/hq/print/doc?${p.toString().replace(/%2C/g, ",").replace(/%2F/g, "/")}`;
}

/** Normalise a path coming from the URL; returns OPS_ROOT for anything outside the library. */
export function cleanLibraryPath(raw: string | null | undefined) {
  if (!raw) return OPS_ROOT;
  const p = raw.replace(/\\/g, "/").replace(/^\/+|\/+$/g, "");
  if (p !== OPS_ROOT && !p.startsWith(`${OPS_ROOT}/`)) return OPS_ROOT;
  if (p.split("/").some((s) => s === ".." || s === "." || s === "")) return OPS_ROOT;
  return p;
}

/**
 * Resolve a link found inside a markdown document.
 *  - "#section"                → scroll within the document
 *  - "../03_SOP/x.md"          → another library document
 *  - external / app routes     → null (let the browser handle it)
 */
export function resolveDocLink(current: string, href: string): { type: "hash"; id: string } | { type: "doc"; path: string } | null {
  if (href.startsWith("#")) return { type: "hash", id: decodeSafe(href.slice(1)) };
  if (/^[a-z][a-z0-9+.-]*:/i.test(href) || href.startsWith("//")) return null;
  if (href.startsWith("/hq/docs")) {
    const q = href.split("?")[1]?.split("#")[0] ?? "";
    const p = new URLSearchParams(q).get("path");
    return p ? { type: "doc", path: cleanLibraryPath(p) } : { type: "doc", path: OPS_ROOT };
  }
  if (href.startsWith("/")) return null;
  const clean = decodeSafe(href.split("#")[0].split("?")[0]);
  if (!clean) return null;
  const segs = dirname(current).split("/");
  for (const s of clean.split("/")) {
    if (s === "." || s === "") continue;
    if (s === "..") segs.pop();
    else segs.push(s);
  }
  const resolved = segs.join("/");
  if (resolved !== OPS_ROOT && !resolved.startsWith(`${OPS_ROOT}/`)) return null;
  return { type: "doc", path: resolved };
}

function decodeSafe(s: string) {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

/* ───────────────────────────── markdown helpers ───────────────────────────── */

export interface TocItem {
  id: string;
  text: string;
  level: 2 | 3;
}

export function slugifyHeading(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .trim()
    .replace(/\s+/g, "-");
}

/** Strip the most common inline markdown from a heading line. */
export function stripInline(s: string) {
  return s
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/(\*\*|__)(.*?)\1/g, "$2")
    .replace(/(\*|_)(.*?)\1/g, "$2")
    .replace(/`([^`]*)`/g, "$1")
    .trim();
}

export function extractToc(md: string): TocItem[] {
  const items: TocItem[] = [];
  const used = new Map<string, number>();
  let fence: string | null = null;
  for (const line of md.split(/\r?\n/)) {
    const f = /^\s*(```|~~~)/.exec(line);
    if (f) {
      fence = fence ? (fence === f[1] ? null : fence) : f[1];
      continue;
    }
    if (fence) continue;
    const m = /^(#{2,3})\s+(.+?)\s*#*\s*$/.exec(line);
    if (!m) continue;
    const text = stripInline(m[2]);
    if (!text) continue;
    const base = slugifyHeading(text) || "section";
    const n = used.get(base) ?? 0;
    used.set(base, n + 1);
    items.push({ id: n ? `${base}-${n}` : base, text, level: m[1].length === 2 ? 2 : 3 });
  }
  return items;
}

export function firstH1(md: string): string | null {
  let fence = false;
  for (const line of md.split(/\r?\n/)) {
    if (/^\s*(```|~~~)/.test(line)) fence = !fence;
    if (fence) continue;
    const m = /^#\s+(.+?)\s*#*\s*$/.exec(line);
    if (m) return stripInline(m[1]);
    if (line.trim() && !line.startsWith("<")) return null;
  }
  return null;
}

/** Remove a leading "# Title" line (the print header shows the title instead). */
export function stripFirstH1(md: string) {
  return md.replace(/^\s*#\s+.+?\s*#*\s*(\r?\n|$)/, "");
}

export function countWords(md: string) {
  const t = md.replace(/```[\s\S]*?```/g, " ").replace(/[#>*_`|\-[\]()]/g, " ");
  const m = t.match(/\S+/g);
  return m ? m.length : 0;
}

/** Pull "Version" and "Last updated" from the standard document header line. */
export function parseDocHeader(md: string): { version?: string; updated?: string; owner?: string } {
  const head = md.slice(0, 1200);
  const v = /\*\*Version:\*\*\s*([^·\n*]+)/i.exec(head)?.[1]?.trim();
  const u = /\*\*Last updated:\*\*\s*([^·\n*]+)/i.exec(head)?.[1]?.trim();
  const o = /\*\*Owner:\*\*\s*([^·\n*]+)/i.exec(head)?.[1]?.trim();
  return { version: v, updated: u, owner: o };
}

/* ───────────────────────────── csv ───────────────────────────── */

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  const src = text.replace(/^﻿/, "");
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (quoted) {
      if (c === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i++;
        } else quoted = false;
      } else field += c;
      continue;
    }
    if (c === '"') quoted = true;
    else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && src[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else field += c;
  }
  if (field !== "" || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

/* ───────────────────────────── new documents ───────────────────────────── */

export function docDate(d = new Date()) {
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function docTemplate(o: { title: string; owner?: string; appliesTo?: string; date: string }) {
  return `# ${o.title}\n\n> **Owner:** ${o.owner || "—"} · **Applies to:** ${o.appliesTo || "—"} · **Version:** 1.0 · **Last updated:** ${o.date}\n\n## Purpose\n\n## Details\n\n- \n`;
}

/** "NN_Title_With_Underscores.md" where NN follows the highest number already in the folder. */
export function numberedFileName(title: string, folder: TreeNode | undefined) {
  const nums = (folder?.children ?? [])
    .map((c) => /^(\d+)_/.exec(c.name)?.[1])
    .filter((x): x is string => !!x)
    .map(Number);
  const next = (nums.length ? Math.max(...nums) : 0) + 1;
  const words = title
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .trim()
    .split(/[\s-]+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1));
  const stem = words.join("_").slice(0, 80);
  return stem ? `${pad2(next)}_${stem}.md` : "";
}

/* ───────────────────────────── vault ───────────────────────────── */

/** "signed", "hr" and "safeguarding" open for founders and admins only, "agreements" for the roles that see Finance (lib/hq/access.ts). */
export const VAULT_FOLDERS = ["receipts", "releases", "agreements", "client-letters", "photos", "certificates", "signed", "hr", "safeguarding", "misc"] as const;
export const VAULT_MAX_BYTES = 4 * 1024 * 1024;

/** Mirror of the server-side folder sanitiser in /api/hq/files. */
export function sanitiseVaultFolder(raw: string) {
  return (
    raw
      .toLowerCase()
      .replace(/[^a-z0-9/_-]/g, "-")
      .replace(/\/+/g, "/")
      .replace(/^\/|\/$/g, "") || "general"
  );
}

export interface VaultItem {
  path: string;
  folder: string;
  name: string;
  date: string | null;
  size?: number;
  kind: FileKind;
}

export function toVaultItem(e: { path: string; name: string; size?: number }): VaultItem {
  const rel = e.path.replace(/^vault\//, "");
  const folder = dirname(rel) || "general";
  const base = basename(e.path);
  const m = /^(\d{4}-\d{2}-\d{2})_(.+)$/.exec(base);
  return { path: e.path, folder, name: m ? m[2].replace(/_/g, " ") : base, date: m ? m[1] : null, size: e.size, kind: fileKind(base) };
}
