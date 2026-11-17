import { NextResponse } from "next/server";
import { apiUser } from "@/lib/hq/auth";
import { apiError } from "@/lib/hq/api";
import { MEDIA_SIDE } from "@/lib/hq/roles";
import { store } from "@/lib/store";

/** GET → the store's Instagram kit (data/social/store-kit.json): captions, Reel scripts, DM replies and the launch schedule. */
export async function GET() {
  const { error } = await apiUser(MEDIA_SIDE);
  if (error) return error;
  try {
    const f = await store.read("data/social/store-kit.json");
    return NextResponse.json(f ? JSON.parse(f.content) : { products: [], schedule: [] });
  } catch (e) {
    return apiError(e);
  }
}
