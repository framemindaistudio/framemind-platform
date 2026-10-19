/**
 * Small helpers the templates are written with: values and write-in lines, money in figures and in words, dates,
 * and the usual signature blocks. Pure functions, no clock: a document always prints the same way.
 */
import type { DocContext, SignBlock } from "./types";

/* ───────────────────────────── values and write-in lines ───────────────────────────── */

/** A line to write on by hand, `mm` millimetres long. In text it travels as a small mark the paper turns into a rule. */
export const line = (mm = 40) => `⟦${Math.max(8, Math.round(mm))}⟧`;
export const LINE_MARK = /⟦(\d+)⟧/g;

/** What was typed in a box, trimmed. */
export const val = (ctx: DocContext, key: string) => (ctx.v[key] ?? "").trim();
/** The value of a box, or a line to write on when it is empty. */
export const fill = (ctx: DocContext, key: string, mm = 40) => val(ctx, key) || line(mm);
/** Any text, or a line to write on when it is empty. */
export const or = (text: string | undefined | null, mm = 40) => (text ?? "").trim() || line(mm);
/** A number typed in a box, or null. */
export function num(ctx: DocContext, key: string): number | null {
  const raw = val(ctx, key).replace(/[,₹\s]/g, "");
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

export const b = (text: string) => `**${text}**`;

/** Text as it reads without the marks: for a message, a file name, a search. */
export const plain = (text: string) => text.replace(LINE_MARK, "________").replace(/\*\*/g, "");

export const firstName = (name: string) => name.trim().split(/\s+/)[0] ?? "";

/** "a, b and c" */
export function listAnd(items: string[]) {
  const all = items.filter(Boolean);
  if (all.length <= 1) return all[0] ?? "";
  return `${all.slice(0, -1).join(", ")} and ${all[all.length - 1]}`;
}

/* ───────────────────────────── money ───────────────────────────── */

/** ₹25,000 with Indian digit grouping */
export const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

const ONES = ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
const TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
const below100 = (n: number) => (n < 20 ? ONES[n] : `${TENS[Math.floor(n / 10)]}${n % 10 ? `-${ONES[n % 10]}` : ""}`);
const below1000 = (n: number) => [n >= 100 ? `${ONES[Math.floor(n / 100)]} hundred` : "", n % 100 ? below100(n % 100) : ""].filter(Boolean).join(" and ");

/** 125000 → "one lakh twenty-five thousand" (whole rupees, Indian system) */
export function inWords(amount: number): string {
  let n = Math.round(Math.abs(amount));
  if (n === 0) return "zero";
  const parts: string[] = [];
  const take = (unit: number, name: string) => {
    if (n >= unit) {
      parts.push(`${inWords(Math.floor(n / unit))} ${name}`);
      n %= unit;
    }
  };
  take(10_000_000, "crore");
  take(100_000, "lakh");
  take(1000, "thousand");
  if (n) parts.push(below1000(n));
  return parts.join(" ");
}

/** "₹25,000 (Rupees twenty-five thousand only)" */
export const inrWords = (n: number) => `${inr(n)} (Rupees ${inWords(n)} only)`;

/** The amount typed in a box as ₹25,000, or a line to write on. */
export function money(ctx: DocContext, key: string, mm = 28) {
  const n = num(ctx, key);
  return n === null ? `₹ ${line(mm)}` : inr(n);
}
/** The amount typed in a box in figures and words, or a line to write on. */
export function moneyWords(ctx: DocContext, key: string, mm = 28) {
  const n = num(ctx, key);
  return n === null ? `₹ ${line(mm)} (Rupees ${line(mm + 30)} only)` : inrWords(n);
}

/* ───────────────────────────── dates ───────────────────────────── */

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function parts(iso: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec((iso ?? "").trim());
  if (!m) return null;
  const y = Number(m[1]), mo = Number(m[2]), d = Number(m[3]);
  return mo >= 1 && mo <= 12 && d >= 1 && d <= 31 ? { y, mo, d } : null;
}

/** "2026-10-13" → "13 October 2026" ("" when it is not a date) */
export function plainDate(iso: string) {
  const p = parts(iso);
  return p ? `${p.d} ${MONTHS[p.mo - 1]} ${p.y}` : "";
}
/** The date typed in a box as "13 October 2026", or a line to write on. */
export const dateOf = (ctx: DocContext, key: string, mm = 32) => plainDate(val(ctx, key)) || line(mm);
/** The date of the document itself, or a line to write on. */
export const docDate = (ctx: DocContext, mm = 32) => plainDate(ctx.date) || line(mm);

/* ───────────────────────────── the company and the other side ───────────────────────────── */

/** "FrameMind": the short name the text uses after the first mention. */
export const brand = (ctx: DocContext) => ctx.company.brandName || "FrameMind";

/** The company's opening description in an agreement: legal name, address, and the tax numbers it has. */
export function companyIntro(ctx: DocContext) {
  const c = ctx.company;
  const ids = [c.pan && `PAN ${c.pan}`, c.gstin && `GSTIN ${c.gstin}`].filter(Boolean).join(", ");
  return `${b(c.legalName || brand(ctx))}, having its office at ${or(c.address, 70)}${ids ? `, ${ids}` : ""}`;
}

/** The founder (or founders) signing, as "Name, Title". */
export const signedBy = (ctx: DocContext) => listAnd(ctx.signatories.map((s) => `${s.name}, ${s.title}`)) || line(50);

/** The lines of a letter's addressee. A person: name and address. A client or a firm: who signs, the name, the address. */
export function addressee(ctx: DocContext): string[] {
  const p = ctx.party;
  const where = p.address ? p.address.split("\n").map((l) => l.trim()).filter(Boolean) : [p.city].filter(Boolean);
  if (p.kind === "team") return [or(p.name, 60), ...where];
  const who = p.person ? `${p.person}${p.role ? `, ${p.role}` : ""}` : p.role || "";
  return [who, or(p.name, 60), ...where].filter(Boolean);
}

/* ───────────────────────────── signature blocks ───────────────────────────── */

/** The studio's side: one block for each founder who signs, the name and title already printed. */
export function studioSign(ctx: DocContext, o: { heading?: string; lines?: string[] } = {}): SignBlock[] {
  const heading = o.heading ?? `For ${brand(ctx)}`;
  const list = ctx.signatories.length ? ctx.signatories : [{ name: "", title: "" }];
  return list.map((s) => ({ heading, name: s.name, title: s.title, lines: o.lines ?? ["Date"] }));
}

/** The other side: the person's name already printed, or a line when it is not known. A company or a firm adds its seal. */
export function partySign(ctx: DocContext, heading: string, o: { seal?: boolean; lines?: string[]; title?: string } = {}): SignBlock {
  const p = ctx.party;
  const person = p.kind === "team" ? p.name : p.person;
  return { heading, name: person, title: o.title ?? p.role, seal: o.seal ?? (p.kind === "client" || p.kind === "vendor"), lines: o.lines ?? ["Date"] };
}

/** A witness line: name and address written by hand. */
export const witness = (n: number): SignBlock => ({ heading: `Witness ${n}`, name: "", lines: ["Address"] });
