"use client";

import { useState } from "react";
import { Tabs } from "@/components/ui/Tabs";
import { CollectionManager } from "@/components/hq/CollectionManager";
import { useCollection } from "@/components/hq/data";
import { PageHeader } from "@/components/hq/ui";
import { FeedbackTab } from "./FeedbackTab";
import { TestimonialsTab } from "./TestimonialsTab";

type Tab = "feedback" | "testimonials" | "case-studies";
const TABS: Tab[] = ["feedback", "testimonials", "case-studies"];

export function ReputationApp({ initialTab }: { initialTab?: string }) {
  const [tab, setTab] = useState<Tab>(TABS.includes(initialTab as Tab) ? (initialTab as Tab) : "feedback");
  const { records: feedback } = useCollection("feedback");
  const { records: testimonials } = useCollection("testimonials");
  const { records: cases } = useCollection("caseStudies");

  return (
    <div>
      <PageHeader
        icon="MessageSquareHeart"
        eyebrow="Reputation"
        title="Feedback & testimonials"
        description="What clients and learners tell us, and the proof we can honestly share. Everything here starts empty and grows with real projects."
      />

      <Tabs
        className="mb-6"
        value={tab}
        onChange={setTab}
        tabs={[
          { value: "feedback", label: "Feedback", count: feedback.length },
          { value: "testimonials", label: "Testimonials", count: testimonials.length },
          { value: "case-studies", label: "Case studies", count: cases.length },
        ]}
      />

      {tab === "feedback" && <FeedbackTab />}
      {tab === "testimonials" && <TestimonialsTab />}
      {tab === "case-studies" && (
        <div>
          <p className="mb-5 rounded-[var(--radius-md)] border border-graphite/12 bg-paper-200/40 px-4 py-3 text-sm text-charcoal">
            A case study tells one client&apos;s before-and-after story for decks, posts and the website. Use real numbers only, get the client&apos;s written approval (Documents to Sign → Testimonial release) before publishing, and link the files from the project.
          </p>
          <CollectionManager name="caseStudies" newLabel="New case study" emptyText="No case studies yet. After a project ships, write up the challenge, what we built and the results, using real figures." />
        </div>
      )}
    </div>
  );
}
