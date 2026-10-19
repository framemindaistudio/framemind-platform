import { NextResponse } from "next/server";
import { apiUser } from "@/lib/hq/auth";
import { canReadPath } from "@/lib/hq/access";
import { apiError } from "@/lib/hq/api";
import { store } from "@/lib/store";
import { ALL } from "@/lib/hq/roles";

const TYPES: Record<string, string> = {
  pdf: "application/pdf",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  svg: "image/svg+xml",
  gif: "image/gif",
  md: "text/markdown; charset=utf-8",
  txt: "text/plain; charset=utf-8",
  csv: "text/csv; charset=utf-8",
  json: "application/json; charset=utf-8",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  zip: "application/zip",
  mp4: "video/mp4",
};

/** GET ?path=OPERATIONS/01_BRAND/logo/x.png[&download=1] → file bytes */
export async function GET(req: Request) {
  const { user, error } = await apiUser(ALL);
  if (error) return error;
  const url = new URL(req.url);
  const path = url.searchParams.get("path");
  if (!path) return NextResponse.json({ error: "Missing path" }, { status: 400 });
  if (!canReadPath(user.role, path)) return NextResponse.json({ error: "You don't have access to this" }, { status: 403 });
  try {
    const buf = await store.readBinary(path);
    if (!buf) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const name = path.split("/").pop() || "file";
    const ext = name.split(".").pop()?.toLowerCase() || "";
    const headers: Record<string, string> = {
      "Content-Type": TYPES[ext] || "application/octet-stream",
      "Cache-Control": "private, no-store",
    };
    if (url.searchParams.get("download")) headers["Content-Disposition"] = `attachment; filename="${encodeURIComponent(name)}"`;
    return new NextResponse(new Uint8Array(buf), { headers });
  } catch (e) {
    return apiError(e);
  }
}
