import "server-only";
import crypto from "node:crypto";

/**
 * Razorpay, called over its REST API (no SDK needed).
 *
 * Vercel environment variables (the founder adds these; Claude never enters keys):
 *   RAZORPAY_KEY_ID          rzp_test_… while testing, rzp_live_… for real money
 *   RAZORPAY_KEY_SECRET      the secret shown once when the key is made
 *   RAZORPAY_WEBHOOK_SECRET  the secret typed when adding the webhook https://www.framemindaistudio.com/api/shop/webhook
 *                            (events: payment.captured, order.paid)
 *
 * Local development without keys: SHOP_MOCK_PAYMENTS=1 in .env.local fakes the payment step so the rest of the
 * store (orders, downloads, emails) can be tried. It is refused on Vercel.
 */

const API = "https://api.razorpay.com/v1";

export type PayMode = "live" | "test" | "mock" | "off";

export function payMode(): PayMode {
  const id = process.env.RAZORPAY_KEY_ID || "";
  if (id && process.env.RAZORPAY_KEY_SECRET) return id.startsWith("rzp_live_") ? "live" : "test";
  if (process.env.SHOP_MOCK_PAYMENTS === "1" && !process.env.VERCEL && process.env.NODE_ENV !== "production") return "mock";
  return "off";
}

export const keyId = () => process.env.RAZORPAY_KEY_ID || "";

function auth() {
  return "Basic " + Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString("base64");
}

async function rzp<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: { Authorization: auth(), "Content-Type": "application/json", ...(init.headers as Record<string, string>) },
    cache: "no-store",
  });
  const text = await res.text();
  if (!res.ok) {
    let msg = text;
    try {
      msg = JSON.parse(text)?.error?.description || text;
    } catch {}
    throw new Error(`Razorpay: ${msg}`);
  }
  return JSON.parse(text) as T;
}

export interface RzpOrder {
  id: string;
  amount: number;
  amount_paid: number;
  currency: string;
  status: "created" | "attempted" | "paid";
  receipt?: string;
  notes: Record<string, string>;
}

export interface RzpPayment {
  id: string;
  order_id: string;
  amount: number;
  currency: string;
  status: "created" | "authorized" | "captured" | "refunded" | "failed";
  method?: string;
  email?: string;
  contact?: string;
}

export function createOrder(amountRupees: number, receipt: string, notes: Record<string, string>) {
  return rzp<RzpOrder>("/orders", { method: "POST", body: JSON.stringify({ amount: amountRupees * 100, currency: "INR", receipt, notes }) });
}
export const fetchOrder = (id: string) => rzp<RzpOrder>(`/orders/${encodeURIComponent(id)}`);
export const fetchPayment = (id: string) => rzp<RzpPayment>(`/payments/${encodeURIComponent(id)}`);
export const capturePayment = (id: string, amountPaise: number) =>
  rzp<RzpPayment>(`/payments/${encodeURIComponent(id)}/capture`, { method: "POST", body: JSON.stringify({ amount: amountPaise, currency: "INR" }) });

function safeEqualHex(a: string, b: string) {
  const ab = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  return ab.length === bb.length && crypto.timingSafeEqual(ab, bb);
}

/** The checkout's handler signature: HMAC-SHA256(order_id|payment_id, key secret). */
export function checkoutSignatureOk(orderId: string, paymentId: string, signature: string) {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret || !signature) return false;
  const expected = crypto.createHmac("sha256", secret).update(`${orderId}|${paymentId}`).digest("hex");
  return safeEqualHex(expected, signature);
}

/** A webhook's X-Razorpay-Signature: HMAC-SHA256(raw body, webhook secret). */
export function webhookSignatureOk(rawBody: string, signature: string | null) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  return safeEqualHex(expected, signature);
}
