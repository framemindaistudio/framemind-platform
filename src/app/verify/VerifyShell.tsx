import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { site } from "@/lib/site";

/** The frame of the public certificate pages: the logo, the content, and how to reach the studio. */
export function VerifyShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-dvh bg-paper px-4 py-10 text-graphite">
      <div className="mx-auto max-w-lg">
        <Link href="/verify" className="inline-block w-44" aria-label="Certificate verification">
          <Logo tone="ink" />
        </Link>
        <div className="mt-8">{children}</div>
        <p className="mt-10 border-t border-graphite/15 pt-4 text-xs leading-relaxed text-blueprint">
          Certificates are issued by {site.legalName}, {site.location}. Questions: <a href={`mailto:${site.contact.email}`} className="font-semibold text-graphite underline underline-offset-2">{site.contact.email}</a>
        </p>
      </div>
    </main>
  );
}

export function VerifyForm({ code = "" }: { code?: string }) {
  return (
    <form action="/verify" method="get" className="flex gap-2">
      <label htmlFor="verify-code" className="sr-only">
        Certificate ID
      </label>
      <input
        id="verify-code"
        name="code"
        defaultValue={code}
        placeholder="FM-26-XXXXX"
        autoComplete="off"
        spellCheck={false}
        className="h-11 min-w-0 flex-1 rounded-[var(--radius-sm)] border border-graphite/25 bg-white px-3 font-mono text-sm uppercase tracking-wider outline-none focus:border-ink"
      />
      <button type="submit" className="h-11 rounded-[var(--radius-sm)] bg-ink px-4 text-sm font-semibold text-paper hover:bg-graphite">
        Verify
      </button>
    </form>
  );
}
