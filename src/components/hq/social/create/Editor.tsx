"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { ArrowLeft, CalendarCheck, CalendarPlus, Check, ChevronLeft, ChevronRight, Copy, Download, FolderArchive, RotateCcw } from "lucide-react";
import { getCollection } from "@/lib/hq/collections";
import { canEdit } from "@/lib/hq/roles";
import { Button } from "@/components/ui/Button";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/form";
import { useCollection, useHq } from "@/components/hq/data";
import { Panel } from "@/components/hq/ui";
import { draw, fileName, pagesOf, saveBlob, toBlob, zip, type Design, type Kit } from "@/lib/social/render";
import { FORMATS, type Facts, type FieldSpec, type FormatId, type Picture, type TemplateDef, type TemplateGroup, type Tone, type Values } from "@/lib/social/types";
import { CREDIT, shortDate } from "@/lib/social/words";
import { cn } from "@/lib/utils";
import { CHANNELS, HOUSE, PLAN, PLATFORM_OPTIONS, dayOf, statusOf, type Post } from "../plan/posts";
import { encodeDraft, forget, recall, remember, useStock, type Draft } from "./kit";
import { PictureField } from "./PictureField";

const TONE_LABELS: Record<Tone, { label: string; note: string }> = {
  paper: { label: "Paper", note: "Ink on paper" },
  graphite: { label: "Ink", note: "Paper and lime on black" },
  photo: { label: "Photo", note: "A picture fills the frame" },
};

/** which content pillar of the plan a design belongs to */
const PILLAR: Record<TemplateGroup, string> = {
  Announcements: "Announcements",
  Promotion: "Offers",
  Services: "Offers",
  Hiring: "Hiring",
  Milestones: "Case study",
  "Behind the scenes": "Behind the scenes",
  Video: "Process",
  Words: "AI tips",
  Founders: "Founder story",
};

/** The 30-second check of Voice and Tone, section 6. */
const CHECKS = [
  "Every claim is true today, or is written as a plan.",
  "Prices match the current Rate Card, with “ex-GST”.",
  "Consent is confirmed for every person shown or named.",
  "The client has approved their name, logo and work being shown.",
  "Names, dates and amounts are spelled exactly right.",
];

const startValues = (template: TemplateDef, initial: Draft | null | undefined): Values => ({ ...template.sample, ...(initial?.t === template.id ? initial.v : (recall(template.id) ?? {})) });

/** Where a design usually goes out: a founder's note on LinkedIn, a thumbnail on YouTube, the rest on Instagram. */
const platformFor = (group: TemplateGroup) => (group === "Founders" ? "LinkedIn" : group === "Video" ? "YouTube" : "Instagram");
/** The founder's own profile for a design that has a "whose post is it?" box; the studio's channels for every other. */
const accountFor = (template: TemplateDef, values: Values) => {
  if (template.group !== "Founders" || !values.who) return HOUSE;
  return CHANNELS.find((c) => c.personal && c.label.toLowerCase() === values.who.toLowerCase())?.value ?? HOUSE;
};
/** What the plan calls this file: a carousel, a story, a video's cover, or a post. */
const planFormat = (group: TemplateGroup, format: FormatId, pages: number) =>
  pages > 1 ? "Carousel" : group === "Video" ? (format === "wide" ? "Long video" : format === "story" ? "Reel" : "Post") : format === "story" ? "Story" : "Post";

