import type { TemplateDef, TemplateGroup } from "../types";
import { CORE_TEMPLATES } from "./core";
import { MORE_TEMPLATES } from "./more";

/** Every design of Social Studio, in the order the gallery shows them. */
export const TEMPLATES: TemplateDef[] = [...CORE_TEMPLATES, ...MORE_TEMPLATES];

export const GROUP_ORDER: TemplateGroup[] = ["Announcements", "Promotion", "Services", "Hiring", "Milestones", "Behind the scenes", "Video", "Words", "Founders"];

export const GROUP_NOTES: Record<TemplateGroup, string> = {
  Announcements: "Launches, events, special days and what is coming up.",
  Promotion: "What the studio builds, the bundle, coaching and Vritta.",
  Services: "One service at a time, with its starting price.",
  Hiring: "Open roles.",
  Milestones: "Real numbers, firsts and case studies.",
  "Behind the scenes": "Photos and frames from the work itself.",
  Video: "Thumbnails and covers for videos and series.",
  Words: "Quotes, mini-lessons and carousels.",
  Founders: "Posts in a founder's own voice, for a personal profile.",
};

export const templateById = (id: string | undefined | null) => TEMPLATES.find((t) => t.id === id);
