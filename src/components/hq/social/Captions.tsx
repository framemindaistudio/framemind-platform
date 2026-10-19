"use client";

import { useId, useState } from "react";
import { Check, CircleCheck, CornerLeftUp, PenLine, RotateCcw, Shuffle, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Checkbox, Field, Input, Textarea } from "@/components/ui/form";
import { KV, Panel } from "@/components/hq/ui";
import { CAPTION_KINDS, CAPTION_RULES, CTA_GOALS, DO_NOT_USE, FIRST_LINE, HOOKS, MAX_SETS, SAY_NOT, TAG_SETS, review, tagMix, type CaptionKind, type PickableSet } from "@/lib/social/bank";
import type { Values } from "@/lib/social/types";
import { CREDIT, CTAS, caption, val, type CtaKey } from "@/lib/social/words";
import { cn, pad2 } from "@/lib/utils";
import { Bullets, Choice, TextBox } from "./parts/bits";
import { CopyButton } from "./parts/CopyButton";

/** What a person has chosen and typed for one kind of caption. Kept per kind, so switching kinds loses nothing. */
interface Draft {
  values: Values;
  /** a first line of the person's own (null = the kind's standard line) */
  hook: string | null;
  credit: boolean;
  cta: CtaKey | "";
  sets: PickableSet[];
  /** which mix of the sets' hashtags is shown */
  turn: number;
  /** the whole caption edited by hand (null = the built one) */
  free: string | null;
}

const fresh = (k: CaptionKind): Draft => ({ values: { ...k.start }, hook: null, credit: k.credit, cta: k.cta, sets: k.sets, turn: 0, free: null });

/** The text with every "[gap]" marked, so what is still to fill in is easy to see. */
function Marked({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\[[^\]\n]+\])/).map((bit, i) =>
        /^\[[^\]\n]+\]$/.test(bit) ? (
          <mark key={i} className="rounded-[2px] bg-warn/15 px-0.5 font-semibold text-graphite">
            {bit}
          </mark>
        ) : (
          bit
        ),
      )}
    </>
  );
}

/**
 * Social Studio → Captions: pick a kind of post, fill in the brackets and copy. The caption is built in the house
 * structure (hook, body, credit, one call to action, hashtags) from the Caption and Hashtag Bank.
 */
