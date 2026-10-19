"use client";

import { useCallback, useMemo } from "react";
import { useCollection, useHq, useSettings } from "@/components/hq/data";
import { useTodayIso } from "@/components/hq/team/team";
import { canEdit } from "@/lib/hq/roles";
import { getCollection, type BaseRecord } from "@/lib/hq/collections";
import type { CompanySettings } from "@/lib/hq/settings";
import { templateById } from "@/lib/sign/catalog";
import { withInkTick, type Inks } from "@/lib/sign/ink";
import { useInks } from "./useInks";
import { companyOf, nextRef, prefill, progressOf, SIGN_DOCS, signatoriesFor, type SignDoc, type Sources } from "@/lib/sign/context";
import type { Company, Party, SignTemplate } from "@/lib/sign/types";

export type Rec = BaseRecord;
export const str = (v: unknown) => (v === undefined || v === null ? "" : String(v)).trim();

/** A document about to be made: which paper, for whom, and the records its boxes are filled from. */
export interface NewDoc {
  template: SignTemplate;
  party: Party;
  sources?: Omit<Sources, "company" | "signatory">;
  projectId?: string;
  proposalId?: string;
}

export interface Desk {
  ready: boolean;
  error?: string;
  /** founders and admins, while HQ can save */
  canEdit: boolean;
  /** "2026-10-13"; empty until the page is running in the browser */
  today: string;
  settings: CompanySettings;
  company: Company;
  docs: SignDoc[];
  team: Rec[];
  clients: Rec[];
  vendors: Rec[];
  projects: Rec[];
  proposals: Rec[];
  /** makes drafts with the boxes filled from HQ's records; returns them as saved */
  make: (items: NewDoc[]) => Promise<SignDoc[]>;
  save: (doc: SignDoc) => Promise<SignDoc>;
  /** locks drafts as printed today (the wording and the company's details are kept as they are now) */
  issue: (docs: SignDoc[]) => Promise<SignDoc[]>;
  remove: (id: string) => Promise<void>;
  /** the founders' saved signatures, by name (src/lib/sign/ink.ts) */
  inks: Inks;
  /** reads the signatures again after one is saved */
  reloadInks: () => Promise<void>;
  /** reads the papers again (after the server changed one, as sending does) */
  refresh: () => Promise<unknown>;
}

/**
 * A document with one side ticked as signed (or the tick taken off). Ticking a draft means it was printed, so it is
 * locked as it stands, with the company's details of today.
 */
export function ticked(doc: SignDoc, side: "party" | "studio", on: boolean, desk: Pick<Desk, "today" | "company">): SignDoc {
  const patch: Partial<SignDoc> = side === "party" ? { partySigned: on, partySignedOn: on ? doc.partySignedOn || desk.today : "" } : { studioSigned: on, studioSignedOn: on ? doc.studioSignedOn || desk.today : "" };
  const lock: Partial<SignDoc> = on && doc.status === "draft" ? { status: "issued", issuedOn: doc.issuedOn || desk.today, company: desk.company } : {};
  return { ...doc, ...patch, ...lock };
}

/** The quote a client's papers are filled from: the project's own, else the accepted one, else the newest. */
export function proposalFor(proposals: Rec[], clientId: string, project?: Rec) {
  if (project?.quoteId) {
    const own = proposals.find((p) => p.id === project.quoteId);
    if (own) return own;
  }
  const mine = proposals.filter((p) => p.clientId === clientId).sort((a, b) => str(b.date).localeCompare(str(a.date)));
  return mine.find((p) => str(p.status) === "accepted") ?? mine[0];
}

/** Where the print view lives. `tab` brings the person back to the tab they came from. */
export const printHref = (ids: string[], tab: string) => `/hq/print/sign?ids=${ids.map(encodeURIComponent).join(",")}&tab=${tab}`;
export const blankHref = (templateId: string, copies: number, tab: string) => `/hq/print/sign?blank=${encodeURIComponent(templateId)}${copies > 1 ? `&copies=${copies}` : ""}&tab=${tab}`;

