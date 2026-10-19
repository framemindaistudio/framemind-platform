/**
 * Wiring pictures for the build tutorials: each part is drawn to look like the real thing in the kit, with its pins
 * where the real pins are, and wires run between named pins ("bat.+" → "sw.a"). A diagram is data (see Diagram in
 * src/lib/decks/types.ts); this file only draws it. With `flow`, little dots run along the wires (current flowing).
 */
import type { ReactNode } from "react";
import type { Diagram, PartSpec, PinSide, WireColour } from "@/lib/decks/types";

const MONT = "var(--font-dm-sans), 'DM Sans', sans-serif";
const MONO = "var(--font-mono-jb), 'JetBrains Mono', monospace";

export const WIRE: Record<WireColour, string> = {
  red: "#e03131",
  black: "#25262b",
  yellow: "#f2b705",
  blue: "#1c7ed6",
  green: "#2f9e44",
  orange: "#f76707",
  white: "#adb5bd",
  purple: "#7048e8",
  brown: "#8b5a2b",
  grey: "#868e96",
};

type Dir = "up" | "down" | "left" | "right";
interface Pin {
  x: number;
  y: number;
  dir: Dir;
}
interface Drawn {
  w: number;
  h: number;
  pins: Record<string, Pin>;
  node: ReactNode;
}

const LEG = "#9aa0a6";
const leg = (x: number, y1: number, y2: number) => <line x1={x} y1={y1} x2={x} y2={y2} stroke={LEG} strokeWidth={5} strokeLinecap="round" />;
const small = (x: number, y: number, s: string, o: { size?: number; fill?: string; anchor?: "start" | "middle" | "end"; weight?: number; mono?: boolean } = {}) => (
  <text x={x} y={y} textAnchor={o.anchor ?? "middle"} style={{ font: `${o.weight ?? 700} ${o.size ?? 18}px ${o.mono ? MONO : MONT}` }} fill={o.fill ?? "#333"}>
    {s}
  </text>
);

