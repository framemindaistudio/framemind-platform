"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, CircleAlert, ExternalLink, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { api } from "@/components/hq/data";
import { cn } from "@/lib/utils";

interface Info {
  setup: { key: boolean; cron: boolean; from: string };
  to: string[];
  subject: string;
  counts: { overdue: number; today: number; soon: number };
  reminders: number;
}

/** Whether the morning email is connected, today's email to look at, and a test send. */
export function DigestPanel({ unsaved }: { unsaved: boolean }) {
  const [info, setInfo] = useState<Info | null>(null);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    let alive = true;
    api<Info>("/api/hq/digest")
      .then((j) => alive && setInfo(j))
      .catch((e) => alive && setError(e instanceof Error ? e.message : "Could not check the morning email"));
    return () => {
      alive = false;
    };
  }, [unsaved]);

  async function test() {
    setSending(true);
    setResult(null);
    try {
      const j = await api<{ to: string[] }>("/api/hq/digest", { method: "POST" });
      setResult({ ok: true, text: `Sent to ${j.to.join(", ")}. It can take a minute to arrive; check the spam folder the first time.` });
    } catch (e) {
      setResult({ ok: false, text: e instanceof Error ? e.message : "Could not send" });
    } finally {
      setSending(false);
    }
  }

  const steps: [boolean, string, string][] = info
    ? [
        [info.setup.key, "Email service connected", info.setup.key ? `Sending from ${info.setup.from}` : "RESEND_API_KEY is not set in Vercel yet"],
        [info.setup.cron, "Daily schedule switched on", info.setup.cron ? "Sent every morning at about 7 am" : "CRON_SECRET is not set in Vercel yet"],
        [info.to.length > 0, "Someone to send it to", info.to.length ? info.to.join(", ") : "Add an address above and save"],
      ]
    : [];

  return (
    <div className="mt-5 rounded-[var(--radius-md)] border border-graphite/12 bg-paper-50 p-4" data-digest>
      {error ? (
        <p className="text-sm text-bad">{error}</p>
      ) : !info ? (
        <p className="flex items-center gap-2 text-sm text-charcoal">
          <Loader2 className="size-4 animate-spin" aria-hidden /> Checking the morning email…
        </p>
      ) : (
        <>
          <ul className="space-y-2">
            {steps.map(([ok, label, note]) => (
              <li key={label} className="flex items-start gap-2.5 text-sm">
                {ok ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-ok" aria-hidden /> : <CircleAlert className="mt-0.5 size-4 shrink-0 text-warn" aria-hidden />}
                <span>
                  <span className="font-semibold text-graphite">{label}</span>
                  <span className="block text-xs text-charcoal">{note}</span>
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-4 border-t border-dashed border-graphite/15 pt-3 text-sm text-charcoal">
            Today&apos;s email: <strong className="text-graphite">{info.subject}</strong>
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" href="/api/hq/digest?view=html" external>
              <ExternalLink className="size-4" aria-hidden /> See today&apos;s email
            </Button>
            <Button type="button" size="sm" onClick={test} disabled={sending || !info.setup.key || !info.to.length || unsaved} title={unsaved ? "Save the settings first" : undefined}>
              {sending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Send className="size-4" aria-hidden />} Send a test now
            </Button>
          </div>
          {unsaved && <p className="mt-2 text-xs text-blueprint">Save the settings first to test with the new addresses.</p>}
          {result && <p className={cn("mt-3 text-sm", result.ok ? "text-ok" : "text-bad")}>{result.text}</p>}
        </>
      )}
    </div>
  );
}
