/**
 * Every document FrameMind gets signed, in the order HQ lists them. To add one: write the template in templates/ and add
 * it to the list here.
 */
import { CLIENT_DOCS } from "./templates/clients";
import { freelancerAgreement } from "./templates/freelancer";
import { offerLetter } from "./templates/offer";
import { PARTNER_DOCS } from "./templates/partners";
import { RELEASE_DOCS } from "./templates/releases";
import { TEAM_LETTERS } from "./templates/team-letters";
import { TEAM_POLICIES } from "./templates/team-policies";
import type { DocGroup, SignTemplate } from "./types";

export const GROUPS: { id: DocGroup; title: string; note: string }[] = [
  { id: "joining", title: "Team: joining", note: "What a new person signs before the first day: the offer, internship letter or freelancer agreement, and the papers that go with it." },
  { id: "policies", title: "Team: policies and declarations", note: "What everyone who works with FrameMind signs once, and again when a policy changes." },
  { id: "exit", title: "Team: later letters and leaving", note: "Confirmation, experience and internship letters, authority to act for the studio, handing gear back, and the papers for the last day." },
  { id: "clients", title: "Clients", note: "The standing services agreement, a statement of work for each project, change requests, handover, testimonials, Vritta licences and coaching enrolment." },
  { id: "releases", title: "Shoot releases", note: "Model, location and drone permissions collected for photo and video shoots." },
  { id: "partners", title: "Vendors and partners", note: "Confidentiality before sharing, and terms for rented gear." },
];

const ORDER = GROUPS.map((g) => g.id);

/** All templates, grouped in the order above; inside a group, in the order they were written. */
export const TEMPLATES: SignTemplate[] = [offerLetter, freelancerAgreement, ...TEAM_LETTERS, ...TEAM_POLICIES, ...CLIENT_DOCS, ...RELEASE_DOCS, ...PARTNER_DOCS]
  .map((t, i) => ({ t, i }))
  .sort((a, b) => ORDER.indexOf(a.t.group) - ORDER.indexOf(b.t.group) || a.i - b.i)
  .map(({ t }) => t);

const byId = new Map(TEMPLATES.map((t) => [t.id, t]));
/** A template by its id. Looked up among the real ones only: an id from a link is never trusted to exist. */
export const templateById = (id: string | undefined | null) => (id ? byId.get(id) : undefined);

export const templatesIn = (group: DocGroup) => TEMPLATES.filter((t) => t.group === group);

/** The papers a team member of this group must have ("Founder", "Full-time", "Part-time", "Freelance", "Intern"). */
export const requiredForMember = (group: string) => TEMPLATES.filter((t) => t.parties.includes("team") && t.requiredFor?.includes(group));
/** The papers every client project needs. */
export const requiredForClient = () => TEMPLATES.filter((t) => t.parties.includes("client") && t.requiredForClients);
