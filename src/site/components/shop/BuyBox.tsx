"use client";

import { useState } from "react";
import { Loader2, Lock } from "lucide-react";
import type { PublicProduct } from "@/lib/shop/types";
import { inr } from "@/lib/shop/logic";
import { PriceTag } from "./ShopBits";

declare global {
  interface Window {
    Razorpay?: new (opts: Record<string, unknown>) => { open: () => void; on: (ev: string, cb: (r: { error?: { description?: string } }) => void) => void };
  }
}

const CHECKOUT_JS = "https://checkout.razorpay.com/v1/checkout.js";

function loadCheckout(): Promise<boolean> {
  if (window.Razorpay) return Promise.resolve(true);
  return new Promise((resolve) => {
    const s = document.createElement("script");
    s.src = CHECKOUT_JS;
    s.async = true;
    s.onload = () => resolve(!!window.Razorpay);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

async function post<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || "Something went wrong. Try again.");
  return json as T;
}

interface Start {
  mode: "live" | "test" | "mock";
  orderId: string;
  amount: number;
  title: string;
  discount: number;
  key: string;
  business: string;
}

const field = "w-full rounded-2xl border border-border bg-background px-4 py-3 text-base outline-none transition-colors focus:border-foreground";

export function BuyBox({ product, paymentsOn, whatsapp }: { product: PublicProduct; paymentsOn: boolean; whatsapp: string }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", coupon: "" });
  const [showCoupon, setShowCoupon] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const askLink = `https://wa.me/${whatsapp}?text=${encodeURIComponent(`Hi! I'd like to buy "${product.title}" from the FrameMind Store.`)}`;

  if (!product.buyable) {
    return (
      <div className="rounded-[26px] border border-border bg-card p-5 sm:p-6">
        <PriceTag product={product} large />
        <p className="mt-3 text-sm text-muted-foreground">Coming soon. Message us and we&apos;ll tell you the day it launches.</p>
        <a href={askLink} target="_blank" rel="noreferrer" className="mt-4 inline-flex w-full items-center justify-center rounded-full border border-foreground px-5 py-3.5 text-sm font-semibold hover:bg-foreground hover:text-background">
          Notify me on WhatsApp
        </a>
      </div>
    );
  }

  async function buy(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const start = await post<Start>("/api/shop/checkout", { productId: product.id, ...form });
      if (start.mode === "mock") {
        // local development: no Razorpay, the payment is treated as done
        const done = await post<{ url: string }>("/api/shop/verify", { razorpay_order_id: start.orderId, mock: true });
        window.location.href = done.url;
        return;
      }
      if (!(await loadCheckout()) || !window.Razorpay) throw new Error("The payment window could not load. Check your connection and try again.");
      const rzp = new window.Razorpay({
        key: start.key,
        order_id: start.orderId,
        amount: start.amount * 100,
        currency: "INR",
        name: start.business,
        description: start.title,
        prefill: { name: form.name, email: form.email, contact: form.phone },
        notes: { product: product.id },
        theme: { color: "#171716" },
        handler: async (r: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          setBusy(true);
          try {
            const done = await post<{ url: string }>("/api/shop/verify", r);
            window.location.href = done.url;
          } catch (err) {
            setError(`${err instanceof Error ? err.message : "We could not confirm the payment."} Your order number is ${r.razorpay_order_id}.`);
            setBusy(false);
          }
        },
        modal: { ondismiss: () => setBusy(false) },
      });
      rzp.on("payment.failed", (r) => {
        setError(r.error?.description || "The payment did not go through. No money was taken; try again.");
        setBusy(false);
      });
      rzp.open();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setBusy(false);
    }
  }

  if (!paymentsOn) {
    return (
      <div className="rounded-[26px] border border-border bg-card p-5 sm:p-6">
        <PriceTag product={product} large />
        <p className="mt-3 text-sm text-muted-foreground">Online checkout opens shortly. Until then, buy it on WhatsApp and we&apos;ll send a UPI link.</p>
        <a href={askLink} target="_blank" rel="noreferrer" className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-[#C8F135] px-5 py-3.5 text-sm font-semibold text-[#171716] hover:bg-[#b8e020]">
          Buy on WhatsApp
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={buy} className="rounded-[26px] border border-border bg-card p-5 sm:p-6">
      <PriceTag product={product} large />
      <div className="mt-5 space-y-3">
        <input className={field} placeholder="Your name" autoComplete="name" required value={form.name} onChange={set("name")} aria-label="Your name" />
        <input className={field} type="email" placeholder="Email (for your download link)" autoComplete="email" required value={form.email} onChange={set("email")} aria-label="Email" />
        <input className={field} type="tel" inputMode="tel" placeholder="Phone (optional)" autoComplete="tel" value={form.phone} onChange={set("phone")} aria-label="Phone" />
        {showCoupon ? (
          <input className={`${field} uppercase`} placeholder="Coupon code" value={form.coupon} onChange={set("coupon")} aria-label="Coupon code" />
        ) : (
          <button type="button" onClick={() => setShowCoupon(true)} className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground">
            Have a coupon code?
          </button>
        )}
      </div>
      {error && <p className="mt-3 text-sm text-[#ff8a7a]" role="alert">{error}</p>}
      <button type="submit" disabled={busy} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#C8F135] px-5 py-4 text-base font-semibold text-[#171716] transition-colors hover:bg-[#b8e020] disabled:opacity-60">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
        {busy ? "Opening payment…" : `Pay ${inr(product.price)} & download`}
      </button>
      <p className="mt-3 text-center text-xs text-muted-foreground">UPI · GPay · PhonePe · Cards · Netbanking, secured by Razorpay</p>
    </form>
  );
}
