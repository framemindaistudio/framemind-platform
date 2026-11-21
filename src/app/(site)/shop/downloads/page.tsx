import type { Metadata } from "next";
import { ResendForm } from "./ResendForm";
import { PageHero } from "@/site/components/ui/page-bits";

export const metadata: Metadata = {
  title: { absolute: "Get your downloads again | FrameMind Store" },
  description: "Lost your FrameMind Store download link? Enter the email you bought with and we'll send it again.",
  robots: { index: false, follow: true },
};

export default function Page() {
  return (
    <div className="bg-[var(--fm-stone)]">
      <PageHero
        kicker="FrameMind Store"
        lines={["Get your", <span key="b" className="text-[#9a9890]">downloads again.</span>]}
        lede="Enter the email you used when you paid. If it matches an order, we'll email your download links within a minute."
      />
      <section className="relative -mt-8 rounded-t-[36px] bg-[var(--fm-stone)] md:-mt-12 md:rounded-t-[56px]">
        <div className="mx-auto max-w-[720px] px-5 py-16 sm:px-8 md:py-24">
          <div className="rounded-[28px] bg-[#f3f2ee] p-6 sm:p-9">
            <p className="text-[1.5rem] leading-tight tracking-[-0.03em]">Which email did you buy with?</p>
            <ResendForm />
          </div>
          <p className="mt-6 text-sm text-[#64635d]">
            Still stuck?{" "}
            <a href="https://wa.me/918073087576" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
              WhatsApp us
            </a>{" "}
            with your name and the product, and we&apos;ll send your files.
          </p>
        </div>
      </section>
    </div>
  );
}
