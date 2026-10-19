/**
 * Vendors and partners: the mutual NDA (before a partner, agency or supplier sees anything private) and the gear
 * rental terms (cameras, lenses, lights, drones hired for a shoot).
 * Where a point is open there is a box, and the open point is in the template's "lawyer" list.
 */
import { b, brand, companyIntro, dateOf, docDate, fill, moneyWords, plain, studioSign, val } from "../text";
import type { SignTemplate } from "../types";
import { hello, lawAndDisputes, midSentence, otherSign, partyIntro, pointsOrLines, SEAT, SEAT_NOTE, tidy } from "./shared";

/* ───────────────────────────── 1 · mutual NDA ───────────────────────────── */

export const mutualNda: SignTemplate = {
  id: "mutual-nda",
  version: "1.0",
  title: "Mutual Non-Disclosure Agreement",
  name: "Mutual NDA",
  group: "partners",
  kind: "agreement",
  parties: ["client", "vendor", "other"],
  signs: "both",
  blurb: "Both sides keep each other's information confidential while they discuss or do work together — for a client before the brief is shared, or a partner, agency or supplier.",
  when: "Before a product idea, files, prices, data or contacts are shared",
  series: "PTR",
  source: "14_LEGAL/04_Mutual_NDA.md",
  keep: "Engagement + 8 years",
  initials: true,
  lawyer: [
    "Three years of confidentiality is a usual figure: confirm it, and whether source code or trade secrets should be protected for longer.",
    "Usual NDAs also except information developed independently or received lawfully from someone else: both are included here.",
    "When the other side is a company or a trust, check that the person signing is authorised to sign for it.",
    `${SEAT_NOTE} Ask also whether the agreement should be on stamp paper.`,
  ],
  fields: [
    { key: "purpose", label: "What the two sides are discussing", kind: "text", required: true, placeholder: "A custom booking platform for the client's clinics", help: "One line. It sets what the shared information may be used for." },
    { key: "confidentialYears", label: "Confidentiality lasts (years after the end)", kind: "number", default: "3", half: true },
    SEAT,
  ],
  build(ctx) {
    const J = brand(ctx);
    const p = ctx.party;
    return [
      { t: "title", text: "Mutual Non-Disclosure Agreement" },
      { t: "p", text: `This Agreement is made on ${b(docDate(ctx))} between ${companyIntro(ctx)} ("${b(J)}"), and ${partyIntro(ctx)} (the "${b("Other Party")}").` },
      {
        t: "clause",
        title: "Purpose",
        items: [
          `The parties wish to discuss, and may later work together on, the following: ${b(tidy(ctx, "purpose", 120))} (the "Purpose").`,
          `To do this, each party may give the other information that is not public. The party that gives information is the "disclosing party", and the party that receives it is the "receiving party".`,
        ],
      },
      {
        t: "clause",
        title: "Confidential Information",
        items: [
          `"Confidential Information" means information about a party, its products or its business that is not public and that the other party receives for the Purpose, in any form: spoken, written, or as files, designs, code, data or samples.`,
          `For ${J} it includes its methods, templates, code, quotes and prices. For the Other Party it includes its product ideas, plans, designs, data, customers, prices and processes.`,
        ],
      },
      {
        t: "clause",
        title: "Keeping it confidential",
        items: [
          "The receiving party will keep Confidential Information secret, use it only for the Purpose, and copy it only as far as the Purpose needs.",
          "The receiving party may share it only with those of its own people and contractors who need it for the Purpose and who are bound to keep it secret, and is responsible for what they do with it.",
          "The receiving party will not put the disclosing party's Confidential Information into a public AI tool or any service that may use it to train a model, unless the disclosing party agrees in writing.",
          "The receiving party will return or delete Confidential Information when the disclosing party asks or when this Agreement ends, except a copy that the law requires it to keep.",
        ],
      },
      {
        t: "clause",
        title: "What is not covered",
        items: ["This Agreement does not cover information that is public through no fault of the receiving party, that the receiving party already lawfully knew, developed on its own without using the other's information, received lawfully from someone else, or that the law requires to be disclosed. Where the law allows, the receiving party tells the disclosing party before such a disclosure."],
      },
      {
        t: "clause",
        title: "Ownership and no commitment",
        items: [
          "Confidential Information remains the property of the disclosing party. This Agreement gives no licence or other right in it. Neither party uses the other's name or logo without written permission.",
          "This Agreement does not oblige either party to start a project or sign any further agreement, and does not make the parties partners or agents of each other.",
        ],
      },
      {
        t: "clause",
        title: "Term",
        items: [
          "This Agreement starts on the date above and continues until either party ends it by written notice to the other.",
          `For information received before the end, the duties in this Agreement continue for ${fill(ctx, "confidentialYears", 10)} years after the end, and without limit of time for personal data and for trade secrets that are still secret.`,
        ],
      },
      {
        t: "clause",
        title: "If something goes wrong",
        items: [
          "A party that learns that the other party's Confidential Information has been lost, leaked or misused tells the other party at once and helps to limit the harm.",
          "Each party accepts that money alone may not make good a breach of this Agreement, and that the other party may ask a court for an order to stop or prevent one.",
        ],
      },
      { t: "clause", title: "Law and disputes", items: [lawAndDisputes(ctx, "This Agreement is"), "This is the whole agreement between the parties on this subject. A change to it is made in writing and signed by both."] },
      { t: "p", text: "Signed by the parties on the date first written above." },
      { t: "sign", blocks: [...studioSign(ctx), otherSign(ctx, "For the Other Party", p.kind !== "other" || !!p.person)] },
    ];
  },
  cover(ctx) {
    const about = val(ctx, "purpose") ? ` about ${midSentence(tidy(ctx, "purpose"))}` : "";
    return plain(`${hello(ctx.party.person || ctx.party.name)}, before we share details${about}, we would like both sides to sign the attached Mutual Non-Disclosure Agreement. It protects your information in the same way as ours. Please sign and date the last page, initial the other pages and send us a clear scan. We will send back a copy signed by ${brand(ctx)}.`);
  },
};

