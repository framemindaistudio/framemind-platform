"use client";

import { useEffect, useMemo } from "react";
import { useCollection, useSettings } from "@/components/hq/data";
import { EmptyState, Loading } from "@/components/hq/ui";
import { A4Page, PrintShell } from "@/components/print/PrintShell";
import { templateById } from "@/lib/sign/catalog";
import { companyOf, fileNameOf, SIGN_DOCS, signatoriesFor, type SignDoc } from "@/lib/sign/context";
import { Paper, type PaperDoc } from "./Paper";
import { blankPaper, paperOfDoc } from "./papers";
import { useInks } from "./useInks";

/** A CSS string: what a page's foot prints. */
const cssText = (s: string) => `"${s.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/[\r\n]+/g, " ")}"`;

/**
 * Page rules for the print dialog. Each document gets a page type of its own, so its foot carries its own reference
 * and its pages count from 1 again: a pack of five documents prints as five papers, not one long one.
 */
export function pageCss(papers: PaperDoc[]) {
  const foot = "font-family: Arial, Helvetica, sans-serif; font-size: 6.8pt; color: #6b6b6b;";
  const single = papers.length === 1;
  return [
    "@page { size: A4; margin: 13mm 16mm 17mm; }",
    ...papers.map((p, i) => {
      const left = [p.ref, p.name].filter(Boolean).join("  ·  ");
      return `@page sd${i} { counter-increment: sp${i}; @bottom-left { content: ${cssText(left)}; ${foot} } ${p.initials ? `@bottom-center { content: ${cssText(p.initials)}; ${foot} }` : ""} @bottom-right { content: "Page " counter(sp${i})${single ? ' " of " counter(pages)' : ""}; ${foot} } }`;
    }),
  ].join("\n");
}

/**
 * The print view of Documents to Sign.
 * `ids`: saved documents, in the order given (one, or a pack).  `blank`: templates to print with nothing filled in,
 * `copies` of each.
 */
export function SignPrint({ ids, blank, copies, back }: { ids: string[]; blank: string[]; copies: number; back: string }) {
  const { records, loading, error } = useCollection<SignDoc>(SIGN_DOCS);
  const { settings, loading: settingsLoading } = useSettings();
  const { inks, ready: inksReady } = useInks();

  const { papers, missing } = useMemo(() => {
    const company = companyOf(settings);
    const out: PaperDoc[] = [];
    let missing = 0;
    for (const id of ids) {
      const doc = records.find((r) => r.id === id);
      const template = templateById(doc?.template);
      if (doc && template) out.push(paperOfDoc(doc, template, company, inks));
      else missing += 1;
    }
    const signatories = signatoriesFor("", settings);
    for (const id of blank) {
      const template = templateById(id);
      if (!template) missing += 1;
      else for (let c = 0; c < copies; c++) out.push(blankPaper(`${id}-${c}`, template, company, signatories));
    }
    return { papers: out, missing };
  }, [records, settings, ids, blank, copies, inks]);

  const ready = !loading && !settingsLoading && inksReady;
  const first = ids.length ? records.find((r) => r.id === ids[0]) : undefined;
  const heading = !ready ? "Preparing…" : papers.length === 1 ? `${papers[0].name}${first?.partyName ? ` · ${first.partyName}` : blank.length ? " · blank copy" : ""}` : `${papers.length} documents to sign`;

  // the name the browser offers when the paper is saved as a PDF
  useEffect(() => {
    if (!ready || !papers.length) return;
    const one = papers.length === 1;
    document.title = fileNameOf(one ? ["FrameMind", papers[0].name, first?.partyName || (blank.length ? "blank" : ""), first?.date] : ["FrameMind", ids.length && first?.partyName ? `${first.partyName} pack` : "documents to sign", first?.date]);
  }, [ready, papers, first, ids.length, blank.length]);

  return (
    <PrintShell title={heading} back={back} toolbar={ready && papers.length > 0 ? <span className="text-xs text-blueprint">Print on A4, or choose “Save as PDF” in the print window</span> : undefined}>
      {ready && papers.length > 0 && <style>{pageCss(papers)}</style>}
      {!ready ? (
        <Loading label="Getting the documents ready…" />
      ) : error ? (
        <div className="w-full max-w-lg">
          <EmptyState icon="Signature" title="The documents could not be opened" description={error} />
        </div>
      ) : papers.length === 0 ? (
        <div className="w-full max-w-lg">
          <EmptyState icon="Signature" title="Nothing to print" description="Open Documents to Sign, choose a document and press Print." />
        </div>
      ) : (
        <>
          {missing > 0 && <p className="no-print rounded border border-warn/30 bg-warn/10 px-3 py-2 text-sm text-charcoal">{missing === 1 ? "One document" : `${missing} documents`} in this link could not be found and {missing === 1 ? "is" : "are"} left out.</p>}
          {papers.map((p, i) => (
            <A4Page flow key={p.key} padded={false} className="print:min-h-0 print:w-full print:overflow-visible">
              {/* `page` names this document's page type: see pageCss */}
              <div className="px-[16mm] pb-[17mm] pt-[13mm] print:p-0" style={{ page: `sd${i}` } as React.CSSProperties}>
                <Paper doc={p} />
              </div>
            </A4Page>
          ))}
        </>
      )}
    </PrintShell>
  );
}
