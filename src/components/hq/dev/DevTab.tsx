"use client";

import { useCallback, useEffect, useState } from "react";
import { ExternalLink, GitBranch, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Overlay";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/form";
import { api, useHq } from "@/components/hq/data";
import { Panel } from "@/components/hq/ui";
import { Notice } from "@/components/hq/sales/bits";
import { ChecksBadge, DevStatusBadge, DevTaskDrawer, type Rec, type RepoInfo } from "./DevTask";

interface View {
  ready: boolean;
  founderBrief: string;
  aiRun: { status?: string; step?: string; error?: string; at?: string } | null;
  plan: { branch?: string; status?: string; tasks?: { title: string; role?: string; priority?: string; description?: string }[]; runUrl?: string; readyAt?: string } | null;
  autopilot: { enabled: boolean; autoMerge: boolean; approvePlan: boolean; requireClaude: boolean };
  owner: string;
  webhookReady: boolean;
  repo: RepoInfo | null;
  prefix: string;
  tasks: Rec[];
  team: { id: string; name: string; githubUsername: string; codeReviewer: boolean }[];
}

const s = (v: unknown) => (v === undefined || v === null ? "" : String(v));
const DOCS = ["docs/PRD.md", "docs/Architecture.md", "docs/Rules.md", "docs/Design.md", "docs/Tasks.md", "CLAUDE.md"];

/** A project's development: its repository and docs, its tasks (each with a branch), and the way to main. */
export function DevTab({ projectId }: { projectId: string }) {
  const { user } = useHq();
  const leader = ["founder", "admin"].includes(user.role);
  const [v, setV] = useState<View | null>(null);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState<{ tone: "ok" | "bad"; text: string } | null>(null);
  const [busy, setBusy] = useState("");
  const [creating, setCreating] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  const load = useCallback(
    () =>
      api<View>(`/api/hq/dev?project=${encodeURIComponent(projectId)}`)
        .then(setV)
        .catch((e) => setErr(e instanceof Error ? e.message : "Could not load")),
    [projectId],
  );
  useEffect(() => {
    void load();
  }, [load]);
  // while Claude is building, refresh every few seconds to show its progress
  const building = v?.aiRun?.status === "running" || v?.plan?.status === "running" || !!v?.tasks.some((t) => (t.aiBuild as { status?: string } | undefined)?.status === "running");
  useEffect(() => {
    if (!building) return;
    const t = setInterval(() => void load(), 5000);
    return () => clearInterval(t);
  }, [building, load]);

  const run = async (action: string, extra: Record<string, unknown>, ok: (r: Record<string, unknown>) => string) => {
    setBusy(action);
    setMsg(null);
    try {
      const r = await api<Record<string, unknown>>("/api/hq/dev", { method: "POST", body: JSON.stringify({ action, project: projectId, ...extra }) });
      setMsg({ tone: "ok", text: ok(r) });
      await load();
      return true;
    } catch (e) {
      setMsg({ tone: "bad", text: e instanceof Error ? e.message : "That did not work." });
      return false;
    } finally {
      setBusy("");
    }
  };

  if (err) return <Notice tone="bad">{err}</Notice>;
  if (!v) return <p className="text-sm text-blueprint">Loading development…</p>;
  const current = v.tasks.find((t) => t.id === openId);

  return (
    <div className="space-y-5">
      {msg && <Notice tone={msg.tone === "ok" ? "ok" : "bad"}>{msg.text}</Notice>}
      {!v.ready && (
        <Notice tone="warn">
          GitHub isn&apos;t connected yet. In Vercel → Settings → Environment Variables add <code>GITHUB_DEV_OWNER</code>, <code>GITHUB_DEV_TOKEN</code> and <code>GITHUB_WEBHOOK_SECRET</code>, then redeploy.
        </Notice>
      )}

      <ClaudePanel v={v} leader={leader} busy={!!busy} run={run} />

      <Panel
        title="Repository"
        subtitle={v.repo ? `${v.repo.owner}/${v.repo.name} · tasks are ${v.prefix}-…` : "One private repository per project, in the GitHub organization."}
        action={
          v.repo ? (
            <Button size="sm" variant="secondary" href={v.repo.url} external>
              <GitBranch className="size-3.5" /> Open on GitHub
            </Button>
          ) : undefined
        }
      >
        {v.repo ? (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {DOCS.map((d) => (
                <a key={d} className="inline-flex items-center gap-1 rounded border border-graphite/15 px-2 py-1 text-xs hover:border-graphite/40" href={`${v.repo!.url}/blob/${v.repo!.defaultBranch}/${d}`} target="_blank" rel="noreferrer">
                  {d.split("/").pop()} <ExternalLink className="size-3" />
                </a>
              ))}
            </div>
            {leader && (
              <Button size="sm" variant="ghost" disabled={!!busy} onClick={() => void run("docs", {}, (r) => (Number(r.changed) ? `${r.changed} file(s) updated on GitHub.` : "Docs already up to date."))}>
                Update docs on GitHub
              </Button>
            )}
            {!v.webhookReady && <p className="text-xs text-warn">GITHUB_WEBHOOK_SECRET isn&apos;t set, so GitHub can&apos;t update HQ by itself. Use Refresh on a task meanwhile.</p>}
          </div>
        ) : leader ? (
          <div className="space-y-2 text-sm">
            <p className="text-charcoal">Creates the private repository in {v.owner || "the organization"}, writes PRD, Architecture, Rules, Design, Tasks and CLAUDE.md from the client&apos;s approved requirements, adds CI and Claude review, and connects GitHub back to HQ.</p>
            <Button disabled={!v.ready || !!busy} onClick={() => void run("setup", {}, (r) => `Repository ready (${s((r.repo as Rec)?.url)}). Webhook: ${s(r.webhook)}.`)}>
              <GitBranch className="size-4" /> {busy === "setup" ? "Setting up…" : "Create repository"}
            </Button>
          </div>
        ) : (
          <p className="text-sm text-blueprint">No repository yet.</p>
        )}
      </Panel>

      <Panel
        title="Tasks"
        subtitle="Each task gets its own branch. Merging to main happens only here."
        action={
          leader && v.repo ? (
            <Button size="sm" onClick={() => setCreating(true)}>
              <Plus className="size-3.5" /> New task
            </Button>
          ) : undefined
        }
      >
        {!v.tasks.length ? (
          <p className="text-sm text-blueprint">No development tasks yet.</p>
        ) : (
          <ul className="divide-y divide-graphite/10">
            {v.tasks.map((t) => (
              <li key={t.id}>
                <button className="flex w-full flex-wrap items-center gap-2 py-2 text-left text-sm hover:bg-paper-50" onClick={() => setOpenId(t.id)}>
                  <code className="font-mono text-xs text-blueprint">{s(t.taskKey)}</code>
                  <span className="min-w-40 flex-1 font-medium">{s(t.title).replace(/^[A-Z0-9]+-\d+:\s*/, "")}</span>
                  <span className="text-xs text-blueprint">{s(t.assignee) || "Unassigned"}</span>
                  <ChecksBadge checks={t.checks} />
                  <DevStatusBadge status={t.devStatus} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      {creating && <NewTask team={v.team} prefix={v.prefix} onClose={() => setCreating(false)} onCreate={(input) => run("task", { input }, (r) => `Created ${s((r.task as Rec)?.taskKey)} with its branch on GitHub.`)} />}
      {current && <DevTaskDrawer task={current} repo={v.repo} team={v.team} requireClaude={v.autopilot.requireClaude} onClose={() => setOpenId(null)} onChanged={load} />}
    </div>
  );
}

type Run = (action: string, extra: Record<string, unknown>, ok: (r: Record<string, unknown>) => string) => Promise<boolean>;

/**
 * Claude on GitHub, from the founder's side: write the summary, let Claude plan, approve the plan, and choose how much
 * Claude does on its own (autopilot).
 */
function ClaudePanel({ v, leader, busy, run }: { v: View; leader: boolean; busy: boolean; run: Run }) {
  const [brief, setBrief] = useState(v.founderBrief);
  const status = v.aiRun?.status ?? "";
  const plan = v.plan;
  const ap = v.autopilot;
  const toggle = (k: keyof View["autopilot"], label: string, help: string) => (
    <label className="flex items-start gap-2 text-sm">
      <input type="checkbox" className="mt-1" checked={ap[k]} disabled={!leader || busy} onChange={(e) => void run("autopilot", { settings: { [k]: e.target.checked } }, () => "Saved.")} />
      <span>
        <span className="font-medium">{label}</span>
        <span className="block text-xs text-blueprint">{help}</span>
      </span>
    </label>
  );
  return (
    <Panel title="Claude" subtitle="Claude works inside GitHub on your Claude subscription (Pro or Max): it plans from your summary, builds tasks, and reviews every pull request.">
      <div className="space-y-4">
        {status && (
          <div className={`rounded-[var(--radius-sm)] border px-3 py-2 text-sm ${status === "failed" ? "border-bad/30 bg-bad/10 text-bad" : status === "running" ? "border-info/30 bg-info/10 text-info" : "border-ok/30 bg-ok/10 text-ok"}`}>
            {status === "failed" ? v.aiRun?.error : v.aiRun?.step}
            {status === "running" && <span className="ml-2 inline-block size-2 animate-pulse rounded-full bg-current" />}
          </div>
        )}

        <div>
          <p className="mb-1 text-sm font-semibold">1 · Founder summary — what we are building</p>
          <p className="mb-2 text-xs text-blueprint">The master instruction. It goes into every repository as docs/FOUNDER_SUMMARY.md and overrides the client&apos;s submission wherever they differ.</p>
          {leader ? (
            <>
              <Textarea rows={6} value={brief} onChange={(e) => setBrief(e.target.value)} placeholder="Pages and features, priorities, tech preferences, what's out of scope, deadlines." />
              <div className="mt-2 flex flex-wrap gap-2">
                <Button size="sm" variant="secondary" disabled={busy || brief === v.founderBrief} onClick={() => void run("brief", { brief }, () => "Saved — FOUNDER_SUMMARY.md is updated on GitHub.")}>
                  Save summary
                </Button>
                <Button size="sm" disabled={busy || !v.ready || !brief.trim() || plan?.status === "running"} onClick={() => void run("plan", { brief }, () => "Claude started planning on GitHub. It writes PROJECT_PLAN, PRD, Architecture, Rules, Design and the task list — usually 5–15 minutes.")}>
                  {plan?.status ? "Plan again with Claude" : "2 · Plan with Claude"}
                </Button>
              </div>
            </>
          ) : (
            <p className="whitespace-pre-line text-sm text-charcoal">{v.founderBrief || "Not written yet."}</p>
          )}
        </div>

        {plan?.status === "ready" && (
          <div className="rounded-[var(--radius-sm)] border-2 border-graphite p-3">
            <p className="text-sm font-semibold">3 · Review Claude&apos;s plan</p>
            <p className="mb-2 text-xs text-blueprint">
              The documents are on the{" "}
              {v.repo ? (
                <a className="underline" href={`${v.repo.url}/tree/${plan.branch}/docs`} target="_blank" rel="noreferrer">
                  {plan.branch}
                </a>
              ) : (
                plan.branch
              )}{" "}
              branch. Approving merges them into main and creates these {plan.tasks?.length ?? 0} tasks with their branches.
            </p>
            <ol className="mb-3 list-decimal space-y-1 pl-5 text-sm">
              {(plan.tasks ?? []).map((t, i) => (
                <li key={i}>
                  {t.title} {t.role && <span className="text-xs text-blueprint">· {t.role}</span>}
                </li>
              ))}
            </ol>
            {leader && (
              <Button size="sm" disabled={busy} onClick={() => void run("approvePlan", {}, (r) => `Plan approved — ${String(r.created ?? 0)} tasks created${ap.enabled ? ", Claude is starting the first one" : ""}.`)}>
                Approve plan & create tasks
              </Button>
            )}
          </div>
        )}
        {plan?.status === "failed" && plan.runUrl && (
          <p className="text-sm">
            Claude&apos;s plan run failed —{" "}
            <a className="underline" href={plan.runUrl} target="_blank" rel="noreferrer">
              open it on GitHub
            </a>
            .
          </p>
        )}

        <div className="space-y-2 border-t border-graphite/10 pt-3">
          <p className="text-sm font-semibold">Autopilot</p>
          {toggle("enabled", "Claude builds this project's tasks", "Tasks from an approved plan go to Claude, one after another: build → pull request → Claude's review → fixes (twice at most).")}
          {toggle("autoMerge", "Merge automatically", "When Claude approves the latest commit and every check is green, HQ merges and starts the next task. Off: HQ waits for you to press Merge.")}
          {toggle("approvePlan", "I approve the plan first", "Recommended. Off: tasks are created as soon as Claude's plan is ready.")}
          {toggle("requireClaude", "People's merges need Claude's approval too", "For tasks built by your team: Merge stays locked until Claude approves the latest commit.")}
        </div>
      </div>
    </Panel>
  );
}

function NewTask({ team, prefix, onClose, onCreate }: { team: View["team"]; prefix: string; onClose: () => void; onCreate: (input: Record<string, unknown>) => Promise<boolean> }) {
  const [f, setF] = useState({ title: "", type: "feature", assigneeId: "", priority: "medium", dueDate: "", description: "", acceptance: "", clientVisible: false });
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f, v: unknown) => setF((x) => ({ ...x, [k]: v }));
  return (
    <Drawer
      open
      onClose={onClose}
      title="New development task"
      subtitle={`Gets the next ${prefix}- ID and its own branch`}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            disabled={busy || !f.title.trim()}
            onClick={async () => {
              setBusy(true);
              if (await onCreate(f)) onClose();
              setBusy(false);
            }}
          >
            {busy ? "Creating…" : "Create task & branch"}
          </Button>
        </div>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Title" required className="sm:col-span-2">
          <Input value={f.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Build client login" />
        </Field>
        <Field label="Type">
          <Select value={f.type} onChange={(e) => set("type", e.target.value)}>
            <option value="feature">Feature</option>
            <option value="fix">Bug fix</option>
            <option value="hotfix">Hotfix (urgent)</option>
          </Select>
        </Field>
        <Field label="Assignee">
          <Select value={f.assigneeId} onChange={(e) => set("assigneeId", e.target.value)}>
            <option value="">Unassigned</option>
            {team.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
                {m.githubUsername ? "" : " (no GitHub username)"}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Priority">
          <Select value={f.priority} onChange={(e) => set("priority", e.target.value)}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </Select>
        </Field>
        <Field label="Due date">
          <Input type="date" value={f.dueDate} onChange={(e) => set("dueDate", e.target.value)} />
        </Field>
        <Field label="What to build" className="sm:col-span-2">
          <Textarea rows={3} value={f.description} onChange={(e) => set("description", e.target.value)} />
        </Field>
        <Field label="Acceptance criteria" help="One per line — they become the PR checklist and Claude's target." className="sm:col-span-2">
          <Textarea rows={4} value={f.acceptance} onChange={(e) => set("acceptance", e.target.value)} />
        </Field>
        <div className="sm:col-span-2">
          <Checkbox label="Tell the client when this is merged (posts to their portal)" checked={f.clientVisible} onChange={(e) => set("clientVisible", e.target.checked)} />
        </div>
      </div>
    </Drawer>
  );
}
