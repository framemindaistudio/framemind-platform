import type { Metadata } from "next";
import { requireUser } from "@/lib/hq/auth";
import { DELIVERY_SIDE } from "@/lib/hq/roles";
import { CertificatesApp } from "@/components/hq/printables/certificates/CertificatesApp";

export const metadata: Metadata = { title: "Certificates" };

type Params = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/** /hq/certificates  ·  ?tab=registry */
export default async function CertificatesPage({ searchParams }: { searchParams: Promise<Params> }) {
  await requireUser(DELIVERY_SIDE);
  const sp = await searchParams;
  return <CertificatesApp initialTab={one(sp.tab)} />;
}
