"use client";

import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { PrintShell } from "@/components/print/PrintShell";
import { useCollection } from "@/components/hq/data";
import { EmptyState, Loading } from "@/components/hq/ui";
import { csv, type Q } from "../util";
import { useVerifyBase } from "../hooks";
import { CertificateSheet } from "./CertificateSheet";
import { CERT_TYPES, certMeta, type CertRecord } from "./types";

/**
 * /hq/print/certificates?ids=a,b,c | ?learner=<id> | ?batch=<id> | ?sample=1[&type=Internship]
 * One A4 landscape certificate per valid record; QR codes are generated in the browser.
 */
export function CertificatePrint({ q }: { q: Q }) {
  const sample = q.sample === "1";
  const { records, loading, error } = useCollection<CertRecord & Record<string, unknown>>("certificates");
  const [qrs, setQrs] = useState<Record<string, string>>({});
  const base = useVerifyBase();

  const { certs, skipped } = useMemo(() => {
    if (sample) {
      const type = CERT_TYPES.some((t) => t.value === q.type) ? q.type : CERT_TYPES[0].value;
      const one: CertRecord = { id: "sample", code: "FM-26-SAMPL", studentName: "Full Name", detail: q.detail || "The line under the name", program: q.program || certMeta(type).program, type, issueDate: q.date || undefined, status: "valid" };
      return { certs: [one], skipped: 0 };
    }
    const ids = csv(q.ids);
    let picked: CertRecord[] = [];
    if (ids.length) picked = ids.map((id) => records.find((r) => r.id === id)).filter((r): r is CertRecord & Record<string, unknown> => !!r);
    else if (q.batch) picked = records.filter((r) => r.batch === q.batch);
    else if (q.learner) picked = records.filter((r) => r.learnerId === q.learner);
    const valid = picked.filter((r) => (r.status ?? "valid") !== "revoked" && r.code);
    return { certs: valid, skipped: picked.length - valid.length };
  }, [records, sample, q.ids, q.batch, q.learner, q.type, q.program, q.detail, q.date]);

  const codeKey = certs.map((c) => c.code).join("|");
  useEffect(() => {
    if (!base || !codeKey) return;
    let alive = true;
    (async () => {
      const entries = await Promise.all(
        codeKey.split("|").map(async (code) => {
          try {
            const url = await QRCode.toDataURL(`${base}/verify/${encodeURIComponent(code)}`, { errorCorrectionLevel: "M", margin: 0, width: 360, color: { dark: "#0D0D0D", light: "#FFFFFF" } });
            return [code, url] as const;
          } catch {
            return [code, ""] as const;
          }
        }),
      );
      if (alive) setQrs(Object.fromEntries(entries));
    })();
    return () => {
      alive = false;
    };
  }, [base, codeKey]);

  const ready = certs.length > 0 && !!base && certs.every((c) => qrs[c.code]);
  const status = !certs.length ? "" : ready ? `${certs.length} certificate${certs.length === 1 ? "" : "s"} ready · 1 per A4 landscape` : "Preparing QR codes…";

  return (
    <PrintShell
      landscape
      title={sample ? "Certificate design preview" : "Certificates"}
      back="/hq/certificates"
      toolbar={
        <span className="text-xs text-blueprint" role="status">
          {status}
          {skipped > 0 && ` · ${skipped} revoked skipped`}
          {sample && " · specimen"}
        </span>
      }
    >
      {!sample && loading ? (
        <Loading label="Loading certificates…" />
      ) : !sample && error ? (
        <p className="no-print rounded border border-bad/30 bg-bad/10 px-3 py-2 text-sm text-bad">{error}</p>
      ) : !certs.length ? (
        <EmptyState icon="Award" title="No certificates to print" description="Nothing matches this link, or every matching certificate has been revoked. Issue certificates from HQ → Certificates." />
      ) : (
        certs.map((c) => <CertificateSheet key={c.id} cert={{ ...c, issueDate: c.issueDate || undefined }} qr={qrs[c.code]} verifyUrl={`${base || "…"}/verify/${c.code}`} specimen={sample} />)
      )}
    </PrintShell>
  );
}
