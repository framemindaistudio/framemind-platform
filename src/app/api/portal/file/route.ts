import { NextResponse } from "next/server";
import { apiError } from "@/lib/hq/api";
import { store } from "@/lib/store";
import { portalApiUser } from "@/lib/portal/auth";
import { clientFolder } from "@/lib/portal/data";

const IMAGE: Record<string, string> = { png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp", gif: "image/gif", pdf: "application/pdf" };

/** GET ?path=vault/clients/<project>/... → a file the client uploaded to one of their own projects. */
export async function GET(req: Request) {
  const { user, error } = await portalApiUser();
  if (error) return error;
  const path = new URL(req.url).searchParams.get("path") ?? "";
  const project = user.projectIds.find((id) => path.startsWith(`${clientFolder(id)}/`));
  if (!project || path.includes("..")) return NextResponse.json({ error: "Not found" }, { status: 404 });
  try {
    const buf = await store.readBinary(path);
    if (!buf) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const name = path.split("/").pop() || "file";
    const type = IMAGE[name.split(".").pop()?.toLowerCase() ?? ""];
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        "Content-Type": type ?? "application/octet-stream",
        "Content-Disposition": `${type ? "inline" : "attachment"}; filename="${name.replace(/"/g, "")}"`,
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "sandbox",
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch (e) {
    return apiError(e);
  }
}
