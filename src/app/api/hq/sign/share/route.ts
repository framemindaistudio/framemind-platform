import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { apiEditor, apiUser } from "@/lib/hq/auth";
import { apiError, rateLimit } from "@/lib/hq/api";
import { isEmail, mailFrom, mailReady, sendMail, testSender } from "@/lib/hq/mail";
import { paperUrl, renderPaperMail } from "@/lib/hq/paper-mail";
import { getRecord, readSettings, upsertRecord } from "@/lib/hq/records";
import { indiaToday } from "@/lib/hq/reminders";
import { LEADERSHIP } from "@/lib/hq/roles";
import { templateById } from "@/lib/sign/catalog";
import { companyOf, type SignDoc } from "@/lib/sign/context";
import { expiryFor, linkLive, newToken, shareOf, type Share } from "@/lib/sign/share";
import { site } from "@/lib/site";
import { readInks } from "@/lib/hq/signatures";
import { withInkTick } from "@/lib/sign/ink";

/**
 * Sending a paper from Documents to Sign. Founders only (papers carry pay and agreed terms).
 * GET                              → whether email can go out, and from which address
 * POST { id, action: "link" }      → the paper's private link (made if needed); the paper is locked as issued
 *      { id, action: "whatsapp" }  → the same, noted as sent on WhatsApp
 *      { id, action: "email", to? }→ emails the link (to the address on the paper unless `to` is given)
 *      { id, action: "stop" }      → switches the link off
 *      { id, action: "remind", on }→ reminders by email on or off
 */
export async function GET() {
  const { error } = await apiUser(LEADERSHIP);
  if (error) return error;
  return NextResponse.json({ mail: mailReady(), from: mailFrom(), testSender: testSender() });
}

export async function POST(req: Request) {
  const { user, error } = await apiEditor(LEADERSHIP);
  if (error) return error;
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const id = typeof body.id === "string" ? body.id : "";
  const action = String(body.action ?? "");
  try {
    const doc = await getRecord<SignDoc>("signDocs", id);
    if (!doc) return NextResponse.json({ error: "That paper was not found." }, { status: 404 });
    const template = templateById(doc.template);
    if (!template) return NextResponse.json({ error: "That paper's template is not known." }, { status: 400 });
    if (doc.status === "void") return NextResponse.json({ error: "This paper is withdrawn. Bring it back as a draft first." }, { status: 400 });

    const today = indiaToday();
    const { settings } = await readSettings();
    const company = companyOf(settings);
    let share: Share | null = shareOf(doc);
    let next: SignDoc = { ...doc };

    if (action === "stop") {
      if (share) next.share = { ...share, stopped: true };
      const saved = await upsertRecord<SignDoc>("signDocs", next, user.name);
      return NextResponse.json({ doc: saved });
    }
    if (action === "remind") {
      if (!share) return NextResponse.json({ error: "Send the paper first." }, { status: 400 });
      next.share = { ...share, remind: body.on === true };
      const saved = await upsertRecord<SignDoc>("signDocs", next, user.name);
      return NextResponse.json({ doc: saved });
    }
    if (!["link", "whatsapp", "email"].includes(action)) return NextResponse.json({ error: "Unknown action" }, { status: 400 });

    // sending locks the wording, as printing does, so HQ keeps exactly what went out
    // sending with the saved signatures on it counts as the studio's signature, the day it goes out
    if (next.status !== "issued") next = withInkTick({ ...next, status: "issued", issuedOn: next.issuedOn || today, company }, template, await readInks(), today);
    // a link that was switched off or has run out is replaced by a new one
    if (!share || !linkLive(next, today)) share = { token: newToken(randomBytes(24)), createdOn: today, expiresOn: expiryFor(today, next.dueBy), via: [], remind: true, reminders: [] };
    const url = paperUrl(share.token);

    if (action === "email") {
      if (!rateLimit(`paper-mail:${user.username}`, 20, 10 * 60 * 1000)) return NextResponse.json({ error: "That is a lot of emails in a few minutes. Please wait a little." }, { status: 429 });
      if (!mailReady()) return NextResponse.json({ error: "Email is not connected yet. Set up Resend (see Settings → Morning email), or send the link on WhatsApp." }, { status: 400 });
      const to = String(body.to ?? next.party?.email ?? "").trim().toLowerCase();
      if (!isEmail(to)) return NextResponse.json({ error: "Add a valid email address for them on the paper first." }, { status: 400 });
      const replyTo = settings.email || site.contact.email;
      const mail = renderPaperMail(next, template, { url, replyTo, company: next.company ?? company });
      await sendMail({ to: [to], ...mail, replyTo });
      share = { ...share, sentTo: to, sentOn: today, via: [...new Set([...share.via, "email" as const])] };
    } else {
      share = { ...share, via: [...new Set([...share.via, action === "whatsapp" ? ("whatsapp" as const) : ("link" as const)])] };
    }
    next.share = share;
    const saved = await upsertRecord<SignDoc>("signDocs", next, user.name);
    return NextResponse.json({ doc: saved, url });
  } catch (e) {
    return apiError(e);
  }
}
