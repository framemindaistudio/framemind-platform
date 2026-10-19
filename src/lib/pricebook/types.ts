/**
 * The rate card: every price FrameMind's founders control from HQ → Money → Rate Card.
 *
 * One JSON document in the private data repository (data/ratecard.json) with two parts:
 *
 *   RATES    what clients pay — every service with its groups and options, the bundle and social-contract
 *            discounts, Vritta's licence and one-time fees, coaching fees and the standard terms. Everyone who
 *            prepares or reads a quote receives this part.
 *
 *   PLANNER  what running the studio costs and what it aims for — monthly fixed costs, one-time setup budget,
 *            targets, revenue streams and the share of each service's price the studio keeps. Private: only the
 *            roles that see Finance receive it.
 *
 * Quotes copy the prices they use at the moment they are made, so changing a rate never changes a quote already sent.
 */
import type { Service, VrittaEdition, VrittaSegment } from "@/lib/content/catalog";

export interface SocialContract {
  months: number;
  label: string;
  discountPercent: number;
  badge?: string;
}

export interface BundleStep {
  services: number;
  discountPercent: number;
}

export interface VrittaRate {
  monthly: number;
  annual: number;
  perpetual: number;
  amc: number;
}

export interface VrittaRates {
  rates: Record<VrittaSegment, Record<VrittaEdition, VrittaRate | null>>;
  oneTime: { id: string; label: string; detail: string; price: number }[];
  groupLicencePercent: number;
  amcPercent: number;
}

export interface CoachingFees {
  /** fee for the whole 90-day 1:1 programme, before GST; 0 = not set yet */
  online: number;
  offline: number;
  /** live sessions the programme includes; 0 = not set yet */
  sessions: number;
}

export interface Milestone {
  label: string;
  percent: number;
}

export interface QuoteTerms {
  validityDays: number;
  revisionRounds: number;
  milestones: Milestone[];
}

export interface RateCard {
  gstPercent: number;
  services: Service[];
  socialContracts: SocialContract[];
  bundleSteps: BundleStep[];
  vritta: VrittaRates;
  coaching: CoachingFees;
  terms: QuoteTerms;
}

export interface MoneyLine {
  id: string;
  label: string;
  amount: number;
}

export interface RevenueStream {
  id: string;
  name: string;
  model: string;
  potential: string;
  stage: string;
}

export interface PlanTargets {
  monthlyRevenue: number;
  projectsPerMonth: number;
  avgProjectValue: number;
  activeLearners: number;
  vrittaInstitutions: number;
  /** social media retainers running at once, and the average monthly fee of one */
  socialRetainers: number;
  avgRetainer: number;
  /** month-on-month growth of the project count, in percent, for the 12-month projection */
  growthPercent: number;
}

/** Planning assumptions behind HQ → Business Planner. Private. */
export interface PlannerBook {
  /** monthly fixed costs (rent, tools, salaries…) */
  fixedCosts: MoneyLine[];
  /** one-time setup and gear budget */
  capex: MoneyLine[];
  targets: PlanTargets;
  streams: RevenueStream[];
  /** the share of each service's price the studio keeps after direct costs, in percent: keys are service ids plus "coaching" and "vritta" */
  margins: Record<string, number>;
}

export interface PriceBook {
  version: 1;
  rates: RateCard;
  planner: PlannerBook;
  updatedAt?: string;
  updatedBy?: string;
}
