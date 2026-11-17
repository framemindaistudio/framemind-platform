import { NextResponse } from "next/server";
import { apiEditor, apiUser } from "@/lib/hq/auth";
import { apiError } from "@/lib/hq/api";
import { LEADERSHIP, OPS } from "@/lib/hq/roles";
import { listOrders, readOrder } from "@/lib/shop/store";
import { emailReceipt } from "@/lib/shop/orders";
import { orderUrl } from "@/lib/shop/links";
import { mailReady } from "@/lib/hq/mail";

/** GET → every store order, newest first, each with its download page link (to send a buyer by hand). */
export async function GET() {
  const { error } = await apiUser(OPS);
  if (error) return error;
  try {
    const orders = await listOrders();
    return NextResponse.json({ orders: orders.map((o) => ({ ...o, link: orderUrl(o.id) })) });
  } catch (e) {
    return apiError(e);
  }
}

/** POST { orderId } → email the buyer their download link again. */
export async function POST(req: Request) {
  const { error } = await apiEditor(LEADERSHIP);
  if (error) return error;
  try {
    if (!mailReady()) return NextResponse.json({ error: "Email is not connected (RESEND_API_KEY). Copy the order's download link and send it on WhatsApp instead." }, { status: 503 });
    const body = await req.json();
    const order = await readOrder(String(body?.orderId ?? ""));
    if (!order) return NextResponse.json({ error: "No such order." }, { status: 404 });
    await emailReceipt(order, undefined, { resend: true });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}
