/**
 * The designs of Social Studio, part 2 (promotion, more announcements, video series, special days and the
 * founders' own posts). Same rules as part 1: see core.ts.
 *
 * Prices, bundle steps, coaching tracks and Vritta's details are read from the published rate card, and the
 * founders' names from the site profile, so a post can never disagree with the website.
 */
import { BUNDLE, COACHING, SERVICES, VRITTA } from "@/lib/content/catalog";
import { site } from "@/lib/site";
import { startingPrice } from "../bank";
import { figure, list, photo, poster, thumb, type Fact } from "../layouts";
import type { FieldSpec, FormatId, TemplateDef, Values } from "../types";
import { CTAS, WATCH, bareSite, caption, choice, dateHero, daysBetween, dotDate, hashtags, linesOf, longDate, rupees, splitLine, val } from "../words";

const picture = (key: string, label: string, help?: string): FieldSpec => ({ key, label, kind: "image", help });
const ALL_SIZES: FormatId[] = ["post", "square", "story", "wide"];

/** a typed line as a sentence: a full stop is added unless it already ends with one */
const sentence = (s: string) => (s && !/[.?!…]$/.test(s) ? `${s}.` : s);
const APPROVAL = "Client work only with the client's written approval; people only with their consent.";

/* ───────────────────────────── what we build ───────────────────────────── */

const PROMO_HEADLINE = "We build what founders need, actually shipped";

const promoStudio: TemplateDef = {
  id: "promo-studio",
  name: "What we build",
  group: "Promotion",
  blurb: "The studio in one post: the services, three points and how to start.",
  formats: ALL_SIZES,
  tones: ["paper", "graphite", "photo"],
  fields: [
    { key: "headline", label: "Headline (up to 10 words)", kind: "text", placeholder: PROMO_HEADLINE, max: 50 },
    { key: "line", label: "One line", kind: "textarea", rows: 3, max: 120 },
    { key: "points", label: "Three points (one per line)", kind: "textarea", rows: 3, help: "Only what is true of every project.", max: 48 },
    picture("picture", "Picture (for the Photo look)", APPROVAL),
  ],
  sample: {
    headline: PROMO_HEADLINE,
    line: "Websites, brands, software, automations, photo, video and social, from one founder-led team.",
    points: "Scope, timeline and price in writing first\nYou own everything we build\nShipped, then supported",
  },
  draw(p, { values: v, pictures, facts }) {
    const base = { tag: "FrameMind · Studio", foot: bareSite(facts.website) };
    const headline = val(v, "headline") || PROMO_HEADLINE;
    if (p.tone === "photo") {
      photo(p, { ...base, headline, sub: val(v, "line"), chips: SERVICES.slice(0, 4).map((s) => s.name), picture: pictures.picture });
      return;
    }
    const points = linesOf(v, "points").slice(0, 3);
    poster(p, {
      ...base,
      eyebrow: "Design · Software · Media · AI",
      headline,
      // Square and Wide are short sheets: with the points on them, the line stays in the caption
      sub: p.portrait || !points.length ? val(v, "line") : "",
      bullets: points,
      facts: [{ label: "Services", value: `${SERVICES.length} under one roof` }, { label: "Based in", value: site.location }],
      cta: "Book a discovery call",
    });
  },
  caption(v) {
    return caption({
      hook: sentence(val(v, "headline") || PROMO_HEADLINE),
      body: [val(v, "line"), ...linesOf(v, "points").slice(0, 3).map((l) => `· ${l}`)],
      cta: CTAS.book,
      tags: hashtags("web", "india"),
    });
  },
};

/* ───────────────────────────── the Studio Bundle ───────────────────────────── */

const steps = BUNDLE.steps;
const bundleLabel = (i: number) => (i === steps.length - 1 ? `${steps[i].services} or more services` : `${steps[i].services} services`);

