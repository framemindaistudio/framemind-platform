import { NextResponse } from "next/server";
import { apiEditor, apiUser } from "@/lib/hq/auth";
import { apiError } from "@/lib/hq/api";
import { LEADERSHIP } from "@/lib/hq/roles";
import { quarterOf } from "@/lib/incentives/calc.ts";
import {
  calculateBonus,
  calculateCommissions,
  dashboard,
  decideLead,
  IncentiveError,
  loadData,
  movePayout,
  quarterSummary,
  saveReview,
  savePolicy,
  setDeductions,
  workFacts,
} from "@/lib/incentives/server";
import { quarterRange } from "@/lib/incentives/calc.ts";

/**
 * HQ → Incentives (founder and admin only; the team's own view is /api/hq/incentives/me).
 * GET ?quarter=2026-Q3 → dashboard, quarter summary, policy versions, payouts, reviews, leads and the team's incentive set-up.
 * POST { action, ... } → one checked, logged change.
 */
export async function GET(req: Request) {
  const { error } = await apiUser(LEADERSHIP);
  if (error) return error;
  try {
    const d = await loadData();
    const url = new URL(req.url);
    const quarter = /^\d{4}-Q[1-4]$/.test(url.searchParams.get("quarter") ?? "") ? url.searchParams.get("quarter")! : quarterOf(d.today);
    const range = quarterRange(quarter);
    return NextResponse.json({
      dashboard: dashboard(d),
      quarter: quarterSummary(d, quarter),
      policy: d.policy,
      policies: d.policies,
      payouts: d.payouts,
      reviews: d.reviews,
      leads: d.leads.filter((l) => l.ownerId || l.attribution),
      team: d.team.map((m) => ({ id: m.id, name: m.name, role: m.role, status: m.status, compensationBasis: m.compensationBasis, incentiveEligible: m.incentiveEligible === true, incentiveFrom: m.incentiveFrom, joinDate: m.joinDate, facts: workFacts(d, m.id, range.start, range.end) })),
    });
  } catch (e) {
    return apiError(e);
  }
}

export async function POST(req: Request) {
  const { user, error } = await apiEditor(LEADERSHIP);
  if (error) return error;
  try {
    const body = await req.json();
    const d = await loadData();
    switch (body.action) {
      case "calculateCommissions":
        return NextResponse.json({ done: await calculateCommissions(d, String(body.month ?? ""), user.name) });
      case "calculateBonus":
        return NextResponse.json({ done: await calculateBonus(d, String(body.quarter ?? ""), user.name, Array.isArray(body.exclusions) ? body.exclusions : []) });
      case "movePayout":
        await movePayout(d, user, String(body.id), body.to, { reason: body.reason, paymentReference: body.paymentReference, paidOn: body.paidOn });
        break;
      case "setDeductions":
        await setDeductions(d, user, String(body.id), Number(body.deductions) || 0, String(body.note ?? ""));
        break;
      case "decideLead":
        await decideLead(d, user, String(body.leadId), body.decision === "accepted" ? "accepted" : "rejected", String(body.reason ?? ""), Array.isArray(body.splits) ? body.splits : undefined);
        break;
      case "savePolicy":
        await savePolicy(d, user, body.policy ?? {});
        break;
      case "saveReview":
        await saveReview(d, user, body.review ?? {});
        break;
      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof IncentiveError) return NextResponse.json({ error: e.message }, { status: e.status });
    return apiError(e);
  }
}
