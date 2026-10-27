import type { Role } from "./roles";

/**
 * The studio's roles (positions). Team & Payroll is organised by them: each role has numbered places — Developer 1,
 * Developer 2, … — and each place has one fixed HQ login (dev1, dev2, …).
 *
 * When someone leaves, their place's login is paused and their record (letters, payslips, history) stays as it is.
 * The next person in that place gets the same login with a new one-time password, on a record of their own.
 *
 * To add or rename a role, change this list: the Team page, the add form and the logins all follow it. Keep each
 * `code` unchanged once people have logins, because the usernames are made from it.
 */
export interface Position {
  key: string;
  /** printed on offer letters and ID cards */
  title: string;
  /** login usernames are `${code}${number}`, e.g. dev1 */
  code: string;
  /** what the login opens in HQ by default (the founder can choose another when adding a person) */
  access: Role;
  group: "Sales & operations" | "Studio: design, development & AI" | "Media: photo, video & social";
  /** one line on the job, for the Team page */
  about: string;
}

export const POSITIONS: Position[] = [
  { key: "business-development", title: "Business Development Executive", code: "bd", access: "ops", group: "Sales & operations", about: "Finds and follows up leads, sends quotes, looks after clients." },
  { key: "operations", title: "Operations & Accounts", code: "ops", access: "ops", group: "Sales & operations", about: "Invoices, payments, expenses, vendors and the day-to-day running." },
  { key: "ui-ux-designer", title: "UI/UX Designer", code: "ux", access: "studio", group: "Studio: design, development & AI", about: "Website and app design, design systems, Figma files." },
  { key: "developer", title: "Full-stack Developer", code: "dev", access: "studio", group: "Studio: design, development & AI", about: "Builds websites and apps on task branches, with Claude Code." },
  { key: "automation-engineer", title: "AI & Automation Engineer", code: "ai", access: "studio", group: "Studio: design, development & AI", about: "AI agents, chatbots and workflow automations for clients." },
  { key: "ai-coach", title: "AI Coach", code: "coach", access: "studio", group: "Studio: design, development & AI", about: "Runs AI coaching sessions and workshops." },
  { key: "graphic-designer", title: "Graphic Designer", code: "graphic", access: "media", group: "Media: photo, video & social", about: "Social creatives, branding, print and presentation design." },
  { key: "photographer", title: "Photographer", code: "photo", access: "media", group: "Media: photo, video & social", about: "Product, event and brand shoots." },
  { key: "videographer", title: "Videographer / Editor", code: "video", access: "media", group: "Media: photo, video & social", about: "Shoots and edits reels, ads and brand films." },
  { key: "social-media", title: "Social Media Manager", code: "social", access: "media", group: "Media: photo, video & social", about: "Content calendars, posting, community and reports." },
];

export const POSITION_GROUPS = [...new Set(POSITIONS.map((p) => p.group))];

export const positionOf = (key: unknown) => POSITIONS.find((p) => p.key === key);

/** "Full-stack Developer 2" */
export const placeLabel = (p: Position, n: number) => `${p.title} ${n}`;

/** "dev2" */
export const placeUsername = (p: Position, n: number) => `${p.code}${n}`;