const bundlePost: TemplateDef = {
  id: "bundle",
  name: "The Studio Bundle",
  group: "Promotion",
  blurb: "The bundle discount for taking several services together, read from the rate card.",
  formats: ALL_SIZES,
  tones: ["paper", "graphite"],
  fields: [
    { key: "title", label: "Title", kind: "text", placeholder: "The Studio Bundle", max: 30 },
    { key: "cta", label: "Call to action", kind: "select", options: [{ value: "quote", label: "Get a price" }, { value: "share", label: "None on the design (caption: send this to a founder)" }] },
  ],
  sample: { title: "The Studio Bundle", cta: "quote" },
  draw(p, { values: v, facts }) {
    list(p, {
      tag: "Pricing · Bundle",
      foot: bareSite(facts.website),
      eyebrow: "Take more, pay less",
      title: val(v, "title") || "The Studio Bundle",
      items: steps.map((s, i) => ({ title: `${s.discountPercent}% off`, text: bundleLabel(i) })),
      cta: val(v, "cta") === "share" ? undefined : "Get a price",
    });
  },
  caption(v) {
    return caption({
      hook: `Website, brand, software, media: take ${steps[0].services} or more together and pay up to ${steps[steps.length - 1].discountPercent}% less.`,
      body: [...steps.map((s, i) => `· ${bundleLabel(i)}: ${s.discountPercent}% off`), `For example: ${BUNDLE.standard.slice(0, 2).map((b) => `${b.label} (${b.detail}) ${rupees(b.price)}`).join(", ")}, ex-GST.`],
      cta: val(v, "cta") === "share" ? CTAS.share : CTAS.quote,
      tags: hashtags("web", "brand"),
    });
  },
};

/* ───────────────────────────── taking new projects ───────────────────────────── */

const BOOKING_LINE = "Tell us what you are building. You get a written scope, timeline and price before any work starts.";

const nowBooking: TemplateDef = {
  id: "now-booking",
  name: "Taking new projects",
  group: "Promotion",
  blurb: "Open for new projects in a month, with the starting prices from the rate card.",
  formats: ALL_SIZES,
  tones: ["paper", "graphite"],
  fields: [
    { key: "when", label: "Month", kind: "text", placeholder: "January 2027", help: "Say only what is true. No “two slots left” unless it is so.", max: 24 },
    { key: "line", label: "One line (optional)", kind: "textarea", rows: 2, placeholder: "Leave empty for the standard line", max: 120 },
  ],
  sample: { when: "next month", line: "" },
  draw(p, { values: v, facts }) {
    const priced: Fact[] = SERVICES.filter((s) => s.billing === "project")
      .slice(0, 3)
      .map((s) => ({ label: s.name, value: `from ${rupees(startingPrice(s.id))}` }));
    poster(p, {
      tag: "Studio · Bookings",
      foot: bareSite(facts.website),
      eyebrow: "Open for projects",
      headline: `Taking new projects for ${val(v, "when") || "next month"}`,
      sub: val(v, "line") || BOOKING_LINE,
      facts: priced,
      cta: "Book a discovery call",
    });
  },
  caption(v) {
    return caption({
      hook: `Taking new projects for ${val(v, "when") || "next month"}.`,
      body: [val(v, "line") || BOOKING_LINE, "Prices ex-GST, from our published rate card."],
      cta: CTAS.book,
      tags: hashtags("web", "india"),
    });
  },
};

/* ───────────────────────────── AI coaching ───────────────────────────── */

const trackOf = (v: Values) => COACHING.tracks.find((t) => t.id === val(v, "track")) ?? COACHING.tracks[0];

const coachingPost: TemplateDef = {
  id: "ai-coaching",
  name: "1:1 AI Coaching",
  group: "Promotion",
  blurb: "The 90-day programme for one age track, online or in person.",
  formats: ALL_SIZES,
  tones: ["paper", "graphite", "photo"],
  fields: [
    { key: "track", label: "For whom", kind: "select", options: COACHING.tracks.map((t) => ({ value: t.id, label: `${t.label}: ${t.who}` })) },
    { key: "line", label: "One line (optional)", kind: "textarea", rows: 2, placeholder: "Leave empty for the standard line", max: 120 },
    picture("picture", "Picture (for the Photo look)", "A learner only with their (or a parent's) consent."),
  ],
  sample: { track: COACHING.tracks[1].id, line: "" },
  draw(p, { values: v, pictures, facts }) {
    const t = trackOf(v);
    const base = { tag: "AI Coaching · 1:1", foot: bareSite(facts.website) };
    const headline = `Learn AI completely, in ${COACHING.days} days`;
    const sub = val(v, "line") || `Starting from zero, built around your own work. For ${t.who.toLowerCase()}.`;
    if (p.tone === "photo") {
      photo(p, { ...base, headline, sub, chips: [t.label, "Online or in person"], picture: pictures.picture });
      return;
    }
    poster(p, {
      ...base,
      eyebrow: "Always one to one",
      headline,
      sub,
      hero: p.wide ? { top: "Days", main: String(COACHING.days), bottom: "Always 1:1" } : null,
      facts: [{ label: "For", value: t.label }, { label: "How", value: COACHING.modes.map((m) => m.label).join(" or ") }],
      cta: "Start learning",
    });
  },
  caption(v) {
    const t = trackOf(v);
    return caption({ hook: `Learn AI completely, in ${COACHING.days} days, starting from zero.`, body: [val(v, "line") || `Always 1:1, built around your own work. For ${t.who.toLowerCase()}.`, "Online or in person."], cta: CTAS.learn, tags: hashtags("coaching", "ai") });
  },
};

