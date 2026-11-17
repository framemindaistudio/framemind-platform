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

/* ─────────────── Palettes: the real colour library ─────────────── */
/** The 50 palettes in the product (dark → light), so the cover shows exactly what buyers get. */
const LIBRARY = "3B2418,8C3B22,C4532D,E8A87C,F3E3CF|1F2A1E,3E5235,7A8B5A,C9C5A0,EFEBDD|4A3B2E,9C7B5B,CDB08A,E7D7BF,F7F1E8|2B1B14,5C3A2A,A0704F,D6B48E,F4E7D4|5A2E0E,B86B1E,E0A33A,F2D08B,FBF3E0|2E3420,5D6B3A,9AA668,D7D9B1,F5F4EA|6E2C1A,B4552F,8DA38A,C9D3C3,F2EFE8|3D3530,7D6A5C,B39E8A,DCCFC0,F4EEE7|1E1A17,A45A3B,D98E6A,EBC9B0,FAF4EF|0D0D0D,C8F135,FF5FA2,4D7CFE,F5F4F0|1B0B3A,5B2EFF,9B7BFF,FF8A3D,FFF4E8|1A1A2E,FF6B00,FFC93C,00C2A8,F7F7F2|111111,E10600,FF7A59,FFD6C9,FFFFFF|071A12,0B6E4F,3DF5C8,C8F135,F2FFF7|3A0CA3,F72585,FFB703,06D6A0,FFF8F0|001A4D,1F4BFF,FF4D2E,FFC2B3,F4F6FF|0D0D0D,FF5FA2,FFE14D,7CF0FF,FFFFFF|14121F,3D2C8D,FF7B39,FFD3A5,FDF6EE|3C3A40,9A97A0,CFCBD3,E8E5EA,F0EEE9|5C3D3A,E8998D,F6C1B4,FBE3DA,FFF7F3|3E3651,8E7DBE,C3B8E3,E6E0F5,F8F6FC|2F4B43,6FB7A1,B8E0D2,E8F4EE,FBF7F0|4A4130,E5C76B,F5E3A1,FBF1D0,FFFCF2|4B2E39,C9849A,EBC1CD,F7E3E8,FFF8FA|2E3F57,7FA7D9,B9D3F0,E3EEFA,F9FBFF|3D4A2F,9DBF7A,CFE3B5,EEF5E4,FFFDF6|1E0F1C,4A1D3F,8E3B67,D4A373,F4E9DC|04140F,0F5257,1D7A5F,C9A86A,F3EBDD|0B0C10,1F2833,4A4E69,C5A880,F2E9DC|1A0A0A,4E0F12,8C1C13,BF9270,EDE0D4|071E22,1D3E53,0F5257,77ABB7,E7EFF1|121212,2B2623,5C524A,A89A8C,E9E3DC|0A1931,183B6B,B68D40,D6C3A3,F8F4EC|2C061F,5D0E41,A0204C,E8D5C4,F7F3EF|09090D,1E1E2E,7B5CFF,3DF5C8,E6E6F0|0E0E12,2A2A35,D97757,F2C9B6,F5F4F0|120458,7A04EB,FF00A0,FE75FE,FFD319|0A0F1F,12305E,1F6FEB,79C0FF,E6F1FF|050A07,0D2818,04471C,16DB65,DFFFE9|0B1026,3B2F8F,00C2FF,8AFFC1,F0F7FF|111315,2D3136,6B7280,C8F135,F4F5F6|1A1A40,7A7AFF,A3F7FF,FFC4F3,FFFFFF|2B0F0E,8A1E12,E8691E,FFB627,FFF1D6|3D1F00,D95D0F,F4A300,FFD15C,FFF6DF|3B0A2A,8B1E3F,C9A227,1F6F5C,F6EAD7|6A4C93,FF9EBB,FFD6A5,9BF6FF,FDFFB6|1B1F3B,E63946,F4A261,2A9D8F,F1FAEE|0B2545,13315C,1B998B,C5D86D,F7F4EA|2F3E1F,5C7A29,A3B86C,E4D6A7,FAF5E9|1C1208,6B3E0A,B8862B,E6C877,FBF4E2".split("|").map((p) => p.split(",").map((c) => "#" + c));

function Swatch({ p }: { p: PublicProduct }) {
  const feature = LIBRARY[0];
  return (
    <Frame bg="#141414" ink="#F5F4F0" grain={0.18}>
      <div style={{ position: "absolute", left: cq(7), top: cq(7), right: cq(7) }}>
        <p className={`${mono} text-white/50`} style={{ fontSize: cq(2.6) }}>
          {LIBRARY.length} palettes · 6 moods
        </p>
        <Title text={p.title} size={9.5} className="mt-[2cqw]" />
      </div>
      <div
        className="absolute grid rounded-[2.4cqw] bg-[#F6F1E9] shadow-[0_3cqw_6cqw_rgba(0,0,0,.45)]"
        style={{ left: cq(6), top: cq(40), width: cq(62), padding: cq(3), gap: cq(1.3), gridTemplateColumns: "repeat(5, 1fr)", transform: "rotate(-3deg)" }}
      >
        {LIBRARY.map((cs, k) => (
          <div key={k} className="flex overflow-hidden rounded-[0.8cqw]" style={{ height: cq(5.2) }}>
            {cs.map((c) => (
              <span key={c} style={{ background: c, flex: 1 }} />
            ))}
          </div>
        ))}
      </div>
      <div
        className="absolute overflow-hidden rounded-[2.4cqw] bg-white shadow-[0_3cqw_6cqw_rgba(0,0,0,.5)]"
        style={{ right: cq(6), top: cq(52), width: cq(34), transform: "rotate(6deg)", padding: cq(1.6) }}
      >
        <div className="overflow-hidden rounded-[1.4cqw]">
          {feature.map((c, i) => (
            <div key={c} className="font-mono" style={{ background: c, height: cq(8.4), fontSize: cq(2.4), padding: `${cq(2.4)} ${cq(2.4)} 0`, color: i < 3 ? "#fff" : "#3B2418" }}>
              {c}
            </div>
          ))}
        </div>
        <p className="font-semibold text-[#141414]" style={{ fontSize: cq(3.2), padding: `${cq(1.6)} ${cq(0.8)} ${cq(0.4)}` }}>
          01 Indian Clay
        </p>
      </div>
      <span className="absolute grid place-items-center rounded-full bg-[#C8F135] font-semibold text-[#141414]" style={{ right: cq(7), top: cq(36), width: cq(13), height: cq(13), fontSize: cq(5) }}>
        {LIBRARY.length}
      </span>
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
      return <Swatch p={product} />;
    case "specimen":
      return <Specimen p={product} accent={accent} />;
    case "paper":
      return <Paper p={product} accent={accent} />;
    default:
      return <Brutal p={product} accent={accent} />;
  }
}