/** The drawing of one part at (0,0), with its size and pins. */
export function drawPart(p: PartSpec): Drawn {
  switch (p.type) {
    case "battery": {
      const n = p.cells ?? 2;
      const cols = n <= 4 ? n : Math.ceil(n / 2);
      const rows = n <= 4 ? 1 : 2;
      const cw = 46, ch = 108, pad = 18, gap = 10;
      const w = pad * 2 + cols * cw + (cols - 1) * gap;
      const h = pad * 2 + rows * ch + (rows - 1) * 12;
      const cells: ReactNode[] = [];
      for (let r = 0; r < rows; r++)
        for (let c = 0; c < cols; c++) {
          const x = pad + c * (cw + gap), y = pad + r * (ch + 12);
          const up = (r * cols + c) % 2 === 0;
          cells.push(
            <g key={`${r}${c}`}>
              <rect x={x} y={y + 8} width={cw} height={ch - 8} rx={9} fill="#2f9e44" />
              <rect x={x} y={y + 8} width={cw} height={30} rx={9} fill="#1f1f1f" opacity={0.35} transform={up ? undefined : `translate(0 ${ch - 38})`} />
              <rect x={x + cw / 2 - 8} y={up ? y : y + ch - 2} width={16} height={10} rx={3} fill="#ced4da" />
              {small(x + cw / 2, y + ch / 2 + 16, up ? "+" : "−", { size: 30, fill: "#fff", weight: 800 })}
            </g>,
          );
        }
      // leads on the right, or on the left with `flip`
      const ex = p.flip ? 0 : w;
      const side: Dir = p.flip ? "left" : "right";
      return {
        w,
        h,
        pins: { "+": { x: ex, y: pad + 20, dir: side }, "-": { x: ex, y: h - pad - 20, dir: side } },
        node: (
          <g>
            <rect x={0} y={0} width={w} height={h} rx={16} fill="#343a40" />
            {cells}
            <rect x={ex - 6} y={pad + 12} width={12} height={16} rx={3} fill={WIRE.red} />
            <rect x={ex - 6} y={h - pad - 28} width={12} height={16} rx={3} fill={WIRE.black} />
            {small(p.flip ? -14 : w + 14, pad + 8, "+", { size: 26, fill: WIRE.red, anchor: p.flip ? "end" : "start", weight: 800 })}
            {small(p.flip ? -14 : w + 14, h - pad + 4, "−", { size: 26, fill: "#333", anchor: p.flip ? "end" : "start", weight: 800 })}
          </g>
        ),
      };
    }
    case "switch": {
      const w = 130, h = 70;
      const on = p.on ?? true;
      return {
        w,
        h,
        pins: { a: { x: 0, y: 35, dir: "left" }, b: { x: w, y: 35, dir: "right" } },
        node: (
          <g>
            <rect x={0} y={8} width={w} height={54} rx={12} fill="#495057" />
            <rect x={22} y={24} width={86} height={22} rx={11} fill="#212529" />
            <rect x={on ? 66 : 24} y={18} width={40} height={34} rx={9} fill="#f1f3f5" />
            {small(w / 2, 4, on ? "ON" : "OFF", { size: 16, fill: on ? WIRE.green : "#868e96", weight: 800 })}
          </g>
        ),
      };
    }
    case "led": {
      const c = p.color ?? "#e03131";
      const on = p.on ?? false;
      return {
        w: 60,
        h: 150,
        pins: { "+": { x: 20, y: 150, dir: "down" }, "-": { x: 40, y: 132, dir: "down" } },
        node: (
          <g>
            {on && (
              <>
                <defs>
                  <radialGradient id={`glow-${p.id}`}>
                    <stop offset="0%" stopColor={c} stopOpacity={0.75} />
                    <stop offset="100%" stopColor={c} stopOpacity={0} />
                  </radialGradient>
                </defs>
                <circle cx={30} cy={46} r={78} fill={`url(#glow-${p.id})`} />
              </>
            )}
            {leg(20, 88, 150)}
            {leg(40, 88, 132)}
            <path d="M6 82 V40 A24 24 0 0 1 54 40 V82 Z" fill={c} opacity={on ? 1 : 0.8} />
            <path d="M14 44 A14 14 0 0 1 26 26" stroke="#fff" strokeOpacity={0.7} strokeWidth={5} fill="none" strokeLinecap="round" />
            <rect x={2} y={80} width={56} height={10} rx={3} fill={c} />
            {small(8, 128, "+", { size: 22, fill: WIRE.red, weight: 800 })}
            {small(53, 122, "−", { size: 22, fill: "#333", weight: 800 })}
          </g>
        ),
      };
    }
    case "resistor": {
      const bands = p.bands ?? ["#8b5a2b", "#25262b", "#e03131"];
      return {
        w: 160,
        h: 40,
        pins: { a: { x: 0, y: 20, dir: "left" }, b: { x: 160, y: 20, dir: "right" } },
        node: (
          <g>
            <line x1={0} y1={20} x2={160} y2={20} stroke={LEG} strokeWidth={5} />
            <rect x={38} y={5} width={84} height={30} rx={13} fill="#e9d8a6" stroke="#c9b27c" strokeWidth={2} />
            {bands.map((b, i) => (
              <rect key={i} x={52 + i * 13} y={5} width={7} height={30} fill={b} />
            ))}
            <rect x={104} y={5} width={7} height={30} fill="#c9a227" />
            {p.value && small(80, -8, p.value, { size: 20, weight: 800 })}
          </g>
        ),
      };
    }
    case "motor": {
      const fan = p.fan ?? false;
      const bo = p.variant === "geared";
      const on = p.on ?? false;
      const body = bo ? "#f2b705" : "#adb5bd";
      return {
        w: fan ? 190 : 150,
        h: 120,
        pins: { a: { x: 30, y: 120, dir: "down" }, b: { x: 70, y: 120, dir: "down" } },
        node: (
          <g>
            {bo ? <rect x={0} y={10} width={110} height={70} rx={8} fill={body} /> : <rect x={0} y={14} width={104} height={64} rx={30} fill={body} />}
            {!bo && <rect x={0} y={14} width={22} height={64} rx={10} fill="#868e96" />}
            <rect x={104} y={40} width={30} height={12} rx={4} fill="#ced4da" />
            {bo && <circle cx={140} cy={46} r={36} fill="#25262b" stroke="#495057" strokeWidth={8} />}
            {fan && (
              <g transform="translate(150 46)">
                {[0, 120, 240].map((a) => (
                  <ellipse key={a} cx={0} cy={-26} rx={12} ry={28} fill={p.color ?? "#1c7ed6"} transform={`rotate(${a})`} opacity={0.9} />
                ))}
                <circle r={8} fill="#343a40" />
              </g>
            )}
            {on && <path d={`M${fan ? 118 : 112} 0 A44 44 0 0 1 ${fan ? 190 : 176} 40`} stroke="#2f9e44" strokeWidth={5} fill="none" markerEnd="url(#arrow-green)" />}
            <rect x={24} y={78} width={12} height={16} fill="#c0c4c8" />
            <rect x={64} y={78} width={12} height={16} fill="#c0c4c8" />
            {leg(30, 92, 120)}
            {leg(70, 92, 120)}
          </g>
        ),
      };
    }
    case "buzzer":
      return {
        w: 90,
        h: 140,
        pins: { "+": { x: 32, y: 140, dir: "down" }, "-": { x: 58, y: 126, dir: "down" } },
        node: (
          <g>
            {leg(32, 80, 140)}
            {leg(58, 80, 126)}
            <circle cx={45} cy={44} r={40} fill="#212529" />
            <circle cx={45} cy={44} r={9} fill="#495057" />
            {small(20, 26, "+", { size: 20, fill: "#fff", weight: 800 })}
            {p.on && (
              <g stroke="#7048e8" strokeWidth={4} fill="none" strokeLinecap="round">
                <path d="M96 20 A30 30 0 0 1 96 68" />
                <path d="M108 8 A46 46 0 0 1 108 80" />
              </g>
            )}
          </g>
        ),
      };
    case "ldr":
      return {
        w: 70,
        h: 140,
        pins: { a: { x: 25, y: 140, dir: "down" }, b: { x: 45, y: 140, dir: "down" } },
        node: (
          <g>
            {leg(25, 60, 140)}
            {leg(45, 60, 140)}
            <circle cx={35} cy={34} r={32} fill="#f3e5c3" stroke="#c9a66b" strokeWidth={4} />
            <path d="M14 22 H56 M56 22 V30 H14 V38 H56 V46 H14" stroke="#b5482c" strokeWidth={4} fill="none" />
          </g>
        ),
      };
    case "transistor":
      return {
        w: 80,
        h: 150,
        pins: { C: { x: 20, y: 150, dir: "down" }, B: { x: 40, y: 150, dir: "down" }, E: { x: 60, y: 150, dir: "down" } },
        node: (
          <g>
            {leg(20, 66, 150)}
            {leg(40, 66, 150)}
            {leg(60, 66, 150)}
            <path d="M6 70 V30 A34 26 0 0 1 74 30 V70 Z" fill="#212529" />
            {small(40, 52, p.value ?? "BC547", { size: 15, fill: "#fff", mono: true })}
            {small(12, 108, "C", { size: 18, fill: "#333", weight: 800, anchor: "end" })}
            {small(40, 112, "B", { size: 18, fill: "#fff", weight: 800 })}
            {small(68, 108, "E", { size: 18, fill: "#333", weight: 800, anchor: "start" })}
          </g>
        ),
      };
    case "servo":
      return {
        w: 190,
        h: 104,
        pins: { S: { x: 0, y: 36, dir: "left" }, "+": { x: 0, y: 56, dir: "left" }, "-": { x: 0, y: 76, dir: "left" } },
        node: (
          <g>
            <path d="M0 36 C30 36 30 46 52 50 M0 56 H52 M0 76 C30 76 30 66 52 62" stroke="none" />
            <line x1={0} y1={36} x2={52} y2={50} stroke={WIRE.orange} strokeWidth={6} strokeLinecap="round" />
            <line x1={0} y1={56} x2={52} y2={56} stroke={WIRE.red} strokeWidth={6} strokeLinecap="round" />
            <line x1={0} y1={76} x2={52} y2={62} stroke={WIRE.brown} strokeWidth={6} strokeLinecap="round" />
            <rect x={44} y={40} width={130} height={30} rx={4} fill="#1971c2" />
            <rect x={52} y={24} width={114} height={76} rx={8} fill="#1c7ed6" />
            <circle cx={88} cy={16} r={14} fill="#f8f9fa" stroke="#ced4da" strokeWidth={3} />
            <path d="M58 16 H140" stroke="#f8f9fa" strokeWidth={14} strokeLinecap="round" />
            <circle cx={88} cy={16} r={5} fill="#adb5bd" />
            {small(110, 70, p.value ?? "SG90", { size: 18, fill: "#fff", mono: true })}
          </g>
        ),
      };
    case "ultrasonic": {
      const names = ["VCC", "TRIG", "ECHO", "GND"];
      return {
        w: 240,
        h: 136,
        pins: Object.fromEntries(names.map((n, i) => [n, { x: 75 + i * 30, y: 136, dir: "down" as Dir }])),
        node: (
          <g>
            {names.map((_, i) => (
              <g key={i}>
                <rect x={69 + i * 30} y={96} width={12} height={16} fill="#25262b" />
                {leg(75 + i * 30, 108, 136)}
              </g>
            ))}
            <rect x={0} y={0} width={240} height={100} rx={8} fill="#1864ab" />
            {[60, 180].map((cx) => (
              <g key={cx}>
                <circle cx={cx} cy={46} r={38} fill="#dee2e6" stroke="#868e96" strokeWidth={4} />
                <circle cx={cx} cy={46} r={26} fill="#495057" />
                <circle cx={cx} cy={46} r={26} fill="none" stroke="#868e96" strokeWidth={2} strokeDasharray="3 4" />
              </g>
            ))}
            {small(120, 20, "HC-SR04", { size: 14, fill: "#fff", mono: true })}
            {names.map((n, i) => (
              <text key={n} x={75 + i * 30} y={92} textAnchor="middle" style={{ font: `700 11px ${MONO}` }} fill="#fff">
                {n}
              </text>
            ))}
          </g>
        ),
      };
    }
    case "breadboard": {
      const cols = p.cols ?? 14;
      const pitch = 34;
      const w = 60 + cols * pitch, h = 330;
      const hi = new Set(p.highlight ?? []);
      const holes: ReactNode[] = [];
      for (let c = 0; c < cols; c++) {
        const x = 46 + c * pitch;
        if (hi.has(c + 1)) {
          holes.push(<rect key={`hA${c}`} x={x - 13} y={64} width={26} height={104} rx={12} fill={p.color ?? "#2f9e44"} opacity={0.3} />);
          holes.push(<rect key={`hB${c}`} x={x - 13} y={190} width={26} height={104} rx={12} fill={p.color ?? "#2f9e44"} opacity={0.12} />);
        }
        for (let r = 0; r < 5; r++) {
          holes.push(<rect key={`a${c}${r}`} x={x - 6} y={70 + r * 20} width={12} height={12} rx={2} fill="#495057" />);
          holes.push(<rect key={`b${c}${r}`} x={x - 6} y={196 + r * 20} width={12} height={12} rx={2} fill="#495057" />);
        }
        holes.push(<text key={`n${c}`} x={x} y={182} textAnchor="middle" style={{ font: `600 11px ${MONO}` }} fill="#868e96">{c + 1}</text>);
      }
      return {
        w,
        h,
        pins: {},
        node: (
          <g>
            <rect x={0} y={0} width={w} height={h} rx={14} fill="#f8f9fa" stroke="#ced4da" strokeWidth={3} />
            <line x1={30} y1={22} x2={w - 30} y2={22} stroke={WIRE.red} strokeWidth={3} />
            <line x1={30} y1={46} x2={w - 30} y2={46} stroke={WIRE.blue} strokeWidth={3} />
            <line x1={30} y1={h - 46} x2={w - 30} y2={h - 46} stroke={WIRE.red} strokeWidth={3} />
            <line x1={30} y1={h - 22} x2={w - 30} y2={h - 22} stroke={WIRE.blue} strokeWidth={3} />
            {Array.from({ length: cols }, (_, c) => (
              <g key={c}>
                <rect x={40 + c * pitch} y={28} width={12} height={12} rx={2} fill="#868e96" />
                <rect x={40 + c * pitch} y={h - 40} width={12} height={12} rx={2} fill="#868e96" />
              </g>
            ))}
            <rect x={20} y={176} width={w - 40} height={8} rx={4} fill="#e9ecef" />
            {holes}
          </g>
        ),
      };
    }
    case "board": {
      const w = p.w ?? 320, h = p.h ?? 200;
      const fill = p.color ?? "#0b7a5a";
      // light boards (a breadboard rail) get dark lettering
      const lum = ((n) => 0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255))(parseInt(fill.slice(1), 16));
      const letter = lum > 160 ? "#343a40" : "#fff";
      const pins: Record<string, Pin> = {};
      const marks: ReactNode[] = [];
      for (const side of ["top", "bottom", "left", "right"] as PinSide[]) {
        const list = p.pins?.[side] ?? [];
        const len = side === "top" || side === "bottom" ? w : h;
        list.forEach((name, i) => {
          if (!name) return;
          const at = (len / (list.length + 1)) * (i + 1);
          const x = side === "left" ? 0 : side === "right" ? w : at;
          const y = side === "top" ? 0 : side === "bottom" ? h : at;
          const dir: Dir = side === "top" ? "up" : side === "bottom" ? "down" : side;
          pins[name] = { x, y, dir };
          const lx = side === "left" ? x + 16 : side === "right" ? x - 16 : x;
          const ly = side === "top" ? y + 30 : side === "bottom" ? y - 18 : y + 6;
          marks.push(
            <g key={side + name}>
              <rect x={x - 9} y={y - 9} width={18} height={18} rx={3} fill="#c9a227" stroke="#7a6418" strokeWidth={2} />
              <text x={lx} y={ly} textAnchor={side === "left" ? "start" : side === "right" ? "end" : "middle"} style={{ font: `700 ${p.pinSize ?? 15}px ${MONO}` }} fill={letter}>
                {name}
              </text>
            </g>,
          );
        });
      }
      return {
        w,
        h,
        pins,
        node: (
          <g>
            <rect x={0} y={0} width={w} height={h} rx={14} fill={fill} />
            <rect x={6} y={6} width={w - 12} height={h - 12} rx={10} fill="none" stroke="#fff" strokeOpacity={0.15} strokeWidth={2} />
            {p.usb && <rect x={-18} y={h / 2 - 22} width={34} height={44} rx={4} fill="#ced4da" stroke="#868e96" strokeWidth={2} />}
            {p.chip !== false && <rect x={w / 2 - 34} y={h / 2 - 2} width={68} height={44} rx={4} fill="#212529" />}
            {p.camera && (
              <g>
                <rect x={w / 2 - 34} y={h / 2 - 50} width={68} height={68} rx={8} fill="#212529" />
                <circle cx={w / 2} cy={h / 2 - 16} r={22} fill="#343a40" stroke="#868e96" strokeWidth={4} />
                <circle cx={w / 2} cy={h / 2 - 16} r={8} fill="#1c7ed6" />
              </g>
            )}
            {p.screen && <rect x={24} y={34} width={w - 48} height={h - 74} rx={4} fill="#0b1d3a" stroke="#4dabf7" strokeWidth={2} />}
            {p.screen && small(w / 2, h / 2 + 2, p.screen, { size: 18, fill: "#74c0fc", mono: true })}
            {p.title && small(w / 2, p.screen ? 26 : p.camera ? h - 34 : h / 2 - 16, p.title, { size: p.titleSize ?? 20, fill: letter, weight: 800 })}
            {marks}
          </g>
        ),
      };
    }
  }
}

