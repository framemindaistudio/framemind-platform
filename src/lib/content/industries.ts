/**
 * Industry apps: FrameMind's ready-made business apps, sold as a one-time setup and a monthly plan.
 *
 * One source for the website (/industries and /industries/[slug]), its calculator and quote, and HQ (Rate Card →
 * Industries, the quote builder's Industry line). The words live here; the numbers can be changed in HQ.
 *
 * What each app does comes from its demo (D:\App-Templates\<name>-app\README.md). The demos run without a backend;
 * each client's app goes live with a real backend in 3–4 weeks, so the site offers a demo and a quote, not a sign-up.
 *
 * Market references (checked Nov 2026), monthly unless stated:
 *   clinic       ₹799 (OPDly) · ₹999 (MedKyo) · ₹1,999–₹12,999 (Clinizy)                     techjockey.com, capterra.com
 *   dental       ₹1,149–₹2,475 (BestoSys) · ₹5,999–₹7,999 a year (Pulse)                     codingclave.com, saasworthy.com
 *   lab          ₹417–₹4,000 entry to premium · ₹750–₹5,000 (PathoGold) · ₹8,000–₹25,000 (CrelioHealth)  techjockey.com, labsmartlis.com
 *   restaurant   Petpooja ≈ ₹10,000 the first year per outlet, then ≈ ₹7,500 a year           techjockey.com, petpooja.com
 *   gym          ₹499 (GymBoss) · ₹999–₹5,999 (Fitnexa) · up to ≈ ₹13,400 (GymMaster)          capterra.com, techjockey.com
 *   salon        ₹499 (SalonBoost) · ₹833 per outlet (Salon360) · ≈ ₹2,500 (MioSalon)         capterra.in, techjockey.com
 *   pg           ₹299–₹999 (TrackMyPG) · ₹999–₹2,499 (Wonder PG)                              sourceforge.net
 *   realestate   ₹399–₹2,200 per user (Realatic, Telecrm, Zoho, Sell.do)                      sell.do, telecrm.in
 *   coaching     not checked yet: prices below are placeholders copied from gym (closest membership-style app), for the founder to set
 *   distribution ₹1,799–₹3,999 flat (Mulberry Sales) · ₹2,000–₹5,000 per distributor (DMS buyer's guide) · ₹1,500–₹4,000 per user (BeatRoute)   goodfirms.co, aiaccountant.com
 */

export type IndustryId = "distribution" | "realestate" | "clinic" | "dental" | "lab" | "restaurant" | "gym" | "salon" | "pg" | "coaching";
export type TierId = "starter" | "growth" | "pro" | "business" | "enterprise";

export interface Industry {
  id: IndustryId;
  /** the URL: /industries/<slug>; the demo button opens `demoUrl`, or says "coming soon" when it is not set */
  slug: string;
  name: string;
  /** "Clinic App" */
  product: string;
  icon: string;
  tagline: string;
  who: string;
  /** the demo business, shown so visitors know the names in it are made up */
  demoBrand: string;
  /** the live demo, opened in a new tab: a FrameMind <Name>OS app at /apps/<id>/ (or a demo hosted elsewhere) */
  demoUrl?: string;
  /** "See how we build yours": the app's build story, /apps/<id>/story/ */
  storyUrl?: string;
  features: { title: string; detail: string }[];
  /** the roles that log in to their own screens */
  roles: string[];
  /** what one plan covers: "per clinic", "per outlet" … */
  unit: string;
  /** prices before anything is changed in HQ: Starter, Growth, Pro, Business, Enterprise per month */
  monthly: [number, number, number, number, number];
  /** each plan's main limits in this industry, in a few words (shown under the plan names) */
  limits: [string, string, string, string, string];
  /** what each of the five plans includes in this industry, row by row ("*" = fair use for one business) */
  planRows: { label: string; values: string[] }[];
  /** what use above a plan's limits costs in this industry (storage and logins are in OVERAGE_COMMON) */
  overage: string;
  market: string;
  /** add-ons this industry quotes separately (no fixed price) */
  onQuote: string[];
  /** a related product with its own page */
  related?: { label: string; to: string; detail: string };
  /** a setup fee of its own, when it differs from every other app's */
  setup?: number;
  /** a short label on its card: "New", "Highest value" … */
  badge?: string;
  /** the three points that sell this app, shown as cards under the hero and on the flyer */
  pitch?: { title: string; detail: string }[];
  /** a dark band under the pitch cards: what this demo stands for and the bigger version we build (TradeOS: a city's own network) */
  bigger?: { eyebrow: string; title: string; detail: string; points: string[]; cta: string };
  /** two products in one industry: who each one is for, shown as a choice under the hero */
  chooser?: { self: { who: string; price: string }; other: { who: string; price: string } };
}

