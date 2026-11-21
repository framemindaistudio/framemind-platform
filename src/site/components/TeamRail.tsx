"use client";

import TeamLanyardRail, { type LanyardMember } from "@/site/components/ui/team-lanyard-rail";
import { PillLink } from "@/site/components/ui/motion-bits";

export interface RailMember {
  id: string;
  name: string;
  role: string;
  bio: string;
  photo: string;
}

/**
 * Shown until a founder marks people "Show on the website" in HQ → Team. The founder's portrait and words are already
 * public on this site; nobody else appears until HQ says so.
 */
const FALLBACK: RailMember[] = [
  {
    id: "founder",
    name: "Chinmay R M",
    role: "Founder",
    bio: "Founded the studio so founders get real design and real software. Leads every project from the first brief to the handover.",
    photo: "/site/chinmay-portrait.jpg",
  },
];

const TONES = [1, 2, 3, 4, 5] as const;

/** The team on the 21st.dev lanyard rail: the people HQ publishes, then an honest "your badge" for open roles. */
export default function TeamRail({ members }: { members?: RailMember[] }) {
  const people = members?.length ? members : FALLBACK;
  const items: LanyardMember[] = [
    ...people.map((m, i) => ({
      id: m.id,
      name: m.name,
      role: m.role,
      team: "FrameMind AI Studio",
      tone: TONES[i % TONES.length],
      image: m.photo || "/brand/kit/preview/framemind-icon-4k.webp",
      bio: m.bio || undefined,
      links: [
        { label: "Email", href: "mailto:framemindaistudio@gmail.com" },
        { label: "WhatsApp", href: "https://wa.me/918073087576" },
      ],
    })),
    {
      id: "you",
      name: "Your badge?",
      role: "We're hiring",
      team: "FrameMind · Careers",
      tone: 5,
      image: "/brand/kit/preview/framemind-icon-4k.webp",
      bio: "We add people when the work needs them. See the open roles and send us your work.",
      tags: ["Open roles"],
      links: [{ label: "Careers", href: "/careers" }],
    },
  ];
  return (
    <section className="fm-dark relative overflow-hidden py-20 md:py-28">
      <TeamLanyardRail
        items={items}
        eyebrow="Meet the team"
        heading="The people you'll actually talk to."
        caption="Hover a badge to meet someone, pull it down, or click to flip it."
        autoplay
        action={
          <PillLink to="/team" tone="chalk">
            About the team
          </PillLink>
        }
      />
    </section>
  );
}
