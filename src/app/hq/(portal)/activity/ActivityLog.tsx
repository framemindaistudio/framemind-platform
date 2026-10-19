"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ExternalLink, GitCommitHorizontal, RefreshCw, Search } from "lucide-react";
import { api, useHq } from "@/components/hq/data";
import { initials } from "@/components/hq/dashboard/metrics";
import { localDay, parseIso, useNow } from "@/components/hq/dashboard/time";
import { EmptyState, PageHeader } from "@/components/hq/ui";
import { Badge, type Tone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/form";
import { can, LEADERSHIP } from "@/lib/hq/roles";
import { cn } from "@/lib/utils";

interface Commit {
  sha: string;
  message: string;
  author: string;
  date: string;
  url?: string;
}

type Kind = "add" | "update" | "delete" | "other";

const KIND_META: Record<Kind, { label: string; tone: Tone }> = {
  add: { label: "Added", tone: "ok" },
  update: { label: "Updated", tone: "info" },
  delete: { label: "Deleted", tone: "bad" },
  other: { label: "Changed", tone: "neutral" },
};

/** Commit subjects are written by HQ as "Add client: Name", "Update invoice: FM/26-27/001", "Bulk update leads (5)", "Delete task: Name". */
function describe(message: string): { kind: Kind; noun: string; detail: string } {
  const m = /^(Add|Update|Delete|Bulk update)\s+([^:(]+?)(?:\s*:\s*(.+)|\s*\((\d+)\))?\s*$/i.exec(message.trim());
  if (!m) return { kind: "other", noun: "", detail: message.trim() };
  const verb = m[1].toLowerCase();
  const kind: Kind = verb === "add" ? "add" : verb === "delete" ? "delete" : "update";
  const detail = m[3] ?? (m[4] ? `${m[4]} records` : "");
  return { kind, noun: verb === "bulk update" ? `${m[2]} (bulk)` : m[2], detail };
}

const timeOf = (iso: string) => new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

function dayHeading(day: string, today: string | null) {
  if (today) {
    if (day === today) return "Today";
    const y = parseIso(today);
    y.setDate(y.getDate() - 1);
    const yKey = `${y.getFullYear()}-${String(y.getMonth() + 1).padStart(2, "0")}-${String(y.getDate()).padStart(2, "0")}`;
    if (day === yKey) return "Yesterday";
  }
  return parseIso(day).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

type Load = { status: "loading" } | { status: "error"; message: string } | { status: "ready"; commits: Commit[] };

export function ActivityLog() {
  const { user, store } = useHq();
  const now = useNow();
  const connected = store.mode === "github";
  const [nonce, setNonce] = useState(0);
  const [load, setLoad] = useState<Load>({ status: "loading" });
  const [q, setQ] = useState("");
  const [author, setAuthor] = useState("");
  const [kind, setKind] = useState<Kind | "">("");

  useEffect(() => {
    if (!connected) return;
    let alive = true;
    api<{ commits: Commit[] }>("/api/hq/history?limit=100")
      .then((j) => alive && setLoad({ status: "ready", commits: j.commits ?? [] }))
      .catch((e) => alive && setLoad({ status: "error", message: e instanceof Error ? e.message : "Could not load the history" }));
    return () => {
      alive = false;
    };
  }, [connected, nonce]);

  const commits = useMemo(() => (load.status === "ready" ? load.commits : []), [load]);
  const authors = useMemo(() => [...new Set(commits.map((c) => c.author).filter(Boolean))].sort((a, b) => a.localeCompare(b)), [commits]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return commits.filter((c) => {
      if (author && c.author !== author) return false;
      if (kind && describe(c.message).kind !== kind) return false;
      if (needle && !`${c.message} ${c.author} ${c.sha.slice(0, 7)}`.toLowerCase().includes(needle)) return false;
      return true;
    });
  }, [commits, q, author, kind]);

  const groups = useMemo(() => {
    const map = new Map<string, Commit[]>();
    for (const c of filtered) {
      const day = localDay(c.date);
      map.set(day, [...(map.get(day) ?? []), c]);
    }
    return [...map.entries()];
  }, [filtered]);

  const refresh = () => {
    setLoad({ status: "loading" });
    setNonce((n) => n + 1);
  };

  const header = (
    <PageHeader
      eyebrow="Audit trail"
      icon="History"
      title="Activity Log"
      description="Every change made in HQ: who made it, what changed and when. Each entry links to its commit on GitHub, where any earlier version can be restored."
      actions={
        connected ? (
          <Button variant="secondary" size="sm" className="h-9" onClick={refresh} disabled={load.status === "loading"}>
            <RefreshCw className={cn("size-4", load.status === "loading" && "animate-spin")} aria-hidden /> Refresh
          </Button>
        ) : undefined
      }
    />
  );

  /* ── not connected to GitHub: nothing to list, explain why ── */
  if (!connected) {
    const local = store.mode === "local";
    return (
      <div className="mx-auto max-w-[1100px]">
        {header}
        <div className="relative overflow-hidden rounded-[var(--radius-md)] border border-graphite/12 bg-paper-50 p-6 sm:p-8">
          <div className="bp-grid-fine pointer-events-none absolute inset-0 opacity-50" aria-hidden />
          <div className="relative grid gap-6 md:grid-cols-[auto_1fr]">
            <span className="grid size-14 place-items-center rounded-full border border-graphite/20 bg-paper">
              <GitCommitHorizontal className="size-6 text-charcoal" aria-hidden />
            </span>
            <div>
              <Badge tone={local ? "warn" : "bad"} dot>
                {local ? "Local files mode" : "Read-only mode"}
              </Badge>
              <h2 className="mt-3 text-lg font-bold tracking-tight">History appears once HQ is connected to GitHub</h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-charcoal">
                {local
                  ? "HQ is saving straight to the data/ files in this project folder, so there are no commits to list yet."
                  : "HQ can currently only read data, so nothing is being saved and there is no history to list."}{" "}
                When <code className="rounded bg-graphite/[0.07] px-1 font-mono text-xs">GITHUB_TOKEN</code> and <code className="rounded bg-graphite/[0.07] px-1 font-mono text-xs">GITHUB_REPO</code> are set on Vercel, every save becomes a commit in the
                private repository. This page then shows each one with the person&apos;s name, the time and a link to the exact change.
              </p>
              <ul className="mt-4 space-y-1.5 text-sm text-charcoal">
                <li className="flex gap-2">
                  <span className="font-mono text-xs text-blueprint">01</span> Create a private GitHub repository for HQ data (separate from the public code repository).
                </li>
                <li className="flex gap-2">
                  <span className="font-mono text-xs text-blueprint">02</span> Create a fine-grained token with Contents: Read and write on that repository only.
                </li>
                <li className="flex gap-2">
                  <span className="font-mono text-xs text-blueprint">03</span> Add GITHUB_TOKEN, GITHUB_REPO and GITHUB_BRANCH in Vercel, then redeploy.
                </li>
              </ul>
              {can(user, LEADERSHIP) && (
                <Link href="/hq/settings#system" className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-graphite underline underline-offset-4 hover:text-ink">
                  Check system status in Settings
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1100px]">
      {header}

      <div className="no-print mb-6 flex flex-wrap items-center gap-2" role="search" aria-label="Filter activity">
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-blueprint" aria-hidden />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search changes, people, commit ids…" aria-label="Search activity" className="pl-9" />
        </div>
        <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto">
          <Select value={author} onChange={(e) => setAuthor(e.target.value)} aria-label="Filter by person" className="sm:w-48">
            <option value="">Everyone</option>
            {authors.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </Select>
          <Select value={kind} onChange={(e) => setKind(e.target.value as Kind | "")} aria-label="Filter by type of change" className="sm:w-44">
            <option value="">All changes</option>
            <option value="add">Added</option>
            <option value="update">Updated</option>
            <option value="delete">Deleted</option>
            <option value="other">Other</option>
          </Select>
        </div>
        {load.status === "ready" && (
          <span className="text-xs text-blueprint" aria-live="polite">
            {filtered.length === commits.length ? `${commits.length} latest changes` : `${filtered.length} of ${commits.length} changes`}
          </span>
        )}
      </div>

      {load.status === "loading" && (
        <div className="space-y-3" aria-busy="true" aria-label="Loading history">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-[var(--radius-md)] border border-graphite/10 bg-paper-50" />
          ))}
        </div>
      )}

      {load.status === "error" && (
        <p role="alert" className="rounded border border-bad/30 bg-bad/10 px-4 py-3 text-sm text-bad">
          {load.message}
        </p>
      )}

      {load.status === "ready" && !commits.length && <EmptyState icon="History" title="No changes recorded yet" description="Edits made in HQ will appear here as soon as they are saved." />}

      {load.status === "ready" && commits.length > 0 && !filtered.length && <EmptyState icon="History" title="Nothing matches" description="Try a different search, person or type of change." />}

      {groups.length > 0 && (
        <div className="space-y-8">
          {groups.map(([day, items]) => (
            <section key={day} aria-labelledby={`day-${day}`}>
              <h2 id={`day-${day}`} className="mb-3 flex items-center gap-3 text-sm font-semibold text-graphite">
                {dayHeading(day, now?.today ?? null)}
                <span className="rounded-full bg-graphite/10 px-2 font-mono text-[10px] font-semibold text-charcoal">{items.length}</span>
                <span className="h-px flex-1 bg-graphite/10" aria-hidden />
              </h2>
              <ol className="relative ml-[7px] space-y-2.5 border-l border-dashed border-graphite/25 pl-6">
                {items.map((c) => {
                  const d = describe(c.message);
                  const meta = KIND_META[d.kind];
                  return (
                    <li key={c.sha} className="relative">
                      <span className="absolute -left-[31px] top-4 size-[11px] rounded-full border-2 border-paper bg-graphite" aria-hidden />
                      <div className="flex flex-col gap-2 rounded-[var(--radius-md)] border border-graphite/12 bg-paper-50 px-4 py-3 transition-colors hover:border-graphite/25 sm:flex-row sm:items-center sm:gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge tone={meta.tone} className="px-2 py-0 text-[10px]">
                              {meta.label}
                            </Badge>
                            {d.noun && <span className="text-xs font-medium capitalize text-charcoal">{d.noun}</span>}
                          </div>
                          <p className="mt-1 break-words text-sm font-semibold text-graphite">{d.detail || c.message}</p>
                        </div>
                        <div className="flex shrink-0 items-center gap-3 text-xs text-blueprint">
                          <span className="flex items-center gap-1.5" title={c.author}>
                            <span className="grid size-6 place-items-center rounded-full border border-graphite/20 bg-paper font-mono text-[9px] font-semibold text-charcoal" aria-hidden>
                              {initials(c.author)}
                            </span>
                            <span className="max-w-[9rem] truncate text-charcoal">{c.author}</span>
                          </span>
                          <time dateTime={c.date} className="font-mono tabular-nums">
                            {timeOf(c.date)}
                          </time>
                          {c.url ? (
                            <a
                              href={c.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 rounded px-1 py-0.5 font-mono text-[11px] text-charcoal hover:bg-graphite/5 hover:text-graphite focus-visible:outline-2 focus-visible:outline-graphite"
                              aria-label={`Open commit ${c.sha.slice(0, 7)} on GitHub (opens in a new tab)`}
                            >
                              {c.sha.slice(0, 7)} <ExternalLink className="size-3" aria-hidden />
                            </a>
                          ) : (
                            <span className="font-mono text-[11px]">{c.sha.slice(0, 7)}</span>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </section>
          ))}
        </div>
      )}

      {load.status === "ready" && commits.length >= 100 && <p className="mt-8 text-center text-xs text-blueprint">Showing the latest 100 changes. Older history is on GitHub in the repository&apos;s commit list.</p>}
    </div>
  );
}
