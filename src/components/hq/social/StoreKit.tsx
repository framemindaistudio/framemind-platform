"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarPlus, Check, Copy, Download, FolderArchive, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Panel } from "@/components/hq/ui";
import { api, useCollection } from "@/components/hq/data";
import { saveBlob, zip } from "@/lib/social/render";
import { cn } from "@/lib/utils";

/*
 * Social Studio → Store kit: Instagram posts for every FrameMind Store product. Two carousels (teach and peek inside),
 * a story and a Reel cover per product, with captions, the Reel script and the comment-keyword DM reply.
 * Images live in the private data repo (vault/social/store-kit) and stream through /api/hq/social/store-kit/file.
 * "Add to plan" puts the posts into the content plan with dates, so they show up in the Plan tab.
 */

type Img = { name: string; label: string; w: number; h: number };
type Product = {
  id: string;
  title: string;
  slug: string;
  accent: string;
  price: number;
  keyword: string;
  hook: string;
  images: Img[];
  captions: { teach: string; peek: string; reel: string; story: string };
  hashtags: string;
  reel: { hook: string; shots: { secs: number; show: string; text: string }[]; voiceover: string };
  dm: string;
};
type Kit = { note?: string; products: Product[]; schedule: { day: number; product: string; kind: "reel" | "story" | "teach" | "peek" }[] };

const img = (pid: string, name: string, thumb = false) => `/api/hq/social/store-kit/file?p=${encodeURIComponent(`${pid}/${name}${thumb ? ".thumb" : ""}.jpg`)}`;
const GROUPS: { key: "teach" | "peek" | "single"; title: string; hint: string }[] = [
  { key: "teach", title: "Teach carousel", hint: "6 slides that teach something real. Best for saves." },
  { key: "peek", title: "Peek-inside carousel", hint: "5 slides with real pages, what's included and the price." },
  { key: "single", title: "Story and Reel cover", hint: "1080 × 1920. Add the link sticker in the dashed box." },
];
const FORMAT = { reel: "Reel", story: "Story", teach: "Carousel", peek: "Carousel" } as const;

function CopyBtn({ text, label = "Copy" }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <Button
      size="sm"
      variant="secondary"
      onClick={() => {
        navigator.clipboard?.writeText(text).then(() => {
          setDone(true);
          setTimeout(() => setDone(false), 1400);
        });
      }}
    >
      {done ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />} {done ? "Copied" : label}
    </Button>
  );
}

