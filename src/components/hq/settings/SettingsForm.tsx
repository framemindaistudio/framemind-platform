"use client";

import { useMemo, useState } from "react";
import { Loader2, RotateCcw, Save, Undo2 } from "lucide-react";
import { useBook, useHq, useSettings } from "@/components/hq/data";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/form";
import type { CompanySettings } from "@/lib/hq/settings";
import { cn, formatDateTime, formatINR } from "@/lib/utils";
import { SettingsSection, Subhead } from "./shared";
import { DigestPanel } from "./DigestPanel";

type Errors = Partial<Record<keyof CompanySettings, string>>;

const GSTIN = /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
const PAN = /^[A-Z]{5}\d{4}[A-Z]$/;
const IFSC = /^[A-Z]{4}0[A-Z0-9]{6}$/;

function validate(s: CompanySettings): Errors {
  const e: Errors = {};
  const need = (k: keyof CompanySettings, label: string) => {
    if (!String(s[k] ?? "").trim()) e[k] = `${label} is required`;
  };
  need("legalName", "Legal name");
  need("brandName", "Brand name");
  need("invoicePrefix", "Invoice prefix");
  need("proposalPrefix", "Proposal prefix");
  need("poPrefix", "Purchase order prefix");
  need("orderPrefix", "Vritta licence prefix");
  need("certificatePrefix", "Certificate prefix");

  if (s.pincode && !/^\d{6}$/.test(s.pincode)) e.pincode = "6 digits";
  if (s.stateCode && !/^\d{2}$/.test(s.stateCode)) e.stateCode = "2 digits, e.g. 29";
  if (s.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.email)) e.email = "Enter a valid email address";
  if (s.phone && s.phone.replace(/\D/g, "").length < 10) e.phone = "Enter at least 10 digits";
  if (s.website && !/^https?:\/\/\S+\.\S+/.test(s.website)) e.website = "Start with https://";
  if (s.gstin && !GSTIN.test(s.gstin)) e.gstin = "15 characters, e.g. 29ABCDE1234F1Z5";
  if (s.pan && !PAN.test(s.pan)) e.pan = "10 characters, e.g. ABCDE1234F";
  if (s.sacCode && !/^\d{4,8}$/.test(s.sacCode)) e.sacCode = "4 to 8 digits";
  if (s.bankIfsc && !IFSC.test(s.bankIfsc)) e.bankIfsc = "11 characters, e.g. HDFC0001234";
  if (s.bankAccountNumber && !/^\d{9,18}$/.test(s.bankAccountNumber)) e.bankAccountNumber = "9 to 18 digits";
  if (s.upiId && !/^[\w.-]{2,}@[a-z][a-z0-9]+$/i.test(s.upiId)) e.upiId = "Looks like name@bank";
  if (s.financialYear && !/^\d{4}-\d{2}$/.test(s.financialYear)) e.financialYear = "Format 2026-27";

  for (const k of ["nextInvoiceNumber", "nextProposalNumber", "nextPoNumber", "nextOrderNumber"] as const) {
    if (!Number.isInteger(s[k]) || s[k] < 1) e[k] = "Whole number, 1 or more";
  }
  if (!Number.isFinite(s.monthlyRevenueTarget) || s.monthlyRevenueTarget < 0) e.monthlyRevenueTarget = "Enter an amount, 0 or more";
  if (!Number.isInteger(s.projectsPerMonthTarget) || s.projectsPerMonthTarget < 0) e.projectsPerMonthTarget = "Whole number, 0 or more";
  if (!Number.isFinite(s.fuelCostPerKm) || s.fuelCostPerKm < 0) e.fuelCostPerKm = "Enter an amount, 0 or more";
  const bad = String(s.digestEmails ?? "")
    .split(/[\s,;]+/)
    .filter(Boolean)
    .find((x) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(x));
  if (bad) e.digestEmails = `"${bad}" is not an email address`;
  return e;
}

