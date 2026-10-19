"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, LogIn } from "lucide-react";

export function LoginForm({ next }: { next: string }) {
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/hq/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: fd.get("username"), password: fd.get("password") }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Sign in failed");
      router.replace(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed");
      setBusy(false);
    }
  }

  const field =
    "h-11 w-full rounded-[var(--radius-sm)] border border-paper/20 bg-paper/[0.06] px-3 text-sm text-paper placeholder:text-paper/35 outline-none transition-colors focus:border-paper/70 focus:bg-paper/10";

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-4">
      <div>
        <label htmlFor="username" className="annot mb-1.5 block text-paper/55">
          Username
        </label>
        <input id="username" name="username" autoComplete="username" required autoFocus className={field} placeholder="e.g. chinmay" />
      </div>
      <div>
        <label htmlFor="password" className="annot mb-1.5 block text-paper/55">
          Password
        </label>
        <div className="relative">
          <input id="password" name="password" type={show ? "text" : "password"} autoComplete="current-password" required className={`${field} pr-10`} />
          <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1.5 text-paper/50 hover:text-paper" aria-label={show ? "Hide password" : "Show password"}>
            {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </div>
      {error && <p className="rounded border border-bad/40 bg-bad/20 px-3 py-2 text-sm text-paper">{error}</p>}
      <button
        type="submit"
        disabled={busy}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-[var(--radius-sm)] bg-lime text-sm font-semibold text-graphite transition-all hover:bg-lime-dark disabled:opacity-60"
      >
        {busy ? <Loader2 className="size-4 animate-spin" /> : <LogIn className="size-4" />}
        Enter HQ
      </button>
    </form>
  );
}
