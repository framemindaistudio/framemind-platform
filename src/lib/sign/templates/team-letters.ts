/**
 * Letters and forms for the team, beyond the offer letter and the freelancer agreement:
 * joining (internship offer, letter of appointment) and during and after (confirmation, experience, internship
 * completion, end of engagement, exit clearance, asset handover, authority).
 *
 * The wording follows OPERATIONS/15_HR_TEAM: 02 (roles), 03 (onboarding and offboarding), 04 (pay), 05 (Code of
 * Conduct), 06 (leave and attendance), 07 (reviews) and 08 (POSH), with 14_LEGAL for confidentiality, IP and data. Where the library sets no rule (probation, notice, the courts) the box carries
 * a usual figure the founder may change, and the template's "lawyer" list says so.
 */
import { addressee, b, dateOf, fill, firstName, brand, studioSign, line, moneyWords, or, partySign, plain, val } from "../text";
import type { Block, DocContext, SignBlock, SignTemplate } from "../types";

/* ───────────────────────────── small helpers ───────────────────────────── */

/** What was typed in a big box, one entry for each line. */
const linesOf = (ctx: DocContext, key: string) => val(ctx, key).split("\n").map((s) => s.trim()).filter(Boolean);
/** Typed text that sits inside a sentence: the full stop at its end is ours to add. */
const inSentence = (text: string) => text.replace(/[\s.;,]+$/, "");
/** Lines to write on, one under the other. */
const writeLines = (n: number, mm = 165) => Array.from({ length: n }, () => line(mm)).join("\n");
const dear = (ctx: DocContext) => `Dear ${firstName(ctx.party.name) || line(40)},`;
const hi = (ctx: DocContext) => `Hi ${firstName(ctx.party.name) || "there"}`;

/** How a letter for someone outside the studio can be checked: from the records, by phone or email. */
function checkLine(ctx: DocContext) {
  const c = ctx.company;
  const how = [c.email && `write to ${c.email}`, c.phone && `call ${c.phone}`].filter(Boolean).join(" or ");
  return `This letter is given from the records of ${brand(ctx)}.${how ? ` To check it, ${how} and quote the reference at the top.` : ""}`;
}

/** What the relationship is called, and the paper it rests on, from the person's engagement in HQ → Team. */
function standing(ctx: DocContext) {
  const kind = ctx.party.engagement;
  const rel = kind === "Full-time" || kind === "Part-time" ? "employment" : kind === "Intern" ? "internship" : "engagement";
  // the exact titles of the papers in Documents to Sign
  const paper =
    kind === "Freelance" ? "Freelancer Agreement" : kind === "Intern" ? "Internship Offer Letter" : rel === "employment" ? "Letter of Appointment" : `agreement with ${brand(ctx)}`;
  return { rel, paper };
}

/* ───────────────────────────── 1. internship offer ───────────────────────────── */

export const internshipOffer: SignTemplate = {
  id: "internship-offer",
  version: "1.0",
  title: "Internship Offer Letter",
  name: "Internship offer",
  group: "joining",
  kind: "letter",
  parties: ["team"],
  signs: "both",
  blurb: "Offers an internship: area of work, period, stipend, mentor, learning goals and what must be signed before the first day.",
  when: "When an internship is agreed, before the first day",
  series: "HR",
  source: "15_HR_TEAM/04_Compensation_and_Payroll_Policy.md",
  keep: "Internship + 8 years",
  requiredFor: ["Intern"],
  lawyer: [
    "Intern or employee: an intern who works set hours for a stipend may be treated as an employee under labour law (Shops and Commercial Establishments, ESI, PF, minimum wages). Have the classification checked for the way interns actually work.",
    "Whether tax is deducted from a stipend: confirm with the CA.",
    "Leave of 1 day a month is the suggested figure in the Leave and Attendance Policy, still marked to confirm.",
    "Notice of 7 days to end an internship is a usual figure, not company policy yet.",
    "Three months is a usual length for a studio internship. Change the box for any other length.",
    "If the intern is under 18, a parent or guardian must also sign, and the rules on work by adolescents apply: take advice first.",
    "If the internship is part of a college course, the college may need its own letter or agreement as well.",
  ],
  fields: [
    { key: "area", label: "Area of work", kind: "text", required: true, placeholder: "UI/UX design" },
    { key: "start", label: "Start date", kind: "date", from: "member.joinDate", required: true, half: true },
    { key: "months", label: "Length (months)", kind: "number", default: "3", half: true },
    { key: "end", label: "Last day (optional)", kind: "date", half: true, help: "Left empty, the letter gives only the length in months." },
    { key: "stipend", label: "Monthly stipend", kind: "money", from: "member.monthlyPay", required: true, half: true },
    { key: "place", label: "Place", kind: "text", from: "company.city", half: true },
    { key: "mentor", label: "Mentor", kind: "text", from: "signatory.name", half: true, help: "The founder or team member who guides the intern." },
    { key: "goals", label: "Learning goals", kind: "textarea", required: true, placeholder: "One per line. What the intern will be able to do by the end." },
    { key: "hours", label: "Working days and hours (optional)", kind: "text", placeholder: "Monday to Saturday, 9:30 am to 6:00 pm", help: "Left empty, the letter says only that client deadlines and shoot days are planned in advance." },
    { key: "leave", label: "Leave (days a month)", kind: "number", default: "1", half: true },
    { key: "notice", label: "Notice to end the internship (days)", kind: "number", default: "7", half: true },
    { key: "acceptBy", label: "Sign and return by", kind: "date", half: true },
  ],
  build(ctx) {
    const J = brand(ctx);
    const goals = linesOf(ctx, "goals");
    const hours = val(ctx, "hours");
    const months = val(ctx, "months");
    const end = val(ctx, "end");
    const leave = val(ctx, "leave");
    const length = `${months || line(10)} ${months === "1" ? "month" : "months"}`;
    const period =
      end || ctx.blank || !months
        ? `${months || !end ? `${length}, from` : "From"} ${dateOf(ctx, "start")} to ${dateOf(ctx, "end")}`
        : `${length} from ${dateOf(ctx, "start")}`;
    return [
      { t: "to", lines: addressee(ctx) },
      { t: "subject", text: `Offer of internship: ${fill(ctx, "area", 60)}` },
      { t: "p", text: dear(ctx) },
      {
        t: "p",
        text: `We are glad to offer you an internship with ${J}. An internship is a period of learning and training, and it does not promise a job at the end. The terms are set out below.`,
      },
      {
        t: "table",
        widths: [26, 74],
        rows: [
          ["Area of work", fill(ctx, "area", 60)],
          ["Period", period],
          ["Place", `${fill(ctx, "place", 40)}, remote work where agreed, and client locations and shoots when you are assigned to them`],
          ["Mentor", fill(ctx, "mentor", 50)],
          ["Monthly stipend", `${moneyWords(ctx, "stipend")}, paid each month by bank transfer or UPI`],
          ["Leave", `${leave || line(10)} ${leave === "1" ? "day" : "days"} for each month of the internship. Ask for planned leave at least 7 days ahead. Leave on a client deadline or a shoot day needs a founder's approval.`],
          ["Ending early", `Either side may end the internship with ${fill(ctx, "notice", 10)} days' written notice. ${J} may end it at once for a serious breach of the Code of Conduct, of confidentiality or of the Data Security Undertaking.`],
        ],
      },
      { t: "h", text: "What you will learn" },
      goals.length ? { t: "list", items: goals } : { t: "p", text: writeLines(3) },
      {
        t: "p",
        text: `Your mentor reviews your progress with you every month. ${hours || ctx.blank ? `Working days and hours: ${fill(ctx, "hours", 70)}. ` : ""}Client deadlines and shoot days are commitments to a client: when you are assigned to one, you are expected to keep it.`,
      },
      { t: "h", text: "Before you start" },
      { t: "p", text: "This offer depends on the following, to be completed on or before your first day:" },
      {
        t: "list",
        items: [
          "A copy of a government identity document.",
          "Your signature on the Non-Disclosure and Intellectual Property Agreement, the Code of Conduct, and the Data Security Undertaking.",
          "The Joining Details Form, with your PAN, your bank or UPI details for the stipend, and an emergency contact.",
          "If you will coach or film learners under 18: the Safeguarding Declaration for work with minors.",
        ],
      },
      { t: "p", text: `${J} handles its clients' files, accounts and unreleased work. You will complete the briefing on data security and on using AI tools with client material before you get access to client work.` },
      { t: "p", text: `When you complete the internship, ${J} gives you an Internship Completion Letter that states the period and the work you did.` },
      { t: "p", text: `To accept, sign the acceptance below and return this letter${val(ctx, "acceptBy") || ctx.blank ? ` by ${b(dateOf(ctx, "acceptBy"))}. The offer lapses after that date` : ""}.` },
      { t: "p", text: "Yours sincerely," },
      { t: "sign", blocks: studioSign(ctx, { lines: [] }) },
      { t: "h", text: "Acceptance" },
      { t: "p", text: `I accept this internship on the terms above and will start on ${dateOf(ctx, "start")}.` },
      { t: "sign", blocks: [partySign(ctx, "Signature", { title: "" })] },
    ];
  },
  cover(ctx) {
    return plain(
      `${hi(ctx)}, we are happy to offer you an internship with ${brand(ctx)} in ${fill(ctx, "area", 20)}. The letter is attached. Please read it, sign the acceptance at the end and send it back${val(ctx, "acceptBy") ? ` by ${dateOf(ctx, "acceptBy")}` : ""}. Call me if you would like to talk through any part of it.`,
    );
  },
};

