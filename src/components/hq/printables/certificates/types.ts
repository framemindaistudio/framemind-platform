/** Certificate types, wording and the record shape shared by the issue flow, the print sheet and /verify. */

export interface CertRecord {
  id: string;
  code: string;
  studentName: string;
  /** the line under the name: a role and dates for an intern, a profession for a learner */
  detail?: string;
  program?: string;
  type?: string;
  issueDate?: string;
  status?: string;
  learnerId?: string;
  batch?: string;
}

export interface CertTypeMeta {
  /** the value stored on the record (the options of the certificates collection) */
  value: string;
  /** Printed headline, e.g. "Certificate of Completion". */
  title: string;
  /** Small label above the name. */
  presentedTo: string;
  /** Sentence lead-in that precedes the programme name. */
  citation: string;
  /** what to suggest for the programme line */
  program: string;
}

export const CERT_TYPES: CertTypeMeta[] = [
  { value: "AI Coaching — completion", title: "Certificate of Completion", presentedTo: "This certificate is awarded to", citation: "for successfully completing", program: "90-Day 1:1 AI Coaching" },
  { value: "Internship", title: "Certificate of Internship", presentedTo: "This certificate is awarded to", citation: "for completing an internship with FrameMind AI Studio as", program: "Design & Development Intern" },
  { value: "Workshop participation", title: "Certificate of Participation", presentedTo: "This certificate is presented to", citation: "for taking part in", program: "AI for Business: a hands-on workshop" },
  { value: "Merit", title: "Certificate of Merit", presentedTo: "This certificate of merit is awarded to", citation: "in recognition of outstanding work in", program: "" },
  { value: "Appreciation", title: "Certificate of Appreciation", presentedTo: "This certificate is presented to", citation: "with thanks for", program: "" },
];

export const certMeta = (type?: string): CertTypeMeta => CERT_TYPES.find((t) => t.value === type) ?? CERT_TYPES[0];
