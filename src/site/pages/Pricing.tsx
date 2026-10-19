"use client";

import { useState, useMemo, useCallback } from "react";
import { Link } from "@/site/router";
import {
  Globe, Palette, Code2, Zap, Camera, Video, Share2, Layers,
  Check, Download, ArrowRight, FileText,
} from "lucide-react";
import SEO from "@/site/components/SEO";
import { submitLead } from "@/site/leads";
import { WEBSITE_SERVICES, type Group, type Option, type ServiceDef, type ServiceId, type ServiceNote } from "@/lib/content/site-pricing";
import type { RateCard } from "@/lib/pricebook/types";

/** The part of the rate card the public pricing page receives: prices only, never costs, margins or plans. */
export type PublicRates = Pick<RateCard, "services" | "socialContracts" | "bundleSteps">;
const framemindLogo = "/site/framemind-logo.jpg";
const msmeLogo = "/site/msme-logo.png";

// ─── Types ────────────────────────────────────────────────────────────────────

// ─── Service Definitions ──────────────────────────────────────────────────────

const ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = { Globe, Palette, Code2, Zap, Camera, Video, Share2, Layers };
const iconOf = (name: string) => ICONS[name] ?? Layers;

/** The bundle's discount for a number of services: the rate card's steps (5 or more = the last step). */
type BundleStep = { services: number; discountPercent: number };
const DEFAULT_STEPS: BundleStep[] = [
  { services: 2, discountPercent: 5 },
  { services: 3, discountPercent: 10 },
  { services: 4, discountPercent: 15 },
  { services: 5, discountPercent: 20 },
];
function bundlePct(count: number, steps: BundleStep[]) {
  let pct = 0;
  for (const st of [...steps].sort((a, b) => a.services - b.services)) if (count >= st.services) pct = st.discountPercent;
  return pct;
}

/**
 * The configurator's services from HQ's rate card (HQ → Money → Rate Card): every group, option and price as the
 * founders saved them. The page's own icons, tab names and "What's included" notes stay; without a rate card the
 * published price list (src/lib/content/site-pricing.ts) is shown.
 */
function servicesFrom(rates: PublicRates | null | undefined): ServiceDef[] {
  if (!rates) return WEBSITE_SERVICES;
  const steps = rates.bundleSteps.length ? rates.bundleSteps : DEFAULT_STEPS;
  return WEBSITE_SERVICES.map((page) => {
    if (page.id === "bundle") {
      const text = [...steps].sort((a, b) => a.services - b.services).map((st, i, all) => `${i === all.length - 1 ? `${st.services}+` : st.services} = ${st.discountPercent}%`).join(" · ");
      const top = Math.max(0, ...steps.map((st) => st.discountPercent));
      return {
        ...page,
        description: `Pick any combination of our services and get a bundle discount — up to ${top}% off.`,
        groups: page.groups.map((g) => ({ ...g, subtitle: `Prices reflect a standard engagement for each service. ${text} off` })),
      };
    }
    const card = rates.services.find((x) => x.id === page.id);
    if (!card) return page;
    const groups: Group[] = card.groups.map((g) => ({
      id: g.id,
      title: g.title,
      ...(g.help ? { subtitle: g.help } : {}),
      ...(g.note ? { note: g.note } : {}),
      type: g.mode === "one" ? "radio" : "checkbox",
      options: g.options.map((o) => ({ id: o.id, label: o.label, price: o.price, ...(o.detail ? { desc: o.detail } : {}), ...(o.badge ? { tag: o.badge } : {}), ...(o.base ? { isBase: true } : {}), ...(o.unit ? { unit: o.unit } : {}) })),
    }));
    if (page.id === "social" && rates.socialContracts.length) {
      const contract = page.groups.find((g) => g.isDiscount);
      groups.push({
        id: contract?.id ?? "contract",
        title: contract?.title ?? "Contract Duration",
        subtitle: contract?.subtitle,
        type: "radio",
        isDiscount: true,
        options: rates.socialContracts.map((c, i) => ({ id: `ct${i + 1}`, label: c.label, price: 0, discountPct: c.discountPercent, ...(c.discountPercent ? { desc: `Save ${c.discountPercent}%` } : {}), ...(c.badge ? { tag: c.badge } : {}) })),
      });
    }
    return { ...page, name: card.name || page.name, description: card.description || page.description, groups };
  });
}

// ─── FAQs ─────────────────────────────────────────────────────────────────────

const faqs = [
  { q: "Are these prices final?", a: "These are accurate estimates based on your selections. Final pricing is confirmed after a 20-minute discovery call where we align on exact scope. No surprises." },
  { q: "Can I pay in instalments?", a: "Yes. We typically split into two or three milestones — usually 50% to start, 50% on delivery. For larger projects we can structure more milestones." },
  { q: "What if I need something not listed here?", a: "Just reach out. Many projects have elements we scope together. The configurator covers 95% of scenarios — the rest we handle in a call." },
  { q: "How long does a typical project take?", a: "A focused website or brand identity runs 3–6 weeks. Software projects range from 6 to 16 weeks. Timelines are set before work starts and we stick to them." },
  { q: "What's included in the handoff?", a: "All source files, documentation, and a walkthrough call. Nothing is locked behind us — you own everything we build." },
  { q: "Do you work with clients outside India?", a: "Yes. We work with clients internationally. Pricing is INR-based, and international payments are handled via bank transfer or Wise." },
];

// ─── Price Calculation ────────────────────────────────────────────────────────

type Selections = Record<string, string | string[]>;

interface LineItem { label: string; price: number }

