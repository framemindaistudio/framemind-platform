"use client";

import { useCallback, useMemo, useState } from "react";
import { CalendarDays, List, Plus } from "lucide-react";
import { getCollection } from "@/lib/hq/collections";
import { canEdit } from "@/lib/hq/roles";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/form";
import { CollectionManager, type ExtraColumn } from "@/components/hq/CollectionManager";
import { useCollection, useHq } from "@/components/hq/data";
import { RecordDrawer, blankRecord } from "@/components/hq/RecordDrawer";
import { useThisMonth, useToday } from "@/components/hq/printables/hooks";
import { EmptyState, Loading } from "@/components/hq/ui";
import { cn } from "@/lib/utils";
import { PlanCalendar } from "./plan/Calendar";
import { CopyCaption, OpenDesign, PostShortcuts } from "./plan/PostActions";
import { accountOf, CHANNELS, channelLabel, dayOf, daySpan, HOUSE, inFocus, isPublished, monthName, ownerFor, PLAN, PLATFORM_OPTIONS, weekOf, type Focus, type Post } from "./plan/posts";

type View = "month" | "list";

/**
 * What each weekday is for on the studio's own channels: the weekly rhythm of the content strategy
 * (OPERATIONS/08_SOCIAL_MEDIA). A guide printed under the month, not a rule the plan enforces.
 */
const RHYTHM = [
  ["Mon", "LinkedIn founder post"],
  ["Tue", "reel"],
  ["Wed", "AI tip carousel"],
  ["Thu", "reel and stories"],
  ["Fri", "client work or case study"],
  ["Sat", "YouTube Short"],
  ["Sun", "plan and schedule the week"],
];

/** The pillar and the owner are in the post itself: the list keeps its room for the title. */
const LIST_COLUMNS = ["date", "platform", "format", "title", "status"];

/** A row of choices where one is always on. Each button says whether it is the chosen one. */
function Choice<T extends string>({ label, value, onChange, options }: { label: string; value: T; onChange: (v: T) => void; options: { value: T; label: string; count?: number; icon?: React.ReactNode }[] }) {
  return (
    <div role="group" aria-label={label} className="inline-flex flex-wrap gap-1 rounded-[var(--radius-sm)] border border-graphite/15 bg-paper-50 p-1">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(o.value)}
            className={cn("inline-flex h-8 items-center gap-1.5 rounded-[5px] px-3 text-xs font-semibold transition-colors", on ? "bg-graphite text-paper" : "text-charcoal hover:bg-graphite/[0.07] hover:text-graphite")}
          >
            {o.icon}
            {o.label}
            {o.count !== undefined && <span className={cn("tabular rounded-full px-1.5 text-[10px]", on ? "bg-paper/20" : "bg-graphite/10")}>{o.count}</span>}
          </button>
        );
      })}
    </div>
  );
}

/** One count of the summary row. With something to show, pressing it narrows the list to exactly those posts. */
function Tile({ label, value, sub, active, onToggle }: { label: string; value: React.ReactNode; sub: string; active: boolean; onToggle?: () => void }) {
  const body = (
    <>
      <span className={cn("annot block", active ? "text-paper/60" : "text-blueprint")}>{label}</span>
      <span className="tabular mt-2 block text-2xl font-bold leading-none tracking-tight">{value}</span>
      <span className={cn("mt-1.5 block text-xs", active ? "text-paper/75" : "text-charcoal")}>{active ? "Shown below. Press again to clear." : sub}</span>
    </>
  );
  // a column from the top, so a taller neighbour never pushes the number to the middle
  const box = "flex flex-col justify-start rounded-[var(--radius-md)] border p-4 text-left";
  if (!onToggle) return <div className={cn(box, "border-graphite/12 bg-paper-50")}>{body}</div>;
  return (
    <button type="button" aria-pressed={active} onClick={onToggle} className={cn(box, "transition-colors", active ? "border-graphite bg-graphite text-paper" : "border-graphite/12 bg-paper-50 hover:border-graphite/45")}>
      {body}
    </button>
  );
}

/**
 * The content plan: every post for FrameMind and for each founder, by month or as a list. A design made in Create arrives
 * here through "Add to plan" and can be opened again from its post. Client deliverables are not here: Production.
 */
