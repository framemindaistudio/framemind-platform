/**
 * Packaging design service: the published "from" prices and the sample brand worlds shown on /packaging.
 *
 * Prices were set in Nov 2026 against the Indian market: freelancers quote about ₹5k–20k per SKU, boutique studios
 * ₹20k–60k, agencies ₹75k–2.5L+, and size or flavour variants of an approved design ₹5k–25k (sources: avval.in,
 * suramya.co, creativeline.co.in, kavinarulraj.com packaging-cost guides). FrameMind sits at the studio end of the
 * freelancer range with agency-grade files: real dielines, regulatory panels and a 3D proof of every size.
 * These are the defaults: HQ → Money → Rate Card → Packaging overrides every "from" price (RateCard.packaging), and the
 * website reads it through packagingWith().
 */

export interface PackTier {
  id: string;
  name: string;
  from: number;
  unit: string;
  detail: string;
  examples: string;
}

export const PACK_TIERS: PackTier[] = [
  { id: "label", name: "Label or wrap", from: 9500, unit: "per SKU", detail: "Jar, bottle, can, tin or cup wrap with the full legal panel", examples: "Pickle jar label · can wrap · dropper label" },
  { id: "pouch", name: "Pouch or bag", from: 14500, unit: "per SKU", detail: "Front, back and gussets on your converter's template", examples: "Stand-up pouch · flat-bottom coffee bag" },
  { id: "carton", name: "Carton or box", from: 18500, unit: "per SKU", detail: "Every panel on a structural dieline: lids, flaps, glue tab", examples: "Tuck-end carton · tea-bag box · soap box" },
  { id: "rigid", name: "Gift box or carry bag", from: 24000, unit: "per SKU", detail: "Lid and base, walls and glue tabs, or bag panels and gussets", examples: "Mithai box · gift box of 3 · shopping bag" },
];

export const PACK_EXTRAS = [
  { id: "variant", name: "Extra size or flavour", from: 3500, unit: "per variant", detail: "Resized and re-flowed from an approved design, new legal panel" },
  { id: "illustration", name: "Custom illustration", from: 12000, unit: "per artwork", detail: "Drawn by hand for your brand, delivered as layered files" },
  { id: "language", name: "Extra language panel", from: 2500, unit: "per SKU", detail: "Hindi, Kannada, Tamil, Telugu, Malayalam or Marathi" },
  { id: "print", name: "Printer coordination", from: 4000, unit: "per SKU", detail: "Pre-press checks, proof approval and file hand-off to your printer" },
];

export const PACK_BUNDLES = [
  { id: "range", name: "Range launch", from: 49000, detail: "3 SKUs, every size in 3D, a mockup set for your store and social" },
  { id: "world", name: "Brand world", from: 145000, detail: "Identity and guidelines, 5 SKUs, stationery and a 3D brand story" },
];

export const PRICE_FACTORS = [
  "Pack type and the number of printed panels",
  "How many sizes and flavours share one design",
  "Illustration: commissioned, from your library, or photography",
  "Languages and regulatory panels (FSSAI, cosmetics, legal metrology)",
  "Finishes: foil, spot UV, emboss, window cut-outs",
];

export interface BrandWorld {
  id: string;
  name: string;
  industry: string;
  vision: string;
  voice: string[];
  palette: string[];
  range: string;
}

/** The seven sample brands FrameMind designed to show the method. All fictional. */
export const BRAND_WORLDS: BrandWorld[] = [
  { id: "chai", name: "Chai Kutty", industry: "Tea", vision: "Bring the tea-stall pour home: strong, spiced, unhurried.", voice: ["Warm", "Street-smart", "Generous"], palette: ["#B23A2B", "#4E7A45", "#D9A441", "#F6EBD9"], range: "Pouches in 4 sizes · tea tin · tea-bag carton" },
  { id: "kaapi", name: "Kaapi Katte", industry: "Coffee", vision: "Every Bengaluru morning deserves a proper davara-tumbler kaapi.", voice: ["Proud", "Precise", "Neighbourly"], palette: ["#3B2418", "#C65A33", "#C9963B", "#F3E6D0"], range: "Flat-bottom bags in 3 sizes · paper cup · drip-bag box" },
  { id: "sutra", name: "Sutra Botanics", industry: "Skincare", vision: "Ayurvedic botanicals, measured like a lab and presented like a herbarium.", voice: ["Calm", "Exact", "Quietly confident"], palette: ["#11212D", "#8FA58E", "#B87333", "#EFE9DF"], range: "Cartons in 3 sizes · dropper and pump labels · soap box" },
  { id: "mithaas", name: "Mithaas", industry: "Sweets", vision: "A box worth keeping long after the laddoos are gone.", voice: ["Festive", "Hospitable", "Abundant"], palette: ["#C4215E", "#F29F05", "#5C1430", "#FBF1DE"], range: "Gift boxes in 3 sizes · carry bag" },
  { id: "monsoon", name: "Monsoon Soda", industry: "Beverages", vision: "The first Konkan rain, bottled cold for city afternoons.", voice: ["Loud", "Playful", "Coastal"], palette: ["#6B1E4A", "#C6E04B", "#2F5D3A", "#F7EEDC"], range: "Cans in 3 sizes and 2 flavours · 4-can carrier" },
  { id: "neela", name: "Neela Achaar", industry: "Pickles", vision: "Ammamma's terrace recipes, sun-cured and sealed the old way.", voice: ["Homely", "Spirited", "Rooted"], palette: ["#1F2E66", "#E7B03A", "#C7372F", "#F6ECD6"], range: "Jar labels in 3 sizes · gift box of 3" },
  { id: "kora", name: "Kora Studio", industry: "Homeware", vision: "Fewer, better objects, made by hand and built to be used every day.", voice: ["Spare", "Considered", "Honest"], palette: ["#3A3835", "#8E8A84", "#C9C4BC", "#E9E6E1"], range: "Shopping bag · rigid box · candle tin · stationery" },
];

/** HQ's saved packaging prices: a "from" price per tier, extra and bundle id. */
export interface PackagingRates {
  prices: { id: string; from: number }[];
}

const ALL = () => [...PACK_TIERS, ...PACK_EXTRAS, ...PACK_BUNDLES];

export const DEFAULT_PACKAGING_RATES: PackagingRates = { prices: ALL().map((x) => ({ id: x.id, from: x.from })) };

/** Every packaging price item (tiers, extras, bundles) with its name, for HQ's editor. */
export const PACKAGING_ITEMS: { id: string; name: string; unit: string; group: "Packs" | "Add-ons" | "Bundles" }[] = [
  ...PACK_TIERS.map((x) => ({ id: x.id, name: x.name, unit: x.unit, group: "Packs" as const })),
  ...PACK_EXTRAS.map((x) => ({ id: x.id, name: x.name, unit: x.unit, group: "Add-ons" as const })),
  ...PACK_BUNDLES.map((x) => ({ id: x.id, name: x.name, unit: "per project", group: "Bundles" as const })),
];

/** The published prices with HQ's rate card applied (falls back to the defaults above when none is saved). */
export function packagingWith(rates?: PackagingRates | null) {
  const price = (id: string, d: number) => rates?.prices.find((p) => p.id === id)?.from ?? d;
  return {
    tiers: PACK_TIERS.map((t) => ({ ...t, from: price(t.id, t.from) })),
    extras: PACK_EXTRAS.map((t) => ({ ...t, from: price(t.id, t.from) })),
    bundles: PACK_BUNDLES.map((t) => ({ ...t, from: price(t.id, t.from) })),
  };
}

export const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;
