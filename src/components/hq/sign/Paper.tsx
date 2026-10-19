import { Fragment } from "react";
import Image from "next/image";
import { LINE_MARK } from "@/lib/sign/text";
import type { Block, Company, SignBlock } from "@/lib/sign/types";
import { cn } from "@/lib/utils";

/**
 * A document to sign, as paper: the company's letterhead, the reference and date, then the blocks a template built.
 * The same component draws the preview in HQ and the printed sheet, so what is seen is what is signed.
 * Sizes are in millimetres and points; the text flows over as many pages as it needs when printed.
 */

export interface PaperDoc {
  key: string;
  /** short name, for the foot of each page */
  name: string;
  ref: string;
  /** the date as printed ("13 October 2026"), or "" for a line to write it on */
  date: string;
  company: Company;
  blocks: Block[];
  /** set for agreements: the words of the initials line at the foot of every page */
  initials?: string;
  /** the founders' saved signatures to print above their names (name → picture), when the paper carries them */
  inks?: Record<string, string>;
}

/* ───────────────────────────── text with its two marks ───────────────────────────── */

/** A line to write on by hand. It never grows wider than the space it sits in. */
function WriteIn({ mm }: { mm: number }) {
  return <span aria-label="to be filled in by hand" className="inline-block max-w-full border-b border-dotted border-graphite/70 align-baseline" style={{ width: `${mm}mm`, height: "1em" }} />;
}

/** **bold** and write-in lines; a line break in the text is a line break on paper. */
export function Rich({ text }: { text: string }) {
  return (
    <>
      {text.split("\n").map((row, r) => (
        <Fragment key={r}>
          {r > 0 && <br />}
          {row.split(/(\*\*[^*]+\*\*)/g).map((piece, i) => {
            const bold = piece.startsWith("**") && piece.endsWith("**") && piece.length > 4;
            const body = bold ? piece.slice(2, -2) : piece;
            const bits = body.split(LINE_MARK);
            // split() with one capture group gives text, width, text, width … in turn
            const out = bits.map((bit, j) => (j % 2 ? <WriteIn key={j} mm={Number(bit) || 30} /> : <Fragment key={j}>{bit}</Fragment>));
            return bold ? <strong key={i} className="font-semibold">{out}</strong> : <Fragment key={i}>{out}</Fragment>;
          })}
        </Fragment>
      ))}
    </>
  );
}

/* ───────────────────────────── the letterhead ───────────────────────────── */

