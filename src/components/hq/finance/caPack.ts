/**
 * The pack for FrameMind's Chartered Accountant: every register the CA works from for a month, a quarter or the
 * financial year, the bills behind the expenses, and a list of what to fix before sending it.
 *
 *   00_Summary.csv              the period's totals in one place
 *   00_Check_before_sending.csv what is missing or looks wrong (also shown on screen)
 *   01_Sales_register.csv       every invoice dated in the period (cancelled ones too, so the numbering is complete)
 *   02_Receipts_register.csv    every payment received (net, and the TDS the client deducted) and other income
 *   03_Expense_register.csv     every expense, with the GST in the bill and the file name of the bill
 *   04_Payroll_register.csv     salaries, stipends and per-unit (freelance) pay for the months in the period
 *   05_Profit_and_loss.csv      month by month, revenue ex-GST
 *   06_GST_summary.csv          output tax on invoices against input tax in bills, month by month
 *   07_Receivables.csv          what clients still owed at the end of the period
 *   08_TDS_by_customers.csv     TDS deducted by clients, to check against Form 26AS
 *   Bills/…                     the bill files uploaded to HQ (linked bills are listed, not included)
 *
 * Pure functions only: CaPackTab.tsx shows them and builds the ZIP.
 */
import { invoiceTotals } from "@/lib/hq/collections";
import type { CompanySettings } from "@/lib/hq/settings";
import { day, fmtDate, gstSummary, inPeriod, invoiceMath, isIssued, monthLabel, num, PAY_MODE_LABELS, plStatement, round2, str, toCsv, type Ledger, type Period, type Rec } from "./finance";

export type PeriodKind = "month" | "quarter" | "fy";

/** Months (YYYY-MM) inside a period. */
export function monthsIn(p: Period): string[] {
  const out: string[] = [];
  let [y, m] = p.start.slice(0, 7).split("-").map(Number);
  const [ey, em] = p.end.slice(0, 7).split("-").map(Number);
  while (y < ey || (y === ey && m <= em)) {
    out.push(`${y}-${String(m).padStart(2, "0")}`);
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
  }
  return out;
}

/** Quarter q (1–4) of the Indian financial year starting in April of `fyStart`. */
export function quarterPeriod(fyStart: number, q: number): Period {
  const startMonth = 4 + (q - 1) * 3; // 4, 7, 10, 13
  const y = startMonth > 12 ? fyStart + 1 : fyStart;
  const sm = ((startMonth - 1) % 12) + 1;
  const em = sm + 2;
  const last = new Date(Date.UTC(y, em, 0)).getUTCDate();
  const names = ["Apr–Jun", "Jul–Sep", "Oct–Dec", "Jan–Mar"];
  return { key: `q:${fyStart}-${q}`, label: `Q${q} ${names[q - 1]} (FY ${fyStart}–${String(fyStart + 1).slice(2)})`, start: `${y}-${String(sm).padStart(2, "0")}-01`, end: `${y}-${String(em).padStart(2, "0")}-${last}` };
}

const GSTIN_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
const csvText = (rows: (string | number | null | undefined)[][]) => "﻿" + toCsv(rows); // BOM: Excel opens ₹ and Kannada names right
const modeLabel = (m: unknown) => PAY_MODE_LABELS[str(m)] ?? str(m);

export interface Issue {
  level: "fix" | "check";
  area: "Settings" | "Invoices" | "Expenses" | "Payments" | "Payroll";
  text: string;
  /** where to fix it in HQ */
  href?: string;
}

export interface Bill {
  /** vault path to fetch */
  path: string;
  /** name inside the ZIP, under Bills/ */
  name: string;
}

export interface CaPack {
  period: Period;
  files: { name: string; text: string }[];
  bills: Bill[];
  issues: Issue[];
  summary: { label: string; value: number | string }[];
}

interface Inputs {
  period: Period;
  ledger: Ledger;
  invoices: Rec[];
  expenses: Rec[];
  income: Rec[];
  payroll: Rec[];
  team: Rec[];
  settings: CompanySettings;
  generatedAt: string;
}

const safeName = (s: string) => s.replace(/[^\w.-]+/g, "_").replace(/_+/g, "_").slice(0, 60);

