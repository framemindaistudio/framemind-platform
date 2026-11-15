/**
 * The FrameMind <Name>OS brand of each industry app, from its brand kit in D:\Brand-Assets\<Name>OS-Brand-Kit
 * (tokens.json + SVG logos copied to public/brand/os/). The industry pages, the industries list and the printed
 * flyers use it, so each industry looks like its own app: same logo, same five colours, same rules.
 *
 * Kit rules applied here (guidelines page 4, "Colour & typography"):
 * - Primary (navy) is for headlines and dark surfaces; Background and Surface are page and card fills.
 * - Accent is the "OS", icons and buttons. Where white text on the accent is below WCAG AA (4.5:1), button text is
 *   navy instead; where the accent itself is too light for small text on white, text uses `accentInk`, the accent
 *   darkened toward navy until it reaches 4.5:1.
 * - Secondary and Surface are decorative only, never for text on light backgrounds.
 */
import type { IndustryId } from "./industries";

export interface IndustryBrand {
  /** app id: /apps/<app>/ and the kit's file prefix */
  app: string;
  /** "TableOS" */
  name: string;
  tagline: string;
  colors: { primary: string; accent: string; secondary: string; surface: string; background: string };
  /** accent darkened until it reads as small text on white and on Background (4.5:1) */
  accentInk: string;
  /** text on an accent button: white when it passes AA, otherwise the navy primary */
  onAccent: string;
  icon: string;
  logo: string;
  logoReverse: string;
}

type Raw = Pick<IndustryBrand, "app" | "name" | "tagline" | "colors">;

const NAVY = "#000B2D";
const fam = (accent: string, secondary: string, surface: string, background: string) => ({ primary: NAVY, accent, secondary, surface, background });

const RAW: Record<IndustryId, Raw> = {
  distribution: { app: "trade", name: "TradeOS", tagline: "The B2B Ordering Network for Distributors & Retailers.", colors: fam("#5B4BFF", "#A7BBFA", "#EBE0FF", "#F7FBFF") },
  restaurant: { app: "table", name: "TableOS", tagline: "Table to kitchen to bill, in one app.", colors: fam("#E5482F", "#F3ADA1", "#FCE7E4", "#FEF9F8") },
  gym: { app: "fit", name: "FitOS", tagline: "Members in, renewals on time.", colors: fam("#F26A00", "#F9BC8C", "#FDECDE", "#FFFAF6") },
  pg: { app: "dorm", name: "DormOS", tagline: "Every bed, every rupee, every request.", colors: fam("#B58A00", "#DECA8C", "#F5F0DE", "#FCFBF6") },
  coaching: { app: "class", name: "ClassOS", tagline: "Batches, fees and results, in one place.", colors: fam("#2563EB", "#9DB9F6", "#E3EBFC", "#F7FAFE") },
  realestate: { app: "deal", name: "DealOS", tagline: "From enquiry to keys.", colors: fam("#1F8A5B", "#9ACAB5", "#E2F0EA", "#F7FBF9") },
  clinic: { app: "token", name: "TokenOS", tagline: "No more waiting rooms full of guesswork.", colors: fam("#0284C7", "#8DC8E6", "#DEEFF8", "#F6FBFD") },
  dental: { app: "smile", name: "SmileOS", tagline: "Every tooth, every sitting, on track.", colors: fam("#0F9F8F", "#93D4CD", "#E0F3F0", "#F7FCFB") },
  lab: { app: "sample", name: "SampleOS", tagline: "From sample to report, tracked.", colors: fam("#B5179E", "#DE97D3", "#F5E1F2", "#FCF7FC") },
  salon: { app: "glow", name: "GlowOS", tagline: "Every chair booked, every client remembered.", colors: fam("#E11D48", "#F299AD", "#FBE2E7", "#FEF7F9") },
};

/* ── WCAG contrast ─────────────────────────────────────────────────────── */

function rgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function lum(hex: string) {
  const [r, g, b] = rgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
export function contrast(a: string, b: string) {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}
function mix(a: string, b: string, t: number) {
  const [p, q] = [rgb(a), rgb(b)];
  return `#${p.map((v, i) => Math.round(v + (q[i] - v) * t).toString(16).padStart(2, "0")).join("")}`;
}
/** the accent, darkened toward navy in small steps until it reads as text on the page background */
function inkOf(accent: string, background: string) {
  for (let t = 0; t <= 1; t += 0.05) {
    const c = mix(accent, NAVY, t);
    if (contrast(c, "#ffffff") >= 4.5 && contrast(c, background) >= 4.5) return c;
  }
  return NAVY;
}

export const INDUSTRY_BRANDS = Object.fromEntries(
  (Object.entries(RAW) as [IndustryId, Raw][]).map(([id, r]) => {
    const slug = r.name.toLowerCase();
    return [
      id,
      {
        ...r,
        accentInk: inkOf(r.colors.accent, r.colors.background),
        onAccent: contrast("#ffffff", r.colors.accent) >= 4.5 ? "#ffffff" : NAVY,
        icon: `/brand/os/${slug}-icon-color.svg`,
        logo: `/brand/os/${slug}-logo-horizontal.svg`,
        logoReverse: `/brand/os/${slug}-logo-horizontal-reverse.svg`,
      } satisfies IndustryBrand,
    ];
  }),
) as Record<IndustryId, IndustryBrand>;

export const brandOf = (id: IndustryId): IndustryBrand => INDUSTRY_BRANDS[id];

/** CSS variables for a themed page: style={brandVars(brand)}, then var(--b-accent) etc. */
export function brandVars(b: IndustryBrand): React.CSSProperties {
  return {
    "--b-primary": b.colors.primary,
    "--b-accent": b.colors.accent,
    "--b-accent-ink": b.accentInk,
    "--b-on-accent": b.onAccent,
    "--b-secondary": b.colors.secondary,
    "--b-surface": b.colors.surface,
    "--b-bg": b.colors.background,
  } as React.CSSProperties;
}
