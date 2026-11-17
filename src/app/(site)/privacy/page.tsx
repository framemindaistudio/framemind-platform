import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/lib/site";

/**
 * Privacy policy for framemindaistudio.com: what the website's forms, the store and analytics collect, and why.
 * Written 17 Nov 2026 from what the code actually does (src/site/leads.ts, src/lib/shop, Analytics.tsx), as a draft
 * for the founder; have a lawyer or CA read it before relying on it. Update it when a form or service changes.
 */
export const metadata: Metadata = {
  title: { absolute: "Privacy policy | FrameMind AI Studio" },
  description: "How FrameMind AI Studio collects, uses and protects the information you share through framemindaistudio.com, its enquiry forms and its store.",
  alternates: { canonical: "https://www.framemindaistudio.com/privacy" },
};

export const dynamic = "force-static";

const SECTIONS: [string, string[]][] = [
  ["Who we are", [`framemindaistudio.com is run by ${site.studio.name}, ${site.location}, India. For anything about your information, write to ${site.contact.email} or WhatsApp ${site.contact.phone}.`]],
  [
    "What we collect",
    [
      "Enquiry, coaching, careers and contact forms: the details you type, such as your name, email, phone number, organisation, city, the services you're interested in and your message (and, for job applications, your answers).",
      "Store purchases: your name, email and optional phone number, the product you bought, the amount, any coupon used and the payment reference Razorpay gives us.",
      "Website analytics: Google Analytics records pages visited, approximate location, device and browser, using cookies. It does not give us your name or contact details.",
    ],
  ],
  ["What we don't collect", ["We never see or store your card number, UPI PIN, bank login or other payment credentials. Payments are made on Razorpay's secure checkout, and Razorpay handles that information under its own privacy policy."]],
  [
    "How we use it",
    [
      "To reply to your enquiry and prepare quotes or proposals you ask for.",
      "To deliver store purchases: showing your download page, emailing your download link and receipt, and helping if a file doesn't work.",
      "To keep accounts and records the law requires.",
      "To understand which pages are useful and improve the website (analytics only).",
      "We do not sell your information, and we don't send marketing messages unless you ask for them.",
    ],
  ],
  [
    "Who we share it with",
    [
      "Only the services that run the website and store for us: Vercel (hosting), GitHub (private storage of website records), Razorpay (payments), Resend (sending emails) and Google Analytics (visit statistics). Each receives only what it needs for its job.",
      "We may disclose information if the law requires it.",
    ],
  ],
  ["How long we keep it", ["Enquiries are kept while we are in conversation and for a reasonable time after, so we can follow up on work you asked about. Order records are kept as long as accounting and tax law requires. You can ask us to delete anything we are not required to keep."]],
  ["Security", ["Information you send through the website travels over HTTPS. Website records are stored in private storage that only the studio team can sign in to, and store downloads use signed links that expire."]],
  ["Your choices", ["You can ask to see, correct or delete the information we hold about you by writing to us at the address above. You can block or delete analytics cookies in your browser settings; the website works without them."]],
  ["Children", ["The website and store are meant for adults. If you are under 18, please use them with a parent or guardian's permission."]],
  ["Changes", ["We may update this policy when the website changes. The date below shows the latest version."]],
];

export default function Page() {
  return (
    <div className="min-h-screen">
      <section className="border-b border-border">
        <div className="mx-auto max-w-3xl px-6 py-16 md:py-20">
          <Link href="/" className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground">
            ← FrameMind AI Studio
          </Link>
          <h1 className="mt-6 text-4xl font-semibold tracking-tight md:text-5xl">Privacy policy</h1>
          <p className="mt-4 text-muted-foreground">Last updated 17 November 2026.</p>
        </div>
      </section>
      <section className="mx-auto max-w-3xl px-6 py-12">
        <dl className="divide-y divide-border">
          {SECTIONS.map(([k, items]) => (
            <div key={k} className="grid gap-2 py-6 md:grid-cols-[180px_1fr] md:gap-8">
              <dt className="font-semibold">{k}</dt>
              <dd className="space-y-3 leading-relaxed text-muted-foreground">
                {items.map((t) => (
                  <p key={t}>{t}</p>
                ))}
              </dd>
            </div>
          ))}
        </dl>
        <p className="mt-8 text-sm text-muted-foreground">
          Buying from the store? See also the{" "}
          <Link href="/shop/terms" className="underline underline-offset-2">
            store terms, refunds and delivery
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
