/** Company settings stored in data/settings.json (object, not array). Editable in HQ → Settings. */
export interface CompanySettings {
  legalName: string;
  brandName: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  stateCode: string;
  pincode: string;
  phone: string;
  email: string;
  website: string;
  /** registered under GST? Off: no GST on new quotes, invoices or the website (turn on once registered) */
  gstRegistered: boolean;
  gstin: string;
  pan: string;
  sacCode: string;
  /** Udyam (MSME) registration number, printed on the letterhead, quotes and invoices when set */
  udyamNumber: string;
  bankAccountName: string;
  bankName: string;
  bankAccountNumber: string;
  bankIfsc: string;
  upiId: string;
  invoicePrefix: string;
  nextInvoiceNumber: number;
  proposalPrefix: string;
  nextProposalNumber: number;
  poPrefix: string;
  nextPoNumber: number;
  orderPrefix: string;
  nextOrderNumber: number;
  certificatePrefix: string;
  financialYear: string;
  signatoryName: string;
  signatoryTitle: string;
  invoiceTerms: string;
  baseLocation: string;
  monthlyRevenueTarget: number;
  projectsPerMonthTarget: number;
  fuelCostPerKm: number;
  /** who receives the morning email, separated by commas (empty: no email) */
  digestEmails: string;
  updatedAt?: string;
  updatedBy?: string;
}

export const defaultSettings: CompanySettings = {
  legalName: "FrameMind AI Studio",
  brandName: "FrameMind",
  addressLine1: "",
  addressLine2: "",
  city: "Gadag",
  state: "Karnataka",
  stateCode: "29",
  pincode: "",
  phone: "+91 80730 87576",
  email: "framemindaistudio@gmail.com",
  website: "www.framemindaistudio.com",
  gstRegistered: false,
  gstin: "",
  pan: "",
  // IT design and development services; change it per invoice line for photo / video work if your CA advises
  sacCode: "998314",
  udyamNumber: "",
  bankAccountName: "",
  bankName: "",
  bankAccountNumber: "",
  bankIfsc: "",
  upiId: "",
  invoicePrefix: "FM/26-27/",
  nextInvoiceNumber: 1,
  proposalPrefix: "FM-Q-",
  nextProposalNumber: 1,
  poPrefix: "FM-PO-",
  nextPoNumber: 1,
  // Vritta licence numbers
  orderPrefix: "FM-VR-",
  nextOrderNumber: 1,
  certificatePrefix: "FM-26-",
  financialYear: "2026-27",
  signatoryName: "Chinmay R M",
  signatoryTitle: "Founder",
  invoiceTerms:
    "Payment in milestones as agreed in the quote — usually 50% to start and 50% on delivery. Source files are handed over once the final payment is received. Bank transfer / UPI to the account below; international clients may pay by bank transfer or Wise. Prices in INR.",
  baseLocation: "Gadag, Karnataka",
  monthlyRevenueTarget: 0,
  projectsPerMonthTarget: 0,
  fuelCostPerKm: 9,
  digestEmails: "",
};

export const SETTINGS_PATH = "data/settings.json";
