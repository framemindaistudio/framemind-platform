import { NextResponse } from "next/server";
import { apiUser } from "@/lib/hq/auth";
import { apiError } from "@/lib/hq/api";
import { MEDIA_SIDE } from "@/lib/hq/roles";
import { store } from "@/lib/store";

const OK = /^[a-z0-9-]{3,60}\/[a-z0-9-]{3,30}(\.thumb)?\.jpg$/;

/** GET ?p=<product>/<image>.jpg → one kit image from the private data repo, streamed. Team only. */
export async function GET(req: Request) {
  const { error } = await apiUser(MEDIA_SIDE);
  if (error) return error;
  try {
    const p = new URL(req.url).searchParams.get("p") ?? "";
    if (!OK.test(p)) return NextResponse.json({ error: "Bad request" }, { status: 400 });
    const s = await store.readStream(`vault/social/store-kit/${p}`);
    if (!s) return new NextResponse("Not found", { status: 404 });
    return new NextResponse(s.body, {
      headers: { "Content-Type": "image/jpeg", ...(s.size ? { "Content-Length": String(s.size) } : {}), "Cache-Control": "private, max-age=86400", "X-Robots-Tag": "noindex" },
    });
  } catch (e) {
    return apiError(e);
  }
}
