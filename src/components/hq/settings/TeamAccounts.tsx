"use client";

import { useMemo } from "react";
import { hqNav } from "@/lib/hq/nav";
import { ALL, EDITORS, roleLabels } from "@/lib/hq/roles";
import { LoginsPanel } from "./LoginsPanel";
import { CodeBlock, SettingsSection, StatusPill, Subhead } from "./shared";
import type { SystemInfo } from "./useSystemInfo";

/**
 * Settings → Logins. Founders give, reset, pause and remove the team's logins here (LoginsPanel). An admin sees the
 * built-in logins and what each role can open, but cannot manage logins.
 */
export function TeamAccounts({ sys, isFounder }: { sys: SystemInfo; isFounder: boolean }) {
  const roleModules = useMemo(() => {
    const items = hqNav.flatMap((g) => g.items);
    return ALL.map((r) => ({ role: r, labels: items.filter((i) => i.roles.includes(r)).map((i) => i.label) }));
  }, []);

  return (
    <SettingsSection id="team" index="07" title="Logins" description="One login per person, each with a role. Founders give and manage them; everyone changes their own password in My account.">
      {isFounder ? (
        <LoginsPanel />
      ) : (
        <>
          <p className="mb-4 rounded-[var(--radius-sm)] border border-dashed border-graphite/25 bg-paper px-4 py-3 text-sm text-charcoal">Only founders can give, reset or remove logins. Ask a founder if someone needs one.</p>
          <Subhead>Built-in logins</Subhead>
          {sys.status === "ready" && (
            <ul className="grid gap-2 sm:grid-cols-2">
              {sys.users.map((u) => (
                <li key={u.username} className="rounded-[var(--radius-sm)] border border-graphite/12 bg-paper px-4 py-3 text-sm">
                  {u.name} <span className="font-mono text-xs text-blueprint">· {u.username}</span> · {roleLabels[u.role]}
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {/* roles */}
      <div className="mt-8 border-t border-dashed border-graphite/15 pt-6">
        <Subhead>What each role can open</Subhead>
        <dl className="grid gap-3 md:grid-cols-2">
          {roleModules.map(({ role: r, labels }) => (
            <div key={r} className="rounded-[var(--radius-sm)] border border-graphite/12 bg-paper px-4 py-3">
              <dt className="text-sm font-semibold text-graphite">{roleLabels[r]}</dt>
              <dd className="mt-1 text-xs leading-relaxed text-charcoal">{EDITORS.includes(r) ? `Every module (${labels.length}), including Settings, Finance and Team — and the only roles that can add or change anything.${r === "admin" ? " Logins are for founders only." : ""}` : `View and print only: ${labels.join(", ")}.`}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-3 text-xs text-blueprint">Access is also enforced on the server for each record type, so a hidden menu item is never the only protection.</p>
      </div>

      {/* the founders' own logins: outside HQ on purpose */}
      <details className="mt-8 border-t border-dashed border-graphite/15 pt-6">
        <summary className="cursor-pointer text-sm font-semibold text-graphite">Founder logins (built-in, in the server settings)</summary>
        <p className="mt-3 max-w-[70ch] text-sm text-charcoal">
          The founders&apos; logins are kept in the HQ_USERS server setting, not in HQ, so a mistake in HQ can never lock the founders out. To add or remove one, run this in the project folder and follow what it prints (it updates the setting for Vercel):
        </p>
        <CodeBlock className="mt-3" code={'node scripts/hq-user.mjs add username "Full Name" --role founder'} />
        {sys.status === "ready" && sys.users.some((u) => !u.passwordHashed) && (
          <p className="mt-2 text-xs text-warn">
            <StatusPill tone="warn">Plain text</StatusPill> At least one built-in password is stored as plain text. Give that login a new password with scripts/hq-user.mjs.
          </p>
        )}
      </details>
    </SettingsSection>
  );
}
