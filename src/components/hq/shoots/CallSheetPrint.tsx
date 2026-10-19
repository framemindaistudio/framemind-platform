"use client";

import { A4Page, Letterhead, PrintFooter, PrintShell } from "@/components/print/PrintShell";
import { useCollection, useSettings } from "@/components/hq/data";
import { list, longDate, str } from "@/components/hq/projects/logic";
import { DAY_STEPS } from "./ShootDetail";

/** A one-page call sheet for a shoot: when, where, who, what to shoot and what to carry. */
export function CallSheetPrint({ id }: { id: string }) {
  const { records, loading } = useCollection("shoots");
  const { records: projects } = useCollection("projects");
  const { settings } = useSettings();
  const s = records.find((r) => r.id === id);
  if (loading) return <PrintShell title="Call sheet" back="/hq/shoots"><p className="text-sm">Loading…</p></PrintShell>;
  if (!s) return <PrintShell title="Call sheet" back="/hq/shoots"><p className="text-sm">Shoot not found.</p></PrintShell>;
  const project = projects.find((p) => p.id === s.projectId);
  const shots = str(s.shotList).split("\n").map((l) => l.replace(/^[\s•\-*\d.)]+/, "").trim()).filter(Boolean);
  const rows: [string, string][] = [
    ["Date", longDate(s.date)],
    ["Crew call", str(s.callTime) || "—"],
    ["Wrap by", str(s.wrapTime) || "—"],
    ["Location", str(s.location) || "—"],
    ["Map", str(s.mapLink) || "—"],
    ["Director / lead", str(s.director) || "—"],
    ["Crew", list(s.crew).join(", ") || "—"],
    ["On-site contact", [str(s.onSiteContact), str(s.onSitePhone)].filter(Boolean).join(" · ") || "—"],
    ["Drone permission", str(s.dronePermission) || "Not needed"],
  ];
  return (
    <PrintShell title={`Call sheet · ${str(s.title)}`} back={`/hq/shoots/${s.id}`}>
      <A4Page>
        <Letterhead settings={settings} docTitle="Call sheet" docMeta={<><p className="font-semibold text-graphite">{str(s.title)}</p><p>{project ? str(project.title) : ""}</p></>} />
        <div className="grid grid-cols-[1fr_62mm] gap-[8mm]">
          <div>
            <table className="w-full text-[9.5pt]">
              <tbody>
                {rows.map(([k, v]) => (
                  <tr key={k} className="border-b border-graphite/10">
                    <td className="w-[38mm] py-[1.8mm] pr-3 text-[7pt] font-semibold uppercase tracking-[0.14em] text-blueprint">{k}</td>
                    <td className="py-[1.8mm] text-graphite">{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <h2 className="mt-[7mm] text-[11pt] font-semibold">Shot list</h2>
            {shots.length ? (
              <ol className="mt-2 space-y-1 text-[9pt]">
                {shots.map((l, i) => (
                  <li key={i} className="flex gap-2.5 border-b border-dashed border-graphite/15 pb-1">
                    <span className="inline-block size-[3.5mm] shrink-0 border border-graphite/50" />
                    <span className="font-mono text-[7.5pt] text-blueprint">{String(i + 1).padStart(2, "0")}</span>
                    {l}
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-2 text-[9pt] text-charcoal">No shot list.</p>
            )}
            {s.notes ? (
              <>
                <h2 className="mt-[6mm] text-[11pt] font-semibold">Notes</h2>
                <p className="mt-1 whitespace-pre-line text-[9pt] text-charcoal">{str(s.notes)}</p>
              </>
            ) : null}
          </div>
          <aside className="space-y-[6mm]">
            <div className="bg-graphite p-[4mm] text-paper">
              <p className="text-[6.5pt] font-semibold uppercase tracking-[0.22em] text-lime">Call time</p>
              <p className="mt-1 text-[22pt] font-semibold leading-none">{str(s.callTime) || "—"}</p>
              <p className="mt-1 text-[8pt] text-paper/60">{longDate(s.date)}</p>
            </div>
            <div>
              <p className="text-[7pt] font-semibold uppercase tracking-[0.16em] text-blueprint">Gear to carry</p>
              <ul className="mt-1.5 space-y-1 text-[8.5pt]">
                {(list(s.gear).length ? list(s.gear) : ["—"]).map((g) => (
                  <li key={g} className="flex gap-2">
                    <span className="inline-block size-[3mm] shrink-0 border border-graphite/50" /> {g}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-[7pt] font-semibold uppercase tracking-[0.16em] text-blueprint">Shoot-day checklist</p>
              <ul className="mt-1.5 space-y-1 text-[8pt]">
                {DAY_STEPS.map((d) => (
                  <li key={d.id} className="flex gap-2">
                    <span className="inline-block size-[3mm] shrink-0 border border-graphite/50" /> {d.label}
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
        <PrintFooter note={`${settings.legalName} · ${settings.phone}`} />
      </A4Page>
    </PrintShell>
  );
}
