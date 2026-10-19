"use client";

import { useMemo, useSyncExternalStore } from "react";
import { Check } from "lucide-react";
import { useHq } from "@/components/hq/data";
import { cn } from "@/lib/utils";
import { SettingsSection } from "./shared";
import type { SystemInfo } from "./useSystemInfo";

/* Manual ticks are a per-browser convenience: kept in localStorage (with an in-memory fallback). */
const KEY = "fm.hq.deploy-checklist.v1";
let memory = "";
const listeners = new Set<() => void>();

function readRaw() {
  try {
    return window.localStorage.getItem(KEY) ?? memory;
  } catch {
    return memory;
  }
}
function writeRaw(v: string) {
  memory = v;
  try {
    window.localStorage.setItem(KEY, v);
  } catch {
    /* storage blocked: the in-memory copy still updates this session */
  }
  listeners.forEach((l) => l());
}
function subscribe(cb: () => void) {
  listeners.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
}

interface Item {
  id: string;
  label: string;
  detail?: string;
  /** present for items HQ can detect itself: true / false, or null while still loading */
  auto?: boolean | null;
}

export function DeployChecklist({ sys }: { sys: SystemInfo }) {
  const { store } = useHq();
  const raw = useSyncExternalStore(subscribe, readRaw, () => "");
  const ticks = useMemo<Record<string, boolean>>(() => {
    try {
      return raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
    } catch {
      return {};
    }
  }, [raw]);

  const ready = sys.status === "ready";
  const env = ready ? sys.env : null;
  const users = ready ? sys.users : null;

  const groups: { title: string; items: Item[] }[] = [
    {
      title: "Accounts & access",
      items: [
        { id: "repo", label: "Private GitHub repository connected", detail: "Storage reads GitHub (live) in System status.", auto: store.mode === "github" },
        { id: "secret", label: "HQ_SESSION_SECRET set (32+ random characters)", auto: env ? env.sessionSecret : null },
        { id: "founders", label: "Both founders have a login", detail: "Add accounts in Team accounts.", auto: users ? users.filter((u) => u.role === "founder").length >= 2 : null },
        { id: "hashed", label: "Every password is stored as a sha256 hash", auto: users ? users.length > 0 && users.every((u) => u.passwordHashed) : null },
        { id: "signin", label: "Each founder has signed in on the live site" },
      ],
    },
    {
      title: "Deployment",
      items: [
        { id: "vercel", label: "Vercel project imported from the repository", detail: "Framework preset: Next.js. Production branch: main." },
        { id: "envs", label: "Environment variables added for Production and Preview", detail: "Redeploy after every change to a variable." },
        { id: "siteurl", label: "Site address points to the live domain", detail: "Set NEXT_PUBLIC_SITE_URL to the address HQ is deployed at, so links in emails and papers to sign work.", auto: env ? env.siteUrl : null },
        { id: "domain", label: "Custom domain connected and HTTPS working" },
        { id: "contact", label: "Studio contact email and phone set", detail: "Printed on papers sent to clients to sign.", auto: env ? env.contactEmail && env.contactPhone : null },
      ],
    },
    {
      title: "Before the first client",
      items: [
        { id: "enquiry", label: "A test enquiry from the studio website appears in Enquiries" },
        { id: "quote", label: "A test quote prints cleanly and the bank details on it are right" },
        { id: "profile", label: "Company profile, tax and bank details saved above" },
        { id: "clean", label: "Test records deleted from the CRM, quotes, projects and invoices" },
        { id: "backup", label: "A backup downloaded from Data export" },
      ],
    },
  ];

  const all = groups.flatMap((g) => g.items);
  const isDone = (i: Item) => (i.auto !== undefined ? i.auto === true : !!ticks[i.id]);
  const doneCount = all.filter(isDone).length;

  return (
    <SettingsSection id="deploy" index="09" title="Deployment checklist" description="Everything to confirm before the whole team and the public rely on HQ. Items marked Detected tick themselves; the rest are yours to tick off.">
      <div className="mb-5 flex items-center gap-4">
        <div
          className="h-2 flex-1 overflow-hidden rounded-full bg-graphite/10"
          role="progressbar"
          aria-label="Deployment checklist progress"
          aria-valuemin={0}
          aria-valuemax={all.length}
          aria-valuenow={doneCount}
        >
          <div className="h-full rounded-full bg-graphite transition-[width] duration-500" style={{ width: `${(doneCount / all.length) * 100}%` }} />
        </div>
        <span className="tabular text-sm font-semibold text-graphite">
          {doneCount} / {all.length}
        </span>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {groups.map((g) => (
          <div key={g.title}>
            <h3 className="annot mb-3 text-[10px] text-blueprint">{g.title}</h3>
            <ul className="space-y-1">
              {g.items.map((i) => {
                const done = isDone(i);
                const auto = i.auto !== undefined;
                return (
                  <li key={i.id}>
                    {auto ? (
                      <div className="flex items-start gap-2.5 rounded-[var(--radius-sm)] px-2 py-2">
                        <span className={cn("mt-0.5 grid size-4 shrink-0 place-items-center rounded-full", done ? "bg-ok text-white" : "border border-graphite/30")} aria-hidden>
                          {done && <Check className="size-3" strokeWidth={3} />}
                        </span>
                        <span className="min-w-0 text-sm">
                          <span className={cn(done ? "text-graphite" : "text-charcoal")}>{i.label}</span>
                          <span className="ml-2 align-middle text-[9px] font-semibold uppercase tracking-wider text-blueprint">{i.auto === null ? "Checking" : "Detected"}</span>
                          {i.detail && <span className="mt-0.5 block text-xs text-blueprint">{i.detail}</span>}
                          <span className="sr-only">{done ? "Done" : "Not done yet"}</span>
                        </span>
                      </div>
                    ) : (
                      <label className="flex cursor-pointer items-start gap-2.5 rounded-[var(--radius-sm)] px-2 py-2 transition-colors hover:bg-graphite/[0.04]">
                        <input
                          type="checkbox"
                          className="peer sr-only"
                          checked={done}
                          onChange={(e) => writeRaw(JSON.stringify({ ...ticks, [i.id]: e.target.checked }))}
                        />
                        <span className={cn("mt-0.5 grid size-4 shrink-0 place-items-center rounded-[4px] border transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-graphite", done ? "border-graphite bg-graphite text-paper" : "border-graphite/35 bg-paper")} aria-hidden>
                          {done && <Check className="size-3" strokeWidth={3} />}
                        </span>
                        <span className="min-w-0 text-sm">
                          <span className={cn(done ? "text-blueprint line-through decoration-graphite/30" : "text-graphite")}>{i.label}</span>
                          {i.detail && <span className="mt-0.5 block text-xs text-blueprint">{i.detail}</span>}
                        </span>
                      </label>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-dashed border-graphite/15 pt-4 text-xs text-blueprint">
        <span>Your ticks are remembered in this browser only; detected items update from the live deployment.</span>
        {Object.keys(ticks).length > 0 && (
          <button type="button" onClick={() => writeRaw("")} className="font-semibold text-graphite underline underline-offset-4 hover:text-ink">
            Clear my ticks
          </button>
        )}
      </div>
    </SettingsSection>
  );
}
