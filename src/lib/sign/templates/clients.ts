/**
 * What a client signs: the Client Services Agreement (the standing terms), a Statement of Work for each project, a
 * Change Request when the scope moves, the Project Acceptance and Handover at the end, the Testimonial Release, the
 * Vritta Licence Agreement for an institution, and the Coaching Enrolment for a 1:1 AI coaching learner.
 *
 * The commercial terms follow what the studio publishes on its pricing page: milestones (usually 50% to start and 50%
 * on delivery), 2 rounds of revisions per design stage, the client provides content and assets before work begins,
 * and at handover the client gets all source files and documentation — "you own everything we build". Vritta's
 * licensing follows the Vritta page (perpetual licence, data ownership, maintenance). Figures that are the founders'
 * choice are boxes; open points are in each template's "lawyer" list.
 */
import { COACHING, VRITTA } from "@/lib/content/catalog";
import { b, brand, companyIntro, dateOf, docDate, fill, firstName, line, money, moneyWords, num, or, partySign, plain, studioSign, val } from "../text";
import type { SignField, SignTemplate } from "../types";
import { gstLine, hello, lawAndDisputes, otherSign, partyIntro, points, pointsOrLines, SEAT, SEAT_NOTE, tidy } from "./shared";

const clientSign = (ctx: Parameters<SignTemplate["build"]>[0], heading = "For the Client") => otherSign(ctx, heading, ctx.party.kind === "client" && !!ctx.party.person);

const PROJECT: SignField = { key: "project", label: "Project", kind: "text", from: "project.title|proposal.title", required: true, placeholder: "Website and brand refresh" };
const QUOTE_NO: SignField = { key: "quoteNo", label: "Quote number", kind: "text", from: "proposal.number", half: true };
const QUOTE_DATE: SignField = { key: "quoteDate", label: "Quote date", kind: "date", from: "proposal.date", half: true };

/* ───────────────────────────── 1 · client services agreement ───────────────────────────── */