/* ───────────────────────────── Vritta ───────────────────────────── */

const vrittaPost: TemplateDef = {
  id: "vritta",
  name: "Vritta for institutions",
  group: "Promotion",
  blurb: "For schools and colleges: the activity record that becomes the newsletter.",
  formats: ALL_SIZES,
  tones: ["paper", "graphite"],
  fields: [{ key: "line", label: "One line (optional)", kind: "textarea", rows: 2, placeholder: "Leave empty for Vritta's own line", max: 130 }],
  sample: { line: "" },
  draw(p, { values: v, facts }) {
    poster(p, {
      tag: "Vritta · For institutions",
      foot: bareSite(facts.website),
      eyebrow: "For schools and colleges",
      headline: "Every activity, recorded once",
      sub: val(v, "line") || VRITTA.line,
      bullets: VRITTA.editions.map((e) => `${e.name}: ${e.summary}`).slice(0, 3),
      facts: [{ label: "Go-live", value: `${VRITTA.goLiveWeeks} weeks` }],
      cta: "Book a demo",
    });
  },
  caption(v) {
    return caption({ hook: "Every department's activities, recorded once, and the newsletter writes itself.", body: [val(v, "line") || VRITTA.line, `Live in ${VRITTA.goLiveWeeks} weeks.`], cta: CTAS.book, tags: hashtags("software", "india") });
  },
};

/* ───────────────────────────── any event ───────────────────────────── */

const EVENTS: Record<string, { label: string; eyebrow: string }> = {
  workshop: { label: "Workshop", eyebrow: "Join us" },
  webinar: { label: "Webinar", eyebrow: "Join us online" },
  meetup: { label: "Founders' meetup", eyebrow: "You are invited" },
  stall: { label: "Stall at an exhibition", eyebrow: "Meet us at our stall" },
  talk: { label: "Talk", eyebrow: "Hear us speak" },
  other: { label: "Another event", eyebrow: "Coming up" },
};

const eventPost: TemplateDef = {
  id: "event",
  name: "Event",
  group: "Announcements",
  blurb: "A workshop, webinar, meetup, talk or stall: what, when and where.",
  formats: ALL_SIZES,
  tones: ["paper", "graphite"],
  fields: [
    { key: "kind", label: "What kind of event?", kind: "select", options: Object.entries(EVENTS).map(([value, e]) => ({ value, label: e.label })) },
    { key: "title", label: "Name of the event", kind: "text", placeholder: "AI for small business", max: 40 },
    { key: "date", label: "Date", kind: "date" },
    { key: "time", label: "Time", kind: "text", placeholder: "10:00 am to 12:00 noon", max: 24 },
    { key: "place", label: "Place", kind: "text", placeholder: "Venue, city", help: "For a webinar, write where it runs: Zoom, YouTube Live.", max: 32 },
    { key: "line", label: "One line (optional)", kind: "textarea", rows: 2, placeholder: "What people will learn or see there", max: 120 },
    { key: "cta", label: "Button text (optional)", kind: "text", placeholder: "Register: link in bio", max: 28 },
  ],
  sample: { kind: "workshop", title: "Your event's name", date: "", time: "10:00 am", place: "Venue, city", line: "One line about what people will learn there.", cta: "Save the date" },
  draw(p, { values: v, facts }) {
    const kind = choice(EVENTS, val(v, "kind")) ?? EVENTS.other;
    const date = val(v, "date");
    poster(p, {
      tag: `FrameMind · ${kind.label}`,
      index: dotDate(date),
      foot: bareSite(facts.website),
      eyebrow: kind.eyebrow,
      headline: val(v, "title") || "Name of the event",
      sub: val(v, "line"),
      hero: dateHero(date),
      facts: [
        { label: "Date", value: longDate(date) },
        { label: "Time", value: val(v, "time") },
        { label: "Where", value: val(v, "place") },
      ],
      cta: val(v, "cta") || undefined,
    });
  },
  caption(v) {
    const when = [longDate(val(v, "date")), val(v, "time")].filter(Boolean).join(", ");
    return caption({
      hook: `${val(v, "title") || "[Event]"}${when ? `: ${when}` : ""}.`,
      body: [val(v, "line"), val(v, "place") && `Where: ${val(v, "place")}.`],
      cta: sentence(val(v, "cta")) || CTAS.follow,
      tags: hashtags("ai", "india"),
    });
  },
};

