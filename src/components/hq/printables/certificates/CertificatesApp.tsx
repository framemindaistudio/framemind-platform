"use client";

import { useMemo, useState } from "react";
import { Award, Ban, Download, ExternalLink, Eye, Loader2, Printer, RotateCcw, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { ConfirmButton } from "@/components/ui/Overlay";
import { Tabs } from "@/components/ui/Tabs";
import { CollectionManager, downloadText } from "@/components/hq/CollectionManager";
import { certificateCodes, useCollection, useHq, useLookup } from "@/components/hq/data";
import { EmptyState, PageHeader, Panel } from "@/components/hq/ui";
import { can, OPS_STUDIO } from "@/lib/hq/roles";
import { uid } from "@/lib/utils";
import { parseNameLines, qs, shortDate } from "../util";
import { useToday } from "../hooks";
import { CERT_TYPES, certMeta, type CertRecord } from "./types";

type Tab = "issue" | "registry";
const MAX_BATCH = 400;

/* ───────────────────────────── Issue flow ───────────────────────────── */

function IssueFlow() {
  const { saveMany } = useCollection<CertRecord & Record<string, unknown>>("certificates");

  const [type, setType] = useState(CERT_TYPES[0].value);
  const [programInput, setProgramInput] = useState<string | null>(null);
  const today = useToday();
  const [dateInput, setDateInput] = useState<string | null>(null);
  const [defaultDetail, setDefaultDetail] = useState("");
  const [names, setNames] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [issued, setIssued] = useState<{ batch: string; count: number; rows: { code: string; name: string; detail: string }[] } | null>(null);

  const meta = certMeta(type);
  const program = programInput ?? meta.program;
  const programTouched = programInput !== null;
  const issueDate = dateInput ?? today;

  const rows = useMemo(() => parseNameLines(names, defaultDetail.trim()).map((r) => ({ name: r.name, detail: r.grade })), [names, defaultDetail]);
  const duplicates = useMemo(() => {
    const seen = new Set<string>();
    let d = 0;
    for (const r of rows) {
      const k = r.name.toLowerCase();
      if (seen.has(k)) d += 1;
      seen.add(k);
    }
    return d;
  }, [rows]);

  const problems = [
    !rows.length && "Add at least one name.",
    rows.length > MAX_BATCH && `Issue at most ${MAX_BATCH} certificates at a time (you have ${rows.length}).`,
    !program.trim() && "Add the programme text.",
    !issueDate && "Pick an issue date.",
  ].filter(Boolean) as string[];

  const previewHref = `/hq/print/certificates${qs({ sample: 1, type, program: program.trim(), date: issueDate, detail: rows[0]?.detail ?? "" })}`;

  async function generate() {
    if (problems.length || busy) return;
    setBusy(true);
    setError("");
    try {
      const codes = await certificateCodes(rows.length);
      const batch = uid("batch");
      await saveMany(rows.map((r, i) => ({ code: codes[i], studentName: r.name, detail: r.detail, program: program.trim(), type, issueDate, status: "valid", batch })));
      setIssued({ batch, count: rows.length, rows: rows.map((r, i) => ({ code: codes[i], name: r.name, detail: r.detail })) });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save the certificates. Nothing was printed. Try again.");
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setIssued(null);
    setNames("");
    setError("");
  }

  if (issued) {
    return (
      <Panel title="Certificates issued" subtitle={`${issued.count} saved to the registry. Each one is verifiable from its QR code.`}>
        <div className="flex flex-col items-start gap-5">
          <div className="flex items-center gap-3 rounded-[var(--radius-md)] border border-ok/30 bg-ok/10 px-4 py-3 text-sm text-ok">
            <ShieldCheck className="size-5 shrink-0" aria-hidden />
            <span>
              <strong>{issued.count}</strong> certificate{issued.count === 1 ? "" : "s"} are live in the registry.
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button href={`/hq/print/certificates${qs({ batch: issued.batch })}`} external>
              <Printer className="size-4" /> Print {issued.count} certificate{issued.count === 1 ? "" : "s"}
            </Button>
            <Button
              variant="secondary"
              onClick={() => downloadText(`framemind-certificates-${issueDate}.csv`, ["Certificate ID,Name,Line under the name", ...issued.rows.map((r) => [r.code, r.name, r.detail].map((v) => `"${v.replace(/"/g, '""')}"`).join(","))].join("\n"))}
            >
              <Download className="size-4" /> Download ID list (CSV)
            </Button>
            <Button variant="ghost" onClick={reset}>
              Issue another batch
            </Button>
          </div>
          <p className="max-w-xl text-xs text-blueprint">Printing opens in a new tab: A4 landscape, one certificate per page. Use your browser&apos;s “Save as PDF” to send a digital copy.</p>
        </div>
      </Panel>
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
      <Panel title="1. Certificate details" subtitle="Everything here is printed on the certificate, so check spelling.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Certificate type" htmlFor="c-type">
            <Select
              id="c-type"
              value={type}
              onChange={(e) => {
                setType(e.target.value);
                setProgramInput(null);
              }}
            >
              {CERT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.value}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Issue date" htmlFor="c-date" required>
            <Input id="c-date" type="date" value={issueDate} onChange={(e) => setDateInput(e.target.value)} />
          </Field>
          <Field label="Programme text" htmlFor="c-program" className="sm:col-span-2" help={`Printed after “${meta.citation}”.`}>
            <Input id="c-program" value={program} maxLength={120} onChange={(e) => setProgramInput(e.target.value)} />
            {programTouched && meta.program && (
              <button type="button" onClick={() => setProgramInput(null)} className="mt-1 text-xs font-medium text-charcoal underline underline-offset-2 hover:text-graphite">
                Use the suggested wording again
              </button>
            )}
          </Field>
          <p className="text-xs text-blueprint sm:col-span-2">A coaching learner&apos;s certificate is issued from their record in AI Coaching at day 90. Use this form for interns, workshops and anything else.</p>
        </div>
      </Panel>

      <Panel title="2. Who gets one?" subtitle="One person per line. Optionally add the line under the name after a comma: “Asha Patil, UI/UX Intern, June–August 2026”.">
        <div className="grid gap-4">
          <Field label="Names" htmlFor="c-names" help="Paste straight from a sheet: a tab also separates the name from the line under it.">
            <Textarea id="c-names" rows={9} value={names} onChange={(e) => setNames(e.target.value)} placeholder={"Full Name, Role and dates\nFull Name"} className="font-mono text-[13px]" spellCheck={false} />
          </Field>
          <Field label="Line under the name, for lines without one (optional)" htmlFor="c-detail">
            <Input id="c-detail" value={defaultDetail} onChange={(e) => setDefaultDetail(e.target.value)} placeholder="e.g. Workshop at Gadag, 12 Nov 2026" />
          </Field>

          <div className="rounded-[var(--radius-md)] border border-graphite/12 bg-paper-200/40 p-4" aria-live="polite">
            <p className="flex flex-wrap items-baseline gap-x-2 text-sm">
              <span className="font-mono text-2xl font-bold tabular">{rows.length}</span>
              <span className="text-charcoal">certificate{rows.length === 1 ? "" : "s"} will be created</span>
              {duplicates > 0 && <Badge tone="warn">{duplicates} possible duplicate{duplicates === 1 ? "" : "s"}</Badge>}
            </p>
            {rows.length > 0 && (
              <ul className="mt-3 space-y-1 text-xs text-charcoal">
                {rows.slice(0, 5).map((r, i) => (
                  <li key={i} className="flex justify-between gap-3 border-b border-dashed border-graphite/15 pb-1">
                    <span className="truncate font-medium text-graphite">{r.name}</span>
                    <span className="truncate text-blueprint">{r.detail}</span>
                  </li>
                ))}
                {rows.length > 5 && <li className="text-blueprint">+ {rows.length - 5} more</li>}
              </ul>
            )}
          </div>

          {problems.length > 0 && rows.length > 0 && (
            <ul className="list-disc space-y-0.5 pl-5 text-xs text-bad">
              {problems.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          )}
          {error && (
            <p role="alert" className="rounded border border-bad/30 bg-bad/10 px-3 py-2 text-sm text-bad">
              {error}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={generate} disabled={busy || problems.length > 0}>
              {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Award className="size-4" aria-hidden />}
              {busy ? "Saving…" : `Generate & save${rows.length ? ` ${rows.length}` : ""}`}
            </Button>
            <Button href={previewHref} external variant="secondary">
              <Eye className="size-4" /> Preview design
            </Button>
          </div>
          <p className="text-xs text-blueprint">Saving gives every person a unique ID and QR code and records them in the registry. You can print right after.</p>
        </div>
      </Panel>
    </div>
  );
}

/* ───────────────────────────── Registry ───────────────────────────── */

function RowActions({ r, canWrite }: { r: CertRecord & Record<string, unknown>; canWrite: boolean }) {
  const { save } = useCollection("certificates");
  const [busy, setBusy] = useState(false);
  const revoked = r.status === "revoked";
  async function setStatus(status: string) {
    setBusy(true);
    try {
      await save({ ...r, status });
    } finally {
      setBusy(false);
    }
  }
  return (
    <span className="inline-flex items-center justify-end gap-1">
      {!revoked && (
        <Button href={`/hq/print/certificates${qs({ ids: r.id })}`} external variant="ghost" size="sm" aria-label={`Print certificate for ${r.studentName}`}>
          <Printer className="size-3.5" /> Print
        </Button>
      )}
      <Button href={`/verify/${encodeURIComponent(r.code)}`} external variant="ghost" size="sm" aria-label={`Open public verification page for ${r.code}`}>
        <ExternalLink className="size-3.5" /> Verify
      </Button>
      {canWrite &&
        (revoked ? (
          <Button variant="ghost" size="sm" disabled={busy} onClick={() => setStatus("valid")}>
            <RotateCcw className="size-3.5" /> Restore
          </Button>
        ) : (
          <ConfirmButton onConfirm={() => setStatus("revoked")} message="Revoke? The public page will show it as not valid.">
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-bad">
              <Ban className="size-3.5" /> Revoke
            </span>
          </ConfirmButton>
        ))}
    </span>
  );
}

function Registry() {
  const { user, store } = useHq();
  const canWrite = can(user, OPS_STUDIO) && store.writable;
  const { records } = useCollection<CertRecord & Record<string, unknown>>("certificates");
  const learners = useLookup("learners");

  const reprint = useMemo(() => {
    const out: { key: string; label: string; href: string }[] = [];
    const batches = new Map<string, CertRecord[]>();
    const loose = new Map<string, CertRecord[]>();
    for (const r of records) {
      if (r.status === "revoked") continue;
      if (r.batch) batches.set(r.batch, [...(batches.get(r.batch) ?? []), r]);
      else if (r.learnerId) loose.set(r.learnerId, [...(loose.get(r.learnerId) ?? []), r]);
    }
    for (const [batch, list] of batches) {
      const f = list[0];
      out.push({ key: `b-${batch}`, label: `${f.program || "Custom batch"} · ${f.type ?? "Certificate"} · ${shortDate(f.issueDate) || "undated"} (${list.length})`, href: `/hq/print/certificates${qs({ batch })}` });
    }
    for (const [learner, list] of loose) out.push({ key: `l-${learner}`, label: `${String(learners.get(learner)?.name ?? "Learner")} (${list.length})`, href: `/hq/print/certificates${qs({ learner })}` });
    return out.reverse();
  }, [records, learners]);

  return (
    <CollectionManager<CertRecord & Record<string, unknown>>
      name="certificates"
      columns={["code", "studentName", "type", "program", "issueDate", "status"]}
      hideNew
      emptyText="No certificates yet. Issue the first batch from the “Issue certificates” tab."
      rowActions={(r) => <RowActions r={r} canWrite={canWrite} />}
      toolbar={
        reprint.length > 0 ? (
          <div className="w-full sm:w-72">
            <Select
              aria-label="Reprint a batch"
              value=""
              className="h-10"
              onChange={(e) => {
                const hit = reprint.find((x) => x.key === e.target.value);
                if (hit) window.open(hit.href, "_blank", "noopener,noreferrer");
              }}
            >
              <option value="">Reprint a batch…</option>
              {reprint.map((x) => (
                <option key={x.key} value={x.key}>
                  {x.label}
                </option>
              ))}
            </Select>
          </div>
        ) : undefined
      }
    />
  );
}

/* ───────────────────────────── Shell ───────────────────────────── */

export function CertificatesApp({ initialTab }: { initialTab?: string }) {
  const { user, store } = useHq();
  const canIssue = can(user, OPS_STUDIO) && store.writable;
  const [tab, setTab] = useState<Tab>(initialTab === "registry" || !canIssue ? "registry" : "issue");
  const { records } = useCollection("certificates");
  const [showTip, setShowTip] = useState(true);

  return (
    <div>
      <PageHeader
        icon="Award"
        eyebrow="Recognition"
        title="Certificates"
        description="Issue certificates in bulk, print them one per A4 landscape page, and let anyone verify them from the QR code."
        actions={
          <Button href="/verify" external variant="secondary" size="sm">
            <ShieldCheck className="size-4" /> Public verify page
          </Button>
        }
      />

      <Tabs
        className="mb-6"
        value={tab}
        onChange={setTab}
        tabs={[
          ...(canIssue ? [{ value: "issue" as const, label: "Issue certificates" }] : []),
          { value: "registry" as const, label: "Registry", count: records.length },
        ]}
      />

      {tab === "issue" && canIssue ? (
        <>
          {showTip && (
            <div className="mb-5 flex items-start justify-between gap-4 rounded-[var(--radius-md)] border border-graphite/12 bg-paper-200/40 px-4 py-3 text-sm text-charcoal">
              <p>
                Tip: QR codes point to <span className="font-mono text-xs">/verify/&lt;ID&gt;</span> on HQ&apos;s live address, so set the site URL (Settings → System status) before printing the real batch.
              </p>
              <button type="button" onClick={() => setShowTip(false)} className="shrink-0 text-xs font-semibold text-charcoal underline underline-offset-2 hover:text-graphite">
                Dismiss
              </button>
            </div>
          )}
          <IssueFlow />
        </>
      ) : records.length === 0 ? (
        <EmptyState icon="Award" title="No certificates issued yet" description={canIssue ? "Issue your first batch and it will appear here, searchable by ID or name." : "Certificates appear here once issued, searchable by ID or name."} action={canIssue ? <Button size="sm" onClick={() => setTab("issue")}>Issue certificates</Button> : undefined} />
      ) : (
        <Registry />
      )}
    </div>
  );
}
