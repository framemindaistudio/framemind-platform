import { NextResponse } from "next/server";
import { clientIp, rateLimit } from "@/lib/hq/api";
import { listRecords, upsertRecord } from "@/lib/hq/records";
import { indiaToday } from "@/lib/hq/reminders";
import type { SignDoc } from "@/lib/sign/context";
import { linkLive, shareOf } from "@/lib/sign/share";

/**
 * POST { token }: notes the first time a paper's private link is opened in a browser, so HQ can show "Opened".
 * Message apps fetching a link preview do not run the page's script, so they do not count.
 */
export async function POST(req: Request) {
  if (!rateLimit(`paper-opened:${clientIp(req)}`, 20, 10 * 60 * 1000)) return NextResponse.json({ ok: true });
  const body = (await req.json().catch(() => ({}))) as { token?: unknown };
  const token = typeof body.token === "string" ? body.token : "";
  if (!/^[\w-]{24,64}$/.test(token)) return NextResponse.json({ ok: true });
  try {
    const today = indiaToday();
    const doc = (await listRecords<SignDoc>("signDocs")).find((d) => shareOf(d)?.token === token);
    const share = shareOf(doc);
    if (doc && share && !share.openedOn && linkLive(doc, today)) await upsertRecord("signDocs", { ...doc, share: { ...share, openedOn: today } }, "FrameMind HQ (link opened)");
  } catch (e) {
    console.error("[paper-opened]", e);
  }
  return NextResponse.json({ ok: true });
}
