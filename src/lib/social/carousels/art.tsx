/**
 * The carousel illustration kit: flat cartoon people with moods and poses, props for every industry, speech bubbles,
 * comic bursts and phone / app screens. Pure SVG (no images), so a slide renders on screen and exports to PNG the
 * same way. Bold navy outlines and flat fills, in the trending "flat cartoon with thick line" look.
 */
import type { ReactNode } from "react";

export const INK = "#0B1230";

/* ── text helpers ─────────────────────────────────────────────────────── */

/** Splits text into lines of at most `max` characters, breaking between words. */
export function wrap(text: string, max: number): string[] {
  const out: string[] = [];
  for (const para of text.split("\n")) {
    let line = "";
    for (const w of para.split(/\s+/).filter(Boolean)) {
      if (!line) line = w;
      else if ((line + " " + w).length <= max) line += " " + w;
      else {
        out.push(line);
        line = w;
      }
    }
    out.push(line);
  }
  return out;
}

/** Multi-line text. `anchor` start/middle/end; `lh` line height as a multiple of the size. */
export function Lines({ text, x, y, size, max, font, fill = INK, weight = 700, anchor = "start", lh = 1.12, ls = 0, style }: { text: string; x: number; y: number; size: number; max: number; font: string; fill?: string; weight?: number; anchor?: "start" | "middle" | "end"; lh?: number; ls?: number; style?: React.CSSProperties }) {
  const lines = wrap(text, max);
  return (
    <text x={x} y={y} fontFamily={font} fontSize={size} fontWeight={weight} fill={fill} textAnchor={anchor} letterSpacing={ls} style={style}>
      {lines.map((l, i) => (
        <tspan key={i} x={x} dy={i === 0 ? 0 : size * lh}>
          {l}
        </tspan>
      ))}
    </text>
  );
}

export const linesOf = (text: string, max: number) => wrap(text, max).length;

/* ── people ───────────────────────────────────────────────────────────── */

export type Mood = "happy" | "stressed" | "shocked" | "angry" | "calm" | "think" | "sad" | "proud";
export type Pose = "stand" | "cheer" | "phone" | "headhold" | "point" | "shrug" | "wave" | "arms";
export interface Look {
  skin: string;
  hair: "short" | "long" | "bun" | "curly" | "bald" | "cap" | "wavy" | "braid";
  hairColor: string;
  shirt: string;
  pants: string;
  extra?: "glasses" | "bindi" | "mustache" | "beard" | "apron" | "coat" | "dupatta";
}

export const SKIN = ["#C68642", "#A86B3C", "#E0AC69", "#8D5524", "#D29B6C"];

