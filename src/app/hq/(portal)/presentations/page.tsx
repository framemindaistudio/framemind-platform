import type { Metadata } from "next";
import { requireUser } from "@/lib/hq/auth";
import { ALL } from "@/lib/hq/roles";
import { CLIENT_STAGES, getCollection } from "@/lib/hq/collections";
import { listRecords } from "@/lib/hq/records";
import { DeckLibrary, type CrmClient } from "@/components/hq/decks/DeckLibrary";

export const metadata: Metadata = { title: "Presentations" };

/** clients most likely to need a deck come first; lost clients are left out */
const ORDER = ["discovery", "quoted", "negotiation", "contacted", "lead", "active", "won", "nurture"];

export default async function PresentationsPage() {
  const user = await requireUser(ALL);
  // only logins that may read the Clients CRM get its names (others type the name)
  const canRead = getCollection("clients")?.read.includes(user.role) ?? false;
  const clients: CrmClient[] = canRead
    ? (await listRecords<{ id: string; name?: string; city?: string; stage?: string }>("clients"))
        .filter((c) => c.name?.trim() && c.stage !== "lost")
        .map((c) => ({ name: c.name!.trim().slice(0, 80), city: c.city?.trim() || undefined, stage: c.stage || "lead" }))
        .sort((a, b) => (ORDER.indexOf(a.stage) + 1 || 99) - (ORDER.indexOf(b.stage) + 1 || 99) || a.name.localeCompare(b.name))
        .map((c) => ({ ...c, stage: CLIENT_STAGES.find((o) => o.value === c.stage)?.label ?? c.stage }))
    : [];
  return <DeckLibrary clients={clients} />;
}