export function buildCaPack({ period: p, ledger: L, invoices, expenses, income, payroll, team, settings, generatedAt }: Inputs): CaPack {
  const issues: Issue[] = [];
  const months = monthsIn(p);
  const sac = str(settings.sacCode);

  /* ── settings ── */
  if (!str(settings.gstin)) issues.push({ level: "fix", area: "Settings", text: "No GSTIN in Settings: the registers and invoices go out without the studio's GSTIN.", href: "/hq/settings" });
  else if (!GSTIN_RE.test(str(settings.gstin).toUpperCase())) issues.push({ level: "fix", area: "Settings", text: `The studio's GSTIN in Settings (${str(settings.gstin)}) is not a valid 15-character GSTIN.`, href: "/hq/settings" });
  if (!str(settings.pan)) issues.push({ level: "check", area: "Settings", text: "No PAN in Settings.", href: "/hq/settings" });

  /* ── sales register ── */
  const inPeriodInv = invoices.filter((inv) => inPeriod(day(inv.date), p)).sort((a, b) => day(a.date).localeCompare(day(b.date)) || str(a.number).localeCompare(str(b.number)));
  const sales: (string | number)[][] = [["Invoice no.", "Invoice date", "Customer", "Customer GSTIN", "Type", "Place of supply", "SAC", "Taxable value", "GST %", "CGST", "SGST", "IGST", "Invoice total", "Status", "Received to date (net)", "TDS by customer", "Balance due", "Project"]];
  for (const inv of inPeriodInv) {
    const status = str(inv.status) || "draft";
    const gstin = str(inv.customerGstin).toUpperCase();
    const no = str(inv.number) || "(no number)";
    if (status === "draft") {
      issues.push({ level: "fix", area: "Invoices", text: `Draft invoice ${no} dated ${fmtDate(inv.date)} for ${str(inv.customerName)}: issue it or delete it, so the registers are final.`, href: `/hq/finance?tab=invoices&id=${inv.id}` });
      continue;
    }
    if (status === "cancelled") {
      sales.push([no, day(inv.date), str(inv.customerName), gstin, "Cancelled", str(inv.placeOfSupply), "", 0, num(inv.gstPercent), 0, 0, 0, 0, "Cancelled", 0, 0, 0, str(inv.projectId)]);
      continue;
    }
    const m = invoiceMath(inv, settings);
    const itemSac = Array.isArray(inv.items) ? str((inv.items as { sac?: string }[]).find((i) => i?.sac)?.sac) : "";
    sales.push([no, day(inv.date), str(inv.customerName), gstin, gstin ? "B2B" : "B2C", str(inv.placeOfSupply), itemSac || sac, m.taxable, m.gstPercent, m.cgst, m.sgst, m.igst, m.total, status, m.received, m.tds, m.balance, str(inv.projectId)]);
    if (!str(inv.number)) issues.push({ level: "fix", area: "Invoices", text: `An invoice dated ${fmtDate(inv.date)} for ${str(inv.customerName)} has no number.`, href: `/hq/finance?tab=invoices&id=${inv.id}` });
    if (!str(inv.placeOfSupply)) issues.push({ level: "fix", area: "Invoices", text: `Invoice ${no} has no place of supply, so CGST/SGST or IGST cannot be decided.`, href: `/hq/finance?tab=invoices&id=${inv.id}` });
    if (gstin && !GSTIN_RE.test(gstin)) issues.push({ level: "fix", area: "Invoices", text: `Invoice ${no}: the customer GSTIN “${gstin}” is not a valid 15-character GSTIN.`, href: `/hq/finance?tab=invoices&id=${inv.id}` });
  }
  // gaps in the numbering of the period's invoices (same prefix, consecutive numbers expected)
  const nums = inPeriodInv
    .map((inv) => /^(.*?)(\d+)$/.exec(str(inv.number)))
    .filter((x): x is RegExpExecArray => !!x)
    .map((x) => ({ prefix: x[1], n: Number(x[2]), width: x[2].length }));
  const byPrefix = new Map<string, number[]>();
  const widthOf = new Map<string, number>();
  for (const x of nums) {
    byPrefix.set(x.prefix, [...(byPrefix.get(x.prefix) ?? []), x.n]);
    widthOf.set(x.prefix, Math.max(widthOf.get(x.prefix) ?? 0, x.width));
  }
  for (const [prefix, list] of byPrefix) {
    const sorted = [...new Set(list)].sort((a, b) => a - b);
    const missing: number[] = [];
    for (let i = 1; i < sorted.length; i++) for (let k = sorted[i - 1] + 1; k < sorted[i] && missing.length < 10; k++) missing.push(k);
    if (missing.length) issues.push({ level: "check", area: "Invoices", text: `Invoice numbers missing between the period's invoices: ${missing.map((k) => `${prefix}${String(k).padStart(widthOf.get(prefix) ?? 1, "0")}`).join(", ")}. Explain them to the CA (deleted drafts?) or find them.` });
  }

  /* ── receipts register ── */
  const receipts: (string | number)[][] = [["Date", "Kind", "Invoice no.", "Received from", "Amount received (net)", "TDS deducted", "Mode", "Reference / UTR", "Note"]];
  const tdsRows: (string | number)[][] = [["Date", "Invoice no.", "Customer", "Customer GSTIN", "Amount received (net)", "TDS deducted", "Reference / UTR"]];
  for (const inv of invoices) {
    if ((str(inv.status) || "draft") === "cancelled") continue;
    for (const pay of invoiceMath(inv, settings).payments) {
      if (!inPeriod(pay.date, p)) continue;
      receipts.push([pay.date, "Invoice payment", str(inv.number), str(inv.customerName), pay.amount, pay.tds || 0, modeLabel(pay.mode), pay.reference || "", pay.synthetic ? "Recorded as one amount on the invoice (no payment date): check the date" : pay.note || ""]);
      if (pay.tds) tdsRows.push([pay.date, str(inv.number), str(inv.customerName), str(inv.customerGstin).toUpperCase(), pay.amount, pay.tds, pay.reference || ""]);
      if (pay.synthetic) issues.push({ level: "check", area: "Payments", text: `Invoice ${str(inv.number)}: the amount received was recorded without a payment date or reference. Add the payment entries.`, href: `/hq/finance?tab=invoices&id=${inv.id}` });
      else if (pay.amount && pay.mode !== "cash" && !pay.reference) issues.push({ level: "check", area: "Payments", text: `Payment of ₹${pay.amount} on ${fmtDate(pay.date)} for invoice ${str(inv.number)} has no reference / UTR.`, href: `/hq/finance?tab=invoices&id=${inv.id}` });
    }
  }
  for (const r of income.filter((r) => inPeriod(day(r.date), p)).sort((a, b) => day(a.date).localeCompare(day(b.date)))) {
    receipts.push([day(r.date), `Other income: ${str(r.stream) || "Other"}`, "", str(r.from), num(r.amount), 0, modeLabel(r.mode), str(r.reference), str(r.description)]);
  }
  receipts.splice(1, receipts.length - 1, ...receipts.slice(1).sort((a, b) => String(a[0]).localeCompare(String(b[0]))));

  /* ── expense register and bills ── */
  const bills: Bill[] = [];
  const expRows: (string | number)[][] = [["Date", "Category", "Paid to", "Description", "Amount (incl. GST)", "GST in bill", "Amount before GST", "Mode", "Paid by", "Needs reimbursement", "Reimbursed", "Project", "Bill"]];
  const exps = expenses.filter((r) => inPeriod(day(r.date), p)).sort((a, b) => day(a.date).localeCompare(day(b.date)));
  exps.forEach((r, i) => {
    const amount = num(r.amount);
    const gst = num(r.gstAmount);
    const receipt = str(r.receipt).trim();
    let bill = "MISSING";
    if (/^https?:\/\//i.test(receipt)) bill = receipt;
    else if (receipt.startsWith("vault/")) {
      const ext = /\.[a-z0-9]{2,5}$/i.exec(receipt)?.[0] ?? "";
      bill = `Bills/${String(i + 1).padStart(3, "0")}_${day(r.date)}_${safeName(str(r.vendor) || str(r.category) || "bill")}${ext}`;
      bills.push({ path: receipt, name: bill });
    }
    expRows.push([day(r.date), str(r.category), str(r.vendor), str(r.description), amount, gst, round2(amount - gst), modeLabel(r.mode), str(r.paidBy), r.reimbursable ? "Yes" : "No", r.reimbursable ? (r.reimbursed ? "Yes" : "No") : "", str(r.projectId), bill]);
    const what = `${fmtDate(r.date)} · ₹${amount} · ${str(r.vendor) || str(r.description) || str(r.category)}`;
    if (bill === "MISSING") issues.push({ level: amount >= 500 || gst > 0 ? "fix" : "check", area: "Expenses", text: `No bill attached: ${what}.`, href: "/hq/finance?tab=expenses" });
    else if (bill.startsWith("http")) issues.push({ level: "check", area: "Expenses", text: `The bill is a link, so it is not in the ZIP: ${what}. Send it with the pack, or upload the file to HQ.`, href: "/hq/finance?tab=expenses" });
    if (gst > amount) issues.push({ level: "fix", area: "Expenses", text: `GST in the bill is more than the amount: ${what}.`, href: "/hq/finance?tab=expenses" });
    if (gst > 0 && !str(r.vendor)) issues.push({ level: "check", area: "Expenses", text: `GST is claimed but “Paid to” is empty: ${what}. The CA needs the supplier for input tax credit.`, href: "/hq/finance?tab=expenses" });
    if (r.reimbursable && !r.reimbursed) issues.push({ level: "check", area: "Expenses", text: `Not yet reimbursed to ${str(r.paidBy)}: ${what}.`, href: "/hq/finance?tab=expenses" });
  });

  /* ── payroll register ── */
  const nameOf = new Map(team.map((t) => [t.id, t]));
  const pay: (string | number)[][] = [["Month", "Name", "Engagement", "Fixed pay", "Units", "Rate per unit", "Allowances", "Bonus", "Deductions", "TDS", "Net pay", "Status", "Paid on", "Mode", "Reference / UTR"]];
  for (const r of payroll.filter((r) => months.includes(str(r.month).slice(0, 7))).sort((a, b) => str(a.month).localeCompare(str(b.month)))) {
    const t = nameOf.get(str(r.memberId));
    const name = str(t?.name) || "(unknown member)";
    pay.push([str(r.month).slice(0, 7), name, str(t?.type), num(r.fixedPay), num(r.units), num(r.unitRate), num(r.allowances), num(r.bonus), num(r.deductions), num(r.tds), num(r.netPay), str(r.status) || "pending", day(r.paidOn), modeLabel(r.mode), str(r.reference)]);
    if ((str(r.status) || "pending") !== "paid") issues.push({ level: "check", area: "Payroll", text: `${monthLabel(str(r.month).slice(0, 7))} pay for ${name} is not marked paid.`, href: "/hq/team?tab=payroll" });
  }

  /* ── P&L, GST, receivables ── */
  const pl = plStatement(L, months);
  const plRows: (string | number)[][] = [["Line", ...pl.months.map((m) => monthLabel(m)), "Total"]];
  plRows.push(["REVENUE (ex-GST)"]);
  for (const r of pl.revenue) plRows.push([r.label, ...r.values, r.total]);
  plRows.push([pl.revenueTotal.label, ...pl.revenueTotal.values, pl.revenueTotal.total]);
  plRows.push(["EXPENSES (incl. GST paid)"]);
  for (const r of pl.expenses) plRows.push([r.label, ...r.values, r.total]);
  plRows.push([pl.expenseTotal.label, ...pl.expenseTotal.values, pl.expenseTotal.total]);
  plRows.push([pl.net.label, ...pl.net.values, pl.net.total]);

  const gst = gstSummary(L, months);
  const gstRows: (string | number)[][] = [["Month", "Invoices", "Taxable value", "CGST", "SGST", "IGST", "Output tax", "Input tax in bills", "Net (output − input)"]];
  for (const g of gst) gstRows.push([g.label, g.invoices, g.taxable, g.cgst, g.sgst, g.igst, g.output, g.input, g.net]);
  const gt = gst.reduce((s, g) => ({ taxable: s.taxable + g.taxable, cgst: s.cgst + g.cgst, sgst: s.sgst + g.sgst, igst: s.igst + g.igst, output: s.output + g.output, input: s.input + g.input, invoices: s.invoices + g.invoices }), { taxable: 0, cgst: 0, sgst: 0, igst: 0, output: 0, input: 0, invoices: 0 });
  gstRows.push(["Total", gt.invoices, gt.taxable, gt.cgst, gt.sgst, gt.igst, gt.output, gt.input, round2(gt.output - gt.input)]);

  // receivables as they stood on the last day of the period: payments dated after it are not counted
  const recv: (string | number)[][] = [["Invoice no.", "Invoice date", "Customer", "Due date", "Invoice total", "Settled by period end (net + TDS)", "Balance at period end", "Days past due at period end"]];
  let receivableTotal = 0;
  for (const inv of invoices) {
    if (!isIssued(inv) || !day(inv.date) || day(inv.date) > p.end) continue;
    const m = invoiceMath(inv, settings);
    const settled = round2(m.payments.filter((x) => x.date <= p.end).reduce((s, x) => s + x.amount + (x.tds || 0), 0));
    const total = round2(invoiceTotals(inv).total);
    const balance = round2(total - settled);
    if (balance <= 0.5) continue;
    receivableTotal += balance;
    const due = day(inv.dueDate) || day(inv.date);
    const past = Math.max(0, Math.round((Date.parse(p.end) - Date.parse(due)) / 86400000));
    recv.push([str(inv.number), day(inv.date), str(inv.customerName), due, total, settled, balance, past]);
  }

  /* ── summary ── */
  const salesTaxable = round2(gt.taxable);
  const otherIncome = round2(income.filter((r) => inPeriod(day(r.date), p)).reduce((s, r) => s + num(r.amount), 0));
  const expenseTotal = round2(exps.reduce((s, r) => s + num(r.amount), 0));
  const collected = round2(receipts.slice(1).reduce((s, r) => s + Number(r[4] || 0), 0));
  const tdsTotal = round2(tdsRows.slice(1).reduce((s, r) => s + Number(r[5] || 0), 0));
  const payrollNet = round2(pay.slice(1).reduce((s, r) => s + Number(r[10] || 0), 0));
  const fixCount = issues.filter((i) => i.level === "fix").length;
  const summary: { label: string; value: number | string }[] = [
    { label: "Company", value: str(settings.legalName) || str(settings.brandName) || "FrameMind AI Studio" },
    { label: "GSTIN", value: str(settings.gstin) || "(not set)" },
    { label: "PAN", value: str(settings.pan) || "(not set)" },
    { label: "Period", value: `${p.label} (${p.start} to ${p.end})` },
    { label: "Prepared", value: generatedAt },
    { label: "Invoices issued", value: gt.invoices },
    { label: "Sales, taxable value", value: salesTaxable },
    { label: "Output CGST", value: round2(gt.cgst) },
    { label: "Output SGST", value: round2(gt.sgst) },
    { label: "Output IGST", value: round2(gt.igst) },
    { label: "Input GST in bills (as entered; the CA decides what is claimable)", value: round2(gt.input) },
    { label: "Other income", value: otherIncome },
    { label: "Expenses (incl. GST paid)", value: expenseTotal },
    { label: "Net (revenue ex-GST − expenses)", value: round2(salesTaxable + otherIncome - expenseTotal) },
    { label: "Money received (invoices net + other income)", value: collected },
    { label: "TDS deducted by customers", value: tdsTotal },
    { label: "Payroll, net pay", value: payrollNet },
    { label: "Receivables at period end", value: round2(receivableTotal) },
    { label: "Bills attached in Bills/", value: bills.length },
    { label: "Expenses without a bill", value: exps.filter((r) => !str(r.receipt).trim()).length },
    { label: "Things to fix before sending", value: fixCount },
  ];

  const issueRows: (string | number)[][] = [["Level", "Area", "What"], ...issues.map((i) => [i.level === "fix" ? "Fix" : "Check", i.area, i.text])];
  const files = [
    { name: "00_Summary.csv", text: csvText([["Item", "Value"], ...summary.map((s) => [s.label, s.value])]) },
    { name: "00_Check_before_sending.csv", text: csvText(issueRows) },
    { name: "01_Sales_register.csv", text: csvText(sales) },
    { name: "02_Receipts_register.csv", text: csvText(receipts) },
    { name: "03_Expense_register.csv", text: csvText(expRows) },
    { name: "04_Payroll_register.csv", text: csvText(pay) },
    { name: "05_Profit_and_loss.csv", text: csvText(plRows) },
    { name: "06_GST_summary.csv", text: csvText(gstRows) },
    { name: "07_Receivables.csv", text: csvText(recv) },
    { name: "08_TDS_by_customers.csv", text: csvText(tdsRows) },
    { name: "README.txt", text: readme(p, str(settings.legalName) || "FrameMind AI Studio", generatedAt) },
  ];
  return { period: p, files, bills, issues, summary };
}

function readme(p: Period, company: string, at: string) {
  return [
    `${company}: accounts pack for ${p.label} (${p.start} to ${p.end})`,
    `Prepared from FrameMind HQ on ${at}.`,
    "",
    "All amounts in Indian rupees. Every CSV opens in Excel or Google Sheets.",
    "",
    "00_Summary.csv              the period's totals",
    "00_Check_before_sending.csv anything the studio still had to fix or explain when this pack was made",
    "01_Sales_register.csv       every invoice dated in the period, cancelled ones included; B2B where the customer has a GSTIN",
    "02_Receipts_register.csv    payments received (net of TDS) with the TDS deducted, and other income",
    "03_Expense_register.csv     every expense with the GST shown in the bill; the Bill column names the file in Bills/",
    "04_Payroll_register.csv     salaries, stipends and per-unit (freelance) pay for the months in the period",
    "05_Profit_and_loss.csv      month by month: revenue ex-GST, expenses as paid",
    "06_GST_summary.csv          output tax on invoices against input tax in bills, as entered: for GSTR-1 and GSTR-3B",
    "07_Receivables.csv          invoices not fully settled on the last day of the period",
    "08_TDS_by_customers.csv     TDS deducted by clients, to match with Form 26AS",
    "Bills/                      the bills uploaded to HQ for the expenses above",
    "",
    "Input GST is the GST printed on the bills as entered by the studio; please confirm what can be claimed.",
  ].join("\r\n");
}
