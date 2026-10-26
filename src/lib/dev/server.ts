import "server-only";
import { getRecord, listRecords, upsertRecord } from "@/lib/hq/records";
import type { BaseRecord } from "@/lib/hq/collections";
import type { SessionUser } from "@/lib/hq/roles";
import { site } from "@/lib/site";
import { publishUpdate } from "@/lib/portal/data";
import {
  addCollaborator,
  branchSha,
  checksFor,
  commentOnPR,
  createBranch,
  createRepo,
  deleteBranch,
  devOwner,
  devReady,
  ensureWebhook,
  dispatchWorkflow,
  getFileText,
  getPullRequest,
  mergeBranch,
  getRepo,
  GitHubError,
  mergePullRequest,
  openPullRequest,
  putFile,
  webhookSecret,
  type PullRequest,
  type Repo,
} from "./github";
import { repoFiles } from "./docs";
import { parseReviewMark, TASKS_JSON } from "./workflows";
import { branchName, CLAUDE_ID, claudeReviewFor, keyFromBranch, mergeProblem, type ClaudeVerdict, prefixFor, repoName, reviewProblem, statusAfter, taskKey, type DevStatus, type DevType, type Review } from "./rules";

/*
 * HQ's development workflow: one repository per client project in the GitHub organization, one branch per task,
 * pull requests opened from HQ, reviews recorded in HQ (and from GitHub by code reviewers), and merges to main only
 * through HQ when mergeProblem() says so. GitHub's webhooks keep every task current without anyone typing a status.
 */

type Rec = BaseRecord;
type Obj = Record<string, unknown>;
const s = (v: unknown) => (v === undefined || v === null ? "" : String(v)).trim();
const now = () => new Date().toISOString();

export class DevError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}

export const WEBHOOK_URL = () => `${site.url}/api/hq/dev/webhook`;
const ev = (by: string, action: string, note?: string) => ({ at: now(), by, action, ...(note ? { note } : {}) });
const hist = (r: Rec | null | undefined) => (Array.isArray(r?.devHistory) ? (r!.devHistory as unknown[]) : []);
const repoOf = (p: Rec | null | undefined): Repo | null => (p?.repo && typeof p.repo === "object" ? (p.repo as Repo) : null);

/** The Team & Payroll member a login belongs to: the link on the login, or the founder's own record by name. */
async function memberOf(user: SessionUser) {
  const team = await listRecords("team");
  return user.teamId ? team.find((m) => m.id === user.teamId) : team.find((m) => s(m.name).toLowerCase() === user.name.toLowerCase());
}

/* ───────────────────────────── reading ───────────────────────────── */

export async function devView(projectId: string) {
  const [project, tasks, team] = await Promise.all([getRecord("projects", projectId), listRecords("tasks"), listRecords("team")]);
  if (!project) throw new DevError("Project not found.", 404);
  return {
    ready: devReady(),
    owner: devOwner(),
    webhookReady: !!webhookSecret(),
    founderBrief: s(project.founderBrief),
    aiRun: (project.aiRun as Rec | undefined) ?? null,
    plan: (project.plan as Rec | undefined) ?? null,
    autopilot: autopilotOf(project),
    repo: repoOf(project),
    prefix: s(project.taskPrefix) || prefixFor(s(project.title)),
    tasks: tasks.filter((t) => t.projectId === projectId && s(t.taskKey)).sort((a, b) => Number(s(b.taskKey).split("-").pop()) - Number(s(a.taskKey).split("-").pop())),
    team: team.filter((m) => s(m.status) !== "inactive").map((m) => ({ id: m.id, name: s(m.name), githubUsername: s(m.githubUsername), codeReviewer: m.codeReviewer === true })),
  };
}

/** Every development task across projects, for the review queue and "my tasks". */
export async function devQueue(user: SessionUser) {
  const [tasks, projects, me] = await Promise.all([listRecords("tasks"), listRecords("projects"), memberOf(user)]);
  const dev = tasks.filter((t) => s(t.taskKey));
  const title = (id: unknown) => s(projects.find((p) => p.id === s(id))?.title);
  const decorate = (t: Rec) => ({ ...t, projectTitle: title(t.projectId), repo: repoOf(projects.find((p) => p.id === s(t.projectId))) });
  return {
    me: me ? { id: me.id, name: s(me.name), codeReviewer: me.codeReviewer === true } : null,
    mine: dev.filter((t) => me && s(t.assigneeId) === me.id && !["merged", "closed"].includes(s(t.devStatus))).map(decorate),
    review: dev.filter((t) => ["in-review", "approved", "changes"].includes(s(t.devStatus))).map(decorate),
    recent: dev.filter((t) => s(t.devStatus) === "merged").sort((a, b) => s(b.mergedAt).localeCompare(s(a.mergedAt))).slice(0, 15).map(decorate),
  };
}

/* ───────────────────────────── repository & docs ───────────────────────────── */

