"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ExternalLink, Eye, LogOut, Menu, Search, X, CloudOff, GitBranch, HardDrive, ChevronsLeft } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { navForRole } from "@/lib/hq/nav";
import { site } from "@/lib/site";
import { roleLabels } from "@/lib/hq/roles";
import { cn } from "@/lib/utils";
import { HqIcon } from "./Icon";
import type { PriceBook, RateCard } from "@/lib/pricebook/types";
import { HqProvider, useHq, type StoreInfo } from "./data";
import type { SessionUser } from "@/lib/hq/roles";

export function HqShell({ user, store, rates, book, children }: { user: SessionUser; store: StoreInfo; rates: RateCard | null; book: PriceBook | null; children: React.ReactNode }) {
  return (
    <HqProvider user={user} store={store} rates={rates} book={book}>
      <ShellInner>{children}</ShellInner>
    </HqProvider>
  );
}

function ShellInner({ children }: { children: React.ReactNode }) {
  const { user, store } = useHq();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const groups = useMemo(() => navForRole(user.role), [user.role]);

  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCollapsed(localStorage.getItem("fm-hq-collapsed") === "1");
    } catch {}
  }, []);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMobileOpen(false);
  }, [pathname]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((c) => {
      try {
        localStorage.setItem("fm-hq-collapsed", c ? "0" : "1");
      } catch {}
      return !c;
    });
  };

  const isActive = (href: string) => (href === "/hq" ? pathname === "/hq" : pathname === href || pathname.startsWith(href + "/"));

  async function logout() {
    await fetch("/api/hq/auth/logout", { method: "POST" });
    router.push("/hq/login");
    router.refresh();
  }

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className={cn("flex items-center justify-between gap-2 border-b border-paper/10 px-4 py-4", collapsed && "lg:justify-center lg:px-2")}>
        <Link href="/hq" className={cn("block text-[17px]", collapsed ? "lg:w-9" : "w-40")}>
          {collapsed ? <Logo variant="mark" tone="white" className="hidden lg:block" /> : null}
          <span className={cn(collapsed && "lg:hidden")}>
            <Logo variant="wordmark" tone="white" />
          </span>
        </Link>
        <span className={cn("annot rounded-full bg-lime px-2 py-0.5 text-[9px] font-semibold text-graphite", collapsed && "lg:hidden")}>HQ</span>
      </div>

      <nav className="hq-scroll flex-1 overflow-y-auto px-3 py-4" data-lenis-prevent>
        {groups.map((g) => (
          <div key={g.title} className="mb-5">
            <p className={cn("annot mb-2 px-2 text-[10px] text-paper/35", collapsed && "lg:hidden")}>{g.title}</p>
            <ul className="space-y-0.5">
              {g.items.map((item) => {
                const active = isActive(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      title={collapsed ? item.label : undefined}
                      className={cn(
                        "group relative flex items-center gap-3 rounded-[var(--radius-sm)] px-2.5 py-2 text-[13px] transition-colors",
                        active ? "bg-lime text-graphite" : "text-paper/65 hover:bg-paper/[0.07] hover:text-paper",
                        collapsed && "lg:justify-center lg:px-0",
                      )}
                    >
                      <HqIcon name={item.icon} className="size-[18px] shrink-0" />
                      <span className={cn("truncate font-medium", collapsed && "lg:hidden")}>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className={cn("border-t border-paper/10 p-3", collapsed && "lg:px-2")}>
        <div className={cn("flex items-center gap-3 rounded-[var(--radius-sm)] px-2 py-2", collapsed && "lg:justify-center lg:px-0")}>
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-lime font-mono text-[11px] font-semibold text-graphite">
            {user.name
              .split(" ")
              .map((p) => p[0])
              .slice(0, 2)
              .join("")}
          </span>
          <Link href="/hq/account" title="My account: your login and password" className={cn("min-w-0 flex-1 rounded hover:bg-paper/5", collapsed && "lg:hidden")}>
            <p className="truncate text-xs font-semibold text-paper">{user.name}</p>
            <p className="annot text-[9px] text-paper/45">{roleLabels[user.role]} · My account</p>
          </Link>
          <button onClick={logout} className={cn("rounded p-1.5 text-paper/50 hover:bg-paper/10 hover:text-paper", collapsed && "lg:hidden")} title="Sign out">
            <LogOut className="size-4" />
          </button>
        </div>
        <button onClick={toggleCollapsed} className="mt-1 hidden w-full items-center justify-center gap-2 rounded py-1.5 text-[11px] text-paper/40 hover:bg-paper/5 hover:text-paper/70 lg:flex">
          <ChevronsLeft className={cn("size-4 transition-transform", collapsed && "rotate-180")} />
          <span className={cn(collapsed && "lg:hidden")}>Collapse</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-dvh bg-paper">
      {/* desktop sidebar */}
      <aside className={cn("fixed inset-y-0 left-0 z-40 hidden bg-graphite transition-[width] duration-300 lg:block", collapsed ? "w-[68px]" : "w-64")}>
        <div className="relative h-full">{sidebar}</div>
      </aside>

      {/* mobile sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div className="absolute inset-0 bg-ink/50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMobileOpen(false)} />
            <motion.aside className="absolute inset-y-0 left-0 w-72 bg-graphite" initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.4 }}>
              <button onClick={() => setMobileOpen(false)} className="absolute right-3 top-4 z-10 rounded p-1.5 text-paper/70 hover:bg-paper/10" aria-label="Close menu">
                <X className="size-5" />
              </button>
              {sidebar}
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      <div className={cn("transition-[padding] duration-300", collapsed ? "lg:pl-[68px]" : "lg:pl-64")}>
        {/* top bar */}
        <header className="no-print sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-graphite/10 bg-paper/90 px-4 backdrop-blur-md sm:px-6">
          <button onClick={() => setMobileOpen(true)} className="rounded p-1.5 hover:bg-graphite/5 lg:hidden" aria-label="Open menu">
            <Menu className="size-5" />
          </button>
          <button
            onClick={() => setPaletteOpen(true)}
            className="flex h-9 w-full max-w-sm items-center gap-2 rounded-[var(--radius-sm)] border border-graphite/15 bg-paper-50 px-3 text-left text-sm text-blueprint hover:border-graphite/30"
          >
            <Search className="size-4" />
            <span className="flex-1 truncate">Jump to…</span>
            <kbd className="hidden rounded border border-graphite/15 px-1.5 font-mono text-[10px] sm:inline">Ctrl K</kbd>
          </button>
          <div className="ml-auto flex items-center gap-2">
            <StoreBadge store={store} />
            <a href={site.website} target="_blank" rel="noreferrer" className="hidden items-center gap-1.5 rounded-[var(--radius-sm)] px-2.5 py-1.5 text-xs font-medium text-charcoal hover:bg-graphite/5 sm:inline-flex">
              Studio website <ExternalLink className="size-3.5" />
            </a>
          </div>
        </header>

        {store.otherCompany ? (
          <div className="no-print border-b border-bad/40 bg-bad/10 px-6 py-2.5 text-xs text-bad">
            <strong>HQ is locked: GITHUB_REPO names JOVE&apos;s data repository.</strong> FrameMind and JOVE share the team but never their data, so this HQ reads and saves nothing there. Point GITHUB_REPO at FrameMind&apos;s own private data repository, then redeploy.
          </div>
        ) : store.publicRepo ? (
          <div className="no-print border-b border-bad/40 bg-bad/10 px-6 py-2.5 text-xs text-bad">
            <strong>Saving is blocked: the HQ data repository is PUBLIC.</strong> GITHUB_REPO ({store.repo}) can be read by anyone, so HQ will not write company data to it. Point GITHUB_REPO at your private data
            repository in Vercel → Project → Settings → Environment Variables, then redeploy.
          </div>
        ) : store.viewOnly ? (
          <div className="no-print border-b border-graphite/10 bg-graphite/[0.04] px-6 py-2 text-xs text-charcoal">
            <strong>View-only account.</strong> You can open, read and print. Only the founders can add or change anything.
          </div>
        ) : (
          !store.writable && (
            <div className="no-print border-b border-warn/30 bg-warn/10 px-6 py-2 text-xs text-warn">
              <strong>Read-only mode.</strong> Saving is disabled until GITHUB_TOKEN and GITHUB_REPO (your private data repository) are added in Vercel → Project → Settings → Environment Variables (see README).
            </div>
          )
        )}

        <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} groups={groups} onGo={(href) => router.push(href)} />
    </div>
  );
}

function StoreBadge({ store }: { store: StoreInfo }) {
  const map = {
    github: { Icon: GitBranch, label: "Synced to GitHub", cls: "text-ok" },
    local: { Icon: HardDrive, label: "Local files (dev)", cls: "text-info" },
    readonly: { Icon: CloudOff, label: "Read-only", cls: "text-warn" },
  } as const;
  const m = store.viewOnly ? { Icon: Eye, label: "View only", cls: "text-charcoal" } : map[store.mode];
  return (
    <span className={cn("hidden items-center gap-1.5 rounded-full border border-current/20 px-2.5 py-1 text-[11px] font-semibold md:inline-flex", m.cls)} title={store.repo ? `${store.repo}@${store.branch}` : undefined}>
      <m.Icon className="size-3.5" /> {m.label}
    </span>
  );
}

function CommandPalette({ open, onClose, groups, onGo }: { open: boolean; onClose: () => void; groups: ReturnType<typeof navForRole>; onGo: (href: string) => void }) {
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const items = useMemo(() => {
    const all = groups.flatMap((g) => g.items.map((i) => ({ ...i, group: g.title })));
    const s = q.trim().toLowerCase();
    return s ? all.filter((i) => `${i.label} ${i.description} ${i.group}`.toLowerCase().includes(s)) : all;
  }, [groups, q]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSel(0);
  }, [q, open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[95] flex items-start justify-center bg-ink/40 p-4 pt-[12vh] backdrop-blur-[2px]" onClick={onClose}>
      <div className="w-full max-w-xl overflow-hidden rounded-[var(--radius-lg)] border border-graphite/20 bg-paper shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 border-b border-graphite/10 px-4">
          <Search className="size-4 text-blueprint" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") onClose();
              if (e.key === "ArrowDown") setSel((s) => Math.min(items.length - 1, s + 1));
              if (e.key === "ArrowUp") setSel((s) => Math.max(0, s - 1));
              if (e.key === "Enter" && items[sel]) {
                onGo(items[sel].href);
                onClose();
              }
            }}
            placeholder="Search modules — projects, quotes, invoices, coaching…"
            className="h-12 flex-1 bg-transparent text-sm outline-none"
          />
        </div>
        <ul className="hq-scroll max-h-[50vh] overflow-y-auto p-2" data-lenis-prevent>
          {items.map((i, idx) => (
            <li key={i.href}>
              <button
                onMouseEnter={() => setSel(idx)}
                onClick={() => {
                  onGo(i.href);
                  onClose();
                }}
                className={cn("flex w-full items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2.5 text-left", idx === sel ? "bg-graphite text-paper" : "hover:bg-graphite/5")}
              >
                <HqIcon name={i.icon} className="size-4 shrink-0" />
                <span className="flex-1">
                  <span className="block text-sm font-medium">{i.label}</span>
                  <span className={cn("block text-xs", idx === sel ? "text-paper/60" : "text-blueprint")}>{i.description}</span>
                </span>
                <span className={cn("annot text-[9px]", idx === sel ? "text-paper/50" : "text-blueprint")}>{i.group}</span>
              </button>
            </li>
          ))}
          {!items.length && <li className="px-3 py-6 text-center text-sm text-blueprint">No match</li>}
        </ul>
      </div>
    </div>
  );
}
