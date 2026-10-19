/**
 * Presentations in HQ: the client decks (studio pitch, Vritta, AI coaching) and the team handbook.
 * A deck is data; src/components/hq/decks draws it at 1600×900 and scales it to any screen or to a 16:9 PDF page.
 * Wording follows the studio website and the Operations Library; prices come from the saved rate card,
 * never typed in a slide.
 */

import type { RateCard } from "@/lib/pricebook/types";

export type Phase = "Wow" | "Why" | "Build" | "Test" | "Show";

/** Lucide icon names the renderer knows (see src/components/hq/decks/icons.ts). */
export type IconName =
  | "Bot" | "Eye" | "Brain" | "Hand" | "Zap" | "Lightbulb" | "Battery" | "Fan" | "Sparkles" | "Star" | "Map" | "ArrowUp" | "RotateCcw"
  | "RotateCw" | "Bug" | "Wrench" | "Car" | "Sun" | "Flashlight" | "Cpu" | "Code" | "Radar" | "Waves" | "Camera" | "Scan" | "Target"
  | "Users" | "Trophy" | "ShieldCheck" | "Film" | "Clapperboard" | "Plane" | "School" | "GraduationCap" | "CalendarDays" | "IndianRupee"
  | "Handshake" | "Mic" | "Clock" | "ListChecks" | "Heart" | "MessageCircle" | "Scale" | "Lock" | "Globe" | "Rocket" | "Package"
  | "Gauge" | "Sliders" | "Layers" | "Puzzle" | "Smile" | "Megaphone" | "Phone" | "Shirt" | "ClipboardList" | "Search" | "Volume2"
  | "Cable" | "Plug" | "Usb" | "Upload" | "Monitor" | "Wifi" | "Ruler" | "Scissors" | "BookOpen" | "Flag" | "Laptop" | "Music" | "Hammer" | "Navigation" | "Thermometer" | "Activity" | "Move" | "Box";

export interface Card {
  icon: IconName;
  title: string;
  text?: string;
}

/* ── Wiring pictures (drawn by src/components/hq/decks/Wiring.tsx) ─────────────────────────── */

export type WireColour = "red" | "black" | "yellow" | "blue" | "green" | "orange" | "white" | "purple" | "brown" | "grey";
export type PinSide = "top" | "bottom" | "left" | "right";

/** One part in a wiring picture, drawn to look like the one in the kit. Pins are named as on the real part. */
export interface PartSpec {
  id: string;
  type: "battery" | "switch" | "led" | "resistor" | "motor" | "buzzer" | "ldr" | "transistor" | "servo" | "ultrasonic" | "breadboard" | "board";
  x: number;
  y: number;
  label?: string;
  /** where the label goes (left edge, baseline), relative to the part; default centred under it */
  labelAt?: [number, number];
  /** LED colour, fan colour or board colour */
  color?: string;
  /** battery: number of AA cells (pins "+" and "-") */
  /** battery: leads on the left instead of the right */
  flip?: boolean;
  cells?: number;
  /** LED glows, motor spins, buzzer sounds, switch is on */
  on?: boolean;
  /** motor: a fan on the shaft */
  fan?: boolean;
  /** motor: "geared" is the yellow BO motor with a wheel */
  variant?: "geared";
  /** resistor: value printed above it, and its colour bands; transistor or servo: the printed name */
  value?: string;
  bands?: string[];
  /** board: size, title, the pins along each side, and what is drawn on it */
  w?: number;
  h?: number;
  title?: string;
  titleSize?: number;
  pins?: Partial<Record<PinSide, string[]>>;
  pinSize?: number;
  chip?: boolean;
  usb?: boolean;
  camera?: boolean;
  screen?: string;
  /** breadboard: number of columns and the columns shown as joined */
  cols?: number;
  highlight?: number[];
}

export interface Wire {
  /** "partId.pin" */
  from: string;
  to: string;
  color?: WireColour;
  /** corner points to pass through, when the automatic route is not tidy */
  via?: [number, number][];
  label?: string;
  labelAt?: [number, number];
  dashed?: boolean;
}