/* ───────────────────────────── countdown ───────────────────────────── */

/** The number typed, or the days from today to the date when the box is left empty ("" when the date has passed). */
const daysToGo = (v: Values) => {
  if (val(v, "days")) return val(v, "days");
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const n = daysBetween(today, val(v, "date"));
  return n !== null && n >= 0 ? String(n) : "";
};

const countdown: TemplateDef = {
  id: "countdown",
  name: "Countdown",
  group: "Announcements",
  blurb: "Days to go to a launch or an event.",
  formats: ALL_SIZES,
  tones: ["paper", "graphite"],
  fields: [
    { key: "what", label: "To what?", kind: "text", placeholder: "The launch", max: 36 },
    { key: "date", label: "Its date", kind: "date" },
    { key: "days", label: "Days to go (leave empty to count from today)", kind: "text", placeholder: "Counted from today", help: "Left empty, the design counts from today to the date above: download it on the day you post. Type a number only for a post you are making ahead.", max: 3 },
    { key: "line", label: "One line (optional)", kind: "textarea", rows: 2, max: 90 },
  ],
  sample: { days: "", what: "The launch", date: "", line: "" },
  draw(p, { values: v, facts }) {
    const days = daysToGo(v) || "00";
    figure(p, {
      tag: "Countdown",
      index: dotDate(val(v, "date")),
      foot: bareSite(facts.website),
      figure: days,
      unit: Number(days) === 1 ? "Day to go" : "Days to go",
      label: val(v, "what") || "What is coming",
      // the date on a line of its own, so the sentence after it is never broken in an odd place
      sub: [longDate(val(v, "date")), val(v, "line")].filter(Boolean).join("\n"),
    });
  },
  caption(v) {
    const days = daysToGo(v) || "[00]";
    return caption({
      hook: `${days} ${Number(days) === 1 ? "day" : "days"} to go: ${val(v, "what") || "[what is coming]"}.`,
      body: [val(v, "line"), longDate(val(v, "date")) && `${longDate(val(v, "date"))}.`],
      cta: CTAS.follow,
      tags: hashtags("founders", "india"),
    });
  },
};

/* ───────────────────────────── special days ───────────────────────────── */

/** `on` is month-day. The lines are about making, craft and the people who build: nothing political or religious. */
const DAYS: Record<string, { label: string; on: string; headline: string; message: string; hashtag: string }> = {
  engineers: { label: "Engineers' Day (15 Sep)", on: "09-15", headline: "Happy Engineers' Day", message: "Here is to everyone who takes a messy problem and ships something that works.", hashtag: "#EngineersDay" },
  teachers: { label: "Teachers' Day (5 Sep)", on: "09-05", headline: "Happy Teachers' Day", message: "Thank you to everyone who taught us to ask why, and then to build it anyway.", hashtag: "#TeachersDay" },
  msme: { label: "MSME Day (27 Jun)", on: "06-27", headline: "Happy MSME Day", message: "To the small businesses we build for, and the one we are building.", hashtag: "#MSMEDay" },
  photography: { label: "World Photography Day (19 Aug)", on: "08-19", headline: "World Photography Day", message: "Good light, a steady hand and the patience to wait for the moment.", hashtag: "#WorldPhotographyDay" },
  rajyotsava: { label: "Kannada Rajyotsava (1 Nov)", on: "11-01", headline: "Kannada Rajyotsava", message: "Greetings from our home state. Proud to build in Karnataka, for the world.", hashtag: "#KannadaRajyotsava" },
  republic: { label: "Republic Day (26 Jan)", on: "01-26", headline: "Happy Republic Day", message: "Here is to the founders building what comes next.", hashtag: "#RepublicDay" },
  independence: { label: "Independence Day (15 Aug)", on: "08-15", headline: "Happy Independence Day", message: "The freedom to try, to fail and to ship again.", hashtag: "#IndependenceDay" },
  newyear: { label: "New Year (1 Jan)", on: "01-01", headline: "Happy New Year", message: "Here is to what you will build this year.", hashtag: "#HappyNewYear" },
  other: { label: "Another day (type it below)", on: "", headline: "", message: "", hashtag: "" },
};
const dayOf = (v: Values) => choice(DAYS, val(v, "day")) ?? DAYS.engineers;

