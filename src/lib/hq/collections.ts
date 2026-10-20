/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  HQ COLLECTION REGISTRY
 * ─────────────────────────────────────────────────────────────────────────────
 *  Every operational record in FrameMind HQ lives in   data/<collection>.json
 *  (a JSON array committed to the studio's private GitHub data repository).
 *  The field definitions below drive:
 *    • the generic table + form UI   (components/hq/CollectionManager)
 *    • server-side validation        (lib/hq/records.ts)
 *    • role-based access             (read / write roles)
 *  Modules may store extra keys on a record (e.g. a project's milestones);
 *  unknown keys are preserved.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { ALL, DELIVERY_SIDE, LEADERSHIP, MEDIA_SIDE, OPS, OPS_MEDIA, OPS_STUDIO, SALES_SIDE, STAFF, type Role } from "./roles";

export type FieldType =
  | "text"
  | "textarea"
  | "number"
  | "currency"
  | "percent"
  | "date"
  | "month"
  | "time"
  | "select"
  | "multiselect"
  | "boolean"
  | "email"
  | "phone"
  | "url"
  | "ref"
  | "tags"
  | "lineItems";

export interface FieldOption {
  value: string;
  label: string;
}

export interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  options?: FieldOption[];
  /** for type "ref": target collection name */
  ref?: string;
  required?: boolean;
  placeholder?: string;
  /** text fields: common values offered as you type; anything else may still be typed */
  suggestions?: string[];
  /** text fields: also offer the names in this collection (e.g. "team"), so people added later appear */
  suggestFrom?: string;
  help?: string;
  /** form layout width on md+ screens */
  width?: "full" | "half" | "third";
  /** show as a column in the default table */
  table?: boolean;
  /** hide in the generic form (module manages it) */
  hidden?: boolean;
  /** pay and payout details: only founders / admins ever receive this field */
  leadershipOnly?: boolean;
  /** amounts of money: only the roles that see Finance (founder, admin, ops) receive this field */
  opsOnly?: boolean;
  /** contact numbers and internal notes: every role receives this field except the shared interns login */
  staffOnly?: boolean;
  default?: unknown;
}

export interface CollectionDef {
  name: string;
  label: string;
  singular: string;
  description: string;
  /** lucide icon name (resolved in the UI) */
  icon: string;
  titleField: string;
  subtitleField?: string;
  sortField?: string;
  sortDir?: "asc" | "desc";
  read: Role[];
  write: Role[];
  fields: FieldDef[];
  /** the shared interns login receives only the records where this tick-box field is on */
  internsOnlyIf?: string;
  /** records that change only through their own audited API (e.g. Incentives): the generic save and delete refuse them */
  managed?: boolean;
  /** id prefix, e.g. "cli" → cli_k3z9x1a7f2 */
  idPrefix: string;
}

export interface BaseRecord {
  id: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
  [key: string]: unknown;
}

export interface LineItem {
  description: string;
  qty: number;
  rate: number;
  sac?: string;
}

const opts = (...values: (string | [string, string])[]): FieldOption[] =>
  values.map((v) => (Array.isArray(v) ? { value: v[0], label: v[1] } : { value: v, label: v.replace(/(^|-)(\w)/g, (_, s, c) => (s ? " " : "") + c.toUpperCase()) }));

/* ── Shared option lists ─────────────────────────────────────────────────── */

export const CLIENT_STAGES = opts(
  ["lead", "Lead"],
  ["contacted", "Contacted"],
  ["discovery", "Discovery call"],
  ["quoted", "Quote sent"],
  ["negotiation", "Negotiation"],
  ["won", "Won"],
  ["active", "Active client"],
  ["lost", "Lost"],
  ["nurture", "Nurture later"],
);

/** Every service the studio sells — the seven on the rate card plus coaching and Vritta. */
export const SERVICE_OPTS = opts(
  ["websites", "Website"],
  ["brand", "Brand identity"],
  ["software", "Software"],
  ["automations", "Automations"],
  ["photography", "Photography"],
  ["videography", "Videography"],
  ["social", "Social media"],
  ["coaching", "1:1 AI coaching"],
  ["vritta", "Vritta"],
  ["other", "Other"],
);

export const PROJECT_STAGES = opts(
  ["kickoff", "Kick-off"],
  ["discovery", "Discovery"],
  ["design", "Design"],
  ["build", "Build / shoot"],
  ["review", "Client review"],
  ["launch", "Launch & handover"],
  ["support", "Support period"],
  ["completed", "Completed"],
  ["on-hold", "On hold"],
  ["cancelled", "Cancelled"],
);

export const EXPENSE_CATEGORIES = opts(
  "Software & subscriptions",
  "Hosting, domains & cloud",
  "AI & API usage",
  "Freelancers & contractors",
  "Equipment & gear",
  "Gear rental",
  "Stock, music & font licences",
  "Travel & fuel",
  "Food & refreshments",
  "Accommodation",
  "Printing",
  "Salaries & stipends",
  "Marketing & ads",
  "Rent & workspace",
  "Internet & phone",
  "Legal & compliance",
  "Bank & payment charges",
  "Miscellaneous",
);

export const INCOME_STREAMS = opts(
  "Websites",
  "Brand identity",
  "Software",
  "Automations",
  "Photography",
  "Videography",
  "Social media retainers",
  "1:1 AI coaching",
  "Vritta licences",
  "Support & maintenance",
  "Other",
);

const PAY_MODES = opts(["upi", "UPI"], ["bank", "Bank transfer"], ["wise", "Wise (international)"], ["cheque", "Cheque"], ["card", "Card"], ["cash", "Cash"], ["gateway", "Payment gateway"]);
const SOURCES = opts("Website", "Referral", "Instagram", "LinkedIn", "WhatsApp", "Cold outreach", "Event", "Existing network", "Repeat client", "Other");
const TRACK_OPTS = opts(["10-20", "Ages 10–20"], ["21-35", "Ages 21–35"], ["36-60", "Ages 36–60"]);

export const collections: CollectionDef[] = [
  /* ── Sales ───────────────────────────────────────────────────────────── */
  {
    name: "clients",
    label: "Clients",
    singular: "Client",
    description: "Every business, founder and institution in the pipeline — from first lead to repeat client.",
    icon: "Building2",
    titleField: "name",
    subtitleField: "city",
    sortField: "updatedAt",
    sortDir: "desc",
    idPrefix: "cli",
    read: SALES_SIDE,
    write: OPS,
    fields: [
      { key: "name", label: "Client / company name", type: "text", required: true, table: true, width: "full" },
      { key: "stage", label: "Stage", type: "select", options: CLIENT_STAGES, default: "lead", table: true, width: "third" },
      { key: "clientType", label: "Type", type: "select", options: opts("Startup", "Small business", "Established company", "School", "College / university", "NGO / trust", "Individual / creator", "Agency", "Government"), width: "third" },
      { key: "industry", label: "Industry", type: "text", suggestions: ["Real estate", "Education", "Healthcare", "Hospitality", "Retail / D2C", "Manufacturing", "Professional services", "Non-profit", "Technology"], width: "third" },
      { key: "contactName", label: "Key contact", type: "text", table: true, width: "half" },
      { key: "contactRole", label: "Contact role", type: "text", placeholder: "e.g. Founder, Marketing head, Principal", width: "half" },
      { key: "phone", label: "Phone", type: "phone", table: true, width: "third" },
      { key: "email", label: "Email", type: "email", width: "third" },
      { key: "website", label: "Website", type: "url", width: "third" },
      { key: "instagram", label: "Instagram / social", type: "text", width: "third" },
      { key: "city", label: "City", type: "text", table: true, width: "third" },
      { key: "country", label: "Country", type: "text", default: "India", width: "third" },
      { key: "address", label: "Billing address", type: "textarea", width: "full" },
      { key: "gstin", label: "GSTIN", type: "text", width: "third" },
      { key: "services", label: "Interested in", type: "multiselect", options: SERVICE_OPTS, width: "full" },
      { key: "budgetBand", label: "Budget", type: "select", options: opts("< ₹25K", "₹25K–₹50K", "₹50K–₹1L", "₹1L–₹3L", "₹3L–₹10L", "> ₹10L", "Not shared"), width: "third" },
      { key: "dealValue", label: "Expected deal value", type: "currency", table: true, opsOnly: true, width: "third" },
      { key: "source", label: "Lead source", type: "select", options: SOURCES, width: "third" },
      { key: "owner", label: "Owner", type: "text", placeholder: "Who is closing this client", width: "third" },
      { key: "lastContact", label: "Last contact", type: "date", width: "third" },
      { key: "nextFollowUp", label: "Next follow-up", type: "date", table: true, width: "third" },
      { key: "lostReason", label: "Lost / nurture reason", type: "text", width: "full" },
      { key: "tags", label: "Tags", type: "tags", width: "full" },
      { key: "notes", label: "Notes", type: "textarea", staffOnly: true, width: "full" },
    ],
  },
  {
    name: "activities",
    label: "Activities",
    singular: "Activity",
    description: "Calls, discovery calls, meetings and follow-ups logged against clients.",
    icon: "PhoneCall",
    titleField: "summary",
    sortField: "date",
    sortDir: "desc",
    idPrefix: "act",
    read: SALES_SIDE,
    write: OPS,
    fields: [
      { key: "clientId", label: "Client", type: "ref", ref: "clients", required: true, table: true, width: "half" },
      { key: "type", label: "Type", type: "select", options: opts("Call", "Discovery call", "Meeting", "Demo", "Email", "WhatsApp", "Quote", "Note"), table: true, width: "third" },
      { key: "date", label: "Date", type: "date", table: true, width: "third" },
      { key: "summary", label: "Summary", type: "text", required: true, table: true, width: "full" },
      { key: "outcome", label: "Outcome", type: "select", options: opts("Positive", "Neutral", "Negative", "No response"), table: true, width: "third" },
      { key: "nextStep", label: "Next step", type: "text", width: "half" },
      { key: "nextDate", label: "Next step date", type: "date", width: "third" },
      { key: "by", label: "Logged by", type: "text", width: "third" },
      { key: "details", label: "Details", type: "textarea", width: "full" },
    ],
  },
  {
    name: "leads",
    label: "Enquiries",
    singular: "Enquiry",
    description: "Every enquiry — from the website form, WhatsApp, Instagram, calls or referrals — before it becomes a client.",
    icon: "Inbox",
    titleField: "name",
    subtitleField: "organisation",
    sortField: "createdAt",
    sortDir: "desc",
    idPrefix: "lead",
    read: SALES_SIDE,
    write: OPS,
    fields: [
      { key: "kind", label: "Type", type: "select", options: opts(["project", "Project enquiry"], ["coaching", "Coaching enquiry"], ["vritta", "Vritta enquiry"], ["contact", "General contact"], ["careers", "Job / internship application"], ["partner", "Partnership"]), default: "project", table: true, width: "third" },
      { key: "status", label: "Status", type: "select", options: opts(["new", "New"], ["in-progress", "In progress"], ["converted", "Converted"], ["closed", "Closed"], ["spam", "Spam"]), default: "new", table: true, width: "third" },
      { key: "channel", label: "Came in through", type: "select", options: opts("Website form", "WhatsApp", "Instagram DM", "LinkedIn", "Phone call", "Email", "Referral", "Walk-in", "Event", "Other"), width: "third" },
      { key: "name", label: "Name", type: "text", required: true, table: true, width: "half" },
      { key: "organisation", label: "Company / institution", type: "text", table: true, width: "half" },
      { key: "role", label: "Role", type: "text", width: "third" },
      { key: "phone", label: "Phone", type: "phone", table: true, width: "third" },
      { key: "email", label: "Email", type: "email", width: "third" },
      { key: "city", label: "City", type: "text", table: true, width: "third" },
      { key: "services", label: "Services", type: "multiselect", options: SERVICE_OPTS, width: "full" },
      { key: "budget", label: "Budget mentioned", type: "text", width: "third" },
      { key: "timeline", label: "Timeline", type: "text", placeholder: "e.g. Live before Diwali", width: "third" },
      { key: "ageTrack", label: "Coaching age track", type: "select", options: TRACK_OPTS, width: "third" },
      { key: "message", label: "Message", type: "textarea", width: "full" },
      { key: "page", label: "Submitted from", type: "text", width: "half" },
      { key: "clientId", label: "Converted to client", type: "ref", ref: "clients", width: "half" },
      { key: "ownerId", label: "Lead owner (team)", type: "ref", ref: "team", width: "half", help: "The team member who brought the lead in. Commission needs the founder's acceptance in Incentives." },
      { key: "evidence", label: "Evidence of the introduction", type: "textarea", width: "full", placeholder: "Who introduced whom, when — a message, an email, a meeting note" },
      { key: "attribution", label: "Commission attribution", type: "select", options: opts(["none", "Not registered"], ["pending", "Pending founder decision"], ["accepted", "Accepted"], ["rejected", "Rejected"]), default: "none", hidden: true },
    ],
  },
  {
    name: "proposals",
    label: "Quotes",
    singular: "Quote",
    description: "Quotes built from the rate card — configured service by service, printable, and turned into projects when accepted.",
    icon: "FileSignature",
    titleField: "number",
    subtitleField: "clientId",
    sortField: "date",
    sortDir: "desc",
    idPrefix: "qte",
    read: SALES_SIDE,
    write: OPS,
    fields: [
      { key: "number", label: "Quote no.", type: "text", table: true, width: "third" },
      { key: "date", label: "Date", type: "date", table: true, width: "third" },
      { key: "validUntil", label: "Valid until", type: "date", width: "third" },
      { key: "clientId", label: "Client", type: "ref", ref: "clients", required: true, table: true, width: "half" },
      { key: "title", label: "Project title", type: "text", placeholder: "e.g. Website + brand refresh", table: true, width: "half" },
      { key: "services", label: "Services", type: "multiselect", options: SERVICE_OPTS, width: "full" },
      { key: "discountPercent", label: "Extra discount %", type: "percent", width: "third" },
      { key: "extraItems", label: "Extra line items", type: "lineItems", width: "full" },
      { key: "total", label: "Total (ex-GST)", type: "currency", opsOnly: true, table: true, width: "third", help: "Worked out by the quote builder" },
      { key: "status", label: "Status", type: "select", options: opts("draft", "sent", "accepted", "rejected", "expired"), default: "draft", table: true, width: "third" },
      { key: "notes", label: "Notes / special terms", type: "textarea", width: "full" },
      // the configured services (which options in which groups), milestones and timeline live on the record:
      // lines, milestones, timelineWeeks, includeTerms — managed by the quote builder
    ],
  },

  /* ── Delivery ────────────────────────────────────────────────────────── */
  {
    name: "projects",
    label: "Projects",
    singular: "Project",
    description: "Every client project — milestones, deliverables, revisions, handover and support.",
    icon: "FolderKanban",
    titleField: "title",
    subtitleField: "clientId",
    sortField: "dueDate",
    sortDir: "asc",
    idPrefix: "prj",
    read: ALL,
    write: OPS,
    fields: [
      { key: "title", label: "Project", type: "text", required: true, placeholder: "e.g. SmartDeal A2Z — website", table: true, width: "full" },
      { key: "clientId", label: "Client", type: "ref", ref: "clients", table: true, width: "half" },
      { key: "service", label: "Main service", type: "select", options: SERVICE_OPTS, default: "websites", table: true, width: "half" },
      { key: "services", label: "All services in it", type: "multiselect", options: SERVICE_OPTS, width: "full" },
      { key: "stage", label: "Stage", type: "select", options: PROJECT_STAGES, default: "kickoff", table: true, width: "third" },
      { key: "priority", label: "Priority", type: "select", options: opts("low", "normal", "high", "urgent"), default: "normal", width: "third" },
      { key: "lead", label: "Project lead", type: "text", table: true, width: "third" },
      { key: "team", label: "Team on it", type: "tags", width: "full" },
      { key: "startDate", label: "Start", type: "date", width: "third" },
      { key: "dueDate", label: "Delivery date", type: "date", table: true, width: "third" },
      { key: "supportUntil", label: "Support until", type: "date", width: "third" },
      { key: "quoteId", label: "From quote", type: "ref", ref: "proposals", width: "half" },
      { key: "agreedAmount", label: "Agreed amount (ex-GST)", type: "currency", opsOnly: true, table: true, width: "third" },
      { key: "amountReceived", label: "Received so far", type: "currency", opsOnly: true, width: "third" },
      { key: "revisionsAllowed", label: "Revision rounds included", type: "number", default: 2, width: "third" },
      { key: "revisionsUsed", label: "Revision rounds used", type: "number", default: 0, width: "third" },
      { key: "clientContact", label: "Client contact", type: "text", width: "third" },
      { key: "clientContactPhone", label: "Contact phone", type: "phone", staffOnly: true, width: "third" },
      { key: "brief", label: "Brief", type: "textarea", width: "full" },
      { key: "driveUrl", label: "Shared folder (Drive)", type: "url", width: "half" },
      { key: "figmaUrl", label: "Figma / design file", type: "url", width: "half" },
      { key: "repoUrl", label: "Code repository", type: "url", staffOnly: true, width: "half" },
      { key: "stagingUrl", label: "Staging / preview link", type: "url", width: "half" },
      { key: "liveUrl", label: "Live link", type: "url", width: "half" },
      { key: "feedbackScore", label: "Client rating (1–5)", type: "number", width: "third" },
      { key: "notes", label: "Internal notes", type: "textarea", staffOnly: true, width: "full" },
      // milestones, checklist, handover and the content list are kept on the record by the project screens
    ],
  },
  {
    name: "shoots",
    label: "Shoots",
    singular: "Shoot",
    description: "Photo and video shoot days — call sheet, crew, gear, location and permissions.",
    icon: "Camera",
    titleField: "title",
    subtitleField: "projectId",
    sortField: "date",
    sortDir: "asc",
    idPrefix: "sht",
    read: STAFF,
    write: OPS_MEDIA,
    fields: [
      { key: "title", label: "Shoot", type: "text", required: true, placeholder: "e.g. Brand film — day 1", table: true, width: "full" },
      { key: "projectId", label: "Project", type: "ref", ref: "projects", table: true, width: "half" },
      { key: "kind", label: "Type", type: "select", options: opts("Photo", "Video", "Photo + video", "Drone", "Interview", "Event coverage"), default: "Photo + video", table: true, width: "half" },
      { key: "date", label: "Date", type: "date", required: true, table: true, width: "third" },
      { key: "callTime", label: "Crew call time", type: "time", default: "08:00", width: "third" },
      { key: "wrapTime", label: "Wrap by", type: "time", width: "third" },
      { key: "status", label: "Status", type: "select", options: opts("tentative", "confirmed", "shot", "postponed", "cancelled"), default: "tentative", table: true, width: "third" },
      { key: "location", label: "Location", type: "text", table: true, width: "half" },
      { key: "mapLink", label: "Map link", type: "url", width: "half" },
      { key: "distanceKm", label: "Distance from base (km, one way)", type: "number", width: "third" },
      { key: "director", label: "Director / lead", type: "text", width: "third" },
      { key: "crew", label: "Crew", type: "tags", width: "full" },
      { key: "gear", label: "Gear to carry", type: "tags", width: "full", help: "Names from Gear & Assets, or anything else" },
      { key: "onSiteContact", label: "On-site contact", type: "text", width: "half" },
      { key: "onSitePhone", label: "On-site phone", type: "phone", staffOnly: true, width: "half" },
      { key: "dronePermission", label: "Drone permission", type: "select", options: opts("Not needed", "Pending", "Granted", "Not allowed"), default: "Not needed", width: "third" },
      { key: "releasesCollected", label: "Model / location releases collected", type: "boolean", width: "third" },
      { key: "backupDone", label: "Footage backed up (2 copies)", type: "boolean", width: "third" },
      { key: "shotList", label: "Shot list", type: "textarea", width: "full" },
      { key: "notes", label: "Notes (parking, power, wardrobe…)", type: "textarea", width: "full" },
    ],
  },
  {
    name: "deliverables",
    label: "Production",
    singular: "Deliverable",
    description: "Every deliverable promised to a client — pages, logos, films, reels, photo sets, builds — from planned to delivered.",
    icon: "Layers",
    titleField: "title",
    subtitleField: "projectId",
    sortField: "dueDate",
    sortDir: "asc",
    idPrefix: "dlv",
    read: ALL,
    write: OPS_MEDIA,
    fields: [
      { key: "projectId", label: "Project", type: "ref", ref: "projects", table: true, width: "half" },
      {
        key: "type",
        label: "Deliverable",
        type: "select",
        options: opts("Web page / screen", "Website build", "App feature", "Automation workflow", "Logo", "Brand guidelines", "Collateral", "Photo set", "Brand film", "Reel", "Edit / cut", "Social post", "Carousel", "Pitch deck", "Document", "Other"),
        table: true,
        width: "half",
      },
      { key: "title", label: "Title", type: "text", required: true, table: true, width: "full" },
      { key: "status", label: "Status", type: "select", options: opts(["planned", "Planned"], ["in-progress", "In progress"], ["internal-review", "Internal review"], ["client-review", "With client"], ["revisions", "Revisions"], ["approved", "Approved"], ["delivered", "Delivered"]), default: "planned", table: true, width: "third" },
      { key: "dueDate", label: "Due", type: "date", table: true, width: "third" },
      { key: "assignee", label: "Assignee", type: "text", table: true, width: "third" },
      { key: "round", label: "Revision round", type: "number", default: 0, width: "third" },
      { key: "link", label: "Link (Drive / Figma / preview / YouTube)", type: "url", width: "full" },
      { key: "notes", label: "Notes / client feedback", type: "textarea", width: "full" },
    ],
  },
  {
    name: "contentCalendar",
    label: "Content plan",
    singular: "Post",
    description: "Every post for FrameMind's channels and for each founder's own profile.",
    icon: "CalendarHeart",
    titleField: "title",
    sortField: "date",
    sortDir: "asc",
    idPrefix: "post",
    read: MEDIA_SIDE,
    write: OPS_MEDIA,
    fields: [
      { key: "account", label: "Posted from", type: "select", options: opts("FrameMind", "Chinmay (personal)"), default: "FrameMind", table: true, width: "third" },
      { key: "date", label: "Publish date", type: "date", table: true, width: "third" },
      { key: "platform", label: "Platform", type: "select", options: opts("Instagram", "LinkedIn", "YouTube", "Facebook", "X", "Threads", "WhatsApp"), table: true, width: "third" },
      { key: "format", label: "Format", type: "select", options: opts("Reel", "Post", "Carousel", "Story", "Short", "Long video", "Article"), table: true, width: "third" },
      { key: "title", label: "Title / hook", type: "text", required: true, table: true, width: "full" },
      { key: "pillar", label: "Content pillar", type: "select", options: opts("Client work", "Before / after", "Behind the scenes", "Process", "Case study", "AI tips", "Coaching wins", "Vritta", "Founder story", "Testimonials", "Offers", "Announcements", "Hiring", "Festival & days"), width: "half" },
      { key: "status", label: "Status", type: "select", options: opts("idea", "scripted", "designed", "shot", "edited", "scheduled", "published"), default: "idea", table: true, width: "half" },
      { key: "caption", label: "Caption", type: "textarea", width: "full" },
      { key: "link", label: "Published link", type: "url", width: "full" },
      { key: "owner", label: "Owner", type: "text", width: "half" },
      // a design saved from Social Studio → Create: which design and what was typed, so it can be opened again
      { key: "design", label: "Design", type: "text", hidden: true },
    ],
  },
  {
    name: "trips",
    label: "Travel",
    singular: "Trip",
    description: "Every trip — shoots, client meetings, offline coaching, Vritta installs — vehicle, distance and costs.",
    icon: "Car",
    titleField: "to",
    subtitleField: "date",
    sortField: "date",
    sortDir: "desc",
    idPrefix: "trp",
    read: STAFF,
    write: OPS,
    fields: [
      { key: "purpose", label: "Purpose", type: "select", options: opts("Shoot", "Client meeting", "Offline coaching", "Vritta implementation", "Event", "Other"), default: "Shoot", table: true, width: "third" },
      { key: "projectId", label: "Project", type: "ref", ref: "projects", width: "third" },
      { key: "shootId", label: "Shoot", type: "ref", ref: "shoots", width: "third" },
      { key: "date", label: "Date", type: "date", required: true, table: true, width: "third" },
      { key: "status", label: "Status", type: "select", options: opts("planned", "done", "cancelled"), default: "planned", table: true, width: "third" },
      { key: "from", label: "From", type: "text", default: "Base", width: "third" },
      { key: "to", label: "To", type: "text", required: true, table: true, width: "half" },
      { key: "distanceKm", label: "Round-trip distance (km)", type: "number", table: true, width: "half" },
      { key: "vehicle", label: "Vehicle", type: "select", options: opts("Own car", "Two-wheeler", "Rented car + driver", "Cab", "Bus / train", "Flight"), width: "third" },
      { key: "billedToClient", label: "Billed to the client", type: "boolean", width: "third", help: "Outstation shoots: travel and stay are on the client" },
      { key: "team", label: "Team travelling", type: "tags", width: "full" },
      { key: "fuelCost", label: "Fuel", type: "currency", width: "third" },
      { key: "vehicleRent", label: "Vehicle / tickets", type: "currency", width: "third" },
      { key: "tollParking", label: "Toll & parking", type: "currency", width: "third" },
      { key: "accommodation", label: "Accommodation", type: "currency", width: "third" },
      { key: "food", label: "Food", type: "currency", width: "third" },
      { key: "otherCost", label: "Other", type: "currency", width: "third" },
      { key: "departTime", label: "Depart", type: "time", width: "third" },
      { key: "returnTime", label: "Return", type: "time", width: "third" },
      { key: "notes", label: "Notes (route, stay, contacts)", type: "textarea", width: "full" },
    ],
  },
  {
    name: "tasks",
    label: "Tasks",
    singular: "Task",
    description: "The studio's shared to-do board.",
    icon: "ListChecks",
    titleField: "title",
    sortField: "dueDate",
    sortDir: "asc",
    idPrefix: "tsk",
    read: ALL,
    write: ALL,
    internsOnlyIf: "forInterns",
    fields: [
      { key: "title", label: "Task", type: "text", required: true, table: true, width: "full" },
      { key: "status", label: "Status", type: "select", options: opts(["todo", "To do"], ["doing", "Doing"], ["blocked", "Blocked"], ["done", "Done"]), default: "todo", table: true, width: "third" },
      { key: "priority", label: "Priority", type: "select", options: opts("low", "medium", "high", "urgent"), default: "medium", table: true, width: "third" },
      { key: "area", label: "Area", type: "select", options: opts("Sales", "Projects", "Design", "Development", "Automation", "Photo & video", "Social", "Coaching", "Vritta", "Finance", "Admin", "Hiring"), table: true, width: "third" },
      { key: "projectId", label: "Project", type: "ref", ref: "projects", width: "half" },
      { key: "assignee", label: "Assignee", type: "text", table: true, width: "half" },
      { key: "dueDate", label: "Due", type: "date", table: true, width: "half" },
      { key: "description", label: "Details", type: "textarea", width: "full" },
      { key: "forInterns", label: "Show this task to interns", type: "boolean", default: false, width: "full", help: "The interns login sees only the tasks ticked here. Leave it off for anything about money, people or a client deal." },
    ],
  },

  /* ── 1:1 AI Coaching ─────────────────────────────────────────────────── */
  {
    name: "learners",
    label: "Learners",
    singular: "Learner",
    description: "Every 1:1 AI coaching learner — their profession, goals, 90-day plan and progress.",
    icon: "GraduationCap",
    titleField: "name",
    subtitleField: "profession",
    sortField: "startDate",
    sortDir: "desc",
    idPrefix: "lrn",
    read: DELIVERY_SIDE,
    write: OPS_STUDIO,
    fields: [
      { key: "name", label: "Learner", type: "text", required: true, table: true, width: "half" },
      { key: "status", label: "Status", type: "select", options: opts(["enquiry", "Enquiry"], ["onboarding", "Onboarding"], ["active", "Active"], ["paused", "Paused"], ["completed", "Completed"], ["dropped", "Dropped"]), default: "onboarding", table: true, width: "half" },
      { key: "track", label: "Age track", type: "select", options: TRACK_OPTS, table: true, width: "third" },
      { key: "mode", label: "Mode", type: "select", options: opts(["online", "Online"], ["offline", "Offline"]), default: "online", table: true, width: "third" },
      { key: "coach", label: "Coach", type: "text", table: true, width: "third" },
      { key: "profession", label: "Profession / what they do", type: "text", placeholder: "e.g. Lawyer, Class 9 student, D2C founder", table: true, width: "half" },
      { key: "city", label: "City", type: "text", width: "half" },
      { key: "phone", label: "Phone", type: "phone", staffOnly: true, width: "third" },
      { key: "email", label: "Email", type: "email", staffOnly: true, width: "third" },
      { key: "guardian", label: "Parent / guardian (under 18)", type: "text", staffOnly: true, width: "third" },
      { key: "startDate", label: "Start", type: "date", table: true, width: "third" },
      { key: "endDate", label: "Day 90", type: "date", width: "third", help: "Worked out from the start date if left empty" },
      { key: "sessionsPlanned", label: "Sessions planned", type: "number", width: "third" },
      { key: "schedule", label: "Usual slot", type: "text", placeholder: "e.g. Tue & Fri, 7 pm", width: "half" },
      { key: "meetLink", label: "Meeting link", type: "url", staffOnly: true, width: "half" },
      { key: "fee", label: "Fee (ex-GST)", type: "currency", opsOnly: true, width: "third" },
      { key: "amountPaid", label: "Paid so far", type: "currency", opsOnly: true, width: "third" },
      { key: "hoursSavedPerWeek", label: "Hours saved / week (they report)", type: "number", width: "third" },
      { key: "knowsAlready", label: "What they already know", type: "textarea", width: "full" },
      { key: "goals", label: "Goals — what fluency means for them", type: "textarea", width: "full" },
      { key: "dailyWork", label: "Their daily work (to map AI onto)", type: "textarea", width: "full" },
      { key: "notes", label: "Coach's notes", type: "textarea", staffOnly: true, width: "full" },
      // the personalised 90-day plan (weeks → topics, tools, outcomes) is kept on the record by the Coaching screen
    ],
  },
  {
    name: "coachingSessions",
    label: "Coaching sessions",
    singular: "Session",
    description: "Every 1:1 session — what was covered, homework and the recording.",
    icon: "Video",
    titleField: "topic",
    subtitleField: "learnerId",
    sortField: "date",
    sortDir: "desc",
    idPrefix: "ses",
    read: DELIVERY_SIDE,
    write: OPS_STUDIO,
    fields: [
      { key: "learnerId", label: "Learner", type: "ref", ref: "learners", required: true, table: true, width: "half" },
      { key: "number", label: "Session no.", type: "number", table: true, width: "third" },
      { key: "status", label: "Status", type: "select", options: opts("scheduled", "done", "missed", "rescheduled", "cancelled"), default: "scheduled", table: true, width: "third" },
      { key: "date", label: "Date", type: "date", required: true, table: true, width: "third" },
      { key: "time", label: "Time", type: "time", width: "third" },
      { key: "minutes", label: "Length (min)", type: "number", default: 60, width: "third" },
      { key: "coach", label: "Coach", type: "text", width: "third" },
      { key: "topic", label: "Topic", type: "text", required: true, table: true, width: "full" },
      { key: "covered", label: "What we covered", type: "textarea", width: "full" },
      { key: "homework", label: "Practice before next session", type: "textarea", width: "full" },
      { key: "recording", label: "Recording link", type: "url", staffOnly: true, width: "full" },
      { key: "learnerWin", label: "A win they reported", type: "text", width: "full" },
    ],
  },

  /* ── Vritta ──────────────────────────────────────────────────────────── */
  {
    name: "vrittaLicences",
    label: "Vritta licences",
    singular: "Licence",
    description: "Every institution on Vritta — edition, billing, implementation, renewals and maintenance.",
    icon: "Newspaper",
    titleField: "institution",
    subtitleField: "edition",
    sortField: "renewalDate",
    sortDir: "asc",
    idPrefix: "vrl",
    read: SALES_SIDE,
    write: OPS,
    fields: [
      { key: "licenceNo", label: "Licence no.", type: "text", table: true, width: "third", help: "Assigned from Settings if left empty" },
      { key: "institution", label: "Institution", type: "text", required: true, table: true, width: "full" },
      { key: "clientId", label: "Client record", type: "ref", ref: "clients", width: "half" },
      { key: "trust", label: "Trust / society", type: "text", help: "Further institutions of the same trust pay 55% of the licence", width: "half" },
      { key: "segment", label: "Segment", type: "select", options: opts(["school", "School"], ["college", "College"]), default: "college", table: true, width: "third" },
      { key: "edition", label: "Edition", type: "select", options: opts(["essential", "Essential (I)"], ["professional", "Professional (II)"], ["institutional", "Institutional (III)"]), default: "professional", table: true, width: "third" },
      { key: "billing", label: "Billing", type: "select", options: opts(["pilot", "Pilot (monthly)"], ["monthly", "Monthly"], ["annual", "Annual"], ["perpetual", "Perpetual"]), default: "annual", table: true, width: "third" },
      { key: "hosting", label: "Hosting", type: "select", options: opts(["managed", "Managed"], ["institution-cloud", "Institution Cloud"], ["on-campus", "On Campus"]), default: "managed", width: "third" },
      { key: "status", label: "Status", type: "select", options: opts(["enquiry", "Enquiry"], ["demo", "Demo given"], ["pilot", "Pilot"], ["implementing", "Implementing"], ["live", "Live"], ["renewal-due", "Renewal due"], ["lapsed", "Lapsed"], ["cancelled", "Cancelled"]), default: "enquiry", table: true, width: "third" },
      { key: "groupInstitution", label: "Further institution of the same trust (55%)", type: "boolean", width: "third" },
      { key: "licenceFee", label: "Licence fee (ex-GST)", type: "currency", opsOnly: true, table: true, width: "third", help: "Per month, per year or one-time, by billing" },
      { key: "implementationFee", label: "Implementation (one-time)", type: "currency", opsOnly: true, width: "third" },
      { key: "onsiteWeek", label: "On-site training week", type: "boolean", width: "third" },
      { key: "poDate", label: "Purchase order", type: "date", width: "third" },
      { key: "startDate", label: "Licence start", type: "date", width: "third" },
      { key: "renewalDate", label: "Renewal / AMC due", type: "date", table: true, width: "third" },
      { key: "firstIssueDate", label: "First issue published", type: "date", width: "third" },
      { key: "departments", label: "Departments / cells onboarded", type: "number", width: "third" },
      { key: "issuesPublished", label: "Issues published", type: "number", width: "third" },
      { key: "administrator", label: "Institution administrator", type: "text", width: "half" },
      { key: "adminContact", label: "Administrator phone / email", type: "text", staffOnly: true, width: "half" },
      { key: "iqacContact", label: "IQAC contact", type: "text", staffOnly: true, width: "half" },
      { key: "instanceUrl", label: "Instance address", type: "url", width: "half" },
      { key: "notes", label: "Notes", type: "textarea", staffOnly: true, width: "full" },
    ],
  },

  /* ── Money ───────────────────────────────────────────────────────────── */
  {
    name: "invoices",
    label: "Invoices",
    singular: "Invoice",
    description: "Tax invoices to clients, with payments received.",
    icon: "ReceiptIndianRupee",
    titleField: "number",
    subtitleField: "customerName",
    sortField: "date",
    sortDir: "desc",
    idPrefix: "inv",
    read: OPS,
    write: OPS,
    fields: [
      { key: "number", label: "Invoice no.", type: "text", table: true, width: "third", help: "Auto-assigned from Settings if left empty" },
      { key: "date", label: "Invoice date", type: "date", required: true, table: true, width: "third" },
      { key: "dueDate", label: "Due date", type: "date", width: "third" },
      { key: "clientId", label: "Client", type: "ref", ref: "clients", width: "half" },
      { key: "projectId", label: "Project", type: "ref", ref: "projects", width: "half" },
      { key: "milestone", label: "Milestone billed", type: "text", placeholder: "e.g. Advance — to start (50%)", width: "full" },
      { key: "leadId", label: "Lead (for commission)", type: "ref", ref: "leads", width: "half", help: "The registered lead this work came from. Payments on this invoice then count toward that lead owner's commission, once the founder has accepted the lead." },
      { key: "excludedAmount", label: "Pass-through / reimbursable charges (₹, before GST)", type: "currency", width: "half", help: "Third-party costs billed at cost (hosting, ad spend, travel). They never count toward incentives." },
      { key: "customerName", label: "Bill to (name)", type: "text", required: true, table: true, width: "half" },
      { key: "customerGstin", label: "Customer GSTIN", type: "text", width: "half" },
      { key: "customerAddress", label: "Billing address", type: "textarea", width: "full" },
      { key: "placeOfSupply", label: "Place of supply (state)", type: "text", width: "half" },
      { key: "gstPercent", label: "GST %", type: "percent", default: 18, width: "third" },
      { key: "discount", label: "Discount (₹)", type: "currency", width: "third" },
      { key: "items", label: "Line items", type: "lineItems", width: "full" },
      { key: "status", label: "Status", type: "select", options: opts("draft", "sent", "partially-paid", "paid", "overdue", "cancelled"), default: "draft", table: true, width: "third" },
      { key: "total", label: "Total (incl. GST)", type: "currency", table: true, width: "third", help: "Calculated from line items" },
      { key: "amountPaid", label: "Amount received", type: "currency", table: true, width: "third" },
      { key: "notes", label: "Notes on invoice", type: "textarea", width: "full" },
    ],
  },
  {
    name: "expenses",
    label: "Expenses",
    singular: "Expense",
    description: "Every rupee spent — categorised, linked to projects, with receipts.",
    icon: "Wallet",
    titleField: "description",
    subtitleField: "category",
    sortField: "date",
    sortDir: "desc",
    idPrefix: "exp",
    read: OPS,
    write: OPS,
    fields: [
      { key: "date", label: "Date", type: "date", required: true, table: true, width: "third" },
      { key: "category", label: "Category", type: "select", options: EXPENSE_CATEGORIES, required: true, table: true, width: "third" },
      { key: "amount", label: "Amount (₹, incl. tax)", type: "currency", required: true, table: true, width: "third" },
      { key: "description", label: "Description", type: "text", required: true, table: true, width: "full" },
      { key: "vendor", label: "Paid to", type: "text", width: "half" },
      { key: "projectId", label: "Project (if a direct cost)", type: "ref", ref: "projects", width: "half" },
      { key: "paidBy", label: "Paid by", type: "text", suggestions: ["Company account", "Chinmay", "Cash box"], suggestFrom: "team", placeholder: "Company account, or who paid", table: true, width: "third" },
      { key: "mode", label: "Mode", type: "select", options: PAY_MODES, width: "third" },
      { key: "gstAmount", label: "GST in bill (₹)", type: "currency", width: "third" },
      { key: "billable", label: "Re-bill to the client", type: "boolean", width: "third" },
      { key: "reimbursable", label: "Needs reimbursement", type: "boolean", width: "third" },
      { key: "reimbursed", label: "Reimbursed", type: "boolean", width: "third" },
      { key: "receipt", label: "Receipt (vault path or link)", type: "text", width: "full" },
      { key: "notes", label: "Notes", type: "textarea", width: "full" },
    ],
  },
  {
    name: "income",
    label: "Other Income",
    singular: "Receipt",
    description: "Money received outside invoices — coaching fees, small jobs, retainers paid directly.",
    icon: "IndianRupee",
    titleField: "description",
    sortField: "date",
    sortDir: "desc",
    idPrefix: "inc",
    read: OPS,
    write: OPS,
    fields: [
      { key: "date", label: "Date", type: "date", required: true, table: true, width: "third" },
      { key: "stream", label: "Revenue stream", type: "select", options: INCOME_STREAMS, table: true, width: "third" },
      { key: "amount", label: "Amount (₹)", type: "currency", required: true, table: true, width: "third" },
      { key: "description", label: "Description", type: "text", required: true, table: true, width: "full" },
      { key: "from", label: "Received from", type: "text", width: "half" },
      { key: "mode", label: "Mode", type: "select", options: PAY_MODES, width: "half" },
      { key: "reference", label: "Reference / UTR", type: "text", width: "half" },
      { key: "notes", label: "Notes", type: "textarea", width: "full" },
    ],
  },
  {
    name: "team",
    label: "Team",
    singular: "Member",
    description: "Founders, designers, developers, editors, coaches, freelancers and interns.",
    icon: "Users",
    titleField: "name",
    subtitleField: "role",
    sortField: "name",
    sortDir: "asc",
    idPrefix: "tm",
    read: STAFF,
    write: LEADERSHIP,
    fields: [
      { key: "name", label: "Full name", type: "text", required: true, table: true, width: "half" },
      {
        key: "role",
        label: "Role",
        type: "text",
        suggestions: ["Founder", "Business Development Executive", "UI/UX Designer", "Full-stack Developer", "Automation Engineer", "AI Coach", "Photographer", "Videographer / Editor", "Social Media Manager", "Operations", "Intern"],
        placeholder: "e.g. UI/UX Design Intern",
        help: "Type the exact role: it is printed on offer letters and ID cards.",
        table: true,
        width: "half",
      },
      { key: "type", label: "Engagement", type: "select", options: opts("Full-time", "Part-time", "Freelance", "Intern"), table: true, width: "third" },
      { key: "status", label: "Status", type: "select", options: opts("onboarding", "active", "inactive"), default: "active", table: true, width: "third" },
      { key: "joinDate", label: "Joined", type: "date", width: "third" },
      { key: "phone", label: "Phone", type: "phone", table: true, width: "third" },
      { key: "email", label: "Email", type: "email", width: "third" },
      { key: "city", label: "City", type: "text", width: "third" },
      { key: "address", label: "Address (printed on letters and agreements)", type: "textarea", width: "full", leadershipOnly: true },
      { key: "monthlyPay", label: "Monthly salary / stipend", type: "currency", width: "third", leadershipOnly: true },
      { key: "unitRate", label: "Freelance rate", type: "currency", width: "third", leadershipOnly: true, help: "Per day, per deliverable or per session — say which in the payslip" },
      {
        key: "compensationBasis",
        label: "Pay basis",
        type: "select",
        options: opts(["fixed", "Fixed salary"], ["fixed-incentive", "Fixed salary + incentives"], ["stipend", "Stipend (intern)"], ["freelance", "Freelance fees"], ["incentive-only", "Incentives only — proposed, needs legal review"]),
        width: "third",
        leadershipOnly: true,
        help: "How this person is paid. \"Incentives only\" stays a proposal until the incentive policy's compliance review is approved.",
      },
      { key: "incentiveEligible", label: "Takes part in team incentives", type: "boolean", width: "third", leadershipOnly: true },
      { key: "incentiveFrom", label: "Incentives from (date)", type: "date", width: "third", leadershipOnly: true, help: "Joined mid-quarter? The bonus counts from here." },
      { key: "payoutDetails", label: "Payout (UPI ID / bank last 4)", type: "text", width: "third", help: "Avoid storing full account numbers", leadershipOnly: true },
      { key: "skills", label: "Skills & tools", type: "tags", width: "full" },
      { key: "portfolio", label: "Portfolio / GitHub / Behance", type: "url", width: "half" },
      { key: "agreementSigned", label: "Agreement / NDA signed", type: "boolean", width: "third" },
      { key: "ipAssigned", label: "IP assignment signed", type: "boolean", width: "third" },
      { key: "emergencyContact", label: "Emergency contact", type: "text", width: "full" },
      { key: "photo", label: "Profile photo", type: "text", hidden: true },
      { key: "photoUpdatedAt", label: "Photo updated", type: "text", hidden: true },
      { key: "notes", label: "Notes", type: "textarea", width: "full" },
    ],
  },
  {
    name: "incentivePolicies",
    label: "Incentive policies",
    singular: "Incentive policy",
    description: "Each saved version of the team incentive policy, with its compliance review. Changes go through HQ → Incentives.",
    icon: "Scale",
    titleField: "name",
    subtitleField: "version",
    sortField: "version",
    sortDir: "desc",
    idPrefix: "pol",
    read: LEADERSHIP,
    write: LEADERSHIP,
    managed: true,
    fields: [
      { key: "name", label: "Name", type: "text", table: true },
      { key: "version", label: "Version", type: "number", table: true },
      { key: "status", label: "Status", type: "select", options: opts("draft", "active", "retired"), table: true },
      { key: "effectiveFrom", label: "Effective from", type: "date", table: true },
    ],
  },
  {
    name: "incentivePayouts",
    label: "Incentive payouts",
    singular: "Incentive payout",
    description: "Commission and quarterly-bonus statements, each with its basis, approvals and payment evidence. Changes go through HQ → Incentives.",
    icon: "BadgeIndianRupee",
    titleField: "memberName",
    subtitleField: "period",
    sortField: "period",
    sortDir: "desc",
    idPrefix: "pay",
    read: LEADERSHIP,
    write: LEADERSHIP,
    managed: true,
    fields: [
      { key: "memberName", label: "Team member", type: "text", table: true },
      { key: "kind", label: "Type", type: "select", options: opts(["commission", "Client-acquisition commission"], ["bonus", "Quarterly team bonus"]), table: true },
      { key: "period", label: "Period", type: "text", table: true },
      { key: "net", label: "Net (₹)", type: "currency", table: true, opsOnly: true },
      { key: "status", label: "Status", type: "text", table: true },
    ],
  },
  {
    name: "performanceReviews",
    label: "Performance reviews",
    singular: "Performance review",
    description: "Monthly one-to-ones and quarterly assessments. Confidential: the founder and the person reviewed only.",
    icon: "ClipboardCheck",
    titleField: "memberName",
    subtitleField: "period",
    sortField: "period",
    sortDir: "desc",
    idPrefix: "rev",
    read: LEADERSHIP,
    write: LEADERSHIP,
    managed: true,
    fields: [
      { key: "memberName", label: "Team member", type: "text", table: true },
      { key: "kind", label: "Type", type: "select", options: opts(["monthly", "Monthly one-to-one"], ["quarterly", "Quarterly assessment"]), table: true },
      { key: "period", label: "Period", type: "text", table: true },
      { key: "status", label: "Status", type: "text", table: true },
    ],
  },
  {
    name: "payroll",
    label: "Payroll",
    singular: "Payslip",
    description: "Monthly pay runs — salaries, freelance units, deductions, payslips.",
    icon: "BadgeIndianRupee",
    titleField: "memberId",
    subtitleField: "month",
    sortField: "month",
    sortDir: "desc",
    idPrefix: "pay",
    read: LEADERSHIP,
    write: LEADERSHIP,
    fields: [
      { key: "month", label: "Month", type: "month", required: true, table: true, width: "third" },
      { key: "memberId", label: "Team member", type: "ref", ref: "team", required: true, table: true, width: "third" },
      { key: "status", label: "Status", type: "select", options: opts("pending", "paid", "on-hold"), default: "pending", table: true, width: "third" },
      { key: "fixedPay", label: "Fixed pay", type: "currency", width: "third" },
      { key: "units", label: "Freelance units", type: "number", width: "third", help: "Days, deliverables or sessions" },
      { key: "unitRate", label: "Rate per unit", type: "currency", width: "third" },
      { key: "unitLabel", label: "Unit", type: "select", options: opts("day", "deliverable", "session", "hour", "project"), default: "day", width: "third" },
      { key: "allowances", label: "Travel & other allowances", type: "currency", width: "third" },
      { key: "bonus", label: "Bonus / incentive", type: "currency", width: "third" },
      { key: "deductions", label: "Deductions / advances", type: "currency", width: "third" },
      { key: "tds", label: "TDS", type: "currency", width: "third" },
      { key: "netPay", label: "Net pay", type: "currency", table: true, width: "third", help: "Calculated" },
      { key: "paidOn", label: "Paid on", type: "date", width: "third" },
      { key: "mode", label: "Mode", type: "select", options: PAY_MODES, width: "third" },
      { key: "reference", label: "Reference / UTR", type: "text", width: "third" },
      { key: "notes", label: "Notes", type: "textarea", width: "full" },
    ],
  },

  /* ── Gear, tools & vendors ───────────────────────────────────────────── */
  {
    name: "gear",
    label: "Gear & Assets",
    singular: "Item",
    description: "Cameras, lenses, lights, audio, drones, computers and accessories — who has what, and its condition.",
    icon: "Aperture",
    titleField: "name",
    subtitleField: "category",
    sortField: "name",
    sortDir: "asc",
    idPrefix: "gr",
    read: STAFF,
    write: OPS,
    fields: [
      { key: "name", label: "Item", type: "text", required: true, table: true, width: "half" },
      { key: "category", label: "Category", type: "select", options: opts("Camera body", "Lens", "Lighting", "Audio", "Drone", "Stabiliser & rig", "Tripod & support", "Storage & media", "Batteries & power", "Computer", "Monitor & display", "Accessory", "Studio & set"), table: true, width: "half" },
      { key: "assetTag", label: "Asset tag", type: "text", placeholder: "e.g. FM-CAM-01", table: true, width: "third" },
      { key: "serial", label: "Serial no.", type: "text", staffOnly: true, width: "third" },
      { key: "qty", label: "Quantity", type: "number", default: 1, width: "third" },
      { key: "status", label: "Status", type: "select", options: opts(["available", "Available"], ["out", "Out on a shoot"], ["with-member", "With a team member"], ["repair", "In repair"], ["retired", "Retired / sold"]), default: "available", table: true, width: "third" },
      { key: "holder", label: "With / location", type: "text", placeholder: "e.g. Studio shelf A / Chinmay", table: true, width: "third" },
      { key: "condition", label: "Condition", type: "select", options: opts("New", "Good", "Fair", "Needs service"), default: "Good", width: "third" },
      { key: "purchaseDate", label: "Bought on", type: "date", width: "third" },
      { key: "purchaseCost", label: "Cost", type: "currency", opsOnly: true, width: "third" },
      { key: "warrantyUntil", label: "Warranty until", type: "date", width: "third" },
      { key: "vendorId", label: "Bought from", type: "ref", ref: "vendors", width: "half" },
      { key: "insured", label: "Insured", type: "boolean", width: "half" },
      { key: "notes", label: "Notes", type: "textarea", width: "full" },
    ],
  },
  {
    name: "subscriptions",
    label: "Tools & Subscriptions",
    singular: "Subscription",
    description: "Every paid tool — design, development, hosting, AI, storage — with its cost and renewal date. Never store passwords here.",
    icon: "CreditCard",
    titleField: "tool",
    subtitleField: "category",
    sortField: "renewalDate",
    sortDir: "asc",
    idPrefix: "sub",
    read: STAFF,
    write: OPS,
    fields: [
      { key: "tool", label: "Tool", type: "text", required: true, table: true, width: "half" },
      { key: "category", label: "Category", type: "select", options: opts("Design", "Development & hosting", "Domains", "AI & APIs", "Video & photo", "Productivity", "Storage & backup", "Marketing", "Finance", "Other"), table: true, width: "half" },
      { key: "plan", label: "Plan", type: "text", width: "third" },
      { key: "seats", label: "Seats", type: "number", width: "third" },
      { key: "status", label: "Status", type: "select", options: opts("active", "trial", "paused", "cancelled"), default: "active", table: true, width: "third" },
      { key: "cycle", label: "Billing cycle", type: "select", options: opts("monthly", "yearly", "one-time", "usage"), default: "monthly", width: "third" },
      { key: "cost", label: "Cost per cycle", type: "currency", opsOnly: true, table: true, width: "third" },
      { key: "currency", label: "Billed in", type: "select", options: opts("INR", "USD", "EUR"), default: "INR", width: "third" },
      { key: "renewalDate", label: "Renews on", type: "date", table: true, width: "third" },
      { key: "owner", label: "Account owner", type: "text", width: "third" },
      { key: "billedTo", label: "Paid with", type: "text", placeholder: "e.g. Company card ••4421", staffOnly: true, width: "third" },
      { key: "projectId", label: "For a client project", type: "ref", ref: "projects", width: "half", help: "Hosting or tools the client should be billed for" },
      { key: "url", label: "Dashboard link", type: "url", width: "half" },
      { key: "notes", label: "Notes", type: "textarea", width: "full", help: "No passwords. Keep logins in a password manager." },
    ],
  },
  {
    name: "vendors",
    label: "Vendors",
    singular: "Vendor",
    description: "Freelancers, rental houses, printers, hosting and service providers.",
    icon: "Store",
    titleField: "name",
    subtitleField: "category",
    sortField: "name",
    sortDir: "asc",
    idPrefix: "ven",
    read: OPS,
    write: OPS,
    fields: [
      { key: "name", label: "Vendor", type: "text", required: true, table: true, width: "half" },
      { key: "category", label: "Category", type: "select", options: opts("Freelancer", "Gear rental", "Gear purchase", "Printing", "Hosting & domains", "Travel & stay", "Studio / location", "Talent & voice", "Music & stock", "Services", "Other"), table: true, width: "half" },
      { key: "contactName", label: "Contact person", type: "text", width: "third" },
      { key: "phone", label: "Phone", type: "phone", table: true, width: "third" },
      { key: "email", label: "Email", type: "email", width: "third" },
      { key: "website", label: "Website", type: "url", width: "half" },
      { key: "city", label: "City", type: "text", table: true, width: "half" },
      { key: "gstin", label: "GSTIN", type: "text", width: "third" },
      { key: "paymentTerms", label: "Payment terms", type: "text", width: "third" },
      { key: "rating", label: "Rating (1–5)", type: "number", table: true, width: "third" },
      { key: "notes", label: "Notes", type: "textarea", width: "full" },
    ],
  },
  {
    name: "purchases",
    label: "Purchase Orders",
    singular: "Purchase",
    description: "Orders placed with vendors — gear, rentals, printing, freelance work.",
    icon: "ShoppingCart",
    titleField: "poNumber",
    subtitleField: "vendorId",
    sortField: "date",
    sortDir: "desc",
    idPrefix: "po",
    read: OPS,
    write: OPS,
    fields: [
      { key: "poNumber", label: "PO no.", type: "text", table: true, width: "third" },
      { key: "date", label: "Order date", type: "date", required: true, table: true, width: "third" },
      { key: "expectedDate", label: "Expected", type: "date", width: "third" },
      { key: "vendorId", label: "Vendor", type: "ref", ref: "vendors", table: true, width: "half" },
      { key: "projectId", label: "For project", type: "ref", ref: "projects", width: "half" },
      { key: "status", label: "Status", type: "select", options: opts("draft", "ordered", "received", "cancelled"), default: "draft", table: true, width: "third" },
      { key: "items", label: "Items", type: "lineItems", width: "full" },
      { key: "shipping", label: "Shipping", type: "currency", width: "third" },
      { key: "total", label: "Total", type: "currency", table: true, width: "third", help: "Calculated" },
      { key: "paid", label: "Paid", type: "boolean", table: true, width: "third" },
      { key: "notes", label: "Notes", type: "textarea", width: "full" },
    ],
  },

  /* ── Reputation ──────────────────────────────────────────────────────── */
  {
    name: "testimonials",
    label: "Testimonials",
    singular: "Testimonial",
    description: "Quotes from clients and learners — with written consent before they are used anywhere.",
    icon: "Quote",
    titleField: "name",
    subtitleField: "organisation",
    sortField: "date",
    sortDir: "desc",
    idPrefix: "tst",
    read: MEDIA_SIDE,
    write: OPS_MEDIA,
    fields: [
      { key: "name", label: "Name", type: "text", required: true, table: true, width: "half" },
      { key: "role", label: "Role", type: "text", placeholder: "Founder, Principal, Learner…", table: true, width: "half" },
      { key: "organisation", label: "Company / institution", type: "text", table: true, width: "half" },
      { key: "date", label: "Date", type: "date", width: "half" },
      { key: "quote", label: "Quote", type: "textarea", required: true, width: "full" },
      { key: "rating", label: "Rating (1–5)", type: "number", default: 5, width: "third" },
      { key: "service", label: "Service", type: "select", options: SERVICE_OPTS, width: "third" },
      { key: "published", label: "Used on the website", type: "boolean", table: true, width: "third" },
      { key: "photo", label: "Photo path / URL", type: "text", width: "half" },
      { key: "videoUrl", label: "Video URL", type: "url", width: "half" },
      { key: "projectId", label: "Project", type: "ref", ref: "projects", width: "half" },
      { key: "consent", label: "Written consent to publish", type: "boolean", width: "half" },
    ],
  },
  {
    name: "feedback",
    label: "Feedback",
    singular: "Response",
    description: "Feedback at handover from clients, and at day 90 from coaching learners.",
    icon: "MessageSquareHeart",
    titleField: "respondent",
    subtitleField: "projectId",
    sortField: "date",
    sortDir: "desc",
    idPrefix: "fb",
    read: ALL,
    write: OPS_STUDIO,
    fields: [
      { key: "projectId", label: "Project", type: "ref", ref: "projects", table: true, width: "half" },
      { key: "learnerId", label: "Learner", type: "ref", ref: "learners", width: "half" },
      { key: "date", label: "Date", type: "date", table: true, width: "third" },
      { key: "respondent", label: "Respondent", type: "select", options: opts("Client founder", "Client team", "Institution", "Learner", "Parent", "Other"), table: true, width: "third" },
      { key: "name", label: "Name (optional)", type: "text", width: "third" },
      { key: "rating", label: "Rating (1–5)", type: "number", table: true, width: "third" },
      { key: "onTime", label: "Delivered on time", type: "boolean", width: "third" },
      { key: "wouldRecommend", label: "Would recommend / hire again", type: "boolean", table: true, width: "third" },
      { key: "liked", label: "What they liked", type: "textarea", width: "full" },
      { key: "improve", label: "What to improve", type: "textarea", width: "full" },
    ],
  },
  {
    name: "caseStudies",
    label: "Case Studies",
    singular: "Case study",
    description: "Real projects, real results — written up for pitches, decks and the website.",
    icon: "BookOpenCheck",
    titleField: "title",
    sortField: "date",
    sortDir: "desc",
    idPrefix: "cs",
    read: MEDIA_SIDE,
    write: OPS_MEDIA,
    fields: [
      { key: "title", label: "Title", type: "text", required: true, table: true, width: "full" },
      { key: "clientId", label: "Client", type: "ref", ref: "clients", table: true, width: "half" },
      { key: "projectId", label: "Project", type: "ref", ref: "projects", width: "half" },
      { key: "date", label: "Date", type: "date", table: true, width: "third" },
      { key: "services", label: "Services", type: "multiselect", options: SERVICE_OPTS, width: "full" },
      { key: "challenge", label: "Challenge", type: "textarea", width: "full" },
      { key: "solution", label: "What FrameMind did", type: "textarea", width: "full" },
      { key: "results", label: "Results", type: "textarea", width: "full" },
      { key: "metrics", label: "Key numbers", type: "tags", width: "full", help: "Only numbers the client confirmed" },
      { key: "mediaLinks", label: "Links", type: "tags", width: "full" },
      { key: "published", label: "Published", type: "boolean", table: true, width: "third" },
    ],
  },
  {
    name: "certificates",
    label: "Certificates",
    singular: "Certificate",
    description: "Coaching completions, internships and workshops — every certificate verifiable at /verify.",
    icon: "Award",
    titleField: "studentName",
    subtitleField: "program",
    sortField: "issueDate",
    sortDir: "desc",
    idPrefix: "cert",
    read: ALL,
    write: OPS_STUDIO,
    fields: [
      { key: "code", label: "Certificate ID", type: "text", table: true, width: "third", help: "Auto-generated e.g. FM-26-7KQ2M" },
      { key: "studentName", label: "Name", type: "text", required: true, table: true, width: "third" },
      { key: "type", label: "Type", type: "select", options: opts("AI Coaching — completion", "Internship", "Workshop participation", "Merit", "Appreciation"), default: "AI Coaching — completion", table: true, width: "third" },
      { key: "program", label: "Programme", type: "text", placeholder: "e.g. 90-Day AI Fluency — Professionals track", table: true, width: "half" },
      { key: "learnerId", label: "Learner", type: "ref", ref: "learners", width: "half" },
      { key: "detail", label: "Line under the name", type: "text", placeholder: "e.g. UI/UX Design Intern, June–August 2026", width: "full" },
      { key: "issueDate", label: "Issued on", type: "date", table: true, width: "third" },
      { key: "status", label: "Status", type: "select", options: opts("valid", "revoked"), default: "valid", width: "third" },
    ],
  },

  /* ── Documents to sign ───────────────────────────────────────────────── */
  {
    name: "signDocs",
    label: "Documents to sign",
    singular: "Document",
    description: "Offer letters, NDAs, client agreements, statements of work and releases: who each one is for and who has signed.",
    icon: "Signature",
    titleField: "title",
    subtitleField: "partyName",
    sortField: "date",
    sortDir: "desc",
    idPrefix: "sgn",
    // offer letters carry pay, and agreements carry the amounts agreed with a client: founders and admins only
    read: LEADERSHIP,
    write: LEADERSHIP,
    fields: [
      { key: "ref", label: "Reference", type: "text", table: true, width: "third" },
      { key: "title", label: "Document", type: "text", required: true, table: true, width: "full" },
      { key: "template", label: "Template", type: "text", hidden: true },
      { key: "templateVersion", label: "Wording version", type: "text", hidden: true },
      { key: "partyKind", label: "For", type: "select", options: opts(["team", "Team member"], ["client", "Client"], ["vendor", "Vendor / freelancer"], ["other", "Someone else"]), width: "third" },
      { key: "partyId", label: "Record", type: "text", hidden: true },
      { key: "partyName", label: "Name", type: "text", table: true, width: "half" },
      { key: "date", label: "Date on the paper", type: "date", table: true, width: "third" },
      { key: "status", label: "Status", type: "select", options: opts("draft", "issued", "void"), default: "draft", table: true, width: "third" },
      { key: "issuedOn", label: "Printed or sent on", type: "date", width: "third" },
      { key: "dueBy", label: "Sign and return by", type: "date", width: "third" },
      { key: "partySigned", label: "Signed by them", type: "boolean", table: true, width: "third" },
      { key: "partySignedOn", label: "Signed by them on", type: "date", width: "third" },
      { key: "studioSigned", label: "Signed by FrameMind", type: "boolean", table: true, width: "third" },
      { key: "studioSignedOn", label: "Signed by FrameMind on", type: "date", width: "third" },
      { key: "scan", label: "Signed scan (File Vault)", type: "text", width: "full" },
      { key: "notes", label: "Notes", type: "textarea", width: "full" },
      // kept with the record by the Documents to Sign screen: party, values, signatories, company (see lib/sign/context.ts)
    ],
  },
];

export const collectionMap: Record<string, CollectionDef> = Object.fromEntries(collections.map((c) => [c.name, c]));

export function getCollection(name: string): CollectionDef | undefined {
  // own keys only: "constructor" or "__proto__" must not resolve to a built-in
  return Object.hasOwn(collectionMap, name) ? collectionMap[name] : undefined;
}

export function collectionPath(name: string) {
  return `data/${name}.json`;
}

export function lineItemsTotal(items: unknown): number {
  if (!Array.isArray(items)) return 0;
  return items.reduce((s: number, it: Partial<LineItem>) => s + (Number(it?.qty) || 0) * (Number(it?.rate) || 0), 0);
}

/** Invoice maths: subtotal → discount → GST → total. */
export function invoiceTotals(inv: Record<string, unknown>) {
  const subtotal = lineItemsTotal(inv.items);
  const discount = Number(inv.discount) || 0;
  const taxable = Math.max(0, subtotal - discount);
  const gstPercent = inv.gstPercent === undefined || inv.gstPercent === "" ? 18 : Number(inv.gstPercent) || 0;
  const gst = Math.round(taxable * gstPercent) / 100;
  const total = Math.round((taxable + gst) * 100) / 100;
  const paid = Number(inv.amountPaid) || 0;
  return { subtotal, discount, taxable, gstPercent, gst, cgst: gst / 2, sgst: gst / 2, total, paid, balance: Math.max(0, total - paid) };
}

export function payrollNet(p: Record<string, unknown>) {
  const n = (k: string) => Number(p[k]) || 0;
  return n("fixedPay") + n("units") * n("unitRate") + n("allowances") + n("bonus") - n("deductions") - n("tds");
}

export function tripTotal(t: Record<string, unknown>) {
  return ["fuelCost", "vehicleRent", "tollParking", "accommodation", "food", "otherCost"].reduce((s, k) => s + (Number(t[k]) || 0), 0);
}
