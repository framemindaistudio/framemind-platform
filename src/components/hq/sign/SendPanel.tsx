"use client";

import { useEffect, useState } from "react";
import { Check, Copy, Link2, Link2Off, Loader2, Mail, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/form";
import { api } from "@/components/hq/data";
import { phoneDigits } from "@/components/hq/sales/contact";
import { shortDate } from "@/components/hq/printables/util";
import type { SignDoc } from "@/lib/sign/context";
import { linkLive, MAX_REMINDERS, REMIND_EVERY_DAYS, shareOf } from "@/lib/sign/share";
import type { Party, SignTemplate } from "@/lib/sign/types";
import { cn } from "@/lib/utils";

interface MailInfo {
  mail: boolean;
  from: string;
  testSender: boolean;
}

/**
 * "Send it": the paper's private link by email or WhatsApp, the link to copy, reminders, and what has happened so far.
 * Sending locks the wording, as printing does. The server keeps the link on the paper (src/lib/sign/share.ts).
 */
export function SendPanel({
  doc,
  party,
  template,
  today,
  cover,
  beforeSend,
  onSent,
}: {
  doc: SignDoc;
  party: Party;
  template: SignTemplate;
  today: string;
  /** the paper's cover letter, for WhatsApp */
  cover: string;
  /** saves unsaved changes first; null when that failed */
  beforeSend: () => Promise<SignDoc | null>;
  onSent: (doc: SignDoc) => void;
}) {
  const [info, setInfo] = useState<MailInfo | null>(null);
  const [busy, setBusy] = useState("");
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const share = shareOf(doc);
  const live = !!share && linkLive(doc, today);
  const url = share && typeof window !== "undefined" ? `${window.location.origin}/papers/${share.token}` : "";
  const phone = phoneDigits(party.phone);

  useEffect(() => {
    let alive = true;
    api<MailInfo>("/api/hq/sign/share")
      .then((j) => alive && setInfo(j))
      .catch(() => alive && setInfo({ mail: false, from: "", testSender: false }));
    return () => {
      alive = false;
    };
  }, []);

  async function call(body: Record<string, unknown>, label: string) {
    setBusy(label);
    setNote(null);
    try {
      const saved = await beforeSend();
      if (!saved) return null;
      const j = await api<{ doc: SignDoc; url?: string }>("/api/hq/sign/share", { method: "POST", body: JSON.stringify({ id: saved.id, ...body }) });
      onSent(j.doc);
      return j;
    } catch (e) {
      setNote({ ok: false, text: e instanceof Error ? e.message : "That did not work. Try again." });
      return null;
    } finally {
      setBusy("");
    }
  }

  async function email() {
    const j = await call({ action: "email" }, "email");
    if (j) setNote({ ok: true, text: `Emailed to ${party.email}.${info?.testSender ? " While the test sender is in use, it only reaches your own Resend address." : ""}` });
  }

  async function whatsapp() {
    // opened at once, so the browser allows it; the address follows when the link is ready
    const w = window.open("", "_blank");
    const j = await call({ action: "whatsapp" }, "whatsapp");
    if (!j?.url) {
      w?.close();
      return;
    }
    const text = `${cover.trim()}\n\nOpen the paper: ${j.url}`;
    const href = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
    if (w) w.location.href = href;
    else window.location.href = href;
    setNote({ ok: true, text: "WhatsApp is open with the message ready. Press send there." });
  }

  async function copy() {
    let link = url;
    if (!live) {
      const j = await call({ action: "link" }, "link");
      if (!j?.url) return;
      link = j.url;
    }
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setNote({ ok: true, text: link });
    }
  }

  const events: string[] = [];
  if (share) {
    if (share.sentTo) events.push(`Emailed to ${share.sentTo}${share.sentOn ? ` on ${shortDate(share.sentOn)}` : ""}`);
    if (share.via.includes("whatsapp")) events.push("Sent on WhatsApp");
    events.push(share.openedOn ? `Opened on ${shortDate(share.openedOn)}` : "Not opened yet");
    if (share.reminders.length) events.push(`Reminders sent: ${share.reminders.map((r) => shortDate(r)).join(", ")}`);
    events.push(live ? `The link works until ${shortDate(share.expiresOn)}` : share.stopped ? "The link is switched off" : "The link has ended");
  }

  return (
    <div className="space-y-3 rounded-[var(--radius-sm)] border border-graphite/15 bg-paper-50 p-4" data-send>
      {doc.status === "draft" && <p className="text-xs text-blueprint">Sending locks the wording, as printing does, so HQ keeps exactly what was sent.</p>}
      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={email} disabled={!!busy || !info?.mail || !party.email} title={!party.email ? "Add their email under Who it is for" : !info?.mail ? "Connect the email service first" : undefined}>
          {busy === "email" ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : <Mail className="size-3.5" aria-hidden />} Email it{party.email ? ` to ${party.email}` : ""}
        </Button>
        <Button size="sm" variant="secondary" onClick={whatsapp} disabled={!!busy || !phone} title={!phone ? "Add their phone under Who it is for" : undefined}>
          {busy === "whatsapp" ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : <MessageCircle className="size-3.5" aria-hidden />} WhatsApp it
        </Button>
        <Button size="sm" variant="ghost" onClick={copy} disabled={!!busy}>
          {busy === "link" ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : copied ? <Check className="size-3.5" aria-hidden /> : live ? <Copy className="size-3.5" aria-hidden /> : <Link2 className="size-3.5" aria-hidden />} {copied ? "Copied" : live ? "Copy the link" : "Make a link to copy"}
        </Button>
      </div>

      {info && !info.mail && <p className="text-xs text-charcoal">Email needs the email service connected (see HQ → Settings → Morning email). WhatsApp and the link work now.</p>}
      {info?.mail && info.testSender && <p className="text-xs text-charcoal">Until the studio&apos;s domain is verified in Resend, email only reaches your own Resend address. WhatsApp and the link reach anyone.</p>}

      {share && (
        <ul className="space-y-1 border-t border-graphite/10 pt-3 text-xs text-charcoal" data-share-status>
          {events.map((e) => (
            <li key={e} className={cn(e.startsWith("Opened") && "font-semibold text-ok")}>
              {e}
            </li>
          ))}
        </ul>
      )}

      {share?.sentTo && live && template.signs !== "studio" && (
        <Checkbox
          checked={share.remind}
          disabled={!!busy || doc.partySigned === true}
          onChange={(e) => void call({ action: "remind", on: e.target.checked }, "remind")}
          label={<span className="text-xs">Remind them by email until it is ticked as signed: up to {MAX_REMINDERS} reminders, {REMIND_EVERY_DAYS} days apart, and one the day before it is due</span>}
        />
      )}

      {live && (
        <button type="button" disabled={!!busy} onClick={() => window.confirm("Switch the link off? Anyone who has it will see that it has ended. You can send a new one later.") && void call({ action: "stop" }, "stop")} className="inline-flex items-center gap-1.5 text-xs font-semibold text-bad underline-offset-2 hover:underline">
          <Link2Off className="size-3.5" aria-hidden /> Switch the link off
        </button>
      )}

      {note && (
        <p role="status" className={cn("break-all text-xs", note.ok ? "text-ok" : "text-bad")}>
          {note.text}
        </p>
      )}
    </div>
  );
}
