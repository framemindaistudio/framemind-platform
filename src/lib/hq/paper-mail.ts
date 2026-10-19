/**
 * Documents to Sign by email: the email that sends a paper's private link, and the reminders for unsigned papers.
 * Reminders go out with the morning run (src/app/api/cron/digest).
 */
import "server-only";
import { templateById } from "@/lib/sign/catalog";
import { companyOf, contextOf, type SignDoc } from "@/lib/sign/context";
import { MAX_REMINDERS, reminderDue, shareOf } from "@/lib/sign/share";
import { plainDate } from "@/lib/sign/text";
import type { SignTemplate } from "@/lib/sign/types";
import { site } from "@/lib/site";
import { esc, mailReady, sendMail } from "./mail";
import { listRecords, readSettings, upsertRecord } from "./records";

export const paperUrl = (token: string) => `${site.url.replace(/\/+$/, "")}/papers/${token}`;

/** The email for a paper: its own cover letter, the link, and how to return it signed. */
export function renderPaperMail(doc: SignDoc, template: SignTemplate, o: { url: string; reminder?: number; replyTo?: string; company: ReturnType<typeof companyOf> }) {
  const ctx = contextOf(doc, o.company);
  const cover = (template.cover?.(ctx) ?? "").trim();
  const signer = (doc.signatories ?? [])[0];
  const due = doc.dueBy ? plainDate(doc.dueBy) : "";
  const name = template.name;
  const subject = o.reminder ? `Reminder: ${name} to sign${due ? `, due ${due}` : ""}` : `${name} from FrameMind, to sign`;
  const opening = o.reminder ? `A gentle reminder: the ${name.toLowerCase()} we sent is still waiting for your signature${due ? `, and it is due back on ${due}` : ""}.` : "";
  const steps = [
    "Open the paper with the button below and print it on A4 (or save it as a PDF).",
    template.initials ? "Sign the last page and initial every page." : "Sign where your name is printed.",
    `Send it back${due ? ` by ${due}` : ""}: upload the signed copy on the same page (a PDF, or a photo of every page), reply to this email with it, or hand it to us.`,
  ];
  const paras = [opening, ...cover.split(/\n{2,}/)].filter(Boolean);

  const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${esc(subject)}</title></head>
<body style="margin:0;padding:0;background:#f5f4f0">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f4f0"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fbf9f4;border:1px solid #e0d8c6">
  <tr><td style="background:#0d0d0d;padding:18px 24px;font:600 11px/1.4 Menlo,Consolas,monospace;letter-spacing:.16em;text-transform:uppercase;color:#f5f4f0">FrameMind · ${esc(doc.ref || "Document to sign")}</td></tr>
  <tr><td style="padding:24px 24px 6px;font:700 22px/1.25 Arial,Helvetica,sans-serif;color:#161616">${esc(name)}</td></tr>
  <tr><td style="padding:0 24px">${paras.map((p) => `<p style="font:15px/1.6 Arial,Helvetica,sans-serif;color:#0d0d0d;margin:12px 0">${esc(p).replace(/\n/g, "<br>")}</p>`).join("")}</td></tr>
  <tr><td style="padding:12px 24px 4px"><a href="${esc(o.url)}" style="display:inline-block;background:#0d0d0d;color:#f5f4f0;font:600 15px/1 Arial,Helvetica,sans-serif;padding:14px 20px;text-decoration:none">Open the paper</a></td></tr>
  <tr><td style="padding:18px 24px 6px;font:600 11px/1.4 Menlo,Consolas,monospace;letter-spacing:.14em;text-transform:uppercase;color:#7a7a7a">How to sign it</td></tr>
  <tr><td style="padding:0 24px"><ol style="margin:0;padding-left:20px;font:14px/1.6 Arial,Helvetica,sans-serif;color:#0d0d0d">${steps.map((s) => `<li style="margin:4px 0">${esc(s)}</li>`).join("")}</ol></td></tr>
  <tr><td style="padding:18px 24px 24px;font:13px/1.5 Arial,Helvetica,sans-serif;color:#4a4a4a">${signer ? `${esc(signer.name)}${signer.title ? `, ${esc(signer.title)}` : ""}<br>` : ""}FrameMind · Journey of Visionation &amp; Excellence${o.replyTo ? `<br>${esc(o.replyTo)}` : ""}
    <div style="font:12px/1.5 Arial,Helvetica,sans-serif;color:#7a7a7a;margin-top:14px">This link is for you alone; please do not forward it. If the button does not work, copy this address into your browser: ${esc(o.url)}</div></td></tr>
</table></td></tr></table></body></html>`;

  const text = [
    ...paras,
    "",
    `Open the paper: ${o.url}`,
    "",
    "How to sign it:",
    ...steps.map((s, i) => `${i + 1}. ${s}`),
    "",
    signer ? `${signer.name}${signer.title ? `, ${signer.title}` : ""}` : "",
    "FrameMind AI Studio",
    o.replyTo ?? "",
  ]
    .filter((l, i, a) => l || a[i - 1])
    .join("\n");

  return { subject, html, text };
}

/** The morning run: one reminder to each person whose emailed paper is still unsigned, by the rules in share.ts. */
export async function sendPaperReminders(today: string) {
  if (!mailReady()) return { sent: 0, skipped: "The email service is not connected." };
  const [docs, { settings }] = await Promise.all([listRecords<SignDoc>("signDocs"), readSettings()]);
  const company = companyOf(settings);
  const replyTo = settings.email || site.contact.email;
  let sent = 0;
  const failed: string[] = [];
  for (const doc of docs) {
    const template = templateById(doc.template);
    if (!template || !reminderDue(doc, template, today)) continue;
    const share = shareOf(doc)!;
    const n = share.reminders.length + 1;
    try {
      const mail = renderPaperMail(doc, template, { url: paperUrl(share.token), reminder: n, replyTo, company: doc.company ?? company });
      await sendMail({ to: [share.sentTo!], ...mail, replyTo, once: `paper-${doc.id}-${today}` });
      await upsertRecord("signDocs", { ...doc, share: { ...share, reminders: [...share.reminders, today] } }, "FrameMind HQ (reminder)");
      sent += 1;
    } catch (e) {
      failed.push(`${doc.ref || doc.id}: ${e instanceof Error ? e.message : "failed"}`);
    }
  }
  return { sent, failed, max: MAX_REMINDERS };
}
