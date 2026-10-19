"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Award, ExternalLink, Printer, Search } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/form";
import { Modal } from "@/components/ui/Overlay";
import { Tabs } from "@/components/ui/Tabs";
import { CornerMarks } from "@/components/brand/Blueprint";
import { useCollection, useHq, useRates } from "@/components/hq/data";
import { PageHeader } from "@/components/hq/ui";
import { csv, qs } from "./util";
import { PrintPreview } from "./PrintPreviews";

/* ───────────────────────────── generator registry ───────────────────────────── */

type F =
  | { k: string; label: string; t: "text" | "date" | "number"; help?: string; ph?: string; min?: number; max?: number; half?: boolean }
  | { k: string; label: string; t: "textarea"; help?: string; ph?: string }
  | { k: string; label: string; t: "select"; options: [string, string][]; help?: string; half?: boolean }
  | { k: string; label: string; t: "checkbox"; help?: string }
  | { k: string; label: string; t: "team"; help?: string }
  | { k: string; label: string; t: "services"; help?: string };

type Values = Record<string, string>;
type Group = "sales" | "badges" | "stationery";

interface Gen {
  id: string;
  group: Group;
  title: string;
  blurb: string;
  route: string;
  /** short layout note shown on the card */
  sheet: string;
  fields: F[];
  defaults?: Values;
  summary?: (v: Values) => string;
}

const pages = (label: string, max = 40, help?: string): F => ({ k: "pages", label, t: "number", min: 1, max, help, half: true });

const GENERATORS: Gen[] = [
  {
    id: "rate-card",
    group: "sales",
    title: "Rate card",
    blurb: "Every service with its options and prices, the Studio Bundle, and the payment and revision terms. Read from the live Rate Card, so it always matches the quote builder.",
    route: "/hq/print/brochures/rate-card",
    sheet: "A4 · as many pages as needed",
    fields: [
      { k: "for", label: "Prepared for (optional)", t: "text", ph: "e.g. the client's business", help: "Printed under the title. Leave empty for a general copy." },
      { k: "services", label: "Services to include", t: "services", help: "Leave all unticked to include every service." },
      { k: "coaching", label: "Add 1:1 AI coaching", t: "checkbox", help: "Only printed once the coaching fee is set in the Rate Card." },
      { k: "vritta", label: "Add Vritta licence fees", t: "checkbox" },
    ],
  },
  {
    id: "id-cards",
    group: "badges",
    title: "Team ID cards",
    blurb: "CR80 cards (85.6 × 54 mm), front and back, from your team records, with emergency and return details for shoots and client sites.",
    route: "/hq/print/badges/id-cards",
    sheet: "5 people per A4 · front + back",
    fields: [
      { k: "ids", label: "Team members", t: "team", help: "Leave everyone unticked to print all active team members." },
      { k: "valid", label: "Valid until (optional)", t: "text", ph: "e.g. 31 Mar 2027" },
    ],
  },
  {
    id: "visiting-cards",
    group: "stationery",
    title: "Visiting cards",
    blurb: "90 × 54 mm cards with name, title, phone, email and website taken from your team records and company settings.",
    route: "/hq/print/stationery/visiting-cards",
    sheet: "10 per A4 · per person",
    fields: [
      { k: "ids", label: "People", t: "team", help: "Leave everyone unticked to print all active team members." },
      { k: "back", label: "Sheets", t: "select", options: [["1", "Front and back sheets"], ["0", "Front only"]] },
    ],
    defaults: { back: "1" },
  },
  {
    id: "letterhead",
    group: "stationery",
    title: "Letterhead",
    blurb: "Blank A4 with the FrameMind header, address strip and footer, using the details in Settings. Optional faint ruling for hand-written notes.",
    route: "/hq/print/stationery/letterhead",
    sheet: "1 per A4",
    fields: [pages("Sheets", 50), { k: "ruled", label: "Add faint writing lines", t: "checkbox" }],
    defaults: { pages: "1" },
  },
];

