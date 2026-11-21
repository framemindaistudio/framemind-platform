"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Kicker, MaskLines, PillLink, Rise } from "@/site/components/ui/motion-bits";

/* The building blocks every inner page shares, so the whole site reads as one: a matte hero, section titles, a closing panel. */

const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * The top of an inner page: graphite, runs under the floating navbar, a headline that slides up line by line,
 * one short paragraph and the page's main actions. `aside` sits to the right on wide screens (a photo, stats, a card).
 */
export function PageHero({
  kicker,
  lines,
  lede,
  actions,
  aside,
  children,
  accent = "var(--fm-lime)",
}: {
  kicker: ReactNode;
  lines: ReactNode[];
  lede?: ReactNode;
  actions?: ReactNode;
  aside?: ReactNode;
  children?: ReactNode;
  /** the colour of the soft light in the corner (a venture's own colour, for example) */
  accent?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <section className="fm-dark relative overflow-hidden">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ background: `radial-gradient(60% 55% at 88% 0%, color-mix(in oklab, ${accent} 16%, transparent), transparent 70%)` }} />
      <div className={`relative mx-auto grid max-w-[1320px] gap-12 px-5 pb-16 pt-36 sm:px-8 md:pb-24 md:pt-44 ${aside ? "lg:grid-cols-[1.35fr_1fr] lg:items-end" : ""}`}>
        <div>
          <motion.div initial={reduce ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: EASE }}>
            <Kicker className="text-[#d6d4cd]">{kicker}</Kicker>
          </motion.div>
          <MaskLines as="h1" className="mt-6 text-[clamp(2.6rem,7vw,6.6rem)] font-normal leading-[0.95] tracking-[-0.05em]" lines={lines} delay={0.1} />
          {lede && (
            <Rise delay={0.35} y={14}>
              <div className="mt-7 max-w-xl text-[17px] leading-relaxed text-[#bcbab2]">{lede}</div>
            </Rise>
          )}
          {actions && (
            <Rise delay={0.45} y={14}>
              <div className="mt-9 flex flex-wrap items-center gap-3">{actions}</div>
            </Rise>
          )}
        </div>
        {aside && (
          <Rise delay={0.3} y={20}>
            {aside}
          </Rise>
        )}
      </div>
      {children}
    </section>
  );
}

/** A section title: kicker, a big quiet headline and an optional line or link on the right. */
export function SectionHead({ kicker, lines, side, className = "", dark }: { kicker: ReactNode; lines: ReactNode[]; side?: ReactNode; className?: string; dark?: boolean }) {
  return (
    <div className={`flex flex-col justify-between gap-6 md:flex-row md:items-end ${className}`}>
      <div>
        <Kicker className={dark ? "text-[#d6d4cd]" : ""}>{kicker}</Kicker>
        <MaskLines className="mt-5 max-w-4xl text-[clamp(2.1rem,4.6vw,4.2rem)] font-normal leading-[1] tracking-[-0.045em]" lines={lines} />
      </div>
      {side && <div className="shrink-0 md:max-w-sm">{side}</div>}
    </div>
  );
}

/** The closing lime panel on every page, sitting on graphite so it never shows pale edges. */
export function CtaPanel({
  kicker = "Start here",
  lines,
  lede,
  primary = { to: "/connect", label: "Start a project" },
  secondary = { to: "https://wa.me/918073087576", label: "WhatsApp us", external: true },
}: {
  kicker?: string;
  lines: ReactNode[];
  lede?: ReactNode;
  primary?: { to: string; label: string; external?: boolean };
  secondary?: { to: string; label: string; external?: boolean } | null;
}) {
  return (
    <section className="bg-[#171716] px-3 pb-3 pt-3 sm:px-5 sm:pb-5 sm:pt-5">
      <div className="overflow-hidden rounded-[32px] bg-[var(--fm-lime)] text-[#171716] md:rounded-[48px]">
        <div className="mx-auto max-w-[1320px] px-6 py-16 sm:px-10 md:py-24">
          <Kicker className="opacity-80">{kicker}</Kicker>
          <MaskLines className="mt-6 text-[clamp(2.6rem,7.5vw,7rem)] font-normal leading-[0.92] tracking-[-0.055em]" lines={lines} />
          <div className="mt-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            {lede ? <p className="max-w-md text-[17px] leading-relaxed text-[#171716]/75">{lede}</p> : <span />}
            <div className="flex flex-wrap gap-3">
              <PillLink to={primary.to} tone="ink" external={primary.external}>
                {primary.label}
              </PillLink>
              {secondary && (
                <PillLink to={secondary.to} tone="ghost" external={secondary.external}>
                  {secondary.label}
                </PillLink>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/** A stat line for heroes: big number, small label. */
export function HeroStats({ items }: { items: { value: ReactNode; label: string }[] }) {
  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[24px] border border-white/[0.08] bg-white/[0.08]">
      {items.map((s) => (
        <div key={s.label} className="bg-[#1c1c1a] p-5 md:p-6">
          <p className="text-[clamp(1.8rem,3vw,2.6rem)] leading-none tracking-[-0.04em] text-[#eceae4]">{s.value}</p>
          <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[#9a9890]">{s.label}</p>
        </div>
      ))}
    </div>
  );
}
