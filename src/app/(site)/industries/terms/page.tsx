import type { Metadata } from "next";
import { DEDICATED, OVERAGE_COMMON } from "@/lib/content/industries";

/**
 * Terms for FrameMind's industry apps (shared and dedicated), approved by the founder on 16 Nov 2026 as a draft.
 * Have a lawyer or CA read them before relying on them; edit the TERMS list below to change the page.
 */
export const metadata: Metadata = {
  title: { absolute: "Industry app terms and conditions | FrameMind AI Studio" },
  description: "Billing, limits, overage, cancellation, data and support terms for FrameMind's industry apps: shared apps on the FrameMind platform and dedicated apps on their own servers.",
  alternates: { canonical: "https://www.framemindaistudio.com/industries/terms" },
};

export const dynamic = "force-static";

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

const TERMS: [string, string][] = [
  ["Prices", "Prices are in Indian rupees, before GST. GST is added where applicable. Prices are fixed for the period you have paid for. We give 30 days' written notice of any change, which applies from your next renewal."],
  ["Billing", "Plans are billed in advance, monthly or yearly. Yearly plans include the free months shown in each industry's price calculator. Overage and third-party charges are billed with the next invoice."],
  ["Setup and build fees", `The one-time setup of a shared app is paid before work starts. A dedicated app (from ${inr(DEDICATED.buildFrom)}) is paid 50% to start, 40% at the test version and 10% at go-live. Setup and build fees are not refundable once work has started.`],
  ["Limits and fair use", `Each plan includes the limits shown on its industry's page. Use above a limit is charged at the published overage rate. ${OVERAGE_COMMON} "Unlimited" means normal use for one business of that size, not reselling or automated bulk use.`],
  ["Third-party charges", "WhatsApp (Meta), SMS, payment gateway, app store and domain charges are paid at actuals, in your own account wherever possible."],
  ["Late payment", "Invoices are due within 7 days. After 15 days unpaid we may pause the app after giving notice. Your data is kept safe and nothing is deleted while the app is paused."],
  ["Cancellation", "Monthly plans: 30 days' notice. Yearly plans can be cancelled at any time and run to the end of the paid year; unused months are not refunded."],
  ["Your data", "Your data is yours. You can export it at any time. When you leave, we hand it over in a standard format (CSV or Excel, plus your files) and delete it from our servers 30 days later."],
  ["Privacy and security", "Data is stored in India where available, encrypted in transit, backed up daily and accessed only to support you. In health apps (clinics, dental, labs) you are responsible for collecting consent from your patients; the app follows your instructions on their data."],
  ["Uptime and support", "Shared apps target 99.5% uptime each month, excluding planned maintenance announced in advance. Support is on WhatsApp and phone, Monday to Saturday, 10 am to 7 pm IST. Pro and higher plans get same-day replies."],
  ["Your content", "You are responsible for what you and your staff put in the app (prices, offers, medical notes, listings) and for following the laws that apply to your business."],
  ["Dedicated apps", `Hosting and storage are billed separately. Servers we manage are billed by us (from ${inr(DEDICATED.hosting[0].monthly)} a month); servers in your own cloud account are billed to you by the provider, with a one-time setup of ${inr(DEDICATED.ownCloudSetup)}. Maintenance (${inr(DEDICATED.maintenance[0])}–${inr(DEDICATED.maintenance[1])} a month) covers updates, security, monitoring and support. Code built only for you can be licensed to you on request.`],
  ["Liability", "Our total liability in any year is limited to the fees you paid us in that year. We are not liable for indirect losses or for outages of third-party services."],
  ["Changes and disputes", "Changes to these terms are announced 30 days ahead. Any dispute is subject to the exclusive jurisdiction of the courts at Gadag, Karnataka, India."],
];

export default function Page() {
  return (
    <div className="min-h-screen">
      <section className="border-b border-border">
        <div className="mx-auto max-w-3xl px-6 py-16 md:py-20">
          <a href="/industries" className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground">
            ← Industry apps
          </a>
          <h1 className="mt-6 text-4xl font-black tracking-tight md:text-5xl">Industry app terms and conditions</h1>
          <p className="mt-4 text-muted-foreground">
            These terms cover FrameMind&apos;s industry apps: shared apps on the FrameMind platform and dedicated apps on their own servers. Your written quote or agreement can add to them; where the two differ, the signed document applies.
          </p>
          <ol className="mt-10 space-y-6">
            {TERMS.map(([t, d], i) => (
              <li key={t} className="grid grid-cols-[2rem_1fr] gap-2">
                <span className="font-mono text-sm text-muted-foreground">{i + 1}.</span>
                <div>
                  <h2 className="font-bold">{t}</h2>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{d}</p>
                </div>
              </li>
            ))}
          </ol>
          <p className="mt-12 text-xs text-muted-foreground">Last updated 16 November 2026.</p>
        </div>
      </section>
    </div>
  );
}
