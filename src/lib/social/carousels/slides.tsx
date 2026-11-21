/**
 * Renders one carousel slide (1080 × 1350, Instagram 4:5) in one of five styles. Every style lays out the same
 * SlideData fields its own way, in the industry's brand colours, and every carousel ends on a call-to-action slide
 * with the app's logo and a QR code to its industry page.
 */
import QRCode from "qrcode";
import { INDUSTRIES, type IndustryId } from "@/lib/content/industries";
import { brandOf, type IndustryBrand } from "@/lib/content/industry-brands";
import { AppPhone, Bubble, Burst, Halftone, INK, Lines, Person, Prop, wrap, type Look, type PropId } from "./art";
import type { Carousel, IndustryStories, SlideData, StyleId } from "./types";

export const W = 1080;
export const H = 1350;
const F = { comic: "Bangers", hand: "Kalam", bold: "Archivo Black", body: "Inter" };

/** @font-face rules; `src` maps a file name to its URL (a path on screen, a data URI when exporting). */
export function fontCss(src: (file: string) => string) {
  const face = (family: string, file: string, weight = "400") => `@font-face{font-family:'${family}';src:url(${src(file)}) format('woff2');font-weight:${weight};font-display:block}`;
  return [face("Bangers", "bangers.woff2"), face("Kalam", "kalam-400.woff2", "400"), face("Kalam", "kalam-700.woff2", "700"), face("Archivo Black", "archivo-black.woff2"), face("Inter", "inter.woff2", "100 900")].join("");
}

export interface Ctx {
  b: IndustryBrand;
  ind: IndustryId;
  people: IndustryStories["people"];
  idx: number;
  total: number;
  uid: string;
}

/** The object that stands for each industry, drawn where a slide would otherwise be empty. */
const HERO: Record<IndustryId, PropId> = { distribution: "box", restaurant: "plate", gym: "dumbbell", pg: "bed", coaching: "books", realestate: "house", clinic: "token", dental: "tooth", lab: "tube", salon: "scissors" };

const lookOf = (c: Ctx, who: "a" | "b" | "c"): Look => (c.people[who] ?? c.people.a) as Look;

/* ── shared frame bits ────────────────────────────────────────────────── */

function TopBar({ c, dark }: { c: Ctx; dark?: boolean }) {
  return (
    <g>
      <image href={dark ? c.b.logoReverse.replace(".svg", "-clear.svg") : c.b.logo} x={60} y={48} width={250} height={64} preserveAspectRatio="xMinYMid meet" />
      <g transform={`translate(${W - 60} 80)`}>
        <rect x={-104} y={-28} width={104} height={56} rx={28} fill={dark ? "rgba(255,255,255,0.14)" : "rgba(11,18,48,0.07)"} />
        <text x={-52} y={10} textAnchor="middle" fontFamily={F.body} fontWeight={800} fontSize={26} fill={dark ? "#fff" : INK}>
          {c.idx + 1}/{c.total}
        </text>
      </g>
    </g>
  );
}

function Swipe({ c, dark }: { c: Ctx; dark?: boolean }) {
  if (c.idx > 1 || c.idx === c.total - 1) return null;
  return (
    <g transform={`translate(${W - 60} ${H - 70})`}>
      <rect x={-250} y={-36} width={250} height={72} rx={36} fill={dark ? "#fff" : INK} />
      <text x={-150} y={11} textAnchor="middle" fontFamily={F.body} fontWeight={900} fontSize={28} fill={dark ? INK : "#fff"} letterSpacing={3}>
        SWIPE
      </text>
      <path d="M-64 0 h32 m-14 -14 l14 14 l-14 14" fill="none" stroke={dark ? INK : "#fff"} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );
}

/** Puts the slide's people and props on a stage whose floor is at `floor`. */
function Stage({ c, s, floor, scale = 1.1, left = 300, right = 780, propsY }: { c: Ctx; s: SlideData; floor: number; scale?: number; left?: number; right?: number; propsY?: number }) {
  const cast = s.cast ?? [];
  const props = s.props ?? [];
  const one = cast.length === 1;
  const px = one ? [left + 360, left + 470] : [W / 2, W / 2 + 120];
  return (
    <g>
      {props.map((p, i) => (
        <Prop key={i} id={p} x={px[i] ?? W / 2} y={propsY ?? floor - 90 - i * 40} s={1.15} accent={c.b.colors.accent} soft={c.b.colors.secondary} />
      ))}
      {cast.map((r, i) => (
        <Person key={i} x={one ? left : i === 0 ? left : right} y={floor} scale={scale} look={lookOf(c, r.who)} mood={r.mood} pose={r.pose} flip={i === 1} />
      ))}
    </g>
  );
}

