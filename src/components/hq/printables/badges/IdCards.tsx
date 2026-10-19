"use client";

import { Fragment, useMemo } from "react";
import { PrintShell } from "@/components/print/PrintShell";
import { useCollection, useSettings } from "@/components/hq/data";
import { EmptyState, Loading } from "@/components/hq/ui";
import { Mark, Sheet, Tile, Wordmark } from "../PrintBits";
import { chunk, csv, initialsOf, str, type Q } from "../util";
import type { BaseRecord } from "@/lib/hq/collections";
import { site } from "@/lib/site";
import { memberPhotoHref } from "@/components/hq/team/MemberPhoto";

/** Deterministic card number from the record id (same person → same number every print). */
function cardNo(id: string) {
  let h = 7;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) % 10000;
  return `FM-${String(h).padStart(4, "0")}`;
}

function badgeLabel(m: BaseRecord) {
  if (/founder/i.test(str(m.role))) return "Founder";
  if (/intern/i.test(str(m.role)) || str(m.type) === "Intern") return "Studio Intern";
  return str(m.type) === "Freelance" ? "Studio Freelancer" : "Studio Team";
}

function Front({ m, valid }: { m: BaseRecord; valid: string }) {
  const name = str(m.name);
  const verified = m.agreementSigned === true;
  return (
    <Tile w={85.6} h={54} className="bg-white">
      <div className="bp-grid-fine pointer-events-none absolute inset-0 opacity-40" aria-hidden />
      <div className="absolute inset-x-0 top-0 flex h-[9.4mm] items-center justify-between bg-graphite px-[4mm]">
        <Wordmark white mm={19} />
        <span className="text-[5.4pt] font-semibold uppercase tracking-[0.24em] text-lime">Team ID</span>
      </div>

      {/* the photo from Team & Payroll, else a box with the initials to paste a photo on */}
      {memberPhotoHref(m) ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={memberPhotoHref(m)} alt={`Photo of ${name}`} className="absolute left-[4mm] top-[12.6mm] border border-graphite/60 object-cover" style={{ width: "21mm", height: "26.5mm" }} />
      ) : (
        <div className="hatch-light absolute left-[4mm] top-[12.6mm] grid place-items-center border border-graphite/60 bg-paper" style={{ width: "21mm", height: "26.5mm" }}>
          <span className="text-[18pt] font-bold tracking-[-0.03em] text-graphite/80">{initialsOf(name) || "FM"}</span>
          <span className="absolute inset-x-0 bottom-[0.8mm] text-center text-[4.6pt] uppercase tracking-[0.22em] text-blueprint">photo</span>
        </div>
      )}

      <div className="absolute left-[28mm] right-[4mm] top-[12.6mm]">
        <p className="text-[10.5pt] font-bold leading-[1.1] tracking-[-0.02em]">{name}</p>
        <p className="mt-[1mm] text-[6.6pt] font-semibold uppercase leading-tight tracking-[0.08em] text-charcoal">{str(m.role)}</p>
        <p className={`mt-[2.4mm] inline-flex items-center gap-[1mm] rounded-full border px-[2mm] py-[0.7mm] text-[5.6pt] font-bold uppercase tracking-[0.1em] ${verified ? "border-graphite bg-graphite text-paper" : "border-graphite/50 text-charcoal"}`}>
          {verified && <span aria-hidden>✓</span>}
          {badgeLabel(m)}
        </p>
        <dl className="mt-[2.4mm] space-y-[0.6mm] font-mono text-[5.8pt] text-charcoal">
          <div className="flex gap-[1.6mm]"><dt className="w-[8mm] text-blueprint">ID</dt><dd>{cardNo(m.id)}</dd></div>
          {valid && (
            <div className="flex gap-[1.6mm]"><dt className="w-[8mm] text-blueprint">VALID</dt><dd>{valid}</dd></div>
          )}
        </dl>
      </div>

      <div className="absolute inset-x-[4mm] bottom-[1.6mm] flex items-center justify-between border-t border-graphite/25 pt-[0.9mm] text-[4.6pt] uppercase tracking-[0.2em] text-blueprint">
        <span>Design · Software · Media · AI</span>
      </div>
    </Tile>
  );
}

