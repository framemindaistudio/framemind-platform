import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { buttonClass } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-graphite px-6 text-center text-paper">
      <Logo variant="mark" tone="white" className="w-20" />
      <p className="annot mt-8 text-lime">Error 404</p>
      <h1 className="mt-3 text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">This page isn&apos;t in the frame.</h1>
      <p className="mt-4 max-w-md text-sm text-paper/60">The link may be old or the address mistyped.</p>
      <Link href="/hq" className={buttonClass("lime", "md", "mt-8")}>
        Back to FrameMind HQ
      </Link>
    </div>
  );
}
