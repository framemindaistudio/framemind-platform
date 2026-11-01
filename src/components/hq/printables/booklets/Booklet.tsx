"use client";

/**
 * FrameMind's folded booklets (after 360VUE's): A4 pages printed two-up on A3 sheets, folded and stapled down the
 * middle (saddle stitch).
 *
 * A booklet is always a multiple of 4 pages (one A3 sheet, printed both sides, carries 4 A4 pages); a short one is
 * padded with "Notes" pages. Two ways to print it:
 *   • mode=print — A3 landscape sheets in booklet order (8 | 1, then 2 | 7 on the back…). Print double-sided,
 *     "flip on short edge", fold the stack in half and staple the fold.
 *   • mode=read  — the A4 pages one after another, for a PDF to send on WhatsApp or email.
 *
 * The inside pages shrink their content a little when it runs long (never below 72%), so a page that follows the live
 * rate card never spills or gets cut off.
 */
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import QRCode from "qrcode";
import { PrintShell } from "@/components/print/PrintShell";
import { useSettings } from "@/components/hq/data";
import { site } from "@/lib/site";
import { cn } from "@/lib/utils";
import { Wordmark } from "../PrintBits";

export type BookletMode = "print" | "read";

/** Brand colours as plain values, so they print exactly. */
export const C = {
  ink: "#0D0D0D",
  night: "#161616",
  paper: "#F5F4F0",
  white: "#FFFFFF",
  lime: "#C8F135",
  grey: "#8A8A85",
  line: "rgba(13,13,13,0.13)",
  lineDark: "rgba(245,244,240,0.14)",
};

/** Saddle-stitch order: for each A3 sheet, the [left, right] page numbers on its front and back. */
export function impose(pageCount: number) {
  const sheets: { front: [number, number]; back: [number, number] }[] = [];
  for (let k = 0; k < pageCount / 4; k++) {
    sheets.push({ front: [pageCount - 2 * k, 2 * k + 1], back: [2 * k + 2, pageCount - 2 * k - 1] });
  }
  return sheets;
}

/** One A4 page, exactly 210 × 297 mm. */
export function Page({ children, dark, className, style }: { children: React.ReactNode; dark?: boolean; className?: string; style?: React.CSSProperties }) {
  return (
    <div className={cn("relative h-[297mm] w-[210mm] shrink-0 overflow-hidden", className)} style={{ background: dark ? C.ink : C.paper, color: dark ? C.paper : C.ink, ...style }}>
      {children}
    </div>
  );
}

