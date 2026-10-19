/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  FRAMEMIND CATALOGUE — WHAT THE STUDIO SELLS AND THE STARTING PRICES
 * ─────────────────────────────────────────────────────────────────────────────
 *  Every service on the studio's interactive pricing page (framemind-ai-studio.figma.site/pricing), with each
 *  configurable group and option at its published price, plus the bundle discounts, the Vritta rate card and
 *  the commercial terms the site states.
 *
 *  These are the STARTING values. Founders change prices in HQ → Money → Rate Card, which saves a full copy to
 *  the private data repository (data/ratecard.json); HQ then reads that copy at run time. To change a price,
 *  change it in HQ, not here.
 *
 *  Currency: INR, exclusive of GST.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export type ServiceId = "websites" | "brand" | "software" | "automations" | "photography" | "videography" | "social";

export interface ServiceOption {
  id: string;
  label: string;
  detail?: string;
  /** price in rupees before GST; 0 = included */
  price: number;
  badge?: string;
}

export interface ServiceGroup {
  id: string;
  title: string;
  /** "one": choose exactly one (radio) · "any": choose any number (checkboxes) */
  mode: "one" | "any";
  help?: string;
  note?: string;
  options: ServiceOption[];
}

export interface Service {
  id: ServiceId;
  name: string;
  short: string;
  description: string;
  /** "project": a one-time price · "month": a monthly retainer (social media) */
  billing: "project" | "month";
  /** what is always included, from the site's "What's included" notes */
  included: string[];
  groups: ServiceGroup[];
  /** icon for HQ screens (a lucide-react export name) */
  icon: string;
}

/** compact option rows: [label, price, detail?, badge?] */
type Row = [string, number, string?, string?];

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/₹/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);

const group = (title: string, mode: "one" | "any", rows: Row[], extra: { help?: string; note?: string } = {}): ServiceGroup => ({
  id: slug(title),
  title,
  mode,
  ...extra,
  options: rows.map(([label, price, detail, badge]) => ({ id: slug(label), label, price, ...(detail ? { detail } : {}), ...(badge ? { badge } : {}) })),
});