export function Captions() {
  const [kindId, setKindId] = useState(CAPTION_KINDS[0].id);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [used, setUsed] = useState("");
  const hookId = useId();
  const kannadaId = useId();

  const kind = CAPTION_KINDS.find((k) => k.id === kindId) ?? CAPTION_KINDS[0];
  const draft = drafts[kind.id] ?? fresh(kind);
  const patch = (p: Partial<Draft>) => setDrafts((all) => ({ ...all, [kind.id]: { ...(all[kind.id] ?? fresh(kind)), ...p } }));
  const setValue = (key: string, v: string) => patch({ values: { ...draft.values, [key]: v } });

  const standardHook = kind.hook(draft.values);
  const hook = draft.hook ?? standardHook;
  const body = [val(draft.values, "kannada"), ...kind.body(draft.values)].filter(Boolean);
  const tags = tagMix(draft.sets, draft.turn);
  const cta = draft.cta ? CTAS[draft.cta] : "";
  const builtText = `${caption({ hook, body, credit: draft.credit, cta, tags }).text}\n\n${tags.join(" ")}`;
  const text = draft.free ?? builtText;
  const firstLine = text.split("\n")[0] ?? "";
  const over = firstLine.length > FIRST_LINE;
  const flags = review(text);
  const facts = kind.facts?.(draft.values) ?? [];

  const segments = [
    { label: "Hook", text: hook },
    { label: "Body", text: body.join("\n") },
    ...(draft.credit ? [{ label: "Credit", text: CREDIT }] : []),
    ...(cta ? [{ label: "Action", text: cta }] : []),
    { label: "Hashtags", text: tags.join(" ") },
  ];

  // a set of hashtags with nothing left to rotate gives the same tags on the next turn
  const moreMixes = [...tagMix(draft.sets, draft.turn + 1)].sort().join() !== [...tags].sort().join();

  function toggleSet(key: PickableSet) {
    const on = draft.sets.includes(key);
    patch({ sets: on ? draft.sets.filter((s) => s !== key) : [...draft.sets, key], turn: 0 });
  }

  /** A hook line from the bank becomes the first line, also when the caption is being edited by hand. */
  function takeHook(line: string) {
    patch({ hook: line, free: draft.free === null ? null : draft.free.replace(/^[^\n]*/, line) });
    setUsed(line);
  }

  return (
    <div>
      <p className="mb-6 max-w-2xl text-sm text-charcoal">
        Pick the kind of post, fill in the brackets, copy. The caption builds itself in the house structure, and every price in it is read from the price list.
      </p>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,470px)]">
        {/* ── what to choose and type ── */}
        <div className="space-y-5">
          <Panel title="1 · What is the post?" subtitle="The seven caption kinds of the Caption and Hashtag Bank.">
            <div role="radiogroup" aria-label="Kind of post" className="grid gap-2 sm:grid-cols-2">
              {CAPTION_KINDS.map((k) => (
                <Choice
                  key={k.id}
                  checked={k.id === kind.id}
                  onSelect={() => {
                    setKindId(k.id);
                    setUsed("");
                  }}
                  title={k.name}
                  note={k.when}
                />
              ))}
            </div>
          </Panel>

          <Panel title="2 · Fill in the brackets" subtitle={kind.fields.length ? "The caption on the right changes as you type." : "Nothing to type for this one: the numbers come from the price list."}>
            <div className="space-y-4">
              {kind.fields.map((f) => (
                <TextBox key={f.key} spec={f} value={draft.values[f.key] ?? ""} onChange={(v) => setValue(f.key, v)} />
              ))}

              {facts.length > 0 && (
                <div className="rounded-[var(--radius-sm)] border border-graphite/12 bg-paper px-3.5 py-1.5">
                  <p className="annot pt-2 text-[10px] text-blueprint">From the price list</p>
                  {facts.map((f) => (
                    <KV key={f.label} k={f.label} v={<span className="tabular">{f.value}</span>} />
                  ))}
                </div>
              )}

              {draft.hook === null ? (
                <Button type="button" variant="ghost" size="sm" className="-ml-3" onClick={() => patch({ hook: standardHook })}>
                  <PenLine className="size-3.5" aria-hidden /> Write your own first line
                </Button>
              ) : (
                <Field label="First line (the hook)" htmlFor={hookId} help={`${hook.length} of ${FIRST_LINE} characters. The moment, not the company.`}>
                  <div className="flex gap-2">
                    <Input id={hookId} value={draft.hook} onChange={(e) => patch({ hook: e.target.value })} />
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="h-10 shrink-0"
                      onClick={() => {
                        patch({ hook: null });
                        setUsed("");
                      }}
                    >
                      <RotateCcw className="size-3.5" aria-hidden /> Standard line
                    </Button>
                  </div>
                </Field>
              )}

              <Field label="Kannada line (optional)" htmlFor={kannadaId} help="One short line, such as a greeting or the project name. A native speaker reads it first. Never translate a price.">
                <Input id={kannadaId} lang="kn" value={draft.values.kannada ?? ""} onChange={(e) => setValue("kannada", e.target.value)} />
              </Field>

              <Checkbox label="Client work is shown in this post (adds the credit line)" checked={draft.credit} onChange={(e) => patch({ credit: e.target.checked })} />

              {kind.note && <p className="border-l-2 border-graphite/25 pl-3 text-xs leading-relaxed text-charcoal">{kind.note}</p>}
            </div>
          </Panel>

          <Panel title="3 · One call to action" subtitle="One action only. These are the bank's seven.">
            <div role="radiogroup" aria-label="Call to action" className="grid gap-2 sm:grid-cols-2">
              {CTA_GOALS.map((c) => (
                <Choice key={c.key} checked={draft.cta === c.key} onSelect={() => patch({ cta: c.key })} title={c.goal} note={CTAS[c.key]} />
              ))}
              <Choice checked={draft.cta === ""} onSelect={() => patch({ cta: "" })} title="None" note="For a post on someone else's handle, such as a client's." />
            </div>
          </Panel>

          <Panel title="4 · Hashtags" subtitle="One to three sets. Two core tags are always in.">
            <div role="group" aria-label="Hashtag sets" className="flex flex-wrap gap-2">
              {TAG_SETS.map((s) => {
                const on = draft.sets.includes(s.key);
                const locked = on ? draft.sets.length === 1 : draft.sets.length >= MAX_SETS;
                return (
                  <button
                    key={s.key}
                    type="button"
                    aria-pressed={on}
                    disabled={locked}
                    title={locked ? (on ? "A caption needs at least one set." : "Three sets at most: switch one off first.") : undefined}
                    onClick={() => toggleSet(s.key)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] border px-3 py-1.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed",
                      on ? "border-graphite bg-graphite text-paper" : "border-graphite/20 text-graphite hover:border-graphite/50 disabled:opacity-45 disabled:hover:border-graphite/20",
                    )}
                  >
                    {on && <Check className="size-3.5" aria-hidden />}
                    {s.name}
                  </button>
                );
              })}
            </div>
            <p className="mt-4 font-mono text-xs leading-relaxed text-graphite" aria-live="polite">
              {tags.join(" ")}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Button type="button" variant="secondary" size="sm" disabled={!moreMixes} title={moreMixes ? undefined : "These sets have no other tags. Switch a set to change the mix."} onClick={() => patch({ turn: draft.turn + 1 })}>
                <Shuffle className="size-3.5" aria-hidden /> Another mix
              </Button>
              <CopyButton text={tags.join(" ")} what="the hashtags only" label="Copy hashtags" variant="ghost" />
              <span className="annot ml-auto text-[10px] text-blueprint">{tags.length} tags · 2 core</span>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-charcoal">
              Tap each hashtag once before you use it and see that the results are appropriate. A location tag only with the client&apos;s approval. Do not post the same mix twice in a row.
            </p>
          </Panel>
        </div>

        {/* ── the caption ── */}
        <div className="min-w-0 xl:sticky xl:top-20 xl:self-start">
          <Panel title="Your caption" subtitle={`${kind.name} · ${draft.free === null ? "built from your choices" : "edited by hand"}`} action={<CopyButton text={text} what="the whole caption" label="Copy caption" variant="primary" />}>
            <div>
              <div className="flex items-baseline justify-between gap-3 text-xs">
                <span className="text-charcoal">First line, before “more”</span>
                <span className={cn("tabular font-mono", over ? "font-semibold text-bad" : "text-charcoal")}>
                  {firstLine.length} / {FIRST_LINE}
                  {over ? " · too long" : ""}
                </span>
              </div>
              <div aria-hidden className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-graphite/10">
                <div className={cn("h-full rounded-full transition-[width] duration-300", over ? "bg-bad" : "bg-graphite")} style={{ width: `${Math.min(100, (firstLine.length / FIRST_LINE) * 100)}%` }} />
              </div>
            </div>

            {draft.free === null ? (
              <dl className="mt-4 divide-y divide-dashed divide-graphite/15 rounded-[var(--radius-sm)] border border-graphite/12 bg-white/70">
                {segments.map((s) => (
                  <div key={s.label} className="grid grid-cols-[5.25rem_minmax(0,1fr)] gap-3 px-3.5 py-3">
                    <dt className="annot pt-0.5 text-[10px] text-blueprint">{s.label}</dt>
                    <dd className={cn("whitespace-pre-line text-[13px] leading-relaxed text-graphite", s.label === "Hashtags" && "font-mono text-xs")}>
                      <Marked text={s.text} />
                    </dd>
                  </div>
                ))}
              </dl>
            ) : (
              <div className="mt-4">
                <Textarea aria-label="Caption, edited by hand" rows={12} value={draft.free} onChange={(e) => patch({ free: e.target.value })} className="font-sans text-[13px]" />
                <p className="mt-1.5 text-xs text-charcoal">You are editing the text yourself, so the boxes on the left no longer change it.</p>
              </div>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-2">
              {draft.free === null ? (
                <Button type="button" variant="ghost" size="sm" className="-ml-3" onClick={() => patch({ free: builtText })}>
                  <PenLine className="size-3.5" aria-hidden /> Edit the text yourself
                </Button>
              ) : (
                <Button type="button" variant="ghost" size="sm" className="-ml-3" onClick={() => patch({ free: null })}>
                  <RotateCcw className="size-3.5" aria-hidden /> Back to the built caption
                </Button>
              )}
            </div>

            <div className="mt-3 border-t border-graphite/10 pt-3.5" aria-live="polite">
              <p className="annot mb-2 text-[10px] text-blueprint">A quick read against the rules</p>
              {flags.length ? (
                <ul className="space-y-1.5">
                  {flags.map((f) => (
                    <li key={f.text} className="flex gap-2 text-xs leading-relaxed text-graphite">
                      <TriangleAlert className={cn("mt-0.5 size-3.5 shrink-0", f.level === "fix" ? "text-bad" : "text-warn")} aria-hidden />
                      <span>
                        <strong className="font-semibold">{f.level === "fix" ? "Fix" : "Look"}:</strong> {f.text}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="flex gap-2 text-xs leading-relaxed text-graphite">
                  <CircleCheck className="mt-0.5 size-3.5 shrink-0 text-ok" aria-hidden />
                  Nothing stands out. The 30-second check in the Brand kit tab is still yours to do.
                </p>
              )}
            </div>
          </Panel>
        </div>
      </div>

      <div className="mt-6 grid items-start gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <Panel title="Hook lines" subtitle="First lines from the bank. Use one as it is, or as a pattern for your own.">
          <ul className="divide-y divide-dashed divide-graphite/12">
            {HOOKS.map((h) => (
              <li key={h.line} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3 first:pt-0 last:pb-0">
                <div className="min-w-0 flex-1 basis-64">
                  <p className="text-sm font-semibold text-graphite">{h.line}</p>
                  <p className="mt-0.5 text-xs text-charcoal">{h.fits}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  {used === h.line && hook === h.line && (
                    <span role="status" className="annot text-[10px] text-ok">
                      Now the first line
                    </span>
                  )}
                  <Button type="button" variant="ghost" size="sm" onClick={() => takeHook(h.line)} aria-label={`Use as first line: ${h.line}`}>
                    <CornerLeftUp className="size-3.5" aria-hidden /> Use as first line
                  </Button>
                  <CopyButton text={h.line} what={h.line} />
                </div>
              </li>
            ))}
          </ul>
        </Panel>

        <div className="space-y-5">
          <Panel title="The caption rules" subtitle="Five lines, from the Social Media Templates Spec.">
            <ol className="space-y-3">
              {CAPTION_RULES.map((r, i) => (
                <li key={r.name} className="grid grid-cols-[1.75rem_minmax(0,1fr)] gap-2 text-sm">
                  <span className="pt-0.5 font-mono text-xs tracking-widest text-blueprint">{pad2(i + 1)}</span>
                  <span className="leading-relaxed text-charcoal">
                    <strong className="font-semibold text-graphite">{r.name}.</strong> {r.rule}
                  </span>
                </li>
              ))}
            </ol>
          </Panel>

          <Panel title="Do not use" subtitle="From the bank, and the vocabulary of Voice and Tone.">
            <Bullets items={DO_NOT_USE} />
            <table className="mt-4 w-full border-t border-graphite/10 text-left text-xs">
              <thead>
                <tr>
                  <th scope="col" className="annot w-1/2 pb-1.5 pr-3 pt-3 text-[10px] font-medium text-blueprint">
                    Say
                  </th>
                  <th scope="col" className="annot pb-1.5 pt-3 text-[10px] font-medium text-blueprint">
                    Not
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dashed divide-graphite/10">
                {SAY_NOT.map((r) => (
                  <tr key={r.say}>
                    <td className="py-1.5 pr-3 align-top font-semibold text-graphite">{r.say}</td>
                    <td className="py-1.5 align-top text-charcoal line-through decoration-graphite/40">{r.not}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
        </div>
      </div>
    </div>
  );
}