/** Shrinks its content (CSS zoom) just enough to fit the box, down to 72%. */
function Fit({ children }: { children: React.ReactNode }) {
  const box = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  useLayoutEffect(() => {
    const b = box.current;
    const i = inner.current;
    if (!b || !i) return;
    // measure at full size, then shrink just enough (pictures and fonts can change the height once they load)
    const measure = () => {
      const was = i.style.getPropertyValue("zoom");
      i.style.setProperty("zoom", "1");
      const natural = i.scrollHeight;
      i.style.setProperty("zoom", was);
      const room = b.clientHeight;
      setZoom(natural > room + 1 ? Math.max(0.72, Math.floor((room / natural) * 100) / 100) : 1);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(b);
    void document.fonts?.ready.then(measure);
    i.querySelectorAll("img").forEach((img) => img.addEventListener("load", measure, { once: true }));
    return () => ro.disconnect();
  }, [children]);
  return (
    <div ref={box} className="relative flex-1 overflow-hidden">
      <div ref={inner} className="flex min-h-full flex-col" style={zoom < 1 ? ({ zoom } as React.CSSProperties) : undefined}>
        {children}
      </div>
    </div>
  );
}

/** An inside page: a running head with the section and the FrameMind name, the page number at the foot. */
export function Inside({ n, section, children, dark }: { n: number; section: string; children: React.ReactNode; dark?: boolean }) {
  const even = n % 2 === 0;
  return (
    <Page dark={dark}>
      <div className={cn("absolute inset-x-[14mm] top-[10mm] flex items-center justify-between font-mono text-[7.5pt] font-semibold uppercase tracking-[0.28em]", even && "flex-row-reverse")} style={{ color: dark ? C.grey : "rgba(13,13,13,0.5)" }}>
        <span className="flex items-center gap-[2.5mm]">
          <span className="inline-block size-[1.8mm] rounded-full" style={{ background: C.lime }} />
          {section}
        </span>
        <span>FrameMind AI Studio</span>
      </div>
      <div className="absolute inset-x-[14mm] bottom-[15mm] top-[19mm] flex flex-col">
        <Fit>{children}</Fit>
      </div>
      <div className={cn("absolute inset-x-[14mm] bottom-[7mm] flex items-center justify-between font-mono text-[7.5pt] tracking-[0.15em]", even && "flex-row-reverse")} style={{ color: dark ? "rgba(245,244,240,0.45)" : "rgba(13,13,13,0.45)" }}>
        <span>{site.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}</span>
        <span className="text-[10pt] font-bold" style={{ color: dark ? C.lime : C.ink }}>{String(n).padStart(2, "0")}</span>
      </div>
    </Page>
  );
}

/** Small uppercase mono label with a lime dot. */
export function Kicker({ children, light }: { children: React.ReactNode; light?: boolean }) {
  return (
    <p className="flex items-center gap-[2.5mm] font-mono text-[8pt] font-semibold uppercase tracking-[0.26em]" style={{ color: light ? C.lime : "rgba(13,13,13,0.6)" }}>
      <span className="inline-block h-px w-[8mm]" style={{ background: light ? C.lime : C.ink }} />
      {children}
    </p>
  );
}

/** The accent on a heading: lime text on dark pages, a lime highlighter stroke on light ones (prints flat). */
export function Hi({ children, dark }: { children: React.ReactNode; dark?: boolean }) {
  if (dark) return <span style={{ color: C.lime }}>{children}</span>;
  return <span style={{ background: `linear-gradient(transparent 58%, ${C.lime} 58%, ${C.lime} 92%, transparent 92%)`, padding: "0 0.6mm" }}>{children}</span>;
}

/** A section heading. */
export function H2({ children, dark, pt = 26 }: { children: React.ReactNode; dark?: boolean; pt?: number }) {
  return (
    <h2 className="mt-[4mm] font-semibold leading-[1.04] tracking-[-0.025em]" style={{ fontSize: `${pt}pt`, color: dark ? C.paper : C.ink }}>
      {children}
    </h2>
  );
}

/** Faint grid lines, the website's blueprint texture. */
function Grid({ opacity = 0.07 }: { opacity?: number }) {
  return (
    <div
      aria-hidden
      className="absolute inset-0"
      style={{ backgroundImage: `linear-gradient(rgba(245,244,240,${opacity}) 0.2mm, transparent 0.2mm), linear-gradient(90deg, rgba(245,244,240,${opacity}) 0.2mm, transparent 0.2mm)`, backgroundSize: "15mm 15mm" }}
    />
  );
}

/** The front cover: dark, typographic, with the FrameMind mark large and faint. */
export function Cover({ kicker, title, sub, chips, preparedFor, titlePt = 46, image }: { kicker: string; title: React.ReactNode; sub: string; chips?: string[]; preparedFor?: string; titlePt?: number; image?: string }) {
  return (
    <Page dark>
      <Grid />
      {image ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image} alt="" className="absolute inset-x-0 top-0 h-[150mm] w-full object-cover opacity-60" loading="eager" />
          <div className="absolute inset-x-0 top-0 h-[150mm]" style={{ background: "linear-gradient(180deg, rgba(13,13,13,0.55) 0%, rgba(13,13,13,0.2) 40%, #0D0D0D 100%)" }} />
        </>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src="/brand/fm-mark-dark.png" alt="" aria-hidden className="absolute right-[-30mm] top-[30mm] h-[170mm] w-[170mm] opacity-[0.07]" loading="eager" />
      )}
      <div className="absolute inset-x-0 top-0 h-[1.2mm]" style={{ background: C.lime }} />
      <div className="absolute left-[16mm] top-[16mm]">
        <Wordmark mm={62} white />
      </div>
      <div className="absolute right-[16mm] top-[19mm] font-mono text-[7.5pt] uppercase tracking-[0.25em]" style={{ color: C.grey }}>
        Design · Software · AI
      </div>
      <div className="absolute inset-x-[16mm] bottom-[20mm]">
        <Kicker light>{kicker}</Kicker>
        <h1 className="mt-[6mm] font-semibold leading-[0.98] tracking-[-0.035em]" style={{ color: C.paper, fontSize: `${titlePt}pt` }}>
          {title}
        </h1>
        <p className="mt-[6mm] max-w-[155mm] text-[12.5pt] leading-[1.5]" style={{ color: "rgba(245,244,240,0.72)" }}>
          {sub}
        </p>
        {chips && (
          <div className="mt-[7mm] flex flex-wrap gap-[2mm]">
            {chips.map((c) => (
              <span key={c} className="rounded-full border px-[3.5mm] py-[1.2mm] font-mono text-[8pt] font-semibold uppercase tracking-[0.14em]" style={{ borderColor: "rgba(200,241,53,0.45)", color: C.paper }}>
                {c}
              </span>
            ))}
          </div>
        )}
        {preparedFor && (
          <p className="mt-[7mm] border-t pt-[3mm] text-[10.5pt]" style={{ borderColor: "rgba(245,244,240,0.2)", color: "rgba(245,244,240,0.75)" }}>
            Prepared for <strong style={{ color: C.paper }}>{preparedFor}</strong>
          </p>
        )}
      </div>
    </Page>
  );
}

