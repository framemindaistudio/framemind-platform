"use client";

import TeamLanyardRail, { type LanyardMember } from "@/site/components/ui/team-lanyard-rail";
import { PillLink } from "@/site/components/ui/motion-bits";

/** The real team on the 21st.dev lanyard rail, plus an honest "your badge" pointing at open roles. */
const TEAM: LanyardMember[] = [
  {
    id: "chinmay",
    name: "Chinmay R M",
    role: "Founder",
    team: "FrameMind · Studio",
    tone: 1,
    image: "/site/chinmay-portrait.jpg",
    bio: "Founded the studio so founders get real design and real software. Leads every project from the first brief to the handover.",
    tags: ["Design", "Software", "AI"],
    links: [
      { label: "Email", href: "mailto:framemindaistudio@gmail.com" },
      { label: "LinkedIn", href: "https://www.linkedin.com/in/chinmay-rm/" },
    ],
  },
  {
    id: "shivaprasad",
    name: "Shivaprasad Reddy S S",
    role: "Business Development",
    team: "FrameMind · Clients",
    tone: 2,
    image: "/site/shivaprasad.jpg",
    bio: "Your first conversation with FrameMind. Finds the right fit for each client and stays with them well beyond the first project.",
    tags: ["Partnerships", "Client relations"],
    links: [
      { label: "WhatsApp", href: "https://wa.me/918073087576" },
      { label: "Email", href: "mailto:framemindaistudio@gmail.com" },
    ],
  },
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

export default function TeamRail() {
  return (
    <section className="fm-dark relative overflow-hidden py-20 md:py-28">
      <TeamLanyardRail
        items={TEAM}
        eyebrow="Meet the team"
        heading="The people you'll actually talk to."
        caption="Hover a badge to meet someone, pull it down, or click to flip it."
        autoplay
        action={<PillLink to="/team" tone="chalk">About the team</PillLink>}
      />
    </section>
  );
}
