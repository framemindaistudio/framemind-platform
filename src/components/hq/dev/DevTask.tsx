"use client";

import { useState } from "react";
import { CheckCircle2, CircleDashed, Copy, ExternalLink, GitBranch, GitMerge, GitPullRequest, RefreshCw, XCircle } from "lucide-react";
import { Badge, type Tone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Overlay";
import { Textarea } from "@/components/ui/form";
import { api, useHq } from "@/components/hq/data";
import { claudeReviewOf, DEV_STATUS_LABELS, mergeProblem, type DevStatus, type Review } from "@/lib/dev/rules";
import { formatDateTime } from "@/lib/utils";

export type Rec = Record<string, unknown> & { id: string };
export interface RepoInfo {
  owner: string;
  name: string;
  url: string;
  defaultBranch: string;
}

const s = (v: unknown) => (v === undefined || v === null ? "" : String(v));
const TONE: Record<DevStatus, Tone> = { todo: "outline", "in-progress": "info", "in-review": "warn", changes: "bad", approved: "ok", merged: "dark", closed: "neutral" };

export function DevStatusBadge({ status }: { status: unknown }) {
  const st = (s(status) || "todo") as DevStatus;
  return <Badge tone={TONE[st] ?? "outline"}>{DEV_STATUS_LABELS[st] ?? st}</Badge>;
}

export function ChecksBadge({ checks }: { checks: unknown }) {
  const st = s((checks as Rec | undefined)?.state) || "none";
  if (st === "success") return <Badge tone="ok">Checks passed</Badge>;
  if (st === "failure") return <Badge tone="bad">Checks failed</Badge>;
  if (st === "pending") return <Badge tone="warn">Checks running</Badge>;
  return null;
}

/** The commands a developer pastes into a terminal to start the task in Claude Code (bash and PowerShell alike). */
export function startCommand(task: Rec, repo: RepoInfo) {
  const key = s(task.taskKey);
  const title = s(task.title).replace(/^[A-Z0-9]+-\d+:\s*/, "").replace(/"/g, "'");
  return [`git clone ${repo.url}.git   # first time only`, `cd ${repo.name}; git fetch origin; git switch ${s(task.branch)}`, `claude "Work on ${key}: ${title}. Read CLAUDE.md, then the ${key} section of docs/Tasks.md, and implement it on this branch. Commit with '${key}: ...' messages and push when the acceptance criteria are met."`].join("\n");
}

/** One development task: start command, pull request, checks, reviews, and the merge gate. */
export function DevTaskDrawer({ task, repo, team, onClose, onChanged }: { task: Rec; repo: RepoInfo | null; team: { id: string; name: string; codeReviewer: boolean }[]; onClose: () => void; onChanged: () => Promise<unknown> | void }) {
  const { user } = useHq();
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState<{ tone: "ok" | "bad"; text: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const leader = ["founder", "admin"].includes(user.role);
  const me = team.find((m) => (user.teamId ? m.id === user.teamId : m.name.toLowerCase() === user.name.toLowerCase()));
  const mine = !!me && me.id === s(task.assigneeId);
  const pr = task.pr as Rec | undefined;
  const reviews = (Array.isArray(task.reviews) ? task.reviews : []) as Review[];
  const checks = task.checks as { state?: string; items?: { name: string; state: string; url: string }[] } | undefined;
  const status = s(task.devStatus) as DevStatus;
  const open = !!pr?.number && s(pr.state) === "open" && pr.merged !== true;
  const canReview = open && (leader || me?.codeReviewer === true) && !mine;
  const blocked = mergeProblem({ claudeReview: claudeReviewOf(checks?.items), actorRole: user.role, actorTeamId: me?.id, assigneeId: s(task.assigneeId), pr: pr ? { state: s(pr.state), merged: pr.merged === true, mergeable: (pr.mergeable as boolean | null) ?? null, headSha: s(pr.headSha) } : null, checks: (checks?.state ?? "none") as "success", reviews });

  const act = async (action: string, extra: Record<string, unknown>, ok: string) => {
    setBusy(action);
    setMsg(null);
    try {
      // founders and admins use the main API; everyone else their own (it checks what they may do)
      await api(leader ? "/api/hq/dev" : "/api/hq/dev/me", { method: "POST", body: JSON.stringify({ action, task: task.id, ...extra }) });
      setMsg({ tone: "ok", text: ok });
      await onChanged();
    } catch (e) {
      setMsg({ tone: "bad", text: e instanceof Error ? e.message : "That did not work." });
    } finally {
      setBusy("");
    }
  };

  return (
    <Drawer open onClose={onClose} width="max-w-3xl" title={`${s(task.taskKey)} — ${s(task.title).replace(/^[A-Z0-9]+-\d+:\s*/, "")}`} subtitle={<DevStatusBadge status={status} />}>
      <div className="space-y-5 text-sm">
        {msg && <div className={`rounded-[var(--radius-sm)] border px-3 py-2 ${msg.tone === "ok" ? "border-ok/30 bg-ok/10 text-ok" : "border-bad/30 bg-bad/10 text-bad"}`}>{msg.text}</div>}

        <div className="grid gap-x-6 gap-y-1 sm:grid-cols-2">
          <p>
            <span className="text-blueprint">Assignee:</span> {s(task.assignee) || "—"}
          </p>
          <p>
            <span className="text-blueprint">Due:</span> {s(task.dueDate) || "—"}
          </p>
          <p className="flex items-center gap-1.5 sm:col-span-2">
            <GitBranch className="size-3.5 text-blueprint" />
            <code className="font-mono text-xs">{s(task.branch)}</code>
            {repo && (
              <a className="text-xs underline" href={`${repo.url}/tree/${s(task.branch)}`} target="_blank" rel="noreferrer">
                on GitHub
              </a>
            )}
          </p>
          {task.lastCommit ? (
            <p className="sm:col-span-2">
              <span className="text-blueprint">Last commit:</span> {s((task.lastCommit as Rec).message)} · {s((task.lastCommit as Rec).author)} · {s(task.commits)} commit{Number(task.commits) === 1 ? "" : "s"}
            </p>
          ) : null}
        </div>

        {s(task.description) && <p className="whitespace-pre-line text-charcoal">{s(task.description)}</p>}
        {s(task.acceptance) && (
          <div>
            <p className="mb-1 text-xs font-semibold text-blueprint">Acceptance criteria</p>
            <ul className="list-disc space-y-0.5 pl-5">
              {s(task.acceptance)
                .split(/\n+/)
                .filter(Boolean)
                .map((l, i) => (
                  <li key={i}>{l.replace(/^[-*]\s*/, "")}</li>
                ))}
            </ul>
          </div>
        )}

        {repo && !["merged", "closed"].includes(status) && (
          <div className="rounded-[var(--radius-sm)] bg-graphite p-3 text-paper">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-lime">Start coding in Claude Code</p>
              <button
                className="inline-flex items-center gap-1 text-xs text-paper/80 hover:text-paper"
                onClick={() => {
                  void navigator.clipboard.writeText(startCommand(task, repo));
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
              >
                <Copy className="size-3.5" /> {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-paper/90">{startCommand(task, repo)}</pre>
            <p className="mt-2 text-[11px] text-paper/60">Paste into a terminal. Claude Code opens on the task&apos;s branch with the project&apos;s rules and the task loaded.</p>
          </div>
        )}

        <section className="rounded-[var(--radius-sm)] border border-graphite/10 p-3">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <GitPullRequest className="size-4" />
            <span className="font-semibold">Pull request</span>
            {pr?.number ? (
              <a className="inline-flex items-center gap-1 underline" href={s(pr.url)} target="_blank" rel="noreferrer">
                #{s(pr.number)} <ExternalLink className="size-3" />
              </a>
            ) : (
              <span className="text-blueprint">not opened yet</span>
            )}
            {pr?.number ? <span className="text-xs text-blueprint">{s(pr.changedFiles)} files · +{s(pr.additions)} −{s(pr.deletions)}</span> : null}
            <ChecksBadge checks={checks} />
            <span className="ml-auto flex gap-1">
              {pr?.number ? (
                <Button size="sm" variant="ghost" disabled={!!busy} onClick={() => void act("refresh", {}, "Up to date with GitHub.")}>
                  <RefreshCw className="size-3.5" /> Refresh
                </Button>
              ) : (
                (leader || mine) &&
                !["merged", "closed"].includes(status) && (
                  <Button size="sm" disabled={!!busy} onClick={() => void act("open", {}, "Pull request opened — reviewers are notified in HQ.")}>
                    Open pull request
                  </Button>
                )
              )}
            </span>
          </div>
          {checks?.items?.length ? (
            <ul className="space-y-1">
              {checks.items.map((c, i) => (
                <li key={i} className="flex items-center gap-2 text-xs">
                  {c.state === "success" ? <CheckCircle2 className="size-3.5 text-ok" /> : c.state === "failure" ? <XCircle className="size-3.5 text-bad" /> : <CircleDashed className={`size-3.5 ${c.state === "skipped" ? "text-blueprint" : "text-warn"}`} />}
                  <a className="hover:underline" href={c.url} target="_blank" rel="noreferrer">
                    {c.name}
                  </a>
                </li>
              ))}
            </ul>
          ) : pr?.number ? (
            <p className="text-xs text-blueprint">No checks reported yet.</p>
          ) : null}
          {s(task.previewUrl) && (
            <a className="mt-2 inline-flex items-center gap-1 text-xs underline" href={s(task.previewUrl)} target="_blank" rel="noreferrer">
              Preview deployment <ExternalLink className="size-3" />
            </a>
          )}
        </section>

        <section>
          <p className="mb-1 text-xs font-semibold text-blueprint">Reviews</p>
          {reviews.length ? (
            <ul className="space-y-1.5">
              {reviews
                .slice()
                .reverse()
                .map((r, i) => (
                  <li key={i}>
                    <Badge tone={r.decision === "approved" ? "ok" : "bad"}>{r.decision === "approved" ? "Approved" : "Changes"}</Badge> <strong>{r.by}</strong> <span className="text-xs text-blueprint">· {formatDateTime(r.at)} · commit {r.sha.slice(0, 7)}</span>
                    {r.sha !== s(pr?.headSha) && <span className="ml-1 text-xs text-warn">(older commit)</span>}
                    {r.comment && <p className="mt-0.5 whitespace-pre-line text-charcoal">{r.comment}</p>}
                  </li>
                ))}
            </ul>
          ) : (
            <p className="text-blueprint">No reviews yet.</p>
          )}
          {canReview && (
            <div className="mt-3 space-y-2">
              <Textarea rows={2} placeholder="Review comment (needed to request changes)" value={comment} onChange={(e) => setComment(e.target.value)} />
              <div className="flex gap-2">
                <Button size="sm" disabled={!!busy} onClick={() => void act("review", { decision: "approved", comment }, "Approved.").then(() => setComment(""))}>
                  Approve
                </Button>
                <Button size="sm" variant="secondary" disabled={!!busy || !comment.trim()} onClick={() => void act("review", { decision: "changes", comment }, "Changes requested — the developer is notified.").then(() => setComment(""))}>
                  Request changes
                </Button>
              </div>
            </div>
          )}
        </section>

        {leader && open && (
          <section className="rounded-[var(--radius-sm)] border-2 border-graphite p-3">
            <div className="flex flex-wrap items-center gap-3">
              <Button disabled={!!blocked || !!busy} onClick={() => void act("merge", {}, "Merged to main. The branch is deleted and the task is done.")}>
                <GitMerge className="size-4" /> Merge to main
              </Button>
              <span className={`text-xs ${blocked ? "text-warn" : "text-ok"}`}>{blocked ?? "Ready: approved on the latest commit, checks green, Claude has reviewed it."}</span>
            </div>
            <p className="mt-2 text-[11px] text-blueprint">HQ re-checks GitHub at the moment you press it and merges only the exact commit that was approved.</p>
          </section>
        )}

        {Array.isArray(task.devHistory) && (task.devHistory as unknown[]).length > 0 && (
          <section>
            <p className="mb-1 text-xs font-semibold text-blueprint">History</p>
            <ol className="space-y-0.5 text-xs">
              {(task.devHistory as { at: string; by: string; action: string; note?: string }[])
                .slice()
                .reverse()
                .map((h, i) => (
                  <li key={i}>
                    <span className="text-blueprint">{formatDateTime(h.at)}</span> · {h.by} · {h.action}
                    {h.note ? ` — ${h.note}` : ""}
                  </li>
                ))}
            </ol>
          </section>
        )}
      </div>
    </Drawer>
  );
}
