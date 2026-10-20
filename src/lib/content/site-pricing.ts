/**
 * The studio's published price list: every service, group and option of the website's pricing configurator, exactly
 * as first published, revised October 2026 against Indian 2026 market pricing for a small studio. It is the starting rate card: HQ → Money → Rate Card begins from it (src/lib/content/
 * catalog.ts derives from this file), and once the founders save their own rate card the website shows that instead.
 */

export type ServiceId = "websites" | "brand" | "software" | "automations" | "photography" | "videography" | "social" | "bundle";

export interface Option {
  id: string;
  label: string;
  desc?: string;
  price: number;
  isBase?: boolean;
  tag?: string;
  unit?: string;
  discountPct?: number;
}

export interface Group {
  id: string;
  title: string;
  subtitle?: string;
  note?: string;
  type: "radio" | "checkbox";
  isDiscount?: boolean;
  /** part of the core spec: when a ready package (the group with id "package") is chosen, this group is hidden and not charged */
  core?: boolean;
  options: Option[];
}

export interface ServiceNote {
  title: string;
  content: string | string[];
}

export interface ServiceDef {
  id: ServiceId;
  name: string;
  tabName?: string;
  /** a lucide-react icon name */
  icon: string;
  unit: "project" | "month";
  description: string;
  groups: Group[];
  serviceNotes?: ServiceNote[];
}

