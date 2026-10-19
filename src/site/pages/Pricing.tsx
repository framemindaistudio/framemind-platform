"use client";

import { useState, useMemo, useCallback } from "react";
import { Link } from "@/site/router";
import {
  Globe, Palette, Code2, Zap, Camera, Video, Share2, Layers,
  Check, Download, ArrowRight, FileText,
} from "lucide-react";
import SEO from "@/site/components/SEO";
import { submitLead } from "@/site/leads";
const framemindLogo = "/site/framemind-logo.jpg";
const msmeLogo = "/site/msme-logo.png";

// ─── Types ────────────────────────────────────────────────────────────────────

type ServiceId = "websites" | "brand" | "software" | "automations" | "photography" | "videography" | "social" | "bundle";

interface Option {
  id: string;
  label: string;
  desc?: string;
  price: number;
  isBase?: boolean;
  tag?: string;
  unit?: string;
  discountPct?: number;
}

interface Group {
  id: string;
  title: string;
  subtitle?: string;
  note?: string;
  type: "radio" | "checkbox";
  isDiscount?: boolean;
  options: Option[];
}

interface ServiceNote {
  title: string;
  content: string | string[];
}

interface ServiceDef {
  id: ServiceId;
  name: string;
  tabName?: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  unit: "project" | "month";
  description: string;
  groups: Group[];
  serviceNotes?: ServiceNote[];
}

// ─── Service Definitions ──────────────────────────────────────────────────────