/* ───────────────────────────── 2. letter of appointment ───────────────────────────── */

export const appointmentLetter: SignTemplate = {
  id: "appointment-letter",
  version: "1.1",
  title: "Letter of Appointment",
  name: "Appointment letter",
  group: "joining",
  kind: "letter",
  parties: ["team"],
  signs: "both",
  blurb: "The full terms of employment that the offer letter promised: duties, salary, leave, probation, conduct, confidentiality and how the employment can end.",
  when: "On the joining day, after the offer letter is accepted",
  series: "HR",
  source: "15_HR_TEAM/04_Compensation_and_Payroll_Policy.md",
  keep: "Employment + 8 years",
  initials: true,
  requiredFor: ["Full-time", "Part-time"],
  lawyer: [
    "Probation (3 months) and notice (7 days in probation, 30 days after) are usual figures, not company policy yet. They match the offer letter.",
    "Probation (clause 6): the letter does not say what happens if no confirmation letter is given, or whether probation can be extended. Decide and add it.",
    "Ending the employment (clause 11): check it against section 39 of the Karnataka Shops and Commercial Establishments Act, 1961 (notice, reasonable cause, and an inquiry for misconduct once an employee has six months of service). Pay in place of notice is not written in.",
    "Courts (clause 12): the box is filled with the town of your office. Parties can only choose a court that already has jurisdiction: confirm the choice.",
    "Working hours, the weekly day off and overtime on shoot days and late deadlines (clause 3) under the Karnataka Shops and Commercial Establishments Act.",
    "PF, ESI and professional tax (clause 4): confirm with the CA which apply at this salary.",
    "Leave (clause 5) points to the Leave and Attendance Policy, whose figures are still marked to confirm. Settle them before the first employee joins.",
    "Other work (clause 9) asks only that it is declared. Decide whether a full-time employee needs written approval first.",
    "Recovering the cost of damage (clause 10): even with written agreement, deductions from salary are limited by wage law. Confirm before any recovery.",
    "Whether Karnataka needs an appointment order in a set form, and stamp duty if any.",
  ],
  fields: [
    { key: "role", label: "Position", kind: "text", from: "member.role", required: true, half: true },
    { key: "engagement", label: "Type", kind: "select", from: "member.type", default: "Full-time", half: true, options: [{ value: "Full-time", label: "Full-time" }, { value: "Part-time", label: "Part-time" }] },
    { key: "start", label: "Start date", kind: "date", from: "member.joinDate", required: true, half: true },
    { key: "salary", label: "Monthly salary (before deductions)", kind: "money", from: "member.monthlyPay", required: true, half: true },
    { key: "payDay", label: "Salary is paid", kind: "text", default: "On the last working day of each month", half: true },
    { key: "place", label: "Place of work", kind: "text", from: "company.city", half: true },
    { key: "reportsTo", label: "Reports to", kind: "text", from: "signatory.name", half: true },
    { key: "hours", label: "Working days and hours (optional)", kind: "text", placeholder: "Monday to Saturday, 9:30 am to 6:00 pm", help: "Left empty, the letter says only that client deadlines and shoot days are planned in advance." },
    { key: "duties", label: "Main responsibilities (optional)", kind: "textarea", placeholder: "One per line. Left empty, the letter points to the job description." },
    { key: "probation", label: "Probation (months)", kind: "number", default: "3", half: true },
    { key: "noticeProbation", label: "Notice during probation (days)", kind: "number", default: "7", half: true },
    { key: "notice", label: "Notice after confirmation (days)", kind: "number", default: "30", half: true },
    { key: "seat", label: "Courts at", kind: "text", from: "company.city", default: "Bengaluru", half: true, help: "Filled with the town of your office. Your advocate confirms this choice." },
  ],
  build(ctx) {
    const J = brand(ctx);
    const duties = linesOf(ctx, "duties").map(inSentence);
    const hours = val(ctx, "hours");
    const type = val(ctx, "engagement").toLowerCase() || line(30);
    const payDay = val(ctx, "payDay");
    const paid = payDay ? `${payDay.charAt(0).toLowerCase()}${inSentence(payDay.slice(1))}` : line(50);
    const months = val(ctx, "probation");
    return [
      { t: "to", lines: addressee(ctx) },
      { t: "subject", text: `Letter of appointment: ${fill(ctx, "role", 50)}` },
      { t: "p", text: dear(ctx) },
      { t: "p", text: `Following our offer of employment and your acceptance, we are glad to confirm your appointment with ${J}. This letter sets out the terms of your employment. Please ask us about anything that is not clear before you sign.` },
      {
        t: "clause",
        title: "Position and duties",
        items: [
          `You are appointed as ${b(fill(ctx, "role", 50))}, in ${type} employment, from ${b(dateOf(ctx, "start"))}. You report to ${fill(ctx, "reportsTo", 50)}.`,
          duties.length
            ? `Your main responsibilities are: ${duties.join("; ")}. You also carry out the reasonable tasks your manager assigns.`
            : "Your responsibilities are those in the job description for the role, which we have shared with you, and the reasonable tasks your manager assigns.",
        ],
      },
      {
        t: "clause",
        title: "Place of work and travel",
        items: [
          `Your place of work is ${fill(ctx, "place", 40)}. Remote work is allowed where your manager agrees, and you travel to client locations and shoots when you are assigned to them.`,
          `For a shoot or a client visit ${J} arranges the travel. Meals on shoot days are provided or paid back, and ${J} arranges and pays for an overnight stay where the work needs one.`,
          `Where a founder approves separate travel, ${J} pays for public transport at actual cost, against a ticket or UPI proof. Claims are made within 7 days with proof, and a claim not made within 30 days lapses.`,
        ],
      },
      {
        t: "clause",
        title: "Working days, deadlines and shoot days",
        items: [
          `${hours || ctx.blank ? `Your working days and hours are ${fill(ctx, "hours", 70)}. ` : ""}Client deadlines and review dates are commitments to a client. They are planned in advance, and you are expected to keep the ones you are assigned.`,
          "On a shoot day the crew reports at the call time on the call sheet. If you will be late, are ill or have an emergency, call a founder at once, before the day starts.",
        ],
      },
      {
        t: "clause",
        title: "Salary, deductions and pay day",
        items: [
          `Your salary is ${b(moneyWords(ctx, "salary"))} a month, before deductions. It is paid ${paid}, by bank transfer or UPI, and you receive a payslip for each month.`,
          `Provident fund, ESI, professional tax and income tax are deducted where the law applies them to your salary. ${J} gives you the tax certificate the law requires.`,
        ],
      },
      {
        t: "clause",
        title: "Leave",
        items: [`Leave and holidays are as set out in the ${J} Leave and Attendance Policy in force, and never less than the law gives you. Ask for planned leave at least 7 days ahead. Leave on a client deadline or a shoot day needs a founder's approval.`],
      },
      {
        t: "clause",
        title: "Probation and confirmation",
        items: [
          `You are on probation for ${months || line(10)} ${months === "1" ? "month" : "months"} from your start date. At the end of probation ${J} reviews your work with you. When your employment is confirmed, ${J} gives you a Confirmation of Employment letter.`,
          "Your work is reviewed with you every quarter and rated once a year.",
        ],
      },
      {
        t: "clause",
        title: "Conduct and policies",
        items: [
          `You will follow the ${J} Code of Conduct, the Data Security Undertaking, the POSH and Workplace Policy and, if you coach or film learners under 18, the Safeguarding Declaration for work with minors, as in force. ${J} gives you a copy of each, and you sign the declarations that go with them.`,
          `Client files, accounts and unreleased work are confidential. You use client logins only through the access the client grants, never share them, and never put a client's confidential material into a public AI tool without the client's permission.`,
          `${J} does not tolerate sexual harassment, discrimination or bullying. You can raise a concern with either founder, and no one is treated badly for raising a concern in good faith.`,
          `How ${J} may photograph, film and record you at work is set out in the Media Release (Team), which you sign separately. You will not post about ${J}'s clients or unreleased work on personal accounts without a founder's approval.`,
        ],
      },
      {
        t: "clause",
        title: "Confidentiality and intellectual property",
        items: [
          `You will keep the confidential information of ${J} secret and use it only for the work of ${J}. It includes client work before it is released, client files and logins, source code, designs, quotes and prices, client contacts, and the personal data of clients, learners and their users.`,
          `What you create in the course of your employment belongs to ${J}.`,
          "The full terms, including how long the duty of confidentiality lasts after you leave, are in the Non-Disclosure and Intellectual Property Agreement, which you sign separately. Where this letter and that agreement differ on these two subjects, that agreement applies.",
        ],
      },
      {
        t: "clause",
        title: "Other work and conflict of interest",
        items: [
          `Tell a founder in writing before you take up any other paid work. Other work must not use the time, property or confidential information of ${J}, and must not clash with the days you are rostered.`,
          `Declare any conflict of interest to a founder, for example work for a competitor of ${J} or a gift from a supplier. You will not give or take a bribe, a commission or a personal deal with a client or a supplier, and you will not take a client's work privately.`,
        ],
      },
      {
        t: "clause",
        title: "Company property",
        items: [
          `The cameras, lenses, computers, devices, software licences, documents and logins that ${J} gives you belong to ${J}. Use them with care and for the work of ${J}, and do not share your logins.`,
          "Report loss or damage honestly and at once. The cost of damage caused by negligence is recovered from you only with your written agreement.",
        ],
      },
      {
        t: "clause",
        title: "Ending the employment",
        items: [
          `During probation either side may end the employment with ${fill(ctx, "noticeProbation", 10)} days' written notice. After confirmation the notice is ${fill(ctx, "notice", 10)} days.`,
          `${J} may end the employment at once, without notice, for serious misconduct such as harassment, theft, dishonesty, leaking a client's confidential work, or a breach of the Safeguarding Declaration. ${J} looks into the matter fairly and hears you before it decides, and may keep you away from client work while it does so.`,
          `On your last working day you return everything that belongs to ${J}, and your access to HQ, shared drives and other tools ends. ${J} pays what is due to you in a final settlement. Your duty of confidentiality continues.`,
        ],
      },
      {
        t: "clause",
        title: "Law and courts",
        items: [
          `This letter is governed by the laws of India, and the courts at ${fill(ctx, "seat", 30)} have jurisdiction.`,
          `This letter, with the policies and the agreements it names, holds the full terms of your employment and takes the place of the Offer of Employment. A change to it is made in writing and signed by you and ${J}.`,
        ],
      },
      { t: "p", text: `Two copies of this letter are signed, one for you and one for ${J}. Welcome to the team.` },
      { t: "p", text: "Yours sincerely," },
      { t: "sign", blocks: studioSign(ctx, { lines: [] }) },
      { t: "h", text: "Acceptance" },
      { t: "p", text: "I have read this letter and understood it. I accept the appointment on these terms." },
      { t: "sign", blocks: [partySign(ctx, "Signature", { title: "" })] },
    ];
  },
  cover(ctx) {
    return plain(
      `${hi(ctx)}, welcome to ${brand(ctx)}. Attached is your letter of appointment, with the full terms of your employment, so that you can read it before we sign. On your joining day we sign two copies together: the acceptance on the last page, and initials on the other pages. Ask me about anything that is not clear.`,
    );
  },
};

