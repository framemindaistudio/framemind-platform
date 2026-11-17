import type { Metadata } from "next";
import { ResendForm } from "./ResendForm";

export const metadata: Metadata = {
  title: { absolute: "Get your downloads again | FrameMind Store" },
  description: "Lost your FrameMind Store download link? Enter the email you bought with and we'll send it again.",
  robots: { index: false, follow: true },
};

export default function Page() {
  return (
    <section className="mx-auto max-w-lg px-6 py-20">
      <span className="mb-4 block font-mono text-xs uppercase tracking-widest text-muted-foreground">FrameMind Store</span>
      <h1 className="text-3xl font-semibold tracking-tight">Get your downloads again</h1>
      <p className="mt-3 text-muted-foreground">Enter the email you used when you paid. If it matches an order, we&apos;ll email your download links within a minute.</p>
      <ResendForm />
    </section>
  );
}
