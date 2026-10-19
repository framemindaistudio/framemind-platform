/**
 * The papers a team member signs beside the offer letter or the freelancer agreement: the NDA for employees and interns,
 * the joining form, and the policy declarations (Code of Conduct, safeguarding for work with minors, POSH, data security,
 * and the team media release).
 *
 * Each one follows an Operations Library document, named in its `source`. Where the library leaves a figure in
 * brackets, the figure is a box; where it is silent or disagrees with itself, the point is in the `lawyer` list.
 * Bank, tax and identity details are written by hand on the paper and are never boxes, so they are not stored in HQ.
 */
import { b, brand, companyIntro, docDate, fill, firstName, studioSign, or, partySign, plain, plainDate, val } from "../text";
import type { DocContext, SignTemplate } from "../types";

const EVERYONE = ["Founder", "Full-time", "Part-time", "Freelance", "Intern"];
const ALL_BUT_FOUNDERS = ["Full-time", "Part-time", "Freelance", "Intern"];
const EMPLOYEES_AND_INTERNS = ["Full-time", "Part-time", "Intern"];

/** "I, Asha Rao, working with FrameMind as UI/UX Designer," : the opening of a declaration. */
const iAm = (ctx: DocContext) => `I, ${b(or(ctx.party.name, 60))}${ctx.party.role || ctx.blank ? `, working with ${brand(ctx)} as ${or(ctx.party.role, 45)}` : ""},`;

const hi = (ctx: DocContext) => `Hi ${firstName(ctx.party.name) || "there"},`;

/** The self-declaration asked of everyone who coaches or films minors. */
const cleanRecord = (J: string) => [
  "I have never been convicted by a court of an offence against a child, or of an offence involving violence or sexual misconduct.",
  "As far as I know, no police case or court case for such an offence is pending against me.",
  "I have never been removed from work with children, or asked to leave it, because of a concern about my behaviour towards a child.",
  `If any of the three statements above stops being true, I will tell a founder of ${J} at once.`,
];

const TICK_NOTE = "Tick each statement that is true. If you cannot tick one, leave it empty and explain in the space below.";

/* ───────────────────────────── 1. NDA and IP agreement ───────────────────────────── */

