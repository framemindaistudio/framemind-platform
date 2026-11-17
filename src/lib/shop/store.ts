import "server-only";
import { store, StoreConflictError } from "@/lib/store";
import { DEFAULT_CATALOG } from "./defaults";
import { catalogProblems, ID_RE } from "./logic";
import type { ShopCatalog, ShopOrder } from "./types";
import { ValidationError } from "@/lib/hq/records";

/**
 * Where the store keeps things in the private data repository:
 *   data/shop/catalog.json            products, categories, coupons (HQ → Digital Store)
 *   data/shop/orders/<orderId>.json   one file per paid order (Razorpay order id)
 *   data/shop/buyers/<hash>.json      the order ids bought with an email address, for "resend my downloads"
 *   vault/shop/<productId>/<file>     the files buyers download (never served except through a signed link)
 */
export const CATALOG_PATH = "data/shop/catalog.json";
const ORDER_ID_RE = /^(order|mock)_[A-Za-z0-9]{6,40}$/;

export function validOrderId(id: string) {
  return ORDER_ID_RE.test(id);
}
export const orderPath = (id: string) => {
  if (!validOrderId(id)) throw new ValidationError(["Not an order number"]);
  return `data/shop/orders/${id}.json`;
};
export const productFolder = (productId: string) => {
  if (!ID_RE.test(productId)) throw new ValidationError(["Not a product id"]);
  return `vault/shop/${productId}`;
};

/** The saved catalogue, or the starting one while none is saved. */
export async function readCatalog(): Promise<{ catalog: ShopCatalog; sha?: string; saved: boolean }> {
  const { data, sha } = await store.readJSON<ShopCatalog | null>(CATALOG_PATH, null);
  if (!data) return { catalog: structuredClone(DEFAULT_CATALOG), saved: false };
  return { catalog: { categories: data.categories ?? [], products: (data.products ?? []).map((p) => ({ ...p, files: p.files ?? [] })), coupons: data.coupons ?? [], updated: data.updated }, sha, saved: true };
}

export async function writeCatalog(input: ShopCatalog, author: string, sha?: string): Promise<ShopCatalog> {
  const catalog: ShopCatalog = {
    categories: input.categories ?? [],
    products: (input.products ?? []).map((p) => ({ ...p, price: Number(p.price), mrp: p.mrp ? Number(p.mrp) : undefined, files: p.files ?? [] })),
    coupons: (input.coupons ?? []).map((c) => ({ ...c, value: Number(c.value) })),
    updated: new Date().toISOString(),
  };
  const problems = catalogProblems(catalog);
  if (problems.length) throw new ValidationError(problems);
  await store.write(CATALOG_PATH, JSON.stringify(catalog, null, 2) + "\n", "Digital Store: catalogue saved", { sha, author });
  return catalog;
}

export async function readOrder(id: string): Promise<ShopOrder | null> {
  if (!validOrderId(id)) return null;
  const { data } = await store.readJSON<ShopOrder | null>(orderPath(id), null);
  return data;
}

/** Every order, newest first. Reads one file per order: fine for HQ, never called by public pages. */
export async function listOrders(): Promise<ShopOrder[]> {
  const entries = await store.list("data/shop/orders");
  const files = entries.filter((e) => e.type === "file" && e.name.endsWith(".json"));
  const out: ShopOrder[] = [];
  for (let i = 0; i < files.length; i += 8) {
    const chunk = await Promise.all(files.slice(i, i + 8).map((f) => store.readJSON<ShopOrder | null>(f.path, null)));
    for (const c of chunk) if (c.data) out.push(c.data);
  }
  return out.sort((a, b) => b.paidAt.localeCompare(a.paidAt));
}

/** Retries a write a few times when another save moved the data repository at the same moment. */
export async function withRetry<T>(fn: () => Promise<T>, tries = 3): Promise<T> {
  for (let i = 0; ; i++) {
    try {
      return await fn();
    } catch (e) {
      if (!(e instanceof StoreConflictError) || i >= tries - 1) throw e;
      await new Promise((r) => setTimeout(r, 400 * (i + 1)));
    }
  }
}
