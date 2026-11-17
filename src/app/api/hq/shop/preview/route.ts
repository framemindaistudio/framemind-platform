import { NextResponse } from "next/server";
import { apiUser } from "@/lib/hq/auth";
import { apiError } from "@/lib/hq/api";
import { OPS } from "@/lib/hq/roles";
import { downloadUrl } from "@/lib/shop/links";
import { ID_RE } from "@/lib/shop/logic";

/**
 * POST { productId, fileIndex } → a signed download link for that file, so the team can check exactly what buyers
 * receive (through the same route buyers use). The link carries a marker order id and expires like any other.
 */
export async function POST(req: Request) {
  const { error } = await apiUser(OPS);
  if (error) return error;
  try {
    const body = await req.json();
    const productId = String(body?.productId ?? "");
    const fileIndex = Number(body?.fileIndex ?? 0);
    if (!ID_RE.test(productId) || !Number.isInteger(fileIndex) || fileIndex < 0 || fileIndex > 999) return NextResponse.json({ error: "Bad request" }, { status: 400 });
    return NextResponse.json({ url: downloadUrl("order_hqpreview", productId, fileIndex) });
  } catch (e) {
    return apiError(e);
  }
}
