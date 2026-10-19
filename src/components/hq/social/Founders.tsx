"use client";

import { useState } from "react";
import { CalendarPlus, CalendarRange, Check, PenLine } from "lucide-react";
import { getCollection } from "@/lib/hq/collections";
import { canEdit } from "@/lib/hq/roles";
import { site } from "@/lib/site";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useCollection, useHq } from "@/components/hq/data";
import { Panel } from "@/components/hq/ui";
import { FOUNDER_ORDER, FOUNDER_PLANS, type FounderId, type FounderPlan, type Prompt } from "@/lib/social/founders";
import { cn, pad2 } from "@/lib/utils";
import { designHref } from "./create/kit";
import { Bullets } from "./parts/bits";
import { CopyButton } from "./parts/CopyButton";

const person = (id: FounderId) => site.founders.find((f) => f.id === id) ?? site.founders[0];
const firstName = (id: FounderId) => person(id).name.split(" ")[0];

/** A prompt opened in Create as the founder-note design: the line (without its dots) as the headline, the rest left to write. */
const designLink = (plan: FounderPlan, p: Prompt) => designHref({ t: "founder-note", v: { who: plan.id, headline: p.text.replace(/:?\s*(\.\.\.|…)$/, ""), lines: "" } });

/**
 * Social Studio → Founders: the personal-brand plan for each founder's own profile. What the profile is for, the
 * pillars, the week, lines to start a post from and what never to post. The studio's own channels are in the Plan tab.
 */
