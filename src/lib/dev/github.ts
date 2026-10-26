import "server-only";

/**
 * GitHub for client projects — separate from the HQ data store (lib/store), which only ever touches the private
 * data repository. Configured in Vercel:
 *   GITHUB_DEV_TOKEN    a fine-grained token (or classic token) of the founder's account with access to the
 *                       organization's repositories: Administration, Contents, Pull requests, Webhooks, Workflows
 *                       (read and write); Actions (read and write, to start Claude's workflows); Commit statuses (read)
 *   GITHUB_DEV_OWNER    the GitHub organization the client repositories live in (e.g. framemind-studio)
 *   GITHUB_WEBHOOK_SECRET  a long random value; HQ signs up each repository's webhook with it and checks every event
 */

const API = "https://api.github.com";

export class GitHubError extends Error {
  constructor(
    message: string,
    public status = 502,
  ) {
    super(message);
  }
}

export const devOwner = () => (process.env.GITHUB_DEV_OWNER || "").trim();
export const devReady = () => !!process.env.GITHUB_DEV_TOKEN && !!devOwner();
export const webhookSecret = () => process.env.GITHUB_WEBHOOK_SECRET || "";

async function gh<T = unknown>(path: string, init: RequestInit = {}, okMissing = false): Promise<T | null> {
  const token = process.env.GITHUB_DEV_TOKEN;
  if (!token) throw new GitHubError("Developer automation isn't connected yet (GITHUB_DEV_TOKEN is missing).", 503);
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28", ...(init.body ? { "Content-Type": "application/json" } : {}), ...(init.headers ?? {}) },
    cache: "no-store",
  });
  if (okMissing && res.status === 404) return null;
  if (res.status === 204) return {} as T;
  const body = (await res.json().catch(() => ({}))) as { message?: string; errors?: { message?: string }[] };
  if (!res.ok) throw new GitHubError(`GitHub: ${body.message || res.status}${body.errors?.[0]?.message ? ` — ${body.errors[0].message}` : ""}`, res.status === 404 ? 404 : res.status === 409 || res.status === 422 ? 409 : 502);
  return body as T;
}

const enc = (s: string) => s.split("/").map(encodeURIComponent).join("/");

/* ───────────────────────────── repositories ───────────────────────────── */

export interface Repo {
  owner: string;
  name: string;
  url: string;
  defaultBranch: string;
}

/** Create a private repository in the organization (or the token's own account when the owner is that user). */
export async function createRepo(name: string, description: string): Promise<Repo> {
  const owner = devOwner();
  const body = JSON.stringify({ name, description: description.slice(0, 300), private: true, auto_init: true, has_wiki: false, allow_squash_merge: true, allow_merge_commit: false, allow_rebase_merge: false, delete_branch_on_merge: true });
  const me = await gh<{ login: string }>("/user");
  const r = await gh<{ name: string; html_url: string; default_branch: string; owner: { login: string } }>(me?.login?.toLowerCase() === owner.toLowerCase() ? "/user/repos" : `/orgs/${enc(owner)}/repos`, { method: "POST", body });
  return { owner: r!.owner.login, name: r!.name, url: r!.html_url, defaultBranch: r!.default_branch || "main" };
}

export async function getRepo(owner: string, name: string): Promise<Repo | null> {
  const r = await gh<{ name: string; html_url: string; default_branch: string; owner: { login: string } }>(`/repos/${enc(owner)}/${enc(name)}`, {}, true);
  return r ? { owner: r.owner.login, name: r.name, url: r.html_url, defaultBranch: r.default_branch || "main" } : null;
}

/* ───────────────────────────── branches & files ───────────────────────────── */

export async function branchSha(repo: Repo, branch: string): Promise<string | null> {
  const r = await gh<{ object: { sha: string } }>(`/repos/${enc(repo.owner)}/${enc(repo.name)}/git/ref/heads/${enc(branch)}`, {}, true);
  return r?.object.sha ?? null;
}

/** Create `branch` from the default branch; an existing branch is left as it is. */
export async function createBranch(repo: Repo, branch: string): Promise<{ created: boolean }> {
  if (await branchSha(repo, branch)) return { created: false };
  const base = await branchSha(repo, repo.defaultBranch);
  if (!base) throw new GitHubError(`The ${repo.defaultBranch} branch of ${repo.name} wasn't found.`, 404);
  await gh(`/repos/${enc(repo.owner)}/${enc(repo.name)}/git/refs`, { method: "POST", body: JSON.stringify({ ref: `refs/heads/${branch}`, sha: base }) });
  return { created: true };
}

export async function deleteBranch(repo: Repo, branch: string) {
  await gh(`/repos/${enc(repo.owner)}/${enc(repo.name)}/git/refs/heads/${enc(branch)}`, { method: "DELETE" }, true);
}

