import "server-only";
import { payrollNet, type BaseRecord } from "./collections";
import { getRecord, listRecords, upsertRecord } from "./records";

/**
 * A paid payslip is money out, so it must be an expense: that is how it reaches Finance (Expenses, the P&L, profit,
 * the CA pack and the dashboard).
 *
 * "Mark as paid" in Team & Payroll records the expense itself. This catches every other way a payslip becomes paid
 * (editing its status, adding it already paid, a batch save): when a payslip is saved as paid with a net above ₹0 and
 * no expense linked, the matching expense is found (by payrollId) or created, and linked back on the payslip.
 */
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const monthLabel = (m: string) => {
  const x = /^(\d{4})-(\d{2})$/.exec(m);
  return x ? `${MONTHS[Number(x[2]) - 1] ?? x[2]} ${x[1]}` : m;
};
const s = (v: unknown) => (v === undefined || v === null ? "" : String(v)).trim();

export async function ensurePayrollExpense(slip: BaseRecord, author: string): Promise<BaseRecord> {
  if (s(slip.status) !== "paid" || s(slip.expenseId)) return slip;
  const net = payrollNet(slip);
  if (!(net > 0)) return slip;

  const expenses = await listRecords("expenses");
  let expense = expenses.find((e) => s(e.payrollId) === slip.id);
  if (!expense) {
    const member = s(slip.memberId) ? await getRecord("team", s(slip.memberId)) : null;
    const freelance = s(member?.type) === "Freelance" || /freelance/i.test(s(member?.role));
    expense = await upsertRecord(
      "expenses",
      {
        date: s(slip.paidOn) || new Date().toISOString().slice(0, 10),
        category: freelance ? "Freelancers & contractors" : "Salaries & stipends",
        amount: net,
        description: `Payslip ${monthLabel(s(slip.month))} — ${s(member?.name) || "team member"}`,
        vendor: s(member?.name),
        paidBy: "Company account",
        mode: s(slip.mode) || undefined,
        receipt: s(slip.reference) || undefined,
        payrollId: slip.id,
        notes: "Auto-created from HQ → Team & Payroll",
      },
      author,
    );
  }
  return upsertRecord("payroll", { ...slip, netPay: net, expenseId: expense.id }, author);
}
