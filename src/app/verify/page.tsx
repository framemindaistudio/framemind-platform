import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { VerifyForm, VerifyShell } from "./VerifyShell";

export const metadata: Metadata = {
  title: { absolute: "Verify a certificate · FrameMind AI Studio" },
  description: "Check that a FrameMind AI Studio certificate is genuine.",
  robots: { index: false, follow: false },
};

/** /verify: type the ID printed on a certificate (or scan its QR code, which opens /verify/<ID> directly). */
export default async function VerifyPage({ searchParams }: { searchParams: Promise<{ code?: string | string[] }> }) {
  const raw = (await searchParams).code;
  const code = (Array.isArray(raw) ? raw[0] : raw)?.trim().toUpperCase();
  if (code) redirect(`/verify/${encodeURIComponent(code)}`);
  return (
    <VerifyShell>
      <h1 className="text-2xl font-bold tracking-tight">Verify a certificate</h1>
      <p className="mb-5 mt-2 text-sm leading-relaxed text-charcoal">Enter the certificate ID printed under the QR code.</p>
      <VerifyForm />
    </VerifyShell>
  );
}
