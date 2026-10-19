import { coachingDeck } from "./coaching";
import { handbookDeck } from "./handbook";
import { studioDeck } from "./studio";
import { vrittaDeck } from "./vritta";
import type { Deck, DeckGroup } from "./types";

export const DECKS: Deck[] = [studioDeck, vrittaDeck, coachingDeck, handbookDeck];
export const deckById = (id: string) => DECKS.find((d) => d.id === id);

export const GROUP_LABEL: Record<DeckGroup, { title: string; blurb: string }> = {
  clients: { title: "For client meetings", blurb: "Present on a discovery call or in person. Pick the client from the CRM or type the name, and it goes on the cover. Prices are read from the Rate Card." },
  team: { title: "For the team", blurb: "Walk every new team member, intern or freelancer through this in their first week." },
};
