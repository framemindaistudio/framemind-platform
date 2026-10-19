"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, Printer, Search } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/form";
import { EmptyState } from "@/components/hq/ui";
import { rawHref } from "@/components/hq/docs/lib";
import { shortDate } from "@/components/hq/printables/util";
import { progressOf, type SignDoc, type Standing } from "@/lib/sign/context";
import { cn } from "@/lib/utils";
import { StandingBadge, templateOf } from "./bits";
import { printHref, str, ticked, type Desk } from "./desk";

type Filter = "all" | Standing;
const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "waiting", label: "Waiting for a signature" },
  { id: "draft", label: "Drafts" },
  { id: "signed", label: "Signed" },
  { id: "void", label: "Withdrawn" },
];

const TH = "px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-charcoal";

/** Documents to Sign → All documents: every paper made, who has signed, and a tick to mark a signature the moment it arrives. */
export function RegisterTab({ desk, tab, onOpen }: { desk: Desk; tab: string; onOpen: (doc: SignDoc) => void }) {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  const rows = useMemo(
    () =>
      desk.docs
        .map((doc) => {
          const template = templateOf(doc);
          return { doc, template, progress: progressOf(doc, template) };
        })
        .sort((a, b) => str(b.doc.date).localeCompare(str(a.doc.date)) || str(b.doc.ref).localeCompare(str(a.doc.ref))),
    [desk.docs],
  );
  const count = (f: Filter) => (f === "all" ? rows.length : rows.filter((r) => r.progress.standing === f).length);
  const q = query.trim().toLowerCase();
  const shown = rows.filter((r) => (filter === "all" || r.progress.standing === filter) && (!q || [r.doc.ref, r.doc.title, r.doc.partyName, r.template?.name].some((v) => str(v).toLowerCase().includes(q))));
  const chosen = shown.filter((r) => picked.includes(r.doc.id) && r.doc.status !== "void").map((r) => r.doc);

  async function run(label: string, job: () => Promise<void>) {
    setBusy(label);
    setError("");
    try {
      await job();
    } catch (e) {
      setError(e instanceof Error ? e.message : "That did not work. Try again.");
    } finally {
      setBusy("");
    }
  }

  if (!rows.length) return <EmptyState icon="Signature" title="No documents yet" description="Make the first one from the Team or Clients tab, or pick a paper under Templates. Every document made in HQ is listed here with who has signed it." />;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div role="radiogroup" aria-label="Show" className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              role="radio"
              aria-checked={filter === f.id}
              onClick={() => setFilter(f.id)}
              className={cn("rounded-full border px-3 py-1 text-xs font-semibold transition-colors", filter === f.id ? "border-graphite bg-graphite text-paper" : "border-graphite/20 text-graphite hover:border-graphite/50")}
            >
              {f.label} <span className="tabular opacity-70">{count(f.id)}</span>
            </button>
          ))}
        </div>
        <div className="relative ml-auto w-full sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-blueprint" aria-hidden />
          <Input aria-label="Find a document" className="pl-9" placeholder="Name, paper or reference" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
      </div>

      {chosen.length > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-3 rounded-[var(--radius-sm)] border border-graphite/15 bg-paper-50 px-3 py-2">
          <p className="text-sm text-charcoal">
            {chosen.length} {chosen.length === 1 ? "document" : "documents"} chosen
          </p>
          <Button size="sm" disabled={!!busy} onClick={() => run("print", async () => { const issued = desk.canEdit ? await desk.issue(chosen) : chosen; router.push(printHref(issued.map((d) => d.id), tab)); })}>
            <Printer className="size-3.5" aria-hidden /> {busy === "print" ? "Getting them ready…" : "Print as one PDF"}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setPicked([])}>
            Clear
          </Button>
        </div>
      )}
      {error && <p role="alert" className="mb-3 text-sm text-bad">{error}</p>}

      <div className="overflow-x-auto rounded-[var(--radius-md)] border border-graphite/12 bg-paper-50">
        <table className="w-full min-w-[860px] border-collapse text-sm">
          <caption className="sr-only">Every document to sign, with who has signed it</caption>
          <thead className="border-b border-graphite/15 bg-paper">
            <tr>
              <th className={cn(TH, "w-10")}>
                <span className="sr-only">Choose</span>
              </th>
              <th className={TH}>Document</th>
              <th className={TH}>For</th>
              <th className={TH}>Date</th>
              <th className={TH}>Stands</th>
              <th className={TH}>Signed by them</th>
              <th className={TH}>Signed by FrameMind</th>
              <th className={cn(TH, "w-16")}>Scan</th>
            </tr>
          </thead>
          <tbody>
            {shown.map(({ doc, template, progress }) => {
              const late = progress.standing === "waiting" && !!doc.dueBy && !!desk.today && doc.dueBy < desk.today;
              const canTick = desk.canEdit && !busy && doc.status !== "void";
              const tickCell = (side: "party" | "studio") => {
                const needed = template ? (side === "party" ? template.signs !== "studio" : template.signs !== "party") : true;
                if (!needed) return <span className="text-xs text-blueprint">Not needed</span>;
                const on = side === "party" ? doc.partySigned === true : doc.studioSigned === true;
                const when = side === "party" ? doc.partySignedOn : doc.studioSignedOn;
                return (
                  <label className="inline-flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      className="size-4 rounded-[3px] accent-graphite"
                      checked={on}
                      disabled={!canTick}
                      aria-label={`${str(doc.title)}: signed by ${side === "party" ? str(doc.partyName) || "them" : "FrameMind"}`}
                      onChange={(e) => run(doc.id, async () => void (await desk.save(ticked(doc, side, e.target.checked, desk))))}
                    />
                    <span className={cn("tabular text-xs", on ? "text-graphite" : "text-blueprint")}>{on ? shortDate(when) || "Signed" : "Not yet"}</span>
                  </label>
                );
              };
              return (
                <tr key={doc.id} className="border-b border-graphite/10 last:border-0 hover:bg-graphite/[0.025]" data-doc={doc.id}>
                  <td className="px-3 py-2.5">
                    <input type="checkbox" className="size-4 rounded-[3px] accent-graphite" aria-label={`Choose ${str(doc.title)} to print`} checked={picked.includes(doc.id)} disabled={doc.status === "void"} onChange={(e) => setPicked((p) => (e.target.checked ? [...p, doc.id] : p.filter((id) => id !== doc.id)))} />
                  </td>
                  <td className="px-3 py-2.5">
                    <button type="button" onClick={() => onOpen(doc)} className="text-left font-semibold text-graphite underline-offset-2 hover:underline">
                      {template?.name ?? str(doc.title)}
                    </button>
                    <p className="tabular font-mono text-[11px] text-blueprint">{str(doc.ref)}</p>
                  </td>
                  <td className="px-3 py-2.5 text-charcoal">{str(doc.partyName) || "No name yet"}</td>
                  <td className="tabular whitespace-nowrap px-3 py-2.5 text-charcoal">{shortDate(doc.date)}</td>
                  <td className="px-3 py-2.5">
                    <StandingBadge progress={progress} />
                    {late && <p className="mt-1 text-[11px] font-semibold text-bad">Was due {shortDate(doc.dueBy)}</p>}
                  </td>
                  <td className="px-3 py-2.5">{tickCell("party")}</td>
                  <td className="px-3 py-2.5">{tickCell("studio")}</td>
                  <td className="px-3 py-2.5">
                    {doc.scan ? (
                      <a href={rawHref(doc.scan)} target="_blank" rel="noopener noreferrer" className="inline-grid size-8 place-items-center rounded text-charcoal hover:bg-graphite/10" aria-label={`Open the signed scan of ${str(doc.title)}`} title="Open the signed scan">
                        <ExternalLink className="size-4" aria-hidden />
                      </a>
                    ) : (
                      <span className="text-xs text-blueprint">None</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {shown.length === 0 && <p className="px-4 py-8 text-center text-sm text-blueprint">Nothing matches. Clear the search or choose another filter.</p>}
      </div>
      <p className="mt-3 text-xs text-blueprint">Tick a box the moment a signed paper is in your hands; it is saved at once with today&rsquo;s date. Open a document to change the date or to attach the signed scan.</p>
    </div>
  );
}
