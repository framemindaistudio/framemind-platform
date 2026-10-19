"use client";

import Link from "next/link";
import { ArrowLeft, CalendarClock, Mail, MessageCircle, Phone } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { cn, formatDate } from "@/lib/utils";
import { mailHref, telHref, whatsappHref } from "./contact";
import { followUpState, daysBetween } from "./crm";

/* ─────────────────────────── contact buttons ─────────────────────────── */

export type ContactChannel = "call" | "whatsapp" | "email";

/**
 * Call / WhatsApp / Email buttons. Missing details render as disabled chips
 * (so the layout never jumps and the reason is announced).
 */
export function ContactButtons({
  phone,
  email,
  whatsappText,
  emailSubject,
  emailBody,
  onContact,
  tone = "light",
  size = "md",
  className,
}: {
  phone?: unknown;
  email?: unknown;
  whatsappText: string;
  emailSubject?: string;
  emailBody?: string;
  onContact?: (channel: ContactChannel) => void;
  tone?: "light" | "dark";
  size?: "sm" | "md";
  className?: string;
}) {
  const tel = telHref(phone);
  const wa = whatsappHref(phone, whatsappText);
  const mail = mailHref(email, emailSubject, emailBody ?? whatsappText);
  const items: { key: ContactChannel; label: string; href: string | null; icon: React.ReactNode; external?: boolean; missing: string }[] = [
    { key: "call", label: "Call", href: tel, icon: <Phone className="size-4" aria-hidden />, missing: "No phone number" },
    { key: "whatsapp", label: "WhatsApp", href: wa, icon: <MessageCircle className="size-4" aria-hidden />, external: true, missing: "No valid mobile number" },
    { key: "email", label: "Email", href: mail, icon: <Mail className="size-4" aria-hidden />, missing: "No email address" },
  ];
  const dark = tone === "dark";
  const base = cn(
    "inline-flex items-center justify-center gap-2 rounded-[var(--radius-sm)] border font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2",
    size === "sm" ? "h-8 px-2.5 text-xs" : "h-10 px-3.5 text-sm",
  );
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {items.map((it) =>
        it.href ? (
          <a
            key={it.key}
            href={it.href}
            target={it.external ? "_blank" : undefined}
            rel={it.external ? "noopener noreferrer" : undefined}
            onClick={(e) => {
              e.stopPropagation();
              onContact?.(it.key);
            }}
            className={cn(
              base,
              dark ? "border-paper/30 text-paper hover:bg-paper hover:text-graphite focus-visible:outline-paper" : "border-graphite/25 bg-paper-50 text-graphite hover:border-graphite hover:bg-graphite hover:text-paper focus-visible:outline-graphite",
            )}
          >
            {it.icon}
            {it.label}
          </a>
        ) : (
          <span
            key={it.key}
            title={it.missing}
            aria-disabled="true"
            className={cn(base, "cursor-not-allowed border-dashed", dark ? "border-paper/15 text-paper/35" : "border-graphite/15 text-blueprint/60")}
          >
            {it.icon}
            {it.label}
            <span className="sr-only"> — {it.missing}</span>
          </span>
        ),
      )}
    </div>
  );
}

/* ─────────────────────────── follow-up chip ─────────────────────────── */

export function FollowUpChip({ date, today, className, empty = "—" }: { date: unknown; today: string; className?: string; empty?: React.ReactNode }) {
  const d = typeof date === "string" ? date.slice(0, 10) : "";
  if (!d) return <span className={cn("text-blueprint/70", className)}>{empty}</span>;
  const state = followUpState(d, today);
  const label = formatDate(d, { year: undefined });
  if (state === "overdue") {
    const days = today ? daysBetween(d, today) : 0;
    return (
      <Badge tone="bad" className={className}>
        <CalendarClock className="size-3" aria-hidden /> {label} · {days}d overdue
      </Badge>
    );
  }
  if (state === "today")
    return (
      <Badge tone="warn" className={className}>
        <CalendarClock className="size-3" aria-hidden /> Today
      </Badge>
    );
  if (state === "soon")
    return (
      <Badge tone="info" className={className}>
        <CalendarClock className="size-3" aria-hidden /> {label}
      </Badge>
    );
  return <span className={cn("tabular inline-flex items-center gap-1 whitespace-nowrap text-xs text-charcoal", className)}>{label}</span>;
}

/* ─────────────────────────── misc ─────────────────────────── */

/** Segmented toggle (Pipeline / Table, etc.). */
export function Segmented<T extends string>({ value, options, onChange, label, className }: { value: T; options: { value: T; label: React.ReactNode }[]; onChange: (v: T) => void; label: string; className?: string }) {
  return (
    <div role="radiogroup" aria-label={label} className={cn("inline-flex rounded-[var(--radius-sm)] border border-graphite/20 bg-paper-50 p-0.5", className)}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={cn(
              "inline-flex h-8 items-center gap-1.5 rounded-[3px] px-3 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-graphite",
              active ? "bg-graphite text-paper" : "text-charcoal hover:bg-graphite/[0.06]",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function BackLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="no-print mb-4 inline-flex items-center gap-1.5 rounded px-1 py-1 text-sm font-medium text-charcoal transition-colors hover:text-graphite focus-visible:outline-2 focus-visible:outline-graphite">
      <ArrowLeft className="size-4" aria-hidden /> {children}
    </Link>
  );
}

/** Small inline notice (info / success / error) used after saves. */
export function Notice({ tone = "info", children, className }: { tone?: "info" | "ok" | "bad" | "warn"; children: React.ReactNode; className?: string }) {
  const cls = {
    info: "border-info/30 bg-info/10 text-info",
    ok: "border-ok/30 bg-ok/10 text-ok",
    bad: "border-bad/30 bg-bad/10 text-bad",
    warn: "border-warn/30 bg-warn/10 text-warn",
  }[tone];
  return (
    <p role={tone === "bad" ? "alert" : "status"} className={cn("rounded-[var(--radius-sm)] border px-3 py-2 text-sm", cls, className)}>
      {children}
    </p>
  );
}

/** Monogram avatar (no fake photos). */
export function Monogram({ text, className, dark }: { text: string; className?: string; dark?: boolean }) {
  return (
    <span aria-hidden className={cn("grid shrink-0 place-items-center rounded-full font-mono text-xs font-semibold", dark ? "bg-paper text-graphite" : "border border-graphite/20 bg-paper text-graphite", className)}>
      {text || "·"}
    </span>
  );
}