export const SERVICES: Service[] = [
  {
    id: "websites",
    name: "Websites",
    short: "Design · Development · Launch",
    icon: "Globe",
    billing: "project",
    description: "A fully custom website built to the client's business — not a template. Every page, feature and integration scoped and priced transparently.",
    included: ["Custom design (no templates)", "Responsive layout for all screen sizes", "Cross-browser testing", "Domain connection and deployment", "Basic SEO-ready structure", "30-min handover walkthrough"],
    groups: [
      group(
        "How many pages?",
        "one",
        [
          ["1–5 pages", 15000, "Landing page, about, contact, services"],
          ["6–10 pages", 28000, "Adds team, portfolio, blog, gallery"],
          ["11–20 pages", 48000, "Full site with multiple sections", "Popular"],
          ["21–30 pages", 75000, "Large business or directory-style site"],
          ["30+ pages", 110000, "Enterprise or multi-department site"],
        ],
        { help: "Count every distinct page — home, about, services, contact, each portfolio or blog item.", note: "Each page is designed and developed individually. Popups, modals and repeated layout sections do not count as separate pages." },
      ),
      group(
        "Design approach",
        "one",
        [
          ["Clean & professional", 0, "Polished and purposeful — no templates"],
          ["Custom UI design", 15000, "Every component designed for the brand", "Popular"],
          ["Premium + micro-animations", 32000, "Scroll effects, transitions, interactions"],
        ],
        { help: "All options use the client's brand colours, fonts and assets. The difference is depth of custom visual design." },
      ),
      group(
        "Content management",
        "one",
        [
          ["No CMS needed", 0, "Static or developer-managed content"],
          ["WordPress / Webflow CMS", 8000, "Familiar interface, easy for teams"],
          ["Custom CMS", 20000, "Built for the client's content structure"],
        ],
        { note: "CMS training (30 min walkthrough) is included with WordPress/Webflow and Custom CMS options." },
      ),
      group(
        "Features & functionality",
        "any",
        [
          ["Contact / enquiry form", 2000],
          ["Blog or news section", 6000],
          ["WhatsApp click-to-chat", 2000],
          ["Live chat widget", 3000],
          ["Payment gateway", 8000],
          ["Booking / appointment system", 12000],
          ["E-commerce — basic store", 22000],
          ["E-commerce — advanced + inventory", 45000, undefined, "Advanced"],
          ["Role-based admin dashboard", 20000],
          ["AI chatbot", 18000],
          ["Multi-language support (per language)", 8000],
          ["Member login / gated area", 12000],
        ],
        { note: "Payment gateway and e-commerce need the client's own active accounts with the payment provider (e.g. Razorpay). Third-party setup fees are not included." },
      ),
      group(
        "SEO & performance",
        "any",
        [
          ["Basic on-page SEO", 5000, "Meta tags, sitemap, robots.txt"],
          ["Technical SEO + structured data", 10000, undefined, "Recommended"],
          ["Core Web Vitals optimisation", 8000],
          ["Analytics + Search Console setup", 3000],
        ],
        { note: "SEO setup is a one-time technical implementation. Ongoing keyword strategy, link building and content SEO are separate services." },
      ),
      group(
        "Post-launch support",
        "one",
        [
          ["No support needed", 0],
          ["1 month", 5000, "Bug fixes and minor adjustments"],
          ["3 months", 12000, "Extended monitoring and updates", "Popular"],
          ["6 months", 22000, "Priority support and monthly check-ins"],
        ],
        { note: "Support covers the original scope of work. New features or design changes outside the original brief are quoted separately." },
      ),
    ],
  },
  {
    id: "brand",
    name: "Brand Identity",
    short: "Identity · Guidelines · Assets",
    icon: "Palette",
    billing: "project",
    description: "A complete visual identity built from strategy — logo, colour, typography, guidelines and the assets the client's team will actually use.",
    included: ["Strategy-led logo concepts", "Final logo in all formats", "Colour palette and typography", "2 rounds of revisions per concept"],
    groups: [
      group(
        "Logo concepts",
        "one",
        [
          ["2 concepts", 10000, "Focused, fast"],
          ["3 concepts", 18000, "More direction to choose from", "Popular"],
          ["5 concepts", 28000, "Full exploration across styles"],
        ],
        { help: "Each concept is a fully distinct creative direction — not variations of the same idea.", note: "Each concept includes 2 rounds of revisions. The client selects one direction to refine into the final logo. Additional concepts or rounds are quoted separately." },
      ),
      group(
        "Brand guidelines",
        "one",
        [
          ["Quick-reference sheet", 0, "Colours, fonts and logo usage — 1 page"],
          ["Standard (10–15 pages)", 15000, "Full system with rules and examples", "Popular"],
          ["Comprehensive (25+ pages)", 35000, "Tone, imagery, iconography and strategy"],
        ],
        { note: "Delivered as a PDF. Editable source files (Figma/Illustrator) are included with Standard and Comprehensive." },
      ),
      group(
        "Collateral & templates",
        "any",
        [
          ["Business card design", 3000],
          ["Letterhead & envelope", 3000],
          ["Email signature", 2000],
          ["Social media profile + cover templates (5 platforms)", 6000, undefined, "Popular"],
          ["Presentation deck template (10 slides)", 8000],
          ["One-pager / brochure template", 6000],
          ["Invoice / proposal template", 4000],
        ],
        { note: "All templates are delivered print-ready and in editable format (Canva, Google Slides or Figma depending on the asset)." },
      ),
      group("Advanced brand assets", "any", [
        ["Custom icon set (10 icons)", 12000],
        ["Custom icon set (20 icons)", 22000],
        ["Figma component library", 15000, "Reusable UI components built to the brand", "Recommended"],
        ["Brand photography direction guide", 8000, "Style, mood, composition rules for shoots"],
        ["Motion & animation principles", 10000, "How the brand moves — transitions, timing"],
        ["Brand in-action mockup sheet", 5000, "Realistic mockups showing the brand applied"],
      ]),
      group(
        "Brand strategy",
        "any",
        [
          ["Brand positioning workshop", 15000, "Who they are, who they serve and why they win"],
          ["Naming & tagline development", 12000, "Name exploration, shortlisting and rationale"],
          ["Brand narrative — story, mission, values", 10000],
          ["Competitor landscape analysis", 8000, "How the category looks and where they fit"],
        ],
        { note: "Strategy work runs as structured workshops and is delivered as written documents. It is the foundation for every design decision that follows." },
      ),
    ],
  },
  {
    id: "software",
    name: "Software Solutions",
    short: "Dashboards · Platforms · Tools",
    icon: "Code2",
    billing: "project",
    description: "Custom software built for the client's exact business process — from a focused MVP to a full-scale platform. Scoped, built and delivered in stages.",
    included: ["Structured discovery session before development", "Source code and documentation at handover", "Deployment to the client's hosting"],
    groups: [
      group(
        "What are we building?",
        "one",
        [
          ["Web application", 40000, "Browser-based, works on all devices", "Most common"],
          ["Mobile app (iOS or Android)", 80000, "Native mobile application"],
          ["Web + mobile app", 110000, "Both platforms, shared backend"],
          ["Internal tool / dashboard", 35000, "For the team, not public-facing"],
        ],
        { note: "All options include a structured discovery session before development to finalise scope, user flows and technical requirements." },
      ),
      group(
        "Scope & complexity",
        "one",
        [
          ["MVP — one core feature", 0, "Ship fast, validate, then grow"],
          ["Multi-feature product", 60000, "3–6 core features with defined flows", "Popular"],
          ["Complex / scalable platform", 150000, "High data volume, complex business logic"],
          ["Enterprise platform", 300000, "Multi-tenant, SSO, audit trails, SLAs"],
        ],
        { note: "Final scope is confirmed in a discovery session. Exact pricing is locked after scope sign-off." },
      ),
      group("Core features", "any", [
        ["User authentication (login, signup)", 8000],
        ["User roles & permissions", 10000],
        ["Admin panel", 15000, "Manage users, content and settings", "Recommended"],
        ["File uploads & storage", 5000],
        ["Search & advanced filters", 8000],
        ["Email + push notifications", 8000],
        ["Real-time updates (live data)", 14000],
        ["Data export (CSV / PDF)", 5000],
        ["Custom analytics dashboard", 14000],
      ]),
      group(
        "Integrations",
        "any",
        [
          ["Payment gateway (Razorpay, Stripe)", 10000],
          ["SMS / WhatsApp API", 6000],
          ["Email service (SendGrid, etc.)", 4000],
          ["Maps / geolocation", 5000],
          ["Social login (Google, Facebook)", 5000],
          ["CRM integration", 8000],
          ["AI / ML features", 28000, "Custom model integration or LLM-powered features"],
          ["Custom third-party API / integration", 8000],
        ],
        { note: "Third-party API access, credentials and accounts are provided by the client. Provider subscription or transaction fees are not included." },
      ),
      group(
        "Infrastructure & quality",
        "any",
        [
          ["CI/CD deployment pipeline", 8000, "Automated builds and deployments"],
          ["Automated test coverage", 12000, "Unit and integration tests for critical paths", "Recommended"],
          ["Performance & load testing", 10000],
          ["Multi-language (i18n) support", 8000],
        ],
        { note: "Hosting and cloud infrastructure (AWS, GCP, Vercel…) is billed directly by the provider to the client." },
      ),
      group(
        "Post-launch support",
        "one",
        [
          ["No support", 0],
          ["30 days", 10000, "Bug fixes and stability monitoring"],
          ["60 days", 18000, "Extended monitoring and minor updates", "Popular"],
          ["90 days", 28000, "Priority support and proactive reviews"],
        ],
        { note: "Support covers bugs and issues within the agreed scope. New features or integrations after launch are quoted separately." },
      ),
    ],
  },
  {
    id: "automations",
    name: "Automations",
    short: "Workflow · AI · Integration",
    icon: "Workflow",
    billing: "project",
    description: "Eliminate repetitive manual work — connect the client's tools, automate their processes and let the business run smarter.",
    included: ["Workflow mapping before build", "Testing with real data", "Handover walkthrough and documentation"],
    groups: [
      group(
        "Number of workflows",
        "one",
        [
          ["1 workflow", 8000, "One trigger, one outcome"],
          ["3 workflows", 20000, "A connected set for a department", "Popular"],
          ["6 workflows", 38000, "Covers most core operations"],
          ["10+ workflows", 60000, "Full automation across the business"],
        ],
        { note: "A workflow is one trigger → action chain. A lead form triggering an email + CRM entry + Slack alert = 1 workflow with 3 actions." },
      ),
      group("Workflow complexity", "one", [
        ["Simple if/then logic", 0, "Trigger → single action, no conditions"],
        ["Multi-step with conditions", 5000, "Branching paths based on data or status", "Most common"],
        ["Complex branching + loops", 12000, "Multiple conditions, retries and sequences"],
        ["AI-assisted decision steps", 22000, "LLM or ML logic embedded in the flow"],
      ]),
      group(
        "Platforms to connect",
        "any",
        [
          ["Gmail / Outlook", 2000],
          ["WhatsApp / SMS (Twilio etc.)", 3000],
          ["Google Sheets / Airtable", 2000],
          ["CRM (HubSpot, Salesforce, Zoho)", 4000],
          ["Payment systems", 3000],
          ["Notion / Slack / Teams", 2000],
          ["Custom API / webhook", 5000],
          ["ERP or legacy system", 8000, "May require additional scoping"],
        ],
        { note: "Active accounts and API access for each platform are provided by the client. Automation tool subscriptions (Make, Zapier, n8n…) are not included." },
      ),
      group("Advanced & AI features", "any", [
        ["Automated reports (daily/weekly)", 6000, "Scheduled reports sent to email or Slack"],
        ["AI auto-classification", 10000, "Categorise leads, tickets or data automatically"],
        ["AI auto-response drafting", 14000, "Draft replies to emails or messages using AI"],
        ["Full AI agent (autonomous task handling)", 28000, "End-to-end autonomous decision and action loop"],
        ["Error monitoring + failure alerts", 4000, "Notified instantly when a workflow fails", "Recommended"],
        ["Uptime monitoring + auto-restart", 5000],
      ]),
    ],
  },
  {
    id: "photography",
    name: "Photography",
    short: "Brand · Product · Events",
    icon: "Camera",
    billing: "project",
    description: "Professional photography for brands, products, events, teams and spaces — planned, directed and edited to industry standard.",
    included: ["Colour-corrected, retouched high-resolution JPEGs", "Curated gallery of selects for approval", "Travel within 25 km of base", "Standard licence: digital and web use"],
    groups: [
      group(
        "What are we shooting?",
        "any",
        [
          ["Product / e-commerce", 0, "White-background or lifestyle shots for store, catalogue or packaging"],
          ["Portraits & headshots", 0, "Individual or group portraits — team pages, LinkedIn, press kits"],
          ["Brand & lifestyle", 3000, "Behind-the-scenes, brand moments, founder stories, culture"],
          ["Office / workspace / architecture", 0, "Offices, showrooms, cafes, co-working spaces"],
          ["Food & beverage", 5000, "Styled food, plating, menu photography"],
          ["Event coverage", 4000, "Corporate events, launches, workshops, ceremonies"],
          ["School / educational events", 3000, "Student activities, award days, sports, campus life"],
          ["Real estate / property", 3000, "Interiors, exteriors and amenities for listings"],
          ["Fashion & apparel", 5000, "On-model or flat-lay garments"],
        ],
        { note: "Multiple categories in one shoot are supported — the session is planned to cover each. Complex multi-category shoots may need more session time." },
      ),
      group(
        "Shoot session length",
        "one",
        [
          ["2 hours", 5000, "Quick headshot session or small product set (up to ~20 hero shots)"],
          ["Half day — 4 hours", 9000, "Products, portraits, or a single location and concept"],
          ["Full day — 7 hours", 17000, "Brand shoot covering team, products and space", "Most common"],
          ["2 shoot days", 32000, "Campaign with multiple concepts, locations or talent groups"],
          ["3+ shoot days", 48000, "Complete brand photography system or large-scale event"],
        ],
        { note: "Travel within 25 km of base is included. Outstation travel and stay are covered by the client. Permits, venue access and parking are the client's responsibility." },
      ),
      group("Number of locations", "one", [
        ["1 location", 0, "All shots at one address"],
        ["2 locations", 4000, "E.g. office + outdoor or studio + store"],
        ["3–4 locations", 10000, "Multi-venue campaign or brand story across sites"],
        ["5+ locations", 18000, "Full-city or regional shoot — needs a dedicated planning session"],
      ]),
      group(
        "Edited photos delivered",
        "one",
        [
          ["15 edited photos", 3000, "Tight hero set — ideal for a 2-hour session"],
          ["30 edited photos", 6000, "Half-day output covering one or two subjects"],
          ["60 edited photos", 11000, "Full-day brand shoot — products, team and space", "Popular"],
          ["120 edited photos", 18000, "Multi-concept campaign or event highlights set"],
          ["250 edited photos", 28000, "Large event, full catalogue or multi-day shoot"],
          ["500+ edited photos", 45000, "Complete event or annual shoot archive"],
        ],
        { note: "Editing turnaround is 5–7 working days after the shoot. A curated gallery of selects is shared for approval before final delivery." },
      ),
      group("Edit level", "one", [
        ["Standard — colour grade + crop", 0, "Exposure, white balance, colour correction and straightening"],
        ["Professional — retouch + grade", 4000, "Skin smoothing, blemish removal, minor background cleanup", "Recommended"],
        ["Advanced — compositing & manipulation", 10000, "Background replacement, product isolation, object removal"],
      ]),
      group("Output formats", "any", [
        ["Web — optimised JPEG", 0, "sRGB, screen-ready (always included)"],
        ["Print-ready — high-res TIFF or PDF", 3000, "300 DPI, for press and large-format print"],
        ["Social media crops", 2500, "1:1, 4:5 and 9:16 for Instagram, LinkedIn and Facebook"],
        ["E-commerce pack", 4000, "White-background isolation, multiple angles for Amazon, Flipkart or Shopify"],
        ["RAW files", 5000, "Unedited originals — requires the advanced edit level"],
      ]),
      group("Pre-production & direction", "any", [
        ["Mood board + visual brief", 4000],
        ["Full art direction on set", 8000, undefined, "Recommended"],
        ["Shot list preparation", 2500],
        ["Prop sourcing & styling", 6000, "Client covers prop costs"],
      ]),
      group("Add-ons", "any", [
        ["Drone / aerial photography", 14000, "Licensed drone operator"],
        ["Same-day preview delivery", 3500, "10–15 lightly edited selects within hours"],
        ["Rush edit (2–3 working days)", 4000],
        ["Printing coordination", 3000],
        ["Usage rights — extended commercial licence", 8000, "Billboard, national print, broadcast"],
        ["On-site instant prints", 7000, "Portable printer at events"],
      ]),
    ],
  },
  {
    id: "videography",
    name: "Videography",
    short: "Films · Reels · Events",
    icon: "Clapperboard",
    billing: "project",
    description: "Brand films, reels, event coverage, product videos and documentaries — shot, edited and delivered to broadcast standard.",
    included: ["Rough cut for approval, then final delivery", "2 rounds of revisions per video", "Travel within 25 km of base", "Landscape 16:9 master"],
    groups: [
      group(
        "What are we producing?",
        "any",
        [
          ["Brand film", 0, "Story-driven film about the company, founder or mission"],
          ["Social media reel", 0, "Short vertical or square video (15–90 s)"],
          ["Product demo / explainer", 0, "How it works or how to use a product"],
          ["Testimonial / interview", 3000, "On-camera client or team interview"],
          ["Event coverage", 4000, "Conferences, launches, workshops, ceremonies, exhibitions"],
          ["School / educational", 3000, "Student activities, award days, cultural events, workshops"],
          ["Real estate walkthrough", 3000, "Interior and exterior property video"],
          ["Training / educational content", 0, "Step-by-step instructional or course video"],
          ["Documentary / long-form", 8000, "Multi-interview, multi-location story-driven piece"],
        ],
        { note: "Multiple formats can be produced in one shoot — the shoot is planned to maximise output across formats." },
      ),
      group(
        "Shoot days",
        "one",
        [
          ["Half day — 4 hours on set", 8000, "Interviews, small product shoots, single-location reels"],
          ["Full day — 8 hours on set", 16000, "Brand films, events, multi-scene shoots", "Most common"],
          ["2 shoot days", 30000, "Multi-location or multi-concept campaigns. Large events."],
          ["3 shoot days", 44000, "Documentaries, full brand content systems, multi-city shoots"],
          ["4+ shoot days", 58000, "Large-scale productions, scoped after a planning call"],
        ],
        { note: "Travel within 25 km of base is included. Outstation travel and stay are covered by the client. Shoot days run 7–8 hours on set." },
      ),
      group("Number of finished videos", "one", [
        ["1 video", 0, "Single finished piece"],
        ["2–3 videos", 12000, "E.g. main film + 2 reels from the same shoot", "Popular"],
        ["4–5 videos", 22000, "Campaign set — hero film + platform cuts + teaser"],
        ["6–10 videos", 38000, "Full content library or testimonial series"],
        ["10+ videos", 60000, "Ongoing content system — priced per series after briefing"],
      ]),
      group("Length per finished video", "one", [
        ["Under 30 seconds", 5000, "Story ad, quick reel, teaser"],
        ["30–60 seconds", 9000, "Social reel, product highlight, testimonial clip"],
        ["60–90 seconds", 14000, "Brand promo, Instagram feature, short case study", "Most common"],
        ["2–4 minutes", 22000, "Brand film, product demo, educational video"],
        ["5–8 minutes", 35000, "Documentary short, detailed walkthrough, keynote film"],
        ["10–20 minutes", 50000, "Training module, full event film, interview documentary"],
        ["20+ minutes", 70000, "Long-form documentary or full event coverage"],
      ]),
      group(
        "Edit style",
        "one",
        [
          ["Basic cut — sync, trim, export", 0, "Clean assembly, cuts on beat, no graphics or grade"],
          ["Standard edit", 6000, "Transitions, title cards, lower-thirds, music synced to pacing", "Popular"],
          ["Premium edit — motion graphics", 14000, "Animated titles, branded overlays, intro/outro"],
          ["Cinematic edit — full post-production", 24000, "Scene-driven storytelling, audio design, full grade"],
        ],
        { note: "Each video includes 2 rounds of revisions after the first cut. Structural changes after round 2 are quoted separately." },
      ),
      group("Colour grade", "one", [
        ["No grade — camera-native footage", 0],
        ["Natural grade", 5000, "Balanced exposure, warm skin tones, consistent look"],
        ["Cinematic grade + custom LUT", 12000, "Film-style grade with a LUT built to the brand palette", "Recommended"],
      ]),
      group(
        "Audio",
        "any",
        [
          ["Licensed background music", 3000, "Royalty-free, cleared for all digital platforms", "Recommended"],
          ["Sound design", 6000, "Ambient sounds, SFX, transitions and mixing"],
          ["Voice-over — script + professional recording", 9000],
          ["Voice-over — client recording only", 3000, "Clean, compress and sync the client's recording"],
          ["Interview audio cleanup", 2500],
          ["Subtitles / captions", 3000, "Burnt-in or as a separate SRT/VTT file"],
        ],
        { note: "Licensed music is royalty-free for digital use. Broadcast (TV/radio) sync licensing is paid to the music library directly." },
      ),
      group("Platform formats", "any", [
        ["Landscape 16:9 — YouTube / website", 0, "1920×1080 or 4K"],
        ["Vertical 9:16 — Reels / Shorts / Stories", 3000],
        ["Square 1:1 — Instagram feed / Facebook", 2000],
        ["Short-form cut (15 s)", 2500],
        ["Short-form cut (30 s)", 2500],
        ["YouTube optimisation pack", 4000, "Thumbnail, chapter markers, end-screen, description"],
        ["WhatsApp / low-res compressed version", 1500, "MP4 under 16 MB"],
      ]),
      group("Pre-production", "any", [
        ["Script writing", 6000],
        ["Storyboard", 8000],
        ["Shot list preparation", 3000],
        ["Mood board & reference reel", 3500],
        ["Location scouting", 5000],
        ["Talent / presenter briefing", 2500],
      ]),
      group("Add-ons", "any", [
        ["Drone / aerial footage", 14000, "Licensed drone operator"],
        ["Teleprompter", 4000],
        ["Rush delivery (3–4 working days)", 5000, "Instead of the standard 7–10"],
        ["RAW footage archive", 6000, "All unedited raw files via cloud link or drive"],
        ["Behind-the-scenes content", 4000],
        ["Photography during video shoot", 5000, "Stills captured in the same session"],
      ]),
    ],
  },
  {
    id: "social",
    name: "Social Media",
    short: "Management & Growth",
    icon: "Megaphone",
    billing: "month",
    description: "Consistent, on-brand social content and management designed to keep the brand visible, engaging and growing.",
    included: ["Custom static creatives", "Captions, scheduling and publishing", "Basic optimisation per platform"],
    groups: [
      group("Platforms to manage", "any", [
        ["Instagram", 4000],
        ["LinkedIn", 4000],
        ["Facebook", 3000],
        ["Twitter / X", 3000],
        ["YouTube Shorts", 4000],
        ["Pinterest", 2500],
        ["Threads", 2000],
      ]),
      group("Posting frequency", "one", [
        ["2 posts/week (8/month)", 5000],
        ["4 posts/week (16/month)", 10000, undefined, "Popular"],
        ["6 posts/week (24/month)", 15000],
        ["Daily (30/month)", 22000],
      ]),
      group(
        "Content formats",
        "any",
        [
          ["Carousel / multi-image posts", 2500],
          ["Stories (4/week)", 3000],
          ["Reels / short videos (2/month)", 8000],
          ["Reels / short videos (4/month)", 16000],
          ["Infographics (2/month)", 4000],
        ],
        { note: "Reels include editing, captions/subtitles, basic transitions and CTA. Client footage is needed unless video production is quoted separately." },
      ),
      group(
        "Community management",
        "any",
        [
          ["Weekdays (Mon–Fri)", 5000],
          ["7 days/week", 9000],
        ],
        { note: "Complex customer support, complaints, refunds and order queries are handled by the client." },
      ),
      group("Strategy & extras", "any", [
        ["Monthly growth & strategy session", 3000, undefined, "Recommended"],
        ["Paid social creative (2 ad concepts)", 10000, "Ad spend and media buying are billed separately"],
        ["Monthly analytics report", 2000],
      ]),
    ],
  },
];

