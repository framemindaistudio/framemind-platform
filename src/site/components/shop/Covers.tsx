import type { CSSProperties, ReactNode } from "react";
import type { CoverStyle, PublicProduct } from "@/lib/shop/types";

/**
 * The drawn product covers: one look per kind of product, after what sells on Instagram and creator stores in 2026
 * (dark neon terminals, camera HUDs, before/after sliders, stacked carousels, swatch fans, type specimens, paper
 * documents and neo-brutalist stickers), all with film grain. Each is 4:5, the Instagram portrait size, so a cover
 * can be posted as it is. Sizes are in container units (cqw), so the same cover works as a card and as a hero.
 */

export const STYLE_FOR_CATEGORY: Record<string, CoverStyle> = {
  ai: "terminal",
  camera: "viewfinder",
  presets: "split",
  templates: "stack",
  colour: "swatch",
  business: "paper",
  bundles: "brutal",
};
export const coverStyleOf = (p: Pick<PublicProduct, "coverStyle" | "category">): CoverStyle => p.coverStyle ?? STYLE_FOR_CATEGORY[p.category] ?? "brutal";

/** 2026 palette companions: acid, electric purple, sienna, deep teal, sunflower, plum, Cloud Dancer. */
const TREND = ["#C8F135", "#9B7BFF", "#C4532D", "#0F5257", "#FFC93C", "#4A1D3F", "#F0EEE9"];

const GRAIN =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.5 0 0 0 0 0.5 0 0 0 0 0.5 0 0 0 0.9 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")";

const mono = "font-mono uppercase tracking-[0.18em]";
const cq = (n: number) => `${n}cqw`;

function Frame({ bg, ink = "#F5F4F0", children, grain = 0.22 }: { bg: string; ink?: string; children: ReactNode; grain?: number }) {
  return (
    <div className="@container relative aspect-[4/5] w-full select-none overflow-hidden" style={{ background: bg, color: ink }} aria-hidden>
      {children}
      <div className="pointer-events-none absolute inset-0 mix-blend-overlay" style={{ backgroundImage: GRAIN, opacity: grain }} />
    </div>
  );
}

/** Title that shrinks for long names, so nothing is cut off. */
function Title({ text, size, className = "", style }: { text: string; size: number; className?: string; style?: CSSProperties }) {
  const s = text.length > 26 ? size * 0.78 : text.length > 18 ? size * 0.9 : size;
  return (
    <p className={`font-semibold leading-[0.95] tracking-[-0.03em] ${className}`} style={{ fontSize: cq(s), ...style }}>
      {text}
    </p>
  );
}

function Chip({ children, bg, color, style }: { children: ReactNode; bg: string; color: string; style?: CSSProperties }) {
  return (
    <span className={`${mono} inline-block rounded-full`} style={{ background: bg, color, fontSize: cq(2.6), padding: `${cq(1.2)} ${cq(2.6)}`, ...style }}>
      {children}
    </span>
  );
}

