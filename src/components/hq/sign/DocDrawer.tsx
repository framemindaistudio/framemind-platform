"use client";

import { useId, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, ExternalLink, Lock, LockOpen, Paperclip, Printer, Trash2, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/form";
import { Drawer } from "@/components/ui/Overlay";
import { rawHref } from "@/components/hq/docs/lib";
import { shortDate } from "@/components/hq/printables/util";
import { FOUNDERS, missingFields, progressOf, signatoriesFor, signatoryChoice, type SignDoc } from "@/lib/sign/context";
import { listAnd } from "@/lib/sign/text";
import type { Party, SignField, SignTemplate } from "@/lib/sign/types";
import { cn } from "@/lib/utils";
import { StandingBadge, templateOf, useFit } from "./bits";
import { printHref, ticked, type Desk } from "./desk";
import { Paper } from "./Paper";
import { paperOfDoc } from "./papers";
import { receivedOf } from "@/lib/sign/share";
import { inkReady, wantsInk, withInkTick } from "@/lib/sign/ink";
import { SendPanel } from "./SendPanel";

const A4_PX = 794; // 210 mm on screen

/** What the other side is called in the form, by who it is. */
const PARTY_WORDS: Record<Party["kind"], { name: string; person?: string; role: string }> = {
  team: { name: "Name, as it should be printed", role: "Role" },
  client: { name: "Client's name", person: "Who signs for the client", role: "Their designation" },
  vendor: { name: "Firm's name", person: "Who signs for the firm", role: "Their designation" },
  other: { name: "Name of the organisation or person", person: "Who signs (if it is an organisation)", role: "Their designation" },
};

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "general";

function Box({ spec, value, disabled, onChange }: { spec: SignField; value: string; disabled: boolean; onChange: (v: string) => void }) {
  const id = useId();
  const empty = !!spec.required && !value.trim();
  return (
    <Field label={spec.label} htmlFor={id} help={empty ? "Needed for the paper to read complete. Left empty, it prints as a line to fill by hand." : spec.help} className={cn(spec.half ? "sm:col-span-1" : "sm:col-span-2", empty && "[&>p]:text-warn")}>
      {spec.kind === "textarea" ? (
        <Textarea id={id} rows={3} value={value} placeholder={spec.placeholder} disabled={disabled} onChange={(e) => onChange(e.target.value)} />
      ) : spec.kind === "select" ? (
        <Select id={id} value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)}>
          {!spec.options?.some((o) => o.value === value) && <option value={value}>{value || "Choose…"}</option>}
          {(spec.options ?? []).map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
      ) : spec.kind === "money" ? (
        <div className="relative">
          <span aria-hidden className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-blueprint">
            ₹
          </span>
          <Input id={id} inputMode="numeric" className="pl-7" value={value} placeholder={spec.placeholder} disabled={disabled} onChange={(e) => onChange(e.target.value.replace(/[^\d.]/g, ""))} />
        </div>
      ) : (
        <Input id={id} type={spec.kind === "date" ? "date" : "text"} inputMode={spec.kind === "number" ? "numeric" : undefined} value={value} placeholder={spec.placeholder} disabled={disabled} onChange={(e) => onChange(e.target.value)} />
      )}
    </Field>
  );
}

function Heading({ n, title, note }: { n: string; title: string; note?: string }) {
  return (
    <div className="mb-3 mt-7 first:mt-0">
      <h3 className="text-sm font-bold text-graphite">
        <span className="tabular mr-2 font-mono text-blueprint">{n}</span>
        {title}
      </h3>
      {note && <p className="mt-0.5 text-xs text-blueprint">{note}</p>}
    </div>
  );
}

/** One document: its boxes, the paper as it will print, and who has signed. */
export function DocDrawer({ desk, doc, tab, onClose }: { desk: Desk; doc: SignDoc | null; tab: string; onClose: () => void }) {
  const template = doc ? templateOf(doc) : undefined;
  return (
    <Drawer open={!!doc} onClose={onClose} width="max-w-[1320px]" title={doc ? template?.name ?? "Document" : ""} subtitle={doc ? [doc.ref, doc.partyName].filter(Boolean).join(" · ") : undefined}>
      {doc && template ? (
        <Editor key={doc.id} desk={desk} saved={doc} template={template} tab={tab} onClose={onClose} />
      ) : doc ? (
        <p className="text-sm text-charcoal">This document was made from a template that no longer exists ({doc.template}). Its record is kept; the paper cannot be drawn again. If a signed scan was attached, it is in the File Vault.</p>
      ) : null}
    </Drawer>
  );
}

