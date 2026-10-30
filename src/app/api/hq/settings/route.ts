import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { SETTINGS_TAG } from "@/site/rates";
import { apiEditor, apiUser } from "@/lib/hq/auth";
import { apiError } from "@/lib/hq/api";
import { readSettings, writeSettings } from "@/lib/hq/records";
import { ALL, LEADERSHIP } from "@/lib/hq/roles";
import { settingsFor } from "@/lib/hq/access";

export async function GET() {
  const { user, error } = await apiUser(ALL);
  if (error) return error;
  try {
    const { settings } = await readSettings();
    // tax, bank, numbering and targets go only to the roles that see Finance; others get the printed company profile
    return NextResponse.json({ settings: settingsFor(user.role, settings) });
  } catch (e) {
    return apiError(e);
  }
}

export async function PUT(req: Request) {
  const { user, error } = await apiEditor(LEADERSHIP);
  if (error) return error;
  try {
    const body = await req.json();
    const settings = await writeSettings(body.settings || {}, user.name);
    // the website shows prices "+ GST" or not from these settings
    revalidateTag(SETTINGS_TAG, { expire: 0 });
    revalidatePath("/pricing");
    return NextResponse.json({ settings });
  } catch (e) {
    return apiError(e);
  }
}
