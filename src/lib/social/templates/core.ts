/**
 * The designs of Social Studio, part 1: the project launch, hiring, milestone, photo post, service spotlight,
 * quote, "Learn with FrameMind" list, video thumbnail, photo collage and the carousel.
 *
 * A design is a list of boxes to fill in, a layout from layouts.ts, and a caption in the house structure.
 * Nothing here invents a fact: numbers, names and quotes are what the person types, and service prices are read
 * from the published rate card.
 */
import { SERVICES } from "@/lib/content/catalog";
import { setForService, startingPrice } from "../bank";
import { collage, figure, list, photo, point, poster, quote, thumb } from "../layouts";
import type { FieldSpec, TemplateDef, Values } from "../types";
import { CTAS, WATCH, bareSite, caption, choice, dotDate, hashtags, linesOf, longDate, rupees, shortDate, splitLine, val } from "../words";

const picture = (key: string, label: string, help?: string): FieldSpec => ({ key, label, kind: "image", help });

/* ───────────────────────────── project launch ───────────────────────────── */

const STAGES: Record<string, { label: string; tag: string; eyebrow: string; sub: string }> = {
  live: { label: "Now live", tag: "Now live · Launch", eyebrow: "Now live", sub: "Scoped, designed, built and handed over, source files and all." },
  soon: { label: "Coming soon", tag: "Coming soon · Launch", eyebrow: "Launching soon", sub: "In the last round of testing. Going live shortly." },
  thanks: { label: "Thank you", tag: "Handover · Thank you", eyebrow: "Thank you", sub: "For trusting us with it. Now we stay to support it." },
};

const launch: TemplateDef = {
  id: "launch",
  name: "Project launch",
  group: "Announcements",
  blurb: "Client work that is live, about to go live, or handed over. Only with the client's written approval.",
  formats: ["post", "square", "story", "wide"],
  tones: ["paper", "graphite", "photo"],
  fields: [
    { key: "stage", label: "What is the post saying?", kind: "select", options: Object.entries(STAGES).map(([value, s]) => ({ value, label: s.label })) },
    { key: "client", label: "Client", kind: "text", placeholder: "The client's name, as they write it", help: "Name a client only after they have approved the post.", max: 48 },
    { key: "work", label: "What we made", kind: "text", placeholder: "Website and booking system", max: 48 },
    { key: "service", label: "Service", kind: "select", options: SERVICES.map((s) => ({ value: s.id, label: s.name })) },
    { key: "date", label: "Date", kind: "date" },
    { key: "line", label: "One line (optional)", kind: "textarea", rows: 2, placeholder: "Leave empty for the standard line", max: 150 },
    picture("picture", "Picture (optional)", "A screen, a frame or a photo of the work. With the Photo look it fills the frame."),
  ],
  sample: { stage: "live", client: "Client name", work: "Website and booking system", service: "websites", date: "", line: "" },
  draw(p, { values: v, pictures, facts }) {
    const stage = choice(STAGES, val(v, "stage")) ?? STAGES.live;
    const date = val(v, "date");
    const base = { tag: stage.tag, index: dotDate(date), foot: bareSite(facts.website) };
    const sub = val(v, "line") || stage.sub;
    const client = val(v, "client") || "Client name";
    const service = SERVICES.find((s) => s.id === val(v, "service"));
    if (p.tone === "photo") {
      photo(p, { ...base, headline: client, sub: `${val(v, "work") || stage.eyebrow}. ${sub}`, chips: [service?.name ?? "", longDate(date)], picture: pictures.picture });
      return;
    }
    poster(p, {
      ...base,
      eyebrow: stage.eyebrow,
      headline: client,
      sub: [val(v, "work"), sub].filter(Boolean).join(". "),
      picture: pictures.picture,
      facts: [
        { label: "Service", value: service?.name ?? "" },
        { label: "Date", value: longDate(date) },
      ],
      cta: val(v, "stage") === "live" ? "Start your project" : undefined,
    });
  },
  caption(v) {
    const client = val(v, "client") || "[Client]";
    const work = val(v, "work") || "[what we made]";
    const tags = hashtags(setForService(val(v, "service")), "india");
    if (val(v, "stage") === "soon") return caption({ hook: `Almost ready: ${work} for ${client}.`, body: ["In the last round of testing now.", val(v, "line")], credit: true, cta: CTAS.follow, tags });
    if (val(v, "stage") === "thanks") return caption({ hook: `Thank you, ${client}.`, body: [`${work}, handed over with the source files and a walkthrough.`, "Now we stay to support it."], credit: true, cta: CTAS.book, tags });
    return caption({ hook: `Now live for ${client}: ${work}.`, body: [val(v, "line") || "Scoped, designed, built and handed over, source files and all."], credit: true, cta: CTAS.book, tags });
  },
};