/* ───────────────────────────── 3. confirmation of employment ───────────────────────────── */

export const confirmationLetter: SignTemplate = {
  id: "confirmation-letter",
  version: "1.0",
  title: "Confirmation of Employment",
  name: "Confirmation letter",
  group: "exit",
  kind: "letter",
  parties: ["team"],
  signs: "studio",
  blurb: "Tells an employee that probation is complete and the employment is confirmed, with the salary and the notice period from that date.",
  when: "At the end of probation, after the review",
  series: "HR",
  source: "15_HR_TEAM/07_Performance_Reviews.md",
  keep: "Employment + 8 years",
  lawyer: [
    "Notice of 30 days after confirmation is a usual figure, not company policy yet. It must match the letter of appointment.",
    "Once an employee is confirmed and has six months of service, section 39 of the Karnataka Shops and Commercial Establishments Act, 1961 limits how the employment can be ended: confirm.",
    "A change of salary can change PF, ESI and professional tax: confirm with the CA.",
  ],
  fields: [
    { key: "role", label: "Position", kind: "text", from: "member.role", required: true, half: true },
    { key: "joined", label: "Joined on", kind: "date", from: "member.joinDate", required: true, half: true },
    { key: "confirmedFrom", label: "Confirmed from", kind: "date", required: true, half: true },
    { key: "newSalary", label: "New monthly salary (optional)", kind: "money", half: true, help: "Left empty, the letter says the salary is unchanged." },
    { key: "notice", label: "Notice after confirmation (days)", kind: "number", default: "30", half: true },
  ],
  build(ctx) {
    const J = brand(ctx);
    return [
      { t: "to", lines: addressee(ctx) },
      { t: "subject", text: "Confirmation of your employment" },
      { t: "p", text: dear(ctx) },
      {
        t: "p",
        text: `You joined ${J} on ${b(dateOf(ctx, "joined"))} as ${b(fill(ctx, "role", 50))}, on probation. We are glad to tell you that you have completed your probation, and that your employment is confirmed from ${b(dateOf(ctx, "confirmedFrom"))}.`,
      },
      {
        t: "p",
        text: val(ctx, "newSalary") || ctx.blank ? `From that date your monthly salary is ${b(moneyWords(ctx, "newSalary"))}, before the deductions the law requires.` : "Your salary is unchanged.",
      },
      { t: "p", text: `From the date of confirmation, the notice to end the employment is ${fill(ctx, "notice", 10)} days by either side. All the other terms of your Letter of Appointment continue to apply.` },
      { t: "p", text: "Thank you for your work during your probation. We look forward to the work ahead." },
      { t: "p", text: "Yours sincerely," },
      { t: "sign", blocks: studioSign(ctx, { lines: [] }) },
    ];
  },
  cover(ctx) {
    return plain(`${hi(ctx)}, good news: your probation is complete and your employment with ${brand(ctx)} is confirmed from ${dateOf(ctx, "confirmedFrom")}. Your confirmation letter is attached. Please keep it with your Letter of Appointment.`);
  },
};