async function docInput(project: Rec) {
  const [clients, subs, tasks, team] = await Promise.all([listRecords("clients"), listRecords("portalSubmissions"), listRecords("tasks"), listRecords("team")]);
  const sub = subs.find((x) => s(x.projectId) === project.id);
  return {
    project,
    client: clients.find((c) => c.id === s(project.clientId)),
    submission: sub && s(sub.status) === "approved" ? sub : (sub ?? null),
    tasks: tasks.filter((t) => t.projectId === project.id && s(t.taskKey)),
    team,
    repoUrl: repoOf(project)?.url ?? "",
  };
}

/** Write the docs: HQ's own files (Tasks.md, CLAUDE.md) every time; the owners' files and workflows only if missing. */
export async function syncDocs(projectId: string, by: string) {
  const project = await getRecord("projects", projectId);
  const repo = repoOf(project);
  if (!project || !repo) throw new DevError("Set up the repository first.");
  const input = await docInput(project);
  let changed = 0;
  for (const f of repoFiles(input)) {
    const r = await putFile(repo, f.path, f.content, `${f.owned ? "Update" : "Add"} ${f.path} (FrameMind HQ)`, repo.defaultBranch, !f.owned);
    if (r.changed) changed++;
  }
  await upsertRecord("projects", { ...(await getRecord("projects", projectId))!, devDocsAt: now() }, by);
  await ensureWebhook(repo, WEBHOOK_URL()).catch(() => {});
  return changed;
}

/** Create (or reconnect) the project's private repository, write its docs and workflows, and connect the webhook. */
export async function setupRepo(projectId: string, by: string) {
  if (!devReady()) throw new DevError("Connect GitHub first: add GITHUB_DEV_TOKEN and GITHUB_DEV_OWNER in Vercel.", 503);
  const project = await getRecord("projects", projectId);
  if (!project) throw new DevError("Project not found.", 404);
  let repo = repoOf(project);
  if (!repo) {
    const name = repoName(s(project.title));
    repo = (await getRepo(devOwner(), name)) ?? (await createRepo(name, `${s(project.title)} — FrameMind AI Studio`));
    await upsertRecord("projects", { ...project, repo, repoUrl: repo.url, ...(s(project.taskPrefix) ? {} : { taskPrefix: prefixFor(s(project.title)) }) }, by);
  }
  const files = await syncDocs(projectId, by);
  let webhook = "connected";
  try {
    await ensureWebhook(repo, WEBHOOK_URL());
  } catch (e) {
    webhook = e instanceof Error ? e.message : "not connected";
  }
  return { repo, files, webhook };
}

/* ───────────────────────────── Claude on GitHub: plan, build, review, autopilot ───────────────────────────── */

export interface Autopilot {
  /** Claude builds the project's tasks one after another */
  enabled: boolean;
  /** HQ merges a task when Claude's review approves the latest commit and the checks are green */
  autoMerge: boolean;
  /** the founder approves Claude's plan before any task is created (recommended) */
  approvePlan: boolean;
  /** merges by people also need Claude's approval of the latest commit */
  requireClaude: boolean;
}
export const DEFAULT_AUTOPILOT: Autopilot = { enabled: false, autoMerge: false, approvePlan: true, requireClaude: false };
export const autopilotOf = (p: Rec | null | undefined): Autopilot => ({ ...DEFAULT_AUTOPILOT, ...((p?.autopilot as Partial<Autopilot> | undefined) ?? {}) });

/** HQ acting on the founder's standing instructions (autopilot): named in every history entry it makes. */
const SYSTEM: SessionUser = { username: "claude-autopilot", name: "Claude (autopilot)", role: "admin" };

/** Where Claude has got to on this project, for every screen to show. */
async function status(projectId: string, by: string, patch: Record<string, unknown>) {
  const p = await getRecord("projects", projectId);
  if (p) await upsertRecord("projects", { ...p, aiRun: { ...((p.aiRun as Obj | undefined) ?? ({} as Obj)), ...patch, at: now() } }, by);
}

export async function saveFounderBrief(projectId: string, brief: string, by: string) {
  const p = await getRecord("projects", projectId);
  if (!p) throw new DevError("Project not found.", 404);
  await upsertRecord("projects", { ...p, founderBrief: brief.trim().slice(0, 8000) }, by);
}

export async function saveAutopilot(projectId: string, input: Partial<Autopilot>, by: string) {
  const p = await getRecord("projects", projectId);
  if (!p) throw new DevError("Project not found.", 404);
  const next: Autopilot = { ...autopilotOf(p), ...Object.fromEntries(Object.entries(input).filter(([k, v]) => k in DEFAULT_AUTOPILOT && typeof v === "boolean")) };
  await upsertRecord("projects", { ...p, autopilot: next }, by);
  if (next.enabled) await autopilotTick(projectId).catch((e) => console.error("[autopilot]", e));
  return next;
}

/**
 * Plan with Claude: write the founder summary and the client's requirements into the repository, then start the
 * Claude plan workflow on a fresh plan/ branch. GitHub tells HQ when it finishes (workflow_run).
 */
