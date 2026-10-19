"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { FilePlus2, PenLine } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Tabs } from "@/components/ui/Tabs";
import { Loading, PageHeader, StatCard } from "@/components/hq/ui";
import { requiredForMember, requiredForClient } from "@/lib/sign/catalog";
import { memberGroup, progressOf, type SignDoc } from "@/lib/sign/context";
import { templateOf } from "./bits";
import { str, useDesk } from "./desk";
import { DocDrawer } from "./DocDrawer";
import { OurSignatures } from "./OurSignatures";
import { NewDoc, type Preset } from "./NewDoc";
import { OthersTab } from "./OthersTab";
import { tally } from "./PaperSet";
import { RegisterTab } from "./RegisterTab";
import { ClientsTab } from "./ClientsTab";
import { TeamTab } from "./TeamTab";
import { TemplatesTab } from "./TemplatesTab";

type Tab = "team" | "clients" | "others" | "all" | "templates";
const TABS: Tab[] = ["team", "clients", "others", "all", "templates"];
const asTab = (v: string | null): Tab => (TABS.includes(v as Tab) ? (v as Tab) : "team");

/**
 * Documents to Sign: every paper that needs a signature, made with the names already on it, printed in one click,
 * and ticked off as each side signs. Founders and admins only.
 *
 *   Team       each person and the papers their kind of work needs
 *   Clients    each client with a quote or a project, and the papers every project needs
 *   Others     vendors, colleges, sponsors, parents at public events
 *   All        the register: every document, who has signed, a tick to mark a signature
 *   Templates  every paper HQ can make, with a blank copy to fill by hand
 */
export function SignDesk() {
  const params = useSearchParams();
  const query = params.toString();
  const desk = useDesk();
  const [tab, setTab] = useState<Tab>(() => asTab(params.get("tab")));
  // ?doc=<id> opens that paper (links from the Today reminders)
  const [openId, setOpenId] = useState<string | null>(() => params.get("doc"));
  const [preset, setPreset] = useState<Preset | null>(null);
  const [inkOpen, setInkOpen] = useState(false);

  // the address changed (a link, or back from the print view): follow it
  const [synced, setSynced] = useState(query);
  if (synced !== query) {
    setSynced(query);
    setTab(asTab(params.get("tab")));
    if (params.get("doc")) setOpenId(params.get("doc"));
  }

  function go(next: Tab) {
    setTab(next);
    try {
      window.history.replaceState(null, "", next === "team" ? "/hq/sign" : `/hq/sign?tab=${next}`);
    } catch {
      /* the address is a convenience only */
    }
  }

  const stats = useMemo(() => {
    let waitingThem = 0;
    let waitingUs = 0;
    let signed = 0;
    for (const d of desk.docs) {
      const p = progressOf(d, templateOf(d));
      if (p.standing === "signed") signed += 1;
      if (p.standing === "waiting") {
        if (p.needsParty) waitingThem += 1;
        if (p.needsStudio) waitingUs += 1;
      }
    }
    // papers that are required and not made yet: for people who are not inactive, and for live projects
    let toMake = 0;
    for (const m of desk.team) {
      if (str(m.status) === "inactive") continue;
      toMake += tally(requiredForMember(memberGroup(m)), desk.docs.filter((d) => d.partyKind === "team" && d.partyId === m.id)).missing;
    }
    const perProject = requiredForClient();
    for (const w of desk.projects) {
      if (!["kickoff", "discovery", "design", "build"].includes(str(w.stage) || "kickoff") || !w.clientId) continue;
      const mine = desk.docs.filter((d) => d.partyKind === "client" && d.partyId === w.clientId);
      toMake += tally(perProject, mine.filter((d) => d.projectId === w.id || !d.projectId)).missing;
    }
    return { waitingThem, waitingUs, signed, toMake };
  }, [desk.docs, desk.team, desk.projects]);

  const openDoc = openId ? (desk.docs.find((d) => d.id === openId) ?? null) : null;
  const open = (doc: SignDoc) => setOpenId(doc.id);

  return (
    <div>
      <PageHeader
        icon="Signature"
        eyebrow="Legal"
        title="Documents to Sign"
        description="Offer letters, NDAs, client agreements, statements of work and shoot releases. HQ fills in the names and the figures, you print and sign — or send a link — then tick who has signed."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" onClick={() => setInkOpen(true)}>
              <PenLine className="size-3.5" aria-hidden /> Our signatures
            </Button>
            {desk.canEdit && (
              <Button size="sm" onClick={() => setPreset({})}>
                <FilePlus2 className="size-3.5" aria-hidden /> New document
              </Button>
            )}
          </div>
        }
      />

      {desk.error && <p className="mb-4 rounded border border-bad/30 bg-bad/10 px-3 py-2 text-sm text-bad">{desk.error}</p>}

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Waiting for their signature" value={stats.waitingThem} sub="Printed or sent, not signed by the other side yet" />
        <StatCard label="Waiting for FrameMind's signature" value={stats.waitingUs} sub="A founder still has to sign" />
        <StatCard label="Still to make" value={stats.toMake} sub="Required papers not made yet, for the team and for live projects" />
        <StatCard label="Signed" value={stats.signed} sub={`${desk.docs.length} on record`} tone="dark" />
      </div>

      <Tabs
        className="mb-6"
        value={tab}
        onChange={go}
        tabs={[
          { value: "team", label: "Team" },
          { value: "clients", label: "Clients" },
          { value: "others", label: "Others" },
          { value: "all", label: "All documents", count: desk.docs.length },
          { value: "templates", label: "Templates" },
        ]}
      />

      {!desk.ready ? (
        <Loading label="Opening the documents…" />
      ) : (
        <>
          {tab === "team" && <TeamTab desk={desk} tab={tab} onOpen={open} onNew={setPreset} />}
          {tab === "clients" && <ClientsTab desk={desk} tab={tab} onOpen={open} onNew={setPreset} />}
          {tab === "others" && <OthersTab desk={desk} tab={tab} onOpen={open} onNew={setPreset} />}
          {tab === "all" && <RegisterTab desk={desk} tab={tab} onOpen={open} />}
          {tab === "templates" && <TemplatesTab desk={desk} tab={tab} onNew={setPreset} />}
        </>
      )}

      <DocDrawer desk={desk} doc={openDoc} tab={tab} onClose={() => setOpenId(null)} />
      <OurSignatures open={inkOpen} onClose={() => setInkOpen(false)} canEdit={desk.canEdit} onChanged={desk.reloadInks} />
      <NewDoc
        desk={desk}
        preset={preset}
        onClose={() => setPreset(null)}
        onMade={(doc) => {
          setPreset(null);
          setOpenId(doc.id);
        }}
      />
    </div>
  );
}