/* ───────────────────────────── 4. experience letter ───────────────────────────── */

export const experienceLetter: SignTemplate = {
  id: "experience-letter",
  version: "1.0",
  title: "Experience Letter",
  name: "Experience letter",
  group: "exit",
  kind: "letter",
  parties: ["team"],
  signs: "studio",
  blurb: "States the facts of someone's time with FrameMind: the role, the kind of engagement and the dates. Nothing is added unless you type it.",
  when: "When someone leaves, or asks for proof of their time with FrameMind",
  series: "HR",
  source: "15_HR_TEAM/03_Onboarding_Checklist.md",
  keep: "Engagement + 8 years",
  lawyer: [
    "The letter states only what the records show. Do not add a reason for leaving, or an opinion that the records cannot support.",
    "For a freelancer the letter says the engagement was freelance, one project at a time, in line with the freelancer agreement. Have that wording checked once.",
    "Confirm whether Karnataka rules require a service certificate in a set form when an employee leaves.",
  ],
  fields: [
    { key: "role", label: "Role", kind: "text", from: "member.role", required: true, half: true },
    {
      key: "engagement",
      label: "Engagement",
      kind: "select",
      from: "member.type",
      half: true,
      options: [
        { value: "Full-time", label: "Full-time" },
        { value: "Part-time", label: "Part-time" },
        { value: "Freelance", label: "Freelance" },
        { value: "Intern", label: "Intern" },
      ],
    },
    { key: "from", label: "From", kind: "date", from: "member.joinDate", required: true, half: true },
    { key: "to", label: "To", kind: "date", required: true, half: true },
    { key: "days", label: "Projects delivered (optional)", kind: "number", half: true, help: "Count them from HQ, Projects." },
    { key: "work", label: "Work done (optional)", kind: "textarea", placeholder: "Designed and built the websites for four clients, from wireframes to launch.", help: "Printed exactly as you type it. Facts only." },
    { key: "remarks", label: "Remarks (optional)", kind: "textarea", placeholder: "Left empty, nothing is printed.", help: "Printed exactly as you type it." },
  ],
  build(ctx) {
    const J = brand(ctx);
    const kind = val(ctx, "engagement");
    const was =
      kind === "Full-time" ? "full-time employment" : kind === "Part-time" ? "part-time employment" : kind === "Freelance" ? "freelance, one project at a time" : kind === "Intern" ? "an internship" : kind ? kind.toLowerCase() : line(50);
    const work = val(ctx, "work");
    const remarks = val(ctx, "remarks");
    const blocks: Block[] = [
      { t: "title", text: "Experience Letter", sub: "To whom it may concern" },
      {
        t: "p",
        text: `This is to confirm that ${b(or(ctx.party.name, 60))} worked with ${J} as ${b(fill(ctx, "role", 50))} from ${b(dateOf(ctx, "from"))} to ${b(dateOf(ctx, "to"))}.${ctx.blank ? " The engagement was (tick one):" : ` The engagement was ${was}.`}`,
      },
    ];
    if (ctx.blank) blocks.push({ t: "checks", items: ["Full-time employment", "Part-time employment", "Freelance, one project at a time", "An internship"] });
    blocks.push({ t: "p", text: `${J} is a design and software studio: websites, brand systems, custom software, automations, photography, videography, social media and 1:1 AI coaching.` });
    if (val(ctx, "days") || ctx.blank) blocks.push({ t: "p", text: `Client projects delivered with ${J} in this period: ${fill(ctx, "days", 14)}.` });
    if (work || ctx.blank) blocks.push({ t: "h", text: "Work done" }, { t: "p", text: work || writeLines(3) });
    if (remarks || ctx.blank) blocks.push({ t: "h", text: "Remarks" }, { t: "p", text: remarks || writeLines(2) });
    blocks.push({ t: "p", text: checkLine(ctx) }, { t: "sign", blocks: studioSign(ctx, { lines: [] }) });
    return blocks;
  },
  cover(ctx) {
    return plain(`${hi(ctx)}, your experience letter from ${brand(ctx)} is attached. It states your role and the dates you worked with us. If you need the signed paper copy as well, tell me and I will keep it ready for you.`);
  },
};

