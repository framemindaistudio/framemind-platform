"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarPlus, Check, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Panel } from "@/components/hq/ui";
import { api, useCollection } from "@/components/hq/data";

/*
 * Social Studio → Trends: the weekly trend report written by the scheduled research routine (every Monday). Each
 * trend, product idea and platform change cites its sources. Content ideas and dates go into the content plan.
 */

type Src = { sources?: string[] };
type Report = {
  week: string;
  generatedAt?: string;
  summary: string;
  trends: ({ title: string; detail: string; kind: string } & Src)[];
  productIdeas: ({ title: string; category: string; price: number; effort: "S" | "M" | "L"; why: string } & Src)[];
  contentIdeas: { product: string; format: "Reel" | "Carousel" | "Story" | "Post"; hook: string; angle?: string; why: string }[];
  dates?: { date: string; occasion: string; idea: string }[];
  platform?: ({ change: string; impact: string } & Src)[];
  actions: string[];
  store?: { live: number; soon: number; orders7d: number };
};

const EFFORT = { S: "Small (a day)", M: "Medium (2–4 days)", L: "Large (a week+)" };
const host = (u: string) => {
  try {
    return new URL(u).hostname.replace(/^www\./, "");
  } catch {
    return u;
  }
};

function Sources({ list }: { list?: string[] }) {
  if (!list?.length) return null;
  return (
    <div className="mt-2 flex flex-wrap gap-2 text-xs">
      {list.map((u) => (
        <a key={u} href={u} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-muted-foreground hover:text-foreground">
          {host(u)} <ExternalLink className="h-3 w-3" />
        </a>
      ))}
    </div>
  );
}

const nextMonday = () => {
  const d = new Date();
  d.setDate(d.getDate() + ((8 - d.getDay()) % 7 || 7));
  return d.toISOString().slice(0, 10);
};

