"use client";

import { useState } from "react";

export function ResendForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "sent">("idle");
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setState("busy");
    const res = await fetch("/api/shop/resend", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(json.error || "Something went wrong. Try again.");
      setState("idle");
      return;
    }
    setState("sent");
  }

  if (state === "sent") {
    return <p className="mt-6 rounded-2xl bg-[#171716] p-5 text-[15px] leading-relaxed text-[#d6d4cd]">If <b>{email}</b> has bought from us, the links are on their way. Check spam too. Nothing after 10 minutes? WhatsApp us.</p>;
  }
  return (
    <form onSubmit={submit} className="mt-6 flex flex-col gap-3 sm:flex-row">
      <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" aria-label="Email" className="flex-1 rounded-full border border-[#1b1b19]/15 bg-[var(--fm-stone)] px-5 py-3.5 text-[15px] outline-none transition-colors focus:border-[#1b1b19]/50" />
      <button type="submit" disabled={state === "busy"} className="rounded-full bg-[#171716] px-6 py-3.5 text-[15px] font-medium text-[#eceae4] transition-transform active:scale-[0.98] disabled:opacity-60">
        {state === "busy" ? "Sending…" : "Email my links"}
      </button>
      {error && <p className="text-sm text-[#b13a3a] sm:basis-full">{error}</p>}
    </form>
  );
}