/* ───────────────────────────── 5. internship completion ───────────────────────────── */

export const internshipCompletion: SignTemplate = {
  id: "internship-completion",
  version: "1.0",
  title: "Internship Completion Letter",
  name: "Internship completion",
  group: "exit",
  kind: "letter",
  parties: ["team"],
  signs: "studio",
  blurb: "Confirms that an intern completed the internship: the area of work, the dates, the mentor and the work done.",
  when: "On the last day of an internship, after the final review",
  series: "HR",
  source: "15_HR_TEAM/04_Compensation_and_Payroll_Policy.md",
  keep: "Internship + 8 years",
  lawyer: ["If a college needs its own format, or a count of hours for course credit, fill in the college's form as well."],
  fields: [
    { key: "area", label: "Area of work", kind: "text", required: true, placeholder: "Video editing" },
    { key: "from", label: "From", kind: "date", from: "member.joinDate", required: true, half: true },
    { key: "to", label: "To", kind: "date", required: true, half: true },
    { key: "mentor", label: "Mentor", kind: "text", from: "signatory.name", half: true },
    { key: "work", label: "Work done", kind: "textarea", required: true, placeholder: "Edited reels and brand films for client projects, and kept the footage library in order.", help: "Printed exactly as you type it. Facts only." },
  ],
  build(ctx) {
    const J = brand(ctx);
    const work = val(ctx, "work");
    return [
      { t: "title", text: "Internship Completion Letter", sub: "To whom it may concern" },
      {
        t: "p",
        text: `This is to confirm that ${b(or(ctx.party.name, 60))} completed an internship with ${J} in ${b(fill(ctx, "area", 60))}, from ${b(dateOf(ctx, "from"))} to ${b(dateOf(ctx, "to"))}.${val(ctx, "mentor") || ctx.blank ? ` The mentor for the internship was ${fill(ctx, "mentor", 50)}.` : ""}`,
      },
      { t: "p", text: `${J} is a design and software studio: websites, brand systems, custom software, automations, photography, videography, social media and 1:1 AI coaching.` },
      { t: "h", text: "Work done during the internship" },
      { t: "p", text: work || writeLines(3) },
      { t: "p", text: checkLine(ctx) },
      { t: "sign", blocks: studioSign(ctx, { lines: [] }) },
    ];
  },
  cover(ctx) {
    return plain(`${hi(ctx)}, your internship completion letter from ${brand(ctx)} is attached. It states the dates of your internship and the work you did. Thank you for your time with us, and all the best for what comes next.`);
  },
};

/* ───────────────────────────── 6. notice of end of engagement ───────────────────────────── */

const ENDINGS = [
  { value: "notice", label: "By notice under the agreement" },
  { value: "term", label: "At the end of the agreed period" },
  { value: "mutual", label: "By mutual agreement" },
  { value: "breach", label: "For breach of the agreement or a policy" },
];