export function Trends() {
  const [weeks, setWeeks] = useState<string[]>([]);
  const [report, setReport] = useState<Report | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [msg, setMsg] = useState("");
  const [date, setDate] = useState(nextMonday);
  const [added, setAdded] = useState<string[]>([]);
  const posts = useCollection("contentCalendar");

  const fetchReport = useCallback(
    (week?: string) =>
      api<{ weeks: string[]; report: Report | null }>(`/api/hq/social/trends${week ? `?week=${week}` : ""}`)
        .then((r) => {
          setWeeks(r.weeks);
          setReport(r.report);
          setState("ready");
        })
        .catch((e) => {
          setMsg(e instanceof Error ? e.message : "Could not load the report.");
          setState("error");
        }),
    [],
  );
  useEffect(() => {
    fetchReport();
  }, [fetchReport]);
  const load = (week: string) => {
    setState("loading");
    fetchReport(week);
  };

  async function add(key: string, rec: Record<string, unknown>) {
    try {
      await posts.save({ account: "FrameMind", platform: "Instagram", status: "idea", owner: "", ...rec });
      setAdded((a) => [...a, key]);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Could not add to the plan.");
    }
  }

  if (state === "loading")
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading this week&apos;s trends…
      </div>
    );
  if (state === "error") return <Panel title="Trends">{msg}</Panel>;
  if (!report) return <Panel title="Trends">No report yet. The research routine writes one every Monday morning.</Panel>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <label className="text-sm">
          <span className="mr-2 text-muted-foreground">Week of</span>
          <select value={report.week} onChange={(e) => load(e.target.value)} className="h-9 rounded-md border border-border bg-background px-2">
            {weeks.map((w) => (
              <option key={w} value={w}>
                {new Date(`${w}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
              </option>
            ))}
          </select>
        </label>
        {report.store && (
          <span className="text-sm text-muted-foreground">
            Store: {report.store.live} live · {report.store.soon} dropping soon · {report.store.orders7d} paid orders in the 7 days before this report
          </span>
        )}
      </div>
      {msg && <p className="text-sm text-red-600">{msg}</p>}

      <Panel title="This week in one minute">
        <p className="leading-relaxed">{report.summary}</p>
        {report.actions.length > 0 && (
          <ul className="mt-4 space-y-1.5">
            {report.actions.map((a) => (
              <li key={a} className="flex gap-2 text-sm">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> {a}
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel title="Trends" subtitle="What is working right now, with sources.">
        <div className="grid gap-3 md:grid-cols-2">
          {report.trends.map((t) => (
            <div key={t.title} className="rounded-lg border border-border p-4">
              <span className="rounded-full bg-muted px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{t.kind}</span>
              <h4 className="mt-2 font-semibold">{t.title}</h4>
              <p className="mt-1 text-sm text-muted-foreground">{t.detail}</p>
              <Sources list={t.sources} />
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Content ideas" subtitle="Add any idea to the content plan on the date you pick.">
        <label className="mb-3 inline-flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Plan for</span>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-9 rounded-md border border-border bg-background px-2" />
        </label>
        <ul className="divide-y divide-border">
          {report.contentIdeas.map((c, i) => {
            const key = `c${i}`;
            return (
              <li key={key} className="flex flex-wrap items-start gap-3 py-3">
                <span className="w-20 shrink-0 rounded bg-muted px-2 py-0.5 text-center text-xs">{c.format}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{c.hook}</p>
                  <p className="text-sm text-muted-foreground">
                    {c.angle ? `${c.angle} · ` : ""}
                    {c.why}
                    {c.product ? ` · product: ${c.product}` : ""}
                  </p>
                </div>
                <Button size="sm" variant="secondary" disabled={added.includes(key)} onClick={() => add(key, { date, format: c.format, title: c.hook, pillar: c.product ? "Offers" : "AI tips", caption: c.angle ?? "" })}>
                  {added.includes(key) ? <Check className="h-3.5 w-3.5" /> : <CalendarPlus className="h-3.5 w-3.5" />} {added.includes(key) ? "Added" : "Add to plan"}
                </Button>
              </li>
            );
          })}
        </ul>
      </Panel>

      <Panel title="Product ideas" subtitle="Possible new products for the store. Nothing is made until you decide.">
        <div className="grid gap-3 md:grid-cols-2">
          {report.productIdeas.map((p) => (
            <div key={p.title} className="rounded-lg border border-border p-4">
              <div className="flex items-start justify-between gap-2">
                <h4 className="font-semibold">{p.title}</h4>
                <span className="shrink-0 font-semibold tabular-nums">₹{p.price}</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {p.category} · effort: {EFFORT[p.effort]}
              </p>
              <p className="mt-2 text-sm">{p.why}</p>
              <Sources list={p.sources} />
            </div>
          ))}
        </div>
      </Panel>

      {report.dates && report.dates.length > 0 && (
        <Panel title="Dates coming up" subtitle="Festivals and days worth a post.">
          <ul className="divide-y divide-border">
            {report.dates.map((d, i) => {
              const key = `d${i}`;
              return (
                <li key={key} className="flex flex-wrap items-center gap-3 py-2.5 text-sm">
                  <span className="w-28 shrink-0 tabular-nums text-muted-foreground">{new Date(`${d.date}T00:00:00`).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}</span>
                  <span className="font-medium">{d.occasion}</span>
                  <span className="min-w-0 flex-1 text-muted-foreground">{d.idea}</span>
                  <Button size="sm" variant="secondary" disabled={added.includes(key)} onClick={() => add(key, { date: d.date, format: "Post", title: `${d.occasion}: ${d.idea}`, pillar: "Festival & days" })}>
                    {added.includes(key) ? <Check className="h-3.5 w-3.5" /> : <CalendarPlus className="h-3.5 w-3.5" />} {added.includes(key) ? "Added" : "Add"}
                  </Button>
                </li>
              );
            })}
          </ul>
        </Panel>
      )}

      {report.platform && report.platform.length > 0 && (
        <Panel title="Platform changes" subtitle="Instagram and Meta updates that affect how we post.">
          <ul className="space-y-3">
            {report.platform.map((p) => (
              <li key={p.change}>
                <p className="font-medium">{p.change}</p>
                <p className="text-sm text-muted-foreground">{p.impact}</p>
                <Sources list={p.sources} />
              </li>
            ))}
          </ul>
        </Panel>
      )}
      {report.generatedAt && <p className="text-xs text-muted-foreground">Researched {new Date(report.generatedAt).toLocaleString("en-IN")} by the weekly trend routine. Check sources before acting on a number.</p>}
    </div>
  );
}
