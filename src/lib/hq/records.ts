import "server-only";
import { store, StoreConflictError } from "@/lib/store";
import { collectionPath, getCollection, type BaseRecord, type CollectionDef, type FieldDef } from "./collections";
import { defaultSettings, SETTINGS_PATH, type CompanySettings } from "./settings";
import { uid } from "@/lib/utils";

/**
 * Collection CRUD on top of the repo store.
 * Writes are read-modify-write with optimistic concurrency: if someone else
 * committed in between, we re-read and re-apply the change (up to 4 tries).
 */

export class ValidationError extends Error {
  constructor(public issues: string[]) {
    super(issues.join("; "));
    this.name = "ValidationError";
  }
}

export async function readCollection<T extends BaseRecord = BaseRecord>(name: string, opts: { revalidate?: number } = {}) {
  const { data, sha } = await store.readJSON<T[]>(collectionPath(name), [], opts);
  return { records: Array.isArray(data) ? data : [], sha };
}

export async function listRecords<T extends BaseRecord = BaseRecord>(name: string, opts: { revalidate?: number } = {}) {
  return (await readCollection<T>(name, opts)).records;
}

export async function getRecord<T extends BaseRecord = BaseRecord>(name: string, id: string) {
  const records = await listRecords<T>(name);
  return records.find((r) => r.id === id) ?? null;
}

const serialize = (records: unknown[]) => JSON.stringify(records, null, 2) + "\n";

const MAX_ATTEMPTS = 6;
/** Back off a little longer each time, with jitter, so simultaneous writers do not collide again. */
const backoff = (attempt: number) => new Promise((r) => setTimeout(r, 180 * (attempt + 1) + Math.random() * 160));

/** Apply `mutate` to the latest collection and commit. Retries on conflicts. */
export async function mutateCollection<T extends BaseRecord = BaseRecord>(
  name: string,
  mutate: (records: T[]) => T[],
  message: string,
  author?: string,
) {
  let lastErr: unknown;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const { records, sha } = await readCollection<T>(name);
    const next = mutate([...records]);
    try {
      await store.write(collectionPath(name), serialize(next), message, { sha, author });
      return next;
    } catch (e) {
      lastErr = e;
      if (!(e instanceof StoreConflictError)) throw e;
      await backoff(attempt);
    }
  }
  throw lastErr;
}

function coerceField(f: FieldDef, v: unknown): unknown {
  if (v === undefined) return undefined;
  if (v === null || v === "") return f.type === "boolean" ? false : v === null ? null : "";
  switch (f.type) {
    case "number":
    case "currency":
    case "percent": {
      const n = Number(String(v).replace(/[,₹\s]/g, ""));
      return Number.isFinite(n) ? n : null;
    }
    case "boolean":
      return v === true || v === "true" || v === "on" || v === 1 || v === "1";
    case "multiselect":
    case "tags":
      if (Array.isArray(v)) return v.map((x) => String(x).trim()).filter(Boolean);
      return String(v)
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean);
    case "lineItems":
      if (!Array.isArray(v)) return [];
      return v
        .map((it) => ({
          description: String(it?.description ?? "").trim(),
          qty: Number(it?.qty) || 0,
          rate: Number(it?.rate) || 0,
          ...(it?.sac ? { sac: String(it.sac) } : {}),
          ...(it?.productId ? { productId: String(it.productId) } : {}),
        }))
        .filter((it) => it.description || it.qty || it.rate);
    default:
      return typeof v === "string" ? v.trim() : v;
  }
}

export function validateRecord(def: CollectionDef, input: Record<string, unknown>, partial = false) {
  const issues: string[] = [];
  const out: Record<string, unknown> = { ...input };
  for (const f of def.fields) {
    if (f.key in input) out[f.key] = coerceField(f, input[f.key]);
    const val = out[f.key];
    if (!partial && f.required && (val === undefined || val === null || val === "" || (Array.isArray(val) && !val.length))) {
      issues.push(`${f.label} is required`);
    }
    if (f.type === "select" && val && f.options && !f.options.some((o) => o.value === val)) {
      issues.push(`${f.label}: "${String(val)}" is not a valid option`);
    }
    if (f.type === "email" && val && !/^\S+@\S+\.\S+$/.test(String(val))) issues.push(`${f.label} looks invalid`);
  }
  // guard against huge payloads
  if (JSON.stringify(out).length > 200_000) issues.push("Record is too large");
  if (issues.length) throw new ValidationError(issues);
  return out;
}