export const endOfEngagement: SignTemplate = {
  id: "end-of-engagement",
  version: "1.0",
  title: "Notice of End of Engagement",
  name: "End of engagement",
  group: "exit",
  kind: "letter",
  parties: ["team"],
  signs: "both",
  blurb: "Tells a team member in writing that the engagement is ending: how, the last day, what is still to be paid and what to return. They sign only to confirm they received it.",
  when: "When an engagement, an internship or an employment is ending",
  series: "HR",
  source: "15_HR_TEAM/03_Onboarding_Checklist.md",
  keep: "Engagement + 8 years",
  lawyer: [
    "For an employee with six months of service or more, check the ending against section 39 of the Karnataka Shops and Commercial Establishments Act, 1961 before this letter is given.",
    "Ending for breach: tell the person what the concern is and hear them first, and keep a record. For a matter involving a learner under 18, follow the Safeguarding Declaration and the reporting duties under the POCSO Act, 2012.",
    "The notice period in the box must be the one in the signed agreement or letter of appointment.",
    "Time limit for paying an employee's final dues: confirm with the CA.",
  ],
  fields: [
    { key: "how", label: "How it ends", kind: "select", default: "notice", options: ENDINGS, help: "Choose 'By notice' when FrameMind gives the notice. When the person has asked to leave, 'By mutual agreement' fits." },
    { key: "lastDay", label: "Last working day", kind: "date", required: true, half: true },
    { key: "noticeDays", label: "Notice period given (days)", kind: "number", half: true, help: "As in the signed agreement or letter of appointment." },
    { key: "reason", label: "Reason (optional, but always for a breach)", kind: "textarea", placeholder: "Left empty, no reason is printed.", help: "Printed exactly as you type it. For a breach, say plainly which rule and when: left empty, the paper has a line for it." },
    { key: "dues", label: "Amounts still to be paid (optional)", kind: "text", placeholder: "Fees for the two client projects delivered in November", help: "Left empty, the letter says that what has been earned is paid in the final settlement." },
  ],
  build(ctx) {
    const J = brand(ctx);
    const { rel, paper } = standing(ctx);
    const how = val(ctx, "how");
    const days = val(ctx, "noticeDays");
    const reason = val(ctx, "reason");
    const dues = inSentence(val(ctx, "dues"));
    const given = days ? ` The notice period given is ${days} days.` : "";
    const blocks: Block[] = [
      { t: "to", lines: addressee(ctx) },
      { t: "subject", text: `Notice of the end of your ${rel} with ${J}` },
      { t: "p", text: dear(ctx) },
      { t: "p", text: `We write to tell you that your ${rel} with ${J} ends on ${b(dateOf(ctx, "lastDay"))}. That is your last day with ${J}.` },
    ];
    if (ctx.blank) {
      blocks.push({ t: "p", text: "It ends (tick one):" }, { t: "checks", items: ENDINGS.map((e) => e.label) }, { t: "p", text: `Notice period: ${line(14)} days.` });
    } else {
      blocks.push({
        t: "p",
        text:
          how === "notice"
            ? `This letter is the written notice of ${J} under your ${paper}. The notice period is ${fill(ctx, "noticeDays", 10)} days.`
            : how === "term"
              ? `It ends because the period agreed in your ${paper} is complete.${given}`
              : how === "mutual"
                ? `It ends by agreement between you and ${J}.${given}`
                : how === "breach"
                  ? `It ends for breach of your ${paper} or of a ${J} policy.${given}`
                  : `It ends ${line(90)}.${given}`,
      });
    }
    // a letter that ends an engagement for a breach always says which breach: without a typed reason it leaves a line
    if (reason || ctx.blank || how === "breach") blocks.push({ t: "p", text: `${b("Reason:")} ${reason || line(130)}` });
    blocks.push(
      {
        t: "p",
        text: dues || ctx.blank ? `Amounts still to be paid to you: ${dues || line(110)}. They are paid in your final settlement.` : "Pay or fees that you have earned up to your last day are paid in your final settlement.",
      },
      { t: "h", text: "What happens now" },
      {
        t: "list",
        items: [
          `Return every camera, lens, computer, device, drive and document that belongs to ${J}, and hand over every client file and login you hold.`,
          `Your access to HQ, shared drives and other ${J} tools ends on your last day.`,
          "Your duty of confidentiality continues after you leave, for as long as the agreement you signed sets out.",
        ],
      },
    );
    if (how !== "breach" || ctx.blank) blocks.push({ t: "p", text: `Thank you for the work you have done with ${J}.` });
    blocks.push(
      { t: "p", text: "Yours sincerely," },
      { t: "sign", blocks: studioSign(ctx, { lines: [] }) },
      { t: "h", text: "Acknowledgement of receipt" },
      { t: "p", text: "I have received this notice. My signature confirms receipt only." },
      { t: "sign", blocks: [partySign(ctx, "Signature", { title: "" })] },
    );
    return blocks;
  },
  cover(ctx) {
    return plain(
      `${hi(ctx)}, attached is a letter about the end of your ${standing(ctx).rel} with ${brand(ctx)}. It gives your last day and what happens before it. Please sign the acknowledgement at the end, which only confirms that you received the letter, and send it back. Call me if you would like to talk it through.`,
    );
  },
};

/* ───────────────────────────── 7. exit clearance and final settlement ───────────────────────────── */

