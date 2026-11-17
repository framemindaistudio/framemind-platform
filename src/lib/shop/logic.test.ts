/**
 * Tests for the store's rules: what can be bought, coupons and prices, catalogue checks. Run: npm test
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import type { ShopCatalog, ShopProduct } from "./types.ts";
import { catalogProblems, deliverables, findCoupon, isBuyable, priceWith, publicProducts } from "./logic.ts";
import { DEFAULT_CATALOG } from "./defaults.ts";

const file = (id: string) => ({ name: "a.pdf", path: `vault/shop/${id}/a.pdf`, size: 10 });
const base = (over: Partial<ShopProduct>): ShopProduct => ({
  id: "guide",
  slug: "guide",
  title: "Guide",
  tagline: "",
  category: "ai",
  price: 99,
  status: "live",
  description: "",
  includes: [],
  formats: ["PDF"],
  files: [],
  ...over,
});
const cat = (products: ShopProduct[], coupons: ShopCatalog["coupons"] = []): ShopCatalog => ({ categories: [{ id: "ai", name: "AI", blurb: "", icon: "Sparkles" }], products, coupons });

test("a live product needs files and a price to be bought", () => {
  const noFiles = base({});
  const ready = base({ files: [file("guide")] });
  const soon = base({ files: [file("guide")], status: "soon" });
  const free = base({ files: [file("guide")], price: 0 });
  const c = cat([noFiles]);
  assert.equal(isBuyable(noFiles, c), false);
  assert.equal(isBuyable(ready, cat([ready])), true);
  assert.equal(isBuyable(soon, cat([soon])), false);
  assert.equal(isBuyable(free, cat([free])), false);
});

test("a bundle delivers its products' files and is buyable once one of them has files", () => {
  const a = base({ id: "a", slug: "a", files: [file("a")], status: "soon" });
  const b = base({ id: "b", slug: "b" });
  const bundle = base({ id: "bun", slug: "bun", bundleOf: ["a", "b"], price: 149 });
  const c = cat([a, b, bundle]);
  assert.deepEqual(deliverables(bundle, c).map((p) => p.id), ["a", "b"]);
  assert.equal(isBuyable(bundle, c), true);
  assert.equal(isBuyable(bundle, cat([b, bundle])), false);
});

test("coupons: percent, flat, expired, switched off, never below ₹1", () => {
  const c = cat([], [
    { code: "REEL20", kind: "percent", value: 20, active: true },
    { code: "FLAT50", kind: "flat", value: 50, active: true },
    { code: "OLD", kind: "percent", value: 50, active: true, expires: "2026-01-01" },
    { code: "OFF", kind: "percent", value: 50, active: false },
  ]);
  const now = new Date("2026-11-17T10:00:00Z");
  assert.deepEqual(priceWith(149, findCoupon(c, " reel20 ", now)), { subtotal: 149, discount: 30, total: 119 });
  assert.deepEqual(priceWith(49, findCoupon(c, "FLAT50", now)), { subtotal: 49, discount: 48, total: 1 });
  assert.equal(findCoupon(c, "OLD", now), undefined);
  assert.equal(findCoupon(c, "OFF", now), undefined);
  assert.equal(findCoupon(c, "NOPE", now), undefined);
  assert.deepEqual(priceWith(99), { subtotal: 99, discount: 0, total: 99 });
});

test("the starting catalogue is valid and lists nothing as buyable (no files yet)", () => {
  assert.deepEqual(catalogProblems(DEFAULT_CATALOG), []);
  assert.equal(publicProducts(DEFAULT_CATALOG).some((p) => p.buyable), false);
  for (const p of DEFAULT_CATALOG.products.filter((x) => x.bundleOf?.length)) {
    const sum = p.bundleOf!.reduce((n, id) => n + DEFAULT_CATALOG.products.find((x) => x.id === id)!.price, 0);
    assert.equal(p.mrp, sum, `${p.title}: struck-through price should equal the items bought one by one`);
    assert.ok(p.price < sum, `${p.title} should cost less than its items`);
  }
});

test("catalogue checks catch duplicates, bad slugs, live without files and files outside their folder", () => {
  const p = base({ files: [{ name: "x", path: "vault/shop/other/x", size: 1 }] });
  const problems = catalogProblems(cat([p, base({ slug: "Bad Slug" })]));
  assert.ok(problems.some((x) => x.includes("Two products have the id")));
  assert.ok(problems.some((x) => x.includes("web address must be")));
  assert.ok(problems.some((x) => x.includes("outside its folder")));
  assert.ok(problems.some((x) => x.includes("no files to download")));
});

test("public products never carry file paths", () => {
  const p = base({ files: [file("guide")] });
  const pub = publicProducts(cat([p]))[0] as unknown as Record<string, unknown>;
  assert.equal("files" in pub, false);
  assert.equal(pub.fileCount, 1);
});