export const TIERS: { id: TierId; name: string; summary: string; includes: string[]; badge?: string; storage: string; branchesIncluded: number }[] = [
  {
    id: "starter",
    name: "Starter",
    summary: "The full app with your name, for a small team.",
    storage: "2 GB",
    branchesIncluded: 1,
    includes: ["Every screen of the app with your name, logo and colours", "Your own web address (sub-domain)", "2 GB storage, daily backups", "Data import and one training session", "WhatsApp and email support"],
  },
  {
    id: "growth",
    name: "Growth",
    summary: "More people, your own domain and owner reports.",
    badge: "Most chosen",
    storage: "5 GB",
    branchesIncluded: 1,
    includes: ["Everything in Starter", "Your own domain name connected", "5 GB storage", "Monthly owner report and data export", "Priority support, same working day"],
  },
  {
    id: "pro",
    name: "Pro",
    summary: "Every module switched on and changes made for you.",
    storage: "15 GB",
    branchesIncluded: 1,
    includes: ["Everything in Growth", "15 GB storage", "Every optional module of your industry switched on", "Up to 2 hours of changes a month", "Phone support"],
  },
  {
    id: "business",
    name: "Business",
    summary: "Two branches included and a named account manager.",
    storage: "50 GB",
    branchesIncluded: 2,
    includes: ["Everything in Pro", "50 GB storage", "2 branches included", "Up to 4 hours of changes a month", "A named account manager"],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    summary: "Up to five branches, the highest limits and quarterly reviews.",
    storage: "150 GB",
    branchesIncluded: 5,
    includes: ["Everything in Business", "150 GB storage", "Up to 5 branches included", "Up to 8 hours of changes a month", "Quarterly review and first say on new features"],
  },
];

/** Overage rates that are the same in every industry (each industry adds its own in `overage`). */
export const OVERAGE_COMMON =
  "Extra storage ₹99 per 10 GB a month · extra staff login ₹149 a month. Nothing stops when a limit is crossed: you get alerts at 80% and 100%, and use above the limit is billed on the next invoice, or you move up a plan, whichever costs less.";

/**
 * The two ways to buy (approved by the founder, 16 Nov 2026). Shared = the client's branded app on FrameMind's
 * platform (setup + plan, hosting included up to the plan's limits). Dedicated = a separate copy on its own servers:
 * a build fee, monthly maintenance, and hosting/storage billed separately (managed by FrameMind or in the client's
 * own cloud account).
 */
export const DEDICATED = {
  buildFrom: 149999,
  maintenance: [4999, 14999] as [number, number],
  hosting: [
    { name: "Managed · Small", detail: "1 app server, database, 50 GB storage, daily backups, SSL, monitoring", monthly: 2999 },
    { name: "Managed · Medium", detail: "Bigger server, 200 GB storage, hourly backups, a staging copy", monthly: 5999 },
    { name: "Managed · Large", detail: "Multiple servers, 1 TB storage, point-in-time recovery, a higher uptime target", monthly: 11999 },
  ],
  ownCloudSetup: 9999,
  extraStorage: "₹199 per 50 GB a month",
};