/* ─────────────── AI: dark terminal with neon glow ─────────────── */
function Terminal({ p, accent }: { p: PublicProduct; accent: string }) {
  const cmd = p.id.includes("claude") ? "claude" : p.id.includes("prompt") ? "prompt --list" : "vibe build";
  return (
    <Frame bg="#09090D">
      <div className="absolute rounded-full blur-[10cqw]" style={{ background: accent, width: cq(80), height: cq(80), right: cq(-30), top: cq(-20), opacity: 0.55 }} />
      <div className="absolute rounded-full blur-[12cqw]" style={{ background: TREND[1], width: cq(70), height: cq(70), left: cq(-30), bottom: cq(-25), opacity: 0.45 }} />
      <div className="absolute border border-white/15 bg-black/55 backdrop-blur-sm" style={{ inset: `${cq(10)} ${cq(7)} ${cq(14)}`, borderRadius: cq(3) }}>
        <div className="flex items-center border-b border-white/10" style={{ gap: cq(1.6), padding: `${cq(2.6)} ${cq(3.5)}` }}>
          {["#FF5F57", "#FEBC2E", "#28C840"].map((c) => (
            <span key={c} className="rounded-full" style={{ background: c, width: cq(2.4), height: cq(2.4) }} />
          ))}
          <span className={`${mono} ml-auto text-white/40`} style={{ fontSize: cq(2.3) }}>
            ~/framemind
          </span>
        </div>
        <div className="flex h-[calc(100%-9cqw)] flex-col justify-between" style={{ padding: cq(5) }}>
          <div className="font-mono" style={{ fontSize: cq(3.4), lineHeight: 1.6 }}>
            <p>
              <span style={{ color: accent }}>❯</span> <span className="text-white/90">{cmd}</span>
            </p>
            <p className="text-white/40">✓ ready in 0.8s</p>
          </div>
          <div>
            <Title text={p.title} size={11.5} className="text-white" />
            <span className="mt-[2cqw] inline-block animate-pulse align-middle" style={{ background: accent, width: cq(3.2), height: cq(6) }} />
          </div>
        </div>
      </div>
      <div className="absolute flex justify-between" style={{ left: cq(7), right: cq(7), bottom: cq(5) }}>
        <Chip bg={accent} color="#09090D">{p.formats[0] ?? "PDF"}</Chip>
        <span className={`${mono} text-white/50`} style={{ fontSize: cq(2.6), alignSelf: "center" }}>
          {p.level ?? "Guide"}
        </span>
      </div>
    </Frame>
  );
}

/* ─────────────── Camera: viewfinder HUD ─────────────── */
function Viewfinder({ p, accent }: { p: PublicProduct; accent: string }) {
  const corner = (pos: CSSProperties, r: string) => (
    <span className="absolute border-solid border-white/90" style={{ ...pos, width: cq(9), height: cq(9), borderWidth: 0, ...cornerBorders(r) }} />
  );
  return (
    <Frame bg={`radial-gradient(120% 90% at 70% 20%, ${accent} 0%, #5A1A08 55%, #140603 100%)`} grain={0.3}>
      {corner({ left: cq(7), top: cq(7) }, "tl")}
      {corner({ right: cq(7), top: cq(7) }, "tr")}
      {corner({ left: cq(7), bottom: cq(7) }, "bl")}
      {corner({ right: cq(7), bottom: cq(7) }, "br")}
      <div className={`${mono} absolute flex items-center text-white`} style={{ left: cq(11), top: cq(10.5), fontSize: cq(2.8), gap: cq(1.5) }}>
        <span className="animate-pulse rounded-full bg-[#FF3B30]" style={{ width: cq(2.4), height: cq(2.4) }} /> REC
      </div>
      <div className={`${mono} absolute text-white/80`} style={{ right: cq(11), top: cq(10.5), fontSize: cq(2.8) }}>
        4K · 24P
      </div>
      <div className="absolute left-1/2 top-[38%] -translate-x-1/2 -translate-y-1/2">
        <div className="relative rounded-full border border-white/70" style={{ width: cq(14), height: cq(14) }}>
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white/80" style={{ width: cq(22), height: "1px" }} />
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white/80" style={{ height: cq(22), width: "1px" }} />
        </div>
      </div>
      <div className="absolute text-white" style={{ left: cq(11), right: cq(11), bottom: cq(22) }}>
        <Title text={p.title} size={11} />
      </div>
      <div className={`${mono} absolute flex justify-between border-t border-white/30 text-white/90`} style={{ left: cq(11), right: cq(11), bottom: cq(11), paddingTop: cq(2.5), fontSize: cq(2.7) }}>
        <span>ISO 100</span>
        <span>ƒ/1.8</span>
        <span>1/250</span>
        <span style={{ color: TREND[4] }}>●●●○</span>
      </div>
    </Frame>
  );
}
function cornerBorders(r: string): CSSProperties {
  const w = "0.6cqw";
  if (r === "tl") return { borderTopWidth: w, borderLeftWidth: w };
  if (r === "tr") return { borderTopWidth: w, borderRightWidth: w };
  if (r === "bl") return { borderBottomWidth: w, borderLeftWidth: w };
  return { borderBottomWidth: w, borderRightWidth: w };
}

