import { NextResponse } from "next/server";
import { apiError, clientIp, rateLimit } from "@/lib/hq/api";
import { resendForEmail } from "@/lib/shop/orders";
import { mailReady } from "@/lib/hq/mail";

/** POST { email } → emails the download links of every order bought with it. The answer never says whether any exist. */
export async function POST(req: Request) {
  if (!rateLimit(`shop-resend:${clientIp(req)}`, 5, 30 * 60 * 1000)) return NextResponse.json({ error: "Too many tries. Wait half an hour, or WhatsApp us." }, { status: 429 });
  if (!mailReady()) return NextResponse.json({ error: "Email is not available right now. WhatsApp us your order number and we'll send your files." }, { status: 503 });
  try {
    const body = await req.json();
    await resendForEmail(String(body?.email ?? ""));
    return NextResponse.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}