/** Social media contract length: months → discount on the monthly fee, in percent. */
export const SOCIAL_CONTRACTS: { months: number; label: string; discountPercent: number; badge?: string }[] = [
  { months: 1, label: "Month-to-month", discountPercent: 0 },
  { months: 3, label: "3 months", discountPercent: 5, badge: "Popular" },
  { months: 6, label: "6 months", discountPercent: 10 },
  { months: 12, label: "12 months", discountPercent: 15, badge: "Best value" },
];

/** Studio Bundle: a standard engagement per service, and the discount for buying several. */
export const BUNDLE = {
  standard: [
    { id: "websites", label: "Website", detail: "Standard 11–20 page custom site", price: 63000 },
    { id: "brand", label: "Brand Identity", detail: "3 concepts + full guidelines + collateral", price: 45000 },
    { id: "software", label: "Software Solution", detail: "Multi-feature web app with admin panel", price: 125000 },
    { id: "automations", label: "Automations", detail: "3–6 connected workflows with AI steps", price: 50000 },
    { id: "photography", label: "Photography", detail: "Full-day shoot + 60 edited photos", price: 45000 },
    { id: "videography", label: "Videography", detail: "90-sec brand reel + 1 shoot day + grade", price: 55000 },
    { id: "social", label: "Social Media", detail: "3 platforms + 16 posts/mo + reels", price: 42000 },
  ] as { id: ServiceId; label: string; detail: string; price: number }[],
  /** number of services → discount percent (5 or more = the last step) */
  steps: [
    { services: 2, discountPercent: 5 },
    { services: 3, discountPercent: 10 },
    { services: 4, discountPercent: 15 },
    { services: 5, discountPercent: 20 },
  ],
};