/* ─────────────── Presets & LUTs: before / after slider ─────────────── */
function Split({ p, accent }: { p: PublicProduct; accent: string }) {
  const scene = (
    <svg viewBox="0 0 100 125" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full">
      <defs>
        <linearGradient id={`sky-${p.id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={accent} />
          <stop offset="0.55" stopColor="#FFB38A" />
          <stop offset="1" stopColor="#3A1C4A" />
        </linearGradient>
      </defs>
      <rect width="100" height="125" fill={`url(#sky-${p.id})`} />
      <circle cx="62" cy="48" r="13" fill="#FFF1C9" opacity="0.95" />
      <path d="M0 78 L22 60 L40 72 L58 54 L80 70 L100 58 L100 125 L0 125 Z" fill="#2B1638" opacity="0.85" />
      <path d="M0 92 L30 80 L55 90 L78 78 L100 86 L100 125 L0 125 Z" fill="#160B1F" />
    </svg>
  );
  return (
    <Frame bg="#111" grain={0.28}>
      <div className="absolute inset-0">{scene}</div>
      <div className="absolute inset-y-0 left-0 w-1/2 overflow-hidden" style={{ filter: "grayscale(0.85) contrast(0.8) brightness(0.95)" }}>
        <div className="absolute inset-y-0 left-0 w-[200%]">{scene}</div>
      </div>
      <div className="absolute inset-y-0 left-1/2 w-[0.6cqw] -translate-x-1/2 bg-white" />
      <div className="absolute left-1/2 top-[42%] flex -translate-x-1/2 items-center justify-center rounded-full bg-white text-[#111] shadow-xl" style={{ width: cq(11), height: cq(11), fontSize: cq(3.4) }}>
        ◂▸
      </div>
      <Chip bg="rgba(0,0,0,.55)" color="#fff" style={{ position: "absolute", left: cq(5), top: cq(5) }}>
        Before
      </Chip>
      <Chip bg="#fff" color="#111" style={{ position: "absolute", right: cq(5), top: cq(5) }}>
        After
      </Chip>
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/50 to-transparent" style={{ padding: `${cq(16)} ${cq(6)} ${cq(6)}` }}>
        <Title text={p.title} size={10.5} className="text-white" />
        <p className={`${mono} mt-[2.5cqw] text-white/70`} style={{ fontSize: cq(2.6) }}>
          {p.formats.join(" · ")} · one tap
        </p>
      </div>
    </Frame>
  );
}

/* ─────────────── Templates: stacked carousel cards ─────────────── */
function Stack({ p, accent }: { p: PublicProduct; accent: string }) {
  const card = "absolute rounded-[3cqw] shadow-[0_2cqw_6cqw_rgba(0,0,0,.25)]";
  return (
    <Frame bg={`linear-gradient(160deg, ${mix(accent, "#FFFFFF", 0.72)} 0%, ${mix(accent, "#FFFFFF", 0.45)} 100%)`} ink="#0D0D0D" grain={0.18}>
      <div className={card} style={{ background: "#0D0D0D", width: cq(62), height: cq(78), left: cq(10), top: cq(14), transform: "rotate(-9deg)" }} />
      <div className={card} style={{ background: TREND[4], width: cq(62), height: cq(78), left: cq(26), top: cq(12), transform: "rotate(7deg)" }} />
      <div className={`${card} flex flex-col justify-between`} style={{ background: accent, width: cq(64), height: cq(80), left: cq(18), top: cq(16), padding: cq(5.5), color: "#0D0D0D" }}>
        <div className="flex justify-between">
          <span className={mono} style={{ fontSize: cq(2.6) }}>
            01/20
          </span>
          <span className={mono} style={{ fontSize: cq(2.6) }}>
            ↗ swipe
          </span>
        </div>
        <Title text={p.title} size={9.5} />
        <div className="flex" style={{ gap: cq(1.4) }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <span key={i} className="rounded-full" style={{ width: i === 0 ? cq(6) : cq(1.8), height: cq(1.8), background: i === 0 ? "#0D0D0D" : "rgba(13,13,13,.35)" }} />
          ))}
        </div>
      </div>
      <Chip bg="#0D0D0D" color="#fff" style={{ position: "absolute", right: cq(6), bottom: cq(5), transform: "rotate(-6deg)" }}>
        {p.formats.slice(0, 2).join(" + ")}
      </Chip>
    </Frame>
  );
}

