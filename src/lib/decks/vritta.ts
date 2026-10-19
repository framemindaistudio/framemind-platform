/**
 * The Vritta deck: for a principal, IQAC coordinator or management of a school or college.
 * Editions, licence fees and the four-week go-live are read from the rate card and the published Vritta page.
 */
import { VRITTA } from "@/lib/content/catalog";
import { site } from "@/lib/site";
import { formatINR } from "@/lib/utils";
import { card, THEME } from "./shared";
import type { Deck, IconName } from "./types";

const fee = (n?: number) => (n ? formatINR(n) : "—");
const EDITION_ICON: Record<string, IconName> = { essential: "BookOpen", professional: "Layers", institutional: "GraduationCap" };

export const vrittaDeck: Deck = {
  id: "vritta",
  group: "clients",
  title: "Vritta for your institution",
  audience: "Principals, IQAC coordinators and management",
  blurb: "Vritta in one meeting: how departments submit, the newsletter it produces, editions, hosting, licence fees and the four-week go-live.",
  minutes: 20,
  theme: THEME,
  sources: ["Studio website: Vritta page", "HQ → Rate Card → Vritta"],
  slides: ({ client, rates }) => {
    const rc = card(rates);
    const v = rc.vritta;
    return [
      {
        kind: "cover",
        kicker: client ? `Prepared for ${client}` : "For schools and colleges",
        title: "Vritta",
        sub: VRITTA.line,
        notes: "Open with their reality: who collects department activity reports today, in what format, and how long the newsletter or NAAC evidence takes to put together.",
      },
      {
        kind: "steps",
        title: "How it works",
        steps: [
          { title: "Departments submit", detail: "each activity once, with photos, on a simple form", icon: "Upload" },
          { title: "Editors compose", detail: "sections, pages and the issue, in one workroom", icon: "Layers" },
          { title: "The issue is printed", detail: "a print-ready newsletter, every month", icon: "BookOpen" },
          { title: "The record stays", detail: "searchable evidence for accreditation", icon: "ShieldCheck" },
        ],
      },
      {
        kind: "cards",
        title: "Three editions",
        cards: VRITTA.editions.map((e) => ({ icon: EDITION_ICON[e.id], title: `${e.roman} · ${e.name}${e.badge ? ` (${e.badge})` : ""}`, text: `${e.summary} Support response: ${e.support}.` })),
      },
      {
        kind: "table",
        title: "Licence fees — colleges",
        head: ["Edition", "Monthly (pilot)", "Annual", "Perpetual", "AMC / year"],
        rows: VRITTA.editions.map((e) => {
          const r = v.rates.college[e.id];
          return [e.name, fee(r?.monthly), fee(r?.annual), fee(r?.perpetual), fee(r?.amc)];
        }),
        foot: `Before GST (${rc.gstPercent}%). Each further institution under the same trust pays ${v.groupLicencePercent}% of the licence fee.`,
      },
      {
        kind: "table",
        title: "Licence fees — schools",
        head: ["Edition", "Monthly (pilot)", "Annual", "Perpetual", "AMC / year"],
        rows: VRITTA.editions
          .filter((e) => v.rates.school[e.id])
          .map((e) => {
            const r = v.rates.school[e.id];
            return [e.name, fee(r?.monthly), fee(r?.annual), fee(r?.perpetual), fee(r?.amc)];
          }),
        foot: `Before GST (${rc.gstPercent}%). ${VRITTA.pilotNote}`,
      },
      {
        kind: "table",
        title: "One-time charges",
        head: ["Item", "What it covers", "Fee"],
        rows: v.oneTime.map((o) => [o.label, o.detail, formatINR(o.price)]),
        foot: `Maintenance on a perpetual licence: ${v.amcPercent}% of the perpetual fee a year, from year 2.`,
      },
      {
        kind: "cards",
        title: "Where it runs",
        cards: VRITTA.hosting.map((h, i) => ({ icon: (["Globe", "Monitor", "Lock"] as const)[i] ?? "Globe", title: h.label, text: h.detail })),
      },
      {
        kind: "agenda",
        title: `Live in ${VRITTA.goLiveWeeks} weeks`,
        rows: VRITTA.plan.map((p) => ({ time: p.week, title: p.title, detail: p.detail })),
        notes: "Ask who will coordinate on their side, and which month's issue they want as the first one.",
      },
      {
        kind: "closing",
        title: "Thank you",
        sub: site.legalName,
        points: ["Questions?", "A three-month paid pilot is the easy way to start", site.contact.email, site.contact.phone],
      },
    ];
  },
};
