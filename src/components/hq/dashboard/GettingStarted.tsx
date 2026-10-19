import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { CornerMarks } from "@/components/brand/Blueprint";
import { cn } from "@/lib/utils";

export interface SetupStep {
  id: string;
  title: string;
  detail: string;
  href?: string;
  cta?: string;
  /** true = done, false = to do, null = can't be checked automatically */
  done: boolean | null;
}

/**
 * First-run checklist shown until the first client or project exists.
 * Every step is detected from live data — nothing is ticked by hand.
 */
export function GettingStarted({ steps }: { steps: SetupStep[] }) {
  const done = steps.filter((s) => s.done).length;
  const pct = steps.length ? done / steps.length : 0;
  const next = steps.find((s) => s.done === false);
  return (
    <section aria-labelledby="getting-started" className="relative overflow-hidden rounded-[var(--radius-lg)] border border-graphite/15 bg-paper-50 shadow-[var(--shadow-paper)]">
      <CornerMarks size={12} className="text-graphite/40" />
      <div className="bp-grid-fine pointer-events-none absolute inset-0 opacity-70" aria-hidden />
      <div className="relative grid gap-6 p-5 sm:p-6 lg:grid-cols-[minmax(0,300px)_1fr] lg:gap-10 lg:p-8">
        <div>
          <p className="annot text-blueprint">Launch sequence · Oct 2026</p>
          <h2 id="getting-started" className="mt-2 text-xl font-bold tracking-[-0.02em] text-graphite sm:text-2xl">
            Set up HQ before the first client project.
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-charcoal">
            HQ starts empty on purpose — every record here will be real. Work down this list; each step ticks itself off as the data appears.
          </p>
          <div className="mt-5">
            <div className="flex items-baseline justify-between">
              <span className="annot text-[10px] text-blueprint">Progress</span>
              <span className="font-mono text-sm font-bold text-graphite">
                {done}/{steps.length}
              </span>
            </div>
            <div className="relative mt-2 h-2 overflow-hidden rounded-full bg-graphite/10" role="progressbar" aria-label="Setup progress" aria-valuenow={Math.round(pct * 100)} aria-valuemin={0} aria-valuemax={100}>
              <div className="absolute inset-y-0 left-0 rounded-full bg-graphite transition-[width] duration-700" style={{ width: `${pct * 100}%` }} />
            </div>
          </div>
          {next?.href && (
            <Link
              href={next.href}
              className="mt-5 inline-flex items-center gap-2 rounded-[var(--radius-sm)] bg-graphite px-4 py-2.5 text-xs font-semibold text-paper shadow-[var(--shadow-paper)] transition-all hover:-translate-y-0.5 hover:bg-ink hover:shadow-[var(--shadow-lift)]"
            >
              Next: {next.title} <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          )}
        </div>

        <ol className="grid gap-px overflow-hidden rounded-[var(--radius-md)] border border-graphite/12 bg-graphite/10 sm:grid-cols-2">
          {steps.map((step, i) => (
            <li key={step.id} className={cn("relative flex gap-3 bg-paper-50 p-4", step.done && "bg-paper-100")}>
              <span
                className={cn(
                  "grid size-7 shrink-0 place-items-center rounded-full border font-mono text-[10px] font-bold",
                  step.done ? "border-graphite bg-graphite text-paper" : "border-graphite/30 bg-paper text-charcoal",
                )}
                aria-hidden
              >
                {step.done ? <Check className="size-3.5" strokeWidth={2.5} /> : String(i + 1).padStart(2, "0")}
              </span>
              <div className="min-w-0 flex-1">
                <p className={cn("text-sm font-semibold", step.done ? "text-charcoal line-through decoration-graphite/30" : "text-graphite")}>
                  {step.title}
                  <span className="sr-only">{step.done ? " — done" : step.done === null ? " — check manually" : " — to do"}</span>
                </p>
                <p className="mt-0.5 text-xs leading-relaxed text-charcoal">{step.detail}</p>
                {step.href && !step.done && (
                  <Link href={step.href} className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-graphite underline-offset-4 hover:underline">
                    {step.cta ?? "Open"} <ArrowRight className="size-3" aria-hidden />
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
