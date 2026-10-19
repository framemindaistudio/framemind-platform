import type { Metadata } from "next";
import { requireUser } from "@/lib/hq/auth";
import { OPS } from "@/lib/hq/roles";
import { FinanceApp, type FinanceTab } from "@/components/hq/finance/FinanceApp";

export const metadata: Metadata = { title: "Finance" };

const TABS: FinanceTab[] = ["overview", "invoices", "expenses", "income", "reports", "ca"];
type Params = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/** /hq/finance?tab=overview|invoices|expenses|income|reports|ca  ·  ?id=<invoice>  ·  ?new=1&project=<id> */
export default async function FinancePage({ searchParams }: { searchParams: Promise<Params> }) {
  await requireUser(OPS);
  const sp = await searchParams;
  const tabParam = one(sp.tab);
  const id = one(sp.id) ?? null;
  const project = one(sp.project) ?? null;
  const wantsNew = one(sp.new) === "1" || !!project;
  const tab: FinanceTab = TABS.includes(tabParam as FinanceTab) ? (tabParam as FinanceTab) : id || wantsNew ? "invoices" : "overview";
  return <FinanceApp initialTab={tab} initialInvoiceId={id} initialNew={wantsNew} initialProjectId={project} />;
}
