import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/hq/auth";
import { can, LEADERSHIP, roleLabels } from "@/lib/hq/roles";
import { EmptyState, PageHeader } from "@/components/hq/ui";
import { buttonClass } from "@/components/ui/Button";
import { SettingsPage } from "@/components/hq/settings/SettingsPage";

export const metadata: Metadata = { title: "Settings" };

/** Founder / admin only. Everyone else gets a polite explanation instead of a redirect loop. */
export default async function Page() {
  const user = await requireUser();

  if (!can(user, LEADERSHIP)) {
    return (
      <div className="mx-auto max-w-[900px]">
        <PageHeader eyebrow="System" icon="Settings" title="Settings" />
        <EmptyState
          icon="Settings"
          title="Settings are for founders and admins"
          description={`You are signed in as ${user.name} (${roleLabels[user.role]}). Company details, document numbering and team logins can only be changed by a founder or admin. Ask one of them if something needs updating.`}
          action={
            <Link href="/hq" className={buttonClass("secondary", "sm")}>
              Back to Command Center
            </Link>
          }
        />
      </div>
    );
  }

  return <SettingsPage isFounder={user.role === "founder"} />;
}