function TextField({ spec, value, onChange }: { spec: FieldSpec; value: string; onChange: (v: string) => void }) {
  const id = useId();
  const longest = spec.kind === "textarea" ? Math.max(0, ...value.split("\n").map((l) => l.length)) : value.length;
  const over = !!spec.max && longest > spec.max;
  const help = over ? `Long for this design (${longest} of about ${spec.max} characters${spec.kind === "textarea" ? " on a line" : ""}): the type will shrink or be cut.` : spec.help;
  return (
    <Field label={spec.label} htmlFor={id} help={help} className={over ? "[&>p]:text-warn" : undefined}>
      {spec.kind === "textarea" ? (
        <Textarea id={id} rows={spec.rows ?? 3} value={value} placeholder={spec.placeholder} onChange={(e) => onChange(e.target.value)} />
      ) : spec.kind === "select" ? (
        <Select id={id} value={value} onChange={(e) => onChange(e.target.value)}>
          {(spec.options ?? []).map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
      ) : (
        <Input id={id} type={spec.kind === "date" ? "date" : "text"} value={value} placeholder={spec.placeholder} onChange={(e) => onChange(e.target.value)} />
      )}
    </Field>
  );
}

export function Editor({
  template,
  kit,
  facts,
  initial,
  post,
  onBack,
  onOpenPlan,
  onUnlinkPost,
}: {
  template: TemplateDef;
  kit: Kit;
  facts: Facts;
  initial?: Draft | null;
  /** the planned post this design was opened for: saving goes back to it */
  post?: Post | null;
  onBack: () => void;
  onOpenPlan: () => void;
  onUnlinkPost: () => void;
}) {
  const { user, store } = useHq();
  const posts = useCollection<Post>(PLAN);
  const mayPlan = canEdit(user, getCollection(PLAN)?.write) && store.writable;
  // a post made here with "Add to plan": pressing again updates it instead of making a second one
  const [madeId, setMadeId] = useState("");
  const saved = post ?? (madeId ? (posts.records.find((r) => r.id === madeId) ?? null) : null);

  const [values, setValues] = useState<Values>(() => startValues(template, initial));
  const [format, setFormat] = useState<FormatId>(() => (initial?.f && template.formats.includes(initial.f) ? initial.f : template.formats[0]));
  const [tone, setTone] = useState<Tone>(() => (initial?.o && template.tones.includes(initial.o) ? initial.o : template.tones[0]));
  const [own, setOwn] = useState<Record<string, Picture | null>>({});
  const [page, setPage] = useState(0);
  const [captionEdit, setCaptionEdit] = useState<string | null>(null);
  const [busy, setBusy] = useState("");
  const [note, setNote] = useState<{ ok: boolean; text: string; plan?: boolean } | null>(null);
  const [copied, setCopied] = useState(false);
  const [zones, setZones] = useState(false);
  const [planning, setPlanning] = useState(false);
  const [plan, setPlan] = useState(() => ({ date: "", platform: platformFor(template.group), account: HOUSE }));
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const stock = useStock(template, values);
  const pictures = useMemo(() => {
    const out: Record<string, Picture | null> = {};
    for (const f of template.fields) if (f.kind === "image") out[f.key] = own[f.key] ?? stock[f.key] ?? null;
    return out;
  }, [template, own, stock]);
  const design: Design = useMemo(() => ({ template, format, tone, values, pictures, facts }), [template, format, tone, values, pictures, facts]);
  const pages = pagesOf(design);
  const at = Math.min(page, pages - 1);
  const size = FORMATS[format];

  useEffect(() => {
    const id = requestAnimationFrame(() => canvasRef.current && draw(canvasRef.current, design, kit, at));
    return () => cancelAnimationFrame(id);
  }, [design, kit, at]);

  useEffect(() => {
    const id = setTimeout(() => remember(template.id, values), 400);
    return () => clearTimeout(id);
  }, [template.id, values]);

  const suggested = useMemo(() => {
    const c = template.caption(values, facts);
    // a drawn or generated picture is never captioned as real client work
    const text = Object.values(pictures).some((p) => p?.illustration) ? c.text.replace(`\n\n${CREDIT}`, "") : c.text;
    return `${text}\n\n${c.tags.join(" ")}`;
  }, [template, values, facts, pictures]);

  // a post opened from the plan keeps the caption it was saved with, until the person asks for a new one
  const [captionFrom, setCaptionFrom] = useState("");
  if (post && captionFrom !== post.id) {
    setCaptionFrom(post.id);
    const kept = String(post.caption ?? "").trim();
    if (kept && kept !== suggested.trim()) setCaptionEdit(kept);
  }

  const captionText = captionEdit ?? suggested;
  const firstLine = captionText.split("\n")[0] ?? "";

  const set = (key: string, v: string) => {
    setValues((old) => ({ ...old, [key]: v }));
    setNote(null);
  };

  async function run(label: string, job: () => Promise<void>) {
    setBusy(label);
    setNote(null);
    try {
      await job();
    } catch (e) {
      setNote({ ok: false, text: e instanceof Error ? e.message : "That did not work. Try again." });
    } finally {
      setBusy("");
    }
  }

  const photoLed = tone === "photo" || template.fields.some((f) => f.kind === "image" && pictures[f.key]);
  const downloadOne = (ext: "png" | "jpg") =>
    run(ext, async () => {
      const blob = await toBlob(design, kit, at, ext === "png" ? "image/png" : "image/jpeg");
      saveBlob(blob, fileName(design, pages > 1 ? at : null, ext, new Date()));
    });
  const downloadSet = (which: "slides" | "sizes") =>
    run(which, async () => {
      const today = new Date();
      const ext = photoLed ? "jpg" : "png";
      const type = photoLed ? "image/jpeg" : "image/png";
      const files: { name: string; blob: Blob }[] = [];
      for (const f of which === "sizes" ? template.formats : [format]) {
        const d = { ...design, format: f };
        for (let i = 0; i < pages; i++) files.push({ name: fileName(d, pages > 1 ? i : null, ext, today), blob: await toBlob(d, kit, i, type) });
      }
      saveBlob(await zip(files), `FrameMind_${template.id}_${which}.zip`);
    });

  async function copyCaption() {
    try {
      await navigator.clipboard.writeText(captionText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setNote({ ok: false, text: "The browser did not allow copying. Select the caption and copy it by hand." });
    }
  }

  const savedDesign = () => encodeDraft({ t: template.id, f: format, o: tone, v: values });
  const savedTitle = saved ? String(saved.title || "Untitled") : "";

  /** A new post in the plan, with the words, the caption and the design. */
  const addToPlan = () =>
    run("plan", async () => {
      const made = await posts.save({
        account: plan.account,
        date: plan.date || undefined,
        platform: plan.platform,
        format: planFormat(template.group, format, pages),
        title: firstLine.replace(/[“”]/g, "").slice(0, 110) || template.name,
        pillar: PILLAR[template.group],
        status: "designed",
        caption: captionText,
        design: savedDesign(),
      });
      setMadeId(made.id);
      setPlanning(false);
      setNote({ ok: true, text: `Added to the plan${plan.date ? ` for ${shortDate(plan.date)}` : ", without a date yet"}.`, plan: true });
    });

  /** The post this design belongs to gets the design and the caption as they are now. Its date, title and platform stay. */
  const saveToPost = () =>
    saved &&
    run("plan", async () => {
      const kind = String(saved.format ?? "");
      await posts.save({
        ...saved,
        // a planned Reel or Short stays one: only a still post follows the design's own size
        format: !kind || ["Post", "Carousel", "Story"].includes(kind) ? planFormat(template.group, format, pages) : kind,
        status: ["idea", "scripted"].includes(statusOf(saved)) ? "designed" : saved.status,
        caption: captionText,
        design: savedDesign(),
      });
      setNote({ ok: true, text: `Saved to “${savedTitle}” in the plan.`, plan: true });
    });

  function reset() {
    forget(template.id);
    setValues({ ...template.sample });
    setOwn({});
    setCaptionEdit(null);
    setPage(0);
    setNote(null);
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-x-4 gap-y-2">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="size-3.5" aria-hidden /> All designs
        </Button>
        <div className="min-w-0">
          <p className="annot text-blueprint">{template.group}</p>
          <h2 className="truncate text-lg font-bold text-graphite">{template.name}</h2>
        </div>
        <Button variant="ghost" size="sm" className="ml-auto" onClick={reset}>
          <RotateCcw className="size-3.5" aria-hidden /> Start again
        </Button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,400px)_minmax(0,1fr)]">
        {/* ── what to type ── */}
        <div className="space-y-5">
          <Panel title="1 · Your words" subtitle="The design updates as you type.">
            <div className="space-y-4">
              {template.fields.map((f) =>
                f.kind === "image" ? (
                  <PictureField key={f.key} spec={f} picture={own[f.key] ?? null} hasStock={!!stock[f.key]} onChange={(p) => setOwn((o) => ({ ...o, [f.key]: p }))} />
                ) : (
                  <TextField key={f.key} spec={f} value={values[f.key] ?? ""} onChange={(v) => set(f.key, v)} />
                ),
              )}
            </div>
          </Panel>
        </div>

        {/* ── the design ── */}
        <div className="min-w-0 space-y-5">
          <Panel
            title="The design"
            subtitle={`${size.w} × ${size.h} px · ${size.use}`}
            action={
              format === "story" ? <Checkbox label="Show where the app's buttons sit" checked={zones} onChange={(e) => setZones(e.target.checked)} className="text-xs" /> : undefined
            }
          >
            <div className="mb-4 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
              <div>
                <p className="annot mb-1.5 text-charcoal">2 · Size</p>
                <div role="radiogroup" aria-label="Size" className="flex flex-wrap gap-2">
                  {template.formats.map((f) => (
                    <button
                      key={f}
                      type="button"
                      role="radio"
                      aria-checked={format === f}
                      title={FORMATS[f].use}
                      onClick={() => {
                        setFormat(f);
                        setZones(false);
                      }}
                      className={cn("rounded-[var(--radius-sm)] border px-3 py-1.5 text-xs font-semibold transition-colors", format === f ? "border-graphite bg-graphite text-paper" : "border-graphite/20 text-graphite hover:border-graphite/50")}
                    >
                      {FORMATS[f].label}
                    </button>
                  ))}
                </div>
              </div>
              {template.tones.length > 1 && (
                <div>
                  <p className="annot mb-1.5 text-charcoal">3 · Look</p>
                  <div role="radiogroup" aria-label="Look" className="flex flex-wrap gap-2">
                    {template.tones.map((t) => (
                      <button
                        key={t}
                        type="button"
                        role="radio"
                        aria-checked={tone === t}
                        title={TONE_LABELS[t].note}
                        onClick={() => setTone(t)}
                        className={cn("rounded-[var(--radius-sm)] border px-3 py-1.5 text-xs font-semibold transition-colors", tone === t ? "border-graphite bg-graphite text-paper" : "border-graphite/20 text-graphite hover:border-graphite/50")}
                      >
                        {TONE_LABELS[t].label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {tone === "photo" && !template.fields.some((f) => f.kind === "image" && pictures[f.key]) && (
              <p role="note" className="mb-4 rounded-[var(--radius-sm)] border border-warn/30 bg-warn/[0.06] px-3 py-2 text-xs text-charcoal">
                The Photo look needs a picture: add one under “Your words”. Until then the sheet stays plain graphite.
              </p>
            )}
            <div className="rounded-[var(--radius-sm)] bg-graphite/[0.06] p-4 sm:p-6">
              <div className="relative mx-auto shadow-[var(--shadow-lift)]" style={{ aspectRatio: `${size.w} / ${size.h}`, maxWidth: `min(100%, calc(68vh * ${size.w / size.h}))` }}>
                <canvas ref={canvasRef} role="img" aria-label={`Preview of the ${template.name} design, ${size.label}`} className="block h-full w-full" />
                {zones && format === "story" && (
                  <>
                    <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 border-b border-dashed border-white/70 bg-bad/25" style={{ height: `${(250 / 1920) * 100}%` }} />
                    <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 border-t border-dashed border-white/70 bg-bad/25" style={{ height: `${(380 / 1920) * 100}%` }} />
                    <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 border-l border-dashed border-white/70 bg-bad/15" style={{ width: `${(120 / 1080) * 100}%` }} />
                  </>
                )}
              </div>
            </div>

            {pages > 1 && (
              <div className="mt-4 flex items-center justify-center gap-3">
                <Button variant="secondary" size="sm" disabled={at === 0} onClick={() => setPage(at - 1)} aria-label="Previous slide">
                  <ChevronLeft className="size-4" aria-hidden />
                </Button>
                <span className="tabular text-sm font-medium text-graphite" aria-live="polite">
                  Slide {at + 1} of {pages}
                </span>
                <Button variant="secondary" size="sm" disabled={at >= pages - 1} onClick={() => setPage(at + 1)} aria-label="Next slide">
                  <ChevronRight className="size-4" aria-hidden />
                </Button>
              </div>
            )}

            <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-graphite/10 pt-4">
              <Button onClick={() => downloadOne("png")} disabled={!!busy}>
                <Download className="size-4" aria-hidden /> {busy === "png" ? "Making…" : pages > 1 ? "Download this slide" : "Download PNG"}
              </Button>
              <Button variant="secondary" onClick={() => downloadOne("jpg")} disabled={!!busy} title="A smaller file. Best when a photograph fills the frame.">
                {busy === "jpg" ? "Making…" : "Download JPG"}
              </Button>
              {pages > 1 && (
                <Button variant="secondary" onClick={() => downloadSet("slides")} disabled={!!busy} title="Every slide of this carousel in one ZIP file.">
                  <FolderArchive className="size-4" aria-hidden /> {busy === "slides" ? "Packing…" : `All ${pages} slides (ZIP)`}
                </Button>
              )}
              {template.formats.length > 1 && (
                <Button variant="secondary" onClick={() => downloadSet("sizes")} disabled={!!busy} title="Every size of this design in one ZIP file.">
                  <FolderArchive className="size-4" aria-hidden /> {busy === "sizes" ? "Packing…" : "All sizes (ZIP)"}
                </Button>
              )}
              {mayPlan &&
                (saved ? (
                  <Button variant="ghost" className="ml-auto" onClick={saveToPost} disabled={!!busy} title="Saves the words, the caption and the design to the post in the plan. Its date and title stay as they are.">
                    <CalendarCheck className="size-4" aria-hidden /> {busy === "plan" ? "Saving…" : "Save to this post"}
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    className="ml-auto"
                    aria-expanded={planning}
                    onClick={() => {
                      if (!planning) setPlan((p) => ({ ...p, account: accountFor(template, values) }));
                      setPlanning((p) => !p);
                    }}
                  >
                    <CalendarPlus className="size-4" aria-hidden /> Add to plan
                  </Button>
                ))}
            </div>

            {mayPlan && saved && (
              <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-charcoal">
                <span>
                  In the plan as <strong className="text-graphite">“{savedTitle}”</strong>
                  {dayOf(saved) ? `, ${shortDate(dayOf(saved))}` : ", no date yet"}. Pictures are not stored with it.
                </span>
                <button
                  type="button"
                  className="font-semibold text-graphite underline underline-offset-2"
                  onClick={() => {
                    setMadeId("");
                    onUnlinkPost();
                    setNote(null);
                  }}
                >
                  Make a new post instead
                </button>
              </p>
            )}

            {planning && mayPlan && !saved && (
              <div className="mt-4 grid gap-3 rounded-[var(--radius-sm)] border border-graphite/15 bg-paper p-4 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end">
                <Field label="Publish date (optional)">
                  <Input type="date" aria-label="Publish date (optional)" value={plan.date} onChange={(e) => setPlan((p) => ({ ...p, date: e.target.value }))} />
                </Field>
                <Field label="Platform">
                  <Select aria-label="Platform" value={plan.platform} onChange={(e) => setPlan((p) => ({ ...p, platform: e.target.value }))}>
                    {PLATFORM_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Posted from">
                  <Select aria-label="Posted from" value={plan.account} onChange={(e) => setPlan((p) => ({ ...p, account: e.target.value }))}>
                    {CHANNELS.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.value}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Button onClick={addToPlan} disabled={!!busy}>
                  {busy === "plan" ? "Saving…" : "Save to plan"}
                </Button>
                <p className="text-xs text-blueprint sm:col-span-4">Saves the words and the caption, so the design can be opened again from the plan. Pictures are not stored: add them again when you reopen it.</p>
              </div>
            )}

            {note && (
              <p role="status" className={cn("mt-3 text-sm", note.ok ? "text-ok" : "text-bad")}>
                {note.text}{" "}
                {note.plan && (
                  <button type="button" onClick={onOpenPlan} className="font-semibold underline underline-offset-2">
                    Open the plan
                  </button>
                )}
              </p>
            )}
          </Panel>

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
            <Panel
              title="Caption"
              subtitle={`${firstLine.length} characters before “more” (aim for 125 or fewer)`}
              action={
                <div className="flex items-center gap-1">
                  {captionEdit !== null && (
                    <Button variant="ghost" size="sm" onClick={() => setCaptionEdit(null)}>
                      Write it again from the boxes
                    </Button>
                  )}
                  <Button size="sm" onClick={copyCaption}>
                    {copied ? <Check className="size-3.5" aria-hidden /> : <Copy className="size-3.5" aria-hidden />} {copied ? "Copied" : "Copy"}
                  </Button>
                </div>
              }
            >
              {/* tall enough to show the call to action and the hashtags: what is copied should be what is seen */}
              <Textarea aria-label="Caption" rows={Math.min(18, Math.max(9, captionText.split("\n").length + 3))} value={captionText} onChange={(e) => setCaptionEdit(e.target.value)} className="font-sans text-[13px]" />
              {captionEdit !== null && (
                <p role="note" className="mt-2 text-xs text-warn">
                  This caption no longer follows the boxes on the left: it was edited by hand, or it came with the post. “Write it again from the boxes” starts it over.
                </p>
              )}
              <p className="mt-2 text-xs text-blueprint">
                Written in the house structure: hook, a few short lines, one call to action, then the hashtags. Edit it freely before you copy. The hashtags are this design’s standard mix: do not post the same mix twice in a row, take another from the Captions tab.
              </p>
            </Panel>

            <Panel title="Before you post" subtitle="The 30-second check">
              <ul className="space-y-2.5">
                {CHECKS.map((c) => (
                  <li key={c}>
                    <Checkbox label={<span className="text-xs leading-relaxed text-charcoal">{c}</span>} className="items-start [&>input]:mt-0.5" />
                  </li>
                ))}
              </ul>
            </Panel>
          </div>
        </div>
      </div>
    </div>
  );
}
