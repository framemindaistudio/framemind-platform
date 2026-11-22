/**
 * The first screen of each product page: its offline app (with real screenshots in public/shop/apps), a one-line promise
 * and three "only here" points that the page marks visually (circled, underlined, highlighted).
 * Every line restates something in the product's own "What you get" list; nothing here may promise more than the pack holds.
 * Products without an entry fall back to their tagline and first includes.
 */

export type Mark = "circle" | "underline" | "highlight";

export interface Showcase {
  /** a short promise in the customer's words: the job done, not the file */
  promise: string;
  /** the offline HTML app in the pack, when there is one */
  app?: { name: string; does: string; shots: { desktop: string; phone: string } };
  /** three points, each marked differently */
  points: { text: string; mark: Mark }[];
}

const shots = (id: string) => ({ desktop: `/shop/apps/${id}-d.webp`, phone: `/shop/apps/${id}-m.webp` });

export const SHOWCASE: Record<string, Showcase> = {
  "claude-code-beginners": {
    promise: "Go from installing Claude Code to five working projects, without a coding background.",
    app: { name: "Coach", does: "Project checklists with copy buttons, a prompt builder and an error finder.", shots: shots("claude-code-beginners") },
    points: [
      { text: "5 projects with starter files", mark: "circle" },
      { text: "Coach app works offline", mark: "highlight" },
      { text: "Windows, Mac and desktop app setup", mark: "underline" },
    ],
  },
  "ai-prompts-creators": {
    promise: "Fill your creator brief once. Every one of the 100 prompts is then about you.",
    app: { name: "Prompt Studio", does: "Your brief fills every prompt; copy with one tap, even on your phone.", shots: shots("ai-prompts-creators") },
    points: [
      { text: "Fill your brief once", mark: "circle" },
      { text: "Prompt Studio works offline", mark: "highlight" },
      { text: "AI-sound checker included", mark: "underline" },
    ],
  },
  "camera-basics": {
    promise: "Move a slider, watch the photo change, then shoot with the right settings.",
    app: { name: "Settings Simulator", does: "Change aperture, shutter and ISO and see the same scene react.", shots: shots("camera-basics") },
    points: [
      { text: "See every setting before you shoot", mark: "circle" },
      { text: "Simulator works offline", mark: "highlight" },
      { text: "Names for Sony, Canon, Nikon, Fujifilm and phones", mark: "underline" },
    ],
  },
  "phone-cinematography": {
    promise: "Plan a Reel from 40 proven shots and walk in with a printed shot list.",
    app: { name: "Shot Explorer", does: "Pick shots, build your Reel and print the shot list.", shots: shots("phone-cinematography") },
    points: [
      { text: "40 shots with example frames", mark: "circle" },
      { text: "Shot Explorer works offline", mark: "highlight" },
      { text: "Settings for India: 25/50 fps, 50 Hz", mark: "underline" },
    ],
  },
  "carousel-templates": {
    promise: "Set your brand once and export finished carousel slides, with or without Photoshop.",
    app: { name: "Carousel Studio", does: "An offline editor: set your brand once, edit the text, export PNGs.", shots: shots("carousel-templates") },
    points: [
      { text: "Your brand set once, on every slide", mark: "circle" },
      { text: "Carousel Studio works offline", mark: "highlight" },
      { text: "PSD, PowerPoint and Canva-ready", mark: "underline" },
    ],
  },
  "colour-palettes": {
    promise: "Pick a palette with tested contrast and drop it straight into your design tool or code.",
    app: { name: "Palette explorer", does: "Copy any value and try a palette on your own brand name.", shots: shots("colour-palettes") },
    points: [
      { text: "Contrast measured for every palette", mark: "circle" },
      { text: "Try it on your brand name", mark: "highlight" },
      { text: "CSS, Tailwind, Figma, Adobe and Procreate files", mark: "underline" },
    ],
  },
  "font-pairings": {
    promise: "Type your brand name, see it in 40 pairings, and get every font free for commercial use.",
    app: { name: "Font Pairing Explorer", does: "Type your brand name and see it in every pair, offline.", shots: shots("font-pairings") },
    points: [
      { text: "All 80 font families included", mark: "circle" },
      { text: "See your brand name in every pair", mark: "highlight" },
      { text: "16 bilingual pairs for Indian scripts", mark: "underline" },
    ],
  },
  "freelancer-kit": {
    promise: "Stop rebuilding Word files. Brief, quote, agreement and GST-ready invoice, from first enquiry to payment.",
    app: { name: "Freelancer tools", does: "An invoice maker with a UPI QR code, plus rate and late-payment calculators.", shots: shots("freelancer-kit") },
    points: [
      { text: "11 templates, enquiry to payment", mark: "circle" },
      { text: "Invoice maker with UPI QR, offline", mark: "highlight" },
      { text: "Written for Indian GST, TDS and law", mark: "underline" },
    ],
  },
  "vibe-coding-101": {
    promise: "Describe your idea, build it with free AI tools one small step at a time, and put it online free.",
    app: { name: "Vibe Planner", does: "Turns your idea into a one-page brief and the exact prompts to send, step by step.", shots: shots("vibe-coding-101") },
    points: [
      { text: "3 evening projects with starter files", mark: "circle" },
      { text: "Vibe Planner writes your prompts", mark: "highlight" },
      { text: "Free tools, published free", mark: "underline" },
    ],
  },
  "lightroom-presets": {
    promise: "Give portraits, travel and food photos a finished look in one tap, on phone or computer.",
    points: [
      { text: "12 looks, phone and desktop", mark: "circle" },
      { text: "Every preset's grade explained", mark: "highlight" },
      { text: "Install guide included", mark: "underline" },
    ],
  },
  "cinematic-luts": {
    promise: "Ten film looks for your edit, with before-and-after frames so you pick the right one fast.",
    points: [
      { text: "10 LUTs, 33-point .cube", mark: "circle" },
      { text: "Before-and-after for every look", mark: "highlight" },
      { text: "Log footage workflow", mark: "underline" },
    ],
  },
  "psd-mockups": {
    promise: "Real-life mockups, print-ready packaging for seven brands, and every pack turning in 3D.",
    points: [
      { text: "18 layered PSD scenes", mark: "circle" },
      { text: "40 print-ready pack designs with dielines", mark: "highlight" },
      { text: "Every size in 3D, plus a browser studio", mark: "underline" },
    ],
  },
};

export function showcaseFor(id: string): Showcase | null {
  return SHOWCASE[id] ?? null;
}
