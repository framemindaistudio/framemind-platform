import { NextResponse } from "next/server";
import { apiUser } from "@/lib/hq/auth";
import { apiError, rateLimit } from "@/lib/hq/api";
import { STAFF } from "@/lib/hq/roles";
import { IncentiveError, loadData, myRequest, myView, registerLead } from "@/lib/incentives/server";

/**
 * A team member's own incentives: their leads, statements and shared reviews — only theirs, decided here on the
 * server from the login's link to Team & Payroll. POST registers a lead, acknowledges a review or asks for a
 * correction; these are the only changes a view-only team login can make (proxy.ts lets this path through).
 */
export async function GET() {
  const { user, error } = await apiUser(STAFF);
  if (error) return error;
  try {
    return NextResponse.json(myView(await loadData(), user));
  } catch (e) {
    return apiError(e);
  }
}

export async function POST(req: Request) {
  const { user, error } = await apiUser(STAFF);
  if (error) return error;
  if (!rateLimit(`incentives-me:${user.username}`, 30, 10 * 60 * 1000)) return NextResponse.json({ error: "Too many requests — try again in a few minutes." }, { status: 429 });
  try {
    const body = await req.json();
    const d = await loadData();
    if (body.action === "registerLead") {
      const lead = await registerLead(d, user, body.lead ?? {});
      return NextResponse.json({ ok: true, id: lead.id });
    }
    if (body.action === "acknowledge" || body.action === "correction") {
      await myRequest(d, user, { kind: body.action, target: body.target === "payout" ? "payout" : "review", id: String(body.id), text: body.text });
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (e) {
    if (e instanceof IncentiveError) return NextResponse.json({ error: e.message }, { status: e.status });
    return apiError(e);
  }
}
