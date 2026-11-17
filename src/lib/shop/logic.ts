/**
 * The store's rules, with no server code in them, so the website, the checkout API, HQ and the tests share one copy.
 */
import type { PublicProduct, ShopCatalog, ShopCoupon, ShopProduct } from "./types.ts";

export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const ID_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** A product can be bought: live, priced at ₹1 or more, and with something to download. */
export function isBuyable(p: ShopProduct, catalog: ShopCatalog): boolean {
  if (p.status !== "live" || !(p.price >= 1)) return false;
  return deliverables(p, catalog).some((d) => d.files.length > 0);
}

/** The products whose files a purchase of `p` delivers: a bundle's products (live or not), or the product itself. */
export function deliverables(p: ShopProduct, catalog: ShopCatalog): ShopProduct[] {
  if (!p.bundleOf?.length) return [p];
  const out: ShopProduct[] = [];
  for (const id of p.bundleOf) {
    const inner = catalog.products.find((x) => x.id === id);
    if (inner && !inner.bundleOf?.length) out.push(inner);
  }
  return out;
}

export function toPublic(p: ShopProduct, catalog: ShopCatalog): PublicProduct {
  const { files, ...rest } = p;
  const fileCount = p.bundleOf?.length ? deliverables(p, catalog).reduce((n, d) => n + d.files.length, 0) : files.length;
  return { ...rest, fileCount, buyable: isBuyable(p, catalog) };
}

/** Products the website lists: everything not hidden, featured first, then in catalogue order. */
export function publicProducts(catalog: ShopCatalog): PublicProduct[] {
  return catalog.products
    .filter((p) => p.status !== "hidden")
    .map((p) => toPublic(p, catalog))
    .sort((a, b) => Number(!!b.featured) - Number(!!a.featured));
}

export function todayIST(now = new Date()): string {
  return new Date(now.getTime() + 5.5 * 3600 * 1000).toISOString().slice(0, 10);
}

export function normaliseCode(code: string) {
  return code.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

/** The coupon matching `code`, if it is switched on and not past its last day. */
export function findCoupon(catalog: ShopCatalog, code: string | undefined, now = new Date()): ShopCoupon | undefined {
  if (!code) return undefined;
  const c = normaliseCode(code);
  if (!c) return undefined;
  const coupon = catalog.coupons.find((x) => normaliseCode(x.code) === c);
  if (!coupon || !coupon.active) return undefined;
  if (coupon.expires && coupon.expires < todayIST(now)) return undefined;
  return coupon;
}

/** Price after a coupon. Never below ₹1 (Razorpay's smallest payment); whole rupees. */
export function priceWith(subtotal: number, coupon?: ShopCoupon): { subtotal: number; discount: number; total: number } {
  let discount = 0;
  if (coupon) {
    discount = coupon.kind === "percent" ? Math.round((subtotal * Math.min(Math.max(coupon.value, 0), 100)) / 100) : Math.round(Math.max(coupon.value, 0));
  }
  discount = Math.min(discount, subtotal - 1);
  if (discount < 0) discount = 0;
  return { subtotal, discount, total: subtotal - discount };
}

export const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

export function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

/** Problems that stop a catalogue being saved; empty when it is fine. */
export function catalogProblems(c: ShopCatalog): string[] {
  const out: string[] = [];
  const ids = new Set<string>();
  const slugs = new Set<string>();
  const cats = new Set(c.categories.map((x) => x.id));
  for (const cat of c.categories) if (!ID_RE.test(cat.id) || !cat.name.trim()) out.push(`Category "${cat.name || cat.id}" needs a name and a lowercase id.`);
  for (const p of c.products) {
    const label = p.title || p.id;
    if (!ID_RE.test(p.id)) out.push(`"${label}": the id must be lowercase letters, numbers and dashes.`);
    if (ids.has(p.id)) out.push(`Two products have the id "${p.id}".`);
    ids.add(p.id);
    if (!SLUG_RE.test(p.slug)) out.push(`"${label}": the web address must be lowercase letters, numbers and dashes.`);
    if (slugs.has(p.slug)) out.push(`Two products have the web address "${p.slug}".`);
    slugs.add(p.slug);
    if (!p.title.trim()) out.push(`Product "${p.id}" needs a title.`);
    if (!cats.has(p.category)) out.push(`"${label}": the category "${p.category}" does not exist.`);
    if (!Number.isFinite(p.price) || p.price < 0 || Math.round(p.price) !== p.price) out.push(`"${label}": the price must be whole rupees.`);
    if (p.status === "live" && p.price < 1) out.push(`"${label}": a live product needs a price of at least ₹1.`);
    if (p.status === "live" && !isBuyable(p, c)) out.push(`"${label}" is set to Live but has no files to download yet.`);
    for (const f of p.files) if (!f.path.startsWith(`vault/shop/${p.id}/`)) out.push(`"${label}": file ${f.name} is outside its folder.`);
    for (const b of p.bundleOf ?? []) if (!c.products.some((x) => x.id === b)) out.push(`Bundle "${label}" includes "${b}", which does not exist.`);
  }
  const codes = new Set<string>();
  for (const k of c.coupons) {
    const code = normaliseCode(k.code);
    if (!code) out.push("A coupon has no code.");
    if (codes.has(code)) out.push(`Two coupons have the code ${code}.`);
    codes.add(code);
    if (!(k.value > 0)) out.push(`Coupon ${code}: the discount must be more than 0.`);
    if (k.kind === "percent" && k.value > 90) out.push(`Coupon ${code}: a discount over 90% is not allowed.`);
  }
  return out;
}
