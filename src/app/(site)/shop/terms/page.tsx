import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/lib/site";

/**
 * Store terms, refund and delivery policy for the digital products at /shop (Razorpay asks for these pages).
 * Written 17 Nov 2026 as a draft for the founder; have a lawyer or CA read it before relying on it.
 */
export const metadata: Metadata = {
  title: { absolute: "Store terms, refunds and delivery | FrameMind AI Studio" },
  description: "Terms for digital products bought from the FrameMind Store: delivery, licence, refunds, payments and support.",
  alternates: { canonical: "https://www.framemindaistudio.com/shop/terms" },
};

export const dynamic = "force-static";

const TERMS: [string, string][] = [
  ["Who sells", `Products in the FrameMind Store are sold by ${site.studio.name}, ${site.location}, India. Questions: ${site.contact.email} or WhatsApp ${site.contact.phone}.`],
  ["What you buy", "Every product is a digital download (PDF guides, preset, LUT, template and swatch files). No physical item is shipped. Each product page lists the formats and what is included."],
  ["Prices and payment", "Prices are in Indian rupees and are the full amount you pay. Payments are processed by Razorpay (UPI, cards, netbanking, wallets). We never see or store your card details or UPI PIN."],
  ["Delivery", "Your download page opens as soon as the payment is confirmed, and its link is emailed to the address you entered. Download buttons work for 48 hours at a time; opening the page again gives fresh ones. If you don't receive your files within 1 hour of paying, contact us and we will send them within 24 hours."],
  ["Licence", "You may use the files in your own personal and client work. You may not resell, share, upload or give away the files themselves, in original or edited form, or include them in another product for sale. One purchase is for one person."],
  ["Refunds", "Because digital files can't be returned once downloaded, sales are final. We will refund in full if: you were charged twice for the same order; a file is broken and we can't send a working copy within 3 days; or the product is materially different from its description. Ask within 7 days of purchase. Approved refunds go back to the original payment method through Razorpay, usually within 5–7 working days."],
  ["Cancellations", "An order can't be cancelled after the files have been delivered. If a payment failed but money left your account, it is normally reversed by your bank automatically; contact us with the order number if it isn't."],
  ["Results", "Guides, presets and templates are learning and starting resources. Results depend on your own photos, footage, devices and effort. Presets and LUTs look different on every image; adjust them to taste."],
  ["Third-party names", "Software and brand names (such as Claude, Lightroom, Photoshop, Canva, Notion, Premiere, DaVinci Resolve) belong to their owners. Our guides are independent and not affiliated with or endorsed by them unless stated."],
  ["Your information", "We use your name, email and phone only to deliver your order, send its receipt and help with support. We do not sell or share them. You can ask us to delete them, except what the law requires us to keep for accounts."],
  ["Changes and disputes", "We may update these terms; the version on this page when you buy applies to your order. Any dispute is subject to the exclusive jurisdiction of the courts at Gadag, Karnataka, India."],
];

export default function Page() {
  return (
    <div className="min-h-screen">
      <section className="border-b border-border">
        <div className="mx-auto max-w-3xl px-6 py-16 md:py-20">
          <Link href="/shop" className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground">
            ← FrameMind Store
          </Link>
          <h1 className="mt-6 text-4xl font-semibold tracking-tight md:text-5xl">Store terms, refunds &amp; delivery</h1>
          <p className="mt-4 text-muted-foreground">For digital products bought at framemindaistudio.com/shop. Last updated 17 November 2026.</p>
        </div>
      </section>
      <section className="mx-auto max-w-3xl px-6 py-12">
        <dl className="divide-y divide-border">
          {TERMS.map(([k, v]) => (
            <div key={k} className="grid gap-2 py-6 md:grid-cols-[180px_1fr] md:gap-8">
              <dt className="font-semibold">{k}</dt>
              <dd className="leading-relaxed text-muted-foreground">{v}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