/** Number input that keeps what the user is typing; reports NaN while blank so validation can block the save. */
function NumberInput({ id, value, onValue, step = 1, disabled, invalid, describedBy }: { id: string; value: number; onValue: (n: number) => void; step?: number; disabled?: boolean; invalid?: boolean; describedBy?: string }) {
  const [text, setText] = useState(Number.isFinite(value) ? String(value) : "");
  return (
    <Input
      id={id}
      type="number"
      inputMode="decimal"
      min={0}
      step={step}
      value={text}
      disabled={disabled}
      aria-invalid={invalid || undefined}
      aria-describedby={describedBy}
      onChange={(e) => {
        setText(e.target.value);
        onValue(e.target.value.trim() === "" ? NaN : Number(e.target.value));
      }}
    />
  );
}

const pad = (n: number, to: number) => String(Math.max(0, Math.floor(n) || 0)).padStart(to, "0");

/** Owns the company-settings state. Other sections are passed as children so the save bar stays pinned while scrolling through them. */
export function SettingsForm({ children }: { children?: React.ReactNode }) {
  const { settings, loading, save } = useSettings();
  const { store } = useHq();
  // the plan lives in Money → Business Planner; the shortcut below is offered only when it has been filled in
  const plan = useBook()?.planner.targets;
  const hasPlan = !!plan && plan.monthlyRevenue > 0 && plan.projectsPerMonth > 0;
  const [edits, setEdits] = useState<Partial<CompanySettings>>({});
  const [resetKey, setResetKey] = useState(0);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const value = useMemo<CompanySettings>(() => ({ ...settings, ...edits }), [settings, edits]);
  const errors = useMemo(() => validate(value), [value]);
  const errorCount = Object.keys(errors).length;
  const changed = Object.keys(edits).length;
  const locked = loading || !store.writable;

  function set<K extends keyof CompanySettings>(key: K, v: CompanySettings[K]) {
    setMessage(null);
    setEdits((prev) => {
      const next = { ...prev };
      if (Object.is(v, settings[key])) delete next[key];
      else next[key] = v;
      return next;
    });
  }

  function discard() {
    setEdits({});
    setResetKey((k) => k + 1);
    setMessage(null);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!changed) return;
    if (errorCount) {
      setMessage({ ok: false, text: `Fix ${errorCount} highlighted field${errorCount === 1 ? "" : "s"} before saving.` });
      document.querySelector<HTMLElement>('#settings-form [aria-invalid="true"]')?.focus();
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      await save(edits); // only the changed keys are sent, so nobody else's edits are overwritten
      setEdits({});
      setResetKey((k) => k + 1);
      setMessage({ ok: true, text: "Settings saved." });
    } catch (err) {
      setMessage({ ok: false, text: err instanceof Error ? err.message : "Could not save settings" });
    } finally {
      setSaving(false);
    }
  }

  /* ── field renderers (plain functions, not components, so inputs keep focus) ── */
  const text = (k: keyof CompanySettings, label: string, o: { help?: string; placeholder?: string; mono?: boolean; className?: string; transform?: (v: string) => string; inputMode?: "numeric" | "tel" | "email" | "url" | "text"; maxLength?: number; autoComplete?: string; required?: boolean } = {}) => {
    const id = `s-${k}`;
    return (
      <Field key={k} label={label} htmlFor={id} help={o.help} error={errors[k]} required={o.required} className={o.className}>
        <Input
          id={id}
          value={String(value[k] ?? "")}
          disabled={locked}
          placeholder={o.placeholder}
          inputMode={o.inputMode}
          maxLength={o.maxLength}
          autoComplete={o.autoComplete ?? "off"}
          spellCheck={false}
          aria-invalid={errors[k] ? true : undefined}
          className={o.mono ? "font-mono tracking-wide" : undefined}
          onChange={(e) => set(k, (o.transform ? o.transform(e.target.value) : e.target.value) as never)}
        />
      </Field>
    );
  };

  const num = (k: "nextInvoiceNumber" | "nextProposalNumber" | "nextPoNumber" | "nextOrderNumber" | "monthlyRevenueTarget" | "projectsPerMonthTarget" | "fuelCostPerKm", label: string, o: { help?: string; step?: number; className?: string } = {}) => {
    const id = `s-${k}`;
    const lower = k.startsWith("next") && Number.isFinite(value[k]) && value[k] < settings[k];
    return (
      <Field key={`${k}-${resetKey}-${loading ? "loading" : "ready"}`} label={label} htmlFor={id} help={o.help} error={errors[k] ?? (lower ? `Lower than the current counter (${settings[k]}). This could repeat a number already issued.` : undefined)} className={o.className}>
        <NumberInput id={id} value={value[k]} step={o.step} disabled={locked} invalid={!!errors[k]} onValue={(n) => set(k, n)} />
      </Field>
    );
  };

  const gstinNote =
    value.gstin && !errors.gstin && value.stateCode && value.gstin.slice(0, 2) !== value.stateCode
      ? `The GSTIN starts with state code ${value.gstin.slice(0, 2)} but the state code above is ${value.stateCode}.`
      : value.gstin && !errors.gstin && value.pan && !errors.pan && value.gstin.slice(2, 12) !== value.pan
        ? "The PAN inside this GSTIN does not match the PAN entered below."
        : undefined;

  return (
    <div className="space-y-10">
      <form id="settings-form" onSubmit={onSubmit} noValidate className="space-y-10">
        {!store.writable && <p className="rounded-[var(--radius-sm)] border border-warn/30 bg-warn/10 px-3 py-2 text-sm text-warn">HQ is in read-only mode, so settings can be read but not changed. See System status below.</p>}

        {/* 01 */}
        <SettingsSection id="company" index="01" title="Company profile" description="Printed in the letterhead of every invoice, proposal, purchase order and certificate.">
          <div className="grid gap-x-5 gap-y-5 sm:grid-cols-2">
            {text("legalName", "Legal name", { required: true, help: "As registered. Use the trade name until the entity is incorporated." })}
            {text("brandName", "Brand name", { required: true })}
            {text("addressLine1", "Address line 1", { className: "sm:col-span-2", autoComplete: "street-address" })}
            {text("addressLine2", "Address line 2", { className: "sm:col-span-2" })}
            <div className="grid gap-5 sm:col-span-2 sm:grid-cols-4">
              {text("city", "City")}
              {text("state", "State")}
              {text("stateCode", "State code", { help: "GST state code", mono: true, inputMode: "numeric", maxLength: 2, transform: (v) => v.replace(/\D/g, "") })}
              {text("pincode", "PIN code", { mono: true, inputMode: "numeric", maxLength: 6, transform: (v) => v.replace(/\D/g, "") })}
            </div>
            {text("phone", "Phone", { inputMode: "tel", autoComplete: "tel" })}
            {text("email", "Email", { inputMode: "email", autoComplete: "email" })}
            {text("website", "Website", { placeholder: "https://", inputMode: "url", className: "sm:col-span-2" })}
          </div>
          <div className="mt-6 border-t border-dashed border-graphite/15 pt-5">
            <Subhead>Signatory on documents</Subhead>
            <div className="grid gap-5 sm:grid-cols-2">
              {text("signatoryName", "Name")}
              {text("signatoryTitle", "Title")}
            </div>
          </div>
        </SettingsSection>

        {/* 02 */}
        <SettingsSection id="tax" index="02" title="Tax & bank details" description="Shown on invoices so clients know where to pay. Leave the GSTIN empty until you are registered; ask your CA whether and when registration is required.">
          <div className="grid gap-x-5 gap-y-5 sm:grid-cols-3">
            {text("gstin", "GSTIN", { mono: true, maxLength: 15, placeholder: "Not registered yet", transform: (v) => v.toUpperCase().replace(/\s/g, ""), help: gstinNote })}
            {text("pan", "PAN", { mono: true, maxLength: 10, transform: (v) => v.toUpperCase().replace(/\s/g, "") })}
            {text("sacCode", "SAC code", { mono: true, inputMode: "numeric", help: "Service accounting code printed on invoices. Confirm the right one with your CA." })}
            {text("udyamNumber", "Udyam registration", { mono: true, placeholder: "UDYAM-KR-00-0000000", transform: (v) => v.toUpperCase().replace(/\s/g, ""), help: "MSME registration, printed on the letterhead footer.", className: "sm:col-span-3" })}
          </div>
          <div className="mt-6 border-t border-dashed border-graphite/15 pt-5">
            <Subhead>Bank account for payments</Subhead>
            <div className="grid gap-x-5 gap-y-5 sm:grid-cols-2">
              {text("bankAccountName", "Account holder name")}
              {text("bankName", "Bank and branch")}
              {text("bankAccountNumber", "Account number", { mono: true, inputMode: "numeric", transform: (v) => v.replace(/\D/g, "") })}
              {text("bankIfsc", "IFSC", { mono: true, maxLength: 11, transform: (v) => v.toUpperCase().replace(/\s/g, "") })}
              {text("upiId", "UPI ID", { placeholder: "name@bank", className: "sm:col-span-2" })}
            </div>
          </div>
          <div className="mt-6 border-t border-dashed border-graphite/15 pt-5">
            <Field label="Invoice terms" htmlFor="s-invoiceTerms" help="Printed at the foot of every invoice.">
              <Textarea id="s-invoiceTerms" rows={4} value={value.invoiceTerms} disabled={locked} onChange={(e) => set("invoiceTerms", e.target.value)} />
            </Field>
          </div>
        </SettingsSection>

        {/* 03 */}
        <SettingsSection id="numbering" index="03" title="Document numbering" description="Prefixes and the next number for each document series. Numbers are handed out in order and never reused, so only ever raise a counter.">
          <div className="space-y-5">
            {(
              [
                ["invoicePrefix", "nextInvoiceNumber", "Invoices", 3],
                ["proposalPrefix", "nextProposalNumber", "Quotes", 3],
                ["poPrefix", "nextPoNumber", "Purchase orders", 3],
                ["orderPrefix", "nextOrderNumber", "Vritta licences", 3],
              ] as const
            ).map(([prefix, counter, label, width]) => (
              <div key={prefix} className="grid gap-x-5 gap-y-3 sm:grid-cols-[1fr_1fr_1fr] sm:items-start">
                {text(prefix, `${label} · prefix`, { mono: true })}
                {num(counter, `${label} · next number`)}
                <div className="sm:pt-7">
                  <p className="annot text-[10px] text-blueprint">Next {label.toLowerCase().replace(/s$/, "")}</p>
                  <p className="mt-1 break-all font-mono text-sm font-semibold text-graphite">
                    {value[prefix]}
                    {pad(value[counter], width)}
                  </p>
                </div>
              </div>
            ))}
            <div className="grid gap-x-5 gap-y-3 border-t border-dashed border-graphite/15 pt-5 sm:grid-cols-[1fr_1fr_1fr] sm:items-start">
              {text("certificatePrefix", "Certificates · prefix", { mono: true, help: "A random 5-character code is added to each certificate." })}
              {text("financialYear", "Financial year", { mono: true, placeholder: "2026-27" })}
              <div className="sm:pt-7">
                <p className="annot text-[10px] text-blueprint">Example certificate code</p>
                <p className="mt-1 break-all font-mono text-sm font-semibold text-graphite">{value.certificatePrefix}7K2MX</p>
              </div>
            </div>
          </div>
        </SettingsSection>

        {/* 04 */}
        <SettingsSection id="targets" index="04" title="Targets" description="Drive the progress bars on the Command Center. Set them from the Business Planner once the founders have agreed the numbers.">
          <div className="grid gap-x-5 gap-y-5 sm:grid-cols-2">
            {num("monthlyRevenueTarget", "Monthly revenue target (₹, ex-GST)", { step: 1000, help: Number.isFinite(value.monthlyRevenueTarget) ? `${formatINR(value.monthlyRevenueTarget)} a month` : undefined })}
            {num("projectsPerMonthTarget", "Client projects per month")}
          </div>
          {hasPlan && plan && (
            <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-blueprint">
              <span>
                Plan: {plan.projectsPerMonth} projects a month at about {formatINR(plan.avgProjectValue)} each, aiming for {formatINR(plan.monthlyRevenue)} a month in all.
              </span>
              <button
                type="button"
                disabled={locked}
                onClick={() => {
                  set("monthlyRevenueTarget", plan.monthlyRevenue);
                  set("projectsPerMonthTarget", plan.projectsPerMonth);
                  setResetKey((k) => k + 1);
                }}
                className="inline-flex items-center gap-1 font-semibold text-graphite underline underline-offset-4 hover:text-ink disabled:opacity-50"
              >
                <RotateCcw className="size-3" aria-hidden /> Use the plan targets
              </button>
            </div>
          )}
        </SettingsSection>

        {/* 05 */}
        <SettingsSection id="operations" index="05" title="Operations" description="Used by Travel to estimate the cost of getting the crew and gear to a shoot or client site.">
          <div className="grid gap-x-5 gap-y-5 sm:grid-cols-2">
            {text("baseLocation", "Base location", { help: "Where trips start from: a city, area or address.", placeholder: "e.g. Gadag" })}
            {num("fuelCostPerKm", "Fuel cost per km (₹)", { step: 0.5, help: "Update this when fuel prices change." })}
          </div>
        </SettingsSection>

        {/* 06 */}
        <SettingsSection
          id="digest"
          index="06"
          title="Morning email"
          description="Every morning at about 7 am, the founders get one email with what is overdue, what is for today and what is coming up: the same list as Today on the Command Center."
        >
          {text("digestEmails", "Send the morning email to", { help: "Email addresses, separated by commas. Leave empty to stop the email.", placeholder: "founder@example.com, cofounder@example.com", inputMode: "email", maxLength: 400 })}
          <DigestPanel unsaved={value.digestEmails !== settings.digestEmails} />
        </SettingsSection>

      </form>

      {children}

        {/* footer: last saved / save bar */}
        <div className="sticky bottom-3 z-20">
          {changed > 0 || message ? (
            <div role="region" aria-label="Unsaved changes" className={cn("flex flex-wrap items-center gap-3 rounded-[var(--radius-md)] border px-4 py-3 shadow-[var(--shadow-lift)]", message && !message.ok ? "border-bad/40 bg-paper" : "border-graphite bg-graphite text-paper")}>
              <p role="status" aria-live="polite" className={cn("min-w-0 flex-1 text-sm", message && !message.ok && "font-medium text-bad")}>
                {message ? message.text : errorCount ? `${changed} unsaved change${changed === 1 ? "" : "s"} · ${errorCount} field${errorCount === 1 ? "" : "s"} need attention` : `${changed} unsaved change${changed === 1 ? "" : "s"}`}
              </p>
              {changed > 0 && (
                <>
                  <Button type="button" variant="outline-light" size="sm" onClick={discard} disabled={saving}>
                    <Undo2 className="size-4" aria-hidden /> Discard
                  </Button>
                  <Button type="submit" form="settings-form" variant="light" size="sm" disabled={saving}>
                    {saving ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Save className="size-4" aria-hidden />} Save changes
                  </Button>
                </>
              )}
            </div>
          ) : (
            <p className="text-center text-xs text-blueprint">{settings.updatedAt ? `Last saved ${formatDateTime(settings.updatedAt)}${settings.updatedBy ? ` by ${settings.updatedBy}` : ""}.` : "Nothing saved yet. Defaults are in use."}</p>
          )}
        </div>
    </div>
  );
}