export const INDUSTRIES: Industry[] = [
  {
    id: "distribution",
    slug: "distribution",
    name: "Wholesale & Distributors",
    product: "TradeOS",
    icon: "Truck",
    tagline: "Your city's own ordering app: every distributor and every shop in the city, in one free app for shops.",
    who: "The distributors of a city, town or district, together",
    demoBrand: "Sahyadri Distributors",
    demoUrl: "/apps/trade/",
    storyUrl: "/apps/trade/story/",
    badge: "City networks",
    pitch: [
      { title: "One app for the whole city", detail: "Every shop orders from every distributor it buys from, in one free app. One cart, split into one order per distributor." },
      { title: "Your city's name, not ours", detail: "The app carries your city network's own name, logo and colours. TradeOS is the demo of what we build." },
      { title: "Charged per distributor", detail: "Any number of distributors and shops. Shops never pay; each distributor pays for its own plan." },
    ],
    bigger: {
      eyebrow: "How a city network starts",
      title: "10, 20 or more distributors in one city",
      detail:
        "A group of distributors in a city, town or district — or their association — comes to us. We build the city its own app, bring in every distributor's shop list, and more distributors join the same app later.",
      points: [
        "Your city's own app name, logo and colours",
        "Every distributor's shop list brought in; a shop on two lists is linked once",
        "More distributors and shops can join at any time",
      ],
      cta: "See the price per distributor",
    },
    features: [
      { title: "Every distributor in one list", detail: "A shop sees the products of every distributor in the city that serves it, each in that distributor's own colours, and orders everything in one go." },
      { title: "Orders split automatically", detail: "The shop's cart goes out as one order to each distributor. Each distributor sees only its own part." },
      { title: "Available or not available", detail: "One switch per product. No stock counts: switch it off and every shop in the city sees it at once." },
      { title: "Accept, dispatch, deliver", detail: "Each distributor unticks what it can't send, declines with a reason, and the shop follows every step live." },
      { title: "Salespeople and delivery staff", detail: "Each distributor's salespeople book orders on shop visits, and delivery staff close each drop with an OTP." },
      { title: "One record per shop", detail: "Shops are known by mobile number, so a shop that buys from five distributors is one shop in the city's app, never five." },
    ],
    roles: ["Shop (free app)", "Distributor", "Salesperson", "Delivery staff", "City network team"],
    unit: "per distributor",
    monthly: [799, 1299, 1999, 2999, 4999],
    limits: ["100 shops · 2 staff", "300 shops · 5 staff", "750 shops · 10 staff", "2,000 shops · 25 staff", "Unlimited shops · 50 staff"],
    planRows: [{ label: "Shops ordering", values: ["100", "300", "750", "2,000", "Unlimited*"] }, { label: "Salesperson and staff logins", values: ["2", "5", "10", "25", "50"] }, { label: "Optional modules (prices, GST bills, stock, credit)", values: ["—", "2", "All", "All", "All"] }],
    overage: "Extra 100 shops ₹199/month · extra login ₹149/month",
    market: "Distributor ordering software in India typically costs ₹1,799 – ₹3,999 a month, or ₹2,000 – ₹5,000 per distributor, and each distributor gives the shop a separate app. A city network puts every distributor in one free app for shops.",
    onQuote: ["Prices & price lists", "Invoices with GST", "Stock quantities", "Credit & collections", "TallyPrime sync", "Salesperson routes & GPS check-ins", "WhatsApp alerts", "AI insights"],
  },
  {
    id: "realestate",
    slug: "real-estate",
    name: "Real Estate",
    product: "DealOS",
    icon: "Building2",
    demoUrl: "/apps/deal/",
    storyUrl: "/apps/deal/story/",
    tagline: "Every enquiry, site visit and brokerage in one app.",
    who: "Property brokers, real estate offices and channel partners",
    demoBrand: "Hasiru Homes Realty",
    badge: "Highest value",
    features: [
      { title: "Property search", detail: "Buy or rent, BHK, budget, area and parking filters, with photos, a video tour and amenities." },
      { title: "Instant enquiry alerts", detail: "Every enquiry lands in one lead list, with a WhatsApp auto-reply and one-tap call." },
      { title: "OTP-verified site visits", detail: "Visit slots, a client OTP and GPS at the site, and a copy to the owner as proof." },
      { title: "Follow-up reminders", detail: "Today's calls with the last note, auto reminders after a visit and rent renewals at 11 months." },
      { title: "Brokerage ledger", detail: "Deals, brokerage due and received, for every agent." },
      { title: "Team performance", detail: "Leads, visits and deals per agent, for the owner." },
    ],
    roles: ["Buyer / tenant", "Property owner", "Agent", "Channel partner", "Owner / admin"],
    unit: "per office",
    monthly: [999, 1999, 3499, 5999, 9999],
    limits: ["3 agents · 50 listings", "8 agents · 200 listings", "20 agents · 500 listings", "50 agents · 2,000 listings", "100 agents · 5,000 listings"],
    planRows: [{ label: "Agent logins", values: ["3", "8", "20", "50", "100"] }, { label: "Active listings", values: ["50", "200", "500", "2,000", "5,000"] }, { label: "Channel partner portal", values: ["—", "—", "Yes", "Yes", "Yes"] }],
    overage: "Extra agent ₹249/month · extra 100 listings ₹199/month",
    market: "Real estate CRMs in India cost ₹399 – ₹2,200 per user a month; 10 users on a mid-tier CRM is about ₹7,000 – ₹22,000 a month.",
    onQuote: ["Property-portal lead sync", "Multiple offices with one owner dashboard"],
    related: { label: "Real Estate Digital Platform", to: "/real-estate", detail: "Building a layout, villa project or township? See the area-based platform with an interactive plot map." },
    chooser: {
      self: { who: "I'm a broker, agency or channel partner", price: "Monthly plan" },
      other: { who: "I'm developing a layout, villa project or township", price: "Priced per sq ft of the project" },
    },
  },
  {
    id: "clinic",
    slug: "clinic",
    name: "Clinics",
    product: "TokenOS",
    icon: "Stethoscope",
    demoUrl: "/apps/token/",
    storyUrl: "/apps/token/story/",
    tagline: "Tokens from home, a live queue on the patient's phone.",
    who: "Clinics, OPDs and multi-doctor practices",
    demoBrand: "Tulasi Family Clinic",
    features: [
      { title: "Token booking from home", detail: "Patients pick a doctor and day and get a token, with the day's limit closing booking by itself." },
      { title: "Live queue on the phone", detail: "Now running, people ahead and the estimated wait, updating on its own." },
      { title: "Reception desk", detail: "Today's list with arrived, waiting, with doctor and no-show; walk-ins join the same queue." },
      { title: "Doctor's next patient", detail: "Call the next patient in one tap, skip, hold and recall, with visit notes." },
      { title: "Waiting-room TV", detail: "A full-screen display of the running token numbers." },
      { title: "Owner's daily report", detail: "Patients, visits and collections for the day." },
    ],
    roles: ["Patient", "Reception", "Doctor", "Pharmacy", "Owner", "Waiting-room TV"],
    unit: "per clinic",
    monthly: [699, 1299, 1999, 2999, 4999],
    limits: ["1 doctor · 500 visits a month", "3 doctors · 1,500 visits", "6 doctors · 4,000 visits", "12 doctors · 10,000 visits", "25 doctors · 25,000 visits"],
    planRows: [{ label: "Doctors", values: ["1", "3", "6", "12", "25"] }, { label: "Patient visits a month", values: ["500", "1,500", "4,000", "10,000", "25,000"] }, { label: "Pharmacy and lab modules", values: ["—", "—", "Yes", "Yes", "Yes"] }],
    overage: "Extra doctor ₹399/month · extra 500 visits ₹199/month",
    market: "Clinic token and queue software in India costs ₹799 – ₹5,999 a month.",
    onQuote: ["Prescription and report upload with storage", "Multiple branches with one owner dashboard"],
  },
  {
    id: "dental",
    slug: "dental",
    name: "Dental Clinics",
    product: "SmileOS",
    icon: "Smile",
    tagline: "Sittings, tooth charts and instalments, without the paper.",
    who: "Dental clinics and multi-chair practices",
    demoUrl: "/apps/smile/",
    storyUrl: "/apps/smile/story/",
    demoBrand: "Mallige Smile Studio",
    features: [
      { title: "Slot booking", detail: "Work, day and time, with booked slots closed and a confirmation and reminder." },
      { title: "Sitting reminders", detail: "Progress like 1 of 3, the next sitting and one-tap confirm or change." },
      { title: "32-tooth chart", detail: "Both jaws, colour per work, and each tooth's history in a tap." },
      { title: "Treatment plans", detail: "Work per tooth, sittings and cost, sent to the patient for approval." },
      { title: "Instalment tracking", detail: "Total, received and balance, each instalment with its date and mode, with a receipt." },
      { title: "Six-month recalls", detail: "Patients due for a checkup, with one-tap reminders to all of them." },
    ],
    roles: ["Patient", "Reception", "Dentist", "Owner"],
    unit: "per clinic",
    monthly: [799, 1299, 1999, 2999, 4499],
    limits: ["1 chair · 1 dentist", "2 chairs · 3 dentists", "4 chairs · 6 dentists", "8 chairs · 12 dentists", "16 chairs · 25 dentists"],
    planRows: [{ label: "Chairs", values: ["1", "2", "4", "8", "16"] }, { label: "Dentist logins", values: ["1", "3", "6", "12", "25"] }, { label: "X-ray and photo storage", values: ["2 GB", "5 GB", "15 GB", "50 GB", "150 GB"] }],
    overage: "Extra chair ₹399/month · extra dentist ₹249/month",
    market: "Dental clinic software in India costs about ₹1,149 – ₹2,475 a month, or ₹6,000 – ₹60,000 a year.",
    onQuote: ["Crown and denture lab order tracking", "X-ray and file storage"],
  },
  {
    id: "lab",
    slug: "lab",
    name: "Diagnostic Labs",
    product: "SampleOS",
    icon: "FlaskConical",
    demoUrl: "/apps/sample/",
    storyUrl: "/apps/sample/story/",
    tagline: "Bookings, home collection and reports on the patient's phone.",
    who: "Pathology labs, diagnostic centres and collection centres",
    demoBrand: "Nandadeepa Diagnostics",
    features: [
      { title: "Test booking with prices", detail: "Tests and packages with prices upfront, home or lab visit, and a day and time slot." },
      { title: "Home collection tracking", detail: "The collection partner, an ETA and every step from booking to sample taken." },
      { title: "Sample status", detail: "Received, running, checked by the pathologist and ready, with the time of each step." },
      { title: "Report on the phone", detail: "Every value with its normal range, high and low in colour, a PDF, and trends over time." },
      { title: "Lab dashboard", detail: "The day's collection, pending payments, pending reports and the monthly report." },
      { title: "Collection partner app", detail: "New requests, the trip, sample OTP and the cash to hand over." },
    ],
    roles: ["Patient", "Collection partner", "Lab technician", "Pathologist", "Referring doctor", "Owner"],
    unit: "per lab",
    monthly: [999, 1999, 3499, 5999, 9999],
    limits: ["1,000 tests a month · 3 staff", "3,000 tests · 1 centre", "8,000 tests · 3 centres", "20,000 tests · 8 centres", "50,000 tests · 20 centres"],
    planRows: [{ label: "Tests a month", values: ["1,000", "3,000", "8,000", "20,000", "50,000"] }, { label: "Collection centres", values: ["—", "1", "3", "8", "20"] }, { label: "Staff logins", values: ["3", "8", "15", "30", "60"] }],
    overage: "Extra 100 tests ₹99/month · extra collection centre ₹499/month",
    market: "Lab software in India runs from about ₹417 to ₹5,000 a month; large-lab systems ₹8,000 – ₹25,000 a month.",
    onQuote: ["Live GPS tracking of collection partners", "Doctor and referral partner portal with commissions", "Analyser machine interfacing"],
  },
  {
    id: "restaurant",
    slug: "restaurant",
    name: "Restaurants",
    product: "TableOS",
    icon: "UtensilsCrossed",
    demoUrl: "/apps/table/",
    storyUrl: "/apps/table/story/",
    tagline: "QR menu to kitchen screen to bill, and your own direct orders.",
    who: "Restaurants, cafés, cloud kitchens and food courts",
    demoBrand: "Spice Route Kitchen",
    features: [
      { title: "QR table menu", detail: "A QR per table, categories, veg and non-veg marks; orders go straight to the kitchen." },
      { title: "Your own order link", detail: "Delivery and pickup orders on your own link, with no aggregator commission." },
      { title: "Kitchen screen", detail: "Table and online orders together, minutes since order, and READY in one tap." },
      { title: "Waiter app", detail: "Every table's status, taking orders with notes, and waiter calls." },
      { title: "GST bill", detail: "Items merged per table, GST worked out, cash, UPI or card, and the bill on WhatsApp." },
      { title: "Today's sale", detail: "Sales by mode and channel, top dishes, sales by hour and menu and rate changes." },
    ],
    roles: ["Customer", "Waiter", "Kitchen", "Owner"],
    unit: "per outlet",
    monthly: [599, 999, 1599, 2499, 3999],
    limits: ["3 staff · 300 online orders", "8 staff · 1,000 orders", "15 staff · 3,000 orders", "30 staff · 10,000 orders", "60 staff · unlimited orders"],
    planRows: [{ label: "Staff logins", values: ["3", "8", "15", "30", "60"] }, { label: "Own online orders a month", values: ["300", "1,000", "3,000", "10,000", "Unlimited*"] }, { label: "Kitchen screens", values: ["1", "2", "4", "8", "Unlimited"] }],
    overage: "Extra 1,000 online orders ₹299/month · extra kitchen screen ₹199/month",
    market: "Restaurant POS in India costs about ₹7,500 – ₹18,000 a year per outlet; food apps charge a commission on every order.",
    onQuote: ["Bill split and printer integration", "Delivery areas and charges", "Inventory and recipe costing"],
  },
  {
    id: "gym",
    slug: "gym",
    name: "Gyms & Fitness",
    product: "FitOS",
    icon: "Dumbbell",
    demoUrl: "/apps/fit/",
    storyUrl: "/apps/fit/story/",
    tagline: "Joining, attendance, plans and renewals that chase themselves.",
    who: "Gyms, fitness studios, yoga and CrossFit boxes",
    demoBrand: "Iron Pulse Fitness",
    features: [
      { title: "Online joining", detail: "1, 3 and 12-month plans with what each includes, paid by UPI." },
      { title: "QR attendance", detail: "Scan the gate QR; morning and evening batches, streaks and week dots." },
      { title: "Workout and diet plans", detail: "Trainers send sets, reps and meals; members tick them off." },
      { title: "Fees and renewals", detail: "Fees with a receipt, and members ending this week with one-tap reminders." },
      { title: "Trainer view", detail: "Each trainer's members, their goals and weight progress." },
      { title: "Owner's daily report", detail: "Fees by mode, pending, attendance, new members and renewals." },
    ],
    roles: ["Member", "Reception", "Trainer", "Owner"],
    unit: "per gym",
    monthly: [699, 1199, 1999, 2999, 4999],
    limits: ["150 members · 2 staff", "400 members · 5 staff", "1,000 members · 10 staff", "2,500 members · 20 staff", "Unlimited members · 40 staff"],
    planRows: [{ label: "Active members", values: ["150", "400", "1,000", "2,500", "Unlimited*"] }, { label: "Staff and trainer logins", values: ["2", "5", "10", "20", "40"] }, { label: "Classes and personal training", values: ["—", "Yes", "Yes", "Yes", "Yes"] }],
    overage: "Extra 100 members ₹199/month · extra login ₹149/month",
    market: "Gym software in India costs about ₹499 – ₹2,499 a month; premium tools up to ≈ ₹13,400.",
    onQuote: ["Biometric or RFID entry", "Personal-training package billing", "Progress photos and body measurements"],
  },
  {
    id: "salon",
    slug: "salon",
    name: "Salons & Spas",
    product: "GlowOS",
    icon: "Scissors",
    demoUrl: "/apps/glow/",
    storyUrl: "/apps/glow/story/",
    tagline: "Bookings, a live queue and clients who come back.",
    who: "Salons, spas, barbershops and beauty studios",
    demoBrand: "Kanakambara Salon & Spa",
    features: [
      { title: "Slot booking", detail: "Services with rates, a stylist or anyone, day and time, with full slots crossed out." },
      { title: "Live queue", detail: "People ahead, the approximate wait and what is in each chair." },
      { title: "Walk-in tokens", detail: "Walk-ins join the same queue as bookings." },
      { title: "UPI billing", detail: "Bills with receipts, packages and membership discounts." },
      { title: "Client notes", detail: "Every client's history and notes, for every stylist." },
      { title: "Commission and comebacks", detail: "Staff commission worked out, and 30-day comeback reminders." },
    ],
    roles: ["Client", "Reception", "Stylist / therapist", "Owner"],
    unit: "per outlet",
    monthly: [599, 999, 1699, 2699, 4499],
    limits: ["3 staff · 500 bookings a month", "8 staff · 1,500 bookings", "15 staff · 4,000 bookings", "30 staff · 10,000 bookings", "60 staff · 25,000 bookings"],
    planRows: [{ label: "Staff logins", values: ["3", "8", "15", "30", "60"] }, { label: "Appointments a month", values: ["500", "1,500", "4,000", "10,000", "25,000"] }, { label: "Memberships and gift cards", values: ["—", "Yes", "Yes", "Yes", "Yes"] }],
    overage: "Extra staff login ₹149/month · extra 500 appointments ₹149/month",
    market: "Salon software in India costs about ₹499 – ₹2,500 a month per outlet.",
    onQuote: ["Product inventory", "Multiple outlets with one owner dashboard"],
  },
  {
    id: "coaching",
    slug: "coaching",
    name: "Coaching Centres",
    product: "ClassOS",
    icon: "GraduationCap",
    demoUrl: "/apps/class/",
    storyUrl: "/apps/class/story/",
    tagline: "Batches, fees and results, in one place.",
    who: "Tuition and coaching centres: NEET, JEE, KCET, PUC and school tuition",
    demoBrand: "Akshara Learning Centre",
    features: [
      { title: "Enquiries and demo classes", detail: "Counselling notes, follow-ups and a free demo class booked from your website." },
      { title: "Admissions and batches", detail: "An online admission form with documents, and batch allotment within seat limits." },
      { title: "Fees in instalments", detail: "Fee plans with instalments and concessions, UPI payment, receipts and reminders." },
      { title: "Attendance with a parent alert", detail: "Roll call or a class QR; the parent of an absent student hears at once." },
      { title: "Online tests that mark themselves", detail: "Timed MCQ tests from your question bank, with rank, percentile and topic analysis." },
      { title: "Parent app and owner view", detail: "Marks, report cards and fees for parents; collection, results and teacher pay for you." },
    ],
    roles: ["Student", "Parent", "Teacher", "Counsellor / front desk", "Owner"],
    unit: "per centre",
    monthly: [799, 1299, 1999, 3499, 5999],
    limits: ["100 students · 3 staff", "300 students · 8 staff", "750 students · 15 staff", "2,000 students · 40 staff", "5,000 students · 80 staff"],
    planRows: [{ label: "Active students", values: ["100", "300", "750", "2,000", "5,000"] }, { label: "Teacher and staff logins", values: ["3", "8", "15", "40", "80"] }, { label: "Online tests", values: ["—", "Yes", "Yes", "Yes", "Yes"] }],
    overage: "Extra 50 students ₹199/month · extra login ₹149/month",
    market: "Coaching-centre software in India is usually priced per centre or per student each month.",
    onQuote: ["Recorded video lectures with DRM (video hosting)", "Live classes through your Zoom / Meet account"],
  },
  {
    id: "pg",
    slug: "pg-hostel",
    name: "PG & Hostels",
    product: "DormOS",
    icon: "BedDouble",
    demoUrl: "/apps/dorm/",
    storyUrl: "/apps/dorm/story/",
    tagline: "Rent, bills, complaints and vacant beds on one screen.",
    who: "PGs, hostels, co-living and student housing",
    demoBrand: "Nest Stay PG",
    features: [
      { title: "Online rent", detail: "Rent and food with a due date, late reminders and a receipt for every payment." },
      { title: "Electricity bills", detail: "Room-wise readings, units × rate, split between room-mates." },
      { title: "Photo complaints", detail: "Category and photo, with status from sent to fixed." },
      { title: "Food menu", detail: "The week's breakfast, lunch and dinner, and 'no food today' in one tap." },
      { title: "Tenant onboarding", detail: "Room, bed, rent, deposit, ID proof and agreement." },
      { title: "Owner's accounts", detail: "Rent and deposits, and a live vacant-bed list with a link to share." },
    ],
    roles: ["Tenant", "Manager", "Owner"],
    unit: "per property",
    monthly: [399, 699, 1199, 1999, 2999],
    limits: ["30 beds · 2 staff", "75 beds · 4 staff", "150 beds · 8 staff", "300 beds · 15 staff", "600 beds · 30 staff"],
    planRows: [{ label: "Beds", values: ["30", "75", "150", "300", "600"] }, { label: "Staff logins", values: ["2", "4", "8", "15", "30"] }, { label: "Parent app (hostels)", values: ["—", "—", "Yes", "Yes", "Yes"] }],
    overage: "Extra bed ₹15/month · extra login ₹149/month",
    market: "PG management software in India costs about ₹299 – ₹2,499 a month.",
    onQuote: ["UPI AutoPay for rent", "Smart electricity meters", "Digital rent agreements"],
  },
];

