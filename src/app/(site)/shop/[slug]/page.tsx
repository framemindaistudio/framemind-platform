import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ShopProduct from "@/site/pages/ShopProduct";
import { pageMetadata } from "@/site/seo";
import { publicShop } from "@/site/shop";
import { site } from "@/lib/site";

/** One product: /shop/<slug>. Cached like the shop page; saving the catalogue in HQ refreshes it. */
export const revalidate = 86400;
export const dynamicParams = true;

export async function generateStaticParams() {
  const shop = await publicShop();
  return shop.products.map((p) => ({ slug: p.slug }));
}

async function find(slug: string) {
  const shop = await publicShop();
  const product = shop.products.find((p) => p.slug === slug);
  return { shop, product };
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const { product } = await find(slug);
  if (!product) return { title: "Not found" };
  return pageMetadata(`/shop/${product.slug}`, {
    title: `${product.title} | FrameMind Store`,
    description: `${product.tagline} ${product.formats.join(", ")} · instant download · ₹${product.price}.`,
    keywords: (product.tags ?? []).join(", "),
    ogImageAlt: product.title,
  });
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { shop, product } = await find(slug);
  if (!product) notFound();
  const category = shop.categories.find((c) => c.id === product.category);
  const inBundle = (product.bundleOf ?? []).map((id) => shop.products.find((p) => p.id === id)).filter((p): p is NonNullable<typeof p> => !!p);
  const related = shop.products.filter((p) => p.id !== product.id && p.category === product.category && !inBundle.includes(p)).slice(0, 4);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.tagline,
    brand: { "@type": "Brand", name: "FrameMind AI Studio" },
    url: `${site.website}/shop/${product.slug}`,
    ...(product.buyable
      ? { offers: { "@type": "Offer", price: product.price, priceCurrency: "INR", availability: "https://schema.org/InStock", url: `${site.website}/shop/${product.slug}` } }
      : {}),
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <ShopProduct product={product} category={category} related={related} inBundle={inBundle} paymentsOn={shop.paymentsOn} />
    </>
  );
}
