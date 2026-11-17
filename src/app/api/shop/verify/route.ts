import { NextResponse } from "next/server";
import { apiError, clientIp, rateLimit } from "@/lib/hq/api";
import { fulfil, PaymentNotDoneError } from "@/lib/shop/orders";
import { checkoutSignatureOk, payMode } from "@/lib/shop/razorpay";
import { orderUrl } from "@/lib/shop/links";
import { validOrderId } from "@/lib/shop/store";

/**
 * POST { razorpay_order_id, razorpay_payment_id, razorpay_signature } → { url } of the order page with the downloads.
 * In local mock mode: { razorpay_order_id: "mock_…", mock: true }.
 */
export async function POST(req: Request) {
  if (!rateLimit(`shop-verify:${clientIp(req)}`, 20, 10 * 60 * 1000)) return NextResponse.json({ error: "Too many tries. Wait a few minutes." }, { status: 429 });
  try {
    const body = await req.json();
    const orderId = String(body?.razorpay_order_id ?? "");
    if (!validOrderId(orderId)) return NextResponse.json({ error: "Not an order number." }, { status: 400 });
    let paymentId: string;
    if (orderId.startsWith("mock_")) {
      if (payMode() !== "mock") return NextResponse.json({ error: "Test payments are off." }, { status: 400 });
      paymentId = `pay_mock${Date.now().toString(36)}`;
    } else {
      paymentId = String(body?.razorpay_payment_id ?? "");
      if (!checkoutSignatureOk(orderId, paymentId, String(body?.razorpay_signature ?? ""))) {
        return NextResponse.json({ error: "We could not confirm this payment. If money left your account, WhatsApp us your order number." }, { status: 400 });
      }
    }
    const order = await fulfil(orderId, paymentId, "checkout");
    return NextResponse.json({ url: orderUrl(order.id, false) });
  } catch (e) {
    if (e instanceof PaymentNotDoneError) return NextResponse.json({ error: e.message }, { status: 402 });
    return apiError(e);
  }
}