/** Speech bubbles over the people on a stage. */
function Talk({ c, s, floor, scale = 1.1, left = 300, right = 780, top, font = F.hand, size = 38 }: { c: Ctx; s: SlideData; floor: number; scale?: number; left?: number; right?: number; top: number; font?: string; size?: number }) {
  const cast = s.cast ?? [];
  const head = floor - 380 * scale;
  return (
    <g>
      {s.say && cast[0] && <Bubble x={cast.length > 1 ? 70 : Math.max(70, left - 230)} y={top} w={cast.length > 1 ? 470 : 640} text={s.say} tx={left} ty={head + 10} font={font} size={size} />}
      {s.reply && cast[1] && <Bubble x={W - 70 - 470} y={top + 60} w={470} text={s.reply} tx={right} ty={head + 10} font={font} size={size} fill={c.b.colors.surface} />}
    </g>
  );
}

/* ── 1. comic strip ───────────────────────────────────────────────────── */

function Comic({ c, s }: { c: Ctx; s: SlideData }) {
  const hook = c.idx === 0;
  const pad = 50;
  const panelTop = 200;
  const floor = 1150;
  const id = `ht-${c.uid}`;
  // the caption box: kicker, title and text, sized to its lines
  const tMax = hook ? 17 : 28;
  const tSize = hook ? 86 : 46;
  const tl = wrap(hook ? s.title.toUpperCase() : s.title, tMax);
  const kH = s.kicker ? 50 : 0;
  const textL = s.text ? wrap(s.text, hook ? 44 : 46).length : 0;
  const boxH = 40 + kH + tl.length * tSize * (hook ? 1.04 : 1.15) + textL * (hook ? 46 : 40) + 20;
  const boxW = hook || tl.length > 1 || (s.text ?? "").length > 30 ? W - pad * 2 + 12 : Math.min(W - pad * 2 + 12, 110 + tl[0].length * 24);
  const boxBottom = panelTop - 30 + boxH;
  const two = (s.cast?.length ?? 0) > 1;
  const scale = hook ? 1.0 : two ? 1.22 : 1.32;
  const head = floor - 360 * scale;
  const talkTop = Math.max(boxBottom + 34, head - 250);
  const left = two ? 290 : 330;
  return (
    <g>
      <defs>
        <Halftone id={id} color={c.b.colors.accent} opacity={0.32} gap={24} r={5} />
      </defs>
      <rect width={W} height={H} fill={c.b.colors.surface} />
      <rect width={W} height={H} fill={`url(#${id})`} />
      <TopBar c={c} />
      <rect x={pad} y={panelTop} width={W - pad * 2} height={H - panelTop - 130} rx={20} fill="#fff" stroke={INK} strokeWidth={10} />
      <clipPath id={`clip-${c.uid}`}>
        <rect x={pad + 5} y={panelTop + 5} width={W - pad * 2 - 10} height={H - panelTop - 140} rx={16} />
      </clipPath>
      <g clipPath={`url(#clip-${c.uid})`}>
        {/* speed lines behind the action */}
        <g stroke={c.b.colors.secondary} strokeWidth={4} opacity={0.5}>
          {Array.from({ length: 14 }, (_, i) => {
            const a = (i / 14) * Math.PI * 2;
            return <path key={i} d={`M${W / 2 + Math.cos(a) * 220} ${760 + Math.sin(a) * 220} L${W / 2 + Math.cos(a) * 900} ${760 + Math.sin(a) * 900}`} />;
          })}
        </g>
        <rect x={pad} y={floor - 10} width={W - pad * 2} height={300} fill={c.b.colors.secondary} opacity={0.55} />
        <path d={`M${pad} ${floor - 10} H${W - pad}`} stroke={INK} strokeWidth={6} />
        {hook && <rect x={pad} y={panelTop} width={W - pad * 2} height={H} fill={`url(#${id})`} />}
        <Stage c={c} s={s} floor={floor} scale={scale} left={left} right={790} />
        <Talk c={c} s={s} floor={floor} scale={scale} left={left} right={790} top={talkTop} font={F.hand} size={40} />
      </g>
      {/* the caption box, comic-style */}
      <g transform={`translate(${pad - 6} ${panelTop - 30}) rotate(-1.2)`}>
        <rect x={6} y={8} width={boxW} height={boxH} fill={INK} />
        <rect x={0} y={0} width={boxW} height={boxH} fill="#FFF3B0" stroke={INK} strokeWidth={8} />
        {s.kicker && (
          <g>
            <rect x={22} y={20} width={s.kicker.length * 17 + 30} height={42} fill={c.b.colors.accent} />
            <text x={37} y={52} fontFamily={F.comic} fontSize={32} fill={c.b.onAccent} letterSpacing={2}>
              {s.kicker.toUpperCase()}
            </text>
          </g>
        )}
        <Lines text={hook ? s.title.toUpperCase() : s.title} x={28} y={40 + kH + tSize * 0.85} size={tSize} max={tMax} font={F.comic} lh={hook ? 1.04 : 1.15} ls={1} />
        {s.text && <Lines text={s.text} x={30} y={40 + kH + tl.length * tSize * (hook ? 1.04 : 1.15) + 34} size={hook ? 40 : 34} max={hook ? 44 : 46} font={F.hand} weight={700} />}
      </g>
      {s.sfx && <Burst x={W - 250} y={hook ? Math.max(boxBottom + 150, 780) : Math.max(boxBottom + 130, 600)} r={165} text={s.sfx} font={F.comic} size={s.sfx.length > 10 ? 44 : 58} fill="#FFD23F" />}
      {s.app && <AppPhone x={W - 390} y={Math.max(boxBottom + 40, 520)} w={290} accent={c.b.colors.accent} onAccent={c.b.onAccent} soft={c.b.colors.surface} name={c.b.name} rows={s.app.rows} big={s.app.big} font={F.body} logo={c.b.logoReverse} />}
      <Swipe c={c} />
    </g>
  );
}

