/**
 * The 90-day plan behind 1:1 AI coaching. A plan is 12 weeks; each week has a focus, the tools used and the outcome
 * the learner should be able to show. These are starting drafts per age track — the website promises that every
 * curriculum is built around the learner's own profession, so the coach rewrites them before session one.
 */
import { addDays, daysBetween, num, str, type Rec } from "@/components/hq/projects/logic";
import { uid } from "@/lib/utils";

export interface PlanWeek {
  id: string;
  week: number;
  focus: string;
  tools: string;
  outcome: string;
  done: boolean;
}

type Row = [focus: string, tools: string, outcome: string];

const STUDENTS: Row[] = [
  ["What AI is (and isn't): how models learn, where they fail", "ChatGPT / Claude / Gemini", "Explains AI in their own words"],
  ["Prompting well: role, context, examples, iteration", "Chat assistants", "A personal prompt cheat-sheet"],
  ["AI for studying: summaries, flashcards, practice questions", "Chat assistants, NotebookLM", "A study kit for one real subject"],
  ["Research without cheating: sources, citations, fact-checking", "Perplexity, Google Scholar", "A cited one-page report"],
  ["Writing with AI as an editor, not a ghost-writer", "Chat assistants", "An essay improved, with the edits shown"],
  ["Images and design with AI", "Canva AI, image generators", "A poster or social post they designed"],
  ["Coding with AI: first small programs", "Python + an AI pair programmer", "A working mini-program"],
  ["Build something useful: a no-code app or website", "No-code builders", "A live link to share"],
  ["Data and charts: asking questions of a spreadsheet", "Sheets + AI", "A chart that answers a question"],
  ["Safety, privacy, deepfakes and ethics", "Case studies", "Their own rules for using AI"],
  ["Final project: plan and build", "Their choice", "Project build in progress"],
  ["Show and review: present the project, plan what's next", "—", "Presentation + certificate"],
];

const PROFESSIONALS: Row[] = [
  ["Map the job: tasks, hours, tools — where AI fits", "Chat assistants", "A ranked list of tasks to automate"],
  ["Prompting for real work: context, examples, formats", "ChatGPT / Claude / Gemini", "Reusable prompts for 3 daily tasks"],
  ["Writing faster: emails, proposals, content, copy", "Chat assistants", "Templates saving time every week"],
  ["Research and competitive intelligence", "Perplexity, deep-research tools", "A sourced brief on their market"],
  ["Reports, analysis and presentations", "Sheets / Excel + AI, slide tools", "A report and deck made in a fraction of the time"],
  ["Meetings: notes, actions, follow-ups", "Meeting recorders, assistants", "A meeting workflow they run on their own"],
  ["Automate the repetitive: first workflows", "Zapier / Make / n8n", "One workflow running for real"],
  ["Build internal tools without code", "No-code app builders, custom GPTs", "A small tool their team can use"],
  ["AI for their profession: specialist tools and cases", "Profession-specific tools", "Two specialist use-cases in place"],
  ["Data, privacy and safe use at work", "Company policies", "Their safe-use checklist"],
  ["Side project or scale-up using AI leverage", "Their choice", "A plan with first results"],
  ["Review: hours saved, what's next, independence", "—", "Results review + certificate"],
];

export const PLAN_TEMPLATES: Record<string, Row[]> = { "10-20": STUDENTS, "21-35": PROFESSIONALS, "36-60": PROFESSIONALS };

export function planFor(track: unknown): PlanWeek[] {
  const rows = PLAN_TEMPLATES[str(track)] ?? PROFESSIONALS;
  return rows.map(([focus, tools, outcome], i) => ({ id: uid("wk"), week: i + 1, focus, tools, outcome, done: false }));
}

export function planOf(l: Rec): PlanWeek[] {
  return Array.isArray(l.plan) ? (l.plan as PlanWeek[]).filter((w) => w && typeof w.focus === "string") : [];
}

/** Day N of 90, and the date of day 90 (from the record, else 89 days after the start). */
export function dayOf(l: Rec, today: string | null) {
  const start = str(l.startDate).slice(0, 10);
  const end = str(l.endDate).slice(0, 10) || (start ? addDays(start, 89) : "");
  if (!start || !today) return { day: 0, end, pct: 0 };
  const day = Math.min(90, Math.max(0, daysBetween(start, today) + 1));
  return { day, end, pct: day / 90 };
}

export const sessionsFor = (sessions: Rec[], learnerId: string) => sessions.filter((s) => s.learnerId === learnerId).sort((a, b) => str(a.date).localeCompare(str(b.date)));
export const nextNumber = (sessions: Rec[]) => sessions.reduce((m, s) => Math.max(m, num(s.number)), 0) + 1;
