import { site } from "@/lib/site";

/*
 * The structured data the Figma site's SEO component wrote on every page: the organisation, the breadcrumb and the
 * page's own JSON-LD. The title, description and social tags are Next.js metadata (src/site/seo.ts), so the props
 * that set them here are accepted and left to that.
 */

const SITE_URL = site.url;
const SITE_NAME = "FrameMind AI Studio";

const SEGMENT_LABELS: Record<string, string> = {
  pricing: "Services",
  vritta: "Vritta",
  jove: "JOVE",
  "360vue": "360VUE",
  projects: "Projects",
  shop: "Shop",
  "personal-coaching": "1:1 AI Coaching",
  testimonials: "Testimonials",
  team: "Team",
  connect: "Contact",
  careers: "Careers",
};

const ORG_SCHEMA = {
  "@context": "https://schema.org",
  "@type": ["Organization", "LocalBusiness"],
  name: SITE_NAME,
  url: SITE_URL,
  logo: `${SITE_URL}/favicon.png`,
  image: `${SITE_URL}/og-image.png?v=2`,
  email: "framemindaistudio@gmail.com",
  telephone: "+918073087576",
  description: "MSME-registered design and software studio in Gadag, Karnataka — building websites, brand systems, custom software, and AI tools for Indian founders and institutions.",
  address: { "@type": "PostalAddress", addressLocality: "Gadag", addressRegion: "Karnataka", addressCountry: "IN" },
  areaServed: "IN",
  priceRange: "₹₹",
  currenciesAccepted: "INR",
  paymentAccepted: "Bank Transfer, UPI",
};

interface SEOProps {
  title: string;
  description: string;
  path?: string;
  ogImage?: string;
  ogImageAlt?: string;
  ogType?: "website" | "article";
  keywords?: string;
  noIndex?: boolean;
  jsonLd?: object | object[];
}

export default function SEO({ path = "", jsonLd }: SEOProps) {
  const segments = path.replace(/^\//, "").split("/").filter(Boolean);
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      ...segments.map((seg, i) => ({ "@type": "ListItem", position: i + 2, name: SEGMENT_LABELS[seg] ?? seg, item: `${SITE_URL}/${segments.slice(0, i + 1).join("/")}` })),
    ],
  };
  const schemas: object[] = [ORG_SCHEMA, breadcrumb, ...(jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [])];
  return (
    <>
      {schemas.map((schema, i) => (
        // JSON-LD: "<" is escaped so no value can close the script tag
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\u003c") }} />
      ))}
    </>
  );
}