/* ── 2. chat POV ──────────────────────────────────────────────────────── */

function ChatThread({ c, msgs, x, y, w, h, title }: { c: Ctx; msgs: { me: boolean; text: string }[]; x: number; y: number; w: number; h: number; title: string }) {
  // a wider phone takes longer lines; positions are worked out before render
  const per = w > 700 ? 30 : 22;
  const laid = msgs.reduce<{ m: (typeof msgs)[number]; lines: string[]; top: number; bh: number }[]>((acc, m) => {
    const lines = wrap(m.text, per);
    const prev = acc[acc.length - 1];
    acc.push({ m, lines, top: prev ? prev.top + prev.bh + 22 : y + 150, bh: lines.length * 38 + 34 });
    return acc;
  }, []);
  return (
    <g>
      <rect x={x + 10} y={y + 16} width={w} height={h} rx={56} fill={INK} opacity={0.18} />
      <rect x={x} y={y} width={w} height={h} rx={56} fill={INK} />
      <rect x={x + 16} y={y + 16} width={w - 32} height={h - 32} rx={44} fill="#ECE5DD" />
      <rect x={x + 16} y={y + 16} width={w - 32} height={110} rx={44} fill={c.b.colors.primary} />
      <rect x={x + 16} y={y + 80} width={w - 32} height={46} fill={c.b.colors.primary} />
      <circle cx={x + 76} cy={y + 76} r={26} fill={c.b.colors.secondary} />
      <text x={x + 116} y={y + 86} fontFamily={F.body} fontWeight={800} fontSize={28} fill="#fff">
        {title}
      </text>
      {laid.map(({ m, lines, top, bh }, i) => {
        const bw = Math.min(w - 120, Math.max(...lines.map((l) => l.length)) * 17 + 56);
        const bx = m.me ? x + w - 40 - bw : x + 40;
        return (
          <g key={i}>
            <rect x={bx} y={top} width={bw} height={bh} rx={20} fill={m.me ? "#D9FDD3" : "#fff"} stroke="rgba(11,18,48,0.08)" />
            <Lines text={m.text} x={bx + 26} y={top + 46} size={30} max={per} font={F.body} weight={500} lh={1.25} />
          </g>
        );
      })}
    </g>
  );
}