export function Plan() {
  const { records, loading, error } = useCollection<Post>(PLAN);
  const { user, store } = useHq();
  const canWrite = canEdit(user, getCollection(PLAN)?.write) && store.writable;
  const today = useToday();
  const month = useThisMonth();

  const [channel, setChannel] = useState("");
  const [platform, setPlatform] = useState("");
  const [view, setView] = useState<View>("month");
  const [focus, setFocus] = useState<Focus | null>(null);
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);

  const onPlatform = useMemo(() => records.filter((r) => !platform || r.platform === platform), [records, platform]);
  const scoped = useMemo(() => onPlatform.filter((r) => !channel || accountOf(r) === channel), [onPlatform, channel]);
  const count = (f: Focus) => scoped.filter((r) => inFocus(r, f, today, month)).length;

  const week = weekOf(today);
  const weekPosts = scoped.filter((r) => inFocus(r, "week", today, month));
  const weekDone = weekPosts.filter(isPublished).length;
  const plannedThisMonth = month ? scoped.filter((r) => dayOf(r).startsWith(month)).length : 0;
  const tiles: { focus: Focus; label: string; n: number; sub: string }[] = [
    { focus: "week", label: "This week", n: weekPosts.length, sub: week ? `${daySpan(week.start, week.end)}${weekDone ? ` · ${weekDone} published` : ""}` : "" },
    { focus: "undated", label: "Ideas without a date", n: count("undated"), sub: count("undated") ? "Waiting for a day" : "Every post has a day" },
    { focus: "designed", label: "Designed, not scheduled", n: count("designed"), sub: count("designed") ? "Ready to schedule or post" : "Nothing waiting" },
    { focus: "published", label: "Published this month", n: count("published"), sub: month ? (plannedThisMonth ? `of ${plannedThisMonth} planned in ${monthName(month)}` : `Nothing planned in ${monthName(month)}`) : "" },
  ];
  const focusText: Record<Focus, string> = {
    week: week ? `this week's posts (${daySpan(week.start, week.end)})` : "this week's posts",
    undated: "posts without a date",
    designed: "posts that are designed but not yet scheduled",
    published: month ? `posts published in ${monthName(month)}` : "posts published this month",
  };

  const pickView = (v: View) => {
    setView(v);
    if (v === "month") setFocus(null); // the month cannot show a narrowed set (and never the posts without a date)
  };
  const toggleFocus = (f: Focus) => {
    setFocus(focus === f ? null : f);
    if (focus !== f) setView("list");
  };

  // a post saved before there were personal channels opens with "FrameMind" filled in, not with an empty choice
  const openPost = (p: Post) => setEditing({ ...p, account: accountOf(p) });
  const newPost = (date?: string) => {
    const account = channel || HOUSE;
    // a first guess the person can change: Instagram is the studio's main showcase, LinkedIn is where the founders write
    const guess = account === HOUSE ? "Instagram" : "LinkedIn";
    setEditing(blankRecord(PLAN, { account, platform: platform || guess, date: date ?? (focus === "undated" ? undefined : today || undefined), owner: ownerFor(account) }));
  };

  const listFilter = useCallback((r: Post) => (!channel || accountOf(r) === channel) && (!platform || r.platform === platform) && (!focus || inFocus(r, focus, today, month)), [channel, platform, focus, today, month]);
  const listed = focus ? scoped.filter((r) => inFocus(r, focus, today, month)) : scoped;
  // posts saved before there were personal channels have no account: the column still says FrameMind
  const accountColumn = useMemo<ExtraColumn<Post>[]>(() => [{ key: "account", label: "Posted from", render: (r) => channelLabel(accountOf(r)), sortValue: (r) => channelLabel(accountOf(r)).toLowerCase() }], []);
  const rowActions = useCallback(
    (r: Post) => (
      <span className="flex items-center justify-end gap-1">
        <OpenDesign post={r} compact />
        <CopyCaption post={r} compact />
      </span>
    ),
    [],
  );

  if (loading) return <Loading />;

  const drawer = <RecordDrawer name={PLAN} initial={editing} onClose={() => setEditing(null)} extra={(r) => (r.id ? <PostShortcuts post={r} canWrite={canWrite} /> : null)} />;
  const newButton = canWrite && (
    <Button size="sm" onClick={() => newPost()}>
      <Plus className="size-4" aria-hidden /> New post
    </Button>
  );
  const problem = error && (
    <p role="alert" className="mb-3 rounded border border-bad/30 bg-bad/10 px-3 py-2 text-sm text-bad">
      {error}
    </p>
  );

  if (!records.length) {
    return (
      <div>
        {problem}
        <EmptyState
          icon="CalendarHeart"
          title="Nothing planned yet"
          description={
            canWrite
              ? "The plan is the calendar of every post for FrameMind and for each founder. Make a design in Create and choose Add to plan, or add a post here."
              : "The plan is the calendar of every post for FrameMind and for each founder. Posts appear here when a founder adds them."
          }
          action={
            <div className="flex flex-wrap items-center justify-center gap-2">
              {newButton}
              <Button variant="secondary" size="sm" href="/hq/social?tab=create">
                Open Create
              </Button>
            </div>
          }
        />
        {drawer}
      </div>
    );
  }

  const scopeName = [channel ? channelLabel(channel) : "", platform].filter(Boolean).join(" on ");

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end gap-x-4 gap-y-3">
        <div>
          <p className="annot mb-1.5 text-charcoal" aria-hidden>
            Posted from
          </p>
          <Choice
            label="Posted from"
            value={channel}
            onChange={setChannel}
            options={[{ value: "", label: "All", count: onPlatform.length }, ...CHANNELS.map((c) => ({ value: c.value, label: c.label, count: onPlatform.filter((r) => accountOf(r) === c.value).length }))]}
          />
        </div>
        <div className="w-44">
          <label htmlFor="plan-platform" className="annot mb-1.5 block text-charcoal">
            Platform
          </label>
          <Select id="plan-platform" value={platform} onChange={(e) => setPlatform(e.target.value)}>
            <option value="">All platforms</option>
            {PLATFORM_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Choice
            label="View"
            value={view}
            onChange={pickView}
            options={[
              { value: "month", label: "Month", icon: <CalendarDays className="size-3.5" aria-hidden /> },
              { value: "list", label: "List", icon: <List className="size-3.5" aria-hidden /> },
            ]}
          />
          {newButton}
        </div>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tiles.map((t) => (
          <Tile key={t.focus} label={t.label} value={today ? t.n : "…"} sub={t.sub} active={focus === t.focus} onToggle={t.n > 0 || focus === t.focus ? () => toggleFocus(t.focus) : undefined} />
        ))}
      </div>

      {problem}

      {view === "month" ? (
        <>
          <PlanCalendar posts={scoped} today={today} canWrite={canWrite} showAccount={!channel} onOpen={openPost} onNew={newPost} onShowUndated={() => toggleFocus("undated")} />
          {(!channel || channel === HOUSE) && (
            <p className="mt-4 border-t border-graphite/10 pt-3 text-xs leading-relaxed text-charcoal">
              <span className="annot mr-2 text-blueprint">A weekly rhythm to plan by</span>
              {RHYTHM.map(([day, what], i) => (
                <span key={day}>
                  {i > 0 && " · "}
                  <strong className="font-semibold text-graphite">{day}</strong> {what}
                </span>
              ))}
            </p>
          )}
        </>
      ) : (
        <div>
          {focus && (
            <p className="mb-3 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-[var(--radius-sm)] border border-graphite/15 bg-paper-200/40 px-3 py-2 text-sm text-charcoal" role="status">
              <span>
                Showing <strong className="text-graphite">{focusText[focus]}</strong>
                {scopeName ? ` for ${scopeName}` : ""}.
              </span>
              <button type="button" onClick={() => setFocus(null)} className="font-semibold text-graphite underline underline-offset-2">
                Show everything
              </button>
            </p>
          )}
          {listed.length ? (
            // a new narrowing starts with a clean search and status filter, so nothing is hidden twice
            <CollectionManager<Post> key={focus ?? "all"} name={PLAN} columns={LIST_COLUMNS} extraColumns={accountColumn} filter={listFilter} rowActions={rowActions} onOpen={openPost} hideNew />
          ) : (
            <EmptyState
              icon="CalendarHeart"
              title={scopeName ? `Nothing planned for ${scopeName} yet` : "Nothing to show"}
              description={canWrite ? "Add a post here, or make a design in Create and choose Add to plan." : "Posts appear here when a founder adds them."}
              action={newButton || undefined}
            />
          )}
        </div>
      )}

      {drawer}
    </div>
  );
}
