import { NextResponse } from "next/server";
import { fulfil, PaymentNotDoneError } from "@/lib/shop/orders";
import { webhookSignatureOk } from "@/lib/shop/razorpay";
import { validOrderId } from "@/lib/shop/store";

/**
 * Razorpay webhook (Dashboard → Developers → Webhooks): https://www.framemindaistudio.com/api/shop/webhook
 * Events: payment.captured, order.paid. Delivers the order even when the buyer closed the tab after paying.
 */
export async function POST(req: Request) {
  const raw = await req.text();
  if (!webhookSignatureOk(raw, req.headers.get("x-razorpay-signature"))) return NextResponse.json({ error: "bad signature" }, { status: 401 });
  let event: { event?: string; payload?: { payment?: { entity?: { id?: string; order_id?: string; notes?: Record<string, string> } } } };
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "bad body" }, { status: 400 });
  }
  if (event.event !== "payment.captured" && event.event !== "order.paid") return NextResponse.json({ ok: true, ignored: event.event });
  const payment = event.payload?.payment?.entity;
  // payments without an order (and, inside fulfil, orders without the store's note) are left alone:
  // the same Razorpay account also takes payment links and pages
  if (!payment?.id || !payment.order_id || !validOrderId(payment.order_id) || (payment.notes && payment.notes.store && payment.notes.store !== "framemind")) {
    return NextResponse.json({ ok: true, ignored: "not a store order" });
  }
  try {
    await fulfil(payment.order_id, payment.id, "webhook");
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[store webhook]", e);
    // a payment that is not complete is final (200, so Razorpay does not retry); anything else retries
    if (e instanceof PaymentNotDoneError) return NextResponse.json({ ok: false, reason: e.message });
    return NextResponse.json({ error: "try again" }, { status: 500 });
  }
}