function Chat({ c, s }: { c: Ctx; s: SlideData }) {
  const hook = c.idx === 0;
  const titleSize = hook ? 78 : 58;
  const tl = wrap(s.title, hook ? 20 : 26);
  return (
    <g>
      <rect width={W} height={H} fill={c.b.colors.background} />
      <circle cx={W - 80} cy={260} r={300} fill={c.b.colors.surface} />
      <circle cx={80} cy={H - 120} r={220} fill={c.b.colors.surface} opacity={0.7} />
      <TopBar c={c} />
      {s.kicker && (
        <g transform="translate(60 160)">
          <rect x={0} y={0} width={s.kicker.length * 19 + 50} height={54} rx={27} fill={c.b.colors.accent} />
          <text x={25} y={37} fontFamily={F.body} fontWeight={900} fontSize={28} fill={c.b.onAccent} letterSpacing={2}>
            {s.kicker}
          </text>
        </g>
      )}
      <Lines text={s.title} x={60} y={s.kicker ? 290 : 230} size={titleSize} max={hook ? 20 : 26} font={F.body} weight={900} lh={1.08} ls={-1} />
      {s.text && <Lines text={s.text} x={62} y={(s.kicker ? 290 : 230) + tl.length * titleSize * 1.08 + 10} size={34} max={42} font={F.body} weight={500} fill="rgba(11,18,48,0.72)" />}
      {s.chat &&
        (() => {
          // with nobody on stage the phone grows to fill the slide instead of floating small in the middle
          const solo = !s.cast?.length;
          const top = hook ? 640 : solo ? (s.kicker ? 290 : 230) + tl.length * titleSize * 1.08 + (s.text ? 120 : 60) : 520;
          return <ChatThread c={c} msgs={s.chat} x={solo ? (W - 800) / 2 : W - 60 - 600} y={top} w={solo ? 800 : 600} h={H - 150 - top} title={s.chatWith ?? "Chat"} />;
        })()}
      {s.app && <AppPhone x={W - 60 - 360} y={hook ? 640 : 560} w={360} accent={c.b.colors.accent} onAccent={c.b.onAccent} soft={c.b.colors.surface} name={c.b.name} rows={s.app.rows} big={s.app.big} font={F.body} logo={c.b.logoReverse} />}
      {s.list && (
        <g transform={`translate(60 ${560 + (s.app ? 0 : 0)})`}>
          {s.list.map((l, i) => (
            <g key={i} transform={`translate(0 ${i * 120})`}>
              <circle cx={30} cy={30} r={30} fill={c.b.colors.accent} />
              <path d="M17 31 l9 9 l18 -20" fill="none" stroke={c.b.onAccent} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
              <Lines text={l} x={84} y={42} size={34} max={s.app ? 17 : 34} font={F.body} weight={700} />
            </g>
          ))}
        </g>
      )}
      {s.cast?.[0] && <Person x={s.chat || s.app ? 230 : W - 260} y={H - 30} scale={0.95} look={lookOf(c, s.cast[0].who)} mood={s.cast[0].mood} pose={s.cast[0].pose ?? "phone"} />}
      {s.say && s.cast?.[0] && <Bubble x={60} y={s.chat || s.app ? 620 : 560} w={360} text={s.say} tx={230} ty={H - 30 - 400} font={F.hand} size={34} />}
      <Swipe c={c} />
    </g>
  );
}

/* ── 3. doodle notebook ───────────────────────────────────────────────── */

function Scribble({ x, y, w, h, color }: { x: number; y: number; w: number; h: number; color: string }) {
  return <path d={`M${x} ${y + h / 2} q${w * 0.05} ${-h * 0.62} ${w / 2} ${-h * 0.55} q${w * 0.52} ${h * 0.05} ${w * 0.5} ${h * 0.55} q${-w * 0.02} ${h * 0.6} ${-w * 0.5} ${h * 0.52} q${-w * 0.55} ${-h * 0.05} ${-w * 0.46} ${-h * 0.62}`} fill="none" stroke={color} strokeWidth={7} strokeLinecap="round" />;
}

