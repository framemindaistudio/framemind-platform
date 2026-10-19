"use client";

import { useState } from "react";
import { NavLink, Link } from "@/site/router";
import { Menu, X } from "lucide-react";

const navLinks = [
  { to: "/", label: "Home" },
  { to: "/pricing", label: "Services" },
  { to: "/vritta", label: "Vritta" },
  { to: "/jove", label: "JOVE" },
  { to: "/personal-coaching", label: "1:1 Coaching" },
  { to: "/testimonials", label: "Testimonials" },
  { to: "/team", label: "Team" },
  { to: "/connect", label: "Let's Talk" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-background border-b border-border">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="font-semibold text-lg tracking-tight">
          FrameMind AI Studio<span className="text-[#C8F135]">.</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map(({ to, label }) =>
            to === "/connect" ? (
              <NavLink
                key={to}
                to={to}
                className="bg-[#C8F135] text-[#0D0D0D] text-sm font-medium px-4 py-2 rounded-sm hover:bg-[#b8e020] transition-colors"
              >
                {label}
              </NavLink>
            ) : (
              <NavLink
                key={to}
                to={to}
                end={to === "/"}
                className={({ isActive }) =>
                  `text-sm transition-colors ${
                    isActive
                      ? "text-foreground font-medium"
                      : "text-muted-foreground hover:text-foreground"
                  }`
                }
              >
                {label}
              </NavLink>
            )
          )}
        </nav>


        {/* Mobile toggle */}
        <button
          className="md:hidden p-2 -mr-2"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-border bg-background px-6 py-4 flex flex-col gap-4">
          {navLinks.map(({ to, label }) =>
            to === "/connect" ? (
              <NavLink
                key={to}
                to={to}
                onClick={() => setOpen(false)}
                className="bg-[#C8F135] text-[#0D0D0D] text-sm font-medium px-4 py-2 rounded-sm text-center hover:bg-[#b8e020] transition-colors"
              >
                {label}
              </NavLink>
            ) : (
              <NavLink
                key={to}
                to={to}
                end={to === "/"}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `text-sm py-1 transition-colors ${
                    isActive ? "text-foreground font-medium" : "text-muted-foreground"
                  }`
                }
              >
                {label}
              </NavLink>
            )
          )}
        </div>
      )}
    </header>
  );
}
