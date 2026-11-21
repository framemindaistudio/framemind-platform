import { getRecord } from "@/lib/hq/records";
import { store } from "@/lib/store";

/** A team member's profile photo for the website, served only while HQ has them marked "Show on the website". */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  try {
    const m = await getRecord("team", id);
    if (!m || m.showOnWebsite !== true || m.status === "inactive" || !m.photo) return new Response("Not found", { status: 404 });
    const buf = await store.readBinary(String(m.photo));
    if (!buf) return new Response("Not found", { status: 404 });
    return new Response(new Uint8Array(buf), {
      headers: { "Content-Type": "image/jpeg", "Cache-Control": "public, max-age=86400, s-maxage=86400" },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