export const ndaIp: SignTemplate = {
  id: "nda-ip",
  version: "1.0",
  title: "Non-Disclosure and Intellectual Property Agreement",
  name: "NDA and IP agreement",
  group: "joining",
  kind: "agreement",
  parties: ["team"],
  signs: "both",
  blurb: "An employee or an intern agrees to keep the studio's and its clients' information confidential, and that work made for FrameMind is assigned to FrameMind (and through it to the client).",
  when: "With the offer or internship letter, before the first day",
  series: "HR",
  source: "14_LEGAL/03_Team_NDA_and_IP.md",
  keep: "Engagement + 8 years",
  initials: true,
  requiredFor: [...EMPLOYEES_AND_INTERNS],
  marksAgreement: true,
  lawyer: [
    "This NDA is written on the same terms as the freelancer agreement so that everyone is on the same terms: have it read once beside the offer and internship letters.",
    "The 3 years of confidentiality, the 12 months of non-solicitation and the seat are usual figures: confirm all three.",
    "Non-solicitation (clause 8): restraints after employment are hard to enforce under section 27 of the Indian Contract Act. The clause is limited to using confidential information to approach FrameMind's clients: confirm the wording and the period.",
    "Assignment of rights (clause 7): it is worded for the Copyright Act, 1957 (every country, the full term, no lapse for non-use, pay as the full payment). Confirm it, and what counts as payment where an intern is unpaid.",
    "Stamp duty in Karnataka on this agreement, and whether it should be on stamp paper.",
  ],
  fields: [
    { key: "confidentialYears", label: "Confidentiality lasts (years after the end)", kind: "number", default: "3", half: true },
    { key: "nonSolicitMonths", label: "No approaching FrameMind's clients for (months)", kind: "number", default: "12", half: true },
    { key: "seat", label: "Arbitration and courts at", kind: "text", from: "company.city", default: "Gadag", half: true, help: "Your advocate confirms this choice." },
  ],
  build(ctx) {
    const J = brand(ctx);
    const p = ctx.party;
    return [
      { t: "title", text: "Non-Disclosure and Intellectual Property Agreement" },
      {
        t: "p",
        text: `This Agreement is made on ${b(docDate(ctx))} between ${companyIntro(ctx)} ("${b(J)}"), and ${b(or(p.name, 60))}, residing at ${or(p.address.replace(/\n/g, ", "), 80)}${p.role || ctx.blank ? `, who works with ${J} as ${or(p.role, 45)}` : ""} (the "${b("Team Member")}").`,
      },
      {
        t: "clause",
        title: "Why this Agreement is made",
        items: [
          `The Team Member works with ${J} as an employee or an intern. In that work the Team Member will see information that ${J} and its clients keep private, and will help make the designs, code, films and other work that ${J} delivers to its clients. This Agreement sets out how that information is kept and who owns that material. It stands beside the Team Member's Offer of Employment and Letter of Appointment, or Internship Offer Letter, and does not change the pay or the other terms in them.`,
        ],
      },
      {
        t: "clause",
        title: "Confidential Information",
        items: [
          `"Confidential Information" means information about ${J} that is not public and that the Team Member receives because of working with ${J}. It includes clients' unreleased work, files, source code, logins and business information, the studio's quotes, prices and pipeline, client contacts, coaching material, learner data, financial information and media that has not been released.`,
          `It is Confidential Information whether it is spoken, written, on paper, in ${J} HQ or in any file, and whether or not it is marked confidential.`,
        ],
      },
      {
        t: "clause",
        title: "Keeping it confidential",
        items: [
          `The Team Member will keep Confidential Information secret, use it only to do ${J} work, copy it only as far as that work needs, and share it only with people at ${J} who need it for their own work.`,
          `The Team Member will keep Confidential Information in the systems and folders ${J} provides, and will not put it into a personal account, a public computer or an online tool that ${J} has not approved.`,
          "The Team Member will tell a founder at once on learning that Confidential Information has been lost, copied or seen by someone who should not have it.",
        ],
      },
      {
        t: "clause",
        title: "What is not covered",
        items: [
          `This Agreement does not cover information that is public through no fault of the Team Member, that the Team Member already lawfully knew, or that the law requires to be disclosed. Where the law allows, the Team Member tells ${J} before such a disclosure.`,
          "Nothing in this Agreement stops the Team Member from reporting a concern about a minor's safety, a crime or harassment to a committee or an authority that the law provides for.",
        ],
      },
      {
        t: "clause",
        title: "How long",
        items: [`These duties apply for as long as the Team Member works with ${J} and for ${fill(ctx, "confidentialYears", 10)} years after the engagement ends, and without limit of time for personal data and for a client's secrets that are still secret.`],
      },
      {
        t: "clause",
        title: "Return and deletion",
        items: [
          `When the engagement ends, or earlier when ${J} asks, the Team Member will return every document, device, drive and piece of equipment that belongs to ${J}, hand back every client login, and will delete Confidential Information from the Team Member's own devices and accounts.`,
          `If ${J} asks, the Team Member will confirm in writing that this has been done.`,
          `${J} removes the Team Member's access to HQ, shared folders and tools on the day the engagement ends.`,
        ],
      },
      {
        t: "clause",
        title: "Intellectual property",
        items: [
          `Everything the Team Member creates for ${J} in the course of the engagement (designs, code, copy, photographs, videos, automations and coaching material) belongs to ${J} from the moment it is made, and the Team Member assigns all rights in it to ${J}, so that ${J} can pass full ownership to its clients as it promises them.`,
          `The assignment covers every country and lasts for the full term of each right. It does not lapse if ${J} does not use a right within one year or any other period. The pay or stipend under the Team Member's letter is the full payment for these rights, and no royalty is payable.`,
          `The Team Member keeps the Team Member's own earlier material and gives ${J} a licence to use any of it that the Team Member includes in ${J} work.`,
          `The Team Member will not reuse client work elsewhere, and will show ${J} work in a personal portfolio only with a founder's written approval and once the client has agreed.`,
          `The Team Member will use only licensed music, images and software in ${J} work, and will not add anyone else's material to it without the right to do so.`,
          `The Team Member will sign any further paper that ${J} reasonably needs to record these rights.`,
        ],
      },
      {
        t: "clause",
        title: "Non-solicitation",
        items: [
          `For ${fill(ctx, "nonSolicitMonths", 10)} months after the engagement ends, the Team Member will not use Confidential Information to approach the clients ${J} works with in order to offer them the same services directly.`,
          `This clause does not stop the Team Member from working in design, software, media or any other field after leaving ${J}.`,
        ],
      },
      {
        t: "clause",
        title: "Law and disputes",
        items: [
          `This Agreement is governed by the laws of India. The parties first try to settle a dispute by discussion. A dispute that is not settled goes to a sole arbitrator under the Arbitration and Conciliation Act, 1996, with the seat at ${fill(ctx, "seat", 30)} and in English; the courts at ${fill(ctx, "seat", 30)} have jurisdiction over matters outside the arbitration.`,
          "Either party may ask a court for an urgent order to stop a breach of this Agreement while a dispute is being settled.",
          "This is the whole agreement between the parties on confidentiality and on who owns the work. If a part of it cannot be enforced, the rest still applies. A change to it is made in writing and signed by both.",
        ],
      },
      { t: "p", text: "The Team Member has read this Agreement and has had the chance to ask questions about it. Signed by the parties on the date first written above." },
      { t: "sign", blocks: [...studioSign(ctx), partySign(ctx, "The Team Member")] },
    ];
  },
  cover(ctx) {
    const J = brand(ctx);
    return plain(
      `${hi(ctx)} attached is your Non-Disclosure and Intellectual Property Agreement with ${J}. It says how ${J}'s and our clients' information is kept private, and that the work you make for ${J} belongs to ${J} (and through us to the client). Please read it, sign and date the last page and initial the others, then bring it on your first day or send a clear scan of every page. Call me if you would like to go through any part of it.`,
    );
  },
};