/** Industries without a ready app yet: built to order on the same foundation, priced after a call. */
export const MORE_INDUSTRIES: { name: string; icon: string; examples: string }[] = [
  { name: "Builders & Construction", icon: "HardHat", examples: "Site progress, labour attendance, materials and contractor bills" },
  { name: "Schools", icon: "School", examples: "Admissions, fees, attendance, report cards and a parent app" },
  { name: "Hospitals", icon: "Hospital", examples: "OPD, IPD beds, billing, pharmacy and lab in one system" },
  { name: "Jewellers", icon: "Gem", examples: "Daily gold rate, savings schemes, orders and repairs" },
  { name: "Hotels & Homestays", icon: "Hotel", examples: "Direct bookings, rooms, check-in and guest requests" },
  { name: "Automobile Dealers & Garages", icon: "Car", examples: "Bookings, job cards, service reminders and parts" },
  { name: "Pharmacies", icon: "Pill", examples: "Stock with expiry, refill reminders and home delivery" },
];

/* ── the numbers HQ controls (Money → Rate Card → Industries) ── */

export interface IndustryRates {
  /** one-time: your name, logo and colours, data import, training and go-live */
  setup: number;
  /** months free when paying a year upfront */
  annualFreeMonths: number;
  /** each extra branch / outlet, as a percent of the plan */
  branchPercent: number;
  /** `setup` is the app's own setup fee when it has one; otherwise the common `setup` above applies */
  plans: { id: IndustryId; monthly: [number, number, number, number, number]; setup?: number }[];
  addOns: { id: string; price: number }[];
}

