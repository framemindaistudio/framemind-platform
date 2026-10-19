/**
 * Careers: the kinds of work FrameMind hires for and the application form's questions.
 * Used by the /careers page, the public form handler and HQ → Enquiries, so the role names and choices are written
 * once. A role with `hiring: true` shows "Hiring now" on the careers page.
 */

export type RoleId = "design" | "development" | "automation" | "photo" | "video" | "social" | "content" | "coaching" | "business" | "operations" | "other";

/** Every role the studio is hiring for now (shown as "Hiring now" on /careers), plus an open application. */
export const APPLY_ROLES: { id: RoleId; code: string; title: string; short: string; hiring: boolean }[] = [
  { id: "design", code: "R-01", title: "UI/UX & Brand Designer", short: "Websites, identities and product screens, from first sketch to handover", hiring: true },
  { id: "development", code: "R-02", title: "Full-stack Developer", short: "Websites, web apps and dashboards that ship", hiring: true },
  { id: "automation", code: "R-03", title: "AI & Automation Engineer", short: "Workflows, integrations and AI steps that save clients hours", hiring: true },
  { id: "photo", code: "R-04", title: "Photographer", short: "Product, brand and event shoots, edited and delivered", hiring: true },
  { id: "video", code: "R-05", title: "Videographer / Video Editor", short: "Brand films, reels and event videos — shoot, cut and grade", hiring: true },
  { id: "social", code: "R-06", title: "Social Media Executive", short: "Plan, design and publish for client and studio accounts", hiring: true },
  { id: "content", code: "R-07", title: "Content Writer / Copywriter", short: "Website copy, captions, scripts and case studies", hiring: true },
  { id: "coaching", code: "R-08", title: "AI Coach", short: "Teach AI one-to-one in the 90-day coaching programme", hiring: true },
  { id: "business", code: "R-09", title: "Business Development Executive", short: "Find the right clients and look after them", hiring: true },
  { id: "operations", code: "R-10", title: "Project Coordinator", short: "Keep projects, timelines and client updates on track", hiring: true },
  { id: "other", code: "R-00", title: "Something else", short: "Tell us the role you have in mind", hiring: false },
];

export const roleTitle = (id: unknown) => APPLY_ROLES.find((r) => r.id === id)?.title ?? "";

/** What each role is asked to tick. */
export const SKILLS: Record<RoleId, string[]> = {
  design: ["Figma", "UI / UX design", "Brand identity", "Typography", "Illustrator", "Photoshop", "Motion design", "Design systems"],
  development: ["React / Next.js", "TypeScript", "Node.js", "Python", "Databases (SQL)", "Tailwind CSS", "APIs and integrations", "Deployment (Vercel, cloud)"],
  automation: ["n8n / Make / Zapier", "Python", "JavaScript", "LLM APIs (OpenAI, Claude)", "Prompt engineering", "Google Workspace scripts", "WhatsApp / CRM integrations", "Webhooks and APIs"],
  photo: ["Product photography", "Event photography", "Portraits", "Lighting", "Lightroom", "Photoshop retouching", "Studio setup", "Drone (licensed)"],
  video: ["Camera operation", "Premiere Pro", "DaVinci Resolve", "Final Cut Pro", "After Effects", "Colour grading", "Sound and music", "Reels editing"],
  social: ["Content planning", "Canva", "Reels editing", "Instagram", "LinkedIn", "Analytics", "Paid ads", "Community management"],
  content: ["Website copy", "Social captions", "Video scripts", "Blogs and articles", "SEO writing", "Case studies", "Kannada writing", "Hindi writing"],
  coaching: ["ChatGPT / Claude / Gemini", "Prompting", "AI for work tasks", "No-code AI tools", "Teaching one-to-one", "Teaching students (10–20)", "Teaching professionals", "Python / ML basics"],
  business: ["Sales calls", "Client meetings", "Proposals and quotes", "Spreadsheets or a CRM", "Networking", "Kannada with clients", "Partnerships", "Institution sales (schools, colleges)"],
  operations: ["Project planning", "Client communication", "Timelines and follow-ups", "Spreadsheets", "Notion / Trello / Asana", "Invoicing basics", "Shoot coordination", "Documentation"],
  other: [],
};

/** Every role is open as any of these: the applicant picks one or more. */
export const ENGAGEMENT = ["Full-time", "Part-time", "Internship", "Freelance"];
export const WORK_MODE = ["In the Gadag studio", "Remote", "Either"];
export const LANGUAGES = ["English", "Kannada", "Hindi", "Telugu", "Marathi", "Tamil"];
export const HEARD = ["Instagram", "LinkedIn", "WhatsApp", "A friend", "My college", "Google", "Build For Real", "Other"];

/** The portfolio is the application for design, photo and video work. */
export const linksRequired = (role: RoleId) => role === "design" || role === "photo" || role === "video";

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