/** The figure in the circle and the note under it: "15" and "TUE · SEP 2026" (the year only when one is typed). */
function specialDate(v: Values) {
  const day = dayOf(v);
  const year = /^\d{4}$/.test(val(v, "year")) ? val(v, "year") : "";
  const hero = dateHero(day.on ? `${year || "2000"}-${day.on}` : val(v, "date"));
  if (!hero) return { main: "00", note: "Date" };
  return { main: hero.main, note: day.on && !year ? hero.bottom.split(" ")[0] : `${hero.top} · ${hero.bottom}` };
}

const festival: TemplateDef = {
  id: "festival",
  name: "Special days",
  group: "Announcements",
  blurb: "A greeting for Engineers' Day, MSME Day, Photography Day and others, in our own voice.",
  formats: ALL_SIZES,
  tones: ["paper", "graphite"],
  fields: [
    { key: "day", label: "Which day?", kind: "select", options: Object.entries(DAYS).map(([value, f]) => ({ value, label: f.label })) },
    { key: "year", label: "Year", kind: "text", placeholder: "2026", max: 4 },
    { key: "name", label: "Name of the day (only for another day)", kind: "text", placeholder: "World Design Day", max: 30 },
    { key: "date", label: "Its date (only for another day)", kind: "date" },
    { key: "message", label: "Message (optional)", kind: "textarea", rows: 3, placeholder: "Leave empty for our standard line for the day", help: "Keep it about making and the people who build. Nothing political or religious. A Kannada line needs a native speaker's review first.", max: 110 },
  ],
  sample: { day: "engineers", year: "", name: "", date: "", message: "" },
  draw(p, { values: v, facts }) {
    const day = dayOf(v);
    const when = specialDate(v);
    figure(p, {
      tag: "From all of us at FrameMind",
      foot: bareSite(facts.website),
      figure: when.main,
      unit: when.note,
      label: day.headline || val(v, "name") || "Name of the day",
      sub: val(v, "message") || day.message,
    });
  },
  caption(v) {
    const day = dayOf(v);
    const tags = hashtags("founders", "india");
    return caption({
      hook: sentence(day.headline || val(v, "name") || "[Name of the day]"),
      body: [val(v, "message") || day.message],
      cta: CTAS.follow,
      tags: day.hashtag ? [...tags.slice(0, 2), day.hashtag, ...tags.slice(2, 7)] : tags,
    });
  },
};

/* ───────────────────────────── case study ───────────────────────────── */

/** "3x | More enquiries" → a number with its label */
const countsOf = (v: Values) =>
  linesOf(v, "numbers")
    .map(splitLine)
    .filter((n) => n.title)
    .slice(0, 3);