export async function startPlan(projectId: string, by: string) {
  if (!devReady()) throw new DevError("Connect GitHub first (GITHUB_DEV_TOKEN and GITHUB_DEV_OWNER in Vercel).", 503);
  const project = await getRecord("projects", projectId);
  if (!project) throw new DevError("Project not found.", 404);
  if (!s(project.founderBrief)) throw new DevError("Write the founder summary first — Claude plans from it.");
  await setupRepo(projectId, by);
  const repo = repoOf(await getRecord("projects", projectId))!;
  const branch = `plan/${now().slice(0, 16).replace(/[-:T]/g, "")}`;
  await dispatchWorkflow(repo, "claude-plan.yml", { branch });
  const p = (await getRecord("projects", projectId))!;
  await upsertRecord("projects", { ...p, plan: { branch, status: "running", at: now(), by } }, by);
  await status(projectId, by, { status: "running", step: "Claude is writing the plan and the documents on GitHub", error: "" });
}

/** Claude's plan run finished: read its task list from the plan branch. */
async function planFinished(project: Rec, run: Rec) {
  const plan = (project.plan as Obj | undefined) ?? ({} as Obj);
  if (s(run.head_branch) !== s(plan.branch)) return "not the current plan";
  const repo = repoOf(project)!;
  if (s(run.conclusion) !== "success") {
    await upsertRecord("projects", { ...project, plan: { ...plan, status: "failed", runUrl: s(run.html_url) } }, "GitHub");
    await status(project.id, "GitHub", { status: "failed", error: `Claude's plan run failed — open it on GitHub to see why (a missing CLAUDE_CODE_OAUTH_TOKEN shows there): ${s(run.html_url)}` });
    return "plan failed";
  }
  let tasks: Rec[] = [];
  try {
    const parsed = JSON.parse((await getFileText(repo, TASKS_JSON, s(plan.branch))) ?? "{}") as { tasks?: Rec[] };
    tasks = (Array.isArray(parsed.tasks) ? parsed.tasks : []).filter((t) => s(t.title)).slice(0, 30);
  } catch {
    tasks = [];
  }
  await upsertRecord("projects", { ...project, plan: { ...plan, status: "ready", tasks, runUrl: s(run.html_url), readyAt: now() } }, "GitHub");
  await status(project.id, "GitHub", { status: "done", step: tasks.length ? `Plan ready: ${tasks.length} tasks — review it and approve` : "Plan ready, but Claude wrote no task list — check docs/tasks.json on the plan branch", error: "" });
  if (tasks.length && autopilotOf(project).enabled && !autopilotOf(project).approvePlan) await approvePlan(project.id, "Claude (autopilot)");
  return "plan ready";
}

/** Who a planned task goes to: Claude on autopilot; otherwise the least-busy team member whose role fits. */
function assigneeFor(role: string, team: Rec[], open: (id: string) => number, autopilot: boolean) {
  if (autopilot) return { id: CLAUDE_ID, name: "Claude (AI developer)" };
  const want = role.toLowerCase();
  const fits = (m: Rec) => {
    const r = `${s(m.role)} ${Array.isArray(m.skills) ? (m.skills as string[]).join(" ") : ""}`.toLowerCase();
    if (/design/.test(want)) return /design|ui|ux/.test(r);
    if (/qa|test/.test(want)) return /qa|test/.test(r);
    if (/devops|infra/.test(want)) return /devops|infra|lead/.test(r);
    return /develop|engineer|full.?stack|front|back|tech lead/.test(r);
  };
  const pick = team.filter((m) => s(m.status) !== "inactive" && fits(m)).sort((a, b) => open(a.id) - open(b.id))[0];
  return pick ? { id: pick.id, name: s(pick.name) } : null;
}

