import "server-only";
import crypto from "node:crypto";
import { store } from "@/lib/store";
import { upsertRecord, ValidationError } from "@/lib/hq/records";
import { esc, isEmail, mailReady, sendMail } from "@/lib/hq/mail";
import { site } from "@/lib/site";
import { deliverables, findCoupon, inr, isBuyable, priceWith } from "./logic";
import { orderPath, readCatalog, readOrder, withRetry } from "./store";
import { buyerKey, orderUrl } from "./links";
import { capturePayment, createOrder, fetchOrder, fetchPayment, payMode } from "./razorpay";
import type { ShopCatalog, ShopOrder } from "./types";

/**
 * Buying, start to finish:
 *   1. startCheckout  — prices the product on the server (never trusts the browser's price), creates a Razorpay order
 *                       and keeps who is buying what in the order's notes. Nothing is saved yet: abandoned checkouts
 *                       cost no commit.
 *   2. Razorpay Checkout runs in the browser (UPI apps, cards, netbanking).
 *   3. fulfil         — called by /api/shop/verify (the browser, right after paying) and by /api/shop/webhook
 *                       (Razorpay, even if the buyer closed the tab). It checks the payment with Razorpay, saves the
 *                       order once, emails the download link and books the money in Finance → Other Income.
 *                       Calling it twice for the same order does nothing the second time.
 */

export interface CheckoutInput {
  productId: string;
  email: string;
  name: string;
  phone?: string;
  coupon?: string;
}

export interface CheckoutStart {
  mode: "live" | "test" | "mock";
  orderId: string;
  amount: number; // rupees
  title: string;
  discount: number;
}

/** Mock payments (local development only): the order's notes, held in memory until "paid". */
const mockOrders: Map<string, { amount: number; notes: Record<string, string> }> = ((globalThis as Record<string, unknown>).__fmMockOrders ??= new Map()) as Map<
  string,
  { amount: number; notes: Record<string, string> }
>;

function cleanInput(input: CheckoutInput) {
  const email = String(input.email || "").trim().toLowerCase();
  const name = String(input.name || "").trim().replace(/\s+/g, " ").slice(0, 80);
  const phone = String(input.phone || "").replace(/[^\d+]/g, "").slice(0, 15);
  if (!isEmail(email) || email.length > 120) throw new ValidationError(["Enter a valid email address: your download link is sent there."]);
  if (name.length < 2) throw new ValidationError(["Enter your name."]);
  if (phone && phone.replace(/\D/g, "").length < 10) throw new ValidationError(["Enter a 10-digit phone number, or leave it empty."]);
  return { email, name, phone };
}

export async function startCheckout(input: CheckoutInput): Promise<CheckoutStart> {
  const mode = payMode();
  if (mode === "off") throw new Error("Payments are not switched on yet. Please message us on WhatsApp to buy this.");
  const { email, name, phone } = cleanInput(input);
  const { catalog } = await readCatalog();
  const product = catalog.products.find((p) => p.id === input.productId);
  if (!product || !isBuyable(product, catalog)) throw new ValidationError(["This product is not on sale right now."]);
  const coupon = findCoupon(catalog, input.coupon);
  if (input.coupon?.trim() && !coupon) throw new ValidationError(["That coupon code is not valid."]);
  const price = priceWith(product.price, coupon);
  const notes: Record<string, string> = { product: product.id, email, name, ...(phone ? { phone } : {}), ...(coupon ? { coupon: coupon.code.toUpperCase() } : {}), store: "framemind" };
  const receipt = `fms_${Date.now().toString(36)}`;
  if (mode === "mock") {
    const orderId = `mock_${crypto.randomBytes(9).toString("hex")}`;
    mockOrders.set(orderId, { amount: price.total, notes });
    return { mode, orderId, amount: price.total, title: product.title, discount: price.discount };
  }
  const order = await createOrder(price.total, receipt, notes);
  return { mode, orderId: order.id, amount: price.total, title: product.title, discount: price.discount };
}

export class PaymentNotDoneError extends Error {}

