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
      <section className="fm-dark px-5 pb-24 pt-40 text-center">
        <div className="mx-auto max-w-xl">
        <h1 className="text-[clamp(2.4rem,6vw,4.4rem)] font-normal leading-[0.98] tracking-[-0.05em]">We can&apos;t open this order.</h1>
        <p className="mt-5 text-[17px] leading-relaxed text-[#bcbab2]">
          The link may be incomplete. Use the button in your email, or <Link href="/shop/downloads" className="underline underline-offset-2">get your download links emailed again</Link>.
        </p>
        <a href={wa} target="_blank" rel="noreferrer" className="mt-8 inline-flex items-center gap-2 rounded-full bg-[var(--fm-lime)] px-6 py-3.5 text-sm font-medium text-[#171716]">
          <MessageCircle className="h-4 w-4" /> WhatsApp us
        </a>
        </div>
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
    <div className="bg-[var(--fm-stone)]">
    <section className="fm-dark px-5 pb-20 pt-36 sm:px-8 md:pt-44">
      <div className="mx-auto max-w-3xl">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--fm-lime)] text-[#171716]">
        <CheckCircle2 className="h-7 w-7" strokeWidth={1.8} />
      </span>
      <h1 className="mt-7 text-[clamp(2.6rem,6.5vw,5rem)] font-normal leading-[0.95] tracking-[-0.05em]">Thank you, {order.name.split(" ")[0]}!</h1>
      <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-[#bcbab2]">
        Payment received ({inr(order.total)}). Your files are below.{" "}
        {mailReady() ? (
          <>
            We&apos;ve also emailed this page&apos;s link to <b className="font-medium text-[#eceae4]">{order.email}</b>, so you can come back any time.
          </>
        ) : (
          <>Bookmark this page to come back to your files any time.</>
        )}
      </p>
      {order.mode !== "live" && (
        <p className="mt-5 inline-block rounded-full bg-[#d9a35b] px-4 py-1.5 text-sm text-[#171716]">Test order ({order.mode}): no real money was taken.</p>
      )}
      </div>
    </section>

    <section className="relative -mt-8 rounded-t-[36px] bg-[var(--fm-stone)] px-5 py-16 sm:px-8 md:-mt-12 md:rounded-t-[56px] md:py-20">
      <div className="mx-auto max-w-3xl">
      <div className="space-y-8">
        {groups.map(({ item, parts }) => (
          <div key={item.id}>
            <h2 className="mb-4 text-[1.6rem] leading-tight tracking-[-0.03em]">{item.title}</h2>
            <div className="space-y-4">
              {parts.map((part) => (
                <div key={part.title} className="overflow-hidden rounded-[24px] bg-[#f3f2ee]">
                  {parts.length > 1 && <p className="border-b border-[#1b1b19]/10 px-5 py-3 text-sm font-medium">{part.title}</p>}
                  {part.files.length ? (
                    <ul className="divide-y divide-[#1b1b19]/10">
                      {part.files.map((f) => (
                        <li key={f.href} className="flex items-center justify-between gap-4 px-5 py-4">
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-medium">{f.name}</span>
                            <span className="text-xs text-muted-foreground">{formatBytes(f.size)}</span>
                          </span>
                          <a href={f.href} className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#171716] px-4 py-2.5 text-sm font-medium text-[var(--fm-lime)] transition-transform active:scale-[0.98]">
                            <Download className="h-4 w-4" /> Download
                          </a>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="px-5 py-4 text-sm text-muted-foreground">We&apos;re preparing this file. It will appear here, and we&apos;ll WhatsApp or email you when it does.</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 rounded-[24px] border border-[#1b1b19]/10 p-6 text-sm leading-relaxed text-muted-foreground">
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
      </div>
    </section>
    </div>
  );
}