function Back({ m, phone, email }: { m: BaseRecord; phone: string; email: string }) {
  const emergency = str(m.emergencyContact);
  return (
    <Tile w={85.6} h={54} className="bg-white">
      <div className="bp-grid-fine pointer-events-none absolute inset-0 opacity-40" aria-hidden />
      <Mark mm={30} className="pointer-events-none absolute -right-[4mm] top-[6mm] opacity-[0.07]" />
      <div className="absolute inset-x-0 top-0 h-[3mm] bg-graphite" />
      <div className="absolute inset-x-[5mm] top-[6.4mm]">
        <p className="text-[5.4pt] font-semibold uppercase tracking-[0.24em] text-blueprint">Emergency contact</p>
        {emergency ? (
          <p className="mt-[0.8mm] text-[8pt] font-semibold leading-tight">{emergency}</p>
        ) : (
          <div className="mt-[3.4mm] border-b border-dotted border-graphite/70" />
        )}

        <p className="mt-[4mm] text-[5.4pt] font-semibold uppercase tracking-[0.24em] text-blueprint">If found, please return to</p>
        <p className="mt-[0.8mm] text-[7.4pt] font-bold leading-tight">{site.legalName}</p>
        <p className="text-[6.6pt] leading-snug text-charcoal">
          {[phone, email].filter(Boolean).join(" · ") || site.location}
        </p>

        <p className="mt-[3.4mm] text-[5.8pt] leading-snug text-charcoal">Please show this card on arrival at a client site or shoot location. This card remains the property of FrameMind AI Studio.</p>
      </div>
      <div className="absolute inset-x-[5mm] bottom-[1.8mm] flex items-center justify-between text-[4.8pt] uppercase tracking-[0.2em] text-blueprint">
        <span>{site.location}</span>
        <span>{site.website.replace(/^https?:\/\//, "")}</span>
      </div>
    </Tile>
  );
}

export function IdCards({ q }: { q: Q }) {
  const { records, loading, error } = useCollection("team");
  const { settings } = useSettings();

  const members = useMemo(() => {
    const ids = csv(q.ids);
    if (ids.length) return ids.map((id) => records.find((r) => r.id === id)).filter((r): r is BaseRecord => !!r);
    return records.filter((r) => r.status !== "inactive");
  }, [records, q.ids]);

  const sheets = chunk(members, 5);
  const phone = settings.phone || site.contact.phone;
  const email = settings.email || site.contact.email;

  return (
    <PrintShell title="Team ID cards (CR80 · 85.6 × 54 mm)" back="/hq/printables" toolbar={<span className="text-xs text-blueprint">{members.length} card{members.length === 1 ? "" : "s"} · front &amp; back · 5 people per A4</span>}>
      {loading ? (
        <Loading />
      ) : error ? (
        <p className="no-print rounded border border-bad/30 bg-bad/10 px-3 py-2 text-sm text-bad">{error}</p>
      ) : !members.length ? (
        <EmptyState icon="Users" title="No team members to print" description="Add people in HQ → Team & Payroll, then choose them in Print Studio." />
      ) : (
        sheets.map((group, i) => (
          <Sheet key={i} className="flex flex-col items-center justify-center gap-[2mm]">
            {group.map((m) => (
              <Fragment key={m.id}>
                <div className="flex gap-[6mm]">
                  <Front m={m} valid={q.valid ?? ""} />
                  <Back m={m} phone={phone} email={email} />
                </div>
              </Fragment>
            ))}
          </Sheet>
        ))
      )}
    </PrintShell>
  );
}