const GROUPS: { value: Group; label: string; blurb: string }[] = [
  { value: "sales", label: "Sales sheets", blurb: "What to hand over or send in a client meeting." },
  { value: "badges", label: "Badges & IDs", blurb: "Team identity cards." },
  { value: "stationery", label: "Stationery", blurb: "Letterhead and visiting cards." },
];

/* ───────────────────────────── modal form ───────────────────────────── */

function TeamPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { records, loading, error } = useCollection("team");
  const people = records.filter((r) => r.status !== "inactive");
  const picked = new Set(csv(value));
  const toggle = (id: string) => {
    const next = new Set(picked);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange([...next].join(","));
  };
  if (loading) return <p className="text-sm text-blueprint">Loading team…</p>;
  if (error) return <p className="text-sm text-bad">Could not load the team list: {error}</p>;
  if (!people.length) return <p className="text-sm text-blueprint">No team members yet. Add people in HQ → Team &amp; Payroll.</p>;
  return (
    <div>
      <div className="mb-2 flex gap-3 text-xs font-medium">
        <button type="button" className="underline underline-offset-2 hover:text-graphite" onClick={() => onChange(people.map((p) => p.id).join(","))}>
          Select everyone
        </button>
        <button type="button" className="underline underline-offset-2 hover:text-graphite" onClick={() => onChange("")}>
          Clear
        </button>
        <span className="ml-auto text-blueprint">{picked.size ? `${picked.size} selected` : `Everyone (${people.length})`}</span>
      </div>
      <ul className="hq-scroll max-h-48 space-y-1 overflow-y-auto rounded-[var(--radius-sm)] border border-graphite/15 bg-paper-50 p-2" data-lenis-prevent>
        {people.map((p) => (
          <li key={p.id}>
            <Checkbox label={<span>{String(p.name)} <span className="text-xs text-blueprint">· {String(p.role ?? "")}</span></span>} checked={picked.has(p.id)} onChange={() => toggle(p.id)} className="w-full rounded px-1.5 py-1 hover:bg-graphite/[0.04]" />
          </li>
        ))}
      </ul>
    </div>
  );
}

function GeneratorForm({ gen, values, set }: { gen: Gen; values: Values; set: (k: string, v: string) => void }) {
  const rates = useRates();
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {gen.fields.map((f) => {
        const id = `pf-${f.k}`;
        const full = !("half" in f && f.half);
        const cls = full ? "sm:col-span-2" : "";
        if (f.t === "textarea")
          return (
            <Field key={f.k} label={f.label} htmlFor={id} help={f.help} className={cls}>
              <Textarea id={id} rows={6} value={values[f.k] ?? ""} onChange={(e) => set(f.k, e.target.value)} placeholder={f.ph} spellCheck={false} className="font-mono text-[13px]" />
            </Field>
          );
        if (f.t === "select")
          return (
            <Field key={f.k} label={f.label} htmlFor={id} help={f.help} className={cls}>
              <Select id={id} value={values[f.k] ?? f.options[0][0]} onChange={(e) => set(f.k, e.target.value)}>
                {f.options.map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </Select>
            </Field>
          );
        if (f.t === "checkbox")
          return (
            <div key={f.k} className="sm:col-span-2">
              <Checkbox label={f.label} checked={values[f.k] === "1"} onChange={(e) => set(f.k, e.target.checked ? "1" : "")} />
              {f.help && <p className="mt-1 text-xs text-blueprint">{f.help}</p>}
            </div>
          );
        if (f.t === "team")
          return (
            <Field key={f.k} label={f.label} help={f.help} className="sm:col-span-2">
              <TeamPicker value={values[f.k] ?? ""} onChange={(v) => set(f.k, v)} />
            </Field>
          );
        if (f.t === "services") {
          const picked = new Set(csv(values[f.k]));
          const services = rates?.services ?? [];
          return (
            <Field key={f.k} label={f.label} help={f.help} className="sm:col-span-2">
              <div className="grid gap-1.5 sm:grid-cols-2">
                {services.map((sv) => (
                  <Checkbox
                    key={sv.id}
                    label={sv.name}
                    checked={picked.has(sv.id)}
                    onChange={() => {
                      const next = new Set(picked);
                      if (next.has(sv.id)) next.delete(sv.id);
                      else next.add(sv.id);
                      set(f.k, services.filter((x) => next.has(x.id)).map((x) => x.id).join(","));
                    }}
                  />
                ))}
              </div>
            </Field>
          );
        }
        return (
          <Field key={f.k} label={f.label} htmlFor={id} help={f.help} className={cls}>
            <Input
              id={id}
              type={f.t}
              value={values[f.k] ?? ""}
              onChange={(e) => set(f.k, e.target.value)}
              placeholder={f.ph}
              min={f.t === "number" ? f.min : undefined}
              max={f.t === "number" ? f.max : undefined}
              inputMode={f.t === "number" ? "numeric" : undefined}
            />
          </Field>
        );
      })}
    </div>
  );
}