/** Add-ons every industry can take, with their one-time price (HQ can change it). */
export const INDUSTRY_ADD_ONS: { id: string; label: string; detail: string }[] = [
  { id: "whatsapp", label: "WhatsApp Business messages", detail: "Real confirmations, reminders and receipts. Setup; Meta's per-message charges are paid at actuals." },
  { id: "payments", label: "Online payments", detail: "A payment gateway in your name, so customers pay inside the app." },
  { id: "language", label: "Hindi / Kannada / regional language", detail: "The app in one more language, beyond English and Hinglish." },
  { id: "android", label: "Android app on Play Store", detail: "Your app listed on Google Play under your name. The Play Store fee is paid in your account." },
  { id: "ios", label: "iPhone app on the App Store", detail: "Your app on the App Store under your name. Apple's $99 a year is paid in your account." },
  { id: "sms", label: "SMS (OTP and reminders)", detail: "Text messages from your sender name. SMS charges are paid at actuals." },
  { id: "migration", label: "Data migration from your old software", detail: "Your customers, history and balances moved across. From this price; large data is quoted." },
];

export const DEFAULT_INDUSTRY_RATES: IndustryRates = {
  setup: 14999,
  annualFreeMonths: 2,
  branchPercent: 50,
  plans: INDUSTRIES.map((i) => ({ id: i.id, monthly: [...i.monthly] as [number, number, number, number, number], ...(i.setup ? { setup: i.setup } : {}) })),
  addOns: [
    { id: "whatsapp", price: 4999 },
    { id: "payments", price: 4999 },
    { id: "language", price: 9999 },
    { id: "android", price: 14999 },
    { id: "ios", price: 24999 },
    { id: "sms", price: 1999 },
    { id: "migration", price: 4999 },
  ],
};