function Doodle({ c, s }: { c: Ctx; s: SlideData }) {
  const hook = c.idx === 0;
  const ink2 = c.b.accentInk;
  const tl = wrap(s.title, hook ? 18 : 24);
  const ts = hook ? 88 : 64;
  const ty = 250;
  return (
    <g>
      <rect width={W} height={H} fill="#FFFDF6" />
      {Array.from({ length: 24 }, (_, i) => (
        <path key={i} d={`M0 ${200 + i * 54} H${W}`} stroke="#B9D3F0" strokeWidth={2} />
      ))}
      <path d="M140 0 V1350" stroke="#F2A5A5" strokeWidth={3} />
      {Array.from({ length: 9 }, (_, i) => (
        <circle key={i} cx={64} cy={170 + i * 140} r={16} fill={c.b.colors.surface} stroke="rgba(11,18,48,0.25)" strokeWidth={3} />
      ))}
      <rect x={W / 2 - 110} y={14} width={220} height={60} fill={c.b.colors.secondary} opacity={0.75} transform={`rotate(-3 ${W / 2} 44)`} />
      <image href={c.b.logo} x={180} y={96} width={230} height={60} preserveAspectRatio="xMinYMid meet" />
      <text x={W - 60} y={140} textAnchor="end" fontFamily={F.hand} fontWeight={700} fontSize={36} fill="rgba(11,18,48,0.55)">
        p. {c.idx + 1}/{c.total}
      </text>
      {/* highlighter under the title */}
      {tl.map((l, i) => (
        <rect key={i} x={176} y={ty + i * ts * 1.1 - ts * 0.55} width={Math.min(W - 230, l.length * ts * 0.5)} height={ts * 0.5} fill={c.b.colors.secondary} opacity={0.55} transform={`rotate(-0.8 ${W / 2} ${ty})`} />
      ))}
      <Lines text={s.title} x={180} y={ty} size={ts} max={hook ? 18 : 24} font={F.hand} weight={700} lh={1.1} />
      {s.text && <Lines text={s.text} x={182} y={ty + tl.length * ts * 1.1 + 14} size={40} max={36} font={F.hand} weight={400} fill="rgba(11,18,48,0.8)" />}
      {s.stat && (
        <g transform={`translate(${W / 2 + 60} ${hook ? 760 : 700})`}>
          <text x={0} y={0} textAnchor="middle" fontFamily={F.hand} fontWeight={700} fontSize={150} fill={ink2}>
            {s.stat}
          </text>
          <Scribble x={-290} y={-150} w={580} h={190} color={c.b.colors.accent} />
        </g>
      )}
      {s.list && (
        <g transform={`translate(190 ${s.stat ? 860 : ty + tl.length * ts * 1.1 + (s.text ? 130 : 70)})`}>
          {s.list.map((l, i) => {
            const minus = l.startsWith("-");
            const eq = l.startsWith("=");
            const t = l.replace(/^[-=+]\s*/, "");
            return (
              <g key={i} transform={`translate(0 ${i * 96})`}>
                {eq ? (
                  <path d="M-10 -36 H700" stroke={INK} strokeWidth={5} strokeLinecap="round" />
                ) : minus ? (
                  <path d="M4 -30 l30 30 M34 -30 l-30 30" fill="none" stroke="#D7263D" strokeWidth={7} strokeLinecap="round" />
                ) : (
                  <path d="M0 -12 l14 14 l26 -30" fill="none" stroke={ink2} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
                )}
                <Lines text={t} x={eq ? 0 : 62} y={0} size={eq ? 52 : 44} max={32} font={F.hand} weight={700} fill={minus ? "#B42318" : eq ? ink2 : INK} />
              </g>
            );
          })}
        </g>
      )}
      {s.app && <AppPhone x={W - 400} y={hook ? 640 : 560} w={300} accent={c.b.colors.accent} onAccent={c.b.onAccent} soft={c.b.colors.surface} name={c.b.name} rows={s.app.rows} big={s.app.big} font={F.body} logo={c.b.logoReverse} />}
      {(s.cast?.length || s.props?.length) && !s.list && <Stage c={c} s={s} floor={H - 60} scale={0.95} left={s.app ? 330 : 330} right={760} />}
      {!s.cast?.length && !s.app && !s.stat && !s.props?.length && (
        <g transform={`translate(${W - 280} ${H - 290}) rotate(-6)`}>
          <circle cx={0} cy={0} r={170} fill={c.b.colors.surface} />
          <path d="M-178 10 q8 -190 186 -186 q178 8 172 190 q-12 170 -180 170 q-170 -6 -178 -174" fill="none" stroke={ink2} strokeWidth={5} strokeLinecap="round" />
          <Prop id={HERO[c.ind]} x={0} y={0} s={1.5} accent={c.b.colors.accent} soft={c.b.colors.secondary} />
        </g>
      )}
      {(s.cast?.length || 0) > 0 && s.list && <Person x={W / 2 + 40} y={H - 50} scale={0.85} look={lookOf(c, s.cast![0].who)} mood={s.cast![0].mood} pose={s.cast![0].pose} flip />}
      {s.say && s.cast?.[0] && !s.list && <Bubble x={150} y={H - 60 - 380 * 0.95 - 190} w={460} text={s.say} tx={330} ty={H - 60 - 380 * 0.95} font={F.hand} size={36} />}
      {/* a hand-drawn arrow nudging the swipe */}
      {c.idx < c.total - 1 && (
        <g transform={`translate(${W - 200} ${H - 140})`}>
          <path d="M0 0 q70 -40 130 -6" fill="none" stroke={ink2} strokeWidth={7} strokeLinecap="round" />
          <path d="M108 -30 l24 22 l-30 12" fill="none" stroke={ink2} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
          {c.idx === 0 && (
            <text x={-30} y={60} fontFamily={F.hand} fontWeight={700} fontSize={36} fill={ink2}>
              keep reading
            </text>
          )}
        </g>
      )}
    </g>
  );
}

/* ── 4. bold hook ─────────────────────────────────────────────────────── */

