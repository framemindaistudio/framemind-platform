"use client";

import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { PrintShell } from "@/components/print/PrintShell";
import { useCollection, useSettings } from "@/components/hq/data";
import { EmptyState, Loading } from "@/components/hq/ui";
import type { BaseRecord } from "@/lib/hq/collections";
import { site } from "@/lib/site";
import { Sheet, Tile } from "../PrintBits";
import { csv, str, type Q } from "../util";

/*
 * Visiting cards, 90 × 54 mm, ten to an A4 sheet.
 *
 * Front: Ink, the shared icon with the FrameMind wordmark, the person's name, title and contacts, and a QR code to the
 * website. Back: the stacked logo on Ink with a soft glow, and the website.
 * Colours: Ink, Paper, Lime (the one accent), Violet; the logo's own gold for "Mind" and the dots of the tagline.
 */

const INK = "#0D0D0D";
const PAPER = "#F5F4F0";
const LIME = "#C8F135";
const GOLD = "#F7C448";
const LAVENDER = "#B9AFF0";

interface Contact {
  name: string;
  title: string;
  phone: string;
  email: string;
  website: string;
}

const bare = (url: string) => url.replace(/^https?:\/\//i, "").replace(/\/+$/, "");
const absolute = (url: string) => (/^https?:\/\//i.test(url) ? url : `https://${url}`);

/** The website's QR code as crisp SVG, drawn once for every card on the page. */
function useQr(url: string) {
  const [svg, setSvg] = useState("");
  useEffect(() => {
    if (!url) return;
    let alive = true;
    QRCode.toString(url, { type: "svg", margin: 0, errorCorrectionLevel: "M", color: { dark: INK, light: "#ffffff" } })
      .then((s) => alive && setSvg(s))
      .catch(() => alive && setSvg(""));
    return () => {
      alive = false;
    };
  }, [url]);
  return svg;
}

function Tagline({ className }: { className?: string }) {
  const dot = <span className="mx-[1.4mm] inline-block size-[0.7mm] rounded-full align-middle" style={{ background: GOLD }} />;
  return (
    <p className={className} style={{ fontSize: "3.9pt", letterSpacing: "0.32em", color: "rgba(245,244,240,0.6)" }}>
      DESIGN{dot}SOFTWARE{dot}AI SOLUTIONS
    </p>
  );
}

function Front({ c, qr }: { c: Contact; qr: string }) {
  const rows: [string, string][] = [
    ["Call", c.phone],
    ["Mail", c.email],
    ["Web", c.website],
  ];
  return (
    <Tile w={90} h={54} style={{ background: INK, color: PAPER }}>
      {/* a soft violet light behind the icon, and the lime edge */}
      <div aria-hidden className="absolute -left-[14mm] -top-[16mm] size-[46mm] rounded-full" style={{ background: "radial-gradient(circle, rgba(124,58,237,0.32), rgba(124,58,237,0) 68%)" }} />
      <div aria-hidden className="absolute inset-y-0 left-0 w-[1mm]" style={{ background: LIME }} />

      {/* brand */}
      <div className="absolute left-[6.5mm] top-[5.2mm] flex items-center gap-[1.6mm]">
        {/* eslint-disable-next-line @next/next/no-img-element -- the transparent icon, printed at its true size */}
        <img src="/brand/fm-mark-dark.png" alt="" className="size-[8.5mm]" />
        <span className="flex flex-col leading-none">
          <span className="font-bold tracking-[-0.02em]" style={{ fontSize: "7.4pt" }}>
            Frame<span style={{ color: GOLD }}>Mind</span>
          </span>
          <span className="mt-[0.7mm] font-medium" style={{ fontSize: "3.4pt", letterSpacing: "0.42em", color: LAVENDER }}>
            AI STUDIO
          </span>
        </span>
      </div>

      {/* person */}
      <div className="absolute left-[6.5mm] right-[30mm] top-[18.5mm]">
        <p className="truncate font-bold leading-[1.05] tracking-[-0.025em]" style={{ fontSize: "11.5pt" }}>
          {c.name}
        </p>
        <p className="mt-[1mm] truncate font-mono font-semibold uppercase leading-tight" style={{ fontSize: "5.2pt", letterSpacing: "0.16em", color: LIME }}>
          {c.title}
        </p>
        <dl className="mt-[3mm] space-y-[0.8mm] leading-tight" style={{ fontSize: "6.2pt" }}>
          {rows
            .filter(([, v]) => v)
            .map(([k, v]) => (
              <div key={k} className="flex items-baseline gap-[2mm]">
                <dt className="w-[6mm] shrink-0 font-mono uppercase" style={{ fontSize: "4.4pt", letterSpacing: "0.14em", color: "rgba(245,244,240,0.5)" }}>
                  {k}
                </dt>
                <dd className="truncate font-medium">{v}</dd>
              </div>
            ))}
        </dl>
      </div>

      {/* QR to the website */}
      {qr && (
        <div className="absolute right-[6mm] top-[13mm] flex flex-col items-center">
          <div className="rounded-[1.6mm] bg-white p-[1.4mm]">
            <div className="size-[17mm] [&>svg]:h-full [&>svg]:w-full" dangerouslySetInnerHTML={{ __html: qr }} />
          </div>
          <p className="mt-[1.2mm] font-mono uppercase" style={{ fontSize: "3.6pt", letterSpacing: "0.2em", color: "rgba(245,244,240,0.6)" }}>
            Scan · website
          </p>
        </div>
      )}

      {/* foot */}
      <div aria-hidden className="absolute bottom-[6.2mm] left-[6.5mm] right-[6mm] h-px" style={{ background: "rgba(245,244,240,0.12)" }} />
      <Tagline className="absolute bottom-[2.6mm] left-[6.5mm] whitespace-nowrap" />
    </Tile>
  );
}

function Back({ website }: { website: string }) {
  return (
    <Tile w={90} h={54} style={{ background: INK, color: PAPER }}>
      {/* gold and violet light behind the logo */}
      <div aria-hidden className="absolute left-1/2 top-[40%] size-[60mm] -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ background: "radial-gradient(circle, rgba(247,196,72,0.18), rgba(124,58,237,0.14) 45%, rgba(13,13,13,0) 70%)" }} />
      <div className="absolute inset-x-0 top-[5mm] flex justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element -- the stacked logo for dark backgrounds, transparent */}
        <img src="/brand/fm-logo-dark.png" alt="FrameMind AI Studio" className="h-[37mm] w-auto" />
      </div>
      {website && (
        <p className="absolute inset-x-0 bottom-[4mm] text-center font-mono font-semibold" style={{ fontSize: "5.2pt", letterSpacing: "0.18em", color: LIME }}>
          {website.toUpperCase()}
        </p>
      )}
      <div aria-hidden className="absolute inset-x-0 bottom-0 h-[1mm]" style={{ background: LIME }} />
    </Tile>
  );
}

export function VisitingCards({ q }: { q: Q }) {
  const { records, loading, error } = useCollection("team");
  const { settings } = useSettings();

  const people = useMemo(() => {
    const ids = csv(q.ids);
    const pick: BaseRecord[] = ids.length ? ids.map((id) => records.find((r) => r.id === id)).filter((r): r is BaseRecord => !!r) : records.filter((r) => r.status !== "inactive");
    return pick;
  }, [records, q.ids]);

  const site0 = settings.website || (/localhost|127\.0\.0\.1/.test(site.url) ? "" : site.url);
  const qr = useQr(site0 ? absolute(bare(site0)) : "");
  const contacts: Contact[] = people.map((m) => ({
    name: str(m.name),
    title: str(m.role),
    phone: str(m.phone) || settings.phone || site.contact.phone,
    email: str(m.email) || settings.email || site.contact.email,
    website: bare(site0),
  }));
  const withBack = q.back !== "0";

  return (
    <PrintShell title="Visiting cards (90 × 54 mm)" back="/hq/printables" toolbar={<span className="text-xs text-blueprint">{contacts.length} {contacts.length === 1 ? "person" : "people"} · 10 cards per A4{withBack ? " · front + back sheets" : ""}</span>}>
      {loading ? (
        <Loading />
      ) : error ? (
        <p className="no-print rounded border border-bad/30 bg-bad/10 px-3 py-2 text-sm text-bad">{error}</p>
      ) : !contacts.length ? (
        <EmptyState icon="Users" title="No one selected" description="Choose team members in Print Studio. Add people in HQ → Team & Payroll." />
      ) : (
        contacts.flatMap((c, i) => [
          <Sheet key={`f${i}`} className="flex items-center justify-center">
            <div className="grid grid-cols-2" style={{ width: "180mm" }}>
              {Array.from({ length: 10 }, (_, j) => (
                <Front key={j} c={c} qr={qr} />
              ))}
            </div>
          </Sheet>,
          ...(withBack
            ? [
                <Sheet key={`b${i}`} className="flex items-center justify-center">
                  <div className="grid grid-cols-2" style={{ width: "180mm" }}>
                    {Array.from({ length: 10 }, (_, j) => (
                      <Back key={j} website={bare(site0)} />
                    ))}
                  </div>
                </Sheet>,
              ]
            : []),
        ])
      )}
    </PrintShell>
  );
}