function Face({ mood }: { mood: Mood }) {
  const eye = (cx: number) => {
    switch (mood) {
      case "happy":
      case "proud":
        return <path d={`M${cx - 9} -293 q9 -11 18 0`} fill="none" stroke={INK} strokeWidth={5} strokeLinecap="round" />;
      case "shocked":
        return (
          <g>
            <circle cx={cx} cy={-294} r={11} fill="#fff" stroke={INK} strokeWidth={4} />
            <circle cx={cx} cy={-293} r={4.5} fill={INK} />
          </g>
        );
      case "think":
        return <circle cx={cx + 3} cy={-299} r={5.5} fill={INK} />;
      case "sad":
        return <path d={`M${cx - 8} -290 q8 6 16 0`} fill="none" stroke={INK} strokeWidth={5} strokeLinecap="round" />;
      default:
        return <circle cx={cx} cy={-293} r={5.5} fill={INK} />;
    }
  };
  const mouth = (() => {
    switch (mood) {
      case "happy":
        return <path d="M-20 -262 q20 26 40 0 z" fill="#fff" stroke={INK} strokeWidth={4.5} strokeLinejoin="round" />;
      case "proud":
        return <path d="M-16 -262 q16 16 32 0" fill="none" stroke={INK} strokeWidth={5} strokeLinecap="round" />;
      case "shocked":
        return <ellipse cx={0} cy={-258} rx={10} ry={13} fill={INK} />;
      case "angry":
        return <path d="M-16 -254 q16 -12 32 0" fill="none" stroke={INK} strokeWidth={5} strokeLinecap="round" />;
      case "stressed":
        return <path d="M-18 -258 q6 -7 12 0 q6 7 12 0 q6 -7 12 0" fill="none" stroke={INK} strokeWidth={4.5} strokeLinecap="round" />;
      case "sad":
        return <path d="M-14 -253 q14 -10 28 0" fill="none" stroke={INK} strokeWidth={5} strokeLinecap="round" />;
      case "think":
        return <path d="M-6 -259 h18" fill="none" stroke={INK} strokeWidth={5} strokeLinecap="round" />;
      default:
        return <path d="M-14 -263 q14 12 28 0" fill="none" stroke={INK} strokeWidth={5} strokeLinecap="round" />;
    }
  })();
  const brows =
    mood === "angry" ? (
      <g stroke={INK} strokeWidth={5.5} strokeLinecap="round">
        <path d="M-32 -318 l20 9" />
        <path d="M32 -318 l-20 9" />
      </g>
    ) : mood === "stressed" || mood === "sad" ? (
      <g stroke={INK} strokeWidth={5} strokeLinecap="round">
        <path d="M-32 -308 l20 -8" />
        <path d="M32 -308 l-20 -8" />
      </g>
    ) : mood === "shocked" ? (
      <g stroke={INK} strokeWidth={5} strokeLinecap="round" fill="none">
        <path d="M-32 -318 q10 -8 20 0" />
        <path d="M12 -318 q10 -8 20 0" />
      </g>
    ) : null;
  return (
    <g>
      {brows}
      {eye(-21)}
      {eye(21)}
      {(mood === "happy" || mood === "proud") && (
        <g fill="#F28B8B" opacity={0.55}>
          <ellipse cx={-36} cy={-272} rx={10} ry={6} />
          <ellipse cx={36} cy={-272} rx={10} ry={6} />
        </g>
      )}
      {mood === "angry" && (
        <g fill="#E5484D" opacity={0.45}>
          <ellipse cx={-36} cy={-272} rx={11} ry={7} />
          <ellipse cx={36} cy={-272} rx={11} ry={7} />
        </g>
      )}
      {mouth}
      {mood === "stressed" && <path d="M58 -318 q9 14 0 22 q-9 -8 0 -22 z" fill="#7CC6F2" stroke={INK} strokeWidth={3} />}
      {mood === "think" && (
        <g fill="#fff" stroke={INK} strokeWidth={3}>
          <circle cx={70} cy={-350} r={7} />
          <circle cx={88} cy={-372} r={10} />
        </g>
      )}
    </g>
  );
}

function Hair({ look, back }: { look: Look; back?: boolean }) {
  const c = look.hairColor;
  const s = { fill: c, stroke: INK, strokeWidth: 5, strokeLinejoin: "round" as const };
  if (back) {
    if (look.hair === "long" || look.hair === "wavy") return <path d="M-62 -300 q0 -70 62 -70 q62 0 62 70 l6 100 q-30 18 -68 12 l-68 -12 z" {...s} />;
    if (look.hair === "braid") return <path d="M40 -280 q30 40 18 110 q-8 20 -22 0 q-10 -60 -16 -100 z" {...s} />;
    return null;
  }
  switch (look.hair) {
    case "short":
      return <path d="M-60 -298 q-4 -66 60 -68 q64 2 60 66 q-30 -30 -62 -24 q-30 -2 -58 26 z" {...s} />;
    case "long":
    case "braid":
      return <path d="M-62 -294 q-2 -72 62 -74 q64 2 62 74 q-40 -44 -64 -40 q-30 2 -60 40 z" {...s} />;
    case "wavy":
      return <path d="M-64 -292 q-6 -78 64 -78 q70 0 64 78 q-14 -20 -26 -18 q-10 -24 -38 -20 q-28 -4 -38 20 q-14 -2 -26 18 z" {...s} />;
    case "bun":
      return (
        <g>
          <circle cx={0} cy={-372} r={24} {...s} />
          <path d="M-62 -294 q-2 -72 62 -74 q64 2 62 74 q-40 -40 -62 -38 q-24 -2 -62 38 z" {...s} />
        </g>
      );
    case "curly":
      return (
        <g {...s}>
          {[-48, -24, 0, 24, 48].map((x, i) => (
            <circle key={i} cx={x} cy={-344 - (i % 2) * 8} r={22} />
          ))}
        </g>
      );
    case "cap":
      return (
        <g>
          <path d="M-62 -300 q0 -64 62 -64 q62 0 62 64 z" fill={look.shirt} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
          <path d="M20 -302 h68 q6 0 2 10 h-70 z" fill={look.shirt} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
        </g>
      );
    default:
      return null;
  }
}

