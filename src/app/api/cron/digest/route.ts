import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { prepareDigest, sendDigest } from "@/lib/hq/digest";
import { sendPaperReminders } from "@/lib/hq/paper-mail";
import { indiaToday } from "@/lib/hq/reminders";

/**
 * The morning run, called once a day by Vercel Cron (schedule in vercel.json): reminders for papers still waiting
 * for a signature, then the founders' morning email.
 * Vercel sends "Authorization: Bearer <CRON_SECRET>"; any other caller is turned away.
 */
function allowed(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const got = Buffer.from(req.headers.get("authorization") ?? "");
  const want = Buffer.from(`Bearer ${secret}`);
  return got.length === want.length && timingSafeEqual(got, want);
}

export async function GET(req: Request) {
  if (!allowed(req)) return NextResponse.json({ error: "Not allowed" }, { status: 401 });
  const today = indiaToday();
  let papers: Awaited<ReturnType<typeof sendPaperReminders>> | { error: string };
  try {
    papers = await sendPaperReminders(today);
  } catch (e) {
    console.error("[paper reminders]", e);
    papers = { error: e instanceof Error ? e.message : "failed" };
  }
  try {
    const { to, list, mail } = await prepareDigest(today);
    if (!to.length) return NextResponse.json({ sent: false, reason: "Nobody is set to receive the morning email.", papers });
    // one email per morning, even if the call is repeated
    const id = await sendDigest(to, mail, `framemind-digest-${today}`);
    return NextResponse.json({ sent: true, id, reminders: list.length, papers });
  } catch (e) {
    console.error("[digest]", e);
    return NextResponse.json({ sent: false, error: e instanceof Error ? e.message : "Could not send" }, { status: 500 });
  }
}
