import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { webhookSecret } from "@/lib/dev/github";
import { handleEvent } from "@/lib/dev/server";

/**
 * GitHub → HQ. Each client repository's webhook (set up by HQ) posts here; the signature proves it came from GitHub
 * with HQ's secret. No session: proxy.ts lets this one path through, and an unsigned or wrongly signed call is refused.
 */
export async function POST(req: Request) {
  const secret = webhookSecret();
  if (!secret) return NextResponse.json({ error: "Not configured" }, { status: 503 });
  const body = await req.text();
  const given = req.headers.get("x-hub-signature-256") ?? "";
  const want = `sha256=${crypto.createHmac("sha256", secret).update(body).digest("hex")}`;
  if (given.length !== want.length || !crypto.timingSafeEqual(Buffer.from(given), Buffer.from(want))) return NextResponse.json({ error: "Bad signature" }, { status: 401 });
  const event = req.headers.get("x-github-event") ?? "";
  if (event === "ping") return NextResponse.json({ ok: true, pong: true });
  try {
    return NextResponse.json({ ok: true, result: await handleEvent(event, JSON.parse(body)) });
  } catch (e) {
    console.error("[dev webhook]", event, e);
    // a 500 makes GitHub show the failure on the webhook's delivery page, where it can be redelivered
    return NextResponse.json({ error: e instanceof Error ? e.message : "failed" }, { status: 500 });
  }
}
