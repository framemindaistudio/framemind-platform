/**
 * FrameMind AI Studio — the company profile HQ prints on documents, papers, cards and emails.
 *
 * `url` is the address the deployment answers on: the public website at / and HQ at /hq (links in emails, QR codes and
 * papers sent to sign point here). `website` is the public studio website — the same deployment unless set apart. Contact details come from env so they can change without a code change;
 * the defaults are the studio's own published details. Anything left empty is hidden.
 */
export const site = {
  name: "FrameMind",
  legalName: process.env.NEXT_PUBLIC_LEGAL_NAME || "FrameMind AI Studio",
  expansion: "FrameMind AI Studio",
  tagline: "Design · Software · AI",
  pillars: ["Websites", "Brand Systems", "Custom Software", "Automations", "Photo & Video", "AI Coaching"],
  headline: "We build what founders need — actually shipped.",
  description:
    "FrameMind AI Studio is a founder-led design and software studio: websites, brand systems, custom software, automations, photography, videography, social media, 1:1 AI coaching and Vritta for institutions.",
  url: (process.env.NEXT_PUBLIC_SITE_URL || (process.env.NODE_ENV === "production" ? "https://www.framemindaistudio.com" : "http://localhost:3011")).replace(/\/+$/, ""),
  website: (process.env.NEXT_PUBLIC_WEBSITE_URL || process.env.NEXT_PUBLIC_SITE_URL || (process.env.NODE_ENV === "production" ? "https://www.framemindaistudio.com" : "http://localhost:3011")).replace(/\/+$/, ""),
  location: process.env.NEXT_PUBLIC_LOCATION || "Gadag, Karnataka",
  contact: {
    email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "framemindaistudio@gmail.com",
    phone: process.env.NEXT_PUBLIC_CONTACT_PHONE || "+91 80730 87576",
    /** digits only, with country code, e.g. 918073087576 */
    whatsapp: (process.env.NEXT_PUBLIC_WHATSAPP || "918073087576").replace(/\D/g, ""),
  },
  socials: {
    instagram: process.env.NEXT_PUBLIC_INSTAGRAM || "",
    youtube: process.env.NEXT_PUBLIC_YOUTUBE || "",
    linkedin: process.env.NEXT_PUBLIC_LINKEDIN || "",
  },
  /** the studio itself (kept as its own entry because shared HQ screens credit "the studio" by this name) */
  studio: {
    name: "FrameMind AI Studio",
    url: "https://www.framemindaistudio.com/",
  },
  founders: [
    {
      id: "chinmay",
      name: "Chinmay R M",
      role: "Founder",
      focus: "Vision · Product · Design · Engineering · Delivery",
      bio: "Chinmay founded FrameMind AI Studio with one conviction — that great design and real software should be accessible to founders who are actually building something. He leads every project end-to-end, from the first brief to the final handover.",
      initials: "CR",
      photo: "/team/chinmay.jpg",
    },
    {
      id: "shivaprasad",
      name: "Shivaprasad Reddy S S",
      role: "Head of Business Development & Client Relations",
      focus: "Growth · Partnerships · Revenue · Client Relations",
      bio: "Shivaprasad drives FrameMind's growth engine — from identifying the right clients to building relationships that last well beyond the first project. He bridges studio capability and business opportunity, so every conversation turns into the right fit.",
      initials: "SR",
      photo: "/team/shivaprasad.jpg",
    },
  ],
} as const;

export function whatsappLink(message: string) {
  if (!site.contact.whatsapp) return null;
  return `https://wa.me/${site.contact.whatsapp}?text=${encodeURIComponent(message)}`;
}