export function Founders({ onOpenPlan }: { onOpenPlan: () => void }) {
  const { user, store } = useHq();
  const posts = useCollection("contentCalendar");
  const mayPlan = canEdit(user, getCollection("contentCalendar")?.write) && store.writable;

  // a founder who is signed in starts on their own plan
  const [who, setWho] = useState<FounderId>(() => FOUNDER_ORDER.find((id) => user.name.toLowerCase().includes(firstName(id).toLowerCase())) ?? FOUNDER_ORDER[0]);
  const [pillar, setPillar] = useState("all");
  const [busy, setBusy] = useState("");
  const [added, setAdded] = useState("");
  const [failed, setFailed] = useState<{ at: string; text: string } | null>(null);

  const plan = FOUNDER_PLANS[who];
  const founder = person(who);
  const headline = plan.headline;

  const counts = (account: string) => {
    const mine = posts.records.filter((p) => String(p.account ?? "") === account);
    const ideas = mine.filter((p) => String(p.status || "idea") === "idea").length;
    return { ideas, posts: mine.length - ideas, published: mine.filter((p) => String(p.status ?? "") === "published").length };
  };
  const inPlan = (text: string) => posts.records.some((p) => String(p.account ?? "") === plan.account && String(p.title ?? "").trim() === text);

  async function addIdea(p: Prompt) {
    setBusy(p.text);
    setFailed(null);
    try {
      await posts.save({ account: plan.account, platform: "LinkedIn", pillar: "Founder story", status: "idea", title: p.text });
      setAdded(p.text);
    } catch (e) {
      setFailed({ at: p.text, text: e instanceof Error ? e.message : "That did not save. Try again." });
    } finally {
      setBusy("");
    }
  }

  const shownPillars = plan.pillars.filter((pl) => pillar === "all" || pl.id === pillar);

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-2xl text-sm text-charcoal">
          A plan for each founder&apos;s own profile: what it is for, what to post and when, and lines to start from. The studio&apos;s own channels are planned in the Plan tab.
        </p>
        <Button type="button" variant="secondary" size="sm" className="shrink-0 self-start sm:self-auto" onClick={onOpenPlan}>
          <CalendarRange className="size-3.5" aria-hidden /> Open the plan
        </Button>
      </div>

      {/* ── whose plan ── */}
      <div role="radiogroup" aria-label="Whose plan" className="mb-6 grid gap-3 md:grid-cols-2">
        {FOUNDER_ORDER.map((id) => {
          const f = person(id);
          const on = id === who;
          const c = counts(FOUNDER_PLANS[id].account);
          return (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => {
                setWho(id);
                setPillar("all");
                setAdded("");
                setFailed(null);
              }}
              className={cn(
                "flex items-center gap-4 rounded-[var(--radius-md)] border p-4 text-left transition-colors",
                on ? "border-graphite bg-graphite text-paper" : "border-graphite/15 bg-paper-50 text-graphite hover:border-graphite/45",
              )}
            >
              <span className={cn("grid size-12 shrink-0 place-items-center rounded-full border font-mono text-sm font-semibold", on ? "border-paper/40 bg-paper/10" : "border-graphite/25 bg-paper")}>{f.initials}</span>
              <span className="min-w-0">
                <span className="block truncate text-base font-bold">{f.name}</span>
                <span className={cn("block text-xs", on ? "text-paper/80" : "text-charcoal")}>{f.role}</span>
                <span className={cn("annot mt-2 block text-[10px]", on ? "text-paper/70" : "text-blueprint")}>
                  {posts.loading ? "Reading the plan…" : `In the plan: ${c.ideas} ${c.ideas === 1 ? "idea" : "ideas"} · ${c.posts} ${c.posts === 1 ? "post" : "posts"}${c.published ? ` · ${c.published} published` : ""}`}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="space-y-5">
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
          <Panel title="What this profile is for" subtitle={`${firstName(who)}'s own profile, not the FrameMind page.`}>
            <p className="text-sm leading-relaxed text-graphite">{plan.purpose}</p>

            <p className="annot mb-2 mt-5 text-[10px] text-blueprint">Who reads it</p>
            <dl className="divide-y divide-dashed divide-graphite/12">
              {plan.readers.map((r) => (
                <div key={r.who} className="grid gap-x-4 gap-y-0.5 py-2 text-sm first:pt-0 last:pb-0 sm:grid-cols-[minmax(0,13rem)_minmax(0,1fr)]">
                  <dt className="font-semibold text-graphite">{r.who}</dt>
                  <dd className="text-charcoal">{r.wants}</dd>
                </div>
              ))}
            </dl>

            <p className="annot mb-2 mt-5 text-[10px] text-blueprint">How it sounds</p>
            <Bullets items={plan.voice} />

            <p className="annot mb-2 mt-5 text-[10px] text-blueprint">Headline for the profile</p>
            <div className="flex flex-wrap items-center gap-3 rounded-[var(--radius-sm)] border border-graphite/12 bg-paper px-3.5 py-2.5">
              <p className="min-w-0 flex-1 basis-56 text-sm font-medium text-graphite">{headline}</p>
              <CopyButton text={headline} what="the profile headline" />
            </div>
          </Panel>

          <Panel title="The week" subtitle="A rhythm to start with. Adjust it after the first month.">
            <table className="w-full text-left text-sm">
              <thead className="sr-only">
                <tr>
                  <th scope="col">Day</th>
                  <th scope="col">Where</th>
                  <th scope="col">What</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dashed divide-graphite/12">
                {plan.rhythm.map((s) => (
                  <tr key={`${s.day}-${s.where}`}>
                    <th scope="row" className="w-16 py-2.5 pr-3 align-top font-mono text-xs font-medium uppercase tracking-widest text-graphite">
                      {s.day}
                    </th>
                    <td className="w-24 py-2.5 pr-3 align-top text-xs font-semibold text-graphite">{s.where}</td>
                    <td className="py-2.5 align-top leading-relaxed text-charcoal">{s.what}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-4 border-l-2 border-graphite/25 pl-3 text-xs leading-relaxed text-charcoal">{plan.rhythmNote}</p>
            <p className="mt-3 border-l-2 border-graphite/25 pl-3 text-xs leading-relaxed text-charcoal">If a planned launch slips, post from another pillar that week. Never fill a gap with something that did not happen.</p>
          </Panel>
        </div>

        <Panel title="Content pillars" subtitle="The subjects this profile keeps coming back to.">
          <ol className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
            {plan.pillars.map((pl, i) => (
              <li key={pl.id} className="rounded-[var(--radius-sm)] border border-graphite/12 bg-paper p-4">
                <p className="font-mono text-xs tracking-widest text-blueprint">{pad2(i + 1)}</p>
                <h3 className="mt-1 text-sm font-bold text-graphite">{pl.name}</h3>
                <p className="mt-1 text-xs leading-relaxed text-charcoal">{pl.about}</p>
                <p className="annot mb-1.5 mt-3 text-[10px] text-blueprint">Post under it</p>
                <Bullets items={pl.posts} className="text-xs" />
              </li>
            ))}
          </ol>
        </Panel>

        <Panel title="Post prompts" subtitle={`${plan.prompts.length} lines to start a post from. Finish the sentence in your own words.`}>
          <div role="radiogroup" aria-label="Show prompts for" className="mb-4 flex flex-wrap gap-2">
            {[{ id: "all", name: "All", n: plan.prompts.length }, ...plan.pillars.map((pl) => ({ id: pl.id, name: pl.name, n: plan.prompts.filter((p) => p.pillar === pl.id).length }))].map((o) => (
              <button
                key={o.id}
                type="button"
                role="radio"
                aria-checked={pillar === o.id}
                onClick={() => setPillar(o.id)}
                className={cn(
                  "rounded-[var(--radius-sm)] border px-3 py-1.5 text-xs font-semibold transition-colors",
                  pillar === o.id ? "border-graphite bg-graphite text-paper" : "border-graphite/20 text-graphite hover:border-graphite/50",
                )}
              >
                {o.name} <span className={cn("ml-1 font-mono font-medium", pillar === o.id ? "text-paper/70" : "text-blueprint")}>{o.n}</span>
              </button>
            ))}
          </div>

          <div className="space-y-6">
            {shownPillars.map((pl) => (
              <section key={pl.id} aria-label={pl.name}>
                <h3 className="annot border-b border-graphite/10 pb-2 text-[10px] text-blueprint">{pl.name}</h3>
                <ul className="divide-y divide-dashed divide-graphite/12">
                  {plan.prompts
                    .filter((p) => p.pillar === pl.id)
                    .map((p) => {
                      const there = inPlan(p.text);
                      return (
                        <li key={p.text} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
                          <div className="min-w-0 flex-1 basis-72">
                            <p className="text-sm font-semibold text-graphite">{p.text}</p>
                            {p.after && (
                              <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-charcoal">
                                <Badge tone="warn">Not yet</Badge> {p.after}
                              </p>
                            )}
                            {p.tip && <p className="mt-1 text-xs text-charcoal">{p.tip}</p>}
                            {added === p.text && (
                              <p role="status" className="mt-1 text-xs text-ok">
                                Added to the plan as an idea for {firstName(who)}.{" "}
                                <button type="button" onClick={onOpenPlan} className="font-semibold underline underline-offset-2">
                                  Open the plan
                                </button>
                              </p>
                            )}
                            {failed?.at === p.text && (
                              <p role="alert" className="mt-1 text-xs text-bad">
                                {failed.text}
                              </p>
                            )}
                          </div>
                          <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                            {/* a link: the name of the prompt is added for screen readers, so 22 links do not all read the same */}
                            <Button href={designLink(plan, p)} variant="secondary" size="sm">
                              <PenLine className="size-3.5" aria-hidden /> Design it<span className="sr-only">: {p.text}</span>
                            </Button>
                            {there ? (
                              <span className="inline-flex h-8 items-center gap-1.5 px-3 text-xs font-semibold text-charcoal">
                                <Check className="size-3.5" aria-hidden /> In the plan
                              </span>
                            ) : (
                              mayPlan && (
                                <Button type="button" variant="ghost" size="sm" disabled={!!busy} onClick={() => addIdea(p)} aria-label={`Add idea to plan: ${p.text}`}>
                                  <CalendarPlus className="size-3.5" aria-hidden /> {busy === p.text ? "Saving…" : "Add idea to plan"}
                                </Button>
                              )
                            )}
                          </div>
                        </li>
                      );
                    })}
                </ul>
              </section>
            ))}
          </div>
        </Panel>

        <Panel title="What not to post" subtitle="On this profile, or anywhere with the FrameMind name on it.">
          <Bullets items={plan.avoid} className="grid gap-x-8 gap-y-1.5 space-y-0 md:grid-cols-2" />
        </Panel>
      </div>
    </div>
  );
}