function Bold({ c, s }: { c: Ctx; s: SlideData }) {
  const hook = c.idx === 0;
  // alternate the ground so a swipe always feels like a new beat
  const grounds = [c.b.colors.accent, c.b.colors.primary, c.b.colors.background];
  const g = hook ? c.b.colors.accent : grounds[c.idx % 3];
  const dark = g === c.b.colors.primary || (g === c.b.colors.accent && c.b.onAccent === "#ffffff");
  const fg = dark ? "#fff" : INK;
  const hi = dark ? c.b.colors.secondary : c.b.accentInk;
  const base = hook ? 132 : s.stat ? 76 : 92;
  const max = hook ? 11 : 16;
  const tl = wrap(s.title.toUpperCase(), max);
  // Archivo Black runs about 0.74 em a capital: shrink until the longest line fits inside the gutters
  const size = Math.min(base, Math.floor(950 / (Math.max(...tl.map((l) => l.length)) * 0.74)));
  return (
    <g>
      <rect width={W} height={H} fill={g} />
      <path d={`M${W - 380} 0 L${W} 0 L${W} 380 Z`} fill={dark ? "rgba(255,255,255,0.06)" : "rgba(11,18,48,0.05)"} />
      <TopBar c={c} dark={dark} />
      {s.kicker && (
        <g transform="translate(60 180) rotate(-3)">
          <rect x={0} y={0} width={s.kicker.length * 20 + 56} height={64} rx={10} fill="#FFD23F" stroke={INK} strokeWidth={5} />
          <text x={28} y={44} fontFamily={F.bold} fontSize={30} fill={INK} letterSpacing={1}>
            {s.kicker.toUpperCase()}
          </text>
        </g>
      )}
      {s.stat && (
        <text x={56} y={hook ? 560 : 470} fontFamily={F.bold} fontSize={250} fill={hi} letterSpacing={-6}>
          {s.stat}
        </text>
      )}
      <Lines text={s.title.toUpperCase()} x={60} y={s.stat ? (hook ? 720 : 620) : hook ? 380 : 340} size={size} max={max} font={F.bold} fill={fg} lh={0.98} ls={-2} />
      {s.text && <Lines text={s.text} x={62} y={(s.stat ? (hook ? 720 : 620) : hook ? 380 : 340) + tl.length * size * 0.98 + 30} size={36} max={s.app ? 26 : 40} font={F.body} weight={600} fill={dark ? "rgba(255,255,255,0.8)" : "rgba(11,18,48,0.75)"} />}
      {s.list && (
        <g transform={`translate(60 ${(s.stat ? 620 : 340) + tl.length * size * 0.98 + (s.text ? 140 : 70)})`}>
          {s.list.map((l, i) => {
            const before = l.startsWith("x ");
            const t = l.replace(/^[xv] /, "");
            return (
              <g key={i} transform={`translate(0 ${i * 92})`}>
                <rect x={0} y={-44} width={64} height={64} rx={14} fill={before ? "rgba(229,72,77,0.18)" : dark ? "rgba(255,255,255,0.14)" : c.b.colors.surface} />
                {before ? <path d="M18 -26 l28 28 M46 -26 l-28 28" stroke="#E5484D" strokeWidth={7} strokeLinecap="round" /> : <path d="M16 -12 l12 12 l22 -26" fill="none" stroke={hi} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />}
                <text x={92} y={4} fontFamily={F.body} fontWeight={800} fontSize={38} fill={fg} textDecoration={before ? "line-through" : undefined} opacity={before ? 0.75 : 1}>
                  {t}
                </text>
              </g>
            );
          })}
        </g>
      )}
      {(s.cast?.length ?? 0) > 0 && (
        <g>
          <circle cx={W - 250} cy={H - 300} r={230} fill={dark ? "rgba(255,255,255,0.1)" : c.b.colors.surface} />
          <Person x={W - 250} y={H - 70} scale={1.0} look={lookOf(c, s.cast![0].who)} mood={s.cast![0].mood} pose={s.cast![0].pose} flip />
        </g>
      )}
      {s.app && <AppPhone x={W - 420} y={hook ? 640 : 600} w={330} accent={dark ? c.b.colors.accent : c.b.colors.primary} onAccent="#fff" soft={c.b.colors.surface} name={c.b.name} rows={s.app.rows} big={s.app.big} font={F.body} logo={c.b.logoReverse} />}
      {!s.cast?.length && !s.app && (
        // a list fills the middle, so the prop shrinks into the corner below it
        <g transform={`translate(${W - (s.list ? 200 : 250)} ${H - (s.list ? 210 : 300)}) rotate(8)`}>
          <circle cx={0} cy={0} r={s.list ? 140 : 190} fill={dark ? "rgba(255,255,255,0.1)" : c.b.colors.surface} />
          <Prop id={s.props?.[0] ?? HERO[c.ind]} x={0} y={0} s={s.list ? 1.25 : 1.7} accent={dark ? c.b.colors.secondary : c.b.colors.accent} soft={dark ? c.b.colors.accent : c.b.colors.secondary} />
        </g>
      )}
      <Swipe c={c} dark={dark} />
    </g>
  );
}

