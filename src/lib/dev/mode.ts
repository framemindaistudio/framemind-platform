/**
 * Claude on GitHub — Claude planning, building and reviewing inside GitHub Actions, and the autopilot — is on hold
 * until the server setting HQ_CLAUDE_ON_GITHUB is "on".
 *
 * While it is on hold the studio works by hand, with Claude Code (Pro) on each laptop: HQ creates the repository and
 * its starting docs, the founder fills the docs and creates the tasks with their branches, the team builds on the
 * branches, and the founder reviews and merges in HQ. The code for the automatic way stays, so turning it on later
 * is one setting and "Update docs on GitHub" on each project.
 */
export const claudeOnGitHub = () => process.env.HQ_CLAUDE_ON_GITHUB === "on";

export const CLAUDE_ON_HOLD = "Claude on GitHub is on hold. Build with Claude Code on your laptop, then open the pull request here.";
