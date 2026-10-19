import { cn } from "@/lib/utils";

export type Tone = "neutral" | "dark" | "ok" | "warn" | "bad" | "info" | "outline";

const tones: Record<Tone, string> = {
  neutral: "bg-graphite/[0.07] text-charcoal",
  dark: "bg-graphite text-paper",
  ok: "bg-ok/12 text-ok",
  warn: "bg-warn/12 text-warn",
  bad: "bg-bad/12 text-bad",
  info: "bg-info/12 text-info",
  outline: "border border-graphite/25 text-charcoal",
};

export function Badge({ tone = "neutral", className, children, dot }: { tone?: Tone; className?: string; children: React.ReactNode; dot?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider whitespace-nowrap", tones[tone], className)}>
      {dot && <span className="size-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

/** Map common status words to tones so every module colours statuses the same way. */
export function statusTone(status: unknown): Tone {
  const s = String(status ?? "").toLowerCase();
  if (["won", "paid", "completed", "done", "delivered", "posted", "published", "active", "received", "ready", "valid", "converted", "accepted", "granted", "approved", "live", "shot", "available"].includes(s)) return "ok";
  if (["lost", "cancelled", "overdue", "blocked", "rejected", "revoked", "spam", "refunded", "inactive", "not allowed", "urgent", "lapsed", "dropped", "repair", "retired"].includes(s)) return "bad";
  if (["pending", "tentative", "draft", "new", "partially-paid", "review", "on-hold", "postponed", "planned", "idea", "high", "nurture", "revisions", "client-review", "renewal-due", "paused", "trial", "due", "onboarding", "enquiry"].includes(s)) return "warn";
  if (["confirmed", "sent", "in-progress", "doing", "editing", "shipped", "packed", "ordered", "scheduled", "proposal", "negotiation", "meeting", "invoiced", "discovery", "design", "build", "launch", "kickoff", "support", "quoted", "internal-review", "pilot", "implementing", "demo", "out", "with-member", "contacted"].includes(s)) return "info";
  return "neutral";
}
