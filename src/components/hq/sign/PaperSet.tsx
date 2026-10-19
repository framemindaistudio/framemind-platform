"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FilePlus2, Printer } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { progressOf, type SignDoc } from "@/lib/sign/context";
import type { SignTemplate } from "@/lib/sign/types";
import { DocChip, templateOf } from "./bits";
import { printHref, type Desk } from "./desk";

/** Of several documents made from one template, the one that counts: a live one before a withdrawn one, newest first. */
export function current(docs: SignDoc[], templateId: string): SignDoc | undefined {
  const mine = docs.filter((d) => d.template === templateId).sort((a, b) => String(b.createdAt ?? "").localeCompare(String(a.createdAt ?? "")));
  return mine.find((d) => d.status !== "void") ?? mine[0];
}

/** How a set of required papers stands: how many are needed, how many are settled (signed, or marked as not needed). */
export function tally(required: SignTemplate[], docs: SignDoc[]) {
  let settled = 0;
  let missing = 0;
  for (const t of required) {
    const doc = current(docs, t.id);
    if (!doc) missing += 1;
    else if (["signed", "void"].includes(progressOf(doc, t).standing)) settled += 1;
  }
  return { needed: required.length, settled, missing };
}

/**
 * The papers of one person or one project: a chip for each required paper (made or not), chips for anything else
 * made for them, and the two actions that save the most time: make everything that is missing, and print everything
 * that is still unsigned as one PDF.
 */
export function PaperSet({
  desk,
  required,
  docs,
  tab,
  makeLabel,
  onMake,
  onOpen,
  onOther,
}: {
  desk: Desk;
  required: SignTemplate[];
  /** every document already made for this person or project */
  docs: SignDoc[];
  tab: string;
  makeLabel: string;
  /** makes drafts from these templates, with the names filled in */
  onMake: (templates: SignTemplate[]) => Promise<SignDoc[]>;
  onOpen: (doc: SignDoc) => void;
  /** opens "new document" for this person or client */
  onOther?: () => void;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  const missing = required.filter((t) => !current(docs, t.id));
  const extras = docs.filter((d) => !required.some((t) => t.id === d.template));
  const unsigned = docs.filter((d) => {
    const t = templateOf(d);
    return !!t && ["draft", "waiting"].includes(progressOf(d, t).standing);
  });

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

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {required.map((t) => (
          <DocChip key={t.id} template={t} doc={current(docs, t.id)} canEdit={desk.canEdit && !busy} onOpen={onOpen} onMake={() => run(t.id, async () => { const [made] = await onMake([t]); if (made) onOpen(made); })} />
        ))}
        {extras.map((d) => {
          const t = templateOf(d);
          return t ? <DocChip key={d.id} template={t} doc={d} canEdit={desk.canEdit} onOpen={onOpen} /> : null;
        })}
        {required.length === 0 && extras.length === 0 && <p className="text-xs text-blueprint">Nothing is required here, and nothing has been made yet.</p>}
      </div>

      {(desk.canEdit || unsigned.length > 0) && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {desk.canEdit && missing.length > 0 && (
            <Button size="sm" disabled={!!busy} onClick={() => run("make", async () => void (await onMake(missing)))} title="Makes every missing paper as a draft, with the names and details filled in from HQ.">
              <FilePlus2 className="size-3.5" aria-hidden /> {busy === "make" ? "Making…" : `${makeLabel} (${missing.length})`}
            </Button>
          )}
          {unsigned.length > 0 && (
            <Button
              size="sm"
              variant="secondary"
              disabled={!!busy}
              title="One PDF with every paper that is not signed yet, each starting on a new page. Printing locks their wording."
              onClick={() => run("print", async () => { const issued = desk.canEdit ? await desk.issue(unsigned) : unsigned; router.push(printHref(issued.map((d) => d.id), tab)); })}
            >
              <Printer className="size-3.5" aria-hidden /> {busy === "print" ? "Getting them ready…" : `Print the unsigned (${unsigned.length})`}
            </Button>
          )}
          {desk.canEdit && onOther && (
            <Button size="sm" variant="ghost" disabled={!!busy} onClick={onOther}>
              Another document…
            </Button>
          )}
        </div>
      )}
      {error && <p role="alert" className="mt-2 text-xs text-bad">{error}</p>}
    </div>
  );
}
