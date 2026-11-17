import { NextResponse } from "next/server";
import { apiError, clientIp, rateLimit } from "@/lib/hq/api";
import { startCheckout } from "@/lib/shop/orders";
import { keyId } from "@/lib/shop/razorpay";
import { site } from "@/lib/site";

/** POST { productId, email, name, phone?, coupon? } → a Razorpay order to open Checkout with. */
export async function POST(req: Request) {
  if (!rateLimit(`shop-checkout:${clientIp(req)}`, 12, 10 * 60 * 1000)) return NextResponse.json({ error: "Too many tries. Wait a few minutes." }, { status: 429 });
  try {
    const body = await req.json();
    const start = await startCheckout({ productId: String(body?.productId ?? ""), email: String(body?.email ?? ""), name: String(body?.name ?? ""), phone: body?.phone ? String(body.phone) : undefined, coupon: body?.coupon ? String(body.coupon) : undefined });
    return NextResponse.json({ ...start, key: start.mode === "mock" ? "" : keyId(), business: site.studio.name });
  } catch (e) {
    return apiError(e);
  }
}