/** The founder approves Claude's plan: merge the plan branch, create the tasks with branches, start the autopilot. */
export async function approvePlan(projectId: string, by: string) {
  const project = await getRecord("projects", projectId);
  const repo = repoOf(project);
  const plan = (project?.plan as Obj | undefined) ?? ({} as Obj);
  if (!project || !repo) throw new DevError("Project not found.", 404);
  if (s(plan.status) !== "ready") throw new DevError("There's no plan waiting for approval.");
  await mergeBranch(repo, s(plan.branch), "Project plan by Claude (approved in FrameMind HQ)");
  await deleteBranch(repo, s(plan.branch)).catch(() => {});
  const [team, all] = await Promise.all([listRecords("team"), listRecords("tasks")]);
  const open = (id: string) => all.filter((t) => s(t.assigneeId) === id && s(t.taskKey) && !["merged", "closed"].includes(s(t.devStatus))).length;
  const pilot = autopilotOf(project).enabled;
  const prefix = s(project.taskPrefix) || prefixFor(s(project.title));
  let n = Number(project.devCounter ?? 100);
  const made: Rec[] = [];
  for (const t of (plan.tasks as Rec[]) ?? []) {
    n += 1;
    const key = taskKey(prefix, n);
    const type = (["feature", "fix"].includes(s(t.type)) ? s(t.type) : "feature") as DevType;
    const who = assigneeFor(s(t.role), team, open, pilot);
    made.push(
      await upsertRecord(
        "tasks",
        {
          title: `${key}: ${s(t.title).slice(0, 140)}`,
          status: "todo",
          priority: ["low", "medium", "high"].includes(s(t.priority)) ? s(t.priority) : "medium",
          area: "Development",
          projectId,
          assignee: who?.name ?? "",
          description: s(t.description).slice(0, 4000),
          acceptance: (Array.isArray(t.acceptance) ? (t.acceptance as unknown[]).map(s) : []).join("\n"),
          taskKey: key,
          devType: type,
          branch: branchName(type, key, s(t.title)),
          devStatus: "todo",
          assigneeId: who?.id ?? "",
          role: s(t.role),
          commits: 0,
          devHistory: [ev(by, "Created from Claude's plan", who ? `assigned to ${who.name}` : "no team member fits — assign by hand")],
        },
        by,
      ),
    );
  }
  const fresh = (await getRecord("projects", projectId))!;
  await upsertRecord("projects", { ...fresh, devCounter: n, plan: { ...plan, status: "approved", approvedBy: by, approvedAt: now() } }, by);
  await syncDocs(projectId, by).catch(() => {});
  for (const t of made) await createBranch(repo, s(t.branch));
  const invited = new Set<string>();
  for (const t of made) {
    const login = s(team.find((m) => m.id === s(t.assigneeId))?.githubUsername);
    if (login && !invited.has(login)) {
      invited.add(login);
      await addCollaborator(repo, login, "push").catch(() => {});
    }
  }
  await status(projectId, by, { status: "done", step: `Plan approved — ${made.length} tasks created${pilot ? ", Claude is starting the first one" : ""}`, error: "" });
  if (pilot) await autopilotTick(projectId).catch((e) => console.error("[autopilot]", e));
  return made.length;
}

/** Start Claude building one task on GitHub (manually, or by the autopilot). */
export async function buildTask(taskId: string, by: string, instructions = "") {
  const { task, repo } = await taskAndRepo(taskId);
  if (!(await branchSha(repo, s(task.branch)))) await createBranch(repo, s(task.branch));
  await dispatchWorkflow(repo, "claude-build.yml", { task: s(task.taskKey), branch: s(task.branch), instructions: instructions.slice(0, 2000) });
  const rounds = Number((task.aiBuild as Rec | undefined)?.rounds ?? 0) + (instructions ? 1 : 0);
  return upsertRecord("tasks", { ...task, status: "doing", devStatus: s(task.devStatus) === "todo" ? "in-progress" : s(task.devStatus), aiBuild: { status: "running", at: now(), rounds }, devHistory: [...hist(task), ev(by, instructions ? "Claude is addressing the review" : "Claude started building")] }, by);
}

/** A Claude build run finished: open (or refresh) the pull request; reviews and CI start from there. */
async function buildFinished(project: Rec, run: Rec, tasks: Rec[]) {
  const t = tasks.find((x) => s(x.branch) === s(run.head_branch));
  if (!t) return "no task for this branch";
  const ok = s(run.conclusion) === "success";
  await upsertRecord("tasks", { ...t, aiBuild: { ...((t.aiBuild as Obj | undefined) ?? ({} as Obj)), status: ok ? "done" : "failed", runUrl: s(run.html_url), finishedAt: now() }, devHistory: [...hist(t), ev("GitHub", ok ? "Claude finished building" : "Claude's build run failed", s(run.html_url))] }, "GitHub");
  if (!ok) {
    if (autopilotOf(project).enabled) await status(project.id, "GitHub", { status: "failed", error: `Autopilot paused: Claude's build of ${s(t.taskKey)} failed — open it on GitHub: ${s(run.html_url)}` });
    return "build failed";
  }
  const repo = repoOf(project)!;
  const hadPR = !!(t.pr as Rec | undefined)?.number;
  const pr = await openPR(t.id, SYSTEM, false);
  // pushes made inside Actions don't start other workflows, so HQ starts CI and the review for the new commits
  if (hadPR) {
    await dispatchWorkflow(repo, "ci.yml", {}, s(t.branch)).catch(() => {});
    await dispatchWorkflow(repo, "claude-review.yml", { pr: String(pr.number) }).catch(() => {});
  }
  await autopilotTick(project.id).catch(() => {});
  return "pull request ready";
}

/** Claude's review verdict arrived as a PR comment. */
async function reviewPosted(project: Rec, p: Payload, tasks: Rec[]) {
  const mark = parseReviewMark(s(p.comment?.body));
  if (!mark) return "no verdict";
  const t = tasks.find((x) => Number((x.pr as Rec | undefined)?.number) === Number(p.issue?.number));
  if (!t) return "no task for this pull request";
  const v: ClaudeVerdict = { sha: mark.sha, verdict: mark.verdict, at: now(), url: s(p.comment?.html_url) };
  await upsertRecord("tasks", { ...t, claudeVerdicts: [...((t.claudeVerdicts as ClaudeVerdict[] | undefined) ?? []), v], devHistory: [...hist(t), ev("Claude", mark.verdict === "approve" ? "Claude's review: approve" : "Claude's review: changes needed", v.url)] }, "GitHub");
  await autopilotTick(project.id).catch(() => {});
  return "verdict recorded";
}

