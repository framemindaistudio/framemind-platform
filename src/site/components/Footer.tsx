"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { ArrowUp, ArrowUpRight } from "lucide-react";
import { Link } from "@/site/router";
import { scrollToTarget } from "@/site/components/SmoothScroll";

/*
 * The footer: large numbered links (13g.fr), the ventures each with their own colour, contact, and a giant solid
 * FrameMind wordmark that rises out of the bottom edge as the page ends, with a slow light crossing it.
 */

const PAGES = [
  { to: "/pricing", label: "Services" },
  { to: "/industries", label: "Industry apps" },
  { to: "/shop", label: "Store" },
  { to: "/team", label: "Team" },
  { to: "/careers", label: "Careers" },
  { to: "/connect", label: "Contact" },
];

const VENTURES = [
  { to: "/360vue", name: "360VUE", what: "Virtual tours", dot: "#d9a35b" },
  { to: "/vritta", name: "Vritta", what: "School records", dot: "#9fb7ff" },
  { to: "/jove", name: "JOVE", what: "Robotics workshops", dot: "#8fd6b4" },
  { to: "/personal-coaching", name: "Coaching", what: "1:1 AI coaching", dot: "#c8f135" },
];

const MORE = [
  { to: "/real-estate", label: "Real estate platform" },
  { to: "/testimonials", label: "Testimonials" },
];

const SOCIAL = [
  { href: "https://www.instagram.com/framemind_ai_studio/", label: "Instagram" },
  { href: "https://www.linkedin.com/in/chinmay-rm/", label: "LinkedIn" },
  { href: "https://wa.me/918073087576", label: "WhatsApp" },
];

