import { NextResponse } from "next/server";
import { apiEditor } from "@/lib/hq/auth";
import { apiError } from "@/lib/hq/api";
import { nextSequence, readSettings, certificateCode } from "@/lib/hq/records";
import { OPS, OPS_STUDIO } from "@/lib/hq/roles";

/** POST { kind: "invoice" | "proposal" | "po" | "order" | "certificate", count? } → { value } or { values } */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const kind = body.kind as string;
  if (kind === "certificate") {
    const { error } = await apiEditor(OPS_STUDIO);
    if (error) return error;
    const { settings } = await readSettings();
    const count = Math.min(2000, Math.max(1, Number(body.count) || 1));
    const set = new Set<string>();
    while (set.size < count) set.add(certificateCode(settings.certificatePrefix));
    return NextResponse.json({ values: [...set], value: [...set][0] });
  }
  if (!["invoice", "proposal", "po", "order"].includes(kind)) return NextResponse.json({ error: "Unknown sequence" }, { status: 400 });
  const { user, error } = await apiEditor(OPS);
  if (error) return error;
  try {
    const value = await nextSequence(kind as "invoice" | "proposal" | "po" | "order", user.name);
    return NextResponse.json({ value });
  } catch (e) {
    return apiError(e);
  }
}
