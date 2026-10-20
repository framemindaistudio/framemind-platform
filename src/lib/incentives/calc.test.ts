/**
 * Tests for the incentive arithmetic and rules. Run: npm test
 * (Node's own test runner; this file and calc.ts use relative imports only, so no build step is needed.)
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  bonusTier,
  claimKey,
  commissionFor,
  commissionLines,
  countable,
  eligibleFeeOf,
  moveProblem,
  quarterOf,
  quarterRange,
  splitProblem,
  sumFees,
  type Collection,
} from "./calc.ts";

test("quarterly bonus tiers: total per member, not stacked", () => {
  assert.equal(bonusTier(249_999).amount, 0);
  assert.equal(bonusTier(250_000).amount, 2_500);
  assert.equal(bonusTier(499_999).amount, 2_500);
  assert.equal(bonusTier(500_000).amount, 5_000);
  assert.equal(bonusTier(749_999).amount, 5_000);
  assert.equal(bonusTier(750_000).amount, 7_500);
  assert.equal(bonusTier(2_000_000).amount, 7_500);
  // just below a tier in paise does not round up into it
  assert.equal(bonusTier(249_999.99).amount, 0);
  assert.equal(bonusTier(600_000).next?.from, 750_000);
});

test("pool examples with nine eligible members", () => {
  for (const [c, pool] of [[250_000, 22_500], [500_000, 45_000], [750_000, 67_500]] as const) assert.equal(bonusTier(c).amount * 9, pool);
});

test("5% commission on eligible fees collected", () => {
  assert.equal(commissionFor(100_000, 5, 100), 5_000);
  assert.equal(commissionFor(40_000, 5, 100), 2_000);
  assert.equal(commissionFor(40_000, 5, 50), 1_000);
  assert.equal(commissionFor(33_333.33, 5, 100), 1_666.67);
});

test("GST is excluded: only the service-fee share of a payment counts", () => {
  // ₹1,00,000 fee + 18% GST = ₹1,18,000 invoice; paid in full
  assert.equal(eligibleFeeOf(118_000, { taxable: 100_000, gst: 18_000, total: 118_000 }), 100_000);
  // partial payment of ₹47,200 = ₹40,000 fee + ₹7,200 GST
  assert.equal(eligibleFeeOf(47_200, { taxable: 100_000, gst: 18_000, total: 118_000 }), 40_000);
  // pass-through charges inside the invoice are excluded too
  assert.equal(eligibleFeeOf(118_000, { taxable: 100_000, gst: 18_000, total: 118_000, excluded: 20_000 }), 80_000);
  // an overpayment never counts beyond the invoice
  assert.equal(eligibleFeeOf(200_000, { taxable: 100_000, gst: 18_000, total: 118_000 }), 100_000);
});

const col = (o: Partial<Collection>): Collection => ({ invoiceId: "inv1", paymentId: "p1", date: "2026-10-12", settled: 47_200, eligibleFee: 40_000, reconciled: true, refunded: false, leadId: "lead1", ...o });

test("an invoice alone, an unreconciled or refunded payment, and a repeated receipt do not count", () => {
  const list = [col({}), col({}), col({ paymentId: "p2", reconciled: false }), col({ paymentId: "p3", refunded: true })];
  assert.equal(countable(list).length, 1);
  assert.equal(sumFees(countable(list)), 40_000);
});

test("commission lines: accepted leads only, proportional to what was collected, no double claims", () => {
  const attributions = [
    { leadId: "lead1", status: "accepted", splits: [{ memberId: "m1", percent: 100 }] },
    { leadId: "lead2", status: "pending", splits: [{ memberId: "m1", percent: 100 }] },
  ];
  const collections = [col({}), col({ paymentId: "p2", leadId: "lead2" }), col({ paymentId: "p4", date: "2026-11-02" })];
  const lines = commissionLines({ memberId: "m1", month: "2026-10", collections, attributions, ratePercent: 5, alreadyClaimed: new Set() });
  assert.equal(lines.length, 1, "the pending lead and the November payment are left out");
  assert.equal(lines[0].amount, 2_000);
  const again = commissionLines({ memberId: "m1", month: "2026-10", collections, attributions, ratePercent: 5, alreadyClaimed: new Set([claimKey("p1", "m1")]) });
  assert.equal(again.length, 0, "a payment already claimed is not claimed twice");
});

test("commission splits must total exactly 100%", () => {
  assert.equal(splitProblem([{ memberId: "a", percent: 60 }, { memberId: "b", percent: 40 }]), null);
  assert.match(splitProblem([{ memberId: "a", percent: 60 }, { memberId: "b", percent: 50 }]) ?? "", /110%/);
  assert.match(splitProblem([{ memberId: "a", percent: 50 }, { memberId: "a", percent: 50 }]) ?? "", /once/);
  const bad = commissionLines({
    memberId: "a",
    month: "2026-10",
    collections: [col({})],
    attributions: [{ leadId: "lead1", status: "accepted", splits: [{ memberId: "a", percent: 80 }, { memberId: "b", percent: 40 }] }],
    ratePercent: 5,
    alreadyClaimed: new Set(),
  });
  assert.equal(bad.length, 0, "a split over 100% pays nothing until it is fixed");
});

test("payout rules: no self-approval, founder approves, payment evidence", () => {
  const base = { actorRole: "founder", payoutMemberId: "m1" };
  assert.equal(moveProblem({ ...base, from: "pending", to: "approved" }), null);
  assert.match(moveProblem({ ...base, from: "pending", to: "approved", actorTeamId: "m1" }) ?? "", /own payout/);
  assert.match(moveProblem({ ...base, from: "pending", to: "approved", actorRole: "admin" }) ?? "", /founder/);
  assert.match(moveProblem({ ...base, from: "calculated", to: "paid" }) ?? "", /cannot go/, "an unapproved payout cannot be marked paid");
  assert.match(moveProblem({ ...base, from: "on-hold", to: "paid" }) ?? "", /cannot go/, "an on-hold payout cannot be marked paid");
  assert.match(moveProblem({ ...base, from: "initiated", to: "paid" }) ?? "", /reference/);
  assert.equal(moveProblem({ ...base, from: "initiated", to: "paid", paymentReference: "UTR123" }), null);
  assert.match(moveProblem({ ...base, from: "pending", to: "rejected" }) ?? "", /reason/);
});

test("FY quarters", () => {
  assert.equal(quarterOf("2026-10-20"), "2026-Q3");
  assert.equal(quarterOf("2027-02-01"), "2026-Q4");
  assert.equal(quarterOf("2026-04-01"), "2026-Q1");
  assert.deepEqual([quarterRange("2026-Q3").start, quarterRange("2026-Q3").end], ["2026-10-01", "2026-12-31"]);
  assert.deepEqual([quarterRange("2026-Q4").start, quarterRange("2026-Q4").end], ["2027-01-01", "2027-03-31"]);
});
