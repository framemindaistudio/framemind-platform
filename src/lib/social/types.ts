/**
 * Social Studio: ready-to-post designs for FrameMind's own channels.
 *
 * Every design is drawn on a canvas at its real size, so the preview on screen is exactly the file that is
 * downloaded. The rules it follows are the brand's own: OPERATIONS/01_BRAND (guidelines, voice and tone) and
 * 08_SOCIAL_MEDIA (template spec, caption and hashtag bank).
 */

export type FormatId = "post" | "square" | "story" | "wide";

export interface Format {
  id: FormatId;
  label: string;
  /** where this size is used */
  use: string;
  w: number;
  h: number;
  /** how far text stays from each edge (px), after the platform's own buttons and bars */
  safe: { top: number; right: number; bottom: number; left: number };
}

/** Sizes and safe zones from the Social Media Templates Spec. */
export const FORMATS: Record<FormatId, Format> = {
  post: { id: "post", label: "Post 4:5", use: "Instagram and LinkedIn feed", w: 1080, h: 1350, safe: { top: 72, right: 72, bottom: 72, left: 72 } },
  square: { id: "square", label: "Square 1:1", use: "Feed, WhatsApp, X", w: 1080, h: 1080, safe: { top: 72, right: 72, bottom: 72, left: 72 } },
  story: { id: "story", label: "Story 9:16", use: "Story, Reel cover, WhatsApp Status", w: 1080, h: 1920, safe: { top: 250, right: 120, bottom: 380, left: 72 } },
  wide: { id: "wide", label: "Wide 16:9", use: "YouTube thumbnail, video cover", w: 1920, h: 1080, safe: { top: 84, right: 96, bottom: 84, left: 96 } },
};
export const FORMAT_ORDER: FormatId[] = ["post", "square", "story", "wide"];

/** paper = graphite on warm paper · graphite = paper on dark · photo = a picture fills the frame */
export type Tone = "paper" | "graphite" | "photo";

export type FieldKind = "text" | "textarea" | "date" | "select" | "image";

export interface FieldSpec {
  key: string;
  label: string;
  kind: FieldKind;
  placeholder?: string;
  help?: string;
  /** for "select" */
  options?: { value: string; label: string }[];
  /** most characters that still look good in the design */
  max?: number;
  rows?: number;
}

/** What the person typed. Pictures are kept apart (they are not text and are never saved). */
export type Values = Record<string, string>;

/** A picture placed in a design: the image and how it is framed. */
export interface Picture {
  el: CanvasImageSource;
  w: number;
  h: number;
  /** generated or drawn artwork: the design then carries an "ILLUSTRATION" tag, as the brand rules ask */
  illustration: boolean;
  /** the point of the picture that stays in view when it is cropped (0–1) */
  fx: number;
  fy: number;
  zoom: number;
  /** show it in black and white (the brand's default look for photographs) */
  bw: boolean;
}

export type TemplateGroup = "Announcements" | "Promotion" | "Services" | "Hiring" | "Milestones" | "Behind the scenes" | "Video" | "Words" | "Founders";

export interface Caption {
  /** the post text, ready to paste */
  text: string;
  /** hashtags, 5 to 8 */
  tags: string[];
}

/** Things a caption or a design may need that are not typed by the person (company details, prices). */
export interface Facts {
  website: string;
  phone: string;
  email: string;
  instagram: string;
}

export interface DrawInput {
  values: Values;
  pictures: Record<string, Picture | null>;
  /** 0-based slide, for designs with several slides */
  page: number;
  pages: number;
  facts: Facts;
}

export interface TemplateDef {
  id: string;
  name: string;
  group: TemplateGroup;
  /** one line under the name in the gallery: when to use it */
  blurb: string;
  formats: FormatId[];
  tones: Tone[];
  fields: FieldSpec[];
  /** what the design shows before anything is typed (also the gallery thumbnail) */
  sample: Values;
  /**
   * Pictures shown in a picture box until the person uploads their own: field key → public path. They may depend
   * on what is typed (the kit that is picked). These are illustrations and the design labels them so.
   */
  stock?: (values: Values) => Record<string, string>;
  /** how many slides the design has for these values (carousels); 1 when left out */
  pages?: (values: Values) => number;
  draw: (p: import("./canvas").Painter, input: DrawInput) => void;
  caption: (values: Values, facts: Facts) => Caption;
}
