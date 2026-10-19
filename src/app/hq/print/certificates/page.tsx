import type { Metadata } from "next";
import { CertificatePrint } from "@/components/hq/printables/certificates/CertificatePrint";
import { flatten, type SearchParams } from "@/components/hq/printables/util";

export const metadata: Metadata = { title: "Print certificates" };

/** /hq/print/certificates?ids=a,b | ?workshop=<id> | ?batch=<id> | ?sample=1 */
export default async function Page({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return <CertificatePrint q={flatten(await searchParams)} />;
}
