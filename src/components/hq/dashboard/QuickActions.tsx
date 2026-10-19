import Link from "next/link";
import { Award, Camera, FilePlus2, FolderOpen, FolderPlus, GraduationCap, Inbox, Layers, MessageSquareHeart, Printer, ReceiptIndianRupee, UserPlus, Wallet, type LucideIcon } from "lucide-react";
import { OPS, type Role } from "@/lib/hq/roles";
import { Widget } from "./Widget";

interface Action {
  label: string;
  hint: string;
  href: string;
  Icon: LucideIcon;
  roles: Role[];
}

/** Role-aware shortcuts: each one only shows when the role can act on that module. */
const ACTIONS: Action[] = [
  { label: "New enquiry", hint: "WhatsApp, call or DM", href: "/hq/leads", Icon: Inbox, roles: OPS },
  { label: "New quote", hint: "From the rate card", href: "/hq/proposals/new", Icon: FilePlus2, roles: OPS },
  { label: "New project", hint: "With its checklist", href: "/hq/projects?new=1", Icon: FolderPlus, roles: OPS },
  { label: "New invoice", hint: "GST tax invoice", href: "/hq/finance", Icon: ReceiptIndianRupee, roles: OPS },
  { label: "Log expense", hint: "Tools, gear, travel…", href: "/hq/finance", Icon: Wallet, roles: OPS },
  { label: "Add a client", hint: "Clients CRM", href: "/hq/crm", Icon: UserPlus, roles: OPS },
  { label: "Production", hint: "What's due, who's on it", href: "/hq/production", Icon: Layers, roles: ["studio", "media", "viewer"] },
  { label: "Projects", hint: "Checklists & handover", href: "/hq/projects", Icon: FolderPlus, roles: ["studio", "media", "viewer"] },
  { label: "Plan a shoot", hint: "Call sheet & crew", href: "/hq/shoots", Icon: Camera, roles: ["media"] },
  { label: "Testimonials", hint: "Feedback & case studies", href: "/hq/reputation", Icon: MessageSquareHeart, roles: ["media"] },
  { label: "AI Coaching", hint: "Learners & sessions", href: "/hq/coaching", Icon: GraduationCap, roles: ["studio", "viewer"] },
  { label: "Certificates", hint: "Issue & verify", href: "/hq/certificates", Icon: Award, roles: ["studio", "viewer"] },
  { label: "Printables", hint: "Letterhead, cards, forms", href: "/hq/printables", Icon: Printer, roles: ["studio", "media", "viewer"] },
  { label: "Operations library", hint: "SOPs & playbooks", href: "/hq/docs", Icon: FolderOpen, roles: ["studio", "media", "viewer"] },
];

export function QuickActions({ index, role }: { index: string; role: Role }) {
  const actions = ACTIONS.filter((a) => a.roles.includes(role)).slice(0, 6);
  return (
    <Widget index={index} title="Quick actions" icon="LayoutDashboard">
      <ul className="grid grid-cols-2 gap-px overflow-hidden rounded-b-[var(--radius-md)] bg-graphite/10">
        {actions.map(({ label, hint, href, Icon }) => (
          <li key={label} className="bg-paper-50">
            <Link href={href} className="group flex h-full items-start gap-3 p-3.5 transition-colors hover:bg-graphite hover:text-paper sm:p-4">
              <span className="grid size-9 shrink-0 place-items-center rounded-[var(--radius-sm)] border border-graphite/15 bg-paper transition-colors group-hover:border-lime group-hover:bg-lime group-hover:text-graphite">
                <Icon className="size-4" strokeWidth={1.7} aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="block text-[13px] font-semibold leading-tight">{label}</span>
                <span className="mt-0.5 block text-[11px] leading-snug text-blueprint group-hover:text-paper/60">{hint}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </Widget>
  );
}