/* ───────────────────────────── 2 · gear rental terms ───────────────────────────── */

export const gearRentalTerms: SignTemplate = {
  id: "gear-rental-terms",
  version: "1.0",
  title: "Equipment Rental Terms",
  name: "Gear rental",
  group: "partners",
  kind: "agreement",
  parties: ["vendor"],
  signs: "both",
  blurb: "Hiring cameras, lenses, lights, audio or a drone from a rental house for a shoot: the items, dates, rent, deposit, condition and damage.",
  when: "Before rented gear is picked up for a shoot",
  series: "PTR",
  source: "03_SOP/11_Vendors_Freelancers_and_Purchases.md",
  keep: "Term + 3 years",
  lawyer: [
    "Who insures the gear while it is with FrameMind, and up to what value: agree it with the rental house and write it in the box.",
    "Drone rental: the drone's registration and the pilot's remote pilot certificate under the Drone Rules, 2021 stay the owner's responsibility unless agreed otherwise.",
    SEAT_NOTE,
  ],
  fields: [
    { key: "items", label: "Items rented (one per line, with serial numbers)", kind: "textarea", required: true, placeholder: "Sony FX3 body, serial 1234567\n24-70mm f/2.8 GM lens, serial 7654321\n2 × LED panel with stands" },
    { key: "from", label: "Pick-up date", kind: "date", required: true, half: true },
    { key: "to", label: "Return date", kind: "date", required: true, half: true },
    { key: "rent", label: "Total rent (before GST)", kind: "money", required: true, half: true },
    { key: "deposit", label: "Security deposit (optional)", kind: "money", half: true },
    { key: "insurance", label: "Insurance while with FrameMind", kind: "text", default: "Covered by the owner's own insurance", half: true },
    SEAT,
  ],
  build(ctx) {
    const J = brand(ctx);
    return [
      { t: "title", text: "Equipment Rental Terms" },
      { t: "p", text: `These Terms are made on ${b(docDate(ctx))} between ${partyIntro(ctx)} (the "${b("Owner")}"), and ${companyIntro(ctx)} ("${b(J)}").` },
      { t: "clause", title: "The equipment", items: pointsOrLines(ctx, "items", 4) },
      {
        t: "clause",
        title: "Period and rent",
        items: [
          `${J} picks the equipment up on ${b(dateOf(ctx, "from"))} and returns it by ${b(dateOf(ctx, "to"))}.`,
          `The rent for the period is ${b(moneyWords(ctx, "rent"))}, before GST.${val(ctx, "deposit") || ctx.blank ? ` A security deposit of ${moneyWords(ctx, "deposit")} is paid at pick-up and refunded in full when the equipment comes back in the same condition.` : ""}`,
          "A late return is charged at the daily rate the Owner quoted, unless the Owner agreed to the extra days in writing.",
        ],
      },
      {
        t: "clause",
        title: "Condition and testing",
        items: [
          "The Owner hands the equipment over clean, charged and working, with its batteries, chargers and cases. Both sides check it at pick-up and note any existing marks or faults below.",
          `${J} uses the equipment with care, by trained people, and does not lend it to anyone else.`,
        ],
      },
      {
        t: "clause",
        title: "Loss and damage",
        items: [
          `Damage beyond ordinary wear, or loss, while the equipment is with ${J} is repaired or paid for at the reasonable repair cost or, for a total loss, its fair current value. Insurance: ${fill(ctx, "insurance", 60)}.`,
          "A fault the equipment already had, or a failure from ordinary use, is the Owner's to put right, and the rent for a day lost to it is not charged.",
        ],
      },
      { t: "clause", title: "Law and disputes", items: [lawAndDisputes(ctx, "These Terms are")] },
      { t: "fields", cols: 1, rows: [["Marks or faults noted at pick-up", ""]] },
      { t: "sign", blocks: [otherSign(ctx, "For the Owner", true), ...studioSign(ctx)] },
    ];
  },
  cover(ctx) {
    return plain(`${hello(ctx.party.person || ctx.party.name)}, attached are the rental terms for the equipment we are taking from ${dateOf(ctx, "from")} to ${dateOf(ctx, "to")}. Please check the list and serial numbers, sign, and we will countersign at pick-up.`);
  },
};

export const PARTNER_DOCS: SignTemplate[] = [mutualNda, gearRentalTerms];
