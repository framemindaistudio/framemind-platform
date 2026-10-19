/**
 * What every FrameMind deck shares: the look, the service icons and prices read from the saved rate card
 * (HQ → Money → Rate Card), so a slide never carries a number typed into it.
 */
import { BUNDLE, COACHING, SERVICES, TERMS, VRITTA } from "@/lib/content/catalog";
import type { RateCard } from "@/lib/pricebook/types";
import { formatINR } from "@/lib/utils";
import type { DeckTheme, IconName } from "./types";

export const THEME: DeckTheme = { accent: "#7C3AED", tint: "#F1F7DC", level: 4, palette: ["#0D0D0D", "#7C3AED", "#4D7C0F"] };

export const SERVICE_ICON: Record<string, IconName> = {
  websites: "Globe",
  brand: "Layers",
  software: "Code",
  automations: "Zap",
  photography: "Camera",
  videography: "Film",
  social: "Megaphone",
};

/** The rate card the deck reads: the saved one, or the published prices when it has not loaded. */
export function card(rates?: RateCard | null): RateCard {
  if (rates) return rates;
  return {
    gstPercent: TERMS.gstPercent,
    services: SERVICES,
    socialContracts: [],
    bundleSteps: BUNDLE.steps,
    vritta: { rates: VRITTA.rates, oneTime: VRITTA.oneTime, groupLicencePercent: VRITTA.groupLicencePercent, amcPercent: VRITTA.amcPercent },
    coaching: { online: COACHING.fees.online, offline: COACHING.fees.offline, sessions: 0 },
    terms: { validityDays: TERMS.validityDays, revisionRounds: TERMS.revisionRounds, milestones: TERMS.defaultMilestones },
  };
}

/** The lowest price a service can be bought at: the cheapest option in every "choose one" group. */
export function startingPrice(serviceId: string, rates?: RateCard | null) {
  const s = card(rates).services.find((x) => x.id === serviceId);
  if (!s) return 0;
  return s.groups.filter((g) => g.mode === "one").reduce((sum, g) => sum + Math.min(...g.options.map((o) => o.price)), 0);
}

export const from = (n: number, monthly = false) => (n > 0 ? `from ${formatINR(n)}${monthly ? "/month" : ""}` : "quoted after the call");