function arms(pose: Pose): { l: string; r: string; lh: [number, number]; rh: [number, number] } {
  switch (pose) {
    case "cheer":
      return { l: "M-58 -214 L-104 -300 L-118 -372", r: "M58 -214 L104 -300 L118 -372", lh: [-118, -380], rh: [118, -380] };
    case "phone":
      return { l: "M-58 -214 L-80 -140 L-74 -92", r: "M58 -214 L96 -170 L52 -246", rh: [46, -254], lh: [-74, -86] };
    case "headhold":
      return { l: "M-58 -214 L-100 -260 L-66 -306", r: "M58 -214 L100 -260 L66 -306", lh: [-66, -310], rh: [66, -310] };
    case "point":
      return { l: "M-58 -214 L-80 -140 L-74 -92", r: "M58 -214 L130 -230 L196 -248", lh: [-74, -86], rh: [204, -250] };
    case "shrug":
      return { l: "M-58 -214 L-112 -190 L-136 -232", r: "M58 -214 L112 -190 L136 -232", lh: [-140, -240], rh: [140, -240] };
    case "wave":
      return { l: "M-58 -214 L-80 -140 L-74 -92", r: "M58 -214 L110 -270 L118 -346", lh: [-74, -86], rh: [120, -354] };
    case "arms":
      return { l: "M-58 -214 L-30 -160 L36 -170", r: "M58 -214 L30 -150 L-34 -160", lh: [40, -170], rh: [-38, -160] };
    default:
      return { l: "M-58 -214 L-80 -140 L-74 -92", r: "M58 -214 L80 -140 L74 -92", lh: [-74, -86], rh: [74, -86] };
  }
}