export const clientServicesAgreement: SignTemplate = {
  id: "client-services-agreement",
  version: "1.0",
  title: "Client Services Agreement",
  name: "Services agreement",
  group: "clients",
  kind: "agreement",
  parties: ["client"],
  signs: "both",
  blurb: "The standing terms for all work with a client: fees and milestones, revisions, the client's inputs, ownership of the work, confidentiality, liability and ending. Each project then has its own Statement of Work.",
  when: "Before the first project with a client (once; each project adds a Statement of Work)",
  series: "CLI",
  source: "14_LEGAL/02_Client_Services_Agreement.md",
  keep: "Term + 8 years",
  initials: true,
  requiredForClients: true,
  lawyer: [
    "Liability cap (clause 11): the fees paid under the Statement of Work in the 12 months before the claim is a usual figure — confirm it.",
    "Ownership passes on full payment (clause 8). Confirm the wording of the assignment under the Copyright Act, 1957, and how open-source components and AI-assisted work are described.",
    "Late payment: the agreement lets the studio pause work; it adds no interest. Decide whether to add interest under the MSMED Act, 2006 (Udyam-registered suppliers have a statutory right to interest on payments delayed past 45 days).",
    "International clients: confirm GST treatment of export of services (LUT) with the CA.",
    SEAT_NOTE,
  ],
  fields: [
    { key: "paymentDays", label: "Invoices are paid within (days)", kind: "number", default: "7", half: true },
    { key: "feedbackDays", label: "Client feedback within (working days)", kind: "number", default: "3", half: true, help: "How long the client takes to review a stage before the timeline moves." },
    { key: "revisions", label: "Revision rounds per design stage", kind: "number", default: "2", half: true },
    { key: "noticeDays", label: "Notice to end (days)", kind: "number", default: "15", half: true },
    { key: "portfolio", label: "Portfolio", kind: "select", default: "yes", half: true, options: [{ value: "yes", label: "Studio may show the work after launch" }, { value: "no", label: "Client asked: no portfolio use" }] },
    SEAT,
  ],
  build(ctx) {
    const J = brand(ctx);
    const portfolio = val(ctx, "portfolio") !== "no";
    return [
      { t: "title", text: "Client Services Agreement" },
      { t: "p", text: `This Agreement is made on ${b(docDate(ctx))} between ${companyIntro(ctx)} ("${b(J)}"), a design and software studio, and ${partyIntro(ctx)} (the "${b("Client")}").` },
      {
        t: "clause",
        title: "What this Agreement covers",
        items: [
          `${J} provides design, software, automation, photography, videography, social media and related services to the Client. The work for each project, its deliverables, timeline and price are set out in a Statement of Work (or an accepted quote) that refers to this Agreement.`,
          "Where a Statement of Work and this Agreement differ, the Statement of Work applies for that project.",
        ],
      },
      {
        t: "clause",
        title: "Fees and payment",
        items: [
          `The Client pays the fees in the Statement of Work in the milestones it sets — usually 50% to start the work and 50% on delivery. ${gstLine(ctx)}.`,
          `Invoices are paid within ${fill(ctx, "paymentDays", 10)} days by bank transfer or UPI; international clients may pay by bank transfer or Wise. Prices are in Indian rupees.`,
          `Work on a milestone starts once the payment due before it is received. If a payment is late, ${J} may pause the work, and the timeline moves by the time lost.`,
          "Costs charged by third parties — domains, hosting, paid plugins and fonts, stock media, app-store and payment-gateway fees, API usage, ad spend, travel and stay for outstation shoots — are paid by the Client, directly or at actual cost, unless the Statement of Work includes them.",
        ],
      },
      {
        t: "clause",
        title: "The Client's part",
        items: [
          "The Client provides the text, images, logos, brand assets, data and access the work needs before that work begins. Delays in providing them may move the timeline.",
          `The Client reviews each stage and gives consolidated feedback within ${fill(ctx, "feedbackDays", 10)} working days. Silence after that time lets ${J} move to the next stage.`,
          `The Client gives access to its accounts by inviting ${J} as a user or team member, not by sharing passwords, and confirms it has the right to every material it provides.`,
        ],
      },
      {
        t: "clause",
        title: "Revisions and changes",
        items: [
          `Each design stage includes ${fill(ctx, "revisions", 10)} rounds of revisions, and each video includes 2 rounds after the first cut, unless the Statement of Work says otherwise.`,
          `A change to the agreed scope — new pages or features, a new direction after sign-off, extra rounds — is agreed in a written Change Request with its cost and its effect on the timeline before ${J} does it.`,
        ],
      },
      {
        t: "clause",
        title: "Timeline",
        items: [`${J} agrees a timeline with the Client before work starts and keeps the Client updated on real progress. Dates move by any delay in the Client's inputs, feedback or payments, and by events outside either party's control.`],
      },
      {
        t: "clause",
        title: "Delivery and acceptance",
        items: [
          `${J} delivers each deliverable as the Statement of Work describes, tested on the devices and browsers it names. The Client accepts the delivery, or lists the faults against the agreed scope, within ${fill(ctx, "feedbackDays", 10)} working days.`,
          `${J} fixes faults against the agreed scope at no charge. The project ends with a handover: source files, documentation and a walkthrough call, recorded in a Project Acceptance and Handover.`,
        ],
      },
      {
        t: "clause",
        title: "Ownership of the work",
        items: [
          `When the Client has paid in full for a project, ${J} assigns to the Client all its rights in the deliverables made for that project — designs, code, copy, photographs, films and their source files — for every country and the full term of each right. Nothing is locked behind ${J}.`,
          `${J} keeps its own pre-existing tools, code libraries, templates and know-how, and gives the Client a permanent, royalty-free licence to use any of them that are part of a deliverable.`,
          "Fonts, stock media, music, plugins and open-source components remain under their own licences, which pass to the Client as they allow. AI-assisted work is reviewed by people and delivered on the same terms.",
          "Until full payment, the deliverables remain with the studio and the Client may not publish or use them.",
        ],
      },
      {
        t: "clause",
        title: "Portfolio",
        items: [
          portfolio
            ? `After the work is public, ${J} may show it, with the Client's name and logo, in its portfolio, case studies and social media, without revealing confidential information. The Client may withdraw this permission for future use at any time in writing.`
            : `${J} will not show the Client's work or name in its portfolio or social media without the Client's written permission.`,
        ],
      },
      {
        t: "clause",
        title: "Confidentiality and data",
        items: [
          "Each party keeps the other's confidential information secret, uses it only for the work, and returns or deletes it when the work ends. This lasts for 3 years after the last project, and without limit of time for personal data.",
          `Where ${J} handles personal data for the Client (for example, the Client's customers in a website, an app or an automation), it does so only on the Client's instructions, keeps it secure, does not use it for anything else, and tells the Client without delay of any breach it learns of.`,
        ],
      },
      {
        t: "clause",
        title: "Warranties and liability",
        items: [
          `${J} does the work with reasonable skill and care. It does not promise a particular business result, ranking, reach or revenue.`,
          `Neither party is liable for indirect or consequential loss, or for lost profits. ${J}'s total liability for a project is limited to the fees the Client paid for it in the 12 months before the claim.`,
        ],
      },
      {
        t: "clause",
        title: "Ending the work",
        items: [
          `Either party may end this Agreement, or a project, with ${fill(ctx, "noticeDays", 10)} days' written notice, or at once if the other commits a serious breach that it does not put right within 7 days of being told.`,
          `On ending, the Client pays for the work done and the costs committed up to that day, and ${J} hands over the work paid for.`,
        ],
      },
      { t: "clause", title: "Law and disputes", items: [lawAndDisputes(ctx, "This Agreement is"), "This Agreement, with its Statements of Work and Change Requests, is the whole agreement between the parties. A change to it is made in writing and signed by both."] },
      { t: "p", text: "Signed by the parties on the date first written above." },
      { t: "sign", blocks: [...studioSign(ctx), clientSign(ctx)] },
    ];
  },
  cover(ctx) {
    return plain(`${hello(ctx.party.person || ctx.party.name)}, attached is our Client Services Agreement — the standing terms for working together: milestones, revisions, what we need from you, and that you own everything we build once it is paid for. Please read it, sign and date the last page, initial the others and send us a scan. Happy to walk through any part of it on a call.`);
  },
};

