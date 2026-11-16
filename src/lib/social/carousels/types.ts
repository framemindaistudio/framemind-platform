import type { IndustryId } from "@/lib/content/industries";
import type { Look, Mood, Pose, PropId } from "./art";

/** The five storytelling styles; each industry has one carousel in each. */
export type StyleId = "comic" | "chat" | "doodle" | "bold" | "day";

export const STYLES: { id: StyleId; name: string; idea: string }[] = [
  { id: "comic", name: "Comic strip", idea: "A real problem told as a comic: panels, speech bubbles and sound effects, then the app saves the day." },
  { id: "chat", name: "Chat POV", idea: "\"POV:\" — the chaotic WhatsApp chat every owner knows, then the same moment inside the app." },
  { id: "doodle", name: "Doodle notebook", idea: "Hand-drawn notebook pages that do the money math of the problem. Made to be saved." },
  { id: "bold", name: "Bold hook", idea: "Big, loud type and stickers: a myth-busting, scroll-stopping before/after." },
  { id: "day", name: "Day in the life", idea: "One day on a timeline, hour by hour, before and after the app." },
];

/** One person in a story, drawn with the kit. */
export interface Character extends Look {
  name: string;
}

export interface CastRef {
  /** a = the owner, b = the customer, c = staff or family */
  who: "a" | "b" | "c";
  mood: Mood;
  pose?: Pose;
}

/** A slide's content; each style lays the same fields out its own way. */
export interface SlideData {
  title: string;
  text?: string;
  /** a small label: the time on "day", a sticker on "bold", the caption tag on "comic" */
  kicker?: string;
  cast?: CastRef[];
  props?: PropId[];
  /** spoken by cast[0] */
  say?: string;
  /** spoken by cast[1] */
  reply?: string;
  sfx?: string;
  chat?: { me: boolean; text: string }[];
  /** chat header: who the chat is with */
  chatWith?: string;
  list?: string[];
  stat?: string;
  /** shows the app on a phone */
  app?: { rows: string[]; big?: string };
}

export interface Carousel {
  id: string;
  style: StyleId;
  /** the hook, as it shows in the gallery */
  title: string;
  /** the story's angle in one line, for the team */
  angle: string;
  caption: string;
  slides: SlideData[];
  /** the last slide's headline */
  cta: string;
}

export interface IndustryStories {
  industry: IndustryId;
  people: { a: Character; b: Character; c?: Character };
  carousels: Carousel[];
}
