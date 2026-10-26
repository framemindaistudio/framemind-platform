/**
 * The Claude workflows HQ writes into every client repository. Claude runs inside GitHub Actions — on the studio's
 * Claude Max subscription (organization secret CLAUDE_CODE_OAUTH_TOKEN, made with `claude setup-token`) or, if that
 * isn't set, an Anthropic API key (ANTHROPIC_API_KEY). HQ starts Plan and Build; Review starts on every pull request.
 *
 *   claude-plan.yml    founder summary + client requirements → PROJECT_PLAN, PRD, Architecture, Rules, Design, tasks.json
 *   claude-build.yml   one task → code on its branch, checks run, committed and pushed
 *   claude-review.yml  a pull request → review comments + a verdict line HQ reads (approve / changes)
 *
 * These files are HQ's own: they are rewritten whenever the docs are updated.
 */

/** The verdict line Claude ends its review with; HQ reads it from the PR comment. */
export const REVIEW_MARK = "hq-claude-review";
export function parseReviewMark(body: string): { sha: string; verdict: "approve" | "changes" } | null {
  const m = new RegExp(`<!--\\s*${REVIEW_MARK}\\s+sha=([0-9a-f]{7,40})\\s+verdict=(approve|changes)\\s*-->`).exec(body);
  return m ? { sha: m[1], verdict: m[2] as "approve" | "changes" } : null;
}

/** The file Claude's plan writes the task list to, read by HQ when the plan is approved. */
export const TASKS_JSON = "docs/tasks.json";

const indent = (text: string, n: number) =>
  text
    .split("\n")
    .map((l) => (l ? " ".repeat(n) + l : l))
    .join("\n");

/** The Claude step twice — Max subscription first, API key otherwise — with the same prompt and tools. */
function claudeSteps(prompt: string, tools: string, maxTurns = 150) {
  const step = (name: string, cond: string, auth: string) => `- name: ${name}
  if: ${cond}
  uses: anthropics/claude-code-action@v1
  with:
    ${auth}
    prompt: |
${indent(prompt, 6)}
    claude_args: |
      --allowedTools "${tools}" --max-turns ${maxTurns}`;
  return [
    step("Claude (Max subscription)", "env.HAS_OAUTH == 'true'", "claude_code_oauth_token: ${{ secrets.CLAUDE_CODE_OAUTH_TOKEN }}"),
    step("Claude (API key)", "env.HAS_OAUTH != 'true' && env.HAS_KEY == 'true'", "anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}"),
  ]
    .map((x) => indent(x, 6))
    .join("\n");
}

const AUTH_ENV = `    env:
      GH_TOKEN: \${{ github.token }}
      HAS_OAUTH: \${{ secrets.CLAUDE_CODE_OAUTH_TOKEN != '' }}
      HAS_KEY: \${{ secrets.ANTHROPIC_API_KEY != '' }}`;

const NEED_TOKEN = `      - name: Claude needs a token
        if: env.HAS_OAUTH != 'true' && env.HAS_KEY != 'true'
        run: |
          echo "::error::Add CLAUDE_CODE_OAUTH_TOKEN (Claude Max: run 'claude setup-token') or ANTHROPIC_API_KEY as an organization Actions secret."
          exit 1`;

const GIT_ID = `      - name: Git identity
        run: |
          git config user.name "Claude (FrameMind HQ)"
          git config user.email "claude@users.noreply.github.com"`;

const BUILD_TOOLS = "Edit,Write,Read,Glob,Grep,MultiEdit,Bash(gh pr view:*),Bash(git:*),Bash(npm:*),Bash(npx:*),Bash(node:*),Bash(ls:*),Bash(cat:*),Bash(mkdir:*)";

export const CLAUDE_PLAN_WORKFLOW = `name: Claude plan
on:
  workflow_dispatch:
    inputs:
      branch:
        description: Branch for the plan
        required: true
permissions:
  contents: write
  id-token: write
concurrency: claude-plan
jobs:
  plan:
    runs-on: ubuntu-latest
    timeout-minutes: 60
${AUTH_ENV}
    steps:
${NEED_TOKEN}
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
${GIT_ID}
      - name: Plan branch
        run: git switch -c "\${{ inputs.branch }}"
${claudeSteps(
  `You are the technical lead at FrameMind AI Studio planning a client project.
Read docs/FOUNDER_SUMMARY.md first: it is the founder's decision on what we are building and overrides everything else.
Then read docs/CLIENT_REQUIREMENTS.md (what the client submitted).
Write these files, in clear plain-English markdown, never inventing client facts (list unknowns under "Open questions"):
- docs/PROJECT_PLAN.md: the detailed plan from the founder's summary: scope, phases, milestones, risks, open questions
- docs/PRD.md, docs/Architecture.md, docs/Rules.md, docs/Design.md: replace the starting templates completely
- ${TASKS_JSON}: the build broken into 5-20 tasks, each one pull request of work, in build order, starting with project setup:
  {"tasks":[{"title":"short imperative title","type":"feature","priority":"medium","role":"developer|designer|qa|devops","description":"what to build","acceptance":["testable criterion", "..."]}]}