/* ───────────────────────────── 2 · statement of work ───────────────────────────── */

export const statementOfWork: SignTemplate = {
  id: "statement-of-work",
  version: "1.0",
  title: "Statement of Work",
  name: "Statement of Work",
  group: "clients",
  kind: "agreement",
  parties: ["client"],
  signs: "both",
  blurb: "One project under the Client Services Agreement: what is delivered, the timeline, the price, the payment milestones, the revisions and the support period.",
  when: "When a quote is accepted, before the advance is invoiced",
  series: "CLI",
  source: "14_LEGAL/02_Client_Services_Agreement.md",
  keep: "Term + 8 years",
  initials: true,
  requiredForClients: true,
  lawyer: ["Where no Client Services Agreement is signed yet, the SOW says its terms apply: make sure the client has received it."],
  fields: [
    PROJECT,
    QUOTE_NO,
    QUOTE_DATE,
    { key: "deliverables", label: "Deliverables (one per line)", kind: "textarea", required: true, placeholder: "Custom website, 11–20 pages, on WordPress CMS\nLogo — 3 concepts, final in all formats\nBrand guidelines (10–15 pages)" },
    { key: "excluded", label: "Not included (optional, one per line)", kind: "textarea", placeholder: "Copywriting for the blog\nPaid ads" },
    { key: "start", label: "Start", kind: "date", from: "project.startDate", half: true },
    { key: "due", label: "Delivery date", kind: "date", from: "project.dueDate", half: true },
    { key: "fee", label: "Fee (before GST)", kind: "money", from: "project.agreedAmount|proposal.total", required: true, half: true },
    { key: "revisions", label: "Revision rounds", kind: "number", from: "proposal.revisionRounds", default: "2", half: true },
    { key: "milestones", label: "Payment milestones (one per line)", kind: "textarea", default: "50% — advance, to start the work\n50% — on delivery, before handover", help: "One line per milestone, as on the quote." },
    { key: "support", label: "Support after launch", kind: "text", placeholder: "3 months — bug fixes and minor adjustments", default: "As in the quote" },
    { key: "contact", label: "Client's contact for reviews", kind: "text", from: "client.contactName", half: true },
  ],
  build(ctx) {
    const J = brand(ctx);
    const excluded = points(ctx, "excluded");
    const ref = [val(ctx, "quoteNo") && `quote ${val(ctx, "quoteNo")}`, val(ctx, "quoteDate") && `dated ${dateOf(ctx, "quoteDate")}`].filter(Boolean).join(" ");
    return [
      { t: "title", text: "Statement of Work", sub: tidy(ctx, "project", 80) },
      { t: "p", text: `This Statement of Work is made on ${b(docDate(ctx))} between ${companyIntro(ctx)} ("${b(J)}") and ${partyIntro(ctx)} (the "${b("Client")}"), under the Client Services Agreement between them. ${ref ? `It follows ${ref}, which the Client accepted.` : ""}` },
      { t: "clause", title: "Deliverables", items: pointsOrLines(ctx, "deliverables", 4) },
      ...(excluded.length ? [{ t: "clause" as const, title: "Not included", items: excluded.map((x) => `${x}.`) }] : []),
      {
        t: "table",
        widths: [32, 68],
        rows: [
          ["Project", tidy(ctx, "project", 80)],
          ["Start", dateOf(ctx, "start")],
          ["Delivery", `${dateOf(ctx, "due")}, provided the Client's content and feedback arrive on time`],
          ["Fee", `${moneyWords(ctx, "fee")}, before GST`],
          ["Revisions", `${fill(ctx, "revisions", 10)} rounds per design stage (2 per video after the first cut)`],
          ["Support after launch", fill(ctx, "support", 70)],
          ["Client's contact", fill(ctx, "contact", 60)],
        ],
      },
      { t: "clause", title: "Payment milestones", items: [...pointsOrLines(ctx, "milestones", 2), `${gstLine(ctx)}. Each milestone is invoiced when it falls due.`] },
      { t: "clause", title: "Handover", items: [`On final payment ${J} hands over every source file, the documentation and a walkthrough call, and the Client owns the work as the Client Services Agreement sets out.`] },
      { t: "p", text: "Signed by the parties on the date first written above." },
      { t: "sign", blocks: [...studioSign(ctx), clientSign(ctx)] },
    ];
  },
  cover(ctx) {
    return plain(`${hello(ctx.party.person || ctx.party.name)}, attached is the Statement of Work for ${tidy(ctx, "project", 30)}: deliverables, timeline, price and milestones as in the quote you accepted. Please sign and send back a scan, and we will raise the advance invoice so we can start.`);
  },
};

