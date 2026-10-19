/**
 * The client meeting deck: what a founder or business sees on the first call with FrameMind.
 * Wording follows the studio website (services, process, terms); every price is read from the rate card.
 * Nothing here claims clients, results or testimonials the studio does not have — add real case studies in
 * HQ → Feedback & Testimonials before showing any.
 */
import { BUNDLE, TERMS } from "@/lib/content/catalog";
import { site } from "@/lib/site";
import { formatINR } from "@/lib/utils";
import { card, from, SERVICE_ICON, startingPrice, THEME } from "./shared";
import type { Deck } from "./types";

export const studioDeck: Deck = {
  id: "studio-pitch",
  group: "clients",
  title: "FrameMind for your business",
  audience: "Founders, owners and marketing leads",
  blurb: "The discovery-call deck: what we build, how a project runs, what it costs, the bundle and the terms. Type the client's name and it appears on the cover.",
  minutes: 20,
  theme: THEME,
  sources: ["03_SOP (sales & delivery)", "Studio website: services, process and FAQ"],
  slides: ({ client, rates }) => {
    const rc = card(rates);
    const services = rc.services;
    const ms = rc.terms.milestones;
    return [
      {
        kind: "cover",
        kicker: client ? `Prepared for ${client}` : "Design · Software · Media · AI",
        title: "We build what founders need actually shipped.",
        sub: `${site.legalName} · a founder-led studio from ${site.location}`,
        notes: "Thank them for the time. Say what the next 20 minutes are: understand what they are building, show how we work, and leave with a clear next step — not a hard sell.",
      },
      {
        kind: "statement",
        big: "First, tell us what you are building.",
        sub: "Who it is for · what it must do · by when · what has been tried",
        icon: "MessageCircle",
        notes: "Stop presenting here. Ask, listen and write it down in the CRM afterwards. Everything after this slide should be bent to their answer.",
      },
      {
        kind: "cards",
        title: "What we build",
        cards: services.map((s) => ({ icon: SERVICE_ICON[s.id] ?? "Sparkles", title: s.name, text: s.short })),
        sub: "One team for the website, the brand, the software, the automations and the media around them",
        notes: "Point only to the two or three services that match what they just told you. The rest is context.",
      },
      ...services.map((s) => ({
        kind: "points" as const,
        title: `${s.name} — ${from(startingPrice(s.id, rc), s.billing === "month")}`,
        points: [s.description, ...s.included.slice(0, 4)],
        icon: SERVICE_ICON[s.id] ?? "Sparkles",
        notes: `Skip this slide unless ${s.name.toLowerCase()} is in scope. The full option list is in the quote builder — configure it with them live if they want numbers today.`,
      })),
      {
        kind: "steps",
        title: "How a project runs",
        steps: TERMS.process.map((p, i) => ({ title: p.title, detail: p.detail, icon: (["Phone", "ClipboardList", "Wrench", "Rocket"] as const)[i] })),
        notes: "Stress the second step: the scope, timeline and price are written down before any work starts.",
      },
      {
        kind: "table",
        title: "The Studio Bundle",
        head: ["Services taken together", "Discount on the bundle"],
        rows: rc.bundleSteps.map((b, i, all) => [i === all.length - 1 ? `${b.services} or more` : String(b.services), `${b.discountPercent}%`]),
        foot: `Standard engagements: ${BUNDLE.standard.map((b) => `${b.label} ${formatINR(b.price)}`).join(" · ")}`,
        notes: "Only bring this up if they need more than one service. The quote builder applies the discount by itself.",
      },
      {
        kind: "cards",
        title: "The terms, up front",
        cards: [
          { icon: "IndianRupee", title: "Payment", text: ms.map((m) => `${m.percent}% ${m.label.toLowerCase()}`).join(" · ") },
          { icon: "ListChecks", title: `${rc.terms.revisionRounds} revision rounds`, text: "per design stage; new scope is quoted separately" },
          { icon: "Upload", title: "You own it", text: "source files, documentation and a walkthrough at handover" },
          { icon: "Clock", title: `Quotes hold ${rc.terms.validityDays} days`, text: `prices before GST (${rc.gstPercent}%)` },
        ],
        notes: TERMS.clientResponsibilities,
      },
      {
        kind: "points",
        title: "Timelines",
        points: [TERMS.timelines, TERMS.revisionPolicy, TERMS.international],
        icon: "CalendarDays",
      },
      {
        kind: "steps",
        title: "Next steps",
        steps: [
          { title: "A written scope", detail: "within two working days", icon: "ClipboardList" },
          { title: "The quote", detail: "line by line, from our rate card", icon: "IndianRupee" },
          { title: "Agreement and advance", detail: `${ms[0]?.percent ?? 50}% starts the work`, icon: "Handshake" },
          { title: "Kick-off", detail: "access, content and a shared timeline", icon: "Rocket" },
        ],
        notes: "Agree the date by which they will hear from us, and put it in the CRM as the next follow-up before leaving the call.",
      },
      {
        kind: "closing",
        title: "Thank you",
        sub: site.legalName,
        points: ["Questions?", site.contact.email, site.contact.phone, site.website.replace(/^https?:\/\//, "")],
      },
    ];
  },
};
