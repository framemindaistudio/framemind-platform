import { notFound } from "next/navigation";
import IndustryApp, { type StudioExtra } from "@/site/pages/IndustryApp";
import { INDUSTRIES, industryBySlug } from "@/lib/content/industries";
import { startingPrice } from "@/lib/decks/shared";
import { SERVICES } from "@/lib/content/catalog";
import { publicRateCard } from "@/site/rates";
import { pageMetadata } from "@/site/seo";

type Props = { params: Promise<{ slug: string }> };

/** One page per industry app, built ahead of time; prices from HQ's rate card (refreshed when it is saved). */
export const dynamic = "force-static";
export const dynamicParams = false;
export const revalidate = 86400;

export function generateStaticParams() {
  return INDUSTRIES.map((i) => ({ slug: i.slug }));
}

export async function generateMetadata({ params }: Props) {
  const ind = industryBySlug((await params).slug);
  if (!ind) return {};
  return pageMetadata(`/industries/${ind.slug}`, {
    title: `${ind.product} — ${ind.tagline.replace(/\.$/, "")}`,
    description: `${ind.product} for ${ind.who.toLowerCase()}: ${ind.features.map((x) => x.title.toLowerCase()).join(", ")}. With your name and logo, live in 3–4 weeks.`,
    keywords: `${ind.name.toLowerCase()} software India, ${ind.name.toLowerCase()} app, ${ind.product.toLowerCase()}, FrameMind ${ind.name.toLowerCase()}`,
    ogImageAlt: `FrameMind AI Studio — ${ind.product}`,
  });
}

/** The studio services an industry client most often adds. */
const STUDIO_IDS = ["websites", "brand", "photography", "videography", "social"];

export default async function Page({ params }: Props) {
  const ind = industryBySlug((await params).slug);
  if (!ind) notFound();
  const card = await publicRateCard();
  const services = card?.services ?? SERVICES;
  const studio: StudioExtra[] = STUDIO_IDS.map((id) => services.find((s) => s.id === id))
    .filter((s): s is NonNullable<typeof s> => !!s)
    .map((s) => ({ id: s.id, label: s.name, from: startingPrice(s.id, card ? ({ services } as never) : null) }));
  return <IndustryApp industry={ind} rates={card?.industries} studio={studio} />;
}
