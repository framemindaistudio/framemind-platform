/** HQ access roles. Configure the founders' own logins in the HQ_USERS env var (see .env.example). */
export type Role = "founder" | "admin" | "ops" | "studio" | "media" | "viewer";

export const roleLabels: Record<Role, string> = {
  founder: "Founder",
  admin: "Admin",
  ops: "Operations & Accounts",
  studio: "Studio (design · dev · coaching)",
  media: "Media (photo · video · social)",
  viewer: "Intern (view only)",
};

/*
 * Who may OPEN what.
 *
 * "studio" is the people who make the work: designers, developers, automation builders and AI coaches.
 * "media" is the people who shoot, edit and post: photographers, videographers, editors, social media.
 * "viewer" is the shared interns login. It sees the delivery and learning side only: projects (without amounts),
 * production, certificates, feedback, the playbooks and printables. Nothing about sales, money, people, private
 * files, settings or the activity log.
 */
export const LEADERSHIP: Role[] = ["founder", "admin"];
export const OPS: Role[] = ["founder", "admin", "ops"];
export const OPS_MEDIA: Role[] = ["founder", "admin", "ops", "media"];
export const OPS_STUDIO: Role[] = ["founder", "admin", "ops", "studio"];
/** Everyone with a job in the studio — not the interns login. */
export const STAFF: Role[] = ["founder", "admin", "ops", "studio", "media"];
export const ALL: Role[] = ["founder", "admin", "ops", "studio", "media", "viewer"];
/** Production, content plan, feedback and testimonials: the media side, plus interns. */
export const MEDIA_SIDE: Role[] = ["founder", "admin", "ops", "media", "viewer"];
/** Coaching and certificates: the studio side, plus interns. */
export const DELIVERY_SIDE: Role[] = ["founder", "admin", "ops", "studio", "viewer"];
/** Sales: leads, clients and quotes. The people who scope work see them too. */
export const SALES_SIDE: Role[] = ["founder", "admin", "ops", "studio", "media"];

/**
 * Who may CHANGE anything. Everyone else can look and print, and nothing more: the menus hide the edit controls and
 * the server refuses every save. To let another role edit the modules it can already open, add it here.
 */
export const EDITORS: Role[] = ["founder", "admin"];

/** The roles a founder may give from Settings → Logins. Founder logins stay in HQ_USERS. */
export const MANAGED_ROLES: Role[] = ["viewer", "studio", "media", "ops", "admin"];

/** One line on each role a founder may give, for the Logins panel. */
export const ROLE_HELP: Partial<Record<Role, string>> = {
  viewer: "For interns. Projects (no amounts), production, coaching, certificates, playbooks, presentations and printables. View and print only.",
  studio: "For designers, developers and coaches. Projects, coaching, clients and quotes, gear, the team list (no pay), playbooks and certificates. View and print only.",
  media: "For photographers, editors and social. Clients and quotes, projects, shoots, Production and Social Studio, feedback, gear. View and print only.",
  ops: "For operations and accounts. Everything except pay details, the Activity Log, Documents to Sign and Settings; Finance and the rate card included. View and print only.",
  admin: "Can open and change everything a founder can, except logins. Only for someone you trust with money and people data.",
};

export const VIEW_ONLY_MESSAGE = "Your account can view and print, but not change anything. Ask a founder to make this change.";

export interface SessionUser {
  username: string;
  name: string;
  role: Role;
  /** signed in with a one-time password from a founder: must choose their own before using HQ */
  mustChange?: boolean;
  /** the Team & Payroll member this login belongs to (set on the login in Settings → Logins) */
  teamId?: string;
}

export function can(user: Pick<SessionUser, "role"> | null | undefined, roles: Role[]) {
  return !!user && roles.includes(user.role);
}

/** True when this person may change records limited to `roles` — never true for a view-only account. */
export function canEdit(user: Pick<SessionUser, "role"> | null | undefined, roles: Role[] = ALL) {
  return !!user && EDITORS.includes(user.role) && roles.includes(user.role);
}

/** True for accounts that can look and print but never save. */
export function isViewOnly(user: Pick<SessionUser, "role"> | null | undefined) {
  return !!user && !EDITORS.includes(user.role);
}