const caseStudy: TemplateDef = {
  id: "case-study",
  name: "Case study",
  group: "Milestones",
  blurb: "A finished project: the client, what we made and up to three real results. Only with the client's approval.",
  formats: ALL_SIZES,
  tones: ["paper", "graphite", "photo"],
  fields: [
    { key: "client", label: "Client", kind: "text", placeholder: "The client's name, as they write it", help: "Name a client only after they have approved the post.", max: 48 },
    { key: "work", label: "What we made", kind: "text", placeholder: "Website, brand and booking automation", max: 60 },
    { key: "numbers", label: "Up to three results, one per line: the number, a | sign, what it counts", kind: "textarea", rows: 3, placeholder: "6 weeks | Brief to launch", help: "Only numbers the client has confirmed. Leave a line out if you do not have it.", max: 30 },
    { key: "line", label: "One line (optional)", kind: "textarea", rows: 2, placeholder: "The problem we solved", max: 130 },
    picture("picture", "Picture of the work (optional)", `${APPROVAL} With the Photo look it fills the frame.`),
  ],
  sample: { client: "Client name", work: "Website and booking automation", numbers: "", line: "" },
  draw(p, { values: v, pictures, facts }) {
    const client = val(v, "client") || "Client name";
    const counts = countsOf(v);
    const base = { tag: "Case study", foot: bareSite(facts.website) };
    if (p.tone === "photo") {
      photo(p, { ...base, headline: client, sub: [val(v, "work"), val(v, "line")].filter(Boolean).join(". "), chips: counts.map((n) => `${n.title} ${n.text}`.trim()), picture: pictures.picture });
      return;
    }
    const pic = pictures.picture;
    const square = !p.portrait && !p.wide;
    const asFact = (n: { title: string; text: string }): Fact => ({ label: n.text || "Result", value: n.title });
    const [first, ...rest] = counts;
    const lead = !pic && first && first.title.length <= 6 && first.text.length <= 12 ? first : null;
    poster(p, {
      ...base,
      eyebrow: val(v, "work") || "What we made",
      headline: client,
      sub: square && pic ? "" : val(v, "line"),
      hero: lead ? { main: lead.title, bottom: lead.text } : null,
      picture: pic,
      facts: (lead ? rest : counts).map(asFact),
      cta: square ? undefined : "Start your project",
    });
  },
  caption(v) {
    const client = val(v, "client") || "[Client]";
    return caption({
      hook: `${val(v, "work") || "[What we made]"} for ${client}.`,
      body: [val(v, "line"), countsOf(v).map((n) => `${n.title} ${n.text.toLowerCase()}`.trim()).join(" · ")],
      credit: true,
      cta: CTAS.book,
      tags: hashtags("web", "founders"),
    });
  },
};

/* ───────────────────────────── series cover ───────────────────────────── */

/** "3" → "03", as an episode number is written on a cover */
const episodeOf = (v: Values) => {
  const n = val(v, "episode");
  return /^\d$/.test(n) ? `0${n}` : n;
};

const seriesCover: TemplateDef = {
  id: "series-cover",
  name: "Series cover",
  group: "Video",
  blurb: "The cover of one episode in a series: the same look every time, only the number and title change.",
  formats: ["wide", "story", "post", "square"],
  tones: ["paper", "graphite"],
  fields: [
    { key: "series", label: "Name of the series", kind: "text", placeholder: "Studio diaries", max: 26 },
    { key: "episode", label: "Episode number", kind: "text", placeholder: "03", max: 3 },
    { key: "title", label: "Title of the episode (two words on YouTube, up to six on a Reel cover)", kind: "text", placeholder: "The rebrand", max: 30 },
    picture("picture", "Frame from the episode (optional)", `With a picture, it fills the cover and the words sit on it. Without one, the number sits in the circle. ${APPROVAL}`),
  ],
  sample: { series: "Studio diaries", episode: "01", title: "Day one" },
  draw(p, { values: v, pictures, facts }) {
    const series = val(v, "series") || "Name of the series";
    const episode = episodeOf(v);
    const title = val(v, "title") || "Title of the episode";
    if (pictures.picture) {
      thumb(p, { words: title, series, badge: episode ? `EP ${episode}` : "", picture: pictures.picture });
      return;
    }
    figure(p, { tag: "FrameMind · Video series", index: episode ? `EP ${episode}` : undefined, foot: bareSite(facts.website), figure: episode || "00", unit: "Episode", label: title, sub: series });
  },
  caption(v) {
    const episode = episodeOf(v);
    return caption({
      hook: sentence(val(v, "title") || "[Title of the episode]"),
      body: [`${val(v, "series") || "[Series]"}${episode ? `, episode ${episode}` : ""}.`],
      cta: WATCH,
      tags: hashtags("media", "founders"),
    });
  },
};

/* ───────────────────────────── the founders' own posts ───────────────────────────── */

const FOUNDERS = site.founders;
const founderOf = (v: Values) => FOUNDERS.find((f) => f.id === val(v, "who")) ?? FOUNDERS[0];
const firstName = (name: string) => name.split(" ")[0];
const WHO: FieldSpec = { key: "who", label: "Whose post is it?", kind: "select", options: FOUNDERS.map((f) => ({ value: f.id, label: `${f.name} (${f.role})` })) };
const OWN_WORDS = "Your own words, in the first person. Plans are written as plans, and no number is rounded up.";
const roleOf = (role: string) => `${role.split(" & ")[0]}, FrameMind`;

