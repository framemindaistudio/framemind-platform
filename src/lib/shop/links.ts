import "server-only";
import crypto from "node:crypto";
import { site } from "@/lib/site";

/**
 * Signed links, so nobody can guess their way to an order or a file:
 *   the order page   /shop/order/<orderId>?k=<key>        key = HMAC(order id); never expires (it is the buyer's receipt)
 *   a download       /api/shop/download?o=&p=&f=&e=&s=    signed with an expiry, made fresh each time the order page opens
 * The secret is SHOP_LINK_SECRET, or HQ_SESSION_SECRET when that is not set. Changing it breaks every link sent so far.
 */
export const DOWNLOAD_HOURS = 48;

function secret() {
  const s = process.env.SHOP_LINK_SECRET || process.env.HQ_SESSION_SECRET;
  if (s && s.length >= 32) return s;
  if (process.env.NODE_ENV !== "production") return "framemind-dev-only-shop-secret-change-me-32chars";
  throw new Error("SHOP_LINK_SECRET (or HQ_SESSION_SECRET) is not set.");
}

const mac = (text: string, len = 32) => crypto.createHmac("sha256", secret()).update(text).digest("base64url").slice(0, len);

function same(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && crypto.timingSafeEqual(ab, bb);
}

export const orderKey = (orderId: string) => mac(`order|${orderId}`, 24);
export const orderKeyOk = (orderId: string, key: string | null | undefined) => !!key && same(orderKey(orderId), key);

export function orderUrl(orderId: string, absolute = true) {
  const rel = `/shop/order/${orderId}?k=${orderKey(orderId)}`;
  return absolute ? `${site.website}${rel}` : rel;
}

export function downloadUrl(orderId: string, productId: string, fileIndex: number, now = Date.now()) {
  const e = Math.floor(now / 1000) + DOWNLOAD_HOURS * 3600;
  const s = mac(`dl|${orderId}|${productId}|${fileIndex}|${e}`);
  const q = new URLSearchParams({ o: orderId, p: productId, f: String(fileIndex), e: String(e), s });
  return `/api/shop/download?${q}`;
}

export function downloadOk(q: { o: string; p: string; f: string; e: string; s: string }, now = Date.now()) {
  const e = Number(q.e);
  if (!Number.isFinite(e) || e * 1000 < now) return false;
  return same(mac(`dl|${q.o}|${q.p}|${q.f}|${q.e}`), q.s || "");
}

/** The name of a buyer's index file: a hash, so the data repository holds no list of emails in its file names. */
export const buyerKey = (email: string) => crypto.createHash("sha256").update(`buyer|${email.trim().toLowerCase()}`).digest("hex").slice(0, 32);
