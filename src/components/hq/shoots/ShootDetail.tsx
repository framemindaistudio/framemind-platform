"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Circle, Clock, MapPin, Navigation, Pencil, Phone, Printer, Smartphone, Users } from "lucide-react";
import { getCollection } from "@/lib/hq/collections";
import { can } from "@/lib/hq/roles";
import { Badge, statusTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useCollection, useHq } from "@/components/hq/data";
import { RecordDrawer } from "@/components/hq/RecordDrawer";
import { EmptyState, KV, Loading, Panel } from "@/components/hq/ui";
import { BackLink, Notice } from "@/components/hq/sales/bits";
import { telHref } from "@/components/hq/sales/contact";
import { cn, formatDateTime } from "@/lib/utils";
import { list, longDate, str, type Rec } from "@/components/hq/projects/logic";

const def = getCollection("shoots")!;

/** The shoot-day steps, in the order a crew does them. */
export const DAY_STEPS = [
  { id: "batteries", label: "Batteries charged, cards formatted", when: "Night before" },
  { id: "packed", label: "Gear packed against the gear list", when: "Night before" },
  { id: "callConfirmed", label: "Call time confirmed with the on-site contact", when: "Night before" },
  { id: "arrived", label: "Crew on location", when: "On the day" },
  { id: "setup", label: "Set-up done, test shots checked", when: "On the day" },
  { id: "releases", label: "Model / location releases signed", when: "On the day" },
  { id: "shotList", label: "Shot list complete", when: "On the day" },
  { id: "bts", label: "Behind-the-scenes captured for our social", when: "On the day" },
  { id: "wrapCheck", label: "Gear counted back in, location left clean", when: "Wrap" },
  { id: "backup", label: "Footage backed up to two places", when: "Same night" },
] as const;

type DayState = Partial<Record<(typeof DAY_STEPS)[number]["id"], string>>;
const dayOf = (s: Rec): DayState => (s.day && typeof s.day === "object" ? (s.day as DayState) : {});
const shotsOf = (s: Rec) =>
  str(s.shotList)
    .split("\n")
    .map((l) => l.replace(/^[\s•\-*\d.)]+/, "").trim())
    .filter(Boolean);

