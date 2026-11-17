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
    return <p className="mt-8 border border-border bg-card p-4">If <b>{email}</b> has bought from us, the links are on their way. Check spam too. Nothing after 10 minutes? WhatsApp us.</p>;
  }
  return (
    <form onSubmit={submit} className="mt-8 flex flex-col gap-3 sm:flex-row">
      <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" aria-label="Email" className="flex-1 rounded-sm border border-border bg-card px-3 py-2.5 outline-none focus:border-foreground" />
      <button type="submit" disabled={state === "busy"} className="rounded-sm bg-[#C8F135] px-5 py-2.5 font-semibold text-[#0D0D0D] hover:bg-[#b8e020] disabled:opacity-60">
        {state === "busy" ? "Sending…" : "Email my links"}
      </button>
      {error && <p className="text-sm text-red-700 sm:basis-full">{error}</p>}
    </form>
  );
}
