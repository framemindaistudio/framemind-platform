import { NextResponse } from "next/server";
import { apiEditor, apiUser } from "@/lib/hq/auth";
import { apiError } from "@/lib/hq/api";
import { readInks } from "@/lib/hq/signatures";
import { LEADERSHIP } from "@/lib/hq/roles";
import { FOUNDERS } from "@/lib/sign/context";
import { inkPath, MAX_INK_BYTES } from "@/lib/sign/ink";
import { store } from "@/lib/store";

/**
 * The founders' saved signatures. Founders and admins only.
 * GET                         → { founders: [{ id, name, title, ink? (data: address) }] }
 * PUT { id, image }           → saves a founder's signature (a PNG data: address, 400 KB at most)
 * DELETE ?id=                 → removes it
 */
export async function GET() {
  const { error } = await apiUser(LEADERSHIP);
  if (error) return error;
  try {
    const inks = await readInks();
    return NextResponse.json({ founders: FOUNDERS.map((f) => ({ id: f.id, name: f.name, title: f.title, ink: inks[f.name] ?? null })) });
  } catch (e) {
    return apiError(e);
  }
}

export async function PUT(req: Request) {
  const { user, error } = await apiEditor(LEADERSHIP);
  if (error) return error;
  try {
    const body = (await req.json()) as { id?: unknown; image?: unknown };
    const founder = FOUNDERS.find((f) => f.id === body.id);
    if (!founder) return NextResponse.json({ error: "Unknown founder" }, { status: 400 });
    const m = /^data:image\/png;base64,([A-Za-z0-9+/=]+)$/.exec(String(body.image ?? ""));
    if (!m) return NextResponse.json({ error: "The signature must be a PNG picture." }, { status: 400 });
    const buf = Buffer.from(m[1], "base64");
    if (!buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return NextResponse.json({ error: "The signature must be a PNG picture." }, { status: 400 });
    if (buf.length > MAX_INK_BYTES) return NextResponse.json({ error: "That picture is too large. Try again with a smaller photo." }, { status: 413 });
    await store.write(inkPath(founder.id), buf, `Save the signature of ${founder.name}`, { author: user.name });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}

export async function DELETE(req: Request) {
  const { user, error } = await apiEditor(LEADERSHIP);
  if (error) return error;
  const founder = FOUNDERS.find((f) => f.id === new URL(req.url).searchParams.get("id"));
  if (!founder) return NextResponse.json({ error: "Unknown founder" }, { status: 400 });
  try {
    await store.remove(inkPath(founder.id), `Remove the signature of ${founder.name}`, { author: user.name });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}