/* ───────────────────────────── 3 · change request ───────────────────────────── */

export const changeRequest: SignTemplate = {
  id: "change-request",
  version: "1.0",
  title: "Change Request",
  name: "Change request",
  group: "clients",
  kind: "form",
  parties: ["client"],
  signs: "both",
  blurb: "Records a change to a project's scope — a new page or feature, a new direction after sign-off, extra revision rounds — with its cost and its effect on the timeline, before the work is done.",
  when: "Whenever the client asks for something outside the agreed scope",
  series: "CLI",
  source: "14_LEGAL/02_Client_Services_Agreement.md",
  keep: "Term + 8 years",
  lawyer: [],
  fields: [
    PROJECT,
    { key: "change", label: "The change asked for", kind: "textarea", required: true, placeholder: "Add a careers page with an application form\nOne more round of revisions on the logo" },
    { key: "cost", label: "Extra cost (before GST, 0 if none)", kind: "money", required: true, half: true },
    { key: "days", label: "Extra working days on the timeline", kind: "number", default: "0", half: true },
    { key: "newDue", label: "New delivery date (optional)", kind: "date", half: true },
  ],
  build(ctx) {
    const J = brand(ctx);
    const cost = num(ctx, "cost");
    return [
      { t: "title", text: "Change Request", sub: tidy(ctx, "project", 80) },
      { t: "p", text: `${partyIntro(ctx)} (the "${b("Client")}") asks ${J} to change the agreed scope of ${b(tidy(ctx, "project", 60))} as follows.` },
      { t: "clause", title: "The change", items: pointsOrLines(ctx, "change", 3) },
      {
        t: "table",
        widths: [36, 64],
        rows: [
          ["Extra cost", cost === 0 ? "None" : `${money(ctx, "cost")} before GST, invoiced with the next milestone`],
          ["Effect on the timeline", `${fill(ctx, "days", 10)} working days${val(ctx, "newDue") || ctx.blank ? `; new delivery date ${dateOf(ctx, "newDue")}` : ""}`],
        ],
      },
      { t: "p", text: `Everything else in the Statement of Work stays as it was. ${J} starts the change when this request is signed by both.` },
      { t: "sign", blocks: [clientSign(ctx, "Approved for the Client"), ...studioSign(ctx)] },
    ];
  },
  cover(ctx) {
    return plain(`${hello(ctx.party.person || ctx.party.name)}, as discussed, here is the change request for ${tidy(ctx, "project", 30)} with its cost and timeline. Sign it and we'll start on the change right away.`);
  },
};

