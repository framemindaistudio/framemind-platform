/** Every carousel story, in the industries' order: 10 industries × 5 styles. */
import { CLASS, DORM, FIT, TABLE, TRADE } from "./stories-a";
import { DEAL, GLOW, SAMPLE, SMILE, TOKEN } from "./stories-b";
import type { IndustryStories } from "./types";

export const CAROUSELS: IndustryStories[] = [TRADE, TABLE, FIT, DORM, CLASS, DEAL, TOKEN, SMILE, SAMPLE, GLOW];

export * from "./types";