/* ── 5. day in the life ───────────────────────────────────────────────── */

function skyOf(kicker: string | undefined, c: Ctx) {
  const m = /(\d{1,2})(?::\d\d)?\s*(AM|PM)/i.exec(kicker ?? "");
  if (!m) return { sky: c.b.colors.background, night: false };
  let h = Number(m[1]) % 12;
  if (m[2].toUpperCase() === "PM") h += 12;
  if (h < 8) return { sky: "#FFE7C2", night: false };
  if (h < 16) return { sky: c.b.colors.background, night: false };
  if (h < 19) return { sky: "#FFD6BA", night: false };
  return { sky: "#141B3D", night: true };
}

function Day({ c, s }: { c: Ctx; s: SlideData }) {
  const hook = c.idx === 0;
  const { sky, night } = skyOf(s.kicker, c);
  const fg = night ? "#fff" : INK;
  const tl = wrap(s.title, hook ? 18 : 24);
  const ts = hook ? 84 : 58;
  return (
    <g>
      <rect width={W} height={H} fill={hook ? c.b.colors.surface : sky} />
      {night &&
        Array.from({ length: 26 }, (_, i) => <circle key={i} cx={(i * 197) % W} cy={150 + ((i * 89) % 520)} r={i % 3 ? 2.5 : 4} fill="#fff" opacity={0.8} />)}
      {!night && !hook && <circle cx={W - 150} cy={200} r={60} fill="#FFD23F" opacity={0.85} />}
      {night && <path d="M900 150 a60 60 0 1 0 44 104 a48 48 0 1 1 -44 -104 z" fill="#FDF3C4" />}
      <TopBar c={c} dark={night} />
      {/* the day's timeline down the left edge */}
      <path d={`M90 200 V${H - 120}`} stroke={night ? "rgba(255,255,255,0.3)" : "rgba(11,18,48,0.15)"} strokeWidth={6} strokeDasharray="2 16" strokeLinecap="round" />
      {Array.from({ length: c.total - 1 }, (_, i) => {
        const y = 220 + i * ((H - 380) / Math.max(1, c.total - 2));
        const on = i === c.idx;
        return <circle key={i} cx={90} cy={y} r={on ? 20 : 11} fill={on ? c.b.colors.accent : night ? "rgba(255,255,255,0.4)" : "rgba(11,18,48,0.2)"} stroke={on ? (night ? "#fff" : INK) : "none"} strokeWidth={5} />;
      })}
      {s.kicker && (
        <g transform="translate(160 170)">
          <rect x={0} y={0} width={s.kicker.length * 30 + 110} height={92} rx={46} fill={night ? "#fff" : INK} />
          <circle cx={46} cy={46} r={24} fill="none" stroke={night ? INK : "#fff"} strokeWidth={5} />
          <path d="M46 46 v-14 M46 46 l10 8" stroke={night ? INK : "#fff"} strokeWidth={5} strokeLinecap="round" />
          <text x={86} y={60} fontFamily={F.bold} fontSize={44} fill={night ? INK : "#fff"}>
            {s.kicker}
          </text>
        </g>
      )}
      <Lines text={s.title} x={160} y={s.kicker ? 360 : 300} size={ts} max={hook ? 18 : 24} font={F.body} weight={900} fill={fg} lh={1.08} ls={-1} />
      {s.text && <Lines text={s.text} x={162} y={(s.kicker ? 360 : 300) + tl.length * ts * 1.08 + 10} size={34} max={40} font={F.body} weight={500} fill={night ? "rgba(255,255,255,0.8)" : "rgba(11,18,48,0.72)"} />}
      {/* the scene sits on a round stage */}
      <ellipse cx={W / 2 + 60} cy={H - 110} rx={420} ry={70} fill={night ? "rgba(255,255,255,0.12)" : c.b.colors.secondary} opacity={night ? 1 : 0.5} />
      <Stage c={c} s={s} floor={H - 110} scale={1.0} left={s.app ? 340 : 400} right={780} />
      <Talk c={c} s={s} floor={H - 110} scale={1.0} left={s.app ? 340 : 400} right={780} top={H - 110 - 380 - 230} size={34} />
      {s.app && <AppPhone x={W - 380} y={H - 110 - 640} w={300} accent={c.b.colors.accent} onAccent={c.b.onAccent} soft={c.b.colors.surface} name={c.b.name} rows={s.app.rows} big={s.app.big} font={F.body} logo={c.b.logoReverse} />}
      <Swipe c={c} dark={night} />
    </g>
  );
}