const founderNote: TemplateDef = {
  id: "founder-note",
  name: "Founder's note",
  group: "Founders",
  blurb: "A short note in your own voice for your personal profile. LinkedIn first.",
  formats: ["post", "square", "wide"],
  tones: ["paper", "graphite", "photo"],
  fields: [
    WHO,
    { key: "headline", label: "Headline (up to 8 words)", kind: "text", placeholder: "Why we write the scope before the price", max: 46 },
    { key: "lines", label: "Two or three short lines", kind: "textarea", rows: 4, help: `${OWN_WORDS} The full note goes in the caption.`, max: 70 },
    picture("portrait", "Your photo (optional)", "With the Photo look it fills the frame, which suits a portrait. On Paper and Graphite it sits in a wide box: use Up · down to keep your face in view."),
  ],
  sample: {
    who: FOUNDERS[0].id,
    headline: "Why we write the scope before the price",
    lines: "A price without a scope is a guess.\nWe would rather say no than guess.",
  },
  draw(p, { values: v, pictures, facts }) {
    const who = founderOf(v);
    const base = { tag: "Founders", foot: bareSite(facts.website) };
    const headline = val(v, "headline") || "Headline";
    const lines = linesOf(v, "lines").join(" ");
    const role = roleOf(who.role);
    if (p.tone === "photo") {
      photo(p, { ...base, headline, sub: lines, chips: [who.name, role], picture: pictures.portrait });
      return;
    }
    poster(p, {
      ...base,
      eyebrow: `A note from ${firstName(who.name)}`,
      headline,
      // a square sheet with a photo on it has room for the headline only: the lines stay in the caption
      sub: pictures.portrait && !p.portrait && !p.wide ? "" : lines,
      picture: pictures.portrait,
      // the founder's initials in the circle, where a wide sheet would otherwise be empty
      hero: p.wide ? { main: who.initials } : null,
      facts: [{ label: role, value: who.name }],
    });
  },
  caption(v) {
    return caption({
      hook: sentence(val(v, "headline") || "[Headline]"),
      body: [...linesOf(v, "lines"), "I am building FrameMind AI Studio: websites, brands, software, automations and media for founders."],
      cta: CTAS.follow,
      tags: hashtags("founders", "india"),
    });
  },
};

const COUNT_WORDS = ["", "One thing", "Two things", "Three things", "Four things", "Five things"];
const logPoints = (v: Values) => linesOf(v, "points").map(splitLine).slice(0, 5);

const buildLog: TemplateDef = {
  id: "build-log",
  name: "Build log",
  group: "Founders",
  blurb: "“What I learned this week”: a title and three to five points, signed with your name.",
  formats: ALL_SIZES,
  tones: ["paper", "graphite"],
  fields: [
    WHO,
    { key: "title", label: "Title", kind: "text", placeholder: "What I learned this week", max: 36 },
    { key: "points", label: "Three to five points, one per line. Add a line about it after a | sign.", kind: "textarea", rows: 5, placeholder: "The point | A line about it", help: `${OWN_WORDS} Square and Wide show the first four points.`, max: 86 },
    { key: "date", label: "Week of (optional)", kind: "date" },
  ],
  sample: {
    who: FOUNDERS[0].id,
    title: "What I learned this week",
    points: "One thing that worked | Say what you tried and what happened.\nOne thing that broke | Be honest about it. That is the point.\nOne thing to try next | A plan, written as a plan.",
    date: "",
  },
  draw(p, { values: v }) {
    const who = founderOf(v);
    list(p, { tag: "Build log", index: dotDate(val(v, "date")), foot: who.name, eyebrow: roleOf(who.role), title: val(v, "title") || "What I learned this week", items: logPoints(v) });
  },
  caption(v) {
    const items = logPoints(v);
    return caption({
      hook: `${sentence(val(v, "title") || "What I learned this week")}${COUNT_WORDS[items.length] ? ` ${COUNT_WORDS[items.length]} from building FrameMind.` : ""}`,
      body: items.map((i, n) => `${n + 1}. ${i.title}${i.text ? `: ${i.text}` : ""}`),
      cta: CTAS.follow,
      tags: hashtags("founders", "india"),
    });
  },
};

export const MORE_TEMPLATES: TemplateDef[] = [promoStudio, bundlePost, nowBooking, coachingPost, vrittaPost, eventPost, countdown, festival, caseStudy, seriesCover, founderNote, buildLog];