export const WEBSITE_SERVICES: ServiceDef[] = [
  {
    id: "websites",
    name: "Websites",
    icon: "Globe",
    unit: "project",
    description: "A fully custom website built to your business — not a template. Every page, feature, and integration scoped and priced transparently.",
    groups: [
      {
        id: "pages", title: "How Many Pages?",
        subtitle: "Count every distinct page — home, about, services, contact, each portfolio or blog item, etc.",
        note: "Pages that share one layout (e.g. 10 blog posts) are built once from a template. Popups and repeated sections don't count as pages. Copywriting and moving content from an old site are not included unless added.",
        type: "radio",
        options: [
          { id: "p0", label: "Single landing page", desc: "One long scrolling page with an enquiry form", price: 12000, isBase: true },
          { id: "p1", label: "2–5 pages", desc: "Home, about, services, contact and similar", price: 20000, isBase: true },
          { id: "p2", label: "6–10 pages", desc: "Adds team, portfolio, blog, gallery", price: 35000, isBase: true, tag: "Popular" },
          { id: "p3", label: "11–20 pages", desc: "Full site with multiple sections", price: 60000, isBase: true },
          { id: "p4", label: "21–30 pages", desc: "Large business or directory-style site", price: 90000, isBase: true },
          { id: "p5", label: "30+ pages", desc: "Starting price — confirmed after a sitemap review", price: 130000, isBase: true },
        ],
      },
      {
        id: "design", title: "Design Approach",
        subtitle: "All options use your brand colours, fonts and assets. The difference is depth of custom visual design.",
        type: "radio",
        options: [
          { id: "d1", label: "Clean & professional", desc: "Custom layout in your colours and fonts, built from our proven section patterns — no bought templates", price: 0 },
          { id: "d2", label: "Fully custom UI design", desc: "Every page designed from scratch in Figma first, with its own components", price: 18000, tag: "Popular" },
          { id: "d3", label: "Premium custom + motion", desc: "Fully custom design plus scroll effects, transitions and interactions", price: 35000 },
        ],
      },
      {
        id: "cms", title: "Content Management",
        subtitle: "Choose whether your team can update content without a developer after launch.",
        note: "CMS training (30 min walkthrough) is included with WordPress/Webflow and Custom CMS options.",
        type: "radio",
        options: [
          { id: "c1", label: "No CMS needed", desc: "Static or developer-managed content", price: 0 },
          { id: "c2", label: "Edit-it-yourself CMS", desc: "Change text, images and blog posts yourself (WordPress, Webflow or Sanity) — up to 3 content types", price: 10000 },
          { id: "c3", label: "Custom CMS", desc: "Built for your own content types and workflow — starting price", price: 30000 },
        ],
      },
      {
        id: "features", title: "Features & Functionality",
        subtitle: "Select every feature you want on the site. Each is built and tested individually.",
        note: "Payment gateway and e-commerce features require the client to have active accounts with the relevant payment provider (e.g. Razorpay). Setup fees charged by third-party providers are not included.",
        type: "checkbox",
        options: [
          { id: "f1", label: "Contact / enquiry form", price: 2000 },
          { id: "f2", label: "Blog or news section", price: 6000 },
          { id: "f3", label: "WhatsApp click-to-chat", price: 2000 },
          { id: "f4", label: "Live chat widget", price: 3000 },
          { id: "f5", label: "Payment gateway", price: 10000 },
          { id: "f6", label: "Booking / appointment system", price: 15000 },
          { id: "f7", label: "E-commerce — basic store", price: 30000 },
          { id: "f8", label: "E-commerce — advanced + inventory", price: 60000, tag: "Advanced" },
          { id: "f9", label: "Role-based admin dashboard", price: 25000 },
          { id: "f10", label: "AI chatbot", desc: "Answers from your own content; AI usage fees are billed at cost", price: 20000 },
          { id: "f11", label: "Multi-language support", price: 8000, unit: "/language" },
          { id: "f12", label: "Member login / gated area", price: 12000 },
        ],
      },
      {
        id: "seo", title: "SEO & Performance",
        subtitle: "Improve how your site is found and how fast it loads.",
        note: "SEO setup is a one-time technical implementation. Ongoing keyword strategy, link building and content SEO are separate services.",
        type: "checkbox",
        options: [
          { id: "s1", label: "Basic on-page SEO", desc: "Meta tags, sitemap, robots.txt", price: 5000 },
          { id: "s2", label: "Technical SEO + structured data", price: 10000, tag: "Recommended" },
          { id: "s3", label: "Core Web Vitals optimisation", price: 8000 },
          { id: "s4", label: "Analytics + Search Console setup", price: 3000 },
        ],
      },
      {
        id: "support", title: "Post-Launch Support",
        subtitle: "Every site comes with a 30-day bug-fix warranty. A care plan adds updates, backups and small changes after that.",
        note: "The warranty fixes anything that doesn't work as agreed. It doesn't cover new features, changes made by others or outages of hosting and third-party services. Unused care hours don't carry over.",
        type: "radio",
        options: [
          { id: "sp0", label: "30-day warranty only", desc: "Bug fixes for 30 days after launch — included", price: 0 },
          { id: "sp1", label: "3-month care plan", desc: "Updates, backups, uptime checks and up to 2 hours of small changes a month", price: 9000 },
          { id: "sp2", label: "6-month care plan", desc: "Same as above, for 6 months", price: 16000, tag: "Popular" },
          { id: "sp3", label: "12-month care plan", desc: "Same as above, for a year, with priority replies", price: 28000 },
        ],
      },
    ],
    serviceNotes: [
      {
        title: "What's Included",
        content: ["Custom design (no templates)", "Responsive layout for all screen sizes", "Cross-browser testing", "Domain connection and deployment", "Basic SEO-ready structure", "30-min handover walkthrough"],
      },
      {
        title: "Revision Policy",
        content: "Each design stage includes 2 rounds of revisions. Major scope changes or new pages added after sign-off will be quoted separately.",
      },
      {
        title: "Client Responsibilities",
        content: "Client provides all text content, images, logos and brand assets before work begins. Delays in providing content may affect the delivery timeline.",
      },
    ],
  },
  {
    id: "brand",
    name: "Brand Identity",
    icon: "Palette",
    unit: "project",
    description: "A complete visual identity built from strategy — logo, colour, typography, guidelines and the assets your team will actually use.",
    groups: [
      {
        id: "logo", title: "Logo Concepts",
        subtitle: "Each concept is a fully distinct creative direction — not variations of the same idea.",
        note: "Each concept includes 2 rounds of revisions. You select one direction to refine into the final logo. Additional concepts or rounds are quoted separately.",
        type: "radio",
        options: [
          { id: "l1", label: "2 concepts", desc: "Two distinct creative directions — you choose one to refine", price: 12000, isBase: true },
          { id: "l2", label: "3 concepts", desc: "More direction to choose from", price: 20000, isBase: true, tag: "Popular" },
          { id: "l3", label: "5 concepts", desc: "Full exploration across styles", price: 30000, isBase: true },
        ],
      },
      {
        id: "guidelines", title: "Brand Guidelines",
        subtitle: "How your brand should look, sound and be applied — documented for your team and partners.",
        note: "Delivered as a PDF. Editable source files (Figma/Illustrator) are included with Standard and Comprehensive options.",
        type: "radio",
        options: [
          { id: "g1", label: "Quick-reference sheet", desc: "Colours, fonts and logo usage — 1 page", price: 0 },
          { id: "g2", label: "Standard (10–15 pages)", desc: "Full system with rules and examples", price: 18000, tag: "Popular" },
          { id: "g3", label: "Comprehensive (25+ pages)", desc: "Tone, imagery, iconography and strategy", price: 40000 },
        ],
      },
      {
        id: "collateral", title: "Collateral & Templates",
        subtitle: "Pick the branded materials your business actually uses and hands to clients.",
        note: "All templates are delivered print-ready and in editable format (Canva, Google Slides, or Figma depending on the asset).",
        type: "checkbox",
        options: [
          { id: "co1", label: "Business card design", price: 3000 },
          { id: "co2", label: "Letterhead & envelope", price: 3000 },
          { id: "co3", label: "Email signature", price: 2000 },
          { id: "co4", label: "Social media profile + cover templates (5 platforms)", price: 6000, tag: "Popular" },
          { id: "co5", label: "Presentation deck template (10 slides)", price: 8000 },
          { id: "co6", label: "One-pager / brochure template", price: 6000 },
          { id: "co7", label: "Invoice / proposal template", price: 4000 },
        ],
      },
      {
        id: "advanced", title: "Advanced Brand Assets",
        subtitle: "For brands that need a complete design system — not just a logo.",
        type: "checkbox",
        options: [
          { id: "a1", label: "Custom icon set (10 icons)", price: 12000 },
          { id: "a2", label: "Custom icon set (20 icons)", price: 22000 },
          { id: "a3", label: "Figma component library", desc: "Reusable UI components built to your brand", price: 15000, tag: "Recommended" },
          { id: "a4", label: "Brand photography direction guide", desc: "Style, mood, composition rules for shoots", price: 8000 },
          { id: "a5", label: "Motion & animation principles", desc: "How your brand moves — transitions, timing", price: 10000 },
          { id: "a6", label: "Brand in-action mockup sheet", desc: "Realistic mockups showing brand applied", price: 5000 },
        ],
      },
      {
        id: "strategy", title: "Brand Strategy",
        subtitle: "Especially valuable for new brands, rebrands or businesses entering a new market.",
        note: "Strategy work is conducted via structured workshops and delivered as written documents. It forms the foundation for all design decisions that follow.",
        type: "checkbox",
        options: [
          { id: "st1", label: "Brand positioning workshop", desc: "Define who you are, who you serve and why you win", price: 15000 },
          { id: "st2", label: "Naming & tagline development", desc: "Name exploration, shortlisting and rationale", price: 12000 },
          { id: "st3", label: "Brand narrative — story, mission, values", price: 10000 },
          { id: "st4", label: "Competitor landscape analysis", desc: "How your category looks and where you fit", price: 8000 },
        ],
      },
    ],
    serviceNotes: [
      {
        title: "What's Included",
        content: ["Original logo files (SVG, PNG, PDF)", "Colour palette with HEX, RGB and CMYK codes", "Typography selection and pairing", "Brand guidelines document", "Final asset pack with all variations"],
      },
      {
        title: "Revision Policy",
        content: "Each design stage includes 2 rounds of revisions. Selecting a different concept after approval or requesting major restyle changes after sign-off will be quoted separately.",
      },
      {
        title: "Client Responsibilities",
        content: "Client provides a brand brief, reference examples, any existing assets and timely feedback at each review stage. Delays in feedback affect delivery timelines.",
      },
    ],
  },
  {
    id: "software",
    name: "Software Solutions",
    icon: "Code2",
    unit: "project",
    description: "Custom software built for your exact business process — from a focused MVP to a full-scale platform. Scoped, built and delivered in stages.",
    groups: [
      {
        id: "apptype", title: "What Are We Building?",
        subtitle: "Each price is the full starting price for that kind of product — design, build, testing and launch included.",
        note: "Every build includes discovery, UI design, login, database, deployment, backups and testing. The price is fixed once the scope is signed off after discovery.",
        type: "radio",
        options: [
          { id: "at4", label: "Internal tool / dashboard", desc: "For your team — up to ~8 screens, login, admin and reports", price: 60000, isBase: true },
          { id: "at1", label: "Web app MVP", desc: "One core workflow, built to launch fast and learn", price: 75000, isBase: true },
          { id: "at5", label: "Business web app", desc: "Several workflows, user roles, admin panel and notifications", price: 150000, isBase: true, tag: "Most Common" },
          { id: "at2", label: "Mobile app MVP (Android + iOS)", desc: "Cross-platform app with its backend — one core workflow", price: 150000, isBase: true },
          { id: "at3", label: "Web + mobile business product", desc: "Shared backend, web admin and a mobile app for your users", price: 275000, isBase: true },
          { id: "at6", label: "Advanced / scalable platform", desc: "Complex business logic, many integrations, high data volume, expanded testing", price: 400000, isBase: true },
          { id: "at7", label: "Enterprise platform", desc: "Multi-tenant, SSO, audit trails, SLAs — starts with a paid discovery, then a fixed quote", price: 600000, isBase: true },
        ],
      },
      {
        id: "corefeatures", title: "Core Features",
        subtitle: "Extra features on top of the product you chose. Login is always included; the business app and above already include roles, admin panel and notifications.",
        type: "checkbox",
        options: [
          { id: "cf2", label: "User roles & permissions", price: 10000 },
          { id: "cf3", label: "Admin panel", desc: "Manage users, content and settings", price: 15000, tag: "Recommended" },
          { id: "cf4", label: "File uploads & storage", price: 5000 },
          { id: "cf5", label: "Search & advanced filters", price: 8000 },
          { id: "cf6", label: "Email + push notifications", price: 8000 },
          { id: "cf7", label: "Real-time updates (live data)", price: 14000 },
          { id: "cf8", label: "Data export (CSV / PDF)", price: 5000 },
          { id: "cf9", label: "Custom analytics dashboard", price: 14000 },
        ],
      },
      {
        id: "integrations", title: "Integrations",
        subtitle: "Connect your software with the tools and services your business already uses.",
        note: "Third-party API access, credentials and accounts must be provided by the client. API subscription or transaction fees charged by providers are not included.",
        type: "checkbox",
        options: [
          { id: "in1", label: "Payment gateway (Razorpay, Stripe)", price: 10000 },
          { id: "in2", label: "SMS / WhatsApp API", price: 6000 },
          { id: "in3", label: "Email service (SendGrid, etc.)", price: 4000 },
          { id: "in4", label: "Maps / geolocation", price: 5000 },
          { id: "in5", label: "Social login (Google, Facebook)", price: 5000 },
          { id: "in6", label: "CRM integration", price: 8000 },
          { id: "in7", label: "AI features", desc: "Chat, summarise, classify or extract — within an agreed scope. AI usage fees are billed at cost", price: 30000 },
          { id: "in8", label: "Custom third-party API", price: 8000, unit: "/integration" },
        ],
      },
      {
        id: "infra", title: "Infrastructure & Quality",
        subtitle: "Production-grade setup for reliability, speed and maintainability.",
        note: "Hosting and cloud infrastructure costs (AWS, GCP, Vercel, etc.) are not included and are billed directly by the provider to the client.",
        type: "checkbox",
        options: [
          { id: "inf1", label: "CI/CD deployment pipeline", desc: "Automated builds and deployments", price: 8000 },
          { id: "inf2", label: "Automated test coverage", desc: "Unit and integration tests for critical paths", price: 12000, tag: "Recommended" },
          { id: "inf3", label: "Performance & load testing", price: 10000 },
          { id: "inf4", label: "Multi-language (i18n) support", price: 8000 },
        ],
      },
      {
        id: "softsupport", title: "Post-Launch Support",
        subtitle: "Every build comes with a 30-day bug-fix warranty. A support plan adds monitoring and small changes after that.",
        note: "The warranty fixes anything that doesn't work as agreed. New features, major changes and new integrations after launch are quoted separately. Unused hours don't carry over.",
        type: "radio",
        options: [
          { id: "ss0", label: "30-day warranty only", desc: "Bug fixes for 30 days after launch — included", price: 0 },
          { id: "ss1", label: "3-month support", desc: "Monitoring, bug fixes and up to 6 hours of small changes a month", price: 24000 },
          { id: "ss2", label: "6-month support", desc: "Same as above, for 6 months", price: 42000, tag: "Popular" },
          { id: "ss3", label: "12-month support", desc: "Same as above, for a year, with priority replies", price: 75000 },
        ],
      },
    ],
    serviceNotes: [
      {
        title: "What's Included",
        content: ["Discovery and scope definition session", "UI/UX design for all screens", "Frontend and backend development", "Database design and setup", "Testing and QA before launch", "Deployment to your chosen hosting", "Handover documentation"],
      },
      {
        title: "Revision Policy",
        content: "Design revisions follow the 2-round policy per stage. Development changes after a feature is approved and built will be assessed and quoted based on impact to scope and timeline.",
      },
      {
        title: "Client Responsibilities",
        content: "Client provides all required API keys, credentials, third-party accounts and content. Timely approvals at each milestone are required to maintain the delivery schedule. Delays from the client side may affect the timeline.",
      },
    ],
  },
  {
    id: "automations",
    name: "Automations",
    icon: "Zap",
    unit: "project",
    description: "Eliminate repetitive manual work — connect your tools, automate your processes and let your business run smarter.",
    groups: [
      {
        id: "workflows", title: "Number of Workflows",
        subtitle: "Each workflow is one automated process with a defined trigger and outcome.",
        note: "A workflow is defined as one trigger → action chain. A lead form submission triggering an email + CRM entry + Slack alert = 1 workflow with 3 actions.",
        type: "radio",
        options: [
          { id: "w1", label: "1 workflow", desc: "One trigger and its steps, tested and handed over", price: 10000, isBase: true },
          { id: "w2", label: "3 workflows", desc: "A connected set for a department", price: 25000, isBase: true, tag: "Popular" },
          { id: "w3", label: "6 workflows", desc: "Covers most core operations", price: 45000, isBase: true },
          { id: "w4", label: "10+ workflows", desc: "Starting price — scoped after mapping your processes", price: 70000, isBase: true },
        ],
      },
      {
        id: "complexity", title: "Workflow Complexity",
        subtitle: "How much logic does each workflow need to handle?",
        type: "radio",
        options: [
          { id: "wc1", label: "Simple if/then logic", desc: "Trigger → single action, no conditions", price: 0 },
          { id: "wc2", label: "Multi-step with conditions", desc: "Branching paths based on data or status", price: 5000, tag: "Most Common" },
          { id: "wc3", label: "Complex branching + loops", desc: "Multiple conditions, retries and sequences", price: 12000 },
          { id: "wc4", label: "AI-assisted decision steps", desc: "LLM or ML logic embedded in the flow", price: 22000 },
        ],
      },
      {
        id: "platforms", title: "Platforms to Connect",
        subtitle: "Select every tool that needs to be part of your automation.",
        note: "Active accounts and API access for each platform must be provided by the client. Subscription fees for automation tools (Make, Zapier, n8n etc.) are not included.",
        type: "checkbox",
        options: [
          { id: "pl1", label: "Gmail / Outlook", price: 2000 },
          { id: "pl2", label: "WhatsApp / SMS (Twilio etc.)", price: 3000 },
          { id: "pl3", label: "Google Sheets / Airtable", price: 2000 },
          { id: "pl4", label: "CRM (HubSpot, Salesforce, Zoho)", price: 4000 },
          { id: "pl5", label: "Payment systems", price: 3000 },
          { id: "pl6", label: "Notion / Slack / Teams", price: 2000 },
          { id: "pl7", label: "Custom API / webhook", price: 5000 },
          { id: "pl8", label: "ERP or legacy system", desc: "May require additional scoping", price: 8000 },
        ],
      },
      {
        id: "aifeatures", title: "Advanced & AI Features",
        subtitle: "Add intelligence and monitoring to your automation stack.",
        type: "checkbox",
        options: [
          { id: "av1", label: "Automated reports (daily/weekly)", desc: "Scheduled reports sent to email or Slack", price: 6000 },
          { id: "av2", label: "AI auto-classification", desc: "Categorise leads, tickets or data automatically", price: 10000 },
          { id: "av3", label: "AI auto-response drafting", desc: "Draft replies to emails or messages using AI", price: 14000 },
          { id: "av4", label: "AI agent (defined tasks)", desc: "Acts only within agreed permissions, with human approval steps, logging and failure alerts", price: 30000 },
          { id: "av5", label: "Error monitoring + failure alerts", desc: "Get notified instantly when a workflow fails", price: 4000, tag: "Recommended" },
          { id: "av6", label: "Uptime monitoring + auto-restart", price: 5000 },
        ],
      },
    ],
    serviceNotes: [
      {
        title: "What's Included",
        content: ["Workflow mapping and planning session", "Build and configuration of all automations", "Testing across all trigger scenarios", "Documentation of each workflow", "Handover walkthrough with your team"],
      },
      {
        title: "Revision Policy",
        content: "Each workflow includes 2 rounds of adjustments during build. Logic changes or new trigger conditions requested after sign-off will be assessed and quoted based on complexity.",
      },
      {
        title: "Client Responsibilities",
        content: "Client provides access to all required platforms and APIs. Ongoing subscription costs for automation tools and third-party services are the client's responsibility. Accurate test data should be available for testing workflows.",
      },
    ],
  },
  {
    id: "photography",
    name: "Photography",
    icon: "Camera",
    unit: "project",
    description: "Professional photography for brands, products, events, teams and spaces — planned, directed and edited to industry standard. Configure every layer of your shoot.",
    groups: [
      {
        id: "package", title: "Start with a ready package",
        subtitle: "Fixed price for everything listed: photographer, camera and lighting kit, travel within 25 km, and the edited photos.",
        note: "A package covers the choices it lists, so those are hidden while it is selected. Add-ons below stay available and are charged on top.",
        type: "radio",
        options: [
          { id: "pk1", label: "Headshots / small product set", desc: "2 hours · 1 location · 15 retouched photos", price: 8000, isBase: true },
          { id: "pk2", label: "Half-day brand shoot", desc: "4 hours · 1 location · 30 retouched photos", price: 15000, isBase: true, tag: "Popular" },
          { id: "pk3", label: "Full-day commercial shoot", desc: "7–8 hours · up to 2 locations · 60 retouched photos", price: 28000, isBase: true },
          { id: "pk4", label: "Event coverage — half day", desc: "Up to 4 hours · 150 colour-corrected photos incl. 20 retouched highlights", price: 15000, isBase: true },
          { id: "pk5", label: "Event coverage — full day", desc: "Up to 8 hours · 300 colour-corrected photos incl. 40 retouched highlights", price: 25000, isBase: true },
          { id: "pk0", label: "Build my own", desc: "Choose each option below yourself", price: 0, isBase: true },
        ],
      },
      {
        id: "shoottype", core: true,
        title: "What Are We Shooting?",
        subtitle: "Select the primary shoot category. Each type determines equipment, lighting setup, and preparation required.",
        note: "Multiple categories in one shoot are supported — select all that apply and we will plan the session to cover each. Complex multi-category shoots may require additional session time.",
        type: "checkbox",
        options: [
          { id: "st1", label: "Product / E-commerce", desc: "Clean white-background or lifestyle shots for online store, catalogues or packaging", price: 0 },
          { id: "st2", label: "Portraits & Headshots", desc: "Individual or group professional portraits — team pages, LinkedIn, press kits", price: 0 },
          { id: "st3", label: "Brand & Lifestyle", desc: "Behind-the-scenes, in-context brand moments, founder stories, culture documentation", price: 3000 },
          { id: "st4", label: "Office / Workspace / Architecture", desc: "Interior and exterior spaces — offices, showrooms, cafes, co-working spaces", price: 0 },
          { id: "st5", label: "Food & Beverage", desc: "Styled food, plating, menu photography — requires additional styling time and props", price: 5000 },
          { id: "st6", label: "Event Coverage", desc: "Candid and posed documentation of corporate events, launches, workshops, ceremonies", price: 4000 },
          { id: "st7", label: "School / Educational Events", desc: "Student activities, award days, sports, campus life — includes crowd and candid coverage", price: 3000 },
          { id: "st8", label: "Real Estate / Property", desc: "Interiors, exteriors and amenities for residential or commercial listings", price: 3000 },
          { id: "st9", label: "Fashion & Apparel", desc: "On-model or flat-lay garments — requires wardrobe coordination and styling time", price: 5000 },
        ],
      },
      {
        id: "session", core: true,
        title: "Shoot Session Length",
        subtitle: "Shoot time starts on arrival at location and includes setup, shooting and pack-down.",
        note: "Travel within 25 km of base location is included. Outstation shoots require travel and accommodation to be arranged and covered by the client. Permits, venue access and parking are the client's responsibility.",
        type: "radio",
        options: [
          { id: "sl1", label: "2 hours", desc: "Quick headshot session or small product set (up to ~20 hero shots)", price: 6000, isBase: true },
          { id: "sl2", label: "Half day — 4 hours", desc: "Products, portraits, or a single location and concept", price: 10000, isBase: true },
          { id: "sl3", label: "Full day — 7 hours", desc: "Brand shoot covering team, products and space — most shoots land here", price: 20000, isBase: true, tag: "Most Common" },
          { id: "sl4", label: "2 shoot days", desc: "Campaign with multiple concepts, locations or talent groups", price: 38000, isBase: true },
          { id: "sl5", label: "3+ shoot days", desc: "Complete brand photography system or large-scale event", price: 55000, isBase: true },
        ],
      },
      {
        id: "locations", core: true,
        title: "Number of Locations",
        subtitle: "Each location switch adds transit, setup and lighting reset time.",
        type: "radio",
        options: [
          { id: "lc1", label: "1 location", desc: "All shots at one address", price: 0 },
          { id: "lc2", label: "2 locations", desc: "E.g. office + outdoor or studio + store", price: 4000 },
          { id: "lc3", label: "3–4 locations", desc: "Multi-venue campaign or brand story across sites", price: 10000 },
          { id: "lc4", label: "5+ locations", desc: "Full-city or regional shoot — requires dedicated planning session", price: 18000 },
        ],
      },
      {
        id: "deliverables", core: true,
        title: "Number of Edited Photos Delivered",
        subtitle: "All photos are professionally colour-corrected and retouched. Delivered as high-resolution JPEGs.",
        note: "Editing turnaround is 5–7 working days after the shoot. A curated gallery of selects is shared for approval before final delivery.",
        type: "radio",
        options: [
          { id: "dp1", label: "15 edited photos", desc: "Tight hero set — ideal for a 2-hour session", price: 3000 },
          { id: "dp2", label: "30 edited photos", desc: "Half-day output covering one or two subjects", price: 6000 },
          { id: "dp3", label: "60 edited photos", desc: "Full-day brand shoot — products, team and space", price: 11000, tag: "Popular" },
          { id: "dp4", label: "120 edited photos", desc: "Multi-concept campaign or event highlights set", price: 18000 },
          { id: "dp5", label: "250 edited photos", desc: "Large event, full catalogue or multi-day shoot", price: 28000 },
          { id: "dp6", label: "500+ edited photos", desc: "Complete event or annual shoot archive", price: 45000 },
        ],
      },
      {
        id: "editlevel", core: true,
        title: "Edit Level",
        subtitle: "Choose the depth of post-processing applied to each delivered photo.",
        note: "The edit level applies uniformly to all delivered photos. Mixed-level editing (e.g. advanced retouch for hero shots only) can be arranged — mention this in the brief.",
        type: "radio",
        options: [
          { id: "el1", label: "Standard — colour grade + crop", desc: "Exposure, white balance, colour correction and straightening. Clean, natural output.", price: 0 },
          { id: "el2", label: "Professional — retouch + grade", desc: "Standard edit plus skin smoothing, blemish removal, minor background cleanup. Publication-ready.", price: 4000, tag: "Recommended" },
          { id: "el3", label: "Advanced — compositing & manipulation", desc: "Background replacement, product isolation, complex retouching, object removal. Requires per-photo briefing.", price: 10000 },
        ],
      },
      {
        id: "outputformat",
        title: "Output Formats Required",
        subtitle: "Select every format you need delivered. All options are derived from the same edited masters.",
        type: "checkbox",
        options: [
          { id: "of1", label: "Web — optimised JPEG", desc: "sRGB, screen-ready, compressed for fast loading (default — always included)", price: 0 },
          { id: "of2", label: "Print-ready — high-res TIFF or PDF", desc: "300 DPI, CMYK or RGB, suitable for press and large-format print", price: 3000 },
          { id: "of3", label: "Social media crops", desc: "Square (1:1), portrait (4:5), story (9:16) — sized for Instagram, LinkedIn and Facebook", price: 2500 },
          { id: "of4", label: "E-commerce pack", desc: "White-background isolation, multiple angles formatted for Amazon, Flipkart or Shopify", price: 4000 },
          { id: "of5", label: "RAW files (.CR2/.ARW/.NEF)", desc: "Unedited originals of the delivered selects, for in-house processing", price: 5000 },
        ],
      },
      {
        id: "photopreproduction",
        title: "Pre-Production & Direction",
        subtitle: "Optional services to prepare the shoot for maximum output.",
        type: "checkbox",
        options: [
          { id: "pp1", label: "Mood board + visual brief", desc: "Reference compilation, colour direction and composition style guide prepared before shoot day", price: 4000 },
          { id: "pp2", label: "Full art direction on set", desc: "Dedicated director managing angles, expressions, composition and brand consistency throughout the shoot", price: 8000, tag: "Recommended" },
          { id: "pp3", label: "Shot list preparation", desc: "Detailed list of every required frame, angle and scene — eliminates guesswork on set", price: 2500 },
          { id: "pp4", label: "Prop sourcing & styling", desc: "We source, arrange and style props for product or lifestyle shoots. Client covers prop costs.", price: 6000 },
        ],
      },
      {
        id: "photoaddons",
        title: "Add-ons",
        subtitle: "Additional services that extend the value or convenience of the shoot.",
        type: "checkbox",
        options: [
          { id: "pa1", label: "Drone / aerial photography", desc: "Licensed drone operator — campus, property, event or landscape aerials", price: 14000 },
          { id: "pa2", label: "Same-day preview delivery", desc: "10–15 lightly edited selects delivered within hours of the shoot — for same-day social posting", price: 3500 },
          { id: "pa3", label: "Rush edit (2–3 working days)", desc: "Full edited gallery delivered in 2–3 working days instead of the standard 5–7", price: 4000 },
          { id: "pa4", label: "Printing coordination", desc: "We liaise with the printer, prepare print files and do a pre-press check", price: 3000 },
          { id: "pa5", label: "Usage rights — extended commercial licence", desc: "For large-scale advertising campaigns (billboard, national print, broadcast). Standard licence covers digital and web.", price: 8000 },
          { id: "pa6", label: "On-site instant prints", desc: "Portable printer on location — branded prints handed to attendees at events", price: 7000 },
        ],
      },
    ],
    serviceNotes: [
      {
        title: "What's Included",
        content: [
          "Pre-shoot brief and planning call",
          "Professional DSLR / mirrorless camera + lighting kit",
          "On-location direction and composition guidance",
          "Professional colour grading and editing to selected level",
          "High-resolution JPEG delivery via Google Drive or WeTransfer",
          "Full usage rights for all delivered images (digital and web)",
          "Online gallery for selection approval before final delivery",
        ],
      },
      {
        title: "Revision Policy",
        content: "Colour grade and editing style includes 1 round of revisions on the approved selects. Individual retouching adjustments (e.g. additional blemish removal, specific skin tone tweaks) are included within the selected edit level. Requests outside the agreed scope — such as full background replacement when basic retouch was selected — will be quoted separately.",
      },
      {
        title: "Client Responsibilities",
        content: "Client arranges the shoot location, required permits, props, wardrobe and all relevant personnel. Location must be accessible and ready at the agreed shoot start time. Subjects should arrive on time — delayed starts reduce the available shoot window within the booked session. Reschedules within 48 hours of the shoot may incur a ₹2,000 rescheduling fee.",
      },
    ],
  },
  {
    id: "videography",
    name: "Videography",
    icon: "Video",
    unit: "project",
    description: "Brand films, reels, event coverage, product videos and documentaries — shot, edited and delivered to broadcast standard. Configure every stage from pre-production to final delivery.",
    groups: [
      {
        id: "package", title: "Start with a ready package",
        subtitle: "Fixed price for everything listed: crew, camera, lights and audio kit, travel within 25 km, editing and 2 rounds of revisions.",
        note: "A package covers the choices it lists, so those are hidden while it is selected. Add-ons below stay available and are charged on top.",
        type: "radio",
        options: [
          { id: "pk1", label: "Social reel", desc: "Up to 2-hour shoot · one 30–60 s vertical reel · standard edit, colour correction, captions, licensed music", price: 15000, isBase: true },
          { id: "pk2", label: "Corporate video", desc: "Half-day shoot · one 1–2 min video + a 30 s vertical cut · standard edit, natural grade, music, subtitles", price: 40000, isBase: true, tag: "Popular" },
          { id: "pk3", label: "Brand film", desc: "Script & storyboard · full-day shoot · one 60–90 s film + 2 vertical cuts · cinematic edit and grade, sound design, music", price: 80000, isBase: true },
          { id: "pk0", label: "Build my own", desc: "Choose each option below yourself", price: 0, isBase: true },
        ],
      },
      {
        id: "videotype", core: true,
        title: "What Are We Producing?",
        subtitle: "Select the type of video. Each format has different production requirements, equipment and edit workflows.",
        note: "Multiple formats can be produced in one shoot. Select all that apply — we will plan the shoot to maximise output across formats.",
        type: "checkbox",
        options: [
          { id: "vt1", label: "Brand Film", desc: "Story-driven film about the company, founder or mission — designed to inspire and connect", price: 0 },
          { id: "vt2", label: "Social Media Reel", desc: "Short vertical or square video (15–90s) for Instagram, YouTube Shorts, LinkedIn, Facebook", price: 0 },
          { id: "vt3", label: "Product Demo / Explainer", desc: "Showcases features, how it works, or how to use a product — clear and conversion-focused", price: 0 },
          { id: "vt4", label: "Testimonial / Interview", desc: "On-camera client or team interview — scripted talking points, professional framing and lighting", price: 3000 },
          { id: "vt5", label: "Event Coverage", desc: "Candid and directed coverage of conferences, launches, workshops, ceremonies or exhibitions", price: 4000 },
          { id: "vt6", label: "School / Educational", desc: "Student activities, award days, cultural events, JOVE-style workshops — full campus documentation", price: 3000 },
          { id: "vt7", label: "Real Estate Walkthrough", desc: "Interior and exterior property video — flat or cinematic grade, with or without drone", price: 3000 },
          { id: "vt8", label: "Training / Educational Content", desc: "Step-by-step instructional or course video — clear framing, screen recording support", price: 0 },
          { id: "vt9", label: "Documentary / Long-form", desc: "Multi-interview, multi-location story-driven piece — extended pre-production and assembly required", price: 8000 },
        ],
      },
      {
        id: "shootdays", core: true,
        title: "Shoot Days",
        subtitle: "On-location production with camera, lights and crew. Includes setup and pack-down.",
        note: "Travel within 25 km of base location is included. Outstation shoots require travel and accommodation covered by the client. Shoot days run 7–8 hours on set — arrival 30 min before for setup.",
        type: "radio",
        options: [
          { id: "vs1", label: "Half day — 4 hours on set", desc: "Interviews, small product shoots, single-location reels", price: 10000, isBase: true },
          { id: "vs2", label: "Full day — 8 hours on set", desc: "Brand films, events, multi-scene shoots — most productions land here", price: 20000, isBase: true, tag: "Most Common" },
          { id: "vs3", label: "2 shoot days", desc: "Multi-location or multi-concept campaigns. Large events.", price: 38000, isBase: true },
          { id: "vs4", label: "3 shoot days", desc: "Documentaries, full brand content systems, multi-city shoots", price: 55000, isBase: true },
          { id: "vs5", label: "4+ shoot days", desc: "Large-scale productions. Scoped individually after a planning call.", price: 70000, isBase: true },
        ],
      },
      {
        id: "quantity", core: true,
        title: "Number of Finished Videos",
        subtitle: "How many complete, edited videos do you need delivered from this production?",
        note: "Additional videos from the same shoot are cheaper than separate shoots — footage captured in one session can be repurposed across multiple deliverables.",
        type: "radio",
        options: [
          { id: "vq1", label: "1 video", desc: "Single finished piece", price: 0 },
          { id: "vq2", label: "2–3 videos", desc: "E.g. main film + 2 reels from the same shoot", price: 12000, tag: "Popular" },
          { id: "vq3", label: "4–5 videos", desc: "Campaign set — hero film + platform cuts + teaser", price: 22000 },
          { id: "vq4", label: "6–10 videos", desc: "Full content library or testimonial series", price: 38000 },
          { id: "vq5", label: "10+ videos", desc: "Ongoing content system — priced per series after briefing", price: 60000 },
        ],
      },
      {
        id: "length", core: true,
        title: "Length per Finished Video",
        subtitle: "Length of each finished, edited video — not raw shoot duration.",
        note: "Each additional video in a series can have a different length. This selection reflects the primary deliverable. Shorter cuts of longer videos are priced under Platform Formats below.",
        type: "radio",
        options: [
          { id: "vl1", label: "Under 30 seconds", desc: "Story ad, quick reel, teaser", price: 6000, isBase: true },
          { id: "vl2", label: "30–60 seconds", desc: "Social reel, product highlight, testimonial clip", price: 10000, isBase: true },
          { id: "vl3", label: "60–90 seconds", desc: "Brand promo, Instagram feature, short case study", price: 15000, isBase: true, tag: "Most Common" },
          { id: "vl4", label: "2–4 minutes", desc: "Brand film, product demo, educational video", price: 24000, isBase: true },
          { id: "vl5", label: "5–8 minutes", desc: "Documentary short, detailed walkthrough, keynote film", price: 38000, isBase: true },
          { id: "vl6", label: "10–20 minutes", desc: "Training module, full event film, interview documentary", price: 55000, isBase: true },
          { id: "vl7", label: "20+ minutes", desc: "Long-form documentary or full event coverage — scoped after brief", price: 75000, isBase: true },
        ],
      },
      {
        id: "edittype", core: true,
        title: "Edit Style",
        subtitle: "Choose the editing approach. All edits include a rough cut for approval followed by final delivery.",
        note: "Each video includes 2 rounds of revisions after the first cut. Structural changes (reordering scenes, adding new footage) after round 2 are quoted separately.",
        type: "radio",
        options: [
          { id: "et1", label: "Basic cut — raw assembly", desc: "Footage synced, trimmed and exported. No music, titles, graphics or colour work — for raw event records or internal use.", price: 0 },
          { id: "et2", label: "Standard edit", desc: "Cuts, transitions, title cards, lower-thirds, background music synced to pacing. Professional and polished.", price: 6000, tag: "Popular" },
          { id: "et3", label: "Premium edit — motion graphics included", desc: "Custom animated titles, branded overlays, intro/outro sequence, dynamic transitions. Broadcast-ready.", price: 14000 },
          { id: "et4", label: "Cinematic edit — full post-production", desc: "Scene-driven storytelling, dramatic pacing, multi-layer audio design, custom motion graphics and full grade. Showcase-quality.", price: 24000 },
        ],
      },
      {
        id: "colourgrade", core: true,
        title: "Colour Grade",
        subtitle: "Applied to the final video after editing.",
        type: "radio",
        options: [
          { id: "cg1", label: "No grade — camera-native footage", desc: "Raw colour from the camera, normalised for consistency. Suitable for internal or quick-turnaround use.", price: 0 },
          { id: "cg2", label: "Natural grade", desc: "Balanced exposure, warm skin tones, consistent look across all scenes. Clean and professional.", price: 5000 },
          { id: "cg3", label: "Cinematic grade + custom LUT", desc: "Film-style grade with a custom LUT built to your brand palette. Rich, intentional, distinctive.", price: 12000, tag: "Recommended" },
        ],
      },
      {
        id: "audio",
        title: "Audio",
        subtitle: "Sound is half the impact. Select every audio element needed.",
        note: "Licensed music is royalty-free for digital use. Broadcast (TV/radio) sync licensing is a separate fee paid to the music library directly.",
        type: "checkbox",
        options: [
          { id: "au1", label: "Licensed background music", desc: "Royalty-free track selected to match tone and pacing — cleared for all digital platforms", price: 3000, tag: "Recommended" },
          { id: "au2", label: "Sound design", desc: "Custom ambient sounds, sfx, transitions and audio mixing for a full-produced feel", price: 6000 },
          { id: "au3", label: "Voice-over — script + professional recording", desc: "We write the script, record with a professional voice artist and sync to picture", price: 9000 },
          { id: "au4", label: "Voice-over — client recording only", desc: "Client provides the recording — we clean, compress and sync to picture", price: 3000 },
          { id: "au5", label: "Interview audio cleanup", desc: "Noise reduction, EQ and levelling for on-camera interview dialogue", price: 2500 },
          { id: "au6", label: "Subtitles / captions", desc: "Accurate subtitles synced to speech — burnt-in or as a separate SRT/VTT file", price: 3000 },
        ],
      },
      {
        id: "platformformats",
        title: "Platform-Specific Formats",
        subtitle: "Every platform has different aspect ratios and length rules. Select what you need — we prepare each from the edited master.",
        type: "checkbox",
        options: [
          { id: "pf1", label: "Landscape 16:9 — YouTube / website", desc: "1920×1080 or 4K — standard wide-screen for desktop and TV", price: 0 },
          { id: "pf2", label: "Vertical 9:16 — Instagram Reels / Shorts / Stories", desc: "1080×1920 — reframed or shot natively for mobile-first platforms", price: 3000 },
          { id: "pf3", label: "Square 1:1 — Instagram feed / Facebook", desc: "1080×1080 — platform-neutral format for feed posts", price: 2000 },
          { id: "pf4", label: "Short-form cut (15s)", desc: "15-second highlight cut of the main video — optimised for story ads and quick reels", price: 2500 },
          { id: "pf5", label: "Short-form cut (30s)", desc: "30-second highlight cut — for pre-roll ads, teasers and social previews", price: 2500 },
          { id: "pf6", label: "YouTube optimisation pack", desc: "Custom thumbnail (designed), chapter markers, end-screen template and description copy", price: 4000 },
          { id: "pf7", label: "WhatsApp version", desc: "Compressed MP4 under 16 MB for WhatsApp sharing — picture quality is reduced", price: 1500 },
        ],
      },
      {
        id: "preproduction",
        title: "Pre-Production",
        subtitle: "Preparation work done before shoot day. Significantly improves on-set efficiency and output quality.",
        type: "checkbox",
        options: [
          { id: "prp1", label: "Script writing", desc: "We write the full spoken or visual script — approved by you before shoot day", price: 6000 },
          { id: "prp2", label: "Storyboard", desc: "Scene-by-scene visual plan of the video — each shot drawn out with camera direction", price: 8000 },
          { id: "prp3", label: "Shot list preparation", desc: "Detailed list of every required shot, angle and scene — eliminates confusion on set", price: 3000 },
          { id: "prp4", label: "Mood board & reference reel", desc: "Visual and tonal reference document — defines look, feel and pacing before a frame is shot", price: 3500 },
          { id: "prp5", label: "Location scouting", desc: "We visit and photograph candidate locations, assess lighting and logistics, and recommend the best option", price: 5000 },
          { id: "prp6", label: "Talent / presenter briefing", desc: "Pre-shoot call with on-camera subjects covering key messages, delivery tips and what to expect", price: 2500 },
        ],
      },
      {
        id: "videoaddons",
        title: "Add-ons",
        subtitle: "Additional services that extend the production.",
        type: "checkbox",
        options: [
          { id: "va1", label: "Drone / aerial footage", desc: "Licensed drone operator — campus, event, property or landscape aerials included in the edit", price: 14000 },
          { id: "va2", label: "Teleprompter", desc: "Script displayed on a teleprompter for on-camera presenters — reduces retakes significantly", price: 4000 },
          { id: "va3", label: "Rush delivery (3–4 working days)", desc: "Full edited video delivered in 3–4 working days instead of standard 7–10", price: 5000 },
          { id: "va4", label: "RAW footage archive", desc: "All unedited raw files delivered via cloud link or hard drive — keep every frame captured", price: 6000 },
          { id: "va5", label: "Behind-the-scenes content", desc: "Short BTS clip or photos from shoot day — shareable social content about the process itself", price: 4000 },
          { id: "va6", label: "Photography during video shoot", desc: "Stills captured during the video shoot for dual-purpose content from the same session", price: 5000 },
        ],
      },
    ],
    serviceNotes: [
      {
        title: "What's Included",
        content: [
          "Pre-production brief and shoot planning call",
          "Professional camera (Sony / Canon) + lighting + audio kit",
          "On-location direction and crew",
          "Professional editing to the selected edit style",
          "2 rounds of edit revisions per video",
          "Final delivery in MP4 (1080p minimum, 4K available)",
          "Full usage rights for all delivered videos — digital, web and social",
        ],
      },
      {
        title: "Revision Policy",
        content: "Each video includes 2 rounds of edit revisions after the first cut is shared. All revision notes must be consolidated into one document per round — not sent incrementally. Structural changes (reordering story, reshooting scenes, adding entirely new sequences) after round 2 are assessed and quoted based on impact to timeline and budget.",
      },
      {
        title: "Client Responsibilities",
        content: "Client finalises and approves the script or brief before shoot day. Shoot location, required permits, wardrobe and all relevant people must be arranged and ready at the agreed start time. Delays on set due to client-side unpreparedness reduce the available shoot window within the booked day — no extensions or refunds for lost time.",
      },
    ],
  },
  {
    id: "social",
    name: "Social Media Management & Growth",
    tabName: "Social Media",
    icon: "Share2",
    unit: "month",
    description: "Consistent, on-brand social content and management designed to keep your brand visible, engaging and growing.",
    groups: [
      {
        id: "package", title: "Start with a ready package",
        subtitle: "A fixed monthly fee for what's listed. Counts are unique pieces of content — one reel posted to three platforms counts once.",
        note: "A package covers the choices it lists, so those are hidden while it is selected. Add-ons below stay available and are charged on top.",
        type: "radio",
        options: [
          { id: "pk1", label: "Starter", desc: "2 platforms · 12 posts a month (statics + carousels) · captions, hashtags, scheduling · monthly report", price: 15000, isBase: true },
          { id: "pk2", label: "Growth", desc: "3 platforms · 16 posts + 4 reels a month · stories 2×/week · content calendar · monthly report", price: 30000, isBase: true, tag: "Popular" },
          { id: "pk3", label: "Scale", desc: "4 platforms · 24 posts + 8 reels a month · stories 4×/week · 2 infographics · report + monthly strategy call", price: 55000, isBase: true },
          { id: "pk0", label: "Build my own", desc: "Choose each option below yourself", price: 0, isBase: true },
        ],
      },
      {
        id: "platforms", core: true, title: "Platforms to Manage",
        subtitle: "Choose the platforms you want us to manage. We handle publishing, scheduling, captions and basic optimisation.",
        note: "Content creation and specialised formats are selected separately.",
        type: "checkbox",
        options: [
          { id: "sp1", label: "Instagram", price: 4000 },
          { id: "sp2", label: "LinkedIn", price: 4000 },
          { id: "sp3", label: "Facebook", price: 3000 },
          { id: "sp4", label: "Twitter / X", price: 3000 },
          { id: "sp5", label: "YouTube Shorts", price: 4000 },
          { id: "sp6", label: "Pinterest", price: 2500 },
          { id: "sp7", label: "Threads", price: 2000 },
        ],
      },
      {
        id: "frequency", core: true, title: "Posting Frequency",
        subtitle: "Choose your monthly posting volume. Includes custom static creatives, captions, scheduling and publishing.",
        type: "radio",
        options: [
          { id: "pf1", label: "2 posts/week (8/month)", price: 5000 },
          { id: "pf2", label: "4 posts/week (16/month)", price: 10000, tag: "Popular" },
          { id: "pf3", label: "6 posts/week (24/month)", price: 15000 },
          { id: "pf4", label: "Daily (30/month)", price: 22000 },
        ],
      },
      {
        id: "content", core: true, title: "Content Formats",
        subtitle: "Add specialised formats to your social media content plan.",
        note: "Reels are edited from your footage or licensed stock; on-location shoots are quoted separately under Videography.",
        type: "checkbox",
        options: [
          { id: "cf1", label: "Carousel / Multi-image Posts", price: 2500 },
          { id: "cf2", label: "Stories (4/week)", price: 3000 },
          { id: "cf3", label: "Reels / Short Videos (2/month)", price: 8000 },
          { id: "cf4", label: "Reels / Short Videos (4/month)", price: 16000 },
          { id: "cf5", label: "Infographics (2/month)", price: 4000 },
        ],
      },
      {
        id: "community", title: "Community Management",
        subtitle: "Reply to comments, basic DMs and FAQs to keep your audience engaged and your brand responsive.",
        note: "Complex customer support, complaints, refunds and order-related queries are handled by the client.",
        type: "checkbox",
        options: [
          { id: "cm1", label: "Weekdays (Mon–Fri)", price: 5000 },
          { id: "cm2", label: "7 days/week", price: 9000 },
        ],
      },
      {
        id: "strategy", title: "Strategy & Extras",
        subtitle: "Add-ons to strengthen your social media results.",
        type: "checkbox",
        options: [
          { id: "se1", label: "Monthly Growth & Strategy Session", desc: "Review performance, identify opportunities and plan the next month's content direction.", price: 3000, tag: "Recommended" },
          { id: "se2", label: "Paid Social Creative (2 Ad Concepts)", desc: "Creative production for 2 paid advertising concepts. Ad spend and media buying are billed separately.", price: 10000 },
          { id: "se3", label: "Monthly Analytics Report", desc: "Key metrics, top-performing content and recommendations for the next month.", price: 2000 },
        ],
      },
      {
        id: "contract", title: "Contract Duration",
        subtitle: "Longer commitments receive a discount on the monthly service fee.",
        type: "radio",
        isDiscount: true,
        options: [
          { id: "ct1", label: "Month-to-month", price: 0, discountPct: 0 },
          { id: "ct2", label: "3 months", desc: "Save 5%", price: 0, discountPct: 5, tag: "Popular" },
          { id: "ct3", label: "6 months", desc: "Save 10%", price: 0, discountPct: 10 },
          { id: "ct4", label: "12 months", desc: "Save 15%", price: 0, discountPct: 15, tag: "Best Value" },
        ],
      },
    ],
    serviceNotes: [
      {
        title: "What's Included",
        content: ["Content planning", "Caption writing", "Scheduling & publishing", "Basic hashtag/keyword optimisation", "Static creative design", "Performance monitoring"],
      },
      {
        title: "Revision Policy",
        content: "Up to 2 rounds of revisions per content piece. Major changes or additional revisions may be charged separately.",
      },
      {
        title: "Client Responsibilities",
        content: "Clients provide required brand assets, information, media and timely approvals. Delays in approvals or missing materials may affect the publishing schedule.",
      },
    ],
  },
  {
    id: "bundle",
    name: "Studio Bundle",
    icon: "Layers",
    unit: "project",
    description: "Pick any combination of our services and get a bundle discount — up to 12% off our service fees.",
    groups: [
      {
        id: "services", title: "Which services do you need?",
        subtitle: "Prices reflect a standard engagement for each service. 2 services = 5% off · 3 = 8% · 4 = 10% · 5+ = 12% off",
        type: "checkbox",
        options: [
          { id: "bs1", label: "Website", desc: "6–10 page custom site with an edit-it-yourself CMS", price: 45000 },
          { id: "bs2", label: "Brand Identity", desc: "3 concepts + standard guidelines + stationery", price: 44000 },
          { id: "bs3", label: "Software Solution", desc: "Business web app with roles and admin panel", price: 150000 },
          { id: "bs4", label: "Automations", desc: "3 connected workflows with AI steps", price: 45000 },
          { id: "bs5", label: "Photography", desc: "Full-day commercial shoot package", price: 28000 },
          { id: "bs6", label: "Videography", desc: "Corporate video package", price: 40000 },
          { id: "bs7", label: "Social Media", desc: "Growth package — first month", price: 30000 },
        ],
      },
    ],
  },
];