function Editor({ desk, saved, template, tab, onClose }: { desk: Desk; saved: SignDoc; template: SignTemplate; tab: string; onClose: () => void }) {
  const router = useRouter();
  const [d, setD] = useState<SignDoc>(saved);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState("");
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [showLawyer, setShowLawyer] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { ref: paneRef, fit } = useFit(A4_PX + 8);

  const party: Party = useMemo(() => ({ kind: d.partyKind ?? "other", name: "", address: "", phone: "", email: "", city: "", role: "", engagement: "", person: "", ...(d.party ?? {}) }), [d.party, d.partyKind]);
  const values = useMemo(() => d.values ?? {}, [d.values]);
  const progress = progressOf(d, template);
  const locked = d.status === "issued" || d.status === "void" || !desk.canEdit;
  const missing = missingFields(template, values);
  const words = PARTY_WORDS[party.kind];
  const paper = useMemo(() => paperOfDoc({ ...d, party, values }, template, desk.company, desk.inks), [d, party, values, template, desk.company, desk.inks]);
  const who = party.kind === "team" ? party.name.split(" ")[0] || "them" : party.name || "them";
  const signers = listAnd((d.signatories ?? []).map((s) => s.name.split(" ")[0]));
  const staleWording = d.status === "issued" && !!d.templateVersion && d.templateVersion !== template.version;

  const edit = (patch: Partial<SignDoc>) => {
    setD((old) => ({ ...old, ...patch }));
    setDirty(true);
    setNote(null);
  };
  const setParty = (patch: Partial<Party>) => edit({ party: { ...party, ...patch } });
  const setValue = (key: string, v: string) => edit({ values: { ...values, [key]: v } });

  /** Saves the working copy (with the name it is listed under kept in step). */
  async function store(next: SignDoc, label: string, done?: string): Promise<SignDoc | null> {
    setBusy(label);
    setNote(null);
    try {
      const name = (next.party?.name ?? "").trim();
      const out = await desk.save({ ...next, partyName: name, title: `${template.name} · ${name || "No name yet"}` });
      setD(out);
      setDirty(false);
      if (done) setNote({ ok: true, text: done });
      return out;
    } catch (e) {
      setNote({ ok: false, text: e instanceof Error ? e.message : "That did not save. Try again." });
      return null;
    } finally {
      setBusy("");
    }
  }

  /** The first print locks the wording, so HQ keeps exactly what went out to be signed. */
  async function print() {
    // with the saved signatures on it, the studio's side counts as signed the day it is printed
    const cur = d.status === "draft" ? await store(withInkTick({ ...d, status: "issued", issuedOn: d.issuedOn || desk.today, company: desk.company }, template, desk.inks, desk.today), "print") : dirty ? await store(d, "print") : d;
    if (cur) router.push(printHref([cur.id], tab));
  }

  /** A tick is saved at once. Ticking a draft means it was printed, so it is locked as it stands. */
  function tick(side: "party" | "studio", on: boolean) {
    void store(ticked(d, side, on, desk), "tick", on ? "Marked as signed." : "Tick removed.");
  }

  function unlock() {
    const signedAlready = d.partySigned === true || d.studioSigned === true;
    if (signedAlready && !window.confirm("This paper is already marked as signed. If you change it, it must be printed and signed again, and the ticks are removed. Unlock it?")) return;
    // `company: null` drops the kept copy of the company's details: a draft always shows today's
    void store({ ...d, status: "draft", issuedOn: "", partySigned: false, partySignedOn: "", studioSigned: false, studioSignedOn: "", company: null }, "unlock", "Unlocked. Print it again when it is ready.");
  }

  async function attach(file: File | undefined) {
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      setNote({ ok: false, text: "That file is larger than 4 MB. Scan at a lower quality, or as a PDF, and try again." });
      return;
    }
    setBusy("scan");
    setNote(null);
    try {
      const form = new FormData();
      form.set("file", file);
      form.set("folder", `signed/${slug(party.name)}`);
      const res = await fetch("/api/hq/files", { method: "POST", body: form });
      const json = (await res.json().catch(() => ({}))) as { path?: string; error?: string };
      if (!res.ok || !json.path) throw new Error(json.error || "The scan could not be uploaded.");
      await store({ ...d, scan: json.path }, "scan", "Signed scan attached.");
    } catch (e) {
      setNote({ ok: false, text: e instanceof Error ? e.message : "The scan could not be uploaded." });
      setBusy("");
    }
  }

  async function copyCover() {
    try {
      await navigator.clipboard.writeText(template.cover?.({ company: desk.company, party, signatories: d.signatories ?? [], date: d.date ?? "", ref: d.ref ?? "", v: values, blank: false }) ?? "");
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setNote({ ok: false, text: "The browser did not allow copying." });
    }
  }

  async function removeDraft() {
    if (!window.confirm("Delete this draft? It has not been printed, so nothing is lost.")) return;
    setBusy("delete");
    try {
      await desk.remove(d.id);
      onClose();
    } catch (e) {
      setNote({ ok: false, text: e instanceof Error ? e.message : "Could not delete it." });
      setBusy("");
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,430px)_minmax(0,1fr)]">
      {/* ── the boxes ── */}
      <div className="min-w-0">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <StandingBadge progress={progress} />
          {d.status === "issued" && <span className="text-xs text-blueprint">Printed {shortDate(d.issuedOn) || "earlier"}</span>}
          {template.lawyer.length > 0 && (
            <button type="button" className="ml-auto text-xs font-semibold text-graphite underline underline-offset-2" aria-expanded={showLawyer} onClick={() => setShowLawyer((s) => !s)}>
              {template.lawyer.length} {template.lawyer.length === 1 ? "point" : "points"} for your advocate
            </button>
          )}
        </div>

        {showLawyer && (
          <div role="note" className="mb-5 rounded-[var(--radius-sm)] border border-graphite/15 bg-paper-50 p-3 text-xs leading-relaxed text-charcoal">
            <p className="mb-1.5 font-semibold text-graphite">Have these checked once, before the first real use. They are never printed.</p>
            <ul className="list-disc space-y-1 pl-4">
              {template.lawyer.map((l) => (
                <li key={l}>{l}</li>
              ))}
            </ul>
          </div>
        )}

        {d.status === "issued" && desk.canEdit && (
          <div role="note" className="mb-5 flex flex-wrap items-center gap-3 rounded-[var(--radius-sm)] border border-graphite/15 bg-paper-50 px-3 py-2.5">
            <Lock className="size-4 shrink-0 text-blueprint" aria-hidden />
            <p className="min-w-40 flex-1 text-xs leading-relaxed text-charcoal">The wording is locked, so HQ keeps exactly what was printed. Unlock it only if the paper has to change.</p>
            <Button variant="ghost" size="sm" onClick={unlock} disabled={!!busy}>
              <LockOpen className="size-3.5" aria-hidden /> Unlock
            </Button>
          </div>
        )}
        {staleWording && (
          <p role="note" className="mb-5 rounded-[var(--radius-sm)] border border-warn/30 bg-warn/[0.06] px-3 py-2 text-xs text-charcoal">
            The standard wording of this document has changed since this copy was printed (it was version {d.templateVersion}, it is now {template.version}). The paper on the right shows today&rsquo;s wording; the signed scan is the record of what was agreed.
          </p>
        )}
        {d.status === "void" && (
          <p role="note" className="mb-5 rounded-[var(--radius-sm)] border border-graphite/15 bg-paper-50 px-3 py-2 text-xs text-charcoal">
            Withdrawn, or marked as not needed. It is kept for the record and no longer counts as missing.
          </p>
        )}

        <Heading n="01" title="Who it is for" note="Filled in from HQ. Change anything that should read differently on this paper." />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={words.name} className="sm:col-span-2">
            <Input value={party.name} disabled={locked} onChange={(e) => setParty({ name: e.target.value })} />
          </Field>
          {words.person && (
            <Field label={words.person}>
              <Input value={party.person} disabled={locked} placeholder="Left empty, a line is printed" onChange={(e) => setParty({ person: e.target.value })} />
            </Field>
          )}
          <Field label={words.role} className={words.person ? undefined : "sm:col-span-2"}>
            <Input value={party.role} disabled={locked} onChange={(e) => setParty({ role: e.target.value })} />
          </Field>
          <Field label="Address" className="sm:col-span-2" help={party.address ? undefined : party.kind === "team" ? "Type it once: it is kept on the person's Team record and filled into their other drafts. Left empty, the paper has a line to write it on." : "Left empty, the paper has a line to write it on."}>
            <Textarea rows={2} value={party.address} disabled={locked} onChange={(e) => setParty({ address: e.target.value })} />
          </Field>
          <Field label="Phone">
            <Input value={party.phone} disabled={locked} onChange={(e) => setParty({ phone: e.target.value })} />
          </Field>
          <Field label="Email">
            <Input value={party.email} disabled={locked} onChange={(e) => setParty({ email: e.target.value })} />
          </Field>
        </div>

        <Heading n="02" title="The paper" note={missing.length ? `${missing.length} ${missing.length === 1 ? "box is" : "boxes are"} still empty: ${missing.map((f) => f.label.toLowerCase()).join(", ")}.` : undefined} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Date on the paper">
            <Input type="date" value={d.date ?? ""} disabled={locked} onChange={(e) => edit({ date: e.target.value })} />
          </Field>
          <Field label="Reference">
            <Input value={d.ref ?? ""} disabled={locked} onChange={(e) => edit({ ref: e.target.value })} />
          </Field>
          {template.signs !== "party" && (
            <Field label="Signed for FrameMind by" className="sm:col-span-2">
              <Select value={signatoryChoice(d.signatories)} disabled={locked} onChange={(e) => edit({ signatories: signatoriesFor(e.target.value, desk.settings) })}>
                {!signatoryChoice(d.signatories) && <option value="">{(d.signatories ?? []).map((s) => s.name).join(", ") || "Choose…"}</option>}
                {FOUNDERS.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}, {f.title}
                  </option>
                ))}
                <option value="both">{FOUNDERS.map((f) => f.name).join(" and ")}</option>
              </Select>
            </Field>
          )}
          {template.signs !== "party" && (
            <div className="sm:col-span-2" data-ink>
              <Checkbox
                checked={wantsInk(d, template)}
                disabled={locked}
                onChange={(e) => edit({ ink: e.target.checked })}
                label={<span className="font-semibold">Print our saved signatures on it</span>}
              />
              <p className="mt-1 pl-6 text-xs leading-relaxed text-blueprint">
                {!inkReady(d, desk.inks)
                  ? "Save the signature of everyone signing for FrameMind first, under Our signatures at the top of Documents to Sign. Until then a line is left to sign by hand."
                  : wantsInk(d, template)
                    ? "FrameMind's side is then ticked as signed when you print or send it. They only sign and send it back."
                    : "Left off, the founders sign it by hand."}
                {template.kind === "agreement" && " For an agreement, your advocate may prefer signatures by hand or Aadhaar eSign; a printed signature picture is not a Digital Signature Certificate."}
              </p>
            </div>
          )}
          {template.fields.map((f) => (
            <Box key={f.key} spec={f} value={values[f.key] ?? ""} disabled={locked} onChange={(v) => setValue(f.key, v)} />
          ))}
        </div>

        <Heading n="03" title="Signatures" note="Tick each side when the signed paper is in your hands. A tick is saved at once." />
        {receivedOf(d).length > 0 && (
          <div className={cn("mb-3 rounded-[var(--radius-sm)] border p-4", d.partySigned === true ? "border-graphite/15 bg-paper-50" : "border-warn/40 bg-warn/[0.08]")} data-received>
            <p className="text-sm font-semibold text-graphite">
              {d.partySigned === true ? "Signed copy sent from the link" : `${who} sent back a signed copy from the link`}
            </p>
            {d.partySigned !== true && <p className="mt-1 text-xs text-charcoal">Open each file and check every page is there and signed. Reminders are paused meanwhile.</p>}
            <ul className="mt-2 space-y-1">
              {receivedOf(d).map((r) => (
                <li key={r.path}>
                  <a href={rawHref(r.path)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-semibold text-graphite underline underline-offset-2">
                    <ExternalLink className="size-3.5" aria-hidden /> {r.name || r.path.split("/").pop()} <span className="font-normal text-blueprint">· {shortDate(r.at.slice(0, 10))}</span>
                  </a>
                </li>
              ))}
            </ul>
            {desk.canEdit && d.partySigned !== true && (
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" disabled={!!busy} onClick={() => void store({ ...ticked(d, "party", true, desk), scan: d.scan || receivedOf(d)[0].path }, "tick", "Marked as signed. The copy is kept in the File Vault.")}>
                  <Check className="size-3.5" aria-hidden /> Looks right, mark as signed
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={!!busy}
                  onClick={() => window.confirm("Set these files aside and wait for a new copy? They stay in the File Vault. Tell them what is missing; reminders start again.") && void store({ ...d, received: [], notes: [d.notes, `Copy sent on ${shortDate(receivedOf(d).at(-1)!.at.slice(0, 10))} was not right; asked again.`].filter(Boolean).join("\n") }, "void", "Set aside. Reminders start again.")}
                >
                  <Undo2 className="size-3.5" aria-hidden /> Not right, ask again
                </Button>
              </div>
            )}
          </div>
        )}
        <div className="space-y-3 rounded-[var(--radius-sm)] border border-graphite/15 bg-paper-50 p-4">
          {template.signs !== "studio" && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <Checkbox label={<span className="font-semibold">Signed by {who}</span>} checked={d.partySigned === true} disabled={!desk.canEdit || !!busy || d.status === "void"} onChange={(e) => tick("party", e.target.checked)} />
              {d.partySigned === true && <Input type="date" aria-label={`Date ${who} signed`} className="h-8 w-40 text-xs" value={d.partySignedOn ?? ""} disabled={!desk.canEdit} onChange={(e) => void store({ ...d, partySignedOn: e.target.value }, "tick")} />}
            </div>
          )}
          {template.signs !== "party" && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <Checkbox label={<span className="font-semibold">Signed by FrameMind{signers ? ` (${signers})` : ""}</span>} checked={d.studioSigned === true} disabled={!desk.canEdit || !!busy || d.status === "void"} onChange={(e) => tick("studio", e.target.checked)} />
              {d.studioSigned === true && <Input type="date" aria-label="Date FrameMind signed" className="h-8 w-40 text-xs" value={d.studioSignedOn ?? ""} disabled={!desk.canEdit} onChange={(e) => void store({ ...d, studioSignedOn: e.target.value }, "tick")} />}
            </div>
          )}
          <div className="flex flex-wrap items-center gap-2 border-t border-graphite/10 pt-3">
            <input ref={fileRef} type="file" accept="application/pdf,image/*" className="sr-only" aria-label="Signed scan" onChange={(e) => { void attach(e.target.files?.[0]); e.target.value = ""; }} />
            {d.scan ? (
              <a href={rawHref(d.scan)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-semibold text-graphite underline underline-offset-2">
                <ExternalLink className="size-3.5" aria-hidden /> Open the signed scan
              </a>
            ) : (
              <span className="text-xs text-blueprint">No signed scan attached yet.</span>
            )}
            {desk.canEdit && (
              <Button variant="ghost" size="sm" className="ml-auto" disabled={!!busy} onClick={() => fileRef.current?.click()}>
                <Paperclip className="size-3.5" aria-hidden /> {busy === "scan" ? "Uploading…" : d.scan ? "Replace the scan" : "Attach the signed scan"}
              </Button>
            )}
          </div>
          {template.scanNote && (
            <p role="note" className="rounded-[var(--radius-sm)] border border-warn/30 bg-warn/[0.06] px-3 py-2 text-xs leading-relaxed text-charcoal">
              {template.scanNote}
            </p>
          )}
          <p className="text-xs leading-relaxed text-blueprint">
            A scan or a clear photo of every page, 4 MB at most. It is kept in the File Vault where only founders can open it. Keep the paper original for: {template.keep}.
          </p>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Sign and return by (optional)">
            <Input type="date" value={d.dueBy ?? ""} disabled={!desk.canEdit} onChange={(e) => edit({ dueBy: e.target.value })} />
          </Field>
          <Field label="Note for yourselves (not printed)" className="sm:col-span-2">
            <Textarea rows={2} value={d.notes ?? ""} disabled={!desk.canEdit} onChange={(e) => edit({ notes: e.target.value })} />
          </Field>
        </div>

        {desk.canEdit && template.signs !== "studio" && d.status !== "void" && (
          <>
            <Heading n="04" title="Send it to sign" note="A private link to this paper, by email or WhatsApp. They open it, print it and sign it." />
            <SendPanel
              doc={d}
              party={party}
              template={template}
              today={desk.today}
              cover={template.cover?.({ company: desk.company, party, signatories: d.signatories ?? [], date: d.date ?? "", ref: d.ref ?? "", v: values, blank: false }) ?? ""}
              beforeSend={async () => (dirty ? await store(d, "save") : d)}
              onSent={(doc) => {
                setD(doc);
                setDirty(false);
                void desk.refresh();
              }}
            />
          </>
        )}

        {desk.canEdit && (
          <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-graphite/10 pt-4">
            {d.status === "draft" && (
              <>
                <Button variant="ghost" size="sm" onClick={removeDraft} disabled={!!busy}>
                  <Trash2 className="size-3.5" aria-hidden /> Delete this draft
                </Button>
                <Button variant="ghost" size="sm" disabled={!!busy} title="Keeps it on record as not needed, so it stops counting as missing." onClick={() => void store({ ...d, status: "void" }, "void", "Marked as not needed.")}>
                  <Undo2 className="size-3.5" aria-hidden /> Not needed here
                </Button>
              </>
            )}
            {d.status === "issued" && (
              <Button variant="ghost" size="sm" disabled={!!busy} onClick={() => window.confirm("Withdraw this document? It stays on record, marked as withdrawn.") && void store({ ...d, status: "void" }, "void", "Withdrawn.")}>
                <Undo2 className="size-3.5" aria-hidden /> Withdraw
              </Button>
            )}
            {d.status === "void" && (
              <Button variant="ghost" size="sm" disabled={!!busy} onClick={() => void store({ ...d, status: "draft", issuedOn: "" }, "void", "Back to a draft.")}>
                <Undo2 className="size-3.5" aria-hidden /> Bring it back as a draft
              </Button>
            )}
          </div>
        )}

        {/* on a phone the paper comes after the boxes: Print and Save stay at the foot of the screen */}
        <div className="sticky bottom-0 z-10 -mx-6 mt-6 flex flex-wrap items-center gap-2 border-t border-graphite/15 bg-paper/95 px-6 py-3 backdrop-blur lg:hidden">
          <Button size="sm" onClick={print} disabled={!!busy || d.status === "void"}>
            <Printer className="size-3.5" aria-hidden /> {busy === "print" ? "Getting it ready…" : "Print / Save PDF"}
          </Button>
          {desk.canEdit && (
            <Button size="sm" variant="secondary" onClick={() => void store(d, "save", "Saved.")} disabled={!!busy || !dirty}>
              {busy === "save" ? "Saving…" : dirty ? "Save changes" : "Saved"}
            </Button>
          )}
          {note && (
            <p role="status" className={cn("basis-full text-xs", note.ok ? "text-ok" : "text-bad")}>
              {note.text}
            </p>
          )}
        </div>
      </div>

      {/* ── the paper ── */}
      <div className="min-w-0">
        <div className="sticky top-0 z-10 -mt-1 mb-4 flex flex-wrap items-center gap-2 bg-paper/95 py-2 backdrop-blur">
          <Button onClick={print} disabled={!!busy || d.status === "void"}>
            <Printer className="size-4" aria-hidden /> {busy === "print" ? "Getting it ready…" : "Print / Save PDF"}
          </Button>
          {desk.canEdit && (
            <Button variant="secondary" onClick={() => void store(d, "save", "Saved.")} disabled={!!busy || !dirty}>
              {busy === "save" ? "Saving…" : dirty ? "Save changes" : "Saved"}
            </Button>
          )}
          {template.cover && (
            <Button variant="ghost" onClick={copyCover} title="A short message to send with the PDF on WhatsApp or email.">
              {copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />} {copied ? "Copied" : "Copy a message to send with it"}
            </Button>
          )}
          {note && (
            // the same message is shown in the bar at the foot on a phone
            <p role="status" className={cn("hidden basis-full text-sm lg:block", note.ok ? "text-ok" : "text-bad")}>
              {note.text}
            </p>
          )}
          {d.status === "draft" && desk.canEdit && <p className="basis-full text-xs text-blueprint">Printing locks the wording, so HQ keeps exactly what was sent to be signed. The names are already on the signature lines: only the signatures are added by hand.</p>}
        </div>
        <div ref={paneRef} className="rounded-[var(--radius-sm)] bg-graphite/[0.06] p-1 sm:p-4">
          <div style={{ zoom: fit }} className="mx-auto w-[210mm] bg-white px-[16mm] pb-[17mm] pt-[13mm] shadow-[var(--shadow-lift)]">
            <Paper doc={paper} />
          </div>
        </div>
        <p className="mt-2 text-center text-xs text-blueprint">On screen the paper is one long sheet. When printed it breaks into A4 pages, each with the reference and page number at the foot{template.initials ? ", and a line for both sides' initials" : ""}.</p>
      </div>
    </div>
  );
}