export function ShootDetail({ id }: { id: string }) {
  const { user, store } = useHq();
  const shoots = useCollection("shoots");
  const { records: projects } = useCollection("projects");
  const canWrite = can(user, def.write) && store.writable;
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const [mode, setMode] = useState<"sheet" | "day">("sheet");
  const [error, setError] = useState("");
  const shoot = shoots.records.find((s) => s.id === id);
  const project = useMemo(() => projects.find((p) => p.id === shoot?.projectId), [projects, shoot?.projectId]);

  if (shoots.loading) return <Loading label="Loading shoot…" />;
  if (!shoot) return (<div><BackLink href="/hq/shoots">Shoots</BackLink><EmptyState icon="Camera" title="Shoot not found" description="It may have been deleted." /></div>);

  const day = dayOf(shoot);
  const shots = shotsOf(shoot);
  const ticked = Array.isArray(shoot.shotsDone) ? (shoot.shotsDone as number[]) : [];
  const done = DAY_STEPS.filter((s) => day[s.id]).length;

  async function patch(change: Record<string, unknown>) {
    if (!shoot) return;
    setError("");
    try {
      await shoots.save({ ...shoot, ...change });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save");
    }
  }

  function toggleStep(stepId: (typeof DAY_STEPS)[number]["id"]) {
    const next = { ...dayOf(shoot!) };
    if (next[stepId]) delete next[stepId];
    else next[stepId] = `${new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })} · ${user.name}`;
    void patch({
      day: next,
      ...(stepId === "backup" ? { backupDone: !!next.backup } : {}),
      ...(stepId === "releases" ? { releasesCollected: !!next.releases } : {}),
      ...(stepId === "wrapCheck" && next.wrapCheck && str(shoot!.status) !== "shot" ? { status: "shot" } : {}),
    });
  }

  const call = telHref(shoot.onSitePhone);
  const map = str(shoot.mapLink) || (shoot.location ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(str(shoot.location))}` : "");

  return (
    <div className={cn(mode === "day" && "mx-auto max-w-xl")}>
      <BackLink href="/hq/shoots">Shoots</BackLink>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="annot text-violet">{str(shoot.kind) || "Shoot"} · {longDate(shoot.date)}</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-[-0.02em] text-graphite sm:text-3xl">{str(shoot.title)}</h1>
          {project && (
            <Link href={`/hq/projects/${project.id}`} className="mt-1 inline-block text-sm text-charcoal underline-offset-4 hover:underline">
              {str(project.title)}
            </Link>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant={mode === "day" ? "lime" : "secondary"} onClick={() => setMode(mode === "day" ? "sheet" : "day")}>
            <Smartphone className="size-4" /> {mode === "day" ? "Call sheet" : "Shoot-day mode"}
          </Button>
          <Button size="sm" variant="secondary" href={`/hq/print/callsheet/${shoot.id}`}>
            <Printer className="size-4" /> Call sheet PDF
          </Button>
          {canWrite && (
            <Button size="sm" variant="ghost" onClick={() => setEditing({ ...shoot })}>
              <Pencil className="size-4" /> Edit
            </Button>
          )}
        </div>
      </div>
      {error && <Notice tone="bad" className="mb-4">{error}</Notice>}

      {mode === "day" ? (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-2">
            {call ? (
              <Button className="h-14" href={call}>
                <Phone className="size-5" /> Call on-site
              </Button>
            ) : (
              <span className="grid h-14 place-items-center rounded-[var(--radius-sm)] border border-dashed border-graphite/20 text-xs text-blueprint">No on-site phone</span>
            )}
            {map ? (
              <Button className="h-14" variant="secondary" href={map} external>
                <Navigation className="size-5" /> Directions
              </Button>
            ) : (
              <span className="grid h-14 place-items-center rounded-[var(--radius-sm)] border border-dashed border-graphite/20 text-xs text-blueprint">No location</span>
            )}
          </div>
          <Panel title="Shoot-day checklist" action={<span className="tabular text-xs text-blueprint">{done}/{DAY_STEPS.length}</span>}>
            <ul className="space-y-2">
              {DAY_STEPS.map((s) => (
                <li key={s.id}>
                  <button type="button" disabled={!canWrite} onClick={() => toggleStep(s.id)} className={cn("flex w-full items-center gap-3 rounded-[var(--radius-md)] border px-4 py-3.5 text-left", day[s.id] ? "border-ok/30 bg-ok/5" : "border-graphite/15 bg-paper")}>
                    {day[s.id] ? <CheckCircle2 className="size-6 shrink-0 text-ok" /> : <Circle className="size-6 shrink-0 text-blueprint" />}
                    <span className="min-w-0 flex-1">
                      <span className={cn("block text-[15px] font-medium", day[s.id] ? "text-blueprint line-through" : "text-graphite")}>{s.label}</span>
                      <span className="block text-[11px] text-blueprint">{day[s.id] ? `Done ${day[s.id]}` : s.when}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </Panel>
          {shots.length > 0 && (
            <Panel title="Shot list" action={<span className="tabular text-xs text-blueprint">{ticked.length}/{shots.length}</span>}>
              <ul className="space-y-1.5">
                {shots.map((line, i) => {
                  const on = ticked.includes(i);
                  return (
                    <li key={i}>
                      <button type="button" disabled={!canWrite} onClick={() => patch({ shotsDone: on ? ticked.filter((x) => x !== i) : [...ticked, i] })} className={cn("flex w-full items-center gap-3 rounded-[var(--radius-sm)] border px-3 py-2.5 text-left text-sm", on ? "border-ok/30 bg-ok/5 text-blueprint line-through" : "border-graphite/12 bg-paper text-graphite")}>
                        {on ? <CheckCircle2 className="size-5 shrink-0 text-ok" /> : <Circle className="size-5 shrink-0 text-blueprint" />}
                        {line}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </Panel>
          )}
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-6">
            <Panel title="Call sheet">
              <KV k="Date" v={longDate(shoot.date)} />
              <KV k="Crew call" v={<span className="inline-flex items-center gap-1"><Clock className="size-3.5" /> {str(shoot.callTime) || "—"}</span>} />
              <KV k="Wrap by" v={str(shoot.wrapTime) || "—"} />
              <KV k="Location" v={<span className="inline-flex items-center gap-1"><MapPin className="size-3.5" /> {str(shoot.location) || "—"}</span>} />
              <KV k="Director / lead" v={str(shoot.director) || "—"} />
              <KV k="Crew" v={<span className="inline-flex items-center gap-1"><Users className="size-3.5" /> {list(shoot.crew).join(", ") || "—"}</span>} />
              <KV k="On-site contact" v={[str(shoot.onSiteContact), str(shoot.onSitePhone)].filter(Boolean).join(" · ") || "—"} />
              <KV k="Drone" v={<Badge tone={statusTone(shoot.dronePermission === "Granted" ? "granted" : shoot.dronePermission === "Not allowed" ? "not allowed" : shoot.dronePermission === "Pending" ? "pending" : "")}>{str(shoot.dronePermission) || "Not needed"}</Badge>} />
              <KV k="Status" v={<Badge tone={statusTone(shoot.status)}>{str(shoot.status) || "tentative"}</Badge>} />
            </Panel>
            <Panel title="Shot list">{shots.length ? <ol className="list-decimal space-y-1 pl-5 text-sm text-graphite">{shots.map((l, i) => <li key={i} className={ticked.includes(i) ? "text-blueprint line-through" : ""}>{l}</li>)}</ol> : <p className="text-sm text-charcoal">No shot list yet — add one line per shot (Edit).</p>}</Panel>
            {shoot.notes ? (
              <Panel title="Notes">
                <p className="whitespace-pre-line text-sm text-graphite">{str(shoot.notes)}</p>
              </Panel>
            ) : null}
          </div>
          <aside className="space-y-6">
            <Panel title="Gear to carry">{list(shoot.gear).length ? <ul className="space-y-1 text-sm">{list(shoot.gear).map((g) => <li key={g} className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-lime" /> {g}</li>)}</ul> : <p className="text-sm text-charcoal">No gear listed. Pick from Gear &amp; Assets.</p>}</Panel>
            <Panel title="Shoot-day progress" action={<span className="tabular text-xs text-blueprint">{done}/{DAY_STEPS.length}</span>}>
              <ul className="space-y-1 text-sm">
                {DAY_STEPS.map((s) => (
                  <li key={s.id} className={cn("flex items-center gap-2", day[s.id] ? "text-blueprint line-through" : "text-graphite")}>
                    {day[s.id] ? <CheckCircle2 className="size-4 text-ok" /> : <Circle className="size-4 text-blueprint" />} {s.label}
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-[11px] text-blueprint">Tick these on the day in Shoot-day mode on a phone.{shoot.updatedAt ? ` Last change ${formatDateTime(str(shoot.updatedAt))}.` : ""}</p>
            </Panel>
          </aside>
        </div>
      )}
      {editing && <RecordDrawer name="shoots" initial={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}