/**
 * Create or update one file on a branch. Unchanged content makes no commit. `onlyIfMissing` never touches an existing
 * file — unless `replaceIf` says the existing content may be replaced (e.g. it is still HQ's untouched template).
 */
export async function putFile(repo: Repo, path: string, content: string, message: string, branch = repo.defaultBranch, onlyIfMissing = false, replaceIf?: (current: string) => boolean): Promise<{ changed: boolean }> {
  const current = await gh<{ sha: string; content: string }>(`/repos/${enc(repo.owner)}/${enc(repo.name)}/contents/${enc(path)}?ref=${encodeURIComponent(branch)}`, {}, true);
  if (current && onlyIfMissing && !(replaceIf && replaceIf(Buffer.from(current.content, "base64").toString("utf8")))) return { changed: false };
  const b64 = Buffer.from(content, "utf8").toString("base64");
  if (current && current.content.replace(/\n/g, "") === b64) return { changed: false };
  await gh(`/repos/${enc(repo.owner)}/${enc(repo.name)}/contents/${enc(path)}`, { method: "PUT", body: JSON.stringify({ message, content: b64, branch, ...(current ? { sha: current.sha } : {}) }) });
  return { changed: true };
}

/* ───────────────────────────── pull requests ───────────────────────────── */

export interface PullRequest {
  number: number;
  url: string;
  state: "open" | "closed";
  merged: boolean;
  mergeable: boolean | null;
  mergeableState: string;
  headSha: string;
  title: string;
  additions: number;
  deletions: number;
  changedFiles: number;
}

type RawPR = { number: number; html_url: string; state: "open" | "closed"; merged: boolean; mergeable: boolean | null; mergeable_state: string; head: { sha: string }; title: string; additions: number; deletions: number; changed_files: number };
const toPR = (p: RawPR): PullRequest => ({ number: p.number, url: p.html_url, state: p.state, merged: p.merged, mergeable: p.mergeable, mergeableState: p.mergeable_state, headSha: p.head.sha, title: p.title, additions: p.additions ?? 0, deletions: p.deletions ?? 0, changedFiles: p.changed_files ?? 0 });

export async function openPullRequest(repo: Repo, head: string, title: string, body: string): Promise<PullRequest> {
  const existing = await gh<RawPR[]>(`/repos/${enc(repo.owner)}/${enc(repo.name)}/pulls?state=open&head=${encodeURIComponent(`${repo.owner}:${head}`)}`);
  if (existing && existing.length) return getPullRequest(repo, existing[0].number);
  const p = await gh<RawPR>(`/repos/${enc(repo.owner)}/${enc(repo.name)}/pulls`, { method: "POST", body: JSON.stringify({ head, base: repo.defaultBranch, title, body }) });
  return toPR(p!);
}

export async function getPullRequest(repo: Repo, n: number): Promise<PullRequest> {
  return toPR((await gh<RawPR>(`/repos/${enc(repo.owner)}/${enc(repo.name)}/pulls/${n}`))!);
}

/**
 * The combined result of the checks on a commit: GitHub Actions runs (CI, Claude review) plus commit statuses
 * (e.g. hosting providers). Read through the Actions API, which fine-grained tokens can see ("Actions: Read-only");
 * third-party check runs are added when the token happens to be allowed to read them.
 */
export async function checksFor(repo: Repo, sha: string): Promise<{ state: "success" | "pending" | "failure" | "none"; items: { name: string; state: string; url: string }[] }> {
  const base = `/repos/${enc(repo.owner)}/${enc(repo.name)}`;
  const [runs, status, checkRuns] = await Promise.all([
    gh<{ workflow_runs: { name: string; status: string; conclusion: string | null; html_url: string; run_attempt: number; workflow_id: number; created_at: string }[] }>(`${base}/actions/runs?head_sha=${sha}&per_page=50`).catch(() => null),
    gh<{ statuses: { context: string; state: string; target_url: string }[] }>(`${base}/commits/${sha}/status`).catch(() => null),
    gh<{ check_runs: { name: string; status: string; conclusion: string | null; html_url: string; app?: { slug?: string } }[] }>(`${base}/commits/${sha}/check-runs?per_page=50`).catch(() => null),
  ]);
  // the newest run of each workflow counts (a re-run replaces the earlier result)
  const latest = new Map<number, { name: string; status: string; conclusion: string | null; html_url: string; created_at: string }>();
  for (const r of runs?.workflow_runs ?? []) {
    const prev = latest.get(r.workflow_id);
    if (!prev || r.created_at > prev.created_at) latest.set(r.workflow_id, r);
  }
  const verdict = (status: string, conclusion: string | null) => (status !== "completed" ? "pending" : conclusion === "skipped" ? "skipped" : conclusion === "success" || conclusion === "neutral" ? "success" : "failure");
  const items = [
    ...[...latest.values()].map((r) => ({ name: r.name, state: verdict(r.status, r.conclusion), url: r.html_url })),
    ...(status?.statuses ?? []).map((x) => ({ name: x.context, state: x.state === "success" ? "success" : x.state === "pending" ? "pending" : "failure", url: x.target_url })),
    // check runs made by GitHub Actions are already counted above
    ...(checkRuns?.check_runs ?? []).filter((c) => c.app?.slug !== "github-actions").map((c) => ({ name: c.name, state: verdict(c.status, c.conclusion), url: c.html_url })),
  ];
  return { state: combine(items.map((i) => i.state)), items };
}

