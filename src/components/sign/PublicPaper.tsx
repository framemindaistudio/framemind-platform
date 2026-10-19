"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Loader2, Upload } from "lucide-react";
import { A4Page, PrintShell } from "@/components/print/PrintShell";
import { Paper, type PaperDoc } from "@/components/hq/sign/Paper";
import { pageCss } from "@/components/hq/sign/SignPrint";

/**
 * A paper opened from its private link (/papers/<token>): the A4 paper to print or save as a PDF, with how to
 * sign and return it. Nothing here needs a login; the link itself is the key.
 */
export function PublicPaper({
  token,
  paper,
  fileName,
  steps,
  contact,
  received,
  signed,
}: {
  token: string;
  paper: PaperDoc;
  fileName: string;
  steps: string[];
  contact: { email: string; phone: string; whatsapp: string };
  /** signed copies already uploaded from this link */
  received: number;
  /** FrameMind has marked it as signed: nothing more to upload */
  signed: boolean;
}) {
  // the name the browser offers when it is saved as a PDF, and a note to FrameMind that the link was opened
  useEffect(() => {
    document.title = fileName;
    void fetch("/api/public/paper-opened", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }), keepalive: true }).catch(() => {});
  }, [fileName, token]);

  return (
    <PrintShell title={paper.name} toolbar={<span className="hidden text-xs text-blueprint sm:inline">Print on A4, or choose “Save as PDF”</span>}>
      <style>{pageCss([paper])}</style>
      <section className="no-print w-full max-w-[210mm] rounded-[var(--radius-md)] border border-graphite/15 bg-paper-50 p-5 text-sm leading-relaxed text-charcoal" aria-labelledby="how-title">
        <h2 id="how-title" className="text-base font-bold text-graphite">
          How to sign it
        </h2>
        <ol className="mt-2 list-decimal space-y-1 pl-5">
          {steps.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
        <p className="mt-3 text-xs text-blueprint">
          Questions?{" "}
          {[
            contact.email && (
              <a key="e" href={`mailto:${contact.email}`} className="font-semibold text-graphite underline underline-offset-2">
                {contact.email}
              </a>
            ),
            contact.whatsapp && (
              <a key="w" href={`https://wa.me/${contact.whatsapp}`} target="_blank" rel="noopener noreferrer" className="font-semibold text-graphite underline underline-offset-2">
                WhatsApp
              </a>
            ),
            contact.phone && (
              <a key="p" href={`tel:${contact.phone.replace(/[^\d+]/g, "")}`} className="font-semibold text-graphite underline underline-offset-2">
                {contact.phone}
              </a>
            ),
          ]
            .filter(Boolean)
            .flatMap((el, i) => (i ? [" · ", el] : [el]))}
          {!contact.email && !contact.whatsapp && !contact.phone && "Reply to the message this link came with."}
        </p>
      </section>
      <SendBack token={token} received={received} signed={signed} />
      <A4Page flow padded={false} className="print:min-h-0 print:w-full print:overflow-visible">
        <div className="px-[16mm] pb-[17mm] pt-[13mm] print:p-0" style={{ page: "sd0" } as React.CSSProperties}>
          <Paper doc={paper} />
        </div>
      </A4Page>
    </PrintShell>
  );
}

/** Their signed copy, uploaded here: a PDF, or a photo of each page. FrameMind checks it before marking the paper signed. */
function SendBack({ token, received, signed }: { token: string; received: number; signed: boolean }) {
  const input = useRef<HTMLInputElement>(null);
  const [count, setCount] = useState(received);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setError("");
    setDone(false);
    for (const [i, file] of [...files].entries()) {
      setBusy(files.length > 1 ? `Sending ${i + 1} of ${files.length}…` : "Sending…");
      if (file.size > 4 * 1024 * 1024) {
        setError(`${file.name} is larger than 4 MB. Take the photo at a lower quality and try again.`);
        continue;
      }
      const form = new FormData();
      form.set("token", token);
      form.set("file", file);
      try {
        const res = await fetch("/api/public/paper-upload", { method: "POST", body: form });
        const json = (await res.json().catch(() => ({}))) as { count?: number; error?: string };
        if (!res.ok) {
          setError(json.error || "That file could not be sent. Please try again.");
          break;
        }
        setCount(json.count ?? count + 1);
        setDone(true);
      } catch {
        setError("No connection. Please try again when you are online.");
        break;
      }
    }
    setBusy("");
  }

  if (signed)
    return (
      <p className="no-print flex w-full max-w-[210mm] items-center gap-2 rounded-[var(--radius-md)] border border-ok/30 bg-ok/10 p-4 text-sm font-semibold text-graphite">
        <CheckCircle2 className="size-5 text-ok" aria-hidden /> FrameMind has this paper signed. Thank you.
      </p>
    );

  return (
    <section className="no-print w-full max-w-[210mm] rounded-[var(--radius-md)] border border-graphite/15 bg-paper p-5 text-sm leading-relaxed text-charcoal" aria-labelledby="send-back-title" data-send-back>
      <h2 id="send-back-title" className="text-base font-bold text-graphite">
        Signed it? Send it back here
      </h2>
      <p className="mt-1">Upload a PDF of the signed paper, or a clear photo of every page. FrameMind checks it and confirms.</p>
      <input ref={input} type="file" accept="application/pdf,image/*" multiple className="sr-only" aria-label="Signed copy" onChange={(e) => { void upload(e.target.files); e.target.value = ""; }} />
      <button
        type="button"
        disabled={!!busy}
        onClick={() => input.current?.click()}
        className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-sm)] bg-graphite px-4 text-sm font-semibold text-paper hover:bg-ink disabled:opacity-60"
      >
        {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Upload className="size-4" aria-hidden />} {busy || (count ? "Add more pages" : "Upload the signed copy")}
      </button>
      <p className="mt-2 text-xs text-blueprint">PDF or photos (JPG, PNG, HEIC), up to 4 MB each.</p>
      {count > 0 && (
        <p role="status" className="mt-3 flex items-center gap-2 font-semibold text-ok">
          <CheckCircle2 className="size-4" aria-hidden /> {done ? "Received, thank you. " : ""}
          {count === 1 ? "1 file" : `${count} files`} sent to FrameMind.
        </p>
      )}
      {error && (
        <p role="alert" className="mt-3 text-bad">
          {error}
        </p>
      )}
    </section>
  );
}
