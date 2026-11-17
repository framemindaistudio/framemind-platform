import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, Download, MessageCircle } from "lucide-react";
import { readCatalog, readOrder } from "@/lib/shop/store";
import { deliverables, formatBytes, inr } from "@/lib/shop/logic";
import { DOWNLOAD_HOURS, downloadUrl, orderKeyOk } from "@/lib/shop/links";
import { site } from "@/lib/site";
import { mailReady } from "@/lib/hq/mail";

export const metadata: Metadata = { title: { absolute: "Your downloads | FrameMind Store" }, robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/**
 * /shop/order/<orderId>?k=<key>: the buyer's receipt and download page. The key is in the email; without it the page
 * says nothing about the order. Download links are made fresh on every visit and last DOWNLOAD_HOURS.
 */
export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ k?: string }> }) {
  const [{ id }, { k }] = await Promise.all([params, searchParams]);
  const order = orderKeyOk(id, k) ? await readOrder(id) : null;
  const wa = `https://wa.me/${site.contact.whatsapp}?text=${encodeURIComponent(`Hi, about my FrameMind Store order ${id}:`)}`;

  if (!order || order.status !== "paid") {
    return (
      <section className="mx-auto max-w-xl px-6 py-24 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">We can&apos;t open this order</h1>
        <p className="mt-4 text-muted-foreground">
          The link may be incomplete. Use the button in your email, or <Link href="/shop/downloads" className="underline underline-offset-2">get your download links emailed again</Link>.
        </p>
        <a href={wa} target="_blank" rel="noreferrer" className="mt-8 inline-flex items-center gap-2 rounded-sm border border-foreground px-5 py-3 text-sm font-semibold">
          <MessageCircle className="h-4 w-4" /> WhatsApp us
        </a>
      </section>
    );
  }

  const { catalog } = await readCatalog();
  const groups = order.items.map((item) => {
    const product = catalog.products.find((p) => p.id === item.id);
    const parts = product ? deliverables(product, catalog) : [];
    return {
      item,
      parts: parts.map((part) => ({ title: part.title, files: part.files.map((f, i) => ({ name: f.name, size: f.size, href: downloadUrl(order.id, part.id, i) })) })),
    };
  });

  return (
    <section className="mx-auto max-w-2xl px-6 py-14 md:py-20">
      <CheckCircle2 className="h-10 w-10 text-[#4d6b00]" strokeWidth={1.6} />
      <h1 className="mt-5 text-3xl font-semibold tracking-tight md:text-4xl">Thank you, {order.name.split(" ")[0]}!</h1>
      <p className="mt-3 text-muted-foreground">
        Payment received ({inr(order.total)}). Your files are below.{" "}
        {mailReady() ? (
          <>
            We&apos;ve also emailed this page&apos;s link to <b className="text-foreground">{order.email}</b>, so you can come back any time.
          </>
        ) : (
          <>Bookmark this page to come back to your files any time.</>
        )}
      </p>
      {order.mode !== "live" && (
        <p className="mt-4 border border-amber-400 bg-amber-50 px-3 py-2 text-sm text-amber-900">Test order ({order.mode}): no real money was taken.</p>
      )}

      <div className="mt-10 space-y-8">
        {groups.map(({ item, parts }) => (
          <div key={item.id}>
            <h2 className="mb-3 font-mono text-xs uppercase tracking-widest text-muted-foreground">{item.title}</h2>
            <div className="space-y-4">
              {parts.map((part) => (
                <div key={part.title} className="border border-border bg-card">
                  {parts.length > 1 && <p className="border-b border-border px-4 py-2.5 text-sm font-semibold">{part.title}</p>}
                  {part.files.length ? (
                    <ul className="divide-y divide-border">
                      {part.files.map((f) => (
                        <li key={f.href} className="flex items-center justify-between gap-4 px-4 py-3">
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-medium">{f.name}</span>
                            <span className="text-xs text-muted-foreground">{formatBytes(f.size)}</span>
                          </span>
                          <a href={f.href} className="inline-flex shrink-0 items-center gap-1.5 rounded-sm bg-[#C8F135] px-3.5 py-2 text-sm font-semibold text-[#0D0D0D] hover:bg-[#b8e020]">
                            <Download className="h-4 w-4" /> Download
                          </a>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="px-4 py-3 text-sm text-muted-foreground">We&apos;re preparing this file. It will appear here, and we&apos;ll WhatsApp or email you when it does.</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 border-t border-border pt-6 text-sm text-muted-foreground">
        <p>
          Download buttons work for {DOWNLOAD_HOURS} hours; reopen this page for fresh ones. Order <span className="font-mono">{order.id}</span>.
        </p>
        <p className="mt-2">
          A file won&apos;t open?{" "}
          <a href={wa} target="_blank" rel="noreferrer" className="underline underline-offset-2">
            WhatsApp us
          </a>{" "}
          and we&apos;ll fix it.
        </p>
      </div>
    </section>
  );
}