/** A path from one pin to another: out of each pin a little way, then square corners between. */
function route(a: Pin, b: Pin, via?: [number, number][]) {
  const out = (p: Pin, d = 26) => ({ x: p.x + (p.dir === "right" ? d : p.dir === "left" ? -d : 0), y: p.y + (p.dir === "down" ? d : p.dir === "up" ? -d : 0) });
  const a1 = out(a), b1 = out(b);
  const pts: { x: number; y: number }[] = [a, a1];
  if (via?.length) {
    // each via point is reached with one square corner
    let cur = a1;
    const horizontalFirst = (p: Pin) => p.dir === "left" || p.dir === "right";
    let hFirst = horizontalFirst(a);
    for (const [x, y] of [...via.map(([x, y]) => [x, y] as [number, number]), [b1.x, b1.y] as [number, number]]) {
      pts.push(hFirst ? { x, y: cur.y } : { x: cur.x, y });
      pts.push({ x, y });
      cur = { x, y };
      hFirst = !hFirst;
    }
  } else {
    const ha = a.dir === "left" || a.dir === "right";
    const hb = b.dir === "left" || b.dir === "right";
    if (ha && hb) {
      const mx = (a1.x + b1.x) / 2;
      pts.push({ x: mx, y: a1.y }, { x: mx, y: b1.y });
    } else if (!ha && !hb) {
      const my = a.dir === "down" && b.dir === "down" ? Math.max(a1.y, b1.y) : a.dir === "up" && b.dir === "up" ? Math.min(a1.y, b1.y) : (a1.y + b1.y) / 2;
      pts.push({ x: a1.x, y: my }, { x: b1.x, y: my });
    } else if (ha) pts.push({ x: b1.x, y: a1.y });
    else pts.push({ x: a1.x, y: b1.y });
    pts.push(b1);
  }
  pts.push(b);
  return pts.filter((p, i) => i === 0 || p.x !== pts[i - 1].x || p.y !== pts[i - 1].y);
}

