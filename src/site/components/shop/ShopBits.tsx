import { createElement } from "react";
import { ArrowUpRight, Briefcase, Camera, LayoutTemplate, Package, Palette, SlidersHorizontal, Sparkles, Tag, type LucideIcon } from "lucide-react";
import { Link } from "@/site/router";
import type { PublicProduct } from "@/lib/shop/types";
import { inr } from "@/lib/shop/logic";
import { DrawnCover } from "./Covers";
import { appsFor } from "@/lib/shop/compat";

const ICONS: Record<string, LucideIcon> = { Sparkles, Camera, SlidersHorizontal, LayoutTemplate, Palette, Briefcase, Package };

/** A category's icon, drawn from the fixed icon list (never a component made during render). */
export function CategoryIcon({ name, className, strokeWidth }: { name?: string; className?: string; strokeWidth?: number }) {
  return createElement((name && ICONS[name]) || Tag, { className, strokeWidth });
}

export const discountOf = (p: Pick<PublicProduct, "price" | "mrp">) => (p.mrp && p.mrp > p.price ? Math.round(((p.mrp - p.price) / p.mrp) * 100) : 0);

/** A product's cover: its own image when it has one, otherwise the drawn design for its kind (Covers.tsx). */
export function ProductCover({ product, rounded = true }: { product: PublicProduct; rounded?: boolean }) {
  return (
    <div className={`relative w-full overflow-hidden ${rounded ? "rounded-2xl" : ""}`}>
      {product.cover ? (
        <div className="relative aspect-[4/5] w-full bg-[#111]">
          <img src={product.cover} alt={product.title} className="h-full w-full object-cover" loading="lazy" />
        </div>
      ) : (
        <DrawnCover product={product} />
      )}
    </div>
  );
}

export function PriceTag({ product, large }: { product: Pick<PublicProduct, "price" | "mrp">; large?: boolean }) {
  const off = discountOf(product);
  return (
    <span className="inline-flex items-baseline gap-2">
      <span className={`font-semibold tabular-nums ${large ? "text-3xl" : "text-base"}`}>{inr(product.price)}</span>
      {off > 0 && <span className={`tabular-nums text-muted-foreground line-through ${large ? "text-base" : "text-xs"}`}>{inr(product.mrp!)}</span>}
      {off > 0 && large && <span className="rounded-full bg-[#C8F135] px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-[#0D0D0D]">{off}% off</span>}
    </span>
  );
}

/** A shop card: the cover as an Instagram-style post, with a price sticker and a hover lift. */
export function ProductCard({ product }: { product: PublicProduct }) {
  const off = discountOf(product);
  return (
    <Link to={`/shop/${product.slug}`} className="group flex flex-col">
      <div className="relative transition-transform duration-300 ease-out group-hover:-translate-y-1.5 group-hover:rotate-[-0.6deg]">
        <div className="rounded-2xl transition-shadow duration-300 group-hover:shadow-[0_18px_40px_-14px_rgba(0,0,0,.45)]">
          <ProductCover product={product} />
        </div>
        {product.buyable && off > 0 ? (
          <span className="absolute -right-1.5 -top-1.5 rotate-12 rounded-full border-2 border-[#0D0D0D] bg-[#C8F135] px-2 py-1 font-mono text-[10px] font-bold text-[#0D0D0D] shadow-[2px_2px_0_#0D0D0D]">−{off}%</span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col px-0.5 pt-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold leading-snug tracking-tight">{product.title}</h3>
          <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border transition-colors group-hover:border-[#0D0D0D] group-hover:bg-[#0D0D0D] group-hover:text-[#C8F135]">
            <ArrowUpRight className="h-3.5 w-3.5" />
          </span>
        </div>
        <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{product.tagline}</p>
        <WorksWith product={product} compact />
        <div className="mt-auto flex flex-wrap items-center gap-x-2.5 gap-y-1 pt-2.5">
          <PriceTag product={product} />
          {!product.buyable && <span className="rounded-full bg-[#0D0D0D] px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest text-[#C8F135]">Dropping soon</span>}
        </div>
      </div>
    </Link>
  );
}

/** "Works with" apps as name badges (brands don't license their icons for this). Short names on cards, full names on product pages. */
export function WorksWith({ product, compact }: { product: Pick<PublicProduct, "id" | "bundleOf">; compact?: boolean }) {
  const apps = appsFor(product);
  if (!apps.length) return null;
  if (compact) {
    const shown = apps.slice(0, 4);
    return (
      <div className="mt-2 flex flex-wrap items-center gap-1 text-[11px] font-medium text-muted-foreground" aria-label={`Works with ${apps.map((a) => a.full).join(", ")}`}>
        {shown.map((a) => (
          <span key={a.name} className="rounded-md bg-muted px-1.5 py-0.5 leading-none">{a.name}</span>
        ))}
        {apps.length > shown.length && <span className="px-1">+{apps.length - shown.length}</span>}
      </div>
    );
  }
  return (
    <ul className="flex flex-wrap gap-2">
      {apps.map((a) => (
        <li key={a.name} className="inline-flex items-center rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium">
          {a.full}
        </li>
      ))}
    </ul>
  );
}
