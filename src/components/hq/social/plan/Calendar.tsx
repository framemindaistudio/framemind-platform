"use client";

import { useMemo, useState } from "react";
import { Check, ChevronLeft, ChevronRight, Palette, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { parseIso, toIso } from "@/components/hq/printables/util";
import { useThisMonth } from "@/components/hq/printables/hooks";
import { cn } from "@/lib/utils";
import { accountOf, CHANNELS, channelOf, dayOf, designLink, isPublished, statusLabel, statusOf, STATUS_OPTIONS, type Post } from "./posts";

const PLATFORMS: Record<string, { code: string; box: string }> = {
  Instagram: { code: "IG", box: "bg-graphite text-paper" },
  YouTube: { code: "YT", box: "bg-charcoal text-paper" },
  LinkedIn: { code: "IN", box: "bg-blueprint text-paper" },
  Facebook: { code: "FB", box: "border border-graphite text-graphite" },
  WhatsApp: { code: "WA", box: "border border-graphite text-graphite" },
  X: { code: "X", box: "border border-graphite text-graphite" },
};
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const monthKeyOf = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
const shiftMonth = (key: string, n: number) => {
  const [y, m] = key.split("-").map(Number);
  return monthKeyOf(new Date(y, m - 1 + n, 1));
};
const dayLabel = (iso: string) => parseIso(iso).toLocaleDateString("en-IN", { day: "numeric", month: "long" });

/** the ring with a founder's initial, on a post that goes out from a personal profile */
const personMark = "grid size-4 shrink-0 place-items-center rounded-full border border-graphite/50 font-mono text-[9px] font-bold leading-none";

function Chip({ post, showAccount, verb, onOpen }: { post: Post; showAccount: boolean; verb: string; onOpen: () => void }) {
  const p = PLATFORMS[String(post.platform)] ?? { code: "··", box: "border border-graphite/40 text-charcoal" };
  const status = statusOf(post);
  const published = isPublished(post);
  const designed = !!designLink(post);
  const channel = channelOf(post);
  const person = showAccount && channel?.personal ? channel : null;
  const facts = [post.platform ?? "platform not set", post.format, statusLabel(status).toLowerCase(), channel?.personal ? `${channel.label}'s profile` : "", designed ? "design saved" : ""].filter(Boolean).join(", ");
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`${verb} post: ${post.title ?? "Untitled"} (${facts})`}
      title={`${post.title ?? ""} · ${facts}`}
      className={cn(
        "flex w-full items-center gap-1.5 rounded-[3px] border bg-paper px-1 py-[3px] text-left text-[11px] leading-tight transition-colors hover:border-graphite hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-1",
        status === "idea" ? "border-dashed border-graphite/35" : "border-graphite/25",
        published && "bg-graphite/[0.06]",
      )}
    >
      <span className={cn("grid h-4 min-w-5 shrink-0 place-items-center rounded-[2px] px-0.5 font-mono text-[9px] font-bold", p.box)}>{p.code}</span>
      <span className="min-w-0 flex-1 truncate font-medium">{post.title || "Untitled"}</span>
      {person && (
        <span className={personMark} aria-hidden>
          {person.mark}
        </span>
      )}
      {published ? <Check className="size-3 shrink-0" aria-hidden /> : designed ? <Palette className="size-3 shrink-0 text-charcoal" aria-hidden /> : null}
    </button>
  );
}

/**
 * The month view of the plan. It is handed the posts already narrowed to a channel and a platform, and only draws
 * them: opening, adding and saving belong to the Plan tab around it.
 */
