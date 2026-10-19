import { NextResponse } from "next/server";
import { apiUser } from "@/lib/hq/auth";
import { canReadHistory } from "@/lib/hq/access";
import { apiError } from "@/lib/hq/api";
import { store } from "@/lib/store";
import { ALL } from "@/lib/hq/roles";

/** GET ?path=OPERATIONS/x.md&limit=20 → commits touching that path (or all commits) */
export async function GET(req: Request) {
  const { user, error } = await apiUser(ALL);
  if (error) return error;
  const url = new URL(req.url);
  const path = url.searchParams.get("path") || undefined;
  // The whole log names every invoice, payslip and upload, so it is for leadership; others get one document's history.
  if (!canReadHistory(user.role, path)) return NextResponse.json({ error: "You don't have access to this" }, { status: 403 });
  const ref = url.searchParams.get("ref");
  const limit = Math.min(100, Number(url.searchParams.get("limit")) || 30);
  try {
    if (path && ref) {
      const content = await store.readAt(path, ref);
      return NextResponse.json({ content });
    }
    const commits = await store.history(path, limit);
    return NextResponse.json({ commits, mode: store.mode() });
  } catch (e) {
    return apiError(e);
  }
}