/* ─────────────── Palettes: fanned swatch chips ─────────────── */
function Swatch({ p, accent }: { p: PublicProduct; accent: string }) {
  const chips = [accent, TREND[3], TREND[4], TREND[1], TREND[5]];
  return (
    <Frame bg={TREND[6]} ink="#141414" grain={0.2}>
      <div style={{ position: "absolute", left: cq(7), top: cq(7), right: cq(7) }}>
        <p className={`${mono} text-black/50`} style={{ fontSize: cq(2.6) }}>
          Palette edition · 2026
        </p>
        <Title text={p.title} size={10} className="mt-[2cqw] font-serif !font-normal italic" />
      </div>
      {chips.map((c, i) => (
        <div
          key={i}
          className="absolute overflow-hidden rounded-[1.5cqw] bg-white shadow-[0_1.5cqw_4cqw_rgba(0,0,0,.18)]"
          style={{ width: cq(34), height: cq(52), left: cq(14), bottom: cq(-6), transformOrigin: "50% 100%", transform: `rotate(${-24 + i * 14}deg) translateX(${cq(i * 6)})` }}
        >
          <div style={{ background: c, height: "72%" }} />
          <p className="font-mono text-black/70" style={{ fontSize: cq(2.6), padding: `${cq(2)} ${cq(2.4)}` }}>
            {c.toUpperCase()}
          </p>
        </div>
      ))}
    </Frame>
  );
}

/* ─────────────── Fonts: type specimen ─────────────── */
function Specimen({ p, accent }: { p: PublicProduct; accent: string }) {
  return (
    <Frame bg={TREND[6]} ink="#141414" grain={0.2}>
      <div className="absolute inset-0" style={{ backgroundImage: "linear-gradient(rgba(0,0,0,.07) 1px, transparent 1px)", backgroundSize: `100% ${cq(8)}` }} />
      <p className={`${mono} absolute text-black/50`} style={{ left: cq(7), top: cq(7), fontSize: cq(2.6) }}>
        Type specimen · 30 pairs
      </p>
      <p className="absolute font-serif leading-none" style={{ left: cq(5), top: cq(14), fontSize: cq(46), color: accent }}>
        Aa
      </p>
      <p className="absolute font-sans font-black leading-none" style={{ left: cq(44), top: cq(36), fontSize: cq(30), color: TREND[2] }}>
        Gg
      </p>
      <div className="absolute border-t border-black/20" style={{ left: cq(7), right: cq(7), bottom: cq(7), paddingTop: cq(3) }}>
        <Title text={p.title} size={9.5} />
        <p className="mt-[1.5cqw] font-serif italic text-black/60" style={{ fontSize: cq(3.2) }}>
          The quick brown fox · ಕನ್ನಡ · हिन्दी
        </p>
      </div>
    </Frame>
  );
}

/* ─────────────── Business: paper document with a PAID stamp ─────────────── */
function Paper({ p, accent }: { p: PublicProduct; accent: string }) {
  return (
    <Frame bg={`linear-gradient(150deg, #22202A 0%, ${TREND[5]} 100%)`} grain={0.3}>
      <div className="absolute bg-[#FBF8F1] text-[#1A1A1A] shadow-[0_3cqw_8cqw_rgba(0,0,0,.45)]" style={{ left: cq(12), right: cq(12), top: cq(9), bottom: cq(14), transform: "rotate(-3deg)", padding: cq(6), borderRadius: cq(1) }}>
        <div className="flex items-start justify-between">
          <p className="font-serif font-semibold" style={{ fontSize: cq(5) }}>
            Invoice
          </p>
          <p className="font-mono text-black/50" style={{ fontSize: cq(2.4) }}>
            #FM-0042
          </p>
        </div>
        <div style={{ marginTop: cq(5) }} className="space-y-[2.2cqw]">
          {[72, 54, 64, 40].map((w, i) => (
            <div key={i} className="flex items-center justify-between">
              <span className="rounded-full bg-black/12" style={{ width: `${w}%`, height: cq(1.6) }} />
              <span className="rounded-full bg-black/20" style={{ width: cq(9), height: cq(1.6) }} />
            </div>
          ))}
        </div>
        <div className="flex items-baseline justify-between border-t border-black/15" style={{ marginTop: cq(5), paddingTop: cq(3) }}>
          <span className={`${mono} text-black/50`} style={{ fontSize: cq(2.4) }}>
            Total
          </span>
          <span className="font-semibold tabular-nums" style={{ fontSize: cq(5) }}>
            ₹24,000
          </span>
        </div>
        <div className={`${mono} absolute flex items-center justify-center rounded-full border-[0.8cqw] font-bold`} style={{ right: cq(6), bottom: cq(14), width: cq(22), height: cq(22), color: accent, borderColor: accent, transform: "rotate(-16deg)", fontSize: cq(4.2) }}>
          Paid
        </div>
      </div>
      <div className="absolute text-white" style={{ left: cq(8), right: cq(8), bottom: cq(5) }}>
        <Title text={p.title} size={7.5} />
      </div>
    </Frame>
  );
}