/**
 * The autopilot's one step: look at the project's Claude tasks in order and move the first unfinished one forward —
 * start its build, ask Claude to address its own review (twice at most), or merge it when Claude approved the latest
 * commit and the checks are green (when auto-merge is on). It runs after every relevant GitHub event.
 */
export async function autopilotTick(projectId: string): Promise<void> {
  const project = await getRecord("projects", projectId);
  const pilot = autopilotOf(project);
  if (!project || !pilot.enabled || !repoOf(project)) return;
  const tasks = (await listRecords("tasks"))
    .filter((t) => t.projectId === projectId && s(t.assigneeId) === CLAUDE_ID && !["merged", "closed"].includes(s(t.devStatus)))
    .sort((a, b) => Number(s(a.taskKey).split("-").pop()) - Number(s(b.taskKey).split("-").pop()));
  const t = tasks[0];
  if (!t) {
    await status(projectId, "Claude (autopilot)", { status: "done", step: "Autopilot: every Claude task is merged", error: "" });
    return;
  }
  const build = (t.aiBuild as Obj | undefined) ?? ({} as Obj);
  if (s(build.status) === "running") return;
  if (s(build.status) === "failed") return;
  const pr = t.pr as Rec | undefined;
  if (s(build.status) === "retry" && pr?.number) {
    await buildTask(t.id, "Claude (autopilot)", `Continue task ${s(t.taskKey)}: finish it and address any review comments on pull request #${s(pr.number)} (gh pr view ${s(pr.number)} --comments).`);
    return;
  }
  if (!pr?.number) {
    await buildTask(t.id, "Claude (autopilot)");
    await status(projectId, "Claude (autopilot)", { status: "running", step: `Autopilot: Claude is building ${s(t.taskKey)}`, error: "" });
    return;
  }
  const fresh = await refreshTask(t.id, "Claude (autopilot)");
  const head = s((fresh.pr as Rec | undefined)?.headSha);
  const verdict = claudeReviewFor(fresh.claudeVerdicts as ClaudeVerdict[] | undefined, head);
  if (verdict === "changes") {
    if (Number(build.rounds ?? 0) >= 2) {
      await status(projectId, "Claude (autopilot)", { status: "failed", error: `Autopilot paused: Claude's review still asks for changes on ${s(t.taskKey)} after two rounds — please look at the pull request.` });
      return;
    }
    await buildTask(t.id, "Claude (autopilot)", `Address the review comments on pull request #${s(pr.number)} (read them with: gh pr view ${s(pr.number)} --comments), then push.`);
    await status(projectId, "Claude (autopilot)", { status: "running", step: `Autopilot: Claude is addressing its review of ${s(t.taskKey)}`, error: "" });
    return;
  }
  if (verdict !== "passed") return;
  const checks = s((fresh.checks as Rec | undefined)?.state) || "none";
  if (checks !== "success") return;
  if (!pilot.autoMerge) {
    await status(projectId, "Claude (autopilot)", { status: "done", step: `Autopilot: ${s(t.taskKey)} is approved by Claude and green — waiting for you to merge`, error: "" });
    return;
  }
  await mergeTaskAuto(t.id);
  await autopilotTick(projectId);
}

/* ───────────────────────────── tasks ───────────────────────────── */

const PRIORITY: Record<string, string> = { low: "low", medium: "medium", high: "high", urgent: "urgent" };

export async function createTask(projectId: string, input: Record<string, unknown>, user: SessionUser) {
  const project = await getRecord("projects", projectId);
  if (!project) throw new DevError("Project not found.", 404);
  const repo = repoOf(project);
  if (!repo) throw new DevError("Set up the repository first.");
  const title = s(input.title).slice(0, 140);
  if (!title) throw new DevError("Give the task a title.");
  const type = (["feature", "fix", "hotfix"].includes(s(input.type)) ? s(input.type) : "feature") as DevType;
  const team = await listRecords("team");
  const assignee = team.find((m) => m.id === s(input.assigneeId));
  const n = Number(project.devCounter ?? 100) + 1;
  const key = taskKey(s(project.taskPrefix) || prefixFor(s(project.title)), n);
  const branch = branchName(type, key, title);
  await upsertRecord("projects", { ...project, devCounter: n }, user.name);
  // the dev fields go straight onto the record here; the generic save keeps them away from everyone else
  const saved = await upsertRecord(
    "tasks",
    {
      title: `${key}: ${title}`,
      status: "todo",
      priority: PRIORITY[s(input.priority)] ?? "medium",
      area: "Development",
      projectId,
      assignee: s(assignee?.name),
      dueDate: s(input.dueDate),
      description: s(input.description).slice(0, 4000),
      acceptance: s(input.acceptance).slice(0, 4000),
      clientVisible: input.clientVisible === true,
      taskKey: key,
      devType: type,
      branch,
      devStatus: "todo",
      assigneeId: assignee?.id ?? "",
      commits: 0,
      devHistory: [ev(user.name, "Created", `branch ${branch}`)],
    },
    user.name,
  );
  // Tasks.md on main lists the new task first, so the branch starts level with main (not a commit behind)
  await syncDocs(projectId, user.name).catch(() => {});
  await createBranch(repo, branch);
  if (assignee && s(assignee.githubUsername)) await addCollaborator(repo, s(assignee.githubUsername), "push").catch(() => {});
  return saved;
}

