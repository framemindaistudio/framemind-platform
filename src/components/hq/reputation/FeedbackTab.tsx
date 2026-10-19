"use client";

import { Clock, MessageSquareHeart, Repeat, Star } from "lucide-react";
import type { BaseRecord } from "@/lib/hq/collections";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { CollectionManager } from "@/components/hq/CollectionManager";
import { useCollection, useLookup } from "@/components/hq/data";
import { EmptyState, Panel, StatCard } from "@/components/hq/ui";
import { isIso, shortDate } from "@/components/hq/printables/util";

interface Fb extends BaseRecord {
  respondent?: string;
  rating?: number | string;
  liked?: string;
  improve?: string;
  wouldRecommend?: boolean;
  onTime?: boolean;
  date?: string;
  projectId?: string;
  learnerId?: string;
  name?: string;
}

const RESPONDENTS = ["Client founder", "Client team", "Institution", "Learner", "Parent", "Other"];
const rating = (r: Fb) => {
  const n = Number(r.rating);
  return Number.isFinite(n) && n >= 1 && n <= 5 ? n : null;
};
const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
const fmt = (n: number | null) => (n === null ? "–" : n.toFixed(1));

function Bar({ value, max = 5, label }: { value: number | null; max?: number; label: string }) {
  return (
    <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-graphite/10" role="img" aria-label={label}>
      <div className="h-full rounded-full bg-graphite transition-[width] duration-700" style={{ width: `${value === null ? 0 : (value / max) * 100}%` }} />
    </div>
  );
}

function Analytics({ records }: { records: Fb[] }) {
  const projects = useLookup("projects");
  const learners = useLookup("learners");
  const rated = records.filter((r) => rating(r) !== null);
  const overall = avg(rated.map((r) => rating(r)!));
  const answered = records.filter((r) => typeof r.wouldRecommend === "boolean");
  const recommend = answered.length ? Math.round((answered.filter((r) => r.wouldRecommend).length / answered.length) * 100) : null;
  const timed = records.filter((r) => typeof r.onTime === "boolean");
  const onTime = timed.length ? Math.round((timed.filter((r) => r.onTime).length / timed.length) * 100) : null;

  const byType = RESPONDENTS.map((t) => {
    const xs = rated.filter((r) => r.respondent === t).map((r) => rating(r)!);
    return { type: t, n: xs.length, avg: avg(xs) };
  });
  const dist = [5, 4, 3, 2, 1].map((s) => ({ s, n: rated.filter((r) => rating(r) === s).length }));
  const maxDist = Math.max(1, ...dist.map((d) => d.n));
  const recent = [...records]
    .filter((r) => String(r.liked ?? "").trim() || String(r.improve ?? "").trim())
    .sort((a, b) => String(b.date ?? b.createdAt ?? "").localeCompare(String(a.date ?? a.createdAt ?? "")))
    .slice(0, 6);

  return (
    <div className="mb-8 space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Average rating" value={overall === null ? "–" : `${fmt(overall)} / 5`} sub={`${rated.length} rated response${rated.length === 1 ? "" : "s"}`} icon={<Star className="size-4" />} progress={overall === null ? undefined : overall / 5} />
        <StatCard label="Would recommend" value={recommend === null ? "–" : `${recommend}%`} sub={answered.length ? `${answered.length} answered` : "No answers yet"} icon={<Repeat className="size-4" />} progress={recommend === null ? undefined : recommend / 100} />
        <StatCard label="Delivered on time" value={onTime === null ? "–" : `${onTime}%`} sub={timed.length ? `${timed.length} projects rated` : "No answers yet"} icon={<Clock className="size-4" />} progress={onTime === null ? undefined : onTime / 100} />
        <StatCard label="Responses" value={records.length} sub="All respondent types" icon={<MessageSquareHeart className="size-4" />} />
      </div>

      {records.length === 0 ? (
        <EmptyState
          icon="MessageSquareHeart"
          title="No feedback recorded yet"
          description="At every project handover and coaching completion, ask the client or learner for a rating and a few words, and enter them below. Results appear here automatically."
        />
      ) : (
        <div className="grid gap-5 lg:grid-cols-3">
          <Panel title="Rating by respondent" subtitle="Average out of 5">
            <ul className="space-y-3">
              {byType.map((t) => (
                <li key={t.type} className="flex items-center gap-3 text-sm">
                  <span className="w-24 shrink-0 text-charcoal">{t.type}</span>
                  <Bar value={t.avg} label={`${t.type}: ${fmt(t.avg)} out of 5`} />
                  <span className="w-16 shrink-0 text-right font-mono text-xs tabular">
                    {fmt(t.avg)} <span className="text-blueprint">({t.n})</span>
                  </span>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title="Rating spread" subtitle="How many gave each score">
            <ul className="space-y-3">
              {dist.map((d) => (
                <li key={d.s} className="flex items-center gap-3 text-sm">
                  <span className="flex w-10 shrink-0 items-center gap-1 font-mono text-xs">
                    {d.s} <Star className="size-3" aria-hidden />
                  </span>
                  <Bar value={d.n} max={maxDist} label={`${d.n} response${d.n === 1 ? "" : "s"} gave ${d.s} stars`} />
                  <span className="w-8 shrink-0 text-right font-mono text-xs tabular">{d.n}</span>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title="Recent comments" subtitle="Latest words from clients and learners">
            {recent.length ? (
              <ul className="space-y-3">
                {recent.map((r) => (
                  <li key={r.id} className="border-b border-dashed border-graphite/15 pb-3 text-sm last:border-0 last:pb-0">
                    <p className="mb-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-blueprint">
                      <Badge tone="outline">{r.respondent || "Respondent"}</Badge>
                      {rating(r) !== null && <span className="font-mono">{rating(r)}/5</span>}
                      {isIso(r.date) && <span>{shortDate(r.date)}</span>}
                      {r.projectId && projects.get(r.projectId) && <span className="truncate">{String(projects.get(r.projectId)?.title ?? "")}</span>}
                      {r.learnerId && learners.get(r.learnerId) && <span className="truncate">{String(learners.get(r.learnerId)?.name ?? "")}</span>}
                    </p>
                    {String(r.liked ?? "").trim() && (
                      <p className="text-charcoal">
                        <span className="font-semibold text-graphite">Liked: </span>
                        {r.liked}
                      </p>
                    )}
                    {String(r.improve ?? "").trim() && (
                      <p className="mt-0.5 text-charcoal">
                        <span className="font-semibold text-graphite">To improve: </span>
                        {r.improve}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-blueprint">No written comments yet.</p>
            )}
          </Panel>
        </div>
      )}
    </div>
  );
}

export function FeedbackTab() {
  const { records } = useCollection<Fb>("feedback");
  return (
    <div>
      <p className="mb-5 rounded-[var(--radius-md)] border border-graphite/12 bg-paper-200/40 px-4 py-3 text-sm text-charcoal">
        Ask for feedback at every handover (the Handover tab of a project lists it) and at the end of each coaching programme. A short call or a message works: record what they said, not what you hoped.
      </p>

      <Analytics records={records} />

      <CollectionManager<Fb> name="feedback" newLabel="Add response" emptyText="No responses yet. Add one after a handover or a coaching completion." />
    </div>
  );
}