export const exitClearance: SignTemplate = {
  id: "exit-clearance",
  version: "1.0",
  title: "Exit Clearance and Final Settlement",
  name: "Exit clearance",
  group: "exit",
  kind: "form",
  parties: ["team"],
  signs: "both",
  blurb: "The leaving checklist on one page: what was returned, which access was closed, the final amount paid, and the person's declaration.",
  when: "On the last working day",
  series: "HR",
  source: "15_HR_TEAM/03_Onboarding_Checklist.md",
  keep: "Engagement + 8 years",
  lawyer: [
    "Point 2 of the declaration says the settlement does not take away anything the law gives the person (for example gratuity, PF or bonus, where they apply). Confirm the wording.",
    "Time limit for paying an employee's final dues: confirm with the CA.",
    "The TDS certificate (Form 16 or 16A) is still owed to the person after the exit.",
    "How long HR papers are kept: the library now says contracts, pay and tax records for employment plus 8 years, and identity copies for 3 years after the end. Confirm the 8 years with the CA.",
  ],
  fields: [
    { key: "lastDay", label: "Last working day", kind: "date", required: true, half: true },
    { key: "amount", label: "Final amount paid", kind: "money", half: true, help: "Left empty, the paper has a line to write it on." },
    { key: "paidOn", label: "Paid on", kind: "date", half: true },
    { key: "reference", label: "Payment reference (UPI or bank)", kind: "text", half: true },
    { key: "covers", label: "What the amount covers (optional)", kind: "text", placeholder: "Fees for two projects in November, and travel" },
  ],
  build(ctx) {
    const J = brand(ctx);
    const p = ctx.party;
    const item = (text: string) => [text, "", "", ""];
    return [
      { t: "title", text: "Exit Clearance and Final Settlement" },
      {
        t: "table",
        widths: [26, 74],
        rows: [
          ["Name", or(p.name, 70)],
          ["Role", or(p.role, 60)],
          ["Engagement", or(p.engagement, 40)],
          ["Last working day", dateOf(ctx, "lastDay")],
        ],
      },
      { t: "h", text: "Returned and closed" },
      {
        t: "table",
        head: ["Item", "Done", "Date", "Remarks"],
        widths: [46, 10, 16, 28],
        rows: [
          item(`${J} uniform or branded T-shirt`),
          item("ID badge"),
          item("Cameras, lenses, drives, computers and equipment"),
          item("Documents, printed material and class lists"),
          item("HQ login closed"),
          item("Shared drive and tool access removed"),
          item(`Removed from the ${J} WhatsApp groups`),
          item(`Other: ${line(50)}`),
        ],
      },
      { t: "h", text: "Final settlement" },
      {
        t: "table",
        widths: [34, 66],
        rows: [
          ["Final amount paid", moneyWords(ctx, "amount")],
          ["Paid on", dateOf(ctx, "paidOn")],
          ["Payment reference (UPI or bank)", fill(ctx, "reference", 60)],
          ["What the amount covers", fill(ctx, "covers", 90)],
        ],
      },
      { t: "h", text: "Declaration by the team member" },
      {
        t: "list",
        ordered: true,
        items: [
          `I have returned everything that belongs to ${J}, as recorded above.`,
          `I have received the final amount stated above. It settles the pay, fees and expenses due to me from ${J} up to my last working day. It does not take away anything the law gives me.`,
          `I have deleted the ${J} and client files, and the personal data of clients and learners, from my own phone, computer and accounts, and handed back every client login.`,
          "I understand that my duty of confidentiality continues after I leave.",
        ],
      },
      { t: "p", text: `${J} confirms the returns, the closed access and the payment recorded above.` },
      { t: "sign", blocks: [...studioSign(ctx), partySign(ctx, "Team member")] },
    ];
  },
  cover(ctx) {
    return plain(`${hi(ctx)}, attached is your exit clearance and final settlement form from ${brand(ctx)}. It lists what has been returned and the final amount paid to you. Please check it, sign the declaration and send it back, or sign it when we meet on your last day.`);
  },
};

/* ───────────────────────────── 8. asset handover record ───────────────────────────── */

export const assetHandover: SignTemplate = {
  id: "asset-handover",
  version: "1.0",
  title: "Asset Handover Record",
  name: "Asset handover",
  group: "exit",
  kind: "form",
  parties: ["team"],
  signs: "both",
  blurb: "Lists the cameras, lenses, computers and devices handed to a team member, or returned by them, with the care terms. Both sides sign.",
  when: "When studio gear is handed over, and again when it comes back",
  series: "HR",
  source: "15_HR_TEAM/04_Compensation_and_Payroll_Policy.md",
  keep: "Engagement + 8 years",
  lawyer: [
    "Recovering the cost of damage: the pay policy allows it only with written agreement. For an employee, deductions from salary are also limited by wage law. Confirm before any recovery.",
  ],
  fields: [
    {
      key: "direction",
      label: "This record is for",
      kind: "select",
      default: "out",
      half: true,
      options: [
        { value: "out", label: "Items handed over to the team member" },
        { value: "in", label: "Items returned to FrameMind" },
      ],
    },
    { key: "date", label: "Date of handover or return", kind: "date", half: true },
    { key: "items", label: "Items", kind: "textarea", placeholder: "One per line, as: Item | serial number or condition", help: "Left empty, the paper has six empty rows to fill by hand." },
  ],
  build(ctx) {
    const J = brand(ctx);
    const p = ctx.party;
    const back = val(ctx, "direction") === "in";
    const typed = linesOf(ctx, "items").map((row) => {
      const [name, ...rest] = row.split("|").map((s) => s.trim());
      return [name, rest.filter(Boolean).join(", ")];
    });
    const rows = typed.length ? typed.map(([name, detail], i) => [String(i + 1), name, detail]) : Array.from({ length: 6 }, (_, i) => [String(i + 1), "", ""]);
    const who = or(p.name, 60);
    const blocks: Block[] = [
      { t: "title", text: "Asset Handover Record" },
      {
        t: "table",
        widths: [26, 74],
        rows: [
          ["Name", or(p.name, 70)],
          ["Role", or(p.role, 60)],
          [ctx.blank ? "Date" : back ? "Date of return" : "Date of handover", dateOf(ctx, "date")],
        ],
      },
    ];
    if (ctx.blank) blocks.push({ t: "p", text: "This record is for (tick one):" }, { t: "checks", items: [`Items handed over by ${J} to the team member`, `Items returned to ${J} by the team member`] });
    else blocks.push({ t: "p", text: back ? `The items listed below were ${b(`returned to ${J}`)} by ${who}.` : `The items listed below were ${b(`handed over by ${J}`)} to ${who}.` });
    blocks.push({ t: "table", head: ["No.", "Item", "Serial number or condition"], widths: [8, 46, 46], rows });
    if (!back || ctx.blank) {
      blocks.push(
        { t: "h", text: ctx.blank ? "When items are handed over: care of the items" : "Care of the items" },
        {
          t: "list",
          ordered: true,
          items: [
            `The items belong to ${J} and are given for the work of ${J} only.`,
            "Use them with care and keep them safe. Never leave camera bags or laptops unattended in a vehicle.",
            "Report loss or damage to a founder honestly and at once.",
            "The cost of damage caused by negligence is recovered only with the written agreement of the team member.",
            `Return the items when ${J} asks, or when the engagement ends.`,
          ],
        },
      );
    }
    if (back || ctx.blank) {
      blocks.push(
        { t: "h", text: ctx.blank ? "When items are returned" : "On return" },
        {
          t: "p",
          text: `${J} confirms that it has received the items listed, in the condition noted. This record covers only the items listed.${ctx.blank ? "" : " The cost of damage caused by negligence is recovered only with the written agreement of the team member."}`,
        },
      );
    }
    blocks.push({
      t: "sign",
      blocks: [...studioSign(ctx, { heading: ctx.blank ? `For ${J}` : back ? `Received for ${J}` : `Handed over for ${J}` }), partySign(ctx, ctx.blank ? "Team member" : back ? "Returned by" : "Received by")],
    });
    return blocks;
  },
  cover(ctx) {
    const back = val(ctx, "direction") === "in";
    return plain(`${hi(ctx)}, attached is the record of the ${brand(ctx)} items ${back ? "you returned to us" : "handed over to you"}. Please check the list against what you ${back ? "gave back" : "have"}, sign it and send it back. Tell me at once if anything on the list is wrong.`);
  },
};

