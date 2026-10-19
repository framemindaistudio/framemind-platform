/**
 * The caption bank of Social Studio: the caption kinds with their boxes to fill, the hook lines, the calls to
 * action by goal, the hashtag sets by name, the caption rules and the lists of what not to write.
 * Source: OPERATIONS/08_SOCIAL_MEDIA and 01_BRAND (voice and tone). Change a line there and here together.
 *
 * Nothing here invents a fact: a number is typed by the person, or read from the published rate card.
 */
import { BUNDLE, COACHING, SERVICES, VRITTA } from "@/lib/content/catalog";
import type { FieldSpec, Values } from "./types";
import { TAGS, hashtags, rupees, val, type CtaKey, type TagSet } from "./words";

/** how much of a caption shows before "more" */
export const FIRST_LINE = 125;

/* ───────────────────────────── caption kinds ───────────────────────────── */

export interface CaptionKind {
  id: string;
  name: string;
  /** when to reach for it */
  when: string;
  /** the boxes to fill: the bracketed parts of the bank's template */
  fields: FieldSpec[];
  /** what the boxes hold to begin with (the bank's own words, where it gives them) */
  start: Values;
  /** the first line: what shows before "more" */
  hook: (v: Values) => string;
  /** the short lines under it */
  body: (v: Values) => string[];
  /** client work is shown, so the credit line goes in */
  credit: boolean;
  /** the call to action it starts with ("" = none) */
  cta: CtaKey | "";
  sets: PickableSet[];
  /** a caution shown under the boxes */
  note?: string;
  /** numbers taken from the rate card, shown so the person sees where they come from */
  facts?: (v: Values) => { label: string; value: string }[];
}

/** what was typed, or the name of the box in brackets so a gap is easy to see */
const part = (v: Values, key: string, name: string) => val(v, key) || `[${name}]`;

/** the lowest price a service is sold at: the cheapest option in each "choose one" group */
export function startingPrice(serviceId: string) {
  const s = SERVICES.find((x) => x.id === serviceId);
  if (!s) return 0;
  return s.groups.filter((g) => g.mode === "one").reduce((sum, g) => sum + Math.min(...g.options.map((o) => o.price)), 0);
}
const serviceOf = (v: Values) => SERVICES.find((s) => s.id === val(v, "service")) ?? SERVICES[0];
const SERVICE_SETS: Record<string, PickableSet> = { websites: "web", brand: "brand", software: "software", automations: "ai", photography: "media", videography: "media", social: "media" };

const client: FieldSpec = { key: "client", label: "Client", kind: "text", placeholder: "The client's name, as they write it", help: "Name a client only after they have approved the post.", max: 48 };
const work: FieldSpec = { key: "work", label: "What we made", kind: "text", placeholder: "a booking website with WhatsApp alerts", max: 70 };

