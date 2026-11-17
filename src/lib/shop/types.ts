/**
 * FrameMind Store — the digital products sold at /shop (guides, presets, templates, palettes).
 * Shared by the website, the checkout API and HQ → Digital Store. Nothing here is secret.
 */

/** The drawn cover designs (src/site/components/shop/Covers.tsx). */
export const COVER_STYLES = ["terminal", "viewfinder", "split", "stack", "swatch", "specimen", "paper", "brutal"] as const;
export type CoverStyle = (typeof COVER_STYLES)[number];

export interface ShopCategory {
  id: string;
  name: string;
  /** one line under the name on the shop page */
  blurb: string;
  /** lucide-react icon name */
  icon: string;
}

/** A file a buyer downloads. `path` is in the private data repository: vault/shop/<productId>/<name>. */
export interface ShopFile {
  name: string;
  path: string;
  size: number;
}

/**
 * live   — on the shop and buyable (needs at least one file, or a bundle of live products)
 * soon   — shown as "Coming soon", not buyable
 * hidden — not on the website
 */
export type ShopStatus = "live" | "soon" | "hidden";

export interface ShopProduct {
  id: string;
  /** the address: /shop/<slug> */
  slug: string;
  title: string;
  /** one line on the card */
  tagline: string;
  category: string;
  /** rupees, what the buyer pays */
  price: number;
  /** optional struck-through price; only shown when higher than price */
  mrp?: number;
  status: ShopStatus;
  /** paragraphs, separated by a blank line */
  description: string;
  /** "What you get" bullets */
  includes: string[];
  /** e.g. ["PDF", "XMP"] */
  formats: string[];
  /** who it is for, e.g. "Beginners" */
  level?: string;
  /** an image address for the card; without one the card draws its own cover */
  cover?: string;
  /** the cover's colour when it draws its own (hex) */
  accent?: string;
  /** how the drawn cover looks; defaults to its category's style */
  coverStyle?: CoverStyle;
  files: ShopFile[];
  /** a bundle delivers the files of these products */
  bundleOf?: string[];
  /** "How it compares" table on the product page: our product first, then typical alternatives. Facts only, dated in `note`. */
  compare?: ShopCompare;
  featured?: boolean;
  /** a small print line on the product page (e.g. "Unofficial guide, not affiliated with Anthropic") */
  note?: string;
  tags?: string[];
  updated?: string;
}

export interface ShopCoupon {
  code: string;
  kind: "percent" | "flat";
  value: number;
  active: boolean;
  /** YYYY-MM-DD, last day it works */
  expires?: string;
  note?: string;
}

export interface ShopCatalog {
  categories: ShopCategory[];
  products: ShopProduct[];
  coupons: ShopCoupon[];
  updated?: string;
}

export interface ShopOrderItem {
  id: string;
  title: string;
  price: number;
}

/** One paid order: data/shop/orders/<id>.json, where id is Razorpay's order id. */
export interface ShopOrder {
  id: string;
  paymentId: string;
  email: string;
  name: string;
  phone?: string;
  items: ShopOrderItem[];
  subtotal: number;
  discount: number;
  coupon?: string;
  total: number;
  /** ISO time */
  paidAt: string;
  method?: string;
  status: "paid" | "refunded";
  /** live = real money; test = Razorpay test keys; mock = local development without Razorpay */
  mode: "live" | "test" | "mock";
}

export interface ShopCompare {
  /** column headings; the first is always this product */
  columns: string[];
  rows: { label: string; values: string[] }[];
  /** where the competitor facts come from and when they were checked */
  note?: string;
}

/** What the public pages may see of a product (no file paths). */
export type PublicProduct = Omit<ShopProduct, "files"> & { fileCount: number; buyable: boolean };
