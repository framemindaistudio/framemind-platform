"use client";

import { useRef, useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

/** One anchored block of the settings page: numbered title block + a paper card. */
export function SettingsSection({ id, index, title, description, children, className }: { id: string; index: string; title: string; description?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-24">
      <header className="mb-4 flex items-start gap-3 border-b border-graphite/10 pb-3">
        <span className="mt-1.5 font-mono text-[10px] tracking-widest text-blueprint" aria-hidden>
          {index}
        </span>
        <div className="min-w-0">
          <h2 id={`${id}-title`} className="text-lg font-bold tracking-tight text-graphite">
            {title}
          </h2>
          {description && <p className="mt-0.5 max-w-2xl text-sm text-charcoal">{description}</p>}
        </div>
      </header>
      <div className={cn("relative rounded-[var(--radius-md)] border border-graphite/12 bg-paper-50 p-4 sm:p-6", className)}>{children}</div>
    </section>
  );
}

/** Small sub-heading inside a section card. */
export function Subhead({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h3 className={cn("annot mb-3 text-[10px] text-blueprint", className)}>{children}</h3>;
}

export function CopyButton({ text, label = "Copy", className }: { text: string; label?: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | null>(null);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // clipboard blocked: fall back to a temporary selection
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
      } catch {
        /* nothing more to try */
      }
      ta.remove();
    }
    setCopied(true);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <button
      type="button"
      onClick={copy}
      className={cn("inline-flex h-7 items-center gap-1.5 rounded-[var(--radius-sm)] border border-paper/20 px-2 text-[11px] font-semibold text-paper/80 transition-colors hover:bg-paper/10 hover:text-paper", className)}
    >
      {copied ? <Check className="size-3.5" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}
      <span aria-live="polite">{copied ? "Copied" : label}</span>
    </button>
  );
}

/** Dark "terminal" block with a copy button, for commands and env values. */
export function CodeBlock({ code, label, className }: { code: string; label?: string; className?: string }) {
  return (
    <div className={cn("relative overflow-hidden rounded-[var(--radius-sm)] border border-graphite bg-graphite text-paper", className)}>
      <div className="bp-grid-dark pointer-events-none absolute inset-0 opacity-40" aria-hidden />
      <div className="relative flex items-center justify-between gap-3 border-b border-paper/10 px-3 py-1.5">
        <span className="annot text-[10px] text-paper/50">{label ?? "Terminal"}</span>
        <CopyButton text={code} />
      </div>
      <pre className="hq-scroll relative overflow-x-auto px-3 py-3 font-mono text-[12.5px] leading-relaxed" tabIndex={0} data-lenis-prevent>
        <code>{code}</code>
      </pre>
    </div>
  );
}

/** Coloured status dot + label (functional tones only). */
export function StatusPill({ tone, children }: { tone: "ok" | "warn" | "bad" | "neutral"; children: React.ReactNode }) {
  const cls = { ok: "bg-ok/12 text-ok", warn: "bg-warn/12 text-warn", bad: "bg-bad/12 text-bad", neutral: "bg-graphite/[0.07] text-charcoal" }[tone];
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-semibold", cls)}>
      <span className="size-1.5 rounded-full bg-current" aria-hidden />
      {children}
    </span>
  );
}
