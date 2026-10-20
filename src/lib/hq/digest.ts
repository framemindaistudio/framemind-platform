/**
 * The morning email: the founders' reminders for the day, sent through Resend (resend.com).
 *
 * Set up (Vercel → Project → Settings → Environment Variables; see scripts/make-digest-env.mjs):
 *   RESEND_API_KEY   the API key from resend.com
 *   CRON_SECRET      a long random value; Vercel sends it with the daily call, so nobody else can trigger it
 *   DIGEST_FROM      optional, e.g. "FrameMind HQ <hq@framemindaistudio.com>" once the domain is verified in Resend;
 *                    until then Resend only delivers mail from onboarding@resend.dev to the account's own address
 * Who receives it is set in HQ → Settings → Morning email. The schedule is in vercel.json.
 */
import "server-only";
import { templateById } from "@/lib/sign/catalog";
import { site } from "@/lib/site";
import { esc, mailFrom, sendMail } from "./mail";
import { listRecords, readSettings } from "./records";
import { AREA_LABEL, AREA_SOURCE, buildReminders, countByLevel, type Reminder, type ReminderData, type ReminderLevel } from "./reminders";


export function digestSetup() {
  return {
    key: !!process.env.RESEND_API_KEY,
    cron: !!process.env.CRON_SECRET,
    from: mailFrom(),
  };
}

/** "a@x.com, b@y.com" → the valid addresses, at most 10. */
export function recipientsOf(list: unknown): string[] {
  return [...new Set(String(list ?? "").split(/[\s,;]+/).map((x) => x.trim().toLowerCase()).filter((x) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(x)))].slice(0, 10);
}

/** Reads every section the reminders come from. A section that cannot be read is left out, never the whole email. */
export async function loadReminders(today: string): Promise<Reminder[]> {
  // learners give the coaching reminders their names
  const names = [...new Set([...Object.values(AREA_SOURCE), "learners", "incentivePolicies"])];
  const data: Record<string, unknown> = {};
  await Promise.all(
    names.map(async (n) => {
      try {
        data[n] = await listRecords(n);
      } catch (e) {
        console.error(`[digest] could not read ${n}:`, e instanceof Error ? e.message : e);
        data[n] = [];
      }
    }),
  );
  return buildReminders(data as ReminderData, today, { signsOf: (id) => templateById(id)?.signs ?? "both" });
}

const LONG = new Intl.DateTimeFormat("en-IN", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });

const HEADS: Record<ReminderLevel, string> = { overdue: "Overdue", today: "For today", soon: "Coming up" };

/** The email, as HTML (simple tables and inline styles, which every mail app shows) and as plain text. */
export function renderDigest(list: Reminder[], today: string, baseUrl = site.url) {
  const c = countByLevel(list);
  const date = LONG.format(new Date(`${today}T00:00:00Z`));
  const subject = list.length ? `FrameMind today: ${[c.overdue && `${c.overdue} overdue`, c.today && `${c.today} for today`, c.soon && `${c.soon} coming up`].filter(Boolean).join(", ")}` : "FrameMind today: all clear";
  const link = (href: string) => `${baseUrl.replace(/\/+$/, "")}${href}`;

  const sections = (["overdue", "today", "soon"] as const)
    .map((lv) => ({ lv, items: list.filter((r) => r.level === lv) }))
    .filter((x) => x.items.length);

  const rows = sections
    .map(
      ({ lv, items }) => `
      <tr><td style="padding:22px 0 6px;font:600 11px/1.4 Menlo,Consolas,monospace;letter-spacing:.14em;text-transform:uppercase;color:${lv === "overdue" ? "#b42318" : "#7a7a7a"}">${HEADS[lv]} · ${items.length}</td></tr>
      ${items
        .map(
          (r) => `
      <tr><td style="padding:10px 0;border-top:1px solid #e0d8c6">
        <a href="${esc(link(r.href))}" style="font:600 15px/1.35 Arial,Helvetica,sans-serif;color:#161616;text-decoration:none">${esc(r.title)}</a>
        <div style="font:13px/1.45 Arial,Helvetica,sans-serif;color:#4a4a4a;margin-top:2px">${esc(r.detail)}</div>
        <div style="font:11px/1.4 Menlo,Consolas,monospace;color:#7a7a7a;margin-top:3px">${esc(AREA_LABEL[r.area])}</div>
      </td></tr>`,
        )
        .join("")}`,
    )
    .join("");

  const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${esc(subject)}</title></head>
<body style="margin:0;padding:0;background:#f5f4f0">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f4f0"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fbf9f4;border:1px solid #e0d8c6">
  <tr><td style="background:#0d0d0d;padding:18px 24px;font:600 11px/1.4 Menlo,Consolas,monospace;letter-spacing:.16em;text-transform:uppercase;color:#c8f135">FrameMind HQ · Morning email</td></tr>
  <tr><td style="padding:24px 24px 4px">
    <div style="font:700 24px/1.2 Arial,Helvetica,sans-serif;color:#161616">Good morning. Here is ${esc(date)}.</div>
    <div style="font:14px/1.5 Arial,Helvetica,sans-serif;color:#4a4a4a;margin-top:6px">${list.length ? esc(subject.replace(/^FrameMind today: /, "")) + "." : "Nothing needs anyone today."}</div>
  </td></tr>
  <tr><td style="padding:0 24px 8px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}</table></td></tr>
  <tr><td style="padding:18px 24px 24px">
    <a href="${esc(link("/hq#today"))}" style="display:inline-block;background:#c8f135;color:#0d0d0d;font:600 14px/1 Arial,Helvetica,sans-serif;padding:12px 18px;text-decoration:none">Open FrameMind HQ</a>
    <div style="font:12px/1.5 Arial,Helvetica,sans-serif;color:#7a7a7a;margin-top:16px">Sent by FrameMind HQ every morning. To change who receives it, go to HQ → Settings → Morning email.</div>
  </td></tr>
</table></td></tr></table></body></html>`;

  const text = [
    `Good morning. Here is ${date}.`,
    list.length ? subject.replace(/^FrameMind today: /, "") + "." : "Nothing needs anyone today.",
    ...sections.flatMap(({ lv, items }) => ["", `${HEADS[lv].toUpperCase()} (${items.length})`, ...items.map((r) => `- ${r.title}\n  ${r.detail}\n  ${link(r.href)}`)]),
    "",
    `Open FrameMind HQ: ${link("/hq#today")}`,
  ].join("\n");

  return { subject, html, text, counts: c };
}

/** Sends through Resend. Throws with Resend's own message when it refuses. */
/** `once` makes Resend send a given key only once a day, so a repeated morning call cannot send twice. */
export async function sendDigest(to: string[], mail: { subject: string; html: string; text: string }, once?: string) {
  if (!to.length) throw new Error("Nobody is set to receive the morning email. Add an address in Settings → Morning email.");
  return sendMail({ to, ...mail, once });
}

/** Everything for one morning: who gets it, and the email itself. */
export async function prepareDigest(today: string) {
  const { settings } = await readSettings();
  const to = recipientsOf(settings.digestEmails);
  const list = await loadReminders(today);
  return { to, list, mail: renderDigest(list, today) };
}