/* ───────────────────────────── 9. letter of authority ───────────────────────────── */

export const authorityLetter: SignTemplate = {
  id: "authority-letter",
  version: "1.0",
  title: "Letter of Authority",
  name: "Authority letter",
  group: "exit",
  kind: "letter",
  parties: ["team", "other"],
  signs: "both",
  blurb: "Authorises a named person to do one stated thing for FrameMind, between two dates, with their specimen signature on the letter.",
  when: "When someone has to act for FrameMind at a bank, an office, a supplier or a client",
  series: "HR",
  source: "20_COMPLIANCE/02_Contracts_and_Records_Retention.md",
  keep: "Validity + 8 years",
  lawyer: [
    "This is a simple letter of authority, not a power of attorney. A bank, a government office, a registration or a court may need its own form, a resolution or a stamped power of attorney.",
    "Who can give authority for the business depends on how it is set up (proprietorship, partnership, LLP or company). Confirm that one founder's signature is enough.",
    "Do not use this letter to let anyone sign contracts, borrow money or operate a bank account.",
    "The retention schedule has no line for letters of authority. This one is kept like correspondence, for 8 years after it expires: confirm.",
  ],
  fields: [
    { key: "addressedTo", label: "Addressed to", kind: "textarea", default: "To whom it may concern", help: "A name and address, one line each, or leave it as it is." },
    { key: "authority", label: "What the person is authorised to do", kind: "textarea", required: true, placeholder: "Collect the rented lighting kit booked in the name of FrameMind AI Studio, and sign the delivery receipt for it.", help: "One clear task. Printed exactly as you type it." },
    { key: "validFrom", label: "Valid from", kind: "date", half: true, help: "Left empty, the letter is valid from its own date." },
    { key: "validUntil", label: "Valid until", kind: "date", required: true, half: true },
    { key: "idType", label: "Identity document (optional)", kind: "text", placeholder: "Driving licence", half: true, help: "The type only. Never ask for an Aadhaar number." },
    { key: "idLast4", label: "Last four digits of its number (optional)", kind: "text", placeholder: "4321", half: true, help: "Only the last four digits, never the full number." },
  ],
  build(ctx) {
    const J = brand(ctx);
    const p = ctx.party;
    const person = p.kind === "team" ? p.name : p.person || p.name;
    const firm = p.kind !== "team" && p.person ? p.name : "";
    // "Asha Rao, Video Editor with FrameMind," or "R. Kumar, Proprietor, Kumar Rentals," or the name alone
    const about = [p.role && `${p.role}${p.kind === "team" ? ` with ${J}` : ""}`, firm].filter(Boolean).join(", ");
    const who = `${b(or(person, 60))}${about ? `, ${about},` : ""}`;
    const to = linesOf(ctx, "addressedTo");
    const authority = val(ctx, "authority");
    const from = val(ctx, "validFrom") || ctx.blank ? dateOf(ctx, "validFrom") : "the date of this letter";
    const c = ctx.company;
    const reach = [c.phone, c.email].filter(Boolean).join(" or ");
    const specimen: SignBlock = { ...partySign(ctx, "Authorised person: specimen signature", { seal: false, lines: [] }), name: person };
    return [
      !to.length ? { t: "to", lines: [line(70)] } : /^to whom/i.test(to[0]) ? { t: "p", text: b(to[0]) } : { t: "to", lines: to },
      { t: "subject", text: "Letter of authority" },
      { t: "p", text: `This is to confirm that ${who} is authorised to do the following on behalf of ${J}:` },
      { t: "note", text: authority || writeLines(3, 150) },
      { t: "p", text: `This authority is valid from ${b(from)} until ${b(dateOf(ctx, "validUntil"))}. It covers only what is stated above. It cannot be passed on to another person, and ${J} may withdraw it in writing at any time.` },
      ...(val(ctx, "idType") || val(ctx, "idLast4") || ctx.blank ? [{ t: "p", text: `Identity document of the authorised person: ${fill(ctx, "idType", 44)}, number ending in ${fill(ctx, "idLast4", 16)}.` } as Block] : []),
      { t: "p", text: `The signature of the authorised person is given below so that it can be checked.${reach ? ` To confirm this letter, contact ${J} at ${reach}.` : ""}` },
      { t: "sign", blocks: [specimen, ...studioSign(ctx, { lines: [] })] },
    ];
  },
  cover(ctx) {
    const p = ctx.party;
    const person = p.kind === "team" ? p.name : p.person || p.name;
    return plain(`Hi ${firstName(person) || "there"}, attached is a letter of authority from ${brand(ctx)} in your name, valid until ${dateOf(ctx, "validUntil")}. Please sign in the specimen signature space, and carry the signed letter with a government identity document when you act on it. It covers only the task written in the letter.`);
  },
};

/* ───────────────────────────── the list, in the order HQ shows it ───────────────────────────── */

export const TEAM_LETTERS: SignTemplate[] = [
  internshipOffer,
  appointmentLetter,
  confirmationLetter,
  experienceLetter,
  internshipCompletion,
  endOfEngagement,
  exitClearance,
  assetHandover,
  authorityLetter,
];
