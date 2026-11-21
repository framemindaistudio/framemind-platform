import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { buttonClass } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: false },
};

/** One 404 for the website and HQ: website visitors are the many, so it leads home; the team link is small. */
export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-[#171716] px-6 text-center text-[#eceae4]">
      <Logo variant="mark" tone="white" className="w-20" />
      <p className="annot mt-8 text-lime">Error 404</p>
      <h1 className="mt-3 text-4xl font-normal tracking-[-0.045em] sm:text-6xl">This page isn&apos;t in the frame.</h1>
      <p className="mt-4 max-w-md text-[15px] text-[#9a9890]">The link may be old or the address mistyped.</p>
      <div className="mt-9 flex flex-wrap justify-center gap-3">
        <Link href="/" className={buttonClass("lime", "md", "rounded-full")}>
          Go to the homepage
        </Link>
        <Link href="/shop" className="inline-flex items-center rounded-full border border-white/20 px-5 text-sm font-medium transition-colors hover:border-white/50">
          Visit the store
        </Link>
      </div>
      <Link href="/hq" className="mt-10 font-mono text-[11px] uppercase tracking-[0.18em] text-[#6f6d66] hover:text-[#bcbab2]">
        Team sign-in: FrameMind HQ
      </Link>
    </div>
  );
}
