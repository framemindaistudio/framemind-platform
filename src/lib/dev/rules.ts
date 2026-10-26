/**
 * Development workflow rules, with no I/O, so they can be tested (rules.test.ts): task IDs, branch names, and the
 * conditions HQ enforces before anything reaches main. HQ — not GitHub settings — is what guards main: merges happen
 * only through HQ's Merge button, and only when these rules pass.
 */

export type DevType = "feature" | "fix" | "hotfix";
export type DevStatus = "todo" | "in-progress" | "in-review" | "changes" | "approved" | "merged" | "closed";

export const DEV_STATUS_LABELS: Record<DevStatus, string> = {
  todo: "To do",
  "in-progress": "In progress",
  "in-review": "In review",
  changes: "Changes requested",
  approved: "Approved",
  merged: "Merged",
  closed: "Closed without merge",
};

/** "FM" + 104 → "FM-104" */
export const taskKey = (prefix: string, n: number) => `${prefix.toUpperCase()}-${n}`;

/** A project's task prefix from its title: the first letters of up to 3 words, else "FM". */
export function prefixFor(title: string) {
  const letters = title
    .replace(/[^A-Za-z0-9 ]/g, " ")
    .split(/\s+/)
    .filter((w) => w && !/^(the|and|of|for|a|an)$/i.test(w))
    .slice(0, 3)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  return letters.length >= 2 ? letters : "FM";
}

export function slug(text: string, max = 40) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, max)
    .replace(/-+$/, "");
}

/** feature/FM-104-client-login · fix/FM-107-auth-error · hotfix/FM-109-critical */
export const branchName = (type: DevType, key: string, title: string) => `${type}/${key}-${slug(title) || "task"}`;

/** The task key a branch belongs to, e.g. "feature/FM-104-client-login" → "FM-104". */
export function keyFromBranch(branch: string): string | null {
  const m = /^(?:refs\/heads\/)?(?:feature|fix|hotfix)\/([A-Z0-9]{2,6}-\d+)(?:-|$)/.exec(branch);
  return m ? m[1] : null;
}

/** A safe GitHub repository name from a project title. */
export const repoName = (title: string) => slug(title, 60) || "client-project";

export interface Review {
  by: string;
  byTeamId?: string;
  decision: "approved" | "changes";
  sha: string;
  at: string;
  comment?: string;
}

/**
 * Why a task cannot be merged yet, or null when it can. The approval must be on the exact commit being merged (a new
 * push needs a new review), from someone other than the person who wrote it, with every check green.
 */
export function mergeProblem(o: {
  actorRole: string;
  actorTeamId?: string;
  assigneeId?: string;
  pr?: { state: string; merged: boolean; mergeable: boolean | null; headSha: string } | null;
  checks: "success" | "pending" | "failure" | "none";
  reviews: Review[];
}): string | null {
  if (!["founder", "admin"].includes(o.actorRole)) return "Only the founder or an admin merges to main.";
  if (!o.pr) return "Open the pull request first.";
  if (o.pr.merged) return "This pull request is already merged.";
  if (o.pr.state !== "open") return "This pull request is closed.";
  if (o.actorTeamId && o.assigneeId && o.actorTeamId === o.assigneeId) return "Nobody merges their own work — another reviewer must.";
  const onHead = o.reviews.filter((r) => r.sha === o.pr!.headSha);
  const last = onHead[onHead.length - 1];
  if (!last) return "It needs an approval on the latest commit (new commits since the last review need a fresh one).";
  if (last.decision !== "approved") return "The latest review asked for changes.";
  if (o.assigneeId && last.byTeamId === o.assigneeId) return "The approval must come from someone other than the developer.";
  if (o.checks === "failure") return "Some checks failed — fix them before merging.";
  if (o.checks === "pending") return "Checks are still running.";
  if (o.checks === "none") return "No checks have run on the latest commit yet.";
  if (o.pr.mergeable === false) return "GitHub reports a conflict with main — update the branch first.";
  return null;
}

/** Who may review: founders and admins, and team members marked as code reviewers — never on their own task. */
export function reviewProblem(o: { actorRole: string; actorTeamId?: string; actorIsReviewer: boolean; assigneeId?: string; hasPR: boolean }): string | null {
  if (!o.hasPR) return "There's no pull request to review yet.";
  if (!["founder", "admin"].includes(o.actorRole) && !o.actorIsReviewer) return "Only the founder, an admin or a code reviewer reviews pull requests.";
  if (o.actorTeamId && o.assigneeId && o.actorTeamId === o.assigneeId) return "Nobody reviews their own work.";
  return null;
}

/** The task's status after a GitHub event, given what it was. */
export function statusAfter(current: DevStatus, event: { kind: "push" | "pr-opened" | "pr-closed" | "pr-merged" | "review"; decision?: "approved" | "changes" }): DevStatus {
  switch (event.kind) {
    case "push":
      // new commits after a review need a fresh review
      return current === "todo" ? "in-progress" : current === "approved" || current === "changes" ? "in-review" : current;
    case "pr-opened":
      return current === "merged" ? current : "in-review";
    case "pr-merged":
      return "merged";
    case "pr-closed":
      return current === "merged" ? current : "closed";
    case "review":
      return event.decision === "approved" ? "approved" : "changes";
  }
}
