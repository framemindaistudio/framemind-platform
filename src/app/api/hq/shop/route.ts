import { NextResponse } from "next/server";
import { apiEditor, apiUser } from "@/lib/hq/auth";
import { apiError } from "@/lib/hq/api";
import { LEADERSHIP, OPS } from "@/lib/hq/roles";
import { mailReady, testSender } from "@/lib/hq/mail";
import { storeMode } from "@/lib/store";
import { readCatalog, writeCatalog } from "@/lib/shop/store";
import { payMode } from "@/lib/shop/razorpay";
import { refreshShop } from "@/site/shop";

/** GET → the catalogue (with file paths and coupons) and whether payments and email are set up. */
export async function GET() {
  const { error } = await apiUser(OPS);
  if (error) return error;
  try {
    const { catalog, sha, saved } = await readCatalog();
    return NextResponse.json({ catalog, sha, saved, payMode: payMode(), mail: mailReady(), testSender: testSender(), storeMode: storeMode() });
  } catch (e) {
    return apiError(e);
  }
}

/** PUT { catalog, sha } → check and save it; the website updates at once. */
export async function PUT(req: Request) {
  const { user, error } = await apiEditor(LEADERSHIP);
  if (error) return error;
  try {
    const body = await req.json();
    const catalog = await writeCatalog(body?.catalog, user.name, body?.sha || undefined);
    refreshShop();
    const fresh = await readCatalog();
    return NextResponse.json({ catalog, sha: fresh.sha, saved: true });
  } catch (e) {
    return apiError(e);
  }
}