async function taskAndRepo(taskId: string) {
  const task = await getRecord("tasks", taskId);
  if (!task || !s(task.taskKey)) throw new DevError("Task not found.", 404);
  const project = await getRecord("projects", s(task.projectId));
  const repo = repoOf(project);
  if (!project || !repo) throw new DevError("This task's project has no repository.");
  return { task, project, repo };
}

const prFields = (p: PullRequest) => ({ number: p.number, url: p.url, state: p.state, merged: p.merged, mergeable: p.mergeable, headSha: p.headSha, additions: p.additions, deletions: p.deletions, changedFiles: p.changedFiles });

export async function openPR(taskId: string, user: SessionUser, mustBeAssignee: boolean) {
  const { task, repo } = await taskAndRepo(taskId);
  if (mustBeAssignee) {
    const me = await memberOf(user);
    if (!me || me.id !== s(task.assigneeId)) throw new DevError("Only the developer on this task can open its pull request.", 403);
  }
  if (!(await branchSha(repo, s(task.branch)))) throw new DevError("The task's branch is missing on GitHub.");
  const body = `**${s(task.taskKey)}** — ${s(task.title).replace(/^[A-Z0-9]+-\d+:\s*/, "")}\n\n${s(task.description)}\n\n${s(task.acceptance) ? `### Acceptance criteria\n${s(task.acceptance).split(/\n+/).filter(Boolean).map((l) => `- [ ] ${l.replace(/^[-*]\s*/, "")}`).join("\n")}\n\n` : ""}_Opened from FrameMind HQ. Merge from HQ only._`;
  const pr = await openPullRequest(repo, s(task.branch), s(task.title), body);
  const checks = await checksFor(repo, pr.headSha).catch(() => ({ state: "none" as const, items: [] }));
  await upsertRecord("tasks", { ...task, status: "doing", pr: prFields(pr), checks: { ...checks, sha: pr.headSha, at: now() }, devStatus: statusAfter(s(task.devStatus) as DevStatus, { kind: "pr-opened" }), devHistory: [...hist(task), ev(user.name, "Pull request opened", `#${pr.number}`)] }, user.name);
  return pr;
}

/** Pull the PR and checks from GitHub (the webhook does this by itself; this is the manual refresh). */
export async function refreshTask(taskId: string, by: string): Promise<Rec> {
  const { task, repo } = await taskAndRepo(taskId);
  const n = Number((task.pr as Rec | undefined)?.number);
  if (!n) return task;
  const pr = await getPullRequest(repo, n);
  const checks = await checksFor(repo, pr.headSha);
  const status = pr.merged ? "merged" : pr.state === "closed" ? "closed" : s(task.devStatus);
  return upsertRecord("tasks", { ...task, pr: prFields(pr), checks: { ...checks, sha: pr.headSha, at: now() }, devStatus: status, ...(pr.merged ? { status: "done" } : {}) }, by);
}

export async function reviewTask(taskId: string, user: SessionUser, decision: "approved" | "changes", comment: string) {
  const fresh = await refreshTask(taskId, user.name);
  const { repo } = await taskAndRepo(taskId);
  const me = await memberOf(user);
  const pr = fresh.pr as Rec | undefined;
  const problem = reviewProblem({ actorRole: user.role, actorTeamId: me?.id, actorIsReviewer: me?.codeReviewer === true, assigneeId: s(fresh.assigneeId), hasPR: !!pr?.number });
  if (problem) throw new DevError(problem, 403);
  if (decision === "changes" && !comment.trim()) throw new DevError("Say what needs changing — the developer sees it.");
  const review: Review = { by: user.name, byTeamId: me?.id, decision, sha: s(pr!.headSha), at: now(), ...(comment.trim() ? { comment: comment.trim().slice(0, 3000) } : {}) };
  await commentOnPR(repo, Number(pr!.number), `${decision === "approved" ? "✅ **Approved in FrameMind HQ**" : "🔁 **Changes requested in FrameMind HQ**"} by ${user.name} (commit ${s(pr!.headSha).slice(0, 7)})${comment.trim() ? `\n\n${comment.trim()}` : ""}`).catch(() => {});
  return upsertRecord("tasks", { ...fresh, reviews: [...(Array.isArray(fresh.reviews) ? (fresh.reviews as Review[]) : []), review], devStatus: statusAfter(s(fresh.devStatus) as DevStatus, { kind: "review", decision }), devHistory: [...hist(fresh), ev(user.name, decision === "approved" ? "Approved" : "Changes requested", comment.trim() || undefined)] }, user.name);
}

