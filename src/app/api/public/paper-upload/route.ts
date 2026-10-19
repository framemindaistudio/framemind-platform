import { NextResponse } from "next/server";
import { clientIp, rateLimit } from "@/lib/hq/api";
import { listRecords, upsertRecord } from "@/lib/hq/records";
import { indiaToday } from "@/lib/hq/reminders";
import { store } from "@/lib/store";
import type { SignDoc } from "@/lib/sign/context";
import { linkLive, MAX_UPLOAD_BYTES, MAX_UPLOADS, receivedOf, shareOf } from "@/lib/sign/share";

/**
 * POST multipart { token, file }: a signed copy uploaded from a paper's private link (/papers/<token>).
 * The file goes to the File Vault's founders-only folder (vault/signed/…) and is listed on the paper as received;
 * a founder checks it and marks the paper signed. Nothing is ticked automatically.
 * Only PDFs and photos, checked by their first bytes; 4 MB each, 12 per paper; never once it is signed.
 */
const KINDS: { ext: string; test: (b: Buffer) => boolean }[] = [
  { ext: "pdf", test: (b) => b.subarray(0, 5).toString("latin1") === "%PDF-" },
  { ext: "jpg", test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { ext: "png", test: (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  { ext: "webp", test: (b) => b.subarray(0, 4).toString("latin1") === "RIFF" && b.subarray(8, 12).toString("latin1") === "WEBP" },
  { ext: "heic", test: (b) => b.subarray(4, 8).toString("latin1") === "ftyp" && /^(heic|heix|hevc|mif1|msf1)$/.test(b.subarray(8, 12).toString("latin1")) },
];

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "paper";

export async function POST(req: Request) {
  const ip = clientIp(req);
  if (!rateLimit(`paper-upload:${ip}`, 30, 60 * 60 * 1000)) return NextResponse.json({ error: "Too many uploads in a short while. Please try again in an hour." }, { status: 429 });
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "The file did not arrive. It may be larger than 4 MB." }, { status: 400 });
  }
  const token = String(form.get("token") ?? "");
  const file = form.get("file");
  if (!/^[\w-]{24,64}$/.test(token)) return NextResponse.json({ error: "This link does not work." }, { status: 404 });
  if (!(file instanceof File) || !file.size) return NextResponse.json({ error: "Choose a file first." }, { status: 400 });
  if (file.size > MAX_UPLOAD_BYTES) return NextResponse.json({ error: "That file is larger than 4 MB. Take the photo at a lower quality, or send each page separately." }, { status: 413 });
  if (!rateLimit(`paper-upload-token:${token}`, MAX_UPLOADS * 2, 24 * 60 * 60 * 1000)) return NextResponse.json({ error: "That is the most files this paper can take in a day." }, { status: 429 });

  try {
    const today = indiaToday();
    const doc = (await listRecords<SignDoc>("signDocs")).find((d) => shareOf(d)?.token === token);
    if (!doc || !linkLive(doc, today)) return NextResponse.json({ error: "This link has ended. Ask FrameMind to send it again." }, { status: 410 });
    if (doc.partySigned === true) return NextResponse.json({ error: "FrameMind already has this paper signed. Thank you." }, { status: 409 });
    const received = receivedOf(doc);
    if (received.length >= MAX_UPLOADS) return NextResponse.json({ error: `This paper already has ${MAX_UPLOADS} files. Send anything more to FrameMind directly.` }, { status: 409 });

    const buf = Buffer.from(await file.arrayBuffer());
    const kind = KINDS.find((k) => k.test(buf));
    if (!kind) return NextResponse.json({ error: "Only a PDF or a photo (JPG, PNG, WEBP or HEIC) can be uploaded." }, { status: 415 });

    const n = received.length + 1;
    const path = `vault/signed/${slug(doc.partyName ?? "")}/${today}_${slug(doc.ref ?? doc.id)}_from-link-${String(n).padStart(2, "0")}.${kind.ext}`;
    await store.write(path, buf, `Signed copy received from the link: ${doc.ref ?? doc.id} (${n})`, { author: "FrameMind HQ (signed copy upload)" });
    const name = file.name.replace(/[^\w.\- ]/g, "_").slice(-80) || `file.${kind.ext}`;
    await upsertRecord("signDocs", { ...doc, received: [...received, { path, name, at: new Date().toISOString(), size: buf.length }] }, "FrameMind HQ (signed copy upload)");
    return NextResponse.json({ ok: true, count: n });
  } catch (e) {
    console.error("[paper-upload]", e);
    return NextResponse.json({ error: "The file could not be saved. Please try again, or send it to FrameMind directly." }, { status: 500 });
  }
}