/* ───────────────────────────── 4 · project acceptance and handover ───────────────────────────── */

export const projectAcceptance: SignTemplate = {
  id: "project-acceptance",
  version: "1.0",
  title: "Project Acceptance and Handover",
  name: "Acceptance & handover",
  group: "clients",
  kind: "form",
  parties: ["client"],
  signs: "both",
  blurb: "The client confirms the project was delivered and handed over: the deliverables, the source files and access, the walkthrough, and the start of the support period.",
  when: "At handover, with the final invoice",
  series: "CLI",
  source: "03_SOP/07_Delivery_and_Handover.md",
  keep: "Term + 8 years",
  lawyer: [],
  fields: [
    PROJECT,
    { key: "delivered", label: "Delivered (one per line)", kind: "textarea", required: true, placeholder: "Website live at www.example.com\nFigma source file\nBrand guidelines PDF and source" },
    { key: "handed", label: "Handed over (one per line)", kind: "textarea", default: "Source files in the shared folder\nCode repository transferred to the client's account\nAdmin access and documentation\nWalkthrough call held" },
    { key: "supportUntil", label: "Support until (optional)", kind: "date", from: "project.supportUntil", half: true },
  ],
  build(ctx) {
    const J = brand(ctx);
    return [
      { t: "title", text: "Project Acceptance and Handover", sub: tidy(ctx, "project", 80) },
      { t: "p", text: `${partyIntro(ctx)} (the "${b("Client")}") confirms that ${J} has delivered and handed over ${b(tidy(ctx, "project", 60))}.` },
      { t: "h", text: "Delivered" },
      { t: "checks", items: pointsOrLines(ctx, "delivered", 4) },
      { t: "h", text: "Handed over" },
      { t: "checks", items: pointsOrLines(ctx, "handed", 4) },
      {
        t: "p",
        text: `With the final payment, the Client owns the work as the Client Services Agreement sets out. ${val(ctx, "supportUntil") || ctx.blank ? `Support for faults against the agreed scope continues until ${dateOf(ctx, "supportUntil")}. ` : ""}New features or changes after today are quoted separately.`,
      },
      { t: "fields", cols: 1, rows: [["Anything still open (write \"Nothing\" if there is nothing)", ""]] },
      { t: "sign", blocks: [clientSign(ctx, "Accepted for the Client"), ...studioSign(ctx)] },
    ];
  },
  cover(ctx) {
    return plain(`${hello(ctx.party.person || ctx.party.name)}, thank you for building ${tidy(ctx, "project", 30)} with us! Attached is the handover note listing what was delivered and handed over. Please check it, sign and send it back with the final payment.`);
  },
};

/* ───────────────────────────── 5 · testimonial release ───────────────────────────── */

