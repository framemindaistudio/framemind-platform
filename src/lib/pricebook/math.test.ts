/**
 * Tests for quote arithmetic: ready packages and discount stacking. Run: npm test
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import type { Service } from "@/lib/content/catalog";
import { activeGroups, packageChosen, priceService, quoteMoney, type QuoteLine } from "./math.ts";

const video: Service = {
  id: "videography",
  name: "Videography",
  short: "",
  description: "",
  billing: "project",
  included: [],
  icon: "Video",
  groups: [
    { id: "package", title: "Package", mode: "one", options: [{ id: "pk1", label: "Corporate video", price: 40000, base: true }, { id: "pk0", label: "Build my own", price: 0, base: true }] },
    { id: "shootdays", title: "Shoot days", mode: "one", core: true, options: [{ id: "vs1", label: "Half day", price: 10000, base: true }] },
    { id: "videoaddons", title: "Add-ons", mode: "any", options: [{ id: "va1", label: "Drone", price: 14000 }] },
  ],
};

test("a ready package replaces the core choices; add-ons still count", () => {
  const sel = { package: ["pk1"], shootdays: ["vs1"], videoaddons: ["va1"] };
  assert.equal(packageChosen(video, sel), true);
  assert.deepEqual(activeGroups(video, sel).map((g) => g.id), ["package", "videoaddons"]);
  assert.equal(priceService(video, sel).subtotal, 54000, "package 40,000 + drone 14,000; the half-day shoot is not charged twice");
});

test("build my own charges every chosen option", () => {
  const sel = { package: ["pk0"], shootdays: ["vs1"], videoaddons: ["va1"] };
  assert.equal(packageChosen(video, sel), false);
  assert.equal(priceService(video, sel).subtotal, 24000);
});

test("the bundle discount applies to one-time work only, never on top of a contract discount", () => {
  const lines = [
    { kind: "service", key: "a", serviceId: "websites", title: "Website", selections: {}, items: [], amount: 100000, billing: "project" },
    { kind: "service", key: "b", serviceId: "social", title: "Social", selections: {}, items: [], amount: 27000, billing: "month", months: 6, contractDiscountPercent: 10 },
  ] as QuoteLine[];
  const m = quoteMoney(lines, { applyBundle: true, bundleSteps: [{ services: 2, discountPercent: 5 }], extraPercent: 0, gstPercent: 18 });
  assert.equal(m.bundleAmount, 5000, "5% of the ₹1,00,000 website only");
  assert.equal(m.taxable, 100000 + 27000 * 6 - 5000);
  assert.equal(m.monthlyNet, 27000, "the retainer keeps only its contract discount");
});

test("an industry app: setup once, the yearly plan exactly, and other retainers keep their own months", async () => {
  const { priceIndustry } = await import("../content/industries.ts");
  // Real Estate Broker App, Pro (₹5,999), 2 branches (+50%), yearly (2 months free), WhatsApp add-on
  const q = priceIndustry(null, "realestate", "pro", "annual", 2, ["whatsapp"]);
  assert.equal(q.monthly, 8999, "5,999 + 50% for the second branch, rounded");
  assert.equal(q.recurring, 89990, "a year = 10 months");
  assert.equal(q.firstPayment, 14999 + 4999 + 89990);
  const app: QuoteLine = { kind: "industry", key: "a", title: "App", industry: "realestate", tier: "pro", plan: "annual", branches: 2, addOns: ["whatsapp"], items: q.oneTimeItems, setup: 19998, amount: q.recurring, periods: 1 };
  const social: QuoteLine = { kind: "custom", key: "s", title: "Social", items: [], amount: 30000, billing: "month" };
  const m = quoteMoney([app, social], { applyBundle: false, bundleSteps: [], extraPercent: 0, gstPercent: 0 });
  assert.equal(m.planTotal, 89990, "the yearly plan counts exactly, with no rounding through months");
  assert.equal(m.months, 1, "the app plan does not stretch the social retainer to 12 months");
  assert.equal(m.taxable, 19998 + 89990 + 30000);
});

test("TradeOS has its own setup fee; the other apps keep the common one", async () => {
  const { priceIndustry, INDUSTRIES } = await import("../content/industries.ts");
  assert.equal(INDUSTRIES[0].id, "distribution", "wholesale & distributors comes first");
  const t = priceIndustry(null, "distribution", "growth", "monthly", 1, []);
  assert.equal(t.setup, 15000);
  assert.equal(t.firstPayment, 15000 + 1499);
  assert.equal(priceIndustry(null, "clinic", "growth", "monthly", 1, []).setup, 14999);
});
