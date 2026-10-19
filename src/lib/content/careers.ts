/**
 * Careers: the kinds of work FrameMind hires for and the application form's questions.
 * Used by the /careers page, the public form handler and HQ → Enquiries, so the role names and choices are written
 * once. These are the areas the studio hires in, not a promise that a role is open today: the page says so.
 */

export type RoleId = "design" | "development" | "media" | "social" | "business" | "other";

export const APPLY_ROLES: { id: RoleId; code: string; title: string; short: string; type: string }[] = [
  { id: "design", code: "R-01", title: "UI / Brand Designer", short: "Websites, identities and product screens, from first sketch to handover", type: "Full-time · internship · freelance" },
  { id: "development", code: "R-02", title: "Full-stack Developer", short: "Websites, web apps, dashboards and automations that ship", type: "Full-time · internship · freelance" },
  { id: "media", code: "R-03", title: "Photographer / Video Editor", short: "Product and event shoots, brand films and reels", type: "Freelance · internship" },
  { id: "social", code: "R-04", title: "Social Media Executive", short: "Plan, write and publish for client and studio accounts", type: "Full-time · internship" },
  { id: "business", code: "R-05", title: "Business Development", short: "Find the right clients and look after them", type: "Full-time · part-time" },
  { id: "other", code: "R-00", title: "Something else", short: "Tell us the role you have in mind", type: "Open" },
];

export const roleTitle = (id: unknown) => APPLY_ROLES.find((r) => r.id === id)?.title ?? "";

/** What each role is asked to tick. */
export const SKILLS: Record<RoleId, string[]> = {
  design: ["Figma", "UI / UX design", "Brand identity", "Typography", "Illustrator", "Photoshop", "Motion design", "Design systems"],
  development: ["React / Next.js", "TypeScript", "Node.js", "Python", "Databases (SQL)", "Tailwind CSS", "APIs and integrations", "AI / LLM tools"],
  media: ["Photography", "Camera operation", "Premiere Pro", "DaVinci Resolve", "After Effects", "Colour grading", "Drone (licensed)", "Lighting"],
  social: ["Content planning", "Copywriting", "Canva", "Reels editing", "Instagram", "LinkedIn", "Analytics", "Community management"],
  business: ["Sales calls", "Client meetings", "Proposals", "Spreadsheets or a CRM", "Networking", "Kannada with clients", "Partnerships"],
  other: [],
};

export const ENGAGEMENT = ["Full-time", "Part-time", "Internship", "Freelance / per project"];
export const WORK_MODE = ["In the Gadag studio", "Remote", "Either"];
export const LANGUAGES = ["English", "Kannada", "Hindi", "Telugu", "Marathi", "Tamil"];
export const HEARD = ["Instagram", "LinkedIn", "WhatsApp", "A friend", "My college", "Google", "Build For Real", "Other"];

/** The portfolio is the application for design and media work. */
export const linksRequired = (role: RoleId) => role === "design" || role === "media";

export interface Application {
  role: RoleId;
  roleOther: string;
  /** what they do now: "B.Des, 3rd year" or "UI designer at …" */
  current: string;
  student: boolean;
  experience: number;
  skills: string[];
  engagement: string[];
  workMode: string;
  languages: string[];
  links: string;
  startFrom: string;
  heardFrom: string;
}

const text = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const pick = (v: unknown, allowed: string[]) => (Array.isArray(v) ? [...new Set(v.map(String).filter((x) => allowed.includes(x)))] : []);

/** Keeps only known choices and short text; anything else is dropped. */
export function cleanApplication(v: unknown): Application | undefined {
  if (!v || typeof v !== "object" || Array.isArray(v)) return undefined;
  const a = v as Record<string, unknown>;
  const role = APPLY_ROLES.find((r) => r.id === a.role)?.id;
  if (!role) return undefined;
  const years = Math.round(Number(a.experience) * 2) / 2;
  return {
    role,
    roleOther: role === "other" ? text(a.roleOther, 80) : "",
    current: text(a.current, 120),
    student: a.student === true,
    experience: Number.isFinite(years) ? Math.min(40, Math.max(0, years)) : 0,
    skills: pick(a.skills, SKILLS[role]),
    engagement: pick(a.engagement, ENGAGEMENT),
    workMode: WORK_MODE.includes(String(a.workMode)) ? String(a.workMode) : "",
    languages: pick(a.languages, LANGUAGES),
    links: text(a.links, 600),
    startFrom: /^\d{4}-\d{2}-\d{2}$/.test(String(a.startFrom)) ? String(a.startFrom) : "",
    heardFrom: HEARD.includes(String(a.heardFrom)) ? String(a.heardFrom) : "",
  };
}

/** The applied-for role as one line: "Full-stack Developer", or "Something else: Operations intern". */
export const appliedFor = (a: Pick<Application, "role" | "roleOther">) => (a.role === "other" ? `Something else${a.roleOther ? `: ${a.roleOther}` : ""}` : roleTitle(a.role));