export interface Diagram {
  /** drawing size in its own units; it is scaled to fit the slide */
  w: number;
  h: number;
  parts: PartSpec[];
  wires: Wire[];
  /** sticky notes on the picture; "
" breaks a line */
  notes?: { x: number; y: number; text: string; color?: string }[];
  /** dashed boxes that group parts ("Left eye → right motor") */
  zones?: { x: number; y: number; w: number; h: number; label: string; color?: string }[];
  /** dots run along the wires while presenting: the current flowing */
  flow?: boolean;
}

/** What a slide shows. Every kind takes the same optional extras (see Slide). */
export type SlideBody =
  | { kind: "cover"; kicker: string; title: string; sub?: string; art?: string }
  | { kind: "statement"; big: string; sub?: string; icon?: IconName; art?: string }
  | { kind: "points"; title: string; points: string[]; art?: string; icon?: IconName }
  | { kind: "cards"; title: string; cards: Card[]; sub?: string }
  | { kind: "steps"; title: string; steps: { title: string; detail?: string; icon?: IconName }[]; sub?: string }
  | { kind: "agenda"; title: string; rows: { time: string; title: string; detail?: string; phase?: Phase }[] }
  | { kind: "code"; title: string; code: string; bullets?: string[]; highlight?: number[] }
  | { kind: "quiz"; question: string; options: string[]; answer: number; explain?: string }
  | { kind: "compare"; title: string; left: { title: string; items: string[] }; right: { title: string; items: string[] } }
  | { kind: "table"; title: string; head: string[]; rows: string[][]; foot?: string }
  | { kind: "image"; title: string; src: string; caption?: string; points?: string[] }
  | { kind: "big-number"; number: string; label: string; sub?: string }
  | { kind: "closing"; title: string; sub?: string; points?: string[] }
  /** the start of a chapter of the story: "Chapter 2 · Give the robot eyes" */
  | { kind: "chapter"; n: number; title: string; sub?: string; icon?: IconName }
  /** what is in the kit: each part drawn, with what it does */
  | { kind: "parts"; title: string; parts: { name: string; qty?: string; job: string; draw?: Omit<PartSpec, "id" | "x" | "y">; icon?: IconName }[] }
  /** a wiring picture, with a few notes beside it */
  | { kind: "circuit"; title: string; diagram: Diagram; points?: string[]; caption?: string }
  /** one step of the build: what you need, what to do, how to know it worked */
  | {
      kind: "build";
      step: number;
      of: number;
      title: string;
      need?: string[];
      do: string[];
      check?: string;
      tip?: string;
      warn?: string;
      diagram?: Diagram;
      art?: string;
      icon?: IconName;
    }
  /** how it works: boxes joined by arrows, with an optional loop back */
  | { kind: "flow"; title: string; nodes: { icon: IconName; title: string; text?: string }[]; loop?: string; sub?: string };

export type Slide = SlideBody & {
  /** what to say: shown in the presenter's notes, never on the projected slide */
  notes?: string;
  /** the part of the lesson arc, shown as a small chip */
  phase?: Phase;
  /** minutes this slide covers, for the presenter's clock */
  minutes?: number;
};

export type DeckGroup = "clients" | "team";

/** Look and reading level: younger groups get fewer, bigger words and a brighter accent. */
export interface DeckTheme {
  /** accent colour (hex) */
  accent: string;
  /** soft background tint of the accent */
  tint: string;
  /** 1 = Grades 1–2 (largest type) … 4 = adults */
  level: 1 | 2 | 3 | 4;
  /** colours for cards and steps in turn, so a row of ideas reads as separate things */
  palette: string[];
}

export interface Deck {
  id: string;
  group: DeckGroup;
  title: string;
  /** who it is for, one line */
  audience: string;
  /** what it is for, one or two lines, for the library */
  blurb: string;
  minutes: number;
  theme: DeckTheme;
  /** the source documents in the Operations Library */
  sources: string[];
  /** a slide list, built when shown: the client's (or new member's) name goes on the cover; prices come from the rate card */
  slides: (o: { client?: string; rates?: RateCard | null }) => Slide[];
}

/** Pictures used on slides that are illustrations, not photographs: they are labelled as such. */
export const ILLUSTRATIONS = ["/images/illustrations/"];
export const isIllustration = (src: string) => ILLUSTRATIONS.some((p) => src.startsWith(p));
