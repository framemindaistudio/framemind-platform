"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { ArrowUp, ArrowUpRight } from "lucide-react";
import { Link } from "@/site/router";
import { scrollToTarget } from "@/site/components/SmoothScroll";

/*
 * The footer, after the "Light Beam Footer with Giant Wordmark" from 21st.dev, rebuilt in the studio's matte graphite:
 * a slow, faint shaft of light crosses the link columns and the FRAMEMIND wordmark, which is cropped by the bottom edge
 * and rises into place as you reach the end of the page. A soft light follows the pointer on desktop.
 */

const COLUMNS = [
  {
    title: "Studio",
    links: [
      { to: "/pricing", label: "Services & prices" },
      { to: "/industries", label: "Industry apps" },
      { to: "/real-estate", label: "Real estate platform" },
      { to: "/personal-coaching", label: "1:1 AI coaching" },
      { to: "/testimonials", label: "Testimonials" },
    ],
  },
  {
    title: "Company",
    links: [
      { to: "/team", label: "Team" },
      { to: "/careers", label: "Careers" },
      { to: "/shop", label: "FrameMind Store" },
      { to: "/connect", label: "Contact" },
    ],
  },
  {
    title: "Our ventures",
    links: [
      { to: "/360vue", label: "360VUE · virtual tours" },
      { to: "/vritta", label: "Vritta · school records" },
      { to: "/jove", label: "JOVE · robotics workshops" },
    ],
  },
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
  return <span suppressHydrationWarning>{t ? `${t} IST` : "IST"}</span>;
}

export default function Footer() {
  const box = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: box, offset: ["start end", "end end"] });
  const rise = useTransform(scrollYProgress, [0.2, 1], reduce ? ["0%", "0%"] : ["38%", "0%"]);

  const onMove = (e: React.PointerEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
  };

  return (
    <footer ref={box} onPointerMove={onMove} className="relative isolate overflow-hidden bg-[#141413] text-[#eceae4]">
      {/* the light shaft and the pointer light */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="fm-beam absolute -top-1/2 left-[18%] h-[220%] w-[22%] rotate-[24deg] bg-[linear-gradient(90deg,transparent,rgba(236,234,228,0.055)_45%,rgba(200,241,53,0.05)_55%,transparent)] blur-2xl" />
        <div className="absolute inset-0 hidden bg-[radial-gradient(420px_circle_at_var(--mx,50%)_var(--my,40%),rgba(236,234,228,0.05),transparent_70%)] md:block" />
      </div>

      <div className="mx-auto max-w-[1320px] px-5 pt-20 sm:px-8 md:pt-28">
        <div className="grid gap-12 md:grid-cols-[1.3fr_2fr]">
          <div>
            <p className="max-w-sm text-[1.7rem] leading-[1.15] tracking-[-0.02em]">
              Websites, software and AI for businesses that want things <span className="text-[var(--fm-lime)]">actually built.</span>
            </p>
            <a href="mailto:framemindaistudio@gmail.com" className="mt-8 inline-flex items-center gap-2 border-b border-white/20 pb-1 text-sm text-[#d6d4cd] transition-colors hover:border-[var(--fm-lime)] hover:text-white">
              framemindaistudio@gmail.com <ArrowUpRight size={14} />
            </a>
            <p className="mt-6 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-[#9a9890]">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--fm-lime)]" />
              India · <IndiaClock />
            </p>
          </div>

          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3">
            {COLUMNS.map((c) => (
              <div key={c.title}>
                <p className="mb-5 font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--fm-gold)]">{c.title}</p>
                <ul className="flex flex-col gap-3">
                  {c.links.map((l) => (
                    <li key={l.to}>
                      <Link to={l.to} className="text-[15px] text-[#bcbab2] transition-colors hover:text-white">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-5 border-t border-white/10 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {SOCIAL.map((s) => (
              <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" className="rounded-full border border-white/12 bg-white/[0.03] px-4 py-2 text-[13px] text-[#d6d4cd] backdrop-blur transition-colors hover:border-[var(--fm-lime)]/60 hover:text-white">
                {s.label}
              </a>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-[11px] text-[#7d7b74]">
            <span>© {new Date().getFullYear()} FrameMind AI Studio · MSME registered</span>
            <Link to="/privacy" className="hover:text-white">Privacy</Link>
            <Link to="/shop/terms" className="hover:text-white">Store terms</Link>
            <Link to="/industries/terms" className="hover:text-white">App terms</Link>
            <button type="button" onClick={() => scrollToTarget(0)} className="inline-flex items-center gap-1.5 rounded-full bg-[#2a2a27] px-3 py-1.5 text-[#eceae4] hover:bg-[#34342f]" aria-label="Back to top">
              <ArrowUp size={12} /> Top
            </button>
          </div>
        </div>
      </div>

      {/* the giant wordmark, cropped by the bottom edge */}
      <div aria-hidden="true" className="relative -mt-2 h-[17vw] overflow-hidden select-none">
        <motion.p
          style={{ y: rise }}
          className="absolute inset-x-0 top-0 text-center text-[21.5vw] font-medium leading-[0.8] tracking-[-0.065em] text-transparent [-webkit-text-stroke:1px_rgba(236,234,228,0.14)] [background:linear-gradient(180deg,rgba(236,234,228,0.16),rgba(236,234,228,0.02)_80%)] [-webkit-background-clip:text] [background-clip:text]"
        >
          FrameMind
        </motion.p>
      </div>
    </footer>
  );
}
