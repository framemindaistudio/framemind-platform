"use client";

import { PrintShell } from "@/components/print/PrintShell";
import { useSettings } from "@/components/hq/data";
import { site } from "@/lib/site";
import { Mark, Sheet, Wordmark } from "../PrintBits";
import { clampInt, type Q } from "../util";

export function LetterheadDoc({ q }: { q: Q }) {
  const { settings } = useSettings();
  const copies = clampInt(q.pages, 1, 50, 1);
  const ruled = q.ruled === "1";
  const addr = [settings.addressLine1, settings.addressLine2, [settings.city, settings.state, settings.pincode].filter(Boolean).join(", ")].filter(Boolean);
  const contact = [settings.phone || site.contact.phone, settings.email || site.contact.email, settings.website].filter(Boolean);

  return (
    <PrintShell title="Letterhead (blank A4)" back="/hq/printables" toolbar={<span className="text-xs text-blueprint">{copies} sheet{copies === 1 ? "" : "s"}{ruled ? " · ruled" : ""}</span>}>
      {Array.from({ length: copies }, (_, i) => (
        <Sheet key={i} className="flex flex-col px-[18mm] pb-[10mm] pt-[14mm]">
          <Mark mm={120} className="pointer-events-none absolute left-1/2 top-[48%] -translate-x-1/2 -translate-y-1/2 opacity-[0.035]" />

          <header className="relative border-b-2 border-graphite pb-[4mm]">
            <div className="flex items-start justify-between gap-8">
              <Wordmark mm={46} />
              <div className="text-right text-[7.5pt] leading-[1.5] text-charcoal">
                <p className="text-[8.5pt] font-bold text-graphite">{settings.legalName}</p>
                {addr.map((l) => (
                  <p key={l}>{l}</p>
                ))}
                {contact.length > 0 && <p>{contact.join(" · ")}</p>}
                {settings.gstin && <p className="font-semibold">GSTIN: {settings.gstin}</p>}
              </div>
            </div>
            <span aria-hidden className="absolute -bottom-[1.6mm] left-0 size-[2.4mm] rounded-full border-2 border-graphite bg-white" />
            <span aria-hidden className="absolute -bottom-[1.6mm] right-0 size-[2.4mm] rounded-full border-2 border-graphite bg-white" />
          </header>

          <div className="relative flex-1 pt-[8mm]">
            <div className="flex justify-between text-[8pt] text-charcoal">
              <span>Ref: ______________________</span>
              <span>Date: ______________________</span>
            </div>
            {ruled && (
              <div
                aria-hidden
                className="absolute inset-x-0 bottom-0 top-[18mm]"
                style={{ backgroundImage: "repeating-linear-gradient(to bottom, transparent 0, transparent 8.2mm, rgb(43 43 43 / 0.14) 8.2mm, rgb(43 43 43 / 0.14) 8.5mm)" }}
              />
            )}
          </div>

          <footer className="relative flex items-center justify-between border-t border-graphite/30 pt-[2mm] text-[6pt] uppercase tracking-[0.22em] text-blueprint">
            <span>{site.tagline}</span>
            <span>{site.expansion}</span>
          </footer>
        </Sheet>
      ))}
    </PrintShell>
  );
}