export const CAPTION_KINDS: CaptionKind[] = [
  {
    id: "launch",
    name: "Project launch",
    when: "Client work that just went live, with the client's go-ahead.",
    fields: [client, work, { key: "result", label: "What changed for them", kind: "text", placeholder: "enquiries now come in while they sleep", help: "Only what the client has told you. Leave it empty if you do not know yet.", max: 90 }],
    start: {},
    hook: (v) => `Now live for ${part(v, "client", "Client")}: ${part(v, "work", "what we made")}.`,
    body: (v) => [val(v, "result") ? `${val(v, "result")[0].toUpperCase()}${val(v, "result").slice(1)}.` : "", "Scoped, designed, built and handed over, source files and all."],
    credit: true,
    cta: "book",
    sets: ["web", "india"],
    note: "Post only with the client's written approval, and only results they have told you.",
  },
  {
    id: "behind",
    name: "Behind the work",
    when: "A process shot: wireframes, a shoot day, a code review, a colour grade.",
    fields: [{ key: "what", label: "What is happening", kind: "text", placeholder: "Day two of a product shoot in Gadag", max: 70 }, { key: "detail", label: "One detail worth knowing", kind: "text", placeholder: "every product shot on the same light, so the catalogue matches", max: 90 }],
    start: {},
    hook: (v) => part(v, "what", "What is happening") + ".",
    body: (v) => [part(v, "detail", "one detail worth knowing")],
    credit: false,
    cta: "follow",
    sets: ["media", "founders"],
    note: "Show a client's work in progress only with their approval. Drone shots only within the drone rules.",
  },
  {
    id: "tip",
    name: "AI or design tip",
    when: "A mini-lesson: one thing a founder can use today.",
    fields: [
      { key: "question", label: "The question", kind: "text", max: 70 },
      { key: "answer", label: "The short answer", kind: "text", max: 90 },
      { key: "swipe", label: "What the slides show", kind: "text", help: "It finishes the line “Swipe to see ...”", max: 90 },
    ],
    start: { question: "Still copying enquiries from WhatsApp into a sheet?", answer: "One small automation does it for you, every time.", swipe: "the three steps we set up for most clients" },
    hook: (v) => part(v, "question", "The question"),
    body: (v) => [part(v, "answer", "The short answer"), `Swipe to see ${part(v, "swipe", "what the slides show")}.`],
    credit: false,
    cta: "save",
    sets: ["ai", "software"],
  },
  {
    id: "service",
    name: "Service spotlight",
    when: "One service: what it is, what is included, where the price starts.",
    fields: [{ key: "service", label: "Service", kind: "select", options: SERVICES.map((s) => ({ value: s.id, label: s.name })) }],
    start: { service: SERVICES[0].id },
    hook: (v) => {
      const s = serviceOf(v);
      return `${s.name}: ${s.short.replace(/ · /g, ", ").toLowerCase()}, priced in the open.`;
    },
    body: (v) => {
      const s = serviceOf(v);
      const from = startingPrice(s.id);
      return [s.description, from ? `From ${rupees(from)}${s.billing === "month" ? " a month" : ""}, ex-GST.` : ""];
    },
    credit: false,
    cta: "quote",
    sets: ["web", "india"],
    facts: (v) => [{ label: "Starting price", value: `${rupees(startingPrice(serviceOf(v).id))}, ex-GST` }],
    note: "The price is read from the published rate card. A founder changes it in Rate Card, never here.",
  },
  {
    id: "bundle",
    name: "Studio Bundle",
    when: "Two or more services together, and the discount for it.",
    fields: [],
    start: {},
    hook: () => `Website, brand, software, media: take ${BUNDLE.steps[0].services} or more together and the bundle is up to ${BUNDLE.steps[BUNDLE.steps.length - 1].discountPercent}% less.`,
    body: () => BUNDLE.steps.map((s, i, all) => `${i === all.length - 1 ? `${s.services}+` : s.services} services: ${s.discountPercent}% off`),
    credit: false,
    cta: "quote",
    sets: ["web", "brand"],
  },
  {
    id: "coaching",
    name: "AI coaching",
    when: "The 90-day 1:1 programme.",
    fields: [{ key: "who", label: "Who it is for", kind: "select", options: COACHING.tracks.map((t) => ({ value: t.id, label: `${t.label}: ${t.who}` })) }],
    start: { who: COACHING.tracks[1].id },
    hook: () => `Learn AI completely, in ${COACHING.days} days, starting from zero. Always 1:1.`,
    body: (v) => {
      const t = COACHING.tracks.find((x) => x.id === val(v, "who")) ?? COACHING.tracks[0];
      return [`For ${t.who.toLowerCase()} (${t.label.toLowerCase()}).`, "Built around your own work, online or in person."];
    },
    credit: false,
    cta: "learn",
    sets: ["coaching", "ai"],
  },
  {
    id: "vritta",
    name: "Vritta",
    when: "For institutions: the activity record that becomes the newsletter.",
    fields: [],
    start: {},
    hook: () => "Every department's activities, recorded once, and the newsletter writes itself.",
    body: () => [VRITTA.line, `Live in ${VRITTA.goLiveWeeks} weeks, for schools and colleges.`],
    credit: false,
    cta: "book",
    sets: ["software", "india"],
  },
  {
    id: "founders",
    name: "Founders",
    when: "Who is building FrameMind and why, in your own voice.",
    fields: [
      { key: "why", label: "What you are building", kind: "textarea", rows: 2, help: "It finishes the line “... a studio that”", max: 90 },
      { key: "today", label: "Where FrameMind is today", kind: "text", help: "One true line. A plan is written as a plan.", max: 80 },
    ],
    // "today" starts empty: a line that is true this month is wrong the next
    start: { why: "ships what founders actually need, and then stays to support it", today: "" },
    hook: (v) => `We are building a studio that ${part(v, "why", "what you are building")}.`,
    body: (v) => [part(v, "today", "where FrameMind is today")],
    credit: false,
    cta: "follow",
    sets: ["founders", "india"],
  },
];