const SERVICES: ServiceDef[] = [
  {
    id: "websites",
    name: "Websites",
    icon: Globe,
    unit: "project",
    description: "A fully custom website built to your business — not a template. Every page, feature, and integration scoped and priced transparently.",
    groups: [
      {
        id: "pages", title: "How Many Pages?",
        subtitle: "Count every distinct page — home, about, services, contact, each portfolio or blog item, etc.",
        note: "Each page is designed and developed individually. Popups, modals and repeated layout sections do not count as separate pages.",
        type: "radio",
        options: [
          { id: "p1", label: "1–5 pages", desc: "Landing page, about, contact, services", price: 15000, isBase: true },
          { id: "p2", label: "6–10 pages", desc: "Adds team, portfolio, blog, gallery", price: 28000, isBase: true },
          { id: "p3", label: "11–20 pages", desc: "Full site with multiple sections", price: 48000, isBase: true, tag: "Popular" },
          { id: "p4", label: "21–30 pages", desc: "Large business or directory-style site", price: 75000, isBase: true },
          { id: "p5", label: "30+ pages", desc: "Enterprise or multi-department site", price: 110000, isBase: true },
        ],
      },
      {
        id: "design", title: "Design Approach",
        subtitle: "All options use your brand colours, fonts and assets. The difference is depth of custom visual design.",
        type: "radio",
        options: [
          { id: "d1", label: "Clean & professional", desc: "Polished and purposeful — no templates", price: 0 },
          { id: "d2", label: "Custom UI design", desc: "Every component designed for your brand", price: 15000, tag: "Popular" },
          { id: "d3", label: "Premium + micro-animations", desc: "Scroll effects, transitions, interactions", price: 32000 },
        ],
      },
      {
        id: "cms", title: "Content Management",
        subtitle: "Choose whether your team can update content without a developer after launch.",
        note: "CMS training (30 min walkthrough) is included with WordPress/Webflow and Custom CMS options.",
        type: "radio",
        options: [
          { id: "c1", label: "No CMS needed", desc: "Static or developer-managed content", price: 0 },
          { id: "c2", label: "WordPress / Webflow CMS", desc: "Familiar interface, easy for teams", price: 8000 },
          { id: "c3", label: "Custom CMS", desc: "Built specifically for your content structure", price: 20000 },
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
          { id: "f5", label: "Payment gateway", price: 8000 },
          { id: "f6", label: "Booking / appointment system", price: 12000 },
          { id: "f7", label: "E-commerce — basic store", price: 22000 },
          { id: "f8", label: "E-commerce — advanced + inventory", price: 45000, tag: "Advanced" },
          { id: "f9", label: "Role-based admin dashboard", price: 20000 },
          { id: "f10", label: "AI chatbot", price: 18000 },
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
        subtitle: "Covers bug fixes, minor content updates and compatibility checks after your site goes live.",
        note: "Support covers the original scope of work. New features or design changes outside the original brief are quoted separately.",
        type: "radio",
        options: [
          { id: "sp0", label: "No support needed", price: 0 },
          { id: "sp1", label: "1 month", desc: "Bug fixes and minor adjustments", price: 5000 },
          { id: "sp2", label: "3 months", desc: "Extended monitoring and updates", price: 12000, tag: "Popular" },
          { id: "sp3", label: "6 months", desc: "Priority support and monthly check-ins", price: 22000 },
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
    icon: Palette,
    unit: "project",
    description: "A complete visual identity built from strategy — logo, colour, typography, guidelines and the assets your team will actually use.",
    groups: [
      {
        id: "logo", title: "Logo Concepts",
        subtitle: "Each concept is a fully distinct creative direction — not variations of the same idea.",
        note: "Each concept includes 2 rounds of revisions. You select one direction to refine into the final logo. Additional concepts or rounds are quoted separately.",
        type: "radio",
        options: [
          { id: "l1", label: "2 concepts", desc: "Focused, fast", price: 10000, isBase: true },
          { id: "l2", label: "3 concepts", desc: "More direction to choose from", price: 18000, isBase: true, tag: "Popular" },
          { id: "l3", label: "5 concepts", desc: "Full exploration across styles", price: 28000, isBase: true },
        ],
      },
      {
        id: "guidelines", title: "Brand Guidelines",
        subtitle: "How your brand should look, sound and be applied — documented for your team and partners.",
        note: "Delivered as a PDF. Editable source files (Figma/Illustrator) are included with Standard and Comprehensive options.",
        type: "radio",
        options: [
          { id: "g1", label: "Quick-reference sheet", desc: "Colours, fonts and logo usage — 1 page", price: 0 },
          { id: "g2", label: "Standard (10–15 pages)", desc: "Full system with rules and examples", price: 15000, tag: "Popular" },
          { id: "g3", label: "Comprehensive (25+ pages)", desc: "Tone, imagery, iconography and strategy", price: 35000 },
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
    icon: Code2,
    unit: "project",
    description: "Custom software built for your exact business process — from a focused MVP to a full-scale platform. Scoped, built and delivered in stages.",
    groups: [
      {
        id: "apptype", title: "What Are We Building?",
        subtitle: "Select the type of software. This determines the base architecture and technology stack.",
        note: "All options include a structured discovery session before development begins to finalise scope, user flows and technical requirements.",
        type: "radio",
        options: [
          { id: "at1", label: "Web application", desc: "Browser-based, works on all devices", price: 40000, isBase: true, tag: "Most Common" },
          { id: "at2", label: "Mobile app (iOS or Android)", desc: "Native mobile application", price: 80000, isBase: true },
          { id: "at3", label: "Web + mobile app", desc: "Both platforms, shared backend", price: 110000, isBase: true },
          { id: "at4", label: "Internal tool / dashboard", desc: "For your team, not public-facing", price: 35000, isBase: true },
        ],
      },
      {
        id: "complexity", title: "Scope & Complexity",
        subtitle: "How many features and how much business logic does the product need to handle?",
        note: "Final scope is confirmed in a discovery session. This selection gives an accurate estimate — exact pricing is locked after scope sign-off.",
        type: "radio",
        options: [
          { id: "cx1", label: "MVP — one core feature", desc: "Ship fast, validate, then grow", price: 0 },
          { id: "cx2", label: "Multi-feature product", desc: "3–6 core features with defined flows", price: 60000, tag: "Popular" },
          { id: "cx3", label: "Complex / scalable platform", desc: "High data volume, complex business logic", price: 150000 },
          { id: "cx4", label: "Enterprise platform", desc: "Multi-tenant, SSO, audit trails, SLAs", price: 300000 },
        ],
      },
      {
        id: "corefeatures", title: "Core Features",
        subtitle: "Select every feature your product needs. Each is individually built and tested.",
        type: "checkbox",
        options: [
          { id: "cf1", label: "User authentication (login, signup)", price: 8000 },
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
          { id: "in7", label: "AI / ML features", desc: "Custom model integration or LLM-powered features", price: 28000 },
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
        subtitle: "Bug fixes, minor changes and monitoring after your software goes live.",
        note: "Support covers bugs and issues within the agreed scope. New features, major changes or integrations added after launch are quoted separately.",
        type: "radio",
        options: [
          { id: "ss0", label: "No support", price: 0 },
          { id: "ss1", label: "30 days", desc: "Bug fixes and stability monitoring", price: 10000 },
          { id: "ss2", label: "60 days", desc: "Extended monitoring and minor updates", price: 18000, tag: "Popular" },
          { id: "ss3", label: "90 days", desc: "Priority support and proactive reviews", price: 28000 },
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
    icon: Zap,
    unit: "project",
    description: "Eliminate repetitive manual work — connect your tools, automate your processes and let your business run smarter.",
    groups: [
      {
        id: "workflows", title: "Number of Workflows",
        subtitle: "Each workflow is one automated process with a defined trigger and outcome.",
        note: "A workflow is defined as one trigger → action chain. A lead form submission triggering an email + CRM entry + Slack alert = 1 workflow with 3 actions.",
        type: "radio",
        options: [
          { id: "w1", label: "1 workflow", desc: "One trigger, one outcome", price: 8000, isBase: true },
          { id: "w2", label: "3 workflows", desc: "A connected set for a department", price: 20000, isBase: true, tag: "Popular" },
          { id: "w3", label: "6 workflows", desc: "Covers most core operations", price: 38000, isBase: true },
          { id: "w4", label: "10+ workflows", desc: "Full automation across the business", price: 60000, isBase: true },
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
          { id: "av4", label: "Full AI agent (autonomous task handling)", desc: "End-to-end autonomous decision and action loop", price: 28000 },
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
    icon: Camera,
    unit: "project",
    description: "Professional photography for brands, products, events, teams and spaces — planned, directed and edited to industry standard. Configure every layer of your shoot.",
    groups: [
      {
        id: "shoottype",
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
        id: "session",
        title: "Shoot Session Length",
        subtitle: "Shoot time starts on arrival at location and includes setup, shooting and pack-down.",
        note: "Travel within 25 km of base location is included. Outstation shoots require travel and accommodation to be arranged and covered by the client. Permits, venue access and parking are the client's responsibility.",
        type: "radio",
        options: [
          { id: "sl1", label: "2 hours", desc: "Quick headshot session or small product set (up to ~20 hero shots)", price: 5000, isBase: true },
          { id: "sl2", label: "Half day — 4 hours", desc: "Products, portraits, or a single location and concept", price: 9000, isBase: true },
          { id: "sl3", label: "Full day — 7 hours", desc: "Brand shoot covering team, products and space — most shoots land here", price: 17000, isBase: true, tag: "Most Common" },
          { id: "sl4", label: "2 shoot days", desc: "Campaign with multiple concepts, locations or talent groups", price: 32000, isBase: true },
          { id: "sl5", label: "3+ shoot days", desc: "Complete brand photography system or large-scale event", price: 48000, isBase: true },
        ],
      },
      {
        id: "locations",
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
        id: "deliverables",
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
        id: "editlevel",
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
          { id: "of5", label: "RAW files (.CR2/.ARW/.NEF)", desc: "Unedited originals for in-house processing — requires advanced retouch edit level", price: 5000 },
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
    icon: Video,
    unit: "project",
    description: "Brand films, reels, event coverage, product videos and documentaries — shot, edited and delivered to broadcast standard. Configure every stage from pre-production to final delivery.",
    groups: [
      {
        id: "videotype",
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
        id: "shootdays",
        title: "Shoot Days",
        subtitle: "On-location production with camera, lights and crew. Includes setup and pack-down.",
        note: "Travel within 25 km of base location is included. Outstation shoots require travel and accommodation covered by the client. Shoot days run 7–8 hours on set — arrival 30 min before for setup.",
        type: "radio",
        options: [
          { id: "vs1", label: "Half day — 4 hours on set", desc: "Interviews, small product shoots, single-location reels", price: 8000, isBase: true },
          { id: "vs2", label: "Full day — 8 hours on set", desc: "Brand films, events, multi-scene shoots — most productions land here", price: 16000, isBase: true, tag: "Most Common" },
          { id: "vs3", label: "2 shoot days", desc: "Multi-location or multi-concept campaigns. Large events.", price: 30000, isBase: true },
          { id: "vs4", label: "3 shoot days", desc: "Documentaries, full brand content systems, multi-city shoots", price: 44000, isBase: true },
          { id: "vs5", label: "4+ shoot days", desc: "Large-scale productions. Scoped individually after a planning call.", price: 58000, isBase: true },
        ],
      },
      {
        id: "quantity",
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
        id: "length",
        title: "Length per Finished Video",
        subtitle: "Length of each finished, edited video — not raw shoot duration.",
        note: "Each additional video in a series can have a different length. This selection reflects the primary deliverable. Shorter cuts of longer videos are priced under Platform Formats below.",
        type: "radio",
        options: [
          { id: "vl1", label: "Under 30 seconds", desc: "Story ad, quick reel, teaser", price: 5000, isBase: true },
          { id: "vl2", label: "30–60 seconds", desc: "Social reel, product highlight, testimonial clip", price: 9000, isBase: true },
          { id: "vl3", label: "60–90 seconds", desc: "Brand promo, Instagram feature, short case study", price: 14000, isBase: true, tag: "Most Common" },
          { id: "vl4", label: "2–4 minutes", desc: "Brand film, product demo, educational video", price: 22000, isBase: true },
          { id: "vl5", label: "5–8 minutes", desc: "Documentary short, detailed walkthrough, keynote film", price: 35000, isBase: true },
          { id: "vl6", label: "10–20 minutes", desc: "Training module, full event film, interview documentary", price: 50000, isBase: true },
          { id: "vl7", label: "20+ minutes", desc: "Long-form documentary or full event coverage — scoped after brief", price: 70000, isBase: true },
        ],
      },
      {
        id: "edittype",
        title: "Edit Style",
        subtitle: "Choose the editing approach. All edits include a rough cut for approval followed by final delivery.",
        note: "Each video includes 2 rounds of revisions after the first cut. Structural changes (reordering scenes, adding new footage) after round 2 are quoted separately.",
        type: "radio",
        options: [
          { id: "et1", label: "Basic cut — sync, trim, export", desc: "Clean assembly of footage with cuts on beat. No graphics or grade. Ideal for raw event coverage or interviews.", price: 0 },
          { id: "et2", label: "Standard edit", desc: "Cuts, transitions, title cards, lower-thirds, background music synced to pacing. Professional and polished.", price: 6000, tag: "Popular" },
          { id: "et3", label: "Premium edit — motion graphics included", desc: "Custom animated titles, branded overlays, intro/outro sequence, dynamic transitions. Broadcast-ready.", price: 14000 },
          { id: "et4", label: "Cinematic edit — full post-production", desc: "Scene-driven storytelling, dramatic pacing, multi-layer audio design, custom motion graphics and full grade. Showcase-quality.", price: 24000 },
        ],
      },
      {
        id: "colourgrade",
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
          { id: "pf7", label: "WhatsApp / low-res compressed version", desc: "Compressed MP4 under 16MB — for sharing via WhatsApp without quality loss perception", price: 1500 },
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
    icon: Share2,
    unit: "month",
    description: "Consistent, on-brand social content and management designed to keep your brand visible, engaging and growing.",
    groups: [
      {
        id: "platforms", title: "Platforms to Manage",
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
        id: "frequency", title: "Posting Frequency",
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
        id: "content", title: "Content Formats",
        subtitle: "Add specialised formats to your social media content plan.",
        note: "Reels include editing, captions/subtitles, basic transitions and CTA. Client footage required unless video production is separately quoted.",
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
    icon: Layers,
    unit: "project",
    description: "Pick any combination of our services and get a bundle discount — up to 20% off.",
    groups: [
      {
        id: "services", title: "Which services do you need?",
        subtitle: "Prices reflect a standard engagement for each service. 2 services = 5% off · 3 = 10% · 4 = 15% · 5+ = 20% off",
        type: "checkbox",
        options: [
          { id: "bs1", label: "Website", desc: "Standard 11–20 page custom site", price: 63000 },
          { id: "bs2", label: "Brand Identity", desc: "3 concepts + full guidelines + collateral", price: 45000 },
          { id: "bs3", label: "Software Solution", desc: "Multi-feature web app with admin panel", price: 125000 },
          { id: "bs4", label: "Automations", desc: "3–6 connected workflows with AI steps", price: 50000 },
          { id: "bs5", label: "Photography", desc: "Full-day shoot + 60 edited photos", price: 45000 },
          { id: "bs6", label: "Videography", desc: "90-sec brand reel + 1 shoot day + grade", price: 55000 },
          { id: "bs7", label: "Social Media", desc: "3 platforms + 16 posts/mo + reels", price: 42000 },
        ],
      },
    ],
  },
];

// ─── FAQs ─────────────────────────────────────────────────────────────────────

const faqs = [
  { q: "Are these prices final?", a: "These are accurate estimates based on your selections. Final pricing is confirmed after a 20-minute discovery call where we align on exact scope. No surprises." },
  { q: "Can I pay in instalments?", a: "Yes. We typically split into two or three milestones — usually 50% to start, 50% on delivery. For larger projects we can structure more milestones." },
  { q: "What if I need something not listed here?", a: "Just reach out. Many projects have elements we scope together. The configurator covers 95% of scenarios — the rest we handle in a call." },
  { q: "How long does a typical project take?", a: "A focused website or brand identity runs 3–6 weeks. Software projects range from 6 to 16 weeks. Timelines are set before work starts and we stick to them." },
  { q: "What's included in the handoff?", a: "All source files, documentation, and a walkthrough call. Nothing is locked behind us — you own everything we build." },
  { q: "Do you work with clients outside India?", a: "Yes. We work with clients internationally. Pricing is INR-based, and international payments are handled via bank transfer or Wise." },
];

// ─── Price Calculation ────────────────────────────────────────────────────────

type Selections = Record<string, string | string[]>;

interface LineItem { label: string; price: number }

interface QuoteResult {
  lineItems: LineItem[];
  subtotal: number;
  discountPct: number;
  discountAmount: number;
  total: number;
}

function calculateQuote(service: ServiceDef, selections: Selections): QuoteResult {
  const lineItems: LineItem[] = [];
  let subtotal = 0;
  let discountPct = 0;

  for (const group of service.groups) {
    if (group.isDiscount) {
      const sel = selections[group.id] as string;
      const opt = group.options.find(o => o.id === sel);
      if (opt) discountPct = opt.discountPct ?? 0;
      continue;
    }
    if (group.type === "radio") {
      const sel = selections[group.id] as string;
      if (!sel) continue;
      const opt = group.options.find(o => o.id === sel);
      if (!opt || opt.price === 0) continue;
      lineItems.push({ label: `${group.title}: ${opt.label}`, price: opt.price });
      subtotal += opt.price;
    } else {
      const sel = (selections[group.id] as string[]) ?? [];
      for (const id of sel) {
        const opt = group.options.find(o => o.id === id);
        if (!opt || opt.price === 0) continue;
        lineItems.push({ label: opt.label, price: opt.price });
        subtotal += opt.price;
      }
    }
  }

  if (service.id === "bundle") {
    const sel = (selections["services"] as string[]) ?? [];
    const count = sel.length;
    if (count >= 5) discountPct = 20;
    else if (count >= 4) discountPct = 15;
    else if (count >= 3) discountPct = 10;
    else if (count >= 2) discountPct = 5;
  }

  const discountAmount = Math.round(subtotal * discountPct / 100);
  return { lineItems, subtotal, discountPct, discountAmount, total: subtotal - discountAmount };
}

// ─── PDF Generation ───────────────────────────────────────────────────────────

async function downloadQuotePDF(clientName: string, service: ServiceDef, quote: QuoteResult, selections: Selections) {
  const now = new Date();
  const date = now.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  const validUntil = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    .toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  const refNum = `FM-${now.getFullYear().toString().slice(-2)}${String(now.getMonth() + 1).padStart(2, "0")}-${Date.now().toString().slice(-5)}`;
  const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;
  const unit = service.unit === "month" ? "/month" : "";

  const toDataUrl = async (url: string) => {
    try {
      const resp = await fetch(url);
      const blob = await resp.blob();
      return await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
    } catch { return ""; }
  };

  const [logoDataUrl, msmeDataUrl] = await Promise.all([
    toDataUrl(framemindLogo),
    toDataUrl(msmeLogo),
  ]);

  // ── Scope table rows ──
  const scopeRows = service.groups
    .filter(g => !g.isDiscount)
    .map(group => {
      let selectedOpts: Option[] = [];
      if (group.type === "radio") {
        const opt = group.options.find(o => o.id === (selections[group.id] as string));
        if (opt) selectedOpts = [opt];
      } else {
        const selIds = (selections[group.id] as string[]) ?? [];
        selectedOpts = selIds.map(id => group.options.find(o => o.id === id)!).filter(Boolean);
      }
      if (selectedOpts.length === 0) return "";

      const optRows = selectedOpts.map((opt, idx) => {
        const priceCell = opt.price === 0
          ? `<span style="color:#16a34a;font-size:11.5px;font-weight:700;">Included</span>`
          : `<span style="font-size:13px;font-weight:700;color:#111;">${fmt(opt.price)}${opt.unit ? `<span style="font-size:10px;font-weight:400;color:#888;"> ${opt.unit}</span>` : ""}${unit ? `<span style="font-size:10px;font-weight:400;color:#888;"> ${unit}</span>` : ""}</span>`;
        return `<tr style="background:${idx % 2 === 0 ? "#ffffff" : "#f8f8f8"};">
          <td style="padding:11px 14px 11px 26px;border-bottom:1px solid #efefef;vertical-align:top;width:32%;">
            <div style="display:flex;align-items:flex-start;gap:7px;">
              <span style="color:#5a7800;font-size:10px;margin-top:2px;flex-shrink:0;font-weight:900;">✓</span>
              <div>
                <div style="font-size:12.5px;font-weight:700;color:#111;line-height:1.35;">${opt.label}</div>
                ${opt.tag ? `<span style="display:inline-block;margin-top:4px;font-size:7.5px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;background:#eef7c8;color:#4a6500;padding:2px 5px;border-radius:2px;">${opt.tag}</span>` : ""}
              </div>
            </div>
          </td>
          <td style="padding:11px 14px;border-bottom:1px solid #efefef;vertical-align:top;width:46%;">
            ${opt.desc
              ? `<span style="font-size:11.5px;color:#555;line-height:1.65;">${opt.desc}</span>`
              : `<span style="font-size:11px;color:#ccc;">—</span>`}
          </td>
          <td style="padding:11px 16px 11px 8px;border-bottom:1px solid #efefef;text-align:right;vertical-align:top;white-space:nowrap;width:22%;">${priceCell}</td>
        </tr>`;
      }).join("");

      const hasNote = !!group.note;
      return `
        <tr>
          <td colspan="3" style="padding:11px 16px 9px;background:#0D0D0D;border-top:1px solid #1a1a1a;border-bottom:1px solid #1a1a1a;">
            <span style="font-size:9.5px;font-weight:800;text-transform:uppercase;letter-spacing:.16em;color:#F5F4F0;">${group.title}</span>
            ${group.subtitle ? `<span style="font-size:10px;color:#888;margin-left:10px;font-weight:400;">${group.subtitle}</span>` : ""}
          </td>
        </tr>
        ${optRows}
        ${hasNote ? `<tr><td colspan="3" style="padding:7px 16px 9px 26px;background:#fffef5;border-bottom:1px solid #e8d88c;">
          <span style="font-size:10.5px;font-weight:600;color:#6b4f00;line-height:1.6;">&#9432; ${group.note}</span>
        </td></tr>` : ""}`;
    }).join("");

  // ── Price summary ──
  const summaryBlock = `
    <div style="margin-top:28px;border:1.5px solid #e0e0e0;border-radius:6px;overflow:hidden;">
      <div style="background:#f0f0f0;padding:11px 20px;border-bottom:1px solid #ddd;">
        <span style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.18em;color:#222;">Price Summary</span>
      </div>
      <div style="padding:16px 20px;display:flex;flex-direction:column;gap:10px;">
        ${quote.lineItems.map(li => `
          <div style="display:flex;justify-content:space-between;align-items:baseline;">
            <span style="font-size:12px;color:#555;">${li.label}</span>
            <span style="font-size:12px;font-weight:600;color:#333;">${fmt(li.price)}${unit}</span>
          </div>`).join("")}
        <div style="height:1px;background:#e8e8e8;margin:4px 0;"></div>
        <div style="display:flex;justify-content:space-between;align-items:baseline;">
          <span style="font-size:12px;font-weight:700;color:#333;">Subtotal</span>
          <span style="font-size:13px;font-weight:700;color:#111;">${fmt(quote.subtotal)}${unit}</span>
        </div>
        ${quote.discountPct > 0 ? `
        <div style="display:flex;justify-content:space-between;align-items:baseline;background:#f0fdf4;padding:8px 12px;border-radius:4px;margin:-2px -4px;">
          <span style="font-size:12px;color:#16a34a;font-weight:600;">Bundle / Contract Discount (${quote.discountPct}%)</span>
          <span style="font-size:13px;font-weight:700;color:#16a34a;">− ${fmt(quote.discountAmount)}</span>
        </div>` : ""}
      </div>
      <div style="background:#0D0D0D;padding:20px 20px;display:flex;justify-content:space-between;align-items:center;">
        <div>
          <div style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.15em;color:#bbbbbb;margin-bottom:5px;">Total Estimate</div>
          <div style="font-size:11.5px;font-weight:600;color:#999999;">${service.unit === "month" ? "Per month · billed monthly" : "One-time project fee"}</div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:32px;font-weight:900;color:#C8F135;letter-spacing:-1px;">${fmt(quote.total)}</div>
          ${unit ? `<div style="font-size:11px;font-weight:600;color:#aaaaaa;margin-top:2px;">${unit}</div>` : ""}
        </div>
      </div>
      <div style="padding:12px 20px;background:#f4f4f4;border-top:1px solid #ddd;">
        <span style="font-size:10.5px;font-weight:600;color:#555;">Payment: 50% to start · 50% on delivery &nbsp;·&nbsp; All prices in INR &nbsp;·&nbsp; No hidden charges</span>
      </div>
    </div>`;

  // ── Service terms cards ──
  const termsBlock = service.serviceNotes && service.serviceNotes.length > 0
    ? `<div style="margin-top:32px;">
        <div style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.18em;color:#333;margin-bottom:14px;display:flex;align-items:center;gap:10px;">
          <span>Service Terms &amp; Deliverables</span>
          <span style="flex:1;height:1.5px;background:#ddd;display:inline-block;"></span>
        </div>
        <div style="display:grid;grid-template-columns:repeat(${Math.min(service.serviceNotes.length, 3)},1fr);gap:12px;">
          ${service.serviceNotes.map(note => `
            <div style="border:1.5px solid #e8e8e8;border-radius:6px;overflow:hidden;">
              <div style="background:#0D0D0D;padding:10px 14px;">
                <span style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.12em;color:#C8F135;">${note.title}</span>
              </div>
              <div style="padding:12px 14px;background:#fff;">
                ${Array.isArray(note.content)
                  ? note.content.map(item => `<div style="display:flex;gap:7px;align-items:flex-start;margin-bottom:7px;">
                      <span style="color:#b0c830;font-size:11px;flex-shrink:0;margin-top:1px;">✓</span>
                      <span style="font-size:11px;color:#444;line-height:1.5;">${item}</span>
                    </div>`).join("")
                  : `<p style="font-size:11px;color:#555;line-height:1.65;margin:0;">${note.content}</p>`}
              </div>
            </div>`).join("")}
        </div>
      </div>`
    : "";

  // ── Disclaimer ──
  const disclaimer = `
    <div style="margin-top:24px;padding:16px 20px;background:#fffdf0;border:1.5px solid #e8d070;border-radius:5px;">
      <div style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.14em;color:#5a4000;margin-bottom:6px;">Important Notice</div>
      <p style="font-size:11.5px;color:#3a2c00;line-height:1.75;margin:0;font-weight:500;">
        This is a <strong>preliminary estimate</strong> based on your selected options. Final pricing is confirmed after a 20-minute discovery call where we align on exact scope and requirements together. This quotation is valid for <strong>30 days</strong> from the date of issue. Prices are subject to change after the validity period.
      </p>
    </div>`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Quotation — ${service.name} — FrameMind AI Studio</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Helvetica Neue',Arial,sans-serif;color:#111;background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact;font-size:13px;line-height:1.5}
    .page{max-width:820px;margin:0 auto;background:#fff}

    /* ── HEADER (white bg) ── */
    .hd{display:flex;justify-content:space-between;align-items:flex-start;padding:32px 44px 28px;border-bottom:1px solid #e0e0e0;}
    .hd-left{display:flex;align-items:center;gap:16px;}
    .hd-logo{width:68px;height:68px;object-fit:contain;border-radius:8px;border:1px solid #ddd;}
    .hd-studio-name{font-size:19px;font-weight:800;color:#0D0D0D;letter-spacing:-.3px;line-height:1.1;}
    .hd-studio-tag{font-size:9px;text-transform:uppercase;letter-spacing:.14em;color:#777;margin-top:4px;}
    .hd-studio-msme{display:flex;align-items:center;gap:6px;margin-top:8px;padding:4px 9px;background:#f4f4f4;border:1px solid #ddd;border-radius:4px;width:fit-content;}
    .hd-msme-logo{width:20px;height:20px;object-fit:contain;}
    .hd-msme-txt{font-size:8.5px;color:#555;font-weight:600;text-transform:uppercase;letter-spacing:.08em;}
    .hd-right{text-align:right;}
    .hd-doc-label{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.2em;color:#888;margin-bottom:5px;}
    .hd-doc-type{font-size:24px;font-weight:900;color:#0D0D0D;letter-spacing:-1px;}
    .hd-ref{font-size:12px;font-weight:700;color:#444;margin-top:6px;font-family:monospace;background:#f4f4f4;display:inline-block;padding:3px 8px;border-radius:3px;}
    .hd-dates{margin-top:10px;}
    .hd-date-row{font-size:11px;color:#666;margin-top:3px;}
    .hd-date-row strong{color:#111;font-weight:700;}

    /* ── LIME BAR ── */
    .lime-bar{height:4px;background:linear-gradient(90deg,#C8F135 0%,#90b020 100%);}

    /* ── CLIENT + SERVICE META (white bg) ── */
    .meta{display:flex;gap:0;margin:0;border-bottom:2px solid #e0e0e0;}
    .meta-cell{flex:1;padding:22px 44px;}
    .meta-cell+.meta-cell{border-left:1px solid #e0e0e0;}
    .meta-label{font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:.18em;color:#555;margin-bottom:8px;}
    .meta-name{font-size:21px;font-weight:900;color:#0D0D0D;letter-spacing:-.4px;}
    .meta-sub{font-size:11.5px;color:#555;margin-top:5px;line-height:1.6;}
    .meta-badge{display:inline-flex;align-items:center;gap:6px;background:#0D0D0D;color:#C8F135;font-size:9.5px;font-weight:800;padding:6px 14px;letter-spacing:.12em;text-transform:uppercase;border-radius:3px;margin-top:8px;}

    /* ── BODY ── */
    .body{padding:28px 44px 36px;}

    /* ── SCOPE TABLE ── */
    .section-label{font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.18em;color:#333;margin-bottom:12px;display:flex;align-items:center;gap:10px;}
    .section-label::after{content:'';flex:1;height:1px;background:#ddd;display:inline-block;}
    table{width:100%;border-collapse:collapse;border:1.5px solid #ddd;border-radius:6px;overflow:hidden;margin-bottom:0;}
    table thead tr th{background:#1a1a1a;color:#aaaaaa;padding:9px 14px;font-size:8.5px;text-transform:uppercase;letter-spacing:.14em;font-weight:700;text-align:left;border-bottom:1px solid #2a2a2a;}
    table thead tr th:nth-child(1){width:32%;padding-left:26px;}
    table thead tr th:nth-child(2){width:46%;}
    table thead tr th:last-child{text-align:right;width:22%;padding-right:16px;}

    /* ── FOOTER (dark #0D0D0D bg — ALL text must be light) ── */
    .footer{background:#0D0D0D;padding:26px 44px;display:flex;justify-content:space-between;align-items:center;gap:24px;margin-top:0;}
    .footer-sig-name{font-size:15px;font-weight:800;color:#ffffff;margin-bottom:2px;}
    .footer-sig-role{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.13em;color:#C8F135;margin-bottom:12px;}
    .footer-contacts{display:flex;flex-wrap:wrap;gap:4px 16px;}
    .fc{font-size:10.5px;color:#bbbbbb;}
    .fc a{color:#cccccc;text-decoration:none;}
    .footer-right{display:flex;flex-direction:column;align-items:flex-end;gap:10px;}
    .footer-msme-wrap{display:flex;align-items:center;gap:12px;}
    .footer-msme-logo{width:50px;height:50px;object-fit:contain;background:#ffffff;border-radius:5px;padding:4px;}
    .footer-msme-txt{font-size:10px;font-weight:700;color:#cccccc;text-align:right;line-height:1.7;}
    .footer-tagline{font-size:9px;font-weight:600;color:#aaaaaa;text-align:right;text-transform:uppercase;letter-spacing:.12em;}

    @media print{
      body{-webkit-print-color-adjust:exact;print-color-adjust:exact}
      .page{max-width:100%;margin:0}
    }
  </style>
</head>
<body>
<div class="page">

  <!-- HEADER -->
  <div class="hd">
    <div class="hd-left">
      ${logoDataUrl
        ? `<img src="${logoDataUrl}" class="hd-logo" alt="FrameMind" />`
        : `<div style="width:68px;height:68px;background:#0D0D0D;border-radius:8px;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:2px;">
            <span style="font-size:10px;font-weight:800;color:#C8F135;line-height:1;">FM</span>
           </div>`}
      <div>
        <div class="hd-studio-name">FrameMind AI Studio</div>
        <div class="hd-studio-tag">Design · Development · Content · AI</div>
        ${msmeDataUrl ? `<div class="hd-studio-msme">
          <img src="${msmeDataUrl}" class="hd-msme-logo" alt="MSME" />
          <span class="hd-msme-txt">MSME Registered · Govt. of India</span>
        </div>` : ""}
      </div>
    </div>
    <div class="hd-right">
      <div class="hd-doc-label">Document</div>
      <div class="hd-doc-type">QUOTATION</div>
      <div class="hd-ref">${refNum}</div>
      <div class="hd-dates">
        <div class="hd-date-row">Date of issue: <strong>${date}</strong></div>
        <div class="hd-date-row">Valid until: <strong>${validUntil}</strong></div>
      </div>
    </div>
  </div>

  <div class="lime-bar"></div>

  <!-- CLIENT + SERVICE META -->
  <div class="meta">
    <div class="meta-cell">
      <div class="meta-label">Prepared for</div>
      <div class="meta-name">${clientName || "Valued Client"}</div>
      <div class="meta-sub">This quotation has been prepared exclusively<br>for the above-named client.</div>
    </div>
    <div class="meta-cell">
      <div class="meta-label">Service</div>
      <div class="meta-badge">◆ &nbsp;${service.name}</div>
      <div class="meta-sub" style="margin-top:10px;">${service.description}</div>
    </div>
  </div>

  <!-- BODY -->
  <div class="body">

    <!-- Scope of Work -->
    <div class="section-label">Scope of Work &amp; Selected Options</div>
    <table>
      <thead>
        <tr>
          <th>Service / Option</th>
          <th>Details</th>
          <th style="text-align:right;">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${scopeRows}
      </tbody>
    </table>

    <!-- Price Summary -->
    ${summaryBlock}

    <!-- Terms & Deliverables -->
    ${termsBlock}

    <!-- Disclaimer -->
    ${disclaimer}

  </div>

  <!-- FOOTER -->
  <div class="footer">
    <div class="footer-sig">
      <div class="footer-sig-name">Chinmay R M</div>
      <div class="footer-sig-role">Founder &amp; Director — FrameMind AI Studio</div>
      <div class="footer-contacts">
        <span class="fc">📞 <a href="tel:+918073087576">+91 80730 87576</a></span>
        <span class="fc">✉ <a href="mailto:framemindaistudio@gmail.com">framemindaistudio@gmail.com</a></span>
        <span class="fc">🌐 <a href="https://www.framemindaistudio.com">www.framemindaistudio.com</a></span>
        <span class="fc">💼 <a href="https://linkedin.com/in/chinmay-rm">linkedin.com/in/chinmay-rm</a></span>
      </div>
    </div>
    <div class="footer-right">
      <div class="footer-tagline">Built to last. Delivered with intent.</div>
      ${msmeDataUrl ? `<div class="footer-msme-wrap">
        <div class="footer-msme-txt">MSME Registered<br>Govt. of India</div>
        <img src="${msmeDataUrl}" class="footer-msme-logo" alt="MSME Registered" />
      </div>` : ""}
    </div>
  </div>

</div>
</body>
</html>`;

  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 700);
}

// ─── Service Notes Accordion ──────────────────────────────────────────────────

function ServiceNotesAccordion({ notes }: { notes: ServiceNote[] }) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="border border-border rounded-sm overflow-hidden">
      <div className="px-4 py-2.5 bg-secondary border-b border-border flex items-center gap-2">
        <span className="w-1 h-4 rounded-full bg-foreground/20" />
        <span className="text-xs font-semibold">Service Notes</span>
      </div>
      {notes.map((note, i) => (
        <div key={note.title} className={i > 0 ? "border-t border-border" : ""}>
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-secondary/50 transition-colors"
          >
            <span className="text-xs font-medium">{note.title}</span>
            <span className={`text-muted-foreground text-xs transition-transform duration-200 ${open === i ? "rotate-180" : ""}`}>▾</span>
          </button>
          {open === i && (
            <div className="px-4 pb-4">
              {Array.isArray(note.content) ? (
                <ul className="space-y-1">
                  {note.content.map(item => (
                    <li key={item} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <span className="text-[#C8F135] mt-0.5 shrink-0">✓</span>{item}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-muted-foreground leading-relaxed">{note.content}</p>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Option Card ─────────────────────────────────────────────────────────────

function OptionCard({ option, selected, type, onToggle }: {
  option: Option; selected: boolean; type: "radio" | "checkbox"; onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className={`relative w-full text-left px-4 py-3.5 rounded-sm border transition-all duration-150 group ${
        selected
          ? "border-[#0D0D0D] bg-[#0D0D0D]"
          : "border-border bg-background hover:border-foreground/30 hover:bg-secondary/40"
      }`}
    >
      <div className="flex items-start gap-3">
        <span className={`shrink-0 mt-0.5 w-4 h-4 flex items-center justify-center border transition-all ${
          type === "radio" ? "rounded-full" : "rounded-sm"
        } ${selected ? "bg-[#C8F135] border-[#C8F135]" : "border-border"}`}>
          {selected && <Check size={9} className="text-[#0D0D0D]" strokeWidth={3} />}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className={`text-sm font-medium leading-snug ${selected ? "text-[#F5F4F0]" : "text-foreground"}`}>
                {option.label}
                {option.unit && (
                  <span className={`text-xs font-normal ml-1 ${selected ? "text-[#888]" : "text-muted-foreground"}`}>{option.unit}</span>
                )}
              </p>
              {option.desc && (
                <p className={`text-xs mt-0.5 leading-snug ${selected ? "text-[#666]" : "text-muted-foreground"}`}>{option.desc}</p>
              )}
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0 ml-2">
              <span className={`text-sm font-bold tabular-nums ${selected ? "text-[#C8F135]" : "text-foreground"}`}>
                {option.price === 0
                  ? (option.isBase ? "" : <span className="text-xs font-normal text-muted-foreground">Included</span>)
                  : `+₹${option.price.toLocaleString("en-IN")}`}
              </span>
              {option.tag && (
                <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-sm ${
                  selected ? "bg-[#C8F135]/20 text-[#C8F135]" : "bg-secondary text-muted-foreground"
                }`}>{option.tag}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Pricing() {
  const [activeId, setActiveId] = useState<ServiceId>("websites");
  const [allSelections, setAllSelections] = useState<Record<ServiceId, Selections>>(
    () => Object.fromEntries(SERVICES.map(s => [s.id, {}])) as Record<ServiceId, Selections>
  );
  const [clientName, setClientName] = useState("");
  // optional: a phone or email files the quote in HQ as an enquiry, so the studio can follow up
  const [clientContact, setClientContact] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const service = SERVICES.find(s => s.id === activeId)!;
  const selections = allSelections[activeId];

  const setSelection = useCallback((groupId: string, value: string | string[]) => {
    setAllSelections(prev => ({ ...prev, [activeId]: { ...prev[activeId], [groupId]: value } }));
  }, [activeId]);

  const toggleOption = useCallback((group: Group, optionId: string) => {
    if (group.type === "radio") {
      setSelection(group.id, optionId);
    } else {
      const current = (selections[group.id] as string[]) ?? [];
      setSelection(group.id,
        current.includes(optionId) ? current.filter(id => id !== optionId) : [...current, optionId]
      );
    }
  }, [selections, setSelection]);

  const quote = useMemo(() => calculateQuote(service, selections), [service, selections]);
  const hasSelections = quote.lineItems.length > 0;

  return (
    <>
      <SEO
        title="Services & Pricing — Build Your Custom Quote"
        description="Configure exactly what you need and get an instant price. Download a personalised PDF quote for websites, brand, software, automations, photography, videography, or social media."
        path="/pricing"
        keywords="web design pricing India, website cost India, brand identity price, custom software quote India, digital services pricing, photography videography pricing India, FrameMind services"
        ogImageAlt="FrameMind AI Studio — Services & Pricing Configurator"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Service",
          "name": "Design & Digital Services — FrameMind AI Studio",
          "provider": { "@type": "Organization", "name": "FrameMind AI Studio", "url": "https://www.framemindaistudio.com" },
          "description": "Custom websites, brand identity, software, automations, photography, videography, and social media — all in-house, INR pricing.",
          "areaServed": "IN",
          "serviceType": ["Web Design", "Brand Identity", "Software Development", "AI Automation", "Photography", "Videography", "Social Media Management"],
          "offers": {
            "@type": "AggregateOffer",
            "priceCurrency": "INR",
            "lowPrice": "3000",
            "offerCount": "7",
          },
        }}
      />
      <div className="min-h-screen">

        {/* ── Hero ── */}
        <section className="bg-[#0D0D0D] relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-[2px] bg-[#C8F135]" />
          <div className="max-w-6xl mx-auto px-6 pt-14 md:pt-20 pb-14 md:pb-20">
            <div className="max-w-3xl">
              <div className="flex items-center gap-3 mb-8">
                <span className="w-2 h-2 rounded-full bg-[#C8F135] animate-pulse" />
                <span className="font-mono text-[11px] text-[#555] uppercase tracking-[0.2em]">FrameMind Studio · Interactive Pricing</span>
              </div>
              <h1 className="text-4xl sm:text-5xl md:text-[66px] font-semibold text-[#F5F4F0] tracking-tight leading-[1.0] mb-6">
                Your project.<br />
                <em className="not-italic text-[#C8F135]">Your exact price.</em>
              </h1>
              <p className="text-base text-[#666] leading-relaxed max-w-lg mb-8">
                Choose your service, configure exactly what you need, and get an instant quote. Add your name and download it as a PDF — with our contact details and a full breakdown.
              </p>
              <div className="flex flex-wrap gap-2">
                {SERVICES.map(s => {
                  const Icon = s.icon;
                  return (
                    <button key={s.id} onClick={() => setActiveId(s.id)}
                      className={`inline-flex items-center gap-1.5 font-mono text-[10px] border px-3 py-1.5 rounded-sm uppercase tracking-widest transition-colors ${
                        s.id === activeId ? "border-[#C8F135] text-[#C8F135]" : "border-[#222] text-[#555] hover:border-[#444] hover:text-[#888]"
                      }`}>
                      <Icon size={10} />{s.tabName ?? s.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* ── Configurator ── */}
        <section className="max-w-6xl mx-auto px-6 py-10 md:py-14">
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-10">

            {/* Service picker — left sidebar */}
            <div className="lg:w-[200px] shrink-0">
              <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest mb-3 hidden lg:block">Service</p>
              {/* Mobile: horizontal scroll */}
              <div className="flex lg:hidden gap-2 overflow-x-auto pb-2">
                {SERVICES.map(s => {
                  const Icon = s.icon;
                  const isBundle = s.id === "bundle";
                  const active = activeId === s.id;
                  return (
                    <button key={s.id} onClick={() => setActiveId(s.id)}
                      className={`shrink-0 flex items-center gap-2 px-3 py-2 rounded-sm text-xs font-medium transition-all whitespace-nowrap ${
                        isBundle
                          ? active ? "bg-[#C85A00] text-white" : "border border-[#C85A00]/40 text-[#C85A00]"
                          : active ? "bg-[#0D0D0D] text-[#F5F4F0]" : "border border-border text-muted-foreground"
                      }`}>
                      <Icon size={12} />{s.tabName ?? s.name}
                    </button>
                  );
                })}
              </div>
              {/* Desktop: vertical list */}
              <div className="hidden lg:flex flex-col gap-1.5">
                {SERVICES.map(s => {
                  const Icon = s.icon;
                  const isBundle = s.id === "bundle";
                  const active = activeId === s.id;
                  return (
                    <button key={s.id} onClick={() => setActiveId(s.id)}
                      className={`flex items-center gap-2.5 w-full px-3.5 py-2.5 rounded-sm text-sm font-medium transition-all text-left ${
                        isBundle
                          ? active
                            ? "bg-[#C85A00] text-white"
                            : "bg-orange-50 text-[#C85A00] hover:bg-orange-100 border border-orange-200"
                          : active
                            ? "bg-[#0D0D0D] text-[#F5F4F0]"
                            : "border border-border text-muted-foreground hover:bg-secondary hover:text-foreground"
                      }`}>
                      <Icon size={14} className={active && !isBundle ? "text-[#C8F135]" : ""} />
                      <span className="flex-1">{s.tabName ?? s.name}</span>
                      {isBundle && !active && (
                        <span className="text-[8px] font-bold bg-[#C85A00] text-white px-1 py-0.5 rounded-sm uppercase tracking-wide">Bundle</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Option groups — main area */}
            <div className="flex-1 min-w-0">
              <div className="mb-8 pb-6 border-b border-border">
                <h2 className="text-2xl font-semibold tracking-tight mb-1.5">{service.name}</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">{service.description}</p>
              </div>

              <div className="flex flex-col gap-10">
                {service.groups.map(group => {
                  const currentRadio = selections[group.id] as string;
                  const currentCheckbox = (selections[group.id] as string[]) ?? [];
                  return (
                    <div key={group.id}>
                      <div className="mb-3">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className={`w-1 h-4 rounded-full ${group.type === "radio" ? "bg-[#C8F135]" : "bg-foreground/20"}`} />
                          <h3 className="text-sm font-semibold">{group.title}</h3>
                          <span className={`font-mono text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded-sm ${
                            group.type === "radio" ? "bg-[#C8F135]/10 text-[#6a8200]" : "bg-secondary text-muted-foreground"
                          }`}>{group.type === "radio" ? "Choose one" : "Choose any"}</span>
                        </div>
                        {group.subtitle && <p className="text-xs text-muted-foreground ml-3">{group.subtitle}</p>}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {group.options.map(opt => (
                          <OptionCard
                            key={opt.id}
                            option={opt}
                            type={group.type}
                            selected={
                              group.type === "radio"
                                ? currentRadio === opt.id
                                : currentCheckbox.includes(opt.id)
                            }
                            onToggle={() => toggleOption(group, opt.id)}
                          />
                        ))}
                      </div>
                      {group.note && (
                        <p className="text-[11px] text-muted-foreground/70 mt-2 ml-1 leading-relaxed italic">
                          ℹ {group.note}
                        </p>
                      )}
                    </div>
                  );
                })}

                {/* Service notes accordion (social media) */}
                {service.serviceNotes && service.serviceNotes.length > 0 && (
                  <ServiceNotesAccordion notes={service.serviceNotes} />
                )}
              </div>
            </div>

            {/* Quote summary — sticky right panel */}
            <div className="lg:w-[300px] shrink-0">
              <div className="lg:sticky lg:top-6">
                <div className="bg-[#0D0D0D] rounded-sm overflow-hidden shadow-2xl">
                  {/* Panel header */}
                  <div className="bg-[#C8F135] px-5 py-3 flex items-center gap-2">
                    <FileText size={12} className="text-[#0D0D0D]" />
                    <span className="font-mono text-[10px] text-[#0D0D0D] font-bold uppercase tracking-widest">Live Quote</span>
                    {hasSelections && (
                      <span className="ml-auto font-mono text-[9px] text-[#0D0D0D]/60 uppercase tracking-widest">{service.name}</span>
                    )}
                  </div>

                  <div className="p-5">
                    {/* Empty state */}
                    {!hasSelections && (
                      <div className="py-10 text-center">
                        <div className="w-10 h-10 border border-[#1a1a1a] rounded-sm flex items-center justify-center mx-auto mb-3">
                          {(() => { const Icon = service.icon; return <Icon size={16} className="text-[#333]" />; })()}
                        </div>
                        <p className="text-xs text-[#444] leading-relaxed">
                          Select options on the left<br />to build your quote.
                        </p>
                      </div>
                    )}

                    {/* Line items */}
                    {hasSelections && (
                      <div className="flex flex-col gap-2.5 mb-5 max-h-56 overflow-y-auto pr-1">
                        {quote.lineItems.map((li, i) => (
                          <div key={i} className="flex items-start justify-between gap-2">
                            <p className="text-xs text-[#888] leading-snug flex-1">{li.label}</p>
                            <p className="text-xs text-[#bbb] font-medium shrink-0 tabular-nums">
                              ₹{li.price.toLocaleString("en-IN")}{service.unit === "month" ? "/mo" : ""}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Totals */}
                    {hasSelections && (
                      <div className="border-t border-[#1a1a1a] pt-4 flex flex-col gap-2 mb-5">
                        {quote.discountPct > 0 && (
                          <>
                            <div className="flex justify-between text-xs">
                              <span className="text-[#555]">Subtotal</span>
                              <span className="text-[#777] tabular-nums">₹{quote.subtotal.toLocaleString("en-IN")}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-green-400">Discount ({quote.discountPct}%)</span>
                              <span className="text-green-400 tabular-nums">− ₹{quote.discountAmount.toLocaleString("en-IN")}</span>
                            </div>
                          </>
                        )}
                        <div className="flex justify-between items-end pt-1">
                          <span className="text-sm text-[#F5F4F0] font-semibold">Total estimate</span>
                          <div className="text-right">
                            <span className="text-2xl font-bold text-[#C8F135] tabular-nums">
                              ₹{quote.total.toLocaleString("en-IN")}
                            </span>
                            {service.unit === "month" && (
                              <span className="text-sm text-[#666]">/mo</span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Client name input */}
                    <div className="mb-3">
                      <label className="font-mono text-[9px] text-[#aaa] uppercase tracking-widest block mb-1.5">
                        Your name (appears on the PDF)
                      </label>
                      <input
                        type="text"
                        value={clientName}
                        onChange={e => setClientName(e.target.value)}
                        placeholder="e.g. Rahul Sharma"
                        className="w-full bg-[#0a0a0a] border border-[#1e1e1e] rounded-sm px-3 py-2.5 text-sm text-[#F5F4F0] placeholder:text-[#333] focus:outline-none focus:border-[#C8F135]/50 transition-colors"
                      />
                    </div>

                    {/* Contact (optional) — sends the quote to the studio */}
                    <div className="mb-3">
                      <label className="font-mono text-[9px] text-[#aaa] uppercase tracking-widest block mb-1.5">
                        Phone or email (optional — we&apos;ll follow up)
                      </label>
                      <input
                        type="text"
                        value={clientContact}
                        onChange={e => setClientContact(e.target.value)}
                        placeholder="e.g. 98450 12345 or you@company.com"
                        className="w-full bg-[#0a0a0a] border border-[#1e1e1e] rounded-sm px-3 py-2.5 text-sm text-[#F5F4F0] placeholder:text-[#333] focus:outline-none focus:border-[#C8F135]/50 transition-colors"
                      />
                    </div>

                    {/* Download button */}
                    <button
                      onClick={() => {
                        if (!hasSelections) return;
                        downloadQuotePDF(clientName, service, quote, selections);
                        const contact = clientContact.trim();
                        if (contact) {
                          const isEmail = contact.includes("@");
                          void submitLead({
                            kind: "project",
                            name: clientName.trim() || "Pricing page visitor",
                            email: isEmail ? contact : undefined,
                            phone: isEmail ? undefined : contact,
                            services: service.id === "bundle" ? [] : [service.id],
                            budget: `₹${quote.total.toLocaleString("en-IN")}${service.unit === "month" ? "/month" : ""} (website estimate)`,
                            message: [`Downloaded a quote for ${service.name}:`, ...quote.lineItems.map(l => `• ${l.label} — ₹${l.price.toLocaleString("en-IN")}`), quote.discountAmount ? `Discount ${quote.discountPct}%: −₹${quote.discountAmount.toLocaleString("en-IN")}` : ""].filter(Boolean).join("\n"),
                          });
                        }
                      }}
                      disabled={!hasSelections}
                      className="w-full bg-[#C8F135] text-[#0D0D0D] py-3 text-sm font-bold rounded-sm hover:bg-[#b8e020] active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <Download size={13} />
                      Download Quote as PDF
                    </button>

                    {hasSelections && (
                      <p className="text-[10px] text-[#aaa] text-center mt-2.5 leading-relaxed">
                        Estimate only. Final price confirmed after a discovery call.
                      </p>
                    )}

                    {/* Talk to us */}
                    <div className="mt-5 pt-4 border-t border-[#1a1a1a] flex flex-col gap-2">
                      <p className="text-xs text-[#aaa]">Want to talk through your quote?</p>
                      <Link to="/connect"
                        className="w-full border border-[#1e1e1e] text-[#888] hover:text-[#F5F4F0] hover:border-[#333] py-2.5 text-xs font-medium rounded-sm transition-colors flex items-center justify-center gap-1.5">
                        Book a free 20-min call <ArrowRight size={11} />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="bg-background border-t border-border">
          <div className="max-w-6xl mx-auto px-6 py-20">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-20">
              <div className="lg:col-span-2">
                <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest mb-4 block">FAQ</span>
                <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-4">Questions<br />we get a lot.</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Not finding your answer?{" "}
                  <Link to="/connect" className="text-foreground underline underline-offset-2 hover:text-muted-foreground transition-colors">
                    Just ask us directly.
                  </Link>
                </p>
              </div>
              <div className="lg:col-span-3 flex flex-col divide-y divide-border">
                {faqs.map((faq, i) => (
                  <div key={i} className="py-5">
                    <button className="w-full flex items-start justify-between gap-4 text-left group"
                      onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                      <span className={`text-sm font-medium transition-colors ${openFaq === i ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"}`}>
                        {faq.q}
                      </span>
                      <span className={`shrink-0 w-5 h-5 border border-border rounded-full flex items-center justify-center transition-all duration-200 ${
                        openFaq === i ? "bg-[#0D0D0D] border-[#0D0D0D] rotate-45" : ""
                      }`}>
                        <span className={`text-sm leading-none font-light ${openFaq === i ? "text-[#F5F4F0]" : "text-muted-foreground"}`}>+</span>
                      </span>
                    </button>
                    {openFaq === i && (
                      <p className="text-sm text-muted-foreground leading-relaxed mt-3 pr-8">{faq.a}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

      </div>
    </>
  );
}