export function useDesk(): Desk {
  const { user, store } = useHq();
  const today = useTodayIso() ?? "";
  const { settings, loading: settingsLoading } = useSettings();
  const docs = useCollection<SignDoc>(SIGN_DOCS);
  const team = useCollection<Rec>("team");
  const clients = useCollection<Rec>("clients");
  const vendors = useCollection<Rec>("vendors");
  const projects = useCollection<Rec>("projects");
  const proposals = useCollection<Rec>("proposals");
  const { inks, ready: inksReady, reload: reloadInks } = useInks();

  const company = useMemo(() => companyOf(settings), [settings]);
  const mayEdit = canEdit(user, getCollection(SIGN_DOCS)?.write) && store.writable;

  const { records: all, save: saveOne, saveMany, remove, refresh } = docs;
  const { records: members, save: saveMember } = team;

  /** A fully signed agreement also ticks "Agreement / NDA signed" in Team & Payroll, so the two never disagree. */
  const syncTeam = useCallback(
    async (doc: SignDoc) => {
      const template = templateById(doc.template);
      if (!template?.marksAgreement || doc.partyKind !== "team" || !doc.partyId) return;
      if (progressOf(doc, template).standing !== "signed") return;
      const member = members.find((m) => m.id === doc.partyId);
      if (!member || member.agreementSigned === true) return;
      const checklist = member.onboarding && typeof member.onboarding === "object" ? (member.onboarding as Record<string, unknown>) : {};
      await saveMember({ ...member, agreementSigned: true, onboarding: { ...checklist, agreement: true } }).catch(() => undefined);
    },
    [members, saveMember],
  );

  const make = useCallback(
    async (items: NewDoc[]) => {
      const taken: Pick<SignDoc, "ref">[] = all.map((d) => ({ ref: d.ref }));
      const signatories = signatoriesFor("", settings);
      const records = items.map((it) => {
        const ref = nextRef(it.template.series, settings.financialYear, taken);
        taken.push({ ref });
        return {
          ref,
          template: it.template.id,
          templateVersion: it.template.version,
          title: `${it.template.name} · ${it.party.name || "No name yet"}`,
          partyKind: it.party.kind,
          partyId: it.party.id ?? "",
          partyName: it.party.name,
          date: today,
          status: "draft",
          partySigned: false,
          studioSigned: false,
          party: it.party,
          values: prefill(it.template, { ...(it.sources ?? {}), company, signatory: signatories[0] }),
          signatories,
          projectId: it.projectId ?? "",
          proposalId: it.proposalId ?? "",
        };
      });
      return (await saveMany(records)) as SignDoc[];
    },
    [all, settings, company, today, saveMany],
  );

  /**
   * An address typed on one of a person's papers is typed for all of them: it goes to their Team record (when that
   * has none) and to their other drafts that still have an empty address.
   */
  const shareAddress = useCallback(
    async (doc: SignDoc) => {
      const address = str(doc.party?.address);
      if (doc.partyKind !== "team" || !doc.partyId || !address) return;
      const member = members.find((m) => m.id === doc.partyId);
      if (member && !str(member.address)) await saveMember({ ...member, address }).catch(() => undefined);
      const others = all.filter((d) => d.id !== doc.id && d.partyKind === "team" && d.partyId === doc.partyId && d.status === "draft" && !str(d.party?.address));
      if (others.length) await saveMany(others.map((d) => ({ ...d, party: { ...d.party, address } }))).catch(() => undefined);
    },
    [all, members, saveMember, saveMany],
  );

  const save = useCallback(
    async (doc: SignDoc) => {
      const saved = (await saveOne(doc)) as SignDoc;
      await syncTeam(saved);
      await shareAddress(saved);
      return saved;
    },
    [saveOne, syncTeam, shareAddress],
  );

  const issue = useCallback(
    async (list: SignDoc[]) => {
      const drafts = list.filter((d) => d.status !== "issued" && d.status !== "void");
      if (!drafts.length) return list;
      // printed with the saved signatures, the studio's side counts as signed today
      const saved = (await saveMany(drafts.map((d) => withInkTick({ ...d, status: "issued", issuedOn: d.issuedOn || today, company }, templateById(d.template) ?? { kind: "agreement", signs: "both" }, inks, today)))) as SignDoc[];
      return list.map((d) => saved.find((s) => s.id === d.id) ?? d);
    },
    [saveMany, today, company, inks],
  );

  const loading = docs.loading || team.loading || clients.loading || vendors.loading || projects.loading || proposals.loading || settingsLoading || !inksReady;
  return {
    ready: !loading,
    error: docs.error,
    canEdit: mayEdit,
    today,
    settings,
    company,
    docs: all,
    team: members,
    clients: clients.records,
    vendors: vendors.records,
    projects: projects.records,
    proposals: proposals.records,
    make,
    save,
    issue,
    remove,
    refresh,
    inks,
    reloadInks,
  };
}
