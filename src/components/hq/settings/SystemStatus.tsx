"use client";

import Link from "next/link";
import { useHq } from "@/components/hq/data";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import { CodeBlock, SettingsSection, StatusPill, Subhead } from "./shared";
import type { EnvInfo, SystemInfo } from "./useSystemInfo";

const MODE_LABEL = { github: "GitHub (live)", local: "Local files", readonly: "Read-only" } as const;

interface Check {
  key: keyof EnvInfo;
  name: string;
  required: boolean;
  what: string;
  /** shown when the variable is missing */
  fix: string;
  /** status wording when the check is about the value rather than presence: [ok, not ok] */
  labels?: [string, string];
}

const CHECKS: Check[] = [
  { key: "sessionSecret", name: "HQ_SESSION_SECRET", required: true, what: "Signs HQ login sessions.", fix: "Required in production. 32 or more random characters." },
  { key: "hqUsers", name: "HQ_USERS", required: true, what: "The team's logins.", fix: "Nobody can sign in until at least one account exists." },
  { key: "githubToken", name: "GITHUB_TOKEN", required: true, what: "Lets HQ commit changes to the private repository.", fix: "Without it HQ cannot save in production." },
  { key: "githubRepo", name: "GITHUB_REPO", required: true, what: "owner/repository of the PRIVATE data repo (never the public code repo).", fix: "Set together with GITHUB_TOKEN." },
  { key: "siteUrl", name: "NEXT_PUBLIC_SITE_URL", required: true, labels: ["Live domain", "Local address"], what: "Public address used in links, QR codes and sharing previews. Defaults to the HQ address in src/lib/site.ts.", fix: "It is set to a local address. Remove it, or set it to the live domain." },
  { key: "contactEmail", name: "NEXT_PUBLIC_CONTACT_EMAIL", required: false, what: "Shown on the public site and footer.", fix: "Hidden on the site until set." },
  { key: "contactPhone", name: "NEXT_PUBLIC_CONTACT_PHONE", required: false, what: "Shown on the public site and footer.", fix: "Hidden on the site until set." },
  { key: "whatsapp", name: "NEXT_PUBLIC_WHATSAPP", required: false, what: "Powers the WhatsApp buttons (digits with country code).", fix: "WhatsApp buttons stay hidden until set." },
];

