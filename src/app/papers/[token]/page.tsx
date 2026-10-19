import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { clientIp, rateLimit } from "@/lib/hq/api";
import { listRecords, readSettings } from "@/lib/hq/records";
import { indiaToday } from "@/lib/hq/reminders";
import { templateById } from "@/lib/sign/catalog";
import { companyOf, fileNameOf, type SignDoc } from "@/lib/sign/context";
import { linkLive, receivedOf, shareOf } from "@/lib/sign/share";
import { plainDate } from "@/lib/sign/text";
import { site } from "@/lib/site";
import { paperOfDoc } from "@/components/hq/sign/papers";
import { readInks } from "@/lib/hq/signatures";
import { PublicPaper } from "@/components/sign/PublicPaper";

/** Never in search results, and the preview a messaging app shows names no one. */
export const metadata: Metadata = {
  title: { absolute: "A paper from FrameMind to sign" },
  description: "Open, print or save as a PDF.",
  robots: { index: false, follow: false, nocache: true },
  openGraph: { title: "A paper from FrameMind to sign", description: "Open, print or save as a PDF.", images: [] },
};

function Gone({ title, body }: { title: string; body: string }) {
  return (
    <main className="grid min-h-dvh place-items-center bg-paper px-4">
      <div className="max-w-md text-center">
        <p className="annot text-blueprint">FrameMind</p>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-graphite">{title}</h1>
        <p className="mt-3 text-sm leading-relaxed text-charcoal">{body}</p>
        <p className="mt-6 text-sm">
          {site.contact.email ? (
            <a href={`mailto:${site.contact.email}`} className="font-semibold text-graphite underline underline-offset-4">
              {site.contact.email}
            </a>
          ) : (
            <Link href={site.website} className="font-semibold text-graphite underline underline-offset-4">
              Contact FrameMind
            </Link>
          )}
        </p>
      </div>
    </main>
  );
}

/** /papers/<token>: one paper sent from Documents to Sign, opened with its private link. */
export default async function PaperPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const ip = clientIp(new Request("http://x", { headers: await headers() }));
  if (!rateLimit(`paper-view:${ip}`, 60, 10 * 60 * 1000)) return <Gone title="Please try again in a few minutes" body="This page was opened many times in a short while." />;
  if (!/^[\w-]{24,64}$/.test(token)) return <Gone title="This link does not work" body="Check that the whole address was copied, or ask FrameMind to send it again." />;

  const today = indiaToday();
  const docs = await listRecords<SignDoc>("signDocs");
  const doc = docs.find((d) => shareOf(d)?.token === token);
  const template = templateById(doc?.template);
  if (!doc || !template) return <Gone title="This link does not work" body="Check that the whole address was copied, or ask FrameMind to send it again." />;
  if (!linkLive(doc, today)) return <Gone title="This link has ended" body="The link was switched off or has run out. Ask FrameMind to send the paper again." />;

  const { settings } = await readSettings();
  const company = doc.company ?? companyOf(settings);
  const paper = paperOfDoc(doc, template, company, await readInks());
  const due = doc.dueBy ? plainDate(doc.dueBy) : "";
  const steps = [
    "Print the paper on A4, or choose Save as PDF and print it later.",
    template.initials ? "Sign the last page and initial every page." : "Sign where your name is printed.",
    `Send it back${due ? ` by ${due}` : ""}: upload it below (a PDF, or a photo of every page), or hand it to FrameMind.`,
  ];
  return (
    <PublicPaper
      token={token}
      paper={paper}
      fileName={fileNameOf(["FrameMind", template.name, doc.partyName, doc.date])}
      steps={steps}
      contact={{ email: settings.email || site.contact.email, phone: settings.phone || site.contact.phone, whatsapp: site.contact.whatsapp }}
      received={receivedOf(doc).length}
      signed={doc.partySigned === true}
    />
  );
}