/** The bundle discount for buying `n` different services, in percent. */
export function bundleDiscountFor(n: number, steps = BUNDLE.steps) {
  let pct = 0;
  for (const s of [...steps].sort((a, b) => a.services - b.services)) if (n >= s.services) pct = s.discountPercent;
  return pct;
}

/* ── Vritta ─────────────────────────────────────────────────────────────── */

export type VrittaSegment = "college" | "school";
export type VrittaEdition = "essential" | "professional" | "institutional";
export type VrittaBilling = "monthly" | "annual" | "perpetual";

export const VRITTA = {
  name: "Vritta",
  line: "A departmental activity record for educational institutions — that produces the institution's newsletter as a by-product.",
  editions: [
    { id: "essential", name: "Essential", roman: "I", support: "2 working days", summary: "One institution-wide publication a month, collected from every department." },
    { id: "professional", name: "Professional", roman: "II", support: "1 working day", summary: "Every department gets its own monthly issue; the institution edition curates from them.", badge: "Most adopted" },
    { id: "institutional", name: "Institutional", roman: "III", support: "4 working hours", summary: "The record as accreditation evidence (NAAC / NBA), across a whole campus or several." },
  ] as { id: VrittaEdition; name: string; roman: string; support: string; summary: string; badge?: string }[],
  /** licence fee by segment and edition; null = not offered */
  rates: {
    college: {
      essential: { monthly: 12500, annual: 125000, perpetual: 500000, amc: 100000 },
      professional: { monthly: 19500, annual: 195000, perpetual: 780000, amc: 156000 },
      institutional: { monthly: 34500, annual: 345000, perpetual: 1380000, amc: 276000 },
    },
    school: {
      essential: { monthly: 6500, annual: 65000, perpetual: 260000, amc: 52000 },
      professional: { monthly: 11500, annual: 115000, perpetual: 460000, amc: 92000 },
      institutional: null,
    },
  } as Record<VrittaSegment, Record<VrittaEdition, { monthly: number; annual: number; perpetual: number; amc: number } | null>>,
  oneTime: [
    { id: "impl-school", label: "Implementation — School", detail: "Deployment, branding, masthead, department roster, template pass, remote training", price: 35000 },
    { id: "impl-college", label: "Implementation — College", detail: "As school, plus cell and committee configuration and a print proof with the institution's printer", price: 75000 },
    { id: "impl-institutional", label: "Implementation — Institutional", detail: "As college, plus criterion mapping workshop with the IQAC and multi-campus setup", price: 150000 },
    { id: "onsite-week", label: "On-site training week", detail: "Five consecutive working days on campus. Travel, stay and local transport at actuals.", price: 85000 },
  ],
  /** each further institution under the same trust pays this share of the licence fee, in percent */
  groupLicencePercent: 55,
  /** maintenance on a perpetual licence, per year from year 2, as a percent of the perpetual fee */
  amcPercent: 20,
  hosting: [
    { id: "managed", label: "Managed", detail: "FrameMind hosts and operates it. Included in the licence fee. Not available with a perpetual licence." },
    { id: "institution-cloud", label: "Institution Cloud", detail: "The institution's own managed database and hosting (approx. ₹45,000/year to the provider, billed in USD)." },
    { id: "on-campus", label: "On Campus", detail: "The institution's own server and network. Nil recurring cost beyond existing infrastructure." },
  ],
  pilotNote: "Monthly billing is for pilots: a three-month paid pilot converting to annual, with the pilot fee credited in full against the first annual invoice.",
  goLiveWeeks: 4,
  plan: [
    { week: "Week 1", title: "Environment & identity", detail: "Deployment, branding, masthead, department roster loaded and access links issued." },
    { week: "Week 2", title: "Template & calendar", detail: "Page structure and binding fixed, sections allocated, publication calendar and deadlines configured." },
    { week: "Week 3", title: "Training", detail: "Coordinators on submission, editors on composition and export, administrators on the workroom." },
    { week: "Week 4", title: "First issue & print proof", detail: "A live issue composed end to end, exported and proofed with the institution's printer. Admin docs handed over." },
  ],
};

