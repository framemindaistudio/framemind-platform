/**
 * The studio handbook: walked through with every new team member, intern or freelancer in their first week.
 * It points at the screens in HQ where each thing actually happens, so it stays true as the studio changes.
 */
import { SERVICES } from "@/lib/content/catalog";
import { site } from "@/lib/site";
import { SERVICE_ICON, THEME } from "./shared";
import type { Deck } from "./types";

export const handbookDeck: Deck = {
  id: "studio-handbook",
  group: "team",
  title: "Welcome to FrameMind",
  audience: "New team members, interns and freelancers",
  blurb: "The first-week walkthrough: what the studio does, how a project moves from enquiry to handover, where everything lives in HQ, and the rules on client data and paperwork.",
  minutes: 30,
  theme: THEME,
  sources: ["03_SOP", "04_DESIGN_PLAYBOOK", "05_DEV_PLAYBOOK", "07_PHOTO_VIDEO"],
  slides: ({ client }) => [
    {
      kind: "cover",
      kicker: client ? `Welcome, ${client}` : "Your first week",
      title: "Welcome to FrameMind.",
      sub: `${site.legalName} · ${site.location}`,
      notes: "Introduce the founders and who the new member will work with day to day.",
    },
    {
      kind: "cards",
      title: "What we do",
      cards: [
        ...SERVICES.map((s) => ({ icon: SERVICE_ICON[s.id] ?? "Sparkles", title: s.name, text: s.short })),
        { icon: "Brain", title: "1:1 AI Coaching", text: "90 days, always one to one" },
        { icon: "BookOpen", title: "Vritta", text: "activity records and newsletters for institutions" },
      ],
    },
    {
      kind: "flow",
      title: "How work moves through HQ",
      nodes: [
        { icon: "MessageCircle", title: "Enquiry", text: "Sales → Enquiries" },
        { icon: "Users", title: "Client", text: "Clients CRM" },
        { icon: "IndianRupee", title: "Quote", text: "priced from the Rate Card" },
        { icon: "Rocket", title: "Project", text: "milestones, checklist, handover" },
        { icon: "Upload", title: "Invoice", text: "Finance, per milestone" },
      ],
      sub: "Every step is a record; nothing lives only in WhatsApp",
    },
    {
      kind: "points",
      title: "Your day in HQ",
      points: [
        "Tasks: what is yours, and by when",
        "Projects → your project: the checklist for your craft and the client inputs still waiting",
        "Production: every deliverable and its review state",
        "Shoots: the call sheet, crew and gear for each shoot day",
        "Operations Library: the SOPs and playbooks — read the one for your craft this week",
      ],
      icon: "Laptop",
    },
    {
      kind: "cards",
      title: "Client work, done right",
      cards: [
        { icon: "ClipboardList", title: "Scope first", text: "nothing is built that is not in the signed scope; changes go through a change request" },
        { icon: "ListChecks", title: "Revision rounds", text: "count them on the deliverable; extra rounds are quoted" },
        { icon: "Upload", title: "Handover", text: "source files, documentation and a walkthrough, every time" },
      ],
    },
    {
      kind: "cards",
      title: "Client data and paperwork",
      cards: [
        { icon: "Lock", title: "Studio accounts only", text: "client files stay in studio Drive / GitHub, never personal accounts; 2FA on everything" },
        { icon: "ShieldCheck", title: "NDA and IP assignment", text: "signed in Documents to Sign before you touch client work" },
        { icon: "Camera", title: "Releases on shoots", text: "model, location and drone releases signed on the day" },
      ],
      notes: "Open Documents to Sign with them and send their joining papers before the end of the session.",
    },
    {
      kind: "points",
      title: "Getting paid",
      points: [
        "Staff and interns: the monthly payslip in Team & Payroll",
        "Freelancers: per day, deliverable or session, at the rate in your agreement",
        "Expenses: a bill for every rupee, added in Finance → Expenses the same week",
      ],
      icon: "IndianRupee",
    },
    {
      kind: "closing",
      title: "Questions?",
      sub: "Ask early. Ship it. Then support it.",
      points: [site.contact.email],
    },
  ],
};
