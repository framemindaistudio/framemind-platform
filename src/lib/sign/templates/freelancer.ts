/**
 * The Freelancer Agreement: a designer, developer, editor, photographer, videographer or coach who works with the
 * studio project by project. Confidentiality, ownership of the work (assigned to the studio so it can pass full
 * ownership to the client), and portfolio use are built in, so a freelancer needs no separate NDA.
 */
import { b, brand, companyIntro, docDate, fill, money, or, partySign, plain, studioSign, val } from "../text";
import type { SignTemplate } from "../types";
import { hello, lawAndDisputes, SEAT, SEAT_NOTE } from "./shared";

export const freelancerAgreement: SignTemplate = {
  id: "freelancer-agreement",
  version: "1.0",
  title: "Freelancer Agreement",
  name: "Freelancer agreement",
  group: "joining",
  kind: "agreement",
  parties: ["team", "vendor"],
  signs: "both",
  blurb: "A freelancer works with the studio one assignment at a time: how work is offered, fees, deadlines and revisions, confidentiality, ownership of the work, client relationships and portfolio use.",
  when: "Before the first assignment",
  series: "HR",
  source: "14_LEGAL/03_Team_NDA_and_IP.md",
  keep: "Engagement + 8 years",
  initials: true,
  requiredFor: ["Freelance"],
  marksAgreement: true,
  lawyer: [
    "Independent contractor, not an employee: check the clauses against how freelancers actually work (control, hours, tools).",
    "TDS under section 194J or 194C on fees, by the CA's advice.",
    "Non-solicitation of clients (12 months) is a usual figure; restraints are hard to enforce under section 27 of the Indian Contract Act — it is limited to clients introduced by the studio.",
    SEAT_NOTE,
  ],
  fields: [
    { key: "role", label: "Kind of work", kind: "text", from: "member.role", required: true, placeholder: "Video editing and colour grading" },
    { key: "rate", label: "Usual rate (optional)", kind: "money", from: "member.unitRate", half: true, help: "Each assignment confirms its own fee." },
    { key: "rateUnit", label: "Per", kind: "select", default: "deliverable", half: true, options: ["day", "deliverable", "session", "hour", "project"].map((x) => ({ value: x, label: x })) },
    { key: "paymentDays", label: "Paid within (days of an approved invoice)", kind: "number", default: "15", half: true },
    { key: "nonSolicitMonths", label: "No direct work for studio clients (months)", kind: "number", default: "12", half: true },
    SEAT,
  ],
  build(ctx) {
    const J = brand(ctx);
    const p = ctx.party;
    return [
      { t: "title", text: "Freelancer Agreement" },
      { t: "p", text: `This Agreement is made on ${b(docDate(ctx))} between ${companyIntro(ctx)} ("${b(J)}"), and ${b(or(p.name, 60))}, of ${or(p.address.replace(/\n/g, ", ") || p.city, 80)} (the "${b("Freelancer")}"), for ${b(fill(ctx, "role", 60))}.` },
      {
        t: "clause",
        title: "How work is offered",
        items: [
          `${J} offers work one assignment at a time, in writing (a message or an email is enough) with the brief, the deliverables, the deadline and the fee. The Freelancer may accept or decline each one; an accepted assignment is a commitment.`,
          "The Freelancer is an independent contractor, uses their own judgement and tools, and is responsible for their own taxes. Nothing here makes the Freelancer an employee, partner or agent of the studio.",
        ],
      },
      {
        t: "clause",
        title: "Fees",
        items: [
          `${val(ctx, "rate") || ctx.blank ? `The usual rate is ${money(ctx, "rate")} per ${fill(ctx, "rateUnit", 15)}; each assignment confirms its own fee. ` : "Each assignment confirms its own fee. "}The Freelancer invoices on delivery, and ${J} pays within ${fill(ctx, "paymentDays", 10)} days of approving the invoice, less any tax the law requires it to deduct.`,
          "Expenses are paid only when agreed in advance, against receipts.",
        ],
      },
      {
        t: "clause",
        title: "Quality, deadlines and revisions",
        items: [
          `The Freelancer delivers to the brief and the studio's standards, on time, and makes the revisions within the rounds the client is entitled to at no extra fee. A delay is flagged to ${J} the moment it is seen.`,
          "Only licensed fonts, music, images, footage, code and plugins are used, and their licences are recorded. AI tools may be used, but the Freelancer checks and stands behind everything delivered.",
        ],
      },
      {
        t: "clause",
        title: "Confidentiality and client access",
        items: [
          `The Freelancer keeps confidential everything learnt about ${J} and its clients — unreleased work, files, code, logins, prices and personal data — uses it only for the assignment, and deletes it when the assignment ends. This continues for 3 years after the last assignment, and without limit of time for personal data and client secrets.`,
          "Client systems are used only through access granted to the Freelancer, never shared, and never by asking a client for a password. Client material is not put into a public AI tool without the client's permission.",
        ],
      },
      {
        t: "clause",
        title: "Ownership of the work",
        items: [
          `On payment, the Freelancer assigns to ${J} all rights in the work made for an assignment, with its source files, for every country and the full term of each right, so that ${J} can pass full ownership to its client. The Freelancer keeps their own pre-existing tools and know-how and licenses ${J} to use any that are part of the work.`,
          `The Freelancer may show the work in a personal portfolio once it is public and only if ${J} confirms the client allows it.`,
        ],
      },
      {
        t: "clause",
        title: "Studio clients",
        items: [`The Freelancer deals with the client only as ${J} directs, and for ${fill(ctx, "nonSolicitMonths", 10)} months after the last assignment does not offer the same services directly to a client the studio introduced. This does not stop the Freelancer from working with anyone else.`],
      },
      {
        t: "clause",
        title: "Ending",
        items: ["Either party may end this Agreement by written notice. Assignments already accepted are finished and paid for unless both agree otherwise. Confidentiality and ownership continue after the end."],
      },
      { t: "clause", title: "Law and disputes", items: [lawAndDisputes(ctx, "This Agreement is")] },
      { t: "sign", blocks: [...studioSign(ctx), partySign(ctx, "The Freelancer", { lines: ["Date"] })] },
    ];
  },
  cover(ctx) {
    return plain(`${hello(ctx.party.name)}, looking forward to working together! Attached is our Freelancer Agreement — how assignments, fees, confidentiality and ownership of the work go. Please sign, initial the pages and send back a scan before your first assignment.`);
  },
};