interface QuoteResult {
  lineItems: LineItem[];
  subtotal: number;
  discountPct: number;
  discountAmount: number;
  total: number;
}

function calculateQuote(service: ServiceDef, selections: Selections, steps: BundleStep[] = DEFAULT_STEPS): QuoteResult {
  const lineItems: LineItem[] = [];
  let subtotal = 0;
  let discountPct = 0;

  for (const group of service.groups) {
    if (group.isDiscount) {
      const sel = selections[group.id] as string;
      const opt = group.options.find(o => o.id === sel);
      if (opt) discountPct = opt.discountPct ?? 0;
      continue;
    }
    if (group.type === "radio") {
      const sel = selections[group.id] as string;
      if (!sel) continue;
      const opt = group.options.find(o => o.id === sel);
      if (!opt || opt.price === 0) continue;
      lineItems.push({ label: `${group.title}: ${opt.label}`, price: opt.price });
      subtotal += opt.price;
    } else {
      const sel = (selections[group.id] as string[]) ?? [];
      for (const id of sel) {
        const opt = group.options.find(o => o.id === id);
        if (!opt || opt.price === 0) continue;
        lineItems.push({ label: opt.label, price: opt.price });
        subtotal += opt.price;
      }
    }
  }

  if (service.id === "bundle") {
    const sel = (selections["services"] as string[]) ?? [];
    discountPct = bundlePct(sel.length, steps);
  }

  const discountAmount = Math.round(subtotal * discountPct / 100);
  return { lineItems, subtotal, discountPct, discountAmount, total: subtotal - discountAmount };
}

// ─── PDF Generation ───────────────────────────────────────────────────────────

