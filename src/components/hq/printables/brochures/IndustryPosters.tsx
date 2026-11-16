"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { PrintShell, A4Page } from "@/components/print/PrintShell";
import { useSettings } from "@/components/hq/data";
import { INDUSTRIES, type Industry } from "@/lib/content/industries";
import { brandOf, brandVars, type IndustryBrand } from "@/lib/content/industry-brands";
import { site } from "@/lib/site";
import { Wordmark } from "../PrintBits";
import type { Q } from "../util";

/**
 * /hq/print/brochures/industry-posters?kind=sheet|qr&industry=…
 * - kind=sheet: one A3 portrait sheet for the office wall — all 10 industry apps in a grid, each box in its own
 *   brand colours with its logo and a QR code to its industry page (live demo, story and price).
 * - kind=qr: one A4 poster per industry (or industry=<id>) in that app's brand: logo, tagline, a large QR code and
 *   the web address. No prices, so it stays right when prices change.
 * Colours and logos come from each app's brand kit (src/lib/content/industry-brands.ts → public/brand/os/).
 */

function useQrs(items: { url: string; dark: string }[]) {
  const [qrs, setQrs] = useState<Record<string, string>>({});
  const key = items.map((i) => i.url + i.dark).join("|");
  useEffect(() => {
    let alive = true;
    Promise.all(
      items.map(async (i) => [i.url, await QRCode.toString(i.url, { type: "svg", margin: 0, errorCorrectionLevel: "M", color: { dark: i.dark, light: "#ffffff" } })] as const),
    ).then((pairs) => alive && setQrs(Object.fromEntries(pairs)));
    return () => {
      alive = false;
    };
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps
  return qrs;
}

const word = (b: IndustryBrand) => (b.name.endsWith("OS") ? b.name.slice(0, -2) : b.name);

export function IndustryPosters({ q }: { q: Q }) {
  const { settings } = useSettings();
  const kind = q.kind === "qr" ? "qr" : "sheet";
  const pick = (q.industry ?? "all").trim();
  const list = kind === "qr" && pick !== "all" ? INDUSTRIES.filter((i) => i.id === pick) : INDUSTRIES;
  const host = site.website.replace(/\/$/, "");
  const web = host.replace(/^https?:\/\//, "");
  const urlOf = (i: Industry) => `${host}/industries/${i.slug}`;
  const qrs = useQrs(list.map((i) => ({ url: urlOf(i), dark: brandOf(i.id).colors.primary })));
  const contact = { phone: settings.phone || site.contact.phone, email: settings.email || site.contact.email };

  if (kind === "sheet") {
    return (
      <PrintShell title="All industries · A3 sheet" back="/hq/printables" paper="A3" toolbar={<span className="text-xs text-blueprint">A3 portrait · {list.length} industries · print at 100%</span>}>
        <div className="print-page relative flex h-[419.6mm] w-[297mm] flex-col overflow-hidden bg-[#F7F8FC] p-[14mm] text-[#000B2D] shadow-[0_10px_40px_-12px_rgb(0_0_0/0.35)]">
          <header className="flex items-end justify-between gap-6 border-b-2 border-[#000B2D] pb-[5mm]">
            <div>
              <Wordmark mm={54} />
              <p className="mt-[5mm] text-[9pt] font-semibold uppercase tracking-[0.24em] text-[#000B2D]/60">Industry apps · live demos</p>
              <h1 className="mt-[1.5mm] text-[30pt] font-black leading-none tracking-[-0.03em]">Scan your industry. Try the app.</h1>
            </div>
            <p className="max-w-[80mm] text-right text-[9.5pt] leading-snug text-[#000B2D]/70">
              Every app is live with sample data — try every role on your phone, then see how we build yours in your own name, logo and colours.
            </p>
          </header>

          <section className="mt-[7mm] grid flex-1 grid-cols-2 grid-rows-5 gap-[5mm]">
            {list.map((ind) => {
              const b = brandOf(ind.id);
              return (
                <div key={ind.id} style={brandVars(b)} className="relative flex items-center gap-[5mm] overflow-hidden rounded-[4mm] border border-[var(--b-primary)]/12 bg-white p-[5mm]">
                  <span className="absolute inset-y-0 left-0 w-[2.2mm] bg-[var(--b-accent)]" />
                  <div className="flex min-w-0 flex-1 flex-col self-stretch justify-between pl-[2mm]">
                    <div>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={b.logo} alt={`FrameMind ${b.name}`} className="h-[11mm] w-auto" />
                      <p className="mt-[3mm] text-[13pt] font-extrabold leading-tight">{ind.name}</p>
                      <p className="mt-[1mm] text-[8.5pt] leading-snug text-[var(--b-primary)]/70">{b.tagline}</p>
                    </div>
                    <p className="mt-[2mm] inline-flex w-fit rounded-full bg-[var(--b-surface)] px-[3mm] py-[1mm] text-[7.5pt] font-semibold text-[var(--b-accent-ink)]">
                      {web}/industries/{ind.slug}
                    </p>
                  </div>
                  <div className="shrink-0 text-center">
                    <div className="rounded-[2.5mm] bg-white p-[1.5mm] ring-1 ring-[var(--b-primary)]/10">
                      <div className="size-[30mm] [&>svg]:h-full [&>svg]:w-full" dangerouslySetInnerHTML={{ __html: qrs[urlOf(ind)] ?? "" }} />
                    </div>
                    <p className="mt-[1.5mm] text-[6.5pt] font-bold uppercase tracking-[0.16em] text-[var(--b-accent-ink)]">{ind.demoUrl ? "Live demo" : "Scan for details"}</p>
                  </div>
                </div>
              );
            })}
          </section>

          <footer className="mt-[6mm] flex items-center justify-between border-t border-[#000B2D] pt-[3mm] text-[9pt]">
            <span className="font-bold">FrameMind AI Studio · your app, your brand, live in 3–4 weeks</span>
            <span>{[contact.phone, contact.email, web].filter(Boolean).join("  ·  ")}</span>
          </footer>
        </div>
      </PrintShell>
    );
  }

  return (
    <PrintShell title="Industry QR posters" back="/hq/printables" toolbar={<span className="text-xs text-blueprint">A4 · {list.length} poster{list.length === 1 ? "" : "s"} · no prices</span>}>
      {list.map((ind) => {
        const b = brandOf(ind.id);
        return (
          <A4Page key={ind.id} padded={false} className="relative flex flex-col overflow-hidden">
            <div style={brandVars(b)} className="relative flex h-full flex-col bg-[var(--b-bg)] text-[var(--b-primary)]">
              {/* the kit's dot pattern and wave, as on its guidelines' application page */}
              <div className="absolute inset-0 opacity-60 [background-image:radial-gradient(var(--b-secondary)_1.1px,transparent_1.1px)] [background-size:6mm_6mm] [mask-image:linear-gradient(to_bottom,black,transparent_55%)]" />
              <span className="absolute inset-x-0 top-0 h-[3mm] bg-[var(--b-accent)]" />
              <svg className="absolute inset-x-0 bottom-0 h-[52mm] w-full" viewBox="0 0 1200 300" preserveAspectRatio="none" aria-hidden>
                <path d="M0,170 C300,90 520,250 800,140 S1100,60 1200,90 V300 H0Z" fill={b.colors.accent} opacity=".22" />
                <path d="M0,220 C260,170 560,280 860,210 S1120,160 1200,180 V300 H0Z" fill={b.colors.accent} opacity=".4" />
              </svg>

              <div className="relative flex flex-1 flex-col items-center px-[18mm] pt-[22mm] text-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={b.logo} alt={`FrameMind ${b.name}`} className="h-[22mm] w-auto" />
                <p className="mt-[9mm] text-[9pt] font-semibold uppercase tracking-[0.26em] text-[var(--b-accent-ink)]">{ind.name}</p>
                <h1 className="mt-[3mm] text-[28pt] font-black leading-[1.05] tracking-[-0.02em]">{b.tagline}</h1>

                <div className="mt-[11mm] rounded-[6mm] bg-white p-[6mm] shadow-[0_18px_40px_-22px_rgba(0,11,45,0.55)] ring-1 ring-[var(--b-primary)]/10">
                  <div className="size-[82mm] [&>svg]:h-full [&>svg]:w-full" dangerouslySetInnerHTML={{ __html: qrs[urlOf(ind)] ?? "" }} />
                </div>
                <p className="mt-[6mm] text-[15pt] font-extrabold">
                  Scan to try <span className="text-[var(--b-accent-ink)]">{word(b)}</span>
                  {b.name.endsWith("OS") ? <span className="text-[var(--b-accent-ink)]">OS</span> : null}
                </p>
                <p className="mt-[1.5mm] text-[10pt] text-[var(--b-primary)]/70">{ind.demoUrl ? "Live demo with sample data — every role, on your phone." : "See what it does and book a demo."}</p>
                <p className="mt-[4mm] rounded-full bg-white/80 px-[5mm] py-[1.5mm] text-[11pt] font-bold ring-1 ring-[var(--b-primary)]/10">
                  {web}/industries/{ind.slug}
                </p>
              </div>

              <footer className="relative flex items-center justify-between px-[14mm] pb-[9mm] text-[8.5pt] font-semibold text-[var(--b-primary)]">
                <span>Your app · your name, logo and colours</span>
                <span>Powered by FrameMind AI Studio</span>
              </footer>
            </div>
          </A4Page>
        );
      })}
    </PrintShell>
  );
}
