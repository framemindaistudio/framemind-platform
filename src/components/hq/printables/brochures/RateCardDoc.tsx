"use client";

import { PrintShell, A4Page } from "@/components/print/PrintShell";
import { useRates, useSettings } from "@/components/hq/data";
import { Loading } from "@/components/hq/ui";
import { COACHING, TERMS, VRITTA } from "@/lib/content/catalog";
import { site } from "@/lib/site";
import { formatINR } from "@/lib/utils";
import { Wordmark } from "../PrintBits";
import { csv, type Q } from "../util";

/**
 * /hq/print/brochures/rate-card?services=websites,brand&vritta=1&coaching=1&for=…
 * The studio's rate card as a printable A4 document, read from the saved Rate Card — the same numbers the quote
 * builder uses. It runs over as many pages as it needs; each option group is kept on one page.
 */
export function RateCardDoc({ q }: { q: Q }) {
  const rates = useRates();
  const { settings } = useSettings();
  if (!rates) return <Loading label="Loading the rate card…" />;

  const picked = csv(q.services);
  const services = rates.services.filter((s) => !picked.length || picked.includes(s.id));
  const withVritta = q.vritta === "1";
  const withCoaching = q.coaching === "1" && (rates.coaching.online > 0 || rates.coaching.offline > 0);
  const preparedFor = (q.for ?? "").trim();
  const v = rates.vritta;
  const fee = (n?: number) => (n ? formatINR(n) : "—");

  return (
    <PrintShell title="Rate card" back="/hq/printables" toolbar={<span className="text-xs text-blueprint">{services.length} service{services.length === 1 ? "" : "s"} · prices from the Rate Card</span>}>
      <style>{`@media print { @page { margin: 12mm 0 12mm; } }`}</style>
      <A4Page flow padded={false} className="print:min-h-0 print:overflow-visible">
        <div className="px-[16mm] pb-[14mm] pt-[14mm] print:pt-0 print:pb-0">
          <header className="flex items-start justify-between gap-8 border-b-2 border-ink pb-[5mm]">
            <div>
              <Wordmark mm={52} />
              <h1 className="mt-[6mm] text-[26pt] font-bold leading-none tracking-[-0.03em]">Rate card</h1>
              <p className="mt-[2mm] text-[9.5pt] text-charcoal">{preparedFor ? `Prepared for ${preparedFor}` : "Every price we charge, in the open."}</p>
            </div>
            <div className="text-right text-[7.5pt] leading-[1.6] text-charcoal">
              <p className="text-[8.5pt] font-bold text-ink">{settings.legalName || site.legalName}</p>
              <p>{settings.phone || site.contact.phone}</p>
              <p>{settings.email || site.contact.email}</p>
              <p>{site.website.replace(/^https?:\/\//, "")}</p>
            </div>
          </header>

          <p className="mt-[4mm] text-[8pt] leading-relaxed text-charcoal">
            {TERMS.tax} {TERMS.pricesFinal} Quotes hold for {rates.terms.validityDays} days.
          </p>

          {services.map((s) => (
            <section key={s.id} className="mt-[7mm]">
              <div className="break-after-avoid flex items-baseline justify-between gap-4 border-b border-ink pb-[1.5mm]" style={{ breakAfter: "avoid" }}>
                <h2 className="text-[14pt] font-bold tracking-[-0.02em]">{s.name}</h2>
                <span className="text-[7pt] font-semibold uppercase tracking-[0.2em] text-blueprint">{s.billing === "month" ? "Per month" : "Per project"}</span>
              </div>
              <p className="mt-[2mm] text-[8.5pt] leading-relaxed text-charcoal">{s.description}</p>
              {s.included.length > 0 && <p className="mt-[1.5mm] text-[7.5pt] leading-relaxed text-charcoal"><strong className="text-ink">Always included:</strong> {s.included.join(" · ")}</p>}
              <div className="mt-[3mm] grid grid-cols-2 gap-x-[8mm] gap-y-[4mm]">
                {s.groups.map((g) => (
                  <div key={g.id} style={{ breakInside: "avoid" }}>
                    <p className="text-[7pt] font-bold uppercase tracking-[0.14em] text-ink">
                      {g.title} <span className="font-medium normal-case tracking-normal text-blueprint">{g.mode === "one" ? "· choose one" : "· add any"}</span>
                    </p>
                    <table className="mt-[1mm] w-full text-[7.5pt]">
                      <tbody>
                        {g.options.map((o) => (
                          <tr key={o.id} className="border-b border-dashed border-graphite/20">
                            <td className="py-[0.8mm] pr-2 align-top">
                              {o.label}
                              {o.detail && <span className="block text-[6.5pt] text-blueprint">{o.detail}</span>}
                            </td>
                            <td className="whitespace-nowrap py-[0.8mm] text-right align-top font-mono tabular">{o.price ? formatINR(o.price) : "Included"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            </section>
          ))}

          {services.some((s) => s.billing === "month") && rates.socialContracts.length > 0 && (
            <p className="mt-[4mm] text-[7.5pt] text-charcoal" style={{ breakInside: "avoid" }}>
              <strong className="text-ink">Social media contracts:</strong> {rates.socialContracts.map((c) => `${c.label}${c.discountPercent ? ` ${c.discountPercent}% off` : ""}`).join(" · ")}
            </p>
          )}

          {services.length > 1 && (
            <section className="mt-[7mm]" style={{ breakInside: "avoid" }}>
              <h2 className="border-b border-ink pb-[1.5mm] text-[12pt] font-bold tracking-[-0.02em]">The Studio Bundle</h2>
              <p className="mt-[2mm] text-[8pt] text-charcoal">Take several services together and the whole bundle costs less:</p>
              <p className="mt-[1.5mm] text-[8.5pt] font-semibold">{rates.bundleSteps.map((b, i, all) => `${i === all.length - 1 ? `${b.services}+` : b.services} services: ${b.discountPercent}% off`).join("   ·   ")}</p>
            </section>
          )}

          {withCoaching && (
            <section className="mt-[7mm]" style={{ breakInside: "avoid" }}>
              <h2 className="border-b border-ink pb-[1.5mm] text-[12pt] font-bold tracking-[-0.02em]">{COACHING.name}</h2>
              <p className="mt-[2mm] text-[8pt] text-charcoal">{COACHING.line}</p>
              <p className="mt-[1.5mm] text-[8.5pt] font-semibold">
                {[rates.coaching.online ? `Online ${formatINR(rates.coaching.online)}` : "", rates.coaching.offline ? `In person ${formatINR(rates.coaching.offline)}` : ""].filter(Boolean).join("   ·   ")} for the whole {COACHING.days}-day programme
              </p>
            </section>
          )}

          {withVritta && (
            <section className="mt-[7mm]" style={{ breakInside: "avoid" }}>
              <h2 className="border-b border-ink pb-[1.5mm] text-[12pt] font-bold tracking-[-0.02em]">{VRITTA.name} — licence fees</h2>
              <p className="mt-[2mm] text-[8pt] text-charcoal">{VRITTA.line}</p>
              <table className="mt-[2mm] w-full text-[7.5pt]">
                <thead>
                  <tr className="border-b border-ink text-left text-[6.5pt] uppercase tracking-[0.12em] text-blueprint">
                    <th className="py-[1mm] font-semibold">Edition</th>
                    <th className="py-[1mm] text-right font-semibold">Monthly (pilot)</th>
                    <th className="py-[1mm] text-right font-semibold">Annual</th>
                    <th className="py-[1mm] text-right font-semibold">Perpetual</th>
                    <th className="py-[1mm] text-right font-semibold">AMC / yr</th>
                  </tr>
                </thead>
                <tbody>
                  {(["college", "school"] as const).flatMap((seg) =>
                    VRITTA.editions
                      .filter((e) => v.rates[seg][e.id])
                      .map((e) => {
                        const r = v.rates[seg][e.id];
                        return (
                          <tr key={`${seg}-${e.id}`} className="border-b border-dashed border-graphite/20">
                            <td className="py-[0.8mm]">{seg === "college" ? "College" : "School"} · {e.name}</td>
                            <td className="py-[0.8mm] text-right font-mono">{fee(r?.monthly)}</td>
                            <td className="py-[0.8mm] text-right font-mono">{fee(r?.annual)}</td>
                            <td className="py-[0.8mm] text-right font-mono">{fee(r?.perpetual)}</td>
                            <td className="py-[0.8mm] text-right font-mono">{fee(r?.amc)}</td>
                          </tr>
                        );
                      }),
                  )}
                </tbody>
              </table>
              <p className="mt-[1.5mm] text-[7pt] text-charcoal">One-time: {v.oneTime.map((o) => `${o.label} ${formatINR(o.price)}`).join(" · ")}. Each further institution under the same trust: {v.groupLicencePercent}% of the licence fee.</p>
            </section>
          )}

          <section className="mt-[7mm] grid grid-cols-3 gap-x-[6mm] gap-y-[3mm] border-t-2 border-ink pt-[3mm] text-[7pt] leading-relaxed text-charcoal" style={{ breakInside: "avoid" }}>
            {[
              ["Payment", TERMS.paymentTerms],
              ["Revisions", TERMS.revisionPolicy],
              ["Ownership & handover", TERMS.handoff],
              ["Not included", TERMS.thirdParty],
              ["Warranty", TERMS.warranty],
              ["Delays & discounts", `${TERMS.delays} ${TERMS.discounts}`],
            ].map(([k, v]) => (
              <div key={k}>
                <p className="font-bold text-ink">{k}</p>
                <p>{v}</p>
              </div>
            ))}
          </section>
        </div>
      </A4Page>
    </PrintShell>
  );
}
