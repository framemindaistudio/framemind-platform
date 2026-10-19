"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Eye, EyeOff, KeyRound, ShieldCheck } from "lucide-react";
import { Field, Input } from "@/components/ui/form";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/hq/ui";

/**
 * My account: who you are signed in as, what you can open, and changing your own password. With `first`, the login
 * has a one-time password from a founder and must choose its own before anything else in HQ opens.
 */
export function MyAccount({ name, username, roleLabel, modules, guides, first, builtIn }: { name: string; username: string; roleLabel: string; modules: string[]; guides: { label: string; href: string }[]; first: boolean; builtIn: boolean }) {
  const router = useRouter();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [again, setAgain] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const mismatch = again.length > 0 && again !== next;
  const tips = [
    { ok: next.length >= 10, text: "10 characters or more" },
    { ok: /[a-z]/i.test(next) && /[0-9]/.test(next), text: "letters and at least one number" },
    { ok: next.length > 0 && !next.toLowerCase().includes(username), text: "not your username" },
  ];

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (next !== again) return setError("The two new passwords are not the same.");
    setBusy(true);
    try {
      const res = await fetch("/api/hq/account/password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ current, next }) });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || "Could not change the password.");
      setDone(true);
      setCurrent("");
      setNext("");
      setAgain("");
      // a full page load, so HQ opens with the new session rather than the one-time one
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      if (first) window.location.assign("/hq");
      else router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not change the password.");
    } finally {
      setBusy(false);
    }
  }

  const type = show ? "text" : "password";

  return (
    <div className="mx-auto max-w-[860px]">
      <PageHeader eyebrow="Your login" icon="Users" title="My account" description="Who you are signed in as, and your password." />

      {first && (
        <div role="status" className="mb-6 rounded-[var(--radius-md)] border border-warn/40 bg-warn/10 px-5 py-4 text-sm text-graphite">
          <p className="font-semibold">Welcome to FrameMind HQ, {name.split(" ")[0]}.</p>
          <p className="mt-1 text-charcoal">You signed in with a one-time password from a founder. Choose your own password below; HQ opens as soon as it is saved.</p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_1.15fr]">
        <section aria-labelledby="who" className="rounded-[var(--radius-md)] border border-graphite/12 bg-paper-50 p-5">
          <h2 id="who" className="annot text-[10px] text-blueprint">
            Signed in as
          </h2>
          <p className="mt-2 text-lg font-bold text-graphite">{name}</p>
          <dl className="mt-3 grid grid-cols-[110px_1fr] gap-y-2 text-sm">
            <dt className="text-charcoal">Username</dt>
            <dd className="font-mono text-xs leading-5 text-graphite">{username}</dd>
            <dt className="text-charcoal">Role</dt>
            <dd className="text-graphite">{roleLabel}</dd>
          </dl>
          <h3 className="annot mt-5 text-[10px] text-blueprint">What you can open</h3>
          <p className="mt-1.5 text-xs leading-relaxed text-charcoal">{modules.join(" · ")}</p>
          {guides.length > 0 && (
            <>
              <h3 className="annot mt-5 text-[10px] text-blueprint">How to use HQ</h3>
              <ul className="mt-1.5 space-y-1">
                {guides.map((g) => (
                  <li key={g.href}>
                    <a href={g.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm font-semibold text-graphite underline underline-offset-2">
                      <BookOpen className="size-4" aria-hidden /> {g.label} (PDF)
                    </a>
                  </li>
                ))}
              </ul>
            </>
          )}
          <p className="mt-4 text-xs text-blueprint">Need more access, or a different name? Ask a founder: they manage logins in Settings → Logins.</p>
        </section>

        <section aria-labelledby="pw" className="rounded-[var(--radius-md)] border border-graphite/12 bg-paper-50 p-5">
          <h2 id="pw" className="flex items-center gap-2 text-base font-bold text-graphite">
            <KeyRound className="size-4" aria-hidden /> {first ? "Choose your password" : "Change your password"}
          </h2>
          {done && !first ? (
            <p role="status" className="mt-4 flex items-start gap-2 rounded-[var(--radius-sm)] bg-ok/10 px-3 py-3 text-sm text-ok">
              <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden /> Password changed. This browser stays signed in; any other browser using the old password has been signed out.
            </p>
          ) : (
            <form onSubmit={submit} className="mt-4 space-y-4" noValidate>
              <Field label={first ? "One-time password from the founder" : "Current password"} htmlFor="pw-current" required>
                <Input id="pw-current" type={type} value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" required />
              </Field>
              <Field label="New password" htmlFor="pw-next" required>
                <Input id="pw-next" type={type} value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" required minLength={10} />
              </Field>
              <ul className="-mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[11px]">
                {tips.map((t) => (
                  <li key={t.text} className={t.ok ? "text-ok" : "text-blueprint"}>
                    {t.ok ? "✓" : "○"} {t.text}
                  </li>
                ))}
              </ul>
              <Field label="New password again" htmlFor="pw-again" required error={mismatch ? "Not the same as the new password" : undefined}>
                <Input id="pw-again" type={type} value={again} onChange={(e) => setAgain(e.target.value)} autoComplete="new-password" required aria-invalid={mismatch || undefined} />
              </Field>
              <button type="button" onClick={() => setShow((v) => !v)} className="flex items-center gap-1.5 text-xs font-semibold text-charcoal hover:text-graphite">
                {show ? <EyeOff className="size-3.5" aria-hidden /> : <Eye className="size-3.5" aria-hidden />} {show ? "Hide passwords" : "Show passwords"}
              </button>
              {error && (
                <p role="alert" className="rounded border border-bad/30 bg-bad/10 px-3 py-2 text-sm text-bad">
                  {error}
                </p>
              )}
              <Button type="submit" disabled={busy || !current || !next || mismatch}>
                {busy ? "Saving…" : first ? "Save and open HQ" : "Change password"}
              </Button>
              <p className="text-xs text-blueprint">
                Keep it to yourself: never share it in a group chat.{builtIn ? " Your login is a built-in one; a founder can return it to its original password if you forget this one." : " Forgot it later? A founder can give you a new one-time password."}
              </p>
            </form>
          )}
        </section>
      </div>
    </div>
  );
}