/** The one way to main: re-checks everything on GitHub, then squash-merges the exact commit that was approved. */
export async function mergeTask(taskId: string, user: SessionUser) {
  const fresh = await refreshTask(taskId, user.name);
  const { repo, project } = await taskAndRepo(taskId);
  const me = await memberOf(user);
  const pr = fresh.pr as Rec | undefined;
  const checks = ((fresh.checks as Rec | undefined)?.state ?? "none") as "success" | "pending" | "failure" | "none";
  const claudeReview = claudeReviewFor(fresh.claudeVerdicts as ClaudeVerdict[] | undefined, s((fresh.pr as Rec | undefined)?.headSha));
  const problem = mergeProblem({ claudeReview, requireClaude: autopilotOf(project).requireClaude, actorRole: user.role, actorTeamId: me?.id, assigneeId: s(fresh.assigneeId), pr: pr ? { state: s(pr.state), merged: pr.merged === true, mergeable: (pr.mergeable as boolean | null) ?? null, headSha: s(pr.headSha) } : null, checks, reviews: Array.isArray(fresh.reviews) ? (fresh.reviews as Review[]) : [] });
  if (problem) throw new DevError(problem, 409);
  await mergePullRequest(repo, Number(pr!.number), s(pr!.headSha), `${s(fresh.title)} (#${s(pr!.number)})`);
  await deleteBranch(repo, s(fresh.branch)).catch(() => {});
  const saved = await upsertRecord("tasks", { ...fresh, status: "done", devStatus: "merged", pr: { ...pr, merged: true, state: "closed" }, mergedBy: user.name, mergedAt: now(), devHistory: [...hist(fresh), ev(user.name, "Merged to main")] }, user.name);
  await syncDocs(project.id, user.name).catch(() => {});
  if (fresh.clientVisible === true) await publishUpdate(project.id, { title: `Done: ${s(fresh.title).replace(/^[A-Z0-9]+-\d+:\s*/, "")}`, body: "This part of your project is complete and merged.", previewUrl: s(project.stagingUrl) }, user.name).catch(() => {});
  return saved;
}

/** The autopilot's merge: same checks on GitHub, but Claude's approval of the latest commit stands in for a person's. */
async function mergeTaskAuto(taskId: string) {
  const fresh = await refreshTask(taskId, "Claude (autopilot)");
  const { repo, project } = await taskAndRepo(taskId);
  const pr = fresh.pr as Rec | undefined;
  const checks = ((fresh.checks as Rec | undefined)?.state ?? "none") as "success" | "pending" | "failure" | "none";
  const problem = mergeProblem({ autopilot: true, actorRole: "system", assigneeId: s(fresh.assigneeId), claudeReview: claudeReviewFor(fresh.claudeVerdicts as ClaudeVerdict[] | undefined, s(pr?.headSha)), pr: pr ? { state: s(pr.state), merged: pr.merged === true, mergeable: (pr.mergeable as boolean | null) ?? null, headSha: s(pr.headSha) } : null, checks, reviews: [] });
  if (problem) throw new DevError(problem, 409);
  await mergePullRequest(repo, Number(pr!.number), s(pr!.headSha), `${s(fresh.title)} (#${s(pr!.number)})`);
  await deleteBranch(repo, s(fresh.branch)).catch(() => {});
  await upsertRecord("tasks", { ...fresh, status: "done", devStatus: "merged", pr: { ...pr, merged: true, state: "closed" }, mergedBy: "Claude (autopilot)", mergedAt: now(), devHistory: [...hist(fresh), ev("Claude (autopilot)", "Merged to main", "Claude approved the latest commit; checks green")] }, "Claude (autopilot)");
  await syncDocs(project.id, "Claude (autopilot)").catch(() => {});
  if (fresh.clientVisible === true) await publishUpdate(project.id, { title: `Done: ${s(fresh.title).replace(/^[A-Z0-9]+-\d+:\s*/, "")}`, body: "This part of your project is complete and merged.", previewUrl: s(project.stagingUrl) }, "Claude (autopilot)").catch(() => {});
}

/* ───────────────────────────── GitHub events ───────────────────────────── */

type Payload = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