/* ───────────────────────────── hiring ───────────────────────────── */

const ROLES: Record<string, { label: string; line: string }> = {
  designer: { label: "UI / Brand Designer", line: "Design websites, identities and product screens for real clients, from first sketch to handover." },
  developer: { label: "Full-stack Developer", line: "Build websites, web apps and automations with a small team that ships every week." },
  editor: { label: "Video Editor", line: "Cut brand films, reels and event videos, and grade them, for real clients." },
  photographer: { label: "Photographer (freelance)", line: "Shoot products, brands and events with the studio's crew, on a day rate." },
  social: { label: "Social Media Executive", line: "Plan, write and publish for client accounts, and learn what actually works." },
  intern: { label: "Intern", line: "Learn the craft on live client projects, with a founder reviewing your work." },
  other: { label: "Another role (type it below)", line: "Help a founder-led studio ship what its clients need." },
};

/** The QR code opens what is typed in the box, else an email to the studio. */
function applyLink(v: Record<string, string>, email: string) {
  const typed = val(v, "link");
  if (!typed) return email ? `mailto:${email}?subject=Application` : "";
  if (/^mailto:/i.test(typed)) return typed;
  return /^https?:\/\//i.test(typed) ? typed : `https://${typed}`;
}
/** "https://www.example.com/jobs" → "example.com/jobs", "mailto:a@b.c?…" → "a@b.c" */
const shown = (url: string) => url.replace(/^mailto:/i, "").replace(/\?.*$/, "").replace(/^https?:\/\//i, "").replace(/^www\./i, "").replace(/\/+$/, "");

const hiring: TemplateDef = {
  id: "hiring",
  name: "We are hiring",
  group: "Hiring",
  blurb: "One open role: what it is, where, and how to apply.",
  formats: ["post", "square", "story", "wide"],
  tones: ["paper", "graphite"],
  fields: [
    { key: "role", label: "Role", kind: "select", options: Object.entries(ROLES).map(([value, r]) => ({ value, label: r.label })) },
    { key: "title", label: "Role name (only for another role)", kind: "text", placeholder: "Operations Intern", max: 40 },
    { key: "kind", label: "Type", kind: "select", options: ["Full-time", "Part-time", "Freelance", "Internship"].map((value) => ({ value, label: value })) },
    { key: "place", label: "Where", kind: "text", placeholder: "Gadag, or remote", max: 30 },
    { key: "by", label: "Apply by", kind: "date" },
    { key: "line", label: "About the role (optional)", kind: "textarea", rows: 2, placeholder: "Leave empty for the standard line", max: 150 },
    { key: "points", label: "What we look for (one per line, up to 3)", kind: "textarea", rows: 3, max: 70 },
    { key: "apply", label: "How to apply (optional)", kind: "text", placeholder: "Leave empty for the studio email", max: 44 },
    { key: "link", label: "QR code opens", kind: "text", placeholder: "A form link, or leave empty for an email to the studio", max: 80 },
  ],
  sample: { role: "designer", title: "", kind: "Full-time", place: "Gadag, Karnataka", by: "", line: "", points: "A portfolio of real work, even small\nFigma, and an eye for type\nKannada or English, clearly", apply: "" },
  draw(p, { values: v, facts }) {
    const role = choice(ROLES, val(v, "role")) ?? ROLES.designer;
    const title = val(v, "role") === "other" ? val(v, "title") || "Role name" : role.label;
    const link = applyLink(v, facts.email);
    const apply = val(v, "apply");
    poster(p, {
      tag: "We are hiring",
      index: val(v, "kind"),
      foot: bareSite(facts.website),
      eyebrow: "Open role",
      headline: title,
      sub: val(v, "line") || role.line,
      bullets: linesOf(v, "points").slice(0, 3),
      facts: [
        { label: "Type", value: val(v, "kind") },
        { label: "Where", value: val(v, "place") },
        { label: "Apply by", value: shortDate(val(v, "by")) },
      ],
      cta: apply ? `Apply: ${apply}` : "Apply now",
      qr: link ? { url: link, note: `Scan, or write to ${shown(link)}` } : undefined,
    });
  },
  caption(v, facts) {
    const role = choice(ROLES, val(v, "role")) ?? ROLES.designer;
    const title = val(v, "role") === "other" ? val(v, "title") || "[role]" : role.label;
    const apply = val(v, "apply") || shown(applyLink(v, facts.email)) || "[how to apply]";
    const by = shortDate(val(v, "by"));
    return caption({
      hook: `We are hiring: ${title}.`,
      body: [val(v, "line") || role.line, [val(v, "kind"), val(v, "place")].filter(Boolean).join(" · "), ...linesOf(v, "points").slice(0, 3).map((l) => `· ${l}`)],
      cta: `To apply: ${apply}${by ? ` by ${by}` : ""}.`,
      tags: hashtags("hiring", "india"),
    });
  },
};

/* ───────────────────────────── milestone ───────────────────────────── */

const milestone: TemplateDef = {
  id: "milestone",
  name: "Milestone",
  group: "Milestones",
  blurb: "One real number and what it means.",
  formats: ["post", "square", "story", "wide"],
  tones: ["paper", "graphite"],
  fields: [
    { key: "figure", label: "The number", kind: "text", placeholder: "10", help: "Only a number that is true today. We never round up or borrow someone else's.", max: 7 },
    { key: "unit", label: "What it counts", kind: "text", placeholder: "projects shipped", max: 22 },
    { key: "label", label: "Headline", kind: "text", placeholder: "Ten projects, all still running", max: 56 },
    { key: "line", label: "One line (optional)", kind: "textarea", rows: 2, max: 140 },
    { key: "date", label: "As of (date)", kind: "date" },
  ],
  // nothing is filled in for you: a milestone that opens with a number in it would be a claim nobody made
  sample: { figure: "", unit: "", label: "", line: "", date: "" },
  draw(p, { values: v, facts }) {
    const empty = !val(v, "figure") && !val(v, "unit") && !val(v, "label");
    figure(p, { tag: "Milestone", index: dotDate(val(v, "date")), foot: bareSite(facts.website), figure: val(v, "figure") || "00", unit: val(v, "unit") || (empty ? "What it counts" : ""), label: val(v, "label") || "Your headline", sub: val(v, "line") });
  },
  caption(v) {
    const count = [val(v, "figure"), val(v, "unit")].filter(Boolean).join(" ");
    const asOf = shortDate(val(v, "date"));
    return caption({ hook: val(v, "label") || count || "[Headline]", body: [val(v, "line"), count && `${count}${asOf ? `, as of ${asOf}` : ""}.`], cta: CTAS.follow, tags: hashtags("founders", "india") });
  },
};

/* ───────────────────────────── photo post ───────────────────────────── */

const MOMENTS: Record<string, string> = {
  shoot: "On the shoot",
  desk: "At the desk",
  work: "Client work",
  team: "The team",
  event: "Event",
};

const moment: TemplateDef = {
  id: "photo-post",
  name: "Photo post",
  group: "Behind the scenes",
  blurb: "A photo or a frame from a video, with a headline on it.",
  formats: ["post", "square", "story", "wide"],
  tones: ["photo"],
  fields: [
    picture("picture", "Photo, or a video to take a frame from", "Client work only with the client's approval; people only with their consent."),
    { key: "kind", label: "What it shows", kind: "select", options: Object.entries(MOMENTS).map(([value, label]) => ({ value, label })) },
    { key: "headline", label: "Headline (up to 8 words)", kind: "text", placeholder: "Day two of the product shoot", max: 60 },
    { key: "line", label: "One line (optional)", kind: "textarea", rows: 2, max: 140 },
    { key: "date", label: "Date (optional)", kind: "date" },
    { key: "place", label: "Place (optional)", kind: "text", max: 28 },
  ],
  sample: { kind: "shoot", headline: "Day two of the product shoot", line: "", date: "", place: "" },
  draw(p, { values: v, pictures, facts }) {
    photo(p, { tag: choice(MOMENTS, val(v, "kind")) ?? MOMENTS.shoot, index: dotDate(val(v, "date")), foot: bareSite(facts.website), headline: val(v, "headline") || "Headline", sub: val(v, "line"), chips: [val(v, "place")], picture: pictures.picture });
  },
  caption(v) {
    const kind = val(v, "kind") || "shoot";
    return caption({ hook: val(v, "headline") || "[The moment, not the studio]", body: [val(v, "line"), [val(v, "place"), shortDate(val(v, "date"))].filter(Boolean).join(" · ")], credit: kind === "work", cta: kind === "work" ? CTAS.book : CTAS.follow, tags: kind === "team" ? hashtags("founders", "india") : hashtags("media", "india") });
  },
};

/* ───────────────────────────── service spotlight ───────────────────────────── */

const serviceOf = (v: Values) => SERVICES.find((s) => s.id === val(v, "service")) ?? SERVICES[0];

const servicePost: TemplateDef = {
  id: "service",
  name: "Service spotlight",
  group: "Services",
  blurb: "One service: what it is, what is always included and where the price starts. The price is read from the rate card.",
  formats: ["post", "square", "story", "wide"],
  tones: ["paper", "graphite"],
  fields: [
    { key: "service", label: "Service", kind: "select", options: SERVICES.map((s) => ({ value: s.id, label: s.name })) },
    { key: "line", label: "One line (optional)", kind: "textarea", rows: 2, placeholder: "Leave empty for the service's own line", max: 130 },
    { key: "price", label: "Show the starting price?", kind: "select", options: [{ value: "yes", label: "Yes" }, { value: "no", label: "No" }] },
    picture("picture", "A picture of the work (optional)"),
  ],
  sample: { service: "websites", line: "", price: "yes" },
  draw(p, { values: v, pictures, facts }) {
    const s = serviceOf(v);
    const from = startingPrice(s.id);
    poster(p, {
      tag: "Services",
      index: s.short.toUpperCase(),
      foot: bareSite(facts.website),
      eyebrow: "What we build",
      headline: s.name,
      sub: val(v, "line") || s.description,
      bullets: s.included.slice(0, 3),
      picture: pictures.picture,
      facts: val(v, "price") !== "no" && from ? [{ label: "From", value: `${rupees(from)}${s.billing === "month" ? "/month" : ""} ex-GST` }] : [],
      cta: "Get a price",
    });
  },
  caption(v) {
    const s = serviceOf(v);
    const from = startingPrice(s.id);
    return caption({ hook: `${s.name}: ${s.short.replace(/ · /g, ", ").toLowerCase()}.`, body: [val(v, "line") || s.description, val(v, "price") !== "no" && from ? `From ${rupees(from)}${s.billing === "month" ? " a month" : ""}, ex-GST.` : ""], cta: CTAS.quote, tags: hashtags(setForService(s.id), "india") });
  },
};

/* ───────────────────────────── quote ───────────────────────────── */

const quoteCard: TemplateDef = {
  id: "quote",
  name: "Quote",
  group: "Words",
  blurb: "Someone's own words: a founder, a client, a learner. Only what was really said.",
  formats: ["post", "square", "story", "wide"],
  tones: ["paper", "graphite"],
  fields: [
    { key: "kind", label: "Whose words?", kind: "select", options: [{ value: "founder", label: "A founder" }, { value: "client", label: "A client (testimonial)" }, { value: "learner", label: "A coaching learner" }, { value: "team", label: "Someone on the team" }] },
    { key: "quote", label: "The words", kind: "textarea", rows: 4, help: "Exactly as said or written, and with the person's permission. Never write a testimonial for someone.", max: 260 },
    { key: "name", label: "Name", kind: "text", max: 40 },
    { key: "role", label: "Role and place", kind: "text", placeholder: "Founder, FrameMind AI Studio", max: 48 },
    picture("portrait", "Portrait (optional)"),
  ],
  // no words are filled in for you: a quote that opens ready-made is a quote nobody said
  sample: { kind: "founder", quote: "", name: "", role: "" },
  draw(p, { values: v, pictures, facts }) {
    const kind = val(v, "kind");
    const tag = kind === "client" || kind === "learner" ? "In their words" : kind === "team" ? "The team" : "Founders";
    quote(p, { tag, foot: bareSite(facts.website), quote: val(v, "quote") || "The words go here.", name: val(v, "name") || "Name", role: val(v, "role"), portrait: pictures.portrait });
  },
  caption(v) {
    const kind = val(v, "kind");
    const who = [val(v, "name"), val(v, "role")].filter(Boolean).join(", ");
    return caption({ hook: `“${val(v, "quote") || "[the words]"}”`, body: [who ? `${who}.` : ""], credit: kind === "client", cta: kind === "client" ? CTAS.book : kind === "learner" ? CTAS.learn : CTAS.follow, tags: kind === "learner" ? hashtags("coaching", "ai") : hashtags("founders", "india") });
  },
};

/* ───────────────────────────── learn with FrameMind ───────────────────────────── */

const LEARN_CTAS = ["Save this for later", "Start learning AI 1:1", "Book a discovery call"];

const learn: TemplateDef = {
  id: "learn",
  name: "Learn with FrameMind",
  group: "Words",
  blurb: "A mini-lesson on one slide: a title and three to five numbered points.",
  formats: ["post", "square", "story", "wide"],
  tones: ["paper", "graphite"],
  fields: [
    { key: "title", label: "Title", kind: "text", placeholder: "Three automations every shop needs", max: 54 },
    { key: "points", label: "Points, one per line. Add a line about it after a | sign.", kind: "textarea", rows: 5, max: 90 },
    { key: "cta", label: "Call to action", kind: "select", options: [{ value: "", label: "None" }, ...LEARN_CTAS.map((value) => ({ value, label: value }))] },
  ],
  sample: { title: "Three automations every shop needs", points: "Enquiries | Every WhatsApp or form enquiry lands in one sheet.\nReminders | Follow-ups go out on their own, on time.\nInvoices | A paid order makes its own invoice.", cta: "Save this for later" },
  draw(p, { values: v, facts }) {
    list(p, { tag: "Learn with FrameMind", foot: bareSite(facts.website), eyebrow: "Mini-lesson", title: val(v, "title") || "Title", items: linesOf(v, "points").map(splitLine), cta: val(v, "cta") || undefined });
  },
  caption(v) {
    const items = linesOf(v, "points").map(splitLine);
    const cta = val(v, "cta");
    return caption({ hook: `${val(v, "title") || "[Title]"}: ${items.map((i) => i.title.toLowerCase()).join(", ")}.`, body: items.map((i, n) => `${n + 1}. ${i.title}${i.text ? `: ${i.text}` : ""}`), cta: /AI/.test(cta) ? CTAS.learn : /call/.test(cta) ? CTAS.book : CTAS.save, tags: hashtags("ai", "software") });
  },
};

/* ───────────────────────────── video thumbnail ───────────────────────────── */

const thumbnail: TemplateDef = {
  id: "thumbnail",
  name: "Video thumbnail",
  group: "Video",
  blurb: "YouTube thumbnail or Reel cover: a frame from the video and a few words. Two at most on YouTube.",
  formats: ["wide", "story", "post", "square"],
  tones: ["photo"],
  fields: [
    picture("picture", "Photo, or the video to take a frame from"),
    { key: "words", label: "Words (two on YouTube, up to six on a Reel cover)", kind: "text", placeholder: "Before / after", max: 30 },
    { key: "series", label: "Line above (optional)", kind: "text", placeholder: "Studio diaries", max: 30 },
    { key: "badge", label: "Corner note (optional)", kind: "text", placeholder: "EP 03", max: 8 },
  ],
  sample: { words: "Before / after", series: "Studio diaries", badge: "EP 01" },
  draw(p, { values: v, pictures }) {
    thumb(p, { words: val(v, "words") || "Two words", series: val(v, "series"), badge: val(v, "badge"), picture: pictures.picture });
  },
  caption(v) {
    return caption({ hook: `${val(v, "words") || "[Title]"}.`, body: [val(v, "series") ? `${val(v, "series")}${val(v, "badge") ? `, ${val(v, "badge")}` : ""}.` : ""], cta: WATCH, tags: hashtags("media", "founders") });
  },
};

/* ───────────────────────────── photo collage ───────────────────────────── */

const photos: TemplateDef = {
  id: "collage",
  name: "Photo collage",
  group: "Behind the scenes",
  blurb: "Two to four photos of one day or one project under a title.",
  formats: ["post", "square", "story", "wide"],
  tones: ["paper", "graphite"],
  fields: [
    { key: "title", label: "Title", kind: "text", placeholder: "Shoot day", max: 40 },
    { key: "line", label: "One line (optional)", kind: "textarea", rows: 2, max: 110 },
    { key: "date", label: "Date (optional)", kind: "date" },
    picture("a", "Photo 1"),
    picture("b", "Photo 2"),
    picture("c", "Photo 3 (optional)"),
    picture("d", "Photo 4 (optional)"),
  ],
  sample: { title: "Shoot day", line: "", date: "" },
  draw(p, { values: v, pictures, facts }) {
    const all = [pictures.a, pictures.b, pictures.c, pictures.d];
    const used = all.filter(Boolean).length;
    collage(p, { tag: "Behind the scenes", index: dotDate(val(v, "date")), foot: bareSite(facts.website), title: val(v, "title") || "Title", sub: val(v, "line"), pictures: used >= 2 ? all.filter(Boolean) : all.slice(0, 2) });
  },
  caption(v) {
    return caption({ hook: `${val(v, "title") || "[Title]"}.`, body: [val(v, "line"), shortDate(val(v, "date"))], cta: CTAS.follow, tags: hashtags("media", "founders") });
  },
};

/* ───────────────────────────── carousel ───────────────────────────── */

const slidesOf = (v: Values) => linesOf(v, "points").map(splitLine).slice(0, 8);
const CAROUSEL_CTAS = ["Book a discovery call", "Get a price for your project", "Start learning AI 1:1", "Save this for later", "Send this to a founder"];

const carousel: TemplateDef = {
  id: "carousel",
  name: "Carousel",
  group: "Words",
  blurb: "A hook, one point per slide, and a last slide that asks for one action. Downloads as a set.",
  formats: ["post", "square", "story"],
  tones: ["paper", "graphite"],
  fields: [
    { key: "tag", label: "Topic", kind: "select", options: ["Learn with FrameMind", "How we work", "Case study", "AI tips", "Founders"].map((value) => ({ value, label: value })) },
    { key: "hook", label: "First slide: the hook", kind: "text", placeholder: "How a website project runs, week by week", help: "A question or a surprising line.", max: 60 },
    { key: "line", label: "First slide: one line under it (optional)", kind: "textarea", rows: 2, max: 120 },
    { key: "points", label: "One slide per line (up to 8). Add the text after a | sign, 25 words at most.", kind: "textarea", rows: 6, max: 190 },
    { key: "cta", label: "Last slide: the one action", kind: "select", options: CAROUSEL_CTAS.map((value) => ({ value, label: value })) },
  ],
  sample: {
    tag: "How we work",
    hook: "How a project runs with us",
    line: "No vague retainers, no surprises.",
    points: "A 20-minute call | What you are building, and whether we are the right fit.\nAn honest scope | Scope, timeline and price, in writing, before any work.\nWe build | You see progress every week, not just at the end.\nShipped, then supported | Handover, training and follow-up.",
    cta: "Book a discovery call",
  },
  pages: (v) => slidesOf(v).length + 2,
  draw(p, { values: v, page, pages, facts }) {
    const slides = slidesOf(v);
    const cta = val(v, "cta") || CAROUSEL_CTAS[0];
    const base = { tag: val(v, "tag") || "FrameMind", index: `${String(page + 1).padStart(2, "0")} / ${String(pages).padStart(2, "0")}`, foot: bareSite(facts.website) };
    if (page === 0) poster(p, { ...base, eyebrow: "Swipe to read", headline: val(v, "hook") || "The hook", sub: val(v, "line"), dim: `${slides.length} ${slides.length === 1 ? "point" : "points"}` });
    else if (page <= slides.length) point(p, { ...base, number: String(page).padStart(2, "0"), title: slides[page - 1].title, text: slides[page - 1].text, more: true });
    else poster(p, { ...base, eyebrow: "Your turn", headline: cta, sub: /AI/.test(cta) ? "90 days, always 1:1, from zero." : /call|price/.test(cta) ? "Websites, brands, software, automations and media, priced in the open." : "", cta: /Save|Send/.test(cta) ? undefined : "Link in bio" });
  },
  caption(v) {
    const slides = slidesOf(v);
    const cta = val(v, "cta");
    return caption({ hook: val(v, "hook") || "[The hook]", body: [val(v, "line"), ...slides.map((s, n) => `${n + 1}. ${s.title}`)], credit: val(v, "tag") === "Case study", cta: /AI/.test(cta) ? CTAS.learn : /price/.test(cta) ? CTAS.quote : /Save/.test(cta) ? CTAS.save : /Send/.test(cta) ? CTAS.share : CTAS.book, tags: /AI/.test(val(v, "tag")) ? hashtags("ai", "software") : hashtags("web", "founders") });
  },
};

export const CORE_TEMPLATES: TemplateDef[] = [launch, hiring, milestone, moment, servicePost, quoteCard, learn, thumbnail, photos, carousel];
