import type { CSSProperties, ReactNode } from "react";
import type { CoverStyle, PublicProduct } from "@/lib/shop/types";
import { appsFor, type App } from "@/lib/shop/compat";
import { DEFAULT_CATALOG } from "@/lib/shop/defaults";
import { toPublic } from "@/lib/shop/logic";

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

function Frame({ bg, ink = "#eceae4", children, grain = 0.22 }: { bg: string; ink?: string; children: ReactNode; grain?: number }) {
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

/** One app: its logo when the brand allows it, otherwise its name. */
export function AppMark({ app }: { app: App; size?: string; light?: boolean }) {
  return <span className="whitespace-nowrap font-semibold tracking-[-0.01em]">{app.name}</span>;
}

/** "Works with" strip for covers: one white pill with app names (names only; brands don't license their icons for this). */
function AppRow({ p, style, max = 4 }: { p: PublicProduct; style?: CSSProperties; max?: number }) {
  const apps = appsFor(p);
  if (!apps.length) return null;
  const shown = apps.slice(0, max);
  return (
    <div className="absolute flex items-center rounded-full bg-white/95 text-[#141414] shadow-[0_1cqw_3cqw_rgba(0,0,0,.25)]" style={{ gap: cq(1.6), padding: `${cq(1.4)} ${cq(3)}`, fontSize: cq(2.6), ...style }}>
      {shown.map((a, i) => (
        <span key={a.name} className="flex items-center" style={{ gap: cq(1.6) }}>
          {i > 0 && <span aria-hidden className="inline-block rounded-full bg-[#141414]/30" style={{ width: cq(0.7), height: cq(0.7) }} />}
          <AppMark app={a} />
        </span>
      ))}
      {apps.length > max && <span className="font-semibold opacity-60">+{apps.length - max}</span>}
    </div>
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
      <AppRow p={p} style={{ right: cq(5), top: cq(5) }} />
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
      <AppRow p={p} style={{ right: cq(11), top: cq(16.5) }} />
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
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/50 to-transparent" style={{ padding: `${cq(16)} ${cq(6)} ${appsFor(p).length ? cq(15) : cq(6)}` }}>
        <Title text={p.title} size={10.5} className="text-white" />
        <p className={`${mono} mt-[2.5cqw] text-white/70`} style={{ fontSize: cq(2.6) }}>
          {p.formats.join(" · ")} · one tap
        </p>
      </div>
      <AppRow p={p} style={{ left: cq(6), bottom: cq(5) }} />
    </Frame>
  );
}

/* ─────────────── Templates: the real slides and scenes ─────────────── */
function Stack({ p, accent }: { p: PublicProduct; accent: string }) {
  if (p.id.includes("mockup")) return <Mockups p={p} accent={accent} />;
  const slides = ["A1", "C1", "D1"];
  return (
    <Frame bg={`linear-gradient(160deg, ${mix(accent, "#141414", 0.15)} 0%, ${mix(accent, "#141414", 0.55)} 100%)`} grain={0.18}>
      <div style={{ position: "absolute", left: cq(7), top: cq(7), right: cq(7) }}>
        <p className={`${mono} text-white/70`} style={{ fontSize: cq(2.6) }}>
          46 slides · 8 formats · 3 ways to edit
        </p>
        <Title text={p.title} size={9} className="mt-[2cqw]" />
      </div>
      {slides.map((k, i) => (
        <img
          key={k}
          src={`/shop/covers/carousel-${k}.jpg`}
          alt=""
          className="absolute rounded-[2cqw] shadow-[0_3cqw_6cqw_rgba(0,0,0,.45)]"
          style={{ width: cq(40), left: cq(6 + i * 25), top: cq(44 + (i === 1 ? -5 : 2)), transform: `rotate(${(i - 1) * 7}deg)`, zIndex: i === 1 ? 2 : 1 }}
        />
      ))}
      <AppRow p={p} style={{ left: cq(7), bottom: cq(6) }} />
    </Frame>
  );
}

function Mockups({ p }: { p: PublicProduct; accent: string }) {
  return (
    <Frame bg="linear-gradient(160deg, #24211d 0%, #141210 100%)" grain={0.2}>
      <div style={{ position: "absolute", left: cq(7), top: cq(7), right: cq(7) }}>
        <p className={`${mono} text-[#c9a46a]`} style={{ fontSize: cq(2.6) }}>
          18 PSD scenes · 40 pack designs · 3D
        </p>
        <Title text={p.title} size={8.4} className="mt-[2cqw]" />
      </div>
      <img src="/shop/covers/mockup2-story.jpg" alt="" className="absolute rounded-[1.6cqw] shadow-[0_3cqw_6cqw_rgba(0,0,0,.55)]" style={{ width: cq(86), left: cq(7), top: cq(36) }} />
      {[
        { k: "pouch", w: 34, l: 6, t: 70, r: -5 },
        { k: "cans-3d", w: 36, l: 57, t: 71, r: 5 },
      ].map((m) => (
        <img
          key={m.k}
          src={`/shop/covers/mockup2-${m.k}.jpg`}
          alt=""
          className="absolute rounded-[1.4cqw] border-[0.7cqw] border-[#ede6da] shadow-[0_3cqw_6cqw_rgba(0,0,0,.5)]"
          style={{ width: cq(m.w), left: cq(m.l), top: cq(m.t), transform: `rotate(${m.r}deg)` }}
        />
      ))}
      <AppRow p={p} style={{ right: cq(6), bottom: cq(4) }} />
    </Frame>
  );
}

/* ─────────────── Palettes: the real colour library ─────────────── */
/** The 50 v2 palettes in the product (each sorted dark → light), so the cover shows exactly what buyers get. */
const LIBRARY = "2E1A12,A8431F,D98A5B,EED3BC,F8F1E8|1C261B,3F5A36,8EA06B,D9DDBF,F4F3EA|3A2E24,8A5A3C,C98E82,E8DCC8,F8F4EC|24160F,6B3E26,B07A52,E3CDB3,F7EFE4|3B230D,9A5B12,D9A13B,F1DCA8,FBF5E6|262B1A,55602F,A3A76B,DCDCC0,F5F4EA|2C211C,9C4A2A,8FA38A,D7DFD2,F4F2EC|24272B,6E5444,7F8EA0,DFDCD6,F5F3EF|1B2233,2E4C7C,A23B2C,E2D7C4,F6F1E7|111111,3B2BE0,C9F236,E9E6FF,FAFAF7|160E24,6A2BD9,FF6B9A,E6DBFF,FBF9FF|2A1505,C2410C,FFB020,FFE7B8,FFF8EC|121212,1F3FBF,D7261E,F2E6E3,FAF7F5|0F1412,2B5D3F,C6F24E,E8F5D6,F8FBF3|1F1030,C2187A,FF9F1C,FFE2EF,FFF8FB|0D1330,1F3FD1,FF5A36,DDE4FF,F7F8FF|151515,D72976,FFD23F,FFE0EC,FFF9FB|14121A,2C2350,CE4100,FFE1CF,FFF8F3|2B2A28,6F6A62,CFC8BD,ECE8E1,F8F6F2|3A2622,AB5C41,FFBE98,FFE3D3,FFF7F2|2A2340,6B58A8,C9B8F0,ECE5FB,FAF8FF|1F2E2A,3F7A68,A8D8C4,E0F2EA,F7FCF9|2E2A1C,8A6D12,F3D36B,FBEFC4,FFFCF0|33232A,A4506E,F2B8C8,FBE3EA,FFF8FA|1C2A38,3E6E99,A9CDEB,E2EFFA,F8FBFF|26301E,5E7A3A,C5DB9A,EAF3D9,FBFDF5|1E1022,5B1F5E,C9A15B,EADCE8,F9F5F7|0C1F18,0F5B43,C8A24A,DCEBE3,F6F8F5|0B0F1F,233A8C,E2B6A0,E6E3EE,F8F7F4|1C0D0D,6E1A1F,B88A5A,EADAD3,F8F3F0|0C1B1E,0F4C55,C77D4A,D6E6E6,F5F8F7|141210,3B3430,A88B6A,E5DED4,F7F4EF|0E1628,1E3461,B08D4A,E3E6EE,F7F6F2|1D1014,722F3F,C7B9AE,ECE6E1,FAF8F6|0D1117,1A2026,7AA2F7,39D98A,E6F2E8|121418,22252B,FF7A59,6CC4FF,F2EDEA|140F24,2A1E45,FF4FA3,42E8F5,F4E9FF|0F1B2D,1F5EFF,00B3A4,E7EEFF,F7F9FF|0A120F,14211C,9BA8FF,2BE0A0,E3FFF2|0E1226,1B2140,7C8CFF,3FE0C5,EAF2FF|141619,23262B,8A93A6,C8F135,EDEFEA|1C1A2E,6B4EE6,4CD7E8,EFEAFF,FBFAFF|2A0F06,B4410F,F2A93B,FCE7C2,FFF7EA|2B1A05,3E7B3A,BD5200,FDE6B6,FFF9EC|2A0B12,8E1538,D4A43A,F3DCC7,FBF5EE|2D2338,C23D8A,7FC8E8,FFE0F0,FFF9FC|1F1530,C2185B,0E9AA7,FFE6D5,FFF9F3|0A1E2B,0B5F7A,2FA36B,D8EEF0,F6FBFB|22200F,5C5A1E,B5652B,E8E2C4,FAF8EE|1E140A,7A1E12,C9962B,F3E3BE,FCF7EC".split("|").map((p) => p.split(",").map((c) => "#" + c));

function Swatch({ p }: { p: PublicProduct }) {
  const feature = LIBRARY[0];
  return (
    <Frame bg="#141414" ink="#eceae4" grain={0.18}>
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
      <AppRow p={p} style={{ left: cq(7), bottom: cq(5) }} />
    </Frame>
  );
}

/* ─────────────── Fonts: type specimen ─────────────── */
function Specimen({ p, accent }: { p: PublicProduct; accent: string }) {
  return (
    <Frame bg={TREND[6]} ink="#141414" grain={0.2}>
      <div className="absolute inset-0" style={{ backgroundImage: "linear-gradient(rgba(0,0,0,.07) 1px, transparent 1px)", backgroundSize: `100% ${cq(8)}` }} />
      <p className={`${mono} absolute text-black/50`} style={{ left: cq(7), top: cq(7), fontSize: cq(2.6) }}>
        Type specimen · 40 pairs
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
      <AppRow p={p} max={3} style={{ right: cq(6), top: cq(5.5) }} />
    </Frame>
  );
}

/* ─────────────── Business: the actual document set ─────────────── */
function Doc({ title, tag, children, style }: { title: string; tag: string; children: ReactNode; style: CSSProperties }) {
  return (
    <div className="absolute rounded-[1.4cqw] bg-[#FBF8F1] text-[#1f1f1d] shadow-[0_3cqw_7cqw_rgba(0,0,0,.45)]" style={{ width: cq(46), padding: cq(4), ...style }}>
      <div className="flex items-start justify-between">
        <p className="font-semibold" style={{ fontSize: cq(3.6), letterSpacing: "-0.02em" }}>
          {title}
        </p>
        <span className={`${mono} rounded-full bg-[#1f1f1d] text-white`} style={{ fontSize: cq(1.8), padding: `${cq(0.6)} ${cq(1.4)}` }}>
          {tag}
        </span>
      </div>
      {children}
    </div>
  );
}

function Paper({ p, accent }: { p: PublicProduct; accent: string }) {
  const line = (w: number, k: number) => <span key={k} className="block rounded-full bg-black/12" style={{ width: `${w}%`, height: cq(1.2), marginTop: cq(1.8) }} />;
  return (
    <Frame bg={`linear-gradient(150deg, #10241B 0%, ${mix(accent, "#10241B", 0.35)} 100%)`} grain={0.25}>
      <div style={{ position: "absolute", left: cq(7), top: cq(7), right: cq(7) }}>
        <p className={`${mono} text-white/60`} style={{ fontSize: cq(2.6) }}>
          Quote · agreement · invoice · rate card
        </p>
        <Title text={p.title} size={9} className="mt-[2cqw] text-white" />
      </div>
      <Doc title="Quotation" tag="Word" style={{ left: cq(5), top: cq(31), transform: "rotate(-7deg)" }}>
        {[80, 62, 70].map(line)}
        <div className="flex justify-between font-semibold" style={{ fontSize: cq(2.6), marginTop: cq(3) }}>
          <span>Total</span>
          <span>₹46,000</span>
        </div>
      </Doc>
      <Doc title="Agreement" tag="Word" style={{ left: cq(48), top: cq(32), transform: "rotate(6deg)" }}>
        {["1. The work", "3. Revisions: 2 rounds", "5. Late payment"].map((t) => (
          <p key={t} style={{ fontSize: cq(2.2), marginTop: cq(1.6) }}>
            {t}
          </p>
        ))}
      </Doc>
      <Doc title="Invoice" tag="Excel" style={{ left: cq(26), top: cq(64), transform: "rotate(-1deg)", width: cq(52) }}>
        {[72, 54].map(line)}
        <div className="flex justify-between" style={{ fontSize: cq(2.2), marginTop: cq(2.4) }}>
          <span className="text-black/55">CGST + SGST 9% + 9%</span>
          <span>₹8,280</span>
        </div>
        <div className="flex items-baseline justify-between border-t border-black/15 font-semibold" style={{ marginTop: cq(2), paddingTop: cq(1.6), fontSize: cq(3.4) }}>
          <span>Balance due</span>
          <span style={{ color: accent }}>₹54,280</span>
        </div>
      </Doc>
      <AppRow p={p} style={{ left: cq(7), bottom: cq(5) }} />
    </Frame>
  );
}

/* ─────────────── Bundles: the real products inside, fanned out ─────────────── */
/** The bundle's items as public products (drawn from the built-in catalogue, so covers render anywhere). */
function bundleItems(p: PublicProduct): PublicProduct[] {
  return (p.bundleOf ?? [])
    .map((id) => DEFAULT_CATALOG.products.find((x) => x.id === id))
    .filter((x): x is NonNullable<typeof x> => !!x && !x.bundleOf?.length)
    .map((x) => toPublic(x, DEFAULT_CATALOG));
}

function Brutal({ p, accent }: { p: PublicProduct; accent: string }) {
  const items = bundleItems(p);
  const save = p.mrp && p.mrp > p.price ? p.mrp - p.price : 0;
  const n = items.length;
  return (
    <Frame bg={`radial-gradient(120% 90% at 50% 100%, ${mix(accent, "#141414", 0.35)} 0%, #141414 70%)`} grain={0.22}>
      <div style={{ position: "absolute", left: cq(7), top: cq(7), right: cq(30) }}>
        <p className={`${mono} text-white/60`} style={{ fontSize: cq(2.6) }}>
          Bundle · {n} products
        </p>
        <Title text={p.title} size={9.5} className="mt-[2cqw]" />
      </div>
      {items.map((it, i) => {
        const mid = (n - 1) / 2;
        const off = i - mid;
        return (
          <div
            key={it.id}
            className="absolute overflow-hidden rounded-[2cqw] shadow-[0_3cqw_6cqw_rgba(0,0,0,.55)]"
            style={{ width: cq(n > 3 ? 36 : 40), left: `calc(50% - ${cq(n > 3 ? 18 : 20)} + ${cq(off * (n > 3 ? 13 : 20))})`, top: cq(40 + Math.abs(off) * 4), transform: `rotate(${off * 8}deg)`, zIndex: 10 - Math.round(Math.abs(off) * 2) }}
          >
            <DrawnCover product={it} />
          </div>
        );
      })}
      {save > 0 && (
        <div className="absolute z-20 flex items-center justify-center rounded-full border-[0.8cqw] border-[#171716] text-center font-black leading-none text-[#171716]" style={{ background: accent, right: cq(5), top: cq(6), width: cq(22), height: cq(22), transform: "rotate(12deg)", fontSize: cq(3.6) }}>
          SAVE
          <br />₹{save}
        </div>
      )}
      <div className="absolute z-20" style={{ left: 0, right: 0, bottom: 0 }}>
        <AppRow p={p} max={5} style={{ left: cq(7), bottom: cq(5) }} />
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