export const testimonialRelease: SignTemplate = {
  id: "testimonial-release",
  version: "1.0",
  title: "Testimonial and Name Release",
  name: "Testimonial release",
  group: "clients",
  kind: "declaration",
  parties: ["client", "other"],
  signs: "party",
  blurb: "A client or a learner allows FrameMind to publish their words, name, photo and logo as a testimonial.",
  when: "When a client or learner gives a testimonial",
  series: "CLI",
  source: "12_CASE_STUDIES/01_Testimonials_and_Case_Studies.md",
  keep: "As long as the testimonial is used + 3 years",
  lawyer: ["A testimonial from a learner under 18 needs a parent's or guardian's signature as well."],
  fields: [{ key: "quote", label: "The testimonial (as they gave it)", kind: "textarea", required: true }],
  build(ctx) {
    const J = brand(ctx);
    return [
      { t: "title", text: "Testimonial and Name Release" },
      { t: "p", text: `${b(or(ctx.party.person || ctx.party.name, 60))}${ctx.party.person && ctx.party.name ? ` of ${b(ctx.party.name)}` : ""} gives ${J} the following testimonial:` },
      { t: "note", text: `“${val(ctx, "quote") || line(150)}”` },
      { t: "p", text: "Tick what you allow:" },
      { t: "checks", items: ["My words as above (lightly edited for length, never changed in meaning)", "My name and role", "My photograph", "The company or institution's name and logo", "A video of me saying it"] },
      { t: "p", text: `${J} may use what is ticked on its website, social media, proposals and presentations. No payment is due for this use. I may withdraw this permission for future use at any time by writing to ${J}; it cannot recall what is already printed.` },
      { t: "sign", blocks: [partySign(ctx, "Signature", { lines: ["Date"] })] },
    ];
  },
  cover(ctx) {
    return plain(`${hello(ctx.party.person || ctx.party.name)}, thank you so much for the kind words! Before we share them, please tick what you're happy for us to use, sign and send back the attached release.`);
  },
};

/* ───────────────────────────── 6 · Vritta licence agreement ───────────────────────────── */

