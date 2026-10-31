"use client";

import { Link } from "@/site/router";

const navLinks = [
  { to: "/", label: "Home" },
  { to: "/pricing", label: "Services" },
  { to: "/vritta", label: "Vritta" },
  { to: "/jove", label: "JOVE" },
  { to: "/360vue", label: "360VUE" },
  { to: "/personal-coaching", label: "1:1 Coaching" },
  { to: "/testimonials", label: "Testimonials" },
  { to: "/careers", label: "Careers" },
  { to: "/connect", label: "Connect" },
];

export default function Footer() {
  return (
    <footer className="bg-[#0D0D0D] text-[#F5F4F0]">
      <div className="max-w-6xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-3 gap-12">
        <div>
          <p className="font-semibold text-lg tracking-tight mb-2">
            FrameMind AI Studio<span className="text-[#C8F135]">.</span>
          </p>
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
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-4 border-t border-[#1a1a1a] flex items-center justify-between">
        <p className="font-mono text-xs text-[#444]">
          © {new Date().getFullYear()} FrameMind AI Studio
        </p>
      </div>
    </footer>
  );
}
