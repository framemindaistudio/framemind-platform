"use client";

import { Check } from "lucide-react";
import { Link } from "@/site/router";
import { DEDICATED, OVERAGE_COMMON, TIERS, tierPrice, type Industry, type IndustryRates } from "@/lib/content/industries";

/*
 * Pricing blocks shared by /industries and /industries/<slug> (approved 16 Nov 2026). Colours come from the page's
 * brand variables (--b-*) on an industry page, with neutral fallbacks on the industries list.
 */

const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;
const C = {
  ink: "var(--b-primary, #171716)",
  accent: "var(--b-accent-ink, #171716)",
  surface: "var(--b-surface, #F1F0EA)",
};

/** Every plan side by side for one industry: price, this industry's limits, storage and branches, then overage. */
export function PlanCompare({ ind, rates, freeMonths }: { ind: Industry; rates?: IndustryRates | null; freeMonths: number }) {
  const rows: { label: string; values: string[] }[] = [
    ...ind.planRows,
    { label: "Storage", values: TIERS.map((t) => t.storage) },
    { label: "Branches included", values: TIERS.map((t) => String(t.branchesIncluded)) },
  ];
  return (
    <div>
      <div className="overflow-x-auto rounded-2xl border border-[var(--b-primary,#171716)]/10 bg-white">
        <table className="w-full min-w-[720px] text-sm tabular-nums">
          <thead>
            <tr className="text-left">
              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider opacity-60">{ind.unit}</th>
              {TIERS.map((t) => (
                <th key={t.id} className="px-4 py-3" style={t.badge ? { background: C.surface } : undefined}>
                  <span className="block text-sm font-bold">{t.name}</span>
                  <span className="block text-lg font-black">{inr(tierPrice(rates, ind.id, t.id))}</span>
                  <span className="block text-[11px] font-medium opacity-60">
                    a month · {inr(tierPrice(rates, ind.id, t.id) * (12 - freeMonths))} a year
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.label} className="border-t border-[var(--b-primary,#171716)]/10">
                <td className="px-4 py-2.5 font-medium">{r.label}</td>
                {r.values.map((v, i) => (
                  <td key={i} className="px-4 py-2.5" style={TIERS[i]?.badge ? { background: C.surface } : undefined}>
                    {v}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs leading-relaxed opacity-75">
        <span className="font-semibold">Over a limit?</span> {ind.overage}. {OVERAGE_COMMON} *Unlimited means fair use for one business.
      </p>
    </div>
  );
}

/** Shared app vs dedicated app, with the dedicated app's hosting and storage options. */
export function BuyOptions({ setup }: { setup: number }) {
  const card = "rounded-2xl border border-[var(--b-primary,#171716)]/10 bg-white p-6";
  const tick = (x: string) => (
    <li key={x} className="flex gap-2 text-sm">
      <Check size={14} className="mt-0.5 shrink-0" style={{ color: C.accent }} /> {x}
    </li>
  );
  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className={card}>
          <p className="font-mono text-[10px] font-bold uppercase tracking-widest" style={{ color: C.accent }}>
            Lower cost
          </p>
          <h3 className="mt-2 text-xl font-black">Shared app</h3>
          <p className="mt-1 text-sm opacity-70">Your own branded app on FrameMind&apos;s platform. Servers are shared with other clients; your data stays separate and private.</p>
          <ul className="mt-4 space-y-2">
            {[`One-time setup ${inr(setup)}: name, logo, colours, data import, training, go-live`, "A monthly or yearly plan from the table above", "Hosting, storage, backups, updates and security included, up to your plan's limits", "Your own sub-domain, or your own domain connected", "New features reach you automatically"].map(tick)}
          </ul>
        </div>
        <div className={card}>
          <p className="font-mono text-[10px] font-bold uppercase tracking-widest" style={{ color: C.accent }}>
            Full control
          </p>
          <h3 className="mt-2 text-xl font-black">Dedicated app</h3>
          <p className="mt-1 text-sm opacity-70">A separate copy for you alone: your own servers, your own database, and changes made just for you.</p>
          <ul className="mt-4 space-y-2">
            {[
              `One-time build from ${inr(DEDICATED.buildFrom)}; custom features quoted`,
              `Maintenance ${inr(DEDICATED.maintenance[0])}–${inr(DEDICATED.maintenance[1])} a month: updates, security, monitoring, support`,
              "Hosting and storage billed separately: we host and manage it, or it runs in your own cloud account",
              "No user, record or storage limits from us; you pay for the servers you use",
              "Android and iPhone store apps, and a source-code licence, on quote",
            ].map(tick)}
          </ul>
        </div>
      </div>
      <div className="mt-4 overflow-x-auto rounded-2xl border border-[var(--b-primary,#171716)]/10 bg-white">
        <table className="w-full min-w-[620px] text-sm tabular-nums">
          <thead>
            <tr className="text-left text-[11px] font-semibold uppercase tracking-wider">
              <th className="px-4 py-3 opacity-60">Dedicated app hosting</th>
              <th className="px-4 py-3 opacity-60">What you get</th>
              <th className="px-4 py-3 text-right opacity-60">Price</th>
            </tr>
          </thead>
          <tbody>
            {DEDICATED.hosting.map((h) => (
              <tr key={h.name} className="border-t border-[var(--b-primary,#171716)]/10">
                <td className="px-4 py-2.5 font-semibold">{h.name}</td>
                <td className="px-4 py-2.5 opacity-75">{h.detail}</td>
                <td className="px-4 py-2.5 text-right font-bold">{inr(h.monthly)}/month</td>
              </tr>
            ))}
            <tr className="border-t border-[var(--b-primary,#171716)]/10">
              <td className="px-4 py-2.5 font-semibold">Your own cloud account</td>
              <td className="px-4 py-2.5 opacity-75">Runs on your AWS / Google / Vercel / Supabase account, billed to you by the provider; we set it up and manage it under maintenance</td>
              <td className="px-4 py-2.5 text-right font-bold">At actuals + {inr(DEDICATED.ownCloudSetup)} setup</td>
            </tr>
            <tr className="border-t border-[var(--b-primary,#171716)]/10">
              <td className="px-4 py-2.5 font-semibold">Extra storage</td>
              <td className="px-4 py-2.5 opacity-75">Photos, documents, reports and backups beyond the managed pack</td>
              <td className="px-4 py-2.5 text-right font-bold">{DEDICATED.extraStorage}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs opacity-75">
        Prices before GST; GST is added where applicable. Third-party charges (WhatsApp, SMS, payment gateway, app stores, domain) are paid at actuals.{" "}
        <Link to="/industries/terms" className="font-semibold underline">
          Terms and conditions
        </Link>
      </p>
    </div>
  );
}