/** Apply one webhook event. Unknown repositories and branches without a task ID are ignored. */
export async function handleEvent(event: string, p: Payload) {
  const full = s(p.repository?.full_name).toLowerCase();
  if (!full) return "ignored";
  const projects = await listRecords("projects");
  const project = projects.find((x) => {
    const r = repoOf(x);
    return r && `${r.owner}/${r.name}`.toLowerCase() === full;
  });
  if (!project) return "unknown repository";
  const repo = repoOf(project)!;
  const tasks = (await listRecords("tasks")).filter((t) => t.projectId === project.id && s(t.taskKey));
  const byBranch = (ref: string) => {
    const key = keyFromBranch(ref);
    return key ? tasks.find((t) => s(t.taskKey) === key) : undefined;
  };
  const bySha = (sha: string) => tasks.filter((t) => s((t.pr as Rec | undefined)?.headSha) === sha);
  const by = "GitHub";

  switch (event) {
    case "push": {
      const t = byBranch(s(p.ref));
      if (!t || p.deleted) return "ignored";
      const commits = Array.isArray(p.commits) ? p.commits : [];
      // creating the branch is reported as a push with no commits: nothing has been worked on yet
      if (!commits.length) return "ignored (no new commits)";
      const head = p.head_commit ?? commits[commits.length - 1];
      await upsertRecord("tasks", { ...t, status: "doing", commits: Number(t.commits ?? 0) + commits.length, lastCommit: head ? { sha: s(head.id), message: s(head.message).split("\n")[0].slice(0, 200), at: s(head.timestamp), author: s(head.author?.name) } : t.lastCommit, devStatus: statusAfter(s(t.devStatus) as DevStatus, { kind: "push" }) }, by);
      return "push recorded";
    }
    case "pull_request": {
      const t = byBranch(s(p.pull_request?.head?.ref));
      if (!t) return "ignored";
      const pr = p.pull_request;
      const fields = { number: pr.number, url: s(pr.html_url), state: s(pr.state), merged: pr.merged === true, mergeable: pr.mergeable ?? null, headSha: s(pr.head?.sha), additions: pr.additions ?? 0, deletions: pr.deletions ?? 0, changedFiles: pr.changed_files ?? 0 };
      const kind = p.action === "closed" ? (pr.merged ? "pr-merged" : "pr-closed") : ["opened", "reopened", "ready_for_review"].includes(p.action) ? "pr-opened" : null;
      const mergedOutside = kind === "pr-merged" && s(t.devStatus) !== "merged";
      await upsertRecord("tasks", { ...t, pr: fields, ...(kind ? { devStatus: statusAfter(s(t.devStatus) as DevStatus, { kind }) } : {}), ...(kind === "pr-merged" ? { status: "done", mergedAt: s(pr.merged_at) || now(), mergedBy: mergedOutside ? `${s(pr.merged_by?.login)} (on GitHub, not through HQ)` : t.mergedBy } : {}), devHistory: [...hist(t), ev(by, `Pull request ${p.action}`, mergedOutside ? "Merged directly on GitHub — outside HQ's review rules" : undefined)] }, by);
      return "pull request recorded";
    }
    case "pull_request_review": {
      const t = byBranch(s(p.pull_request?.head?.ref));
      const state = s(p.review?.state).toLowerCase();
      if (!t || !["approved", "changes_requested"].includes(state)) return "ignored";
      // a GitHub review counts only from a team member marked as a code reviewer
      const login = s(p.review?.user?.login).toLowerCase();
      const member = (await listRecords("team")).find((m) => s(m.githubUsername).toLowerCase() === login);
      if (!member || member.codeReviewer !== true || member.id === s(t.assigneeId)) return "review ignored (not a code reviewer)";
      const decision = state === "approved" ? "approved" : "changes";
      const review: Review = { by: `${s(member.name)} (GitHub)`, byTeamId: member.id, decision, sha: s(p.review?.commit_id), at: s(p.review?.submitted_at) || now(), ...(s(p.review?.body) ? { comment: s(p.review.body).slice(0, 3000) } : {}) };
      await upsertRecord("tasks", { ...t, reviews: [...(Array.isArray(t.reviews) ? (t.reviews as Review[]) : []), review], devStatus: statusAfter(s(t.devStatus) as DevStatus, { kind: "review", decision }), devHistory: [...hist(t), ev(review.by, decision === "approved" ? "Approved on GitHub" : "Changes requested on GitHub")] }, by);
      return "review recorded";
    }
    case "issue_comment":
      if (!p.issue?.pull_request || p.action !== "created") return "ignored";
      return reviewPosted(project, p, tasks);
    case "workflow_run":
      if (p.action === "completed") {
        const path = s(p.workflow_run?.path);
        if (path.endsWith("claude-plan.yml")) return planFinished(project, p.workflow_run);
        if (path.endsWith("claude-build.yml")) return buildFinished(project, p.workflow_run, tasks);
      }
    // falls through: any other workflow updates the checks of the commit it ran on
    case "check_run":
    case "check_suite":
    case "status": {
      const sha = s(p.sha || p.workflow_run?.head_sha || p.check_run?.head_sha || p.check_suite?.head_sha);
      for (const t of bySha(sha)) {
        const checks = await checksFor(repo, sha);
        await upsertRecord("tasks", { ...t, checks: { ...checks, sha, at: now() } }, by);
      }
      return "checks updated";
    }
    case "deployment_status": {
      if (s(p.deployment_status?.state) !== "success") return "ignored";
      const url = s(p.deployment_status?.environment_url || p.deployment_status?.target_url);
      const env = s(p.deployment?.environment).toLowerCase();
      const sha = s(p.deployment?.sha);
      if (/prod/.test(env)) {
        await upsertRecord("projects", { ...project, ...(url ? { liveUrl: s(project.liveUrl) || url } : {}), lastDeployAt: now() }, by);
        return "production deploy recorded";
      }
      for (const t of bySha(sha)) await upsertRecord("tasks", { ...t, previewUrl: url }, by);
      if (url && !s(project.stagingUrl)) await upsertRecord("projects", { ...project, stagingUrl: url }, by);
      return "preview recorded";
    }
    default:
      return "ignored";
  }
}

export { GitHubError };
