"use client";

import { Check } from "lucide-react";
import { useRates, useSettings } from "@/components/hq/data";
import { Loading } from "@/components/hq/ui";
import { TERMS, type Service, type ServiceGroup, type ServiceOption } from "@/lib/content/catalog";
import { formatINR } from "@/lib/utils";
import { BackCover, BookletShell, C, Cover, H2, Hi, Inside, Kicker, type BookletMode } from "./Booklet";

/**
 * The pricing booklet: every service, ready package, option and discount, read from the live Rate Card (HQ → Rate
 * Card), so it always matches the website and the quote builder.
 */

const priceOf = (o: ServiceOption, monthly: boolean, addOn: boolean) =>
  o.price ? `${addOn ? "+" : ""}${formatINR(o.price)}${o.unit ?? ""}${monthly ? "/mo" : ""}` : o.base ? "On quote" : "Included";

/** A priced line: name and detail on the left, the price on the right. */
function Row({ o, monthly, addOn, dark }: { o: ServiceOption; monthly: boolean; addOn: boolean; dark?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-[4mm] border-b py-[1.7mm]" style={{ borderColor: dark ? C.lineDark : C.line, breakInside: "avoid" }}>
      <div className="min-w-0">
        <p className="text-[9.5pt] font-semibold leading-tight">
          {o.label}
          {o.badge && (
            <span className="ml-[1.5mm] rounded-full px-[1.6mm] py-[0.2mm] align-middle font-mono text-[6.5pt] font-bold uppercase tracking-[0.1em]" style={{ background: C.lime, color: C.ink }}>
              {o.badge}
            </span>
          )}
        </p>
        {o.detail && <p className="mt-[0.6mm] text-[7.8pt] leading-[1.35]" style={{ opacity: 0.6 }}>{o.detail}</p>}
      </div>
      <p className="shrink-0 whitespace-nowrap text-right font-mono text-[9.5pt] font-bold leading-tight">{priceOf(o, monthly, addOn)}</p>
    </div>
  );
}

function GroupBlock({ g, monthly, dark }: { g: ServiceGroup; monthly: boolean; dark?: boolean }) {
  return (
    <section className="mb-[5mm]" style={{ breakInside: "avoid" }}>
      <h3 className="text-[11.5pt] font-semibold tracking-[-0.01em]">{g.title}</h3>
      {g.help && <p className="mt-[0.6mm] text-[8pt] leading-[1.4]" style={{ opacity: 0.55 }}>{g.help}</p>}
      <div className="mt-[1.4mm]">
        {g.options.map((o) => (
          <Row key={o.id} o={o} monthly={monthly} addOn={g.mode === "any"} dark={dark} />
        ))}
      </div>
      {g.note && <p className="mt-[1.2mm] text-[7.8pt] italic" style={{ opacity: 0.55 }}>{g.note}</p>}
    </section>
  );
}

/** A ready package (or a software total) as a card. */
function PackCard({ o, monthly, dark }: { o: ServiceOption; monthly: boolean; dark?: boolean }) {
  const accent = !!o.badge;
  return (
    <div className="relative flex flex-col rounded-[2.5mm] border p-[4mm]" style={{ borderColor: accent ? C.lime : dark ? C.lineDark : C.line, background: accent ? C.ink : dark ? C.night : C.white, color: accent || dark ? C.paper : C.ink, breakInside: "avoid" }}>
      {o.badge && (
        <span className="absolute -top-[2.4mm] left-[4mm] rounded-full px-[2.2mm] py-[0.5mm] font-mono text-[7pt] font-bold uppercase tracking-[0.12em]" style={{ background: C.lime, color: C.ink }}>
          {o.badge}
        </span>
      )}
      <p className="text-[11.5pt] font-semibold leading-tight">{o.label}</p>
      <p className="mt-[2.5mm] font-mono text-[16pt] font-bold leading-none" style={{ color: accent || dark ? C.lime : C.ink }}>
        {o.price ? formatINR(o.price) : "On quote"}
        {o.price && monthly ? <span className="text-[8.5pt] font-medium">/month</span> : null}
      </p>
      {o.detail && <p className="mt-[2.5mm] text-[8.3pt] leading-[1.4]" style={{ opacity: 0.68 }}>{o.detail}</p>}
    </div>
  );
}

