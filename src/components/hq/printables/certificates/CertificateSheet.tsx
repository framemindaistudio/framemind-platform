"use client";

/**
 * One premium A4-landscape certificate: double frame, faint grid, the FrameMind mark as a watermark,
 * two signature lines and a QR code that points at <site>/verify/<code>.
 * Sized in millimetres so it prints exactly one per page.
 */
import { CornerMarks } from "@/components/brand/Blueprint";
import { site } from "@/lib/site";
import { Mark, Sheet, Wordmark } from "../PrintBits";
import { plainDate } from "../util";
import { certMeta, type CertRecord } from "./types";

function Signature({ name, role }: { name: string; role: string }) {
  return (
    <div className="w-[62mm] text-center">
      <div className="h-[15mm]" />
      <div className="border-t-[0.3mm] border-graphite" />
      <p className="mt-[1.6mm] text-[9.5pt] font-bold leading-tight tracking-[-0.01em]">{name}</p>
      <p className="mt-[0.6mm] text-[6.4pt] font-semibold uppercase tracking-[0.18em] text-blueprint">{role}</p>
    </div>
  );
}

export function CertificateSheet({ cert, qr, verifyUrl, specimen }: { cert: Omit<CertRecord, "id"> & { id?: string }; qr?: string; verifyUrl: string; specimen?: boolean }) {
  const meta = certMeta(cert.type);
  const name = cert.studentName.trim();
  const nameSize = name.length > 34 ? "24pt" : name.length > 26 ? "29pt" : name.length > 19 ? "34pt" : "40pt";
  const founderA = site.founders[0];
  const founderB = site.founders[1];
  const placeLine = (cert.detail ?? "").trim();
  const shortUrl = verifyUrl.replace(/^https?:\/\//, "");

  return (
    <Sheet landscape className="bg-[#FBFAF7]">
      {/* double frame with a pencil-hatched mat between the two rules */}
      <div className="absolute inset-[6.5mm] border-[0.7mm] border-graphite" aria-hidden>
        <div className="hatch absolute inset-0 opacity-70" />
        <div className="absolute inset-[3.4mm] border-[0.25mm] border-graphite bg-[#FBFAF7]" />
      </div>

      <div className="absolute inset-[9.9mm] overflow-hidden">
        <div className="bp-grid-fine pointer-events-none absolute inset-0 opacity-30" aria-hidden />
        <CornerMarks size={26} inset={5} className="text-graphite/60" />
        <Mark mm={118} className="pointer-events-none absolute -right-[10mm] top-1/2 -translate-y-1/2 opacity-[0.05]" />
        <Mark mm={118} className="pointer-events-none absolute -left-[30mm] top-1/2 -translate-y-1/2 -scale-x-100 opacity-[0.03]" />

        <div className="relative flex h-full flex-col items-center px-[16mm] pb-[7mm] pt-[8mm] text-center">
          <Wordmark mm={38} />

          <div className="mt-[5mm] flex w-[120mm] items-center gap-[3mm] text-graphite/40" aria-hidden>
            <span className="h-px flex-1 bg-current" />
            <span className="size-[1.8mm] rotate-45 border border-current" />
            <span className="h-px flex-1 bg-current" />
          </div>

          <h1 className="mt-[5mm] text-[30pt] font-bold leading-none tracking-[-0.035em]">{meta.title}</h1>
          <p className="mt-[3.4mm] text-[8.5pt] font-semibold uppercase tracking-[0.26em] text-blueprint">{meta.presentedTo}</p>

          <p className="mt-[3.6mm] max-w-[230mm] font-bold leading-[1.05] tracking-[-0.03em]" style={{ fontSize: nameSize }}>
            {name || "Name"}
          </p>
          <div className="mt-[2mm] h-[0.4mm] w-[170mm] bg-graphite/80" aria-hidden />
          {placeLine && <p className="mt-[2.6mm] text-[11.5pt] font-semibold text-charcoal">{placeLine}</p>}

          <p className="mt-[4.4mm] max-w-[205mm] text-[11pt] leading-[1.5] text-charcoal">
            {meta.citation}
            <br />
            <strong className="text-[13pt] font-bold tracking-[-0.01em] text-graphite">{cert.program || meta.program || "FrameMind AI Studio"}</strong>
          </p>

          <div className="mt-auto grid w-full grid-cols-[1fr_auto_1fr] items-end gap-x-[8mm]">
            <div className="flex justify-start pl-[4mm]">
              <Signature name={founderA.name} role={founderA.role} />
            </div>

            <div className="flex flex-col items-center">
              <div className="relative border-[0.3mm] border-graphite bg-white p-[1.2mm]">
                {qr ? (
                  // eslint-disable-next-line @next/next/no-img-element -- data URL generated in the browser
                  <img src={qr} alt={`QR code to verify certificate ${cert.code}`} className="block size-[24mm]" />
                ) : (
                  <div className="size-[24mm] bg-graphite/5" />
                )}
              </div>
              <p className="mt-[1.6mm] font-mono text-[8pt] font-bold tracking-[0.14em]">{cert.code}</p>
              <p className="mt-[0.4mm] text-[5.6pt] font-semibold uppercase tracking-[0.2em] text-blueprint">Scan to verify</p>
            </div>

            <div className="flex justify-end pr-[4mm]">
              <Signature name={founderB.name} role={founderB.role} />
            </div>
          </div>

          <div className="mt-[4.6mm] flex w-full items-center justify-between gap-4 border-t border-graphite/30 pt-[1.8mm] text-[6pt] font-semibold uppercase tracking-[0.2em] text-blueprint">
            <span className="shrink-0">{cert.issueDate ? `Issued ${plainDate(cert.issueDate)}` : "Date of issue"}</span>
            <span className="truncate">{site.tagline}</span>
            <span className="max-w-[78mm] shrink-0 truncate normal-case tracking-[0.04em]">Verify: {shortUrl}</span>
          </div>
          {specimen && <p className="absolute bottom-[0.6mm] text-[5.6pt] uppercase tracking-[0.3em] text-bad">Specimen: not a valid certificate</p>}
        </div>
      </div>
    </Sheet>
  );
}
