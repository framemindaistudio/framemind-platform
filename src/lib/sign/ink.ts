/**
 * The founders' saved signatures ("ink"): a picture of each founder's signature, kept once in the File Vault
 * (vault/signatures/<founder id>.png, founders only) and printed above their name on the papers that ask for it.
 *
 * A paper with `ink` on carries the founders' signatures when it is printed or sent, so they do not sign by hand and
 * "Signed by FrameMind" is ticked at the same moment. It is a picture of a signature, not a Digital Signature Certificate:
 * fine for letters and forms; for agreements an advocate may prefer signatures by hand or Aadhaar eSign, which is
 * why agreements start with it off. Pure functions only.
 */
import { FOUNDERS, type SignDoc } from "./context";
import type { SignTemplate } from "./types";

export const INK_FOLDER = "vault/signatures";
export const inkPath = (founderId: string) => `${INK_FOLDER}/${founderId}.png`;
/** the largest picture kept: a signature never needs more */
export const MAX_INK_BYTES = 400 * 1024;

/** name as printed → picture (a data: address) */
export type Inks = Record<string, string>;

export const founderOfName = (name: string) => FOUNDERS.find((f) => f.name.toLowerCase() === name.trim().toLowerCase());

/** Whether this paper carries the saved signatures: as set on it, else on for everything but agreements. */
export function wantsInk(doc: Pick<SignDoc, "ink">, template: Pick<SignTemplate, "kind" | "signs">) {
  if (template.signs === "party") return false;
  return typeof doc.ink === "boolean" ? doc.ink : template.kind !== "agreement";
}

/** Every studio signatory on the paper has a saved signature. */
export function inkReady(doc: Pick<SignDoc, "signatories">, inks: Inks) {
  const list = doc.signatories ?? [];
  return list.length > 0 && list.every((s) => !!inks[s.name]);
}

/** The pictures to print on this paper, or nothing when it is not to carry them (or one is missing). */
export function inksFor(doc: Pick<SignDoc, "ink" | "signatories">, template: Pick<SignTemplate, "kind" | "signs">, inks: Inks): Inks | undefined {
  if (!wantsInk(doc, template) || !inkReady(doc, inks)) return undefined;
  return Object.fromEntries((doc.signatories ?? []).map((s) => [s.name, inks[s.name]]));
}

/** Printed or sent with the saved signatures: the studio's side counts as signed, on the day it went out. */
export function withInkTick<T extends SignDoc>(doc: T, template: Pick<SignTemplate, "kind" | "signs">, inks: Inks, today: string): T {
  if (!inksFor(doc, template, inks) || doc.studioSigned === true) return doc;
  return { ...doc, studioSigned: true, studioSignedOn: doc.issuedOn || today };
}
