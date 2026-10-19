/**
 * Pieces the client, release and partner papers share: tidy text from a box, the other side's introduction and
 * signature, and the law-and-disputes clause.
 */
import { b, brand, fill, line, or, partySign, val } from "../text";
import type { DocContext, SignBlock, SignField } from "../types";

/** What was typed in a box without the full stop some people end with, or a line to write on. */
export const tidy = (ctx: DocContext, key: string, mm = 60) => val(ctx, key).replace(/[\s.;,:]+$/, "") || line(mm);

/** A box filled in one point per line, as the points (without the full stop some people end with). */
export const points = (ctx: DocContext, key: string) =>
  val(ctx, key)
    .split("\n")
    .map((s) => s.trim().replace(/^[•\-*]\s*/, "").replace(/[\s.;,:]+$/, ""))
    .filter(Boolean);

/** The points of a box as items, or three lines to write on when the box is empty. */
export const pointsOrLines = (ctx: DocContext, key: string, n = 3) => {
  const all = points(ctx, key).map((s) => `${s}.`);
  return all.length ? all : Array.from({ length: n }, () => line(150));
};

/** The other side as an agreement names it: the name (and `after` it, such as a GSTIN), where it is, and who signs for it. */
export function partyIntro(ctx: DocContext, after = "") {
  const p = ctx.party;
  const where = p.address.replace(/\s*\n\s*/g, ", ") || p.city;
  const signer = p.person ? `${p.person}${p.role ? `, ${p.role}` : ""}` : ctx.blank ? line(60) : "";
  return `${b(or(p.name, 60))}${after}, of ${or(where, 80)}${signer ? `, represented by ${signer}` : ""}`;
}

/** "Hello Lakshmi" for a message. A name that starts with a title or an initial is used whole. */
export function hello(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "Hello";
  return `Hello ${/^(dr|prof|mr|mrs|ms|shri|sri|smt)\.?$/i.test(words[0]) || /^[A-Za-z]{1,2}\.?$/.test(words[0]) ? words.join(" ") : words[0]}`;
}

/** Text from a box in the middle of a sentence: a capital first letter is made small, unless the word is in capitals. */
export const midSentence = (text: string) => (/^[A-Z][a-z]/.test(text) ? text.charAt(0).toLowerCase() + text.slice(1) : text);

/** The other side's signature: who signs for it, a line for the designation when HQ does not have one, and a seal for a firm. */
export function otherSign(ctx: DocContext, heading: string, seal: boolean): SignBlock {
  const p = ctx.party;
  return partySign(ctx, heading, { seal, lines: p.person && !p.role ? ["Designation", "Date"] : ["Date"] });
}

/** Governing law and how a dispute is settled. `subject` is "This Agreement is", "These Terms are". */
export const lawAndDisputes = (ctx: DocContext, subject: string) =>
  `${subject} governed by the laws of India. The parties first try to settle a dispute by discussion. A dispute that is not settled within 30 days goes to a sole arbitrator under the Arbitration and Conciliation Act, 1996, with the seat at ${fill(ctx, "seat", 30)} and in English; the courts at ${fill(ctx, "seat", 30)} have jurisdiction over matters outside the arbitration.`;

export const SEAT: SignField = { key: "seat", label: "Arbitration and courts at", kind: "text", from: "company.city", default: "Gadag", half: true, help: "Your advocate confirms this choice." };

/** The open point on the seat and stamp duty, the same in every agreement. */
export const SEAT_NOTE =
  "Stamp duty in Karnataka, and the seat of arbitration and courts in the box. A court can usually be chosen only among courts that already have jurisdiction, such as where a party is or where the work is done; an arbitration seat can be chosen more freely. Confirm the choice.";

/** GST as the papers word it (no full stop). */
export const gstLine = (ctx: DocContext) => (ctx.company.gstin ? "GST at the rate in force is added to every invoice" : `GST is added at the rate in force once ${brand(ctx)} is registered for GST`);
