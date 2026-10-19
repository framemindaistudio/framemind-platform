import type { Metadata } from "next";
import { requireUser } from "@/lib/hq/auth";
import { LEADERSHIP } from "@/lib/hq/roles";
import { PayslipPrint } from "@/components/hq/team/PayslipPrint";

export const metadata: Metadata = { title: "Payslip", robots: { index: false, follow: false } };

/** /hq/print/payslip/<payroll id>: A4 payslip (founders and admins only). */
export default async function PayslipPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser(LEADERSHIP);
  const { id } = await params;
  return <PayslipPrint id={id} />;
}