/* ───────────────────────────── studio ───────────────────────────── */

export function PrintStudio() {
  const { store } = useHq();
  const [group, setGroup] = useState<"all" | Group>("all");
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [all, setAll] = useState<Record<string, Values>>({});

  const gen = GENERATORS.find((g) => g.id === openId) ?? null;
  const values: Values = gen ? { ...gen.defaults, ...(all[gen.id] ?? {}) } : {};
  const clean = gen ? Object.fromEntries(Object.entries(values).filter(([k]) => gen.fields.some((f) => f.k === k))) : {};
  const href = gen ? gen.route + qs(clean) : "#";

  const needle = search.trim().toLowerCase();
  const visible = GENERATORS.filter((g) => (group === "all" || g.group === group) && (!needle || `${g.title} ${g.blurb}`.toLowerCase().includes(needle)));
  const showCert = group === "all" && (!needle || "certificates certificate qr verify".includes(needle));

  function card(g: Gen) {
    return (
      <li key={g.id}>
        <article className="group relative flex h-full flex-col overflow-hidden rounded-[var(--radius-md)] border border-graphite/12 bg-paper-50 shadow-[var(--shadow-paper)] transition-shadow hover:shadow-[var(--shadow-lift)]">
          <div className="relative aspect-[160/112] border-b border-graphite/10 bg-paper-200/40">
            <div className="bp-grid-fine pointer-events-none absolute inset-0 opacity-40" aria-hidden />
            <div className="relative h-full p-3">
              <PrintPreview id={g.id} />
            </div>
          </div>
          <div className="flex flex-1 flex-col gap-3 p-4">
            <div>
              <h3 className="text-[15px] font-bold leading-tight tracking-[-0.01em] text-graphite">{g.title}</h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-charcoal">{g.blurb}</p>
            </div>
            <div className="mt-auto flex items-center justify-between gap-3 pt-1">
              <Badge tone="outline">{g.sheet}</Badge>
              <Button size="sm" onClick={() => setOpenId(g.id)} aria-label={`Customise and print: ${g.title}`}>
                <Printer className="size-3.5" /> Customise
              </Button>
            </div>
          </div>
        </article>
      </li>
    );
  }

  return (
    <div>
      <PageHeader
        icon="Printer"
        eyebrow="Print Studio"
        title="Printables"
        description="Everything the studio prints, in one place: the rate card for client meetings, team IDs, visiting cards, letterhead and certificates. Pick a template, fill in a few details, and print or save as PDF. All sheets are laid out in millimetres, so they come out as they preview."
        actions={
          <Button href="/hq/settings" variant="secondary" size="sm">
            Company details &amp; letterhead data
          </Button>
        }
      />

      <div className="mb-6 flex flex-col gap-3 2xl:flex-row 2xl:items-center 2xl:justify-between">
        <Tabs
          className="2xl:border-0"
          value={group}
          onChange={setGroup}
          tabs={[{ value: "all", label: "All printables", count: GENERATORS.length + 1 }, ...GROUPS.map((g) => ({ value: g.value, label: g.label, count: GENERATORS.filter((x) => x.group === g.value).length }))]}
        />
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-blueprint" aria-hidden />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search printables"
            placeholder="Search printables…"
            className="h-10 w-full rounded-[var(--radius-sm)] border border-graphite/15 bg-paper-50 pl-9 pr-3 text-sm outline-none focus:border-graphite"
          />
        </div>
      </div>

      <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {showCert && (
          <li className="sm:col-span-2 xl:col-span-3">
            <article className="relative grid gap-0 overflow-hidden rounded-[var(--radius-md)] border border-graphite bg-graphite text-paper shadow-[var(--shadow-lift)] md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
              <div className="bp-grid-dark pointer-events-none absolute inset-0 opacity-70" aria-hidden />
              <CornerMarks className="text-paper/40" />
              <div className="relative flex flex-col justify-center gap-4 p-6 sm:p-8">
                <span className="annot flex items-center gap-2 text-paper/60">
                  <Award className="size-4" aria-hidden /> Certificates · A4 landscape
                </span>
                <h2 className="text-2xl font-bold leading-tight tracking-[-0.03em]">Bulk certificates with QR verification</h2>
                <p className="max-w-md text-sm leading-relaxed text-paper/75">Paste names, generate unique IDs and print one premium certificate per page. Every QR code opens a public page that confirms the certificate is genuine, or shows it as revoked.</p>
                <div className="flex flex-wrap gap-2">
                  <Button href="/hq/certificates" variant="light">
                    <Award className="size-4" /> {store.writable ? "Issue certificates" : "Open certificates"}
                  </Button>
                  <Button href="/hq/print/certificates?sample=1" external variant="outline-light">
                    <ExternalLink className="size-4" /> Preview design
                  </Button>
                </div>
              </div>
              <div className="relative hidden min-h-48 items-center justify-center bg-paper/[0.04] p-6 md:flex">
                <div className="aspect-[160/112] w-full max-w-md text-paper">
                  <PrintPreview id="certificate" />
                </div>
              </div>
            </article>
          </li>
        )}
        {visible.map(card)}
      </ul>

      {!visible.length && !showCert && (
        <p className="mt-10 text-center text-sm text-blueprint">
          Nothing matches “{search}”. <button className="underline underline-offset-2" onClick={() => { setSearch(""); setGroup("all"); }}>Clear search</button>
        </p>
      )}

      <p className="mt-8 text-xs text-blueprint">
        Tip: in the print dialog set <strong>Margins: None</strong> and tick <strong>Background graphics</strong>. Brochures are A3: choose <strong>Save as PDF</strong> and take the file to a print shop, or pick an A3 printer and print on both sides (flip on short edge). Looking for invoices, proposals or packing slips? Those open from their own modules.{" "}
        <Link href="/hq/docs" className="underline underline-offset-2">
          Document templates live in the Operations Library
        </Link>
        .
      </p>

      <Modal
        open={!!gen}
        onClose={() => setOpenId(null)}
        title={gen?.title ?? ""}
        size="max-w-2xl"
        footer={
          gen && (
            <div className="flex w-full flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-blueprint" aria-live="polite">
                {gen.summary ? gen.summary(values) : gen.sheet}
              </p>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setOpenId(null)}>
                  Close
                </Button>
                <Button href={href} external>
                  <Printer className="size-4" /> Open print page
                </Button>
              </div>
            </div>
          )
        }
      >
        {gen && (
          <div className="grid gap-5">
            <p className="text-sm text-charcoal">{gen.blurb}</p>
            <GeneratorForm
              gen={gen}
              values={values}
              set={(k, v) => setAll((a) => ({ ...a, [gen.id]: { ...(a[gen.id] ?? {}), [k]: v } }))}
            />
          </div>
        )}
      </Modal>
    </div>
  );
}