/** Pure: the overall state of a set of check states. */
export function combine(states: string[]): "success" | "pending" | "failure" | "none" {
  states = states.map((s) => (s === "skipped" ? "success" : s));
  if (!states.length) return "none";
  if (states.some((s) => s === "failure")) return "failure";
  if (states.some((s) => s === "pending")) return "pending";
  return "success";
}

export async function commentOnPR(repo: Repo, n: number, body: string) {
  await gh(`/repos/${enc(repo.owner)}/${enc(repo.name)}/issues/${n}/comments`, { method: "POST", body: JSON.stringify({ body }) });
}

/** Squash-merge, only if the head is still the commit that was reviewed. */
export async function mergePullRequest(repo: Repo, n: number, sha: string, title: string): Promise<{ sha: string }> {
  const r = await gh<{ sha: string; merged: boolean; message: string }>(`/repos/${enc(repo.owner)}/${enc(repo.name)}/pulls/${n}/merge`, { method: "PUT", body: JSON.stringify({ merge_method: "squash", sha, commit_title: title }) });
  if (!r?.merged) throw new GitHubError(r?.message || "GitHub did not merge the pull request.", 409);
  return { sha: r.sha };
}

/** The text of a file on a branch, or null when it doesn't exist. */
export async function getFileText(repo: Repo, path: string, branch: string): Promise<string | null> {
  const r = await gh<{ content: string }>(`/repos/${enc(repo.owner)}/${enc(repo.name)}/contents/${enc(path)}?ref=${encodeURIComponent(branch)}`, {}, true);
  return r ? Buffer.from(r.content, "base64").toString("utf8") : null;
}

/** Merge one branch into another directly (used for the approved plan branch). */
export async function mergeBranch(repo: Repo, head: string, message: string) {
  await gh(`/repos/${enc(repo.owner)}/${enc(repo.name)}/merges`, { method: "POST", body: JSON.stringify({ base: repo.defaultBranch, head, commit_message: message }) });
}

/** Start a workflow (needs the token's "Actions: Read and write"). */
export async function dispatchWorkflow(repo: Repo, file: string, inputs: Record<string, string>, ref = repo.defaultBranch) {
  await gh(`/repos/${enc(repo.owner)}/${enc(repo.name)}/actions/workflows/${enc(file)}/dispatches`, { method: "POST", body: JSON.stringify({ ref, inputs }) });
}

/* ───────────────────────────── webhooks & people ───────────────────────────── */

export async function ensureWebhook(repo: Repo, url: string) {
  const secret = webhookSecret();
  if (!secret) throw new GitHubError("GITHUB_WEBHOOK_SECRET isn't set, so GitHub can't be connected to HQ securely.", 503);
  const hooks = (await gh<{ id: number; config: { url?: string } }[]>(`/repos/${enc(repo.owner)}/${enc(repo.name)}/hooks`)) ?? [];
  const config = { url, content_type: "json", secret, insecure_ssl: "0" };
  const events = ["push", "pull_request", "pull_request_review", "issue_comment", "workflow_run", "status", "deployment_status"];
  const found = hooks.find((h) => h.config.url === url);
  if (found) await gh(`/repos/${enc(repo.owner)}/${enc(repo.name)}/hooks/${found.id}`, { method: "PATCH", body: JSON.stringify({ config, events, active: true }) });
  else await gh(`/repos/${enc(repo.owner)}/${enc(repo.name)}/hooks`, { method: "POST", body: JSON.stringify({ name: "web", config, events, active: true }) });
}

/** Invite a GitHub user to the repository (push: can create branches and PRs; triage: QA, read and comment). */
export async function addCollaborator(repo: Repo, username: string, permission: "push" | "triage" | "maintain") {
  await gh(`/repos/${enc(repo.owner)}/${enc(repo.name)}/collaborators/${enc(username)}`, { method: "PUT", body: JSON.stringify({ permission }) });
}