function IndiaClock() {
  const [t, setT] = useState("");
  useEffect(() => {
    const f = new Intl.DateTimeFormat("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true, timeZone: "Asia/Kolkata" });
    const tick = () => setT(f.format(new Date()));
    tick();
    const id = setInterval(tick, 20_000);
    return () => clearInterval(id);
  }, []);
  return <span suppressHydrationWarning>{t ? `${t} in India` : "India"}</span>;
}

export default function Footer() {
  const box = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: box, offset: ["start end", "end end"] });
  const rise = useTransform(scrollYProgress, [0.35, 1], reduce ? ["0%", "0%"] : ["45%", "0%"]);

  return (
    <footer ref={box} className="relative isolate overflow-hidden bg-[#171716] text-[#eceae4]">
      <div className="mx-auto max-w-[1320px] px-5 pt-20 sm:px-8 md:pt-28">
        <div className="grid gap-14 lg:grid-cols-[1.25fr_1fr_1fr]">
          {/* big numbered links */}
          <nav aria-label="Footer">
            <p className="mb-6 font-mono text-[11px] uppercase tracking-[0.2em] text-[#7d7b74]">Explore</p>
            <ul>
              {PAGES.map((p, i) => (
                <li key={p.to} className="border-t border-white/[0.08] last:border-b">
                  <Link to={p.to} className="group flex items-baseline gap-4 py-3.5 text-[clamp(1.6rem,3vw,2.4rem)] leading-none tracking-[-0.03em] text-[#eceae4] transition-colors hover:text-[var(--fm-lime)]">
                    <span className="w-7 font-mono text-[11px] tracking-normal text-[#7d7b74]">0{i + 1}</span>
                    <span className="transition-transform duration-500 ease-[cubic-bezier(.16,1,.3,1)] group-hover:translate-x-2">{p.label}</span>
                    <ArrowUpRight size={22} className="ml-auto self-center opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* the family */}
          <div>
            <p className="mb-6 font-mono text-[11px] uppercase tracking-[0.2em] text-[#7d7b74]">The FrameMind family</p>
            <ul className="grid gap-2">
              {VENTURES.map((v) => (
                <li key={v.to}>
                  <Link to={v.to} className="group flex items-center gap-4 rounded-2xl border border-white/[0.07] bg-[#1f1f1d] px-4 py-3.5 transition-colors hover:border-white/20">
                    <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: v.dot }} />
                    <span className="flex-1">
                      <span className="block text-[16px] leading-tight">{v.name}</span>
                      <span className="block text-[13px] text-[#8f8d86]">{v.what}</span>
                    </span>
                    <ArrowUpRight size={16} className="text-[#7d7b74] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-white" />
                  </Link>
                </li>
              ))}
            </ul>
            <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-[14px] text-[#9a9890]">
              {MORE.map((m) => (
                <li key={m.to}>
                  <Link to={m.to} className="hover:text-white">
                    {m.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* contact */}
          <div className="flex flex-col">
            <p className="mb-6 font-mono text-[11px] uppercase tracking-[0.2em] text-[#7d7b74]">Talk to us</p>
            <a href="https://wa.me/918073087576" target="_blank" rel="noopener noreferrer" className="group block rounded-[22px] bg-[var(--fm-lime)] p-5 text-[#171716] transition-transform hover:-translate-y-0.5">
              <span className="flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.18em]">
                WhatsApp <ArrowUpRight size={16} className="transition-transform group-hover:rotate-45" />
              </span>
              <span className="mt-6 block text-[1.6rem] leading-none tracking-[-0.03em]">+91 80730 87576</span>
            </a>
            <a href="mailto:framemindaistudio@gmail.com" className="group mt-2 block rounded-[22px] border border-white/[0.08] bg-[#1f1f1d] p-5 transition-colors hover:border-white/20">
              <span className="flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.18em] text-[#9a9890]">
                Email <ArrowUpRight size={16} className="transition-transform group-hover:rotate-45" />
              </span>
              <span className="mt-6 block break-all text-[1.05rem] leading-tight">framemindaistudio@gmail.com</span>
            </a>
            <div className="mt-4 flex flex-wrap gap-2">
              {SOCIAL.map((s) => (
                <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" className="rounded-full border border-white/12 px-4 py-2 text-[13px] text-[#d6d4cd] transition-colors hover:border-[var(--fm-lime)]/60 hover:text-white">
                  {s.label}
                </a>
              ))}
            </div>
            <p className="mt-6 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-[#9a9890]">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--fm-lime)]" />
              <IndiaClock />
            </p>
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-3 border-t border-white/[0.08] py-5 font-mono text-[11px] text-[#7d7b74] sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} FrameMind AI Studio · MSME registered · India</span>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <Link to="/privacy" className="hover:text-white">Privacy</Link>
            <Link to="/shop/terms" className="hover:text-white">Store terms</Link>
            <Link to="/industries/terms" className="hover:text-white">App terms</Link>
            <button type="button" onClick={() => scrollToTarget(0)} className="inline-flex items-center gap-1.5 rounded-full bg-[#2a2a27] px-3 py-1.5 text-[#eceae4] hover:bg-[#34342f]" aria-label="Back to top">
              <ArrowUp size={12} /> Top
            </button>
          </div>
        </div>
      </div>

      {/* the giant wordmark, solid, rising out of the bottom edge */}
      <div aria-hidden="true" className="relative h-[15vw] overflow-hidden select-none">
        <motion.div style={{ y: rise }} className="absolute inset-x-0 top-0 flex items-start justify-center gap-[1.2vw]">
          <img src="/brand/kit/preview/framemind-icon-4k.webp" alt="" className="mt-[0.8vw] h-[12vw] w-[12vw]" />
          <p className="bg-[linear-gradient(180deg,#eceae4_10%,#8f8d86_70%,#3a3a36)] bg-clip-text text-[16.5vw] font-medium leading-[0.82] tracking-[-0.07em] text-transparent">
            FrameMind<span className="text-[var(--fm-lime)]">.</span>
          </p>
        </motion.div>
        <div className="fm-beam pointer-events-none absolute -top-1/2 left-[10%] h-[220%] w-[14%] rotate-[24deg] bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.10),transparent)] mix-blend-overlay" />
      </div>
    </footer>
  );
}