export function SystemStatus({ sys }: { sys: SystemInfo }) {
  const { store } = useHq();
  const mode = store.mode;

  return (
    <SettingsSection id="system" index="06" title="System status" description="Where HQ keeps its data and whether the deployment is ready for the whole team.">
      {/* tiles */}
      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-[var(--radius-sm)] border border-graphite/12 bg-graphite/10 lg:grid-cols-4">
        {[
          { k: "Storage", v: MODE_LABEL[mode], tone: mode === "github" ? "ok" : mode === "local" ? "warn" : "bad" },
          { k: "Repository", v: store.repo ?? "Not connected" },
          { k: "Branch", v: store.branch },
          { k: "Saving", v: store.writable ? "Enabled" : "Disabled", tone: store.writable ? "ok" : "bad" },
        ].map((t) => (
          <div key={t.k} className="bg-paper-50 px-4 py-3">
            <dt className="annot text-[10px] text-blueprint">{t.k}</dt>
            <dd className="mt-1.5 min-w-0 break-words text-sm font-semibold text-graphite">
              {t.tone ? (
                <StatusPill tone={t.tone as "ok" | "warn" | "bad"}>{t.v}</StatusPill>
              ) : (
                <span className={cn(t.v === "Not connected" && "font-normal text-blueprint")}>{t.v}</span>
              )}
            </dd>
          </div>
        ))}
      </dl>

      {/* guidance by mode */}
      <div className="mt-5">
        {mode === "github" ? (
          <div className="rounded-[var(--radius-sm)] border border-ok/30 bg-ok/10 px-4 py-3 text-sm text-charcoal">
            <p className="font-semibold text-ok">Connected and saving.</p>
            <p className="mt-1">
              Every save is a commit to <span className="font-mono text-xs">{store.repo}</span> on <span className="font-mono text-xs">{store.branch}</span>, so there is a full history and nothing can be lost for good. Follow it in the{" "}
              <Link href="/hq/activity" className="font-semibold text-graphite underline underline-offset-2">
                Activity Log
              </Link>
              . Keep the repository private: it holds client and finance data.
            </p>
          </div>
        ) : (
          <div className={cn("rounded-[var(--radius-sm)] border px-4 py-4 text-sm text-charcoal", mode === "local" ? "border-warn/30 bg-warn/10" : "border-bad/30 bg-bad/10")}>
            <p className={cn("font-semibold", mode === "local" ? "text-warn" : "text-bad")}>{mode === "local" ? "Saving to local files" : "Read-only: nothing can be saved"}</p>
            <p className="mt-1">
              {mode === "local"
                ? "HQ is writing into the data/ folder of this project. That is fine on your own machine, but a deployed site cannot keep files, so connect GitHub before the team starts using it."
                : "This looks like a deployed site without GitHub credentials. HQ can show data but every save is blocked until it is connected."}
            </p>
            <ol className="mt-3 list-decimal space-y-1.5 pl-5">
              <li>Create a private GitHub repository for HQ data (separate from the public code repository) containing the data, OPERATIONS and vault folders.</li>
              <li>In GitHub, create a fine-grained token limited to that repository with Contents: Read and write.</li>
              <li>In Vercel, open Project → Settings → Environment Variables and add the three values below for Production and Preview.</li>
              <li>Redeploy, then come back here. Storage should read GitHub (live).</li>
            </ol>
            <CodeBlock className="mt-3" label="Environment variables" code={"GITHUB_TOKEN=github_pat_…\nGITHUB_REPO=your-account/framemind-hq-data\nGITHUB_BRANCH=main"} />
          </div>
        )}
      </div>

      {/* env checks */}
      <div className="mt-7">
        <Subhead>Environment checks</Subhead>
        {sys.status === "loading" && <div className="h-40 animate-pulse rounded-[var(--radius-sm)] bg-graphite/[0.05]" aria-hidden />}
        {sys.status === "error" && (
          <p role="alert" className="rounded border border-bad/30 bg-bad/10 px-3 py-2 text-sm text-bad">
            {sys.message}
          </p>
        )}
        {sys.status === "ready" && (
          <div className="hq-scroll overflow-x-auto rounded-[var(--radius-sm)] border border-graphite/12" data-lenis-prevent>
            <table className="w-full min-w-[620px] text-sm">
              <thead>
                <tr className="border-b border-graphite/12 bg-graphite/[0.035] text-left">
                  <th className="annot px-4 py-2.5 text-[10px] font-semibold text-blueprint">Variable</th>
                  <th className="annot px-4 py-2.5 text-[10px] font-semibold text-blueprint">Status</th>
                  <th className="annot px-4 py-2.5 text-[10px] font-semibold text-blueprint">What it does</th>
                </tr>
              </thead>
              <tbody>
                {CHECKS.map((c) => {
                  const ok = sys.env[c.key];
                  return (
                    <tr key={c.key} className="border-b border-graphite/[0.07] align-top last:border-0">
                      <td className="px-4 py-3 font-mono text-xs font-semibold text-graphite">
                        {c.name}
                        {!c.required && <Badge tone="outline" className="ml-2 px-1.5 py-0 text-[9px]">optional</Badge>}
                      </td>
                      <td className="px-4 py-3">{ok ? <StatusPill tone="ok">{c.labels?.[0] ?? "Set"}</StatusPill> : <StatusPill tone={c.required ? "bad" : "neutral"}>{c.labels?.[1] ?? "Missing"}</StatusPill>}</td>
                      <td className="px-4 py-3 text-charcoal">
                        {c.what}
                        {!ok && <span className="mt-0.5 block text-xs text-blueprint">{c.fix}</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-3 text-xs text-blueprint">Only whether each variable is set (or, for the site address, whether it is a live domain) is shown. Values are never sent to the browser.</p>
      </div>
    </SettingsSection>
  );
}
