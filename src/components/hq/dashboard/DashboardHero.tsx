"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { parseIso } from "./time";

export interface Attention {
  id: string;
  label: string;
  href: string;
  urgent?: boolean;
}

function greeting(hour: number) {
  if (hour < 5) return "Working late";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

/** Month pacing dial: arc = progress to target, tick = how much of the month has gone. */
function PaceDial({ value, elapsed, center, caption }: { value: number; elapsed: number; center: string; caption: string }) {
  const reduce = useReducedMotion();
  const r = 52;
  const c = 2 * Math.PI * r;
  const v = Math.min(1, Math.max(0, value));
  const angle = elapsed * 360 - 90;
  const rad = (angle * Math.PI) / 180;
  const tick = { x1: 60 + Math.cos(rad) * 44, y1: 60 + Math.sin(rad) * 44, x2: 60 + Math.cos(rad) * 60, y2: 60 + Math.sin(rad) * 60 };
  return (
    <figure className="relative mx-auto grid size-36 shrink-0 place-items-center sm:size-40" aria-label={`${center} ${caption}`}>
      <svg viewBox="0 0 120 120" className="absolute inset-0 size-full" aria-hidden>
        {/* graduation ticks */}
        {Array.from({ length: 40 }, (_, i) => {
          const a = ((i / 40) * 360 - 90) * (Math.PI / 180);
          const long = i % 5 === 0;
          return <line key={i} x1={60 + Math.cos(a) * (long ? 57 : 58.5)} y1={60 + Math.sin(a) * (long ? 57 : 58.5)} x2={60 + Math.cos(a) * 60} y2={60 + Math.sin(a) * 60} stroke="rgb(245 244 240 / 0.35)" strokeWidth={0.6} />;
        })}
        <circle cx="60" cy="60" r={r} fill="none" stroke="rgb(245 244 240 / 0.12)" strokeWidth="6" />
        <motion.circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke="#C8F135"
          strokeWidth="6"
          strokeLinecap="round"
          transform="rotate(-90 60 60)"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - v) }}
          transition={{ duration: reduce ? 0 : 1.4, ease: [0.16, 1, 0.3, 1], delay: reduce ? 0 : 0.2 }}
        />
        <circle cx="60" cy="60" r="38" fill="none" stroke="rgb(245 244 240 / 0.18)" strokeWidth="0.6" strokeDasharray="2 3" />
        <line {...tick} stroke="#C8F135" strokeWidth="1.4" />
      </svg>
      <figcaption className="relative text-center">
        <span className="block font-mono text-2xl font-bold leading-none tracking-tight text-paper sm:text-[28px]">{center}</span>
        <span className="annot mt-1.5 block text-[9px] text-paper/55">{caption}</span>
      </figcaption>
    </figure>
  );
}

export function DashboardHero({
  name,
  roleLabel,
  today,
  hour,
  attention,
  dial,
  dayOfMonth,
  daysInMonth,
  paceNote,
}: {
  name: string;
  roleLabel: string;
  today: string | null;
  hour: number | null;
  attention: Attention[];
  dial: { value: number; center: string; caption: string } | null;
  dayOfMonth: number;
  daysInMonth: number;
  paceNote?: string;
}) {
  const first = name.trim().split(/\s+/)[0] || "there";
  const dateText = today ? parseIso(today).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : "";
  return (
    <section className="relative overflow-hidden rounded-[var(--radius-lg)] bg-graphite text-paper shadow-[var(--shadow-lift)]" aria-labelledby="hq-greeting">
      <div className="pointer-events-none absolute -left-24 -top-32 size-[420px] rounded-full bg-violet/25 blur-[110px]" aria-hidden />
      <div className="pointer-events-none absolute -bottom-40 right-10 size-[360px] rounded-full bg-lime/10 blur-[110px]" aria-hidden />

      <div className="relative grid gap-8 px-5 py-7 sm:px-8 sm:py-9 lg:grid-cols-[1fr_auto] lg:items-center lg:gap-12 lg:px-10">
        <div className="min-w-0">
          <p className="annot flex flex-wrap items-center gap-x-3 gap-y-1 text-paper/55">
            <span className="text-lime">Command Center</span>
            <span className="h-px w-6 bg-paper/30" aria-hidden />
            <span className="font-mono tracking-[0.12em]">{today ? dateText : " "}</span>
          </p>
          <h1 id="hq-greeting" className="mt-3 text-[28px] font-bold leading-[1.05] tracking-[-0.03em] sm:text-4xl lg:text-[44px]">
            {hour === null ? <span className="inline-block h-[1em] w-64 max-w-full animate-pulse rounded bg-paper/10 align-middle" aria-label="Loading" /> : `${greeting(hour)}, ${first}.`}
          </h1>
          <p className="mt-2 text-sm text-paper/65">
            Signed in as <span className="font-semibold text-paper/85">{name}</span> · {roleLabel}
          </p>

          <div className="mt-6">
            <p className="annot mb-2.5 text-[10px] text-paper/45">Needs attention</p>
            {!today ? (
              <span className="inline-block h-8 w-72 max-w-full animate-pulse rounded-full bg-paper/10" />
            ) : attention.length ? (
              <ul className="flex flex-wrap gap-2">
                {attention.map((a) => (
                  <li key={a.id}>
                    <Link
                      href={a.href}
                      className={cn(
                        "group inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                        a.urgent ? "border-lime bg-lime text-graphite hover:bg-lime-dark" : "border-paper/25 text-paper/85 hover:border-paper/60 hover:text-paper",
                      )}
                    >
                      {a.urgent && <span className="size-1.5 rounded-full bg-bad" aria-hidden />}
                      {a.label}
                      <ArrowUpRight className="size-3 opacity-60 transition-transform group-hover:-translate-y-px group-hover:translate-x-px" aria-hidden />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="inline-flex items-center gap-2 rounded-full border border-paper/20 px-3 py-1.5 text-xs text-paper/75">
                <span className="size-1.5 rounded-full bg-lime" aria-hidden /> Nothing overdue — clear runway.
              </p>
            )}
          </div>
        </div>

        {dial && (
          <div className="flex items-center gap-6 border-t border-paper/10 pt-6 lg:flex-col lg:gap-3 lg:border-l lg:border-t-0 lg:pl-12 lg:pt-0">
            <PaceDial value={dial.value} elapsed={daysInMonth ? dayOfMonth / daysInMonth : 0} center={dial.center} caption={dial.caption} />
            <div className="text-left lg:text-center">
              <p className="font-mono text-xs text-paper/70">
                Day {dayOfMonth} of {daysInMonth}
              </p>
              {paceNote && <p className="mt-1 max-w-[220px] text-[11px] leading-snug text-paper/50">{paceNote}</p>}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