export const vrittaLicence: SignTemplate = {
  id: "vritta-licence",
  version: "1.0",
  title: "Vritta Licence Agreement",
  name: "Vritta licence",
  group: "clients",
  kind: "agreement",
  parties: ["client", "other"],
  signs: "both",
  blurb: "Licenses Vritta to one named institution: edition, billing, hosting, implementation, support, data ownership and — for a perpetual licence — exactly what perpetual means.",
  when: "On the institution's purchase order, before implementation starts",
  series: "CLI",
  source: "10_VRITTA/02_Licensing_Terms.md",
  keep: "Term + 8 years",
  initials: true,
  lawyer: [
    "The licensing terms follow the Vritta page word for word in substance (perpetual = the version at handover plus 12 months of updates; named institution; internal use; no redistribution; data export within 15 working days). Have the agreement read once as a whole.",
    "Institutions often issue their own purchase-order terms: where they differ, decide which applies.",
    SEAT_NOTE,
  ],
  fields: [
    { key: "institution", label: "Institution (as on the licence)", kind: "text", required: true, from: "client.name" },
    { key: "edition", label: "Edition", kind: "select", default: "Professional", half: true, options: VRITTA.editions.map((e) => ({ value: e.name, label: e.name })) },
    { key: "billing", label: "Billing", kind: "select", default: "Annual", half: true, options: ["Pilot (monthly, 3 months)", "Annual", "Perpetual"].map((x) => ({ value: x, label: x })) },
    { key: "hosting", label: "Hosting", kind: "select", default: "Managed", half: true, options: VRITTA.hosting.map((h) => ({ value: h.label, label: h.label })) },
    { key: "fee", label: "Licence fee (before GST)", kind: "money", required: true, half: true, help: "Per month for a pilot, per year for annual, one-time for perpetual." },
    { key: "implementation", label: "Implementation fee (before GST)", kind: "money", half: true },
    { key: "start", label: "Licence starts", kind: "date", half: true },
    SEAT,
  ],
  build(ctx) {
    const J = brand(ctx);
    const perpetual = val(ctx, "billing").startsWith("Perpetual");
    const pilot = val(ctx, "billing").startsWith("Pilot");
    const edition = VRITTA.editions.find((e) => e.name === val(ctx, "edition"));
    return [
      { t: "title", text: "Vritta Licence Agreement" },
      { t: "p", text: `This Agreement is made on ${b(docDate(ctx))} between ${companyIntro(ctx)} ("${b(J)}"), and ${partyIntro(ctx)}, for ${b(fill(ctx, "institution", 70))} (the "${b("Institution")}").` },
      {
        t: "table",
        widths: [32, 68],
        rows: [
          ["Product", `Vritta — ${VRITTA.line}`],
          ["Edition", `${fill(ctx, "edition", 30)}${edition ? ` (support response: ${edition.support})` : ""}`],
          ["Billing", fill(ctx, "billing", 40)],
          ["Licence fee", `${moneyWords(ctx, "fee")} before GST${perpetual ? ", one-time" : pilot ? " per month" : " per year"}`],
          ["Implementation", val(ctx, "implementation") || ctx.blank ? `${money(ctx, "implementation")} before GST, one-time` : "Included"],
          ["Hosting", fill(ctx, "hosting", 30)],
          ["Starts", dateOf(ctx, "start")],
        ],
      },
      {
        t: "clause",
        title: "The licence",
        items: [
          `${J} licenses Vritta to the Institution named above. The licence is not transferable, including to other institutions under the same trust; further institutions are licensed separately at ${VRITTA.groupLicencePercent}% of the applicable fee.`,
          "The Institution uses Vritta for its own publications and records only, not to run it as a service for others.",
          "A self-hosted deployment carries no right to copy, share, sublicense or resell the source code.",
        ],
      },
      ...(perpetual
        ? [
            {
              t: "clause" as const,
              title: "What a perpetual licence is",
              items: [
                "A perpetual licence grants an indefinite right to run the version delivered at handover, together with all updates released during the first twelve months. Updates published after that period require an active maintenance contract.",
                `Maintenance from year 2 is ${VRITTA.amcPercent}% of the perpetual fee a year, covering defect resolution, security patches, platform updates and compatibility maintenance.`,
                "A perpetual licence requires self-hosting (Institution Cloud or On Campus); it is not available with managed hosting.",
              ],
            },
          ]
        : []),
      ...(pilot ? [{ t: "clause" as const, title: "Pilot", items: [VRITTA.pilotNote] }] : []),
      {
        t: "clause",
        title: "Implementation and support",
        items: [
          `${J} brings Vritta live in ${VRITTA.goLiveWeeks} weeks from the purchase order: environment and identity, template and calendar, training, and the first issue with a print proof.`,
          `The Institution names one administrator with authority to decide what goes on a page and to hold deadlines, and sets submission deadlines a full week before publication.`,
          "Support during the licence covers defect resolution, platform updates and one review session per term with the administrator, at the response target of the edition.",
        ],
      },
      {
        t: "clause",
        title: "Data",
        items: [
          "All content submitted by the Institution remains the property of the Institution.",
          `On termination, ${J} provides a complete export in open formats within fifteen working days at no charge.`,
          `With managed hosting, ${J} holds the data on the Institution's behalf, keeps it secure and uses it only to run the service.`,
        ],
      },
      { t: "clause", title: "Payment and ending", items: [`${gstLine(ctx)}. Renewal invoices are raised before each period. Either party may end a non-perpetual licence at the end of a billing period with 30 days' written notice.`] },
      { t: "clause", title: "Law and disputes", items: [lawAndDisputes(ctx, "This Agreement is")] },
      { t: "sign", blocks: [...studioSign(ctx), otherSign(ctx, "For the Institution", true)] },
    ];
  },
  cover(ctx) {
    return plain(`${hello(ctx.party.person || ctx.party.name)}, attached is the Vritta Licence Agreement for ${fill(ctx, "institution", 20)}. Once it is signed with the purchase order, we start the four-week go-live.`);
  },
};

/* ───────────────────────────── 7 · coaching enrolment ───────────────────────────── */

