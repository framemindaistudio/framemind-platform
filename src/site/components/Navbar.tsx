"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react";
import { usePathname } from "next/navigation";
import { ArrowRight, Menu, X } from "lucide-react";
import { NavLink, Link } from "@/site/router";

/*
 * The navbar, after 13g.fr: the logo on the left and a compact cluster of pill links on the right,
 * floating over the page on a frosted graphite plate. It tucks away while you scroll down and comes back
 * as soon as you scroll up. On phones the menu opens as a full screen of large links.
 */

const navLinks = [
  { to: "/pricing", label: "Services" },
  { to: "/industries", label: "Industry apps" },
  { to: "/shop", label: "Store" },
  { to: "/team", label: "Team" },
];

const EASE = [0.16, 1, 0.3, 1] as const;

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [solid, setSolid] = useState(false);
  const path = usePathname();
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (y) => {
    const prev = scrollY.getPrevious() ?? 0;
    setSolid(y > 24);
    // smooth scrolling moves a pixel or two per frame, so compare direction, not distance
    if (y > prev && y > 240 && !open) setHidden(true);
    else if (y < prev) setHidden(false);
  });

  // close the phone menu when the page changes (adjusting state during render, not in an effect)
  const [lastPath, setLastPath] = useState(path);
  if (path !== lastPath) {
    setLastPath(path);
    setOpen(false);
  }
  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <motion.header
        className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-5 sm:pt-4"
        animate={{ y: hidden ? -110 : 0 }}
        transition={{ duration: 0.5, ease: EASE }}
      >
        <div
          className={`mx-auto flex max-w-[1320px] items-center justify-between gap-4 rounded-full border border-white/[0.07] bg-[#1c1c1a]/95 py-2 pl-3 pr-2 backdrop-blur-xl transition-shadow duration-500 sm:pl-4 ${
            solid || open ? "shadow-[0_14px_34px_-14px_rgba(0,0,0,0.55)]" : ""
          }`}
        >
          <Link to="/" className="flex items-center gap-2.5 whitespace-nowrap text-[15px] font-medium tracking-tight text-[#eceae4]" aria-label="FrameMind AI Studio, home">
            <img src="/brand/kit/preview/framemind-icon-4k.webp" alt="" width={34} height={34} className="h-[34px] w-[34px] shrink-0" />
            <span>
              FrameMind<span className="hidden text-[#9a9890] sm:inline"> AI Studio</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
            {navLinks.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `rounded-full px-4 py-2 text-[13px] uppercase tracking-[0.06em] transition-colors ${
                    isActive ? "bg-[#eceae4] text-[#171716]" : "bg-[#2a2a27] text-[#d6d4cd] hover:bg-[#34342f] hover:text-white"
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
            <Link to="/connect" className="group ml-1 inline-flex items-center gap-2 rounded-full bg-[#2a2a27] py-1 pl-1 pr-4 text-[13px] text-[#eceae4] transition-colors hover:bg-[#34342f]">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--fm-lime)] text-[#171716] transition-transform duration-500 group-hover:rotate-[-45deg]">
                <ArrowRight size={15} />
              </span>
              Let&apos;s talk
            </Link>
          </nav>

          <div className="flex items-center gap-2 lg:hidden">
            <Link to="/connect" className="inline-flex h-10 items-center rounded-full bg-[var(--fm-lime)] px-4 text-[13px] font-medium text-[#171716]">
              Let&apos;s talk
            </Link>
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[#2a2a27] text-[#eceae4]"
              onClick={() => setOpen((o) => !o)}
              aria-expanded={open}
              aria-controls="fm-menu"
              aria-label={open ? "Close menu" : "Open menu"}
            >
              {open ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </motion.header>

      <AnimatePresence>
        {open && (
          <motion.div
            id="fm-menu"
            className="fixed inset-0 z-40 flex flex-col bg-[#171716] px-6 pb-10 pt-28 text-[#eceae4] lg:hidden"
            initial={{ clipPath: "inset(0 0 100% 0)" }}
            animate={{ clipPath: "inset(0 0 0% 0)" }}
            exit={{ clipPath: "inset(0 0 100% 0)" }}
            transition={{ duration: 0.6, ease: EASE }}
          >
            <nav className="flex flex-col" aria-label="Menu">
              {[{ to: "/", label: "Home" }, ...navLinks, { to: "/connect", label: "Let's talk" }].map(({ to, label }, i) => (
                <motion.div key={to} initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6, ease: EASE, delay: 0.12 + i * 0.05 }}>
                  <NavLink
                    to={to}
                    end={to === "/"}
                    className={({ isActive }) =>
                      `flex items-center justify-between border-b border-white/10 py-4 text-[2rem] font-normal leading-none tracking-[-0.03em] ${isActive ? "text-[var(--fm-lime)]" : ""}`
                    }
                  >
                    {label}
                    <ArrowRight size={22} className="opacity-40" />
                  </NavLink>
                </motion.div>
              ))}
            </nav>
            <div className="mt-auto flex flex-col gap-1 font-mono text-[11px] uppercase tracking-[0.18em] text-[#9a9890]">
              <a href="https://wa.me/918073087576" target="_blank" rel="noopener noreferrer">WhatsApp +91 80730 87576</a>
              <a href="mailto:framemindaistudio@gmail.com">framemindaistudio@gmail.com</a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
