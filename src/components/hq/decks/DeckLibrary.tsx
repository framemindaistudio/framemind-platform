"use client";

import { useState } from "react";
import Link from "next/link";
import { FileText, Play, Printer } from "lucide-react";
import { DECKS, GROUP_LABEL } from "@/lib/decks";
import type { Deck, DeckGroup } from "@/lib/decks/types";
import { Input } from "@/components/ui/form";
import { useRates } from "@/components/hq/data";
import { PageHeader } from "@/components/hq/ui";
import { Scaled } from "./Presenter";
import { SlideView } from "./SlideView";

const minutesLabel = (m: number) => (m < 60 ? `${m} min` : m % 60 ? `${Math.floor(m / 60)} h ${m % 60} min` : `${m / 60} h`);

/** A client from the CRM, offered for a client deck's cover. */
export interface CrmClient {
  name: string;
  city?: string;
  stage: string;
}

function DeckCard({ deck, clients }: { deck: Deck; clients: CrmClient[] }) {
  const rates = useRates();
  const [client, setClient] = useState("");
  const slides = deck.slides({ client: client || undefined, rates });
  const q = client.trim() ? `?client=${encodeURIComponent(client.trim())}` : "";
  const amp = q ? "&" : "?";
  return (
    <article className="flex flex-col overflow-hidden rounded-[var(--radius-md)] border border-graphite/12 bg-paper-50 shadow-[var(--shadow-paper)]" data-deck={deck.id}>
      <Link href={`/hq/print/present/${deck.id}${q}`} className="block border-b border-graphite/10" aria-label={`Present ${deck.title}`}>
        <Scaled className="aspect-video w-full">
          <SlideView deck={deck} slide={slides[0]} index={0} total={slides.length} />
        </Scaled>
      </Link>
      <div className="flex flex-1 flex-col p-4">
        <p className="annot text-blueprint">{deck.audience}</p>
        <h3 className="mt-1 text-lg font-bold leading-snug tracking-[-0.01em] text-graphite">{deck.title}</h3>
        <p className="mt-1.5 text-[13px] leading-relaxed text-charcoal">{deck.blurb}</p>
        <p className="mt-2 font-mono text-[11px] text-blueprint">
          {slides.length} slides · {minutesLabel(deck.minutes)}
        </p>
        {deck.group === "clients" && (
          <div className="mt-3">
            {clients.length > 0 && (
              <>
                <label htmlFor={`crm-${deck.id}`} className="annot text-[10px] text-blueprint">
                  Pick a client from the CRM
                </label>
                <select
                  id={`crm-${deck.id}`}
                  value={clients.some((x) => x.name === client) ? client : ""}
                  onChange={(e) => setClient(e.target.value)}
                  className="mt-1 mb-3 h-9 w-full rounded-[var(--radius-sm)] border border-graphite/20 bg-paper px-2 text-sm text-graphite"
                >
                  <option value="">— Choose a client —</option>
                  {clients.map((x) => (
                    <option key={x.name + x.city} value={x.name}>
                      {x.name}
                      {x.city ? ` · ${x.city}` : ""} ({x.stage})
                    </option>
                  ))}
                </select>
              </>
            )}
            <label htmlFor={`client-${deck.id}`} className="annot text-[10px] text-blueprint">
              {clients.length > 0 ? "Or type the name" : "Client’s name on the cover (optional)"}
            </label>
            <Input id={`client-${deck.id}`} value={client} onChange={(e) => setClient(e.target.value)} maxLength={80} placeholder="e.g. the business or institution" className="mt-1 h-9" />
          </div>
        )}
        <div className="mt-auto flex flex-wrap gap-2 pt-4">
          <Link href={`/hq/print/present/${deck.id}${q}`} className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius-sm)] bg-graphite px-3 text-sm font-semibold text-paper hover:bg-ink">
            <Play className="size-4" aria-hidden /> Present
          </Link>
          <a href={`/hq/print/deck/${deck.id}${q}`} target="_blank" rel="noopener noreferrer" className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius-sm)] border border-graphite/25 px-3 text-sm font-semibold text-graphite hover:border-graphite">
            <Printer className="size-4" aria-hidden /> PDF
          </a>
          <a href={`/hq/print/deck/${deck.id}${q}${amp}notes=1`} target="_blank" rel="noopener noreferrer" className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius-sm)] border border-graphite/25 px-3 text-sm font-semibold text-graphite hover:border-graphite" title="Two slides per A4 page with the speaker notes under each">
            <FileText className="size-4" aria-hidden /> PDF with notes
          </a>
        </div>
      </div>
    </article>
  );
}

/** HQ → Presentations: the client decks and the team handbook. */
export function DeckLibrary({ clients = [] }: { clients?: CrmClient[] }) {
  const groups: DeckGroup[] = ["clients", "team"];
  return (
    <div>
      <PageHeader
        eyebrow="Knowledge"
        title="Presentations"
        icon="Presentation"
        description="Slides for discovery calls, Vritta and coaching meetings, and for welcoming new team members. Present from a laptop, or save a PDF to send or present offline. Only in HQ."
      />
      <div className="space-y-12">
        {groups.map((g) => (
          <section key={g} aria-labelledby={`g-${g}`}>
            <h2 id={`g-${g}`} className="text-base font-bold text-graphite">
              {GROUP_LABEL[g].title}
            </h2>
            <p className="mt-0.5 text-sm text-charcoal">{GROUP_LABEL[g].blurb}</p>
            <div className="mt-4 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {DECKS.filter((d) => d.group === g).map((d) => (
                <DeckCard key={d.id} deck={d} clients={clients} />
              ))}
            </div>
          </section>
        ))}

        <section aria-labelledby="before-call" className="rounded-[var(--radius-md)] border border-graphite/12 bg-paper-50 p-5" data-guide>
          <h2 id="before-call" className="text-base font-bold text-graphite">
            Before a client meeting
          </h2>
          <div className="mt-3 grid gap-6 text-sm leading-relaxed text-charcoal md:grid-cols-3">
            <div>
              <p className="annot mb-1.5 text-blueprint">The day before</p>
              <ul className="list-disc space-y-1 pl-5">
                <li>Read the client&apos;s record and activity in the <Link href="/hq/crm" className="font-semibold underline underline-offset-2">Clients CRM</Link></li>
                <li>Check the <Link href="/hq/prices" className="font-semibold underline underline-offset-2">Rate Card</Link> is current — the decks read their prices from it</li>
                <li>Pick two or three relevant case studies, if the client has agreed to be shown</li>
              </ul>
            </div>
            <div>
              <p className="annot mb-1.5 text-blueprint">In the meeting</p>
              <ul className="list-disc space-y-1 pl-5">
                <li>Present on the client&apos;s screen or a projector; the notes and the next slide stay on your laptop</li>
                <li>Keep a PDF on the laptop in case the internet fails</li>
                <li>If they want numbers today, build the quote with them in <Link href="/hq/proposals/new" className="font-semibold underline underline-offset-2">Quotes</Link></li>
              </ul>
            </div>
            <div>
              <p className="annot mb-1.5 text-blueprint">Afterwards</p>
              <ul className="list-disc space-y-1 pl-5">
                <li>Log the call and the next follow-up date on the client</li>
                <li>Send the written scope within two working days</li>
                <li>Send the PDF of the deck only if they asked for it</li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
