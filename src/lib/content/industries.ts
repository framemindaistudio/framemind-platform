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
 *   distribution ₹1,799–₹3,999 flat (Mulberry Sales) · ₹2,000–₹5,000 per distributor (DMS buyer's guide) · ₹1,500–₹4,000 per user (BeatRoute)   goodfirms.co, aiaccountant.com
 */

export type IndustryId = "distribution" | "realestate" | "clinic" | "dental" | "lab" | "restaurant" | "gym" | "salon" | "pg";
export type TierId = "starter" | "growth" | "pro";

export interface Industry {
  id: IndustryId;
  /** the URL: /industries/<slug>; the demo: /demos/<slug>/ */
  slug: string;
  name: string;
  /** "Clinic App" */
  product: string;
  icon: string;
  tagline: string;
  who: string;
  /** the demo business, shown so visitors know the names in it are made up */
  demoBrand: string;
  features: { title: string; detail: string }[];
  /** the roles that log in to their own screens */
  roles: string[];
  /** what one plan covers: "per clinic", "per outlet" … */
  unit: string;
  /** prices before anything is changed in HQ: Starter, Growth, Pro per month */
  monthly: [number, number, number];
  /** what tier differences mean in this industry (shown under the plan names) */
  limits: [string, string, string];
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
  /** two products in one industry: who each one is for, shown as a choice under the hero */
  chooser?: { self: { who: string; price: string }; other: { who: string; price: string } };
}

export const TIERS: { id: TierId; name: string; summary: string; includes: string[]; badge?: string }[] = [
  {
    id: "starter",
    name: "Starter",
    summary: "The full app with your name, for one branch.",
    includes: ["Every screen of the app, with your name, logo and colours", "Your own web address (subdomain)", "Up to 3 staff logins", "Data import and one training session", "Email and WhatsApp chat support"],
  },
  {
    id: "growth",
    name: "Growth",
    summary: "More staff, your own domain and owner reports.",
    badge: "Most chosen",
    includes: ["Everything in Starter", "Up to 10 staff logins", "Your own domain name connected", "Monthly owner report and data export", "Priority support, same working day"],
  },
  {
    id: "pro",
    name: "Pro",
    summary: "Unlimited staff and changes made for you every month.",
    includes: ["Everything in Growth", "Unlimited staff logins", "Up to 4 hours of custom changes a month", "Phone support and a named account manager", "Quarterly review of how the app is used"],
  },
];

export const INDUSTRIES: Industry[] = [
  {
    id: "distribution",
    slug: "distribution",
    name: "Wholesale & Distributors",
    product: "TradeOS",
    icon: "Truck",
    tagline: "One free app where your shops order from you — and from every distributor they buy from.",
    who: "FMCG, electrical and building-material distributors and wholesalers",
    demoBrand: "Sahyadri Distributors",
    badge: "New · TradeOS",
    setup: 15000,
    pitch: [
      { title: "Free for your shops", detail: "Shops install one app and order from every distributor on TradeOS. You pay; they never do." },
      { title: "Your brand inside the app", detail: "Your name and colours on your products and orders, next to the other distributors your shops buy from." },
      { title: "Just ordering — the rest only if you want it", detail: "No prices, invoices or stock counts to keep up. Add them later, one at a time, when you need them." },
    ],
    features: [
      { title: "One app, every distributor", detail: "A shop sees the products of all the distributors who added it in one list, and orders everything in one go." },
      { title: "Orders split automatically", detail: "The shop's cart is sent as one order to each distributor — you only ever see your part." },
      { title: "Available or not available", detail: "One switch per product. No stock counts: switch it off and shops see it at once." },
      { title: "Accept, dispatch, deliver", detail: "Untick what you can't send this time, decline with a reason, and the shop follows every step live." },
      { title: "Salesperson ordering", detail: "Your salespeople book orders for your shops on the visit, from your own products." },
      { title: "Bring your shops", detail: "Send your shop list; shops already on TradeOS through another distributor are linked, not duplicated." },
    ],
    roles: ["Shop (free app)", "Salesperson", "Distributor"],
    unit: "per distributor",
    monthly: [999, 1499, 1999],
    limits: ["Up to 100 shops", "Up to 500 shops", "Unlimited shops"],
    market: "Distributor ordering and management software in India typically costs ₹1,799 – ₹3,999 a month, or ₹2,000 – ₹5,000 per distributor — and each one is its own app for the shop. With TradeOS your shops use one free app for all their distributors.",
    onQuote: ["Prices & price lists", "Invoices with GST", "Stock quantities", "Credit & collections", "TallyPrime sync", "Salesperson routes & GPS check-ins", "WhatsApp alerts", "AI insights"],
  },
  {
    id: "realestate",
    slug: "real-estate",
    name: "Real Estate",
    product: "Real Estate Broker App",
    icon: "Building2",
    tagline: "Every enquiry, site visit and brokerage in one app.",
    who: "Property brokers, real estate offices and channel partners",
    demoBrand: "Skyline Realty",
    badge: "Highest value",
    features: [
      { title: "Property search", detail: "Buy or rent, BHK, budget, area and parking filters, with photos, a video tour and amenities." },
      { title: "Instant enquiry alerts", detail: "Every enquiry lands in one lead list, with a WhatsApp auto-reply and one-tap call." },
      { title: "OTP-verified site visits", detail: "Visit slots, a client OTP and GPS at the site, and a copy to the owner as proof." },
      { title: "Follow-up reminders", detail: "Today's calls with the last note, auto reminders after a visit and rent renewals at 11 months." },
      { title: "Brokerage ledger", detail: "Deals, brokerage due and received, for every agent." },
      { title: "Team performance", detail: "Leads, visits and deals per agent, for the owner." },
    ],
    roles: ["Client", "Agent", "Owner"],
    unit: "per office",
    monthly: [1499, 2999, 5999],
    limits: ["Up to 3 users", "Up to 10 users", "Up to 25 users"],
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
    product: "Clinic App",
    icon: "Stethoscope",
    tagline: "Tokens from home, a live queue on the patient's phone.",
    who: "Clinics, OPDs and multi-doctor practices",
    demoBrand: "Sunrise Clinic",
    features: [
      { title: "Token booking from home", detail: "Patients pick a doctor and day and get a token, with the day's limit closing booking by itself." },
      { title: "Live queue on the phone", detail: "Now running, people ahead and the estimated wait, updating on its own." },
      { title: "Reception desk", detail: "Today's list with arrived, waiting, with doctor and no-show; walk-ins join the same queue." },
      { title: "Doctor's next patient", detail: "Call the next patient in one tap, skip, hold and recall, with visit notes." },
      { title: "Waiting-room TV", detail: "A full-screen display of the running token numbers." },
      { title: "Owner's daily report", detail: "Patients, visits and collections for the day." },
    ],
    roles: ["Patient", "Reception", "Doctor", "Owner", "TV screen"],
    unit: "per clinic",
    monthly: [999, 1999, 3999],
    limits: ["1 doctor", "Up to 3 doctors", "Up to 8 doctors"],
    market: "Clinic token and queue software in India costs ₹799 – ₹5,999 a month.",
    onQuote: ["Prescription and report upload with storage", "Multiple branches with one owner dashboard"],
  },
  {
    id: "dental",
    slug: "dental",
    name: "Dental Clinics",
    product: "Dental Clinic App",
    icon: "Smile",
    tagline: "Sittings, tooth charts and instalments, without the paper.",
    who: "Dental clinics and multi-chair practices",
    demoBrand: "Pearl Dental Care",
    features: [
      { title: "Slot booking", detail: "Work, day and time, with booked slots closed and a confirmation and reminder." },
      { title: "Sitting reminders", detail: "Progress like 1 of 3, the next sitting and one-tap confirm or change." },
      { title: "32-tooth chart", detail: "Both jaws, colour per work, and each tooth's history in a tap." },
      { title: "Treatment plans", detail: "Work per tooth, sittings and cost, sent to the patient for approval." },
      { title: "Instalment tracking", detail: "Total, received and balance, each instalment with its date and mode, with a receipt." },
      { title: "Six-month recalls", detail: "Patients due for a checkup, with one-tap reminders to all of them." },
    ],
    roles: ["Patient", "Reception", "Doctor", "Owner"],
    unit: "per clinic",
    monthly: [999, 1999, 2999],
    limits: ["1 chair", "Up to 3 chairs", "Up to 6 chairs"],
    market: "Dental clinic software in India costs about ₹1,149 – ₹2,475 a month, or ₹6,000 – ₹60,000 a year.",
    onQuote: ["Crown and denture lab order tracking", "X-ray and file storage"],
  },
  {
    id: "lab",
    slug: "lab",
    name: "Diagnostic Labs",
    product: "Diagnostic Lab App",
    icon: "FlaskConical",
    tagline: "Bookings, home collection and reports on the patient's phone.",
    who: "Pathology labs, diagnostic centres and collection centres",
    demoBrand: "CarePoint Diagnostics",
    features: [
      { title: "Test booking with prices", detail: "Tests and packages with prices upfront, home or lab visit, and a day and time slot." },
      { title: "Home collection tracking", detail: "The collection partner, an ETA and every step from booking to sample taken." },
      { title: "Sample status", detail: "Received, running, checked by the pathologist and ready, with the time of each step." },
      { title: "Report on the phone", detail: "Every value with its normal range, high and low in colour, a PDF, and trends over time." },
      { title: "Lab dashboard", detail: "The day's collection, pending payments, pending reports and the monthly report." },
      { title: "Collection partner app", detail: "New requests, the trip, sample OTP and the cash to hand over." },
    ],
    roles: ["Patient", "Collection partner", "Lab desk", "Owner"],
    unit: "per lab",
    monthly: [999, 2499, 4999],
    limits: ["Up to 50 patients a day", "Up to 200 patients a day", "Up to 600 patients a day"],
    market: "Lab software in India runs from about ₹417 to ₹5,000 a month; large-lab systems ₹8,000 – ₹25,000 a month.",
    onQuote: ["Live GPS tracking of collection partners", "Doctor and referral partner portal with commissions", "Analyser machine interfacing"],
  },
  {
    id: "restaurant",
    slug: "restaurant",
    name: "Restaurants",
    product: "Restaurant App",
    icon: "UtensilsCrossed",
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
    monthly: [999, 1999, 3499],
    limits: ["Up to 15 tables", "Up to 40 tables", "Unlimited tables"],
    market: "Restaurant POS in India costs about ₹7,500 – ₹18,000 a year per outlet; food apps charge a commission on every order.",
    onQuote: ["Bill split and printer integration", "Delivery areas and charges", "Inventory and recipe costing"],
  },
  {
    id: "gym",
    slug: "gym",
    name: "Gyms & Fitness",
    product: "Gym App",
    icon: "Dumbbell",
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
    monthly: [799, 1499, 2999],
    limits: ["Up to 150 members", "Up to 500 members", "Unlimited members"],
    market: "Gym software in India costs about ₹499 – ₹2,499 a month; premium tools up to ≈ ₹13,400.",
    onQuote: ["Biometric or RFID entry", "Personal-training package billing", "Progress photos and body measurements"],
  },
  {
    id: "salon",
    slug: "salon",
    name: "Salons & Spas",
    product: "Salon App",
    icon: "Scissors",
    tagline: "Bookings, a live queue and clients who come back.",
    who: "Salons, spas, barbershops and beauty studios",
    demoBrand: "Glow Studio Salon",
    features: [
      { title: "Slot booking", detail: "Services with rates, a stylist or anyone, day and time, with full slots crossed out." },
      { title: "Live queue", detail: "People ahead, the approximate wait and what is in each chair." },
      { title: "Walk-in tokens", detail: "Walk-ins join the same queue as bookings." },
      { title: "UPI billing", detail: "Bills with receipts, packages and membership discounts." },
      { title: "Client notes", detail: "Every client's history and notes, for every stylist." },
      { title: "Commission and comebacks", detail: "Staff commission worked out, and 30-day comeback reminders." },
    ],
    roles: ["Customer", "Reception", "Stylist", "Owner"],
    unit: "per outlet",
    monthly: [799, 1499, 2999],
    limits: ["Up to 3 stylists", "Up to 10 stylists", "Unlimited stylists"],
    market: "Salon software in India costs about ₹499 – ₹2,500 a month per outlet.",
    onQuote: ["Product inventory", "Multiple outlets with one owner dashboard"],
  },
  {
    id: "pg",
    slug: "pg-hostel",
    name: "PG & Hostels",
    product: "PG / Hostel App",
    icon: "BedDouble",
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
    monthly: [499, 999, 1999],
    limits: ["Up to 30 beds", "Up to 100 beds", "Up to 300 beds"],
    market: "PG management software in India costs about ₹299 – ₹2,499 a month.",
    onQuote: ["UPI AutoPay for rent", "Smart electricity meters", "Digital rent agreements"],
  },
];

/** Industries without a ready app yet: built to order on the same foundation, priced after a call. */
export const MORE_INDUSTRIES: { name: string; icon: string; examples: string }[] = [
  { name: "Builders & Construction", icon: "HardHat", examples: "Site progress, labour attendance, materials and contractor bills" },
  { name: "Schools & Coaching", icon: "School", examples: "Admissions, fees, attendance, tests and a parent app" },
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
  plans: { id: IndustryId; monthly: [number, number, number]; setup?: number }[];
  addOns: { id: string; price: number }[];
}

/** Add-ons every industry can take, with their one-time price (HQ can change it). */
export const INDUSTRY_ADD_ONS: { id: string; label: string; detail: string }[] = [
  { id: "whatsapp", label: "WhatsApp Business messages", detail: "Real confirmations, reminders and receipts. Setup; Meta's per-message charges are paid at actuals." },
  { id: "payments", label: "Online payments", detail: "A payment gateway in your name, so customers pay inside the app." },
  { id: "language", label: "Hindi / Kannada / regional language", detail: "The app in one more language, beyond English and Hinglish." },
  { id: "android", label: "Android app on Play Store", detail: "Your app listed on Google Play under your name." },
];

export const DEFAULT_INDUSTRY_RATES: IndustryRates = {
  setup: 14999,
  annualFreeMonths: 2,
  branchPercent: 50,
  plans: INDUSTRIES.map((i) => ({ id: i.id, monthly: [...i.monthly] as [number, number, number], ...(i.setup ? { setup: i.setup } : {}) })),
  addOns: [
    { id: "whatsapp", price: 4999 },
    { id: "payments", price: 4999 },
    { id: "language", price: 9999 },
    { id: "android", price: 14999 },
  ],
};

const TIER_INDEX: Record<TierId, number> = { starter: 0, growth: 1, pro: 2 };

export const industryBySlug = (slug: string) => INDUSTRIES.find((i) => i.slug === slug);
export const industryById = (id: string) => INDUSTRIES.find((i) => i.id === id);

/** The monthly price of a tier, from HQ's numbers or the published ones. */
export function tierPrice(rates: IndustryRates | null | undefined, id: IndustryId, tier: TierId) {
  const r = rates?.plans.find((p) => p.id === id)?.monthly ?? industryById(id)?.monthly ?? [0, 0, 0];
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
  const monthly = Math.round(plan + plan * (b - 1) * (r.branchPercent / 100));
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