/* ───────────────────────────── 3. Joining details form ───────────────────────────── */

export const joiningDetails: SignTemplate = {
  id: "joining-details",
  version: "1.0",
  title: "Joining Details Form",
  name: "Joining details",
  group: "joining",
  kind: "form",
  parties: ["team"],
  signs: "party",
  blurb: "The personal, tax, payout and emergency details FrameMind needs from a new team member, written by hand.",
  when: "On or before the first day",
  series: "HR",
  source: "15_HR_TEAM/03_Onboarding_Checklist.md",
  keep: "Engagement + 3 years; pay and tax records 8 years",
  requiredFor: [...ALL_BUT_FOUNDERS],
  lawyer: [
    "This form carries a full bank account number, and the privacy policy says HQ holds only the last four digits. Keep the signed paper in the locked file, and cover the account number before a scan goes into the File Vault.",
    "The form is kept 3 years after the engagement ends, as the privacy policy now says for identity details. Payout and tax details that payroll needs are kept with the pay records (8 years). Confirm with the CA.",
    "The safety box may hold health information, which is optional and sensitive: confirm how it is stored and who may see it.",
    "Ask the CA what else must be collected from an employee once salary TDS, PF or ESI apply. This form does not ask for PF or ESI numbers.",
  ],
  scanNote: "Cover the bank account number before you scan this form: HQ keeps only the last four digits. The paper original stays in the locked file.",
  fields: [
    { key: "start", label: "Joining date", kind: "date", from: "member.joinDate", half: true },
    { key: "keepYears", label: "The form is kept for (years after the engagement ends)", kind: "number", default: "3", half: true, help: "The privacy policy suggests 3 years for team records. Your advocate confirms the figure." },
  ],
  build(ctx) {
    const J = brand(ctx);
    const p = ctx.party;
    return [
      { t: "title", text: "Joining Details Form", sub: "Please write in capital letters. Strike out and correct anything already printed that is wrong." },
      { t: "h", text: "About you" },
      {
        t: "fields",
        cols: 2,
        rows: [
          ["Full name", p.name],
          ["Role", p.role],
          ["Engaged as (full-time, part-time, freelance or intern)", p.engagement],
          ["Joining date", plainDate(val(ctx, "start"))],
          ["Mobile phone", p.phone],
          ["Email", p.email],
        ],
      },
      { t: "fields", cols: 1, rows: [["Home address with PIN code", p.address.replace(/\n/g, ", ")]] },
      { t: "h", text: "Identity and tax" },
      {
        t: "fields",
        cols: 2,
        rows: [
          ["Date of birth", ""],
          ["PAN", ""],
          ["Identity document given (type)", ""],
          ["Its last four digits only", ""],
        ],
      },
      { t: "p", text: "Write only the type of identity document and its last four digits, not the full number. The PAN is needed because the law applies a higher rate of tax deduction to a payment made without one." },
      { t: "h", text: "How you are paid" },
      { t: "p", text: "Fill in the UPI ID or the bank account, whichever you want to be paid into." },
      {
        t: "fields",
        cols: 2,
        rows: [
          ["UPI ID", ""],
          ["Account holder's name", ""],
          ["Bank and branch", ""],
          ["IFSC", ""],
        ],
      },
      { t: "fields", cols: 1, rows: [["Account number", ""]] },
      { t: "h", text: "Emergency contact" },
      {
        t: "fields",
        cols: 2,
        rows: [
          ["Name", ""],
          ["Relation to you", ""],
          ["Phone", ""],
          ["Another phone, if any", ""],
        ],
      },
      { t: "h", text: "For your safety on a shoot day (optional)" },
      { t: "p", text: "You may tell us about an allergy, a medical condition or a medicine you carry, so that the crew can help you in an emergency. You may leave this empty." },
      { t: "fields", cols: 1, rows: [[`Anything ${J} should know`, ""]] },
      { t: "h", text: `Why ${J} asks for this, and who sees it` },
      {
        t: "note",
        text: `${J} collects these details to pay you, to deduct and report tax where the law requires, to verify who you are, and to reach your family in an emergency. Only the founders, and an administrator they appoint, can see them. This paper is kept in a restricted file. In HQ, ${J} records your UPI ID, or only the last four digits of your account number. Your details go outside ${J} only as far as paying you and meeting tax law need: to the bank, to ${J}'s accountant and to the tax authorities. The form is kept while you work with ${J} and for ${fill(ctx, "keepYears", 10)} years after; payment and tax records are kept for as long as tax law requires. You may ask to see or correct your details at any time.`,
      },
      { t: "h", text: "Declaration" },
      { t: "p", text: "The details I have given are true and complete. I will tell a founder when any of them changes." },
      { t: "sign", blocks: [partySign(ctx, "Signature", { lines: ["Date", "Place"] })] },
      { t: "h", text: `For ${J}'s use` },
      {
        t: "fields",
        cols: 2,
        rows: [
          ["Received by (name and signature)", ""],
          ["Date", ""],
        ],
      },
    ];
  },
  cover(ctx) {
    const J = brand(ctx);
    return plain(
      `${hi(ctx)} to set you up at ${J} we need a few details: your PAN, where to pay you, and someone to call in an emergency. Please print the attached form, fill it in by hand and sign it. Hand it to me in person rather than sending bank details over chat. It is kept in a restricted file.`,
    );
  },
};