function Letterhead({ company }: { company: Company }) {
  const contact = [company.phone, company.email, company.website.replace(/^https?:\/\//, "").replace(/\/$/, "")].filter(Boolean);
  return (
    <header className="mb-[3.8mm] border-b-[0.5mm] border-graphite pb-[2.8mm]">
      <div className="flex items-end justify-between gap-[8mm]">
        <div className="flex items-center gap-[2.5mm]">
          <Image src="/brand/fm-mark-light.png" alt="" width={512} height={512} sizes="80px" loading="eager" className="size-[11mm] select-none" />
          <div className="leading-none">
            <p className="text-[13pt] font-semibold tracking-[-0.02em] text-graphite">{company.brandName || "FrameMind"}</p>
            <p className="mt-[1mm] text-[5.5pt] font-medium uppercase tracking-[0.32em] text-violet">AI Studio</p>
          </div>
        </div>
        <div className="text-right text-[7pt] leading-[1.45] text-charcoal">
          <p className="text-[8pt] font-bold text-graphite">{company.legalName}</p>
          {company.address && <p>{company.address}</p>}
          {contact.length > 0 && <p>{contact.join("  ·  ")}</p>}
          {(company.gstin || company.pan) && <p className="font-semibold">{[company.gstin && `GSTIN ${company.gstin}`, company.pan && `PAN ${company.pan}`].filter(Boolean).join("  ·  ")}</p>}
        </div>
      </div>
    </header>
  );
}

/* ───────────────────────────── signatures ───────────────────────────── */

function Signature({ block, ink }: { block: SignBlock; ink?: string }) {
  return (
    <div className="min-w-0 break-inside-avoid">
      <p className="text-[6.6pt] font-semibold uppercase tracking-[0.16em] text-blueprint">{block.heading}</p>
      <div className="relative h-[13.5mm] border-b-[0.3mm] border-graphite">
        {ink && (
          // a saved signature, printed as it was written: an <img>, so the print keeps it sharp at any size
          // eslint-disable-next-line @next/next/no-img-element
          <img src={ink} alt={`Signature of ${block.name}`} className="absolute bottom-[0.4mm] left-0 max-h-[12.6mm] max-w-full object-contain object-left-bottom" />
        )}
        {block.seal && (
          <span aria-hidden className="absolute bottom-[1mm] right-0 grid size-[12mm] place-items-center rounded-full border-[0.25mm] border-dashed border-graphite/45 text-[5.6pt] uppercase tracking-[0.14em] text-blueprint">
            Seal
          </span>
        )}
      </div>
      <p className="mt-[0.8mm] text-[6pt] uppercase tracking-[0.14em] text-blueprint">Signature</p>
      {block.name ? (
        <p className="mt-[1.2mm] text-[9.2pt] font-semibold leading-tight">{block.name}</p>
      ) : (
        <p className="mt-[2.1mm] text-[8.4pt]">
          Name: <WriteIn mm={52} />
        </p>
      )}
      {block.title ? (
        <p className="text-[8pt] leading-snug text-charcoal">{block.title}</p>
      ) : (
        !block.name &&
        block.heading !== "Signature" &&
        !/witness/i.test(block.heading) && (
          <p className="mt-[1.7mm] text-[8.4pt]">
            Designation: <WriteIn mm={40} />
          </p>
        )
      )}
      {(block.lines ?? []).map((l) => (
        <p key={l} className="mt-[2.2mm] text-[8.6pt]">
          {l}: <WriteIn mm={l.length > 8 ? 50 : 38} />
        </p>
      ))}
    </div>
  );
}

/* ───────────────────────────── the blocks ───────────────────────────── */

function Blocks({ blocks, inks }: { blocks: Block[]; inks?: Record<string, string> }) {
  // the number of each clause, worked out before anything is drawn (0 for a block that is not a clause)
  const clauseNo = blocks.reduce<number[]>((acc, b) => [...acc, b.t === "clause" ? acc.filter(Boolean).length + 1 : 0], []);
  return (
    <>
      {blocks.map((block, i) => {
        switch (block.t) {
          case "title":
            return (
              <div key={i} className="mb-[3.4mm] mt-[0.6mm] text-center">
                <h1 className="text-[12.4pt] font-bold uppercase leading-snug tracking-[0.04em]">{block.text}</h1>
                {block.sub && <p className="mt-[1mm] text-[8.6pt] text-charcoal">{block.sub}</p>}
              </div>
            );
          case "to":
            return (
              <div key={i} className="mb-[3.2mm] leading-[1.4]">
                <p>To,</p>
                {block.lines.map((l, j) => (
                  <p key={j} className={j === 0 ? "font-semibold" : undefined}>
                    <Rich text={l} />
                  </p>
                ))}
              </div>
            );
          case "subject":
            return (
              <p key={i} className="my-[2.8mm] font-semibold">
                Subject: <Rich text={block.text} />
              </p>
            );
          case "p":
            return (
              // a line that leads into the signatures ("Yours sincerely,") stays on the page with them
              <p key={i} className={cn("my-[1.9mm]", block.align === "right" && "text-right", block.align === "center" && "text-center", blocks[i + 1]?.t === "sign" && "break-after-avoid")}>
                <Rich text={block.text} />
              </p>
            );
          case "h":
            return (
              <h2 key={i} className="mb-[1.2mm] mt-[3.6mm] break-after-avoid text-[9.7pt] font-bold">
                <Rich text={block.text} />
              </h2>
            );
          case "clause": {
            const n = clauseNo[i];
            return (
              <section key={i} className="mt-[3mm]">
                <h2 className="mb-[0.9mm] break-after-avoid text-[9.7pt] font-bold">
                  {n}. <Rich text={block.title} />
                </h2>
                {block.items.length === 1 ? (
                  <p className="my-[1.1mm]">
                    <Rich text={block.items[0]} />
                  </p>
                ) : (
                  block.items.map((item, j) => (
                    <div key={j} className="my-[1.1mm] grid grid-cols-[10.5mm_minmax(0,1fr)]">
                      <span className="tabular text-charcoal">
                        {n}.{j + 1}
                      </span>
                      <p>
                        <Rich text={item} />
                      </p>
                    </div>
                  ))
                )}
              </section>
            );
          }
          case "list":
            return (
              <div key={i} className="my-[1.6mm]">
                {block.items.map((item, j) => (
                  <div key={j} className="my-[0.9mm] grid grid-cols-[6.5mm_minmax(0,1fr)]">
                    <span className="tabular text-charcoal">{block.ordered ? `${j + 1}.` : "•"}</span>
                    <p>
                      <Rich text={item} />
                    </p>
                  </div>
                ))}
              </div>
            );
          case "checks":
            return (
              <div key={i} className="my-[1.9mm]">
                {block.items.map((item, j) => (
                  <div key={j} className="my-[1.3mm] grid break-inside-avoid grid-cols-[6.5mm_minmax(0,1fr)]">
                    <span aria-hidden className="mt-[0.6mm] inline-block size-[3.4mm] border-[0.35mm] border-graphite bg-white" />
                    <p>
                      <Rich text={item} />
                    </p>
                  </div>
                ))}
              </div>
            );
          case "table":
            return (
              <table key={i} className="my-[2.4mm] w-full table-fixed border-collapse text-[8.5pt] leading-[1.38]">
                {block.widths && (
                  <colgroup>
                    {block.widths.map((w, j) => (
                      <col key={j} style={{ width: `${w}%` }} />
                    ))}
                  </colgroup>
                )}
                {block.head && (
                  <thead>
                    <tr>
                      {block.head.map((h, j) => (
                        <th key={j} className="border-[0.25mm] border-graphite/40 bg-paper px-[2mm] py-[1.05mm] text-left text-[7.2pt] font-semibold uppercase tracking-[0.08em]">
                          <Rich text={h} />
                        </th>
                      ))}
                    </tr>
                  </thead>
                )}
                <tbody>
                  {block.rows.map((row, j) => (
                    <tr key={j} className="break-inside-avoid">
                      {row.map((cell, k) => (
                        <td key={k} className={cn("border-[0.25mm] border-graphite/40 px-[2mm] py-[1.05mm] align-top", !block.head && k === 0 && row.length === 2 && "bg-paper-50 font-semibold")}>
                          <Rich text={cell} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            );
          case "fields":
            return (
              <div key={i} className={cn("my-[2.4mm] grid gap-x-[8mm]", block.cols === 2 ? "grid-cols-2" : "grid-cols-1")}>
                {block.rows.map(([label, value], j) => (
                  <div key={j} className="break-inside-avoid pb-[2mm]">
                    <div className="flex min-h-[6.2mm] items-end border-b border-dotted border-graphite/70 pb-[0.5mm] font-semibold">
                      <Rich text={value} />
                    </div>
                    <p className="mt-[0.7mm] text-[6pt] font-semibold uppercase tracking-[0.13em] text-blueprint">{label}</p>
                  </div>
                ))}
              </div>
            );
          case "note":
            return (
              <p key={i} className="my-[2.4mm] break-inside-avoid border-l-[0.8mm] border-graphite/60 bg-paper-50 px-[3mm] py-[1.6mm] text-[8.5pt]">
                <Rich text={block.text} />
              </p>
            );
          case "sign":
            return (
              <div key={i} className={cn("mt-[4.4mm] grid break-inside-avoid gap-x-[12mm] gap-y-[5mm]", block.blocks.length === 1 ? "grid-cols-2" : block.blocks.length === 3 ? "grid-cols-3" : "grid-cols-2")}>
                {block.blocks.map((s, j) => (
                  <Signature key={j} block={s} ink={s.heading.startsWith("For ") ? inks?.[s.name] : undefined} />
                ))}
              </div>
            );
          case "break":
            return (
              <div key={i} className="break-before-page">
                <p className="no-print my-[5mm] border-t border-dashed border-graphite/30 pt-[1mm] text-center text-[6.4pt] uppercase tracking-[0.2em] text-blueprint">New page</p>
              </div>
            );
          case "gap":
            return <div key={i} style={{ height: `${block.mm ?? 4}mm` }} />;
        }
      })}
    </>
  );
}

/* ───────────────────────────── the sheet ───────────────────────────── */

export function Paper({ doc }: { doc: PaperDoc }) {
  return (
    <article className="sign-paper text-[9.2pt] leading-[1.44] text-graphite">
      <Letterhead company={doc.company} />
      <div className="mb-[2.8mm] flex items-baseline justify-between gap-[6mm] text-[8.4pt]">
        <span>
          Ref: {doc.ref ? <span className="tabular font-semibold">{doc.ref}</span> : <WriteIn mm={42} />}
        </span>
        <span>
          Date: {doc.date ? <span className="font-semibold">{doc.date}</span> : <WriteIn mm={34} />}
        </span>
      </div>
      <Blocks blocks={doc.blocks} inks={doc.inks} />
    </article>
  );
}
