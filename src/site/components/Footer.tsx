"use client";

import { ArrowUpRight } from "lucide-react";
import { Link } from "@/site/router";

/** FrameMind's other companies — words from each one's own page */
const VENTURES = [
  { to: "/360vue", name: "360VUE", what: "360° virtual tours, SkyVUE aerial 360° and Google Maps listings" },
  { to: "/vritta", name: "Vritta", what: "Activity records & newsletters for schools and colleges" },
  { to: "/jove", name: "JOVE", what: "Robotics & AI workshops for schools, Grades 1–10" },
];

const navLinks = [
  { to: "/", label: "Home" },
  { to: "/industries", label: "Industry Apps" },
  { to: "/pricing", label: "Services" },
  { to: "/real-estate", label: "Real Estate Platform" },
  { to: "/personal-coaching", label: "1:1 Coaching" },
  { to: "/shop", label: "Store" },
  { to: "/testimonials", label: "Testimonials" },
  { to: "/careers", label: "Careers" },
  { to: "/connect", label: "Connect" },
];

export default function Footer() {
  return (
    <footer className="bg-[#0D0D0D] text-[#F5F4F0]">
      <div className="max-w-6xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-3 gap-12">
        <div>
          <img src="/brand/kit/preview/framemind-horizontal-on-dark-transparent-4k.webp" alt="FrameMind AI Studio — Design · Software · AI Solutions" width={900} height={274} className="mb-4 h-auto w-[260px]" />
          <p className="text-sm text-[#888] leading-relaxed max-w-xs">
            We design and ship websites, brand systems, custom software, and automations for founders who want things actually built.
          </p>
        </div>

        <div>
          <p className="font-mono text-xs text-[#555] uppercase tracking-widest mb-4">Pages</p>
          <nav className="flex flex-col gap-2">
            {navLinks.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className="text-sm text-[#999] hover:text-[#F5F4F0] transition-colors"
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>

        <div>
          <p className="font-mono text-xs text-[#555] uppercase tracking-widest mb-4">Get in touch</p>
          <div className="flex flex-col gap-2">
            <a
              href="mailto:framemindaistudio@gmail.com"
              className="text-sm text-[#999] hover:text-[#F5F4F0] transition-colors"
            >
              framemindaistudio@gmail.com
            </a>
            <a
              href="https://www.linkedin.com/in/chinmay-rm/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-[#999] hover:text-[#F5F4F0] transition-colors"
            >
              LinkedIn
            </a>
            <a
              href="https://wa.me/918073087576"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-[#999] hover:text-[#F5F4F0] transition-colors"
            >
              WhatsApp
            </a>
            <a
              href="https://www.instagram.com/framemind_ai_studio/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-[#999] hover:text-[#F5F4F0] transition-colors"
            >
              Instagram
            </a>
          </div>
        </div>
      </div>

      {/* our other companies: clear buttons, not small print */}
      <div className="max-w-6xl mx-auto px-6 pb-12">
        <p className="font-mono text-xs text-[#555] uppercase tracking-widest mb-4">Our ventures</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {VENTURES.map((v) => (
            <Link
              key={v.to}
              to={v.to}
              className="group flex items-center justify-between gap-4 rounded-2xl border border-[#2a2a2a] bg-[#141414] px-5 py-4 transition-colors hover:border-[#C8F135] hover:bg-[#1a1a1a]"
            >
              <span className="min-w-0">
                <span className="block text-base font-semibold text-[#F5F4F0]">{v.name}</span>
                <span className="mt-0.5 block text-[13px] leading-snug text-[#999]">{v.what}</span>
              </span>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#333] text-[#F5F4F0] transition-colors group-hover:border-[#C8F135] group-hover:bg-[#C8F135] group-hover:text-[#0D0D0D]">
                <ArrowUpRight size={16} />
              </span>
            </Link>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-4 border-t border-[#1a1a1a] flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-mono text-xs text-[#444]">
          © {new Date().getFullYear()} FrameMind AI Studio
        </p>
        <nav aria-label="Policies" className="flex flex-wrap justify-end gap-x-5 gap-y-1 font-mono text-xs text-[#666]">
          <Link to="/privacy" className="hover:text-[#F5F4F0]">Privacy</Link>
          <Link to="/shop/terms" className="hover:text-[#F5F4F0]">Store terms &amp; refunds</Link>
          <Link to="/industries/terms" className="hover:text-[#F5F4F0]">App terms</Link>
          <Link to="/connect" className="hover:text-[#F5F4F0]">Contact</Link>
        </nav>
      </div>
    </footer>
  );
}
