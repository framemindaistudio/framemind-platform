import { NextResponse } from "next/server";
import { apiUser } from "@/lib/hq/auth";
import { storeInfoChecked } from "@/lib/store";
import { storeForUser } from "@/lib/hq/access";

export async function GET() {
  const { user, error } = await apiUser();
  if (error) return error;
  return NextResponse.json({ user, store: storeForUser(await storeInfoChecked(), user) });
}
