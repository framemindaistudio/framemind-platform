import { NextResponse } from "next/server";
import { apiEditor, apiUser } from "@/lib/hq/auth";
import { apiError, rateLimit } from "@/lib/hq/api";
import { digestSetup, prepareDigest, sendDigest } from "@/lib/hq/digest";
import { indiaToday } from "@/lib/hq/reminders";
import { LEADERSHIP } from "@/lib/hq/roles";

/**
 * Morning email, for founders in Settings.
 * GET              → whether it is connected, who receives it, and today's email (subject, counts, HTML preview)
 * GET ?view=html   → today's email as a page, to look at in a new tab
 * POST             → send today's email now (a test)
 */
export async function GET(req: Request) {
  const { error } = await apiUser(LEADERSHIP);
  if (error) return error;
  try {
    const { to, list, mail } = await prepareDigest(indiaToday());
    if (new URL(req.url).searchParams.get("view") === "html") return new NextResponse(mail.html, { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } });
    return NextResponse.json({ setup: digestSetup(), to, subject: mail.subject, counts: mail.counts, reminders: list.length });
  } catch (e) {
    return apiError(e);
  }
}

export async function POST() {
  const { user, error } = await apiEditor(LEADERSHIP);
  if (error) return error;
  if (!rateLimit(`digest:${user.username}`, 5, 10 * 60 * 1000)) return NextResponse.json({ error: "That is several test emails in a few minutes. Please wait a little." }, { status: 429 });
  try {
    const { to, mail } = await prepareDigest(indiaToday());
    await sendDigest(to, { ...mail, subject: `[Test] ${mail.subject}` });
    return NextResponse.json({ sent: true, to });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Could not send" }, { status: 400 });
  }
}