const TIER_INDEX: Record<TierId, number> = { starter: 0, growth: 1, pro: 2, business: 3, enterprise: 4 };

export const industryBySlug = (slug: string) => INDUSTRIES.find((i) => i.slug === slug);
export const industryById = (id: string) => INDUSTRIES.find((i) => i.id === id);

/** The monthly price of a tier, from HQ's numbers or the published ones. */
export function tierPrice(rates: IndustryRates | null | undefined, id: IndustryId, tier: TierId) {
  const r = rates?.plans.find((p) => p.id === id)?.monthly ?? industryById(id)?.monthly ?? [0, 0, 0, 0, 0];
  return r[TIER_INDEX[tier]] ?? 0;
}

/** The setup fee of an app: its own when it has one, otherwise the common fee. */
export function setupFor(rates: IndustryRates | null | undefined, id: IndustryId) {
  const r = rates ?? DEFAULT_INDUSTRY_RATES;
  return r.plans.find((p) => p.id === id)?.setup ?? DEFAULT_INDUSTRY_RATES.plans.find((p) => p.id === id)?.setup ?? r.setup;
}

export function addOnPriceOf(rates: IndustryRates | null | undefined, id: string) {
  return (rates ?? DEFAULT_INDUSTRY_RATES).addOns.find((a) => a.id === id)?.price ?? DEFAULT_INDUSTRY_RATES.addOns.find((a) => a.id === id)?.price ?? 0;
}

