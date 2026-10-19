/**
 * From HQ's records to a document: who the other side is, what the boxes start with, the reference number, and where
 * a document stands (draft, waiting for a signature, signed). Pure functions over plain records, shared by the screen
 * and the print view.
 */
import type { BaseRecord } from "@/lib/hq/collections";
import type { CompanySettings } from "@/lib/hq/settings";
import { site } from "@/lib/site";
import type { Company, DocContext, Party, PartyKind, Signatory, SignTemplate, Values } from "./types";

type Rec = Record<string, unknown>;
const str = (v: unknown) => (v === undefined || v === null ? "" : String(v)).trim();

/* ───────────────────────────── a document on record ───────────────────────────── */

/** The collection behind Documents to Sign. Only founders and admins can read or change it. */
export const SIGN_DOCS = "signDocs";

export interface SignDoc extends BaseRecord {
  /** "FM/HR/26-27/004" */
  ref?: string;
  /** template id */
  template?: string;
  /** the version of the wording it was made with */
  templateVersion?: string;
  /** "Offer letter · Asha Rao": what lists show */
  title?: string;
  partyKind?: PartyKind;
  partyId?: string;
  partyName?: string;
  /** the date printed on the paper */
  date?: string;
  /** draft: still being filled in · issued: printed or sent, the boxes are locked · void: withdrawn */
  status?: string;
  issuedOn?: string;
  /** sign and return by */
  dueBy?: string;
  partySigned?: boolean;
  partySignedOn?: string;
  studioSigned?: boolean;
  studioSignedOn?: string;
  /** the scan of the signed paper, a path in the File Vault */
  scan?: string;
  notes?: string;
  /* kept with the record but not part of the generic form */
  party?: Party;
  values?: Values;
  signatories?: Signatory[];
  /** the company's details as they stood when the paper was printed (null again once it is unlocked) */
  company?: Company | null;
  projectId?: string;
  proposalId?: string;
  /** the private link it was sent with (src/lib/sign/share.ts) */
  share?: unknown;
  /** signed copies they uploaded from the link, not yet checked (src/lib/sign/share.ts) */
  received?: unknown;
  /** print the founders' saved signatures on it (src/lib/sign/ink.ts); unset: on for all but agreements */
  ink?: boolean;
}

/* ───────────────────────────── the company and who signs for it ───────────────────────────── */

export function companyOf(s: Partial<CompanySettings>): Company {
  const address = [s.addressLine1, s.addressLine2, [s.city, s.state].filter(Boolean).join(", "), s.pincode].map(str).map((l) => l.replace(/,\s*$/, "")).filter(Boolean).join(", ");
  return {
    legalName: str(s.legalName),
    brandName: str(s.brandName) || "FrameMind",
    address,
    city: str(s.city),
    state: str(s.state),
    pincode: str(s.pincode),
    phone: str(s.phone) || site.contact.phone,
    email: str(s.email) || site.contact.email,
    website: str(s.website),
    gstin: str(s.gstin),
    pan: str(s.pan),
  };
}

/** The founders who can sign, as the website's profile names them. */
export const FOUNDERS: (Signatory & { id: string })[] = site.founders.map((f) => ({ id: f.id, name: f.name, title: f.role }));

/** "both", a founder's id, or nothing (the signatory named in Settings, else the first founder). */
export function signatoriesFor(choice: string, s: Partial<CompanySettings>): Signatory[] {
  if (choice === "both") return FOUNDERS.map(({ name, title }) => ({ name, title }));
  const picked = FOUNDERS.find((f) => f.id === choice);
  if (picked) return [{ name: picked.name, title: picked.title }];
  const named = str(s.signatoryName);
  const match = FOUNDERS.find((f) => f.name.toLowerCase() === named.toLowerCase());
  if (match) return [{ name: match.name, title: match.title }];
  return named ? [{ name: named, title: str(s.signatoryTitle) }] : [{ name: FOUNDERS[0].name, title: FOUNDERS[0].title }];
}

/** Which choice a saved list of signatories stands for, so the form shows the right option. */
export function signatoryChoice(list: Signatory[] | undefined): string {
  if (!list?.length) return "";
  if (list.length > 1) return "both";
  return FOUNDERS.find((f) => f.name === list[0].name)?.id ?? "";
}

/* ───────────────────────────── the other side ───────────────────────────── */

export const emptyParty = (kind: PartyKind): Party => ({ kind, name: "", address: "", phone: "", email: "", city: "", role: "", engagement: "", person: "" });

export function partyFromMember(m: Rec): Party {
  return { kind: "team", id: str(m.id), name: str(m.name), address: str(m.address), phone: str(m.phone), email: str(m.email), city: str(m.city), role: str(m.role), engagement: str(m.type), person: "" };
}
export function partyFromClient(s: Rec): Party {
  const street = str(s.address);
  const city = str(s.city);
  // the city goes on its own line unless the address already names it
  const address = [street, city && !street.toLowerCase().includes(city.toLowerCase()) ? city : ""].filter(Boolean).join("\n");
  return { kind: "client", id: str(s.id), name: str(s.name), address, phone: str(s.phone), email: str(s.email), city, role: str(s.contactRole), engagement: "", person: str(s.contactName) };
}
export function partyFromVendor(v: Rec): Party {
  return { kind: "vendor", id: str(v.id), name: str(v.name), address: str(v.city), phone: str(v.phone), email: str(v.email), city: str(v.city), role: "", engagement: "", person: str(v.contactName) };
}