/** A QR code drawn as crisp SVG. */
export function Qr({ url, mm = 30 }: { url: string; mm?: number }) {
  const [svg, setSvg] = useState("");
  useEffect(() => {
    let alive = true;
    QRCode.toString(url, { type: "svg", margin: 1, errorCorrectionLevel: "M", color: { dark: C.ink, light: "#ffffff" } })
      .then((s) => alive && setSvg(s))
      .catch(() => alive && setSvg(""));
    return () => {
      alive = false;
    };
  }, [url]);
  return <div className="[&>svg]:h-full [&>svg]:w-full" style={{ width: `${mm}mm`, height: `${mm}mm` }} dangerouslySetInnerHTML={{ __html: svg }} />;
}

/** The back cover: three steps, how to reach the studio, and a QR code to the page that continues the booklet online. */
export function BackCover({ kicker, headline, line, steps, qrPath, qrLabel }: { kicker: string; headline: React.ReactNode; line: string; steps: [string, string][]; qrPath: string; qrLabel: string }) {
  const { settings } = useSettings();
  const phone = settings.phone || site.contact.phone;
  const email = settings.email || site.contact.email;
  const web = site.website.replace(/^https?:\/\//, "").replace(/\/$/, "");
  const addr = [settings.addressLine1, settings.city, settings.state].filter(Boolean).join(", ");
  const base = site.website.replace(/\/$/, "");
  return (
    <Page dark>
      <Grid opacity={0.05} />
      <div className="absolute inset-x-0 bottom-0 h-[1.2mm]" style={{ background: C.lime }} />
      <div className="absolute inset-x-[16mm] top-[24mm]">
        <Kicker light>{kicker}</Kicker>
        <h2 className="mt-[5mm] text-[32pt] font-semibold leading-[1.02] tracking-[-0.03em]" style={{ color: C.paper }}>
          {headline}
        </h2>
        <p className="mt-[5mm] max-w-[150mm] text-[12pt] leading-[1.55]" style={{ color: "rgba(245,244,240,0.7)" }}>
          {line}
        </p>
      </div>

      <div className="absolute inset-x-[16mm] top-[122mm] grid grid-cols-3 gap-[4mm]">
        {steps.map(([t, d], i) => (
          <div key={t} className="rounded-[2mm] border p-[4.5mm]" style={{ borderColor: C.lineDark, background: C.night }}>
            <p className="font-mono text-[18pt] font-bold leading-none" style={{ color: C.lime }}>{i + 1}</p>
            <p className="mt-[3mm] text-[11pt] font-semibold" style={{ color: C.paper }}>{t}</p>
            <p className="mt-[1.4mm] text-[9.5pt] leading-[1.45]" style={{ color: "rgba(245,244,240,0.6)" }}>{d}</p>
          </div>
        ))}
      </div>

      <div className="absolute inset-x-[16mm] bottom-[20mm] flex items-end justify-between gap-[8mm]">
        <div>
          <Wordmark mm={64} white />
          <div className="mt-[7mm] space-y-[1.6mm] text-[12pt]" style={{ color: C.paper }}>
            {phone && <p><span className="inline-block w-[17mm] font-mono text-[8pt] uppercase tracking-[0.2em]" style={{ color: C.lime }}>Call</span>{phone}</p>}
            {email && <p><span className="inline-block w-[17mm] font-mono text-[8pt] uppercase tracking-[0.2em]" style={{ color: C.lime }}>Email</span>{email}</p>}
            <p><span className="inline-block w-[17mm] font-mono text-[8pt] uppercase tracking-[0.2em]" style={{ color: C.lime }}>Web</span>{web}</p>
            {addr && <p className="text-[10pt]" style={{ color: "rgba(245,244,240,0.6)" }}><span className="inline-block w-[17mm] font-mono text-[8pt] uppercase tracking-[0.2em]" style={{ color: C.lime }}>Visit</span>{addr}</p>}
          </div>
        </div>
        <div className="text-center">
          <div className="rounded-[2mm] p-[2.5mm]" style={{ background: "#ffffff" }}>
            <Qr url={`${base}${qrPath}`} mm={32} />
          </div>
          <p className="mt-[2.5mm] font-mono text-[8pt] font-semibold uppercase tracking-[0.2em]" style={{ color: C.lime }}>{qrLabel}</p>
        </div>
      </div>
    </Page>
  );
}

/** A blank notes page, used to make the page count a multiple of 4. */
function NotesPage({ n }: { n: number }) {
  return (
    <Inside n={n} section="Notes">
      <div className="h-full min-h-[240mm]" style={{ backgroundImage: `repeating-linear-gradient(transparent 0, transparent 9mm, ${C.line} 9mm, ${C.line} calc(9mm + 0.25mm))` }} />
    </Inside>
  );
}

/**
 * Lays the pages out for printing. `pages` render one A4 page each, given their page number (1-based).
 * The last page is the back cover; notes pages are added before it when the count is not a multiple of 4.
 */
export function BookletShell({ title, mode, pages }: { title: string; mode: BookletMode; pages: ((n: number) => React.ReactNode)[] }) {
  const all = [...pages];
  const back = all.pop()!;
  while ((all.length + 1) % 4) all.push((n) => <NotesPage n={n} />);
  all.push(back);
  const count = all.length;
  const page = (n: number) => <div key={n}>{all[n - 1](n)}</div>;
  const params = useSearchParams();
  const other = (m: BookletMode) => {
    const p = new URLSearchParams(params.toString());
    p.set("mode", m);
    return `?${p.toString()}`;
  };

  const toolbar = (
    <span className="text-xs text-blueprint">
      {count} pages ·{" "}
      {mode === "print" ? (
        <>
          {count / 4} A3 sheet{count / 4 === 1 ? "" : "s"}, both sides — print double-sided, <strong>flip on short edge</strong>, scale 100%, then fold and staple.{" "}
          <a className="underline" href={other("read")}>A4 pages instead</a>
        </>
      ) : (
        <>
          A4 pages in reading order, for a PDF. <a className="underline" href={other("print")}>A3 booklet sheets instead</a>
        </>
      )}
    </span>
  );

  if (mode === "read") {
    return (
      <PrintShell title={title} back="/hq/printables" toolbar={toolbar}>
        {Array.from({ length: count }, (_, i) => (
          <div key={i} className="print-page shadow-[0_10px_40px_-12px_rgb(0_0_0/0.35)]">
            {page(i + 1)}
          </div>
        ))}
      </PrintShell>
    );
  }

  return (
    <PrintShell title={title} back="/hq/printables" toolbar={toolbar} paper="A3 landscape">
      {impose(count).flatMap((s, i) =>
        (["front", "back"] as const).map((side) => (
          <div key={`${i}-${side}`} className="print-page relative flex h-[297mm] w-[420mm] shadow-[0_10px_40px_-12px_rgb(0_0_0/0.35)]">
            {page(s[side][0])}
            {page(s[side][1])}
            {/* fold guide, screen only */}
            <span className="no-print pointer-events-none absolute inset-y-0 left-1/2 w-0 border-l border-dashed border-white/40" />
            <span className="no-print absolute -top-[6mm] left-0 text-[9px] font-semibold uppercase tracking-[0.2em] text-blueprint">
              Sheet {i + 1} · {side} · pages {s[side][0]} | {s[side][1]}
            </span>
          </div>
        )),
      )}
    </PrintShell>
  );
}
