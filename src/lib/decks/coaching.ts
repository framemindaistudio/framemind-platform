/**
 * The 1:1 AI Coaching deck: for a learner (or a parent) before they enrol.
 * Fees appear only once they are set in the Rate Card — the website does not publish them.
 */
import { COACHING } from "@/lib/content/catalog";
import { site } from "@/lib/site";
import { formatINR } from "@/lib/utils";
import { card, THEME } from "./shared";
import type { Deck } from "./types";

export const coachingDeck: Deck = {
  id: "ai-coaching",
  group: "clients",
  title: "1:1 AI Coaching",
  audience: "Learners, parents and working professionals",
  blurb: "The 90-day programme: who it is for, the three age tracks, online or in person, how the weeks run and the fee (shown once it is set in the Rate Card).",
  minutes: 12,
  theme: THEME,
  sources: ["09_AI_COACHING", "Studio website: AI coaching page"],
  slides: ({ client, rates }) => {
    const c = card(rates).coaching;
    const fees = [c.online ? `Online: ${formatINR(c.online)}` : "", c.offline ? `In person: ${formatINR(c.offline)}` : ""].filter(Boolean);
    return [
      {
        kind: "cover",
        kicker: client ? `Prepared for ${client}` : "Always 1:1",
        title: `Learn AI completely, in ${COACHING.days} days.`,
        sub: "Starting from zero, built around your work or studies",
        notes: "Ask what they want AI to do for them in 90 days. Write it down: it becomes the goal on their learner record.",
      },
      {
        kind: "cards",
        title: "Three tracks",
        cards: COACHING.tracks.map((t, i) => ({ icon: (["GraduationCap", "Rocket", "Users"] as const)[i] ?? "Users", title: t.label, text: t.who })),
      },
      {
        kind: "compare",
        title: "Online or in person",
        left: { title: COACHING.modes[0].label, items: COACHING.modes[0].detail.split(", ") },
        right: { title: COACHING.modes[1].label, items: COACHING.modes[1].detail.split(". ").filter(Boolean) },
      },
      {
        kind: "steps",
        title: "How the 90 days run",
        steps: [
          { title: "Weeks 1–3", detail: "foundations: what AI is, prompting, everyday tools", icon: "Lightbulb" },
          { title: "Weeks 4–8", detail: "AI on their own work, with real tasks every week", icon: "Wrench" },
          { title: "Weeks 9–11", detail: "a project of their own, built with AI", icon: "Rocket" },
          { title: "Week 12", detail: "the project shown, and a certificate", icon: "Trophy" },
        ],
        notes: "The plan is adjusted per learner on their record in HQ → AI Coaching. Promise nothing beyond the project they will build.",
      },
      {
        kind: "points",
        title: "The fee",
        points: fees.length ? [...fees, "For the whole 90-day programme, before GST"] : ["Quoted after a short call about the learner's goals", "For the whole 90-day programme"],
        icon: "IndianRupee",
      },
      {
        kind: "closing",
        title: "Thank you",
        sub: site.legalName,
        points: ["Questions?", site.contact.email, site.contact.phone],
      },
    ];
  },
};
