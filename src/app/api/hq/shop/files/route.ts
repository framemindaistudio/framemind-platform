import { NextResponse } from "next/server";
import { apiEditor } from "@/lib/hq/auth";
import { apiError } from "@/lib/hq/api";
import { LEADERSHIP } from "@/lib/hq/roles";
import { store } from "@/lib/store";
import { productFolder, readCatalog, writeCatalog } from "@/lib/shop/store";
import type { ShopFile } from "@/lib/shop/types";
import { refreshShop } from "@/site/shop";

/** Vercel refuses request bodies over 4.5 MB, so uploads through HQ stop a little below that. */
const MAX_UPLOAD = 4 * 1024 * 1024;

function cleanName(name: string) {
  const base = name.split(/[\\/]/).pop() || "file";
  return base.replace(/[^\w.\- ()]/g, "_").replace(/^[. ]+|[. ]+$/g, "").slice(0, 120) || "file";
}

async function setFiles(productId: string, files: (current: ShopFile[]) => ShopFile[], author: string) {
  const { catalog, sha } = await readCatalog();
  const product = catalog.products.find((p) => p.id === productId);
  if (!product) throw new Error("No product with that id. Save the product first.");
  product.files = files(product.files);
  // a product with no files left cannot stay live
  if (!product.files.length && !product.bundleOf?.length && product.status === "live") product.status = "soon";
  const saved = await writeCatalog(catalog, author, sha);
  refreshShop();
  const fresh = await readCatalog();
  return { catalog: saved, sha: fresh.sha };
}

/**
 * POST multipart { productId, file } → stores the file in vault/shop/<productId>/ and adds it to the product.
 * POST json { productId, sync: true } → lists that folder and makes it the product's file list (for big files
 * added straight to the data repository, which is how files over 4 MB get in).
 */
export async function POST(req: Request) {
  const { user, error } = await apiEditor(LEADERSHIP);
  if (error) return error;
  try {
    if ((req.headers.get("content-type") || "").includes("application/json")) {
      const body = await req.json();
      const productId = String(body?.productId ?? "");
      const folder = productFolder(productId);
      const entries = (await store.list(folder)).filter((e) => e.type === "file");
      const found: ShopFile[] = entries.map((e) => ({ name: e.name, path: e.path, size: e.size ?? 0 })).sort((a, b) => a.name.localeCompare(b.name));
      return NextResponse.json(await setFiles(productId, () => found, user.name));
    }
    const form = await req.formData();
    const productId = String(form.get("productId") ?? "");
    const file = form.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "No file was sent." }, { status: 400 });
    if (file.size > MAX_UPLOAD) {
      return NextResponse.json({ error: `This file is ${(file.size / 1048576).toFixed(1)} MB. Files over 4 MB go straight into the data repository at vault/shop/${productId}/, then press "Find files in folder".` }, { status: 413 });
    }
    const name = cleanName(file.name);
    const path = `${productFolder(productId)}/${name}`;
    await store.write(path, Buffer.from(await file.arrayBuffer()), `Digital Store: file ${name} for ${productId}`, { author: user.name });
    const entry: ShopFile = { name, path, size: file.size };
    return NextResponse.json(await setFiles(productId, (cur) => [...cur.filter((f) => f.path !== path), entry], user.name));
  } catch (e) {
    return apiError(e);
  }
}

/** DELETE { productId, path } → removes the file from the product and from the data repository. */
export async function DELETE(req: Request) {
  const { user, error } = await apiEditor(LEADERSHIP);
  if (error) return error;
  try {
    const body = await req.json();
    const productId = String(body?.productId ?? "");
    const path = String(body?.path ?? "");
    if (!path.startsWith(`${productFolder(productId)}/`)) return NextResponse.json({ error: "That file is not in this product's folder." }, { status: 400 });
    const result = await setFiles(productId, (cur) => cur.filter((f) => f.path !== path), user.name);
    await store.remove(path, `Digital Store: removed ${path.split("/").pop()}`, { author: user.name });
    return NextResponse.json(result);
  } catch (e) {
    return apiError(e);
  }
}
