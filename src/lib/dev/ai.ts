import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";

/**
 * Claude drafts a project's documents from the client's approved requirements and the founder's "what to build"
 * summary: PRD, Architecture, Rules and Design (markdown) and a task breakdown with an assignee for each task
 * (structured JSON). Runs on the server with ANTHROPIC_API_KEY (Vercel).
 *
 * Server-side fallback is on: if a request is declined by a safety classifier, the API retries it on a suitable model
 * in the same call. Claude is told to list anything it doesn't know as an open question, never to invent client facts.
 */

export const aiReady = () => !!process.env.ANTHROPIC_API_KEY;
const MODEL = "claude-opus-5-5";
const FALLBACK = { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const };

const SYSTEM = `You are the technical lead at FrameMind AI Studio, a small design and software studio in Karnataka, India, that builds websites, web apps, automations and brand work for local businesses, schools and trusts.
You write the project documents the team and Claude Code work from, in clear, plain English markdown.
The founder's summary is the authority on what to build: where it differs from the client's submission, follow the founder.
Use only facts given in the brief. Never invent client facts (numbers, dates, people, registrations, features nobody asked for). When something needed is unknown, list it under an "Open questions" heading.
Prefer simple, proven technology a small team can maintain: Next.js (App Router) + TypeScript + Tailwind, deployed on Vercel, unless the brief clearly needs something else.`;

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  skills: string[];
  openTasks: number;
}

export interface PlannedTask {
  title: string;
  type: "feature" | "fix";
  priority: "low" | "medium" | "high";
  description: string;
  acceptance: string[];
  assigneeId: string;
  reason: string;
}

export interface AiDocs {
  at: string;
  model: string;
  files: { prd: string; architecture: string; rules: string; design: string };
  tasks: PlannedTask[];
}

export interface BriefInput {
  title: string;
  services: string[];
  dueDate: string;
  founderBrief: string;
  client: Record<string, string>;
  colors: string[];
  team: TeamMember[];
}

function briefText(o: BriefInput) {
  return [
    `Project: ${o.title}`,
    o.services.length ? `Services: ${o.services.join(", ")}` : "",
    o.dueDate ? `Target delivery date: ${o.dueDate}` : "",
    `# Founder's summary — what to build\n${o.founderBrief.trim() || "(none given — work from the client's submission)"}`,
    "# Client's approved submission",
    ...Object.entries(o.client)
      .filter(([, v]) => v.trim())
      .map(([k, v]) => `## ${k}\n${v.trim()}`),
    o.colors.length ? `## Brand colours\n${o.colors.join(", ")}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");
}

const DOC_ASKS = {
  prd: "Write docs/PRD.md: a product requirements document. Sections: Overview, Goals & success measures, Audience, Scope (pages / features, each with a one-line purpose), Out of scope, Content the client must supply, Acceptance criteria (project level), Open questions.",
  architecture:
    "Write docs/Architecture.md: Tech stack (with one-line reasons), System design, Pages & routes, Data model (only if the project stores data), Integrations (only those the brief needs), Hosting & environments (production from main, a preview per pull request), Security decisions, Open questions.",
  rules:
    "Write docs/Rules.md for this project's developers and for Claude Code: branches (one per task, named feature/<ID>-..., created by FrameMind HQ), commits (messages start with the task ID), nobody pushes to main (merges happen only through FrameMind HQ after review, green checks and Claude's review), code conventions for the chosen stack, folder structure, accessibility and performance rules, and a Definition of done.",
  design:
    "Write docs/Design.md: Brand (colours with roles, typography, tone), Layout & grid, Components list, each page's sections in order, Responsive behaviour, Accessibility (contrast, alt text, keyboard), Imagery guidance, Open questions.",
} as const;

/** Draft the four documents and the assigned task plan — five requests in parallel, about a minute in total. */
export async function draftDocs(input: BriefInput): Promise<AiDocs> {
  if (!aiReady()) throw new Error("Claude isn't connected yet: add ANTHROPIC_API_KEY in Vercel.");
  const client = new Anthropic();
  const brief = briefText(input);
  const ids = input.team.map((m) => m.id);

  const doc = async (ask: string) => {
    const stream = client.beta.messages.stream({
      ...FALLBACK,
      model: MODEL,
      max_tokens: 32000,
      output_config: { effort: "medium" },
      system: SYSTEM,
      messages: [{ role: "user", content: `${brief}\n\n---\n\n${ask}\nReturn only the markdown document, starting with its # title.` }],
    });
    const msg = await stream.finalMessage();
    if (msg.stop_reason === "refusal") throw new Error("Claude declined to draft a document.");
    const text = msg.content.map((b) => (b.type === "text" ? b.text : "")).join("").trim();
    if (!text) throw new Error("Claude returned an empty document.");
    return `${text}\n\n> Drafted by Claude for FrameMind HQ from the client's requirements and the founder's summary. Review and edit freely.\n`;
  };

  const plan = async (): Promise<PlannedTask[]> => {
    const schema = z.object({
      tasks: z.array(
        z.object({
          title: z.string(),
          type: z.enum(["feature", "fix"]),
          priority: z.enum(["low", "medium", "high"]),
          description: z.string(),
          acceptance: z.array(z.string()),
          assigneeId: ids.length ? z.enum(["", ...ids] as [string, ...string[]]) : z.literal(""),
          reason: z.string(),
        }),
      ),
    });
    const team = input.team.length
      ? input.team.map((m) => `- id ${m.id}: ${m.name} — ${m.role || "role not set"}${m.skills.length ? `; skills: ${m.skills.join(", ")}` : ""}; open tasks now: ${m.openTasks}`).join("\n")
      : "(no team members available — leave every assigneeId empty)";
    const stream = client.beta.messages.stream({
      ...FALLBACK,
      model: MODEL,
      max_tokens: 32000,
      output_config: { effort: "medium", format: betaZodOutputFormat(schema) },
      system: SYSTEM,
      messages: [
        {
          role: "user",
          content: `${brief}\n\n# Team\n${team}\n\n---\n\nBreak this project into development tasks for a small team working with Claude Code. Each task is one pull request's worth of work (half a day to two days), listed in build order, starting with project setup. Give each a short imperative title (no ID), what to build, and 2-6 testable acceptance criteria. 5 to 20 tasks.\nAssign each task to the team member whose role and skills fit it best, spreading the work so nobody is overloaded (count their open tasks). Use the member's id exactly as given, or an empty string when nobody fits. Give a one-line reason for each assignment.`,
        },
      ],
    });
    const msg = await stream.finalMessage();
    if (msg.stop_reason === "refusal") throw new Error("Claude declined to plan the tasks.");
    const parsed = msg.parsed_output as z.infer<typeof schema> | null;
    if (!parsed) throw new Error("Claude's task plan couldn't be read.");
    return parsed.tasks.slice(0, 25).map((t) => ({ ...t, assigneeId: ids.includes(t.assigneeId) ? t.assigneeId : "" }));
  };

  const [prd, architecture, rules, design, tasks] = await Promise.all([doc(DOC_ASKS.prd), doc(DOC_ASKS.architecture), doc(DOC_ASKS.rules), doc(DOC_ASKS.design), plan()]);
  return { at: new Date().toISOString(), model: MODEL, files: { prd, architecture, rules, design }, tasks };
}
