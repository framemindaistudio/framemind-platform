import type { PublicProduct } from "./types";

/**
 * "Works with" data for the store. Apps appear as name badges only: Adobe, Microsoft, Apple, Google, Canva and most other
 * brands do not allow their logos or app icons on third-party products without a licence, while naming a product to say
 * it is compatible is allowed. `name` is the short label for covers, `full` the official product name for product pages.
 */
export type App = { name: string; full: string };

export const APPS: Record<string, App> = {
  davinciresolve: { name: "DaVinci Resolve", full: "DaVinci Resolve" },
  googledocs: { name: "Google Docs", full: "Google Docs" },
  googlesheets: { name: "Google Sheets", full: "Google Sheets" },
  googlegemini: { name: "Gemini", full: "Google Gemini" },
  claude: { name: "Claude", full: "Claude" },
  figma: { name: "Figma", full: "Figma" },
  photopea: { name: "Photopea", full: "Photopea" },
  notion: { name: "Notion", full: "Notion" },
  cursor: { name: "Cursor", full: "Cursor" },
  gimp: { name: "GIMP", full: "GIMP" },
  krita: { name: "Krita", full: "Krita" },
  apple: { name: "macOS", full: "macOS" },
  linux: { name: "Linux", full: "Linux" },
  replit: { name: "Replit", full: "Replit" },
  photoshop: { name: "Photoshop", full: "Adobe Photoshop" },
  illustrator: { name: "Illustrator", full: "Adobe Illustrator" },
  lightroom: { name: "Lightroom", full: "Adobe Lightroom" },
  lrclassic: { name: "Lightroom Classic", full: "Adobe Lightroom Classic" },
  cameraraw: { name: "Camera Raw", full: "Adobe Camera Raw" },
  premiere: { name: "Premiere Pro", full: "Adobe Premiere Pro" },
  finalcut: { name: "Final Cut Pro", full: "Final Cut Pro" },
  procreate: { name: "Procreate", full: "Procreate" },
  canva: { name: "Canva", full: "Canva" },
  word: { name: "Word", full: "Microsoft Word" },
  excel: { name: "Excel", full: "Microsoft Excel" },
  powerpoint: { name: "PowerPoint", full: "Microsoft PowerPoint" },
  googleslides: { name: "Google Slides", full: "Google Slides" },
  chatgpt: { name: "ChatGPT", full: "ChatGPT" },
  windows: { name: "Windows", full: "Windows" },
  iphone: { name: "iPhone", full: "iPhone" },
  android: { name: "Android", full: "Android" },
  anycamera: { name: "Any camera", full: "Any camera" },
  vscode: { name: "VS Code", full: "Visual Studio Code" },
  lovable: { name: "Lovable", full: "Lovable" },
  googlefonts: { name: "Google Fonts", full: "Google Fonts" },
  indesign: { name: "InDesign", full: "Adobe InDesign" },
  blackmagic: { name: "Blackmagic Camera", full: "Blackmagic Camera" },
  edits: { name: "Edits", full: "Edits by Instagram" },
  vn: { name: "VN", full: "VN Video Editor" },
  inshot: { name: "InShot", full: "InShot" },
};

/** Which apps each product works with, most important first. */
export const COMPAT: Record<string, string[]> = {
  "claude-code-beginners": ["claude", "windows", "apple", "linux", "vscode"],
  "vibe-coding-101": ["chatgpt", "claude", "googlegemini", "cursor", "replit", "lovable"],
  "ai-prompts-creators": ["chatgpt", "claude", "googlegemini", "notion"],
  "camera-basics": ["anycamera", "iphone", "android"],
  "phone-cinematography": ["iphone", "android", "edits", "vn", "inshot", "blackmagic"],
  "lightroom-presets": ["lightroom", "lrclassic", "cameraraw"],
  "cinematic-luts": ["premiere", "davinciresolve", "finalcut", "photoshop"],
  "carousel-templates": ["photoshop", "photopea", "canva", "powerpoint", "googleslides"],
  "psd-mockups": ["photoshop", "photopea"],
  "colour-palettes": ["photoshop", "illustrator", "indesign", "procreate", "figma", "canva", "gimp", "krita"],
  "font-pairings": ["googlefonts", "canva", "figma", "googledocs"],
  "freelancer-kit": ["word", "excel", "googledocs", "googlesheets"],
};

/** Apps for a product; a bundle gets the apps of everything inside it. */
export function appsFor(p: Pick<PublicProduct, "id" | "bundleOf">): App[] {
  const ids = p.bundleOf?.length ? p.bundleOf.flatMap((id) => COMPAT[id] ?? []) : (COMPAT[p.id] ?? []);
  return [...new Set(ids)].map((id) => APPS[id]).filter(Boolean);
}

export const COMPAT_NOTE = "Product and app names are trademarks of their owners. FrameMind AI Studio is not affiliated with or endorsed by them.";
