/**
 * One-tap contact links (call / WhatsApp / email) and polite first messages.
 * Indian numbers without a country code get +91.
 */

/** Digits with country code, e.g. "919876543210" — or "" when unusable. */
export function phoneDigits(phone: unknown) {
  let d = String(phone ?? "").replace(/\D/g, "");
  if (!d) return "";
  if (d.length === 11 && d.startsWith("0")) d = d.slice(1);
  if (d.length === 10) d = `91${d}`;
  return d.length >= 10 ? d : "";
}

export function telHref(phone: unknown) {
  const raw = String(phone ?? "").trim();
  if (!raw) return null;
  const d = phoneDigits(raw);
  return d ? `tel:+${d}` : `tel:${raw.replace(/[^\d+]/g, "")}`;
}

export function whatsappHref(phone: unknown, text: string) {
  const d = phoneDigits(phone);
  if (!d) return null;
  return `https://wa.me/${d}?text=${encodeURIComponent(text)}`;
}

export function mailHref(email: unknown, subject?: string, body?: string) {
  const e = String(email ?? "").trim();
  if (!e || !/^\S+@\S+\.\S+$/.test(e)) return null;
  const q = new URLSearchParams();
  if (subject) q.set("subject", subject);
  if (body) q.set("body", body);
  const qs = q.toString().replace(/\+/g, "%20");
  return `mailto:${e}${qs ? `?${qs}` : ""}`;
}

export function firstName(name: unknown) {
  const n = String(name ?? "").trim();
  if (!n) return "";
  const parts = n.split(/\s+/);
  // skip honorifics like "Dr." / "Mrs."
  const first = /^(dr|mr|mrs|ms|miss|prof|sri|smt|shri)\.?$/i.test(parts[0]) && parts[1] ? `${parts[0]} ${parts[1]}` : parts[0];
  return first;
}

type IntroKind = "project" | "coaching" | "vritta" | "contact" | "careers" | "partner" | "client";

/**
 * A warm, short first message — used for WhatsApp and email bodies. It promises nothing the studio has not
 * published: a 20-minute call, an honest scope, a clear price.
 * `applyingFor` is the role an applicant named, such as "UI/UX Design Intern".
 */
export function introMessage({ kind, name, organisation, sender, applyingFor }: { kind: string; name?: unknown; organisation?: unknown; sender: string; applyingFor?: string }) {
  const k = (["project", "coaching", "vritta", "contact", "careers", "partner", "client"].includes(kind) ? kind : "contact") as IntroKind;
  const hello = firstName(name) ? `Hi ${firstName(name)},` : "Hi,";
  const org = String(organisation ?? "").trim();
  const me = `this is ${sender} from FrameMind AI Studio.`;
  switch (k) {
    case "careers":
      return `${hello} ${me} Thank you for applying${applyingFor ? ` for the ${applyingFor} role` : ""}. I've gone through what you sent and would like to know a little more about you and your work. Could we set up a short call this week?`;
    case "coaching":
      return `${hello} ${me} Thank you for your interest in our 1:1 AI coaching. Before anything else we map what you do every day and what you already know, so the 90 days are built around your work. Could we set up a quick 20-minute call?`;
    case "vritta":
      return `${hello} ${me} Thank you for your interest in Vritta${org ? ` for ${org}` : ""}. Happy to show you how departments file their activities and how the newsletter and the accreditation evidence come out of the same record. When would suit you for a short demo?`;
    case "partner":
      return `${hello} ${me} Thank you for reaching out about working together. I'd be glad to understand your idea and see where we fit. Would a quick call this week suit you?`;
    case "project":
    case "client":
      return `${hello} ${me} Thank you for reaching out${org ? ` about ${org}` : ""}. Tell us what you're building — a 20-minute call is usually enough for us to scope it honestly and send you a clear price. When would be a good time?`;
    default:
      return `${hello} ${me} Thank you for getting in touch. How can we help? Happy to set up a quick call at a time that suits you.`;
  }
}

export function introSubject(kind: string, organisation?: unknown) {
  const org = String(organisation ?? "").trim();
  switch (kind) {
    case "careers":
      return "Your application to FrameMind AI Studio";
    case "coaching":
      return "1:1 AI coaching — FrameMind AI Studio";
    case "vritta":
      return `Vritta${org ? ` for ${org}` : ""} — FrameMind AI Studio`;
    case "partner":
      return "Working together — FrameMind AI Studio";
    case "project":
    case "client":
      return `Your project${org ? ` — ${org}` : ""} · FrameMind AI Studio`;
    default:
      return "Thank you for contacting FrameMind AI Studio";
  }
}