export async function upsertRecord<T extends BaseRecord = BaseRecord>(name: string, input: Partial<T> & Record<string, unknown>, author: string) {
  const def = getCollection(name);
  if (!def) throw new Error(`Unknown collection ${name}`);
  const now = new Date().toISOString();
  const isNew = !input.id;
  const clean = validateRecord(def, input, false);
  let saved: T | null = null;
  await mutateCollection<T>(
    name,
    (records) => {
      if (!isNew) {
        const idx = records.findIndex((r) => r.id === input.id);
        if (idx >= 0) {
          saved = { ...records[idx], ...clean, id: records[idx].id, createdAt: records[idx].createdAt, createdBy: records[idx].createdBy, updatedAt: now, updatedBy: author } as T;
          records[idx] = saved;
          return records;
        }
      }
      // defaults for new records
      const defaults: Record<string, unknown> = {};
      for (const f of def.fields) if (f.default !== undefined && clean[f.key] === undefined) defaults[f.key] = f.default;
      saved = { ...defaults, ...clean, id: (input.id as string) || uid(def.idPrefix), createdAt: now, createdBy: author, updatedAt: now, updatedBy: author } as T;
      records.push(saved);
      return records;
    },
    `${isNew ? "Add" : "Update"} ${def.singular.toLowerCase()}: ${String(clean[def.titleField] ?? input.id ?? "").slice(0, 60)}`,
    author,
  );
  return saved as unknown as T;
}

/** Insert/update many records in a single commit (bulk import, certificate batches). */
export async function upsertMany<T extends BaseRecord = BaseRecord>(name: string, inputs: Record<string, unknown>[], author: string) {
  const def = getCollection(name);
  if (!def) throw new Error(`Unknown collection ${name}`);
  if (inputs.length > 2000) throw new ValidationError(["Too many records in one batch (max 2000)"]);
  const now = new Date().toISOString();
  const cleaned = inputs.map((i) => validateRecord(def, i, false));
  const saved: T[] = [];
  await mutateCollection<T>(
    name,
    (records) => {
      for (const c of cleaned) {
        const idx = c.id ? records.findIndex((r) => r.id === c.id) : -1;
        if (idx >= 0) {
          records[idx] = { ...records[idx], ...c, updatedAt: now, updatedBy: author } as T;
          saved.push(records[idx]);
        } else {
          const defaults: Record<string, unknown> = {};
          for (const f of def.fields) if (f.default !== undefined && c[f.key] === undefined) defaults[f.key] = f.default;
          const rec = { ...defaults, ...c, id: (c.id as string) || uid(def.idPrefix), createdAt: now, createdBy: author, updatedAt: now, updatedBy: author } as T;
          records.push(rec);
          saved.push(rec);
        }
      }
      return records;
    },
    `Bulk update ${def.label.toLowerCase()} (${cleaned.length})`,
    author,
  );
  return saved;
}

export async function deleteRecord(name: string, id: string, author: string) {
  const def = getCollection(name);
  if (!def) throw new Error(`Unknown collection ${name}`);
  let title = id;
  await mutateCollection(
    name,
    (records) => {
      const r = records.find((x) => x.id === id);
      if (r) title = String(r[def.titleField] ?? id);
      return records.filter((x) => x.id !== id);
    },
    `Delete ${def.singular.toLowerCase()}: ${title.slice(0, 60)}`,
    author,
  );
}

/* ── Settings (single JSON object) ─────────────────────────────────────── */

export async function readSettings(opts: { revalidate?: number } = {}) {
  const { data, sha } = await store.readJSON<Partial<CompanySettings>>(SETTINGS_PATH, {}, opts);
  return { settings: { ...defaultSettings, ...data } as CompanySettings, sha };
}

export async function writeSettings(patch: Partial<CompanySettings>, author: string) {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const { settings, sha } = await readSettings();
    const next = { ...settings, ...patch, updatedAt: new Date().toISOString(), updatedBy: author };
    try {
      await store.write(SETTINGS_PATH, JSON.stringify(next, null, 2) + "\n", "Update company settings", { sha, author });
      return next;
    } catch (e) {
      if (!(e instanceof StoreConflictError)) throw e;
      await backoff(attempt);
    }
  }
  throw new StoreConflictError();
}

/**
 * Atomically take the next number from a settings counter
 * (invoice / proposal / PO / order numbers).
 */
export async function nextSequence(kind: "invoice" | "proposal" | "po" | "order", author: string) {
  const keys = {
    invoice: ["invoicePrefix", "nextInvoiceNumber", 3],
    proposal: ["proposalPrefix", "nextProposalNumber", 3],
    po: ["poPrefix", "nextPoNumber", 3],
    order: ["orderPrefix", "nextOrderNumber", 0],
  } as const;
  const [prefixKey, counterKey, padTo] = keys[kind];
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const { settings, sha } = await readSettings();
    const n = Number(settings[counterKey]) || 1;
    const next = { ...settings, [counterKey]: n + 1 };
    try {
      await store.write(SETTINGS_PATH, JSON.stringify(next, null, 2) + "\n", `Reserve ${kind} number ${n}`, { sha, author });
      return `${settings[prefixKey]}${padTo ? String(n).padStart(padTo, "0") : n}`;
    } catch (e) {
      if (!(e instanceof StoreConflictError)) throw e;
      await backoff(attempt);
    }
  }
  throw new StoreConflictError();
}

/** Readable, unambiguous certificate code: FM-26-7KQ2M */
export function certificateCode(prefix = "FM-26-") {
  const alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  let s = "";
  for (let i = 0; i < 5; i++) s += alphabet[Math.floor(Math.random() * alphabet.length)];
  return prefix + s;
}
