"use client";

import { useEffect, useMemo } from "react";
import Image from "next/image";
import { COACHING, SERVICES, TERMS, VRITTA } from "@/lib/content/catalog";
import type { BaseRecord } from "@/lib/hq/collections";
import type { CompanySettings } from "@/lib/hq/settings";
import { site } from "@/lib/site";
import { amountInWords, formatDate, formatINR, pad2 } from "@/lib/utils";
import { Badge, statusTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { A4Page, PrintShell } from "@/components/print/PrintShell";
import { useCollection, useHq, useRates, useSettings } from "@/components/hq/data";
import type { QuoteLine, QuoteMoney } from "@/lib/pricebook/math";
import { str } from "./crm";
import { extraItemsOf, linesOf, milestonePlan, moneyOf } from "./quote";

const LABEL = "text-[6.5pt] font-semibold uppercase tracking-[0.22em] text-blueprint";

interface Ctx {
  quote: BaseRecord;
  client: BaseRecord | undefined;
  clientName: string;
  settings: CompanySettings;
  number: string;
  money: QuoteMoney;
  lines: QuoteLine[];
  plan: { label: string; percent: number; amount: number }[];
  signatory: { name: string; title: string };
}

function RunningHead({ c, section, page }: { c: Ctx; section: string; page: string }) {
  return (
    <div className="mb-[9mm] flex items-center justify-between border-b border-graphite/15 pb-[3mm]">
      <div className="flex items-center gap-2.5">
        <Image src="/brand/fm-mark-light.png" alt="" width={512} height={512} className="size-[8mm]" />
        <span className="text-[9pt] font-semibold tracking-[-0.01em] text-graphite">FrameMind AI Studio</span>
        <span className="text-[8pt] text-blueprint">· {section}</span>
      </div>
      <span className="font-mono text-[7.5pt] text-blueprint">{page}</span>
    </div>
  );
}

function Foot({ c }: { c: Ctx }) {
  const contact = [c.settings.phone, c.settings.email, c.settings.website].filter(Boolean).join("  ·  ");
  return (
    <div className="absolute inset-x-[16mm] bottom-[8mm] flex items-center justify-between border-t border-graphite/15 pt-2 text-[7pt] text-blueprint">
      <span>
        {c.number} · {c.clientName}
      </span>
      <span>{contact}</span>
    </div>
  );
}

/* ─────────────────────────── 1 · cover ─────────────────────────── */

function Cover({ c }: { c: Ctx }) {
  const { quote, client, money, settings } = c;
  const attention = [str(client?.contactName), str(client?.contactRole)].filter(Boolean).join(", ");
  const meta: [string, string][] = [
    ["Quote no.", c.number],
    ["Date", formatDate(str(quote.date))],
    ["Valid until", formatDate(str(quote.validUntil))],
    ["Prepared by", c.signatory.name],
  ];
  return (
    <A4Page padded={false}>
      <section className="absolute inset-0 flex flex-col bg-graphite text-paper">
        <div className="pointer-events-none absolute -left-[40mm] -top-[40mm] size-[150mm] rounded-full bg-violet/30 blur-[40mm]" aria-hidden />
        <div className="pointer-events-none absolute -bottom-[50mm] right-[-30mm] size-[130mm] rounded-full bg-lime/15 blur-[40mm]" aria-hidden />
        <div className="relative flex items-start justify-between px-[16mm] pt-[16mm]">
          <div className="flex items-center gap-3">
            <Image src="/brand/fm-mark-dark.png" alt="" width={512} height={512} className="size-[16mm]" priority />
            <div className="leading-none">
              <p className="text-[18pt] font-semibold tracking-[-0.02em]">FrameMind</p>
              <p className="mt-1.5 text-[7pt] font-medium uppercase tracking-[0.34em] text-lime">AI Studio</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[6.5pt] font-semibold uppercase tracking-[0.22em] text-paper/45">Quote</p>
            <p className="mt-1 font-mono text-[10pt] font-semibold">{c.number}</p>
          </div>
        </div>

        <div className="relative mt-[38mm] px-[16mm]">
          <p className="inline-flex items-center gap-2 rounded-full border border-paper/20 px-3 py-1 text-[7pt] font-semibold uppercase tracking-[0.22em] text-paper/60">
            <span className="size-1.5 rounded-full bg-lime" /> Prepared for
          </p>
          <h1 className="mt-5 max-w-[165mm] text-[38pt] font-semibold leading-[1.02] tracking-[-0.035em]">{c.clientName}</h1>
          {attention && <p className="mt-3 text-[10pt] text-paper/60">Attention: {attention}</p>}
          {str(quote.title) && (
            <p className="mt-9 max-w-[150mm] border-l-[3px] border-lime pl-4 text-[15pt] font-medium leading-snug tracking-[-0.01em] text-paper/90">{str(quote.title)}</p>
          )}
        </div>

        <div className="relative mt-auto px-[16mm] pb-[16mm]">
          <div className="mb-[10mm] flex flex-wrap gap-2">
            {c.lines.map((l) => (
              <span key={l.key} className="rounded-full border border-paper/20 px-3 py-1 text-[8pt] text-paper/75">
                {l.title}
              </span>
            ))}
          </div>
          <div className="grid grid-cols-[1fr_auto] items-end gap-6 border-t border-paper/15 pt-[6mm]">
            <dl className="grid grid-cols-4 gap-4">
              {meta.map(([k, v]) => (
                <div key={k}>
                  <dt className="text-[6.5pt] font-semibold uppercase tracking-[0.22em] text-paper/40">{k}</dt>
                  <dd className="mt-1 text-[9.5pt] font-semibold">{v}</dd>
                </div>
              ))}
            </dl>
            <div className="text-right">
              <p className="text-[6.5pt] font-semibold uppercase tracking-[0.22em] text-paper/40">Investment</p>
              <p className="mt-1 text-[20pt] font-semibold leading-none text-lime">{formatINR(money.taxable)}</p>
              <p className="mt-1 text-[7.5pt] text-paper/50">+ GST {money.gstPercent}%</p>
            </div>
          </div>
          <p className="mt-[8mm] text-[7.5pt] text-paper/45">{[settings.phone, settings.email, settings.website].filter(Boolean).join("   ·   ")}</p>
        </div>
      </section>
    </A4Page>
  );
}

/* ─────────────────────────── 2 · scope pages ─────────────────────────── */

/** How tall a line is on paper, in rows (used to split lines over pages). */
function rowsOf(l: QuoteLine) {
  const items = l.kind === "service" || l.kind === "custom" ? l.items.length : l.kind === "vritta" ? 1 + l.oneTime.length : 1;
  const included = l.kind === "service" ? Math.ceil((SERVICES.find((s) => s.id === l.serviceId)?.included.length ?? 0) / 2) : 0;
  return 4 + items + included + (l.note ? 1 : 0);
}

function chunk(lines: QuoteLine[], budget = 36) {
  const pages: QuoteLine[][] = [];
  let cur: QuoteLine[] = [];
  let used = 0;
  for (const l of lines) {
    const r = rowsOf(l);
    if (cur.length && used + r > budget) {
      pages.push(cur);
      cur = [];
      used = 0;
    }
    cur.push(l);
    used += r;
  }
  if (cur.length) pages.push(cur);
  return pages;
}

function LineBlock({ line, n }: { line: QuoteLine; n: number }) {
  const service = line.kind === "service" ? SERVICES.find((s) => s.id === line.serviceId) : undefined;
  const rows: { group: string; label: string; price: number }[] =
    line.kind === "service" || line.kind === "custom"
      ? line.items
      : line.kind === "vritta"
        ? [{ group: "Licence", label: `${VRITTA.editions.find((e) => e.id === line.edition)?.name} edition — ${line.billing} licence (${line.segment})${line.group ? `, group rate` : ""}`, price: line.licence }, ...line.oneTime]
        : [{ group: "Programme", label: `${COACHING.days}-day 1:1 programme, ${line.mode} × ${line.learners} learner${line.learners === 1 ? "" : "s"}`, price: line.amount }];
  const monthly = (line.kind === "service" || line.kind === "custom") && line.billing === "month";
  return (
    <article className="break-inside-avoid border-t border-graphite/80 pt-[4mm]">
      <div className="flex items-baseline justify-between gap-4">
        <h3 className="flex items-baseline gap-3 text-[13pt] font-semibold tracking-[-0.015em] text-graphite">
          <span className="font-mono text-[8pt] font-medium text-blueprint">{pad2(n)}</span>
          {line.title}
        </h3>
        <p className="tabular text-[12pt] font-semibold text-graphite">
          {formatINR(line.amount)}
          {monthly && <span className="text-[8pt] font-normal text-charcoal"> /month{line.kind === "service" && (line.months ?? 1) > 1 ? ` × ${line.months}` : ""}</span>}
        </p>
      </div>
      {service && <p className="mt-1 max-w-[150mm] text-[8.5pt] leading-snug text-charcoal">{service.description}</p>}
      {line.kind === "vritta" && <p className="mt-1 max-w-[150mm] text-[8.5pt] leading-snug text-charcoal">{VRITTA.line}</p>}
      {line.kind === "coaching" && <p className="mt-1 max-w-[150mm] text-[8.5pt] leading-snug text-charcoal">{COACHING.line}</p>}
      <table className="mt-[3mm] w-full text-[8.5pt]">
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-dashed border-graphite/15">
              <td className="w-[44mm] py-[1.4mm] pr-3 align-top text-[7pt] uppercase tracking-[0.12em] text-blueprint">{i === 0 || rows[i - 1].group !== r.group ? r.group : ""}</td>
              <td className="py-[1.4mm] pr-3 text-graphite">{r.label}</td>
              <td className="tabular py-[1.4mm] text-right text-charcoal">{r.price ? formatINR(r.price) : "Included"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {line.kind === "service" && line.billing === "month" && (line.contractDiscountPercent ?? 0) > 0 && (
        <p className="mt-1.5 text-[7.5pt] text-charcoal">{line.months}-month contract: {line.contractDiscountPercent}% off the monthly fee (included above).</p>
      )}
      {service && service.included.length > 0 && (
        <ul className="mt-[2.5mm] grid grid-cols-2 gap-x-6 gap-y-0.5 text-[7.5pt] text-charcoal">
          {service.included.map((x) => (
            <li key={x} className="flex gap-1.5">
              <span className="text-graphite">✓</span> {x}
            </li>
          ))}
        </ul>
      )}
      {line.note && <p className="mt-2 text-[8pt] italic text-charcoal">Note: {line.note}</p>}
    </article>
  );
}

function ScopePage({ c, lines, start, page, first }: { c: Ctx; lines: QuoteLine[]; start: number; page: string; first: boolean }) {
  return (
    <A4Page>
      <RunningHead c={c} section="Scope of work" page={page} />
      {first && (
        <div className="mb-[7mm]">
          <p className={LABEL}>01 · Scope</p>
          <h2 className="mt-2 text-[22pt] font-semibold leading-tight tracking-[-0.03em] text-graphite">What we&apos;ll build for you</h2>
          <p className="mt-2 max-w-[160mm] text-[9pt] leading-relaxed text-charcoal">Every option below was chosen with you. Each is designed, built and tested individually — and you own everything we make.</p>
        </div>
      )}
      <div className="space-y-[6mm]">
        {lines.map((l, i) => (
          <LineBlock key={l.key} line={l} n={start + i} />
        ))}
      </div>
      <Foot c={c} />
    </A4Page>
  );
}

/* ─────────────────────────── 3 · investment & terms ─────────────────────────── */

function InvestmentPage({ c, page }: { c: Ctx; page: string }) {
  const { money: m, quote, settings } = c;
  const extra = extraItemsOf(quote);
  const weeks = Number(quote.timelineWeeks) || 0;
  const revisions = Number(quote.revisionRounds);
  return (
    <A4Page>
      <RunningHead c={c} section="Investment" page={page} />
      <p className={LABEL}>02 · Investment</p>
      <h2 className="mt-2 text-[22pt] font-semibold leading-tight tracking-[-0.03em] text-graphite">Your investment</h2>

      <div className="mt-[6mm] grid grid-cols-[1fr_68mm] gap-[8mm]">
        <table className="w-full text-[9pt]">
          <tbody>
            {c.lines.map((l, i) => (
              <tr key={l.key} className="border-b border-graphite/12">
                <td className="py-[2mm] pr-3">
                  <span className="mr-2 font-mono text-[7pt] text-blueprint">{pad2(i + 1)}</span>
                  {l.title}
                </td>
                <td className="tabular py-[2mm] text-right">
                  {formatINR(l.amount)}
                  {"billing" in l && l.billing === "month" ? <span className="text-[7.5pt] text-charcoal"> /mo</span> : null}
                </td>
              </tr>
            ))}
            {extra.map((x, i) => (
              <tr key={`x${i}`} className="border-b border-graphite/12">
                <td className="py-[2mm] pr-3">{x.description}</td>
                <td className="tabular py-[2mm] text-right">{formatINR((Number(x.qty) || 0) * (Number(x.rate) || 0))}</td>
              </tr>
            ))}
            {m.monthly > 0 && (
              <tr className="border-b border-graphite/12 text-charcoal">
                <td className="py-[2mm] pr-3">Monthly retainer × {m.months} month{m.months === 1 ? "" : "s"}</td>
                <td className="tabular py-[2mm] text-right">{formatINR(m.monthly * m.months)}</td>
              </tr>
            )}
            {m.bundleAmount > 0 && (
              <tr className="border-b border-graphite/12 text-charcoal">
                <td className="py-[2mm] pr-3">Studio bundle — {m.serviceCount} services ({m.bundlePercent}% off)</td>
                <td className="tabular py-[2mm] text-right">− {formatINR(m.bundleAmount)}</td>
              </tr>
            )}
            {m.extraAmount > 0 && (
              <tr className="border-b border-graphite/12 text-charcoal">
                <td className="py-[2mm] pr-3">Discount ({m.extraPercent}%)</td>
                <td className="tabular py-[2mm] text-right">− {formatINR(m.extraAmount)}</td>
              </tr>
            )}
          </tbody>
        </table>
        <div className="self-start bg-graphite p-[6mm] text-paper">
          <p className="text-[6.5pt] font-semibold uppercase tracking-[0.22em] text-lime">Total</p>
          <p className="tabular mt-2 text-[22pt] font-semibold leading-none">{formatINR(m.total)}</p>
          <dl className="mt-[4mm] space-y-1 text-[8pt] text-paper/70">
            <div className="flex justify-between">
              <dt>Before GST</dt>
              <dd className="tabular">{formatINR(m.taxable)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>GST {m.gstPercent}%</dt>
              <dd className="tabular">{formatINR(m.gst)}</dd>
            </div>
          </dl>
          <p className="mt-[4mm] text-[7pt] leading-snug text-paper/50">{amountInWords(Math.round(m.total))}</p>
        </div>
      </div>

      {c.plan.some((p) => p.amount > 0) && (
        <div className="mt-[8mm]">
          <p className={LABEL}>Payment milestones</p>
          <div className="mt-[3mm] grid gap-[3mm]" style={{ gridTemplateColumns: `repeat(${Math.min(4, c.plan.length)}, minmax(0, 1fr))` }}>
            {c.plan.map((p, i) => (
              <div key={p.label} className="border-t-[3px] border-lime pt-[2.5mm]">
                <p className="font-mono text-[7pt] text-blueprint">{pad2(i + 1)}</p>
                <p className="mt-0.5 text-[9pt] font-semibold text-graphite">{p.label}</p>
                <p className="tabular mt-1 text-[11pt] font-semibold text-graphite">{formatINR(p.amount)}</p>
                <p className="text-[7.5pt] text-charcoal">{p.percent}% · + GST</p>
              </div>
            ))}
          </div>
          {m.monthly > 0 && <p className="mt-[3mm] text-[8pt] text-charcoal">Monthly retainers ({formatINR(m.monthlyNet)} + GST per month after discounts) are invoiced at the start of each month.</p>}
        </div>
      )}

      <div className="mt-[8mm] grid grid-cols-3 gap-[6mm] border-t border-graphite/15 pt-[5mm] text-[8.5pt]">
        <div>
          <p className={LABEL}>Timeline</p>
          <p className="mt-1 text-graphite">{weeks > 0 ? `About ${weeks} week${weeks === 1 ? "" : "s"} from the advance and content` : TERMS.timelines}</p>
        </div>
        <div>
          <p className={LABEL}>Revisions</p>
          <p className="mt-1 text-graphite">{Number.isFinite(revisions) ? `${revisions} round${revisions === 1 ? "" : "s"} per design stage` : TERMS.revisionPolicy}</p>
        </div>
        <div>
          <p className={LABEL}>Payment</p>
          <p className="mt-1 text-graphite">
            {settings.bankName ? `${settings.bankName}` : "Bank transfer / UPI"}
            {settings.upiId ? ` · UPI ${settings.upiId}` : ""}
          </p>
        </div>
      </div>

      {str(quote.notes) && (
        <div className="mt-[6mm] border-l-[3px] border-graphite pl-4">
          <p className={LABEL}>Notes</p>
          <p className="mt-1 whitespace-pre-line text-[8.5pt] leading-relaxed text-charcoal">{str(quote.notes)}</p>
        </div>
      )}
      <Foot c={c} />
    </A4Page>
  );
}

function TermsPage({ c, page }: { c: Ctx; page: string }) {
  const include = c.quote.includeTerms !== false;
  return (
    <A4Page>
      <RunningHead c={c} section="How we work" page={page} />
      <p className={LABEL}>03 · How we work</p>
      <h2 className="mt-2 text-[22pt] font-semibold leading-tight tracking-[-0.03em] text-graphite">From first message to final delivery</h2>
      <ol className="mt-[6mm] grid grid-cols-2 gap-x-[8mm] gap-y-[5mm]">
        {TERMS.process.map((s, i) => (
          <li key={s.title} className="flex gap-3">
            <span className="grid size-[8mm] shrink-0 place-items-center rounded-full bg-lime font-mono text-[8pt] font-semibold text-graphite">{i + 1}</span>
            <span>
              <span className="block text-[10pt] font-semibold text-graphite">{s.title}</span>
              <span className="mt-0.5 block text-[8.5pt] leading-snug text-charcoal">{s.detail}</span>
            </span>
          </li>
        ))}
      </ol>

      {include && (
        <div className="mt-[9mm] space-y-[4mm] text-[8.5pt] leading-relaxed text-charcoal">
          {[
            ["Revisions", TERMS.revisionPolicy],
            ["What we need from you", TERMS.clientResponsibilities],
            ["Handover", TERMS.handoff],
            ["Pricing", TERMS.pricesFinal],
            ["Third parties", "Hosting, domains, paid plugins, payment-gateway fees, API usage and ad spend are billed by their providers directly to you, unless this quote lists them."],
            ["International clients", TERMS.international],
          ].map(([k, v]) => (
            <div key={k} className="grid grid-cols-[42mm_1fr] gap-4 border-t border-graphite/10 pt-[3mm]">
              <p className="font-semibold text-graphite">{k}</p>
              <p>{v}</p>
            </div>
          ))}
        </div>
      )}

      <div className="absolute inset-x-[16mm] bottom-[22mm] grid grid-cols-2 gap-[12mm]">
        <div>
          <p className={LABEL}>For FrameMind AI Studio</p>
          <div className="mt-[14mm] border-t border-graphite/60 pt-1.5 text-[8.5pt]">
            <p className="font-semibold text-graphite">{c.signatory.name}</p>
            <p className="text-charcoal">{c.signatory.title}</p>
          </div>
        </div>
        <div>
          <p className={LABEL}>Accepted by {c.clientName}</p>
          <div className="mt-[14mm] border-t border-graphite/60 pt-1.5 text-[8.5pt]">
            <p className="text-charcoal">Name, signature &amp; date</p>
          </div>
        </div>
      </div>
      <Foot c={c} />
    </A4Page>
  );
}

/* ─────────────────────────── the document ─────────────────────────── */

function Notice({ title, body }: { title: string; body: string }) {
  return (
    <div className="no-print w-full max-w-md rounded-[var(--radius-md)] border border-graphite/20 bg-paper p-6 text-center">
      <p className="text-sm font-semibold text-graphite">{title}</p>
      <p className="mt-1 text-sm text-charcoal">{body}</p>
    </div>
  );
}

export function ProposalPrint({ id }: { id: string }) {
  const proposals = useCollection("proposals");
  const clients = useCollection("clients");
  const { settings, loading: settingsLoading } = useSettings();
  const { store } = useHq();
  const rates = useRates();

  const quote = proposals.records.find((r) => r.id === id);
  const client = quote ? clients.records.find((s) => s.id === quote.clientId) : undefined;
  const money = useMemo(() => (quote ? moneyOf(quote, rates) : null), [quote, rates]);

  const clientName = str(client?.name) || "Our client";
  const number = quote ? str(quote.number) || "Draft quote" : "";

  /* "Save as PDF" proposes the page title as the file name */
  useEffect(() => {
    if (!quote) return;
    const prev = document.title;
    document.title = `${number} — Quote for ${clientName} — FrameMind AI Studio`.replace(/[\\/:*?"<>|]+/g, "-");
    return () => {
      document.title = prev;
    };
  }, [quote, number, clientName]);

  if (proposals.loading || clients.loading || settingsLoading) {
    return (
      <PrintShell title="Quote" back="/hq/proposals">
        <Notice title="Preparing your quote…" body="Loading the quote, client and company details." />
      </PrintShell>
    );
  }
  if (!quote || !money) {
    return (
      <PrintShell title="Quote" back="/hq/proposals">
        <Notice title="Quote not found" body="It may have been deleted, or the link is out of date." />
      </PrintShell>
    );
  }

  const founder = site.founders[0];
  const lines = linesOf(quote);
  const c: Ctx = {
    quote,
    client,
    clientName,
    settings,
    number,
    money,
    lines,
    plan: milestonePlan(quote, money, rates?.terms.milestones ?? TERMS.defaultMilestones),
    signatory: { name: settings.signatoryName || founder.name, title: settings.signatoryTitle || founder.role },
  };
  const scope = chunk(lines);
  const total = 1 + scope.length + 2;
  const label = (n: number) => `${number} · ${n} / ${total}`;
  // the number of each scope page's first line: 1, then running on from the page before
  const starts = scope.map((_, i) => 1 + scope.slice(0, i).reduce((n, p) => n + p.length, 0));

  return (
    <PrintShell
      title={`${number} · ${clientName}`}
      back={`/hq/proposals/${quote.id}`}
      toolbar={
        <>
          <Badge tone={statusTone(str(quote.status))} dot>
            {str(quote.status) || "draft"}
          </Badge>
          <Button size="sm" variant="secondary" href={`/hq/proposals/${quote.id}`}>
            {store.writable ? "Edit quote" : "Open quote"}
          </Button>
        </>
      }
    >
      <Cover c={c} />
      {scope.map((page, i) => {
        return <ScopePage key={i} c={c} lines={page} start={starts[i]} page={label(i + 2)} first={i === 0} />;
      })}
      <InvestmentPage c={c} page={label(scope.length + 2)} />
      <TermsPage c={c} page={label(scope.length + 3)} />
    </PrintShell>
  );
}

