/** Tests for the development workflow rules. Run: npm test */
import { test } from "node:test";
import assert from "node:assert/strict";
import { branchName, claudeReviewFor, keyFromBranch, mergeProblem, prefixFor, reviewProblem, statusAfter, taskKey } from "./rules.ts";
import { parseReviewMark } from "./workflows.ts";

test("task keys, prefixes and branch names", () => {
  assert.equal(taskKey("fm", 104), "FM-104");
  assert.equal(prefixFor("Jagkalyan Holistic Mission — Website"), "JHM");
  assert.equal(prefixFor("x"), "FM");
  assert.equal(branchName("feature", "FM-104", "Build Client Login!"), "feature/FM-104-build-client-login");
  assert.equal(keyFromBranch("feature/FM-104-build-client-login"), "FM-104");
  assert.equal(keyFromBranch("refs/heads/hotfix/JHM-9-crash"), "JHM-9");
  assert.equal(keyFromBranch("main"), null);
  assert.equal(keyFromBranch("feature/no-key-here"), null);
});

const pr = { state: "open", merged: false, mergeable: true, headSha: "abc" };
const approved = { by: "Tech Lead", byTeamId: "tl", decision: "approved" as const, sha: "abc", at: "t" };

test("merge only with an approval on the latest commit, from someone else, with green checks", () => {
  const base = { actorRole: "founder", assigneeId: "dev", pr, checks: "success" as const, reviews: [approved] };
  assert.equal(mergeProblem(base), null);
  assert.match(mergeProblem({ ...base, actorRole: "studio" }) ?? "", /founder or an admin/);
  assert.match(mergeProblem({ ...base, reviews: [] }) ?? "", /approval/);
  assert.match(mergeProblem({ ...base, reviews: [{ ...approved, sha: "old" }] }) ?? "", /latest commit/, "a new push needs a new review");
  assert.match(mergeProblem({ ...base, reviews: [approved, { ...approved, decision: "changes" }] }) ?? "", /asked for changes/);
  assert.match(mergeProblem({ ...base, reviews: [{ ...approved, byTeamId: "dev" }] }) ?? "", /someone other/);
  assert.match(mergeProblem({ ...base, actorTeamId: "dev" }) ?? "", /own work/);
  assert.match(mergeProblem({ ...base, checks: "failure" }) ?? "", /failed/);
  assert.match(mergeProblem({ ...base, checks: "pending" }) ?? "", /running/);
  assert.match(mergeProblem({ ...base, checks: "none" }) ?? "", /No checks/);
  assert.match(mergeProblem({ ...base, pr: { ...pr, mergeable: false } }) ?? "", /conflict/);
  assert.match(mergeProblem({ ...base, pr: { ...pr, merged: true } }) ?? "", /already merged/);
});

test("who may review", () => {
  assert.equal(reviewProblem({ actorRole: "studio", actorIsReviewer: true, actorTeamId: "tl", assigneeId: "dev", hasPR: true }), null);
  assert.match(reviewProblem({ actorRole: "studio", actorIsReviewer: false, hasPR: true }) ?? "", /code reviewer/);
  assert.match(reviewProblem({ actorRole: "founder", actorIsReviewer: false, actorTeamId: "dev", assigneeId: "dev", hasPR: true }) ?? "", /own work/);
});

test("status follows GitHub", () => {
  assert.equal(statusAfter("todo", { kind: "push" }), "in-progress");
  assert.equal(statusAfter("approved", { kind: "push" }), "in-review", "new commits after approval need re-review");
  assert.equal(statusAfter("in-progress", { kind: "pr-opened" }), "in-review");
  assert.equal(statusAfter("in-review", { kind: "review", decision: "changes" }), "changes");
  assert.equal(statusAfter("approved", { kind: "pr-merged" }), "merged");
  assert.equal(statusAfter("merged", { kind: "pr-closed" }), "merged");
});

test("Claude's review: optional by default, required when the project says so, enough on autopilot", () => {
  const base = { actorRole: "founder", assigneeId: "dev", pr, checks: "success" as const, reviews: [approved] };
  assert.equal(mergeProblem({ ...base, claudeReview: "missing" }), null, "not required unless the project asks");
  assert.match(mergeProblem({ ...base, claudeReview: "missing", requireClaude: true }) ?? "", /requires Claude/);
  assert.match(mergeProblem({ ...base, claudeReview: "changes", requireClaude: true }) ?? "", /asked for changes/);
  assert.equal(mergeProblem({ ...base, claudeReview: "passed", requireClaude: true }), null);
  // autopilot: no human review needed, Claude's approval on the head commit + green checks is
  const auto = { actorRole: "system", assigneeId: "claude", pr, checks: "success" as const, reviews: [], autopilot: true };
  assert.equal(mergeProblem({ ...auto, claudeReview: "passed" }), null);
  assert.match(mergeProblem({ ...auto, claudeReview: "missing" }) ?? "", /Waiting for Claude/);
  assert.match(mergeProblem({ ...auto, claudeReview: "passed", checks: "pending" }) ?? "", /running/);
  assert.match(mergeProblem({ ...base, actorRole: "system", claudeReview: "passed" }) ?? "", /founder or an admin/, "outside autopilot the system can't merge");
  // the verdict counts only for the exact commit
  const v = [{ sha: "abc1234", verdict: "approve" as const, at: "t" }];
  assert.equal(claudeReviewFor(v, "abc1234def"), "passed");
  assert.equal(claudeReviewFor(v, "fff0000"), "missing");
  assert.equal(claudeReviewFor([...v, { sha: "abc1234", verdict: "changes" as const, at: "t2" }], "abc1234"), "changes");
});

test("Claude's verdict line is read from its review comment", () => {
  assert.deepEqual(parseReviewMark("Looks good.\n<!-- hq-claude-review sha=0123456789abcdef verdict=approve -->"), { sha: "0123456789abcdef", verdict: "approve" });
  assert.equal(parseReviewMark("<!-- hq-claude-review sha=HEAD_SHA verdict=approve -->"), null, "the placeholder itself is not a verdict");
  assert.equal(parseReviewMark("no verdict here"), null);
});