/** The top of a service page: name, short line, description and what is always included. */
function ServiceHead({ s, dark }: { s: Service; dark?: boolean }) {
  return (
    <>
      <Kicker light={dark}>{s.short}</Kicker>
      <H2 dark={dark} pt={25}>
        <Hi dark={dark}>{s.name}</Hi>
        {s.billing === "month" ? " · monthly" : ""}
      </H2>
      <p className="mt-[3mm] max-w-[170mm] text-[10.5pt] leading-[1.5]" style={{ opacity: 0.72 }}>{s.description}</p>
      {s.included.length > 0 && (
        <div className="mt-[4mm] flex flex-wrap gap-x-[5mm] gap-y-[1.4mm]">
          {s.included.map((t) => (
            <span key={t} className="flex items-center gap-[1.4mm] text-[8.8pt]">
              <Check className="size-[3.2mm] shrink-0" style={{ color: dark ? C.lime : C.ink }} strokeWidth={2.6} /> {t}
            </span>
          ))}
        </div>
      )}
    </>
  );
}

/**
 * A service's groups split into pages, so a long service (photography, video) runs on to more pages instead of
 * shrinking past reading size. Weights approximate the height of each block; the page's own fit trims the rest.
 */
const FIRST = 56;
const NEXT = 64;
const weightOf = (g: ServiceGroup) => 2.5 + g.options.reduce((a, o) => a + (o.detail ? 1.5 : 1), 0);
function splitService(s: Service) {
  const cards = s.groups.find((g) => g.id === "package" || g.id === "apptype");
  const rest = s.groups.filter((g) => g !== cards);
  const ordered = [...rest.filter((g) => g.core), ...rest.filter((g) => !g.core)];
  const chunks: ServiceGroup[][] = [];
  let cur: ServiceGroup[] = [];
  let used = 0;
  let budget = FIRST - (cards ? 6.5 * Math.ceil(cards.options.length / 3) : 0);
  for (const g of ordered) {
    const w = weightOf(g);
    if (cur.length && used + w > budget) {
      chunks.push(cur);
      cur = [];
      used = 0;
      budget = NEXT;
    }
    cur.push(g);
    used += w;
  }
  chunks.push(cur);
  return { cards, chunks };
}

/** One page of a service: the first carries its name, packages and opening groups; the rest carry more groups. */
function ServicePage({ s, n, dark, cards, groups, part, parts }: { s: Service; n: number; dark?: boolean; cards?: ServiceGroup; groups: ServiceGroup[]; part: number; parts: number }) {
  const monthly = s.billing === "month";
  const first = part === 0;
  const startsCore = first && groups.some((g) => g.core);
  return (
    <Inside n={n} section={parts > 1 ? `${s.name} · ${part + 1} of ${parts}` : s.name} dark={dark}>
      {first ? (
        <ServiceHead s={s} dark={dark} />
      ) : (
        <>
          <Kicker light={dark}>{s.short}</Kicker>
          <H2 dark={dark} pt={20}>
            <Hi dark={dark}>{s.name}</Hi>, continued
          </H2>
        </>
      )}
      {first && cards && (
        <div className="mt-[6mm]">
          <p className="font-mono text-[8pt] font-semibold uppercase tracking-[0.2em]" style={{ opacity: 0.6 }}>{cards.title}</p>
          <div className="mt-[3mm] grid grid-cols-3 gap-[3.5mm]">
            {cards.options.filter((o) => o.price > 0).map((o) => (
              <PackCard key={o.id} o={o} monthly={monthly} dark={dark} />
            ))}
          </div>
        </div>
      )}
      {first && startsCore && (
        <p className="mt-[6mm] font-mono text-[8pt] font-semibold uppercase tracking-[0.2em]" style={{ opacity: 0.6 }}>
          Or build your own{cards ? " (instead of a package)" : ""}
        </p>
      )}
      <div className="mt-[4mm]" style={{ columnCount: 2, columnGap: "7mm" }}>
        {groups.map((g) => (
          <GroupBlock key={g.id} g={g} monthly={monthly} dark={dark} />
        ))}
      </div>
    </Inside>
  );
}

