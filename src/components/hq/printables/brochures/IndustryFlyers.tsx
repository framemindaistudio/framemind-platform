"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { PrintShell, A4Page } from "@/components/print/PrintShell";
import { useRates, useSettings } from "@/components/hq/data";
import { Loading } from "@/components/hq/ui";
import { INDUSTRIES, INDUSTRY_ADD_ONS, TIERS, addOnPriceOf, setupFor, tierPrice, type Industry } from "@/lib/content/industries";
import { realEstateWith } from "@/lib/content/real-estate";
import { TERMS } from "@/lib/content/catalog";
import { site } from "@/lib/site";
import { formatINR } from "@/lib/utils";
import { Wordmark } from "../PrintBits";
import type { Q } from "../util";

/**
 * /hq/print/brochures/industries?industry=clinic&for=…
 * One A4 flyer per industry app: what it does, who logs in, the three plans (monthly and yearly), the setup and the
 * add-ons, and a QR code to the industry's page with its live demo. Prices come from the saved Rate Card (Industry
 * apps), so the flyer always matches the website and the quote builder. industry=all prints every flyer in order.
 */

const INK = "#0d0d0d";

/** QR codes (as SVG) for every industry page, drawn once. */
function useQrs(urls: string[]) {
  const [qrs, setQrs] = useState<Record<string, string>>({});
  const key = urls.join("|");
  useEffect(() => {
    let alive = true;
    Promise.all(urls.map(async (u) => [u, await QRCode.toString(u, { type: "svg", margin: 0, errorCorrectionLevel: "M", color: { dark: INK, light: "#ffffff" } })] as const)).then((pairs) => alive && setQrs(Object.fromEntries(pairs)));
    return () => {
      alive = false;
    };
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps
  return qrs;
}

export function IndustryFlyers({ q }: { q: Q }) {
  const rates = useRates();
  const { settings } = useSettings();
  const pick = (q.industry ?? "all").trim();
  const list = pick === "all" ? INDUSTRIES : INDUSTRIES.filter((i) => i.id === pick);
  const host = site.website.replace(/\/$/, "");
  const qrs = useQrs(list.map((i) => `${host}/industries/${i.slug}`));
  if (!rates) return <Loading label="Loading the rate card…" />;

  const preparedFor = (q.for ?? "").trim();
  const contact = {
    name: settings.legalName || site.legalName,
    phone: settings.phone || site.contact.phone,
    email: settings.email || site.contact.email,
    web: host.replace(/^https?:\/\//, ""),
  };

  return (
    <PrintShell title="Industry app flyers" back="/hq/printables" toolbar={<span className="text-xs text-blueprint">{list.length} flyer{list.length === 1 ? "" : "s"} · prices from the Rate Card</span>}>
      {list.map((ind) => (
        <Flyer key={ind.id} ind={ind} rates={rates.industries} realEstate={ind.id === "realestate" ? rates.realEstate : undefined} gst={!!settings.gstRegistered} preparedFor={preparedFor} contact={contact} qr={qrs[`${host}/industries/${ind.slug}`] ?? ""} url={`${contact.web}/industries/${ind.slug}`} />
      ))}
    </PrintShell>
  );
}

function Flyer({
  ind,
  rates,
  realEstate,
  gst,
  preparedFor,
  contact,
  qr,
  url,
}: {
  ind: Industry;
  rates: Parameters<typeof tierPrice>[0];
  realEstate?: Parameters<typeof realEstateWith>[0];
  gst: boolean;
  preparedFor: string;
  contact: { name: string; phone: string; email: string; web: string };
  qr: string;
  url: string;
}) {
  const free = rates?.annualFreeMonths ?? 2;
  const branchPct = rates?.branchPercent ?? 50;
  const setup = setupFor(rates, ind.id);
  const developer = realEstate ? realEstateWith(realEstate).plans : null;
  return (
    <A4Page className="flex flex-col text-[8.5pt]">
      {/* header */}
      <header className="flex items-start justify-between gap-6 border-b-2 border-ink pb-[4mm]">
        <div>
          <Wordmark mm={44} />
          <p className="mt-[5mm] text-[7pt] font-semibold uppercase tracking-[0.22em] text-blueprint">Industry app · {ind.who}</p>
          <h1 className="mt-[1.5mm] text-[24pt] font-bold leading-none tracking-[-0.03em]">{ind.product}</h1>
          <p className="mt-[2mm] max-w-[120mm] text-[10pt] leading-snug text-charcoal">{ind.tagline} With your name, logo and colours, live in 3–4 weeks.</p>
          {preparedFor && <p className="mt-[1.5mm] text-[8.5pt] font-semibold">Prepared for {preparedFor}</p>}
        </div>
        {qr && (
          <div className="shrink-0 text-center">
            <div className="size-[28mm] [&>svg]:h-full [&>svg]:w-full" dangerouslySetInnerHTML={{ __html: qr }} />
            <p className="mt-[1.5mm] text-[6.5pt] font-semibold uppercase tracking-[0.16em]">Scan for the live demo</p>
          </div>
        )}
      </header>

      {/* what sells this app */}
      {ind.pitch ? (
        <section className="mt-[4mm] grid grid-cols-3 gap-[3mm]">
          {ind.pitch.map((x) => (
            <div key={x.title} className="rounded-[2mm] border-2 border-ink p-[2.5mm]">
              <p className="font-bold leading-snug">{x.title}</p>
              <p className="mt-[1mm] text-[7.5pt] leading-snug text-charcoal">{x.detail}</p>
            </div>
          ))}
        </section>
      ) : null}

      {/* features */}
      <section className="mt-[4mm]">
        <p className="text-[7pt] font-semibold uppercase tracking-[0.22em] text-blueprint">What the app does</p>
        <div className="mt-[2mm] grid grid-cols-2 gap-x-[6mm] gap-y-[2.5mm]">
          {ind.features.map((f) => (
            <div key={f.title} className="flex gap-2">
              <span className="mt-[0.3mm] font-bold">✓</span>
              <span>
                <span className="block font-semibold">{f.title}</span>
                <span className="block leading-snug text-charcoal">{f.detail}</span>
              </span>
            </div>
          ))}
        </div>
        <p className="mt-[2.5mm] text-charcoal">
          <span className="font-semibold text-ink">Everyone gets their own screens:</span> {ind.roles.join(" · ")}
        </p>
      </section>

      {/* plans */}
      <section className="mt-[4mm]">
        <p className="text-[7pt] font-semibold uppercase tracking-[0.22em] text-blueprint">Plans · {ind.unit}</p>
        <div className="mt-[2mm] grid grid-cols-3 gap-[3mm]">
          {TIERS.map((t, i) => {
            const m = tierPrice(rates, ind.id, t.id);
            const yearly = m * (12 - free);
            return (
              <div key={t.id} className={`rounded-[2mm] border p-[3mm] ${t.badge ? "border-2 border-ink" : "border-graphite/25"}`}>
                <p className="flex items-center justify-between font-bold">
                  {t.name}
                  {t.badge && <span className="text-[6pt] uppercase tracking-[0.16em] text-blueprint">{t.badge}</span>}
                </p>
                <p className="mt-[1mm] text-[16pt] font-bold leading-none tracking-[-0.02em]">
                  {formatINR(m)}
                  <span className="text-[7.5pt] font-medium text-charcoal">/month</span>
                </p>
                <p className="mt-[1mm] text-[7.5pt] text-charcoal">
                  or {formatINR(yearly)}/year ({free} months free)
                </p>
                <p className="mt-[1.5mm] text-[7.5pt] font-semibold">{ind.limits[i]}</p>
                <ul className="mt-[1.5mm] space-y-[0.8mm] text-[7pt] leading-snug text-charcoal">
                  {t.includes.map((x) => (
                    <li key={x}>· {x}</li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </section>

      {/* setup + add-ons */}
      <section className="mt-[4mm] grid grid-cols-2 gap-[6mm]">
        <div>
          <p className="text-[7pt] font-semibold uppercase tracking-[0.22em] text-blueprint">One-time setup</p>
          <p className="mt-[1.5mm] text-[14pt] font-bold leading-none">{formatINR(setup)}</p>
          <p className="mt-[1.5mm] leading-snug text-charcoal">Your name, logo and colours, your own web address, your data imported, a training session and go-live.</p>
          <p className="mt-[1.5mm] leading-snug text-charcoal">Each extra branch adds {branchPct}% of the plan.</p>
        </div>
        <div>
          <p className="text-[7pt] font-semibold uppercase tracking-[0.22em] text-blueprint">Add-ons (one-time)</p>
          <table className="mt-[1.5mm] w-full">
            <tbody>
              {INDUSTRY_ADD_ONS.map((a) => (
                <tr key={a.id} className="border-b border-dashed border-graphite/20">
                  <td className="py-[1mm] pr-2">{a.label}</td>
                  <td className="py-[1mm] text-right font-semibold tabular-nums">{formatINR(addOnPriceOf(rates, a.id))}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {ind.onQuote.length > 0 && <p className="mt-[1.5mm] text-[7pt] leading-snug text-charcoal">Quoted after a call: {ind.onQuote.join(" · ")}.</p>}
        </div>
      </section>

      {/* real estate: the developer platform too */}
      {developer && (
        <section className="mt-[4mm] rounded-[2mm] bg-graphite/[0.05] p-[3mm]">
          <p className="font-semibold">Developing a layout, villa project or township? Real Estate Digital Platform — priced per sq ft of the project:</p>
          <p className="mt-[1mm] text-charcoal">
            {developer.map((p) => `${p.name} ₹${p.rate.toFixed(2)}/sq ft (${formatINR(p.min)} – ${formatINR(p.max)})`).join("  ·  ")}
          </p>
        </section>
      )}

      {/* foot */}
      <footer className="mt-auto border-t border-ink pt-[3mm]">
        <p className="text-[7pt] leading-snug text-charcoal">
          {gst ? TERMS.tax : TERMS.taxNone} Your data is yours: export it any time, and it is handed over if you stop the plan. Prices from {new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" })}; the final price is confirmed in a written quote.
        </p>
        <div className="mt-[2mm] flex items-center justify-between text-[8pt]">
          <span className="font-bold">{contact.name}</span>
          <span>{[contact.phone, contact.email, url].join("  ·  ")}</span>
        </div>
      </footer>
    </A4Page>
  );
}
