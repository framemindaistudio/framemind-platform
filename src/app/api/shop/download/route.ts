import { NextResponse } from "next/server";
import { store } from "@/lib/store";
import { downloadOk } from "@/lib/shop/links";
import { readCatalog, validOrderId } from "@/lib/shop/store";
import { ID_RE } from "@/lib/shop/logic";

/**
 * GET /api/shop/download?o=&p=&f=&e=&s= → one purchased file. The link is signed and expires (see lib/shop/links.ts);
 * a buyer gets fresh links every time they open their order page.
 */
export async function GET(req: Request) {
  const q = Object.fromEntries(new URL(req.url).searchParams) as Record<string, string>;
  const { o = "", p = "", f = "", e = "", s = "" } = q;
  if (!validOrderId(o) || !ID_RE.test(p) || !/^\d{1,3}$/.test(f)) return new NextResponse("Not found", { status: 404 });
  if (!downloadOk({ o, p, f, e, s })) {
    return new NextResponse("This download link has expired. Open your order page again (the link in your email) for a fresh one.", { status: 410, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  }
  const { catalog } = await readCatalog();
  const file = catalog.products.find((x) => x.id === p)?.files[Number(f)];
  if (!file || !file.path.startsWith(`vault/shop/${p}/`)) return new NextResponse("This file is no longer available. WhatsApp us and we'll send it.", { status: 404 });
  const buf = await store.readBinary(file.path);
  if (!buf) return new NextResponse("This file is missing. WhatsApp us and we'll send it.", { status: 404 });
  const safeName = file.name.replace(/[^\w.\- ()]/g, "_");
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="${safeName}"; filename*=UTF-8''${encodeURIComponent(file.name)}`,
      "Content-Length": String(buf.length),
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}
