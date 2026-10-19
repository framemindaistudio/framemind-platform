"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Camera, Clock, MapPin, Plus, Users } from "lucide-react";
import { getCollection } from "@/lib/hq/collections";
import { can } from "@/lib/hq/roles";
import { Badge, statusTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { CollectionManager } from "@/components/hq/CollectionManager";
import { useCollection, useHq } from "@/components/hq/data";
import { RecordDrawer, blankRecord } from "@/components/hq/RecordDrawer";
import { EmptyState, Loading, PageHeader, StatCard } from "@/components/hq/ui";
import { Segmented } from "@/components/hq/sales/bits";
import { useToday } from "@/components/hq/sales/useToday";
import { daysBetween, list, longDate, str } from "@/components/hq/projects/logic";

const def = getCollection("shoots")!;

/** Shoots: every photo and video shoot day, with a call sheet and a phone-friendly shoot-day mode. */
export function ShootsHome() {
  const router = useRouter();
  const params = useSearchParams();
  const today = useToday();
  const { user, store } = useHq();
  const { records, loading } = useCollection("shoots");
  const { records: projects } = useCollection("projects");
  const canWrite = can(user, def.write) && store.writable;
  const [view, setView] = useState<"upcoming" | "all">("upcoming");
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const projectName = useMemo(() => new Map(projects.map((p) => [p.id, str(p.title)])), [projects]);

  useEffect(() => {
    if (params.get("new") && canWrite) {
      const projectId = params.get("project") ?? "";
      const p = projects.find((x) => x.id === projectId);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEditing(blankRecord("shoots", { projectId: projectId || undefined, title: p ? `${str(p.title)} — shoot` : "", director: user.name, crew: [user.name] }));
      router.replace("/hq/shoots", { scroll: false });
    }
  }, [params, canWrite, projects, router, user.name]);

  const upcoming = useMemo(() => records.filter((s) => today && str(s.date) >= today && !["cancelled", "shot"].includes(str(s.status))).sort((a, b) => str(a.date).localeCompare(str(b.date))), [records, today]);
  const thisMonth = records.filter((s) => today && str(s.date).startsWith(today.slice(0, 7)) && str(s.status) !== "cancelled").length;
  const unbacked = records.filter((s) => s.status === "shot" && s.backupDone !== true).length;
  const permissions = upcoming.filter((s) => s.dronePermission === "Pending" || (s.releasesCollected !== true && /photo|video|interview/i.test(str(s.kind)))).length;

  return (
    <div>
      <PageHeader
        eyebrow="Delivery"
        icon="Camera"
        title="Shoots"
        description="Every shoot day — call time, crew, gear, location and permissions — with a printable call sheet and a shoot-day mode for the phone."
        actions={
          <>
            <Segmented label="View" value={view} onChange={setView} options={[{ value: "upcoming", label: "Upcoming" }, { value: "all", label: "All shoots" }]} />
            {canWrite && (
              <Button size="sm" className="h-9" onClick={() => setEditing(blankRecord("shoots", { director: user.name, crew: [user.name] }))}>
                <Plus className="size-4" /> Plan a shoot
              </Button>
            )}
          </>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard tone="dark" label="Coming up" value={upcoming.length} sub={upcoming[0] ? `Next: ${longDate(upcoming[0].date)}` : "Nothing scheduled"} />
        <StatCard label="This month" value={thisMonth} sub="Shoot days, not cancelled" />
        <StatCard label="Permissions to chase" value={permissions} sub="Drone permission or releases" />
        <StatCard label="Not backed up" value={unbacked} sub={unbacked ? <span className="font-semibold text-bad">Back up footage twice</span> : "Every shot day is backed up"} />
      </div>

      {loading ? (
        <Loading />
      ) : view === "upcoming" ? (
        upcoming.length === 0 ? (
          <EmptyState icon="Camera" title="No shoots coming up" description="Plan a shoot from a photo or video project, or here." />
        ) : (
          <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {upcoming.map((s) => {
              const d = today ? daysBetween(today, str(s.date)) : 0;
              return (
                <li key={s.id}>
                  <Link href={`/hq/shoots/${s.id}`} className="block h-full rounded-[var(--radius-md)] border border-graphite/12 bg-paper-50 p-4 transition-colors hover:border-graphite">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="annot text-violet">{d === 0 ? "Today" : d === 1 ? "Tomorrow" : `In ${d} days`}</p>
                        <p className="mt-1 truncate font-semibold text-graphite">{str(s.title)}</p>
                        <p className="truncate text-xs text-blueprint">{projectName.get(str(s.projectId)) || "No project"}</p>
                      </div>
                      <Badge tone={statusTone(s.status)}>{str(s.status) || "tentative"}</Badge>
                    </div>
                    <dl className="mt-3 space-y-1.5 text-xs text-charcoal">
                      <div className="flex items-center gap-2">
                        <Clock className="size-3.5 text-blueprint" /> {longDate(s.date)} · call {str(s.callTime) || "—"}
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="size-3.5 text-blueprint" /> <span className="truncate">{str(s.location) || "Location not set"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="size-3.5 text-blueprint" /> <span className="truncate">{list(s.crew).join(", ") || "Crew not set"}</span>
                      </div>
                    </dl>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      <Badge tone="outline">
                        <Camera className="size-3" /> {str(s.kind) || "Shoot"}
                      </Badge>
                      {s.dronePermission === "Pending" && <Badge tone="warn">Drone permission pending</Badge>}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )
      ) : (
        <CollectionManager name="shoots" columns={["date", "title", "projectId", "kind", "status", "location"]} hideNew onOpen={(r) => router.push(`/hq/shoots/${r.id}`)} emptyText="No shoots yet." />
      )}

      {editing && <RecordDrawer name="shoots" initial={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}
