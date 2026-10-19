/**
 * Words for Social Studio: dates as the brand writes them, the caption structure and the hashtag sets.
 * Source: OPERATIONS/01_BRAND (voice and tone) and 08_SOCIAL_MEDIA (template spec, caption and hashtag bank).
 * Change a caption line or a hashtag there and here together.
 */
import type { Caption, Values } from "./types";

/* ───────────────────────────── values ───────────────────────────── */

export const val = (v: Values, key: string) => (v[key] ?? "").trim();
/** the lines of a multi-line box, empty ones dropped */
export const linesOf = (v: Values, key: string) => val(v, key).split("\n").map((s) => s.trim()).filter(Boolean);
/**
 * One of a design's choices, by the value in its box. A value that is not a choice gets nothing: a design link can be
 * edited by hand, and a word such as "constructor" must not find something that every list happens to carry.
 */
export const choice = <T,>(choices: Record<string, T>, key: string): T | undefined => (Object.prototype.hasOwnProperty.call(choices, key) ? choices[key] : undefined);
/** "Title | a line about it" → both halves */
export const splitLine = (line: string) => {
  const [title, ...rest] = line.split("|");
  return { title: title.trim(), text: rest.join("|").trim() };
};

/* ───────────────────────────── dates ───────────────────────────── */

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** A date typed in a date box ("2026-10-23"), read without a time zone getting in the way. */
function parts(iso: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso.trim());
  if (!m) return null;
  const y = Number(m[1]), mo = Number(m[2]), d = Number(m[3]);
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  return { y, mo, d, wd: new Date(Date.UTC(y, mo - 1, d)).getUTCDay() };
}

/** 23 Oct 2026 */
export function shortDate(iso: string) {
  const p = parts(iso);
  return p ? `${p.d} ${MONTHS[p.mo - 1]} ${p.y}` : "";
}
/** Thu, 23 Oct 2026 */
export function longDate(iso: string) {
  const p = parts(iso);
  return p ? `${DAYS[p.wd]}, ${p.d} ${MONTHS[p.mo - 1]} ${p.y}` : "";
}
/** 23·10·2026, for the mono note in a corner */
export function dotDate(iso: string) {
  const p = parts(iso);
  return p ? `${String(p.d).padStart(2, "0")}·${String(p.mo).padStart(2, "0")}·${p.y}` : "";
}
/** the three lines of a date in a construction circle: THU / 23 / OCT 2026 */
export function dateHero(iso: string) {
  const p = parts(iso);
  return p ? { top: DAYS[p.wd], main: String(p.d), bottom: `${MONTHS[p.mo - 1]} ${p.y}` } : null;
}
/** whole days from one date to another (negative when the second is earlier) */
export function daysBetween(fromIso: string, toIso: string) {
  const a = parts(fromIso), b = parts(toIso);
  if (!a || !b) return null;
  return Math.round((Date.UTC(b.y, b.mo - 1, b.d) - Date.UTC(a.y, a.mo - 1, a.d)) / 86_400_000);
}

/** ₹1,099 with Indian digit grouping */
export const rupees = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

/** "https://www.studio.site/x" → "studio.site" for the corner of a design */
export const bareSite = (url: string) => url.replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/.*$/, "");

/* ───────────────────────────── hashtags ───────────────────────────── */

export const TAGS = {
  core: ["#FrameMind", "#FrameMindAIStudio"],
  web: ["#WebDesign", "#WebDevelopment", "#CustomWebsite", "#UIUXDesign", "#NextJS", "#WebsiteDesign"],
  brand: ["#BrandIdentity", "#LogoDesign", "#Branding", "#BrandDesign", "#VisualIdentity"],
  software: ["#SoftwareDevelopment", "#SaaS", "#WebApp", "#Dashboards", "#BuildInPublic"],
  ai: ["#AIAutomation", "#Automation", "#AITools", "#GenerativeAI", "#NoCode", "#Productivity"],
  media: ["#Photography", "#Videography", "#BrandFilm", "#ProductPhotography", "#BehindTheScenes", "#Reels"],
  coaching: ["#LearnAI", "#AICoaching", "#AIForEveryone", "#Upskilling", "#FutureSkills"],
  india: ["#MadeInIndia", "#StartupIndia", "#KarnatakaStartups", "#Gadag", "#SmallBusinessIndia", "#MSME"],
  hiring: ["#Hiring", "#WeAreHiring", "#DesignJobs", "#DeveloperJobs", "#Internship"],
  founders: ["#BuildInPublic", "#StartupIndia", "#FounderJourney", "#Entrepreneurship"],
} as const;
export type TagSet = keyof typeof TAGS;

/** The two core tags, then a few from each named set: 5 to 8 in all, none twice. */
export function hashtags(...sets: TagSet[]): string[] {
  const out: string[] = [...TAGS.core];
  const share = Math.max(2, Math.ceil(6 / Math.max(1, sets.length)));
  for (const set of sets) for (const tag of TAGS[set].slice(0, share)) if (!out.includes(tag) && out.length < 8) out.push(tag);
  return out;
}

/* ───────────────────────────── calls to action ───────────────────────────── */

export const CTAS = {
  book: "Book a 20-minute discovery call. Link in bio.",
  quote: "Get a price for your project in two minutes. Link in bio.",
  learn: "Start learning AI 1:1. Link in bio.",
  engage: "What would you automate first? Tell us below.",
  save: "Save this for your next project.",
  share: "Send this to a founder who needs it.",
  follow: "Follow for what we are building every week.",
} as const;
export type CtaKey = keyof typeof CTAS;
/** the one action under a thumbnail or an episode cover (not one of the seven of the bank, which are for posts) */
export const WATCH = "Watch the full video. Link in bio.";

/** the credit line under client work, when the client has agreed to be named */
export const CREDIT = "Made by FrameMind AI Studio";

/**
 * A caption in the house structure: hook line, two to four short lines, the credit where client work is shown,
 * one call to action, then the hashtags after a line break.
 */
export function caption(o: { hook: string; body?: (string | false | undefined)[]; credit?: boolean; cta?: string; tags: string[] }): Caption {
  const body = (o.body ?? []).filter((l): l is string => !!l && !!l.trim());
  const blocks = [o.hook.trim(), body.join("\n"), o.credit ? CREDIT : "", (o.cta ?? "").trim()].filter(Boolean);
  return { text: blocks.join("\n\n"), tags: o.tags };
}
