/**
 * Sending email from HQ, through Resend (resend.com). Used by the morning email and by Documents to Sign.
 *
 * Vercel environment variables:
 *   RESEND_API_KEY   the API key from resend.com
 *   DIGEST_FROM      the sender, e.g. "FrameMind HQ <hq@framemindaistudio.site>", once the domain is verified in Resend. Until then
 *                    mail comes from onboarding@resend.dev, which Resend only delivers to the account's own address.
 */
import "server-only";

export const DEFAULT_FROM = "FrameMind HQ <onboarding@resend.dev>";
export const mailFrom = () => process.env.DIGEST_FROM || DEFAULT_FROM;
/** True while the test sender is in use: mail then reaches only the Resend account's own address. */
export const testSender = () => /onboarding@resend\.dev/i.test(mailFrom());
export const mailReady = () => !!process.env.RESEND_API_KEY;

export const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

export interface Mail {
  to: string[];
  subject: string;
  html: string;
  text: string;
  /** where a reply goes */
  replyTo?: string;
  /** Resend sends a given key only once a day, so a repeated call cannot send twice */
  once?: string;
}

/** Sends one email. Throws with Resend's own message when it refuses. */
export async function sendMail(m: Mail): Promise<string> {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("The email service is not connected yet (RESEND_API_KEY is missing).");
  if (!m.to.length) throw new Error("There is no address to send it to.");
  // RESEND_API_URL only points the local tests at a stand-in; Vercel never sets it
  const res = await fetch(process.env.RESEND_API_URL || "https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", ...(m.once ? { "Idempotency-Key": m.once } : {}) },
    body: JSON.stringify({ from: mailFrom(), to: m.to, subject: m.subject, html: m.html, text: m.text, ...(m.replyTo && isEmail(m.replyTo) ? { reply_to: m.replyTo } : {}) }),
    cache: "no-store",
  });
  const body = (await res.json().catch(() => ({}))) as { id?: string; message?: string };
  if (!res.ok) throw new Error(`The email service refused the message: ${body.message || res.status}`);
  return body.id ?? "";
}

export const esc = (v: string) => v.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
