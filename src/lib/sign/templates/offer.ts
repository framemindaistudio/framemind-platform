/**
 * Offer letter for an employee (full-time or part-time).
 * Pay rules follow OPERATIONS/15_HR_TEAM/04_Compensation_and_Payroll_Policy.md, leave follows 15_HR_TEAM/06, and the
 * joining conditions follow 15_HR_TEAM/03_Onboarding_Checklist.md. Where the library sets no rule (probation, notice)
 * the box carries a usual figure that the founder may change.
 */
import { addressee, b, dateOf, docDate, fill, firstName, brand, studioSign, line, moneyWords, or, partySign, plain, val } from "../text";
import type { SignTemplate } from "../types";

export const offerLetter: SignTemplate = {
  id: "offer-letter",
  version: "1.0",
  title: "Offer of Employment",
  name: "Offer letter",
  group: "joining",
  kind: "letter",
  parties: ["team"],
  signs: "both",
  blurb: "Offers a role to an employee: position, start date, salary, probation and what must be signed before joining.",
  when: "When a full-time or part-time hire is agreed, before the start date",
  series: "HR",
  source: "15_HR_TEAM/04_Compensation_and_Payroll_Policy.md",
  keep: "Employment + 8 years",
  requiredFor: ["Full-time", "Part-time"],
  lawyer: [
    "Probation (3 months) and notice (7 days in probation, 30 days after) are usual figures, not company policy yet: confirm them before the first hire.",
    "PF, ESI and professional tax start at set thresholds: confirm with the CA which apply at the salary offered.",
    "Leave is by the Leave and Attendance Policy, whose figures are still marked 'to confirm': settle them before the first employee joins.",
    "Karnataka Shops and Commercial Establishments Act: registration from the first hire, any appointment order it requires, and its rules on working hours, the weekly day off and work on a shoot day.",
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
    { key: "acceptBy", label: "Sign and return by", kind: "date", half: true },
  ],
  build(ctx) {
    const J = brand(ctx);
    const duties = val(ctx, "duties").split("\n").map((s) => s.trim()).filter(Boolean);
    const hours = val(ctx, "hours");
    const months = val(ctx, "probation");
    return [
      { t: "to", lines: addressee(ctx) },
      { t: "subject", text: `Offer of employment: ${fill(ctx, "role", 50)}` },
      { t: "p", text: `Dear ${firstName(ctx.party.name) || or("", 40)},` },
      { t: "p", text: `We are glad to offer you the position of ${b(fill(ctx, "role", 50))} with ${J}. The terms of the offer are set out below.` },
      {
        t: "table",
        widths: [34, 66],
        rows: [
          ["Position", fill(ctx, "role", 60)],
          ["Type of employment", fill(ctx, "engagement", 40)],
          ["Start date", dateOf(ctx, "start")],
          ["Place of work", `${fill(ctx, "place", 40)}, remote where agreed, and client locations and shoots when assigned`],
          ["Reports to", fill(ctx, "reportsTo", 50)],
          ["Monthly salary", `${moneyWords(ctx, "salary")}, before the deductions the law requires`],
          ["Paid", `${fill(ctx, "payDay", 50)}, by bank transfer or UPI`],
          ["Probation", `${months || line(10)} ${months === "1" ? "month" : "months"} from the start date`],
          ["Notice", `${fill(ctx, "noticeProbation", 10)} days by either side during probation; ${fill(ctx, "notice", 10)} days after confirmation`],
        ],
      },
      { t: "h", text: "Your work" },
      duties.length ? { t: "list", items: duties } : { t: "p", text: `Your responsibilities are those in the job description for the role, which we have shared with you, and the reasonable tasks your manager assigns.` },
      {
        t: "p",
        text: `${hours || ctx.blank ? `Working days and hours: ${fill(ctx, "hours", 70)}. ` : ""}Client deadlines and shoot days are commitments to a client. They are planned in advance, and you are expected to keep the ones you are assigned.`,
      },
      { t: "h", text: "Salary, deductions and leave" },
      { t: "p", text: `Provident fund, ESI, professional tax and income tax are deducted where the law applies them to your salary. Leave is as set out in the ${J} Leave and Attendance Policy in force, and never less than the law gives you.` },
      { t: "h", text: "Before you join" },
      { t: "p", text: "This offer depends on the following, to be completed on or before your start date:" },
      {
        t: "list",
        items: [
          "A copy of a government identity document.",
          `Your signature on the Non-Disclosure and Intellectual Property Agreement, the Code of Conduct, and the Data Security Undertaking.`,
          "If you will coach or film learners under 18: the Safeguarding Declaration for work with minors.",
          "The Joining Details Form, with your PAN, your bank or UPI details for salary, and an emergency contact.",
        ],
      },
      { t: "p", text: `${J} handles its clients' files, accounts and unreleased work. You will complete the data-security briefing before you get access to client work.` },
      { t: "p", text: `A Letter of Appointment with the full terms of employment will be given to you on the day you join.` },
      { t: "p", text: `To accept, sign the acceptance below and return this letter${val(ctx, "acceptBy") || ctx.blank ? ` by ${b(dateOf(ctx, "acceptBy"))}. The offer lapses after that date` : ""}.` },
      { t: "p", text: "We look forward to working with you." },
      { t: "p", text: "Yours sincerely," },
      { t: "sign", blocks: studioSign(ctx, { lines: [] }) },
      { t: "h", text: "Acceptance" },
      { t: "p", text: `I accept this offer on the terms above and will join ${J} on ${dateOf(ctx, "start")}.` },
      { t: "sign", blocks: [partySign(ctx, "Signature", { title: "" })] },
    ];
  },
  cover(ctx) {
    const by = dateOf(ctx, "acceptBy");
    return plain(`Hi ${firstName(ctx.party.name) || "there"}, it is a pleasure to send you the offer to join ${brand(ctx)} as ${fill(ctx, "role", 20)}. The letter is attached. Please read it, sign the acceptance at the end and send it back${val(ctx, "acceptBy") ? ` by ${by}` : ""}. Call me if you would like to talk through any part of it. (Dated ${docDate(ctx)}.)`);
  },
};