/** Checks the payment with Razorpay and saves the order (once). Returns the saved order. */
export async function fulfil(orderId: string, paymentId: string, source: "checkout" | "webhook"): Promise<ShopOrder> {
  const existing = await readOrder(orderId);
  if (existing) return existing;

  const mode = payMode();
  let amount: number;
  let notes: Record<string, string>;
  let method: string | undefined;
  let orderMode: ShopOrder["mode"];

  if (orderId.startsWith("mock_")) {
    if (mode !== "mock") throw new PaymentNotDoneError("Mock orders work only in local development.");
    const m = mockOrders.get(orderId);
    if (!m) throw new PaymentNotDoneError("Unknown test order (the dev server restarted?). Start the checkout again.");
    amount = m.amount;
    notes = m.notes;
    method = "mock";
    orderMode = "mock";
  } else {
    if (mode !== "live" && mode !== "test") throw new PaymentNotDoneError("Payments are not set up.");
    const [order, payment] = await Promise.all([fetchOrder(orderId), fetchPayment(paymentId)]);
    if (payment.order_id !== order.id) throw new PaymentNotDoneError("That payment does not belong to this order.");
    if (payment.status === "authorized") {
      const captured = await capturePayment(payment.id, payment.amount);
      payment.status = captured.status;
    }
    if (payment.status !== "captured") throw new PaymentNotDoneError(`The payment is ${payment.status}, not complete.`);
    if (payment.amount < order.amount) throw new PaymentNotDoneError("The amount paid is less than the order.");
    if (order.notes?.store !== "framemind") throw new PaymentNotDoneError("Not a store order.");
    amount = Math.round(payment.amount / 100);
    notes = order.notes;
    method = payment.method;
    orderMode = mode;
  }

  const { catalog } = await readCatalog();
  const product = catalog.products.find((p) => p.id === notes.product);
  const title = product?.title ?? notes.product;
  const listPrice = product?.price ?? amount;
  const saved: ShopOrder = {
    id: orderId,
    paymentId,
    email: notes.email,
    name: notes.name,
    ...(notes.phone ? { phone: notes.phone } : {}),
    items: [{ id: notes.product, title, price: listPrice }],
    subtotal: Math.max(listPrice, amount),
    discount: Math.max(listPrice - amount, 0),
    ...(notes.coupon ? { coupon: notes.coupon } : {}),
    total: amount,
    paidAt: new Date().toISOString(),
    ...(method ? { method } : {}),
    status: "paid",
    mode: orderMode,
  };

  // the order itself first: once this is saved, the buyer can always get their files
  await withRetry(async () => {
    if (await readOrder(orderId)) return;
    await store.write(orderPath(orderId), JSON.stringify(saved, null, 2) + "\n", `Store order ${orderId}: ${title} (${inr(amount)}) via ${source}`, { author: "FrameMind Store" });
  });

  // the rest is best effort: a failure here never loses the sale
  await Promise.allSettled([
    addToBuyerIndex(saved),
    orderMode === "live" ? bookIncome(saved) : Promise.resolve(),
    emailReceipt(saved, catalog),
  ]).then((r) => r.forEach((x) => x.status === "rejected" && console.error("[store] after-sale step failed:", x.reason)));

  return saved;
}

async function addToBuyerIndex(o: ShopOrder) {
  const path = `data/shop/buyers/${buyerKey(o.email)}.json`;
  await withRetry(async () => {
    const { data, sha } = await store.readJSON<{ orders: string[] }>(path, { orders: [] });
    if (data.orders.includes(o.id)) return;
    data.orders.push(o.id);
    await store.write(path, JSON.stringify(data) + "\n", "Store: buyer index", { sha, author: "FrameMind Store" });
  });
}

async function bookIncome(o: ShopOrder) {
  await upsertRecord(
    "income",
    {
      id: `inc-shop-${o.id.replace(/^order_/, "")}`,
      date: o.paidAt.slice(0, 10),
      stream: "Digital products",
      amount: o.total,
      description: `Store: ${o.items.map((i) => i.title).join(", ")}`,
      from: o.name,
      mode: "gateway",
      reference: o.paymentId,
      notes: `Razorpay order ${o.id}${o.coupon ? `, coupon ${o.coupon}` : ""}`,
    },
    "FrameMind Store",
  );
}

/** The receipt email with the order page link (where the downloads are). Skipped when email is not connected. */
export async function emailReceipt(o: ShopOrder, catalog?: ShopCatalog, opts: { resend?: boolean } = {}) {
  if (!mailReady()) return;
  const cat = catalog ?? (await readCatalog()).catalog;
  const link = orderUrl(o.id);
  const items = o.items.map((i) => {
    const p = cat.products.find((x) => x.id === i.id);
    const inside = p ? deliverables(p, cat).map((d) => d.title) : [];
    return { title: i.title, inside: p?.bundleOf?.length ? inside : [] };
  });
  const listHtml = items.map((i) => `<li><b>${esc(i.title)}</b>${i.inside.length ? `<br><span style="color:#666">${i.inside.map(esc).join(" · ")}</span>` : ""}</li>`).join("");
  const html = `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;color:#111">
<p style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#666">FrameMind Store</p>
<h2 style="margin:0 0 12px">Thanks, ${esc(o.name.split(" ")[0])}! Your files are ready.</h2>
<ul style="padding-left:18px">${listHtml}</ul>
<p><a href="${link}" style="display:inline-block;background:#C8F135;color:#0D0D0D;padding:12px 20px;text-decoration:none;font-weight:bold;border-radius:3px">Open my downloads</a></p>
<p style="font-size:13px;color:#555">Keep this email: the button above always opens your downloads. Order ${esc(o.id)} · paid ${inr(o.total)}</p>
<p style="font-size:13px;color:#555">A problem with a file? Reply to this email or WhatsApp us on ${esc(site.contact.phone)}.</p>
</div>`;
  const text = `Thanks, ${o.name}! Your FrameMind Store files are ready.\n\n${items.map((i) => `- ${i.title}`).join("\n")}\n\nOpen your downloads: ${link}\n\nOrder ${o.id} · paid ${inr(o.total)}\nA problem with a file? Reply to this email or WhatsApp ${site.contact.phone}.`;
  await sendMail({
    to: [o.email],
    subject: `Your download: ${o.items.map((i) => i.title).join(", ")}`,
    html,
    text,
    replyTo: site.contact.email,
    once: opts.resend ? undefined : `shop-${o.id}`,
  });
}

/** "Resend my downloads": emails every order bought with this address. Says nothing about whether any exist. */
export async function resendForEmail(email: string) {
  const clean = email.trim().toLowerCase();
  if (!isEmail(clean)) throw new ValidationError(["Enter a valid email address."]);
  const { data } = await store.readJSON<{ orders: string[] }>(`data/shop/buyers/${buyerKey(clean)}.json`, { orders: [] });
  const { catalog } = await readCatalog();
  for (const id of data.orders.slice(-10)) {
    const o = await readOrder(id);
    if (o && o.status === "paid" && o.email === clean) await emailReceipt(o, catalog, { resend: true });
  }
}
