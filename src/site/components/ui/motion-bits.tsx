"use client";

import { useRef, type ReactNode } from "react";
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from "motion/react";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Link } from "@/site/router";

/* Small motion pieces shared by the website: everything here works without JS-driven scroll smoothing too. */

const EASE = [0.16, 1, 0.3, 1] as const;

/** Fades and lifts its children in once, when they scroll into view. */
export function Rise({ children, delay = 0, className, y = 28 }: { children: ReactNode; delay?: number; className?: string; y?: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -12% 0px" }}
      transition={{ duration: 0.9, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  );
}

/**
 * A headline whose lines slide up from behind a mask, one after another.
 * whileInView sits on the unclipped wrapper: on a line inside its own overflow-hidden box the observer never fires.
 */
export function MaskLines({ lines, className, lineClass, delay = 0, as = "h2" }: { lines: ReactNode[]; className?: string; lineClass?: string; delay?: number; as?: "h1" | "h2" | "p" }) {
  const reduce = useReducedMotion();
  const Tag = { h1: motion.h1, h2: motion.h2, p: motion.p }[as];
  return (
    <Tag
      className={className}
      initial={reduce ? "show" : "hide"}
      whileInView="show"
      viewport={{ once: true, amount: 0.3 }}
      transition={{ staggerChildren: 0.09, delayChildren: delay }}
    >
      {lines.map((line, i) => (
        <span key={i} className="block overflow-hidden pb-[0.1em]">
          <motion.span className={`block ${lineClass ?? ""}`} variants={{ hide: { y: "105%" }, show: { y: "0%", transition: { duration: 1, ease: EASE } } }}>
            {line}
          </motion.span>
        </span>
      ))}
    </Tag>
  );
}

function Word({ word, progress, range }: { word: string; progress: MotionValue<number>; range: [number, number] }) {
  const opacity = useTransform(progress, range, [0.16, 1]);
  return (
    <motion.span style={{ opacity }} className="inline-block whitespace-pre">
      {word}{" "}
    </motion.span>
  );
}

/** A paragraph that lights up word by word as it scrolls through the screen (13g.fr's statement blocks). */
export function ScrollWords({ text, className }: { text: string; className?: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 85%", "end 45%"] });
  const words = text.split(" ");
  if (reduce) return <p className={className}>{text}</p>;
  return (
    <p ref={ref} className={className} aria-label={text}>
      <span aria-hidden="true">
        {words.map((w, i) => (
          <Word key={i} word={w} progress={scrollYProgress} range={[i / words.length, (i + 1) / words.length]} />
        ))}
      </span>
    </p>
  );
}

/** The studio's main button: a pill with a round arrow that slides on hover (13g.fr's "Be strong" pills). */
export function PillLink({ to, children, tone = "lime", external, className = "" }: { to: string; children: ReactNode; tone?: "lime" | "ink" | "chalk" | "ghost"; external?: boolean; className?: string }) {
  const tones = {
    lime: "bg-[var(--fm-lime)] text-[#171716]",
    ink: "bg-[#171716] text-[#eceae4]",
    chalk: "bg-[#eceae4] text-[#171716]",
    ghost: "border border-current/25 text-current",
  }[tone];
  const dot = { lime: "bg-[#171716] text-[var(--fm-lime)]", ink: "bg-[var(--fm-lime)] text-[#171716]", chalk: "bg-[#171716] text-[#eceae4]", ghost: "bg-current/10" }[tone];
  const body = (
    <>
      <span className={`relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full ${dot}`}>
        <ArrowRight size={16} className="transition-transform duration-500 ease-[cubic-bezier(.16,1,.3,1)] group-hover:translate-x-8" />
        <ArrowRight size={16} className="absolute -translate-x-8 transition-transform duration-500 ease-[cubic-bezier(.16,1,.3,1)] group-hover:translate-x-0" />
      </span>
      <span className="pr-3 text-[15px] font-medium">{children}</span>
    </>
  );
  const cls = `group inline-flex items-center gap-3 rounded-full p-1.5 transition-transform active:scale-[0.98] ${tones} ${className}`;
  return external ? (
    <a href={to} target="_blank" rel="noopener noreferrer" className={cls}>
      {body}
    </a>
  ) : (
    <Link to={to} className={cls}>
      {body}
    </Link>
  );
}

/** Small uppercase label with a lime tick, used above section titles. */
export function Kicker({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <p className={`flex items-center gap-2.5 font-mono text-[11px] uppercase tracking-[0.2em] opacity-70 ${className}`}>
      <span className="h-2 w-2 rounded-full bg-[var(--fm-lime)]" />
      {children}
    </p>
  );
}

/** A text link whose arrow lifts on hover. */
export function ArrowLink({ to, children, className = "" }: { to: string; children: ReactNode; className?: string }) {
  return (
    <Link to={to} className={`group inline-flex items-center gap-1.5 text-sm font-medium ${className}`}>
      <span className="bg-[linear-gradient(currentColor,currentColor)] bg-[length:0%_1px] bg-left-bottom bg-no-repeat pb-0.5 transition-[background-size] duration-500 group-hover:bg-[length:100%_1px]">{children}</span>
      <ArrowUpRight size={15} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
    </Link>
  );
}

/**
 * A phrase marked by hand: circled in lime ink, underlined with a quick stroke, or highlighted with a marker.
 * The ink draws itself in when the phrase scrolls into view (the wrapper observes, so it is never clipped).
 */
export function Marked({ children, mark, ink = "#c8f135" }: { children: ReactNode; mark: "circle" | "underline" | "highlight"; ink?: string }) {
  const reduce = useReducedMotion();
  const draw = { hide: { pathLength: reduce ? 1 : 0 }, show: { pathLength: 1, transition: { duration: 1.1, ease: EASE, delay: 0.35 } } };
  if (mark === "highlight")
    return (
      <motion.span className="relative isolate inline-block" initial="hide" whileInView="show" viewport={{ once: true }}>
        <motion.span
          aria-hidden="true"
          className="absolute -inset-x-1.5 inset-y-[8%] -z-10 origin-left rounded-[0.25em]"
          style={{ background: ink }}
          variants={{ hide: { scaleX: reduce ? 1 : 0 }, show: { scaleX: 1, transition: { duration: 0.8, ease: EASE, delay: 0.35 } } }}
        />
        <span className="relative text-[#171716]">{children}</span>
      </motion.span>
    );
  return (
    <motion.span className={`relative inline-block ${mark === "circle" ? "mx-2" : ""}`} initial="hide" whileInView="show" viewport={{ once: true }}>
      {children}
      <svg aria-hidden="true" viewBox={mark === "circle" ? "0 0 200 70" : "0 0 200 14"} preserveAspectRatio="none" className={mark === "circle" ? "pointer-events-none absolute -left-4 -top-2.5 h-[calc(100%+20px)] w-[calc(100%+32px)] overflow-visible" : "pointer-events-none absolute -bottom-2 left-0 h-3 w-full overflow-visible"}>
        <motion.path
          d={mark === "circle" ? "M30 12 C80 -2 175 2 192 28 C205 52 150 68 95 66 C40 64 4 54 8 34 C11 18 45 8 120 8" : "M2 9 C40 3 80 12 120 6 C150 2 175 9 198 5"}
          fill="none"
          stroke={ink}
          strokeWidth={mark === "circle" ? 4 : 3.5}
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          variants={draw}
        />
      </svg>
    </motion.span>
  );
}
