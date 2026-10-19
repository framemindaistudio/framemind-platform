import { ALL, DELIVERY_SIDE, LEADERSHIP, MEDIA_SIDE, OPS, SALES_SIDE, STAFF, type Role } from "./roles";

export interface HqNavItem {
  label: string;
  href: string;
  icon: string; // lucide-react export name
  roles: Role[];
  description: string;
}

export interface HqNavGroup {
  title: string;
  items: HqNavItem[];
}

/** The HQ sidebar. Every module route lives under /hq. */
export const hqNav: HqNavGroup[] = [
  {
    title: "Overview",
    items: [
      { label: "Command Center", href: "/hq", icon: "LayoutDashboard", roles: ALL, description: "Pipeline, projects, cash and what's next" },
      { label: "Tasks", href: "/hq/tasks", icon: "ListChecks", roles: ALL, description: "Shared to-do board" },
      { label: "Activity Log", href: "/hq/activity", icon: "History", roles: LEADERSHIP, description: "Every change, who made it, when" },
    ],
  },
  {
    title: "Sales",
    items: [
      { label: "Enquiries", href: "/hq/leads", icon: "Inbox", roles: SALES_SIDE, description: "Website, WhatsApp, Instagram and referral enquiries" },
      { label: "Clients CRM", href: "/hq/crm", icon: "Building2", roles: SALES_SIDE, description: "Pipeline from lead to repeat client" },
      { label: "Quotes", href: "/hq/proposals", icon: "FileSignature", roles: SALES_SIDE, description: "Configure services from the rate card, print, book" },
    ],
  },
  {
    title: "Delivery",
    items: [
      { label: "Projects", href: "/hq/projects", icon: "FolderKanban", roles: ALL, description: "Milestones, deliverables, revisions, handover" },
      { label: "Production", href: "/hq/production", icon: "Layers", roles: ALL, description: "Every deliverable from planned to delivered" },
      { label: "Shoots", href: "/hq/shoots", icon: "Camera", roles: STAFF, description: "Call sheets, crew, gear and shoot-day mode" },
      { label: "Travel", href: "/hq/travel", icon: "Car", roles: STAFF, description: "Trips, vehicles, travel costs" },
      { label: "Feedback & Testimonials", href: "/hq/reputation", icon: "MessageSquareHeart", roles: MEDIA_SIDE, description: "Feedback, testimonials, case studies" },
    ],
  },
  {
    title: "Coaching & Products",
    items: [
      { label: "AI Coaching", href: "/hq/coaching", icon: "GraduationCap", roles: DELIVERY_SIDE, description: "1:1 learners, 90-day plans, sessions" },
      { label: "Vritta", href: "/hq/vritta", icon: "Newspaper", roles: SALES_SIDE, description: "Institution licences, go-live, renewals" },
      { label: "Certificates", href: "/hq/certificates", icon: "Award", roles: DELIVERY_SIDE, description: "Coaching and internship certificates with QR verify" },
    ],
  },
  {
    title: "Brand & Social",
    items: [{ label: "Social Studio", href: "/hq/social", icon: "Megaphone", roles: MEDIA_SIDE, description: "Designs to download, content plan, captions" }],
  },
  {
    title: "Money",
    items: [
      { label: "Finance", href: "/hq/finance", icon: "ReceiptIndianRupee", roles: OPS, description: "P&L, invoices, expenses, income" },
      { label: "Rate Card", href: "/hq/prices", icon: "BadgeIndianRupee", roles: OPS, description: "Every service, option and price the studio quotes" },
      { label: "Team & Payroll", href: "/hq/team", icon: "Users", roles: STAFF, description: "People, salaries, freelance pay, payslips" },
      { label: "Business Planner", href: "/hq/planner", icon: "Calculator", roles: OPS, description: "Monthly costs, targets, revenue streams" },
    ],
  },
  {
    title: "Legal",
    items: [{ label: "Documents to Sign", href: "/hq/sign", icon: "Signature", roles: LEADERSHIP, description: "Offer letters, NDAs, client agreements, releases" }],
  },
  {
    title: "Studio",
    items: [
      { label: "Gear & Assets", href: "/hq/gear", icon: "Aperture", roles: STAFF, description: "Cameras, lenses, lights, drones, computers" },
      { label: "Tools & Vendors", href: "/hq/tools", icon: "CreditCard", roles: STAFF, description: "Subscriptions, renewals, vendors, purchase orders" },
    ],
  },
  {
    title: "Knowledge",
    items: [
      { label: "Presentations", href: "/hq/presentations", icon: "Presentation", roles: ALL, description: "Studio pitch, Vritta and coaching decks" },
      { label: "Operations Library", href: "/hq/docs", icon: "FolderOpen", roles: ALL, description: "SOPs, playbooks, policies — versioned" },
      { label: "Printables", href: "/hq/printables", icon: "Printer", roles: ALL, description: "Letterhead, cards, ID cards, forms, brochures" },
      { label: "File Vault", href: "/hq/files", icon: "Archive", roles: STAFF, description: "Receipts, signed papers, assets" },
    ],
  },
  {
    title: "System",
    items: [{ label: "Settings", href: "/hq/settings", icon: "Settings", roles: LEADERSHIP, description: "Company profile, numbering, logins, data" }],
  },
];

export function navForRole(role: Role) {
  return hqNav.map((g) => ({ ...g, items: g.items.filter((i) => i.roles.includes(role)) })).filter((g) => g.items.length);
}

export function findNavItem(href: string) {
  for (const g of hqNav) for (const i of g.items) if (i.href === href) return i;
  return undefined;
}