/* ─────────────── Bundles: neo-brutalist stickers ─────────────── */
function Brutal({ p, accent }: { p: PublicProduct; accent: string }) {
  const count = p.bundleOf?.length ?? 0;
  const save = p.mrp && p.mrp > p.price ? p.mrp - p.price : 0;
  return (
    <Frame bg={accent} ink="#0D0D0D" grain={0.25}>
      <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(rgba(13,13,13,.18) 1px, transparent 1.2px)", backgroundSize: `${cq(4)} ${cq(4)}` }} />
      <div className="absolute flex flex-col justify-between border-[1cqw] border-[#0D0D0D] bg-[#F5F4F0]" style={{ left: cq(8), right: cq(12), top: cq(13), bottom: cq(24), padding: cq(5), boxShadow: `${cq(3)} ${cq(3)} 0 #0D0D0D` }}>
        <span className={mono} style={{ fontSize: cq(2.8) }}>
          Bundle {count ? `· ${count} products` : ""}
        </span>
        <Title text={p.title} size={10.5} className="!font-black" />
      </div>
      {save > 0 && (
        <div className="absolute flex items-center justify-center rounded-full border-[0.8cqw] border-[#0D0D0D] bg-[#FF5FA2] text-center font-black leading-none" style={{ right: cq(4), top: cq(5), width: cq(25), height: cq(25), transform: "rotate(12deg)", fontSize: cq(4) }}>
          SAVE
          <br />₹{save}
        </div>
      )}
      <div className="absolute inset-x-0 overflow-hidden whitespace-nowrap border-y-[0.8cqw] border-[#0D0D0D] bg-[#0D0D0D] font-black" style={{ bottom: cq(8), color: accent, fontSize: cq(4.4), padding: `${cq(1.5)} 0`, transform: "rotate(-3deg) scale(1.1)" }}>
        {"MORE FOR LESS ✦ ".repeat(6)}
      </div>
    </Frame>
  );
}

/** Mixes two hex colours (t = share of b). */
function mix(a: string, b: string, t: number) {
  const pa = parseInt(a.replace("#", "").padEnd(6, "0").slice(0, 6), 16);
  const pb = parseInt(b.replace("#", ""), 16);
  const ch = (n: number, s: number) => (n >> s) & 255;
  const c = (s: number) => Math.round(ch(pa, s) * (1 - t) + ch(pb, s) * t);
  return `rgb(${c(16)}, ${c(8)}, ${c(0)})`;
}

export function DrawnCover({ product }: { product: PublicProduct }) {
  const accent = /^#[0-9a-f]{6}$/i.test(product.accent || "") ? product.accent! : "#C8F135";
  switch (coverStyleOf(product)) {
    case "terminal":
      return <Terminal p={product} accent={accent} />;
    case "viewfinder":
      return <Viewfinder p={product} accent={accent} />;
    case "split":
      return <Split p={product} accent={accent} />;
    case "stack":
      return <Stack p={product} accent={accent} />;
    case "swatch":
      return <Swatch p={product} accent={accent} />;
    case "specimen":
      return <Specimen p={product} accent={accent} />;
    case "paper":
      return <Paper p={product} accent={accent} />;
    default:
      return <Brutal p={product} accent={accent} />;
  }
}