/** A cartoon person standing on (x, y), about 380 × scale tall. `flip` faces them left. */
export function Person({ x, y, scale = 1, look, mood = "calm", pose = "stand", flip = false, hold }: { x: number; y: number; scale?: number; look: Look; mood?: Mood; pose?: Pose; flip?: boolean; hold?: ReactNode }) {
  const a = arms(pose);
  const sleeve = { fill: "none", stroke: look.shirt, strokeWidth: 30, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const outline = { fill: "none", stroke: INK, strokeWidth: 40, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -scale : scale} ${scale})`}>
      <ellipse cx={0} cy={4} rx={86} ry={14} fill={INK} opacity={0.12} />
      <Hair look={look} back />
      {/* legs */}
      <g stroke={INK} strokeWidth={5} strokeLinejoin="round">
        <path d="M-46 -100 h40 l-2 96 h-36 z" fill={look.pants} />
        <path d="M6 -100 h40 l-2 96 h-36 z" fill={look.pants} />
        <path d="M-50 -6 h46 q4 12 -6 14 h-44 z" fill={INK} />
        <path d="M2 -6 h46 q4 12 -6 14 h-44 z" fill={INK} />
      </g>
      {/* arms behind the outline */}
      <path d={a.l} {...outline} />
      <path d={a.r} {...outline} />
      {/* body */}
      <path d="M-62 -224 q0 -14 14 -16 h96 q14 2 14 16 l6 128 h-136 z" fill={look.shirt} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
      {look.extra === "apron" && <path d="M-36 -206 h72 v104 h-72 z" fill="#fff" stroke={INK} strokeWidth={4} />}
      {look.extra === "coat" && (
        <g stroke={INK} strokeWidth={4}>
          <path d="M-62 -224 l40 0 l-10 128 h-36 z" fill="#fff" />
          <path d="M62 -224 l-40 0 l10 128 h36 z" fill="#fff" />
        </g>
      )}
      {look.extra === "dupatta" && <path d="M-62 -230 q60 70 124 -2 l6 20 q-70 70 -136 2 z" fill="#F2C14E" stroke={INK} strokeWidth={4} />}
      <path d={a.l} {...sleeve} />
      <path d={a.r} {...sleeve} />
      <circle cx={a.lh[0]} cy={a.lh[1]} r={15} fill={look.skin} stroke={INK} strokeWidth={4.5} />
      <circle cx={a.rh[0]} cy={a.rh[1]} r={15} fill={look.skin} stroke={INK} strokeWidth={4.5} />
      {/* neck + head */}
      <rect x={-14} y={-252} width={28} height={22} fill={look.skin} stroke={INK} strokeWidth={4.5} />
      <ellipse cx={0} cy={-290} rx={60} ry={64} fill={look.skin} stroke={INK} strokeWidth={5} />
      <ellipse cx={-60} cy={-286} rx={9} ry={14} fill={look.skin} stroke={INK} strokeWidth={4} />
      <ellipse cx={60} cy={-286} rx={9} ry={14} fill={look.skin} stroke={INK} strokeWidth={4} />
      <Hair look={look} />
      <Face mood={mood} />
      {look.extra === "glasses" && (
        <g fill="none" stroke={INK} strokeWidth={4.5}>
          <circle cx={-21} cy={-294} r={15} />
          <circle cx={21} cy={-294} r={15} />
          <path d="M-6 -294 h12" />
        </g>
      )}
      {look.extra === "bindi" && <circle cx={0} cy={-316} r={5} fill="#D7263D" />}
      {look.extra === "mustache" && <path d="M-22 -272 q22 -14 44 0 q-22 6 -44 0 z" fill={look.hairColor} stroke={INK} strokeWidth={3} />}
      {look.extra === "beard" && <path d="M-56 -282 q8 58 56 62 q48 -4 56 -62 q-10 30 -56 34 q-46 -4 -56 -34 z" fill={look.hairColor} stroke={INK} strokeWidth={4} />}
      {pose === "phone" && (
        <g transform="translate(30 -296) rotate(-8)">
          <rect x={0} y={0} width={34} height={60} rx={7} fill={INK} />
          <rect x={4} y={6} width={26} height={44} rx={3} fill="#9AD8FF" />
        </g>
      )}
      {hold && <g transform={`translate(${a.rh[0]} ${a.rh[1]})`}>{hold}</g>}
    </g>
  );
}

/* ── comic pieces ─────────────────────────────────────────────────────── */

/** A speech bubble whose tail points at (tx, ty). */
export function Bubble({ x, y, w, text, tx, ty, font, size = 38, fill = "#fff", color = INK, max }: { x: number; y: number; w: number; text: string; tx: number; ty: number; font: string; size?: number; fill?: string; color?: string; max?: number }) {
  const m = max ?? Math.max(10, Math.floor(w / (size * 0.52)));
  const lines = wrap(text, m);
  const h = lines.length * size * 1.18 + size * 0.95;
  const cx = x + w / 2;
  const by = y + h;
  const baseX = Math.max(x + 40, Math.min(x + w - 40, tx));
  return (
    <g>
      <path d={`M${baseX - 22} ${by - 4} L${tx} ${ty} L${baseX + 22} ${by - 4} Z`} fill={fill} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
      <rect x={x} y={y} width={w} height={h} rx={34} fill={fill} stroke={INK} strokeWidth={6} />
      <path d={`M${baseX - 19} ${by - 3} L${baseX + 19} ${by - 3}`} stroke={fill} strokeWidth={9} />
      <Lines text={text} x={cx} y={y + size * 1.08} size={size} max={m} font={font} anchor="middle" fill={color} />
    </g>
  );
}

/** A spiky comic burst with a sound effect. */
export function Burst({ x, y, r, text, font, fill = "#FFD23F", color = INK, size = 56, rot = -8 }: { x: number; y: number; r: number; text: string; font: string; fill?: string; color?: string; size?: number; rot?: number }) {
  const pts: string[] = [];
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    const rr = i % 2 ? r * 0.72 : r;
    pts.push(`${(Math.cos(a) * rr).toFixed(1)},${(Math.sin(a) * rr * 0.62).toFixed(1)}`);
  }
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      <polygon points={pts.join(" ")} fill={fill} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
      <text x={0} y={size * 0.36} textAnchor="middle" fontFamily={font} fontSize={size} fill={color} letterSpacing={2}>
        {text}
      </text>
    </g>
  );
}

/** Halftone dots, for comic backgrounds. */
export function Halftone({ id, color, opacity = 0.25, gap = 22, r = 4 }: { id: string; color: string; opacity?: number; gap?: number; r?: number }) {
  return (
    <pattern id={id} width={gap} height={gap} patternUnits="userSpaceOnUse">
      <circle cx={gap / 2} cy={gap / 2} r={r} fill={color} opacity={opacity} />
    </pattern>
  );
}

/* ── objects ──────────────────────────────────────────────────────────── */

export type PropId =
  | "box" | "truck" | "plate" | "ticket" | "dumbbell" | "bed" | "key" | "books" | "board" | "house" | "token" | "chair"
  | "tooth" | "tube" | "scissors" | "mirror" | "paper" | "clock" | "rupee" | "calendar" | "phone" | "register" | "bell" | "chart" | "heart" | "star";

/** An object about 160 px across, centred on (x, y). */
export function Prop({ id, x, y, s = 1, accent, soft }: { id: PropId; x: number; y: number; s?: number; accent: string; soft: string }) {
  const k = { stroke: INK, strokeWidth: 6, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };
  const body = (() => {
    switch (id) {
      case "box":
        return (
          <g {...k}>
            <path d="M-70 -30 l70 -36 l70 36 l-70 36 z" fill="#E9C38B" />
            <path d="M-70 -30 v76 l70 36 v-76 z" fill="#D9A866" />
            <path d="M70 -30 v76 l-70 36 v-76 z" fill="#C8924E" />
            <path d="M-34 -48 l70 36" fill="none" />
          </g>
        );
      case "truck":
        return (
          <g {...k}>
            <rect x={-90} y={-60} width={110} height={78} rx={6} fill={accent} />
            <path d="M20 -36 h42 l28 30 v24 h-70 z" fill={soft} />
            <circle cx={-56} cy={26} r={18} fill={INK} />
            <circle cx={56} cy={26} r={18} fill={INK} />
          </g>
        );
      case "plate":
        return (
          <g {...k}>
            <ellipse cx={0} cy={0} rx={86} ry={40} fill="#fff" />
            <ellipse cx={0} cy={-6} rx={56} ry={24} fill="#F2A541" />
            <circle cx={-18} cy={-14} r={10} fill="#D9480F" />
            <circle cx={16} cy={-10} r={9} fill="#2F9E44" />
          </g>
        );
      case "ticket":
        return (
          <g {...k}>
            <path d="M-50 -76 h100 v140 l-12 12 l-12 -12 l-12 12 l-12 -12 l-13 12 l-13 -12 l-12 12 l-12 -12 l-12 12 z" fill="#FFFDF5" />
            <path d="M-30 -44 h60 M-30 -16 h44 M-30 12 h52" fill="none" strokeWidth={5} />
          </g>
        );
      case "dumbbell":
        return (
          <g {...k}>
            <rect x={-70} y={-8} width={140} height={16} rx={6} fill="#9AA3B5" />
            <rect x={-96} y={-40} width={30} height={80} rx={8} fill={accent} />
            <rect x={66} y={-40} width={30} height={80} rx={8} fill={accent} />
          </g>
        );
      case "bed":
        return (
          <g {...k}>
            <rect x={-96} y={-10} width={192} height={44} rx={8} fill={soft} />
            <rect x={-96} y={-54} width={26} height={110} rx={6} fill={accent} />
            <rect x={-64} y={-34} width={54} height={26} rx={10} fill="#fff" />
            <path d="M-96 56 v12 M96 34 v34" fill="none" />
          </g>
        );
      case "key":
        return (
          <g {...k}>
            <circle cx={-46} cy={0} r={34} fill={accent} />
            <circle cx={-46} cy={0} r={12} fill="#fff" />
            <path d="M-12 0 h96 v24 M58 0 v18" fill="none" strokeWidth={14} stroke={accent} />
            <path d="M-12 0 h96 v24 M58 0 v18" fill="none" strokeWidth={5} />
          </g>
        );
      case "books":
        return (
          <g {...k}>
            <rect x={-80} y={20} width={160} height={30} rx={4} fill={accent} />
            <rect x={-70} y={-12} width={140} height={32} rx={4} fill={soft} />
            <rect x={-84} y={-44} width={150} height={32} rx={4} fill="#F2C14E" />
          </g>
        );
      case "board":
        return (
          <g {...k}>
            <rect x={-100} y={-70} width={200} height={120} rx={8} fill="#2F5D50" />
            <path d="M-70 -36 h70 M-70 -10 h110 M-70 16 h50" fill="none" stroke="#fff" strokeWidth={5} />
            <path d="M-40 50 l-20 40 M40 50 l20 40" fill="none" />
          </g>
        );
      case "house":
        return (
          <g {...k}>
            <path d="M-84 -6 l84 -72 l84 72 z" fill={accent} />
            <rect x={-64} y={-6} width={128} height={80} fill="#fff" />
            <rect x={-16} y={26} width={32} height={48} fill={soft} />
          </g>
        );
      case "token":
        return (
          <g {...k}>
            <circle cx={0} cy={0} r={70} fill={accent} />
            <circle cx={0} cy={0} r={52} fill="#fff" />
            <text x={0} y={20} textAnchor="middle" fontFamily="Archivo Black" fontSize={56} fill={INK} stroke="none">
              07
            </text>
          </g>
        );
      case "chair":
        return (
          <g {...k}>
            <rect x={-50} y={-80} width={100} height={80} rx={14} fill={accent} />
            <rect x={-60} y={0} width={120} height={22} rx={8} fill={soft} />
            <path d="M-46 22 v50 M46 22 v50" fill="none" />
          </g>
        );
      case "tooth":
        return <path d="M-56 -60 q28 -22 56 0 q28 -22 56 0 q18 40 -6 80 q-10 46 -24 46 q-12 0 -16 -40 q-10 -14 -20 0 q-4 40 -16 40 q-14 0 -24 -46 q-24 -40 -6 -80 z" fill="#fff" {...k} />;
      case "tube":
        return (
          <g {...k}>
            {[-56, 0, 56].map((x, i) => (
              <g key={x}>
                <path d={`M${x - 16} -70 v110 q16 26 32 0 v-110 z`} fill="#fff" />
                <path d={`M${x - 16} ${-10 + i * 12} v50 q16 26 32 0 v-50 z`} fill={i === 1 ? accent : "#E5484D"} />
              </g>
            ))}
            <rect x={-90} y={-12} width={180} height={18} rx={4} fill={soft} />
          </g>
        );
      case "scissors":
        return (
          <g {...k}>
            <circle cx={-46} cy={44} r={24} fill="none" strokeWidth={10} stroke={accent} />
            <circle cx={46} cy={44} r={24} fill="none" strokeWidth={10} stroke={accent} />
            <path d="M-30 26 l80 -100 M30 26 l-80 -100" fill="none" strokeWidth={12} stroke="#9AA3B5" />
            <circle cx={0} cy={-6} r={7} fill={INK} />
          </g>
        );
      case "mirror":
        return (
          <g {...k}>
            <ellipse cx={0} cy={-20} rx={60} ry={76} fill={soft} />
            <path d="M-30 -60 l24 -18 M-34 -30 l40 -34" fill="none" stroke="#fff" strokeWidth={6} />
            <path d="M0 56 v30 M-30 86 h60" fill="none" />
          </g>
        );
      case "paper":
        return (
          <g {...k}>
            <rect x={-70} y={-60} width={110} height={140} rx={6} fill="#FFFDF5" transform="rotate(-12)" />
            <rect x={-50} y={-70} width={110} height={140} rx={6} fill="#fff" transform="rotate(8)" />
            <path d="M-26 -30 h60 M-26 -6 h70 M-26 18 h44" fill="none" strokeWidth={4} transform="rotate(8)" />
          </g>
        );
      case "clock":
        return (
          <g {...k}>
            <circle cx={0} cy={0} r={70} fill="#fff" />
            <path d="M0 0 v-44 M0 0 l30 18" fill="none" strokeWidth={8} />
            <circle cx={0} cy={0} r={6} fill={INK} />
          </g>
        );
      case "rupee":
        return (
          <g {...k}>
            <rect x={-90} y={-46} width={180} height={92} rx={10} fill="#8FD19E" />
            <circle cx={0} cy={0} r={28} fill="#E6F6EA" />
            <text x={0} y={14} textAnchor="middle" fontFamily="Archivo Black" fontSize={38} fill={INK} stroke="none">
              ₹
            </text>
          </g>
        );
      case "calendar":
        return (
          <g {...k}>
            <rect x={-70} y={-60} width={140} height={130} rx={12} fill="#fff" />
            <rect x={-70} y={-60} width={140} height={36} rx={12} fill={accent} />
            <path d="M-36 -74 v26 M36 -74 v26" fill="none" />
            <text x={0} y={46} textAnchor="middle" fontFamily="Archivo Black" fontSize={52} fill={INK} stroke="none">
              5
            </text>
          </g>
        );
      case "phone":
        return (
          <g {...k}>
            <rect x={-44} y={-82} width={88} height={164} rx={16} fill={INK} />
            <rect x={-34} y={-66} width={68} height={128} rx={6} fill={soft} />
          </g>
        );
      case "register":
        return (
          <g {...k}>
            <rect x={-80} y={-60} width={160} height={124} rx={6} fill="#B5651D" />
            <rect x={-66} y={-48} width={132} height={100} fill="#FFFDF5" />
            <path d="M-50 -24 h100 M-50 0 h80 M-50 24 h96" fill="none" strokeWidth={4} />
          </g>
        );
      case "bell":
        return (
          <g {...k}>
            <path d="M-56 30 q0 -96 56 -96 q56 0 56 96 z" fill="#F2C14E" />
            <rect x={-70} y={30} width={140} height={16} rx={6} fill={accent} />
            <circle cx={0} cy={-72} r={8} fill={INK} />
          </g>
        );
      case "chart":
        return (
          <g {...k}>
            <rect x={-90} y={-70} width={180} height={140} rx={12} fill="#fff" />
            <rect x={-62} y={10} width={28} height={40} fill={soft} />
            <rect x={-18} y={-16} width={28} height={66} fill={accent} />
            <rect x={26} y={-44} width={28} height={94} fill={accent} />
          </g>
        );
      case "heart":
        return <path d="M0 50 q-90 -54 -60 -96 q30 -30 60 6 q30 -36 60 -6 q30 42 -60 96 z" fill="#E5484D" {...k} />;
      case "star":
        return <path d="M0 -70 l20 44 l48 4 l-36 32 l12 48 l-44 -26 l-44 26 l12 -48 l-36 -32 l48 -4 z" fill="#FFD23F" {...k} />;
    }
  })();
  return <g transform={`translate(${x} ${y}) scale(${s})`}>{body}</g>;
}

/* ── app screen ───────────────────────────────────────────────────────── */

/** A phone showing the app: its logo on top and a few rows. `rows` are short lines; `big` a highlighted number. */
export function AppPhone({ x, y, w, accent, onAccent, soft, name, rows, big, font, logo }: { x: number; y: number; w: number; accent: string; onAccent: string; soft: string; name: string; rows: string[]; big?: string; font: string; logo?: string }) {
  const h = w * 2.02;
  const pad = w * 0.07;
  const sw = w - pad * 2;
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x={6} y={10} width={w} height={h} rx={w * 0.14} fill={INK} opacity={0.18} />
      <rect x={0} y={0} width={w} height={h} rx={w * 0.14} fill={INK} />
      <rect x={pad} y={pad * 1.6} width={sw} height={h - pad * 3.2} rx={w * 0.08} fill="#fff" />
      <rect x={pad} y={pad * 1.6} width={sw} height={w * 0.3} rx={w * 0.08} fill={accent} />
      <rect x={pad} y={pad * 1.6 + w * 0.16} width={sw} height={w * 0.14} fill={accent} />
      {logo ? (
        <image href={logo} x={pad + sw * 0.08} y={pad * 1.6 + w * 0.06} width={sw * 0.6} height={w * 0.18} preserveAspectRatio="xMinYMid meet" />
      ) : (
        <text x={pad + sw * 0.08} y={pad * 1.6 + w * 0.19} fontFamily={font} fontSize={w * 0.1} fill={onAccent} fontWeight={800}>
          {name}
        </text>
      )}
      {big && (
        <g>
          <rect x={pad + sw * 0.08} y={pad * 1.6 + w * 0.38} width={sw * 0.84} height={w * 0.36} rx={w * 0.05} fill={soft} />
          <text x={pad + sw * 0.5} y={pad * 1.6 + w * 0.63} textAnchor="middle" fontFamily="Archivo Black" fontSize={w * 0.17} fill={INK}>
            {big}
          </text>
        </g>
      )}
      {rows.map((r, i) => {
        const ry = pad * 1.6 + w * (big ? 0.84 : 0.42) + i * w * 0.2;
        return (
          <g key={i}>
            <rect x={pad + sw * 0.08} y={ry} width={sw * 0.84} height={w * 0.15} rx={w * 0.04} fill="#F3F4F8" />
            <circle cx={pad + sw * 0.17} cy={ry + w * 0.075} r={w * 0.035} fill={accent} />
            <text x={pad + sw * 0.27} y={ry + w * 0.098} fontFamily={font} fontSize={w * 0.062} fill={INK} fontWeight={600}>
              {r}
            </text>
          </g>
        );
      })}
    </g>
  );
}