/* ───────────────────────────── 4. Code of Conduct ───────────────────────────── */

export const codeOfConductAck: SignTemplate = {
  id: "code-of-conduct-ack",
  version: "1.0",
  title: "Code of Conduct: Acknowledgement",
  name: "Code of Conduct",
  group: "policies",
  kind: "declaration",
  parties: ["team"],
  signs: "party",
  blurb: "The FrameMind Code of Conduct in full — how the studio treats clients, the work and each other — with the person's signature that they will follow it.",
  when: "At onboarding, before any client work, and again when the Code changes",
  series: "HR",
  source: "15_HR_TEAM/05_Code_of_Conduct.md",
  keep: "Engagement + 8 years",
  requiredFor: [...EVERYONE],
  lawyer: ["The Code is the studio's own standard, written from the way the studio says it works on its website (founder-led, honest scoping, you own everything we build). Have it read once beside the appointment letter."],
  fields: [{ key: "mediaLead", label: "Official channels are run by", kind: "text", default: "Chinmay R M", half: true, help: "The Code names who runs FrameMind's official social media channels." }],
  build(ctx) {
    const J = brand(ctx);
    return [
      { t: "title", text: "Code of Conduct", sub: `For everyone who works with or for ${J}` },
      { t: "p", text: `${J} is a founder-led studio: small by choice, deep by design. Whether a client is our first or our fiftieth, the standard does not change. This is how everyone who represents ${J} works.` },
      {
        t: "clause",
        title: "With clients",
        items: [
          "Be honest about scope, time and price. If something cannot be done well in the client's budget or timeline, say so early — never promise what we cannot deliver.",
          "Keep the client in the loop: share real progress on the agreed days, answer within one working day, and flag a delay the moment you see it.",
          "Work only inside the agreed scope. A change the client asks for is written down and quoted before it is done; never quietly absorb it, never quietly charge for it.",
          "Be courteous in every message and meeting. Take criticism of the work calmly and pass anything difficult to a founder.",
        ],
      },
      {
        t: "clause",
        title: "With the work",
        items: [
          "Ship what you say you will ship. Test before you hand over: on mobile and desktop, in more than one browser, with real content.",
          "Use only licensed fonts, music, images, footage, code libraries and plugins, and record the licence in the project folder.",
          "AI tools are welcome in our work; you stay responsible for every line, frame and word they help make. Check AI output for errors, bias and copied material before it reaches a client.",
          "Keep files in the project's shared folder and repository, named and versioned, so anyone on the team can pick the work up.",
        ],
      },
      {
        t: "clause",
        title: "With each other",
        items: [
          "Treat everyone with respect. No harassment, discrimination or bullying, on the team, with clients or online.",
          "Credit people for their work, help a colleague who is stuck, and give feedback on the work, not the person.",
        ],
      },
      {
        t: "clause",
        title: "Integrity",
        items: [
          `No bribes, kickbacks or private deals with clients or vendors, and no taking a ${J} client's work privately.`,
          "Declare a conflict of interest to a founder: other work for a competitor or for the same client, or a gift from a supplier.",
          "Keep client logins, files and unreleased work confidential, as the Data Security Undertaking sets out.",
        ],
      },
      {
        t: "clause",
        title: "Social media and the portfolio",
        items: [`Do not post about ${J}'s clients or unreleased work without a founder's approval; client work appears in a portfolio only once the client has agreed. Never criticise a client or a colleague online. The official channels are run by ${fill(ctx, "mediaLead", 45)}.`],
      },
      {
        t: "clause",
        title: "Learners under 18",
        items: ["Anyone who coaches, films or photographs a learner under 18 also signs and follows the Safeguarding Declaration for work with minors."],
      },
      {
        t: "clause",
        title: "Raising concerns and consequences",
        items: [
          "Raise a concern with a founder. If the concern involves a founder, write to the other founder. Retaliation against anyone who raises a concern in good faith is a breach of this Code.",
          "A breach may lead to a warning, removal from a project or the end of the engagement and, where the law requires, a report to the authorities.",
        ],
      },
      { t: "h", text: "Acknowledgement" },
      { t: "p", text: `${iAm(ctx)} have read the ${J} Code of Conduct and will follow it.` },
      { t: "sign", blocks: [partySign(ctx, "Signature", { lines: ["Date", "Place"] })] },
    ];
  },
  cover(ctx) {
    return plain(`${hi(ctx)} attached is the ${brand(ctx)} Code of Conduct. It is short, and it is how all of us work with clients, with the work and with each other. Please read it, sign the acknowledgement and send it back before you start on client work.`);
  },
};