async function downloadQuotePDF(clientName: string, service: ServiceDef, quote: QuoteResult, selections: Selections) {
  const now = new Date();
  const date = now.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  const validUntil = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    .toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  const refNum = `FM-${now.getFullYear().toString().slice(-2)}${String(now.getMonth() + 1).padStart(2, "0")}-${Date.now().toString().slice(-5)}`;
  const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;
  const unit = service.unit === "month" ? "/month" : "";

  const toDataUrl = async (url: string) => {
    try {
      const resp = await fetch(url);
      const blob = await resp.blob();
      return await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
    } catch { return ""; }
  };

  const [logoDataUrl, msmeDataUrl] = await Promise.all([
    toDataUrl(framemindLogo),
    toDataUrl(msmeLogo),
  ]);

  // ── Scope table rows ──
  const scopeRows = service.groups
    .filter(g => !g.isDiscount)
    .map(group => {
      let selectedOpts: Option[] = [];
      if (group.type === "radio") {
        const opt = group.options.find(o => o.id === (selections[group.id] as string));
        if (opt) selectedOpts = [opt];
      } else {
        const selIds = (selections[group.id] as string[]) ?? [];
        selectedOpts = selIds.map(id => group.options.find(o => o.id === id)!).filter(Boolean);
      }
      if (selectedOpts.length === 0) return "";

      const optRows = selectedOpts.map((opt, idx) => {
        const priceCell = opt.price === 0
          ? `<span style="color:#16a34a;font-size:11.5px;font-weight:700;">Included</span>`
          : `<span style="font-size:13px;font-weight:700;color:#111;">${fmt(opt.price)}${opt.unit ? `<span style="font-size:10px;font-weight:400;color:#888;"> ${opt.unit}</span>` : ""}${unit ? `<span style="font-size:10px;font-weight:400;color:#888;"> ${unit}</span>` : ""}</span>`;
        return `<tr style="background:${idx % 2 === 0 ? "#ffffff" : "#f8f8f8"};">
          <td style="padding:11px 14px 11px 26px;border-bottom:1px solid #efefef;vertical-align:top;width:32%;">
            <div style="display:flex;align-items:flex-start;gap:7px;">
              <span style="color:#5a7800;font-size:10px;margin-top:2px;flex-shrink:0;font-weight:900;">✓</span>
              <div>
                <div style="font-size:12.5px;font-weight:700;color:#111;line-height:1.35;">${opt.label}</div>
                ${opt.tag ? `<span style="display:inline-block;margin-top:4px;font-size:7.5px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;background:#eef7c8;color:#4a6500;padding:2px 5px;border-radius:2px;">${opt.tag}</span>` : ""}
              </div>
            </div>
          </td>
          <td style="padding:11px 14px;border-bottom:1px solid #efefef;vertical-align:top;width:46%;">
            ${opt.desc
              ? `<span style="font-size:11.5px;color:#555;line-height:1.65;">${opt.desc}</span>`
              : `<span style="font-size:11px;color:#ccc;">—</span>`}
          </td>
          <td style="padding:11px 16px 11px 8px;border-bottom:1px solid #efefef;text-align:right;vertical-align:top;white-space:nowrap;width:22%;">${priceCell}</td>
        </tr>`;
      }).join("");

      const hasNote = !!group.note;
      return `
        <tr>
          <td colspan="3" style="padding:11px 16px 9px;background:#0D0D0D;border-top:1px solid #1a1a1a;border-bottom:1px solid #1a1a1a;">
            <span style="font-size:9.5px;font-weight:800;text-transform:uppercase;letter-spacing:.16em;color:#F5F4F0;">${group.title}</span>
            ${group.subtitle ? `<span style="font-size:10px;color:#888;margin-left:10px;font-weight:400;">${group.subtitle}</span>` : ""}
          </td>
        </tr>
        ${optRows}
        ${hasNote ? `<tr><td colspan="3" style="padding:7px 16px 9px 26px;background:#fffef5;border-bottom:1px solid #e8d88c;">
          <span style="font-size:10.5px;font-weight:600;color:#6b4f00;line-height:1.6;">&#9432; ${group.note}</span>
        </td></tr>` : ""}`;
    }).join("");

  // ── Price summary ──
  const summaryBlock = `
    <div style="margin-top:28px;border:1.5px solid #e0e0e0;border-radius:6px;overflow:hidden;">
      <div style="background:#f0f0f0;padding:11px 20px;border-bottom:1px solid #ddd;">
        <span style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.18em;color:#222;">Price Summary</span>
      </div>
      <div style="padding:16px 20px;display:flex;flex-direction:column;gap:10px;">
        ${quote.lineItems.map(li => `
          <div style="display:flex;justify-content:space-between;align-items:baseline;">
            <span style="font-size:12px;color:#555;">${li.label}</span>
            <span style="font-size:12px;font-weight:600;color:#333;">${fmt(li.price)}${unit}</span>
          </div>`).join("")}
        <div style="height:1px;background:#e8e8e8;margin:4px 0;"></div>
        <div style="display:flex;justify-content:space-between;align-items:baseline;">
          <span style="font-size:12px;font-weight:700;color:#333;">Subtotal</span>
          <span style="font-size:13px;font-weight:700;color:#111;">${fmt(quote.subtotal)}${unit}</span>
        </div>
        ${quote.discountPct > 0 ? `
        <div style="display:flex;justify-content:space-between;align-items:baseline;background:#f0fdf4;padding:8px 12px;border-radius:4px;margin:-2px -4px;">
          <span style="font-size:12px;color:#16a34a;font-weight:600;">Bundle / Contract Discount (${quote.discountPct}%)</span>
          <span style="font-size:13px;font-weight:700;color:#16a34a;">− ${fmt(quote.discountAmount)}</span>
        </div>` : ""}
      </div>
      <div style="background:#0D0D0D;padding:20px 20px;display:flex;justify-content:space-between;align-items:center;">
        <div>
          <div style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.15em;color:#bbbbbb;margin-bottom:5px;">Total Estimate</div>
          <div style="font-size:11.5px;font-weight:600;color:#999999;">${service.unit === "month" ? "Per month · billed monthly" : "One-time project fee"}</div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:32px;font-weight:900;color:#C8F135;letter-spacing:-1px;">${fmt(quote.total)}</div>
          ${unit ? `<div style="font-size:11px;font-weight:600;color:#aaaaaa;margin-top:2px;">${unit}</div>` : ""}
        </div>
      </div>
      <div style="padding:12px 20px;background:#f4f4f4;border-top:1px solid #ddd;">
        <span style="font-size:10.5px;font-weight:600;color:#555;">Payment: 50% to start · 50% on delivery &nbsp;·&nbsp; All prices in INR &nbsp;·&nbsp; No hidden charges</span>
      </div>
    </div>`;

  // ── Service terms cards ──
  const termsBlock = service.serviceNotes && service.serviceNotes.length > 0
    ? `<div style="margin-top:32px;">
        <div style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.18em;color:#333;margin-bottom:14px;display:flex;align-items:center;gap:10px;">
          <span>Service Terms &amp; Deliverables</span>
          <span style="flex:1;height:1.5px;background:#ddd;display:inline-block;"></span>
        </div>
        <div style="display:grid;grid-template-columns:repeat(${Math.min(service.serviceNotes.length, 3)},1fr);gap:12px;">
          ${service.serviceNotes.map(note => `
            <div style="border:1.5px solid #e8e8e8;border-radius:6px;overflow:hidden;">
              <div style="background:#0D0D0D;padding:10px 14px;">
                <span style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.12em;color:#C8F135;">${note.title}</span>
              </div>
              <div style="padding:12px 14px;background:#fff;">
                ${Array.isArray(note.content)
                  ? note.content.map(item => `<div style="display:flex;gap:7px;align-items:flex-start;margin-bottom:7px;">
                      <span style="color:#b0c830;font-size:11px;flex-shrink:0;margin-top:1px;">✓</span>
                      <span style="font-size:11px;color:#444;line-height:1.5;">${item}</span>
                    </div>`).join("")
                  : `<p style="font-size:11px;color:#555;line-height:1.65;margin:0;">${note.content}</p>`}
              </div>
            </div>`).join("")}
        </div>
      </div>`
    : "";

  // ── Disclaimer ──
  const disclaimer = `
    <div style="margin-top:24px;padding:16px 20px;background:#fffdf0;border:1.5px solid #e8d070;border-radius:5px;">
      <div style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.14em;color:#5a4000;margin-bottom:6px;">Important Notice</div>
      <p style="font-size:11.5px;color:#3a2c00;line-height:1.75;margin:0;font-weight:500;">
        This is a <strong>preliminary estimate</strong> based on your selected options. Final pricing is confirmed after a 20-minute discovery call where we align on exact scope and requirements together. This quotation is valid for <strong>30 days</strong> from the date of issue. Prices are subject to change after the validity period.
      </p>
    </div>`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Quotation — ${service.name} — FrameMind AI Studio</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Helvetica Neue',Arial,sans-serif;color:#111;background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact;font-size:13px;line-height:1.5}
    .page{max-width:820px;margin:0 auto;background:#fff}

    /* ── HEADER (white bg) ── */
    .hd{display:flex;justify-content:space-between;align-items:flex-start;padding:32px 44px 28px;border-bottom:1px solid #e0e0e0;}
    .hd-left{display:flex;align-items:center;gap:16px;}
    .hd-logo{width:68px;height:68px;object-fit:contain;border-radius:8px;border:1px solid #ddd;}
    .hd-studio-name{font-size:19px;font-weight:800;color:#0D0D0D;letter-spacing:-.3px;line-height:1.1;}
    .hd-studio-tag{font-size:9px;text-transform:uppercase;letter-spacing:.14em;color:#777;margin-top:4px;}
    .hd-studio-msme{display:flex;align-items:center;gap:6px;margin-top:8px;padding:4px 9px;background:#f4f4f4;border:1px solid #ddd;border-radius:4px;width:fit-content;}
    .hd-msme-logo{width:20px;height:20px;object-fit:contain;}
    .hd-msme-txt{font-size:8.5px;color:#555;font-weight:600;text-transform:uppercase;letter-spacing:.08em;}
    .hd-right{text-align:right;}
    .hd-doc-label{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.2em;color:#888;margin-bottom:5px;}
    .hd-doc-type{font-size:24px;font-weight:900;color:#0D0D0D;letter-spacing:-1px;}
    .hd-ref{font-size:12px;font-weight:700;color:#444;margin-top:6px;font-family:monospace;background:#f4f4f4;display:inline-block;padding:3px 8px;border-radius:3px;}
    .hd-dates{margin-top:10px;}
    .hd-date-row{font-size:11px;color:#666;margin-top:3px;}
    .hd-date-row strong{color:#111;font-weight:700;}

    /* ── LIME BAR ── */
    .lime-bar{height:4px;background:linear-gradient(90deg,#C8F135 0%,#90b020 100%);}

    /* ── CLIENT + SERVICE META (white bg) ── */
    .meta{display:flex;gap:0;margin:0;border-bottom:2px solid #e0e0e0;}
    .meta-cell{flex:1;padding:22px 44px;}
    .meta-cell+.meta-cell{border-left:1px solid #e0e0e0;}
    .meta-label{font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:.18em;color:#555;margin-bottom:8px;}
    .meta-name{font-size:21px;font-weight:900;color:#0D0D0D;letter-spacing:-.4px;}
    .meta-sub{font-size:11.5px;color:#555;margin-top:5px;line-height:1.6;}
    .meta-badge{display:inline-flex;align-items:center;gap:6px;background:#0D0D0D;color:#C8F135;font-size:9.5px;font-weight:800;padding:6px 14px;letter-spacing:.12em;text-transform:uppercase;border-radius:3px;margin-top:8px;}

    /* ── BODY ── */
    .body{padding:28px 44px 36px;}

    /* ── SCOPE TABLE ── */
    .section-label{font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.18em;color:#333;margin-bottom:12px;display:flex;align-items:center;gap:10px;}
    .section-label::after{content:'';flex:1;height:1px;background:#ddd;display:inline-block;}
    table{width:100%;border-collapse:collapse;border:1.5px solid #ddd;border-radius:6px;overflow:hidden;margin-bottom:0;}
    table thead tr th{background:#1a1a1a;color:#aaaaaa;padding:9px 14px;font-size:8.5px;text-transform:uppercase;letter-spacing:.14em;font-weight:700;text-align:left;border-bottom:1px solid #2a2a2a;}
    table thead tr th:nth-child(1){width:32%;padding-left:26px;}
    table thead tr th:nth-child(2){width:46%;}
    table thead tr th:last-child{text-align:right;width:22%;padding-right:16px;}

    /* ── FOOTER (dark #0D0D0D bg — ALL text must be light) ── */
    .footer{background:#0D0D0D;padding:26px 44px;display:flex;justify-content:space-between;align-items:center;gap:24px;margin-top:0;}
    .footer-sig-name{font-size:15px;font-weight:800;color:#ffffff;margin-bottom:2px;}
    .footer-sig-role{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.13em;color:#C8F135;margin-bottom:12px;}
    .footer-contacts{display:flex;flex-wrap:wrap;gap:4px 16px;}
    .fc{font-size:10.5px;color:#bbbbbb;}
    .fc a{color:#cccccc;text-decoration:none;}
    .footer-right{display:flex;flex-direction:column;align-items:flex-end;gap:10px;}
    .footer-msme-wrap{display:flex;align-items:center;gap:12px;}
    .footer-msme-logo{width:50px;height:50px;object-fit:contain;background:#ffffff;border-radius:5px;padding:4px;}
    .footer-msme-txt{font-size:10px;font-weight:700;color:#cccccc;text-align:right;line-height:1.7;}
    .footer-tagline{font-size:9px;font-weight:600;color:#aaaaaa;text-align:right;text-transform:uppercase;letter-spacing:.12em;}

    @media print{
      body{-webkit-print-color-adjust:exact;print-color-adjust:exact}
      .page{max-width:100%;margin:0}
    }
  </style>
</head>
<body>
<div class="page">

  <!-- HEADER -->
  <div class="hd">
    <div class="hd-left">
      ${logoDataUrl
        ? `<img src="${logoDataUrl}" class="hd-logo" alt="FrameMind" />`
        : `<div style="width:68px;height:68px;background:#0D0D0D;border-radius:8px;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:2px;">
            <span style="font-size:10px;font-weight:800;color:#C8F135;line-height:1;">FM</span>
           </div>`}
      <div>
        <div class="hd-studio-name">FrameMind AI Studio</div>
        <div class="hd-studio-tag">Design · Development · Content · AI</div>
        ${msmeDataUrl ? `<div class="hd-studio-msme">
          <img src="${msmeDataUrl}" class="hd-msme-logo" alt="MSME" />
          <span class="hd-msme-txt">MSME Registered · Govt. of India</span>
        </div>` : ""}
      </div>
    </div>
    <div class="hd-right">
      <div class="hd-doc-label">Document</div>
      <div class="hd-doc-type">QUOTATION</div>
      <div class="hd-ref">${refNum}</div>
      <div class="hd-dates">
        <div class="hd-date-row">Date of issue: <strong>${date}</strong></div>
        <div class="hd-date-row">Valid until: <strong>${validUntil}</strong></div>
      </div>
    </div>
  </div>

  <div class="lime-bar"></div>

  <!-- CLIENT + SERVICE META -->
  <div class="meta">
    <div class="meta-cell">
      <div class="meta-label">Prepared for</div>
      <div class="meta-name">${clientName || "Valued Client"}</div>
      <div class="meta-sub">This quotation has been prepared exclusively<br>for the above-named client.</div>
    </div>
    <div class="meta-cell">
      <div class="meta-label">Service</div>
      <div class="meta-badge">◆ &nbsp;${service.name}</div>
      <div class="meta-sub" style="margin-top:10px;">${service.description}</div>
    </div>
  </div>

  <!-- BODY -->
  <div class="body">

    <!-- Scope of Work -->
    <div class="section-label">Scope of Work &amp; Selected Options</div>
    <table>
      <thead>
        <tr>
          <th>Service / Option</th>
          <th>Details</th>
          <th style="text-align:right;">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${scopeRows}
      </tbody>
    </table>

    <!-- Price Summary -->
    ${summaryBlock}

    <!-- Terms & Deliverables -->
    ${termsBlock}

    <!-- Disclaimer -->
    ${disclaimer}

  </div>

  <!-- FOOTER -->
  <div class="footer">
    <div class="footer-sig">
      <div class="footer-sig-name">Chinmay R M</div>
      <div class="footer-sig-role">Founder &amp; Director — FrameMind AI Studio</div>
      <div class="footer-contacts">
        <span class="fc">📞 <a href="tel:+918073087576">+91 80730 87576</a></span>
        <span class="fc">✉ <a href="mailto:framemindaistudio@gmail.com">framemindaistudio@gmail.com</a></span>
        <span class="fc">🌐 <a href="https://www.framemindaistudio.com">www.framemindaistudio.com</a></span>
        <span class="fc">💼 <a href="https://linkedin.com/in/chinmay-rm">linkedin.com/in/chinmay-rm</a></span>
      </div>
    </div>
    <div class="footer-right">
      <div class="footer-tagline">Built to last. Delivered with intent.</div>
      ${msmeDataUrl ? `<div class="footer-msme-wrap">
        <div class="footer-msme-txt">MSME Registered<br>Govt. of India</div>
        <img src="${msmeDataUrl}" class="footer-msme-logo" alt="MSME Registered" />
      </div>` : ""}
    </div>
  </div>

</div>
</body>
</html>`;

  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 700);
}

// ─── Service Notes Accordion ──────────────────────────────────────────────────

function ServiceNotesAccordion({ notes }: { notes: ServiceNote[] }) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="border border-border rounded-sm overflow-hidden">
      <div className="px-4 py-2.5 bg-secondary border-b border-border flex items-center gap-2">
        <span className="w-1 h-4 rounded-full bg-foreground/20" />
        <span className="text-xs font-semibold">Service Notes</span>
      </div>
      {notes.map((note, i) => (
        <div key={note.title} className={i > 0 ? "border-t border-border" : ""}>
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-secondary/50 transition-colors"
          >
            <span className="text-xs font-medium">{note.title}</span>
            <span className={`text-muted-foreground text-xs transition-transform duration-200 ${open === i ? "rotate-180" : ""}`}>▾</span>
          </button>
          {open === i && (
            <div className="px-4 pb-4">
              {Array.isArray(note.content) ? (
                <ul className="space-y-1">
                  {note.content.map(item => (
                    <li key={item} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <span className="text-[#C8F135] mt-0.5 shrink-0">✓</span>{item}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-muted-foreground leading-relaxed">{note.content}</p>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Option Card ─────────────────────────────────────────────────────────────

function OptionCard({ option, selected, type, onToggle }: {
  option: Option; selected: boolean; type: "radio" | "checkbox"; onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className={`relative w-full text-left px-4 py-3.5 rounded-sm border transition-all duration-150 group ${
        selected
          ? "border-[#0D0D0D] bg-[#0D0D0D]"
          : "border-border bg-background hover:border-foreground/30 hover:bg-secondary/40"
      }`}
    >
      <div className="flex items-start gap-3">
        <span className={`shrink-0 mt-0.5 w-4 h-4 flex items-center justify-center border transition-all ${
          type === "radio" ? "rounded-full" : "rounded-sm"
        } ${selected ? "bg-[#C8F135] border-[#C8F135]" : "border-border"}`}>
          {selected && <Check size={9} className="text-[#0D0D0D]" strokeWidth={3} />}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className={`text-sm font-medium leading-snug ${selected ? "text-[#F5F4F0]" : "text-foreground"}`}>
                {option.label}
                {option.unit && (
                  <span className={`text-xs font-normal ml-1 ${selected ? "text-[#888]" : "text-muted-foreground"}`}>{option.unit}</span>
                )}
              </p>
              {option.desc && (
                <p className={`text-xs mt-0.5 leading-snug ${selected ? "text-[#666]" : "text-muted-foreground"}`}>{option.desc}</p>
              )}
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0 ml-2">
              <span className={`text-sm font-bold tabular-nums ${selected ? "text-[#C8F135]" : "text-foreground"}`}>
                {option.price === 0
                  ? (option.isBase ? "" : <span className="text-xs font-normal text-muted-foreground">Included</span>)
                  : `+₹${option.price.toLocaleString("en-IN")}`}
              </span>
              {option.tag && (
                <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-sm ${
                  selected ? "bg-[#C8F135]/20 text-[#C8F135]" : "bg-secondary text-muted-foreground"
                }`}>{option.tag}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Pricing({ rates = null }: { rates?: PublicRates | null }) {
  const SERVICES = useMemo(() => servicesFrom(rates), [rates]);
  const steps = rates?.bundleSteps?.length ? rates.bundleSteps : DEFAULT_STEPS;
  const [activeId, setActiveId] = useState<ServiceId>("websites");
  const [allSelections, setAllSelections] = useState<Record<ServiceId, Selections>>(
    () => Object.fromEntries(SERVICES.map(s => [s.id, {}])) as Record<ServiceId, Selections>
  );
  const [clientName, setClientName] = useState("");
  // optional: a phone or email files the quote in HQ as an enquiry, so the studio can follow up
  const [clientContact, setClientContact] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const service = SERVICES.find(s => s.id === activeId)!;
  const selections = allSelections[activeId];

  const setSelection = useCallback((groupId: string, value: string | string[]) => {
    setAllSelections(prev => ({ ...prev, [activeId]: { ...prev[activeId], [groupId]: value } }));
  }, [activeId]);

  const toggleOption = useCallback((group: Group, optionId: string) => {
    if (group.type === "radio") {
      setSelection(group.id, optionId);
    } else {
      const current = (selections[group.id] as string[]) ?? [];
      setSelection(group.id,
        current.includes(optionId) ? current.filter(id => id !== optionId) : [...current, optionId]
      );
    }
  }, [selections, setSelection]);

  const quote = useMemo(() => calculateQuote(service, selections, steps), [service, selections, steps]);
  const hasSelections = quote.lineItems.length > 0;

  return (
    <>
      <SEO
        title="Services & Pricing — Build Your Custom Quote"
        description="Configure exactly what you need and get an instant price. Download a personalised PDF quote for websites, brand, software, automations, photography, videography, or social media."
        path="/pricing"
        keywords="web design pricing India, website cost India, brand identity price, custom software quote India, digital services pricing, photography videography pricing India, FrameMind services"
        ogImageAlt="FrameMind AI Studio — Services & Pricing Configurator"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Service",
          "name": "Design & Digital Services — FrameMind AI Studio",
          "provider": { "@type": "Organization", "name": "FrameMind AI Studio", "url": "https://www.framemindaistudio.com" },
          "description": "Custom websites, brand identity, software, automations, photography, videography, and social media — all in-house, INR pricing.",
          "areaServed": "IN",
          "serviceType": ["Web Design", "Brand Identity", "Software Development", "AI Automation", "Photography", "Videography", "Social Media Management"],
          "offers": {
            "@type": "AggregateOffer",
            "priceCurrency": "INR",
            "lowPrice": "3000",
            "offerCount": "7",
          },
        }}
      />
      <div className="min-h-screen">

        {/* ── Hero ── */}
        <section className="bg-[#0D0D0D] relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-[2px] bg-[#C8F135]" />
          <div className="max-w-6xl mx-auto px-6 pt-14 md:pt-20 pb-14 md:pb-20">
            <div className="max-w-3xl">
              <div className="flex items-center gap-3 mb-8">
                <span className="w-2 h-2 rounded-full bg-[#C8F135] animate-pulse" />
                <span className="font-mono text-[11px] text-[#555] uppercase tracking-[0.2em]">FrameMind Studio · Interactive Pricing</span>
              </div>
              <h1 className="text-4xl sm:text-5xl md:text-[66px] font-semibold text-[#F5F4F0] tracking-tight leading-[1.0] mb-6">
                Your project.<br />
                <em className="not-italic text-[#C8F135]">Your exact price.</em>
              </h1>
              <p className="text-base text-[#666] leading-relaxed max-w-lg mb-8">
                Choose your service, configure exactly what you need, and get an instant quote. Add your name and download it as a PDF — with our contact details and a full breakdown.
              </p>
              <div className="flex flex-wrap gap-2">
                {SERVICES.map(s => {
                  const Icon = iconOf(s.icon);
                  return (
                    <button key={s.id} onClick={() => setActiveId(s.id)}
                      className={`inline-flex items-center gap-1.5 font-mono text-[10px] border px-3 py-1.5 rounded-sm uppercase tracking-widest transition-colors ${
                        s.id === activeId ? "border-[#C8F135] text-[#C8F135]" : "border-[#222] text-[#555] hover:border-[#444] hover:text-[#888]"
                      }`}>
                      <Icon size={10} />{s.tabName ?? s.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* ── Configurator ── */}
        <section className="max-w-6xl mx-auto px-6 py-10 md:py-14">
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-10">

            {/* Service picker — left sidebar */}
            <div className="lg:w-[200px] shrink-0">
              <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest mb-3 hidden lg:block">Service</p>
              {/* Mobile: horizontal scroll */}
              <div className="flex lg:hidden gap-2 overflow-x-auto pb-2">
                {SERVICES.map(s => {
                  const Icon = iconOf(s.icon);
                  const isBundle = s.id === "bundle";
                  const active = activeId === s.id;
                  return (
                    <button key={s.id} onClick={() => setActiveId(s.id)}
                      className={`shrink-0 flex items-center gap-2 px-3 py-2 rounded-sm text-xs font-medium transition-all whitespace-nowrap ${
                        isBundle
                          ? active ? "bg-[#C85A00] text-white" : "border border-[#C85A00]/40 text-[#C85A00]"
                          : active ? "bg-[#0D0D0D] text-[#F5F4F0]" : "border border-border text-muted-foreground"
                      }`}>
                      <Icon size={12} />{s.tabName ?? s.name}
                    </button>
                  );
                })}
              </div>
              {/* Desktop: vertical list */}
              <div className="hidden lg:flex flex-col gap-1.5">
                {SERVICES.map(s => {
                  const Icon = iconOf(s.icon);
                  const isBundle = s.id === "bundle";
                  const active = activeId === s.id;
                  return (
                    <button key={s.id} onClick={() => setActiveId(s.id)}
                      className={`flex items-center gap-2.5 w-full px-3.5 py-2.5 rounded-sm text-sm font-medium transition-all text-left ${
                        isBundle
                          ? active
                            ? "bg-[#C85A00] text-white"
                            : "bg-orange-50 text-[#C85A00] hover:bg-orange-100 border border-orange-200"
                          : active
                            ? "bg-[#0D0D0D] text-[#F5F4F0]"
                            : "border border-border text-muted-foreground hover:bg-secondary hover:text-foreground"
                      }`}>
                      <Icon size={14} className={active && !isBundle ? "text-[#C8F135]" : ""} />
                      <span className="flex-1">{s.tabName ?? s.name}</span>
                      {isBundle && !active && (
                        <span className="text-[8px] font-bold bg-[#C85A00] text-white px-1 py-0.5 rounded-sm uppercase tracking-wide">Bundle</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Option groups — main area */}
            <div className="flex-1 min-w-0">
              <div className="mb-8 pb-6 border-b border-border">
                <h2 className="text-2xl font-semibold tracking-tight mb-1.5">{service.name}</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">{service.description}</p>
              </div>

              <div className="flex flex-col gap-10">
                {service.groups.map(group => {
                  const currentRadio = selections[group.id] as string;
                  const currentCheckbox = (selections[group.id] as string[]) ?? [];
                  return (
                    <div key={group.id}>
                      <div className="mb-3">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className={`w-1 h-4 rounded-full ${group.type === "radio" ? "bg-[#C8F135]" : "bg-foreground/20"}`} />
                          <h3 className="text-sm font-semibold">{group.title}</h3>
                          <span className={`font-mono text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded-sm ${
                            group.type === "radio" ? "bg-[#C8F135]/10 text-[#6a8200]" : "bg-secondary text-muted-foreground"
                          }`}>{group.type === "radio" ? "Choose one" : "Choose any"}</span>
                        </div>
                        {group.subtitle && <p className="text-xs text-muted-foreground ml-3">{group.subtitle}</p>}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {group.options.map(opt => (
                          <OptionCard
                            key={opt.id}
                            option={opt}
                            type={group.type}
                            selected={
                              group.type === "radio"
                                ? currentRadio === opt.id
                                : currentCheckbox.includes(opt.id)
                            }
                            onToggle={() => toggleOption(group, opt.id)}
                          />
                        ))}
                      </div>
                      {group.note && (
                        <p className="text-[11px] text-muted-foreground/70 mt-2 ml-1 leading-relaxed italic">
                          ℹ {group.note}
                        </p>
                      )}
                    </div>
                  );
                })}

                {/* Service notes accordion (social media) */}
                {service.serviceNotes && service.serviceNotes.length > 0 && (
                  <ServiceNotesAccordion notes={service.serviceNotes} />
                )}
              </div>
            </div>

            {/* Quote summary — sticky right panel */}
            <div className="lg:w-[300px] shrink-0">
              <div className="lg:sticky lg:top-6">
                <div className="bg-[#0D0D0D] rounded-sm overflow-hidden shadow-2xl">
                  {/* Panel header */}
                  <div className="bg-[#C8F135] px-5 py-3 flex items-center gap-2">
                    <FileText size={12} className="text-[#0D0D0D]" />
                    <span className="font-mono text-[10px] text-[#0D0D0D] font-bold uppercase tracking-widest">Live Quote</span>
                    {hasSelections && (
                      <span className="ml-auto font-mono text-[9px] text-[#0D0D0D]/60 uppercase tracking-widest">{service.name}</span>
                    )}
                  </div>

                  <div className="p-5">
                    {/* Empty state */}
                    {!hasSelections && (
                      <div className="py-10 text-center">
                        <div className="w-10 h-10 border border-[#1a1a1a] rounded-sm flex items-center justify-center mx-auto mb-3">
                          {(() => { const Icon = iconOf(service.icon); return <Icon size={16} className="text-[#333]" />; })()}
                        </div>
                        <p className="text-xs text-[#444] leading-relaxed">
                          Select options on the left<br />to build your quote.
                        </p>
                      </div>
                    )}

                    {/* Line items */}
                    {hasSelections && (
                      <div className="flex flex-col gap-2.5 mb-5 max-h-56 overflow-y-auto pr-1">
                        {quote.lineItems.map((li, i) => (
                          <div key={i} className="flex items-start justify-between gap-2">
                            <p className="text-xs text-[#888] leading-snug flex-1">{li.label}</p>
                            <p className="text-xs text-[#bbb] font-medium shrink-0 tabular-nums">
                              ₹{li.price.toLocaleString("en-IN")}{service.unit === "month" ? "/mo" : ""}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Totals */}
                    {hasSelections && (
                      <div className="border-t border-[#1a1a1a] pt-4 flex flex-col gap-2 mb-5">
                        {quote.discountPct > 0 && (
                          <>
                            <div className="flex justify-between text-xs">
                              <span className="text-[#555]">Subtotal</span>
                              <span className="text-[#777] tabular-nums">₹{quote.subtotal.toLocaleString("en-IN")}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-green-400">Discount ({quote.discountPct}%)</span>
                              <span className="text-green-400 tabular-nums">− ₹{quote.discountAmount.toLocaleString("en-IN")}</span>
                            </div>
                          </>
                        )}
                        <div className="flex justify-between items-end pt-1">
                          <span className="text-sm text-[#F5F4F0] font-semibold">Total estimate</span>
                          <div className="text-right">
                            <span className="text-2xl font-bold text-[#C8F135] tabular-nums">
                              ₹{quote.total.toLocaleString("en-IN")}
                            </span>
                            {service.unit === "month" && (
                              <span className="text-sm text-[#666]">/mo</span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Client name input */}
                    <div className="mb-3">
                      <label className="font-mono text-[9px] text-[#aaa] uppercase tracking-widest block mb-1.5">
                        Your name (appears on the PDF)
                      </label>
                      <input
                        type="text"
                        value={clientName}
                        onChange={e => setClientName(e.target.value)}
                        placeholder="e.g. Rahul Sharma"
                        className="w-full bg-[#0a0a0a] border border-[#1e1e1e] rounded-sm px-3 py-2.5 text-sm text-[#F5F4F0] placeholder:text-[#333] focus:outline-none focus:border-[#C8F135]/50 transition-colors"
                      />
                    </div>

                    {/* Contact (optional) — sends the quote to the studio */}
                    <div className="mb-3">
                      <label className="font-mono text-[9px] text-[#aaa] uppercase tracking-widest block mb-1.5">
                        Phone or email (optional — we&apos;ll follow up)
                      </label>
                      <input
                        type="text"
                        value={clientContact}
                        onChange={e => setClientContact(e.target.value)}
                        placeholder="e.g. 98450 12345 or you@company.com"
                        className="w-full bg-[#0a0a0a] border border-[#1e1e1e] rounded-sm px-3 py-2.5 text-sm text-[#F5F4F0] placeholder:text-[#333] focus:outline-none focus:border-[#C8F135]/50 transition-colors"
                      />
                    </div>

                    {/* Download button */}
                    <button
                      onClick={() => {
                        if (!hasSelections) return;
                        downloadQuotePDF(clientName, service, quote, selections);
                        const contact = clientContact.trim();
                        if (contact) {
                          const isEmail = contact.includes("@");
                          void submitLead({
                            kind: "project",
                            name: clientName.trim() || "Pricing page visitor",
                            email: isEmail ? contact : undefined,
                            phone: isEmail ? undefined : contact,
                            services: service.id === "bundle" ? [] : [service.id],
                            budget: `₹${quote.total.toLocaleString("en-IN")}${service.unit === "month" ? "/month" : ""} (website estimate)`,
                            message: [`Downloaded a quote for ${service.name}:`, ...quote.lineItems.map(l => `• ${l.label} — ₹${l.price.toLocaleString("en-IN")}`), quote.discountAmount ? `Discount ${quote.discountPct}%: −₹${quote.discountAmount.toLocaleString("en-IN")}` : ""].filter(Boolean).join("\n"),
                          });
                        }
                      }}
                      disabled={!hasSelections}
                      className="w-full bg-[#C8F135] text-[#0D0D0D] py-3 text-sm font-bold rounded-sm hover:bg-[#b8e020] active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <Download size={13} />
                      Download Quote as PDF
                    </button>

                    {hasSelections && (
                      <p className="text-[10px] text-[#aaa] text-center mt-2.5 leading-relaxed">
                        Estimate only. Final price confirmed after a discovery call.
                      </p>
                    )}

                    {/* Talk to us */}
                    <div className="mt-5 pt-4 border-t border-[#1a1a1a] flex flex-col gap-2">
                      <p className="text-xs text-[#aaa]">Want to talk through your quote?</p>
                      <Link to="/connect"
                        className="w-full border border-[#1e1e1e] text-[#888] hover:text-[#F5F4F0] hover:border-[#333] py-2.5 text-xs font-medium rounded-sm transition-colors flex items-center justify-center gap-1.5">
                        Book a free 20-min call <ArrowRight size={11} />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="bg-background border-t border-border">
          <div className="max-w-6xl mx-auto px-6 py-20">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-20">
              <div className="lg:col-span-2">
                <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest mb-4 block">FAQ</span>
                <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-4">Questions<br />we get a lot.</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Not finding your answer?{" "}
                  <Link to="/connect" className="text-foreground underline underline-offset-2 hover:text-muted-foreground transition-colors">
                    Just ask us directly.
                  </Link>
                </p>
              </div>
              <div className="lg:col-span-3 flex flex-col divide-y divide-border">
                {faqs.map((faq, i) => (
                  <div key={i} className="py-5">
                    <button className="w-full flex items-start justify-between gap-4 text-left group"
                      onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                      <span className={`text-sm font-medium transition-colors ${openFaq === i ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"}`}>
                        {faq.q}
                      </span>
                      <span className={`shrink-0 w-5 h-5 border border-border rounded-full flex items-center justify-center transition-all duration-200 ${
                        openFaq === i ? "bg-[#0D0D0D] border-[#0D0D0D] rotate-45" : ""
                      }`}>
                        <span className={`text-sm leading-none font-light ${openFaq === i ? "text-[#F5F4F0]" : "text-muted-foreground"}`}>+</span>
                      </span>
                    </button>
                    {openFaq === i && (
                      <p className="text-sm text-muted-foreground leading-relaxed mt-3 pr-8">{faq.a}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

      </div>
    </>
  );
}