Prefer Next.js (App Router) + TypeScript + Tailwind on Vercel unless the summary says otherwise.
Do not change docs/FOUNDER_SUMMARY.md, docs/CLIENT_REQUIREMENTS.md, docs/Tasks.md, CLAUDE.md or .github/.
When done: git add -A, commit "Project plan by Claude", and git push origin HEAD.`,
  "Edit,Write,Read,Glob,Grep,Bash(git:*),Bash(ls:*),Bash(cat:*),Bash(mkdir:*)",
  80,
)}
      - name: Push anything left
        if: always()
        run: |
          git add -A
          git diff --cached --quiet || git commit -m "Project plan by Claude"
          git push origin HEAD || true
`;

export const CLAUDE_BUILD_WORKFLOW = `name: Claude build
on:
  workflow_dispatch:
    inputs:
      task:
        description: Task ID (e.g. JHM-104)
        required: true
      branch:
        description: The task's branch
        required: true
      instructions:
        description: Extra instructions (e.g. review feedback to address)
        required: false
        default: ""
permissions:
  contents: write
  pull-requests: read
  id-token: write
concurrency: claude-build-\${{ inputs.branch }}
jobs:
  build:
    runs-on: ubuntu-latest
    timeout-minutes: 90
${AUTH_ENV}
    steps:
${NEED_TOKEN}
      - uses: actions/checkout@v4
        with:
          ref: \${{ inputs.branch }}
          fetch-depth: 0
      - uses: actions/setup-node@v4
        with:
          node-version: 22
${GIT_ID}
${claudeSteps(
  `You are the developer on task \${{ inputs.task }} at FrameMind AI Studio, working on branch \${{ inputs.branch }}.
Read CLAUDE.md, docs/FOUNDER_SUMMARY.md, docs/PROJECT_PLAN.md (if present), docs/Rules.md, docs/Architecture.md and docs/Design.md,
then the \${{ inputs.task }} section of docs/Tasks.md. Build exactly that task until every acceptance criterion is met.
If package.json exists: install, then run lint, tests and build, and fix what fails.
Commit in small steps with messages starting "\${{ inputs.task }}: ", then git push origin HEAD. Never push to main.
\${{ inputs.instructions }}`,
  BUILD_TOOLS,
)}
      - name: Push anything left
        if: always()
        run: |
          git add -A
          git diff --cached --quiet || git commit -m "\${{ inputs.task }}: work in progress by Claude"
          git push origin HEAD || true
`;

export const CLAUDE_REVIEW_WORKFLOW = `name: Claude review
on:
  pull_request:
    types: [opened, reopened, synchronize, ready_for_review]
  workflow_dispatch:
    inputs:
      pr:
        description: Pull request number
        required: true
permissions:
  contents: read
  pull-requests: write
  issues: write
  id-token: write
concurrency: claude-review-\${{ github.event.pull_request.number || inputs.pr }}
jobs:
  review:
    runs-on: ubuntu-latest
    timeout-minutes: 30
${AUTH_ENV}
    steps:
      - name: No Claude token
        if: env.HAS_OAUTH != 'true' && env.HAS_KEY != 'true'
        run: echo "::notice::No Claude token set (CLAUDE_CODE_OAUTH_TOKEN or ANTHROPIC_API_KEY) — skipping Claude's review."
      - uses: actions/checkout@v4
        with:
          fetch-depth: 1
${claudeSteps(
  `REPO: \${{ github.repository }}
PR NUMBER: \${{ github.event.pull_request.number || inputs.pr }}
Review this pull request against docs/FOUNDER_SUMMARY.md, CLAUDE.md, docs/Rules.md and the task's acceptance criteria in docs/Tasks.md
(the task ID is in the branch name). Look for bugs, security issues, missing error handling, unmet acceptance criteria and performance problems.
Use inline comments for specific lines. Then post ONE summary comment with gh pr comment. Its very last line must be exactly
<!-- ${REVIEW_MARK} sha=HEAD_SHA verdict=approve -->
or, if anything must change before merging,
<!-- ${REVIEW_MARK} sha=HEAD_SHA verdict=changes -->
where HEAD_SHA is the full SHA from: gh pr view <number> --json headRefOid -q .headRefOid`,
  "mcp__github_inline_comment__create_inline_comment,Bash(gh pr comment:*),Bash(gh pr diff:*),Bash(gh pr view:*),Read,Glob,Grep",
  60,
)}
`;
