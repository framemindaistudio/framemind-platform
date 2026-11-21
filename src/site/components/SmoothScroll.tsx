"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";

let lenis: Lenis | null = null;

/** Scroll to a position or element through Lenis when it is running, natively otherwise. */
export function scrollToTarget(target: number | string | HTMLElement) {
  if (lenis) lenis.scrollTo(target, { offset: typeof target === "number" ? 0 : -80 });
  else if (typeof target === "number") window.scrollTo({ top: target, behavior: "smooth" });
  else (typeof target === "string" ? document.querySelector(target) : target)?.scrollIntoView({ behavior: "smooth" });
}

/**
 * Weighted, smooth page scrolling for the website (the feel of 13g.fr and royalbev.com).
 * Off for people who ask for reduced motion, and on touch screens, where native scrolling already feels right.
 */
export default function SmoothScroll() {
  const path = usePathname();

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1, smoothWheel: true, anchors: { offset: -80 } });
    let id = 0;
    const raf = (t: number) => {
      lenis?.raf(t);
      id = requestAnimationFrame(raf);
    };
    id = requestAnimationFrame(raf);
    return () => {
      cancelAnimationFrame(id);
      lenis?.destroy();
      lenis = null;
    };
  }, []);

  // a new page starts at the top
  useEffect(() => {
    lenis?.scrollTo(0, { immediate: true, force: true });
  }, [path]);

  return null;
}