/* ───────────────────────────── 5. Safeguarding declaration (work with minors) ───────────────────────────── */

export const safeguardingMinors: SignTemplate = {
  id: "safeguarding-minors",
  version: "1.0",
  title: "Safeguarding Declaration: Work with Learners under 18",
  name: "Safeguarding (minors)",
  group: "policies",
  kind: "declaration",
  parties: ["team"],
  signs: "party",
  blurb: "For anyone who coaches a learner aged 10 to 17, or photographs or films minors at a shoot: the rules, how a concern is reported, and a self-declaration.",
  when: "Before the first session or shoot with a minor",
  series: "HR",
  source: "14_LEGAL/07_Safeguarding_Minors.md",
  keep: "Engagement + 8 years",
  lawyer: [
    "Reporting under the Protection of Children from Sexual Offences Act, 2012: confirm the wording of the duty to report, and who at FrameMind makes the report.",
    "The self-declaration about convictions and pending cases is usual practice for work with children. Confirm it is fair and lawful to ask, and what FrameMind does when a box is left unticked.",
    "Whether a police verification certificate is asked of everyone who coaches minors, and who pays for it: decide.",
  ],
  fields: [{ key: "lead", label: "Safeguarding lead", kind: "text", default: "Chinmay R M, Founder", help: "The founder every concern is reported to." }],
  build(ctx) {
    const J = brand(ctx);
    return [
      { t: "title", text: "Safeguarding Declaration", sub: `For everyone who coaches, photographs or films a learner under 18 for ${J}` },
      { t: "p", text: `${J}'s 1:1 AI coaching includes learners aged 10 to 20, and some shoots take place in schools and colleges. A minor's safety, dignity and privacy come before any session, shoot or deadline.` },
      { t: "p", text: `${iAm(ctx)} will follow the rules below in every session and at every shoot.` },
      {
        t: "list",
        ordered: true,
        items: [
          `${b("A parent or guardian knows and agrees.")} I coach a minor only once a parent or guardian has signed the Coaching Enrolment and Consent. Session times and links go to the parent too.`,
          `${b("Visible, never secret.")} Online sessions are recorded, as the enrolment says, and the parent may join any session. Offline sessions are held at a ${J} venue or the learner's home with a parent or guardian in the house, never in a closed room alone with the minor.`,
          `${b("Contact goes through the family.")} I message a minor only on the channel the parent approved, about the coaching, and copy the parent where they asked to be copied. No private social-media contact, no late-night messages, no meeting outside sessions.`,
          `${b("Photographs and video.")} I photograph or film a minor only with a signed release from a parent or guardian, and never on my personal phone. I never post a minor's image anywhere myself.`,
          `${b("Respect.")} No shouting, shaming, comparing, or remarks about a minor's body, family or background. No gifts, money or favours, and I never promise a minor secrecy.`,
          `${b("Safe online.")} I teach safe use of AI and the internet. I never ask a minor for passwords, personal photographs or details beyond what the coaching needs.`,
        ],
      },
      { t: "h", text: "If I am worried about a minor" },
      {
        t: "list",
        items: [
          "If a minor tells me something troubling, I listen calmly, do not promise secrecy and do not question for detail. As soon as I can, I write down the minor's own words, the time and what I saw.",
          `At once I tell the safeguarding lead of ${J}: ${b(fill(ctx, "lead", 70))}.`,
          "Indian law, including the Protection of Children from Sexual Offences Act, 2012, requires a person who knows of certain offences against a child to report them to the police or the Special Juvenile Police Unit. I understand that this duty is mine as well.",
          `If a concern is raised about me, I understand that ${J} will take me off work with minors at once while it is looked into.`,
        ],
      },
      { t: "h", text: "My declaration" },
      { t: "p", text: TICK_NOTE },
      { t: "checks", items: [...cleanRecord(J), `I have read these rules and I will follow them.`] },
      { t: "fields", rows: [[`Anything I must tell ${J} about these statements (write "Nothing" if there is nothing)`, ""]], cols: 1 },
      { t: "sign", blocks: [partySign(ctx, "Signature", { lines: ["Date", "Place"] })] },
    ];
  },
  cover(ctx) {
    return plain(`${hi(ctx)} before you coach or film anyone under 18 for ${brand(ctx)}, please read and sign the attached Safeguarding Declaration. It is short: how sessions with minors are run, and who to tell if you are ever worried about a learner.`);
  },
};

