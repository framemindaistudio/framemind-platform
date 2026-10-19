import type { Metadata } from "next";
import { headers } from "next/headers";
import { BadgeCheck, ShieldX } from "lucide-react";
import { clientIp, rateLimit } from "@/lib/hq/api";
import { listRecords } from "@/lib/hq/records";
import { plainDate } from "@/lib/sign/text";
import { site } from "@/lib/site";
import type { CertRecord } from "@/components/hq/printables/certificates/types";
import { VerifyForm, VerifyShell } from "../VerifyShell";

export const metadata: Metadata = {
  title: { absolute: "Certificate verification · FrameMind AI Studio" },
  robots: { index: false, follow: false, nocache: true },
};

/**
 * /verify/<ID>: what the QR code on a certificate opens. It shows only what is printed on the certificate itself
 * (name, programme, date) — never anything else from HQ — and says plainly when an ID is unknown or revoked.
 */
export default async function VerifyCodePage({ params }: { params: Promise<{ code: string }> }) {
  const code = decodeURIComponent((await params).code).trim().toUpperCase();
  const ip = clientIp(new Request("http://x", { headers: await headers() }));
  const limited = !rateLimit(`verify:${ip}`, 60, 10 * 60 * 1000);
  const cert = limited || !/^[A-Z0-9-]{4,24}$/.test(code) ? undefined : (await listRecords<CertRecord & Record<string, unknown>>("certificates")).find((c) => String(c.code ?? "").toUpperCase() === code);
  const valid = cert && (cert.status ?? "valid") !== "revoked";

  return (
    <VerifyShell>
      {limited ? (
        <p className="text-sm text-charcoal">This page was opened many times in a short while. Please try again in a few minutes.</p>
      ) : cert && valid ? (
        <section className="rounded-[var(--radius-md)] border border-ok/40 bg-white p-6">
          <p className="flex items-center gap-2 text-sm font-semibold text-ok">
            <BadgeCheck className="size-5" aria-hidden /> Genuine certificate
          </p>
          <p className="mt-4 text-2xl font-bold tracking-tight">{cert.studentName}</p>
          {cert.detail && <p className="mt-1 text-sm text-charcoal">{cert.detail}</p>}
          <dl className="mt-5 space-y-2 text-sm">
            <div className="flex justify-between gap-4 border-b border-dashed border-graphite/15 pb-2">
              <dt className="text-blueprint">Certificate</dt>
              <dd className="text-right font-semibold">{cert.type}</dd>
            </div>
            {cert.program && (
              <div className="flex justify-between gap-4 border-b border-dashed border-graphite/15 pb-2">
                <dt className="text-blueprint">Programme</dt>
                <dd className="text-right font-semibold">{cert.program}</dd>
              </div>
            )}
            {cert.issueDate && (
              <div className="flex justify-between gap-4 border-b border-dashed border-graphite/15 pb-2">
                <dt className="text-blueprint">Issued</dt>
                <dd className="text-right font-semibold">{plainDate(cert.issueDate)}</dd>
              </div>
            )}
            <div className="flex justify-between gap-4">
              <dt className="text-blueprint">ID</dt>
              <dd className="font-mono font-semibold">{code}</dd>
            </div>
          </dl>
          <p className="mt-5 text-xs text-blueprint">Issued by {site.legalName}.</p>
        </section>
      ) : (
        <section className="rounded-[var(--radius-md)] border border-bad/40 bg-white p-6">
          <p className="flex items-center gap-2 text-sm font-semibold text-bad">
            <ShieldX className="size-5" aria-hidden /> {cert ? "This certificate has been revoked" : "No certificate with this ID"}
          </p>
          <p className="mt-3 text-sm leading-relaxed text-charcoal">
            {cert ? `Certificate ${code} was issued but is no longer valid.` : `We could not find ${code}. Check the ID against the certificate, letter by letter.`} If you think this is a mistake, write to us.
          </p>
          <div className="mt-5">
            <VerifyForm code={code} />
          </div>
        </section>
      )}
    </VerifyShell>
  );
}