/* ───────────────────────────── hook lines ───────────────────────────── */

/** First lines from the bank, each with the kind of post it opens. */
export const HOOKS: { line: string; fits: string }[] = [
  { line: "Before and after.", fits: "A redesign: the old site or logo, then the new one (with the client's approval)." },
  { line: "This used to take three hours a day.", fits: "An automation. Write the client's real number." },
  { line: "Here is what ₹[price] buys you.", fits: "A service spotlight, with the price from the rate card." },
  { line: "We said no to this project. Here is why.", fits: "A founder post about fit and honest scoping." },
  { line: "One prompt. Five minutes saved, every day.", fits: "An AI tip." },
  { line: "Day two of the shoot.", fits: "Behind the work on a photo or video project." },
  { line: "Shipped. Then supported.", fits: "A launch, with what happens after handover." },
];

/* ───────────────────────────── calls to action and hashtags ───────────────────────────── */

/** The bank's seven calls to action, by what the post is for. The sentences themselves are CTAS in words.ts. */
export const CTA_GOALS: { key: CtaKey; goal: string }[] = [
  { key: "book", goal: "Book a call" },
  { key: "quote", goal: "Get a price" },
  { key: "learn", goal: "Learn AI" },
  { key: "engage", goal: "Engage" },
  { key: "save", goal: "Save" },
  { key: "share", goal: "Share" },
  { key: "follow", goal: "Follow" },
];

/** every set but the core one, which is always in */
export type PickableSet = Exclude<TagSet, "core">;

export const TAG_SETS: { key: PickableSet; name: string }[] = [
  { key: "web", name: "Web design and development" },
  { key: "brand", name: "Brand identity" },
  { key: "software", name: "Software and SaaS" },
  { key: "ai", name: "AI and automation" },
  { key: "media", name: "Photo and video" },
  { key: "coaching", name: "AI coaching" },
  { key: "india", name: "India and small business" },
  { key: "hiring", name: "Hiring" },
  { key: "founders", name: "Founders" },
];

/** most sets in one caption: more would leave one tag from each */
export const MAX_SETS = 3;

/**
 * The hashtags for the chosen sets. Turn 0 is the standard pick of words.ts; each further turn takes the next
 * tags of every set, because the bank asks not to post the same set of tags twice in a row.
 */
export function tagMix(sets: PickableSet[], turn: number): string[] {
  if (!turn) return hashtags(...sets);
  const out: string[] = [...TAGS.core];
  const share = Math.max(2, Math.ceil(6 / Math.max(1, sets.length)));
  for (const set of sets) {
    const list = TAGS[set];
    for (let i = 0; i < Math.min(share, list.length); i++) {
      const tag = list[(i + turn * share) % list.length];
      if (!out.includes(tag) && out.length < 8) out.push(tag);
    }
  }
  return out;
}

/** the hashtag set that suits a service */
export const setForService = (serviceId: string): PickableSet => SERVICE_SETS[serviceId] ?? "web";

/* ───────────────────────────── the rules ───────────────────────────── */

/** The caption structure of the template spec, in five lines. */
export const CAPTION_RULES: { name: string; rule: string }[] = [
  { name: "Hook", rule: `The first ${FIRST_LINE} characters show before “more”. Lead with the problem or the result, not the studio.` },
  { name: "Body", rule: "Two to four short lines: what was made, for whom, and what it changed. One idea in each sentence." },
  { name: "Credit", rule: "Where client work is shown, with their approval: “Made by FrameMind AI Studio”." },
  { name: "Action", rule: "One call to action. Only one." },
  { name: "Hashtags", rule: "Five to eight after a line break, two of them core. In the whole caption: one exclamation mark at most, two emoji at most." },
];

