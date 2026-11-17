import { ArrowLeft, Check, FileDown, Minus } from "lucide-react";
import { Link } from "@/site/router";
import type { PublicProduct, ShopCategory } from "@/lib/shop/types";
import { ProductCard, ProductCover, WorksWith } from "@/site/components/shop/ShopBits";
import { appsFor, COMPAT_NOTE } from "@/lib/shop/compat";
import { BuyBox } from "@/site/components/shop/BuyBox";
import { site } from "@/lib/site";

export default function ShopProduct({ product, category, related, inBundle, paymentsOn }: { product: PublicProduct; category?: ShopCategory; related: PublicProduct[]; inBundle: PublicProduct[]; paymentsOn: boolean }) {
  const paragraphs = product.description.split(/\n\s*\n/).filter(Boolean);
  return (
    <div>
      <section className="mx-auto max-w-6xl px-6 pb-14 pt-8 md:pt-12">
        <Link to={category ? `/shop?c=${category.id}` : "/shop"} className="mb-8 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3 w-3" /> {category?.name ?? "Store"}
        </Link>
        <div className="grid gap-10 md:grid-cols-[1fr_1.05fr] md:gap-14">
          <div className="md:sticky md:top-24 md:self-start">
            <div className="mx-auto max-w-[340px] md:max-w-none">
              <ProductCover product={product} />
            </div>
          </div>
          <div>
            <span className="mb-3 block font-mono text-xs uppercase tracking-widest text-muted-foreground">
              {category?.name}
              {product.level ? ` · ${product.level}` : ""}
            </span>
            <h1 className="text-3xl font-semibold leading-tight tracking-tight md:text-5xl">{product.title}</h1>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{product.tagline}</p>

            <div className="mt-8">
              <BuyBox product={product} paymentsOn={paymentsOn} whatsapp={site.contact.whatsapp} />
            </div>

            <div className="mt-10 space-y-4 text-base leading-relaxed">
              {paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>

            {product.includes.length > 0 && (
              <div className="mt-10">
                <h2 className="mb-4 font-mono text-xs uppercase tracking-widest text-muted-foreground">What you get</h2>
                <ul className="space-y-2.5">
                  {product.includes.map((x) => (
                    <li key={x} className="flex gap-3">
                      <Check className="mt-1 h-4 w-4 shrink-0 text-[#4d6b00]" />
                      <span>{x}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {appsFor(product).length > 0 && (
              <div className="mt-10">
                <h2 className="mb-4 font-mono text-xs uppercase tracking-widest text-muted-foreground">Works with</h2>
                <WorksWith product={product} />
              </div>
            )}

            <dl className="mt-10 grid grid-cols-2 gap-px border border-border bg-border text-sm">
              <div className="bg-background p-4">
                <dt className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Format</dt>
                <dd className="mt-1 font-medium">{product.formats.join(", ")}</dd>
              </div>
              <div className="bg-background p-4">
                <dt className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Delivery</dt>
                <dd className="mt-1 inline-flex items-center gap-1.5 font-medium">
                  <FileDown className="h-4 w-4" /> Instant download
                </dd>
              </div>
            </dl>

            {product.note && <p className="mt-6 text-xs leading-relaxed text-muted-foreground">{product.note}</p>}
            {appsFor(product).length > 0 && <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{COMPAT_NOTE}</p>}
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              Digital product: no physical item is shipped. See the <Link to="/shop/terms" className="underline underline-offset-2">store terms & refunds</Link>.
            </p>
          </div>
        </div>
      </section>

      {product.compare && product.compare.rows.length > 0 && <Compare product={product} />}

      {inBundle.length > 0 && (
        <section className="border-t border-border">
          <div className="mx-auto max-w-6xl px-6 py-12">
            <h2 className="mb-6 text-2xl font-semibold tracking-tight">Inside this bundle</h2>
            <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-6 lg:grid-cols-4">
              {inBundle.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      {related.length > 0 && (
        <section className="border-t border-border">
          <div className="mx-auto max-w-6xl px-6 py-12">
            <h2 className="mb-6 text-2xl font-semibold tracking-tight">You may also like</h2>
            <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-6 lg:grid-cols-4">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

/** "How it compares": this product in the first, highlighted column. Yes/No cells become icons. */
function Compare({ product }: { product: PublicProduct }) {
  const c = product.compare!;
  const accent = /^#[0-9a-f]{6}$/i.test(product.accent || "") ? product.accent! : "#C8F135";
  const cell = (v: string, ours: boolean) => {
    const t = v.trim();
    if (/^yes$/i.test(t)) return <Check className={`h-4 w-4 ${ours ? "" : "text-foreground/70"}`} aria-label="Yes" />;
    if (/^no$/i.test(t)) return <Minus className="h-4 w-4 text-muted-foreground/60" aria-label="No" />;
    return <span className={ours ? "font-medium" : "text-muted-foreground"}>{t}</span>;
  };
  return (
    <section className="border-t border-border">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">How it compares</h2>
        <div className="mt-8 overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left text-sm">
            <thead>
              <tr>
                <th className="w-[22%] pb-4 pr-4 align-bottom font-normal text-muted-foreground" />
                {c.columns.map((h, i) => (
                  <th
                    key={h}
                    className={`px-4 pb-4 pt-4 align-bottom font-semibold leading-snug ${i === 0 ? "rounded-t-xl" : "text-muted-foreground"}`}
                    style={i === 0 ? { background: `${accent}1F` } : undefined}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {c.rows.map((r, ri) => (
                <tr key={r.label} className="border-t border-border">
                  <th scope="row" className="py-3.5 pr-4 align-top font-medium">
                    {r.label}
                  </th>
                  {r.values.map((v, i) => (
                    <td
                      key={i}
                      className={`px-4 py-3.5 align-top leading-snug ${i === 0 && ri === c.rows.length - 1 ? "rounded-b-xl" : ""}`}
                      style={i === 0 ? { background: `${accent}1F` } : undefined}
                    >
                      {cell(v, i === 0)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {c.note && <p className="mt-5 max-w-3xl text-xs leading-relaxed text-muted-foreground">{c.note}</p>}
      </div>
    </section>
  );
}