/* ── 1:1 AI Coaching ────────────────────────────────────────────────────── */

export type CoachingTrack = "10-20" | "21-35" | "36-60";

export const COACHING = {
  name: "1:1 AI Coaching",
  line: "Learn AI completely, in 90 days, starting from zero — always 1:1, built around the learner's profession.",
  days: 90,
  tracks: [
    { id: "10-20", label: "Ages 10–20", who: "Students" },
    { id: "21-35", label: "Ages 21–35", who: "Early-career professionals, freelancers and founders" },
    { id: "36-60", label: "Ages 36–60", who: "Working professionals & entrepreneurs" },
  ] as { id: CoachingTrack; label: string; who: string }[],
  modes: [
    { id: "online", label: "Online", detail: "1-on-1 live video sessions (Google Meet or Zoom), recordings shared after every session, WhatsApp/email support between sessions." },
    { id: "offline", label: "Offline", detail: "In-person coaching at a FrameMind venue or at the learner's home/office (location-dependent). Printed resources and session notes." },
  ],
  /** fees are not published on the website ("Get a custom quote"): set them in HQ → Rate Card */
  fees: { online: 0, offline: 0 },
};

/* ── Commercial terms, as the studio's site states them ─────────────────── */

export const TERMS = {
  gstPercent: 18,
  /** the usual split: 50% to start, 50% on delivery (larger projects: more milestones) */
  defaultMilestones: [
    { label: "Advance — to start", percent: 50 },
    { label: "On delivery", percent: 50 },
  ],
  validityDays: 15,
  revisionRounds: 2,
  revisionPolicy: "Each design stage includes 2 rounds of revisions. Major scope changes or new pages added after sign-off are quoted separately.",
  clientResponsibilities: "The client provides all text content, images, logos and brand assets before work begins. Delays in providing content may affect the delivery timeline.",
  handoff: "All source files, documentation and a walkthrough call. Nothing is locked behind us — the client owns everything we build.",
  pricesFinal: "These are accurate estimates based on the selections. Final pricing is confirmed after a 20-minute discovery call where we align on exact scope.",
  timelines: "A focused website or brand identity runs 3–6 weeks. Software projects range from 6 to 16 weeks. Timelines are set before work starts.",
  international: "We work with clients internationally. Pricing is INR-based; international payments are by bank transfer or Wise.",
  process: [
    { title: "Tell us what you're building", detail: "A 20-minute call. A direct conversation about what's needed and whether we're the right fit." },
    { title: "We scope it honestly", detail: "A clear scope, timeline and price. No vague retainers, no hidden costs." },
    { title: "We build — you stay in the loop", detail: "Daily or weekly updates depending on project length." },
    { title: "Shipped. Then supported.", detail: "Handover, training and follow-up — so the work actually gets used." },
  ],
};

export const serviceById = (id: string) => SERVICES.find((s) => s.id === id);
export const SERVICE_OPTIONS = SERVICES.map((s) => ({ value: s.id, label: s.name }));