export function PlanCalendar({
  posts,
  today,
  canWrite,
  showAccount,
  onOpen,
  onNew,
  onShowUndated,
}: {
  posts: Post[];
  today: string;
  canWrite: boolean;
  /** mark the posts that go out from a founder's own profile (off when one channel is already picked) */
  showAccount: boolean;
  onOpen: (post: Post) => void;
  onNew: (date: string) => void;
  onShowUndated: () => void;
}) {
  const nowMonth = useThisMonth();
  const [picked, setMonth] = useState<string | null>(null);
  const month = picked ?? (nowMonth || null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const byDay = useMemo(() => {
    const map = new Map<string, Post[]>();
    for (const r of posts) {
      const k = dayOf(r);
      if (k) map.set(k, [...(map.get(k) ?? []), r]);
    }
    return map;
  }, [posts]);
  const undated = posts.filter((r) => !dayOf(r) && !isPublished(r)).length;

  const cells = useMemo(() => {
    if (!month) return [];
    const [y, m] = month.split("-").map(Number);
    const first = new Date(y, m - 1, 1);
    const offset = (first.getDay() + 6) % 7;
    const days = new Date(y, m, 0).getDate();
    const total = Math.ceil((offset + days) / 7) * 7;
    return Array.from({ length: total }, (_, i) => {
      const d = new Date(y, m - 1, 1 - offset + i);
      return { iso: toIso(d), day: d.getDate(), inMonth: d.getMonth() === m - 1, weekend: d.getDay() === 0 || d.getDay() === 6 };
    });
  }, [month]);

  const monthPosts = month ? posts.filter((r) => dayOf(r).startsWith(month)) : [];
  // in the order a post moves through: idea first, published last
  const counts = STATUS_OPTIONS.map((o) => ({ label: o.label.toLowerCase(), n: monthPosts.filter((r) => statusOf(r) === o.value).length })).filter((c) => c.n);
  const label = month ? parseIso(`${month}-01`).toLocaleDateString("en-IN", { month: "long", year: "numeric" }) : "";
  // the key only explains the founder marks while a post on screen carries one
  const people = showAccount ? CHANNELS.filter((c) => c.personal && monthPosts.some((r) => accountOf(r) === c.value)) : [];

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-2">
        <div className="flex items-center gap-1">
          <Button variant="secondary" size="sm" onClick={() => month && setMonth(shiftMonth(month, -1))} aria-label="Previous month">
            <ChevronLeft className="size-4" aria-hidden />
          </Button>
          <h2 className="min-w-40 text-center text-lg font-bold tracking-[-0.02em]" aria-live="polite">
            {label || "…"}
          </h2>
          <Button variant="secondary" size="sm" onClick={() => month && setMonth(shiftMonth(month, 1))} aria-label="Next month">
            <ChevronRight className="size-4" aria-hidden />
          </Button>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setMonth(monthKeyOf(new Date()))}>
          Today
        </Button>
        <p className="text-xs text-charcoal sm:ml-auto" aria-live="polite">
          {monthPosts.length ? (
            <>
              <strong>{monthPosts.length}</strong> post{monthPosts.length === 1 ? "" : "s"} this month: {counts.map((c) => `${c.n} ${c.label}`).join(", ")}
            </>
          ) : (
            "Nothing planned this month."
          )}
          {undated > 0 && (
            <>
              {" · "}
              <button type="button" onClick={onShowUndated} className="font-semibold text-graphite underline underline-offset-2">
                {undated} without a date
              </button>
            </>
          )}
        </p>
      </div>

      <div className="hq-scroll overflow-x-auto rounded-[var(--radius-md)] border border-graphite/15 bg-paper-50" data-lenis-prevent>
        <div className="min-w-[760px]">
          <div className="grid grid-cols-7 border-b border-graphite/15 bg-graphite/[0.04]" aria-hidden>
            {WEEKDAYS.map((d) => (
              <div key={d} className="annot px-2 py-2 text-[10px] text-blueprint">
                {d}
              </div>
            ))}
          </div>
          {month ? (
            <ol className="grid grid-cols-7">
              {cells.map((c) => {
                const dayPosts = byDay.get(c.iso) ?? [];
                const open = expanded === c.iso;
                const shown = open ? dayPosts : dayPosts.slice(0, 3);
                const isToday = c.iso === today;
                return (
                  <li
                    key={c.iso}
                    aria-label={`${dayLabel(c.iso)}${isToday ? " (today)" : ""}: ${dayPosts.length} post${dayPosts.length === 1 ? "" : "s"}`}
                    className={cn("group relative min-h-[112px] border-b border-r border-graphite/10 p-1.5 [&:nth-child(7n)]:border-r-0", !c.inMonth && "bg-graphite/[0.035]", c.inMonth && c.weekend && "bg-paper-200/30")}
                  >
                    <div className="mb-1 flex items-center justify-between">
                      <span className={cn("grid size-5 place-items-center rounded-full font-mono text-[10px] font-semibold tabular", isToday ? "bg-graphite text-paper" : c.inMonth ? "text-charcoal" : "text-blueprint/60")}>{c.day}</span>
                      {canWrite && (
                        <button
                          type="button"
                          onClick={() => onNew(c.iso)}
                          aria-label={`Add a post on ${dayLabel(c.iso)}`}
                          className="grid size-5 place-items-center rounded text-blueprint opacity-0 transition-opacity hover:bg-graphite/10 hover:text-graphite focus-visible:opacity-100 group-hover:opacity-100"
                        >
                          <Plus className="size-3.5" aria-hidden />
                        </button>
                      )}
                    </div>
                    <div className="space-y-1">
                      {shown.map((p) => (
                        <Chip key={p.id} post={p} showAccount={showAccount} verb={canWrite ? "Edit" : "View"} onOpen={() => onOpen(p)} />
                      ))}
                      {dayPosts.length > 3 && (
                        <button type="button" onClick={() => setExpanded(open ? null : c.iso)} aria-expanded={open} className="w-full rounded px-1 text-left text-[10px] font-semibold text-blueprint hover:text-graphite">
                          {open ? "Show fewer" : `+${dayPosts.length - 3} more`}
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          ) : (
            <div className="h-96" />
          )}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-charcoal">
        {Object.entries(PLATFORMS).map(([name, p]) => (
          <span key={name} className="inline-flex items-center gap-1.5">
            <span className={cn("grid h-4 min-w-5 place-items-center rounded-[2px] px-0.5 font-mono text-[9px] font-bold", p.box)}>{p.code}</span>
            {name}
          </span>
        ))}
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3.5 w-6 rounded-[3px] border border-dashed border-graphite/40" aria-hidden /> Idea
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3.5 w-6 rounded-[3px] border border-graphite/30" aria-hidden /> In progress / scheduled
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Palette className="size-3.5" aria-hidden /> Design saved
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Check className="size-3.5" aria-hidden /> Published
        </span>
        {people.map((c) => (
          <span key={c.value} className="inline-flex items-center gap-1.5">
            <span className={personMark} aria-hidden>
              {c.mark}
            </span>
            {c.label}&apos;s profile
          </span>
        ))}
      </div>
    </div>
  );
}
