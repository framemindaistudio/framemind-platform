import { NextResponse } from "next/server";
import { apiEditor } from "@/lib/hq/auth";
import { apiError } from "@/lib/hq/api";
import { getRecord, upsertRecord } from "@/lib/hq/records";
import { LEADERSHIP } from "@/lib/hq/roles";
import { store } from "@/lib/store";

/**
 * A team member's profile photo, for ID cards and (when they agree) the About page. Founders and admins only.
 * PUT { id, image }  → a JPEG data: address (cropped and resized in the browser), 600 KB at most,
 *                      kept at vault/team-photos/<id>.jpg and set on the member's record
 * DELETE ?id=        → removes it
 */
const MAX = 600 * 1024;
const pathOf = (id: string) => `vault/team-photos/${id.replace(/[^\w-]/g, "")}.jpg`;

export async function PUT(req: Request) {
  const { user, error } = await apiEditor(LEADERSHIP);
  if (error) return error;
  try {
    const body = (await req.json()) as { id?: unknown; image?: unknown };
    const member = await getRecord("team", String(body.id ?? ""));
    if (!member) return NextResponse.json({ error: "That team member was not found." }, { status: 404 });
    const m = /^data:image\/jpeg;base64,([A-Za-z0-9+/=]+)$/.exec(String(body.image ?? ""));
    const buf = m ? Buffer.from(m[1], "base64") : null;
    if (!buf || !(buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff)) return NextResponse.json({ error: "The photo must be a JPEG picture." }, { status: 400 });
    if (buf.length > MAX) return NextResponse.json({ error: "That photo is too large. Try a smaller one." }, { status: 413 });
    const path = pathOf(member.id);
    await store.write(path, buf, `Profile photo for ${String(member.name ?? member.id)}`, { author: user.name });
    const saved = await upsertRecord("team", { ...member, photo: path, photoUpdatedAt: new Date().toISOString() }, user.name);
    return NextResponse.json({ member: saved });
  } catch (e) {
    return apiError(e);
  }
}

export async function DELETE(req: Request) {
  const { user, error } = await apiEditor(LEADERSHIP);
  if (error) return error;
  try {
    const member = await getRecord("team", new URL(req.url).searchParams.get("id") ?? "");
    if (!member) return NextResponse.json({ error: "That team member was not found." }, { status: 404 });
    if (member.photo) await store.remove(String(member.photo), `Remove the profile photo of ${String(member.name ?? member.id)}`, { author: user.name }).catch(() => undefined);
    const saved = await upsertRecord("team", { ...member, photo: "", photoUpdatedAt: new Date().toISOString() }, user.name);
    return NextResponse.json({ member: saved });
  } catch (e) {
    return apiError(e);
  }
}