export interface IndustryQuote {
  industry: Industry;
  tier: (typeof TIERS)[number];
  billing: "monthly" | "annual";
  branches: number;
  /** the plan per month for one branch */
  plan: number;
  /** all branches, per month, before the annual discount */
  monthly: number;
  /** what is paid each month (monthly billing) or each year (annual billing) */
  recurring: number;
  /** the same, as a monthly figure */
  perMonth: number;
  setup: number;
  addOns: { id: string; label: string; price: number }[];
  /** setup + add-ons + the first month or the first year */
  firstPayment: number;
  /** the recurring rows and the one-time rows, for quotes and prints */
  oneTimeItems: { group: string; label: string; price: number }[];
}

/** Prices an industry app: setup and add-ons once, then the plan for every branch, monthly or a year at a time. */
export function priceIndustry(rates: IndustryRates | null | undefined, id: IndustryId, tierId: TierId, billing: "monthly" | "annual", branches: number, addOnIds: string[]): IndustryQuote {
  const r = rates ?? DEFAULT_INDUSTRY_RATES;
  const industry = industryById(id) ?? INDUSTRIES[0];
  const tier = TIERS.find((t) => t.id === tierId) ?? TIERS[1];
  const b = Math.max(1, Math.min(50, Math.round(branches) || 1));
  const plan = tierPrice(r, industry.id, tier.id);
  const setup = setupFor(r, industry.id);
  // Business includes 2 branches and Enterprise 5; each branch beyond those adds branchPercent of the plan
  const monthly = Math.round(plan + plan * Math.max(0, b - tier.branchesIncluded) * (r.branchPercent / 100));
  const year = monthly * Math.max(0, 12 - r.annualFreeMonths);
  const recurring = billing === "annual" ? year : monthly;
  const perMonth = billing === "annual" ? Math.round(year / 12) : monthly;
  const addOns = INDUSTRY_ADD_ONS.filter((a) => addOnIds.includes(a.id)).map((a) => ({ id: a.id, label: a.label, price: addOnPriceOf(r, a.id) }));
  const oneTimeItems = [{ group: "One-time", label: `Setup — ${industry.product} with your name, logo and colours, data import, training and go-live`, price: setup }, ...addOns.map((a) => ({ group: "Add-ons", label: a.label, price: a.price }))];
  return {
    industry,
    tier,
    billing,
    branches: b,
    plan,
    monthly,
    recurring,
    perMonth,
    setup,
    addOns,
    firstPayment: oneTimeItems.reduce((s, i) => s + i.price, 0) + recurring,
    oneTimeItems,
  };
}