/* ── the last slide ───────────────────────────────────────────────────── */

function QR({ text, x, y, size, color }: { text: string; x: number; y: number; size: number; color: string }) {
  const q = QRCode.create(text, { errorCorrectionLevel: "M" });
  const n = q.modules.size;
  const m = size / n;
  const cells: React.ReactNode[] = [];
  for (let r = 0; r < n; r++) for (let col = 0; col < n; col++) if (q.modules.get(r, col)) cells.push(<rect key={`${r}-${col}`} x={col * m} y={r * m} width={m + 0.4} height={m + 0.4} />);
  return (
    <g transform={`translate(${x} ${y})`} fill={color}>
      {cells}
    </g>
  );
}

function Cta({ c, cta, style }: { c: Ctx; cta: string; style: StyleId }) {
  const slug = INDUSTRIES.find((i) => i.id === c.ind)?.slug ?? "";
  const url = `framemindaistudio.com/industries/${slug}`;
  const font = style === "comic" ? F.comic : style === "doodle" ? F.hand : style === "bold" ? F.bold : F.body;
  const tl = wrap(cta, style === "bold" ? 14 : 18);
  const size = style === "bold" ? 92 : style === "comic" ? 100 : 80;
  return (
    <g>
      <rect width={W} height={H} fill={c.b.colors.primary} />
      <circle cx={W} cy={0} r={520} fill={c.b.colors.accent} opacity={0.9} />
      <circle cx={0} cy={H} r={360} fill={c.b.colors.secondary} opacity={0.25} />
      <TopBar c={c} dark />
      <Lines text={style === "bold" || style === "comic" ? cta.toUpperCase() : cta} x={60} y={330} size={size} max={style === "bold" ? 14 : 18} font={font} weight={900} fill="#fff" lh={1.02} ls={style === "comic" ? 2 : -1} />
      <text x={62} y={330 + tl.length * size * 1.02 + 30} fontFamily={F.body} fontWeight={500} fontSize={36} fill="rgba(255,255,255,0.8)">
        Try the live demo of {c.b.name}. Every role, on your phone.
      </text>
      <g transform="translate(60 760)">
        <rect x={0} y={0} width={400} height={400} rx={36} fill="#fff" />
        <QR text={`https://www.${url}`} x={34} y={34} size={332} color={c.b.colors.primary} />
      </g>
      <g transform="translate(510 800)">
        <text x={0} y={0} fontFamily={F.bold} fontSize={44} fill="#fff">
          Scan to try it
        </text>
        <text x={0} y={60} fontFamily={F.body} fontWeight={700} fontSize={30} fill={c.b.colors.secondary}>
          framemindaistudio.com
        </text>
        <text x={0} y={100} fontFamily={F.body} fontWeight={700} fontSize={30} fill={c.b.colors.secondary}>
          /industries/{slug}
        </text>
        <Lines text="Your name, logo and colours. Live in 3–4 weeks." x={0} y={190} size={32} max={24} font={F.body} weight={500} fill="rgba(255,255,255,0.85)" />
      </g>
      <text x={60} y={H - 60} fontFamily={F.body} fontWeight={700} fontSize={28} fill="rgba(255,255,255,0.7)" letterSpacing={2}>
        POWERED BY FRAMEMIND AI STUDIO
      </text>
    </g>
  );
}

/* ── one slide ────────────────────────────────────────────────────────── */

const RENDER: Record<StyleId, (p: { c: Ctx; s: SlideData }) => React.ReactElement> = { comic: Comic, chat: Chat, doodle: Doodle, bold: Bold, day: Day };

/** One slide as a full SVG. `i` = slides.length is the call-to-action slide. */
export function SlideSvg({ story, car, i, fonts, uid }: { story: IndustryStories; car: Carousel; i: number; fonts: string; uid: string }) {
  const b = brandOf(story.industry);
  const total = car.slides.length + 1;
  const c: Ctx = { b, ind: story.industry, people: story.people, idx: i, total, uid };
  const R = RENDER[car.style];
  return (
    <svg xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      <defs>
        <style>{fonts}</style>
      </defs>
      {i < car.slides.length ? <R c={c} s={car.slides[i]} /> : <Cta c={c} cta={car.cta} style={car.style} />}
    </svg>
  );
}
