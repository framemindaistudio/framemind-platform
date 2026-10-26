"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/components/hq/data";
import { EmptyState, PageHeader, Panel } from "@/components/hq/ui";
import { Notice } from "@/components/hq/sales/bits";
import { ChecksBadge, DevStatusBadge, DevTaskDrawer, type Rec, type RepoInfo } from "./DevTask";

interface Queue {
  me: { id: string; name: string; codeReviewer: boolean } | null;
  mine: (Rec & { projectTitle: string; repo: RepoInfo | null })[];
  review: (Rec & { projectTitle: string; repo: RepoInfo | null })[];
  recent: (Rec & { projectTitle: string; repo: RepoInfo | null })[];
}
const s = (v: unknown) => (v === undefined || v === null ? "" : String(v));

/** HQ → Code: your tasks with their start commands, the review queue, and what reached main lately. */
export function DevHome() {
  const [q, setQ] = useState<Queue | null>(null);
  const [err, setErr] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [team, setTeam] = useState<{ id: string; name: string; codeReviewer: boolean }[]>([]);

  const load = useCallback(
    () =>
      api<Queue>("/api/hq/dev?queue=1")
        .then(setQ)
        .catch((e) => setErr(e instanceof Error ? e.message : "Could not load")),
    [],
  );
  useEffect(() => {
    void load();
  }, [load]);

  const all = q ? [...q.mine, ...q.review, ...q.recent] : [];
  const current = all.find((t) => t.id === open);
  // the drawer needs the project's team to know who is who; fetched when a task is opened
  useEffect(() => {
    if (!current) return;
    api<{ team: { id: string; name: string; codeReviewer: boolean }[] }>(`/api/hq/dev?project=${encodeURIComponent(s(current.projectId))}`)
      .then((v) => setTeam(v.team))
      .catch(() => {});
  }, [current]);

  const list = (items: Queue["mine"], empty: string) =>
    !items.length ? (
      <p className="text-sm text-blueprint">{empty}</p>
    ) : (
      <ul className="divide-y divide-graphite/10">
        {items.map((t) => (
          <li key={t.id}>
            <button className="flex w-full flex-wrap items-center gap-2 py-2 text-left text-sm hover:bg-paper-50" onClick={() => setOpen(t.id)}>
              <code className="font-mono text-xs text-blueprint">{s(t.taskKey)}</code>
              <span className="min-w-40 flex-1 font-medium">{s(t.title).replace(/^[A-Z0-9]+-\d+:\s*/, "")}</span>
              <span className="text-xs text-blueprint">{t.projectTitle}</span>
              <ChecksBadge checks={t.checks} />
              <DevStatusBadge status={t.devStatus} />
            </button>
          </li>
        ))}
      </ul>
    );

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader eyebrow="Delivery" icon="GitBranch" title="Code" description="Your tasks with a one-step start in Claude Code, pull requests waiting for review, and what reached main. Create tasks and repositories from a project's Development tab." />
      {err && <Notice tone="bad">{err}</Notice>}
      {!q ? (
        <p className="text-sm text-blueprint">Loading…</p>
      ) : (
        <div className="space-y-5">
          <Panel title="My tasks" subtitle={q.me ? undefined : "Your login isn't linked to a Team & Payroll record, so no tasks can be yours yet."}>
            {list(q.mine, "Nothing assigned to you.")}
          </Panel>
          <Panel title="Waiting for review" subtitle="Pull requests that need a review or are ready to merge">
            {list(q.review, "Nothing waiting.")}
          </Panel>
          <Panel title="Recently merged">{q.recent.length ? list(q.recent, "") : <EmptyState icon="GitBranch" title="Nothing merged yet" description={<span>Start from a project&apos;s <Link className="underline" href="/hq/projects">Development tab</Link>.</span>} />}</Panel>
        </div>
      )}
      {current && <DevTaskDrawer task={current} repo={current.repo} team={team} onClose={() => setOpen(null)} onChanged={load} />}
    </div>
  );
}