export const coachingEnrolment: SignTemplate = {
  id: "coaching-enrolment",
  version: "1.0",
  title: "1:1 AI Coaching — Enrolment and Consent",
  name: "Coaching enrolment",
  group: "clients",
  kind: "form",
  parties: ["other"],
  signs: "both",
  blurb: "A learner (and, under 18, a parent or guardian) enrols in the 90-day 1:1 AI coaching: mode, sessions, fee, recordings, conduct and consent.",
  when: "Before session one",
  series: "CLI",
  source: "09_AI_COACHING/01_How_the_90_Days_Work.md",
  keep: "Programme + 3 years",
  lawyer: [
    "Refunds after the programme starts are not set anywhere: the box says what the studio decides.",
    "For a learner under 18, the parent's or guardian's verifiable consent is needed under the Digital Personal Data Protection Act, 2023: this form records it.",
  ],
  fields: [
    { key: "learner", label: "Learner", kind: "text", required: true },
    { key: "age", label: "Learner's age", kind: "number", half: true },
    { key: "guardian", label: "Parent / guardian (under 18)", kind: "text", half: true },
    { key: "track", label: "Track", kind: "select", default: COACHING.tracks[1].label, half: true, options: COACHING.tracks.map((t) => ({ value: t.label, label: t.label })) },
    { key: "mode", label: "Mode", kind: "select", default: "Online", half: true, options: [{ value: "Online", label: "Online" }, { value: "Offline", label: "Offline" }] },
    { key: "start", label: "Start date", kind: "date", half: true },
    { key: "sessions", label: "Live sessions included", kind: "number", half: true },
    { key: "fee", label: "Programme fee (before GST)", kind: "money", required: true, half: true },
    { key: "refund", label: "Refunds", kind: "text", default: "Fees are not refundable once session one has taken place; sessions may be rescheduled with 24 hours' notice." },
  ],
  build(ctx) {
    const J = brand(ctx);
    const minor = (num(ctx, "age") ?? 99) < 18 || !!val(ctx, "guardian");
    return [
      { t: "title", text: "1:1 AI Coaching — Enrolment and Consent" },
      {
        t: "table",
        widths: [32, 68],
        rows: [
          ["Learner", `${fill(ctx, "learner", 60)}${val(ctx, "age") ? `, age ${val(ctx, "age")}` : ""}`],
          ["Parent / guardian", minor || ctx.blank ? fill(ctx, "guardian", 60) : "Not needed (adult learner)"],
          ["Track", fill(ctx, "track", 40)],
          ["Mode", `${fill(ctx, "mode", 20)} — ${val(ctx, "mode") === "Offline" ? "in person at a FrameMind venue or the learner's home or office" : "live 1-on-1 video sessions (Google Meet or Zoom)"}`],
          ["Starts", `${dateOf(ctx, "start")}; the programme runs ${COACHING.days} days`],
          ["Sessions", val(ctx, "sessions") || ctx.blank ? `${fill(ctx, "sessions", 10)} live 1:1 sessions` : "As agreed with the coach"],
          ["Fee", `${moneyWords(ctx, "fee")} before GST`],
        ],
      },
      {
        t: "clause",
        title: "How the programme works",
        items: [
          "Before session one, the coach maps the learner's profession or studies, daily work, goals and what they already know, and builds a personal 90-day plan around them.",
          "Every session is live and 1:1. Online sessions are recorded and the recording is shared with the learner after the session; WhatsApp or email support is available between sessions.",
          `${J} does not promise a particular result; the learner practises between sessions on their own real work.`,
        ],
      },
      { t: "clause", title: "Fees and rescheduling", items: [`${gstLine(ctx)}. ${tidy(ctx, "refund", 120)}.`] },
      {
        t: "clause",
        title: "Recordings and data",
        items: [
          "Session recordings and the learner's details are seen only by the coach and the founders, used only for the coaching, and deleted 3 months after the programme ends unless the learner asks to keep them longer.",
          `${J} never asks for passwords or personal photographs, and teaches safe, private use of AI tools.`,
        ],
      },
      ...(minor || ctx.blank
        ? [
            {
              t: "clause" as const,
              title: "For a learner under 18",
              items: [
                "The parent or guardian consents to the learner taking part, to the sessions being recorded, and to the learner's details being kept as above.",
                "Session times and links are shared with the parent or guardian, who may join any session. Offline sessions take place with a parent or guardian at home or at a FrameMind venue. The coach follows FrameMind's Safeguarding Declaration.",
              ],
            },
          ]
        : []),
      { t: "sign", blocks: [partySign(ctx, minor ? "Parent / guardian" : "Learner", { lines: ["Date"] }), ...studioSign(ctx)] },
    ];
  },
  cover(ctx) {
    return plain(`Hi ${firstName(val(ctx, "learner")) || "there"}, welcome to 1:1 AI coaching with ${brand(ctx)}! Attached is the enrolment form with your programme details. Please sign it${val(ctx, "guardian") ? " (with your parent or guardian)" : ""} and send it back before session one.`);
  },
};

export const CLIENT_DOCS: SignTemplate[] = [clientServicesAgreement, statementOfWork, changeRequest, projectAcceptance, testimonialRelease, vrittaLicence, coachingEnrolment];