/** What never goes in a post. */
export const DO_NOT_USE: string[] = [
  "Superlatives we cannot prove (“best”, “number 1”).",
  "Fake urgency (“only 3 slots left”) unless it is true.",
  "A client's name, logo, screens or results without their written approval.",
  "Client data of any kind: dashboards with real numbers, emails, phone numbers.",
  "Hashtags of competitors.",
];

/** The vocabulary of Voice and Tone: the words on the left are ours. */
export const SAY_NOT: { say: string; not: string }[] = [
  { say: "we build, we ship, we support", not: "we deliver synergies" },
  { say: "founders, owners, teams", not: "customers, users" },
  { say: `from ${rupees(startingPrice("websites"))}, ex-GST`, not: "cheapest, unbeatable price" },
  { say: "we aim to, we plan to", not: "guaranteed results" },
  { say: "custom, made for you", not: "revolutionary, game-changing, next-gen" },
  { say: "real projects, shown with permission", not: "trusted by 100+ brands" },
  { say: "AI that saves an hour a day", not: "AI that replaces your team" },
];

/* ───────────────────────────── a quick read of a caption ───────────────────────────── */

export interface Flag {
  /** "fix" breaks a rule · "look" may be fine, but a person should decide */
  level: "fix" | "look";
  text: string;
}

/** Words the brand does not use. "best" can be innocent ("the best moments of the day"), so it only asks for a look. */
const WORDS: { find: RegExp; level: Flag["level"]; text: string }[] = [
  { find: /\bnumber\s*(one|1)\b|\bno\.\s*1\b|#1\b/i, level: "fix", text: "“Number 1” is a superlative we cannot prove." },
  { find: /\bbest\b/i, level: "look", text: "“Best” is a superlative. Keep it only if it is not a claim about FrameMind." },
  { find: /\b(cheapest|unbeatable)\b/i, level: "fix", text: "Say the price itself (“from ... ex-GST”), not “cheapest” or “unbeatable”." },
  { find: /\bguarantee[ds]?\b/i, level: "fix", text: "We do not promise results. Say “we aim to” or “we plan to”." },
  { find: /\b(revolutionary|game[- ]changing|next[- ]gen|synerg\w*)\b/i, level: "fix", text: "Say what it does, not “revolutionary”, “game-changing”, “next-gen” or “synergy”." },
  { find: /\btrusted by\b/i, level: "fix", text: "“Trusted by” claims clients we may not have. Show real, approved work instead." },
  { find: /\breplaces? (your|the) team\b/i, level: "fix", text: "We do not sell AI as replacing people. Say what time or work it saves." },
  { find: /\bonly\s+\d+\s+(slots?|seats?|spots?|places?)\s+left\b/i, level: "look", text: "Urgency (“only ... left”) is allowed only when it is true today." },
];

/** What a quick read of the caption finds against the caption rules. An empty list means nothing stood out. */
export function review(text: string): Flag[] {
  const flags: Flag[] = [];
  const first = text.split("\n")[0] ?? "";
  if (first.length > FIRST_LINE) flags.push({ level: "fix", text: `The first line is ${first.length} characters. Only the first ${FIRST_LINE} show before “more”.` });
  const gaps = [...new Set(text.match(/\[[^\]\n]+\]/g) ?? [])];
  if (gaps.length) flags.push({ level: "fix", text: `Still to fill in: ${gaps.join(", ")}.` });
  const marks = (text.match(/!/g) ?? []).length;
  if (marks > 1) flags.push({ level: "fix", text: `${marks} exclamation marks. A caption has one at most.` });
  const emoji = (text.match(/\p{Extended_Pictographic}/gu) ?? []).length;
  if (emoji > 2) flags.push({ level: "fix", text: `${emoji} emoji. A caption has two at most, and never in place of a word.` });
  if (text.includes("₹") && !/GST/i.test(text)) flags.push({ level: "fix", text: "A price is shown without its GST status: write “ex-GST”." });
  const tags = (text.match(/#[\p{L}\p{N}_]+/gu) ?? []).length;
  if (tags && (tags < 5 || tags > 8)) flags.push({ level: "fix", text: `${tags} ${tags === 1 ? "hashtag" : "hashtags"}. A caption has five to eight.` });
  for (const w of WORDS) if (w.find.test(text)) flags.push({ level: w.level, text: w.text });
  return flags;
}
