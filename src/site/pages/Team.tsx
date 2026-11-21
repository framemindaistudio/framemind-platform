"use client";

import SEO from "@/site/components/SEO";
import TeamRail, { type RailMember } from "@/site/components/TeamRail";
import { CtaPanel, PageHero, SectionHead } from "@/site/components/ui/page-bits";
import { PillLink, Rise } from "@/site/components/ui/motion-bits";

/*
 * The team page. Who appears is decided in HQ → Team ("Show on the website", with a website bio and a profile photo);
 * until someone is marked there, only the founder is shown. Nobody's details are written into this file.
 */

const values = [
  { n: "01", title: "Founder-led, always", body: "Every project is owned by someone who cares about the outcome, not passed down a chain." },
  { n: "02", title: "Small team, full depth", body: "We stay lean on purpose. Every person here does real, hands-on work." },
  { n: "03", title: "Built to grow right", body: "We add people when the work needs them, not to look bigger." },
  { n: "04", title: "One studio, one standard", body: "Your first project or your fiftieth: the standard does not change." },
];

export default function Team({ team = [] }: { team?: RailMember[] }) {
  return (
    <div className="bg-[var(--fm-stone)]">
      <SEO
        title="Our Team: Designers, Developers & Strategists"
        description="Meet the people behind FrameMind AI Studio, a small, founder-led team that handles every project from brief to launch."
        path="/team"
        keywords="FrameMind team, design studio team Karnataka, web developers India, UI UX designers India, FrameMind AI Studio founders"
        ogImageAlt="FrameMind AI Studio: Meet the Team"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "AboutPage",
          name: "Our Team: FrameMind AI Studio",
          description: "The people behind FrameMind AI Studio.",
          url: "https://www.framemindaistudio.com/team",
          publisher: { "@type": "Organization", name: "FrameMind AI Studio" },
        }}
      />

      <PageHero
        kicker="The team"
        lines={["The people", <span key="b" className="text-[#9a9890]">behind the work.</span>]}
        lede="FrameMind is a founder-led studio. Small by choice, deep by design. Every person here owns their craft."
        actions={
          <>
            <PillLink to="/connect">Work with us</PillLink>
            <PillLink to="/careers" tone="ghost">
              Join us
            </PillLink>
          </>
        }
      />

      <TeamRail members={team} />

      <section className="rounded-t-[36px] bg-[var(--fm-stone)] md:rounded-t-[56px]">
        <div className="mx-auto max-w-[1320px] px-5 py-24 sm:px-8 md:py-32">
          <SectionHead kicker="How we work" lines={["A small studio", <span key="b" className="text-[#64635d]">with one standard.</span>]} />
          <div className="mt-14 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((v, i) => (
              <Rise key={v.n} delay={i * 0.06}>
                <div className="flex h-full flex-col rounded-[26px] bg-[#f3f2ee] p-7 transition-transform duration-500 hover:-translate-y-1">
                  <span className="font-mono text-[12px] text-[#64635d]">{v.n}</span>
                  <h3 className="mt-10 text-[1.5rem] font-normal leading-tight tracking-[-0.03em]">{v.title}</h3>
                  <p className="mt-3 text-[15px] leading-relaxed text-[#55544e]">{v.body}</p>
                </div>
              </Rise>
            ))}
          </div>
        </div>
      </section>

      <CtaPanel lines={["Work with", "us."]} lede="Tell us what you need. You get a straight answer on scope, time and price." />
    </div>
  );
}