/* ───────────────────────────── 6. Data security undertaking ───────────────────────────── */

export const dataSecurityUndertaking: SignTemplate = {
  id: "data-security-undertaking",
  version: "1.0",
  title: "Data Security and Client Confidentiality Undertaking",
  name: "Data security",
  group: "policies",
  kind: "declaration",
  parties: ["team"],
  signs: "party",
  blurb: "The working rules for client files, accounts, source code and personal data — and for using AI tools with client material.",
  when: "Before access to client work, HQ or any client account",
  series: "HR",
  source: "14_LEGAL/05_Data_Security_and_AI_Use.md",
  keep: "Engagement + 8 years",
  requiredFor: [...EVERYONE],
  lawyer: [
    "The Digital Personal Data Protection Act, 2023 and its rules are being phased in: confirm the current duties for the personal data FrameMind handles for its clients (as a processor) and for its coaching learners (as a fiduciary), including breach reporting.",
    "Clients may ask for their own NDA or data-processing terms; where they do, those apply as well.",
  ],
  fields: [],
  build(ctx) {
    const J = brand(ctx);
    return [
      { t: "title", text: "Data Security and Client Confidentiality Undertaking", sub: `For everyone with access to ${J} HQ, a client's files or a client's accounts` },
      { t: "p", text: `Clients trust ${J} with their unreleased products, their brand, their customers' data and the keys to their websites, apps and social accounts. ${iAm(ctx)} will look after them as follows.` },
      {
        t: "clause",
        title: "Accounts and passwords",
        items: [
          "I use a client's system only through access the client grants to me or to the studio (an invited user, a team role, an API key) — never by asking for the client's own password.",
          `I keep every password in the password manager ${J} provides, turn on two-factor login where it is offered, and never send a password on WhatsApp, email or chat.`,
          "I remove my own access to a client's systems, and return any key, when the project or my work on it ends.",
        ],
      },
      {
        t: "clause",
        title: "Files and code",
        items: [
          `I keep client files in the project's shared folder and code in ${J}'s repositories, not on personal drives or in personal accounts. Repositories are private unless the client asks otherwise.`,
          "I never put secrets — passwords, API keys, client data — into code, screenshots, recordings or shared documents.",
          "I lock my devices, keep them updated, and do not let anyone else use a device that has client work on it.",
        ],
      },
      {
        t: "clause",
        title: "AI tools",
        items: [
          `I use AI tools that ${J} has approved, on the studio's accounts. I do not paste a client's confidential material, unreleased work or personal data into a public AI tool unless the client has agreed.`,
          "I check what an AI tool produces before it reaches a client, and I never present AI output as checked when it is not.",
        ],
      },
      {
        t: "clause",
        title: "Personal data",
        items: [
          "I collect and use personal data — a client's customers, a learner's details — only for the work it was given for, and I never sell it, share it for advertising or copy it to my own devices.",
          "A learner's session recordings and details are seen only by the coach and the founders.",
        ],
      },
      {
        t: "clause",
        title: "When something goes wrong",
        items: [`I tell a founder at once, and within the hour, if I lose a device used for ${J} work, think someone has used my login, or learn that a client's data or files have gone to the wrong place.`],
      },
      {
        t: "p",
        text: `I will keep client information confidential during my work with ${J} and after it ends. I understand that a breach of this undertaking may end my engagement and may expose ${J} and me to claims by the client.`,
      },
      { t: "sign", blocks: [partySign(ctx, "Signature", { lines: ["Date", "Place"] })] },
    ];
  },
  cover(ctx) {
    return plain(`${hi(ctx)} before you get access to client work and HQ, please read and sign the attached Data Security Undertaking. It covers client logins, files, code and how we use AI tools with client material.`);
  },
};

