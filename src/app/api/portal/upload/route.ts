import { NextResponse } from "next/server";
import { apiError, rateLimit } from "@/lib/hq/api";
import { store } from "@/lib/store";
import { ownProject, portalApiUser } from "@/lib/portal/auth";
import { clientFolder } from "@/lib/portal/data";

/**
 * POST multipart { file, project } → a client's logo, reference image or document, stored privately at
 * vault/clients/<project>/<date>_<name>. Up to 4 MB. SVG and HTML are refused: a file a client sends must never
 * be able to run code when someone at the studio opens it.
 */
const MAX = 4 * 1024 * 1024;
const ALLOWED = /\.(png|jpe?g|webp|gif|pdf|zip|ai|eps|psd|docx?|xlsx?|pptx?|txt|ttf|otf|woff2?)$/i;

export async function POST(req: Request) {
  const { user, error } = await portalApiUser();
  if (error) return error;
  if (!rateLimit(`portal-upload:${user.email}`, 40, 10 * 60 * 1000)) return NextResponse.json({ error: "Too many uploads — try again in a few minutes." }, { status: 429 });
  try {
    const form = await req.formData();
    const project = ownProject(user, String(form.get("project") ?? ""));
    if (!project) return NextResponse.json({ error: "Project not found." }, { status: 404 });
    const file = form.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "No file" }, { status: 400 });
    if (file.size > MAX) return NextResponse.json({ error: "That file is larger than 4 MB. Share a Google Drive or WeTransfer link in the form instead." }, { status: 413 });
    if (!ALLOWED.test(file.name)) return NextResponse.json({ error: "That file type isn't accepted. Use PNG, JPG, PDF, ZIP or an Office / design file (for a logo, send PNG or PDF)." }, { status: 415 });
    const safe = file.name.replace(/[^\w.\- ]/g, "_").replace(/\s+/g, "_").slice(-90);
    const path = `${clientFolder(project)}/${new Date().toISOString().slice(0, 10)}_${Date.now().toString(36)}_${safe}`;
    await store.write(path, Buffer.from(await file.arrayBuffer()), `Client upload: ${safe}`, { author: `${user.name} (client)` });
    return NextResponse.json({ ok: true, path });
  } catch (e) {
    return apiError(e);
  }
}
