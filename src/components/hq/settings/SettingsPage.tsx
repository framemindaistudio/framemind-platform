"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/hq/ui";
import { cn } from "@/lib/utils";
import { DataExport } from "./DataExport";
import { DeployChecklist } from "./DeployChecklist";
import { SettingsForm } from "./SettingsForm";
import { SystemStatus } from "./SystemStatus";
import { TeamAccounts } from "./TeamAccounts";
import { useSystemInfo } from "./useSystemInfo";

const SECTIONS = [
  { id: "company", label: "Company profile", n: "01" },
  { id: "tax", label: "Tax & bank", n: "02" },
  { id: "numbering", label: "Numbering", n: "03" },
  { id: "targets", label: "Targets", n: "04" },
  { id: "operations", label: "Operations", n: "05" },
  { id: "system", label: "System status", n: "06" },
  { id: "team", label: "Logins", n: "07" },
  { id: "data", label: "Data export", n: "08" },
  { id: "deploy", label: "Deployment", n: "09" },
] as const;

/** Highlights the nav entry for the section currently in the reading zone. */
function useActiveSection() {
  const [active, setActive] = useState<string>(SECTIONS[0].id);
  useEffect(() => {
    const els = SECTIONS.map((s) => document.getElementById(s.id)).filter((e): e is HTMLElement => !!e);
    if (!els.length || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-15% 0px -70% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  return active;
}

export function SettingsPage({ isFounder = false }: { isFounder?: boolean }) {
  const sys = useSystemInfo();
  const active = useActiveSection();

  return (
    <div className="mx-auto max-w-[1200px]">
      <PageHeader
        eyebrow="System"
        icon="Settings"
        title="Settings"
        description="Company details that print on every document, numbering, targets, how HQ stores data and who can sign in. Visible to founders and admins only."
      />

      <div className="lg:grid lg:grid-cols-[190px_minmax(0,1fr)] lg:gap-10">
        <nav aria-label="Settings sections" className="no-print sticky top-14 z-20 -mx-4 mb-6 border-b border-graphite/10 bg-paper/90 px-4 backdrop-blur-md sm:-mx-6 sm:px-6 lg:top-24 lg:mx-0 lg:mb-0 lg:self-start lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
          <ul className="no-scrollbar flex gap-1 overflow-x-auto py-2 lg:flex-col lg:gap-0.5 lg:overflow-visible lg:py-0">
            {SECTIONS.map((s) => (
              <li key={s.id} className="shrink-0">
                <a
                  href={`#${s.id}`}
                  aria-current={active === s.id ? "location" : undefined}
                  className={cn(
                    "flex items-center gap-2 whitespace-nowrap rounded-[var(--radius-sm)] px-3 py-1.5 text-sm transition-colors lg:border-l-2 lg:rounded-l-none lg:py-2",
                    active === s.id ? "bg-graphite font-semibold text-paper lg:border-graphite lg:bg-graphite/[0.06] lg:text-graphite" : "text-charcoal hover:bg-graphite/5 hover:text-graphite lg:border-transparent",
                  )}
                >
                  <span className={cn("hidden font-mono text-[10px] lg:inline", active === s.id ? "text-graphite/60" : "text-blueprint")}>{s.n}</span>
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="min-w-0 space-y-10">
          <SettingsForm>
            <SystemStatus sys={sys} />
            <TeamAccounts sys={sys} isFounder={isFounder} />
            <DataExport />
            <DeployChecklist sys={sys} />
          </SettingsForm>
        </div>
      </div>
    </div>
  );
}