/* ───────────────────────────── 6. POSH acknowledgement ───────────────────────────── */

export const poshAck: SignTemplate = {
  id: "posh-ack",
  version: "1.0",
  title: "Prevention of Sexual Harassment: Acknowledgement",
  name: "POSH acknowledgement",
  group: "policies",
  kind: "declaration",
  parties: ["team"],
  signs: "party",
  blurb: "FrameMind's policy against sexual harassment, discrimination and bullying, how to raise a concern, and the person's acknowledgement.",
  when: "At onboarding, before the first shoot or trip",
  series: "HR",
  source: "15_HR_TEAM/08_POSH_and_Workplace_Policy.md",
  keep: "Engagement + 8 years",
  requiredFor: [...EVERYONE],
  lawyer: [
    "How the POSH Act, 2013 applies to FrameMind's freelancers and interns and at client locations, and who counts towards the ten-employee threshold: confirm.",
    "The external person for a complaint about a founder is still blank in the policy. Name one in the box, or the paper leaves that route out.",
    "Get the current office and contact of the Local Committee of the district and type it in the box.",
    "The Act's time limit for a complaint to a committee is not in the policy and not on the paper: decide whether to add it.",
    "The Act protects women, while FrameMind's policy covers everyone and adds discrimination and bullying: confirm the wider policy is worded as intended.",
    "The composition of an Internal Committee once FrameMind reaches ten employees: confirm.",
  ],
  fields: [
    { key: "external", label: "External person for complaints (optional)", kind: "text", placeholder: "Name, phone or email", help: "Someone outside FrameMind a person can write to when the concern involves a founder. Left empty, the paper does not mention this route." },
    { key: "localCommittee", label: "Local Committee of the district (optional)", kind: "text", placeholder: "Office and phone or email", help: "The district committee that hears complaints under the POSH Act while FrameMind has fewer than ten employees. Ask the district administration for the current contact." },
  ],
  build(ctx) {
    const J = brand(ctx);
    const external = val(ctx, "external");
    const committee = val(ctx, "localCommittee");
    return [
      { t: "title", text: "Prevention of Sexual Harassment: Acknowledgement", sub: `For everyone working with or for ${J}` },
      {
        t: "p",
        text: `${J} does not tolerate sexual harassment or any form of discrimination or bullying. This applies in the studio, at client locations and shoots, on trips, in messaging groups, at events and online. ${J} follows this policy from its first day, whatever its size, because its team works at client sites, travels together for shoots and sometimes stays overnight.`,
      },
      { t: "h", text: "What is not acceptable" },
      {
        t: "list",
        items: [
          "Unwelcome physical contact or advances.",
          "Sexual remarks or jokes, and showing sexual material.",
          "Persistent unwelcome messages or calls.",
          "Comments about a person's appearance.",
          "Discrimination based on gender, religion, caste, region, language, disability or sexual orientation.",
          "Retaliation against anyone who complains.",
        ],
      },
      { t: "h", text: "How to raise a concern" },
      {
        t: "list",
        ordered: true,
        items: [
          `Speak to a founder or write to one. If the concern involves a founder, write to the other founder${external || ctx.blank ? `, or to the external person ${J} has nominated: ${fill(ctx, "external", 70)}` : ""}.`,
          `A written complaint is preferred but not required. ${J} will help you write it.`,
          "A complaint is acknowledged within 24 hours, handled confidentially, and investigated fairly, with both sides heard.",
          "Interim steps may include separating work assignments, with no loss of pay for the person who complained.",
          "Outcomes range from counselling to ending the engagement. Where the law requires, the matter goes to the Internal Committee or the Local Committee, or to the police.",
          "No retaliation. Retaliation is itself misconduct.",
        ],
      },
      { t: "h", text: "The committee under the law" },
      {
        t: "p",
        text: `The Sexual Harassment of Women at Workplace (Prevention, Prohibition and Redressal) Act, 2013 requires an employer with ten or more employees to set up an Internal Committee. While ${J} has fewer than ten employees, a complaint under the Act goes to the Local Committee of the district${committee || ctx.blank ? `, which can be reached at ${fill(ctx, "localCommittee", 70)}` : ""}. ${J}'s own process does not take away anyone's right to go to the Local Committee or to the police. When ${J} reaches ten employees it will set up an Internal Committee and display its members' contact details.`,
      },
      { t: "h", text: "Trips and overnight stays" },
      { t: "p", text: "The itinerary and the accommodation details of a trip are shared with a founder. Rooms are separate, and no one is pressured to share a room. Safe transport is arranged for anyone travelling late, and no one is left alone at a location after a shoot." },
      { t: "h", text: "Acknowledgement" },
      {
        t: "p",
        text: `${iAm(ctx)} have read this policy. I will not harass, bully or discriminate against anyone I meet through my work with ${J}. I know how to raise a concern, and that no one is penalised for raising one in good faith. I will keep confidential what I learn about another person's complaint.`,
      },
      { t: "sign", blocks: [partySign(ctx, "Signature", { lines: ["Date", "Place"] })] },
    ];
  },
  cover(ctx) {
    const J = brand(ctx);
    return plain(
      `${hi(ctx)} attached is the ${J} policy against sexual harassment, discrimination and bullying. It says what is not acceptable and exactly who to speak to if something happens to you or to a colleague. Please read it, sign the acknowledgement and return it at onboarding. You can raise a concern with either founder at any time, in confidence.`,
    );
  },
};