async function fetchBlob(url: string) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Could not load an image (${r.status})`);
  return r.blob();
}

export function StoreKit() {
  const [kit, setKit] = useState<Kit | null>(null);
  const [failed, setFailed] = useState("");
  const [pid, setPid] = useState("");
  const [busy, setBusy] = useState("");
  const [start, setStart] = useState(() => new Date(Date.now() + 86400000).toISOString().slice(0, 10));
  const [added, setAdded] = useState("");
  const posts = useCollection("contentCalendar");

  useEffect(() => {
    api<Kit>("/api/hq/social/store-kit")
      .then((k) => {
        setKit(k);
        setPid((p) => p || k.products[0]?.id || "");
      })
      .catch((e) => setFailed(e instanceof Error ? e.message : "Could not load the kit."));
  }, []);

  const p = useMemo(() => kit?.products.find((x) => x.id === pid), [kit, pid]);

  async function downloadAll(prod: Product) {
    setBusy("zip");
    try {
      const files = await Promise.all(prod.images.map(async (i) => ({ name: `${prod.slug}/${i.name}.jpg`, blob: await fetchBlob(img(prod.id, i.name)) })));
      const text = `TEACH CAROUSEL CAPTION\n${prod.captions.teach}\n\nPEEK CAROUSEL CAPTION\n${prod.captions.peek}\n\nREEL CAPTION\n${prod.captions.reel}\n\nREEL SCRIPT\n${prod.reel.shots.map((s, k) => `${k + 1}. ${s.secs}s — ${s.show}${s.text ? ` [text: ${s.text}]` : ""}`).join("\n")}\nVoice-over: ${prod.reel.voiceover}\n\nSTORY\n${prod.captions.story}\n\nDM REPLY (keyword ${prod.keyword})\n${prod.dm}\n`;
      files.push({ name: `${prod.slug}/captions-and-script.txt`, blob: new Blob([text], { type: "text/plain" }) });
      saveBlob(await zip(files), `instagram-${prod.slug}.zip`);
    } catch (e) {
      setFailed(e instanceof Error ? e.message : "Download failed.");
    } finally {
      setBusy("");
    }
  }

  async function addToPlan(items: Kit["schedule"], label: string) {
    if (!kit) return;
    setBusy("plan");
    setAdded("");
    try {
      const base = new Date(`${start}T09:00:00`);
      for (const s of items) {
        const prod = kit.products.find((x) => x.id === s.product);
        if (!prod) continue;
        const d = new Date(base.getTime() + s.day * 86400000).toISOString().slice(0, 10);
        const title = s.kind === "reel" ? prod.reel.hook : s.kind === "teach" ? prod.hook : s.kind === "peek" ? `${prod.title}: look inside` : `${prod.title} is out now`;
        await posts.save({ account: "FrameMind", date: d, platform: "Instagram", format: FORMAT[s.kind], title, pillar: "Offers", status: s.kind === "reel" ? "scripted" : "designed", caption: prod.captions[s.kind], owner: "" });
      }
      setAdded(`${label}: ${items.length} posts added to the plan.`);
    } catch (e) {
      setFailed(e instanceof Error ? e.message : "Could not add to the plan.");
    } finally {
      setBusy("");
    }
  }

  if (failed && !kit) return <Panel title="Store kit">{failed}</Panel>;
  if (!kit)
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading the store kit…
      </div>
    );
  if (!kit.products.length) return <Panel title="Store kit">The kit has not been uploaded yet.</Panel>;

  const groups = p
    ? {
        teach: p.images.filter((i) => i.name.startsWith("teach")),
        peek: p.images.filter((i) => i.name.startsWith("peek")),
        single: p.images.filter((i) => !i.name.startsWith("teach") && !i.name.startsWith("peek")),
      }
    : null;

  return (
    <div className="space-y-6">
      {kit.note && <p className="rounded border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">{kit.note}</p>}
      {failed && <p className="text-sm text-red-600">{failed}</p>}

      <Panel title="Launch schedule" subtitle={`${kit.schedule.length} posts over ${Math.ceil((Math.max(...kit.schedule.map((s) => s.day)) + 1) / 7)} weeks: two products a week, a Reel, a teach carousel, a peek carousel and a story each.`}>
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-sm">
            <span className="mb-1 block text-xs text-muted-foreground">First post on</span>
            <input type="date" value={start} onChange={(e) => setStart(e.target.value)} className="h-9 rounded-md border border-border bg-background px-2" />
          </label>
          <Button size="sm" disabled={busy === "plan"} onClick={() => addToPlan(kit.schedule, "Whole launch")}>
            <CalendarPlus className="h-3.5 w-3.5" /> Add the whole launch to the plan
          </Button>
          {added && <span className="text-sm text-emerald-700">{added}</span>}
        </div>
      </Panel>

      <div className="flex flex-wrap gap-2">
        {kit.products.map((x) => (
          <button
            key={x.id}
            type="button"
            onClick={() => setPid(x.id)}
            className={cn("inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors", x.id === pid ? "border-foreground bg-foreground text-background" : "border-border hover:border-foreground/40")}
          >
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: x.accent }} />
            {x.title}
          </button>
        ))}
      </div>

      {p && groups && (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" disabled={busy === "zip"} onClick={() => downloadAll(p)}>
              {busy === "zip" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FolderArchive className="h-3.5 w-3.5" />} Download everything (ZIP)
            </Button>
            <Button size="sm" variant="secondary" disabled={busy === "plan"} onClick={() => addToPlan(kit.schedule.filter((s) => s.product === p.id).map((s) => ({ ...s, day: s.day % 7 })), p.title)}>
              <CalendarPlus className="h-3.5 w-3.5" /> Add this product&apos;s 4 posts to the plan
            </Button>
            <span className="text-sm text-muted-foreground">
              Comment keyword: <b className="font-mono text-foreground">{p.keyword}</b> · ₹{p.price}
            </span>
          </div>

          {GROUPS.map((g) => (
            <Panel key={g.key} title={g.title} subtitle={g.hint}>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {groups[g.key].map((i) => (
                  <figure key={i.name} className="w-40 shrink-0">
                    <a href={img(p.id, i.name)} download={`${p.slug}-${i.name}.jpg`} className="group relative block overflow-hidden rounded-lg border border-border">
                      {/* eslint-disable-next-line @next/next/no-img-element -- private, auth-protected images */}
                      <img src={img(p.id, i.name, true)} alt={i.label} loading="lazy" className="block w-full" />
                      <span className="absolute inset-0 hidden items-center justify-center bg-black/45 text-white group-hover:flex">
                        <Download className="h-5 w-5" />
                      </span>
                    </a>
                    <figcaption className="mt-1 text-xs text-muted-foreground">{i.label}</figcaption>
                  </figure>
                ))}
              </div>
              {g.key !== "single" && (
                <div className="mt-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Caption</span>
                    <CopyBtn text={p.captions[g.key]} />
                  </div>
                  <pre className="max-h-56 overflow-auto whitespace-pre-wrap rounded-lg bg-muted/50 p-3 font-sans text-sm">{p.captions[g.key]}</pre>
                </div>
              )}
              {g.key === "single" && (
                <div className="mt-3 flex items-center justify-between gap-3 rounded-lg bg-muted/50 p-3 text-sm">
                  <span>{p.captions.story}</span>
                  <CopyBtn text={p.captions.story} label="Copy link text" />
                </div>
              )}
            </Panel>
          ))}

          <Panel title="Reel script" subtitle="Film it on a phone or screen-record the guide's web version. Use a trending sound from Instagram's library.">
            <p className="mb-3 font-semibold">Hook: {p.reel.hook}</p>
            <ol className="space-y-1.5 text-sm">
              {p.reel.shots.map((s, k) => (
                <li key={k} className="flex gap-3">
                  <span className="w-10 shrink-0 font-mono text-muted-foreground">{s.secs}s</span>
                  <span className="flex-1">{s.show}</span>
                  {s.text && <span className="rounded bg-muted px-2 font-mono text-xs">{s.text}</span>}
                </li>
              ))}
            </ol>
            <p className="mt-3 text-sm">
              <b>Voice-over:</b> {p.reel.voiceover}
            </p>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Reel caption</span>
              <CopyBtn text={p.captions.reel} />
            </div>
            <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap rounded-lg bg-muted/50 p-3 font-sans text-sm">{p.captions.reel}</pre>
          </Panel>

          <Panel title="Comment-keyword DM reply" subtitle={`When someone comments ${p.keyword}, send this (set it up in your DM automation tool).`}>
            <pre className="whitespace-pre-wrap rounded-lg bg-muted/50 p-3 font-sans text-sm">{p.dm}</pre>
            <div className="mt-2">
              <CopyBtn text={p.dm} />
            </div>
          </Panel>
        </>
      )}
    </div>
  );
}
