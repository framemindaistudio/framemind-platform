import { NextResponse } from "next/server";
import { apiUser } from "@/lib/hq/auth";
import { apiError } from "@/lib/hq/api";
import { MEDIA_SIDE } from "@/lib/hq/roles";
import { store } from "@/lib/store";

/** GET ?week=YYYY-MM-DD → the list of weekly trend reports and one report (the latest when no week is given). */
export async function GET(req: Request) {
  const { error } = await apiUser(MEDIA_SIDE);
  if (error) return error;
  try {
    const idx = await store.read("data/social/trends/index.json");
    const index: { latest?: string; weeks: string[] } = idx ? JSON.parse(idx.content) : { weeks: [] };
    const asked = new URL(req.url).searchParams.get("week") ?? "";
    const week = /^\d{4}-\d{2}-\d{2}$/.test(asked) && index.weeks.includes(asked) ? asked : index.latest;
    const f = week ? await store.read(`data/social/trends/${week}.json`) : null;
    return NextResponse.json({ weeks: index.weeks, report: f ? JSON.parse(f.content) : null });
  } catch (e) {
    return apiError(e);
  }
}
