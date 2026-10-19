import { revalidatePath, revalidateTag } from "next/cache";
import { RATECARD_TAG } from "@/site/rates";
import { NextResponse } from "next/server";
import { apiEditor, apiUser } from "@/lib/hq/auth";
import { apiError } from "@/lib/hq/api";
import { readPriceBook, writePriceBook } from "@/lib/hq/pricebook";
import { LEADERSHIP, OPS } from "@/lib/hq/roles";
import { storeMode } from "@/lib/store";

/** GET → the whole rate card (rates and planning), for the roles that see Finance. */
export async function GET() {
  const { error } = await apiUser(OPS);
  if (error) return error;
  try {
    const { book, exists } = await readPriceBook();
    return NextResponse.json({ book, exists, storeMode: storeMode() });
  } catch (e) {
    return apiError(e);
  }
}

/** PUT { book } → check and save it. New quotes use the new prices at once; quotes already made keep theirs. */
export async function PUT(req: Request) {
  const { user, error } = await apiEditor(LEADERSHIP);
  if (error) return error;
  try {
    const body = await req.json();
    const book = await writePriceBook(body?.book, user.name);
    // the public website shows these prices: the next visitor gets the new ones (no stale copy is served)
    revalidateTag(RATECARD_TAG, { expire: 0 });
    revalidatePath("/pricing");
    revalidatePath("/vritta");
    return NextResponse.json({ book, exists: true, storeMode: storeMode() });
  } catch (e) {
    return apiError(e);
  }
}