export function PricingBooklet({ mode, preparedFor }: { mode: BookletMode; preparedFor?: string }) {
  const rates = useRates();
  const { settings } = useSettings();
  if (!rates) return <Loading label="Loading the rate card…" />;

  const svc = (id: string) => rates.services.find((s) => s.id === id);
  const order = ["websites", "brand", "software", "automations", "photography", "videography", "social"];
  const services = order.map(svc).filter((s): s is Service => !!s);
  const packaged = services.filter((s) => s.groups.some((g) => g.id === "package"));
  const tax = settings.gstRegistered ? TERMS.tax : TERMS.taxNone;
  const coaching = rates.coaching;

  const pages: ((n: number) => React.ReactNode)[] = [
    // 1 — cover
    () => (
      <Cover
        kicker="Price list"
        title={
          <>
            Clear prices.
            <br />
            <span style={{ color: C.lime }}>Shipped work.</span>
          </>
        }
        sub="Websites, brand systems, software, automations, photography, video and social media — every package and option with its price, written down before anything starts."
        chips={services.map((s) => s.name)}
        preparedFor={preparedFor}
      />
    ),
    // 2 — how pricing works
    (n) => (
      <Inside n={n} section="How our pricing works">
        <Kicker>Three steps, no surprises</Kicker>
        <H2>
          You see the price <Hi>before</Hi> we start.
        </H2>
        <div className="mt-[7mm] grid grid-cols-3 gap-[4mm]">
          {[
            ["01", "Start from a package", "Ready packages are fixed for what they list. Or pick each option yourself — every one has its own price."],
            ["02", "Add what you need", "Add-ons are priced one by one, so you only pay for what the work actually needs."],
            ["03", "Get it in writing", `A written quote with scope, timeline and total after a short discovery call. It holds for ${rates.terms.validityDays} days.`],
          ].map(([k, t, d]) => (
            <div key={k} className="rounded-[2.5mm] border p-[5mm]" style={{ background: C.white, borderColor: C.line }}>
              <p className="font-mono text-[18pt] font-bold leading-none">{k}</p>
              <p className="mt-[3mm] text-[11.5pt] font-semibold">{t}</p>
              <p className="mt-[1.5mm] text-[9.5pt] leading-[1.5]" style={{ opacity: 0.68 }}>{d}</p>
            </div>
          ))}
        </div>

        {rates.bundleSteps.length > 0 && (
          <div className="mt-[7mm] rounded-[2.5mm] p-[6mm]" style={{ background: C.ink, color: C.paper }}>
            <Kicker light>Studio Bundle · book together, save more</Kicker>
            <p className="mt-[3mm] text-[10pt] leading-[1.5]" style={{ color: "rgba(245,244,240,0.72)" }}>
              Take two or more services in one project and the one-time work costs less. Monthly retainers are not discounted by the bundle.
            </p>
            <div className="mt-[4mm] flex gap-[3.5mm]">
              {rates.bundleSteps.map((b, i, all) => (
                <div key={b.services} className="flex-1 rounded-[2mm] border p-[4mm] text-center" style={{ borderColor: "rgba(200,241,53,0.4)" }}>
                  <p className="font-mono text-[20pt] font-bold leading-none" style={{ color: C.lime }}>{b.discountPercent}%</p>
                  <p className="mt-[1.5mm] font-mono text-[8pt] uppercase tracking-[0.14em]" style={{ color: "rgba(245,244,240,0.7)" }}>
                    {i === all.length - 1 ? `${b.services}+` : b.services} services
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-[7mm] grid grid-cols-2 gap-[5mm]">
          <div className="rounded-[2.5mm] border p-[5mm]" style={{ borderColor: C.line, background: C.white }}>
            <Kicker>How you pay</Kicker>
            <p className="mt-[3mm] text-[9.5pt] leading-[1.5]" style={{ opacity: 0.75 }}>{TERMS.paymentTerms}</p>
          </div>
          <div className="rounded-[2.5mm] border p-[5mm]" style={{ borderColor: C.line, background: C.white }}>
            <Kicker>Revisions</Kicker>
            <p className="mt-[3mm] text-[9.5pt] leading-[1.5]" style={{ opacity: 0.75 }}>{TERMS.revisionPolicy}</p>
          </div>
        </div>
        <p className="mt-[6mm] text-[9pt] leading-[1.5]" style={{ opacity: 0.6 }}>
          {tax} {TERMS.pricesFinal}
        </p>
      </Inside>
    ),
    // 3 — ready packages at a glance
    (n) => (
      <Inside n={n} section="Ready packages" dark>
        <Kicker light>Fixed price, fixed scope</Kicker>
        <H2 dark>
          Start with a <Hi dark>ready package.</Hi>
        </H2>
        <p className="mt-[3mm] max-w-[165mm] text-[10.5pt] leading-[1.5]" style={{ color: "rgba(245,244,240,0.7)" }}>
          The quickest way to begin: each package is fixed for what it lists. Need something else? Every option is on the pages that follow.
        </p>
        {packaged.map((s) => {
          const g = s.groups.find((x) => x.id === "package")!;
          return (
            <div key={s.id} className="mt-[6mm]">
              <p className="font-mono text-[8.5pt] font-semibold uppercase tracking-[0.2em]" style={{ color: C.lime }}>
                {s.name}
                {s.billing === "month" ? " · per month" : ""}
              </p>
              <div className="mt-[3mm] grid grid-cols-3 gap-[3mm]">
                {g.options.filter((o) => o.price > 0).slice(0, 6).map((o) => (
                  <PackCard key={o.id} o={o} monthly={s.billing === "month"} dark />
                ))}
              </div>
            </div>
          );
        })}
      </Inside>
    ),
    // one or more pages per service
    ...services.flatMap((s, i) => {
      const { cards, chunks } = splitService(s);
      // eslint-disable-next-line react/display-name -- page renderers, not components
      return chunks.map((groups, part) => (n: number) => <ServicePage key={`${s.id}-${part}`} s={s} n={n} dark={i % 2 === 1} cards={cards} groups={groups} part={part} parts={chunks.length} />);
    }),
    // 11 — social contracts, coaching, what's not included
    (n) => (
      <Inside n={n} section="Retainers, coaching & terms">
        {rates.socialContracts.length > 0 && (
          <>
            <Kicker>Social media retainers</Kicker>
            <H2 pt={22}>
              Stay longer, <Hi>pay less.</Hi>
            </H2>
            <div className="mt-[5mm] grid grid-cols-4 gap-[3mm]">
              {rates.socialContracts.map((c) => (
                <div key={c.label} className="rounded-[2.5mm] border p-[4mm] text-center" style={{ borderColor: c.discountPercent ? C.ink : C.line, background: C.white }}>
                  <p className="font-mono text-[18pt] font-bold leading-none">{c.discountPercent ? `${c.discountPercent}%` : "—"}</p>
                  <p className="mt-[2mm] text-[9.5pt] font-semibold">{c.label}</p>
                  <p className="mt-[0.5mm] text-[8pt]" style={{ opacity: 0.55 }}>{c.discountPercent ? "off the monthly fee" : "no commitment"}</p>
                </div>
              ))}
            </div>
          </>
        )}
        {(coaching.online > 0 || coaching.offline > 0) && (
          <div className="mt-[8mm] rounded-[2.5mm] p-[6mm]" style={{ background: C.ink, color: C.paper }}>
            <Kicker light>1:1 AI coaching</Kicker>
            <p className="mt-[3mm] text-[15pt] font-semibold leading-tight">AI fluency built around your life — in 90 days.</p>
            <p className="mt-[2mm] text-[9.5pt] leading-[1.5]" style={{ color: "rgba(245,244,240,0.7)" }}>
              Not a course: a personal coach and a curriculum built for your profession{coaching.sessions ? `, with ${coaching.sessions} live sessions in the programme` : ""}.
            </p>
            <div className="mt-[4mm] grid grid-cols-2 gap-[3.5mm]">
              {coaching.online > 0 && (
                <div className="rounded-[2mm] border p-[4mm]" style={{ borderColor: C.lineDark }}>
                  <p className="text-[10pt] font-semibold">Online · 90 days</p>
                  <p className="mt-[1.5mm] font-mono text-[17pt] font-bold" style={{ color: C.lime }}>{formatINR(coaching.online)}</p>
                </div>
              )}
              {coaching.offline > 0 && (
                <div className="rounded-[2mm] border p-[4mm]" style={{ borderColor: C.lineDark }}>
                  <p className="text-[10pt] font-semibold">Offline · 90 days</p>
                  <p className="mt-[1.5mm] font-mono text-[17pt] font-bold" style={{ color: C.lime }}>{formatINR(coaching.offline)}</p>
                </div>
              )}
            </div>
          </div>
        )}
        <div className="mt-[8mm] grid grid-cols-2 gap-[5mm] text-[9pt] leading-[1.5]">
          <div>
            <Kicker>Not included unless quoted</Kicker>
            <p className="mt-[2.5mm]" style={{ opacity: 0.75 }}>{TERMS.thirdParty}</p>
          </div>
          <div>
            <Kicker>At handover</Kicker>
            <p className="mt-[2.5mm]" style={{ opacity: 0.75 }}>{TERMS.handoff}</p>
          </div>
        </div>
      </Inside>
    ),
    // back cover
    () => (
      <BackCover
        kicker="Price it yourself"
        headline={
          <>
            Your exact price,
            <br />
            <span style={{ color: C.lime }}>in a few clicks.</span>
          </>
        }
        line="Scan the code, pick a service, choose a package or each option, and see your total — then send it to us for a written quote."
        steps={[
          ["Tell us what you're building", "A 20-minute call. Just a direct conversation about what you need."],
          ["Get a written quote", "Scope, timeline and price, before anything starts."],
          ["We build, you stay in the loop", "Regular updates, then handover, training and support."],
        ]}
        qrPath="/pricing"
        qrLabel="Price your project"
      />
    ),
  ];

  return <BookletShell title="Pricing booklet" mode={mode} pages={pages} />;
}