/* ───────────────────────────── 8. Media release (team) ───────────────────────────── */

export const mediaReleaseTeam: SignTemplate = {
  id: "media-release-team",
  version: "1.0",
  title: "Media Release (Team)",
  name: "Team media release",
  group: "policies",
  kind: "declaration",
  parties: ["team"],
  signs: "party",
  blurb: "An employee, a freelancer or an intern allows FrameMind to photograph and film them at work (behind the scenes, team pages) and to use it to promote the studio.",
  when: "At onboarding, before the first shoot day",
  series: "HR",
  source: "14_LEGAL/06_Media_Releases.md",
  keep: "Engagement + 8 years",
  requiredFor: [...ALL_BUT_FOUNDERS],
  lawyer: [
    "The paper says no separate payment or royalty is due for the use of a team member's image. The library is silent on this: confirm it is what you intend.",
    "The paper excludes using a person's image or voice to train an AI model or to create a likeness. This limit is not in the library; it is added to be fair to the person: confirm you want it.",
    "Withdrawal covers future use, and the paper says printed and delivered copies cannot be recalled. Confirm what FrameMind must take down from its own website and channels after a withdrawal under the Digital Personal Data Protection Act, 2023.",
    "The permission continues after the person leaves, until it is withdrawn: confirm. Keep the signed release for as long as media of the person is in use, even past the 8 years in the retention schedule.",
  ],
  fields: [],
  build(ctx) {
    const J = brand(ctx);
    return [
      { t: "title", text: "Media Release (Team)", sub: "Permission to photograph and film a team member at work" },
      { t: "p", text: `${J} shows its team and its process: behind-the-scenes posts, the team page, and making-of reels. This release records what I allow.` },
      { t: "p", text: `${iAm(ctx)} allow ${J} to photograph, film and record me while I work for ${J}, and to use what I tick in the ways set out below.` },
      { t: "h", text: "What I allow" },
      { t: "p", text: "Tick each one you allow." },
      { t: "checks", items: ["Photographs of me at work", "Video of me at work", "My recorded voice", "My name and role in captions and credits"] },
      { t: "h", text: "How it is used" },
      {
        t: "list",
        items: [
          `To promote ${J}: on its website and social media channels, in its brochures, proposals and presentations, and in its portfolio.`,
          `In behind-the-scenes material ${J} delivers to a client with its project, which the client may use to show how the work was made.`,
          `The photographs, films and recordings belong to ${J}. No separate payment or royalty is due to me for this use.`,
          "This permission does not cover using my image or voice to train an AI model, or to make me appear to say or do something I did not. That needs my separate written consent.",
          `The permission continues after my engagement with ${J} ends, until I withdraw it.`,
        ],
      },
      { t: "h", text: "My own channels" },
      { t: "p", text: `I will not post photographs or video of clients, their locations or unreleased work on my personal channels without a founder's approval.` },
      { t: "h", text: "Withdrawing this permission" },
      { t: "p", text: `I may withdraw this permission for future use at any time by writing to a founder. ${J} stops new use of my image, voice and name from the day it receives my letter. It cannot recall what has already been printed or delivered to a client.` },
      { t: "sign", blocks: [partySign(ctx, "Signature", { lines: ["Date", "Place"] })] },
    ];
  },
  cover(ctx) {
    const J = brand(ctx);
    return plain(
      `${hi(ctx)} we share behind-the-scenes photos and videos of the team at work, and you may be in some of them. The attached release asks what you are comfortable with: tick what you allow, sign it and return it before your first shoot day. You can change your mind later by writing to me.`,
    );
  },
};

export const TEAM_POLICIES: SignTemplate[] = [ndaIp, joiningDetails, codeOfConductAck, safeguardingMinors, poshAck, dataSecurityUndertaking, mediaReleaseTeam];