/** Polyline with rounded corners. */
function pathOf(pts: { x: number; y: number }[], r = 14) {
  let d = `M${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const p = pts[i], a = pts[i - 1], b = pts[i + 1];
    const la = Math.hypot(p.x - a.x, p.y - a.y), lb = Math.hypot(b.x - p.x, b.y - p.y);
    const k = Math.min(r, la / 2, lb / 2);
    const s = { x: p.x - ((p.x - a.x) / (la || 1)) * k, y: p.y - ((p.y - a.y) / (la || 1)) * k };
    const e = { x: p.x + ((b.x - p.x) / (lb || 1)) * k, y: p.y + ((b.y - p.y) / (lb || 1)) * k };
    d += ` L${s.x} ${s.y} Q${p.x} ${p.y} ${e.x} ${e.y}`;
  }
  const last = pts[pts.length - 1];
  return `${d} L${last.x} ${last.y}`;
}

/** A whole wiring picture, fitted into its box. */
export function WiringView({ diagram, flow = false, style }: { diagram: Diagram; flow?: boolean; style?: React.CSSProperties }) {
  const drawn = new Map(diagram.parts.map((p) => [p.id, { spec: p, d: drawPart(p) }]));
  const pinAt = (ref: string) => {
    const dot = ref.indexOf(".");
    const part = drawn.get(ref.slice(0, dot));
    const pin = part?.d.pins[ref.slice(dot + 1)];
    if (!part || !pin) return null;
    return { x: part.spec.x + pin.x, y: part.spec.y + pin.y, dir: pin.dir };
  };
  const wires = diagram.wires.flatMap((w, i) => {
    const a = pinAt(w.from), b = pinAt(w.to);
    if (!a || !b) return [];
    const pts = route(a, b, w.via);
    return [{ w, i, d: pathOf(pts), mid: pts[Math.floor(pts.length / 2) - 1], mid2: pts[Math.floor(pts.length / 2)] }];
  });
  // fit the picture to what is drawn (parts, their labels, wires and notes), so it fills its box
  const xs: number[] = [], ys: number[] = [];
  const add = (x: number, y: number) => (xs.push(x), ys.push(y));
  for (const { spec, d } of drawn.values()) {
    add(spec.x - (spec.type === "board" && spec.usb ? 24 : 0), spec.y - 14);
    add(spec.x + d.w + (spec.type === "battery" && !spec.flip ? 34 : 0), spec.y + d.h);
    if (spec.type === "battery" && spec.flip) add(spec.x - 34, spec.y);
    if (spec.label) {
      const lw = spec.label.length * 15;
      const [lx, ly] = spec.labelAt ?? [d.w / 2 - lw / 2, d.h + 34];
      add(spec.x + lx, spec.y + ly - 22);
      add(spec.x + lx + lw, spec.y + ly + 8);
    }
  }
  for (const { d } of wires) for (const m of d.matchAll(/[ML]([\d.-]+) ([\d.-]+)/g)) add(Number(m[1]), Number(m[2]));
  for (const n of diagram.notes ?? []) {
    const lines = n.text.split("\n");
    add(n.x, n.y);
    add(n.x + Math.max(...lines.map((l) => l.length)) * 12.5 + 34, n.y + lines.length * 28 + 20);
  }
  for (const z of diagram.zones ?? []) {
    add(z.x, z.y);
    add(z.x + z.w, z.y + z.h);
  }
  const pad = 26;
  const vb = xs.length ? [Math.min(...xs) - pad, Math.min(...ys) - pad, Math.max(...xs) - Math.min(...xs) + pad * 2, Math.max(...ys) - Math.min(...ys) + pad * 2] : [0, 0, diagram.w, diagram.h];
  return (
    <svg viewBox={vb.join(" ")} style={{ width: "100%", height: "100%", display: "block", ...style }} role="img" aria-label="Wiring diagram">
      <defs>
        <marker id="arrow-green" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
          <path d="M0 0 L10 5 L0 10 z" fill="#2f9e44" />
        </marker>
      </defs>
      {diagram.zones?.map((z) => (
        <g key={z.label}>
          <rect x={z.x} y={z.y} width={z.w} height={z.h} rx={22} fill={z.color ?? "#1c7ed6"} fillOpacity={0.07} stroke={z.color ?? "#1c7ed6"} strokeOpacity={0.4} strokeWidth={3} strokeDasharray="10 8" />
          {small(z.x + 20, z.y + 34, z.label, { size: 22, fill: z.color ?? "#1c7ed6", anchor: "start", weight: 800 })}
        </g>
      ))}
      {wires.map(({ w, i, d }) => (
        <g key={i}>
          <path d={d} fill="none" stroke="#fff" strokeWidth={15} strokeLinejoin="round" strokeLinecap="round" />
          <path d={d} fill="none" stroke={WIRE[w.color ?? "black"]} strokeWidth={8} strokeLinejoin="round" strokeLinecap="round" strokeDasharray={w.dashed ? "14 10" : undefined} />
          {flow && !w.dashed && (
            <path d={d} fill="none" stroke="#fff" strokeOpacity={0.95} strokeWidth={4} strokeLinecap="round" strokeDasharray="1 23">
              <animate attributeName="stroke-dashoffset" from="24" to="0" dur="0.9s" repeatCount="indefinite" />
            </path>
          )}
        </g>
      ))}
      {[...drawn.values()].map(({ spec, d }) => (
        <g key={spec.id} transform={`translate(${spec.x} ${spec.y})`}>
          {d.node}
          {spec.label && (
            <text x={spec.labelAt?.[0] ?? d.w / 2} y={spec.labelAt?.[1] ?? d.h + 36} textAnchor={spec.labelAt ? "start" : "middle"} style={{ font: `800 26px ${MONT}`, paintOrder: "stroke" }} fill="#1f1f1f" stroke="#fff" strokeWidth={9} strokeLinejoin="round">
              {spec.label}
            </text>
          )}
        </g>
      ))}
      {wires
        .filter(({ w }) => w.label)
        .map(({ w, i, mid, mid2 }) => {
          const x = w.labelAt?.[0] ?? (mid.x + mid2.x) / 2, y = w.labelAt?.[1] ?? (mid.y + mid2.y) / 2;
          const text = w.label!;
          const tw = text.length * 11 + 22;
          return (
            <g key={`l${i}`}>
              <rect x={x - tw / 2} y={y - 17} width={tw} height={34} rx={17} fill="#fff" stroke={WIRE[w.color ?? "black"]} strokeWidth={3} />
              {small(x, y + 7, text, { size: 18, fill: "#1f1f1f", mono: true })}
            </g>
          );
        })}
      {diagram.notes?.map((n) => {
        const lines = n.text.split("\n");
        const tw = Math.max(...lines.map((l) => l.length)) * 12.5 + 34;
        const th = lines.length * 28 + 20;
        return (
          <g key={n.text}>
            <rect x={n.x} y={n.y} width={tw} height={th} rx={14} fill={n.color ?? "#fff3bf"} stroke="#1f1f1f" strokeOpacity={0.12} strokeWidth={2} />
            {lines.map((l, k) => (
              <text key={k} x={n.x + 17} y={n.y + 36 + k * 28} style={{ font: `700 21px ${MONT}` }} fill="#1f1f1f">
                {l}
              </text>
            ))}
          </g>
        );
      })}
    </svg>
  );
}

/** One part on its own, for the "what's in the kit" cards. */
export function PartPicture({ spec, size }: { spec: PartSpec; size: number }) {
  const d = drawPart(spec);
  const pad = 30;
  return (
    <svg viewBox={`${-pad} ${-pad} ${d.w + pad * 2} ${d.h + pad * 2}`} width={size} height={size} aria-hidden>
      {d.node}
    </svg>
  );
}
