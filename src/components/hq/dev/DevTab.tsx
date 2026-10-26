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
      {current && <DevTaskDrawer task={current} repo={v.repo} team={v.team} onClose={() => setOpenId(null)} onChanged={load} />}
    </div>
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