/** Who a team document is required for: founders are their own group, everyone else goes by engagement. */
export function memberGroup(m: Rec): string {
  return /founder/i.test(str(m.role)) ? "Founder" : str(m.type) || "Freelance";
}

/* ───────────────────────────── what the boxes start with ───────────────────────────── */

export interface Sources {
  member?: Rec;
  client?: Rec;
  vendor?: Rec;
  project?: Rec;
  proposal?: Rec;
  company: Company;
  signatory?: Signatory;
}

/** "project.startDate|proposal.date": the first source that has something wins. */
function lookup(sources: Sources, from: string): string {
  for (const one of from.split("|")) {
    const [record, field] = one.trim().split(".");
    const src = (sources as unknown as Record<string, Rec | undefined>)[record];
    const v = src?.[field];
    if (v === undefined || v === null || v === false || v === "" || v === 0) continue;
    const text = Array.isArray(v) ? v.join(", ") : String(v).trim();
    if (text) return text;
  }
  return "";
}

/** The starting values of a new document: each box from its record, else its default. Zero money counts as nothing. */
export function prefill(template: SignTemplate, sources: Sources): Values {
  const out: Values = {};
  for (const f of template.fields) {
    let v = f.from ? lookup(sources, f.from) : "";
    if ((f.kind === "money" || f.kind === "number") && Number(v) === 0) v = "";
    out[f.key] = v || f.default || "";
  }
  return out;
}

/** The boxes a document still needs before it reads complete. */
export const missingFields = (template: SignTemplate, values: Values) => template.fields.filter((f) => f.required && !(values[f.key] ?? "").trim());

/* ───────────────────────────── reference numbers ───────────────────────────── */

/** "2026-27" → "26-27" */
const shortYear = (fy: string) => {
  const m = /(\d{2})(\d{2})\D+(\d{2})$/.exec(fy.trim());
  return m ? `${m[2]}-${m[3]}` : fy.trim();
};

/** The next number in a series for the financial year: FM/HR/26-27/004. */
export function nextRef(series: string, financialYear: string, docs: Pick<SignDoc, "ref">[]): string {
  const prefix = `FM/${series}/${shortYear(financialYear || "")}/`;
  let top = 0;
  for (const d of docs) {
    const ref = str(d.ref);
    if (ref.startsWith(prefix)) top = Math.max(top, Number(ref.slice(prefix.length)) || 0);
  }
  return `${prefix}${String(top + 1).padStart(3, "0")}`;
}

/* ───────────────────────────── where a document stands ───────────────────────────── */

export type Standing = "draft" | "waiting" | "signed" | "void";

export interface Progress {
  standing: Standing;
  /** whose signature is still missing */
  needsParty: boolean;
  needsStudio: boolean;
  /** "Waiting for Asha" */
  label: string;
}

export function progressOf(doc: SignDoc, template: SignTemplate | undefined): Progress {
  const signs = template?.signs ?? "both";
  const needsParty = signs !== "studio" && doc.partySigned !== true;
  const needsStudio = signs !== "party" && doc.studioSigned !== true;
  if (doc.status === "void") return { standing: "void", needsParty: false, needsStudio: false, label: "Withdrawn" };
  if (!needsParty && !needsStudio) return { standing: "signed", needsParty, needsStudio, label: "Signed" };
  if (doc.status !== "issued") return { standing: "draft", needsParty, needsStudio, label: "Draft" };
  const who = str(doc.party?.kind === "team" ? doc.partyName?.split(" ")[0] : doc.partyName) || "them";
  return { standing: "waiting", needsParty, needsStudio, label: needsParty && needsStudio ? "Waiting for both signatures" : needsParty ? `Waiting for ${who}` : "Waiting for FrameMind" };
}

/* ───────────────────────────── the context a template builds from ───────────────────────────── */

export function contextOf(doc: SignDoc, liveCompany: Company): DocContext {
  return {
    company: doc.company ?? liveCompany,
    party: { ...emptyParty(doc.partyKind ?? "other"), ...(doc.party ?? {}) },
    signatories: doc.signatories ?? [],
    date: str(doc.date),
    ref: str(doc.ref),
    v: doc.values ?? {},
    blank: false,
  };
}

/** A copy with nothing filled in, to print and complete by hand. The studio's own details and signatory are still printed. */
export function blankContext(template: SignTemplate, company: Company, signatories: Signatory[]): DocContext {
  const v: Values = {};
  // a blank keeps the standing terms (notice, years) and leaves everything about the person or the day open
  for (const f of template.fields) v[f.key] = f.default && !f.from ? f.default : "";
  return { company, party: emptyParty(template.parties[0] ?? "other"), signatories, date: "", ref: "", v, blank: true };
}

/** "FrameMind_Offer-letter_Asha-Rao_2026-10-13": the name the browser gives the saved PDF. */
export function fileNameOf(parts: (string | undefined)[]) {
  return parts
    .map((p) => str(p).replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-+|-+$/g, ""))
    .filter(Boolean)
    .join("_")
    .slice(0, 120);
}
